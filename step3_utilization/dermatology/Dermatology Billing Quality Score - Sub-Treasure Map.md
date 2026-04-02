# Dermatology Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other four docs ask about clinical practice: does this provider follow AAD guidelines, do they look like a normal dermatologist, is their volume believable, is their billing consistent across payers? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** -- is their pricing in line with peers?
2. **Procedure-to-procedure ratios** -- do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that should not go together, or go together too often)?
3. **E/M level distribution** -- are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against state-level cohorts by default.

Important context for dermatology: this is a mixed medical-procedural specialty with strong Medicare volume due to skin cancer prevalence in older populations. Unlike pediatrics where Medicare coverage is thin, charge-to-allowed analysis is STRONG here. Dermatology also has a unique billing characteristic: the E/M distribution is co-dominant at 99213 and 99214, unlike urology (99214 dominant) or pediatrics (99213 dominant). The benchmarks in this doc reflect that reality.

Critical context: AK (actinic keratosis) destruction billing is a nationally recognized audit target. OIG and CMS have repeatedly flagged dermatology for outlier AK destruction volumes. The ratio checks in this doc give special attention to AK-related codes because this is where the most billing fraud occurs in dermatology.


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
| provider_type | Filter to Dermatology |

**CMS Medicaid Provider Spending** -- for additional procedure volume

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined, giving us full dermatologic volume.

**Medicare data is a strong primary source for dermatology.** Skin cancer is overwhelmingly a disease of older adults. Actinic keratoses, basal cell carcinoma, squamous cell carcinoma, and melanoma surveillance all concentrate in patients 55+. This means the charge-to-allowed analysis covers a significant portion of most dermatologists' procedural practice. Medicaid adds moderate volume from younger patients (acne, eczema, psoriasis) and is important for the procedure ratio analysis, where we want the fullest picture of practice patterns.

The combination of both datasets is essential in dermatology because the case mix differs by payer. Medicare patients drive biopsy, destruction, and excision volume. Medicaid patients drive medical dermatology visits. Using both files gives us a complete view of how a provider practices across their full panel.


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

A ratio of 2.0x means the provider charges, on average, twice what Medicare allows. For dermatology, this is typical. Dermatology has a mix of E/M visits and procedures (biopsies, destructions, excisions), and the charge markups are moderate compared to purely surgical specialties.


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual. Could indicate a practice that has never updated its fee schedule, or one that primarily serves government-payer patients with no commercial rate negotiation. |
| 1.5x - 2.0x | Low end of normal for dermatology. Less aggressive pricing, possibly in a lower-cost market or a practice that has not updated charges recently. |
| 2.0x - 2.5x | Typical range for most dermatologists. Reflects normal commercial rate negotiations and standard fee schedule markups. |
| 2.5x - 3.5x | Upper normal range. May reflect a higher-cost market (major metros), a procedure-heavy practice, or aggressive commercial rate positioning. |
| >3.5x | Outlier. Worth investigating. Could be billing errors, a practice that has never reconciled its fee schedule, or a few high-charge codes distorting the average. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Could be data error or an unusual payment arrangement. |

Note the difference compared to urology: dermatology charge markups run lower. A charge ratio of 3.0x that is median for a urologist is at the high end for a dermatologist. This reflects the mix of E/M visits (lower markups) and procedures (moderate markups) in dermatology versus the heavily procedural nature of urology.


## 2. Building the Peer Distribution

The peer distribution is what makes this score meaningful. A ratio of 2.3x means nothing in isolation. It means something when you know the peer median is 2.2x.


### Geographic Grouping

Charge-to-allowed ratios vary significantly by geography because of differences in cost of living, commercial payer rates, and local market dynamics. A dermatologist in Manhattan charging 3.2x may be normal for that market. A dermatologist in rural Iowa charging 3.2x is an outlier.

Peer distributions are built at the **state level** by default:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All dermatology NPIs (taxonomy 207N00000X, >= 10 Medicare services) in the same state | Primary scoring. Captures local market pricing norms. |
| **National** | All states combined | Secondary benchmark. Cross-state comparison: "how does dermatology pricing in FL compare to CA?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | When state cohorts are large enough. Urban vs. rural have different pricing dynamics, and dermatology access varies enormously by geography. |

The minimum peer cohort size is 30 providers. If a state has fewer than 30 dermatology NPIs with Medicare data, fall back to national.

**Taxonomy filter:** We use 207N00000X (Dermatology) and explicitly exclude subspecialists:
- 207ND0101X (Dermatological Surgery / MOHS Micrographic Surgery)
- 207ND0900X (Dermatopathology)
- 207NI0002X (Clinical & Laboratory Dermatological Immunology)
- 207NP0225X (Pediatric Dermatology)
- 207NS0135X (Procedural Dermatology)

We exclude these because their case mix, procedure volume, and billing patterns differ from general dermatology enough to distort peer comparisons. A Mohs surgeon's code mix looks nothing like a general dermatologist's. A dermatopathologist bills almost entirely pathology codes. Including them would skew the peer distribution and create false flags for general dermatologists.

Important caveat: some general dermatologists perform Mohs surgery but bill under the general 207N00000X taxonomy. Their procedure mix will skew toward surgical codes. The taxonomy filter catches most subspecialists but not all. Red flags on these providers need investigation, not automatic penalty.


### Computing Peer Anchors

From the state-level peer cohort, compute the following percentile anchors:

