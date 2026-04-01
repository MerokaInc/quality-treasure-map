# Allergy & Immunology Payer Diversity: A Sub-Treasure Map

## What This Document Does

This score answers one question: **Is this allergist's practice consistent across Medicare and Medicaid populations?** Providers who treat both payer populations tend to deliver similar core services to both. When a provider bills dramatically different code sets for Medicare vs. Medicaid patients — or only appears in one payer's data — it warrants attention. The result is a 0–100 score where higher means more cross-payer consistency. This score is explicitly **not a penalty for single-payer practice** — structural payer dominance is handled with reduced weighting, not punitive scoring.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes and service counts per NPI for Medicare population | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes and service counts per NPI for Medicaid population | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes, practice location, entity type | Weekly updates |

**Key structural context for Allergy & Immunology:**
- Allergists serve a wide age range (pediatric through geriatric)
- Medicare patients: older adults with asthma, COPD overlap, drug allergies, immunodeficiency
- Medicaid patients: children and younger adults with asthma, allergic rhinitis, food allergies, eczema
- Expected overlap is **moderate** — allergists commonly see both populations, but the clinical focus differs by age
- Neither Medicare-only nor Medicaid-only is inherently suspicious for this specialty

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207K00000X | Allergy & Immunology |
| **Grouping** | State-level (default), national fallback < 30 providers | |
| **Minimum volume** | >= 50 services in **each** payer file the provider appears in | Single-payer providers need >= 50 in their payer |
| **Entity type** | Type 1 NPI (individual) | |
| **Dual-payer filter** | For overlap calculation, provider must appear in both Medicare AND Medicaid files | Single-payer providers scored separately (see Business Rules) |

## Payer Overlap Metric

### Step 1: Identify Code Sets by Payer

For each provider, extract:
- `medicare_codes` = set of HCPCS codes billed in Medicare data
- `medicaid_codes` = set of HCPCS codes billed in Medicaid data

### Step 2: Calculate Overlap

```
both_payer_codes = medicare_codes ∩ medicaid_codes
all_codes = medicare_codes ∪ medicaid_codes

payer_overlap = |both_payer_codes| / |all_codes|
```

This is the Jaccard similarity coefficient — the proportion of the provider's total code repertoire that appears in both payer files.

### Step 3: Category-Level Overlap (Enrichment)

Using the six workflow categories from the Peer Comparison dimension:

```
For each category:
    medicare_has_category = any(code in medicare_codes for code in category.codes)
    medicaid_has_category = any(code in medicaid_codes for code in category.codes)

category_overlap = categories_in_both / categories_in_either
```

This captures whether the provider delivers the same *types* of care across payers, even if specific codes differ.

### Step 4: Composite Overlap

```
composite_overlap = (payer_overlap * 0.60) + (category_overlap * 0.40)
```

Code-level overlap is weighted more heavily because it's more granular. Category overlap provides a safety net — a provider who bills slightly different codes within the same category shouldn't be penalized.

## Scoring Formula

```
peer_p90 = 90th percentile of composite_overlap among dual-payer peers in cohort

payer_diversity_score = min(composite_overlap / peer_p90, 1.0) * 100
```

The p90 cap means that a provider matching the 90th percentile of their dual-payer peers scores 100. Providers above p90 also score 100 — we don't reward extreme overlap.

### Expected Overlap Baseline for Allergy & Immunology

| Metric | Expected Range (Dual-Payer Providers) | Rationale |
|--------|---------------------------------------|-----------|
| Code-level overlap | 0.35 – 0.65 | Age-dependent differences: pediatric allergy codes in Medicaid, geriatric/immunodeficiency codes in Medicare |
| Category-level overlap | 0.65 – 0.90 | Most allergists perform testing, immunotherapy, and E/M across both populations |
| Composite overlap | 0.45 – 0.75 | |
| Peer p90 (typical) | ~0.70 | Calibrated from national data; varies by state |

### Worked Examples

**Provider A — Dual-payer, high overlap (Score: 95)**
- Medicare codes: 22 unique HCPCS
- Medicaid codes: 18 unique HCPCS
- Shared: 16 codes
- All codes: 24 unique
- payer_overlap = 16/24 = 0.667
- Category overlap: 6/6 = 1.0
- Composite: (0.667 × 0.60) + (1.0 × 0.40) = 0.400 + 0.400 = 0.800
- peer_p90 = 0.70
- **Score: min(0.800 / 0.70, 1.0) × 100 = 100**

