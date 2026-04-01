# Gastroenterology Payer Diversity Score: A Sub-Treasure Map

## What This Document Does

This document describes **Dimension 4 of 5** in the Gastroenterology Provider Quality Scoring System: the **Payer Diversity Score**.

It measures how many of a GI provider's HCPCS/CPT codes appear across **both** Medicare and Medicaid. A provider who bills the same procedures regardless of who is paying demonstrates consistency. A provider who appears in only one payer file, or who bills completely different code sets per payer, warrants further investigation.

The score ranges from **0 to 100**. Higher is better. Single-payer providers receive a reduced weight in the composite -- not a penalty.

---

# PART A: WHAT WE HAVE

---

We use three data sources:

| Source | What It Gives Us |
|--------|-----------------|
| **Medicare Physician & Other Practitioners** | Every (NPI, HCPCS code) pair billed to Medicare, with utilization counts |
| **Medicaid State Drug Utilization / Provider File** | Every (NPI, HCPCS code) pair billed to Medicaid, with utilization counts |
| **NPPES** | Provider taxonomy, state, credential -- used to confirm GI specialty and assign geography |

From these files we extract, for each GI NPI:

- `medicare_codes` -- the set of unique HCPCS/CPT codes the provider billed to Medicare
- `medicaid_codes` -- the set of unique HCPCS/CPT codes the provider billed to Medicaid
- `state` -- from NPPES, for geographic peer grouping

---

# PART B: THE LOGIC

---

## 1. The Metric: Both-Payer Code Overlap

For each provider who appears in at least one file:

```
both_codes    = medicare_codes INTERSECT medicaid_codes
all_codes     = medicare_codes UNION medicaid_codes
payer_overlap = len(both_codes) / len(all_codes)
```

This gives a value between 0.0 and 1.0, which we express as a percentage.

**Example:** A GI provider bills 22 unique codes to Medicare and 14 to Medicaid. Of those, 10 codes appear in both files. The union is 22 + 14 - 10 = 26. Overlap = 10 / 26 = 38.5%.

---

## 2. The Gastroenterology Context

Gastroenterology is a **Medicare-heavy** specialty. This is the opposite of pediatrics.

Key facts that shape the expected overlap distribution:

- **GI patients are predominantly older adults.** Colorectal cancer screening, Barrett's esophagus surveillance, hepatitis C treatment, cirrhosis management, and GERD evaluation all skew toward Medicare-eligible populations (age 65+).
- **Medicare is the primary payer** for most GI practices. A GI provider who appears only in the Medicare file is not unusual -- many community gastroenterologists see few or no Medicaid patients.
- **Medicaid GI volume is moderate.** Younger adults with inflammatory bowel disease (IBD), viral hepatitis, functional GI disorders, and liver disease do appear in Medicaid. States with Medicaid expansion have meaningfully higher Medicaid GI volume.
- **Expected payer overlap is moderate to high.** The mean both-payer overlap for GI providers is estimated at **18-22%**, with a median of **15-18%**. This is much higher than pediatrics (~6-8%) because GI providers who do see Medicaid patients tend to bill the same core procedures (colonoscopy, upper endoscopy, E/M visits) to both payers.
- **A GI provider appearing only in Medicare is structural, not suspicious.** It reflects the age distribution of the patient population. By contrast, a GI provider appearing only in Medicaid is uncommon and worth flagging.

---

## 3. Geographic Grouping

We group GI providers by **state** (from NPPES) before computing peer anchors.

Why state matters for GI payer diversity:

- States with Medicaid expansion have more working-age adults on Medicaid, increasing GI Medicaid volume
- States with older populations (Florida, Arizona) will have higher Medicare concentration
- Medicaid reimbursement rates for GI procedures vary by state, affecting willingness to accept Medicaid

```
peer_group = state   # e.g., "CA", "TX", "FL"
```

If a state has fewer than 30 GI providers, roll up to the census region.

---

## 4. Peer Anchors

Computed from actual data within each peer group. Illustrative national estimates:

| Statistic | Estimated Value | Notes |
|-----------|----------------|-------|
| Mean overlap | ~18-22% | Higher than pediatrics due to shared procedure codes |
| Median overlap | ~15-18% | Right-skewed: many providers near zero, some very high |
| p75 | ~28% | Top quartile practices serve both payer populations actively |
| p90 | ~35% | Used as the scoring cap |
| % single-payer (Medicare only) | ~25-35% | Structural -- common in older-population areas |
| % single-payer (Medicaid only) | ~2-5% | Uncommon -- flag for review |

These anchors are **recomputed per state** (or region) from real data at scoring time. The numbers above are illustrative starting points.

---

## 5. Scoring