```
peer_cohort = all dermatology NPIs in the same state
    WHERE taxonomy_code = '207N00000X'
    AND taxonomy_code NOT IN ('207ND0101X', '207ND0900X', '207NI0002X',
                               '207NP0225X', '207NS0135X')
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio across peer_cohort
peer_p25 = 25th percentile
peer_median = 50th percentile (median)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Example peer anchors (national dermatology, illustrative):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.50x |
| p25 | ~1.80x |
| Median | ~2.20x |
| p75 | ~2.70x |
| p90 | ~3.30x |

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
| Normal | p25 to p75 | 100 | Provider's pricing is within the typical range for dermatology peers in this state. No signal. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | Provider is in the tails of the peer distribution but not extreme. Could reflect market positioning, not a problem. |
| Outlier | Below p10 or above p90 | 40 | Provider's pricing is significantly different from peers. Worth investigating. Not an automatic fail. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 2.0x is not "better" than 2.5x in any clinical sense. Both are normal. The purpose of this score is to flag outliers, not to rank providers. A three-band system (normal / somewhat unusual / outlier) communicates this clearly: you are either in line with peers, at the edge, or outside the norm.


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

This layer answers: "is the provider's pricing outlier status driven by one or two codes, or is it across the board?" A dermatologist who charges 4x the peer median for 17004 (destruction of 15+ AK lesions) but is normal on everything else has a different story from one who is 3x+ on every code.

This per-code analysis is especially useful in dermatology because the code mix spans office E/M visits, diagnostic procedures (biopsies), destructive procedures (AK treatment), excisions, and wound repairs. A single high-charge procedural code can skew the composite ratio in a way that does not reflect overall pricing behavior.


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

**What normal looks like in dermatology:**

| Code | Level | Typical Peer Distribution |
|---|---|---|
| 99211 | Minimal (nurse visit) | ~1-2% |
| 99212 | Straightforward | ~3-6% |
| 99213 | Low complexity | ~35-45% (co-dominant with 99214) |
| 99214 | Moderate complexity | ~35-45% (co-dominant with 99213) |
| 99215 | High complexity | ~3-8% |

**99213 and 99214 are roughly co-dominant in dermatology.** This is a critical difference from both urology (where 99214 dominates at 40-50%) and pediatrics (where 99213 dominates). Dermatology visits span a wide range of complexity: a follow-up acne check is a 99213, a multi-lesion skin cancer surveillance visit with biopsy decisions is a 99214, and a patient with widespread psoriasis on biologics might be a 99215. The co-dominant pattern reflects this mix.

A dermatologist whose distribution looks like a primary care physician (99213 at 60%+, 99214 at 15%) is not necessarily wrong. They may run a medical dermatology practice (acne, eczema, rashes) with less procedural complexity. But it is unusual for a general dermatologist.

A dermatologist whose distribution mirrors a urologist (99214 at 50%+, 99215 at 15%+) may have a skin cancer-heavy panel, or may be upcoding. The comparison is always against dermatology peers.

**Red flag:** Provider's 99215 alone exceeds 12% of E/M volume. High complexity visits should be uncommon in dermatology. Even the most complex dermatologic conditions (drug-resistant psoriasis, severe bullous disease, melanoma management) are managed at the 99214 level for most visits. Sustained 12%+ for 99215 is unusual. Note this threshold is lower than urology's (20%) because dermatology conditions are generally lower in medical decision-making complexity.

**Red flag:** Provider's 99214 + 99215 combined is above the peer p90. This means they bill at higher complexity than 90% of dermatology peers.

**Green flag:** Provider's distribution closely matches peer median (all levels within 10 percentage points of peer median).

```
high_complexity_pct = (services_99214 + services_99215) / em_total

peer_p90_high_complexity = 90th percentile of high_complexity_pct across peer cohort

em_distribution_flag = "red"  IF high_complexity_pct > peer_p90_high_complexity
                      "yellow" IF high_complexity_pct > peer_p75_high_complexity
                      "green"  IF high_complexity_pct <= peer_p75_high_complexity
```

Note: because 99213 and 99214 are co-dominant in dermatology, the "high complexity" combined percentage (99214 + 99215) will typically run 40-55% of E/M volume. This is normal. The comparison is always against dermatology peers, not against all specialties.


## 6. Green Flag Ratios (Good Practice Signals)

These ratios indicate a provider is doing things right. High ratios compared to peers are positive signals.


### 6A. Biopsy-to-Visit Ratio

Does the provider actively biopsy suspicious lesions during office visits?

```
biopsy_ratio = (services_11102 + services_11104) / total_em_visits
    -- 11102 = tangential biopsy of skin (single lesion)
    -- 11104 = punch biopsy of skin (single lesion)
    -- total_em_visits = SUM(services) for 99211-99215
```

**Green flag:** Ratio above peer p75. Provider actively biopsies suspicious lesions. In a specialty where the most critical decision is "does this need a biopsy?", a high biopsy rate relative to visits indicates a provider who is vigilant about screening and does not defer diagnostic workup.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider biopsies less than most peers. Could indicate a medical dermatology-focused practice (acne, eczema) with fewer suspicious lesions, or a provider who refers biopsies to dermatopathology or Mohs surgeons. But for a general dermatologist with a Medicare panel, low biopsy volume is unusual.


### 6B. AK Treatment-to-Visit Ratio

Does the provider actively treat premalignant lesions?

```
ak_ratio = (services_17000 + services_17003 + services_17004) / total_em_visits
    -- 17000 = destruction of premalignant lesion, first lesion
    -- 17003 = destruction of premalignant lesion, second through fourteenth lesion
    -- 17004 = destruction of premalignant lesion, fifteen or more lesions
```

**Green flag:** Ratio above peer p75. Provider actively treats premalignant lesions. Actinic keratoses are the most common premalignant skin condition, and treatment prevents progression to squamous cell carcinoma. A dermatologist who treats AKs at a high rate relative to visits is doing preventive care.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider treats fewer AKs than peers. Could indicate a younger patient panel (AKs are age-related), a medical dermatology practice, or a provider in a low-sun-exposure geography. But for a general dermatologist with a Medicare panel in a sun-exposed state, low AK treatment is unusual.

Note: while high AK treatment relative to visits is a green flag, extremely high AK treatment per beneficiary (see red flag 7D) is a red flag. These are different measures. One asks "do you treat AKs when you see patients?" and the other asks "are you treating an unreasonable number of AKs per patient?"


### 6C. Biopsy-to-Destruction Ratio

Does the provider biopsy at a reasonable rate relative to destruction?

```
biopsy_destruction_ratio = (services_11102 + services_11104) /
                           (services_17000 + services_17003 + services_17004)
