# Pediatric Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A provider who bills 96110 (developmental screening) to Medicaid but not Medicare, and 99214 (office visit) to both, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel is almost entirely one payer (common in pediatrics where Medicaid dominates).

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
| 0% | Provider appears in only one file. All codes are payer-specific. Very common in pediatrics (Medicaid-only provider). |
| 1-10% | Minimal overlap. A few codes appear in both, but the practice is mostly single-payer. |
| 10-20% | Moderate overlap. The provider bills a meaningful set of codes to both payers. |
| 20%+ | High overlap. The provider's billing pattern is consistent across payers. Broad-based practice. |
| 100% | Every code the provider bills appears in both files. Unusual, but indicates fully payer-agnostic billing. |


## 2. The Pediatric Context

Payer diversity in pediatrics is structurally different from adult specialties:

- ~40% of U.S. children are on Medicaid/CHIP. Many pediatric practices are majority-Medicaid.
- Medicare covers almost no children. A pediatric NPI's Medicare volume is typically very low or zero.
- A pediatrician with zero Medicare codes is not unusual. It means they do not see Medicare patients, which is normal for this specialty.

This means the **expected payer overlap for pediatrics is low**. The OB-GYN peer anchor is ~10.1% mean both-payer overlap. For pediatrics, the mean will likely be lower, possibly 5-8%, because the Medicare pediatric population is so small.

**What matters is the relative position within the pediatric peer cohort, not the absolute number.**


## 3. Geographic Grouping

Payer mix varies by state and by urban/rural. States with higher Medicaid enrollment will have lower mean payer overlap because more providers are Medicaid-dominant. States where pediatricians commonly see young adults (aging out of pediatric care into Medicare-eligible disability) may have higher overlap.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All pediatric NPIs (taxonomy 208000000X) in the same state that appear in at least one CMS file | Primary scoring. Captures state-level Medicaid/Medicare mix. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES practice address | Urban practices may have more payer diversity than rural. Not implemented now, fields in output schema. |


## 4. Peer Anchors

```
peer_cohort = all pediatric NPIs in the same state
    WHERE taxonomy_code = '208000000X'
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national pediatric anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~6-8% |
| Median overlap | ~3-5% |
| p75 | ~12% |
| p90 | ~20% |

Many pediatricians will have 0% overlap (Medicaid-only). That is not a penalty. The score handles this.


## 5. Scoring

Scores ramp from 0 to 100 and hit the cap around 20% both-payer overlap (calibrated to approximately the peer p90):

```
cap = peer_p90        -- the overlap % at which score maxes out (approximately 20%)

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

| Overlap | Score (assuming cap = 20%) | Interpretation |
|---|---|---|
| 0% | 0 | Single-payer provider. Not penalized in composite, just recorded. |
| 5% | 25 | Low overlap. Mostly single-payer. |
| 10% | 50 | Moderate. Near the peer mean. |
| 15% | 75 | Above average overlap. Broad-based. |
| 20%+ | 100 | High overlap. Practice pattern is payer-agnostic. |


### Neutral Handling for Medicaid-Only Providers

Many pediatricians appear in the Medicaid file but not the Medicare file at all. Their overlap is 0% by definition, not by choice. They simply do not see Medicare patients.

**Design choice:** For providers who appear in only one file (overlap = 0%), the score is 0 but this score carries **reduced weight** in any composite that uses it. The composite should not penalize a provider for being Medicaid-only. The payer diversity score is informational for these providers: it records the fact that we have only one payer window into their practice.

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
    'sick_visits':     [99213, 99214, G2211],
    'well_child':      [99391, 99392, 99393, 99394],
    'immunizations':   [90460, 90461, 90471],
    'screening':       [96110, 96127, 99173, 99177, 92551],
    'poc_testing':     [87880, 87804, 36416]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
