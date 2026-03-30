# Pain Medicine Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A pain medicine provider who bills 62323 (lumbar epidural injection) to both Medicare and Medicaid, but 64633 (facet joint radiofrequency ablation) only to Medicare, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel is almost entirely one payer.

**Pain medicine vs. pediatrics — the payer mix is inverted.** In pediatrics, Medicaid dominates (~40% of U.S. children on Medicaid/CHIP) and Medicare covers almost no kids. In pain medicine, **Medicare dominates.** Chronic pain prevalence increases with age. The majority of interventional pain procedures are performed on Medicare-eligible adults (65+) or Medicare-disabled patients. A pain medicine provider with zero Medicaid codes is not unusual — it means they do not see Medicaid patients, which is structurally common in this specialty.

This is an access proxy, not a clinical quality measure. It tells you how broad-based the provider's practice is across payer types.


---

# PART A: WHAT WE HAVE

---

This score requires both CMS files:

**CMS Medicare Physician & Other Practitioners** — NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** — NPI + HCPCS codes billed to Medicaid

We only need to know which HCPCS codes appear in each file for a given NPI. Volume does not matter for the core metric. Presence is enough.

**NPPES NPI Registry** — provider identification, taxonomy, geography.

### What the Data Shows for Pain Medicine

| Data Feature | Pain Medicine Reality |
|---|---|
| Medicare file coverage | **Primary file.** Most pain medicine providers will have substantial Medicare volume. This is the dominant payer for this specialty. |
| Medicaid file coverage | **Secondary file.** Medicaid pain patients exist (younger adults with chronic pain, disability-related Medicaid) but volume is typically much lower than Medicare. |
| Expected both-file presence | Higher than pediatrics. Many pain medicine providers will appear in both files, but with Medicare as the dominant volume source. |
| Code set differences by payer | Possible. Some interventional procedures may be more common in Medicare (degenerative spine conditions in older adults) while others may appear more in Medicaid (trauma-related pain in younger adults). MassHealth (MA Medicaid) prior authorization requirements may also suppress certain procedure codes on the Medicaid side. |

**Note:** The CMS Medicaid Provider Spending dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. If only Medicare data is available, payer diversity is not computable. Score = null.


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

| Overlap | Interpretation (Pain Medicine Context) |
|---|---|
| 0% | Provider appears in only one file. All codes are payer-specific. Common for Medicare-only pain providers in MA. |
| 1-15% | Minimal overlap. A few codes (likely E/M visits) appear in both, but the practice is mostly single-payer. |
| 15-35% | Moderate overlap. The provider bills a meaningful set of codes to both payers. E/M visits and some common procedures overlap. |
| 35-60% | High overlap. The provider's billing pattern is largely consistent across payers. Broad-based practice. |
| 60%+ | Very high overlap. Most of what the provider does appears in both files. Unusual — indicates a nearly payer-agnostic practice. |

> **ASSUMPTION:** The overlap ranges above are estimates. The actual distribution of pain medicine payer overlap in Massachusetts must be computed from the data. The ranges above are calibrated higher than pediatrics (where 20%+ was "high") because pain medicine providers are more likely to serve both payer populations. **These ranges should be updated once actual peer anchors are calculated.**


## 2. The Pain Medicine Context

Payer diversity in pain medicine is structurally different from pediatrics in several important ways:

| Factor | Pediatrics | Pain Medicine |
|---|---|---|
| Dominant payer | Medicaid | Medicare |
| "Normal" single-payer case | Medicaid-only | Medicare-only |
| Expected baseline overlap | Low (~6-8% mean) | Moderate-to-high (~20-35% mean, estimated) |
| Why overlap varies | Almost no kids on Medicare | Medicaid pain patients exist but volume is lower. MassHealth PA requirements may further suppress Medicaid procedural codes. |
| Panel age driver | Children (0-18) | Primarily adults 50+, with some younger chronic pain patients |

**Massachusetts-specific factors affecting payer diversity:**

| Factor | Impact on Overlap |
|---|---|
| **MassHealth prior authorization** | MA Medicaid (MassHealth) requires prior authorization for many interventional pain procedures. This creates an access barrier that may suppress Medicaid procedure codes — a provider might perform epidural injections for Medicare patients but not bother with the PA process for Medicaid patients. This is a payer-access issue, not a quality signal. |
| **MassHealth managed care** | Most MassHealth enrollees are in managed care plans (e.g., BMC HealthNet, Tufts, Fallon). Managed care claims appear in the Medicaid file but plan-specific restrictions may limit which procedures are authorized. |
| **MA opioid regulations** | MA's strict prescribing environment may push more patients toward interventional pain management. This could increase procedural volume across both payers but does not directly affect code overlap. |
| **Dual-eligible population** | Massachusetts has a meaningful dual-eligible (Medicare + Medicaid) population. Pain providers serving dual-eligibles may have higher overlap because the same patient generates claims in both files. |

