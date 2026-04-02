# Urology Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A provider who bills 52000 (diagnostic cystoscopy) to Medicare but not Medicaid, and 99214 (office visit) to both, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel is heavily weighted toward one payer.

**The critical difference from pediatrics: the payer mix is inverted.** Pediatrics is Medicaid-dominant because ~40% of children are on Medicaid/CHIP, and Medicare covers almost no children. Urology is Medicare-dominant because most urologic patients are 50+ (BPH, prostate cancer, bladder cancer, kidney stones in older adults). A urologist who appears only in the Medicare file is the normal single-payer case, not a red flag. A Medicaid-only urologist is unusual.

Because the base payer population skews older, the expected payer overlap in urology is structurally higher than in pediatrics. More urologists see patients across both programs because conditions like kidney stones, UTIs, and hematuria affect all ages. The pediatric mean overlap is ~5-8%. For urology, expect ~15-20%.

This is an access proxy, not a clinical quality measure. It tells you how broad-based the provider's practice is across payer types.


---

# PART A: WHAT WE HAVE

---

This score requires both CMS files:

**CMS Medicare Physician & Other Practitioners** -- NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** -- NPI + HCPCS codes billed to Medicaid

We only need to know which HCPCS codes appear in each file for a given NPI. Volume does not matter for the core metric. Presence is enough.

**NPPES NPI Registry** -- provider identification, taxonomy, geography.

Taxonomy filter: **208800000X** (Urology). Subspecialists excluded: 2088P0231X (Pediatric Urology), 2088F0040X (Female Pelvic Medicine), 2088P0210X (not a standard taxonomy but flagged for exclusion per project scope).


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
| 0% | Provider appears in only one file. Could be Medicare-only (common for urology) or Medicaid-only (unusual). |
| 1-15% | Low overlap. Mostly single-payer practice. |
| 15-30% | Moderate overlap. Provider bills a meaningful code set to both payers. |
| 30%+ | High overlap. Practice pattern is consistent across payers. |
| 100% | Every code in both files. Unusual but indicates fully payer-agnostic billing. |

Note the bands are shifted upward compared to pediatrics (where 10-20% was "moderate"). This reflects urology's structurally higher expected overlap.


## 2. The Urology Context

Payer diversity in urology is structurally different from pediatrics, and the difference runs in the opposite direction:

- Most urologic conditions (BPH, prostate cancer, bladder cancer, overactive bladder, kidney stones in older patients) concentrate in the 50+ population. Medicare is the dominant payer.
- Many urologists also see younger patients for kidney stones, UTIs, hematuria workups, and male infertility. These patients may be on Medicaid. This creates natural payer overlap.
- A urologist with zero Medicaid codes is not unusual. It means they do not see Medicaid patients, which is common in this specialty.
- A urologist with zero Medicare codes would be unusual. Almost every general urologist has Medicare patients.

This means the **expected payer overlap for urology is moderate**, in the 15-20% range nationally. Compare to pediatrics at 5-8%. The structural reason: urology's patient population spans a wider age range than many adult specialties, but the Medicare side is much larger.

**What matters is the relative position within the urology peer cohort, not the absolute number. And absolutely not a comparison to pediatrics or other specialties.**


## 3. Geographic Grouping

Payer mix varies by state and by urban/rural. States with higher Medicaid enrollment may have more urologists seeing Medicaid patients for conditions that cross age groups. States with older populations will have even more Medicare concentration.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All urology NPIs (taxonomy 208800000X, excluding subspecialists) in the same state that appear in at least one CMS file | Primary scoring. Captures state-level Medicare/Medicaid mix. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES practice address | Urban practices may have more payer diversity than rural. Not implemented now, fields in output schema. |


## 4. Peer Anchors

```
peer_cohort = all urology NPIs in the same state
    WHERE taxonomy_code = '208800000X'
    AND taxonomy_code NOT IN ('2088P0231X', '2088F0040X', '2088P0210X')
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national urology anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~15-20% |
| Median overlap | ~12-18% |
| p75 | ~25-30% |
| p90 | ~35-40% |

These are meaningfully higher than pediatrics (mean ~6-8%, p90 ~20%). That is expected. A urologist at p50 for urology has more payer overlap than a pediatrician at p90 for pediatrics. The two specialties should never be compared on this metric.

Many urologists will have 0% overlap (Medicare-only). That is not a penalty. The score handles this.


## 5. Scoring

Scores ramp from 0 to 100 and hit the cap around 35-40% both-payer overlap (calibrated to approximately the peer p90):

```
cap = peer_p90        -- the overlap % at which score maxes out (approximately 36%)

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

