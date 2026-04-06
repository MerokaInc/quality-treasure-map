# Retina Specialist Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other docs ask about clinical practice: does this provider inject, image, follow guidelines? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** — is their pricing in line with peers?
2. **Procedure-to-procedure ratios** — do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that should not go together, or go together too often)?
3. **E/M and exam level distribution** — are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against state-level cohorts by default.


---

# PART A: WHAT WE HAVE

---

This score uses both CMS datasets:

**CMS Medicare Physician & Other Practitioners (By Provider and Service)** — for charge-to-allowed analysis

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged (list price) |
| average_medicare_allowed_amt | What Medicare allows |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Ophthalmology |

**CMS Medicaid Provider Spending** — for procedure ratio analysis

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined.

**The retina Medicare advantage:** Unlike pediatrics where Medicare volume is thin, retina specialists have substantial Medicare volume. Charge-to-allowed analysis is robust for this specialty.


---

# PART B: THE LOGIC — CHARGE-TO-ALLOWED

---


## 1. The Metric: Charge-to-Allowed Ratio

```
For a given NPI:

    total_charges = SUM(average_submitted_chrg_amt * number_of_services)
        across all HCPCS codes for this NPI

    total_allowed = SUM(average_medicare_allowed_amt * number_of_services)
        across all HCPCS codes for this NPI

    charge_to_allowed_ratio = total_charges / total_allowed
```

| Ratio | Interpretation |
|---|---|
| ~1.0x | Charges close to Medicare allowed. Unusual for a procedural specialty. |
| 1.5x - 3.5x | Typical range for retina specialists. |
| 3.5x - 6.0x | High charges. May reflect high-cost market, aggressive pricing, or ASC/office-based surgery markups. |
| >6.0x | Outlier. Worth investigating. Could be billing errors or extreme fee schedule. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Data error likely. |

> **ASSUMPTION:** Retina specialists tend to have higher charge-to-allowed ratios than primary care because of high-value procedures (vitrectomy, retinal detachment repair) and drug costs. The expected peer distribution will be shifted higher than pediatrics. Actual peer anchors must be computed from CMS data.


## 2. Building the Peer Distribution

### Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All retina specialist NPIs in same state with ≥10 Medicare services | Primary scoring. |
| **National** | All states combined | Fallback when state cohort < 30. |
| **Sub-state (future)** | ZIP-3 or CBSA | Urban vs. rural pricing dynamics. |

### Computing Peer Anchors

```
peer_cohort = all retina specialist NPIs in the same state
    WHERE meets retina classification criteria
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio

peer_p10 = 10th percentile
peer_p25 = 25th percentile
peer_median = 50th percentile
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national retina specialist anchors (to be computed from real data):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.60x |
| p25 | ~2.10x |
| Median | ~2.80x |
| p75 | ~3.60x |
| p90 | ~4.50x |

> **EXTERNAL RESOURCE NEEDED:** Actual CMS Medicare data filtered for retina specialist NPIs to compute real peer anchors. These illustrative values may differ significantly by state and practice setting (office-based vs. hospital-based).


## 3. Scoring Bands

```
provider_ratio = charge_to_allowed_ratio for this NPI

IF peer_p25 <= provider_ratio <= peer_p75:
    charge_score = 100        -- inside the middle 50%, normal

ELIF peer_p10 <= provider_ratio <= peer_p90:
    charge_score = 70         -- inside the middle 80%, somewhat unusual

ELSE:
    charge_score = 40         -- outside the middle 80%, outlier
```

| Band | Range | Score | Interpretation |
|---|---|---|---|
| Normal | p25 to p75 | 100 | Pricing within typical range for retina peers. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | In the tails but not extreme. |
| Outlier | Below p10 or above p90 | 40 | Significantly different from peers. Investigate. |


## 4. Per-Code Analysis (Optional Detail Layer)

```
For each HCPCS code billed by this NPI:

    provider_code_ratio = average_submitted_chrg_amt / average_medicare_allowed_amt

    peer_code_median = MEDIAN(ratio) across all peer NPIs billing this code

    code_deviation = provider_code_ratio / peer_code_median

    IF code_deviation > 2.0 OR code_deviation < 0.5:
        code_flag = "outlier"
    ELSE:
        code_flag = "normal"