```

**Green flag:** Ratio between 0.15 and 0.60 AND within peer p25-p75. Provider biopsies at a reasonable rate relative to destruction. The AAD principle is: confirm diagnosis before destroying. Not every AK needs a biopsy (clinical diagnosis is often sufficient for textbook AKs), but a provider who destroys hundreds of lesions and never biopsies a single one raises questions about whether some of those "AKs" were actually something else.

**Neutral:** Outside 0.15-0.60 but within peer p25-p75. Some providers run lower biopsy rates because their AK patients have classic presentations. Some run higher because they have high-risk patients with histories of SCC.

**Signal:** Ratio near zero with high destruction volume. Provider destroys many lesions but rarely checks what they are destroying. See also red flag 7C for the extreme version.

Note: this ratio has clinical nuance. AKs are often diagnosed clinically without biopsy. A ratio of 0.15 means roughly 1 biopsy for every 6-7 destructions, which is reasonable if the destructions are textbook AKs. A ratio above 0.60 may indicate a provider who biopsies almost every lesion before treating, which is thorough but could also indicate uncertainty or billing maximization.


### 6D. Excision-to-Biopsy Ratio

When biopsies find cancer, does the provider excise?

```
excision_biopsy_ratio = (services_11600 + services_11640) /
                        (services_11102 + services_11104)
    -- 11600 = excision of malignant lesion, trunk/arms/legs, 0.5 cm or less
    -- 11640 = excision of malignant lesion, face/ears/eyelids/nose/lips/mucous membrane, 0.5 cm or less
```

**Green flag:** Ratio between 0.10 and 0.50 AND above peer p25. When biopsies find cancer, provider excises. Not all biopsies lead to excision (many biopsies come back benign, and some positive biopsies are referred to Mohs surgery), so the ratio should be well below 1.0. A ratio of 0.10-0.50 means roughly 1 excision per 2-10 biopsies, which aligns with the clinical reality that a minority of biopsies result in cancer requiring excision by the general dermatologist.

**Neutral:** Between peer p25 and p75 but outside the 0.10-0.50 band. May reflect a practice that refers most malignancies to Mohs surgery (lower ratio) or a skin cancer-heavy practice (higher ratio).

**Signal:** Ratio = 0 with biopsy volume > 20. Provider biopsies frequently but never excises. This strongly suggests all positive biopsies are referred elsewhere. Not necessarily bad, but it is an incomplete care pattern.


### 6E. Repair-to-Excision Ratio

After excision, does the provider close the wound?

```
repair_excision_ratio = services_12001 /
                        (services_11600 + services_11640 + services_11400 + services_11440)
    -- 12001 = simple repair of superficial wounds, 2.5 cm or less
    -- 11400 = excision of benign lesion, trunk/arms/legs, 0.5 cm or less
    -- 11440 = excision of benign lesion, face/ears/eyelids/nose/lips/mucous membrane, 0.5 cm or less
```

**Green flag:** Ratio between 0.2 and 0.8. Excisions should often require wound closure. Zero repairs with many excisions could mean repairs are being billed separately under a different provider, or not closed properly. A ratio of 0.2-0.8 means at least some excisions get formal repair, which is expected for anything beyond a very small punch excision.

**Neutral:** Outside 0.2-0.8 but within peer p25-p75. Some excisions are small enough to heal by secondary intention (no formal repair needed). Some practices have PA/NPs do the closures under a separate NPI. Variation is expected.

**Signal:** Ratio > 1.0 (more repairs than excisions) OR ratio = 0 with excision volume > 20. More repairs than excisions is unusual and may indicate repairs being billed for procedures other than excisions, or billing errors. Zero repairs with significant excision volume is a workflow gap.


### 6F. Multiple Biopsy Rate

Does the provider take multiple biopsies per visit?

```
multi_biopsy_ratio = (services_11103 + services_11105) /
                     (services_11102 + services_11104)
    -- 11103 = tangential biopsy of skin, each additional lesion
    -- 11105 = punch biopsy of skin, each additional lesion
```

**Green flag:** Ratio between 0.3 and 1.5 AND within peer p25-p75. Multiple biopsies per visit are normal in dermatology. Patients often present with several suspicious lesions at the same visit, especially Medicare-age patients with sun damage. A ratio of 0.5 means roughly one additional biopsy for every two first-lesion biopsies, which is typical.

**Neutral:** Outside 0.3-1.5 but within peer p25-p75. A very low multiple biopsy rate could mean the provider only biopsies one lesion per visit (possible if they intentionally limit procedures per encounter). A very high rate (above 1.5) means more than one additional biopsy per first-lesion biopsy, which is clinically possible but above average.

**Signal:** Ratio above peer p90. Extremely high multiple biopsy rates could indicate biopsy mills. A ratio of 3.0 means 3 additional biopsies per first-lesion biopsy, meaning 4 biopsies per encounter on average. This happens in legitimate practice (full-body skin checks on high-risk patients), but sustained extreme rates warrant investigation.


### 6G. Procedure Density per Visit

How many procedures does the provider perform per office visit?

```
procedure_density = total_procedure_services / total_em_visits
    -- total_procedure_services = SUM(services) for all non-E/M HCPCS codes
       (biopsies, destructions, excisions, repairs, injections, phototherapy, etc.)
```

**Green flag:** Ratio above peer p75. Dermatology should have high procedure density. Unlike a specialty where the visit itself is the product, dermatology visits typically include at least one procedure: biopsy, destruction, excision, injection, or application. A high procedure density indicates a provider who is actively treating, not just counseling.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does few procedures per visit. Could indicate a medical dermatology-only practice (all prescriptions, no procedures) or a practice model where procedures are done by PAs/NPs under separate NPIs. But for a general dermatologist, low procedure density is unusual.


### 6H. AK Burden Indicator

Among AK treatments, what fraction involves patients with heavy AK burden (15+ lesions)?

```
ak_15plus_ratio = services_17004 /
                  (services_17000 + services_17003 + services_17004)
    -- 17004 = destruction of premalignant lesion, fifteen or more lesions
