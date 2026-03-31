# OB-GYN Peer Comparison Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Does this OB-GYN provider's billing profile look like a normal practitioner in obstetrics and gynecology?** It compares each provider's HCPCS code usage against a reference set built from the top billing codes of their OB-GYN peers, producing a 0-100 score reflecting how typical their practice pattern is.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Peer Comparison |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count, average charge, average payment. The primary input for building the reference code set and computing all three metrics. |
| **CMS Medicaid Provider Spending** | Per-NPI total services and beneficiaries for Medicaid. Used to set minimum volume thresholds and confirm active OB-GYN practice. |
| **NPPES NPI Registry** | Taxonomy code 207V00000X confirms OB-GYN specialty. Entity Type 1 filters to individual practitioners. State field enables state-level cohort grouping. |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207V00000X (Obstetrics & Gynecology) |
| **State grouping** | State-level (default) |
| **National fallback** | When state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare + Medicaid services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |
| **Subspecialist exclusion** | Providers with subspecialty taxonomy codes (207VM0101X, 207VG0400X, 207VE0102X, 207VF0040X) excluded from general peer cohort |

## Reference Code Set

The reference code set is built from the **top 25-30 most prevalent HCPCS codes** billed by OB-GYN providers nationally, targeting codes covering **~65% of total billing volume** for the specialty.

### OB-GYN Reference Code Set (Approximate)

| HCPCS | Description | Category | Expected Prevalence |
|---|---|---|---|
| 99213 | Office visit, established, low complexity | Office Visits | Very high |
| 99214 | Office visit, established, moderate complexity | Office Visits | Very high |
| 99215 | Office visit, established, high complexity | Office Visits | High |
| 99203 | Office visit, new, low complexity | Office Visits | Moderate |
| 99204 | Office visit, new, moderate complexity | Office Visits | Moderate |
| 99205 | Office visit, new, high complexity | Office Visits | Moderate |
| 59400 | Routine OB care (global, antepartum + delivery + postpartum) | Obstetric Global | High |
| 59410 | Vaginal delivery only (no antepartum/postpartum) | Obstetric Delivery | Moderate |
| 59510 | Cesarean delivery (global) | Obstetric Delivery | Moderate |
| 59610 | VBAC delivery (global) | Obstetric Delivery | Low-Moderate |
| 59025 | Fetal non-stress test | Antepartum Surveillance | High |
| 59426 | Antepartum care (7+ visits) | Antepartum Care | High |
| 76801 | OB ultrasound, first trimester (<14 wks) | Ultrasound | High |
| 76805 | OB ultrasound, complete (≥14 wks) | Ultrasound | High |
| 76811 | OB ultrasound, detailed fetal anatomy | Ultrasound | Moderate |
| 76815 | OB ultrasound, limited | Ultrasound | High |
| 76816 | OB ultrasound, follow-up | Ultrasound | Moderate |
| 76817 | Transvaginal ultrasound | Ultrasound | Moderate |
| 76818 | Fetal biophysical profile | Antepartum Surveillance | Moderate |
| 57452 | Colposcopy, cervix | Gynecologic Procedures | Moderate |
| 57454 | Colposcopy with biopsy | Gynecologic Procedures | Moderate |
| 58100 | Endometrial biopsy | Gynecologic Procedures | Moderate |
| 58300 | IUD insertion | Contraceptive Services | Moderate |
| 58301 | IUD removal | Contraceptive Services | Low-Moderate |
| 58558 | Hysteroscopy with biopsy/polypectomy | Gynecologic Procedures | Moderate |
| 58661 | Laparoscopy with excision/fulguration | Gynecologic Procedures | Low-Moderate |
| 11982 | Implantable contraceptive insertion (Nexplanon) | Contraceptive Services | Moderate |
| 11983 | Implantable contraceptive removal | Contraceptive Services | Low-Moderate |
| 88175 | Pap smear, liquid-based (ThinPrep) | Screening | High |
| 81025 | Urine pregnancy test | Point-of-Care Testing | High |

**Rebuild cadence:** Reference set rebuilt annually from the latest CMS Medicare Physician & Other Practitioners release.

## Workflow Categories

OB-GYN billing falls into **6 natural workflow categories**:

| # | Category | Codes Included | Clinical Rationale |
|---|---|---|---|
| 1 | **Office Visits** | 99203-99205, 99213-99215 | Core evaluation & management — every OB-GYN does this |
| 2 | **Obstetric Care** | 59400, 59410, 59510, 59610, 59425, 59426 | Global OB packages and delivery codes — the core of obstetric practice |
| 3 | **Antepartum Surveillance** | 59025, 76818 | Fetal monitoring — high-risk pregnancy management |
| 4 | **Ultrasound** | 76801, 76805, 76811, 76815, 76816, 76817 | OB and GYN imaging — essential diagnostic tool |
| 5 | **Gynecologic Procedures** | 57452, 57454, 58100, 58558, 58661 | Colposcopy, biopsy, hysteroscopy, laparoscopy — surgical GYN |
| 6 | **Contraceptive & Screening Services** | 58300, 58301, 11982, 11983, 88175, 81025 | IUD, implant, Pap smear, pregnancy test — preventive and family planning |

## Three Metrics

### Metric 1: Code Coverage (Weight: 40%)

**Question:** What fraction of the OB-GYN reference code set does this provider bill?

```
code_coverage = (codes_billed_by_provider ∩ reference_set) / |reference_set| * 100
```

A provider billing 20 of 30 reference codes scores 66.7.

**Why 40% weight:** Code breadth is the strongest single signal of a well-rounded OB-GYN practice. A provider billing only E/M codes and nothing else is not practicing the full scope.

### Metric 2: Category Coverage (Weight: 30%)

**Question:** Does this provider bill across all 6 OB-GYN workflow categories?

```
category_coverage = categories_with_any_billing / 6 * 100
```

A provider billing in 5 of 6 categories scores 83.3.

**Why 30% weight:** Category coverage catches specialists who bill many codes but all within one narrow area (e.g., only gynecologic procedures, no obstetrics).

### Metric 3: Volume Concordance (Weight: 30%)

**Question:** For codes this provider bills, is their relative volume distribution similar to their peers?

```
For each code in (provider's codes ∩ reference_set):
    provider_rate = provider_services_for_code / provider_total_services
    peer_median_rate = median(all_peer_rates_for_code)
    deviation = |provider_rate - peer_median_rate|

volume_concordance = max(0, 100 - mean(all_deviations) * 100)
```

**Why 30% weight:** A provider can bill the right codes but in wildly abnormal proportions (e.g., 80% ultrasound, 2% office visits). Volume concordance detects skewed distributions.

## Composite Peer Comparison Score