> **ASSUMPTION:** We do not have data on dual-eligible beneficiary counts per provider. A provider with high overlap could be serving many dual-eligible patients (same patients in both files) rather than genuinely serving separate Medicare and Medicaid populations. This is a known limitation. The overlap metric does not distinguish between these scenarios.


## 3. Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All pain medicine NPIs in Massachusetts that appear in at least one CMS file | Primary scoring. Captures MA-specific payer mix and MassHealth regulations. |
| **National** | All states combined | Fallback if MA cohort < 30 providers. Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES practice address | Boston metro vs. Western MA may have different Medicaid penetration. Not implemented now, fields reserved in output schema. |


## 4. Peer Cohort Definition

Consistent with the guideline concordance document for this specialty:

| Parameter | Value | Rationale |
|---|---|---|
| Taxonomy codes | 208VP0014X (Interventional Pain Medicine), 208VP0000X (Pain Medicine), plus pain subspecialty codes under 207L00000X, 208100000X, 2084P0800X | Broad cohort — matches guideline concordance peer definition |
| State | Massachusetts | Default geographic scope |
| Entity type | Type 1 NPI (Individual) | Excludes group/facility NPIs |
| Minimum presence | Provider appears in at least one CMS file with > 0 services | Must have claims data to compute overlap |
| National fallback | If MA cohort < 30 providers | Use national cohort with MA providers flagged |

> **Note on interventional vs. non-interventional:** Unlike guideline concordance (which scores these groups differently), payer diversity uses the **same metric** for both. The overlap calculation is structurally identical regardless of practice type. However, we compute and report the `interventional_flag` so that overlap patterns can be analyzed separately if needed. Interventional providers may have systematically different overlap than non-interventional ones due to procedure code density.


## 5. Peer Anchors

```
peer_cohort = all pain medicine NPIs in Massachusetts
    WHERE taxonomy_code IN (208VP0014X, 208VP0000X, pain subspecialty codes)
    AND entity_type = 1 (Individual)
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative Massachusetts pain medicine anchors (to be computed from real data):**

| Stat | Estimated Value | Rationale for Estimate |
|---|---|---|
| Mean overlap | ~20-30% | Higher than pediatrics because both payer populations exist. Lower than adult primary care because Medicare still dominates. |
| Median overlap | ~15-25% | Skewed right — many Medicare-only providers pull the median lower than the mean. |
| p75 | ~35-45% | Providers with meaningful Medicaid volume. |
| p90 | ~50-60% | Providers with broad, payer-agnostic practices. |

> **ASSUMPTION:** These estimates are rough projections. The actual anchors MUST be computed from the real CMS data before scoring. If the actual p90 is substantially different (e.g., 30% or 80%), the scoring cap and overlap interpretation table in Section 1 should be recalibrated. **Do not use these estimates for production scoring.**


## 6. Scoring

Scores ramp from 0 to 100 and hit the cap at the peer p90:

```
cap = peer_p90        -- the overlap % at which score maxes out

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

**Illustrative scoring (assuming cap = 55%, to be recalculated from real data):**

| Overlap | Score | Interpretation |
|---|---|---|
| 0% | 0 | Single-payer provider. Not penalized in composite, just recorded. |
| 10% | 18 | Low overlap. Mostly Medicare-only. |
| 20% | 36 | Below average. Some Medicaid presence but limited. |
| 30% | 55 | Moderate. Near the estimated peer mean. |
| 40% | 73 | Above average. Broad-based practice. |
| 55%+ | 100 | High overlap. Practice pattern is largely payer-agnostic. |


### Neutral Handling for Medicare-Only Providers

Many pain medicine providers in Massachusetts appear in the Medicare file but not the Medicaid file at all. Their overlap is 0% by definition, not by choice. They simply do not see Medicaid patients — or MassHealth PA requirements make interventional procedures impractical for Medicaid patients in their setting.

**This is the inverse of pediatrics**, where Medicaid-only was the normal single-payer case.

