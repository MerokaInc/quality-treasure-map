# Urology Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other four docs ask about clinical practice: does this provider follow AUA guidelines, do they look like a normal urologist, is their volume believable, is their billing consistent across payers? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** -- is their pricing in line with peers?
2. **Procedure-to-procedure ratios** -- do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that shouldn't go together, or go together too often)?
3. **E/M level distribution** -- are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against state-level cohorts by default.

Important context for urology: this is a procedural specialty with Medicare-dominant patient volume. Charge-to-allowed analysis is STRONG here, unlike pediatrics where Medicare coverage is thin. Urologists also bill at higher E/M complexity than primary care specialties because their conditions (BPH, cancer surveillance, stone evaluation) are inherently more complex. The benchmarks in this doc reflect that reality.


---

# PART A: WHAT WE HAVE

---

This score uses both CMS datasets:

**CMS Medicare Physician & Other Practitioners (By Provider and Service)** -- for charge-to-allowed analysis

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged (their list price) |
| average_medicare_allowed_amt | What Medicare says the service is worth (the allowed amount) |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Urology |

**CMS Medicaid Provider Spending** -- for additional procedure volume

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined, giving us full urologic volume.

**Unlike pediatrics, Medicare data is the primary data source for urology.** The typical urologist's patient panel skews heavily Medicare-age. Prostate cancer, BPH, bladder dysfunction, kidney stones -- these conditions concentrate in patients 55+. This means our charge-to-allowed analysis covers the majority of most urologists' practice, not a sliver of it.


---

# PART B: THE LOGIC

---


## 1. The Metric: Charge-to-Allowed Ratio

For each provider, we calculate the ratio of what they charge to what Medicare allows:

```
For a given NPI:

    total_charges = SUM(average_submitted_chrg_amt * number_of_services)
        across all HCPCS codes for this NPI

    total_allowed = SUM(average_medicare_allowed_amt * number_of_services)
        across all HCPCS codes for this NPI

    charge_to_allowed_ratio = total_charges / total_allowed
```

A ratio of 2.5x means the provider charges, on average, two and a half times what Medicare allows. For urology, this is normal. Procedural specialties charge higher markups than primary care, surgical and procedural codes have wider charge variation, and the expected range runs higher than what you see in family medicine or pediatrics.


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual. Could indicate a practice that has never updated its fee schedule, or one that primarily serves government-payer patients with no commercial rate negotiation. |
| 1.5x - 2.5x | Low end of normal for urology. Less aggressive pricing, possibly in a lower-cost market or a practice that has not updated charges recently. |
| 2.5x - 4.0x | Typical range for most urologists. Reflects normal commercial rate negotiations and standard fee schedule markups for a procedural specialty. |
| 4.0x - 6.0x | High charges relative to Medicare. May reflect aggressive pricing, a high-cost metro market (NYC, SF, Boston), or a practice with strong commercial payer leverage. |
| >6.0x | Outlier. Worth investigating. Could be billing errors, a practice that has never reconciled its fee schedule, or a single high-charge code distorting the average. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Could be data error or an unusual payment arrangement. |

Note the shift compared to pediatrics: the entire distribution runs about 0.5x to 1.0x higher for urology. A charge ratio of 3.0x that would be at the high end for a pediatrician is median for a urologist.


## 2. Building the Peer Distribution

The peer distribution is what makes this score meaningful. A ratio of 3.2x means nothing in isolation. It means something when you know the peer median is 2.8x.


### Geographic Grouping

Charge-to-allowed ratios vary significantly by geography because of differences in cost of living, commercial payer rates, and local market dynamics. A urologist in Manhattan charging 4.5x may be normal for that market. A urologist in rural Nebraska charging 4.5x is an outlier.

Peer distributions are built at the **state level** by default:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All urology NPIs (taxonomy 208800000X, >= 10 Medicare services) in the same state | Primary scoring. Captures local market pricing norms. |
| **National** | All states combined | Secondary benchmark. Cross-state comparison: "how does urology pricing in FL compare to CA?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | When state cohorts are large enough. Urban vs. rural have very different pricing dynamics. |

The minimum peer cohort size is 30 providers. If a state has fewer than 30 urology NPIs with Medicare data, fall back to national.

**Taxonomy filter:** We use 208800000X (Urology) and explicitly exclude subspecialists:
- 2088P0231X (Pediatric Urology)
- 2088F0040X (Female Pelvic Medicine and Reconstructive Surgery)
- 2088P0210X (Transplant Urology, if applicable -- some NPIs use this code but volume is small)

We exclude these because their case mix, procedure volume, and billing patterns differ from general urology enough to distort peer comparisons. A pediatric urologist's code mix looks nothing like a general urologist's.


### Computing Peer Anchors

From the state-level peer cohort, compute the following percentile anchors:

```
peer_cohort = all urology NPIs in the same state
    WHERE taxonomy_code = '208800000X'
    AND taxonomy_code NOT IN ('2088P0231X', '2088F0040X', '2088P0210X')
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio across peer_cohort
peer_p25 = 25th percentile
peer_median = 50th percentile (median)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Example peer anchors (national urology, illustrative):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.80x |
| p25 | ~2.20x |
| Median | ~2.80x |
| p75 | ~3.50x |
| p90 | ~4.20x |

These are illustrative. Actual anchors should be computed from the real CMS data once loaded. They will differ by state.


## 3. Scoring Bands

The score uses three bands based on where the provider's ratio falls in the peer distribution:

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
| Normal | p25 to p75 | 100 | Provider's pricing is within the typical range for urology peers in this state. No signal. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | Provider is in the tails of the peer distribution but not extreme. Could reflect market positioning, not a problem. |
| Outlier | Below p10 or above p90 | 40 | Provider's pricing is significantly different from peers. Worth investigating. Not an automatic fail. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 2.8x is not "better" than 3.2x in any clinical sense. Both are normal. The purpose of this score is to flag outliers, not to rank providers. A three-band system (normal / somewhat unusual / outlier) communicates this clearly: you are either in line with peers, at the edge, or outside the norm.


## 4. Per-Code Analysis (Optional Detail Layer)

The composite ratio in Section 1 blends all codes together. For a deeper look, compute the ratio per HCPCS code and flag codes where the provider deviates significantly from the peer median for that code:

```
For each HCPCS code billed by this NPI:

    provider_code_ratio = average_submitted_chrg_amt / average_medicare_allowed_amt

    peer_code_median = MEDIAN(average_submitted_chrg_amt / average_medicare_allowed_amt)
        across all peer NPIs billing this code

    code_deviation = provider_code_ratio / peer_code_median

    IF code_deviation > 2.0 OR code_deviation < 0.5:
        code_flag = "outlier"
    ELSE:
        code_flag = "normal"

