# Ophthalmology Peer Comparison Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Does this ophthalmology provider's billing profile look like a normal practitioner in ophthalmology?** It compares each provider's HCPCS code usage against a reference set built from the top billing codes of their ophthalmology peers, producing a 0-100 score reflecting how typical their practice pattern is.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Peer Comparison |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count, average charge, average payment. The primary input for building the reference code set and computing all three metrics. |
| **CMS Medicaid Provider Spending** | Per-NPI total services and beneficiaries for Medicaid. Used to set minimum volume thresholds and confirm active ophthalmology practice. |
| **NPPES NPI Registry** | Taxonomy code 207W00000X confirms ophthalmology specialty. Entity Type 1 filters to individual practitioners. State field enables state-level cohort grouping. |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207W00000X (Ophthalmology) |
| **State grouping** | State-level (default) |
| **National fallback** | When state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare + Medicaid services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |
| **Subspecialist exclusion** | Providers with subspecialty taxonomy codes (207WX0107X Retina, 207WX0009X Glaucoma, 207WX0200X Oculoplastics, 207WX0110X Pediatric) excluded from general peer cohort |

## Reference Code Set

The reference code set is built from the **top 30 most prevalent HCPCS codes** billed by ophthalmology providers nationally, targeting codes covering **~65-70% of total billing volume** for the specialty.

### Ophthalmology Reference Code Set

| HCPCS | Description | Category | Expected Prevalence |
|---|---|---|---|
| 99213 | Office visit, established, low complexity | Office Visits | Very high |
| 99214 | Office visit, established, moderate complexity | Office Visits | Very high |
| 99215 | Office visit, established, high complexity | Office Visits | High |
| 99203 | Office visit, new, low complexity | Office Visits | Moderate |
| 99204 | Office visit, new, moderate complexity | Office Visits | Moderate |
| 92012 | Intermediate eye exam, established patient | Eye Exams | Very high |
| 92014 | Comprehensive eye exam, established patient | Eye Exams | Very high |
| 92004 | Comprehensive eye exam, new patient | Eye Exams | High |
| 66984 | Cataract surgery, routine (phacoemulsification + IOL) | Cataract Surgery | Very high |
| 66982 | Cataract surgery, complex | Cataract Surgery | Moderate |
| 66821 | YAG posterior capsulotomy | Cataract Surgery | Moderate |
| 92136 | Ophthalmic biometry, optical (IOLMaster) | Diagnostic Testing | High |
| 67028 | Intravitreal injection of pharmacologic agent | Retinal Procedures | Very high |
| 92134 | OCT, posterior segment (retina/macula) | Diagnostic Testing | Very high |
| 92133 | OCT, posterior segment (optic nerve/RNFL) | Diagnostic Testing | Very high |
| 92083 | Visual field exam, extended (Humphrey) | Diagnostic Testing | Very high |
| 92250 | Fundus photography with interpretation | Diagnostic Testing | High |
| 92235 | Fluorescein angiography | Diagnostic Testing | Moderate |
| 65855 | Laser trabeculoplasty (SLT/ALT) | Glaucoma Procedures | Moderate |
| 66183 | MIGS device insertion (iStent, Hydrus) | Glaucoma Procedures | Moderate |
| 66170 | Trabeculectomy | Glaucoma Procedures | Low-Moderate |
| 67210 | Focal laser photocoagulation | Retinal Procedures | Moderate |
| 67228 | Panretinal photocoagulation (PRP) | Retinal Procedures | Moderate |
| 67036 | Vitrectomy, pars plana | Retinal Procedures | Moderate |
| 76519 | Ophthalmic biometry, A-scan | Diagnostic Testing | Moderate |
| 92015 | Refraction | Eye Exams | High (but not Medicare-covered) |
| 65778 | Corneal transplant (endothelial keratoplasty) | Anterior Segment | Low-Moderate |
| 67040 | Vitrectomy with endolaser | Retinal Procedures | Low-Moderate |
| 99024 | Postoperative follow-up visit (bundled) | Office Visits | High |
| 66991 | Premium IOL add-on (toric/multifocal) | Cataract Surgery | Moderate |

**Rebuild cadence:** Reference set rebuilt annually from the latest CMS Medicare Physician & Other Practitioners release.

## Workflow Categories

Ophthalmology billing falls into **6 natural workflow categories**:

| # | Category | Codes Included | Clinical Rationale |
|---|---|---|---|
| 1 | **Office Visits & Eye Exams** | 99203-99205, 99213-99215, 92004, 92012, 92014 | Core evaluation & management — every ophthalmologist does this |
| 2 | **Cataract & Anterior Segment Surgery** | 66984, 66982, 66821, 66991, 92136, 76519, 65778 | Cataract extraction, YAG capsulotomy, biometry, premium IOLs, corneal surgery |
| 3 | **Glaucoma Procedures** | 65855, 66183, 66170 | SLT, MIGS, trabeculectomy — surgical glaucoma management |
| 4 | **Retinal Procedures** | 67028, 67210, 67228, 67036, 67040 | Intravitreal injections, laser, vitrectomy — medical and surgical retina |
| 5 | **Diagnostic Testing** | 92133, 92134, 92083, 92250, 92235 | OCT (nerve and retina), visual fields, fundus photography, fluorescein angiography |
| 6 | **Refraction & Screening** | 92015, 99024 | Refraction (non-Medicare), post-op follow-up |

## Three Metrics

### Metric 1: Code Coverage (Weight: 40%)

**Question:** What fraction of the ophthalmology reference code set does this provider bill?

```
code_coverage = (codes_billed_by_provider ∩ reference_set) / |reference_set| * 100
```

A provider billing 22 of 30 reference codes scores 73.3.

**Why 40% weight:** Code breadth is the strongest single signal of a well-rounded ophthalmology practice. A provider billing only E/M codes and cataract surgery without diagnostic testing is not practicing comprehensive ophthalmology.

### Metric 2: Category Coverage (Weight: 30%)

**Question:** Does this provider bill across all 6 ophthalmology workflow categories?

```
category_coverage = categories_with_any_billing / 6 * 100
```

A provider billing in 5 of 6 categories scores 83.3.

**Why 30% weight:** Category coverage catches providers who bill many codes but all within one narrow area (e.g., only injections and retinal procedures, no cataract surgery or glaucoma management).

### Metric 3: Volume Concordance (Weight: 30%)

**Question:** For codes this provider bills, is their relative volume distribution similar to their peers?

```
For each code in (provider's codes ∩ reference_set):
    provider_rate = provider_services_for_code / provider_total_services
    peer_median_rate = median(all_peer_rates_for_code)
    deviation = |provider_rate - peer_median_rate|

volume_concordance = max(0, 100 - mean(all_deviations) * 100)
```

**Why 30% weight:** A provider can bill the right codes but in wildly abnormal proportions (e.g., 70% intravitreal injections, 2% office visits). Volume concordance detects skewed distributions.

## Composite Peer Comparison Score