```
IF COUNT(medicaid_codes) = 0:
    single_payer = true
    single_payer_type = 'medicare_only'
    payer_diversity_score = 0
    -- flag for reduced weight in composite

ELIF COUNT(medicare_codes) = 0:
    single_payer = true
    single_payer_type = 'medicaid_only'
    payer_diversity_score = 0
    -- flag for reduced weight in composite
    -- NOTE: Medicaid-only is unusual for pain medicine. Worth investigating
    -- whether this provider is primarily a different specialty.

ELSE:
    single_payer = false
    payer_diversity_score = (payer_overlap / cap) * 100
```

> **Design choice:** For providers who appear in only one file (overlap = 0%), the score is 0 but this score carries **reduced weight** in any composite that uses it. The composite should not penalize a provider for being Medicare-only. The payer diversity score is informational for these providers: it records the fact that we have only one payer window into their practice.

> **ASSUMPTION — Medicaid-only flag:** A pain medicine provider who appears in Medicaid ONLY (no Medicare codes) is unusual. This could indicate: (a) a younger provider building a practice in a Medicaid-heavy area, (b) a provider whose primary specialty is something other than pain medicine and who only does occasional pain work for Medicaid patients, or (c) a data issue. We flag this as `medicaid_only_unusual` but do not auto-penalize. **This edge case should be reviewed against the actual data to determine how common it is in Massachusetts.**


## 7. Additional Metrics


### 7A. Code-Category Overlap

Beyond raw code overlap, check which pain medicine workflow categories appear in both files. These categories are specific to pain medicine practice:

```
categories = {
    'em_visits':              [99202, 99203, 99204, 99205,
                               99211, 99212, 99213, 99214, 99215],
    'epidural_injections':    [62320, 62321, 62322, 62323,
                               62324, 62325, 62326, 62327],
    'facet_interventions':    [64490, 64491, 64492, 64493, 64494, 64495,
                               64633, 64634, 64635, 64636],
    'peripheral_nerve_blocks':[64400, 64405, 64408, 64415, 64416, 64417,
                               64418, 64420, 64421, 64425, 64430, 64435,
                               64445, 64446, 64447, 64448, 64449, 64450],
    'si_joint':               [27096, 64451],
    'trigger_points':         [20552, 20553],
    'neuromodulation':        [63650, 63685, 63661, 63662, 63663, 63664,
                               64590],
    'joint_injections':       [20600, 20604, 20605, 20606, 20610, 20611],
    'image_guidance':         [77003, 77012, 76942]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
total_detected_categories = COUNT of categories WHERE in_medicare OR in_medicaid
category_overlap = categories_in_both / total_detected_categories * 100
```

> **Note:** We divide by `total_detected_categories` (not the fixed count of 9) because not every pain provider performs every category of procedure. A neuromodulation specialist who doesn't do trigger points shouldn't be penalized for missing trigger point overlap.

**What category overlap tells us for pain medicine:**

A provider who bills E/M visits and epidural injections to both payers but facet interventions only to Medicare has category-level insight into where their payer-specific practice patterns diverge. This could reflect:
- MassHealth PA barriers for certain procedure types
- Different clinical populations (degenerative facet disease in Medicare patients vs. other conditions in Medicaid patients)
- Payer-specific billing decisions

Category overlap is informational context, not a separate score.


### 7B. Volume-Weighted Overlap

The core metric treats all codes equally. A code billed once counts the same as one billed 500 times. Volume-weighted overlap asks: what share of the provider's total services come from codes that appear in both files?

```
both_payer_services = SUM(total_services) WHERE hcpcs_code IN both_payer_codes
    across BOTH files

total_services = SUM(total_services) across BOTH files

volume_weighted_overlap = both_payer_services / total_services
```

This is a stronger signal for pain medicine than for pediatrics because:
- Pain providers have high-volume procedure codes (epidurals, facet blocks) that may dominate total services
- A provider whose both-payer codes account for 80% of their total volume has a broadly consistent practice even if some rare procedure codes only appear in one file
- A provider whose both-payer codes are limited to E/M visits (common codes) while ALL procedure codes are Medicare-only has a low volume-weighted overlap that reveals the practice is really Medicare-procedural with incidental Medicaid E/M visits

> **ASSUMPTION:** Volume-weighted overlap is computed but not used in the primary score (which uses code-count overlap, consistent with the pediatric methodology). It is reported as a supplementary metric. If analysis shows that volume-weighted overlap is a better discriminator for pain medicine, this decision should be revisited.


