# Internal Medicine Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other four docs ask about clinical practice: does this provider follow ACOG/ACP concordance guidelines, do they look like a normal internist, is their volume believable, is their billing consistent across payers? This doc asks about billing behavior: do the ratios between this provider's services look normal?

We check three things:
1. **Charge-to-allowed ratios** -- is their pricing in line with peers?
2. **Service-to-service ratios** -- do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that shouldn't go together, or go together too often)?
3. **E/M level distribution** -- are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against state-level cohorts by default.

Important context for internal medicine: this is an E/M-dominant specialty. Unlike urology or dermatology where procedural codes create diverse ratio signals, internal medicine billing is overwhelmingly office visits, preventive care, and care coordination. The billing quality signals here are about preventive care integration, screening adoption, and visit complexity patterns, not procedural ratios. Medicare data is STRONG for internal medicine because the patient panel skews heavily toward older adults with chronic conditions. The benchmarks in this doc reflect that reality.


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
| provider_type | Filter to Internal Medicine |

**CMS Medicaid Provider Spending** -- for additional service volume

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The service ratio analysis (Sections 2-4) uses both files combined, giving us full internal medicine volume.

**Medicare data is the primary data source for internal medicine.** The typical internist's patient panel skews heavily Medicare-age. Diabetes management, hypertension follow-up, heart failure monitoring, COPD management, hyperlipidemia, obesity counseling -- these conditions concentrate in patients 50+. Most general internists see far more Medicare patients than Medicaid patients. This means our charge-to-allowed analysis covers a significant share of most internists' practice.

**Medicaid adds moderate volume.** Some internal medicine practices serve dual-eligible populations or younger Medicaid patients. Both datasets are used for the service ratio analysis to capture the full picture.


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

A ratio of 2.0x means the provider charges, on average, twice what Medicare allows. For internal medicine, this is typical. As a primary care specialty with low procedural volume, charge ratios tend to be lower than procedural specialties like urology or orthopedics. Internal medicine fee schedules are dominated by E/M codes, where charge variation is narrower than for surgical or procedural codes.


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual. Could indicate a practice that has never updated its fee schedule, or one that primarily serves government-payer patients with no commercial rate negotiation. |
| 1.3x - 1.8x | Low end of normal for internal medicine. Less aggressive pricing, possibly in a lower-cost market or a practice that has not updated charges recently. |
| 1.8x - 2.5x | Typical range for most internists. Reflects normal commercial rate negotiations and standard fee schedule markups for a primary care specialty. |
| 2.5x - 3.5x | Higher than typical for internal medicine. May reflect a high-cost metro market (NYC, SF, Boston), a practice with strong commercial payer leverage, or an internist who performs more procedures than average. |
| >3.5x | Outlier for internal medicine. Worth investigating. Could be billing errors, a practice that has never reconciled its fee schedule, or a single high-charge code distorting the average. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Could be data error or an unusual payment arrangement. |

Note the difference compared to procedural specialties: the entire distribution runs lower for internal medicine. A charge ratio of 2.5x that would be solidly median for a urologist is at the high end for an internist. This is expected. E/M-dominant billing produces narrower charge variation.


## 2. Building the Peer Distribution

The peer distribution is what makes this score meaningful. A ratio of 2.1x means nothing in isolation. It means something when you know the peer median is 2.0x.


### Geographic Grouping

Charge-to-allowed ratios vary significantly by geography because of differences in cost of living, commercial payer rates, and local market dynamics. An internist in Manhattan charging 3.0x may be normal for that market. An internist in rural Mississippi charging 3.0x is an outlier.

Peer distributions are built at the **state level** by default:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All internal medicine NPIs (taxonomy 207R00000X, >= 10 Medicare services) in the same state | Primary scoring. Captures local market pricing norms. |
| **National** | All states combined | Secondary benchmark. Cross-state comparison: "how does IM pricing in FL compare to CA?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | When state cohorts are large enough. Urban vs. rural have very different pricing dynamics. |

The minimum peer cohort size is 30 providers. If a state has fewer than 30 internal medicine NPIs with Medicare data, fall back to national. In practice this almost never happens for internal medicine because it is one of the largest specialties in every state.

**Taxonomy filter:** We use 207R00000X (Internal Medicine) and explicitly exclude all subspecialists:
- 207RC0000X (Cardiovascular Disease / Cardiology)
- 207RE0101X (Endocrinology, Diabetes & Metabolism)
- 207RG0100X (Gastroenterology)
- 207RG0300X (Geriatric Medicine)
- 207RH0003X (Hematology & Oncology)
- 207RI0200X (Infectious Disease)
- 207RN0300X (Nephrology)
- 207RP1001X (Pulmonary Disease)
- 207RR0500X (Rheumatology)
- 207RC0200X (Critical Care Medicine)
- 207RX0202X (Medical Oncology)
- 207RS0010X (Sports Medicine)
- 207RS0012X (Sleep Medicine)
- 207RH0000X (Hematology)

We exclude these because their case mix, visit complexity, and billing patterns differ substantially from general internal medicine. A cardiologist's code mix looks nothing like a general internist's. A nephrologist billing under an IM taxonomy would distort peer comparisons with their procedure codes (dialysis, vascular access). A hospitalist internist also has a completely different billing pattern (discussed in Risks, Part F). We want the peer cohort to represent general, office-based internal medicine.


### Computing Peer Anchors

From the state-level peer cohort, compute the following percentile anchors:

