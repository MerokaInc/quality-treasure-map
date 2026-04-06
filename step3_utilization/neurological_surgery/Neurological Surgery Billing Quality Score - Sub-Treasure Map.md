# Neurological Surgery Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other docs ask about clinical practice: does this neurosurgeon operate, follow guidelines, maintain volume? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** — is their pricing in line with peers?
2. **Procedure-to-procedure ratios** — do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (anomalies)?
3. **E/M level distribution** — are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against state-level cohorts by default.


---

# PART A: WHAT WE HAVE

---

**CMS Medicare Physician & Other Practitioners (By Provider and Service)** — for charge-to-allowed analysis

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged |
| average_medicare_allowed_amt | What Medicare allows |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Neurological Surgery |

**CMS Medicaid Provider Spending** — for procedure ratio analysis (combined with Medicare)

The charge-to-allowed analysis is Medicare-only. The procedure ratio analysis uses both files combined.

**Neurosurgery advantage for charge analysis:** Unlike pediatrics (thin Medicare volume), neurosurgeons have substantial Medicare volume including high-value surgical procedures. Charge-to-allowed analysis is robust and covers both office visits and surgical procedures.


---

# PART B: THE LOGIC — CHARGE-TO-ALLOWED

---


## 1. The Metric

```
For a given NPI:
    total_charges = SUM(average_submitted_chrg_amt * number_of_services)
    total_allowed = SUM(average_medicare_allowed_amt * number_of_services)
    charge_to_allowed_ratio = total_charges / total_allowed
```

| Ratio | Interpretation |
|---|---|
| ~1.0x | Charges close to Medicare allowed. Unusual for a surgical specialty. |
| 2.0x - 5.0x | Typical range for neurosurgery. Surgical specialties charge higher than primary care. |
| 5.0x - 8.0x | High charges. May reflect complex procedures, high-cost market, or aggressive pricing. |
| >8.0x | Outlier. Worth investigating. |

> **ASSUMPTION:** Neurosurgery has **higher expected charge-to-allowed ratios** than most specialties because of high-value surgical procedures (craniotomy, spinal fusion). The peer distribution will be shifted right compared to primary care or even ophthalmology. Actual anchors must be computed from CMS data.


## 2. Peer Distribution

### Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All neurosurgical NPIs in same state with >= 10 Medicare services | Primary scoring. |
| **National** | All states combined | Fallback when state cohort < 30. |

### Peer Anchors

```
peer_cohort = all neurosurgical NPIs in the same state
    WHERE taxonomy_code = '207T00000X'
    AND total_medicare_services >= 10

For each NPI: compute charge_to_allowed_ratio

peer_p10, peer_p25, peer_median, peer_p75, peer_p90
```

**Illustrative national neurosurgery anchors (to be computed):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~2.00x |
| p25 | ~2.80x |
| Median | ~3.80x |
| p75 | ~5.20x |
| p90 | ~7.00x |

> **EXTERNAL RESOURCE NEEDED:** Actual CMS Medicare data filtered for 207T00000X to compute real anchors. These illustrative values may differ significantly.


## 3. Scoring Bands

```
IF peer_p25 <= provider_ratio <= peer_p75:
    charge_score = 100

ELIF peer_p10 <= provider_ratio <= peer_p90:
    charge_score = 70

ELSE:
    charge_score = 40
```


## 4. Per-Code Analysis (Optional Detail)

```
For each HCPCS code billed by this NPI:
    provider_code_ratio = avg_chrg / avg_alowd
    peer_code_median = MEDIAN across peers billing this code
    code_deviation = provider_code_ratio / peer_code_median

    IF code_deviation > 2.0 OR code_deviation < 0.5:
        code_flag = "outlier"
```

This identifies whether outlier status is driven by one procedure (e.g., inflated craniotomy pricing) or across the board.


---

# PART C: PROCEDURE RATIO ANALYSIS (Green Flags and Red Flags)

---


## 5. E/M Level Distribution (Upcoding Check)

```
em_codes = {
    99212: 'straightforward',
    99213: 'low-moderate',
    99214: 'moderate',
    99215: 'high'
}

For this NPI:
    em_total = SUM(total_services) WHERE hcpcs_code IN [99212-99215]
    For each level: provider_pct = services / em_total
```