outlier_code_count = COUNT of codes WHERE code_flag = "outlier"
outlier_code_pct = outlier_code_count / total_codes_billed * 100
```

This layer answers: "is the provider's pricing outlier status driven by one or two codes, or is it across the board?" A urologist who charges 5x the peer median for 52000 (cystoscopy) but is normal on everything else has a different story from one who is 4x+ on every code.

This per-code analysis is especially useful in urology because the code mix spans office E/M visits, diagnostic procedures (cystoscopy, imaging), and surgical procedures (biopsy, TURP, robotic prostatectomy). A single high-charge procedural code can skew the composite ratio in a way that does not reflect overall pricing behavior.


---

# PART C: PROCEDURE RATIO ANALYSIS (Green Flags and Red Flags)

---

Charge-to-allowed is about pricing. This section is about the relationships between procedures. Certain code ratios reveal practice quality, and certain combinations are warning signs. All of these use HCPCS volumes from both Medicare and Medicaid combined.


## 5. E/M Level Distribution (Upcoding Check)

Every office visit is billed at a complexity level. Peers have a typical distribution. A provider who consistently bills at higher complexity than peers may be upcoding.

```
em_codes = {
    99211: 'minimal',
    99212: 'straightforward',
    99213: 'low',
    99214: 'moderate',
    99215: 'high'
}

For this NPI:
    em_total = SUM(total_services) WHERE hcpcs_code IN [99211-99215]

    For each level:
        provider_pct = services for this code / em_total

For peer cohort (same state):
    peer_median_pct for each level
```

**What normal looks like in urology:**

| Code | Level | Typical Peer Distribution |
|---|---|---|
| 99211 | Minimal (nurse visit) | ~1-2% |
| 99212 | Straightforward | ~2-5% |
| 99213 | Low complexity | ~25-35% |
| 99214 | Moderate complexity | ~40-50% (the dominant code) |
| 99215 | High complexity | ~8-15% |

**99214 should be the most-billed code for a general urologist.** This is a critical difference from pediatrics, where 99213 dominates. Urologic conditions are inherently more complex than routine pediatric visits. BPH management requires ongoing medication titration and monitoring. Prostate cancer surveillance involves interpreting PSA trends, imaging, and biopsy results. Stone evaluation includes imaging review, metabolic workup, and treatment planning. Voiding dysfunction involves urodynamic interpretation. All of these warrant moderate complexity coding.

A urologist whose E/M distribution mirrors a pediatrician's (99213 dominant) is the unusual one, not the other way around. Be careful not to apply primary care benchmarks to a procedural specialty.

**Red flag:** Provider's 99215 alone exceeds 20% of E/M volume. Very high complexity visits should not be the norm even in urology. Cancer-heavy panels may legitimately reach 15%, but sustained 20%+ is unusual.

**Red flag:** Provider's 99214 + 99215 combined is above the peer p90. This means they bill at higher complexity than 90% of urology peers. Possible explanations: upcoding, or a genuinely complex panel (oncology-heavy). The red flag is about deviation from peers, not absolute levels.

**Green flag:** Provider's distribution closely matches peer median (all levels within 10 percentage points of peer median).

```
high_complexity_pct = (services_99214 + services_99215) / em_total

peer_p90_high_complexity = 90th percentile of high_complexity_pct across peer cohort

em_distribution_flag = "red"  IF high_complexity_pct > peer_p90_high_complexity
                      "yellow" IF high_complexity_pct > peer_p75_high_complexity
                      "green"  IF high_complexity_pct <= peer_p75_high_complexity
```

Note: because 99214 dominates in urology, the "high complexity" combined percentage (99214 + 99215) will typically run 50-65% of E/M volume. This is normal. The comparison is always against urology peers, not against all specialties.


## 6. Green Flag Ratios (Good Practice Signals)

These ratios indicate a provider is doing things right. High ratios compared to peers are positive signals.


### 6A. PSA-to-Visit Ratio

Does the provider actively monitor prostate health through PSA testing?

```
psa_ratio = services_84153 / total_established_em_visits
    -- 84153 = PSA (prostate-specific antigen)
    -- total_established_em_visits = SUM(services) for 99211-99215
```

**Green flag:** Ratio above peer p75. Provider actively monitors prostate health. PSA is the cornerstone of prostate cancer screening and surveillance, and high relative volume indicates a provider who is following through on monitoring.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider orders few PSAs relative to visit volume. Could indicate a non-prostate-focused urology practice (female urology, pediatric overlap), but unusual for general urology.

Note: PSA screening guidelines have fluctuated (USPSTF changed from D to C recommendation in 2018, AUA recommends shared decision-making ages 55-69). A urologist should be ordering PSAs at meaningful volume regardless of the screening debate, because most of their prostate patients are already in surveillance, not initial screening.


### 6B. Cystoscopy-to-Visit Ratio

Does the provider perform cystoscopy at a reasonable rate relative to their office visits?

```
cysto_ratio = services_52000 / total_em_visits
    -- 52000 = cystourethroscopy (diagnostic)
    -- total_em_visits = SUM(services) for 99211-99215