```
peer_cohort = all internal medicine NPIs in the same state
    WHERE taxonomy_code = '207R00000X'
    AND taxonomy_code NOT IN (
        '207RC0000X', '207RE0101X', '207RG0100X', '207RG0300X',
        '207RH0003X', '207RI0200X', '207RN0300X', '207RP1001X',
        '207RR0500X', '207RC0200X', '207RX0202X', '207RS0010X',
        '207RS0012X', '207RH0000X'
    )
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio across peer_cohort
peer_p25 = 25th percentile
peer_median = 50th percentile (median)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Example peer anchors (national internal medicine, illustrative):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.30x |
| p25 | ~1.60x |
| Median | ~2.00x |
| p75 | ~2.40x |
| p90 | ~2.80x |

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
| Normal | p25 to p75 | 100 | Provider's pricing is within the typical range for IM peers in this state. No signal. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | Provider is in the tails of the peer distribution but not extreme. Could reflect market positioning, not a problem. |
| Outlier | Below p10 or above p90 | 40 | Provider's pricing is significantly different from peers. Worth investigating. Not an automatic fail. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 1.9x is not "better" than 2.2x in any clinical sense. Both are normal. The purpose of this score is to flag outliers, not to rank providers. A three-band system (normal / somewhat unusual / outlier) communicates this clearly: you are either in line with peers, at the edge, or outside the norm.


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

This layer answers: "is the provider's pricing outlier status driven by one or two codes, or is it across the board?" An internist who charges 4x the peer median for G0438 (initial AWV) but is normal on everything else has a different story from one who is 3x+ on every code.

This per-code analysis is less revealing in internal medicine than in procedural specialties because the code mix is dominated by E/M visits and preventive care codes. Charge variation across E/M codes is narrower than across surgical codes. Still, it helps identify providers with one or two wildly overpriced services distorting the overall ratio.


---

# PART C: SERVICE RATIO ANALYSIS (Green Flags and Red Flags)

---

Charge-to-allowed is about pricing. This section is about the relationships between services. Certain code ratios reveal practice quality, and certain combinations are warning signs. All of these use HCPCS volumes from both Medicare and Medicaid combined.

This is where internal medicine billing quality scoring is fundamentally different from procedural specialties. In urology, the ratios compare procedures to procedures (cystoscopy-to-biopsy, imaging-to-visit). In internal medicine, the ratios compare preventive care to total care, screening adoption to visit volume, and care coordination to patient complexity. The billing quality signals for internal medicine are about whether the provider integrates preventive services, screens appropriately, and manages chronic disease with structured programs, not whether their procedural ratios make anatomical sense.


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

**What normal looks like in internal medicine:**

| Code | Level | Typical Peer Distribution |
|---|---|---|
| 99211 | Minimal (nurse visit) | ~2-4% |
| 99212 | Straightforward | ~2-5% |
| 99213 | Low complexity | ~30-38% |
| 99214 | Moderate complexity | ~38-48% (the dominant code) |
| 99215 | High complexity | ~6-12% |

**99214 should be the most-billed code for a general internist.** This is a critical distinction. Internal medicine patients are inherently more complex than typical primary care pediatric or family medicine visits. The average internist manages multiple simultaneous chronic conditions in the same patient: diabetes plus hypertension plus hyperlipidemia plus obesity plus depression plus osteoarthritis. That is moderate complexity by definition. The 2021 E/M documentation changes reinforced this reality by emphasizing medical decision-making, which favors multi-morbidity management.

A general internist whose E/M distribution looks like a pediatrician's (99213 dominant) is the unusual one, not the other way around. Be careful not to apply low-complexity primary care benchmarks to internal medicine.

That said, internal medicine is NOT a surgical specialty. Higher 99215 usage than pediatrics or dermatology is expected, but 99215 should not dominate.

**Red flag:** Provider's 99215 alone exceeds 18% of E/M volume. Even for internal medicine with its multi-morbidity burden, very high complexity visits should not be the norm. Cancer management, complex multi-organ disease, or end-of-life care discussions may legitimately reach 12-15%, but sustained 18%+ is unusual for a general internist.

**Red flag:** Provider's 99214 + 99215 combined is above the peer p90. This means they bill at higher complexity than 90% of internal medicine peers. Possible explanations: upcoding, or a genuinely complex panel (hospice-adjacent, HIV-focused, complex multi-morbidity). The red flag is about deviation from peers, not absolute levels.

**Green flag:** Provider's distribution closely matches peer median (all levels within 10 percentage points of peer median).

```
high_complexity_pct = (services_99214 + services_99215) / em_total

peer_p90_high_complexity = 90th percentile of high_complexity_pct across peer cohort

em_distribution_flag = "red"  IF high_complexity_pct > peer_p90_high_complexity
                      "yellow" IF high_complexity_pct > peer_p75_high_complexity
                      "green"  IF high_complexity_pct <= peer_p75_high_complexity
```

Note: because 99214 dominates in internal medicine, the "high complexity" combined percentage (99214 + 99215) will typically run 45-60% of E/M volume. This is normal. The comparison is always against internal medicine peers, not against all specialties.


## 6. Green Flag Ratios (Good Practice Signals)

These ratios indicate a provider is doing things right. High ratios compared to peers are positive signals. In internal medicine, the green flags center on preventive care, screening, and structured chronic disease management. These are the markers of a high-quality primary care internist, not procedural throughput.


### 6A. Preventive-to-Total Visit Ratio

Does the provider incorporate preventive care into their practice, or is it all acute and chronic disease management?

```
preventive_services = services for codes 99385-99397 + G0438 + G0439
    -- 99385-99387 = initial preventive visit (new patient, by age)
    -- 99391-99397 = periodic preventive visit (established patient, by age)
    -- G0438 = initial Annual Wellness Visit (AWV), Medicare
    -- G0439 = subsequent Annual Wellness Visit (AWV), Medicare