**Provider B — Dual-payer, moderate overlap (Score: 71)**
- Medicare codes: 19 unique — heavy on immunodeficiency workup (Ig quant, infusions)
- Medicaid codes: 15 unique — heavy on allergy testing and immunotherapy
- Shared: 10 codes (mostly E/M and basic skin testing)
- All codes: 24 unique
- payer_overlap = 10/24 = 0.417
- Category overlap: 5/6 = 0.833 (infusion only in Medicare)
- Composite: (0.417 × 0.60) + (0.833 × 0.40) = 0.250 + 0.333 = 0.583
- peer_p90 = 0.70
- **Score: min(0.583 / 0.70, 1.0) × 100 = 83.3 → 83**

*Moderate overlap is expected here — Medicare patients have different clinical needs than Medicaid patients. Score of 83 reflects this is within normal range.*

**Provider C — Dual-payer, low overlap (Score: 38)**
- Medicare codes: 16 unique — mostly E/M and immunoglobulin infusions
- Medicaid codes: 14 unique — mostly allergy skin testing and immunotherapy
- Shared: 5 codes (only E/M codes)
- All codes: 25 unique
- payer_overlap = 5/25 = 0.200
- Category overlap: 3/6 = 0.500
- Composite: (0.200 × 0.60) + (0.500 × 0.40) = 0.120 + 0.200 = 0.320
- peer_p90 = 0.70
- **Score: min(0.320 / 0.70, 1.0) × 100 = 45.7 → 46**

This provider effectively runs two separate practices — allergy for Medicaid, immunology for Medicare. The low overlap warrants investigation.

---

# PART C: BUSINESS RULES

---

## Composite Formula

| Component | Weight | Justification |
|-----------|--------|---------------|
| Code-level overlap | 60% | Granular measure of practice consistency |
| Category-level overlap | 40% | Captures functional overlap even when specific codes differ |

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider appears in only one payer file | **Single-payer provider.** See single-payer handling below. |
| Provider appears in both files but one has < 50 services | Score using only the adequate-volume file as the denominator. Flag as "limited_secondary_payer." |
| Peer cohort < 30 dual-payer providers | Use national p90 for scoring. Flag as "national_fallback." |
| Provider's total unique codes < 5 | Do not score. Return `null` with reason = "insufficient_code_diversity." |

## Single-Payer Handling

Single-payer providers **cannot be scored on payer diversity** — there's nothing to compare. This is structural, not a quality signal.

| Single-Payer Type | Expected For A&I? | Handling |
|------------------|-------------------|---------|
| **Medicaid-only** | Somewhat common — pediatric allergists may see few Medicare patients | Score = **50** (neutral). Flag as "single_payer_medicaid." Reduce weight of Payer Diversity in any downstream composite to 50% of normal. |
| **Medicare-only** | Somewhat common — providers focused on geriatric/immunodeficiency populations | Score = **50** (neutral). Flag as "single_payer_medicare." Reduce weight to 50% of normal. |

**Rationale:** Neither payer dominance pattern is inherently abnormal for allergists. An allergist near a children's hospital may be entirely Medicaid. An allergist at a VA-adjacent practice may be entirely Medicare. Penalizing these providers would bias against legitimate practice patterns.

## Subspecialist Handling

