# Hematology/Oncology Payer Diversity Score: A Sub-Treasure Map


## What This Document Does

We have two claims files: Medicare and Medicaid. A provider's codes can appear in one file, the other, or both. We measure how many of the provider's codes appear in both payers rather than only one. That is a rough proxy for whether a service pattern is broad-based across the practice instead of payer-specific.

A provider who bills 96413 (chemo infusion) to Medicare but not Medicaid, and 99215 (office visit) to both, has partial payer overlap. A provider whose entire code set appears in both files has high overlap. High overlap suggests a consistent practice pattern regardless of who is paying. Low overlap could mean the provider practices differently depending on the payer, or that their panel is almost entirely one payer.

**The hem/onc context:** Hematology/oncology is a **Medicare-dominant specialty**. Cancer incidence peaks in the 65+ population. Most hem/onc providers have substantial Medicare volume and moderate-to-low Medicaid volume. Some providers — particularly those focused on sickle cell disease, younger lymphoma/leukemia patients, or practices in high-Medicaid states — will have meaningful Medicaid volume. But Medicare-only is structurally normal for this specialty. The scoring must account for this.

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

both_payer_codes = medicare_codes INTERSECT medicaid_codes
all_codes = medicare_codes UNION medicaid_codes

payer_overlap = COUNT(both_payer_codes) / COUNT(all_codes)
```

**Interpretation:**

| Payer Overlap | What It Means |
|---|---|
| 1.0 | Every code billed appears in both files. Identical practice pattern across payers. |
| 0.6-0.9 | Most codes overlap. Some payer-specific codes are expected (certain drugs covered by one payer, not the other). |
| 0.3-0.6 | Moderate overlap. Provider may have different roles in different payer populations, or one payer has much lower volume. |
| 0.1-0.3 | Low overlap. Practice patterns differ substantially by payer. Could reflect structural payer dominance (Medicare-heavy). |
| 0.0 | No overlap. Provider appears in only one file, or bills completely different codes to each payer. |


## 2. Peer Cohort and Benchmarking

### Peer Cohort (Same as Other Dimensions)

| Filter | Rule |
|---|---|
| Taxonomy | 207RH0003X (Hematology & Oncology) |
| State | Same state as provider being scored |
| Volume | >= 50 total Medicare services |
| Entity type | Individual (Type 1 NPI) |
| **Additional for this dimension** | Must appear in BOTH Medicare AND Medicaid files with at least one code each |

**Why the additional filter:** To compute the p90 cap (the benchmark for what "high overlap" looks like), we need providers who actually bill both payers. Including Medicare-only providers in the benchmark cohort would skew the percentiles downward.

**Expected overlap baseline for hem/onc:** The typical hem/onc provider will have moderate payer overlap — lower than a geriatrician (where nearly all patients are Medicare and Medicaid dual-eligible) but higher than a pediatrician (where almost no patients are on Medicare). We expect the peer median overlap to be in the range of 0.35-0.55, depending on state Medicaid expansion status and demographic mix.


### Computing the p90 Cap

```
peer_cohort = all hem/onc NPIs in the same state
    WHERE taxonomy_code = '207RH0003X'
    AND total_medicare_services >= 50
    AND appears in both Medicare and Medicaid files

For each NPI in peer_cohort:
    compute payer_overlap (formula from Section 1)

peer_p90 = 90th percentile of payer_overlap across peer_cohort
```

The p90 defines a "high overlap" ceiling. Providers at or above peer p90 get a perfect score. This avoids penalizing providers for not having 100% overlap, which is unrealistic given structural payer differences.


## 3. Scoring

```
IF provider appears in BOTH Medicare AND Medicaid files:

    payer_overlap = COUNT(both_payer_codes) / COUNT(all_codes)
    
    raw_score = MIN(payer_overlap / peer_p90, 1.0) * 100

    payer_diversity_score = raw_score

ELIF provider appears in Medicare ONLY:

    payer_diversity_score = SINGLE_PAYER_DEFAULT    -- see Single-Payer Handling below

ELIF provider appears in Medicaid ONLY:

    payer_diversity_score = SINGLE_PAYER_DEFAULT    -- see Single-Payer Handling below
```

**Score interpretation:**

| Score | Meaning |
|---|---|
| 90-100 | Payer overlap at or above peer p90. Broad-based practice across Medicare and Medicaid. |
| 70-89 | Good overlap. Most codes appear in both files. |
| 50-69 | Moderate overlap. Some payer-specific practice variation. |
| 30-49 | Low overlap. Significant differences in billing by payer. |
| Below 30 | Very low overlap or single-payer practice. |


## 4. Worked Examples

**Provider H (community oncologist, Florida, serves both Medicare and Medicaid):**

```
Medicare codes: {99215, 99214, 99213, 96413, 96415, 96417, 96372, 96374,
                 96375, 96360, 96361, 96365, G2211, 36415, 85025, 80053,
                 38222, 36430, 99205, 96409}   -- 20 codes

Medicaid codes: {99215, 99214, 96413, 96415, 96417, 96372, 96365,
                 G2211, 36415, 85025, 80053, 96409}   -- 12 codes