outlier_code_count = COUNT of codes WHERE code_flag = "outlier"
```

This answers: is the outlier status driven by one procedure (e.g., inflated 67028 pricing) or across the board?


---

# PART C: PROCEDURE RATIO ANALYSIS (Green Flags and Red Flags)

---


## 5. Exam Level Distribution (Upcoding Check)

Retina specialists use both ophthalmologic exam codes (920xx) and standard E/M codes (992xx). We must check both distributions.

### Ophthalmologic Exam Distribution

```
eye_exam_codes = {
    92002: 'intermediate_new',
    92004: 'comprehensive_new',
    92012: 'intermediate_established',
    92014: 'comprehensive_established'
}

For this NPI:
    eye_exam_total = SUM(total_services) WHERE hcpcs_code IN [92002, 92004, 92012, 92014]

    For each code:
        provider_pct = services / eye_exam_total
```

**What normal looks like in retina:**

| Code | Level | Typical Peer Distribution |
|---|---|---|
| 92002 | Intermediate, new patient | ~2-5% |
| 92004 | Comprehensive, new patient | ~5-10% |
| 92012 | Intermediate, established | ~15-25% |
| 92014 | Comprehensive, established | ~60-75% (the dominant code) |

92014 should be the most-billed exam code for a retina specialist. Retinal disease management requires comprehensive examination at most visits.

**Red flag:** Provider's 92014 exceeds 90% of eye exam volume AND their total eye exam volume is high relative to peers. Could indicate routine upcoding of all visits to comprehensive.

**Green flag:** Distribution closely matches peer median (all levels within 10 percentage points).

### Standard E/M Distribution (if used)

```
em_codes = {
    99213: 'low-moderate',
    99214: 'moderate',
    99215: 'high'
}

For this NPI (if E/M codes are used instead of/alongside 920xx):
    em_total = SUM(total_services) WHERE hcpcs_code IN [99213-99215]
```

**What normal looks like for retina E/M:**

| Code | Level | Typical Distribution |
|---|---|---|
| 99213 | Low-moderate | ~10-20% |
| 99214 | Moderate | ~55-70% (dominant for retina — managing chronic disease) |
| 99215 | High | ~15-30% (higher than primary care — complex disease management) |

> **ASSUMPTION:** Retina specialists legitimately bill higher E/M levels than primary care. 99214 should dominate. 99215 at 15-30% is normal for retina (complex AMD management, multi-disease patients). Do not apply primary care E/M distribution expectations to retina.

**Red flag:** 99215 exceeds 40% of E/M volume. Even for retina, this is unusually high.

**Red flag:** Provider bills BOTH 92014 AND 99214/99215 on same-day volume (cannot verify with aggregated data — reserve for claims-level analysis).


## 6. Green Flag Ratios (Good Practice Signals)


### 6A. OCT-to-Injection Ratio

Does the provider monitor treatment response with imaging?

```
oct_injection_ratio = services_92134 / services_67028
    -- OCT scans per intravitreal injection
    -- guideline-concordant ratio: 0.8-1.2
```

**Green flag:** Ratio ≥0.8. Provider images at most injection visits.

**Neutral:** Ratio 0.5-0.8. Some injection-only visits between imaging visits (can be protocol-appropriate).

**Signal:** Ratio <0.5. Provider injects significantly more than they image. Possible under-monitoring.


### 6B. Fluorescein Angiography to New Patient Ratio

Does the provider perform diagnostic angiography for new retinal disease patients?

```
fa_new_patient_ratio = services_92235 / (services_92004 + services_92002 + services_99205 + services_99204)
    -- FA studies per new patient evaluation
```

**Green flag:** Ratio ≥0.3. Provider performs FA for a meaningful proportion of new patients (expected for diagnostic workup).

**Neutral:** Between 0.1 and 0.3. Selective FA use.

**Signal:** Ratio <0.05 with high new patient volume. Provider rarely images new patients diagnostically.


### 6C. Fundus Photography to Encounter Ratio

Does the provider document retinal findings with photography?

```
fundus_encounter_ratio = services_92250 / total_encounter_volume
    -- fundus photos per patient encounter
