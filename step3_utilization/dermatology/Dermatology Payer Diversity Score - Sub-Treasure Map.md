# Dermatology Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A provider who bills 17000 (destruction of premalignant lesion) to Medicare but not Medicaid, and 99214 (office visit) to both, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel skews heavily toward one payer population (common in dermatology where Medicare patients dominate due to skin cancer and actinic keratoses in older adults).

This is an access proxy, not a clinical quality measure. It tells you how broad-based the provider's practice is across payer types.


---

# PART A: WHAT WE HAVE

---

This score requires both CMS files:

**CMS Medicare Physician & Other Practitioners** -- NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** -- NPI + HCPCS codes billed to Medicaid

We only need to know which HCPCS codes appear in each file for a given NPI. Volume does not matter for the core metric. Presence is enough.

**NPPES NPI Registry** -- provider identification, taxonomy, geography.


---

# PART B: THE LOGIC

---


## 1. The Metric: Both-Payer Code Overlap

For a given NPI, collect the set of distinct HCPCS codes from each file:

```
medicare_codes = SET of distinct hcpcs_code WHERE npi = X
    from Medicare Physician & Other Practitioners (any service count > 0)

medicaid_codes = SET of distinct hcpcs_code WHERE npi = X
    from Medicaid Provider Spending (any claim count > 0)

all_codes = medicare_codes UNION medicaid_codes
both_payer_codes = medicare_codes INTERSECT medicaid_codes

payer_overlap = COUNT(both_payer_codes) / COUNT(all_codes)
```

| Overlap | Interpretation |
|---|---|
| 0% | Single-payer. Medicare-only is moderately common in dermatology (practice focused on older patients, skin cancer). |
| 1-10% | Low overlap. Mostly single-payer. A few codes appear in both files. |
| 10-20% | Moderate overlap. Near the peer mean. The provider bills a meaningful set of codes to both payers. |
| 20%+ | High overlap. Consistent practice across payers. Broad-based practice serving both populations. |
| 100% | Every code the provider bills appears in both files. Unusual, but indicates fully payer-agnostic billing. |


## 2. The Dermatology Context

Payer diversity in dermatology sits between urology (strongly Medicare-dominant) and gynecology (balanced):

- Skin cancer and premalignant lesions (actinic keratoses) are predominantly in patients 65+, making Medicare the dominant payer. AK destruction codes (17000, 17003) will overwhelmingly appear in the Medicare file.
- Dermatology also serves younger patients for acne, eczema, warts, and infections, which generate Medicaid and commercial volume. Wart destruction (17110) will appear in both files.
- Most dermatologists should appear in both files, but the Medicare side will be larger.
- Medicare-only dermatologists are moderately common, especially practices focused on skin cancer and Mohs surgery in older populations.
- Medicaid-only dermatologists are unusual. Medicaid access for dermatology is a known national problem: many dermatologists do not accept Medicaid, and patients on Medicaid face significantly longer wait times for dermatology appointments than for other specialties. This structural access gap means Medicaid-only dermatology practices are rare.

This means the **expected payer overlap for dermatology is moderate (~10-18% mean)**. Higher than pediatrics (where Medicaid dominates and Medicare volume is near zero), lower than OB-GYN (where both payers contribute more evenly). The overlap pattern reveals whether the dermatologist treats the full patient spectrum or focuses on one population.

**What matters is the relative position within the dermatology peer cohort, not the absolute number.**


## 3. Geographic Grouping

Payer mix varies by state and by urban/rural. States with higher Medicaid enrollment may have slightly more Medicaid dermatology volume, but the Medicaid access problem for dermatology operates nationally. Sun Belt states (Florida, Arizona) will have heavier Medicare skin cancer volume. States with robust Medicaid fee schedules for dermatology may show higher overlap.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All dermatology NPIs (taxonomy 207N00000X, excluding subspecialists) in the same state that appear in at least one CMS file | Primary scoring. Captures state-level Medicaid/Medicare mix. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES practice address | Urban practices may have more payer diversity than rural. Not implemented now, fields in output schema. |


## 4. Peer Anchors

```
peer_cohort = all dermatology NPIs in the same state
    WHERE taxonomy_code = '207N00000X'
    AND taxonomy_code NOT IN ('207ND0101X', '207ND0900X',
                              '207NI0002X', '207NP0225X', '207NS0135X')
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

Subspecialists excluded from the peer cohort: Dermatopathology (207ND0101X), Dermatological Immunology (207ND0900X), Clinical & Laboratory Dermatological Immunology (207NI0002X), Pediatric Dermatology (207NP0225X), and Procedural Dermatology (207NS0135X). These subspecialties have structurally different payer mixes and code sets.

**Illustrative national dermatology anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~12-16% |
| Median overlap | ~8-14% |
| p75 | ~18-25% |
| p90 | ~28-35% |

Some dermatologists will have 0% overlap (Medicare-only). That is not unusual for this specialty, especially for practices focused on skin cancer in older populations. The score handles this.


## 5. Scoring

Scores ramp from 0 to 100 and hit the cap around 30% both-payer overlap (calibrated to approximately the peer p90):

```
cap = peer_p90        -- the overlap % at which score maxes out (approximately 30%)

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