| Subspecialty | Handling |
|-------------|---------|
| Clinical & Laboratory Immunology (207KI0005X) | Expected to have **low overlap** — immunology services skew Medicare (older patients with immunodeficiency). Apply a 25% floor boost: `adjusted_score = max(raw_score, raw_score * 1.25)`, capped at 100. |
| Pediatric Allergy (2080A0000X) | Expected to be **Medicaid-dominant**. Single-payer Medicaid handling applies. If dual-payer, category overlap is a better signal than code overlap (pediatric codes differ). Increase category overlap weight to 50%/50%. |

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (Caught by This Score) |
|-----------|----------------|--------------------------------------|
| **Guideline Concordance** | Whether clinical guidelines are followed | Guideline concordance pools Medicare and Medicaid data together — it can't detect a provider who follows guidelines for one population but not the other. |
| **Peer Comparison** | Whether the overall code mix is normal | Peer comparison aggregates across payers. A provider with a normal aggregate profile could have wildly different Medicare vs. Medicaid patterns. |
| **Volume Adequacy** | Whether individual service volumes are believable | Volume adequacy also aggregates across payers. Adequate total volume could mask zero volume in one payer. |
| **This score (Payer Diversity)** | Whether practice is consistent across Medicare and Medicaid | — |
| **Billing Quality** | Charge ratios and financial patterns | Billing quality doesn't split by payer. A provider with normal overall charges could have very different pricing patterns by payer. |

### Scenario: Provider with high guideline concordance but low payer diversity

A provider follows ACAAI guidelines well in aggregate (Guideline Concordance = 79), but the aggregation masks a split: Medicaid patients get thorough allergy workups (skin testing, immunotherapy, spirometry) while Medicare patients only get E/M visits and immunoglobulin infusions. The provider's combined profile looks guideline-concordant, but the Medicare patients aren't getting allergy-specific care. Payer Diversity score = 38 reveals this pattern.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Medicaid data completeness varies by state | Some states report fewer Medicaid codes than others | State-level cohorting normalizes; flag states with known Medicaid data gaps |
| Commercial payer data not available | We only see Medicare + Medicaid; most allergists also have commercial patients | Acknowledged limitation — true payer diversity includes commercial, but we measure what we have |
| Dual-eligible patients | Some patients appear in both Medicare and Medicaid; services may be split or duplicated | No reliable way to detect at aggregated level; minor impact on overlap calculation |
| CMS suppression of low-volume lines | Lines with <= 10 beneficiaries may be suppressed | Suppression slightly reduces measured overlap; impact is small |

## Known Biases

| Bias | Direction | Handling |
|------|-----------|---------|
| **Pediatric-focused allergists** | Appear Medicaid-dominant; low Medicare overlap is normal | Single-payer handling + pediatric subspecialist rules |
| **Geriatric-focused allergists** | Appear Medicare-dominant | Single-payer handling |
| **Geographic payer mix** | States with expanded Medicaid may have higher dual-payer rates | State-level cohorting normalizes |
| **Practice age** | New practices may not yet have diverse payer mix | No adjustment; acknowledged as transient limitation |

## Update Cadence

- **p90 thresholds:** Recalculated annually from new CMS data.
- **Category definitions:** Inherited from Peer Comparison dimension; updated in sync.
- **Single-payer classification:** Re-evaluated annually as payer mix shifts.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| `npi` | string(10) | National Provider Identifier |
| `provider_name` | string | Provider last name, first name |
| `state` | string(2) | Practice state |
| `data_year` | integer | CMS data year |
| `peer_cohort_level` | string | "state" or "national" |
| `peer_cohort_size` | integer | Number of dual-payer providers in cohort |
| `medicare_codes` | integer | Unique HCPCS codes in Medicare file |
| `medicaid_codes` | integer | Unique HCPCS codes in Medicaid file |
| `shared_codes` | integer | Codes appearing in both files |
| `all_codes` | integer | Union of codes across both files |
| `code_overlap` | float | Jaccard similarity (0–1) |
| `category_overlap` | float | Category-level overlap (0–1) |
| `composite_overlap` | float | Weighted composite overlap (0–1) |
| `peer_p90` | float | 90th percentile of composite overlap in peer cohort |
| `payer_diversity_score` | float | 0–100 |
| `single_payer_flag` | boolean | True if provider appears in only one payer file |
| `single_payer_type` | string | Null, "medicare_only", or "medicaid_only" |
| `limited_secondary_payer_flag` | boolean | True if secondary payer has < 50 services |
| `subspecialist_flag` | boolean | True if subspecialty taxonomy detected |
| `subspecialist_type` | string | Null or subspecialty name |
| `insufficient_data_flag` | boolean | True if < 5 unique codes total |
| `national_fallback_flag` | boolean | True if national p90 used |
| `confidence_tier` | string | Always "Tier 2" |
| `score_version` | string | Scoring algorithm version |