**What normal looks like in neurosurgery:**

| Code | Level | Typical Distribution |
|---|---|---|
| 99212 | Straightforward | ~2-5% |
| 99213 | Low-moderate | ~25-35% |
| 99214 | Moderate | ~40-50% (dominant code) |
| 99215 | High | ~15-25% |

> **ASSUMPTION:** Neurosurgeons legitimately bill higher E/M complexity than primary care. 99214 should dominate. 99215 at 15-25% is expected (complex surgical patients with neurological deficits, post-operative management, multi-comorbidity). Do NOT apply primary care norms (where 99215 >10% is a flag).

**Red flag:** 99215 exceeds 35% of E/M volume. Even for neurosurgery, this is unusually high.

**Red flag:** 99212 + 99213 combined is below 15% of E/M. Provider almost never bills lower-complexity visits, which is unusual even for a surgical practice.

**Green flag:** Distribution closely matches peer median (all levels within 10 percentage points).


## 6. Green Flag Ratios (Good Practice Signals)


### 6A. Instrumentation-to-Fusion Ratio

Does the neurosurgeon instrument most of their fusions?

```
instrumentation_fusion_ratio = (services_22842 + services_22840) / fusion_services
    -- expected: 0.8-1.0 (modern fusion almost always includes instrumentation)
```

**Green flag:** Ratio >= 0.7. Provider instruments most fusions (modern standard of care).

**Signal:** Ratio < 0.3. Provider fuses without instrumenting frequently. Could indicate older technique or specific clinical scenarios (e.g., non-instrumented posterolateral fusion).


### 6B. Image Guidance to Complex Surgery Ratio

Does the neurosurgeon use navigation for complex cases?

```
nav_complex_ratio = (services_61781 + services_61782) / (tumor_services + complex_fusion_services)
```

**Green flag:** Ratio >= 0.3. Provider uses image guidance for a meaningful proportion of complex cases.

**Neutral:** Between 0.1 and 0.3. Selective use.

**Signal:** Ratio < 0.05 with high complex surgery volume. Provider rarely navigates.


### 6C. Decompression Breadth

Does the neurosurgeon perform decompressions at multiple levels?

```
multilevel_ratio = services_63048 / services_63047
    -- 63048 is the add-on code for each additional segment
    -- ratio of 0.5-1.5 means roughly half to all decompressions are multi-level
```

**Green flag:** Ratio between 0.3 and 1.5. Healthy distribution of single-level and multi-level decompressions.

**Signal:** Ratio > 3.0. Almost all decompressions are multi-level. Could indicate over-extension of surgical levels.


### 6D. Cervical-to-Lumbar Balance

Does the neurosurgeon operate on both cervical and lumbar spine?

```
cervical_pct = (services_22551 + services_22552) / total_fusion_services
```

**Green flag:** Cervical represents 20-50% of fusion volume. Balanced spine practice.

**Neutral:** <20% or >50%. More specialized but not a flag.


### 6E. New Patient Rate

Does the neurosurgeon accept new patients at a healthy rate?

```
new_patient_pct = (services_99204 + services_99205 + services_99203) / total_em_services
```

**Green flag:** Between peer p25 and p75. Healthy new patient intake.

**Signal (low):** Below peer p10. Possible closed panel.


### 6F. Surgical-to-Office Ratio

What proportion of the neurosurgeon's practice is surgical vs. office-based?

```
surgical_ratio = total_surgical_services / (total_surgical_services + total_em_services)
```

**Green flag:** Between 0.15 and 0.50. Normal for an active surgical neurosurgeon (substantial surgical volume with appropriate office follow-up).

**Signal (low):** Below 0.10. Very few surgeries. Provider may be primarily consultative.

**Signal (high):** Above 0.60. Very little office work. Provider may not be doing adequate follow-up.


### 6G. Bone Graft with Fusion

Does the neurosurgeon use bone graft material appropriately with fusions?

```
graft_fusion_ratio = (services_20936 + services_20930) / fusion_services
```

**Green flag:** Ratio >= 0.5. Provider uses graft material with most fusions (expected).

**Signal:** Ratio < 0.2 with high fusion volume. Graft codes may be billed by facility.


