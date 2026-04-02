# Internal Medicine Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A provider who bills 99214 (office visit) to both payers but G0439 (Annual Wellness Visit) only to Medicare has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel is almost entirely one payer (common in internal medicine where Medicare dominates).

This is an access proxy, not a clinical quality measure. It tells you how broad-based the provider's practice is across payer types.

**Important structural note:** Medicare-specific G-codes (G0438, G0439, G0444) can only appear in the Medicare file by definition. These codes structurally limit the maximum overlap any internist can achieve. The scoring and category overlap metrics account for this.


---

# PART A: WHAT WE HAVE

---

This score requires both CMS files:

**CMS Medicare Physician & Other Practitioners** — NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** — NPI + HCPCS codes billed to Medicaid

We only need to know which HCPCS codes appear in each file for a given NPI. Volume does not matter for the core metric. Presence is enough.

**NPPES NPI Registry** — provider identification, taxonomy, geography.

**Taxonomy filter:** 207R00000X (Internal Medicine). Exclude all subspecialists (e.g., 207RC0000X Cardiovascular Disease, 207RG0300X Geriatric Medicine, 207RP1001X Pulmonary Disease, etc.). Only general internists.


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
| 0% | Provider appears in only one file. All codes are payer-specific. Medicare-only is common for IM (especially practices focused on 65+ patients). |
| 1-10% | Low overlap. A few codes appear in both, but the practice is mostly single-payer. |
| 10-20% | Moderate overlap. Near the peer mean. The provider bills a meaningful set of codes to both payers. |
| 20%+ | High overlap. The provider's billing pattern is consistent across payers. Broad-based practice. |
| 100% | Every code the provider bills appears in both files. Unusual, and structurally impossible for internists who bill Medicare-specific G-codes. |


## 2. The Internal Medicine Context

Payer diversity in internal medicine is structurally different from pediatrics or OB-GYN:

- Medicare is the dominant payer. Most internal medicine patients are middle-aged to elderly, with chronic disease management driving volume. The typical IM panel skews heavily toward 65+.
- Internists also serve younger adults on Medicaid and commercial plans. But the Medicare share is usually the largest single payer.
- This distribution is close to urology: Medicare-dominant with some Medicaid volume.
- A meaningful share of internists will appear in both files, giving us a MODERATE expected overlap (~10-18% mean). This is higher than pediatrics (~6-8%) but reflects the same structural dynamic in reverse: where pediatrics is Medicaid-dominant with thin Medicare, IM is Medicare-dominant with thinner Medicaid.
- Medicare-only is the common single-payer case. An internist with zero Medicaid codes is not unusual. It means they do not see Medicaid patients, which is normal for practices focused on older populations.
- Medicaid-only is unusual for internal medicine and would warrant investigation.

**Structural limitation: Medicare-specific G-codes.** Codes like G0438 (Initial Annual Wellness Visit), G0439 (Subsequent Annual Wellness Visit), and G0444 (depression screening, Medicare) are defined by CMS as Medicare-specific services. They will ONLY appear in the Medicare file. Any internist who bills these codes (most do) has a built-in ceiling on their maximum possible overlap. This is not a practice choice, it is a coding structure imposed by CMS. The category overlap metric (Section 6A) should account for this by noting that preventive/screening categories will inherently show lower cross-payer overlap.

**What matters is the relative position within the internal medicine peer cohort, not the absolute number.**


## 3. Geographic Grouping

Payer mix varies by state and by urban/rural. States with higher Medicaid enrollment will have higher mean payer overlap because more internists see a mix of payers. States with older populations (Florida, Arizona) may have more Medicare-dominant practices and lower overlap.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All IM NPIs (taxonomy 207R00000X, no subspecialists) in the same state that appear in at least one CMS file | Primary scoring. Captures state-level Medicaid/Medicare mix. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES practice address | Urban practices may have more payer diversity than rural. Not implemented now, fields in output schema. |


## 4. Peer Anchors

