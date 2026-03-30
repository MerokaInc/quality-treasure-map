# Pediatric Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other three docs ask about clinical practice: does this provider screen, vaccinate, follow guidelines? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** — is their pricing in line with peers?
2. **Procedure-to-procedure ratios** — do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that shouldn't go together, or go together too often)?
3. **E/M level distribution** — are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

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
| average_submitted_chrg_amt | What the provider charged (their list price) |
| average_medicare_allowed_amt | What Medicare says the service is worth (the allowed amount) |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Pediatric Medicine |

**CMS Medicaid Provider Spending** — for procedure ratio analysis

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined, giving us full pediatric volume.

**The pediatric Medicare limitation still applies for charge ratios:** Medicare covers few children. But the procedure ratio checks work with Medicaid data too, which is where the real pediatric volume lives.


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

A ratio of 2.0x means the provider charges, on average, twice what Medicare allows. This is normal. Most providers charge above the Medicare fee schedule. The question is: how does this ratio compare to what other pediatricians charge?


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual. Could indicate a practice that has never updated its fee schedule, or one that primarily serves government-payer patients. |
| 1.5x - 3.0x | Typical range for most providers. Charges are above Medicare allowed but within normal commercial pricing. |
| 3.0x - 5.0x | High charges relative to Medicare. May reflect aggressive pricing, a high-cost market, or a practice that negotiates high commercial rates and uses the same fee schedule for Medicare. |
| >5.0x | Outlier. Worth investigating. Could be billing errors, upcoding, or a fee schedule that has not been reconciled with actual service costs. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Could be data error, or a provider in an unusual payment arrangement. |


## 2. Building the Peer Distribution

The peer distribution is what makes this score meaningful. A ratio of 2.5x means nothing in isolation. It means something when you know the peer median is 2.3x.


### Geographic Grouping

Charge-to-allowed ratios vary significantly by geography because of differences in cost of living, commercial payer rates, and local market dynamics. A pediatrician in Manhattan charging 3.5x may be normal for that market. A pediatrician in rural Mississippi charging 3.5x is an outlier.

Peer distributions are built at the **state level** by default:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All pediatric NPIs (taxonomy 208000000X, >= 10 Medicare services) in the same state | Primary scoring. Captures local market pricing norms. |
| **National** | All states combined | Secondary benchmark. Cross-state comparison: "how does pediatric pricing in MA compare to TX?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | When state cohorts are large enough. Urban vs. rural have very different pricing dynamics. |

The minimum peer cohort size is 30 providers. If a state has fewer than 30 pediatric NPIs with Medicare data, fall back to national.


### Computing Peer Anchors

From the state-level peer cohort, compute the following percentile anchors:

```
peer_cohort = all pediatric NPIs in the same state
    WHERE taxonomy_code = '208000000X'
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio across peer_cohort
peer_p25 = 25th percentile
peer_median = 50th percentile (median)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Example peer anchors (national pediatric, illustrative):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.40x |
| p25 | ~1.75x |
| Median | ~2.20x |
| p75 | ~2.85x |
| p90 | ~3.60x |

These are illustrative. Actual anchors should be computed from the real CMS data once loaded. They will differ by state.


## 3. Scoring Bands

The score uses three bands based on where the provider's ratio falls in the peer distribution:

```
provider_ratio = charge_to_allowed_ratio for this NPI

IF peer_p25 <= provider_ratio <= peer_p75:
    billing_quality_score = 100        -- inside the middle 50%, normal

ELIF peer_p10 <= provider_ratio <= peer_p90:
    billing_quality_score = 70         -- inside the middle 80%, somewhat unusual

ELSE:
    billing_quality_score = 40         -- outside the middle 80%, outlier
```

| Band | Range | Score | Interpretation |
|---|---|---|---|
| Normal | p25 to p75 | 100 | Provider's pricing is within the typical range for pediatric peers in this state. No signal. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | Provider is in the tails of the peer distribution but not extreme. Could reflect market positioning, not a problem. |
| Outlier | Below p10 or above p90 | 40 | Provider's pricing is significantly different from peers. Worth investigating. Not an automatic fail. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 2.5x is not "better" than 2.8x in any clinical sense. Both are normal. The purpose of this score is to flag outliers, not to rank providers. A three-band system (normal / somewhat unusual / outlier) communicates this clearly: you are either in line with peers, at the edge, or outside the norm.


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

This layer answers: "is the provider's pricing outlier status driven by one or two codes, or is it across the board?" A provider who charges 5x the peer median for 99214 but is normal on everything else has a different story from one who is 3x+ on every code.


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

**What normal looks like in pediatrics:**

| Code | Level | Typical Peer Distribution |
|---|---|---|
| 99211 | Minimal (nurse visit) | ~1-3% |
| 99212 | Straightforward | ~2-5% |
| 99213 | Low complexity | ~45-55% (the dominant code) |
| 99214 | Moderate complexity | ~30-40% |
| 99215 | High complexity | ~3-8% |

99213 should be the most-billed code for a general pediatrician. That is the standard sick visit: ear infection, strep throat, rash, URI.

**Red flag:** Provider's 99214+99215 combined is above the peer p90. This means they bill at higher complexity than 90% of peers. Possible explanations: upcoding, or a genuinely sicker panel (but unlikely for general peds).

**Red flag:** Provider's 99215 alone exceeds 15% of E/M volume. Very high complexity visits should be rare in general pediatrics.

**Green flag:** Provider's distribution closely matches peer median (all levels within 10 percentage points of peer median).

```
high_complexity_pct = (services_99214 + services_99215) / em_total