```

**Green flag:** Ratio ≥0.15. Provider routinely documents findings.

**Neutral:** Between 0.05 and 0.15. Selective documentation.

**Signal:** Ratio <0.02. Provider rarely photographs. Documentation may be insufficient.


### 6D. Drug Code to Injection Ratio

When injecting, does the provider bill the corresponding drug code?

```
drug_injection_ratio = (services_J0178 + services_J9035 + services_J2778 + services_J0224) / services_67028
```

**Green flag:** Ratio 0.8-1.1. Drug codes match injection volume (1:1 expected).

**Signal:** Ratio <0.5. Drug codes significantly below injection volume. Possible facility billing artifact (hospital bills the drug) or billing error.

> **ASSUMPTION:** For office-based practices, the drug-to-injection ratio should approach 1.0. For hospital-based practices, it may be near zero because the hospital bills the drug under its own NPI. Do not penalize hospital-based providers. Use place-of-service data from Medicare to identify practice setting.


### 6E. Multi-Agent Utilization

Does the provider use multiple anti-VEGF agents?

```
agents_used = COUNT of distinct anti-VEGF J-codes billed
    (J0178, J9035, J2778, J0224, Q5124)
```

**Green flag:** 2+ agents. Provider individualizes treatment.

**Neutral:** 1 agent. Could be cost-driven (bevacizumab-only) or formulary-restricted. Not a red flag.


### 6F. Surgical Diversity

For surgical retina specialists: does the provider perform multiple types of surgery?

```
surgical_diversity = COUNT of distinct surgical code families billed
    families = [basic_vitrectomy, membrane_peel, retinal_detachment, laser, prophylaxis]
```

**Green flag:** 3+ families. Comprehensive surgical capability.

**Neutral:** 1-2 families. Narrower surgical focus.


### 6G. New Patient Intake Rate

Does the provider accept new patients at a healthy rate?

```
new_patient_pct = (services_92004 + services_92002 + services_99205 + services_99204) / total_encounter_volume
```

**Green flag:** Between peer p25 and p75. Normal new patient flow.

**Signal (low):** Below peer p10. Very few new patients. Possible closed panel or unusual referral pattern.


## 7. Red Flag Ratios (Warning Signals)


### 7A. Injection Volume Per Beneficiary (Extreme)

How many injections does each patient receive per year?

```
injections_per_bene = services_67028 / unique_beneficiaries_67028
```

**Red flag:** Above peer p95. Extremely high injection frequency per patient. While some patients require monthly injections, an average across all patients above p95 is unusual.

**Neutral:** Between p25 and p75.

Note: High injection frequency can be clinically appropriate for active bilateral disease. This flag triggers investigation, not automatic penalty.


### 7B. Injection Without Any Imaging

Provider bills injections but very few or no imaging codes.

```
has_injections = services_67028 > 50
has_imaging = (services_92134 + services_92235 + services_92250) > 10

injection_without_imaging = has_injections AND NOT has_imaging
```

**Red flag:** Provider performs 50+ injections but fewer than 10 total imaging services. Injecting without monitoring is clinically inappropriate.

> **ASSUMPTION:** This is the strongest red flag in retina billing quality. ASRS/AAO guidelines universally recommend imaging-guided anti-VEGF treatment. A provider who injects at high volume without imaging is either (a) not billing imaging codes (facility billing artifact), or (b) not imaging patients. Both warrant investigation.


### 7C. Bilateral Same-Day Injection Rate

How often does the provider inject both eyes on the same day?

```
-- Cannot directly compute from aggregated data (no same-day linkage)
-- Proxy: if services_67028 > (unique_beneficiaries_67028 * 12),
--   the provider averages more than 12 injections per patient per year,
--   which is only possible with bilateral treatment or very aggressive unilateral treatment.

bilateral_proxy = services_67028 / unique_beneficiaries_67028
```

**Red flag:** Ratio above 15. At 15+ injections per unique patient per year, bilateral same-day injections are likely frequent. ASRS guidelines note that bilateral same-day injections are increasingly accepted but carry increased endophthalmitis risk.

**Neutral:** 6-12. Consistent with active unilateral disease management.

Note: This is a proxy. True bilateral injection tracking requires claims-level same-day analysis.


### 7D. Exam Without Procedure

Provider bills many comprehensive exams but few procedures (injections, surgery, laser).

```
exam_only_ratio = total_eye_exam_services / (total_eye_exam_services + services_67028 + surgical_services + laser_services)

