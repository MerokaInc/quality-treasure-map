# Orthopaedic Surgery Peer Comparison Score: A Sub-Treasure Map

## What This Document Does

This score answers: *Does this orthopaedic surgeon's billing pattern look like a normal orthopaedic surgeon's?* It compares each provider's HCPCS code usage against a reference set of the most prevalent codes billed by orthopaedic surgeons nationally, measuring code coverage, workflow category coverage, and volume distribution concordance.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Key Limitation |
|---------|-----------------|----------------|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI, per-HCPCS: service count, beneficiary count, charges, allowed amounts. Primary data source for ortho (Medicare-dominant patient population). | Aggregated, no diagnosis codes. |
| **CMS Medicaid Provider Spending** | Per-NPI, per-HCPCS: service count. Covers younger trauma and some fracture care patients. | No diagnosis codes, no charge detail. |
| **NPPES NPI Registry** | Taxonomy code (207X00000X), state, entity type. | Self-reported. |

---

# PART B: THE LOGIC

---

## 1. Defining Peers

| Parameter | Value |
|-----------|-------|
| Taxonomy code | **207X00000X** (Orthopaedic Surgery, general) |
| Geographic grouping | Same state as provider being scored |
| Minimum volume threshold | ≥ 50 total Medicare services |
| Entity type | Type 1 NPI (individual) |
| National fallback | If state cohort < 30 providers |
| Subspecialist exclusion | Exclude NPIs with subspecialty taxonomy codes (207XS0114X Sports Medicine, 207XS0106X Hand Surgery, 207XP0101X Pediatric Ortho, 207XX0004X Foot/Ankle, 207XX0801X Spine, 207XT0002X Trauma, 207XR0100X Adult Reconstructive) |

---

## 2. The Reference Code Set (Top 25)

The 25 most prevalent HCPCS codes billed by general orthopaedic surgeons nationally, accounting for approximately 65-70% of total billing volume.

> **ASSUMPTION:** The code prevalence ranking below is estimated from publicly available CMS Medicare utilization data and general orthopaedic practice patterns. **External resource needed:** The exact ranking should be validated by pulling the actual top-25 from the most recent CMS Medicare Physician & Other Practitioners file filtered to taxonomy 207X00000X. The codes and percentages below represent best estimates pending that validation.

| Rank | HCPCS | Description | Est. % of Volume | Workflow Category |
|------|-------|-------------|-----------------|-------------------|
| 1 | 99213 | Office visit, established, low-moderate complexity | ~8% | Office Visits |
| 2 | 99214 | Office visit, established, moderate complexity | ~7% | Office Visits |
| 3 | 20610 | Joint injection/aspiration, major joint | ~5% | Injections & Non-Operative |
| 4 | 99212 | Office visit, established, straightforward | ~3% | Office Visits |
| 5 | 99203 | Office visit, new patient, low complexity | ~3% | Office Visits |
| 6 | 99204 | Office visit, new patient, moderate complexity | ~3% | Office Visits |
| 7 | 27447 | Total knee arthroplasty | ~3% | Joint Replacement |
| 8 | 27130 | Total hip arthroplasty | ~2% | Joint Replacement |
| 9 | G2211 | Visit complexity add-on | ~2% | Office Visits |
| 10 | 29881 | Arthroscopy, knee, meniscectomy | ~2% | Arthroscopy |
| 11 | 20611 | Joint injection/aspiration, intermediate joint | ~2% | Injections & Non-Operative |
| 12 | 29827 | Arthroscopy, shoulder, rotator cuff repair | ~2% | Arthroscopy |
| 13 | 29826 | Arthroscopy, shoulder, acromioplasty | ~2% | Arthroscopy |
| 14 | 99215 | Office visit, established, high complexity | ~2% | Office Visits |
| 15 | 29888 | ACL reconstruction | ~1.5% | Arthroscopy |
| 16 | 29882 | Arthroscopy, knee, meniscus repair | ~1.5% | Arthroscopy |
| 17 | 27446 | Unicompartmental knee arthroplasty | ~1% | Joint Replacement |
| 18 | 64721 | Carpal tunnel release | ~1% | Hand & Upper Extremity |
| 19 | 23472 | Total shoulder arthroplasty | ~1% | Joint Replacement |
| 20 | 25607 | ORIF distal radius, 1 plate | ~1% | Fracture Care |
| 21 | 23515 | ORIF clavicle | ~1% | Fracture Care |
| 22 | 27235 | Percutaneous fixation, femoral neck | ~1% | Fracture Care |
| 23 | 27125 | Hemiarthroplasty, hip | ~1% | Joint Replacement |
| 24 | 29823 | Arthroscopy, shoulder, debridement | ~1% | Arthroscopy |
| 25 | 23473 | Reverse total shoulder arthroplasty | ~1% | Joint Replacement |