total_visit_services = preventive_services + total_em_visits (99211-99215)

preventive_ratio = preventive_services / total_visit_services
```

**Green flag:** Ratio above peer p75. Practice is prevention-oriented. This provider does not just manage disease. They schedule and bill for dedicated preventive visits, not as an afterthought tacked onto a sick visit, but as standalone encounters. This is a strong quality signal in internal medicine because the evidence base for primary and secondary prevention in older adults is deep (cancer screening, cardiovascular risk reduction, immunization, fall prevention).

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does almost no preventive care relative to total visits. Could be a hospitalist, a subspecialist billing under the general IM taxonomy, or a practice that simply does not prioritize prevention.


### 6B. Depression Screening to Visit Ratio

Does the provider routinely screen for depression?

```
depression_screening = services_96127 + services_G0444
    -- 96127 = brief emotional/behavioral assessment (includes PHQ-2, PHQ-9)
    -- G0444 = annual depression screening, Medicare

depression_ratio = depression_screening / total_em_visits
```

**Green flag:** Ratio above peer p75. Provider routinely screens for depression. Depression is underdiagnosed in older adults and in patients with chronic medical conditions. The USPSTF recommends screening for depression in the general adult population. An internist who bills depression screening codes at high volume is following evidence-based practice and catching cases that would otherwise be missed.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider screens less than most peers. Could indicate screening is done informally without billing, or that depression screening is not part of the workflow.

Note: Some practices perform PHQ-2/PHQ-9 but do not bill 96127 or G0444 separately. The billing code is a proxy for screening, not a perfect measure. Still, providers who bill these codes are documenting the screening in a structured, reimbursable way.


### 6C. Immunization to Visit Ratio

Does the provider administer immunizations in the office?

```
immunization_ratio = services_90471 / total_em_visits
    -- 90471 = immunization administration (first component)
```

**Green flag:** Ratio above peer p75. Provider vaccinates patients. In internal medicine, office-based vaccination is a quality marker because the adult immunization schedule is complex and underutilized. Flu, pneumococcal (PCV20/PPSV23), shingles (Zoster), Tdap, COVID, hepatitis B for at-risk patients -- an internist who administers vaccines at high volume is closing gaps in preventive care that pharmacy-only vaccination misses.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider rarely administers vaccines. Could indicate the practice refers patients to pharmacy for vaccination, or that the practice does not stock vaccines. Not inherently bad, but less integrated care.

Note: Seasonal variation is expected. Flu vaccination drives a spike in 90471 billing from September to March. Year-round immunization volume is the stronger signal.


### 6D. Health Risk Assessment to Preventive Visit Ratio

Does the provider use standardized health risk assessments during preventive visits?

```
hra_ratio = services_96160 / total_preventive_visits
    -- 96160 = patient-focused health risk assessment instrument
    -- total_preventive_visits = services for 99385-99397 + G0438 + G0439
```

**Green flag:** Ratio above peer p75. Provider uses standardized health risk assessments. HRAs are a structured way to capture patient-reported data on lifestyle, family history, functional status, and social determinants. Using them at preventive visits indicates a systematic approach to prevention, not just a cursory "how are you feeling?"

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25 or zero. Many practices do not bill 96160 separately. This code is newer and adoption varies. Low volume is common and not a strong negative signal.


### 6E. Medicare AWV to Medicare Beneficiary Ratio

Does the provider conduct Annual Wellness Visits for their Medicare patients?

```
awv_ratio = (services_G0438 + services_G0439) / total_medicare_beneficiaries
    -- G0438 = initial AWV
    -- G0439 = subsequent AWV
    -- total_medicare_beneficiaries from "By Provider" file
```

**Green flag:** Ratio above peer p75. Provider has adopted Medicare wellness visits. The AWV is a Medicare-specific preventive benefit that covers health risk assessment, personalized prevention plan, and advance care planning discussion. An internist who schedules AWVs at high volume relative to their panel is maximizing a free (no cost-sharing) benefit for their Medicare patients. This is one of the strongest quality signals in internal medicine billing because it directly measures preventive care adoption for the population most at risk.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does few AWVs relative to their Medicare panel. Could indicate a practice that has not adopted AWV workflows, or one where AWVs are performed by NPs/PAs billing under their own NPIs.


### 6F. Flu Vaccine to Visit Ratio

Does the provider give flu shots?

```
flu_ratio = services_90686 / total_em_visits
    -- 90686 = influenza virus vaccine, quadrivalent, preservative-free
```

**Green flag:** Ratio above peer p75. Provider gives flu shots. For an internal medicine practice serving older adults, in-office flu vaccination is a basic quality expectation. High flu vaccine volume indicates the practice stocks vaccines and proactively administers them during visits rather than deferring to pharmacy.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider rarely bills flu vaccine codes. May refer to pharmacy, or may not stock flu vaccine.

Note: Seasonal variation is expected. This ratio will be much higher in Q4/Q1 billing periods. Annual totals smooth this. Code 90686 is the most common flu vaccine code for adults, but 90688 and others may also appear. A more complete analysis would capture all flu vaccine codes, but 90686 covers the majority.


### 6G. G2211 Usage Rate

Does the provider bill the visit complexity add-on appropriately?

```
g2211_ratio = services_G2211 / total_established_em_visits
    -- G2211 = visit complexity inherent to evaluation and management
    -- total_established_em_visits = SUM(services) for 99211-99215