### 7C. Payer-Specific Codes

Which codes does this provider bill to only one payer? This is the inverse of overlap.

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

This list is informational, not scored. But it answers questions like:
- Does this provider bill interventional procedures to Medicare but only E/M visits to Medicaid? (Could indicate MassHealth PA barriers or a payer-specific procedure strategy.)
- Does the provider bill image guidance codes to one payer but not the other? (Could indicate different place-of-service billing patterns by payer.)
- Are there codes that appear ONLY in Medicaid? (Unusual for pain medicine — worth investigating if it occurs.)


---

# PART C: BUSINESS RULES

---


## 8. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "MA"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99215, 62322, 62323, 64490, 64491,
                      64633, 64634, 77003, 27096, 20553, G2211}
    medicaid_codes = {99213, 99214, 62322, 62323, 77003, 20553}

STEP 2: Compute overlap
    all_codes = 13 distinct codes
    both_payer_codes = {99213, 99214, 62322, 62323, 77003, 20553} = 6 codes
    payer_overlap = 6 / 13 = 46.2%

STEP 3: Get peer anchor
    peer_p90 = 55% (illustrative)
    cap = 55%

STEP 4: Score
    payer_overlap (46.2%) < cap (55%)
    payer_diversity_score = (46.2 / 55) * 100 = 84.0

STEP 5: Single-payer check
    single_payer = false (provider appears in both files)

STEP 6: Category overlap
    em_visits:              medicare YES, medicaid YES → both
    epidural_injections:    medicare YES (62322, 62323), medicaid YES → both
    facet_interventions:    medicare YES (64490, 64491, 64633, 64634), medicaid NO → medicare only
    peripheral_nerve_blocks: neither → not detected
    si_joint:               medicare YES (27096), medicaid NO → medicare only
    trigger_points:         medicare YES (20553), medicaid YES → both
    neuromodulation:        neither → not detected
    joint_injections:       neither → not detected
    image_guidance:         medicare YES (77003), medicaid YES → both

    detected categories = 6
    categories_in_both = 4
    category_overlap = 4/6 = 66.7%

STEP 7: Payer-specific codes
    medicare_only_codes = {99215, 64490, 64491, 64633, 64634, 27096, G2211}
    medicaid_only_codes = {} (none)