```
peer_comparison_score = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

### Worked Examples

**Example 1: Full-scope OB-GYN (Score ~85)**

Dr. A bills 26 of 30 reference codes across all 6 categories. Volume distribution is within 8% mean deviation of peers.

- Code coverage: 26/30 * 100 = 86.7
- Category coverage: 6/6 * 100 = 100
- Volume concordance: 100 - 8 = 92
- **Composite: (86.7 * 0.40) + (100 * 0.30) + (92 * 0.30) = 34.7 + 30.0 + 27.6 = 92.3**

**Example 2: GYN-heavy OB-GYN (Score ~62)**

Dr. B bills 18 of 30 reference codes across 4 categories (no Obstetric Care, no Antepartum Surveillance). Volume skewed toward gynecologic procedures.

- Code coverage: 18/30 * 100 = 60.0
- Category coverage: 4/6 * 100 = 66.7
- Volume concordance: 100 - 25 = 75
- **Composite: (60.0 * 0.40) + (66.7 * 0.30) + (75 * 0.30) = 24.0 + 20.0 + 22.5 = 66.5**

**Example 3: Narrow-scope provider (Score ~38)**

Dr. C bills 10 of 30 reference codes across 2 categories (Office Visits and Screening only). Volume heavily concentrated in E/M codes.

- Code coverage: 10/30 * 100 = 33.3
- Category coverage: 2/6 * 100 = 33.3
- Volume concordance: 100 - 40 = 60
- **Composite: (33.3 * 0.40) + (33.3 * 0.30) + (60 * 0.30) = 13.3 + 10.0 + 18.0 = 41.3**

---
# PART C: BUSINESS RULES
---

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has no Medicare billing data | Cannot compute peer comparison. Score = null. Flag as "Medicaid-only, peer comparison unavailable." |
| Provider bills <100 total services | Below minimum volume threshold. Excluded from peer cohort and scoring. |
| Reference code has <10 peers billing it | Code excluded from volume concordance calculation (insufficient peer data for stable median). |

## Subspecialist Handling

| Subspecialty | Handling |
|---|---|
| Maternal-Fetal Medicine (207VM0101X) | Use MFM-specific reference set (heavy on antepartum surveillance, high-risk OB codes). Exclude routine GYN procedures from expected codes. |
| Gynecologic Oncology (207VG0400X) | Use GYN-onc reference set (heavy on surgical codes, chemotherapy administration). Exclude obstetric codes. |
| Reproductive Endocrinology (207VE0102X) | Exclude from general OB-GYN peer comparison entirely. Practice pattern is too specialized. |
| Female Pelvic Medicine (207VF0040X) | Use urogynecology reference set (heavy on pelvic floor procedures). Exclude obstetric codes. |

**Rule:** Subspecialists are compared against their own subspecialty peer cohort when cohort size ≥ 30. Otherwise, they receive a peer comparison score of null with a flag.

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. ACOG Guideline Concordance** | Whether clinical care meets ACOG evidence-based standards |
| **2. Peer Comparison (this score)** | Whether billing breadth and volume distribution resemble a typical OB-GYN — detects providers who claim the specialty but don't practice the full scope |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible (catches trace billing) |
| **4. Payer Diversity** | Whether practice patterns are consistent across Medicare and Medicaid |
| **5. Billing Quality** | Whether charges, code ratios, and E/M complexity are normal |

## Scenarios Showing Complementary Coverage

**Scenario A:** Provider scores 90 on Peer Comparison but 40 on ACOG Concordance. *Interpretation:* Bills like a normal OB-GYN with full scope but doesn't follow ACOG guidelines. Practice breadth is fine; clinical quality is the concern.

**Scenario B:** Provider scores 40 on Peer Comparison but 85 on Billing Quality. *Interpretation:* Narrow practice scope (maybe GYN-only) but what they do bill is clean. Not a billing problem — may be a scope limitation or subspecialty not captured in taxonomy.

**Scenario C:** Provider scores 90 on Peer Comparison but 30 on Volume Adequacy. *Interpretation:* Bills the right codes and categories but with suspiciously low volumes in several areas. Could be a new practice building volume, or trace billing to appear comprehensive.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **Medicare-only code data** | CMS Physician file covers Medicare beneficiaries. OB-GYN providers serve many younger patients on commercial insurance or Medicaid not captured here. Reference set may under-represent obstetric codes. |
| **No Medicaid code-level detail** | CMS Medicaid file has total services/spending per NPI but not per-HCPCS breakdown. Cannot build Medicaid-specific reference set. |
| **Suppression of low-volume codes** | CMS suppresses HCPCS lines with <11 beneficiaries. Some OB-GYN codes may be invisible for individual providers. |
| **Global OB codes collapse detail** | Codes like 59400 bundle antepartum, delivery, and postpartum into one line item. Cannot see component services. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Age-of-practice bias** | OB-GYN providers treating more Medicare patients (postmenopausal GYN care) may have fuller Medicare code coverage | Combine with Medicaid volume data where available |
| **OB vs. GYN practice balance** | Providers who practice only GYN will systematically miss obstetric categories | Subspecialist handling; do not penalize GYN-only practitioners who are honestly labeled |
| **Urban/academic bias** | Academic OB-GYN practices bill more diverse codes due to training programs | State-level cohort partially controls for this |
| **Maternity desert bias** | Rural OB-GYNs may bill fewer obstetric codes if deliveries are declining in their area | Flag low-obstetric-volume providers for context |

## Update Cadence

- **Reference code set:** Rebuild annually from latest CMS Medicare Physician & Other Practitioners release.
- **Category definitions:** Review annually; update if new codes or procedures become standard OB-GYN practice.
- **Peer medians:** Recompute annually when reference set is rebuilt.
- **Minimum volume thresholds:** Review annually based on peer cohort distribution.

---
# OUTPUT SCHEMA
---

| Field | Type | Description |
|---|---|---|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | Full name from NPPES |
| `taxonomy_code` | string | Primary taxonomy code |
| `is_subspecialist` | boolean | True if subspecialty taxonomy detected |
| `state` | string | 2-letter state code |
| `peer_comparison_score` | float | 0-100 composite peer comparison score |
| `code_coverage` | float | 0-100: fraction of reference codes billed |
| `category_coverage` | float | 0-100: fraction of 6 workflow categories billed |
| `volume_concordance` | float | 0-100: similarity of volume distribution to peers |
| `codes_matched` | integer | Count of reference codes billed by this provider |
| `reference_set_size` | integer | Size of the reference code set used |
| `categories_covered` | integer | Count of workflow categories with any billing (out of 6) |
| `mean_deviation` | float | Mean absolute deviation from peer median rates |
| `peer_cohort_size` | integer | Number of providers in the peer cohort used |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