```

**Green flag:** Ratio between peer p25 and p75. Normal care coordination billing. G2211 was introduced in 2024 as an add-on code for visit complexity inherent to ongoing care. Internal medicine has a strong case for G2211 because most established visits involve ongoing longitudinal management of chronic conditions. A ratio within the peer range means the provider has adopted G2211 at a normal rate.

**Neutral:** Zero billing. Many practices have not adopted G2211 yet. No penalty for non-adoption.

**Red flag:** Ratio above peer p90. G2211 overuse has been flagged nationally across all specialties. Even though IM has a legitimate case for high G2211 usage, being far above peers is a signal. If a provider bills G2211 on 95% of established visits while peers average 40%, that is unusual.


### 6H. CCM Adoption

Does the provider bill for Chronic Care Management?

```
ccm_ratio = services_99490 / total_unique_beneficiaries
    -- 99490 = Chronic Care Management, first 20 minutes per calendar month
```

**Green flag:** Any billing above 0 and within peer range. CCM (99490) indicates the practice has adopted structured chronic disease management. This code covers non-face-to-face time spent on care coordination for patients with two or more chronic conditions. It requires a documented care plan and patient consent. Billing CCM means the practice has invested in the infrastructure (care coordinators, workflows, documentation) to manage chronic disease beyond the office visit. This is a powerful quality signal in internal medicine because the specialty's core mission is chronic disease management.

**Neutral:** Zero billing. Many practices have not adopted CCM. It requires workflow changes, patient consent processes, and often dedicated staff. Absence is not a penalty because adoption is still growing nationally.

**Signal:** Above peer p90. Unusually high CCM billing relative to panel size. Could indicate aggressive billing for CCM without corresponding care infrastructure, or a practice that has optimized CCM capture. Not automatically red, but worth peer comparison.


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

Note: internal medicine patients with multiple chronic conditions do come back more than the average primary care patient. Diabetes requires quarterly A1c monitoring, heart failure requires volume status checks, warfarin patients need INR monitoring. A typical internist sees patients 3-5 times per year. But if a provider's per-beneficiary visit rate is in the top 10% of internists, that is still unusual within the specialty. High return visit intensity without corresponding preventive care or screening is an especially concerning pattern.


### 7B. New-to-Established Patient Ratio

What proportion of visits are new patients vs. established?

```
new_patient_pct = (services_99202 + services_99203 +
                   services_99204 + services_99205) / total_em_services
```

**Red flag (high):** New patient percentage above peer p90. Could indicate high patient turnover (patients leaving the practice), or a practice that codes established patients as new (billing error or fraud).

**Red flag (very low):** New patient percentage near zero. Could indicate a closed panel or a practice not accepting new patients. Not a billing issue, but a signal about practice accessibility.

For internal medicine, new patient visits typically run 8-20% of total E/M volume. Most visits are established patients returning for chronic disease management. A healthy practice has steady but moderate new patient flow.


### 7C. High-Complexity Visit Rate

Does the provider bill 99215 at an unusually high rate?

```
high_complexity_pct = services_99215 / total_em_services
```

**Red flag:** Above 18% of E/M volume. Even for internal medicine with its multi-morbidity burden, 99215 should be uncommon. A 99215 visit requires high-complexity medical decision-making, typically involving multiple conditions with significant risk of morbidity or mortality. Most internal medicine visits, including management of three to four chronic conditions, are appropriately coded as 99214. Sustained 18%+ is unusual for a general internist.

**Neutral:** 6-12% range. This is typical for internal medicine. Some complex panels (geriatric, HIV, transplant follow-up) will run toward the higher end.

**Green:** Below 8% while maintaining normal 99214 volume. Provider bills conservatively.

Context: The national conversation around E/M upcoding has focused on the rise in 99214 and 99215 billing across all specialties since the 2021 documentation changes. Internal medicine was already moderate-to-high complexity before those changes. We compare to internal medicine peers only, not to all specialties.


### 7D. Preventive Visits Without Screening

Provider bills preventive visits but never screens for anything.

```
preventive_no_screening = total_preventive_visits > 50
    AND (services_96127 + services_G0444 + services_96160) = 0
```

**Red flag:** Provider bills more than 50 preventive visits per year but has zero depression screening, zero annual depression screening, and zero health risk assessment codes. Preventive visits should include structured screening. Billing a wellness visit without any screening component suggests the visit is not actually delivering preventive content, or the screening is not being documented and billed in a structured way.

This matters because Medicare AWVs specifically require a health risk assessment. An internist billing G0438/G0439 at volume but with zero 96160/96127 codes may not be meeting the AWV documentation requirements.


### 7E. Screening Without Preventive Visits

Provider bills depression screening codes but has no preventive visit structure.

```
screening_no_preventive = (services_96127 + services_G0444) > 10
    AND total_preventive_visits = 0
```

**Red flag:** Provider bills depression screening at meaningful volume but has zero preventive visits (no 99385-99397, no G0438, no G0439). This is not inherently wrong -- depression screening can and should happen at regular E/M visits. But it is unusual to have structured screening codes without any preventive visit framework. It could indicate that screening codes are being added to regular visits for reimbursement without a corresponding preventive care workflow.


### 7F. Single-Code Dominance

Is any one code an unusually large share of the provider's total billing?

```
For each HCPCS code billed by this NPI:
    code_pct = services_for_code / total_services

