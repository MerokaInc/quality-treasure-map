# Ophthalmology Volume Adequacy Score: A Sub-Treasure Map

## What This Document Does

This score answers: **For the ophthalmic services this provider claims to perform, is the volume believable?** It detects "trace billing" — providers who bill 1-2 claims in a clinical category, suggesting they listed a service without meaningfully practicing it. A provider who bills a single intravitreal injection all year is not credibly managing retinal disease.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Volume Adequacy |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count. The primary input for detecting trace billing — we can see exactly how many times each provider billed each code. |
| **CMS Medicaid Provider Spending** | Per-NPI total services. Used to confirm overall practice volume and set minimum activity thresholds. |
| **NPPES NPI Registry** | Taxonomy code 207W00000X confirms ophthalmology specialty. Entity Type 1 filters to individual practitioners. |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207W00000X (Ophthalmology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare + Medicaid services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |

## Volume Categories

Ophthalmology volume adequacy checks **10 categories** of clinical activity where trace billing is a meaningful red flag. These exclude inherently high-volume codes (routine office visits) where every provider bills substantially.

| # | Category | HCPCS Codes | Why Trace Billing Matters Here | Floor Calculation |
|---|---|---|---|---|
| 1 | **Cataract Surgery** | 66984, 66982 | Cataract extraction is the most common ophthalmic surgery. 1-2 cataracts/year is not credible surgical practice — requires maintained skills, OR access, and anesthesia coordination. | peer_median_rate / 3 |
| 2 | **YAG Capsulotomy** | 66821 | Posterior capsulotomy is a routine laser procedure for post-cataract opacification. 1-2/year suggests token billing, not active laser practice. | peer_median_rate / 3 |
| 3 | **Intravitreal Injections** | 67028 | Anti-VEGF injections require ongoing patient monitoring and serial treatments. 1-2 injections/year means the provider is not managing retinal disease patients longitudinally. | peer_median_rate / 3 |
| 4 | **Retinal Laser** | 67210, 67228 | Focal laser and PRP for diabetic retinopathy require technique maintenance. Trace billing suggests they're not actively treating retinal disease. | peer_median_rate / 3 |
| 5 | **Glaucoma Laser (SLT/ALT)** | 65855 | Selective laser trabeculoplasty is a core glaucoma treatment. 1-2/year is not meaningful glaucoma laser practice. | peer_median_rate / 3 |
| 6 | **Glaucoma Surgery** | 66183, 66170, 66179, 66180 | MIGS devices and trabeculectomy require surgical competency. Trace billing is a credibility red flag. | peer_median_rate / 3 |
| 7 | **Vitreoretinal Surgery** | 67036, 67038, 67040, 67041, 67042, 67108 | Vitrectomy and retinal detachment repair are complex surgeries requiring ongoing volume for safe practice. | peer_median_rate / 3 |
| 8 | **OCT Imaging** | 92133, 92134 | OCT of optic nerve and retina is the standard monitoring tool for glaucoma and retinal disease. 1-2/year while managing chronic eye disease is a monitoring gap. | peer_median_rate / 3 |
| 9 | **Visual Field Testing** | 92083 | Automated perimetry is essential for glaucoma management. Trace visual field billing while managing glaucoma patients signals inadequate monitoring. | peer_median_rate / 3 |
| 10 | **Fluorescein Angiography** | 92235 | FA is a diagnostic tool for retinal vascular disease. If a provider bills it, they should be doing it regularly enough to maintain interpretation skills. | peer_median_rate / 3 |

**What's excluded and why:**

| Excluded Code Group | Reason |
|---|---|
| E/M codes (99213-99215) and eye exam codes (92012, 92014) | Every ophthalmologist bills these at high volume. Not informative for trace detection. |
| Refraction (92015) | Not covered by Medicare. Variable billing patterns are structural, not a quality signal. |
| Fundus photography (92250) | Moderate-volume ancillary test. Not a skill-dependent procedure where trace billing indicates competency concerns. |
| Ophthalmic biometry (92136) | Pre-cataract workup. Volume is dependent on cataract surgery volume, not independently meaningful. |

## Floor Computation

For each category, the floor is computed from the ophthalmology peer cohort:

```
floor = peer_median_services_per_year / 3
```

**Example:** If the median ophthalmologist in California performs 120 cataract surgeries/year, the floor is 40. Any provider billing 1-39 cataract surgeries is flagged.

Floors are **computed, not hardcoded** — they adjust automatically when the peer cohort changes (new year's data, different state, etc.).

## Scoring Logic

Each category gets one of three states:

```
FOR each category:
    IF provider bills 0 services in category:
        state = "not_detected"    # Not billing this — neutral, not penalized
    ELIF provider_services >= floor:
        state = "ok"              # Adequate volume
    ELSE:
        state = "flag"            # Trace billing detected
```

### Volume Adequacy Score

```
detected_count = count of categories where state != "not_detected"
ok_count = count of categories where state = "ok"

IF detected_count = 0:
    volume_adequacy_score = 50    # Neutral fallback — no data to evaluate
ELSE:
    volume_adequacy_score = (ok_count / detected_count) * 100
```

### Worked Examples

**Example 1: Full-scope ophthalmologist with adequate volume (Score = 100)**

Dr. A bills in 8 of 10 categories (no vitreoretinal surgery, no fluorescein angiography). All 8 categories exceed their floors.

- detected_count = 8
- ok_count = 8
- flag_count = 0
- **Score = (8/8) × 100 = 100**

**Example 2: Ophthalmologist with some trace billing (Score = 75)**

Dr. B bills in 8 of 10 categories. 6 exceed floors, but glaucoma laser (3 SLTs vs. floor of 12) and intravitreal injections (5 vs. floor of 40) are flagged.

- detected_count = 8
- ok_count = 6
- flag_count = 2
- **Score = (6/8) × 100 = 75.0**

**Example 3: Provider with extensive trace billing (Score = 40)**

Dr. C bills in 5 categories but only 2 exceed floors (cataract surgery and OCT). YAG capsulotomy (2), SLT (1), and visual fields (3) are all trace-level.

- detected_count = 5
- ok_count = 2
- flag_count = 3
- **Score = (2/5) × 100 = 40.0**

---
# PART C: BUSINESS RULES
---

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has no Medicare billing data | Cannot compute volume adequacy. Score = null. |
| Provider bills in 0 categories | Score = 50 (neutral fallback). Cannot evaluate. |
| Category has <10 peers billing it nationally | Category excluded from scoring (insufficient data for stable floor). |
| CMS suppresses code line (<11 beneficiaries) | Treat as "not_detected" — cannot confirm billing volume. |

## Subspecialist Handling

| Subspecialty | Categories Evaluated |
|---|---|
| **Retina/Vitreoretinal (207WX0107X)** | Only: Intravitreal Injections, Retinal Laser, Vitreoretinal Surgery, OCT Imaging, Fluorescein Angiography. Cataract and glaucoma categories excluded. |
| **Glaucoma Specialist (207WX0009X)** | Only: Glaucoma Laser, Glaucoma Surgery, OCT Imaging, Visual Field Testing, Cataract Surgery (glaucoma specialists often do combined cataract-MIGS). |
| **Cornea/External Disease (207WX0120X)** | Only: Cataract Surgery, YAG Capsulotomy, OCT Imaging. Retinal and glaucoma surgical categories excluded. |
| **Oculoplastics (207WX0200X)** | Excluded from general volume adequacy scoring. Practice pattern too specialized (lid/orbit surgery). Score = null with flag. |
| **Pediatric Ophthalmology (207WX0110X)** | Excluded from general scoring. Medicare volume is minimal. Score = null with flag. |

**Rule:** Subspecialists are evaluated only on categories within their scope. `detected_count` and `ok_count` are computed from their relevant category subset.

## Not-Detected vs. Flag Distinction

This is critical: **not billing a category is neutral; billing it at trace volume is a flag.**

- A cataract-only surgeon who never bills intravitreal injections scores `not_detected` on that category — it doesn't count against them.
- A provider who bills 2 intravitreal injections per year scores `flag` — they claimed to treat retinal disease but the volume isn't credible.

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. AAO Guideline Concordance** | Whether clinical care meets evidence-based standards |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical ophthalmologist |
| **3. Volume Adequacy (this score)** | Whether specific procedure volumes are credible — the only score that catches trace billing (provider bills a code but at implausibly low volume) |
| **4. Payer Diversity** | Whether practice patterns are consistent across payers |
| **5. Billing Quality** | Whether charges and code ratios are normal |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on Peer Comparison but 40 on Volume Adequacy. *Interpretation:* They bill the right codes and categories (breadth looks fine) but at trace volumes in multiple areas. Peer Comparison sees code presence; Volume Adequacy sees code depth. This provider may be listing capabilities they don't meaningfully practice.

**Scenario B:** Provider scores 85 on Volume Adequacy but 50 on Billing Quality. *Interpretation:* Volume is credible — they're actually doing the procedures — but charge ratios or code patterns are abnormal. Real practice, questionable billing.

**Scenario C:** Provider scores 100 on Volume Adequacy but 45 on AAO Guideline Concordance. *Interpretation:* Adequate volume across the board but not following AAO monitoring guidelines (e.g., doing lots of injections but not enough OCTs per injection). They're doing enough procedures but not necessarily the right things.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **Medicare-only procedure counts** | CMS data reflects Medicare patients. Ophthalmology skews elderly/Medicare, making this less of a limitation than for specialties like pediatrics or OB-GYN. Still, younger-patient procedures (trauma repair, pediatric strabismus) are invisible. |
| **CMS suppression threshold** | Codes with <11 beneficiaries are suppressed. Some legitimate low-volume categories may appear as "not_detected" when they should be "ok" or "flag." |
| **No Medicaid code-level data** | Cannot see per-HCPCS volume for Medicaid patients. Less impactful for ophthalmology than for Medicaid-heavy specialties. |
| **Global period bundling** | 90-day global for cataract surgery (66984) bundles post-op visits. Cannot disaggregate surgical volume from follow-up volume for major procedures. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **High Medicare representativeness** | Ophthalmology's elderly patient base means Medicare data captures a large share of actual practice. This is a strength, not a bias — but means floors may be high relative to a provider's total (all-payer) volume. | State-level peer cohort partially controls. |
| **Subspecialty concentration** | Retina specialists will have zero volume in cataract and glaucoma categories. This is expected scope, not inadequacy. | Subspecialist category subsetting (see Business Rules). |
| **Practice-size bias** | Solo practitioners may have lower volumes per category than group practice members. | State-level peer cohort partially controls for practice size distribution. |
| **ASC vs. office** | Providers performing surgery in hospital ORs vs. their own ASCs may have different volume distributions due to scheduling constraints. | Not directly mitigable from CMS data. |

## Update Cadence

- **Floors:** Recompute annually from latest CMS data release.
- **Category definitions:** Review annually for new codes (new MIGS devices, new vitreoretinal approaches, new laser modalities).
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
| `volume_adequacy_score` | float | 0-100 composite volume adequacy score |
| `detected_count` | integer | Number of categories where provider billed any services |
| `ok_count` | integer | Number of categories meeting floor threshold |
| `flag_count` | integer | Number of categories with trace billing |
| `not_detected_count` | integer | Number of categories with zero billing |
| `category_details` | JSON | Per-category breakdown: {category, state, provider_volume, floor, peer_median} |
| `peer_cohort_size` | integer | Number of providers in the peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