```

**Green flag:** Ratio above peer p75. Provider does thorough diagnostic evaluation. Cystoscopy is the primary diagnostic tool in urology for hematuria, bladder cancer surveillance, recurrent UTIs, and lower urinary tract symptoms. A urologist who scopes frequently relative to visits has active in-office diagnostic capability.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider scopes less than most peers. Could indicate a practice that refers cystoscopy to ambulatory surgery centers (ASC), or a practice focused on medical management without procedural workup.


### 6C. Urinalysis-to-Visit Ratio

Does the provider routinely perform urinalysis as part of office visits?

```
ua_ratio = (services_81003 + services_81001) / total_em_visits
    -- 81003 = automated urinalysis without microscopy
    -- 81001 = urinalysis with microscopy
```

**Green flag:** Ratio above peer p75. Provider routinely performs urinalysis. In urology, UA is the most basic office test. It should accompany most visits: hematuria evaluation, UTI workup, stone follow-up, pre-cystoscopy screening.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Low urinalysis volume relative to visits. Could indicate the UA is performed and billed by the lab rather than the office, or a practice that skips point-of-care UA.


### 6D. In-Office Imaging-to-Visit Ratio

Does the provider have and use in-office ultrasound capability?

```
imaging_ratio = (services_76857 + services_76770) / total_em_visits
    -- 76857 = ultrasound, pelvic (non-obstetric), limited
    -- 76770 = ultrasound, retroperitoneal, complete
```

**Green flag:** Ratio above peer p75. Provider has in-office diagnostic imaging capability. Office-based ultrasound allows real-time assessment of post-void residual, renal size, bladder pathology, and prostate volume. It is a marker of a well-equipped practice.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider may refer all imaging to radiology. Not inherently bad, but less efficient for the patient and less suggestive of a full-service urology office.


### 6E. PVR-to-BPH-Visit Ratio (Proxy)

Does the provider routinely measure post-void residual for patients with lower urinary tract symptoms?

```
pvr_ratio = services_51798 / total_established_em_visits
    -- 51798 = measurement of post-voiding residual urine
```

**Green flag:** Ratio above peer p75. Provider routinely measures post-void residual for LUTS patients. The AUA BPH guidelines recommend PVR measurement as part of the standard evaluation for men with lower urinary tract symptoms. High PVR volume relative to visits suggests the provider follows guideline-recommended workup.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider measures PVR less than most peers. Could indicate that PVR is performed but not billed separately (bundled into the visit), or that the provider skips PVR testing.

Note: We use total established E/M visits as the denominator because we cannot isolate BPH visits from the aggregated data. This means the ratio will be lower than the true "PVR per BPH visit" rate. The comparison is always peer-relative, so this denominator issue affects all providers equally.


### 6F. Biopsy-to-PSA Ratio

Does the provider follow through on abnormal PSA results with biopsy when warranted?

```
biopsy_psa_ratio = services_55700 / services_84153
    -- 55700 = biopsy of prostate
    -- 84153 = PSA
```

**Green flag:** Ratio between 0.05 and 0.30. A urologist ordering PSAs should follow through with biopsy when warranted. Not every elevated PSA needs a biopsy, but zero biopsies with high PSA volume is a signal. A ratio of 0.05-0.30 means roughly 1 biopsy per 3-20 PSAs, which aligns with the clinical reality that a minority of PSA tests trigger biopsy decisions.

**Neutral:** Not all urologists perform biopsies themselves. Some refer to interventional radiology for MRI-guided biopsy. If services_84153 = 0, skip this check entirely (provider does not order PSAs through their own NPI).

**Signal:** Ratio = 0 (zero biopsies) with services_84153 > 20. Provider orders many PSAs but never biopsies. This may be legitimate (referral for biopsy), but it is unusual for a general urologist to completely avoid prostate biopsy.


### 6G. Therapeutic-to-Diagnostic Cystoscopy Ratio

When the provider scopes, do they also treat what they find?

```
therapeutic_cysto_services = services_52214 + services_52234 +
                              services_52310 + services_52281 + services_52287
    -- 52214 = cystoscopy with fulguration of trigone, bladder neck, etc.
    -- 52234 = cystoscopy with fulguration/treatment of minor lesion
    -- 52310 = cystoscopy with removal of foreign body, stent, etc.
    -- 52281 = cystoscopy with calibration/dilation of urethral stricture
    -- 52287 = cystoscopy with injection of chemodenervation agent (botox)

therapeutic_cysto_ratio = therapeutic_cysto_services / services_52000
```

**Green flag:** Ratio between 0.1 and 0.5 AND above peer p75. Provider treats what they find, not just diagnoses. A urologist who scopes and intervenes at a reasonable rate is doing comprehensive care: surveillance finds lesions, and lesions get treated in the same or subsequent session.

**Neutral:** Between peer p25 and p75.

**Signal:** Ratio near zero with high diagnostic cystoscopy volume. Provider scopes frequently but never treats. Could indicate a practice that refers all therapeutic procedures to the OR, or one that scopes without clinical indication for treatment.


### 6H. Screening Density (Diagnostics per Visit)

How many diagnostic procedures does the provider perform per office visit?

```
diagnostic_services = services_52000 + services_84153 + services_81003 +
                       services_76857 + services_51798