| Overlap | Score (assuming cap = 30%) | Interpretation |
|---|---|---|
| 0% | 0 | Single-payer provider. Not penalized in composite, just recorded. |
| 8% | 27 | Low overlap. Mostly single-payer. |
| 15% | 50 | Moderate. Near the peer mean. |
| 22% | 73 | Above average overlap. Broad-based. |
| 30%+ | 100 | High overlap. Practice pattern is payer-agnostic. |


### Neutral Handling for Single-Payer Providers

Medicare-only dermatologists are the more common single-payer case. A dermatologist who only treats older patients for skin cancer and AKs may have no Medicaid volume at all. This is moderately common and reflects patient population, not a billing red flag. Medicaid-only dermatologists are rare given the well-documented access barriers in dermatology.

**Design choice:** For providers who appear in only one file (overlap = 0%), the score is 0 but this score carries **reduced weight** in any composite that uses it. The composite should not penalize a provider for being Medicare-only. The payer diversity score is informational for these providers: it records the fact that we have only one payer window into their practice.

```
IF COUNT(medicare_codes) = 0 OR COUNT(medicaid_codes) = 0:
    single_payer = true
    payer_diversity_score = 0
    -- flag for reduced weight in composite
ELSE:
    single_payer = false
    payer_diversity_score = (payer_overlap / cap) * 100
```


## 6. Additional Metrics


### 6A. Code-Category Overlap

Beyond raw code overlap, check which workflow categories appear in both files:

```
categories = {
    'office_visits':     [99213, 99214, 99215, G2211],
    'biopsy':            [11102, 11104],
    'destruction':       [17000, 17003, 17110],
    'excision':          [11600, 11640, 11400, 11440],
    'minor_procedures':  [10060, 11900, 12001],
    'path_phototherapy': [88305, 96910]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
category_overlap = categories_in_both / 6 * 100
```

A provider who bills office visits and biopsies to both payers but destruction only to Medicare has category-level insight into where their payer-specific practice patterns diverge. The destruction category is particularly informative: 17000/17003 (AK destruction) will overwhelmingly appear in Medicare, while 17110 (wart destruction) will appear in both files. If all three destruction codes only appear in Medicare, the provider likely focuses on the older population. If 17110 appears in both files, they are treating younger patients too.


### 6B. Volume-Weighted Overlap

The core metric treats all codes equally. A code billed once counts the same as one billed 500 times. Volume-weighted overlap asks: what share of the provider's total services come from codes that appear in both files?

```
both_payer_services = SUM(total_services) WHERE hcpcs_code IN both_payer_codes
    across BOTH files

total_services = SUM(total_services) across BOTH files

volume_weighted_overlap = both_payer_services / total_services
```

This is a stronger signal. A provider whose both-payer codes account for 80% of their total volume has a broadly consistent practice even if many rare codes only appear in one file. A provider whose both-payer codes account for 5% of volume has a practice pattern that is fundamentally different by payer.


### 6C. Payer-Specific Codes

Which codes does this provider bill to only one payer? This is the inverse of overlap.

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

This list is informational, not scored. But it answers questions like:
- Does this provider bill AK destruction (17000, 17003) only to Medicare? (Expected: yes, AKs are overwhelmingly in older patients.)
- Does this provider bill wart destruction (17110) to only one payer? (If Medicare-only, they may not be treating younger patients at all.)
- Does this provider bill acne or eczema-related E/M codes to Medicaid but not Medicare? (Could indicate a split practice pattern by age group.)


---

# PART C: BUSINESS LOGIC

---


## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "FL"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99215, G2211, 11102, 17000, 17003,
                      11600, 88305, 11104}
    medicaid_codes = {99213, 99214, G2211, 11102, 17110, 11400, 10060,
                      12001, 11900}

STEP 2: Compute overlap
    all_codes = 15 distinct codes
    both_payer_codes = {99213, 99214, G2211, 11102} = 4 codes
    payer_overlap = 4 / 15 = 26.7%

STEP 3: Get peer anchor
    peer_p90 = 30% (illustrative)
    cap = 30%

STEP 4: Score
    payer_overlap (26.7%) < cap (30%)
    payer_diversity_score = (26.7 / 30) * 100 = 89

STEP 5: Additional metrics
    category_overlap: office_visits (both), biopsy (both have 11102),
        destruction (17000/17003 medicare-only, 17110 medicaid-only),
        excision (11600 medicare, 11400 medicaid, no shared codes),
        minor_procedures (medicaid only),
        path_phototherapy (88305 medicare only)
    categories_in_both = 2 of 6
    category_overlap = 33%

    volume_weighted_overlap = (compute from service volumes)

    medicare_only_codes = {99215, 17000, 17003, 11600, 88305, 11104}
    medicaid_only_codes = {17110, 11400, 10060, 12001, 11900}