```

**Green flag:** Ratio between 0.05 and 0.40 AND within peer range. Some patients have heavy AK burden (15+ lesions), especially elderly patients with extensive sun damage. A moderate proportion of 17004 relative to total AK destruction is clinically expected.

**Neutral:** Outside 0.05-0.40 but within peer p25-p75.

**Signal:** Ratio above 0.40. More than 40% of AK treatment sessions involve 15+ lesions. While some practices legitimately see heavily sun-damaged patients (Florida, Arizona, retirement communities), a very high 17004 ratio is one of the most scrutinized billing patterns in dermatology. OIG has specifically targeted 17004 volume in national audits. Too low a ratio with a Medicare panel in a sun-exposed state could mean under-treating, but too high is the bigger concern from a billing integrity standpoint.

This ratio is the first of several AK-specific checks. AK destruction is the single most common area of billing fraud in dermatology. The codes are structured so that destroying 15+ lesions (17004) pays substantially more than destroying 1-14 lesions (17000 + 17003), creating an incentive to round up lesion counts. We give this area extra scrutiny.


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

**Red flag:** `visits_per_beneficiary` above peer p90. Provider's patients come back significantly more often than peers' patients.

**Neutral:** Between p25 and p75.

Note: dermatology patients typically visit 2-4 times per year. Skin cancer surveillance patients may come every 3-6 months. Psoriasis patients on biologics require monitoring visits. But a provider whose per-beneficiary visit rate is in the top 10% of dermatologists is still unusual within the specialty. Extremely high rates (6+ visits/patient) may indicate unnecessary return visits or billing anomalies.


### 7B. New-to-Established Patient Ratio

What proportion of visits are new patients vs. established?

```
new_patient_pct = (services_99201 + services_99202 + services_99203 +
                   services_99204 + services_99205) / total_em_services
```

**Red flag (high):** New patient percentage above peer p90. Could indicate high patient turnover (patients leaving the practice), or a practice that codes established patients as new (billing error or fraud).

**Red flag (very low):** New patient percentage near zero. Could indicate a closed panel or a practice not accepting new patients. Not a billing issue, but a signal about practice accessibility.

For dermatology, new patient visits typically run 15-30% of total E/M volume. Dermatology has higher new patient rates than most specialties because many patients come for episodic concerns (suspicious mole, rash, new skin lesion) rather than ongoing management.


### 7C. Destruction Without Biopsy

Provider destroys many lesions but never biopsies any.

```
destruction_no_biopsy = (services_17000 + services_17003 + services_17004) > 50
                        AND (services_11102 + services_11104) = 0
```

**Red flag:** Provider destroys more than 50 lesions in the measurement period but has zero biopsy volume. The AAD principle is clear: suspicious lesions should be biopsied, not destroyed without diagnosis. While AKs are often diagnosed clinically, a provider who destroys hundreds of lesions and never biopsies a single one is either treating only the most obvious AKs (possible but unusual at that volume) or destroying lesions without adequate diagnostic workup.

This is a binary flag, not a ratio. It fires or it does not.

Context: this is one of the most important red flags in dermatology billing. OIG has specifically cited "destruction without pathological confirmation" as a concern. A biopsy confirms what the lesion actually is. Without any biopsies, there is no way to verify that destroyed lesions were actually premalignant.


### 7D. Very High AK Destruction Volume

Is the provider's per-patient AK destruction volume an extreme outlier?

```
ak_per_bene = (services_17000 + services_17003 + services_17004) /
              total_beneficiaries
```

**Red flag:** Above peer p95. AK destruction is one of the most common billing fraud areas in dermatology. Extremely high per-patient volumes warrant investigation.

Context: this check uses p95 instead of the usual p90 because AK destruction volume has legitimate high-end variation. Dermatologists in Arizona or Florida who serve retirement communities will treat more AKs per patient than dermatologists in Minnesota. But even within the sun-exposed state peer cohort, a provider at the 95th percentile is destroying far more lesions per patient than almost all peers in the same market.

OIG audits have repeatedly identified AK destruction volume as the top dermatology billing concern. Specific patterns flagged include: billing 17004 (15+ lesions) on a high percentage of AK treatment sessions, treating the same patients for AK destruction at every visit, and total AK destruction volumes that exceed what is physiologically likely for a patient panel of that size. This check catches the volume dimension. Green flag 6H catches the 17004-specific pattern.


### 7E. Excision Without Repair

Provider performs many excisions but never bills a wound repair.

```
excision_no_repair = (services_11600 + services_11640) > 20
                     AND services_12001 = 0
```

**Yellow/Red flag:** More than 20 excisions but zero wound repairs. Possible explanations: repairs billed by another provider (PA/NP doing closures), excisions are very small and heal by secondary intention, or the practice does not bill repairs separately. But worth investigating, especially at high excision volumes. An excision of a malignant lesion almost always requires some form of wound closure.

This is a binary flag, not a ratio. It fires or it does not.


### 7F. Single-Code Dominance

Is any one code an unusually large share of the provider's total billing?

```
For each HCPCS code billed by this NPI:
    code_pct = services_for_code / total_services

max_code_pct = MAX(code_pct)
dominant_code = the HCPCS code with the highest code_pct
```

**Red flag:** `max_code_pct` > 25% AND dominant code is NOT 17003 or 99214. In dermatology, 17003 (additional AK destruction) can legitimately be very high volume because it is billed per additional lesion (one 17000 triggers many 17003 units for the same patient). 99214 can also be high because it is one of the co-dominant E/M codes. But any OTHER single code dominating more than 25% of total services is unusual. If 99213 is at 30%, the provider may be a medical derm practice coding at lower complexity. If 11102 is at 30%, the provider may be a biopsy-heavy practice.

**Normal:** For most dermatologists, 17003 or 99213/99214 will be the highest-volume codes, with the rest spread across biopsy, excision, repair, and other procedural codes.


### 7G. E/M Complexity Trend (Multi-Year)

Is the provider's E/M complexity increasing year over year faster than peers?

```
For each year in [2021, 2022, 2023]:
    high_complexity_pct_year = (services_99214 + services_99215) / total_em_services

complexity_trend = high_complexity_pct_2023 - high_complexity_pct_2021
peer_median_trend = MEDIAN(complexity_trend) across peer cohort
```

**Red flag:** Provider's complexity trend is above peer p90. Their E/M billing is escalating faster than peers. Could indicate progressive upcoding.

**Neutral:** Trend within p25-p75 of peers. Some upward drift is normal (CMS documentation changes in 2021 shifted coding patterns nationally, and dermatology practices adjusted like everyone else).

Note: Requires multi-year data. The Medicaid Provider Spending file covers 2018-2024, so this is computable.


### 7H. Biopsy Without Any Excision or Destruction

Provider biopsies many lesions but never treats any.

```
biopsy_only = (services_11102 + services_11104) > 50
              AND (services_11600 + services_11640 + services_17000) = 0