INTERPRETATION: This provider has strong overall code overlap (84 score) but
facet interventions and SI joint procedures are Medicare-only. This could
reflect MassHealth PA barriers for these procedures, or a patient population
difference (older Medicare patients with degenerative facet disease).
```


## 9. Worked Examples

**Provider A: Broad mixed-payer interventional practice**
Appears in both files. 20 total codes, 12 in both payers. Overlap = 60%. Score = 100.
Category overlap: 7 of 8 detected categories in both. High payer diversity.

**Provider B: Medicare-dominant interventionalist**
Appears in both files. 18 total codes, 4 in both payers (E/M visits + trigger points). Overlap = 22%. Score = 40.
Category overlap: 2 of 7 detected categories in both. Procedures are Medicare-only.
*Interpretation: This provider sees some Medicaid patients for office visits but performs procedures almost exclusively for Medicare patients. Could be MassHealth PA barriers or practice choice.*

**Provider C: Medicare-only provider**
Appears in Medicare only. 15 codes, 0 in Medicaid. Overlap = 0%. Score = 0, single_payer = true, single_payer_type = 'medicare_only'.
Reduced weight in composite. Not a quality signal — structurally common in MA pain medicine.

**Provider D: Both files present, zero code overlap**
Appears in both files. Medicare: 12 codes (procedures). Medicaid: 5 codes (E/M visits only). Zero codes in common. Overlap = 0%.
Score = 0, single_payer = false.
*This is a genuine red flag.* The provider bills completely different services depending on the payer. Worth investigating: are they doing procedures for Medicare patients but only office visits for Medicaid patients? If so, why?

**Provider E: Medicaid-only provider (unusual)**
Appears in Medicaid only. 8 codes. Overlap = 0%. Score = 0, single_payer = true, single_payer_type = 'medicaid_only'.
Flagged as `medicaid_only_unusual`. In pain medicine, this is atypical and warrants review — is this provider's primary specialty actually something else?


## 10. Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider appears in neither file | Cannot score. Exclude. |
| Provider appears in one file only | single_payer = true, score = 0, reduced weight in composite. |
| Medicaid file unavailable (dataset under maintenance) | Cannot compute payer diversity for any provider. Score = null for all. Do not impute. |
| Provider has very few codes in one file (e.g., 1-2 Medicare codes) | Compute normally but flag as `low_code_count_[payer]`. Small code sets make the overlap metric noisy. |

## 11. Subspecialist Handling

| Subspecialty Flag | Detection Rule | Payer Diversity Impact |
|---|---|---|
| `neuromodulation_specialist` | >80% of procedural volume in SCS/PNS codes | Score normally. Neuromodulation specialists may have lower overlap because SCS procedures are less common in Medicaid. Do not adjust — the score accurately reflects their payer pattern. |
| `non_interventional` | <10% of total services are procedural codes | Score normally. Non-interventional providers may have HIGHER overlap than interventional ones because E/M codes are more likely to appear in both files. This is expected. |
| `anesthesiology_primary` | Taxonomy 207L00000X without pain subspecialty, pain procedures <50% of billing | **Exclude from pain medicine peer cohort** (consistent with guideline concordance document). |


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 12. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance (AAPM/ASIPP)** | Does this provider follow pain medicine clinical guidelines? | Clinical quality proxy |
| **Peer Comparison** | Does their billing look like a normal pain medicine provider? | Practice pattern |
| **Volume Adequacy** | Is the volume real for what they claim to do? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying. A provider who performs facet interventions for Medicare patients but not Medicaid patients has a payer-specific practice pattern. That is useful context.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Good provider, Medicare-only panel | High across all | 0 (single_payer, reduced weight). Not a quality problem. |
| Good provider, mixed payers, consistent practice | High across all | High (codes overlap across both files) |
| Provider who does procedures for Medicare but only E/M for Medicaid | High guideline concordance (Medicare data drives it) | Low (procedure codes only in one file) |
| Provider with completely different code sets per payer | Varies | 0 (red flag: different practice by payer) |
| Neuromodulation specialist, Medicare-dominant | High guideline/peer (within subspecialty norms) | Low-to-moderate (SCS codes mostly Medicare). Expected. |

### What Payer Diversity Catches That Others Miss

| Signal | Payer Diversity | Other Dimensions |
|---|---|---|
| Provider practices differently depending on payer | **Yes — primary signal** | Partially visible in peer comparison if one payer's codes dominate |
| MassHealth PA barriers suppressing Medicaid procedures | **Yes — visible as low procedural overlap** | Not visible (other scores use combined or Medicare-dominant data) |
| Dual-eligible patient concentration | **Yes — inflates overlap** | Not visible |
| Provider whose Medicaid presence is E/M-only while Medicare is procedural | **Yes — low category overlap** | Partially in peer comparison |


---

# PART E: RISKS AND LIMITATIONS

---


## 13. Risks

**Medicare-only is normal in pain medicine.** Most pain medicine providers in Massachusetts will be Medicare-dominant. A low or zero payer diversity score is not a quality signal for this specialty — it is a structural feature of the patient population. The score is informational, and single-payer providers get reduced weight in any composite.

**MassHealth PA requirements create artificial payer asymmetry.** A provider who would happily perform the same procedures for Medicaid patients may be deterred by MassHealth's prior authorization process. Low Medicaid procedural volume may reflect payer barriers, not provider choice. This is the most significant confounder for pain medicine payer diversity in Massachusetts.

**Dual-eligible patients inflate overlap.** A provider serving many dual-eligible patients (Medicare + Medicaid simultaneously) may show high code overlap not because they serve diverse populations, but because the same patients appear in both files. We cannot distinguish this from genuinely serving separate Medicare and Medicaid populations.

**Small Medicaid code sets create noise.** A provider who bills 2 codes to Medicaid and 15 to Medicare has a code overlap driven by those 2 Medicaid codes. Whether they happen to match Medicare codes is somewhat random at this scale. The `low_code_count_medicaid` flag is designed to identify these cases.

**Overlap does not equal quality.** A provider who bills the same inappropriate procedures to both payers has high overlap but low quality. Payer diversity is orthogonal to clinical quality. It measures consistency, not correctness.

**The Medicaid file may be temporarily unavailable.** The CMS Medicaid Provider Spending dataset was under maintenance as of late March 2026. If only Medicare data is available, payer diversity cannot be computed.

**State-level variation in Medicaid pain management coverage.** MassHealth covers different pain procedures than other state Medicaid programs. Massachusetts peer anchors will reflect MA-specific Medicaid policy, which is another reason to prefer state-level scoring over national comparisons.

**Facility vs. professional billing.** Some codes may be billed under the facility NPI for one payer and the professional NPI for another, depending on practice setting and payer rules. This could artificially reduce code overlap for the individual provider NPI.


---

# OUTPUT SCHEMA

---

One row per NPI. All scores 0-100.

| Column | Type | Description |
|---|---|---|
| **Identity & Geography** | | |
| `npi` | string | National Provider Identifier |
| `provider_name` | string | From NPPES |
| `taxonomy_code` | string | Primary taxonomy code from NPPES |
| `provider_state` | string | MA (Massachusetts) |
| `provider_zip` | string | From NPPES practice address |
| `provider_zip3` | string | First 3 digits of ZIP |
| `provider_cbsa` | string | Core-Based Statistical Area code (for future sub-state analysis) |
| `measurement_year` | int | Year of CMS data used |
| `interventional_flag` | boolean | True if >40% of services are procedural codes (from guideline concordance methodology) |
| `geo_group_level` | string | "state", "national", or "zip3" (future) |
| `peer_cohort_size` | int | Number of peers in cohort |
| **Core Metric** | | |
| `medicare_code_count` | int | Distinct HCPCS codes billed to Medicare |
| `medicaid_code_count` | int | Distinct HCPCS codes billed to Medicaid |
| `total_distinct_codes` | int | Union of both code sets |
| `both_payer_code_count` | int | Codes appearing in both files |
| `payer_overlap` | float | both_payer_code_count / total_distinct_codes |
| `single_payer` | boolean | True if provider appears in only one file |
| `single_payer_type` | string | 'medicare_only', 'medicaid_only', or null |
| `medicaid_only_unusual` | boolean | True if single_payer_type = 'medicaid_only' (unusual for pain medicine) |
| `low_code_count_medicare` | boolean | True if medicare_code_count <= 3 |
| `low_code_count_medicaid` | boolean | True if medicaid_code_count <= 3 |
| `payer_diversity_score` | float | 0-100, ramped to cap at peer p90 |
| **Peer Anchors** | | |
| `peer_mean_overlap` | float | Mean overlap in peer cohort |
| `peer_median_overlap` | float | Median overlap in peer cohort |
| `peer_p75_overlap` | float | 75th percentile overlap |
| `peer_p90_overlap` | float | p90 overlap (the scoring cap) |
| **Category Overlap** | | |
| `categories_detected` | int | Workflow categories with codes in either file (0-9) |
| `categories_in_both` | int | Workflow categories present in both files |
| `category_overlap` | float | categories_in_both / categories_detected * 100 |
| `categories_medicare_only` | string | Category names appearing only in Medicare |
| `categories_medicaid_only` | string | Category names appearing only in Medicaid |
| **Volume-Weighted** | | |
| `volume_weighted_overlap` | float | Share of total services from both-payer codes |
| **Payer-Specific Detail** | | |
| `medicare_only_codes` | string | Comma-separated codes only in Medicare |
| `medicaid_only_codes` | string | Comma-separated codes only in Medicaid |
| `both_payer_codes` | string | Comma-separated codes in both files |


---

# APPENDIX: ASSUMPTIONS REQUIRING VALIDATION

---

| # | Assumption | Current Value | Why It Matters |
|---|---|---|---|
| 1 | Estimated peer mean overlap for MA pain medicine | ~20-30% | If actual mean is much lower (e.g., 10%), the overlap interpretation table and scoring cap need recalibration. |
| 2 | Estimated p90 cap | ~50-60% | Directly determines what score = 100 means. Must be computed from real data. |
| 3 | Medicaid-only providers are flagged as unusual | `medicaid_only_unusual = true` | If there are many Medicaid-only pain providers in MA (e.g., community health centers with pain clinics), this flag may not be appropriate. |
| 4 | Category definitions use 9 pain medicine workflow categories | See Section 7A | The categories should be validated against actual MA pain medicine billing patterns. Some categories may need to be added, merged, or removed. |
| 5 | Volume-weighted overlap is supplementary, not primary | Reported but not scored | If volume-weighted overlap proves more discriminating than code-count overlap for pain medicine, it should be promoted to the primary metric. |
| 6 | Low code count threshold is <=3 codes | Flags noisy overlap calculations | The threshold should be checked against the actual distribution of code counts per payer. |
| 7 | MassHealth PA impact on Medicaid procedural codes | Acknowledged as confounder, not adjusted for | If MA-specific PA data becomes available, a correction factor could be applied to Medicaid code counts. |