high_exam_no_procedure = exam_only_ratio > 0.80
```

**Red flag:** Provider bills >80% exams with <20% procedures. For a classified retina specialist, this is unusual. Retina specialists should have a high procedure-to-exam ratio (injections are the bread and butter). A retina-classified provider with mostly exams may be misclassified or may be billing inappropriately.

**Neutral:** Exam ratio 20-50%. Normal for a mixed medical-surgical retina practice.


### 7E. Single Drug Dominance with High Pricing

Provider uses only one anti-VEGF agent AND has high charge-to-allowed ratio on that drug.

```
single_drug = only one J-code has services > 0 among [J0178, J9035, J2778, J0224]
dominant_drug_is_expensive = the single drug is J0178 or J2778 (brand-name, not bevacizumab)
charge_ratio_high = charge_to_allowed_ratio > peer_p75

single_drug_pricing_flag = single_drug AND dominant_drug_is_expensive AND charge_ratio_high
```

**Red flag:** Provider exclusively uses an expensive anti-VEGF agent while also charging above peers. This is not clinically wrong (aflibercept may be preferred), but the combination of single expensive drug + high pricing is worth noting.

**Neutral:** Single drug = bevacizumab. This is a cost-effective choice, not a flag.


### 7F. After-Hours or Weekend Injection Volume

```
-- If available from place-of-service or service-date data:
-- Flag providers with unusually high volume of 67028 billed outside normal hours.
-- Reserve for claims-level data. Not computable from aggregated CMS files.
```

**Reserve for future implementation.** Not available in aggregated data.


### 7G. Laser-Only Practice (No Anti-VEGF)

Provider bills laser codes but zero or minimal injection codes.

```
laser_dominant = services_67210 + services_67228 > 20
low_injection = services_67028 < 10

laser_only = laser_dominant AND low_injection
```

**Red flag:** In modern retina practice, anti-VEGF has largely replaced laser for most macular edema indications. A retina-classified provider using primarily laser with minimal injections may be practicing an outdated treatment paradigm.

**Neutral:** If the provider has high surgical volume (vitrectomy), laser-only with low injection may indicate a surgical retina practice with intraoperative laser use, which is appropriate.


### 7H. E/M Complexity Trend (Multi-Year)

```
For each year in [2021, 2022, 2023]:
    high_complexity_pct_year = (services_99214 + services_99215) / total_em_services
    -- OR for eye exams: services_92014 / total_eye_exam_services

complexity_trend = high_complexity_pct_2023 - high_complexity_pct_2021
peer_median_trend = MEDIAN(complexity_trend) across peer cohort
```

**Red flag:** Trend above peer p90. Complexity billing escalating faster than peers.

**Neutral:** Trend within p25-p75. Some upward drift is normal post-2021 E/M changes.


## 8. Cross-Category Consistency Checks

| Check | Logic | Flag |
|---|---|---|
| Injections but no exams | services_67028 > 50 AND total_eye_exam + total_em = 0 | Red: every injection visit requires an evaluation |
| Exams but no injections or surgery (for retina specialist) | total_eye_exam > 100 AND services_67028 + surgical_services = 0 | Yellow: unusual for classified retina specialist, may be misclassified |
| OCT but no injections or exams | services_92134 > 50 AND services_67028 + total_eye_exam = 0 | Red: imaging without clinical context |
| Vitrectomy but no B-scan | surgical_services > 10 AND services_76512 = 0 | Yellow: B-scan is standard for surgical planning, but not always billed separately |
| Drug code volume far exceeds injection volume | drug_services > services_67028 * 1.5 | Yellow: more drug doses billed than injection procedures |
| Injection volume far exceeds drug codes (office-based) | services_67028 > drug_services * 3 AND place_of_service = "office" | Yellow: in office setting, drug should match injection |
| FA without OCT | services_92235 > 20 AND services_92134 = 0 | Red: OCT is more fundamental than FA in modern retina; doing FA without OCT is unusual |
| Retinal detachment repair but no prophylaxis | services_67108 + services_67113 > 5 AND services_67145 = 0 | Neutral: not all detachment cases have prior prophylaxis opportunity |
| High new patient rate with low return visits | new_patient_pct > peer_p90 AND visits_per_bene < peer_p25 | Yellow: patients seen once but not returning. Access issue or patient dissatisfaction. |


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | Eye exam distribution (920xx) | 5 | Upcoding check | Medicare + Medicaid |
| 2 | E/M distribution (992xx) | 5 | Upcoding check | Medicare + Medicaid |
| 3 | OCT-to-injection ratio | 6A | Green flag | Medicare + Medicaid |
| 4 | FA-to-new-patient ratio | 6B | Green flag | Medicare + Medicaid |
| 5 | Fundus photo-to-encounter ratio | 6C | Green flag | Medicare + Medicaid |
| 6 | Drug-to-injection ratio | 6D | Green flag | Medicare + Medicaid |
| 7 | Multi-agent utilization | 6E | Green flag | Medicare + Medicaid |
| 8 | Surgical diversity | 6F | Green flag | Medicare + Medicaid |
| 9 | New patient intake rate | 6G | Green flag | Medicare + Medicaid |
| 10 | Injection volume per bene (extreme) | 7A | Red flag | Medicare + Medicaid |
| 11 | Injection without imaging | 7B | Red flag | Medicare + Medicaid |
| 12 | Bilateral injection proxy | 7C | Red flag | Medicare |
| 13 | Exam without procedure | 7D | Red flag | Medicare + Medicaid |
| 14 | Single drug + high pricing | 7E | Red flag | Medicare |
| 15 | Laser-only (no anti-VEGF) | 7G | Red flag | Medicare + Medicaid |
| 16 | E/M complexity trend | 7H | Red flag | Medicare + Medicaid |
| 17-25 | Cross-category consistency (9 checks) | 8 | Yellow/Red | Medicare + Medicaid |

**Total: 25 ratio checks** (7 green flags, 9 red flags, 9 cross-category consistency checks).


## 10. Scoring the Ratio Analysis

```
ratio_checks = [all 25 checks listed above, excluding those with insufficient data]