## 7. Red Flag Ratios (Warning Signals)


### 7A. Fusion Rate Among All Spine Procedures

What proportion of spine procedures include fusion?

```
fusion_rate = fusion_services / total_spine_surgical_services
```

**Red flag:** Fusion rate above peer p90. Provider fuses at a much higher rate than peers. May indicate over-fusion.

**Neutral:** Between p25 and p75.

Note: Case mix heavily influences this. A provider treating primarily spondylolisthesis will have higher fusion rates than one treating primarily stenosis.


### 7B. Multi-Level Fusion Dominance

What proportion of the neurosurgeon's fusions are multi-level (additional segment codes)?

```
multilevel_fusion_pct = (services_22552 + services_22614 + services_22634) /
                        (services_22551 + services_22612 + services_22633 +
                         services_22552 + services_22614 + services_22634)
```

**Red flag:** Multi-level fusion percentage above peer p90. Provider does multi-level fusions at a much higher rate than peers. Multi-level fusion is clinically appropriate in some cases but is also associated with higher complication rates and is scrutinized for overuse.

**Neutral:** Between p25 and p75.


### 7C. High-Complexity E/M Trend (Multi-Year)

```
For each year:
    high_complexity_pct = (services_99214 + services_99215) / total_em_services

complexity_trend = high_complexity_pct_latest - high_complexity_pct_earliest
```

**Red flag:** Trend above peer p90. Billing complexity escalating faster than peers.


### 7D. Return Visit Intensity

```
visits_per_beneficiary = total_em_services / unique_beneficiaries
```

**Red flag:** Above peer p90. Patients seen significantly more often than peers' patients. Could indicate unnecessary follow-up or billing anomalies.


### 7E. Fusion Without Decompression

Provider bills fusion codes but very few decompression codes.

```
fusion_without_decomp = fusion_services > 20 AND decompression_services < 5
```

**Red flag:** Provider fuses without decompressing. In most lumbar spine surgery, decompression accompanies fusion. Fusion-only billing without decompression is unusual and may indicate a coding issue.

Note: ACDF (22551) does not always require a separate decompression code — the discectomy is inherent in the ACDF. This flag should only apply to lumbar fusion codes.


### 7F. Shunt Without Follow-Up

Provider creates VP shunts but has very low office visit volume for shunt patients.

```
shunt_no_followup = (services_62223 + services_62230) > 5 AND
    total_em_services < 50
```

**Red flag (mild):** Creating shunts without adequate follow-up visit volume. Shunt patients require long-term monitoring.


### 7G. Single-Code Dominance

```
For each HCPCS code: code_pct = services / total_services
max_code_pct = MAX(code_pct) excluding E/M codes

dominant_code = code with max_code_pct
```

**Red flag:** max_code_pct > 25% for a non-E/M surgical code. A single surgical procedure dominating more than 25% of total billing is unusual for a general neurosurgeon. Could indicate very narrow practice or repetitive procedure selection.

**Normal:** For most neurosurgeons, no single surgical code exceeds 10-15% of total volume.


## 8. Cross-Category Consistency Checks

