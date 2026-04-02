# Gynecology Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A provider who bills 58300 (IUD insertion) to Medicaid but not Medicare, and 99214 (office visit) to both, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel is skewed toward one payer.

**Gynecology has the most balanced payer mix of any specialty we have scored.** Younger women on Medicaid drive contraception, screening, and STI-related visits. Older women on Medicare drive menopause management, pelvic floor disorders, and cancer surveillance. Both payers contribute meaningful volume to the typical gynecology practice. This makes payer diversity more informative here than for pediatrics (Medicaid-dominant, Medicare-thin) or urology (Medicare-dominant). Most gynecologists should appear in both files. Single-payer providers are less common.

This is an access proxy, not a clinical quality measure. It tells you how broad-based the provider's practice is across payer types.


---

# PART A: WHAT WE HAVE

---

This score requires both CMS files:

**CMS Medicare Physician & Other Practitioners** -- NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** -- NPI + HCPCS codes billed to Medicaid

We only need to know which HCPCS codes appear in each file for a given NPI. Volume does not matter for the core metric. Presence is enough.

**NPPES NPI Registry** -- provider identification, taxonomy, geography.

**Taxonomy filter (gynecology only, no obstetrics):**

| Taxonomy | Description | Inclusion Rule |
|---|---|---|
| 207VG0400X | Gynecology | Primary. Always include. |
| 207V00000X | Obstetrics & Gynecology (general) | Include only if delivery code volume is <5% of total claims. This captures OB-GYNs who practice primarily as gynecologists. |

**Exclude these subspecialist taxonomies:**

| Taxonomy | Description | Why Exclude |
|---|---|---|
| 207VX0201X | Gynecologic Oncology | Surgical oncology practice, different code profile |
| 207VF0040X | Female Pelvic Medicine & Reconstructive Surgery | Subspecialty surgical focus |
| 207VM0101X | Maternal-Fetal Medicine | Obstetric subspecialty, not gynecology |
| 207VE0102X | Reproductive Endocrinology | Fertility subspecialty, different workflow |


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
| 0% | Single-payer only. Less common in gynecology than other specialties. May indicate a narrow clinical focus (e.g., reproductive health clinic billing only to Medicaid, or a post-menopausal practice billing only to Medicare). |
| 1-10% | Low overlap. Mostly single-payer practice. A few codes cross over. |
| 10-25% | Moderate overlap. Provider bills a meaningful code set to both payers. Near average for gynecology. |
| 25%+ | High overlap. Consistent practice across payers. Broad-based gynecology. |
| 100% | Every code the provider bills appears in both files. Unusual, but indicates fully payer-agnostic billing. |


## 2. The Gynecology Context

Payer diversity in gynecology is structurally different from other specialties we have scored:

- **Pediatrics:** ~40% of U.S. children are on Medicaid/CHIP. Medicare covers almost no children. Expected overlap is low (~5-8%). Single-payer (Medicaid-only) is the norm.
- **Urology:** Medicare-dominant due to aging male population. Expected overlap is moderate-high (~15-25%). Single-payer (Medicare-only) is common.
- **Gynecology:** Both payers contribute meaningful volume. Younger women on Medicaid need contraception, cervical screening, and well-woman exams. Older women on Medicare need menopause management, pelvic disorder workup, and cancer surveillance. Expected overlap is moderate (~10-20%).

This balanced mix means:
- Most gynecologists should appear in BOTH CMS files
- Single-payer providers (either direction) are less common than in pediatrics or urology
- The payer diversity score carries more signal for gynecology than for the other two specialties
- Payer-specific code patterns are genuinely informative: does the provider bill contraception codes to both payers or only Medicaid? Does menopause-related visit complexity show up in both files or only Medicare?

**What matters is the relative position within the gynecology peer cohort, not the absolute number.** But because gynecology's baseline overlap is higher than pediatrics, the scoring cap is calibrated higher.


## 3. Geographic Grouping

Payer mix varies by state and by urban/rural. States with Medicaid expansion have broader coverage for younger women (contraception, screening), which affects the share of gynecologists who appear in the Medicaid file. States without expansion may push more younger women to uninsured status, reducing Medicaid-side code counts.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All gynecology NPIs (taxonomy 207VG0400X or qualifying 207V00000X) in the same state that appear in at least one CMS file | Primary scoring. Captures state-level Medicaid/Medicare mix. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES practice address | Urban practices may have more payer diversity than rural. Not implemented now, fields in output schema. |


## 4. Peer Anchors

```
peer_cohort = all gynecology NPIs in the same state
    WHERE taxonomy_code IN ('207VG0400X', qualifying '207V00000X')
    AND subspecialist taxonomies excluded
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national gynecology anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~12-18% |
| Median overlap | ~10-15% |
| p75 | ~20-25% |
| p90 | ~30-35% |

These estimates are substantially higher than pediatrics (~6-8% mean) because both payers contribute real volume to gynecology. Fewer gynecologists will have 0% overlap compared to pediatricians.


## 5. Scoring

Scores ramp from 0 to 100 and hit the cap around 30-35% both-payer overlap (calibrated to approximately the peer p90):

```
cap = peer_p90        -- the overlap % at which score maxes out (approximately 30-35%)

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

