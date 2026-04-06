# Retina Specialist Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A retina specialist who bills OCT (92134) to Medicare but not Medicaid, and intravitreal injection (67028) to both, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying.

This is an access proxy, not a clinical quality measure. It tells you how broad-based the provider's practice is across payer types.


---

# PART A: WHAT WE HAVE

---

This score requires both CMS files:

**CMS Medicare Physician & Other Practitioners** — NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** — NPI + HCPCS codes billed to Medicaid

We only need to know which HCPCS codes appear in each file for a given NPI. Volume does not matter for the core metric. Presence is enough.

**NPPES NPI Registry** — provider identification, taxonomy, geography.


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
| 0% | Provider appears in only one file. All codes are payer-specific. |
| 1-15% | Low overlap. A few codes appear in both. Practice is mostly single-payer. |
| 15-35% | Moderate overlap. Provider bills a meaningful set of codes to both payers. |
| 35%+ | High overlap. Billing pattern is consistent across payers. Broad-based practice. |
| 100% | Every code appears in both files. Unusual, indicates fully payer-agnostic billing. |


## 2. The Retina Context

Payer diversity in retina is structurally different from pediatrics but also different from general adult medicine:

- **Retina is Medicare-dominant.** The core conditions — age-related macular degeneration (AMD), diabetic retinopathy in elderly patients, retinal vein occlusion — are diseases of aging. The vast majority of retina patients are on Medicare.
- **Medicaid retina volume is low but not zero.** Younger patients with diabetic retinopathy, retinopathy of prematurity (ROP), retinal detachment from trauma, and inherited retinal diseases represent the Medicaid segment.
- A retina specialist with **zero Medicaid codes is not unusual.** It means they do not see Medicaid patients, which is more common in suburban/private practice settings.
- A retina specialist with **significant Medicaid volume** likely serves a younger, more diverse patient population (urban safety-net hospitals, academic medical centers).

This means the **expected payer overlap for retina is moderate to low**. The pediatric anchor is ~6-8% (Medicaid-dominant, almost no Medicare). For retina, the expected mean overlap is likely **10-20%** because while Medicare dominates, many retina specialists do see some Medicaid patients (especially in states with Medicaid expansion).

**What matters is the relative position within the retina specialist peer cohort, not the absolute number.**


## 3. Geographic Grouping

Payer mix varies by state. States with higher Medicaid enrollment and Medicaid expansion will have more retina specialists seeing Medicaid patients. States without expansion may have retina practices that are almost entirely Medicare.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All retina specialist NPIs in the same state that appear in at least one CMS file | Primary scoring. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES | Urban academic centers vs. suburban private practices have very different payer mixes. |


## 4. Peer Anchors

```
peer_cohort = all retina specialist NPIs in the same state
    WHERE taxonomy_code = '207W00000X'
    AND meets retina classification criteria (≥50 injections or ≥10 surgeries)
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national retina specialist anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~12-18% |
| Median overlap | ~10-15% |
| p75 | ~25% |
| p90 | ~35% |

> **ASSUMPTION:** These anchor estimates are significantly higher than pediatrics because retina specialists are more likely to appear in both CMS files (Medicare is primary, Medicaid is secondary but present). The actual values must be computed from CMS data. States with large Medicaid diabetic populations (e.g., California, Texas, New York) may have higher retina payer overlap than states with small Medicaid programs.


## 5. Scoring

Scores ramp from 0 to 100 and hit the cap around the peer p90:

```
cap = peer_p90        -- the overlap % at which score maxes out (approximately 35%)

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

| Overlap | Score (assuming cap = 35%) | Interpretation |
|---|---|---|
| 0% | 0 | Medicare-only provider. Not penalized in composite, just recorded. |
| 10% | 29 | Low overlap. Primarily Medicare. |
| 18% | 51 | Moderate. Near the peer mean. |
| 25% | 71 | Above average overlap. Sees both populations. |
| 35%+ | 100 | High overlap. Practice is payer-diverse. |


### Neutral Handling for Medicare-Only Providers

Many retina specialists appear in the Medicare file but not the Medicaid file at all. Their overlap is 0% by definition, not by choice. They simply do not see Medicaid patients.

**Design choice:** For providers who appear in only one file (overlap = 0%), the score is 0 but this score carries **reduced weight** in any composite that uses it. The composite should not penalize a provider for being Medicare-only. The payer diversity score is informational for these providers.

```
IF COUNT(medicare_codes) = 0 OR COUNT(medicaid_codes) = 0:
    single_payer = true
    payer_diversity_score = 0
    -- flag for reduced weight in composite
ELSE:
    single_payer = false
    payer_diversity_score = (payer_overlap / cap) * 100
```

> **NOTE:** For retina (unlike pediatrics where Medicaid-only is the expected single-payer pattern), Medicare-only is the expected single-payer pattern. A retina specialist who appears in Medicaid but NOT Medicare would be genuinely unusual and worth investigating (possible: an ROP specialist treating premature infants, who are on Medicaid).


## 6. Additional Metrics


### 6A. Code-Category Overlap

Beyond raw code overlap, check which workflow categories appear in both files:

```
categories = {
    'injections':        [67028, J0178, J9035, J2778],
    'diagnostic_imaging': [92134, 92235, 92240, 92250],
    'clinical_exams':    [92014, 92012, 99214, 99213],
    'laser':             [67210, 67228, 67145],
    'surgery':           [67036, 67041, 67042, 67108, 67113]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
category_overlap = categories_in_both / 5 * 100
```

A provider who performs injections for both payer populations but only does surgery for Medicare patients has category-level insight into where their payer-specific practice patterns diverge.


### 6B. Volume-Weighted Overlap