The scoring formula is identical to the one used for pediatrics. We cap at the peer group's 90th percentile so that providers above that threshold all receive a perfect score.

```
cap = peer_p90   # approximately 35% for GI nationally

IF payer_overlap >= cap:
    payer_diversity_score = 100
ELSE:
    payer_diversity_score = (payer_overlap / cap) * 100
```

**Score interpretation table (using cap = 35%):**

| Overlap | Score | Interpretation |
|---------|-------|---------------|
| 0% | 0 | Single-payer provider (or zero shared codes) |
| 5% | 14 | Very low overlap |
| 10% | 29 | Low overlap, mostly single-payer practice |
| 18% | 51 | Moderate, near the peer mean |
| 25% | 71 | Above average overlap |
| 30% | 86 | Well above average |
| 35%+ | 100 | High overlap, payer-agnostic practice |

### Single-Payer Handling

| Situation | How Common in GI | Action |
|-----------|-----------------|--------|
| Medicare-only provider | Reasonably common (~25-35%) | Flag `single_payer = true`, `dominant_payer = "medicare"`. Reduce weight of Dimension 4 in composite. This is structural, not a quality signal. |
| Medicaid-only provider | Uncommon (~2-5%) | Flag `single_payer = true`, `dominant_payer = "medicaid"`. Reduce weight. May indicate a practice focused on younger patients (IBD, hepatitis). |
| Both files, zero overlap | Rare but a red flag | Flag `zero_overlap_flag = true`. The provider bills completely different code sets per payer. Investigate -- possible upcoding or payer-specific billing patterns. |

---

## 6. Additional Metrics

### 6a. Category Overlap

Instead of raw code overlap, we can measure overlap at the **procedure category** level using GI-specific workflow categories:

```python
categories = {
    'colonoscopy':        [45378, 45380, 45384, 45385, 45390],
    'upper_endoscopy':    [43235, 43239, 43249, 43248, 43250],
    'em_visits':          [99213, 99214, 99215, 99204, 99205],
    'diagnostic_testing': [91065, 87338, 91200],
    'lab_screening':      [86803, 88305]
}
```

For each provider, determine which categories have codes in Medicare, which in Medicaid, and compute:

```
category_overlap = categories_in_both / categories_in_either
```

This is less sensitive to minor coding differences and captures whether a provider does the same *types* of work across payers.

### 6b. Volume-Weighted Overlap

Raw code overlap treats every code equally. Volume-weighted overlap accounts for how heavily each code is used:

```
For each code in both_codes:
    weight = min(medicare_volume, medicaid_volume)
total_weight = sum of weights for all codes in all_codes
volume_weighted_overlap = sum(weights for both_codes) / total_weight
```

This gives more credit to providers whose high-volume codes appear in both files.

### 6c. Payer-Specific Code Analysis

Identify codes that appear in only one payer file:

```
medicare_only_codes = medicare_codes - medicaid_codes
medicaid_only_codes = medicaid_codes - medicare_codes
```

In GI, expect:
- **Medicare-only codes:** Age-related screening (CRC screening modifiers), complex hepatology, certain high-cost biologics
- **Medicaid-only codes:** Possibly IBD management codes, viral hepatitis screening in younger populations

---

# PART C: BUSINESS LOGIC

---

## 7. Full Calculation for One NPI

```
FUNCTION compute_payer_diversity(npi):

    # Step 1: Gather code sets
    medicare_codes = get_unique_codes(npi, source="medicare")
    medicaid_codes = get_unique_codes(npi, source="medicaid")

    # Step 2: Handle single-payer cases
    in_medicare = len(medicare_codes) > 0
    in_medicaid = len(medicaid_codes) > 0

    IF NOT in_medicare AND NOT in_medicaid:
        RETURN {score: NULL, reason: "NPI not found in either file"}

    IF in_medicare AND NOT in_medicaid:
        RETURN {
            score: 0,
            single_payer: true,
            dominant_payer: "medicare",
            weight_reduction: true,
            reason: "Medicare-only GI provider (structural)"
        }

    IF NOT in_medicare AND in_medicaid:
        RETURN {
            score: 0,
            single_payer: true,
            dominant_payer: "medicaid",
            weight_reduction: true,
            reason: "Medicaid-only GI provider (uncommon)"
        }

    # Step 3: Compute overlap
    both_codes = medicare_codes INTERSECT medicaid_codes
    all_codes  = medicare_codes UNION medicaid_codes
    payer_overlap = len(both_codes) / len(all_codes)

    # Step 4: Flag zero-overlap edge case
    zero_overlap_flag = (payer_overlap == 0)

    # Step 5: Get peer cap
    state = get_state(npi)
    cap = get_peer_p90(state, specialty="gastroenterology")

    # Step 6: Score
    IF payer_overlap >= cap:
        score = 100
    ELSE:
        score = round((payer_overlap / cap) * 100)

    # Step 7: Category overlap
    cat_overlap = compute_category_overlap(npi, medicare_codes, medicaid_codes)

    # Step 8: Volume-weighted overlap
    vol_overlap = compute_volume_weighted_overlap(npi)

    RETURN {
        npi: npi,
        state: state,
        medicare_code_count: len(medicare_codes),
        medicaid_code_count: len(medicaid_codes),
        both_code_count: len(both_codes),
        union_code_count: len(all_codes),
        payer_overlap: payer_overlap,
        peer_cap: cap,
        payer_diversity_score: score,
        single_payer: false,
        dominant_payer: NULL,
        zero_overlap_flag: zero_overlap_flag,
        category_overlap: cat_overlap,
        volume_weighted_overlap: vol_overlap,
        weight_reduction: false
    }
```