```


## 8. Worked Examples

**Provider A:** Appears in both files. 20 total codes, 6 in both payers. Overlap = 30%. Score = 100.

**Provider B:** Appears in both files. 18 total codes, 3 in both payers. Overlap = 17%. Score = 57 (17/30 * 100).

**Provider C:** Appears in Medicare only. 15 codes, 0 in Medicaid. Overlap = 0%. Score = 0, single_payer = true. Reduced weight in composite. This is moderately common for dermatology, especially skin cancer-focused practices.

**Provider D:** Appears in both files but with completely different codes. AK destruction (17000, 17003) to Medicare, wart treatment (17110) and acne visits to Medicaid. Overlap = 0%. Score = 0, single_payer = false. This is a genuine signal: the provider bills entirely different services depending on the payer, which reflects a practice split along age/condition lines rather than a consistent approach.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 9. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **AAD Guidelines Concordance** | Does this provider follow AAD guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal dermatologist? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying. A provider who biopsies suspicious lesions for Medicare patients but not Medicaid patients (or vice versa) has a payer-specific practice pattern. That is useful context for an employer evaluating whether to direct-contract.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Good provider, Medicare-only panel | High across all | 0 (single_payer, reduced weight) |
| Good provider, mixed payers, consistent practice | High across all | High (codes overlap across both files) |
| Provider who biopsies for Medicare but not Medicaid | High concordance (Medicare data drives it) | Low (biopsy codes only in one file) |
| Provider with completely different code sets per payer | Varies | 0 (red flag: different practice by payer) |


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Dermatology is moderately Medicare-heavy.** Skin cancer and AK treatment drive a large share of dermatology volume, and these conditions are concentrated in patients 65+. Some Medicare-only dermatologists are practicing appropriately for their patient population, not avoiding Medicaid.

**AK destruction codes will disproportionately appear in the Medicare file.** Codes 17000 and 17003 are almost entirely billed to Medicare. This will structurally reduce overlap for dermatologists who do significant AK work. This is expected, not a flaw.

**Medicaid dermatology access is a known national problem.** Many dermatologists do not accept Medicaid. Studies consistently show that Medicaid patients face wait times for dermatology appointments that are two to three times longer than for commercially insured patients. This means the Medicaid file will underrepresent dermatology activity nationally, and Medicaid-only dermatology practices are genuinely rare. The score reflects this reality but does not correct for it.

**The Medicaid file may be temporarily unavailable.** The CMS Medicaid Provider Spending dataset was released February 2026 and was under maintenance as of late March 2026. If only Medicare data is available, payer diversity is not computable. Score = null.

**Overlap does not equal quality.** A provider who performs unnecessary biopsies on both Medicare and Medicaid patients has high overlap but low quality. Payer diversity is orthogonal to clinical quality. It measures consistency, not correctness.

**State-level variation in payer mix is significant.** Sun Belt states (Florida, Arizona, Texas) have higher concentrations of Medicare-age patients and therefore higher Medicare dermatology volume. States with robust Medicaid fee schedules or FQHC dermatology programs may show more Medicaid presence. State-level peer grouping captures most of this, but the cap (peer p90) will vary by state.

**Provider D scenario (zero overlap, both files present) is a meaningful signal.** A provider who appears in both payer files but bills completely different codes to each could indicate a practice that genuinely operates as two separate practices by patient age. AK/skin cancer work for Medicare patients, acne/wart work for Medicaid patients, with no overlap. This is not necessarily wrong, but it is worth flagging because it means the provider's clinical pattern changes entirely based on who is paying.


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
| **Core Metric** | | |
| medicare_code_count | int | Distinct HCPCS codes billed to Medicare |
| medicaid_code_count | int | Distinct HCPCS codes billed to Medicaid |
| total_distinct_codes | int | Union of both code sets |
| both_payer_code_count | int | Codes appearing in both files |
| payer_overlap | float | both_payer_code_count / total_distinct_codes |
| single_payer | boolean | True if provider appears in only one file |
| payer_diversity_score | float | 0-100, ramped to cap at peer p90 |
| peer_mean_overlap | float | Mean overlap in peer cohort |
| peer_p90_overlap | float | p90 overlap (the scoring cap) |
| **Category Overlap** | | |
| categories_in_both | int | Workflow categories present in both files (0-6) |
| category_overlap | float | categories_in_both / 6 * 100 |
| categories_medicare_only | string | Category names only in Medicare |
| categories_medicaid_only | string | Category names only in Medicaid |
| **Volume-Weighted** | | |
| volume_weighted_overlap | float | Share of total services from both-payer codes |
| **Payer-Specific Detail** | | |
| medicare_only_codes | string | Comma-separated codes only in Medicare |
| medicaid_only_codes | string | Comma-separated codes only in Medicaid |
| both_payer_codes | string | Comma-separated codes in both files |