The core metric treats all codes equally. Volume-weighted overlap asks: what share of the provider's total services come from codes that appear in both files?

```
both_payer_services = SUM(total_services) WHERE hcpcs_code IN both_payer_codes
    across BOTH files

total_services = SUM(total_services) across BOTH files

volume_weighted_overlap = both_payer_services / total_services
```

This is a stronger signal. A provider whose both-payer codes (like 67028 and 92134) account for 80% of total volume has a broadly consistent practice even if rare codes only appear in one file.


### 6C. Payer-Specific Codes

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

This list is informational, not scored. It answers questions like:
- Does the provider bill certain surgical codes only to Medicare? (Possible: Medicare patients have different surgical needs.)
- Does the provider bill different drug codes to different payers? (Could indicate formulary differences.)
- Does the provider bill ROP screening codes (67229) to Medicaid only? (Expected: ROP is a neonatal/Medicaid condition.)


---

# PART C: BUSINESS LOGIC

---


## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "FL"

STEP 1: Collect code sets
    medicare_codes = {67028, 92134, 92014, 92012, 92250, 92235, J0178,
                      J9035, 67210, 67228, 67036, 67042, 67108, G2211,
                      99214, 76512}
    medicaid_codes = {67028, 92134, 92014, 92250, J0178, 99214, 92012}

STEP 2: Compute overlap
    all_codes = 16 distinct codes
    both_payer_codes = {67028, 92134, 92014, 92250, J0178, 99214, 92012} = 7 codes
    payer_overlap = 7 / 16 = 43.8%

STEP 3: Get peer anchor
    peer_p90 = 35% (illustrative)
    cap = 35%

STEP 4: Score
    payer_overlap (43.8%) >= cap (35%)
    payer_diversity_score = 100

STEP 5: Additional metrics
    category_overlap: injections (both), diagnostic_imaging (both),
        clinical_exams (both), laser (medicare only), surgery (medicare only)
    categories_in_both = 3 of 5
    category_overlap = 60%

    medicare_only_codes = {92235, J9035, 67210, 67228, 67036, 67042, 67108, G2211, 76512}
    medicaid_only_codes = {} (none)
```


## 8. Worked Examples

**Provider A:** Appears in both files. 16 total codes, 7 in both payers. Overlap = 43.8%. Score = 100.

**Provider B:** Appears in both files. 20 total codes, 4 in both payers. Overlap = 20%. Score = 57 (20/35 * 100).

**Provider C:** Appears in Medicare only. 18 codes, 0 in Medicaid. Overlap = 0%. Score = 0, single_payer = true, payer = "medicare_only". Reduced weight in composite.

**Provider D:** Appears in both files. 12 total codes, 0 in both (completely different codes per payer). Overlap = 0%. Score = 0, single_payer = false. This is a genuine red flag: completely different services depending on payer.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 9. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider do what ASRS/AAO says? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal retina specialist? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Excellent retina specialist, Medicare-only practice | High across all | 0 (single_payer, reduced weight) |
| Excellent retina specialist, serves both populations | High across all | High (codes overlap across both files) |
| Provider who images Medicare patients but not Medicaid | High guideline concordance (Medicare data drives it) | Low (imaging codes only in one file) |
| Academic retina specialist at safety-net hospital | High across all | High (diverse patient population) |
| ROP specialist (Medicaid-heavy, unusual for retina) | May score differently on injection metrics | Potentially low or inverted (Medicaid-dominant, unusual pattern) |


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Medicare-only is the structural norm in retina.** Most retina patients are elderly and on Medicare. A low payer diversity score is not a quality signal for retina. The score is informational, and single-payer providers get reduced weight in any composite.

**Medicaid retina volume is very low in many states.** A retina specialist may bill only 3-5 codes to Medicaid (a few injections and exams for younger diabetics). Small numbers make the metric noisy.

**The Medicaid file may be temporarily unavailable.** If only Medicare data is available, payer diversity is not computable. Score = null.

**Overlap ≠ quality.** A provider who performs the same low-quality practice for both payer populations has high overlap but low clinical quality. Payer diversity is orthogonal to clinical quality.

**State-level variation in Medicaid coverage is large.** Medicaid expansion states have more working-age adults with diabetes who may need retinal care. Non-expansion states have smaller Medicaid retina populations. State-level peer grouping captures most of this variation.

**Hospital-based providers have a different payer mix.** Academic medical centers and safety-net hospitals see more Medicaid patients than private retina practices. Practice setting is a stronger driver of payer diversity than provider quality.

**ROP specialists are an unusual case.** Retinopathy of prematurity specialists primarily treat Medicaid patients (premature infants). They may appear primarily in the Medicaid file, which is the inverse of the typical retina pattern. Flag providers with high ROP-related codes (67229, 67228 in neonatal context) for separate handling.


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
| single_payer_type | string | "medicare_only", "medicaid_only", or "both_present" |
| payer_diversity_score | float | 0-100, ramped to cap at peer p90 |
| peer_mean_overlap | float | Mean overlap in peer cohort |
| peer_p90_overlap | float | p90 overlap (the scoring cap) |
| **Category Overlap** | | |
| categories_in_both | int | Workflow categories present in both files (0-5) |
| category_overlap | float | categories_in_both / 5 * 100 |
| categories_medicare_only | string | Category names only in Medicare |
| categories_medicaid_only | string | Category names only in Medicaid |
| **Volume-Weighted** | | |
| volume_weighted_overlap | float | Share of total services from both-payer codes |
| **Payer-Specific Detail** | | |
| medicare_only_codes | string | Comma-separated codes only in Medicare |
| medicaid_only_codes | string | Comma-separated codes only in Medicaid |
| both_payer_codes | string | Comma-separated codes in both files |