peer_p90_high_complexity = 90th percentile of high_complexity_pct across peer cohort

em_distribution_flag = "red"  IF high_complexity_pct > peer_p90_high_complexity
                      "yellow" IF high_complexity_pct > peer_p75_high_complexity
                      "green"  IF high_complexity_pct <= peer_p75_high_complexity
```


## 6. Green Flag Ratios (Good Practice Signals)

These ratios indicate a provider is doing things right. High ratios compared to peers are positive signals.


### 6A. Screening-to-Visit Ratio

Does the provider screen at a rate proportional to their preventive visit volume?

```
dev_screening_ratio = services_96110 / (services_99391 + services_99392)
    -- developmental screens per infant/toddler preventive visit
    -- AAP says 3 screens in first 30 months, so ideal ratio approaches 0.5-1.0

behavioral_screening_ratio = services_96127 / (services_99393 + services_99394)
    -- behavioral/emotional screens per school-age/adolescent preventive visit
    -- depression + ADHD screening, ideal ratio > 0.5

vision_screening_ratio = (services_99173 + services_99177) / (services_99392 + services_99393 + services_99394)
    -- vision screens per preventive visit ages 1-17

hearing_screening_ratio = services_92551 / (services_99392 + services_99393 + services_99394)
    -- hearing screens per preventive visit ages 1-17
```

**Green flag:** Any of these ratios above the peer p75. Provider screens more actively than most peers.

**Neutral:** Between peer p25 and p75.

**Signal (not necessarily red):** Below peer p25. Provider screens less than most peers. Could be legitimate (subspecialist panel, different workflow), but worth noting.


### 6B. Immunization Efficiency Ratio

Does the provider give multiple vaccines per visit (efficient, normal for well-child visits)?

```
vaccines_per_admin_visit = (services_90461) / (services_90460)
    -- 90460 = first component, 90461 = each additional component
    -- a ratio of 3-5 means 4-6 total vaccine components per immunization visit
    -- this is normal for infant well-child visits (multiple vaccines given together)
```

**Green flag:** Ratio of 3.0+ (provider gives 4+ vaccines per immunization visit, consistent with ACIP schedule bundling).

**Signal:** Ratio below 1.0. Provider gives only 1-2 vaccines per visit, which is unusual and may indicate incomplete immunization at each visit.


### 6C. Preventive-to-Sick Visit Ratio

What proportion of this provider's office visits are preventive?

```
preventive_ratio = (services_99381 + ... + services_99395) /
                   (services_99381 + ... + services_99395 + services_99211 + ... + services_99215)
```

**Green flag:** Ratio above peer p75. Provider's practice is more prevention-oriented than most peers.

**Neutral:** Between p25 and p75.

**Signal:** Below peer p25. Practice is overwhelmingly sick visits. Could be a walk-in clinic model, not necessarily bad, but atypical for general pediatrics.


## 7. Red Flag Ratios (Warning Signals)

These ratios indicate potential problems: unusual billing patterns, possible complications, or codes that should not appear together at high rates.


### 7A. Return Visit Intensity

How many total visits does each patient have per year? Patients coming back unusually often could signal inadequate initial treatment, unnecessary follow-ups, or billing anomalies.

```
visits_per_beneficiary = total_em_services / total_unique_beneficiaries
    -- (from Medicare "By Provider" file which has both)

peer_median_visits_per_bene = MEDIAN across peer cohort
peer_p90_visits_per_bene = 90th percentile
```

**Red flag:** `visits_per_beneficiary` above peer p90. Provider's patients come back significantly more than peers' patients.

**Neutral:** Between p25 and p75.

Note: high visit intensity can be legitimate (managing complex chronic conditions). But for general pediatrics, most patients should be well-child visits + occasional sick visits. A very high ratio is unusual.


### 7B. New-to-Established Patient Ratio

What proportion of visits are new patients vs. established?

```
new_patient_pct = (services_99201 + ... + services_99205 + services_99381 + ... + services_99385) /
                  total_em_services