```

**Red flag:** Provider performs more than 50 biopsies but has zero excision and zero destruction volume. What happens to the positive biopsy results? If biopsies find cancer, someone should be excising or treating. If biopsies find AKs, someone should be destroying them.

Possible explanation: the provider biopsies and refers all treatment to Mohs surgeons, surgical oncologists, or other dermatologists. This is a valid referral pattern, especially for melanoma. But at scale (50+ biopsies with zero treatment), it is an unusual practice model that deserves investigation. A "biopsy-only" dermatologist is not providing complete care unless they have a clear referral network.

This is a binary flag, not a ratio. It fires or it does not.


### 7I. After-Hours Billing Rate

```
after_hours_pct = services_99051 / total_em_visits
```

**Red flag:** Above peer p90. Unusually high proportion of visits billed as after-hours. Dermatology is almost never an after-hours specialty. Dermatologic emergencies are rare: severe drug reactions go to the ER, skin infections are handled by urgent care, and acute flares of chronic conditions can wait until the next business day. A dermatology office billing significant after-hours volume is unusual.

**Neutral:** Most dermatologists bill 99051 at 0% of visits. Some may have Saturday clinics, resulting in 1-2%.


### 7J. G2211 Overuse

```
g2211_ratio = services_G2211 / total_established_em_visits
    -- G2211 = visit complexity inherent to evaluation and management
    -- associated with ongoing medical decision-making
```

**Red flag:** Ratio above peer p90. G2211 was introduced in 2024 as an add-on code for visit complexity inherent to ongoing care. It has been flagged nationally for overuse across all specialties. Dermatologists have a reasonable case for billing G2211 on established visits for chronic conditions (psoriasis management, cancer surveillance, chronic eczema), but many dermatology visits are episodic (mole check, rash evaluation, AK treatment) where G2211 does not clearly apply. The comparison is peer-relative. If a dermatologist bills G2211 at a much higher rate than other dermatologists, that is a signal.

**Neutral:** Between peer p25 and p75. Many dermatology practices are still in the process of adopting G2211.

**Green flag:** Not billed at all. Many practices have not adopted G2211 yet. No penalty.


## 8. Cross-Category Consistency Checks

These checks look for logical consistency between categories. They are not about volume but about whether the provider's code mix makes sense as a coherent dermatology practice.

| Check | Logic | Flag |
|---|---|---|
| Destruction but no biopsy | (17000 + 17003 + 17004) > 50 AND (11102 + 11104) = 0 | Red: treating without diagnosing. Provider destroys many lesions but never biopsies to confirm what they are destroying. Same check as 7C, captured here as a consistency flag. |
| Biopsy but no excision AND no destruction | (11102 + 11104) > 50 AND (11600 + 11640) = 0 AND (17000 + 17003 + 17004) = 0 | Yellow: diagnosing but not treating. Provider biopsies frequently but never excises and never destroys. May refer all treatment. Not an automatic red, but an incomplete care pattern. |
| Malignant excision but no biopsy | (11600 + 11640) > 10 AND (11102 + 11104) = 0 | Red: excising cancer without biopsy confirmation. A malignant excision should almost always be preceded by a biopsy confirming malignancy. Excising without biopsy means either the biopsy was done by another provider (possible) or the provider is excising without pathological confirmation (concerning). |
| Repair but no excision | 12001 > 10 AND (11600 + 11640 + 11400 + 11440) = 0 | Red: wound repairs without corresponding excisions. What is being repaired? Repairs should follow excisions, biopsies, or other wound-creating procedures. Repairs without excisions could indicate billing errors or repairs for non-dermatologic procedures. |
| Phototherapy but few visits | 96910 > 20 AND total_em < 30 | Yellow: phototherapy-heavy practice with minimal office visits. Could be a satellite phototherapy setup where patients come for UV treatment without a physician visit each time. This is a legitimate practice model (phototherapy can be administered by trained staff), but it is unusual and should be identified. The provider may not be performing the phototherapy themselves. |
| Intralesional injection but no biopsy | 11900 > 20 AND (11102 + 11104) = 0 | Yellow: injecting lesions without diagnostic workup. Intralesional injection (11900) is used for keloids, cysts, alopecia areata, and other conditions. While some of these are diagnosed clinically, a provider doing 20+ injections without any biopsy volume is unusual. Keloids and cysts can mimic other conditions and may warrant biopsy. |
| Pathology very high relative to biopsies | 88305 > ((11102 + 11104) * 2) | Yellow: reading more pathology specimens than biopsies taken. 88305 is surgical pathology (tissue examination). If a provider reads more than twice as many specimens as they biopsy, they may be reading pathology for other providers. This is not a problem per se (some dermatopathologists bill under general derm taxonomy), but it flags a practice model that differs from a typical dermatologist. |


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | E/M level distribution | 5 | Red flag | Medicare + Medicaid |
| 2 | Biopsy-to-visit ratio | 6A | Green flag | Medicare + Medicaid |
| 3 | AK treatment-to-visit ratio | 6B | Green flag | Medicare + Medicaid |
| 4 | Biopsy-to-destruction ratio | 6C | Green flag | Medicare + Medicaid |
| 5 | Excision-to-biopsy ratio | 6D | Green flag | Medicare + Medicaid |
| 6 | Repair-to-excision ratio | 6E | Green flag | Medicare + Medicaid |
| 7 | Multiple biopsy rate | 6F | Green flag | Medicare + Medicaid |
| 8 | Procedure density per visit | 6G | Green flag | Medicare + Medicaid |
| 9 | AK burden indicator | 6H | Green flag | Medicare + Medicaid |
| 10 | Return visit intensity | 7A | Red flag | Medicare |
| 11 | New-to-established patient ratio | 7B | Red flag | Medicare + Medicaid |
| 12 | Destruction without biopsy | 7C | Red flag | Medicare + Medicaid |
| 13 | Very high AK destruction volume | 7D | Red flag | Medicare + Medicaid |
| 14 | Excision without repair | 7E | Red flag | Medicare + Medicaid |
| 15 | Single-code dominance | 7F | Red flag | Medicare + Medicaid |
| 16 | E/M complexity trend (multi-year) | 7G | Red flag | Medicare + Medicaid |
| 17 | Biopsy without any excision or destruction | 7H | Red flag | Medicare + Medicaid |
| 18 | After-hours billing rate | 7I | Red flag | Medicare + Medicaid |
| 19 | G2211 overuse | 7J | Red flag | Medicare + Medicaid |
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
        state = "FL"

STEP 1: Compute provider charge ratio
    charges = SUM(average_submitted_chrg_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023
    allowed = SUM(average_medicare_allowed_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023

    IF allowed = 0 OR total services < 10: RETURN insufficient_data

    provider_ratio = charges / allowed

STEP 2: Build peer distribution
    peer_cohort = all NPIs WHERE taxonomy = '207N00000X'
        AND taxonomy NOT IN ('207ND0101X', '207ND0900X', '207NI0002X',
                              '207NP0225X', '207NS0135X')
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

The 35/65 weighting gives more influence to procedure ratios than to charge pricing. Pricing is a market signal. Procedure ratios are a practice quality signal. Both matter, but if we had to pick one, the ratios tell us more about how the provider actually practices. This weighting is especially important in dermatology because the procedure ratio checks include AK destruction patterns, which are the highest-signal billing integrity indicators in the specialty.


## 12. Worked Examples

### Provider A: Clean General Dermatologist in Florida

Provider A in Florida. Medicare data for 2023.

**Charge analysis:**
Provider A charges $310,000 total, Medicare allowed $145,000. Ratio = **2.14x**.

**FL peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.55x | 1.85x | 2.25x | 2.80x | 3.40x |

Provider A ratio of 2.14x falls between p25 (1.85x) and p75 (2.80x). Charge score = **100**. Direction = **in_range**.

**Ratio analysis:**
Provider A's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99213 at 40%, 99214 at 38%, 99215 at 6% | Within peer p25-p75 | Green |
| Biopsy-to-visit | 0.22 | Above peer p75 (0.18) | Green |
| AK treatment-to-visit | 0.35 | Above peer p75 (0.28) | Green |
| Biopsy-to-destruction | 0.28 | Between 0.15-0.60, within peer p25-p75 | Green |
| Excision-to-biopsy | 0.25 | Between 0.10-0.50, above peer p25 | Green |
| Repair-to-excision | 0.45 | Between 0.2-0.8 | Green |
| Multiple biopsy rate | 0.65 | Between 0.3-1.5, within peer p25-p75 | Green |
| Procedure density | 0.85 | Above peer p75 (0.70) | Green |
| AK burden indicator | 0.18 | Between 0.05-0.40, within peer range | Green |
| Return visit intensity | 2.6 visits/bene | Between p25-p75 | Neutral |
| New-to-established | 22% | Between p25-p75 | Neutral |
| Destruction without biopsy | N/A (has biopsies) | -- | Neutral |
| AK per beneficiary | 1.8 | Between p25-p75 | Neutral |
| Excision without repair | N/A (has repairs) | -- | Neutral |
| Single-code dominance | 18% (17003) | Normal (17003 is expected) | Neutral |
| E/M trend | +2% over 2 years | Within peer p25-p75 | Neutral |
| Biopsy without treatment | N/A (has excision and destruction) | -- | Neutral |
| After-hours billing | 0% | Normal | Neutral |
| G2211 ratio | 0.12 | Between p25-p75 | Neutral |
| Consistency checks (7) | 0 fired | -- | All neutral |

Green count: 9. Neutral count: 17. Red count: 0. Total applicable: 26.

```
ratio_analysis_score = ((9 * 1.0) + (17 * 0.5) + (0 * 0.0)) / 26 * 100
                     = (9.0 + 8.5 + 0) / 26 * 100
                     = 17.5 / 26 * 100
                     = 67.3