```
peer_cohort = all internal medicine NPIs in the same state
    WHERE taxonomy_code = '207R00000X'
    AND subspecialist = false
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap) across peer cohort
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national internal medicine anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~12-16% |
| Median overlap | ~8-14% |
| p75 | ~18-24% |
| p90 | ~28-35% |

These are higher than pediatric anchors because more internists appear in both files. But Medicare-specific G-codes create a structural ceiling that prevents overlap from reaching very high levels.

Many internists will have 0% overlap (Medicare-only). That is not a penalty. The score handles this.


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
| 7.5% | 25 | Low overlap. Mostly single-payer. |
| 12.5% | ~42 | Moderate. Near the peer mean. |
| 20% | ~67 | Above average overlap. Broad-based. |
| 30%+ | 100 | High overlap. Practice pattern is payer-agnostic. |


### Neutral Handling for Medicare-Only Providers

Many internists appear in the Medicare file but not the Medicaid file at all. Their overlap is 0% by definition, not by choice. They simply do not see Medicaid patients.

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
    'office_visits':       [99213, 99214, 99215, G2211],
    'preventive_wellness': [99395, 99396, 99397, G0438, G0439],
    'screening':           [96127, 96160, G0444],
    'immunizations':       [90471, 90686],
    'diagnostics':         [36415, 81003, 93000],
    'care_management':     [99490]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
category_overlap = categories_in_both / 6 * 100
```

**Medicare-specific G-code caveat:** The preventive_wellness category contains G0438 and G0439, and the screening category contains G0444. These are Medicare-specific codes that can only appear in the Medicare file. This means:
- preventive_wellness can show "in_both" only if a non-G-code in the category (99395, 99396, 99397) also appears in the Medicaid file
- screening can show "in_both" only if 96127 or 96160 also appears in the Medicaid file
- If the internist's only preventive billing is G0438/G0439, that category will never be "in_both" regardless of practice pattern

This is a structural artifact of payer-specific coding, not a practice pattern signal. Downstream users should interpret preventive_wellness and screening category overlap with this in mind.

A provider who bills office visits and immunizations to both payers but diagnostics only to Medicare has category-level insight into where their payer-specific practice patterns diverge.


### 6B. Volume-Weighted Overlap

The core metric treats all codes equally. A code billed once counts the same as one billed 500 times. Volume-weighted overlap asks: what share of the provider's total services come from codes that appear in both files?

```
both_payer_services = SUM(total_services) WHERE hcpcs_code IN both_payer_codes
    across BOTH files

total_services = SUM(total_services) across BOTH files

volume_weighted_overlap = both_payer_services / total_services
```

This is a stronger signal. A provider whose both-payer codes account for 80% of their total volume has a broadly consistent practice even if many rare codes only appear in one file. A provider whose both-payer codes account for 5% of volume has a practice pattern that is fundamentally different by payer.

For internal medicine, volume-weighted overlap will often be higher than raw code overlap because the high-volume codes (99213, 99214, 99215) are the ones most likely to appear in both files, while the Medicare-specific G-codes that drag down raw overlap tend to be lower-volume.


### 6C. Payer-Specific Codes

Which codes does this provider bill to only one payer? This is the inverse of overlap.

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

This list is informational, not scored. But it answers questions like:
- Does this provider bill Annual Wellness Visit codes (G0438, G0439) only to Medicare? (Expected: yes, these are Medicare-specific by definition.)
- Does this provider bill screening codes to Medicare but not Medicaid? (Could indicate different preventive care by payer.)
- Does this provider bill care management codes (99490) to one payer but not the other? (Could reflect payer-specific reimbursement incentives for chronic care management.)


---

# PART C: BUSINESS LOGIC

---


## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "TX"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99215, G2211, G0439, 93000, 36415,
                      81003, 90471, 90686, G0444, 99490}
    medicaid_codes = {99213, 99214, 99215, G2211, 99396, 90471, 96127}

STEP 2: Compute overlap
    all_codes = 14 distinct codes
    both_payer_codes = {99213, 99214, 99215, G2211, 90471} = 5 codes
    payer_overlap = 5 / 14 = 35.7%

    Note: G0439, G0444 are Medicare-specific and cannot appear in Medicaid.
    Even without those 2 codes, overlap would be 5 / 12 = 41.7%.

STEP 3: Get peer anchor
    peer_p90 = 30% (illustrative)
    cap = 30%

STEP 4: Score
    payer_overlap (35.7%) >= cap (30%)
    payer_diversity_score = 100

