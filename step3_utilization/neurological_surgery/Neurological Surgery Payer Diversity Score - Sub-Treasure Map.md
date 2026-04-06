# Neurological Surgery Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

This is an access proxy, not a clinical quality measure. It tells you how broad-based the neurosurgeon's practice is across payer types.


---

# PART A: WHAT WE HAVE

---

**CMS Medicare Physician & Other Practitioners** — NPI + HCPCS codes billed to Medicare
**CMS Medicaid Provider Spending** — NPI + HCPCS codes billed to Medicaid
**NPPES NPI Registry** — provider identification, taxonomy 207T00000X, geography.


---

# PART B: THE LOGIC

---


## 1. The Metric: Both-Payer Code Overlap

```
medicare_codes = SET of distinct hcpcs_code WHERE npi = X
    from Medicare Physician & Other Practitioners (any service count > 0)

medicaid_codes = SET of distinct hcpcs_code WHERE npi = X
    from Medicaid Provider Spending (any claim count > 0)

all_codes = medicare_codes UNION medicaid_codes
both_payer_codes = medicare_codes INTERSECT medicaid_codes

payer_overlap = COUNT(both_payer_codes) / COUNT(all_codes)
```


## 2. The Neurosurgery Context

Payer diversity in neurosurgery is **moderate** — more balanced than retina (which is overwhelmingly Medicare) and more Medicare-weighted than pediatrics (which is overwhelmingly Medicaid):

- **Medicare is dominant** for neurosurgery: degenerative spine disease, brain tumors, and normal pressure hydrocephalus are predominantly conditions of aging.
- **Medicaid is meaningful** for neurosurgery: traumatic brain injury (younger patients), pediatric hydrocephalus and congenital anomalies, disc herniations in working-age adults, and some spine trauma.
- A neurosurgeon with **zero Medicaid codes** is not unusual in suburban/private practice settings focused on elective spine.
- A neurosurgeon with **high Medicaid volume** likely works at a trauma center or academic medical center with a safety-net mission.
- Some neurosurgeons will have **high commercial/private payer volume** that does not appear in either CMS file. Our overlap metric only captures Medicare vs. Medicaid.

**Expected payer overlap for neurosurgery:** Moderate. Estimated mean ~15-25%, higher than retina (~12-18%) because the Medicaid population contributes more trauma and emergency neurosurgery than retina Medicaid contributes to retinal disease. Lower than OB-GYN or pediatrics where Medicaid is a larger share.


## 3. Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All neurosurgical NPIs in the same state that appear in at least one CMS file | Primary scoring. |
| **National** | All states combined | Cross-state benchmark. |
| **Sub-state (future)** | ZIP-3 or CBSA | Trauma centers vs. elective spine practices have very different payer mixes. |


## 4. Peer Anchors

```
peer_cohort = all neurosurgical NPIs in the same state
    WHERE taxonomy_code = '207T00000X'
    AND (COUNT(medicare_codes) + COUNT(medicaid_codes)) > 0

For each NPI in peer_cohort:
    compute payer_overlap

peer_mean = MEAN(payer_overlap)
peer_median = MEDIAN(payer_overlap)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative national neurosurgery anchors (to be computed from real data):**

| Stat | Estimated Value |
|---|---|
| Mean overlap | ~18-22% |
| Median overlap | ~15-20% |
| p75 | ~30% |
| p90 | ~40% |

> **ASSUMPTION:** These anchors are estimates. States with Medicaid expansion will have higher overlap because more working-age adults with disc herniations and spinal stenosis are covered by Medicaid. Non-expansion states will have lower overlap. States with major trauma centers (Level I) will also have higher overlap due to Medicaid trauma volume.


## 5. Scoring

```
cap = peer_p90

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
    clamped to [0, 100]
```

| Overlap | Score (assuming cap = 40%) | Interpretation |
|---|---|---|
| 0% | 0 | Single-payer provider. Not penalized in composite. |
| 10% | 25 | Low overlap. Primarily one payer. |
| 20% | 50 | Moderate. Near the peer mean. |
| 30% | 75 | Above average. Serves both populations. |
| 40%+ | 100 | High overlap. Payer-diverse practice. |


### Neutral Handling for Single-Payer Providers

```
IF COUNT(medicare_codes) = 0 OR COUNT(medicaid_codes) = 0:
    single_payer = true
    payer_diversity_score = 0
    -- flag for reduced weight in composite
ELSE:
    single_payer = false
    payer_diversity_score = (payer_overlap / cap) * 100