diagnostic_density = diagnostic_services / total_em_visits
```

**Green flag:** Ratio above peer p75. Provider does thorough workup per visit. A high diagnostic density means the provider is not just seeing patients and sending them home, they are running the basic urology office toolkit: scope, PSA, UA, imaging, PVR.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does few diagnostics per visit. Could indicate a practice focused on counseling/medical management, or one that sends all diagnostics to external facilities.

A well-equipped urology office visit for a new BPH patient might include the visit (99214), urinalysis (81003), PVR (51798), and ultrasound (76857). That is a diagnostic density of 3.0 for that visit type. Across all visits, a density of 0.5-1.5 is typical.


## 7. Red Flag Ratios (Warning Signals)

These ratios indicate potential problems: unusual billing patterns, possible overuse, or codes that should not appear together at high rates.


### 7A. Return Visit Intensity

How many total visits does each patient have per year? Patients coming back unusually often could signal unnecessary follow-ups or billing anomalies.

```
visits_per_beneficiary = total_em_services / total_unique_beneficiaries
    -- (from Medicare "By Provider" file which has both)

peer_median_visits_per_bene = MEDIAN across peer cohort
peer_p90_visits_per_bene = 90th percentile
```

**Red flag:** `visits_per_beneficiary` above peer p90. Provider's patients come back significantly more than peers' patients.

**Neutral:** Between p25 and p75.

Note: urology patients do come back more than primary care patients. Cancer surveillance, stone follow-up, and BPH medication management all require regular visits. A typical urologist sees patients 2-4 times per year. But if a provider's per-beneficiary visit rate is in the top 10% of urologists, that is still unusual within the specialty.


### 7B. New-to-Established Patient Ratio

What proportion of visits are new patients vs. established?

```
new_patient_pct = (services_99201 + services_99202 + services_99203 +
                   services_99204 + services_99205) / total_em_services
```

**Red flag (high):** New patient percentage above peer p90. Could indicate high patient turnover (patients leaving the practice), or a practice that codes established patients as new (billing error or fraud).

**Red flag (very low):** New patient percentage near zero. Could indicate a closed panel or a practice not accepting new patients. Not a billing issue, but a signal about practice accessibility.

For urology, new patient visits typically run 10-25% of total E/M volume. Most visits are established patients returning for ongoing management.


### 7C. High-Complexity Visit Rate

Does the provider bill 99215 at an unusually high rate?

```
high_complexity_pct = services_99215 / total_em_services
```

**Red flag:** Above 20% of E/M volume. Even for urology, 99215 should be uncommon. A 99215 visit requires extensive history, high-complexity decision-making, and typically involves multiple chronic conditions with significant risk. Most urology visits, even for cancer patients, are 99214.

**Neutral:** 8-15% range. This is typical for urology.

**Green:** Below 8% while maintaining normal 99214 volume. Provider bills conservatively.

Context: The national conversation around E/M upcoding has focused on the rise in 99214 and 99215 billing across all specialties since the 2021 documentation changes. Urology was already high-complexity before those changes. We compare to urology peers only, not to all specialties.


### 7D. Cystoscopy-to-Beneficiary Ratio

Is the provider scoping each patient more often than peers?

```
cysto_per_bene = services_52000 / total_unique_beneficiaries
```

**Red flag:** Above peer p90. Unusually high cystoscopy frequency per patient. Could indicate over-surveillance (scoping stable patients too often), scope-happy practice patterns, or billing issues.

**Normal range:** 0.2-0.5 cystoscopies per patient per year. Not every urology patient needs a scope, and those who do typically get one per year (bladder cancer surveillance) or one at initial workup.

**Context:** Cystoscopy is the most common in-office urologic procedure. It is also the most over-scrutinized by payers. A high cysto-per-bene ratio will attract audit attention. This red flag matters because it represents both a quality signal and a compliance risk.


### 7E. Biopsy Without PSA

Provider performs prostate biopsies but never orders PSA.

```
biopsy_without_psa = services_55700 > 5 AND services_84153 = 0
```

**Red flag:** Provider performs more than 5 biopsies per year but has zero PSA orders. This is an unusual clinical workflow. Prostate biopsy is almost always preceded by PSA testing (either initial elevation or surveillance). A provider who biopsies without ordering PSA may be receiving PSA results from the referring physician, but the complete absence of PSA billing is notable.

This is a binary flag, not a ratio. It fires or it doesn't.


### 7F. Single-Code Dominance

Is any one code an unusually large share of the provider's total billing?

```
For each HCPCS code billed by this NPI:
    code_pct = services_for_code / total_services

max_code_pct = MAX(code_pct)
dominant_code = the HCPCS code with the highest code_pct
```

**Red flag:** `max_code_pct` > 35% AND dominant code is NOT 99214. In urology, 99214 is expected to be the highest-volume single code. Any other code dominating more than 35% of total billing is unusual. If 99213 is at 40%, the provider may be a general urology practice coding more like primary care. If 52000 is at 40%, the provider may be a scope-only practice.

**Normal:** For most urologists, 99214 will be 15-25% of total services, with the rest spread across diagnostic and procedural codes.


### 7G. E/M Complexity Trend (Multi-Year)

Is the provider's E/M complexity increasing year over year faster than peers?

```
For each year in [2021, 2022, 2023]:
    high_complexity_pct_year = (services_99214 + services_99215) / total_em_services

complexity_trend = high_complexity_pct_2023 - high_complexity_pct_2021
peer_median_trend = MEDIAN(complexity_trend) across peer cohort
```

**Red flag:** Provider's complexity trend is above peer p90. Their E/M billing is escalating faster than peers. Could indicate progressive upcoding.

**Neutral:** Trend within p25-p75 of peers. Some upward drift is normal (CMS documentation changes in 2021 shifted coding patterns nationally, and urology practices adjusted like everyone else).

Note: Requires multi-year data. The Medicaid Provider Spending file covers 2018-2024, so this is computable.


### 7H. Procedure Volume Without Office Visits

Does the provider bill many procedures but very few office visits?

```
procedure_heavy = (services_52000 + services_55700 + therapeutic_cysto_services) > 50
                  AND total_em_visits < 20