STEP 5: Additional metrics
    category_overlap:
        office_visits (both: 99213, 99214, 99215, G2211 in both),
        preventive_wellness (Medicare has G0439, Medicaid has 99396, no code in both),
        screening (Medicare has G0444, Medicaid has 96127, no code in both),
        immunizations (both: 90471 in both),
        diagnostics (Medicare only: 36415, 81003, 93000),
        care_management (Medicare only: 99490)
    categories_in_both = 2 of 6
    category_overlap = 33%

    Note: preventive_wellness and screening show 0 cross-payer overlap
    because the Medicare codes (G0439, G0444) are payer-specific by definition,
    and the non-G codes happen to appear in only one file here.

    volume_weighted_overlap = (compute from service volumes)

    medicare_only_codes = {G0439, 93000, 36415, 81003, 90686, G0444, 99490}
    medicaid_only_codes = {99396, 96127}
```


## 8. Worked Examples

**Provider A:** Appears in both files. 20 total codes, 6 in both payers. Overlap = 30%. Score = 100.

**Provider B:** Appears in both files. 16 total codes, 2 in both payers. Overlap = 12.5%. Score = 42 (12.5/30 * 100).

**Provider C:** Appears in Medicare only. 18 codes, 0 in Medicaid. Overlap = 0%. Score = 0, single_payer = true. Reduced weight in composite. This is the most common single-payer case for internal medicine.

**Provider D:** Appears in both files. Different codes in each file, 0 in both. Overlap = 0%. Score = 0, single_payer = false. This is a genuine signal: the provider bills completely different services depending on the payer. Worth investigating.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 9. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **ACP Guidelines Concordance** | Does this provider follow ACP/USPSTF guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal internist? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity (32 ratio checks) |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |

Payer diversity adds a different angle: it does not measure what the provider does, it measures whether they do the same thing regardless of who is paying. A provider who screens Medicare patients but not Medicaid patients (or vice versa) has a payer-specific practice pattern. That is useful context for an employer evaluating whether to direct-contract.

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Good provider, Medicare-only panel | High across all | 0 (single_payer, reduced weight) |
| Good provider, mixed payers, consistent practice | High across all | High (codes overlap across both files) |
| Provider who screens for Medicare but not Medicaid | High guideline concordance (Medicare data drives it) | Low (screening codes only in one file) |
| Provider with completely different code sets per payer | Varies | 0 (red flag: different practice by payer) |
| Provider with high raw overlap but low category overlap | Varies | Investigate: Medicare-specific G-codes may be suppressing category overlap despite genuine cross-payer consistency |


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Medicare-heavy is normal in internal medicine.** Most internists are Medicare-dominant. A low payer diversity score is not a quality signal, it is a structural feature of the specialty. The score is informational, and single-payer providers get reduced weight in any composite.

**Medicare-specific G-codes structurally limit overlap.** G0438 (Initial Annual Wellness Visit), G0439 (Subsequent Annual Wellness Visit), and G0444 (depression screening) are Medicare-only codes by CMS definition. They can only appear in the Medicare file. Any internist who bills these (most do for their 65+ patients) has a built-in ceiling on overlap. This is not a practice signal, it is a coding artifact. The category overlap metric is also affected: preventive_wellness and screening categories will show lower cross-payer overlap due to these codes.

**Medicaid internal medicine volume may be thin.** While internists do see Medicaid patients, the volume is often much lower than Medicare. A provider may bill only a handful of codes to Medicaid (a few office visits for younger adults), making the overlap calculation sensitive to small numbers.

**The Medicaid file may be temporarily unavailable.** The CMS Medicaid Provider Spending dataset was released February 2026 and was under maintenance as of late March 2026. If only Medicare data is available, payer diversity is not computable. Score = null.

**Overlap does not equal quality.** A provider who bills the same bad practice to both payers has high overlap but low quality. Payer diversity is orthogonal to clinical quality. It measures consistency, not correctness.

**State-level variation in Medicaid eligibility is large.** States with Medicaid expansion have different internal medicine payer distributions than non-expansion states. In expansion states, more working-age adults qualify for Medicaid, so internists may have higher Medicaid volume and therefore higher overlap. State-level peer grouping captures most of this, but the cap (peer p90) will vary significantly by state.


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