```

For neurosurgery, **Medicare-only** is the expected single-payer pattern (elective spine in elderly). A neurosurgeon who appears in Medicaid but NOT Medicare would be unusual and worth investigating (possible: pediatric neurosurgeon focused on Medicaid congenital cases).


## 6. Additional Metrics


### 6A. Code-Category Overlap

```
categories = {
    'office_visits':        [99213, 99214, 99215, 99204, 99205],
    'spine_decompression':  [63047, 63048, 63030],
    'spine_fusion':         [22551, 22612, 22633, 22842, 22853],
    'cranial_surgery':      [61510, 61154, 62223, 62230],
    'image_guidance':       [61781, 61782],
    'peripheral_nerve':     [64721]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT WHERE in_both = true
category_overlap = categories_in_both / 6 * 100
```


### 6B. Volume-Weighted Overlap

```
both_payer_services = SUM(total_services) WHERE hcpcs_code IN both_payer_codes
total_services = SUM(total_services) across BOTH files
volume_weighted_overlap = both_payer_services / total_services
```


### 6C. Payer-Specific Codes

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

Informational. Questions it answers:
- Does the neurosurgeon bill trauma codes (61154, 61312) only to Medicaid? (Expected: trauma skews younger/Medicaid.)
- Does the neurosurgeon bill complex fusion codes only to Medicare? (Expected: degenerative spine skews older/Medicare.)


---

# PART C: BUSINESS LOGIC

---


## 7. Worked Examples

**Provider A:** Appears in both files. 22 total codes, 10 in both. Overlap = 45.5%. Score = 100.

**Provider B:** Appears in both files. 18 total codes, 5 in both. Overlap = 27.8%. Score = 69.4.

**Provider C:** Appears in Medicare only. 20 codes, 0 in Medicaid. Overlap = 0%. Score = 0, single_payer = true (medicare_only). Reduced weight in composite.

**Provider D:** Appears in both files. 15 total codes, 0 in both (completely different codes per payer). Overlap = 0%. Score = 0, single_payer = false. Red flag: different services by payer.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 8. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this neurosurgeon follow CNS/AANS guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal neurosurgeon? | Practice pattern |
| **Volume Adequacy** | Is the volume real? | Behavior check |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing + integrity |
| **Payer Diversity** | Is the practice consistent across payers? | Access proxy |

| Scenario | Other Scores | Payer Diversity |
|---|---|---|
| Excellent neurosurgeon, Medicare-only elective spine | High across all | 0 (single_payer, reduced weight) |
| Trauma center neurosurgeon, sees both populations | High across all | High (trauma + elective across payers) |
| Neurosurgeon who fuses Medicare patients but only decompresses Medicaid | May be high overall | Low (different procedure categories by payer) |
| Academic neurosurgeon, safety-net hospital | High across all | High (diverse population) |


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Medicare-only is structural for elective spine.** A neurosurgeon who only does elective spine for elderly patients will have zero Medicaid codes. This is not a quality signal.

**Trauma volume drives Medicaid overlap.** Neurosurgeons at trauma centers will have higher payer diversity purely because trauma patients skew younger and toward Medicaid. Practice setting is a stronger driver than provider quality.

**The Medicaid file may be temporarily unavailable.** Score = null if only Medicare data.

**Overlap does not equal quality.** A neurosurgeon who performs the same poor-quality surgery for both payers has high overlap.

**State-level variation is large.** Medicaid expansion states have more working-age adults covered, increasing the Medicaid neurosurgery patient pool. Non-expansion states have smaller Medicaid neurosurgery volumes.

**Pediatric neurosurgeons are a special case.** Pediatric neurosurgeons may appear primarily in Medicaid (children are disproportionately Medicaid-covered). They should be flagged separately if taxonomy sub-codes exist (2080P0008X Pediatric Neurosurgery, though few use it).


---

## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| provider_cbsa | string | Core-Based Statistical Area code |
| geo_group_level | string | "state", "national", or "zip3" |
| peer_cohort_state | string | State of peer cohort (or "US") |
| peer_cohort_size | int | Peers in cohort |
| medicare_code_count | int | Distinct HCPCS billed to Medicare |
| medicaid_code_count | int | Distinct HCPCS billed to Medicaid |
| total_distinct_codes | int | Union of both |
| both_payer_code_count | int | Codes in both files |
| payer_overlap | float | both / total |
| single_payer | boolean | True if only one file |
| single_payer_type | string | "medicare_only", "medicaid_only", or "both_present" |
| payer_diversity_score | float | 0-100 |
| peer_mean_overlap | float | Mean overlap in peer cohort |
| peer_p90_overlap | float | p90 (the cap) |
| categories_in_both | int | Workflow categories in both files (0-6) |
| category_overlap | float | categories_in_both / 6 * 100 |
| categories_medicare_only | string | Category names only in Medicare |
| categories_medicaid_only | string | Category names only in Medicaid |
| volume_weighted_overlap | float | Share of total services from both-payer codes |
| medicare_only_codes | string | Codes only in Medicare |
| medicaid_only_codes | string | Codes only in Medicaid |
| both_payer_codes | string | Codes in both files |