```

**Red flag:** Provider bills more than 50 diagnostic and therapeutic procedures but fewer than 20 office visits. This suggests a facility-only practice being scored as an office practice, or a billing anomaly. A urologist who scopes, biopsies, and treats should also be seeing those patients in the office for consultation and follow-up.

**Context:** Some urologists work primarily in hospital settings or ASCs and bill their professional component there while another provider handles office visits. This is a valid practice model but should be identified and scored differently from an office-based urologist.


### 7I. After-Hours Billing Rate

```
after_hours_pct = services_99051 / total_em_visits
```

**Red flag:** Above peer p90. Unusually high proportion of visits billed as after-hours. Urology is rarely an after-hours specialty. Urologic emergencies (acute retention, testicular torsion, kidney stone with sepsis) go to the ER, not to the urologist's office at 9 PM.

**Neutral:** Most urologists bill 99051 at 0-1% of visits. Some may have Saturday clinics.


### 7J. G2211 Overuse

```
g2211_ratio = services_G2211 / total_established_em_visits
    -- G2211 = visit complexity inherent to evaluation and management
    -- associated with ongoing medical decision-making
```

**Red flag:** Ratio above peer p90. G2211 was introduced in 2024 as an add-on code for visit complexity inherent to ongoing care. It has been flagged nationally for overuse across all specialties. Urologists have a reasonable case for billing G2211 on many established visits (cancer surveillance, chronic BPH management), but the comparison is peer-relative. If a urologist bills G2211 at a much higher rate than other urologists, that is a signal.

**Neutral:** Between peer p25 and p75. Most urology practices are still in the process of adopting G2211.

**Green flag:** Not billed at all. Many practices have not adopted G2211 yet. No penalty.


## 8. Cross-Category Consistency Checks

These checks look for logical consistency between categories. They are not about volume but about whether the provider's code mix makes sense as a coherent urology practice.

| Check | Logic | Flag |
|---|---|---|
| Cystoscopy but no urinalysis | services_52000 > 20 AND (services_81003 + services_81001) = 0 | Red: UA is standard before cystoscopy. Performing 20+ scopes without a single urinalysis is a workflow anomaly. |
| PSA but no biopsy capability AND no cystoscopy | services_84153 > 20 AND services_55700 = 0 AND services_52000 = 0 | Yellow: screening without diagnostic follow-through. Provider orders many PSAs but has no biopsy or cystoscopy volume. May refer all diagnostic work, but unusual for general urology. |
| Prostate biopsy but no PSA | services_55700 > 5 AND services_84153 = 0 | Red: biopsies should correlate with PSA monitoring. This is the same check as 7E but captured here as a consistency flag. |
| Imaging but no cystoscopy | (services_76857 + services_76770) > 20 AND services_52000 = 0 | Yellow: unusual to have significant imaging volume but no scoping. Imaging and cystoscopy usually coexist in a urology practice. May indicate a provider who does ultrasound but refers scoping. |
| Therapeutic cystoscopy but no diagnostic cystoscopy | therapeutic_cysto_services > 10 AND services_52000 = 0 | Red: treatment without corresponding diagnostic evaluation. You should not have 10+ therapeutic cystoscopy procedures without any diagnostic cystoscopy. The diagnostic scope is the prerequisite. |
| Robotic surgery but few office visits | services_55866 > 5 AND total_em_visits < 30 | Yellow: provider does robotic prostatectomies but has minimal office follow-up volume. Could indicate a hospital-based practice where office visits are billed under a different provider. Not automatically a problem, but flags a practice model mismatch. |
| Urodynamics but no PVR | services_51741 > 5 AND services_51798 = 0 | Yellow: urodynamics (complex voiding study) without simpler PVR testing is an unusual workflow. PVR is typically the first-line test; urodynamics is the escalation. Doing the complex test without the simple one suggests an unusual referral pattern or billing gap. |


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | E/M level distribution | 5 | Red flag | Medicare + Medicaid |
| 2 | PSA-to-visit ratio | 6A | Green flag | Medicare + Medicaid |
| 3 | Cystoscopy-to-visit ratio | 6B | Green flag | Medicare + Medicaid |
| 4 | Urinalysis-to-visit ratio | 6C | Green flag | Medicare + Medicaid |
| 5 | In-office imaging-to-visit ratio | 6D | Green flag | Medicare + Medicaid |
| 6 | PVR-to-BPH-visit ratio | 6E | Green flag | Medicare + Medicaid |
| 7 | Biopsy-to-PSA ratio | 6F | Green flag | Medicare + Medicaid |
| 8 | Therapeutic-to-diagnostic cystoscopy ratio | 6G | Green flag | Medicare + Medicaid |
| 9 | Screening density (diagnostics per visit) | 6H | Green flag | Medicare + Medicaid |
| 10 | Return visit intensity | 7A | Red flag | Medicare |
| 11 | New-to-established patient ratio | 7B | Red flag | Medicare + Medicaid |
| 12 | High-complexity visit rate | 7C | Red flag | Medicare + Medicaid |
| 13 | Cystoscopy-to-beneficiary ratio | 7D | Red flag | Medicare + Medicaid |
| 14 | Biopsy without PSA | 7E | Red flag | Medicare + Medicaid |
| 15 | Single-code dominance | 7F | Red flag | Medicare + Medicaid |
| 16 | E/M complexity trend (multi-year) | 7G | Red flag | Medicare + Medicaid |
| 17 | Procedure volume without office visits | 7H | Red flag | Medicare + Medicaid |
| 18 | After-hours billing rate | 7I | Red flag | Medicare + Medicaid |
| 19 | G2211 overuse | 7J | Red flag | Medicare + Medicaid |
| 20-26 | Cross-category consistency (7 checks) | 8 | Yellow/Red | Medicare + Medicaid |

**Total: ~32 ratio checks** (8 green flags, 12 red flags, 7 cross-category consistency checks, plus E/M distribution = ~28-32 total depending on data availability).


## 10. Scoring the Ratio Analysis

Each ratio check produces a flag: green, neutral/yellow, or red. We roll them up into a single ratio analysis score.

```
ratio_checks = [all checks listed above, excluding those with insufficient data]