| Overlap | Score (assuming cap = 32%) | Interpretation |
|---|---|---|
| 0% | 0 | Single-payer provider. Recorded, not penalized in composite. |
| 8% | 25 | Low overlap. Mostly single-payer. |
| 16% | 50 | Moderate. Near the peer mean. |
| 24% | 75 | Above average overlap. Broad-based. |
| 32%+ | 100 | High overlap. Practice pattern is payer-agnostic. |


### Single-Payer Handling

For gynecology, single-payer providers exist in EITHER direction but are somewhat unusual:

- **Medicare-only:** Possible for a provider with an older patient population focused on menopause, post-menopausal pelvic disorders, or cancer surveillance. Less common because most gynecologists see at least some younger women.
- **Medicaid-only:** Possible for a reproductive health clinic or a provider focused on younger women (contraception, screening, STI management). Less common because most gynecologists see at least some older women.

Both directions get the same treatment:

```
IF COUNT(medicare_codes) = 0 OR COUNT(medicaid_codes) = 0:
    single_payer = true
    payer_diversity_score = 0
    -- flag for reduced weight in composite
ELSE:
    single_payer = false
    payer_diversity_score = (payer_overlap / cap) * 100
```

**Design choice:** For providers who appear in only one file (overlap = 0%), the score is 0 but this score carries **reduced weight** in any composite that uses it. The composite should not penalize a provider for being single-payer. The payer diversity score is informational for these providers: it records the fact that we have only one payer window into their practice.

In gynecology, single-payer is less common than in pediatrics or urology, so this reduced-weight flag will apply to fewer providers.


## 6. Additional Metrics


### 6A. Code-Category Overlap

Beyond raw code overlap, check which workflow categories appear in both files. These categories reflect gynecology's core clinical workflows:

```
categories = {
    'office_visits':        [99213, 99214, 99215, G2211],
    'well_woman':           [99395, 99396, 99385, 99386],
    'cervical_screening':   [Q0091, 57452, 57454, 57460],
    'in_office_diagnostics': [76830, 76856, 58100, 81003],
    'contraception':        [58300, 58301, 11981, 11982],
    'surgical':             [58558, 58571]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
category_overlap = categories_in_both / 6 * 100
```

A provider who bills office visits and well-woman exams to both payers but contraception only to Medicaid has category-level insight into where their payer-specific practice patterns diverge.

**Key insight for gynecology:** The most interesting category signals are:
- **Contraception:** Do contraception codes (58300, 58301, 11981, 11982) appear in both files, or only Medicaid? Younger women drive Medicaid contraception volume, but some Medicare beneficiaries (younger disabled women, for example) also need contraception. A provider who bills contraception to both payers serves a broader population.
- **Cervical screening:** Colposcopy and biopsy codes (57452, 57454, 57460) appearing in both files vs. only one reveals whether the provider's diagnostic workup varies by payer.
- **In-office diagnostics:** Ultrasound (76830, 76856) and endometrial biopsy (58100) in both files vs. only Medicare may indicate whether the provider performs the same diagnostic workup for younger and older women.


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
- Does this provider bill contraception codes to Medicaid but not Medicare? (Common, but worth recording.)
- Does this provider bill colposcopy codes to Medicare but not Medicaid? (Could indicate different screening follow-up by payer.)
- Does this provider bill well-woman codes to both payers? (Broad-based preventive practice.)
- Does this provider bill surgical codes to only one payer? (Could indicate different referral patterns.)


---

# PART C: BUSINESS LOGIC

---


## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "TX"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99215, G2211, 99396, 76830, 76856,
                      58100, 57452, 57454, 58558}
    medicaid_codes = {99213, 99214, G2211, 99395, 99396, Q0091, 58300,
                      58301, 11981, 76830, 81003, 99385}

STEP 2: Compute overlap
    all_codes = 19 distinct codes
    both_payer_codes = {99213, 99214, G2211, 99396, 76830} = 5 codes
    payer_overlap = 5 / 19 = 26.3%

STEP 3: Get peer anchor
    peer_p90 = 32% (illustrative)
    cap = 32%

STEP 4: Score
    payer_overlap (26.3%) < cap (32%)
    payer_diversity_score = (26.3 / 32) * 100 = 82.2