```
peer_comparison_score = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

### Worked Examples

**Example 1: Full-scope comprehensive ophthalmologist (Score ~90)**

Dr. A bills 27 of 30 reference codes across all 6 categories. Volume distribution is within 6% mean deviation of peers.

- Code coverage: 27/30 × 100 = 90.0
- Category coverage: 6/6 × 100 = 100.0
- Volume concordance: 100 - 6 = 94.0
- **Composite: (90.0 × 0.40) + (100.0 × 0.30) + (94.0 × 0.30) = 36.0 + 30.0 + 28.2 = 94.2**

**Example 2: Cataract-heavy surgical practice (Score ~65)**

Dr. B bills 18 of 30 reference codes across 4 categories (no Glaucoma Procedures, minimal Retinal Procedures). Volume heavily skewed toward cataract codes.

- Code coverage: 18/30 × 100 = 60.0
- Category coverage: 4/6 × 100 = 66.7
- Volume concordance: 100 - 22 = 78.0
- **Composite: (60.0 × 0.40) + (66.7 × 0.30) + (78.0 × 0.30) = 24.0 + 20.0 + 23.4 = 67.4**

**Example 3: Injection-only retina practice (Score ~40)**

Dr. C bills 12 of 30 reference codes across 3 categories (Office Visits, Retinal Procedures, Diagnostic Testing). Volume is 65% intravitreal injections.

- Code coverage: 12/30 × 100 = 40.0
- Category coverage: 3/6 × 100 = 50.0
- Volume concordance: 100 - 45 = 55.0
- **Composite: (40.0 × 0.40) + (50.0 × 0.30) + (55.0 × 0.30) = 16.0 + 15.0 + 16.5 = 47.5**

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
| **Retina/Vitreoretinal (207WX0107X)** | Use retina-specific reference set (heavy on 67028, 92134, 92235, 67036, 67040, 67228). Exclude cataract surgical codes from expected codes. Compare against retina peer cohort when ≥ 30 providers. |
| **Glaucoma Specialist (207WX0009X)** | Use glaucoma-specific reference set (heavy on 92083, 92133, 65855, 66183, 66170). Maintain cataract codes (glaucoma specialists often do combined cataract-MIGS). Compare against glaucoma peer cohort when ≥ 30. |
| **Oculoplastics (207WX0200X)** | Exclude from general peer comparison. Practice pattern too specialized (lid surgery, orbital procedures — codes not in general ophthalmology reference set). Score = null with flag. |
| **Pediatric Ophthalmology (207WX0110X)** | Exclude from general peer comparison. Medicare volume is minimal. Score = null with flag. |
| **Cornea/External Disease (207WX0120X)** | Use cornea-weighted reference set. Heavy on cataract + corneal transplant codes. Compare against general cohort with adjusted expectations. |

**Rule:** Subspecialists are compared against their own subspecialty peer cohort when cohort size ≥ 30. Otherwise, they receive a peer comparison score of null with a flag.

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. AAO Guideline Concordance** | Whether clinical care meets AAO evidence-based standards |
| **2. Peer Comparison (this score)** | Whether billing breadth and volume distribution resemble a typical ophthalmologist — detects providers who claim the specialty but don't practice the full scope |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible (catches trace billing) |
| **4. Payer Diversity** | Whether practice patterns are consistent across Medicare and Medicaid |
| **5. Billing Quality** | Whether charges, code ratios, and E/M complexity are normal |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on Peer Comparison but 50 on AAO Guideline Concordance. *Interpretation:* Their billing profile looks exactly like a typical ophthalmologist — right codes, right distribution — but they're not following AAO monitoring guidelines. Looks like an ophthalmologist on paper, not practicing like one clinically.

**Scenario B:** Provider scores 45 on Peer Comparison but 85 on Volume Adequacy. *Interpretation:* They don't bill the breadth of codes expected (narrow scope) but what they do bill, they bill at adequate volume. A specialist or niche practice, not a generalist.

**Scenario C:** Provider scores 70 on Peer Comparison but 35 on Billing Quality. *Interpretation:* Practice scope is reasonably broad but charges and ratios are abnormal. Normal practice pattern with questionable billing.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **Medicare-only code detail** | Reference set is built from Medicare billing. Ophthalmologists treating younger patients (trauma, pediatric conditions) may have a different code mix not captured. |
| **92xxx vs. E/M ambiguity** | Ophthalmologists can bill 92012/92014 or 99213/99214 for office visits. Both are in the reference set, but a provider switching from one to the other may appear to have lower coverage. |
| **ASC vs. office setting** | Surgical codes billed in physician-owned ASCs may split professional and facility components. Code coverage may vary by practice setting. |
| **CMS suppression threshold** | Codes with <11 beneficiaries are suppressed, reducing apparent code coverage for low-volume providers. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Subspecialty concentration** | Retina and glaucoma subspecialists will score low on general peer comparison. | Subspecialty peer cohorts and null-with-flag handling. |
| **Practice size** | Solo practitioners may have narrower code sets than large group practices. | State-level peer cohort partially controls for practice size distribution. |
| **Geographic variation** | SLT adoption, MIGS utilization, and injection drug choice vary regionally. | State-level cohort is the primary control. |

## Update Cadence

- **Reference code set:** Rebuilt annually from latest CMS data release.
- **Workflow categories:** Review annually for new codes (new MIGS devices, new surgical approaches, new diagnostic modalities).
- **Peer cohort composition:** Refreshed with each annual CMS release.

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
| `code_coverage` | float | 0-100 code coverage metric |
| `category_coverage` | float | 0-100 category coverage metric |
| `volume_concordance` | float | 0-100 volume concordance metric |
| `codes_matched` | integer | Number of reference codes this provider bills |
| `reference_set_size` | integer | Total codes in reference set |
| `categories_covered` | integer | Number of workflow categories with billing |
| `total_categories` | integer | Total workflow categories (6) |
| `mean_deviation` | float | Mean absolute deviation from peer median rates |
| `peer_cohort_size` | integer | Number of providers in the peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