| Check | Logic | Flag |
|---|---|---|
| Fusion but no instrumentation | fusion_services > 20 AND instrumentation_services < 5 | Yellow: modern fusion almost always includes instrumentation. May be facility billing artifact. |
| Instrumentation but no fusion | instrumentation_services > 10 AND fusion_services = 0 | Red: instrumentation without a corresponding fusion code is a coding error. |
| Craniotomy but no navigation | tumor_services > 5 AND nav_services = 0 | Yellow: navigation is recommended for tumor surgery but not universal. |
| Spine fusion but no bone graft | fusion_services > 20 AND graft_services < 5 | Yellow: fusion usually requires graft. May be facility billing artifact. |
| Navigation without surgery | nav_services > 10 AND total_surgical_services < 5 | Red: navigation is an add-on code for surgery. |
| Multi-level decompression without single-level | services_63048 > 10 AND services_63047 = 0 | Red: 63048 is an add-on to 63047. Cannot bill additional segments without the primary code. |
| Shunt revision but no shunt creation (historical) | services_62230 > services_62223 * 3 | Neutral: may be managing shunts placed by other surgeons. Common for hydrocephalus specialists. |
| High E/M but no surgical procedures at all | total_em > 200 AND total_surgical = 0 | Yellow: neurosurgeon billing only office visits. May be consultative-only or winding down practice. |
| ACDF without cervical add-on level code | services_22551 > 10 AND services_22552 = 0 | Neutral: many ACDFs are single-level. Not a flag. |


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | E/M level distribution | 5 | Upcoding check | Medicare + Medicaid |
| 2 | Instrumentation-to-fusion ratio | 6A | Green flag | Medicare + Medicaid |
| 3 | Image guidance to complex surgery | 6B | Green flag | Medicare + Medicaid |
| 4 | Decompression breadth | 6C | Green flag | Medicare + Medicaid |
| 5 | Cervical-to-lumbar balance | 6D | Green flag | Medicare + Medicaid |
| 6 | New patient rate | 6E | Green flag | Medicare + Medicaid |
| 7 | Surgical-to-office ratio | 6F | Green flag | Medicare + Medicaid |
| 8 | Bone graft with fusion | 6G | Green flag | Medicare + Medicaid |
| 9 | Fusion rate among spine procedures | 7A | Red flag | Medicare + Medicaid |
| 10 | Multi-level fusion dominance | 7B | Red flag | Medicare + Medicaid |
| 11 | E/M complexity trend | 7C | Red flag | Medicare + Medicaid |
| 12 | Return visit intensity | 7D | Red flag | Medicare |
| 13 | Fusion without decompression | 7E | Red flag | Medicare + Medicaid |
| 14 | Shunt without follow-up | 7F | Red flag | Medicare + Medicaid |
| 15 | Single-code dominance | 7G | Red flag | Medicare + Medicaid |
| 16-24 | Cross-category consistency (9 checks) | 8 | Yellow/Red | Medicare + Medicaid |

**Total: 24 ratio checks** (7 green flags, 8 red flags, 9 cross-category consistency checks).


## 10. Scoring the Ratio Analysis

```
ratio_checks = [all 24 checks, excluding those with insufficient data]

green_count = COUNT WHERE flag = "green"
neutral_count = COUNT WHERE flag = "neutral" or "yellow"
red_count = COUNT WHERE flag = "red"
total_checks = COUNT of all applicable checks

ratio_analysis_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0))
                       / total_checks * 100
```


---

# PART D: COMPOSITE BILLING QUALITY SCORE

---


## 11. Composite

```
billing_quality_composite = (charge_score * 0.35) + (ratio_analysis_score * 0.65)
```

If charge-to-allowed is not computable, use ratio_analysis_score alone.


## 12. Worked Example

**Provider A** in Massachusetts.

**Charge ratio:** Charges $2,400,000. Allowed $620,000. Ratio = **3.87x**.

**MA peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 2.00x | 2.80x | 3.80x | 5.20x | 7.00x |

Ratio 3.87x between p25 (2.80x) and p75 (5.20x). Charge score = **100**.

**Ratio analysis:** 18 of 24 checks applicable. 9 green, 7 neutral, 2 red. Score = ((9*1.0) + (7*0.5) + (2*0.0)) / 18 * 100 = **69.4**.

**Composite:** (100 * 0.35) + (69.4 * 0.65) = 35 + 45.1 = **80.1**.


---

# PART E: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this neurosurgeon follow CNS/AANS guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal neurosurgeon? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and ratios in line with peers? | Pricing + integrity |
| **Payer Diversity** | Is their practice consistent across payers? | Access proxy |

| Scenario | Guideline | Peer | Volume | Billing |
|---|---|---|---|---|
| Excellent neurosurgeon, normal billing | High | High | High | High |
| Excellent surgeon, aggressive pricing | High | High | High | Low (charge outlier) |
| High fusion rate neurosurgeon | Low (fusion-to-decomp ratio flagged) | May be high (bills all codes) | High (volume is real) | Low (fusion rate red flag) |
| Neurosurgeon who only does E/M | Low | Low | Neutral (50) | Medium (E/M distribution may be normal, but surgical ratio red-flagged) |


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed ratios for neurosurgery include high-value procedures.** Craniotomies and complex spine fusions have high allowed amounts and correspondingly high charges. The charge ratio will be influenced by case mix — a neurosurgeon doing primarily complex fusions will have a different charge profile than one doing mostly discectomies.