STEP 5: Additional metrics
    category_overlap:
        office_visits: medicare has {99213, 99214, 99215, G2211}, medicaid has {99213, 99214, G2211} -> in_both = true
        well_woman: medicare has {99396}, medicaid has {99395, 99396, 99385} -> in_both = true (99396 in both)
        cervical_screening: medicare has {57452, 57454}, medicaid has {Q0091} -> in_both = false (no shared codes)
        in_office_diagnostics: medicare has {76830, 76856, 58100}, medicaid has {76830, 81003} -> in_both = true (76830 in both)
        contraception: medicare has {}, medicaid has {58300, 58301, 11981} -> in_both = false
        surgical: medicare has {58558}, medicaid has {} -> in_both = false
    categories_in_both = 3 of 6
    category_overlap = 3 / 6 * 100 = 50%

    volume_weighted_overlap = (compute from service volumes)

    medicare_only_codes = {99215, 76856, 58100, 57452, 57454, 58558}
    medicaid_only_codes = {99395, Q0091, 58300, 58301, 11981, 81003, 99385}
```


## 8. Worked Examples

**Provider A:** Appears in both files. 22 total codes, 7 in both payers. Overlap = 32%. Score = 100. A broad-based gynecologist billing a consistent code set to Medicare and Medicaid. This is what balanced payer diversity looks like in gynecology.

**Provider B:** Appears in both files. 18 total codes, 3 in both payers. Overlap = 17%. Score = 53 (17/32 * 100). Moderate overlap, near the peer mean. The 3 shared codes are likely office visits and a well-woman code. Payer-specific codes diverge on diagnostics and procedures.

**Provider C:** Appears in Medicaid only. 15 codes, 0 in Medicare. Overlap = 0%. Score = 0, single_payer = true. Reduced weight in composite. This is unusual for gynecology but possible: a reproductive health clinic focused on contraception and screening for younger women.

**Provider D:** Appears in both files but bills completely different codes per payer. Contraception and screening codes to Medicaid, colposcopy/biopsy and surgical codes to Medicare. Overlap = 0%. Score = 0, single_payer = false. This is a genuine signal: the provider's clinical approach varies entirely by payer and patient population. Worth investigating, though in gynecology this pattern can reflect a legitimate age-split in the practice (younger Medicaid patients getting contraception, older Medicare patients getting diagnostic/surgical workup).


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 9. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider do what ACOG says? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal gynecologist? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying. A provider who performs well-woman exams for Medicaid patients but not Medicare patients (or vice versa) has a payer-specific practice pattern. That is useful context for an employer evaluating whether to direct-contract.

**Because gynecology has the most balanced payer mix, payer diversity is more informative here than for the other specialties.** In pediatrics, most providers are single-payer (Medicaid-only), so the score is informational for most of the cohort. In urology, Medicare dominates. In gynecology, both payers matter, and the score differentiates providers across a wider distribution.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Good provider, balanced payer mix, consistent practice | High across all | High (codes overlap across both files) |
| Good provider, Medicaid-only panel (reproductive health focus) | High across all | 0 (single_payer, reduced weight) |
| Good provider, Medicare-only panel (menopause practice) | High across all | 0 (single_payer, reduced weight) |
| Provider who screens younger women (Medicaid) but skips screening for older women (Medicare) | May look fine on Medicaid-driven metrics | Low (cervical screening codes only in Medicaid file) |
| Provider with completely different code sets per payer | Varies | 0 (not single_payer, genuine signal: different practice by payer) |


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Gynecology has the most balanced payer mix, making this score more meaningful than for pediatrics or urology.** The balanced mix means more providers have non-zero overlap, the scoring distribution is wider, and the score differentiates real practice pattern differences rather than simply reflecting payer structure. But this also means the score carries more weight, so the limitations below matter more.

**Single-payer is less common but still happens.** A Medicare-only gynecologist (menopause-focused practice) or a Medicaid-only gynecologist (reproductive health clinic) is possible. These providers get score = 0 with reduced weight. Because single-payer is less common in gynecology, the reduced-weight flag applies to fewer providers than in pediatrics.

**The Medicaid file may be temporarily unavailable.** The CMS Medicaid Provider Spending dataset was released February 2026 and was under maintenance as of late March 2026. If only Medicare data is available, payer diversity is not computable. Score = null.

**Overlap does not equal quality.** A provider who bills the same inappropriate procedures to both payers has high overlap but low quality. Payer diversity is orthogonal to clinical quality. It measures consistency, not correctness.

**State variation in Medicaid eligibility affects younger women's coverage.** States with Medicaid expansion cover more women of reproductive age, increasing the pool of Medicaid-insured gynecology patients. Non-expansion states may have thinner Medicaid-side code sets for gynecologists. State-level peer grouping captures most of this, but the cap (peer p90) will vary significantly by state.

**Some contraception codes may be billed by family planning clinics, not individual GYN NPIs.** Clinics that bill under an organizational NPI rather than individual provider NPIs may not show up in our provider-level analysis. This affects the Medicaid side more than Medicare, because family planning clinics disproportionately serve Medicaid patients.

**Provider D scenario (zero overlap, both files present) is more nuanced in gynecology than in other specialties.** A provider who appears in both payer files but bills completely different codes to each could reflect a legitimate age-split in their practice rather than problematic billing. Younger Medicaid patients and older Medicare patients genuinely need different services. The category overlap metric (Section 6A) helps distinguish this from a true red flag.


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
