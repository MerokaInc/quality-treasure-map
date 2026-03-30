# Pediatric Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other three docs ask about clinical practice: does this provider screen, vaccinate, follow guidelines? This doc asks about billing behavior: does this provider's charge-to-allowed ratio look normal compared to pediatric peers?

For Medicare-coded services, we compare the provider's average charge-to-allowed ratio with the pediatric peer distribution. This is not a clinical standard. It is an integrity and plausibility check. A provider whose charges are wildly out of line with what Medicare allows, either far above or far below peers, may have unusual billing practices worth investigating.

The metric is simple: `average charge / average allowed`. The standard is the peer distribution.


---

# PART A: WHAT WE HAVE

---

This score uses one dataset:

**CMS Medicare Physician & Other Practitioners (By Provider and Service)**

Source: https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged (their list price) |
| average_medicare_allowed_amt | What Medicare says the service is worth (the allowed amount) |
| average_medicare_payment_amt | What Medicare actually paid |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Pediatric Medicine |

The Medicaid Provider Spending file does NOT have charge or allowed amounts at this level of detail. It only has total spending. So this score is Medicare-only.

**The pediatric limitation still applies:** Medicare covers few children. But this file captures every service a pediatric provider bills to Medicare, including young adults aging out of pediatric care, dual-eligible patients, and vaccine administration that sometimes touches Medicare. The charge-to-allowed ratio is a billing behavior metric, not a clinical quality metric. Even low Medicare volume reveals pricing patterns.


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

# PART C: BUSINESS LOGIC

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

# PART D: HOW THIS FITS WITH THE OTHER THREE SCORES

---


## 7. The Four Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider do what AAP says? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal pediatrician? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume real? | Behavior check |
| **Billing Quality** | Are their charges in line with peers? | Pricing / integrity check |

Billing quality is the integrity layer. It does not measure clinical care. It measures whether the provider's pricing behavior is consistent with their peer market. A provider can score 100 on guideline concordance, peer comparison, and volume adequacy, but 40 on billing quality if their charges are extreme outliers.

| Scenario | Guideline | Peer | Volume | Billing |
|---|---|---|---|---|
| Good provider, normal pricing | High | High | High | 100 |
| Good provider, aggressive pricing | High | High | High | 40-70 |
| Low-quality provider, normal pricing | Low | Low | Low | 100 |
| Billing anomaly (potential fraud signal) | Varies | Varies | Varies | 40 |

The billing quality score is not a quality score. It is a plausibility check. It answers: "is there anything unusual about how this provider prices their services?" That context is useful for an employer evaluating whether to direct-contract with a practice.


---

# PART E: RISKS AND LIMITATIONS

---


## 8. Risks

**This is Medicare data only.** The Medicaid Provider Spending file does not have charge-vs-allowed detail. Pediatric Medicare volume is low. Some providers may have very few Medicare services, making their ratio unstable. We require a minimum of 10 services to score, but even that can be noisy.

**Charge-to-allowed ratio is not inherently good or bad.** A high ratio does not mean a provider is overcharging. It may mean they negotiate high commercial rates and use the same fee schedule for all payers. A low ratio does not mean a provider is generous. It may mean they never updated their fee schedule. The score flags outliers for investigation, not for judgment.

**Geographic variation is real and large.** A provider in a high-cost urban market will have a higher ratio than one in a rural low-cost market, even if both are pricing normally for their area. State-level peer grouping helps, but within-state variation (urban vs. rural) exists. Sub-state grouping (ZIP-3 or CBSA) would improve this, but requires larger cohort sizes.

**Per-code analysis depends on sufficient peer volume per code.** If only 5 peers in the state bill a specific HCPCS code, the peer median for that code is unreliable. Require a minimum of 10 peers per code for per-code analysis. Otherwise, skip that code.

**Peer anchors should be rebuilt annually.** Medicare fee schedules change, provider pricing changes, and market dynamics shift. Recompute the peer distribution each measurement year.

**A score of 40 is not an accusation.** It means the provider's pricing is statistically unusual compared to peers. There may be a perfectly valid explanation. The score's job is to surface the signal, not to diagnose it.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code, derived from ZIP |
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort was used |
| peer_cohort_state | string | State of the peer cohort (or "US" if national) |
| peer_cohort_size | int | Number of peers in the cohort |
| total_medicare_services | int | Total Medicare services for this NPI in measurement year |
| total_charges | float | SUM(avg_charge * services) across all codes |
| total_allowed | float | SUM(avg_allowed * services) across all codes |
| charge_to_allowed_ratio | float | total_charges / total_allowed |
| peer_p10 | float | 10th percentile of peer cohort ratios |
| peer_p25 | float | 25th percentile |
| peer_median | float | 50th percentile |
| peer_p75 | float | 75th percentile |
| peer_p90 | float | 90th percentile |
| billing_quality_score | float | 100 (normal), 70 (somewhat unusual), or 40 (outlier) |
| direction | string | "in_range", "above_peers", or "below_peers" |
| outlier_code_count | int | Number of HCPCS codes where provider ratio > 2x or < 0.5x peer median (optional) |
| outlier_code_pct | float | outlier_code_count / total codes billed * 100 (optional) |
| outlier_code_list | string | Comma-separated HCPCS codes flagged as outliers (optional) |
