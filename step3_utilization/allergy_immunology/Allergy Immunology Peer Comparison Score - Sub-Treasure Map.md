# Allergy & Immunology Peer Comparison: A Sub-Treasure Map

## What This Document Does

This score answers one question: **Does this allergist/immunologist's billing profile look like a normal practitioner in their specialty?** We build a reference set of the most commonly billed HCPCS codes among allergists nationally, then measure how closely each provider's code mix matches their state-level peer cohort. The result is a 0–100 score where higher means more typical practice patterns. A low score doesn't necessarily mean bad — it means unusual, which warrants investigation.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes, service counts, beneficiary counts, average charges per NPI | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes, service counts, beneficiary counts per NPI | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes (207K00000X), practice location, entity type | Weekly updates |

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207K00000X (Allergy & Immunology) | Primary NPPES classification |
| **Grouping** | State-level (default) | Regional allergen profiles and payer mix affect code distribution |
| **National fallback** | When state cohort < 30 providers | Statistical stability |
| **Minimum volume** | >= 100 total Medicaid services OR >= 100 total Medicare services | Higher threshold than guideline concordance — peer comparison needs robust code profiles |
| **Entity type** | Type 1 NPI (individual) only | Compare individual practitioners |

## Reference Code Set

The reference set is the **top 25–30 most prevalent HCPCS codes** billed by allergists nationally, covering approximately 65–70% of total billing volume. Rebuilt annually from CMS data.

### Allergy & Immunology Reference Code Set (Illustrative)

| Code | Description | Expected Prevalence | Category |
|------|-------------|-------------------|----------|
| 99213 | Office visit, established, low-moderate complexity | Very High | Office Visits |
| 99214 | Office visit, established, moderate-high complexity | Very High | Office Visits |
| 99215 | Office visit, established, high complexity | High | Office Visits |
| 99203 | Office visit, new, low-moderate complexity | High | Office Visits |
| 99204 | Office visit, new, moderate-high complexity | High | Office Visits |
| 99205 | Office visit, new, high complexity | Moderate | Office Visits |
| 95004 | Percutaneous allergy skin tests | Very High | Allergy Testing |
| 95024 | Intracutaneous allergy skin tests | High | Allergy Testing |
| 95027 | Intracutaneous skin tests, immediate reaction | Moderate | Allergy Testing |
| 95044 | Patch testing | Moderate | Allergy Testing |
| 86003 | Allergen-specific IgE, quantitative | High | Lab / In-Vitro Testing |
| 86005 | Allergen-specific IgE, qualitative | Moderate | Lab / In-Vitro Testing |
| 82785 | Gammaglobulin IgE | Moderate | Lab / In-Vitro Testing |
| 95115 | Allergen immunotherapy, single injection | Very High | Immunotherapy |
| 95117 | Allergen immunotherapy, two or more injections | High | Immunotherapy |
| 95165 | Antigen/allergen preparation & provision | High | Immunotherapy |
| 95120 | Professional services for immunotherapy, 1st hour | Moderate | Immunotherapy |
| 94010 | Spirometry | High | Pulmonary Function |
| 94060 | Bronchospasm evaluation (pre/post bronchodilator) | High | Pulmonary Function |
| 94729 | Diffusing capacity (DLCO) | Low-Moderate | Pulmonary Function |
| 95012 | Exhaled nitric oxide (FeNO) | Moderate | Pulmonary Function |
| 95076 | Ingestion challenge, initial 120 min | Low-Moderate | Challenge Testing |
| 95079 | Ingestion challenge, each additional 60 min | Low-Moderate | Challenge Testing |
| 96365 | IV infusion, therapeutic, initial hour | Low-Moderate | Infusion Services |
| 96366 | IV infusion, each additional hour | Low-Moderate | Infusion Services |
| J1459 | IVIG Privigen | Low | Infusion Services |
| 82784 | Immunoglobulin IgA, IgG, IgM quantitative | Moderate | Lab / In-Vitro Testing |
| 36415 | Venipuncture | High | Ancillary |
| 99211 | Office visit, established, minimal | Moderate | Office Visits |

**Reference set size: 29 codes** (actual set rebuilt annually from data)

## Workflow Categories

The reference codes are grouped into **six workflow categories** that represent the natural clinical activities of an allergy & immunology practice:

| Category | Codes Included | What It Represents |
|----------|---------------|-------------------|
| **Office Visits** | 99203–99205, 99211–99215 | Evaluation and management — the backbone of any practice |
| **Allergy Testing** | 95004, 95024, 95027, 95044 | Percutaneous, intradermal, and patch testing |
| **Immunotherapy** | 95115, 95117, 95165, 95120 | Allergen immunotherapy injections and preparation |
| **Pulmonary Function** | 94010, 94060, 94729, 95012 | Spirometry, bronchodilator response, FeNO, DLCO |
| **Lab / In-Vitro Testing** | 86003, 86005, 82784, 82785 | Allergen-specific IgE, immunoglobulin quantification |
| **Infusion & Ancillary** | 96365, 96366, J1459, 36415, 95076, 95079 | IV infusions, challenge testing, venipuncture |

## Three Metrics

### Metric 1: Code Coverage (Weight: 40%)

**Question:** How many of the reference codes does this provider bill at all?

```
code_coverage = (codes_billed_by_provider ∩ reference_set) / |reference_set| * 100
```

- A provider billing 20 of 29 reference codes → code_coverage = 69
- Expected range for a full-scope allergist: 60–85%
- Providers below 40% are likely subspecialized or have unusual practice scope

### Metric 2: Category Coverage (Weight: 30%)

**Question:** Does this provider bill across the full range of allergy/immunology activities?

```
category_coverage = categories_with_at_least_one_code / total_categories * 100
```

- 6 categories total. A provider covering 5 of 6 → category_coverage = 83
- Expected: most full-scope allergists cover 4–6 categories
- Infusion & Ancillary is the most commonly absent category (immunology-dependent)

### Metric 3: Volume Concordance (Weight: 30%)

**Question:** For the codes this provider does bill, do they bill them in proportions similar to their peers?

```
For each code c in (provider's codes ∩ reference_set):
    provider_rate[c] = provider_services[c] / provider_total_services
    peer_median_rate[c] = median(peer_rates[c])
    deviation[c] = |provider_rate[c] - peer_median_rate[c]|

mean_deviation = mean(deviation[c] for all matched codes)
volume_concordance = max(0, (1 - mean_deviation * 5)) * 100
```

The multiplier of 5 is calibrated so that a mean deviation of 0.20 (20 percentage points average) yields a score of 0. Typical mean deviations for in-range allergists are 0.03–0.08.

## Composite Peer Comparison Score