max_code_pct = MAX(code_pct)
dominant_code = the HCPCS code with the highest code_pct
```

**Red flag:** `max_code_pct` > 30% AND dominant code is NOT 99214. In internal medicine, 99214 is expected to be the highest-volume single code, and it can legitimately account for 30-40%+ of total services because E/M visits dominate the code mix. Any other code dominating more than 30% of total billing is unusual. If 99213 is at 35%, the provider may be undercoding. If G2211 is at 35%, the add-on code should not exceed the base visit codes.

**Normal:** For most internists, 99214 will be 25-40% of total services, with the rest spread across other E/M levels, preventive codes, and ancillary services.


### 7G. E/M Complexity Trend (Multi-Year)

Is the provider's E/M complexity increasing year over year faster than peers?

```
For each year in [2021, 2022, 2023]:
    high_complexity_pct_year = (services_99214 + services_99215) / total_em_services

complexity_trend = high_complexity_pct_2023 - high_complexity_pct_2021
peer_median_trend = MEDIAN(complexity_trend) across peer cohort
```

**Red flag:** Provider's complexity trend is above peer p90. Their E/M billing is escalating faster than peers. Could indicate progressive upcoding.

**Neutral:** Trend within p25-p75 of peers. Some upward drift is normal (CMS documentation changes in 2021 shifted coding patterns nationally, and internal medicine practices adjusted like everyone else).

Note: Requires multi-year data. The Medicaid Provider Spending file covers 2018-2024, so this is computable.


### 7H. AWV Without Follow-Through

Provider bills Annual Wellness Visits but does no screening.

```
awv_no_screening = (services_G0438 + services_G0439) > 20
    AND (services_96127 + services_G0444 + services_96160) = 0