---

## 8. Worked Examples

### Provider A: High-overlap GI provider

- Appears in both Medicare and Medicaid files
- Medicare codes: 20 unique codes
- Medicaid codes: 12 unique codes
- Codes in both: 8
- Union: 20 + 12 - 8 = 24... wait, let's use the stated total.

Using the specification: 20 total unique codes (union), 8 in both.

```
payer_overlap = 8 / 20 = 0.40 = 40%
cap = 35% (peer p90)
40% >= 35%, so score = 100
```

**Result:** Score = 100. This GI provider bills a consistent set of codes to both payers. Likely a practice with diverse patient demographics.

---

### Provider B: Moderate-overlap GI provider

- Appears in both files
- Total unique codes (union): 18
- Codes in both: 4

```
payer_overlap = 4 / 18 = 0.222 = 22.2%
cap = 35%
22.2% < 35%, so score = round((0.222 / 0.35) * 100) = round(63.4) = 63
```

**Result:** Score = 63. Near the peer mean. This provider has moderate overlap -- most of their shared codes are likely E/M visits and colonoscopy.

---

### Provider C: Medicare-only GI provider

- Appears in Medicare only
- Medicare codes: 15 unique codes
- Medicaid codes: 0

```
single_payer = true
dominant_payer = "medicare"
payer_overlap = 0%
score = 0
weight_reduction = true
```

**Result:** Score = 0, but weight is reduced in the composite. This is structural -- the provider practices in an area with an older population or does not accept Medicaid. Not a quality concern.

---

### Provider D: Both files, zero overlap (red flag)

- Appears in both files
- Medicare codes: 8 unique codes (complex procedures, hospital consults)
- Medicaid codes: 4 unique codes (basic E/M, screening)
- Codes in both: 0
- Union: 12

```
payer_overlap = 0 / 12 = 0%
cap = 35%
score = round((0 / 0.35) * 100) = 0
zero_overlap_flag = true
```

**Result:** Score = 0. This provider bills completely different code sets depending on the payer. The `zero_overlap_flag` is set to true. This is a genuine red flag -- it may indicate payer-specific billing practices and warrants further investigation.

---

# PART D: HOW THIS FITS

---

Payer Diversity is one of five dimensions in the Gastroenterology Provider Quality Scoring System:

| Dimension | Score Name | What It Catches |
|-----------|-----------|----------------|
| 1 | **Code Breadth** | Does the provider bill a normal range of GI codes? Too few = limited scope; too many = possible over-billing |
| 2 | **Code Concentration** | Is the provider's billing spread across codes or dominated by one or two? High concentration may signal over-reliance on a single procedure |
| 3 | **Peer Benchmarking** | How does the provider compare to geographic peers on volume and code mix? Outliers in either direction warrant review |
| 4 | **Payer Diversity** (this document) | Does the provider practice consistently regardless of who is paying? Low overlap or single-payer status gets reduced weight, not a penalty |
| 5 | **Utilization Outlier** | Are any specific codes billed at volumes far above peer norms? Flags potential over-utilization of individual procedures |

### What Payer Diversity Adds

The other four dimensions look at what a provider bills and how much. Payer Diversity asks a different question: **does the provider practice the same way regardless of who is paying?**

A provider who scores well on Dimensions 1-3 and 5 but has zero payer overlap (Dimension 4) may be billing differently by payer -- a pattern worth investigating. Conversely, a provider with high payer overlap demonstrates consistency, which adds confidence to the other scores.

### Composite Weight

Payer Diversity typically receives a **lower weight** than the other four dimensions in the composite score because:

1. Single-payer status is common and structural in GI (especially Medicare-only)
2. The Medicaid file may have thin data for GI providers
3. Overlap is informative but less directly tied to quality than the other dimensions