```
peer_comparison_score = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

### Worked Examples

**Provider A — Full-scope allergist (Score: 81)**
- Bills 22 of 29 reference codes → code_coverage = 76
- Covers 6 of 6 categories → category_coverage = 100
- Mean deviation from peer medians = 0.05 → volume_concordance = 75
- **Composite: (76×0.40) + (100×0.30) + (75×0.30) = 30.4 + 30.0 + 22.5 = 82.9 → 83**

**Provider B — Immunotherapy-heavy practice (Score: 62)**
- Bills 18 of 29 reference codes → code_coverage = 62
- Covers 5 of 6 categories (no infusion) → category_coverage = 83
- Mean deviation = 0.12 (immunotherapy codes over-represented) → volume_concordance = 40
- **Composite: (62×0.40) + (83×0.30) + (40×0.30) = 24.8 + 24.9 + 12.0 = 61.7 → 62**

**Provider C — Primarily immunology practice (Score: 45)**
- Bills 14 of 29 reference codes → code_coverage = 48
- Covers 4 of 6 categories (no allergy testing, limited immunotherapy) → category_coverage = 67
- Mean deviation = 0.18 (heavy on infusion, light on testing) → volume_concordance = 10
- **Composite: (48×0.40) + (67×0.30) + (10×0.30) = 19.2 + 20.1 + 3.0 = 42.3 → 42**

This provider would also have a subspecialist flag — low peer comparison score + subspecialist taxonomy is informational, not a quality concern.

---

# PART C: BUSINESS RULES

---

## Composite Formula

| Metric | Weight | Justification |
|--------|--------|---------------|
| Code Coverage | 40% | Breadth of practice is the strongest signal of a "normal" allergist |
| Category Coverage | 30% | Ensures the provider touches the major clinical activity areas |
| Volume Concordance | 30% | Proportionality matters — billing the right codes in wildly different ratios is still unusual |

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider has < 100 total services | Do not score. Return `null` with reason = "insufficient_volume." |
| State cohort < 30 providers | Use national reference set and national peer medians. Flag as "national_fallback." |
| A reference code has < 3 providers billing it in the cohort | Exclude from volume concordance calculation (but still count in code/category coverage). |
| Provider bills codes NOT in the reference set | Ignored for this score. Novel codes don't help or hurt peer comparison. |

## Subspecialist Handling

| Subspecialty | Detection | Handling |
|-------------|-----------|---------|
| Clinical & Laboratory Immunology (207KI0005X) | Secondary taxonomy in NPPES | Flag in output. Low peer comparison score is expected. If >= 30 subspecialists in cohort, compute a separate subspecialist reference set and score against that. |
| Pediatric Allergy (2080A0000X) | Secondary taxonomy | Flag. Pediatric allergists may have different code distributions (more preventive, less immunology). Score against pediatric allergy cohort if available. |

## Reference Set Rebuild Rules

- Rebuild nationally each year from new CMS data
- Include codes billed by >= 20% of all 207K00000X providers nationally
- Cap at 30 codes to keep the reference set interpretable
- Document any codes that enter or leave the set year-over-year

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (Caught by This Score) |
|-----------|----------------|--------------------------------------|
| **Guideline Concordance** | Whether specific clinical guidelines are followed | Doesn't assess whether the *overall code mix* is normal — a provider could follow selected guidelines perfectly but have a bizarre overall practice profile. |
| **This score (Peer Comparison)** | Whether the provider's code mix looks like a normal allergist | — |
| **Volume Adequacy** | Whether individual service volumes are believable | Doesn't compare the full code profile. A provider could have adequate volume in every code they bill but be missing half the expected codes. |
| **Payer Diversity** | Cross-payer consistency | Payer diversity doesn't care what codes are billed — only whether they're consistent across payers. |
| **Billing Quality** | Charge ratios and financial patterns | A provider can have normal charges for an unusual code mix. Peer comparison catches the unusual code mix; billing quality catches the unusual charges. |

### Scenario: Provider with high peer comparison but low guideline concordance

A provider bills all the expected codes in expected proportions (Peer Comparison = 85) but has very low spirometry-to-visit ratios and high intradermal-to-skin test ratios (Guideline Concordance = 48). The provider *looks* normal but isn't following specific clinical practice parameters. The two scores together reveal a provider who has the right tools but uses them inconsistently with guidelines.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Reference set is nationally derived; applied at state level | Some codes may be regionally uncommon | Volume concordance uses state-level peer medians to normalize |
| CMS data only captures Medicare/Medicaid | Commercial-only allergists are invisible | Minimum volume threshold ensures enough data; acknowledge the gap |
| New codes may lag adoption | FeNO (95012) was slow to appear in CMS data | Annual reference set rebuild captures emerging codes |
| Practice scope variation is legitimate | Some allergists focus on specific conditions (e.g., only food allergy) | Subspecialist flagging + downstream interpretation |

## Known Biases

| Bias | Direction | Handling |
|------|-----------|---------|
| **Practice size** | Solo practitioners may have narrower code coverage than group practices | Percentile ranking partially normalizes; document in interpretation guidance |
| **Academic vs. private** | Academic allergists may bill more unusual/complex codes | No reliable detection method; acknowledged as limitation |
| **Urban vs. rural** | Rural allergists may have broader scope (fewer referral options) | State-level cohorting captures some geographic variation |
| **Allergen prevalence** | Providers in high-allergy regions may have higher testing volumes | Volume concordance uses peer medians, normalizing for regional patterns |

## Update Cadence

- **Reference code set:** Rebuilt annually from latest CMS data release.
- **Peer medians:** Recalculated annually at state and national levels.
- **Category definitions:** Reviewed annually; changes documented.

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
| `peer_cohort_size` | integer | Number of providers in cohort |
| `reference_set_size` | integer | Number of codes in reference set |
| `codes_billed` | integer | Number of reference codes billed by provider |
| `code_coverage_score` | float | 0–100 |
| `categories_covered` | integer | Number of workflow categories with at least one code |
| `category_coverage_score` | float | 0–100 |
| `mean_deviation` | float | Mean absolute deviation from peer median rates |
| `volume_concordance_score` | float | 0–100 |
| `peer_comparison_score` | float | 0–100, weighted composite |
| `subspecialist_flag` | boolean | True if subspecialty taxonomy detected |
| `subspecialist_type` | string | Null or subspecialty name |
| `insufficient_volume_flag` | boolean | True if below minimum volume |
| `national_fallback_flag` | boolean | True if national cohort used |
| `confidence_tier` | string | Always "Tier 2" |
| `score_version` | string | Scoring algorithm version |