```

```
billing_quality_composite = (100 * 0.35) + (67.3 * 0.65)
                          = 35.0 + 43.7
                          = 78.7
```

Provider A scores **78.7** on billing quality. Clean charge ratio, strong green flags across biopsy, destruction, and excision ratios. No red flags. This is a Florida dermatologist who biopsies suspicious lesions, treats AKs at a healthy rate, excises cancers, repairs wounds, and takes multiple biopsies when patients have multiple suspicious lesions. The biopsy-to-destruction ratio is in the healthy range, meaning they confirm diagnoses before treating. Textbook general dermatology billing profile.

---

### Provider B: AK Destruction Volume Outlier in Arizona

Provider B in Arizona. Medicare data for 2023.

**Charge analysis:**
Provider B charges $520,000 total, Medicare allowed $148,000. Ratio = **3.51x**.

**AZ peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.60x | 1.90x | 2.30x | 2.85x | 3.45x |

Provider B ratio of 3.51x is above p90 (3.45x). Charge score = **40**. Direction = **above_peers**.

Per-code analysis shows: 17000 at 4.2x peer median (flagged), 17004 at 5.1x peer median (flagged), 99214 at 3.8x peer median (flagged). Provider B's pricing is aggressive on AK destruction codes specifically, and generally elevated across the board.

**Ratio analysis:**
Provider B's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99213 at 28%, 99214 at 48%, 99215 at 14% | 99215 above 12%, 99214+99215 above peer p90 | Red |
| Biopsy-to-visit | 0.06 | Below peer p25 | Signal |
| AK treatment-to-visit | 0.72 | Above peer p90 | Neutral (high is not bad for green, but extreme) |
| Biopsy-to-destruction | 0.04 | Below 0.15, below peer p25 | Signal |
| Excision-to-biopsy | 0.08 | Below 0.10 | Signal |
| Repair-to-excision | 0.00 | Zero repairs with excisions | Signal |
| Multiple biopsy rate | 0.15 | Below 0.30, below peer p25 | Signal |
| Procedure density | 1.45 | Above peer p90 | Green |
| AK burden indicator | 0.55 | Above 0.40, above peer p90 | Signal |
| Return visit intensity | 4.8 visits/bene | Above peer p90 | Red |
| New-to-established | 8% | Below peer p10 | Red |
| Destruction without biopsy | Does NOT fire (has some biopsies) | -- | Neutral |
| AK per beneficiary | 4.2 | Above peer p95 | Red |
| Excision without repair | Fires (18 excisions, 0 repairs) | -- | Yellow |
| Single-code dominance | 32% (17003) | 17003 is expected to be high | Neutral |
| E/M trend | +7% over 2 years | Above peer p90 | Red |
| Biopsy without treatment | N/A (has destruction) | -- | Neutral |
| After-hours billing | 0% | Normal | Neutral |
| G2211 ratio | 0.58 | Above peer p90 | Red |
| Destruction but no biopsy (consistency) | Does not fire | -- | Neutral |
| Biopsy but no excision/destruction | Does not fire | -- | Neutral |
| Malignant excision but no biopsy | Does not fire (has biopsies) | -- | Neutral |
| Repair but no excision | Does not fire | -- | Neutral |
| Phototherapy but few visits | Does not fire | -- | Neutral |
| Intralesional injection but no biopsy | Does not fire | -- | Neutral |
| Pathology high relative to biopsies | Does not fire | -- | Neutral |

Green count: 1. Neutral count: 18. Red count: 6. Yellow count: 1. Total applicable: 26.

```
ratio_analysis_score = ((1 * 1.0) + (19 * 0.5) + (6 * 0.0)) / 26 * 100
                     = (1.0 + 9.5 + 0) / 26 * 100
                     = 10.5 / 26 * 100
                     = 40.4