green_count = COUNT WHERE flag = "green"
neutral_count = COUNT WHERE flag = "neutral" OR flag = "yellow"
red_count = COUNT WHERE flag = "red"
total_checks = COUNT of all applicable checks (skip those with insufficient data)

ratio_analysis_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0))
                       / total_checks * 100
```

| Score | Interpretation |
|---|---|
| 80-100 | Most ratios are green or neutral. Practice patterns look clean. |
| 60-79 | Mixed. Some green flags, some red. Worth looking at which reds. |
| 40-59 | Multiple red flags. Billing patterns deviate from peers in several areas. |
| Below 40 | Significant red flags across multiple ratio checks. Investigate. |

Green flags can offset neutral, but cannot offset red flags in isolation. A provider with 5 greens and 3 reds is different from a provider with 5 greens and 0 reds.


---

# PART D: COMPOSITE BILLING QUALITY SCORE

---


## 11. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "TX"

STEP 1: Compute provider charge ratio
    charges = SUM(average_submitted_chrg_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023
    allowed = SUM(average_medicare_allowed_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023

    IF allowed = 0 OR total services < 10: RETURN insufficient_data

    provider_ratio = charges / allowed

STEP 2: Build peer distribution
    peer_cohort = all NPIs WHERE taxonomy = '208800000X'
        AND taxonomy NOT IN ('2088P0231X', '2088F0040X', '2088P0210X')
        AND state = "TX" AND total_medicare_services >= 10

    IF COUNT(peer_cohort) < 30: use national cohort instead

    Compute peer_p10, peer_p25, peer_median, peer_p75, peer_p90

STEP 3: Score the charge ratio
    IF peer_p25 <= provider_ratio <= peer_p75:
        charge_score = 100
    ELIF peer_p10 <= provider_ratio <= peer_p90:
        charge_score = 70
    ELSE:
        charge_score = 40

STEP 4: Flag direction
    IF provider_ratio > peer_p75:
        direction = "above_peers"
    ELIF provider_ratio < peer_p25:
        direction = "below_peers"
    ELSE:
        direction = "in_range"

STEP 5: Per-code analysis (optional)
    For each HCPCS code, compute code_deviation and flag outliers.

STEP 6: Run all ratio checks (Sections 5-8)
    For each applicable check, compute the ratio and assign a flag.

STEP 7: Compute ratio analysis score
    ratio_analysis_score = ((green * 1.0) + (neutral * 0.5) + (red * 0.0))
                            / total_checks * 100

STEP 8: Composite
    billing_quality_composite = (charge_score * 0.35) + (ratio_analysis_score * 0.65)

    IF no Medicare data for charge analysis:
        billing_quality_composite = ratio_analysis_score
```

The 35/65 weighting gives more influence to procedure ratios than to charge pricing. Pricing is a market signal. Procedure ratios are a practice quality signal. Both matter, but if we had to pick one, the ratios tell us more about how the provider actually practices.


## 12. Worked Example

Provider A in Texas. Medicare data for 2023.

**Charge analysis:**
Provider A charges $420,000 total, Medicare allowed $155,000. Ratio = **2.71x**.

**TX peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.85x | 2.25x | 2.75x | 3.40x | 4.10x |

Provider A ratio of 2.71x falls between p25 (2.25x) and p75 (3.40x). Charge score = **100**. Direction = **in_range**.

**Ratio analysis:**
Provider A's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99214 at 46%, 99215 at 11% | Within peer p25-p75 | Green |
| PSA-to-visit | 0.42 | Above peer p75 (0.35) | Green |
| Cystoscopy-to-visit | 0.28 | Above peer p75 (0.22) | Green |
| Urinalysis-to-visit | 0.55 | Between p25-p75 | Neutral |
| In-office imaging | 0.12 | Between p25-p75 | Neutral |
| PVR-to-visit | 0.18 | Above peer p75 (0.14) | Green |
| Biopsy-to-PSA | 0.15 | Between 0.05-0.30 | Green |
| Therapeutic-to-diagnostic cysto | 0.22 | Above peer p75 | Green |
| Diagnostic density | 1.05 | Above peer p75 (0.85) | Green |
| Return visit intensity | 2.8 visits/bene | Between p25-p75 | Neutral |
| New-to-established ratio | 18% | Between p25-p75 | Neutral |
| High-complexity rate | 11% 99215 | Below 20% | Neutral |
| Cysto-per-beneficiary | 0.35 | Between p25-p75 | Neutral |
| Biopsy without PSA | N/A (has both) | -- | Neutral |
| Single-code dominance | 22% (99214) | Normal | Neutral |
| E/M trend | +3% over 2 years | Within peer p25-p75 | Neutral |
| Procedure without visits | N/A (has visits) | -- | Neutral |
| After-hours billing | 0% | Normal | Neutral |
| G2211 ratio | 0.15 | Between p25-p75 | Neutral |
| Consistency checks (7) | 0 fired | -- | All neutral |

Green count: 7. Neutral count: 19. Red count: 0. Total applicable: 26.

```
ratio_analysis_score = ((7 * 1.0) + (19 * 0.5) + (0 * 0.0)) / 26 * 100
                     = (7.0 + 9.5 + 0) / 26 * 100
                     = 16.5 / 26 * 100
                     = 63.5
```

```
billing_quality_composite = (100 * 0.35) + (63.5 * 0.65)
                          = 35.0 + 41.3
                          = 76.3
```