green_count = COUNT WHERE flag = "green"
neutral_count = COUNT WHERE flag = "neutral" or "yellow"
red_count = COUNT WHERE flag = "red"
total_checks = COUNT of all applicable checks

ratio_analysis_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0))
                       / total_checks * 100
```

| Score | Interpretation |
|---|---|
| 80-100 | Most ratios are green or neutral. Practice patterns look clean. |
| 60-79 | Mixed. Some green flags, some red. Worth looking at which reds. |
| 40-59 | Multiple red flags. Billing patterns deviate from peers in several areas. |
| Below 40 | Significant red flags. Investigate. |


---

# PART D: COMPOSITE BILLING QUALITY SCORE

---


## 11. Composite

```
billing_quality_composite = (charge_score * 0.35) + (ratio_analysis_score * 0.65)
```

If charge-to-allowed is not computable (no Medicare data or insufficient Medicare volume), use ratio_analysis_score alone.

| Component | Weight | Rationale |
|---|---|---|
| Charge-to-allowed | 35% | Pricing is important but less informative than procedure patterns for retina |
| Ratio analysis | 65% | The procedure relationships (injection-to-imaging, drug-to-injection, exam levels) are the stronger quality signal |


## 12. Worked Example

**Provider A** in Florida. Medicare data for 2023.

**Charge ratio:** Charges $850,000 total, Medicare allowed $320,000. Ratio = **2.66x**.

**FL peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.65x | 2.15x | 2.85x | 3.65x | 4.50x |

Provider A ratio of 2.66x falls between p25 (2.15x) and p75 (3.65x). Charge score = **100**.

**Ratio analysis:** 18 of 25 checks applicable. 10 green, 6 neutral, 2 red. Ratio score = ((10*1.0) + (6*0.5) + (2*0.0)) / 18 * 100 = **72**.

**Composite:** (100 * 0.35) + (72 * 0.65) = 35 + 46.8 = **82**.


---

# PART E: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider do what ASRS/AAO says? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal retina specialist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume real? | Behavior check |
| **Billing Quality** | Are their charges and procedure ratios in line with peers? | Pricing + integrity |
| **Payer Diversity** | Is their practice pattern consistent across payers? | Access proxy |

| Scenario | Guideline | Peer | Volume | Billing |
|---|---|---|---|---|
| Excellent retina specialist, normal billing | High | High | High | High |
| Excellent provider, aggressive pricing | High | High | High | Low (charge outlier) |
| High-volume injector, never images | Medium | Medium | Low (OCT flagged) | Low (red: injection without imaging) |
| Provider with green flags but upcoding exams | High | High | High | Medium (green ratios offset by red exam distribution) |
| Medical-only retina, clean billing | High on injection/imaging domains | Moderate (missing surgery) | High for detected categories | High |


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed ratios for retina include high-cost drugs.** Anti-VEGF drugs (aflibercept at ~$1,850/injection, ranibizumab at ~$1,100/injection vs. bevacizumab at ~$60/injection) heavily influence total charges. A provider using exclusively aflibercept will have a higher charge-to-allowed ratio than one using bevacizumab, even with identical fee schedules for professional services. The charge ratio reflects drug choice, not just pricing behavior.

**Exam distribution expectations differ from primary care.** 92014 (comprehensive) should dominate for retina. Do not apply primary care E/M distribution norms. The peer distribution must be computed from the retina-specific cohort.

**Bilateral injection frequency is a proxy.** True bilateral same-day injection tracking requires claims-level data. Our proxy (injections per unique beneficiary) can overestimate bilateral frequency if patients simply have active disease requiring frequent unilateral treatment.

**Hospital-based providers will flag on drug-to-injection ratio.** This is a data artifact, not a quality issue. Use place-of-service data to identify and adjust.

**Red flags are signals, not accusations.** A flag means a ratio is statistically unusual compared to peers. There may be valid clinical explanations. The score surfaces signals for investigation.

**Green flags are proxy signals.** A high OCT-to-injection ratio means the provider images frequently. It does not confirm imaging was interpreted correctly or that treatment decisions were imaging-guided.

**Geographic and market variation.** Retina specialist pricing and practice patterns vary significantly by market (Manhattan vs. rural Mississippi). State-level peer grouping captures most of this.


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
| **Charge-to-Allowed (Medicare only)** | | |
| total_medicare_services | int | Total Medicare services |
| total_charges | float | SUM(avg_charge * services) |
| total_allowed | float | SUM(avg_allowed * services) |
| charge_to_allowed_ratio | float | total_charges / total_allowed |
| charge_peer_p10 | float | 10th percentile of peer ratios |
| charge_peer_p25 | float | 25th percentile |
| charge_peer_median | float | 50th percentile |
| charge_peer_p75 | float | 75th percentile |
| charge_peer_p90 | float | 90th percentile |
| charge_score | float | 100 (p25-p75), 70 (p10-p90), or 40 (outlier) |
| charge_direction | string | "in_range", "above_peers", or "below_peers" |
| outlier_code_count | int | Codes where charge ratio > 2x or < 0.5x peer median |
| outlier_code_list | string | Comma-separated outlier codes |
| **Exam Distribution** | | |
| eye_exam_92014_pct | float | % of eye exams billed as 92014 |
| eye_exam_92012_pct | float | % as 92012 |
| em_99214_pct | float | % of E/M visits as 99214 |
| em_99215_pct | float | % of E/M visits as 99215 |
| exam_distribution_flag | string | "green", "yellow", or "red" |
| **Green Flag Ratios** | | |
| oct_injection_ratio | float | 92134 / 67028 |
| oct_injection_flag | string | Flag |
| fa_new_patient_ratio | float | 92235 / new patient exams |
| fa_flag | string | Flag |
| fundus_encounter_ratio | float | 92250 / encounter volume |
| fundus_flag | string | Flag |
| drug_injection_ratio | float | J-codes / 67028 |
| drug_injection_flag | string | Flag |
| multi_agent_count | int | Distinct anti-VEGF J-codes billed |
| multi_agent_flag | string | Flag |
| surgical_diversity | int | Distinct surgical code families |
| surgical_diversity_flag | string | Flag |
| new_patient_pct | float | New patient encounters / total |
| new_patient_flag | string | Flag |
| **Red Flag Ratios** | | |
| injections_per_bene | float | 67028 / unique beneficiaries |
| injection_intensity_flag | string | Flag |
| injection_without_imaging | boolean | High injection, low imaging |
| bilateral_proxy | float | Injections per beneficiary (high = bilateral likely) |
| bilateral_flag | string | Flag |
| exam_only_ratio | float | Exams / (exams + procedures) |
| exam_only_flag | string | Flag |
| single_drug_pricing_flag | boolean | Single expensive drug + high charges |
| laser_only_flag | boolean | Laser dominant, no anti-VEGF |
| em_complexity_trend | float | Change in high-complexity % over time |
| em_trend_flag | string | Flag |
| **Cross-Category Consistency** | | |
| consistency_flags | int | Count of consistency checks fired (0-9) |
| consistency_flag_list | string | Names of fired checks |
| **Composite** | | |
| total_checks_run | int | Ratio checks with sufficient data |
| green_flag_count | int | Green flags |
| yellow_flag_count | int | Yellow flags |
| red_flag_count | int | Red flags |
| ratio_analysis_score | float | Weighted roll-up (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score |