both_payer_codes: {99215, 99214, 96413, 96415, 96417, 96372, 96365,
                   G2211, 36415, 85025, 80053, 96409}  -- 12 codes

all_codes: 20 unique codes total (union)

payer_overlap = 12 / 20 = 0.60

peer_p90 in Florida = 0.65 (illustrative)

raw_score = MIN(0.60 / 0.65, 1.0) * 100 = MIN(0.923, 1.0) * 100 = 92.3

Provider H Payer Diversity Score: 92.3
```

**Provider I (academic hematologist, Massachusetts, primarily Medicare):**

```
Medicare codes: {99215, 99214, 99213, 99205, G2211, 38222, 38220,
                 36415, 85025, 80053, 96365, 96366, 96372, 36430,
                 96127}   -- 15 codes

Medicaid codes: {99215, 99214, 38222, 36415, 85025}   -- 5 codes

both_payer_codes: {99215, 99214, 38222, 36415, 85025}  -- 5 codes

all_codes: 15 unique codes total

payer_overlap = 5 / 15 = 0.33

peer_p90 in Massachusetts = 0.60 (illustrative)

raw_score = MIN(0.33 / 0.60, 1.0) * 100 = MIN(0.55, 1.0) * 100 = 55.0

Provider I Payer Diversity Score: 55.0
```

**Provider J (Medicare-only oncologist, Arizona):**

```
Medicare codes: {99215, 99214, 96413, 96415, 96372, ...}   -- 18 codes
Medicaid codes: {} (not present in Medicaid file)

Provider appears in Medicare only.
payer_diversity_score = SINGLE_PAYER_DEFAULT (see below)
```


---

# PART C: BUSINESS RULES

---


## Single-Payer Handling

**Medicare-only is structurally normal for hem/onc.** Many oncologists in areas with low Medicaid penetration or in Medicare-heavy demographics (retirement communities, etc.) may have zero Medicaid claims. This is not a quality signal. It is a demographic artifact.

| Scenario | Rule |
|---|---|
| **Medicare-only provider** | Score = 50 (neutral). Flag as `single_payer_medicare`. Reduce weight in composite to 50% of normal. |
| **Medicaid-only provider** | Score = 50 (neutral). Flag as `single_payer_medicaid`. Reduce weight in composite to 50% of normal. This is unusual for hem/onc — investigate whether provider is actually hem/onc or is serving a specific population (e.g., sickle cell center). |
| **Neither file** | Score = NULL. Flag as `no_claims_data`. Provider is in NPPES but has no billing in either CMS file. |

**Why 50 (neutral) instead of 0 or penalty:** A single-payer practice is not a bad practice. It means we cannot measure payer diversity because there is only one payer to observe. The neutral score ensures this dimension does not artificially drag down the composite. The reduced weight further insulates the overall score.


## Category Overlap Mapping (Optional Detail Layer)

For providers who appear in both files, we can map the overlap to the workflow categories from Dimension 2 (Peer Comparison):

```
categories = {
    'office_visits':     [99211, 99213, 99214, 99215, 99205, G2211],
    'chemo_admin':       [96409, 96411, 96413, 96415, 96417, 96402],
    'drug_infusion':     [96360, 96361, 96365, 96366, 96367, 96372, 96374, 96375],
    'laboratory':        [36415, 85025, 80053],
    'procedures':        [38222, 36430],
    'new_patient_eval':  [99205]
}

For each category:
    medicare_present = ANY code in category appears in medicare_codes
    medicaid_present = ANY code in category appears in medicaid_codes
    
    IF medicare_present AND medicaid_present:
        category_overlap = "both_payers"
    ELIF medicare_present:
        category_overlap = "medicare_only"
    ELIF medicaid_present:
        category_overlap = "medicaid_only"
    ELSE:
        category_overlap = "neither"