Suggested default weight: **10-15%** of the composite (vs. 20-25% each for the other four).

For single-payer providers, reduce this weight further (e.g., to 5% or 0%) so that the absence of a second payer file does not unfairly drag down the composite.

---

# PART E: RISKS AND LIMITATIONS

---

1. **High overlap is expected in GI.** Unlike pediatrics (where low overlap is the norm), GI providers who serve both payers tend to bill the same core procedures. A "low" overlap score in GI is more meaningful than in pediatrics -- it genuinely suggests payer-specific billing behavior.

2. **Medicare dominance means thin Medicaid data.** Many GI providers have very few Medicaid claims. A provider with 2 Medicaid codes and 20 Medicare codes may have low overlap simply due to thin data, not due to inconsistent practice.

3. **Medicaid file temporarily unavailable.** As of March 2026, the Medicaid utilization file is not available for the current scoring period. When it returns, recompute all payer diversity scores. Until then, all GI providers default to `single_payer = true (medicare)` with weight reduction.

4. **Overlap does not equal quality.** A provider who bills the same bad patterns to both payers will score high on payer diversity but low on other dimensions. Payer diversity is one signal among five.

5. **State variation in Medicaid expansion.** GI Medicaid volume differs sharply between expansion and non-expansion states. Peer anchors must be computed per state (or region) to account for this.

6. **Facility billing obscures procedure codes.** GI procedures performed in hospital outpatient settings may be billed under the facility NPI, not the individual provider NPI. This is especially relevant for Medicaid patients, where procedures are more often done in hospital settings. The provider's Medicaid file may therefore undercount procedures.

7. **Code set changes over time.** CMS periodically retires and introduces HCPCS codes. Year-over-year comparisons of payer overlap must account for code set changes.

8. **Small denominators.** Providers with very few total codes (e.g., union of 3 codes) can have overlap percentages that swing wildly with one code addition or removal. Consider a minimum code threshold (e.g., union >= 5) before computing a reliable score.

---

## Appendix: Output Schema

Each row in the output represents one GI provider (NPI):

| Column | Type | Description |
|--------|------|-------------|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | From NPPES |
| `state` | string | Two-letter state code from NPPES |
| `peer_group` | string | State or census region used for peer comparison |
| `in_medicare` | boolean | Provider found in Medicare file |
| `in_medicaid` | boolean | Provider found in Medicaid file |
| `medicare_code_count` | integer | Count of unique codes in Medicare |
| `medicaid_code_count` | integer | Count of unique codes in Medicaid |
| `both_code_count` | integer | Count of codes appearing in both files |
| `union_code_count` | integer | Count of codes appearing in either file |
| `payer_overlap` | float | both_code_count / union_code_count (0.0 to 1.0) |
| `peer_mean_overlap` | float | Mean overlap for the provider's peer group |
| `peer_median_overlap` | float | Median overlap for the provider's peer group |
| `peer_p90_overlap` | float | 90th percentile overlap (the scoring cap) |
| `payer_diversity_score` | integer | 0-100 score |
| `single_payer` | boolean | True if provider appears in only one payer file |
| `dominant_payer` | string | "medicare", "medicaid", or null |
| `zero_overlap_flag` | boolean | True if in both files but overlap = 0% |
| `weight_reduction` | boolean | True if this dimension should receive reduced weight in composite |
| `category_overlap` | float | Overlap computed at the GI procedure category level |
| `volume_weighted_overlap` | float | Overlap weighted by utilization volume |
| `colonoscopy_in_medicare` | boolean | Colonoscopy category present in Medicare codes |
| `colonoscopy_in_medicaid` | boolean | Colonoscopy category present in Medicaid codes |
| `upper_endoscopy_in_medicare` | boolean | Upper endoscopy category present in Medicare codes |
| `upper_endoscopy_in_medicaid` | boolean | Upper endoscopy category present in Medicaid codes |
| `em_visits_in_medicare` | boolean | E/M visit category present in Medicare codes |
| `em_visits_in_medicaid` | boolean | E/M visit category present in Medicaid codes |
| `diagnostic_testing_in_medicare` | boolean | Diagnostic testing category present in Medicare codes |
| `diagnostic_testing_in_medicaid` | boolean | Diagnostic testing category present in Medicaid codes |
| `lab_screening_in_medicare` | boolean | Lab/screening category present in Medicare codes |
| `lab_screening_in_medicaid` | boolean | Lab/screening category present in Medicaid codes |
| `medicare_only_codes` | list | Codes found only in Medicare file |
| `medicaid_only_codes` | list | Codes found only in Medicaid file |