```

**Red flag (high):** New patient percentage far above peer p90. Could indicate high patient turnover (patients leaving the practice), or a practice that codes established patients as new (billing error or fraud).

**Red flag (very low):** New patient percentage near zero. Could indicate a closed panel or a practice not accepting new patients. Not a billing issue, but a signal about practice accessibility.


### 7C. High-Complexity Screening Ratio

Does the provider bill high-complexity visits (99214/99215) at the same rate as peers for visits where screening codes are also billed?

```
screening_visit_complexity = services_99214_or_99215_on_screening_days /
                              total_screening_services
```

This cannot be computed with aggregated data (we do not have same-day linkage). **Reserve for MA APCD or claims-level data.** Document as future red flag check.


### 7D. After-Hours Billing Rate

```
after_hours_pct = services_99051 / total_em_services
```

**Red flag:** Above peer p90. Unusually high proportion of visits billed as after-hours. Could be legitimate (evening/weekend clinic) or could be inflated to collect the add-on payment.

**Neutral:** Most providers bill 99051 at 0-3% of visits.


### 7E. Vaccine Product Without Administration (or Vice Versa)

A vaccine product code (e.g., 90707 for MMR) should always appear with an administration code (90460 or 90471). If a provider bills many product codes but very few admin codes (or vice versa), something is off.

```
product_codes = SUM(services) for all vaccine product codes (90633-90744, etc.)
admin_codes = SUM(services) for administration codes (90460, 90461, 90471-90474)

product_to_admin_ratio = product_codes / admin_codes
```

**Red flag:** Ratio far below 0.5 or above 3.0. These should be roughly proportional (each vaccine product needs an administration). Extreme imbalance suggests billing errors.

**Normal range:** 0.8 to 2.0 (multiple product components per admin event is normal).


## 8. Scoring the Ratio Analysis

Each ratio check produces a flag: green, neutral/yellow, or red. We roll them up into a single ratio analysis score.

```
ratio_checks = [
    em_distribution_flag,           -- Section 5
    dev_screening_ratio_flag,       -- Section 6A
    behavioral_screening_ratio_flag,-- Section 6A
    vision_screening_ratio_flag,    -- Section 6A
    hearing_screening_ratio_flag,   -- Section 6A
    immunization_efficiency_flag,   -- Section 6B
    preventive_ratio_flag,          -- Section 6C
    return_visit_flag,              -- Section 7A
    new_patient_ratio_flag,         -- Section 7B
    after_hours_flag,               -- Section 7D
    product_admin_ratio_flag        -- Section 7E
]

green_count = COUNT WHERE flag = "green"
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


## 5. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "MA"

