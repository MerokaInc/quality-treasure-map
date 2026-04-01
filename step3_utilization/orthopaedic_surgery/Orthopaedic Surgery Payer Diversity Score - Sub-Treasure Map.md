# Orthopaedic Surgery Payer Diversity Score: A Sub-Treasure Map

## What This Document Does

This score measures whether an orthopaedic surgeon's billing pattern is consistent across Medicare and Medicaid, as a proxy for broad-based practice and access. It answers: *Does this provider serve both payer populations, and if so, do they deliver similar services to each?*

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | Role in This Score |
|---------|-------------------|
| **CMS Medicare Physician & Other Practitioners** | Distinct HCPCS codes billed under Medicare. Primary payer for ortho (older adults: joint replacement, hip fracture, OA). |
| **CMS Medicaid Provider Spending** | Distinct HCPCS codes billed under Medicaid. Covers younger patients: trauma, fractures, some sports injuries. |
| **NPPES NPI Registry** | Peer cohort definition. |

### Key Context: Orthopaedic Surgery Payer Mix

Unlike pediatrics (Medicaid-dominant, Medicare near-zero) or geriatrics (Medicare-dominant), orthopaedic surgery has a **meaningfully dual-payer population:**

- **Medicare:** Older adults with osteoarthritis, hip fractures, degenerative conditions. High-cost joint replacements. This is the dominant payer by volume and revenue for most orthopaedic surgeons.
- **Medicaid:** Younger adults and children with traumatic injuries (fractures, dislocations), some elective procedures, and Medicaid-eligible older adults (dual-eligible).

**Expected overlap baseline:** Moderate to high (~15–25% code overlap for a typical general orthopaedic surgeon). This is substantially higher than pediatrics (~5–8%) because orthopaedic conditions span all age groups.

> **ASSUMPTION:** The expected overlap range (15–25%) is estimated from the specialty's inherent dual-payer patient population. **External resource needed:** Actual overlap distribution should be computed from CMS data by matching HCPCS code lists for each NPI across Medicare and Medicaid files filtered to taxonomy 207X00000X.

---

# PART B: THE LOGIC

---

## 1. Both-Payer Code Overlap

For each provider:

```
medicare_codes = set of distinct HCPCS codes billed in Medicare file
medicaid_codes = set of distinct HCPCS codes billed in Medicaid file
both_payer_codes = medicare_codes ∩ medicaid_codes
all_codes = medicare_codes ∪ medicaid_codes

payer_overlap = len(both_payer_codes) / len(all_codes)
```

### Interpretation Scale (Orthopaedic Surgery)

| Overlap % | Interpretation |
|-----------|----------------|
| 0% | Single-payer only (Medicare-only or Medicaid-only) |
| 1–10% | Low overlap — limited cross-payer practice |
| 10–20% | Moderate overlap — serves both populations with some shared services |
| 20–35% | High overlap — broad cross-payer practice |
| 35%+ | Very high overlap — unusual; may indicate dual-eligible heavy population |

---

## 2. Peer Cohort Overlap Distribution

Compute `payer_overlap` for every provider in the peer cohort (taxonomy 207X00000X, same state, ≥ 50 Medicare services, Type 1 NPI).

Extract: p10, p25, median, p75, p90 of the distribution.

**Scoring cap = peer p90.**

> **ASSUMPTION:** p90 is estimated at ~30% overlap for orthopaedic surgery nationally. Actual value should be computed from data. The cap defines the ceiling — any overlap at or above p90 receives a score of 100.

---

## 3. Payer Diversity Score

```
if payer_overlap >= peer_p90:
    payer_diversity_score = 100
else:
    payer_diversity_score = (payer_overlap / peer_p90) * 100
```

Score range: 0–100.

### Worked Examples

Assuming peer_p90 = 30%:

**Provider A — Dual-payer generalist (overlap = 25%):**
- Score = (0.25 / 0.30) × 100 = **83.3**

**Provider B — Medicare-dominant joint replacement surgeon (overlap = 8%):**
- Score = (0.08 / 0.30) × 100 = **26.7**
- This provider is Medicare-focused (TKA, THA in older adults). Low Medicaid overlap is structural, not a quality issue. See single-payer handling below.

**Provider C — Medicare-only (overlap = 0%):**
- Score = 0, but **single_payer_flag = true**. Reduced weight in composite.

**Provider D — Community orthopaedist in high-Medicaid state (overlap = 32%):**
- Score = min(0.32 / 0.30, 1.0) × 100 = **100.0**