```

**Red flag:** Provider bills more than 20 AWVs but has zero depression screening and zero health risk assessment codes. The AWV benefit explicitly requires a health risk assessment (HRA) and screening components. Billing AWVs without any corresponding screening codes suggests either (a) the AWV is not being performed to CMS specifications, or (b) the screening documentation is not being captured in billable codes.

This is a compliance concern as much as a quality concern. CMS has audited AWV claims for documentation completeness. An internist billing AWVs at volume should have corresponding 96127 (depression screen), G0444 (annual depression screening), or 96160 (HRA) codes.


### 7I. After-Hours Billing Rate

```
after_hours_pct = services_99051 / total_em_visits
```

**Red flag:** Above peer p90. Unusually high proportion of visits billed as after-hours. Internal medicine is a daytime office specialty. Urgent after-hours care for IM patients goes to urgent care or the ER, not to the internist's office at 9 PM. Some practices may have evening or Saturday hours, but very high after-hours billing relative to peers is unusual.

**Neutral:** Most internists bill 99051 at 0-1% of visits.


### 7J. Very Low Preventive Ratio

Provider does almost no preventive care relative to total visits.

```
preventive_pct = total_preventive_visits / (total_preventive_visits + total_em_visits)
```

**Red flag:** Below peer p10. Provider's preventive-to-total visit ratio is in the bottom 10% of internal medicine peers. This could indicate a hospitalist billing under the general IM taxonomy (hospitalists rarely bill preventive visits), a subspecialist billing under the wrong taxonomy, or a practice that simply does not prioritize prevention.

This red flag is important because it may identify providers whose practice pattern does not match the "general, office-based internal medicine" profile our scoring assumes. If they are hospitalists, they should be flagged and scored differently (or excluded from the peer cohort). If they are general internists who avoid preventive care, that is a quality signal.


## 8. Cross-Category Consistency Checks

These checks look for logical consistency between categories. They are not about volume but about whether the provider's code mix makes sense as a coherent internal medicine practice.

| Check | Logic | Flag |
|---|---|---|
| AWV but no depression screening | (G0438 + G0439) > 20 AND (96127 + G0444) = 0 | Red: AWV should include depression screening per CMS specifications. Performing 20+ AWVs without a single depression screen is a documentation and possibly compliance gap. |
| Depression screening but no preventive visits | (96127 + G0444) > 10 AND total_preventive_visits = 0 | Red: screening codes without any preventive visit structure is unusual. Depression screening should correspond to either preventive visits or structured E/M-based screening workflows. |
| Immunizations but no preventive visits | services_90471 > 20 AND total_preventive_visits = 0 | Yellow: vaccines are often given at well visits. Administering 20+ vaccine doses without any preventive visits is not wrong (vaccines can be given at any visit), but it is unusual for a general IM practice. |
| Preventive visits but no immunizations | total_preventive_visits > 50 AND services_90471 = 0 | Yellow: well visits should include vaccine assessment. Fifty preventive visits without a single immunization administration suggests the practice does not stock vaccines or defers all vaccination to pharmacy. |
| Venipuncture but no office visits | services_36415 > 20 AND total_em_visits < 20 | Red: blood draw-only practice under an individual NPI is unusual. A provider billing many venipunctures without corresponding office visits looks like a lab function, not a physician practice. |
| High CCM but low office visits | services_99490 > 20 AND total_em_visits < 50 | Yellow: CCM (chronic care management) should correspond to office-based longitudinal care. Billing 20+ CCM encounters with fewer than 50 office visits suggests a care coordination-only role or a practice model that needs further investigation. |
| ECG but no office visits | services_93000 > 20 AND total_em_visits < 20 | Red: ECG-only practice under a general IM NPI is unusual. ECG should be ancillary to office-based E/M visits, not the primary service. Could indicate a cardiology-adjacent role billing under the wrong taxonomy. |


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | E/M level distribution | 5 | Red flag | Medicare + Medicaid |
| 2 | Preventive-to-total visit ratio | 6A | Green flag | Medicare + Medicaid |
| 3 | Depression screening to visit ratio | 6B | Green flag | Medicare + Medicaid |
| 4 | Immunization to visit ratio | 6C | Green flag | Medicare + Medicaid |
| 5 | Health risk assessment to preventive visit ratio | 6D | Green flag | Medicare + Medicaid |
| 6 | Medicare AWV to beneficiary ratio | 6E | Green flag | Medicare |
| 7 | Flu vaccine to visit ratio | 6F | Green flag | Medicare + Medicaid |
| 8 | G2211 usage rate | 6G | Green flag | Medicare + Medicaid |
| 9 | CCM adoption | 6H | Green flag | Medicare + Medicaid |
| 10 | Return visit intensity | 7A | Red flag | Medicare |
| 11 | New-to-established patient ratio | 7B | Red flag | Medicare + Medicaid |
| 12 | High-complexity visit rate | 7C | Red flag | Medicare + Medicaid |
| 13 | Preventive visits without screening | 7D | Red flag | Medicare + Medicaid |
| 14 | Screening without preventive visits | 7E | Red flag | Medicare + Medicaid |
| 15 | Single-code dominance | 7F | Red flag | Medicare + Medicaid |
| 16 | E/M complexity trend (multi-year) | 7G | Red flag | Medicare + Medicaid |
| 17 | AWV without follow-through | 7H | Red flag | Medicare + Medicaid |
| 18 | After-hours billing rate | 7I | Red flag | Medicare + Medicaid |
| 19 | Very low preventive ratio | 7J | Red flag | Medicare + Medicaid |
| 20-26 | Cross-category consistency (7 checks) | 8 | Yellow/Red | Medicare + Medicaid |

**Total: ~32 ratio checks** (8 green flags, 10 red flags, 7 cross-category consistency checks, plus E/M distribution = ~26-32 total depending on data availability).


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
| 80-100 | Most ratios are green or neutral. Practice patterns look clean. Prevention-oriented, screening-integrated, consistent billing. |
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
        state = "FL"

STEP 1: Compute provider charge ratio
    charges = SUM(average_submitted_chrg_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023
    allowed = SUM(average_medicare_allowed_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023

    IF allowed = 0 OR total services < 10: RETURN insufficient_data

    provider_ratio = charges / allowed

STEP 2: Build peer distribution
    peer_cohort = all NPIs WHERE taxonomy = '207R00000X'
        AND taxonomy NOT IN (
            '207RC0000X', '207RE0101X', '207RG0100X', '207RG0300X',
            '207RH0003X', '207RI0200X', '207RN0300X', '207RP1001X',
            '207RR0500X', '207RC0200X', '207RX0202X', '207RS0010X',
            '207RS0012X', '207RH0000X'
        )
        AND state = "FL" AND total_medicare_services >= 10

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

The 35/65 weighting gives more influence to service ratios than to charge pricing. Pricing is a market signal. Service ratios are a practice quality signal. Both matter, but if we had to pick one, the ratios tell us more about how the provider actually practices. This is especially true for internal medicine, where the service ratio checks capture preventive care integration, screening adoption, and chronic disease management structure, the things that distinguish a high-quality internist from one who just manages acute problems.


## 12. Worked Examples

### Provider A in Florida. Medicare data for 2023.

**Charge analysis:**
Provider A charges $310,000 total, Medicare allowed $158,000. Ratio = **1.96x**.

**FL peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.35x | 1.65x | 2.00x | 2.40x | 2.80x |

Provider A ratio of 1.96x falls between p25 (1.65x) and p75 (2.40x). Charge score = **100**. Direction = **in_range**.

**Ratio analysis:**
Provider A's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99214 at 44%, 99215 at 9% | Within peer p25-p75 | Green |
| Preventive-to-total visit | 0.18 | Above peer p75 (0.14) | Green |
| Depression screening to visit | 0.12 | Above peer p75 (0.08) | Green |
| Immunization to visit | 0.09 | Above peer p75 (0.06) | Green |
| HRA to preventive visit | 0.25 | Between p25-p75 | Neutral |
| AWV to Medicare beneficiaries | 0.42 | Above peer p75 (0.35) | Green |
| Flu vaccine to visit | 0.05 | Between p25-p75 | Neutral |
| G2211 usage rate | 0.35 | Between p25-p75 | Green |
| CCM adoption | 0.08 | Above 0, within range | Green |
| Return visit intensity | 3.8 visits/bene | Between p25-p75 | Neutral |
| New-to-established ratio | 14% | Between p25-p75 | Neutral |
| High-complexity rate | 9% 99215 | Below 18% | Neutral |
| Preventive without screening | N/A (has screening) | -- | Neutral |
| Screening without preventive | N/A (has preventive) | -- | Neutral |
| Single-code dominance | 35% (99214) | Normal (99214 allowed) | Neutral |
| E/M trend | +2% over 2 years | Within peer p25-p75 | Neutral |
| AWV without follow-through | N/A (has screening) | -- | Neutral |
| After-hours billing | 0% | Normal | Neutral |
| Very low preventive ratio | 0.18 | Above p10 | Neutral |
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

Provider A scores **76.3** on billing quality. Clean charge ratio, strong preventive care integration, depression screening, immunization delivery, AWV adoption, and CCM billing. No red flags. This is a high-quality general internist who integrates prevention into chronic disease management, exactly the billing profile you want to see.

---

### Provider B in Florida.

**Charge analysis:**
Provider B charges $485,000 total, Medicare allowed $142,000. Ratio = **3.42x**.

Same FL peer anchors. Provider B ratio of 3.42x is above p90 (2.80x). Charge score = **40**. Direction = **above_peers**.

Per-code analysis shows: 99214 at 3.8x peer median (flagged), 99215 at 4.2x peer median (flagged), G0439 at 3.5x peer median (flagged). Provider B's pricing is consistently aggressive across the board, not driven by one code.

**Ratio analysis:**
Provider B's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99214 at 36%, 99215 at 22% | 99215 above 18% | Red |
| Preventive-to-total visit | 0.15 | Between p25-p75 | Neutral |
| Depression screening to visit | 0.00 | Zero | Signal |
| Immunization to visit | 0.01 | Below peer p25 | Signal |
| HRA to preventive visit | 0.00 | Zero | Signal |
| AWV to Medicare beneficiaries | 0.28 | Between p25-p75 | Neutral |
| Flu vaccine to visit | 0.00 | Zero | Signal |
| G2211 usage rate | 0.82 | Above peer p90 | Red |
| CCM adoption | 0.00 | Zero | Neutral (no penalty) |
| Return visit intensity | 5.8 visits/bene | Above peer p90 | Red |
| New-to-established ratio | 5% | Near zero, below p10 | Red |
| High-complexity rate | 22% 99215 | Above 18% | Red |
| Preventive without screening | AWV > 50, screening = 0 | Fires | Red |
| Screening without preventive | N/A | -- | Neutral |
| Single-code dominance | 36% (99214) | Normal (99214 allowed) | Neutral |
| E/M trend | +7% over 2 years | Above peer p90 | Red |
| AWV without follow-through | G0438+G0439 > 20, screening = 0 | Fires | Red |
| After-hours billing | 3% | Above peer p90 | Red |
| Very low preventive ratio | 0.15 | Above p10 | Neutral |
| AWV but no depression screening | Fires | -- | Red |
| Depression screening but no preventive | N/A | -- | Neutral |
| Immunizations but no preventive | N/A | -- | Neutral |
| Preventive but no immunizations | Fires (preventive > 50, 90471 = 0) | -- | Yellow |
| Venipuncture but no visits | N/A | -- | Neutral |
| High CCM but low visits | N/A | -- | Neutral |
| ECG but no visits | N/A | -- | Neutral |

Green count: 0. Neutral count: 14. Red count: 10. Yellow count: 1. Total applicable: 26 (including consistency).

```
ratio_analysis_score = ((0 * 1.0) + (15 * 0.5) + (10 * 0.0)) / 26 * 100
                     = 7.5 / 26 * 100
                     = 28.8
