# OB-GYN Volume Adequacy Score: A Sub-Treasure Map

## What This Document Does

This score answers: **For the OB-GYN services this provider claims to perform, is the volume believable?** It detects "trace billing" — providers who bill 1-2 claims in a clinical category, suggesting they listed a service without meaningfully practicing it. A provider who bills a single colposcopy all year is not credibly performing colposcopies.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Volume Adequacy |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count. The primary input for detecting trace billing — we can see exactly how many times each provider billed each code. |
| **CMS Medicaid Provider Spending** | Per-NPI total services. Used to confirm overall practice volume and set minimum activity thresholds. |
| **NPPES NPI Registry** | Taxonomy code 207V00000X confirms OB-GYN specialty. Entity Type 1 filters to individual practitioners. |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207V00000X (Obstetrics & Gynecology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare + Medicaid services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |

## Volume Categories

OB-GYN volume adequacy checks **10 categories** of clinical activity where trace billing is a meaningful red flag. These exclude inherently high-volume codes (E/M visits) where every provider bills substantially.

| # | Category | HCPCS Codes | Why Trace Billing Matters Here | Floor Calculation |
|---|---|---|---|---|
| 1 | **Obstetric Deliveries** | 59400, 59410, 59510, 59610 | A provider billing 1-2 deliveries/year is not credibly managing labor. | peer_median_rate / 3 |
| 2 | **Antepartum Surveillance** | 59025, 76818, 59426 | Fetal monitoring requires ongoing competency. 1-2 NSTs/year is not meaningful practice. | peer_median_rate / 3 |
| 3 | **OB Ultrasound** | 76801, 76805, 76811, 76815, 76816 | Ultrasound interpretation demands volume for skill maintenance. | peer_median_rate / 3 |
| 4 | **Transvaginal Ultrasound** | 76817 | Specialized imaging that requires regular practice for proficiency. | peer_median_rate / 3 |
| 5 | **Colposcopy** | 57452, 57454, 57455, 57460 | Cervical evaluation is a core GYN competency. 1-2/year suggests they're not really doing this. | peer_median_rate / 3 |
| 6 | **Endometrial Biopsy** | 58100 | Office procedure requiring technique maintenance. Trace billing = not a real part of practice. | peer_median_rate / 3 |
| 7 | **Hysteroscopy** | 58558, 58559, 58560, 58563 | Operative procedure with meaningful learning curve. Trace billing is a red flag. | peer_median_rate / 3 |
| 8 | **Laparoscopic GYN Surgery** | 58661, 58662, 58670, 58671 | Surgical procedure requiring ongoing volume for safe practice. | peer_median_rate / 3 |
| 9 | **Contraceptive Procedures** | 58300, 58301, 11982, 11983 | IUD and implant insertion/removal. 1-2/year suggests token billing, not real family planning practice. | peer_median_rate / 3 |
| 10 | **Cervical/Vaginal Screening** | 88175, 88142, Q0091 | Pap smear collection and processing. Core to preventive GYN care. | peer_median_rate / 3 |

**What's excluded and why:**

| Excluded Code Group | Reason |
|---|---|
| E/M codes (99213-99215, 99203-99205) | Every OB-GYN bills these at high volume. Not informative for trace detection. |
| Pregnancy tests (81025) | Point-of-care test with inherently variable volume. Not a skill competency. |
| Lab interpretation codes | Ordering labs is not a volume-dependent skill. |

## Floor Computation

For each category, the floor is computed from the OB-GYN peer cohort:

```
floor = peer_median_services_per_year / 3
```

**Example:** If the median OB-GYN in Massachusetts performs 45 colposcopies/year, the floor is 15. Any provider billing 1-14 colposcopies is flagged.

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

**Example 1: Full-scope OB-GYN with adequate volume (Score = 100)**

Dr. A bills in 9 of 10 categories (no laparoscopic surgery). All 9 categories exceed their floors.

- detected_count = 9
- ok_count = 9
- flag_count = 0
- **Score = (9/9) * 100 = 100**

**Example 2: OB-GYN with some trace billing (Score = 71)**

Dr. B bills in 7 of 10 categories. 5 exceed floors, but colposcopy (3 vs. floor of 15) and hysteroscopy (2 vs. floor of 8) are flagged.

- detected_count = 7
- ok_count = 5
- flag_count = 2
- **Score = (5/7) * 100 = 71.4**

**Example 3: Provider with extensive trace billing (Score = 33)**

Dr. C bills in 6 categories but only 2 exceed floors. Obstetric deliveries (2), antepartum surveillance (3), colposcopy (1), and contraceptive procedures (2) are all trace-level.

- detected_count = 6
- ok_count = 2
- flag_count = 4
- **Score = (2/6) * 100 = 33.3**

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
| Maternal-Fetal Medicine (207VM0101X) | Only: Obstetric Deliveries, Antepartum Surveillance, OB Ultrasound, Transvaginal Ultrasound. Gynecologic categories excluded. |
| Gynecologic Oncology (207VG0400X) | Only: Colposcopy, Endometrial Biopsy, Hysteroscopy, Laparoscopic GYN Surgery. Obstetric categories excluded. |
| Reproductive Endocrinology (207VE0102X) | Excluded from general scoring. Practice pattern too specialized. |
| Female Pelvic Medicine (207VF0040X) | Only: Hysteroscopy, Laparoscopic GYN Surgery. Other categories excluded. |

**Rule:** Subspecialists are evaluated only on categories within their scope. `detected_count` and `ok_count` are computed from their relevant category subset.

## Not-Detected vs. Flag Distinction

This is critical: **not billing a category is neutral; billing it at trace volume is a flag.**

- A GYN-only provider who never bills obstetric deliveries scores `not_detected` on that category — it doesn't count against them.
- A provider who bills 2 obstetric deliveries per year scores `flag` — they claimed to do deliveries but the volume isn't credible.

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. ACOG Guideline Concordance** | Whether clinical care meets evidence-based standards |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical OB-GYN |
| **3. Volume Adequacy (this score)** | Whether specific procedure volumes are credible — the only score that catches trace billing (provider bills a code but at implausibly low volume) |
| **4. Payer Diversity** | Whether practice patterns are consistent across payers |
| **5. Billing Quality** | Whether charges and code ratios are normal |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on Peer Comparison but 40 on Volume Adequacy. *Interpretation:* They bill the right codes and categories (breadth looks fine) but at trace volumes in multiple areas. Peer Comparison sees code presence; Volume Adequacy sees code depth. This provider may be listing capabilities they don't meaningfully practice.

**Scenario B:** Provider scores 85 on Volume Adequacy but 50 on Billing Quality. *Interpretation:* Volume is credible — they're actually doing the procedures — but charge ratios or code patterns are abnormal. Real practice, questionable billing.

**Scenario C:** Provider scores 100 on Volume Adequacy but 45 on ACOG Concordance. *Interpretation:* Adequate volume across the board but not following ACOG guidelines. They're doing enough procedures but not necessarily the right things.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **Medicare-only procedure counts** | OB-GYN patients skew younger. Medicare volume undercounts obstetric procedures significantly. Obstetric delivery floors may be artificially low. |
| **CMS suppression threshold** | Codes with <11 beneficiaries are suppressed. Some legitimate low-volume categories may appear as "not_detected" when they should be "ok" or "flag." |
| **Global OB codes** | 59400 bundles multiple service types. Cannot disaggregate antepartum vs. delivery vs. postpartum components. |
| **No Medicaid code-level data** | Cannot see per-HCPCS volume for Medicaid patients. Major gap given OB-GYN's Medicaid population. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Young-patient bias** | OB-GYN providers with mostly reproductive-age patients have minimal Medicare volume. Obstetric floors may be artificially low, making it easier to "pass." | Flag providers with very low Medicare total volume separately. |
| **Transition-to-GYN bias** | Older OB-GYNs transitioning away from obstetric practice may flag on obstetric categories they're legitimately leaving. | Treat as "not_detected" if no obstetric codes billed at all. Only flag if trace billing present. |
| **Practice-size bias** | Solo practitioners may have lower volumes per category than group practice members. | State-level peer cohort partially controls for practice size distribution. |

## Update Cadence

- **Floors:** Recompute annually from latest CMS data release.
- **Category definitions:** Review annually for new codes (e.g., new contraceptive devices, new surgical approaches).
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