---

## 4. Single-Payer Handling

### Medicare-Only Providers

Many orthopaedic surgeons — particularly those focusing on joint replacement in older adults — may appear only in the Medicare file. This is **structurally normal** for ortho, unlike pediatrics where Medicaid-only is the structural norm.

**Rule:** If a provider appears in Medicare only:
- `payer_overlap = 0`
- `payer_diversity_score = 0`
- `single_payer_flag = true`
- `single_payer_type = "Medicare-only"`
- **Reduced weight in the overall 5-dimension composite.** The payer diversity dimension weight drops from its standard share to half-weight, with the difference redistributed proportionally to other dimensions.

### Medicaid-Only Providers

Less common in ortho but possible (e.g., orthopaedic surgeons in community health centers, Medicaid-dominant trauma centers).

**Rule:** Same treatment as Medicare-only:
- `single_payer_flag = true`
- `single_payer_type = "Medicaid-only"`
- Reduced weight in composite.

> **ASSUMPTION:** Unlike pediatrics where Medicaid-only is the dominant pattern, in orthopaedic surgery both Medicare-only and Medicaid-only are minority patterns. We treat both equivalently with reduced composite weight rather than designating one as "normal."

---

## 5. Code-Category Overlap

Beyond raw code overlap, we examine which **workflow categories** (from Dimension 2) appear in both payer files:

| Category | Example: Medicare | Example: Medicaid | Both? |
|----------|------------------|-------------------|-------|
| Office Visits | 99213, 99214, 99215 | 99213, 99214 | Yes |
| Joint Replacement | 27447, 27130 | 27130 | Yes (THA) |
| Arthroscopy | 29881, 29827 | 29881, 29888 | Yes (meniscectomy) |
| Fracture Care | 27235 | 25607, 23515 | No (different bones) |
| Injections | 20610 | 20610 | Yes |
| Hand & UE | 64721 | 64721 | Yes |

```
category_overlap = categories_in_both_payers / total_categories_billed
```

This gives a **structural** view of whether the provider's practice type is consistent across payers, even if the specific codes differ (e.g., hip fracture fixation in Medicare vs. distal radius ORIF in Medicaid — both are "Fracture Care").

---

## 6. Volume-Weighted Overlap

Raw code overlap treats all codes equally. Volume-weighted overlap asks: *What share of the provider's total services come from both-payer codes?*

```
volume_weighted_overlap = (
    services_from_both_payer_codes / total_services_across_both_payers
)
```

This distinguishes:
- A provider with 90% of volume from E/M visits (which appear in both payers) but all procedures in one payer only → high volume-weighted overlap, low raw overlap.
- A provider with many unique codes in each payer but low-volume ancillary codes → low raw overlap, but those ancillary codes may not be clinically meaningful.

---

## 7. Payer-Specific Code Analysis

For transparency, the output includes:

- **Medicare-only codes:** HCPCS codes appearing only in Medicare (often: higher-complexity E/M, joint replacement, shoulder arthroplasty)
- **Medicaid-only codes:** HCPCS codes appearing only in Medicaid (often: fracture care, trauma codes, lower-complexity E/M)
- **Both-payer codes:** Codes appearing in both files

This list is informational — it helps explain *why* overlap is what it is — but does not directly affect the score.

---

# PART C: BUSINESS RULES

---

## Composite Formula Context

Payer diversity contributes to the overall 5-dimension quality composite. Its weight should reflect the specialty's payer dynamics:

- Orthopaedic surgery has meaningful dual-payer overlap → payer diversity carries **standard weight** (unlike pediatrics where it's down-weighted because Medicaid-only is the norm).
- Single-payer providers → payer diversity weight reduced to half, redistributed to other dimensions.

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider appears in neither file | Cannot score. Excluded. |
| Provider in only one file | single_payer_flag = true, score = 0, reduced composite weight. |
| CMS suppression (< 11 beneficiaries for a code) | Code excluded from overlap calculation. If all codes in a payer file are suppressed, treat as single-payer. |
| State cohort < 30 providers | Use national cohort for p90 cap. |

## Subspecialist Handling

- Subspecialists are excluded from the general orthopaedic peer cohort (consistent with all dimensions).
- Subspecialists may have structurally different payer overlap (e.g., pediatric orthopaedics is Medicaid-heavy; sports medicine may have more commercial/out-of-network).

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What Payer Diversity Adds |
|-----------|----------------|--------------------------|
| **Guideline Concordance** | Whether procedures align with AAOS guidelines | Whether guideline-concordant care is delivered across payer populations, not just one |
| **Peer Comparison** | Whether the billing pattern is normal | Peer comparison is payer-agnostic; payer diversity reveals if normal billing is split across or concentrated in one payer |
| **Volume Adequacy** | Whether volume is believable | Volume adequacy doesn't distinguish payer; a provider may have adequate volume in one payer but zero in the other |
| **Payer Diversity** (this score) | Whether practice is consistent across payers | — |
| **Billing Quality** | Whether charges and ratios are normal | Charge-to-allowed analysis is Medicare-only; payer diversity shows whether Medicaid practice looks different |

### Complementary Scenarios

1. **Provider has excellent guideline concordance and peer comparison but scores 0 on payer diversity** → Medicare-only surgeon. Not a quality problem, but relevant context for employers considering Medicaid contracting.
2. **Provider has high payer diversity but low volume adequacy** → Serves both populations but with trace volume in many categories. Breadth without depth.
3. **Provider has low payer diversity but high billing quality** → Clean billing in one payer. Payer diversity adds context: are they avoiding a payer population, or just structurally in a single-payer market?

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact |
|-----------|--------|
| **Only two payers visible** | Medicare and Medicaid only. Commercial payers (the largest segment for some orthopaedists, especially those under 65) are invisible. A provider with zero Medicare/Medicaid volume but thriving commercial practice has no data. |
| **No dual-eligible identification** | Cannot tell if a patient is Medicare-primary, Medicaid-secondary. The same procedure may appear in both files for dual-eligible patients, inflating apparent overlap. |
| **Code-level, not service-level matching** | We match on whether the same HCPCS code appears in both payer files, not whether the same *service* was billed to both. Overlap is a code-presence metric, not a claims-matching metric. |

## Known Biases

| Bias | Direction |
|------|-----------|
| **Age-driven payer segmentation** | Orthopaedic conditions strongly correlate with age. Joint replacement = Medicare. Trauma = Medicaid. Low overlap may reflect epidemiology, not provider choice. |
| **State Medicaid policy** | States with Medicaid expansion have more adult Medicaid ortho patients → higher expected overlap. Non-expansion states → lower overlap. State-level peer grouping mitigates but doesn't eliminate. |
| **Practice setting** | Hospital-employed surgeons may have less payer selection than private practice. Academic centers often accept all payers. |

> **ASSUMPTION:** We do not adjust for Medicaid expansion status at the state level. State-level peer grouping inherently compares providers within the same Medicaid policy environment. However, if comparing across states, expansion status is a significant confounder. **External resource needed:** State-level Medicaid expansion status list for normalization if cross-state comparisons are needed.

## Confidence Tier

**Tier 2** — Utilization-based proxy. Measures payer consistency, not clinical quality.

## Update Cadence

Rebuild peer overlap distributions and p90 cap annually from latest CMS data release.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| npi | string | 10-digit NPI |
| provider_last_name | string | From NPPES |
| provider_first_name | string | From NPPES |
| provider_state | string | 2-letter state code |
| medicare_code_count | integer | Distinct HCPCS codes in Medicare file |
| medicaid_code_count | integer | Distinct HCPCS codes in Medicaid file |
| both_payer_code_count | integer | Codes appearing in both files |
| all_code_count | integer | Union of codes across both files |
| payer_overlap | float | both_payer_code_count / all_code_count |
| payer_diversity_score | float | 0–100 |
| peer_p90_overlap | float | p90 of peer cohort overlap distribution |
| peer_median_overlap | float | Median of peer cohort overlap distribution |
| single_payer_flag | boolean | True if provider appears in only one payer file |
| single_payer_type | string | "Medicare-only", "Medicaid-only", or null |
| category_overlap | float | Workflow categories in both payers / total categories billed |
| categories_in_both_payers | integer | Count of workflow categories with codes in both files |
| total_categories_billed | integer | Count of workflow categories with any codes |
| volume_weighted_overlap | float | Services from both-payer codes / total services |
| medicare_only_codes | list[string] | HCPCS codes only in Medicare file |
| medicaid_only_codes | list[string] | HCPCS codes only in Medicaid file |
| both_payer_codes | list[string] | HCPCS codes in both files |
| peer_cohort_level | string | "state" or "national" |
| peer_cohort_size | integer | Number of providers in cohort |
| confidence_tier | string | Always "Tier 2" |