```

```
billing_quality_composite = (40 * 0.35) + (28.8 * 0.65)
                          = 14.0 + 18.7
                          = 32.7
```

Provider B scores **32.7** on billing quality. Aggressive pricing, 22% 99215, patients returning nearly 6 times per year, bills AWVs but never screens for depression, never gives a flu shot, never does an HRA, G2211 on 82% of visits, and after-hours billing in a 9-to-5 specialty. This is not one red flag, it is a pattern. The provider bills preventive visits but never delivers the preventive content. The E/M complexity is escalating year over year. Every dimension of this provider's billing is unusual.

The contrast with Provider A is stark. Both are general internists in Florida. Provider A integrates prevention, screens for depression, vaccinates, and bills within normal pricing. Provider B charges aggressively, upcodes, bills preventive visits without screening, and sees patients far more often than peers. The billing quality score separates them.


---

# PART E: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **ACP Guidelines Concordance** | Does this provider follow ACP/USPSTF guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal internist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is practice consistent across payers? | Access proxy |
| **Billing Quality** | Are their charges, ratios, and E/M distribution in line with peers? | Pricing + integrity check |

Billing quality is the integrity layer. It checks pricing behavior (charge-to-allowed) AND practice pattern behavior (service ratios). A provider can score well on the other four scores but get flagged here for upcoding, billing preventive visits without actually screening, or pricing outliers.

What billing quality catches in internal medicine that other scores miss:

| Scenario | Guidelines | Peer | Volume | Payer | Billing |
|---|---|---|---|---|---|
| Good internist, normal billing | High | High | High | High | High |
| Good internist, aggressive pricing | High | High | High | High | Low (charge ratio outlier) |
| Provider upcoding E/M levels | High | High | High | High | Low (red flag on E/M distribution) |
| Provider who bills preventive visits but never screens | High | High (bills the codes) | High (volume is real) | High | Low (red flags: AWV without screening, preventive without screening) |
| High return visit intensity without prevention | Moderate | High | High | High | Low (red flag on visits/bene + low preventive ratio) |
| Hospitalist billing under general IM taxonomy | Low (different guidelines) | Low (different pattern) | High | High | Low (very low preventive ratio flags misclassification) |
| Low-quality provider, clean billing | Low | Low | Low | Low | High |

The green and red flags in this doc add nuance the other scores miss. A provider with a great peer comparison score (they bill all the right codes) but who conducts 50+ AWVs without a single depression screen or HRA is not delivering the preventive care those AWVs are supposed to contain. The peer comparison doc sees "high AWV volume" as a positive signal. This doc asks "do the downstream codes match what an AWV should produce?"

Similarly, a provider who bills 99215 for 22% of visits is claiming their patients are more complex than what 90% of internists see. That might be true for an HIV clinic or a geriatric subspecialty practice. For a general internist in a mixed panel, it is a red flag.


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed analysis uses Medicare data, which is STRONG for internal medicine.** Unlike pediatrics, where Medicare coverage is minimal, internal medicine patients are predominantly Medicare-age. The charge-to-allowed analysis covers the bulk of most internists' practice. This is a strength of the IM billing quality score compared to pediatrics.

**E/M-dominant specialty means less ratio diversity than procedural specialties.** In urology, you can compare cystoscopy-to-biopsy, PSA-to-visit, imaging-to-procedure. In internal medicine, the code mix is 70-80% E/M visits and preventive codes. The ratios we check are more about preventive care integration and screening adoption than about anatomically logical procedure relationships. This means the ratio analysis has less discriminating power than in procedural specialties. Two internists with different quality levels may have similar code mixes simply because the code repertoire is narrow.

**99214 dominance is EXPECTED, not a red flag.** The benchmarks in this doc are calibrated to internal medicine peers. A 99214 rate of 44% is normal in IM, not a signal. We compare to internists, not to all providers. Anyone applying primary care benchmarks that assume 99213 dominance will generate false positives.

**Medicare-specific G-codes create asymmetry in ratio analysis.** G0438, G0439 (AWV), G0444 (depression screening), and G2211 (visit complexity) are Medicare-specific codes. Providers with large Medicaid or commercial panels will have lower volume in these codes even if they provide equivalent services billed under different codes. The AWV-to-beneficiary ratio (6E) partially corrects for this by using Medicare beneficiaries as the denominator, but the depression screening and HRA ratios are affected. Providers who primarily serve non-Medicare patients may look like they screen less, when in reality they use different billing pathways.

**Hospitalist internists have completely different billing patterns.** A hospitalist bills under inpatient E/M codes (99221-99223, 99231-99233), not office E/M codes. If a hospitalist is registered under the general IM taxonomy (207R00000X), they will appear in the peer cohort with very low or zero office visit volume, no preventive visits, and a code mix that looks nothing like an office-based internist. Our "very low preventive ratio" red flag (7J) attempts to catch this, but the better solution is to identify and exclude hospitalists from the office-based peer cohort. Without reliable hospitalist identification, some peer cohort contamination is possible.

**CCM (99490) is still emerging. Absence is not a penalty.** Chronic Care Management requires workflow investment (care coordinators, consent processes, documentation). Many high-quality practices have not adopted CCM billing. We score CCM adoption as a green flag when present but assign neutral, not a red flag, when absent. This may change as adoption increases nationally.

**Red flags need investigation, not automatic penalty.** A red flag means a ratio is statistically unusual compared to peers. There may be a valid explanation. A provider with high return visit intensity might manage a complex geriatric panel where quarterly visits for multiple conditions are clinically appropriate. A provider with high 99215 rates might run an HIV clinic where every visit is genuinely high complexity. The score surfaces signals for investigation, not verdicts.

**Geographic variation affects all ratios.** State Medicaid policy, local referral patterns, and urban/rural differences all shape billing patterns. State-level peer grouping captures most of this. Sub-state grouping (ZIP-3 or CBSA) would help.

**Subspecialist exclusion may not be perfect.** Some internists with subspecialty training bill under the general IM taxonomy code. A cardiologist billing under 207R00000X will look different from a general internist: heavier on ECG (93000), stress testing, echocardiography, and lighter on preventive visits. The taxonomy filter catches most subspecialists but not all. The consistency checks (ECG but no office visits, for example) can catch some of these misclassified providers.


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
| preventive_to_total_ratio | float | (99385-99397 + G0438 + G0439) / (preventive + E/M) |
| preventive_flag | string | "green", "neutral", or "signal" |
| depression_screening_ratio | float | (96127 + G0444) / total E/M visits |
| depression_screening_flag | string | Flag |
| immunization_ratio | float | 90471 / total E/M visits |
| immunization_flag | string | Flag |
| hra_to_preventive_ratio | float | 96160 / total preventive visits |
| hra_flag | string | Flag |
| awv_to_beneficiary_ratio | float | (G0438 + G0439) / total Medicare beneficiaries |
| awv_flag | string | Flag |
| flu_vaccine_ratio | float | 90686 / total E/M visits |
| flu_vaccine_flag | string | Flag |
| g2211_ratio | float | G2211 / total established E/M visits |
| g2211_flag | string | Flag |
| ccm_ratio | float | 99490 / total unique beneficiaries |
| ccm_flag | string | Flag |
| **Red Flag Ratios** | | |
| visits_per_beneficiary | float | Total E/M services / unique beneficiaries |
| return_visit_flag | string | "green", "neutral", or "red" |
| new_patient_pct | float | New patient visits / total E/M visits |
| new_patient_flag | string | Flag |
| high_complexity_pct | float | 99215 / total E/M visits |
| high_complexity_flag | string | Flag |
| preventive_without_screening | boolean | total_preventive > 50 AND screening codes = 0 |
| preventive_without_screening_flag | string | Flag |
| screening_without_preventive | boolean | screening codes > 10 AND total_preventive = 0 |
| screening_without_preventive_flag | string | Flag |
| max_single_code_pct | float | Highest single-code % of total services |
| single_code_dominance_flag | string | Flag |
| em_complexity_trend | float | Change in high-complexity % from earliest to latest year |
| em_trend_flag | string | Flag (multi-year) |
| awv_without_screening | boolean | (G0438 + G0439) > 20 AND screening codes = 0 |
| awv_without_screening_flag | string | Flag |
| after_hours_pct | float | 99051 / total E/M visits |
| after_hours_flag | string | Flag |
| very_low_preventive_pct | float | total_preventive / (total_preventive + total_em) |
| very_low_preventive_flag | string | Flag |
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