```

This detail layer answers: "which parts of this provider's workflow are payer-specific?" A provider who does chemo for Medicare but not Medicaid is a different story from one whose only Medicaid codes are office visits.


## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider in only one file | Score = 50 (neutral), weight reduced. See Single-Payer Handling. |
| Provider in both files but one has < 3 codes | Score normally but flag as `low_diversity_data`. The overlap metric is noisy with very few codes. |
| State peer cohort < 30 dual-payer providers | Use national p90. Mark as `national_fallback`. |
| Medicaid file unavailable | Score = NULL for all providers. Mark as `medicaid_data_unavailable`. |


## Subspecialist Handling

| Provider Type | Expected Overlap Pattern | Handling |
|---|---|---|
| **Hematology-focused (sickle cell, etc.)** | May have higher Medicaid overlap than peers (sickle cell patients are often Medicaid) | Score normally. This is a positive signal for hematology-focused providers. |
| **Medical oncology (solid tumors)** | Medicare-dominant. Overlap may be lower. | Score normally. Single-payer handling applies if Medicare-only. |
| **Academic providers** | May see more Medicaid due to safety-net hospital role | Score normally. Higher overlap expected and observed. |


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## What Each Dimension Catches

| Dimension | What It Catches | What It Misses (Caught by Others) |
|---|---|---|
| **1. Guideline Concordance** | Whether care aligns with ASH/NCCN | Whether practice patterns differ by payer (this doc) |
| **2. Peer Comparison** | Whether code set matches a normal hem/onc practice | Whether that practice extends across payers (this doc) |
| **3. Volume Adequacy** | Whether volumes are adequate per category | Whether those volumes span payer types (this doc) |
| **4. Payer Diversity** (this doc) | Whether the provider's code set is consistent across Medicare and Medicaid | Clinical quality of care, volume adequacy, or billing fairness (other dimensions) |
| **5. Billing Quality** | Charge outliers, code ratio anomalies | Whether the billing pattern is payer-specific (this doc) |


## Complementary Scenarios

**Scenario 1:** Provider scores 90 on Peer Comparison and Guideline Concordance but 30 on Payer Diversity. They look like a great oncologist when you combine all data — but their Medicare and Medicaid billing patterns are very different. They might be offering different levels of care by payer, or the Medicaid data is just thin.

**Scenario 2:** Provider scores 95 on Payer Diversity but 40 on Billing Quality. Their practice pattern is consistent across payers — but the charges are outliers. Consistency does not equal quality. Both signals matter.

**Scenario 3:** Provider scores 50 on Payer Diversity (single-payer Medicare) and 100 on everything else. This is a provider who looks great on all clinical dimensions but simply doesn't see Medicaid patients. The neutral score and reduced weight ensure this doesn't affect their composite unfairly.


---

# PART E: RISKS AND LIMITATIONS

---


## Data Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **Medicaid file has no diagnosis codes** | Cannot assess whether payer-specific codes are clinically justified (e.g., sickle cell codes in Medicaid only) | Score measures overlap pattern, not clinical rationale. Transparency in interpretation. |
| **Medicaid managed care billing** | Some Medicaid managed care organizations may bill differently, affecting code appearance | Score uses code presence, not volume. A code appearing even once counts. |
| **Dual-eligible patients** | Dual-eligible patients may appear in both files for the same service | This actually increases overlap and is directionally correct — dual-eligible patients bridge payer boundaries. |
| **Suppression of small cell sizes** | CMS suppresses data with < 11 beneficiaries per code | In Medicaid, where hem/onc volume is lower, more codes may be suppressed. This artificially reduces the Medicaid code set and lowers overlap scores. |


## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Medicare-dominant specialty** | Most hem/onc providers will have more Medicare codes than Medicaid codes, structurally lowering overlap | p90 cap is computed from the specialty-specific peer cohort, norming for this baseline. Single-payer handling prevents penalty. |
| **Geographic variation in Medicaid** | States with Medicaid expansion have more working-age adults on Medicaid → more potential hem/onc Medicaid patients | State-level peer cohorts control for this. |
| **340B and safety-net hospitals** | 340B providers may have higher Medicaid volume (low-income patient focus) | Score reflects this accurately — 340B providers likely have higher payer diversity, which is a genuine signal. |
| **Cell suppression asymmetry** | Codes suppressed in Medicaid (low volume) but visible in Medicare → lower overlap score | No direct mitigation. Acknowledged as a downward bias for Medicaid-light providers. |


## Update Cadence

p90 caps and peer cohorts rebuilt annually. Monitor Medicaid file availability — the file was temporarily unavailable in late March 2026. If Medicaid data is unavailable, this dimension cannot be scored and should return NULL.


---

# OUTPUT SCHEMA

---

One row per NPI. All scores on 0-100 scale.

| Field | Type | Description |
|---|---|---|
| npi | string | 10-digit National Provider Identifier |
| provider_name | string | Provider name from NPPES |
| provider_state | string | 2-letter state code |
| taxonomy_code | string | NPPES taxonomy |
| measurement_year | integer | Year of CMS data |
| peer_cohort_level | string | "state" or "national_fallback" |
| peer_cohort_size | integer | Number of dual-payer providers in comparison cohort |
| medicare_code_count | integer | Number of distinct HCPCS codes in Medicare file |
| medicaid_code_count | integer | Number of distinct HCPCS codes in Medicaid file |
| both_payer_code_count | integer | Number of codes appearing in both files |
| all_code_count | integer | Number of distinct codes across both files (union) |
| payer_overlap | float | both_payer_code_count / all_code_count (0.0 to 1.0) |
| peer_p90 | float | 90th percentile overlap in the peer cohort |
| payer_diversity_score | float | MIN(payer_overlap / peer_p90, 1.0) * 100, or 50 if single-payer |
| single_payer_flag | string | "single_payer_medicare", "single_payer_medicaid", or null |
| weight_reduction | boolean | True if single-payer (weight reduced to 50% in composite) |
| category_overlap_detail | object[] | Per-category: {category_name, medicare_present, medicaid_present, overlap_status} |
| low_diversity_data | boolean | True if one file has < 3 codes |
| low_volume_excluded | boolean | True if provider has < 11 unique beneficiaries |
| data_completeness | string | "full", "medicare_only", "medicaid_only" |
| score_confidence_tier | string | Always "tier_2_proxy" for this version |