| Overlap | Score (assuming cap = 36%) | Interpretation |
|---|---|---|
| 0% | 0 | Single-payer provider. Not penalized in composite, just recorded. |
| 9% | 25 | Low overlap. Mostly single-payer. |
| 18% | 50 | Moderate. Near the peer mean. |
| 27% | 75 | Above average overlap. Broad-based. |
| 36%+ | 100 | High overlap. Practice pattern is payer-agnostic. |

Note: the cap for urology (~36%) is nearly double the pediatric cap (~20%). This is the direct consequence of urology's higher baseline overlap. A 20% overlap that maxes out the score in pediatrics only gets ~56 in urology.


### Neutral Handling for Medicare-Only Providers

Many urologists appear in the Medicare file but not the Medicaid file at all. Their overlap is 0% by definition, not by choice. They simply do not see Medicaid patients, which is normal for this specialty.

This is the mirror image of pediatrics, where Medicaid-only was the normal single-payer case. In urology, **Medicare-only is the normal single-payer case.**

**Design choice:** For providers who appear in only one file (overlap = 0%), the score is 0 but this score carries **reduced weight** in any composite that uses it. The composite should not penalize a provider for being Medicare-only. The payer diversity score is informational for these providers: it records the fact that we have only one payer window into their practice.

A Medicaid-only urologist is unusual but possible (younger patient population, reproductive urology, practices in areas with very high Medicaid enrollment). Same treatment: single_payer = true, reduced weight.

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

Beyond raw code overlap, check which workflow categories appear in both files. Urology has six workflow categories (compared to pediatrics' five):

```
categories = {
    'office_visits':          [99213, 99214, 99215, G2211],
    'diagnostic_cystoscopy':  [52000],
    'in_office_diagnostics':  [76857, 51798, 76770],
    'laboratory':             [84153, 81003, 81001, 87086],
    'therapeutic_cystoscopy': [52310, 52214, 52281, 52234, 52287],
    'major_procedures':       [55700, 55866, 50590]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
category_overlap = categories_in_both / 6 * 100
```

A provider who bills office visits and diagnostic cystoscopy to both payers but major procedures only to Medicare has category-level insight into where their payer-specific practice patterns diverge. This is common in urology: younger Medicaid patients need office visits and diagnostics, but major prostate and bladder procedures concentrate in the Medicare population.


### 6B. Volume-Weighted Overlap

The core metric treats all codes equally. A code billed once counts the same as one billed 500 times. Volume-weighted overlap asks: what share of the provider's total services come from codes that appear in both files?

```
both_payer_services = SUM(total_services) WHERE hcpcs_code IN both_payer_codes
    across BOTH files

total_services = SUM(total_services) across BOTH files

volume_weighted_overlap = both_payer_services / total_services
```

This is a stronger signal. A urologist whose both-payer codes account for 70% of their total volume has a broadly consistent practice even if many specialized procedure codes only appear in one file. A provider whose both-payer codes account for 5% of volume has a practice pattern that is fundamentally different by payer.


### 6C. Payer-Specific Codes

Which codes does this provider bill to only one payer? This is the inverse of overlap.

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

This list is informational, not scored. But it answers questions like:
- Does this provider bill prostate biopsy (55700) and prostatectomy (55866) only to Medicare? (Expected: prostate cancer is overwhelmingly a Medicare-age disease.)
- Does this provider bill UTI-related labs (87086) to Medicaid but not Medicare? (Possible: younger Medicaid patients with UTIs.)
- Does this provider bill PSA (84153) to both payers? (Interesting: screening patterns across age groups.)


---

# PART C: BUSINESS LOGIC

---


## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "TX"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99215, G2211, 52000, 76857, 51798,
                      84153, 81003, 52310, 52234, 55700, 55866, 50590,
                      76770, 52281, 87086}
    medicaid_codes = {99213, 99214, 99215, G2211, 52000, 76857, 81003,
                      87086, 81001}

STEP 2: Compute overlap
    all_codes = 20 distinct codes
    both_payer_codes = {99213, 99214, 99215, G2211, 52000, 76857, 81003, 87086} = 8 codes
    payer_overlap = 8 / 20 = 40%

STEP 3: Get peer anchor
    peer_p90 = 36% (illustrative)
    cap = 36%

STEP 4: Score
    payer_overlap (40%) >= cap (36%)
    payer_diversity_score = 100