Provider A scores **76.3** on billing quality. Clean charge ratio, mostly neutral ratios with several green flags. No red flags. This is a solid, unremarkable billing profile for a general urologist.

---

Provider B in Texas.

**Charge analysis:**
Provider B charges $680,000 total, Medicare allowed $130,000. Ratio = **5.23x**.

Same TX peer anchors. Provider B ratio of 5.23x is above p90 (4.10x). Charge score = **40**. Direction = **above_peers**.

Per-code analysis shows: 52000 at 7.1x peer median (flagged), 99214 at 5.8x peer median (flagged), most other codes also above 3x. Provider B's pricing is consistently aggressive across the board, not driven by one code.

**Ratio analysis:**
Provider B's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99214 at 38%, 99215 at 24% | 99215 above 20% | Red |
| PSA-to-visit | 0.08 | Below peer p25 | Signal |
| Cystoscopy-to-visit | 0.52 | Above peer p90 | Neutral (high is not bad for green) |
| Urinalysis-to-visit | 0.10 | Below peer p25 | Signal |
| In-office imaging | 0.05 | Below peer p25 | Signal |
| PVR-to-visit | 0.04 | Below peer p25 | Signal |
| Biopsy-to-PSA | 0.62 | Above 0.30 | Signal |
| Therapeutic-to-diagnostic cysto | 0.55 | Above 0.50 upper bound | Signal |
| Diagnostic density | 0.40 | Below peer p25 | Signal |
| Return visit intensity | 5.1 visits/bene | Above peer p90 | Red |
| New-to-established ratio | 6% | Near zero, below p10 | Red |
| High-complexity rate | 24% 99215 | Above 20% | Red |
| Cysto-per-beneficiary | 0.72 | Above peer p90 | Red |
| Biopsy without PSA | N/A (has both) | -- | Neutral |
| Single-code dominance | 38% (52000) | Non-99214 code >35% | Red |
| E/M trend | +8% over 2 years | Above peer p90 | Red |
| Procedure without visits | N/A (has visits) | -- | Neutral |
| After-hours billing | 4% | Above peer p90 | Red |
| G2211 ratio | 0.65 | Above peer p90 | Red |
| Cystoscopy but no UA | Fires (52000 > 20, UA = 0) | -- | Red |
| Other consistency checks | 1 more fires | -- | Yellow |

Green count: 0. Neutral count: 10. Red count: 10. Yellow count: 1. Total applicable: 26 (including consistency).

```
ratio_analysis_score = ((0 * 1.0) + (11 * 0.5) + (10 * 0.0)) / 26 * 100
                     = 5.5 / 26 * 100
                     = 21.2
```

```
billing_quality_composite = (40 * 0.35) + (21.2 * 0.65)
                          = 14.0 + 13.8
                          = 27.8
```

Provider B scores **27.8** on billing quality. Aggressive pricing, 24% 99215, excessive cystoscopy per patient, patients returning 5x per year, scoping without urinalysis, after-hours billing in a 9-to-5 specialty. This is not one red flag, it is a pattern. Every dimension of this provider's billing is unusual.


---

# PART E: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **AUA Guidelines Concordance** | Does this provider follow AUA guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal urologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is practice consistent across payers? | Access proxy |
| **Billing Quality** | Are their charges, ratios, and E/M distribution in line with peers? | Pricing + integrity check |

Billing quality is the integrity layer. It checks pricing behavior (charge-to-allowed) AND practice pattern behavior (procedure ratios). A provider can score well on the other four scores but get flagged here for upcoding, unusual cystoscopy frequency, or pricing outliers.

| Scenario | Guidelines | Peer | Volume | Payer | Billing |
|---|---|---|---|---|---|
| Good urologist, normal billing | High | High | High | High | High |
| Good urologist, aggressive pricing | High | High | High | High | Low (charge ratio outlier) |
| Provider upcoding E/M levels | High | High | High | High | Low (red flag on E/M distribution) |
| Provider who scopes excessively | High | High (bills the codes) | High (volume is real) | High | Low (red flag on cysto-per-bene ratio) |
| Cancer-focused practice, clean billing | High | Medium (skewed code mix) | High | High | High (ratios explained by case mix) |
| Low-quality provider, clean billing | Low | Low | Low | Low | High |

The green and red flags in this doc add nuance the other scores miss. A provider with a great peer comparison score (they bill all the right codes) but whose cysto-per-beneficiary ratio is in the 95th percentile is scoping patients too often. The volume adequacy doc sees "high cystoscopy volume" as potentially adequate. This doc asks "is that cystoscopy volume reasonable relative to the number of patients?"

Similarly, a provider who follows AUA guidelines on paper but bills 99215 for 25% of visits is claiming their patients are more complex than what 90% of urologists see. That might be true for a specialty cancer center. For a general urologist in a mixed practice, it is a red flag.


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed analysis uses Medicare data, which is STRONG for urology.** Unlike pediatrics, where Medicare coverage is minimal, urology patients are predominantly Medicare-age. The charge-to-allowed analysis covers the bulk of most urologists' practice. This is a strength of the urology billing quality score compared to pediatrics.

**Procedure ratios use aggregated data, not same-day linkage.** We cannot confirm that a specific PSA was ordered on the same day as a specific office visit. We can only check whether the total volumes are proportional. Some ideal checks (did the provider do UA before every cystoscopy?) require claims-level data and are reserved for MA APCD or similar.

**E/M distribution is higher complexity for urology than primary care, and that is expected.** The benchmarks in this doc are calibrated to urology peers. A 99214 dominance rate of 45% is normal in urology, not a red flag. We compare to urologists, not to all providers. Anyone applying primary care E/M benchmarks to urology will generate false positives.