**E/M distribution expectations are higher than primary care.** 99214/99215 should dominate. The upcoding thresholds must be neurosurgery-specific.

**Fusion rates are heavily scrutinized nationally.** Over-fusion is a known issue in spine surgery. Our fusion rate flag will capture statistical outliers, but without diagnosis codes, we cannot distinguish appropriate fusion from overuse.

**Hospital billing artifacts affect instrumentation and graft ratios.** These are the same artifacts flagged in Volume Adequacy. Hospital-employed neurosurgeons may show inconsistent ratios not because of practice quality but because of billing arrangements.

**Multi-level surgery is clinically appropriate in many cases.** Multi-level fusion dominance is a flag, not an accusation. Some patients genuinely require 3-4 level fusions.

**Red flags are signals, not accusations.** Every flag has potential legitimate explanations. The score surfaces patterns for investigation.


---

## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| **Identity & Geography** | | |
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| provider_cbsa | string | Core-Based Statistical Area code |
| geo_group_level | string | "state", "national", or "zip3" |
| peer_cohort_state | string | State of peer cohort (or "US") |
| peer_cohort_size | int | Number of peers in cohort |
| **Charge-to-Allowed (Medicare)** | | |
| total_medicare_services | int | Total Medicare services |
| total_charges | float | SUM(avg_charge * services) |
| total_allowed | float | SUM(avg_allowed * services) |
| charge_to_allowed_ratio | float | total_charges / total_allowed |
| charge_peer_p10 | float | 10th percentile of peer ratios |
| charge_peer_p25 | float | 25th percentile |
| charge_peer_median | float | 50th percentile |
| charge_peer_p75 | float | 75th percentile |
| charge_peer_p90 | float | 90th percentile |
| charge_score | float | 100, 70, or 40 |
| charge_direction | string | "in_range", "above_peers", or "below_peers" |
| outlier_code_count | int | Codes with charge ratio > 2x or < 0.5x peer median |
| **E/M Distribution** | | |
| em_99213_pct | float | % of E/M as 99213 |
| em_99214_pct | float | % as 99214 |
| em_99215_pct | float | % as 99215 |
| em_high_complexity_pct | float | (99214+99215) / total E/M |
| em_distribution_flag | string | "green", "yellow", or "red" |
| **Green Flag Ratios** | | |
| instrumentation_fusion_ratio | float | Instrumentation / fusion |
| instrumentation_flag | string | Flag |
| nav_complex_ratio | float | Navigation / complex surgery |
| nav_flag | string | Flag |
| decompression_breadth_ratio | float | 63048 / 63047 |
| decompression_flag | string | Flag |
| cervical_pct | float | Cervical / total fusion |
| cervical_flag | string | Flag |
| new_patient_pct | float | New patient / total E/M |
| new_patient_flag | string | Flag |
| surgical_ratio | float | Surgical / (surgical + E/M) |
| surgical_ratio_flag | string | Flag |
| graft_fusion_ratio | float | Graft / fusion |
| graft_flag | string | Flag |
| **Red Flag Ratios** | | |
| fusion_rate | float | Fusion / total spine |
| fusion_rate_flag | string | Flag |
| multilevel_fusion_pct | float | Multi-level / total fusion |
| multilevel_flag | string | Flag |
| em_complexity_trend | float | Change in high-complexity % |
| em_trend_flag | string | Flag |
| visits_per_beneficiary | float | E/M / unique benes |
| return_visit_flag | string | Flag |
| fusion_without_decomp | boolean | Fusion > 20, decompression < 5 |
| shunt_without_followup | boolean | Shunts > 5, E/M < 50 |
| max_single_code_pct | float | Highest single surgical code % |
| single_code_flag | string | Flag |
| **Cross-Category Consistency** | | |
| consistency_flags | int | Count of checks fired (0-9) |
| consistency_flag_list | string | Names of fired checks |
| **Composite** | | |
| total_checks_run | int | Ratio checks with sufficient data |
| green_flag_count | int | Green flags |
| yellow_flag_count | int | Yellow flags |
| red_flag_count | int | Red flags |
| ratio_analysis_score | float | Weighted roll-up (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score |