STEP 1: Compute provider ratio
    charges = SUM(average_submitted_chrg_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023
    allowed = SUM(average_medicare_allowed_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023

    IF allowed = 0 OR total services < 10: RETURN insufficient_data

    provider_ratio = charges / allowed

STEP 2: Build peer distribution
    peer_cohort = all NPIs WHERE taxonomy = '208000000X'
        AND state = "MA" AND total_medicare_services >= 10

    IF COUNT(peer_cohort) < 30: use national cohort instead

    Compute peer_p10, peer_p25, peer_median, peer_p75, peer_p90

STEP 3: Score
    IF peer_p25 <= provider_ratio <= peer_p75:
        score = 100
    ELIF peer_p10 <= provider_ratio <= peer_p90:
        score = 70
    ELSE:
        score = 40

STEP 4: Flag direction
    IF provider_ratio > peer_p75:
        direction = "above_peers"
    ELIF provider_ratio < peer_p25:
        direction = "below_peers"
    ELSE:
        direction = "in_range"

STEP 5: Per-code analysis (optional)
    For each HCPCS code, compute code_deviation and flag outliers.
```


## 6. Worked Example

Provider A in Massachusetts. Medicare data for 2023.

**Provider ratio:** Charges $180,000 total, Medicare allowed $78,000. Ratio = **2.31x**.

**MA peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.42x | 1.78x | 2.25x | 2.90x | 3.55x |

Provider A ratio of 2.31x falls between p25 (1.78x) and p75 (2.90x). Score = **100**. Direction = **in_range**.

---

Provider B in Massachusetts.

**Provider ratio:** Charges $320,000 total, Medicare allowed $72,000. Ratio = **4.44x**.

Same MA peer anchors. Provider B ratio of 4.44x is above p90 (3.55x). Score = **40**. Direction = **above_peers**.

Per-code analysis shows: 99214 at 6.2x peer median (flagged), 90460 at 5.1x peer median (flagged), all other codes within 1.5x. Two outlier codes are driving the overall ratio.


---

# PART E: HOW THIS FITS WITH THE OTHER THREE SCORES

---


## 11. The Four Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider do what AAP says? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal pediatrician? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume real? | Behavior check |
| **Billing Quality** | Are their charges and procedure ratios in line with peers? | Pricing + integrity check |

Billing quality is the integrity layer. It checks pricing behavior (charge-to-allowed) AND practice pattern behavior (procedure ratios). A provider can score 100 on the other three scores but get flagged here for upcoding, unusual return visit intensity, or pricing outliers.

| Scenario | Guideline | Peer | Volume | Billing |
|---|---|---|---|---|
| Good provider, normal billing | High | High | High | High |
| Good provider, aggressive pricing | High | High | High | Low (charge ratio outlier) |
| Good provider, upcoding E/M levels | High | High | High | Low (red flag on E/M distribution) |
| Good screener but patients keep returning | High | High | High | Medium (green on screening ratios, red on return visit intensity) |
| Low-quality provider, clean billing | Low | Low | Low | High |

The green and red flags in this doc add nuance the other scores miss. A provider with a great peer comparison score (they bill all 25 codes) but whose 96110-to-preventive-visit ratio is near zero is billing the code without doing it proportionally. The volume adequacy doc catches some of this, but the ratio analysis catches the relationships between codes, not just their individual volumes.


---

# PART F: RISKS AND LIMITATIONS

---


## 12. Risks

**Charge-to-allowed analysis is Medicare-only.** Medicaid does not publish charge-vs-allowed detail. Pediatric Medicare volume is low. We require >= 10 Medicare services to score the charge ratio. Providers with no Medicare data get scored on procedure ratios only.

**Procedure ratios use aggregated data, not same-day linkage.** We cannot confirm that a specific screening happened on the same day as a specific visit. We can only check whether the total volumes are proportional. Some ratio checks (7C: high-complexity screening visits) require claims-level data and are reserved for MA APCD.

**E/M distribution varies by practice model.** A pediatrician managing complex chronic conditions (diabetes, severe asthma) may legitimately bill more 99214/99215 than a provider seeing mostly well-child and URI. The upcoding check flags statistical outliers, not clinical judgments. Red flags need investigation, not automatic penalty.

**Return visit intensity depends on panel complexity.** A practice specializing in ADHD management will have higher visits-per-beneficiary than one doing mostly well-child care. Without diagnosis codes, we cannot adjust for panel complexity.

**Green flags are signals, not guarantees.** A high screening-to-visit ratio means the provider bills screening codes proportionally. It does not confirm the screening was done correctly.

**Geographic variation affects all ratios.** State Medicaid policy, local referral patterns, and urban/rural differences all shape billing patterns. State-level peer grouping captures most of this. Sub-state grouping would help.

**A red flag is not an accusation.** It means a ratio is statistically unusual compared to peers. There may be a valid explanation. The score surfaces signals for investigation.


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
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort was used |
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
| em_99213_pct | float | % of office visits billed as 99213 |
| em_99214_pct | float | % of office visits billed as 99214 |
| em_99215_pct | float | % of office visits billed as 99215 |
| em_high_complexity_pct | float | (99214 + 99215) / total E/M visits |
| em_distribution_flag | string | "green", "yellow", or "red" |
| **Green Flag Ratios** | | |
| dev_screening_ratio | float | 96110 / (99391 + 99392) |
| dev_screening_flag | string | "green", "neutral", or "signal" |
| behavioral_screening_ratio | float | 96127 / (99393 + 99394) |
| behavioral_screening_flag | string | Flag |
| vision_screening_ratio | float | (99173 + 99177) / preventive visits ages 1-17 |
| vision_screening_flag | string | Flag |
| hearing_screening_ratio | float | 92551 / preventive visits ages 1-17 |
| hearing_screening_flag | string | Flag |
| immunization_efficiency_ratio | float | 90461 / 90460 (components per admin visit) |
| immunization_efficiency_flag | string | Flag |
| preventive_to_sick_ratio | float | Preventive visits / total E/M visits |
| preventive_ratio_flag | string | Flag |
| **Red Flag Ratios** | | |
| visits_per_beneficiary | float | Total E/M services / unique beneficiaries |
| return_visit_flag | string | "green", "neutral", or "red" |
| new_patient_pct | float | New patient visits / total E/M visits |
| new_patient_flag | string | Flag |
| after_hours_pct | float | 99051 / total E/M visits |
| after_hours_flag | string | Flag |
| product_to_admin_ratio | float | Vaccine product codes / admin codes |
| product_admin_flag | string | Flag |
| **Composite** | | |
| green_flag_count | int | Number of ratio checks flagged green |
| red_flag_count | int | Number of ratio checks flagged red |
| ratio_analysis_score | float | Weighted roll-up of all ratio flags (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score (or ratio only if no Medicare) |