**Total estimated coverage: ~66% of billing volume.**

---

## 3. Workflow Categories

These 25 codes map to **6 workflow categories** that represent the major domains of general orthopaedic practice:

| Category | Codes in Reference Set | What It Represents |
|----------|----------------------|-------------------|
| **Office Visits** | 99212, 99213, 99214, 99215, 99203, 99204, G2211 | E/M encounters — consultations, follow-ups, pre-op, post-op |
| **Joint Replacement** | 27447, 27130, 27446, 23472, 23473, 27125 | Arthroplasty and hemiarthroplasty — the highest-cost category |
| **Arthroscopy** | 29881, 29882, 29827, 29826, 29888, 29823 | Minimally invasive joint surgery — knee, shoulder |
| **Fracture Care** | 25607, 23515, 27235 | Operative fracture management |
| **Injections & Non-Operative** | 20610, 20611 | Joint injections, aspirations |
| **Hand & Upper Extremity** | 64721 | Carpal tunnel and related procedures |

---

## 4. Three Metrics

### Metric 1: Code Coverage (Weight: 40%)

```
code_coverage = (codes_matched / 25) * 100
```

Where `codes_matched` = number of the 25 reference codes that appear in the provider's billing.

| Score Range | Codes Matched | Interpretation |
|------------|---------------|----------------|
| 90–100 | 23–25 | Full-spectrum general orthopaedic practice |
| 70–89 | 18–22 | Broad practice with some gaps |
| 50–69 | 13–17 | Missing significant practice areas |
| Below 50 | < 13 | Atypical for general orthopaedics — likely subspecialized or low-volume |

### Metric 2: Category Coverage (Weight: 30%)

```
category_coverage = (categories_covered / 6) * 100
```

Where `categories_covered` = number of the 6 workflow categories with at least one code billed.

| Score | Categories Covered | Interpretation |
|-------|-------------------|----------------|
| 100 | 6/6 | Covers all major practice domains |
| 83 | 5/6 | Missing one domain (common: hand/upper extremity or fracture care) |
| 67 | 4/6 | Gaps in multiple areas |
| ≤ 50 | ≤ 3/6 | Highly focused or low-volume practice |

**Why this matters separately from code coverage:** A provider could bill 15 codes all within Office Visits and Joint Replacement (code_coverage = 60%) but have zero arthroscopy or fracture care. Category coverage catches the "deep but narrow" pattern.

### Metric 3: Volume Concordance (Weight: 30%)

```
For each of the 25 reference codes the provider bills:
  provider_rate = provider_services_for_code / provider_total_services
  peer_median_rate = median(rate for all providers in cohort who bill this code)
  deviation = abs(provider_rate - peer_median_rate)

volume_concordance = max(0, 100 - (mean(deviations) * 100 * scaling_factor))
```

Where `scaling_factor` adjusts so that the median provider in the cohort scores approximately 70.

> **ASSUMPTION:** The scaling factor needs to be empirically calibrated from actual CMS data. Start with scaling_factor = 5.0 (same as pediatrics) and adjust based on the observed deviation distribution for orthopaedic surgeons.

| Score Range | Interpretation |
|------------|----------------|
| 80–100 | Billing proportions closely match peer norms |
| 60–79 | Some unusual proportions but broadly normal |
| 40–59 | Notably different from peers — may indicate subspecialization or practice anomaly |
| Below 40 | Very atypical billing distribution |

---

## 5. Composite Peer Comparison Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

### Worked Examples

**Provider A — Full-spectrum community orthopaedist:**
- Bills 23 of 25 reference codes → code_coverage = 92
- Covers 6/6 categories → category_coverage = 100
- Volume proportions close to peer median → volume_concordance = 78
- **Composite:** (92 × 0.4) + (100 × 0.3) + (78 × 0.3) = 36.8 + 30.0 + 23.4 = **90.2**

**Provider B — Joint replacement-focused surgeon:**
- Bills 14 of 25 reference codes (heavy on arthroplasty, light on arthroscopy/fracture) → code_coverage = 56
- Covers 4/6 categories (no fracture care, no hand) → category_coverage = 67
- Arthroplasty codes over-represented vs. peers → volume_concordance = 52
- **Composite:** (56 × 0.4) + (67 × 0.3) + (52 × 0.3) = 22.4 + 20.1 + 15.6 = **58.1**