category_overlap = categories_in_both / 5 * 100
```

A provider who bills sick visits and immunizations to both payers but screening only to Medicaid has category-level insight into where their payer-specific practice patterns diverge.


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
- Does this provider bill screening codes to Medicaid but not Medicare? (Possible: Medicaid has different preventive care coverage for children.)
- Does this provider bill certain vaccine products to one payer but not the other? (Could indicate vaccine supply arrangements.)


---

# PART C: BUSINESS LOGIC

---


## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "MA"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99392, 90460, 90461, 90707, 96127}
    medicaid_codes = {99213, 99214, 99391, 99392, 99393, 90460, 90461,
                      96110, 96127, 87880, 85018, 36416, 90707, 90670, 90700}

STEP 2: Compute overlap
    all_codes = 16 distinct codes
    both_payer_codes = {99213, 99214, 99392, 90460, 90461, 96127, 90707} = 7 codes
    payer_overlap = 7 / 16 = 43.8%

STEP 3: Get peer anchor
    peer_p90 = 20% (illustrative)
    cap = 20%

STEP 4: Score
    payer_overlap (43.8%) >= cap (20%)
    payer_diversity_score = 100

STEP 5: Additional metrics
    category_overlap: sick_visits (both), well_child (both have 99392),
        immunizations (both), screening (96127 in both, 96110 medicaid-only),
        poc_testing (medicaid only)
    categories_in_both = 4 of 5
    category_overlap = 80%

    volume_weighted_overlap = (compute from service volumes)

    medicare_only_codes = {} (none)
    medicaid_only_codes = {99391, 99393, 96110, 87880, 85018, 36416, 90670, 90700}
```


## 8. Worked Examples

**Provider A:** Appears in both files. 12 total codes, 4 in both payers. Overlap = 33%. Score = 100.

**Provider B:** Appears in both files. 18 total codes, 2 in both payers. Overlap = 11%. Score = 55 (11/20 * 100).

**Provider C:** Appears in Medicaid only. 15 codes, 0 in Medicare. Overlap = 0%. Score = 0, single_payer = true. Reduced weight in composite.

**Provider D:** Appears in both files. 8 total codes, 0 in both (completely different codes per payer). Overlap = 0%. Score = 0, single_payer = false. This is a genuine red flag: the provider bills completely different services depending on the payer.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 9. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider do what AAP says? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal pediatrician? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity (32 ratio checks) |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying. A provider who screens Medicaid patients but not Medicare patients (or vice versa) has a payer-specific practice pattern. That is useful context for an employer evaluating whether to direct-contract.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Good provider, Medicaid-only panel | High across all | 0 (single_payer, reduced weight) |
| Good provider, mixed payers, consistent practice | High across all | High (codes overlap across both files) |
| Provider who screens for Medicaid but not Medicare | High guideline concordance (Medicaid data drives it) | Low (screening codes only in one file) |
| Provider with completely different code sets per payer | Varies | 0 (red flag: different practice by payer) |


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Low overlap is normal in pediatrics.** Most pediatricians are Medicaid-dominant. A low payer diversity score is not a quality signal, it is a structural feature of the specialty. The score is informational, and single-payer providers get reduced weight in any composite.

**Medicare pediatric volume is very low.** A provider may bill only 2-3 codes to Medicare (a few office visits for dual-eligible patients). Those 2-3 codes will drive the overlap calculation. Small numbers make the metric noisy for providers with minimal Medicare presence.

**The Medicaid file may be temporarily unavailable.** The CMS Medicaid Provider Spending dataset was released February 2026 and was under maintenance as of late March 2026. If only Medicare data is available, payer diversity is not computable. Score = null.

**Overlap ≠ quality.** A provider who bills the same bad practice to both payers has high overlap but low quality. Payer diversity is orthogonal to clinical quality. It measures consistency, not correctness.

**State-level variation in payer mix is large.** States with Medicaid expansion have different pediatric payer distributions than non-expansion states. State-level peer grouping captures most of this, but the cap (peer p90) will vary significantly by state.

**Provider D scenario (zero overlap, both files present) is rare but meaningful.** A provider who appears in both payer files but bills completely different codes to each is worth investigating. It could indicate billing for different specialties under one NPI, or payer-specific practice patterns that do not align with standard pediatric care.


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