STEP 5: Additional metrics
    category_overlap: office_visits (both), diagnostic_cystoscopy (both),
        in_office_diagnostics (76857 in both, 51798 medicare-only, 76770 medicare-only),
        laboratory (81003 and 87086 in both, 84153 medicare-only, 81001 medicaid-only),
        therapeutic_cystoscopy (52310 and 52234 and 52281 medicare-only, none in medicaid),
        major_procedures (55700, 55866, 50590 all medicare-only)
    categories_in_both = 4 of 6
    category_overlap = 67%

    volume_weighted_overlap = (compute from service volumes)

    medicare_only_codes = {51798, 76770, 84153, 52310, 52234, 52281, 55700, 55866, 50590}
    medicaid_only_codes = {81001}
```

This is a typical pattern for a urologist with a mixed panel: office visits and basic diagnostics overlap, but major procedures and therapeutic cystoscopy are Medicare-only because those patients are older.


## 8. Worked Examples

**Provider A:** Appears in both files. 20 total codes, 8 in both payers. Overlap = 40%. Score = 100. This urologist sees a meaningful Medicaid population alongside their Medicare panel. Practice pattern is consistent.

**Provider B:** Appears in both files. 18 total codes, 3 in both payers. Overlap = 17%. Score = 47 (17/36 * 100). Only office visit codes overlap. The Medicaid side is limited to E/M, while Medicare has the full procedure portfolio. Common pattern, not alarming.

**Provider C:** Appears in Medicare only. 22 codes, 0 in Medicaid. Overlap = 0%. Score = 0, single_payer = true. Reduced weight in composite. This is a normal Medicare-panel urologist. No penalty.

**Provider D:** Appears in both files. 24 total codes, 0 in both (completely different codes per payer). Overlap = 0%. Score = 0, single_payer = false. This is a genuine red flag: the provider bills completely different services depending on the payer. Worth investigating. Could indicate dual practice patterns or billing irregularities.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 9. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **AUA Guidelines Concordance** | Does this provider follow AUA guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal urologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Billing Quality** | Are charges, ratios, and E/M distribution normal? | Pricing + integrity |
| **Payer Diversity** (this doc) | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying. A provider who bills diagnostic cystoscopy (52000) to Medicare patients but not to Medicaid patients with the same indications has a payer-specific practice pattern. That is useful context for an employer evaluating whether to direct-contract.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Good provider, Medicare-only panel | High across all | 0 (single_payer, reduced weight) |
| Good provider, mixed payers, consistent practice | High across all | High (codes overlap across both files) |
| Provider who manages BPH differently per payer | High peer comparison (Medicare data drives it) | Low (treatment codes differ by payer) |
| Provider with completely different code sets per payer | Varies | 0 (red flag: different practice by payer) |

The Medicare-only scenario is the most common single-payer case in urology, not Medicaid-only as in pediatrics. A urologist with excellent AUA concordance, normal peer comparison, adequate volume, and clean billing quality should not lose composite score because they happen to have a Medicare-only panel.


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Higher overlap is expected in urology than pediatrics.** The two specialties should never be compared on this metric. A 15% overlap is above-average for a pediatrician but below-average for a urologist. Specialty-specific peer anchors handle this, but anyone consuming these scores needs to understand the structural difference.

**Medicare-only is normal and not a quality signal.** A urologist who sees only Medicare patients has a score of 0, but that tells you nothing about their clinical quality. It tells you we only have one payer window into their practice. Reduced weight in composite.

**Medicaid urologic volume may be very low, making overlap noisy.** A urologist might bill only 2-3 codes to Medicaid (a few office visits for UTI workups). Those 2-3 codes will drive the overlap calculation. Small numbers make the metric noisy for providers with minimal Medicaid presence. Volume-weighted overlap (Section 6B) is a better signal in these cases.

**The Medicaid file may be temporarily unavailable.** The CMS Medicaid Provider Spending dataset was released February 2026 and was under maintenance as of late March 2026. If only Medicare data is available, payer diversity is not computable. Score = null.

**Overlap does not equal quality.** A provider who bills the same bad practice to both payers has high overlap but low quality. Payer diversity is orthogonal to clinical quality. It measures consistency, not correctness. A urologist with high payer diversity who orders unnecessary PSA screening for both Medicare and Medicaid patients is not a good provider just because the pattern is consistent.

**State-level variation in Medicaid eligibility and coverage affects the metric.** States with Medicaid expansion have broader adult coverage, which means more working-age adults with urologic conditions (kidney stones, UTIs, hematuria) on Medicaid. Non-expansion states will have fewer Medicaid urologic patients and therefore lower mean overlap. State-level peer grouping captures most of this, but the cap (peer p90) will vary significantly by state.

**Provider D scenario (zero overlap, both files present) is rare but meaningful.** A provider who appears in both payer files but bills completely different codes to each is worth investigating. It could indicate billing for different clinical focus areas under one NPI, or payer-specific practice patterns that do not align with standard urologic care.


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