**Provider C — New graduate, ramp-up year:**
- Bills 10 of 25 codes → code_coverage = 40
- Covers 3/6 categories → category_coverage = 50
- Low volume across the board → volume_concordance = 45
- **Composite:** (40 × 0.4) + (50 × 0.3) + (45 × 0.3) = 16.0 + 15.0 + 13.5 = **44.5**

---

# PART C: BUSINESS RULES

---

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider bills < 50 Medicare services | Excluded from scoring — insufficient data |
| Code suppressed by CMS (< 11 beneficiaries) | Code treated as not billed for code_coverage; excluded from volume_concordance calculation |
| State cohort < 30 providers | Use national cohort; flag in output |

## Subspecialist Handling

- Providers with subspecialty taxonomy codes are excluded from the general orthopaedic peer cohort.
- A subspecialist scored against general peers would likely have a low peer_composite (narrow code coverage). Exclusion prevents this unfair comparison.
- Future: build subspecialty reference sets (e.g., sports medicine top-20 codes).

## Medicare vs. Medicaid Data Merging

- Reference code set built from Medicare data (dominant payer for ortho).
- For scoring, merge Medicare + Medicaid code lists per provider to get full picture.
- Volume concordance uses Medicare rates only (Medicaid file lacks charge detail for normalization).

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What Peer Comparison Adds |
|-----------|----------------|--------------------------|
| **Guideline Concordance** | Whether procedures align with AAOS guidelines | Whether the overall practice *pattern* is normal, beyond guideline-specific procedures |
| **Peer Comparison** (this score) | Whether the provider looks like a normal orthopaedic surgeon | — |
| **Volume Adequacy** | Whether specific claimed activities are done at believable volume | Peer comparison checks breadth; volume adequacy checks depth per category |
| **Payer Diversity** | Whether practice is consistent across payers | Peer comparison is payer-agnostic; it measures the code profile, not the payer profile |
| **Billing Quality** | Whether charges and ratios are normal | Peer comparison measures *what* is billed; billing quality measures *how* it's billed |

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

- **Reference set is Medicare-biased:** Ortho codes prevalent in younger populations (sports injuries, trauma) may be underrepresented in a Medicare-derived reference set. Consider supplementing with Medicaid-prevalent codes in future iterations.
- **Code prevalence shifts over time:** New codes (e.g., G2211), retired codes, and coding guideline changes can shift the reference set. Rebuild annually.
- **Cannot distinguish primary surgeon vs. assistant surgeon** from aggregated data. Modifier information is not available.

## Known Biases

- **Rural vs. urban:** Rural orthopaedists may be more generalist (higher code coverage) while urban ones subspecialize (lower code coverage). Neither is inherently better.
- **Academic vs. community:** Teaching hospitals may bill differently due to resident involvement.
- **Volume scaling:** High-volume surgeons naturally bill more code diversity. The minimum volume threshold (50 services) partially controls this.

## Confidence Tier

**Tier 2** — Utilization pattern comparison, not direct quality measure.

## Update Cadence

Rebuild reference code set and peer percentile anchors annually from latest CMS data release.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| npi | string | 10-digit NPI |
| provider_last_name | string | From NPPES |
| provider_first_name | string | From NPPES |
| provider_state | string | 2-letter state code |
| taxonomy_code | string | 207X00000X |
| peer_cohort_level | string | "state" or "national" |
| peer_cohort_size | integer | Number of providers in cohort |
| total_medicare_services | integer | Provider's total Medicare service count |
| total_medicaid_services | integer | Provider's total Medicaid service count |
| codes_matched | integer | Count of reference codes billed (0–25) |
| codes_missing | list[string] | HCPCS codes from reference set not billed |
| code_coverage_score | float | 0–100 |
| categories_covered | integer | Count of workflow categories covered (0–6) |
| categories_missing | list[string] | Workflow categories with zero codes billed |
| category_coverage_score | float | 0–100 |
| volume_concordance_score | float | 0–100 |
| mean_rate_deviation | float | Average absolute deviation from peer median rates |
| peer_composite_score | float | 0–100 weighted composite |
| per_code_detail | list[object] | For each of 25 codes: code, provider_count, provider_rate, peer_median_rate, deviation |
| subspecialty_flag | boolean | True if subspecialty taxonomy detected |
| data_suppression_count | integer | Number of codes excluded due to CMS suppression |