```

```
billing_quality_composite = (40 * 0.35) + (40.4 * 0.65)
                          = 14.0 + 26.3
                          = 40.3
```

Provider B scores **40.3** on billing quality. This provider tells a specific story: extremely high AK destruction volume (4.2 treatments per patient, above the 95th percentile), with 55% of AK sessions involving 15+ lesions, but a biopsy-to-destruction ratio of only 0.04 (they destroy roughly 25 lesions for every one they biopsy). They are coding E/M at higher complexity than 90% of peers with escalating trends. Patients return 4.8 times per year and virtually no new patients are being seen (8% new patient rate, suggesting a captive panel returning repeatedly for AK destruction).

This is the classic AK destruction billing pattern that OIG audits target. The provider may legitimately practice in a retirement community where sun-damaged patients have heavy AK burden. But the combination of extreme destruction volume, minimal biopsy, low new patient rate, high return visits, and aggressive pricing is a pattern, not a single outlier. Every dimension of the billing points in the same direction.


---

# PART E: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **AAD Guidelines Concordance** | Does this provider follow AAD guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal dermatologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is practice consistent across payers? | Access proxy |
| **Billing Quality** | Are their charges, ratios, and E/M distribution in line with peers? | Pricing + integrity check |

Billing quality is the integrity layer. It checks pricing behavior (charge-to-allowed) AND practice pattern behavior (procedure ratios). A provider can score well on the other four scores but get flagged here for upcoding, unusual AK destruction patterns, or pricing outliers.

| Scenario | Guidelines | Peer | Volume | Payer | Billing |
|---|---|---|---|---|---|
| Good dermatologist, normal billing | High | High | High | High | High |
| Good dermatologist, aggressive pricing | High | High | High | High | Low (charge ratio outlier) |
| Provider upcoding E/M levels | High | High | High | High | Low (red flag on E/M distribution) |
| High biopsy/destruction volume, unusual ratios | High | High (bills the codes) | High (volume is real) | High | Low (biopsy-to-destruction ratio off, possible over-testing) |
| Provider who biopsies but never treats results | High | Medium (skewed code mix) | Medium | High | Low (red flag 7H fires, consistency check fires) |
| AK destruction volume outlier | High | High (bills destruction codes) | High (volume is real) | High | Low (red flag 7D fires, AK burden indicator off) |
| Aggressive pricing on procedures | High | High | High | High | Low (charge ratio outlier, per-code outliers on procedural codes) |
| Medical derm practice, clean billing | High | Low (different code mix) | Medium | High | High (ratios are internally consistent) |
| Low-quality provider, clean billing | Low | Low | Low | Low | High |

The green and red flags in this doc add nuance the other scores miss. A provider with a great peer comparison score (they bill all the right codes) but whose AK destruction per beneficiary is in the 95th percentile is destroying more lesions per patient than almost all peers. The volume adequacy doc sees "high AK destruction volume" as potentially adequate. This doc asks "is that destruction volume reasonable relative to the number of patients, and are they biopsying at a reasonable rate relative to destruction?"

Similarly, a provider who follows AAD guidelines on paper but biopsies 50+ lesions and never excises or destroys a single one is diagnosing without treating. That is either a referral-heavy practice model or a billing pattern that needs explanation.

The AK destruction checks deserve special attention in the five-score framework. A provider can score well on guidelines (AKs should be treated), peer comparison (they bill the standard AK codes), and volume (they have high volume). But this doc catches whether the pattern of AK billing makes clinical sense: is the ratio of 17004 to total AK treatment reasonable? Is the per-patient volume within normal bounds? Is the provider biopsying at a rate that suggests they confirm what they are destroying?


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed analysis uses Medicare data, which is STRONG for dermatology.** Unlike pediatrics, where Medicare coverage is minimal, dermatology patients with skin cancer are predominantly Medicare-age. The charge-to-allowed analysis covers a significant portion of most dermatologists' procedural practice. This is a strength of the dermatology billing quality score compared to pediatrics. It is not quite as dominant as urology (where nearly all patients are Medicare-age), but it is strong.

**Procedure ratios use aggregated data, not same-day linkage.** We cannot confirm that a specific biopsy was performed on the same day as a specific office visit. We can only check whether the total volumes are proportional. Some ideal checks (did the provider biopsy before every destruction? Was the pathology result received before the excision?) require claims-level data and are reserved for MA APCD or similar.

**E/M distribution is co-dominant at 99213/99214 for dermatology, and that is expected.** The benchmarks in this doc are calibrated to dermatology peers. A 99213 rate of 40% alongside a 99214 rate of 38% is normal in dermatology, not a red flag. We compare to dermatologists, not to all providers. Anyone applying primary care benchmarks (99213 dominant) or urology benchmarks (99214 dominant) to dermatology will generate false positives.

**AK destruction billing is a known national audit target.** OIG and CMS have repeatedly identified AK destruction as the most common area of billing fraud in dermatology. The ratio checks in this doc give extra scrutiny to AK patterns (green flag 6B, 6C, 6H, red flag 7C, 7D, consistency check 1). This is intentional. A red flag on AK destruction is a higher-signal finding than a red flag on most other checks because of the known fraud risk in this area.

**Case mix affects ratios significantly in dermatology.** A skin cancer-focused practice will have very different ratios than a medical dermatology practice (acne, eczema, psoriasis). A dermatologist serving a retirement community in Arizona will have different AK volumes than one serving a young urban population. Without diagnosis codes, we cannot adjust for case mix. Peer comparisons assume the average dermatologist sees a mix of conditions. Practice-model outliers will deviate. Red flags need investigation, not automatic penalty.

**Cosmetic dermatology is invisible in this data.** CMS data only captures Medicare and Medicaid billing. A dermatologist who spends 50% of their time on cosmetic procedures (Botox for cosmetic purposes, fillers, laser resurfacing) will have lower government-payer volume than peers. Their ratios may look different because their denominator (total E/M visits) is lower than their actual patient volume. We cannot see private-pay cosmetic volume.

**Mohs surgeons are excluded by taxonomy, but some general dermatologists perform Mohs.** A general dermatologist billing under 207N00000X who also performs Mohs surgery will have a code mix that includes Mohs codes (17311, 17312, 17313, 17314). Their procedure ratios will skew toward surgical patterns. The taxonomy filter catches dedicated Mohs surgeons but not general dermatologists who have added Mohs to their practice. Red flags on these providers should be evaluated in the context of their actual practice scope.

**A red flag is not an accusation.** It means a ratio is statistically unusual compared to peers. There may be a valid explanation. A provider with extremely high AK destruction per beneficiary might practice in a geographic area with high sun exposure and an elderly population with extensive AK burden. The score surfaces signals for investigation, not verdicts.

**Geographic variation affects all ratios.** State Medicaid policy, local referral patterns, urban/rural differences, and sun exposure patterns all shape billing patterns. A dermatologist in Florida or Arizona will treat more AKs than one in Oregon. State-level peer grouping captures most of this, but within-state variation (coastal vs. inland, retirement community vs. university town) can still affect comparisons. Sub-state grouping (ZIP-3 or CBSA) would help.


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
| biopsy_to_visit_ratio | float | (11102 + 11104) / total E/M visits |
| biopsy_visit_flag | string | "green", "neutral", or "signal" |
| ak_treatment_to_visit_ratio | float | (17000 + 17003 + 17004) / total E/M visits |
| ak_treatment_flag | string | Flag |
| biopsy_to_destruction_ratio | float | (11102 + 11104) / (17000 + 17003 + 17004) |
| biopsy_destruction_flag | string | Flag |
| excision_to_biopsy_ratio | float | (11600 + 11640) / (11102 + 11104) |
| excision_biopsy_flag | string | Flag |
| repair_to_excision_ratio | float | 12001 / (11600 + 11640 + 11400 + 11440) |
| repair_excision_flag | string | Flag |
| multi_biopsy_ratio | float | (11103 + 11105) / (11102 + 11104) |
| multi_biopsy_flag | string | Flag |
| procedure_density | float | total procedure services / total E/M visits |
| procedure_density_flag | string | Flag |
| ak_15plus_ratio | float | 17004 / (17000 + 17003 + 17004) |
| ak_burden_flag | string | Flag |
| **Red Flag Ratios** | | |
| visits_per_beneficiary | float | Total E/M services / unique beneficiaries |
| return_visit_flag | string | "green", "neutral", or "red" |
| new_patient_pct | float | New patient visits / total E/M visits |
| new_patient_flag | string | Flag |
| destruction_without_biopsy | boolean | (17000 + 17003 + 17004) > 50 AND (11102 + 11104) = 0 |
| destruction_without_biopsy_flag | string | Flag |
| ak_per_beneficiary | float | (17000 + 17003 + 17004) / total beneficiaries |
| ak_volume_flag | string | Flag (uses p95 threshold) |
| excision_without_repair | boolean | (11600 + 11640) > 20 AND 12001 = 0 |
| excision_without_repair_flag | string | Flag |
| max_single_code_pct | float | Highest single-code % of total services |
| dominant_code | string | HCPCS code with highest volume share |
| single_code_dominance_flag | string | Flag |
| em_complexity_trend | float | Change in high-complexity % from earliest to latest year |
| em_trend_flag | string | Flag (multi-year) |
| biopsy_without_treatment | boolean | (11102 + 11104) > 50 AND (11600 + 11640 + 17000) = 0 |
| biopsy_without_treatment_flag | string | Flag |
| after_hours_pct | float | 99051 / total E/M visits |
| after_hours_flag | string | Flag |
| g2211_ratio | float | G2211 / total established E/M visits |
| g2211_flag | string | Flag |
| **Cross-Category Consistency** | | |
| consistency_flags | int | Count of cross-category consistency checks that fired (0-7) |
| consistency_flag_list | string | Comma-separated names of fired consistency checks |
| consistency_destruction_no_biopsy | boolean | Fires if destruction > 50 AND biopsy = 0 |
| consistency_biopsy_no_treatment | boolean | Fires if biopsy > 50 AND excision = 0 AND destruction = 0 |
| consistency_excision_no_biopsy | boolean | Fires if malignant excision > 10 AND biopsy = 0 |
| consistency_repair_no_excision | boolean | Fires if 12001 > 10 AND all excision codes = 0 |
| consistency_phototherapy_few_visits | boolean | Fires if 96910 > 20 AND total E/M < 30 |
| consistency_injection_no_biopsy | boolean | Fires if 11900 > 20 AND biopsy = 0 |
| consistency_pathology_high | boolean | Fires if 88305 > (biopsy * 2) |
| **Composite** | | |
| total_checks_run | int | Number of ratio checks with sufficient data to evaluate |
| green_flag_count | int | Number of ratio checks flagged green |
| neutral_flag_count | int | Number flagged neutral/yellow |
| red_flag_count | int | Number of ratio checks flagged red |
| ratio_analysis_score | float | Weighted roll-up of all ratio flags (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score (or ratio only if no Medicare) |