**Case mix affects ratios.** A cancer-focused urology practice will have different ratios than a BPH-focused practice. A urologist at a VA hospital will differ from one in private practice. Without diagnosis codes, we cannot adjust for case mix. Peer comparisons assume the average urologist sees a mix of conditions. Specialty-focused providers will deviate. Red flags need investigation, not automatic penalty.

**A red flag is not an accusation.** It means a ratio is statistically unusual compared to peers. There may be a valid explanation. A provider with high cystoscopy-per-beneficiary might run a bladder cancer surveillance clinic where annual scoping is the standard of care. The score surfaces signals for investigation, not verdicts.

**Geographic variation affects all ratios.** State Medicaid policy, local referral patterns, and urban/rural differences all shape billing patterns. State-level peer grouping captures most of this. Sub-state grouping (ZIP-3 or CBSA) would help.

**Subspecialist exclusion may not be perfect.** Some urologists with subspecialty training bill under the general urology taxonomy code. A female pelvic medicine specialist billing under 208800000X will look different from a general urologist. The taxonomy filter catches most subspecialists but not all.

**Facility vs. office billing matters.** Some urologists split their time between office and hospital/ASC. Their office billing may look low-volume while their total practice is high-volume. The "procedure volume without office visits" red flag (7H) attempts to catch this, but a provider who legitimately practices in multiple settings may be unfairly flagged.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| **Identity & Geography** | | |
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code, derived from ZIP |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used |
| peer_cohort_state | string | State of the peer cohort (or "US" if national) |
| peer_cohort_size | int | Number of peers in the cohort |
| **Charge-to-Allowed (Medicare only)** | | |
| total_medicare_services | int | Total Medicare services for this NPI |
| total_charges | float | SUM(avg_charge * services) across all codes |
| total_allowed | float | SUM(avg_allowed * services) across all codes |
| charge_to_allowed_ratio | float | total_charges / total_allowed |
| charge_peer_p10 | float | 10th percentile of peer cohort ratios |
| charge_peer_p25 | float | 25th percentile |
| charge_peer_median | float | 50th percentile |
| charge_peer_p75 | float | 75th percentile |
| charge_peer_p90 | float | 90th percentile |
| charge_score | float | 100 (p25-p75), 70 (p10-p90), or 40 (outside p90) |
| charge_direction | string | "in_range", "above_peers", or "below_peers" |
| outlier_code_count | int | HCPCS codes where charge ratio > 2x or < 0.5x peer median |
| outlier_code_list | string | Comma-separated outlier HCPCS codes |
| **E/M Distribution** | | |
| em_99211_pct | float | % of office visits billed as 99211 |
| em_99212_pct | float | % of office visits billed as 99212 |
| em_99213_pct | float | % of office visits billed as 99213 |
| em_99214_pct | float | % of office visits billed as 99214 |
| em_99215_pct | float | % of office visits billed as 99215 |
| em_high_complexity_pct | float | (99214 + 99215) / total E/M visits |
| em_distribution_flag | string | "green", "yellow", or "red" |
| **Green Flag Ratios** | | |
| psa_to_visit_ratio | float | 84153 / total established E/M visits |
| psa_flag | string | "green", "neutral", or "signal" |
| cysto_to_visit_ratio | float | 52000 / total E/M visits |
| cysto_visit_flag | string | Flag |
| ua_to_visit_ratio | float | (81003 + 81001) / total E/M visits |
| ua_flag | string | Flag |
| imaging_to_visit_ratio | float | (76857 + 76770) / total E/M visits |
| imaging_flag | string | Flag |
| pvr_to_visit_ratio | float | 51798 / total established E/M visits |
| pvr_flag | string | Flag |
| biopsy_to_psa_ratio | float | 55700 / 84153 |
| biopsy_psa_flag | string | Flag |
| therapeutic_to_diagnostic_cysto_ratio | float | (52214 + 52234 + 52310 + 52281 + 52287) / 52000 |
| therapeutic_cysto_flag | string | Flag |
| diagnostic_density | float | (52000 + 84153 + 81003 + 76857 + 51798) / total E/M visits |
| diagnostic_density_flag | string | Flag |
| **Red Flag Ratios** | | |
| visits_per_beneficiary | float | Total E/M services / unique beneficiaries |
| return_visit_flag | string | "green", "neutral", or "red" |
| new_patient_pct | float | New patient visits / total E/M visits |
| new_patient_flag | string | Flag |
| high_complexity_pct | float | 99215 / total E/M visits |
| high_complexity_flag | string | Flag |
| cysto_per_beneficiary | float | 52000 / unique beneficiaries |
| cysto_per_bene_flag | string | Flag |
| biopsy_without_psa | boolean | 55700 > 5 AND 84153 = 0 |
| biopsy_without_psa_flag | string | Flag |
| max_single_code_pct | float | Highest single-code % of total services |
| single_code_dominance_flag | string | Flag |
| em_complexity_trend | float | Change in high-complexity % from earliest to latest year |
| em_trend_flag | string | Flag (multi-year) |
| procedure_without_visits | boolean | (52000 + 55700 + therapeutic) > 50 AND total E/M < 20 |
| procedure_without_visits_flag | string | Flag |
| after_hours_pct | float | 99051 / total E/M visits |
| after_hours_flag | string | Flag |
| g2211_ratio | float | G2211 / total established E/M visits |
| g2211_flag | string | Flag |
| **Cross-Category Consistency** | | |
| consistency_flags | int | Count of cross-category consistency checks that fired (0-7) |
| consistency_flag_list | string | Comma-separated names of fired consistency checks |
| **Composite** | | |
| total_checks_run | int | Number of ratio checks with sufficient data to evaluate |
| green_flag_count | int | Number of ratio checks flagged green |
| neutral_flag_count | int | Number flagged neutral/yellow |
| red_flag_count | int | Number of ratio checks flagged red |
| ratio_analysis_score | float | Weighted roll-up of all ratio flags (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score (or ratio only if no Medicare) |
