# OB-GYN Billing Quality Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Are this OB-GYN provider's charges, code ratios, and E/M distribution normal?** It detects billing anomalies — upcoding, abnormal charge-to-allowed ratios, clinically inconsistent code pairings, and procedure ratios that diverge from what a well-functioning OB-GYN practice should produce. A provider can follow ACOG guidelines and have adequate volume but still bill in ways that signal problems.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Billing Quality |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count, average submitted charge, average Medicare allowed amount, average Medicare payment. Contains all the fields needed to compute charge ratios, code distributions, and procedure pairings. |
| **CMS Medicaid Provider Spending** | Per-NPI total services and spending. Provides total Medicaid billing volume but lacks per-code detail. |
| **NPPES NPI Registry** | Taxonomy code 207V00000X confirms OB-GYN specialty. Entity Type 1 filters to individual practitioners. |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207V00000X (Obstetrics & Gynecology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |

## Component 1: Charge Score (Weight: 35%)

### OB-GYN Expected Charge-to-Allowed Ratio

The charge-to-allowed ratio measures how much a provider charges relative to what Medicare allows. OB-GYN has a specific expected range.

**OB-GYN charge context:** OB-GYN is a mixed medical-surgical specialty. Charge ratios are moderate — higher than primary care (due to surgical procedures) but lower than pure surgical specialties (due to high E/M volume).

| Charge Pattern | Expected Ratio Range | What It Signals |
|---|---|---|
| Very low (< p10) | <1.3x | Possible under-billing or coding errors |
| Normal (p25-p75) | 1.5x - 2.5x | Standard OB-GYN practice |
| Elevated (p75-p90) | 2.5x - 3.5x | On the high side but may reflect surgical mix |
| Outlier (> p90) | >3.5x | Significantly above peers — warrants investigation |

### Charge Score Computation

```
charge_ratio = average_submitted_charge / average_medicare_allowed

IF charge_ratio between p25 and p75 of peer cohort:
    charge_score = 100
ELIF charge_ratio between p10 and p90 of peer cohort:
    charge_score = 70
ELSE:
    charge_score = 40
```

**Three-band scoring** is intentionally coarse. Charge-to-allowed ratios have legitimate variance (urban vs. rural, academic vs. private). We flag outliers, not gradients.

## Component 2: Ratio Score (Weight: 65%)

The ratio score evaluates clinically meaningful code pairings and patterns. Each check is classified as **green flag** (good practice), **red flag** (anomaly), or **neutral** (insufficient data to classify).

### Green Flag Ratios (Indicators of Quality OB-GYN Practice)

| # | Ratio | Numerator | Denominator | Expected Range | Clinical Rationale |
|---|---|---|---|---|---|
| G1 | **Screening-to-visit ratio** | Pap smears (88175) | Office visits (99213-99215) | 0.08-0.25 | Regular screening relative to visit volume indicates preventive care |
| G2 | **Colposcopy follow-through** | Colposcopy with biopsy (57454) | Colposcopy without biopsy (57452) | 0.40-0.80 | When colposcopy is performed, biopsy should follow in a substantial fraction |
| G3 | **Postpartum visit ratio** | Postpartum visits (59430) | Deliveries (59400+59410+59510) | 0.70-1.10 | Most deliveries should have a corresponding postpartum follow-up |
| G4 | **NST-to-OB ratio** | Non-stress tests (59025) | Antepartum visits (59426) | 0.50-3.00 | Antepartum surveillance should accompany high-risk OB care |
| G5 | **IUD insertion-to-removal balance** | IUD insertions (58300) | IUD removals (58301) | 0.80-5.00 | Insertions should exceed removals (patients getting new IUDs, not just removing old ones) |
| G6 | **Implant insertion-to-removal balance** | Implant insertions (11982) | Implant removals (11983) | 0.80-4.00 | Same logic as IUD — net positive contraceptive provision |
| G7 | **Ultrasound-to-OB ratio** | OB ultrasounds (76801+76805) | OB global codes (59400+59426) | 0.50-3.00 | Ultrasound utilization should be proportional to OB volume |
| G8 | **Surgical prophylaxis ratio** | Antibiotic admin (96372) near surgical codes | GYN surgeries (58558+58661) | 0.60-1.00 | Antibiotic prophylaxis should accompany most GYN surgeries |
| G9 | **Contraceptive counseling breadth** | Distinct contraceptive CPTs billed | Total contraceptive services | ≥2 distinct codes | Offering multiple methods signals comprehensive family planning |
| G10 | **Cervical screening age-appropriateness** | Pap smears (88175) | Beneficiaries ≥65 | <0.30 | Low Pap rate in Medicare-age women (per USPSTF: stop screening at 65 if adequate prior screening) |

### Red Flag Ratios (Indicators of Billing Anomalies)

| # | Ratio/Pattern | What to Check | Threshold | What It Signals |
|---|---|---|---|---|
| R1 | **E/M upcoding signal** | 99215 / (99213+99214+99215) | >0.40 | Disproportionate use of highest-complexity E/M. OB-GYN typically skews 99213-99214. |
| R2 | **New patient overuse** | 99205 / (99203+99204+99205) | >0.50 | Excessive high-complexity new visits. May indicate upcoding on new patients. |
| R3 | **Ultrasound-without-OB** | OB ultrasound volume / OB patient volume | >5.0 | Performing far more ultrasounds than OB patients warrants. Possible over-utilization. |
| R4 | **Repeat ultrasound excess** | Follow-up US (76816) / Initial US (76805) | >3.0 | Excessive repeat imaging relative to initial scans. |
| R5 | **Global OB code inflation** | Global OB (59400) / Total deliveries | >1.20 | Billing more global OB packages than actual deliveries. |
| R6 | **NST overuse** | NSTs (59025) / OB patients | >15.0 per patient | Excessive fetal monitoring beyond clinical indication. |
| R7 | **Same-day E/M + procedure stacking** | E/M visits billed same day as procedures | >0.80 of procedures | Billing office visits on top of nearly every procedure (modifier -25 overuse). |
| R8 | **Hysteroscopy-to-biopsy bypass** | Hysteroscopy (58558) / Endometrial biopsy (58100) | >3.0 | Skipping office biopsy and going straight to OR hysteroscopy. May indicate unnecessary surgical escalation. |
| R9 | **Charge outlier concentration** | Codes where charge > p95 of peers | >30% of billed codes | Systematically charging far above peers across many codes. |
| R10 | **Single-code dominance** | Highest-volume code / total services | >0.50 | More than half of all billing from one code. Unusually narrow billing concentration. |
| R11 | **Cesarean-without-trial** | C-section (59510) / Total deliveries | >0.50 | C-section rate >50% at individual provider level (excludes MFM referrals). |
| R12 | **Modifier-25 rate** | Services with modifier -25 / Total E/M services | >0.40 | Excessive use of separate E/M on procedure days. |

### Cross-Category Consistency Checks

| # | Check | Codes That Should Go Together | Codes That Shouldn't Go Together | What Inconsistency Signals |
|---|---|---|---|---|
| C1 | **OB care completeness** | Antepartum (59426) + Delivery (59400/59410/59510) + Postpartum (59430) | Delivery without antepartum or postpartum | Provider doing deliveries without managing the pregnancy before/after |
| C2 | **Screening pathway** | Pap (88175) → Colposcopy (57452/57454) | High colposcopy with zero Pap smears | Performing diagnostic procedures without screening pathway |
| C3 | **Surgical appropriateness** | Office evaluation (99214) → Surgery (58558/58661) | Surgery without prior E/M visits | Performing surgery without documented evaluation visits |
| C4 | **Contraceptive continuum** | Counseling/insertion (58300/11982) + Removal (58301/11983) | Only removals, no insertions | Only removing contraceptives without offering replacement |
| C5 | **Ultrasound clinical context** | OB ultrasound (76801/76805) + OB care codes (59400/59426) | High OB ultrasound with zero OB care codes | Performing OB imaging without managing OB patients |
| C6 | **High-risk monitoring** | NST (59025) + Antepartum visits (59426) + Detailed US (76811) | NST without any antepartum management | Billing fetal monitoring without managing the high-risk pregnancy |
| C7 | **Postpartum care chain** | Delivery + Postpartum visit (59430) + Depression screening (96127) | Delivery with zero postpartum follow-up codes | Delivering babies without postpartum care |
| C8 | **GYN surgical cascade** | Biopsy (58100) → Hysteroscopy (58558) → Hysterectomy (58260/58262) | Hysterectomy without prior diagnostic procedures | Jumping to major surgery without diagnostic workup |

### E/M Code Distribution for OB-GYN

OB-GYN is a mixed medical-surgical specialty. Expected E/M distribution reflects a mix of routine prenatal/GYN visits and complex surgical consultations.

| E/M Code | Expected Distribution | Notes |
|---|---|---|
| 99213 (established, low) | 25-40% | Routine prenatal follow-ups, uncomplicated GYN visits |
| 99214 (established, moderate) | 35-50% | Most common — prenatal complications, GYN evaluation, results discussion |
| 99215 (established, high) | 8-20% | High-risk OB, complex GYN conditions, surgical planning |
| 99203 (new, low) | 3-8% | Initial prenatal visits (uncomplicated) |
| 99204 (new, moderate) | 5-12% | New GYN patients, initial high-risk prenatal |
| 99205 (new, high) | 2-6% | Complex new patient evaluations |

**Key difference from primary care:** OB-GYN has a higher 99214 proportion (complex prenatal care) and a moderate 99215 proportion (surgical consultations). A distribution that peaks at 99215 is abnormal for general OB-GYN.

## Ratio Score Computation

```
FOR each ratio check (G1-G10, R1-R12, C1-C8):
    IF insufficient data to compute (denominator = 0 or <5 services):
        classification = "neutral"
    ELIF ratio within expected range (green flags) or below threshold (red flags):
        classification = "green" (for G checks) or "not_triggered" (for R/C checks)
    ELSE:
        classification = "red"

green_count = green flags triggered + red flags NOT triggered + consistency checks passed
red_count = red flags triggered + green flags missed + consistency checks failed
neutral_count = checks with insufficient data
total_checks = green_count + red_count + neutral_count

ratio_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0)) / total_checks * 100
```

## Composite Billing Quality Score

```
billing_quality_score = (charge_score * 0.35) + (ratio_score * 0.65)
```

**Why 65% ratio weight:** Charge-to-allowed ratios are blunt instruments with legitimate variance. Code ratios and consistency checks are more clinically informative and specific to OB-GYN practice quality.

### Worked Examples

**Example 1: Clean billing profile (Score ~88)**

Dr. A: Charge ratio = 1.8x (normal band, charge_score = 100). 22 of 30 checks green, 3 neutral, 5 red (mild: R4 slightly elevated, C7 borderline).

- ratio_score = ((22 * 1.0) + (3 * 0.5) + (5 * 0.0)) / 30 * 100 = 78.3
- **billing_quality_score = (100 * 0.35) + (78.3 * 0.65) = 35.0 + 50.9 = 85.9**

**Example 2: Moderate billing concerns (Score ~62)**

Dr. B: Charge ratio = 3.2x (elevated band, charge_score = 70). 15 of 30 checks green, 5 neutral, 10 red (R1 upcoding, R3 ultrasound overuse, R7 modifier-25 excess, several consistency failures).

- ratio_score = ((15 * 1.0) + (5 * 0.5) + (10 * 0.0)) / 30 * 100 = 58.3
- **billing_quality_score = (70 * 0.35) + (58.3 * 0.65) = 24.5 + 37.9 = 62.4**

**Example 3: Significant billing anomalies (Score ~35)**

Dr. C: Charge ratio = 4.5x (outlier band, charge_score = 40). 8 of 30 checks green, 4 neutral, 18 red (R1, R2, R3, R6, R7, R9, R10 all triggered, multiple consistency failures).

- ratio_score = ((8 * 1.0) + (4 * 0.5) + (18 * 0.0)) / 30 * 100 = 33.3
- **billing_quality_score = (40 * 0.35) + (33.3 * 0.65) = 14.0 + 21.7 = 35.7**

---
# PART C: BUSINESS RULES
---

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has no Medicare billing data | Cannot compute billing quality. Score = null. |
| Provider bills <100 Medicare services | Below minimum threshold. Excluded from scoring. |
| Ratio check has denominator = 0 | Check classified as "neutral" (0.5 credit). |
| Ratio check has denominator <5 services | Check classified as "neutral" (insufficient volume for reliable ratio). |
| Charge data missing for a provider | Charge score = 50 (neutral). Ratio score computed normally. |

## Subspecialist Handling

| Subspecialty | Ratio Adjustments |
|---|---|
| Maternal-Fetal Medicine (207VM0101X) | Skip G1, G2, R8, C2, C8 (gynecologic checks). Adjust R6 threshold upward (NST overuse threshold = 25/patient for MFM). Expected E/M distribution shifts to higher complexity (99215 up to 30%). |
| Gynecologic Oncology (207VG0400X) | Skip G3, G4, G5, G6, R5, R6, R11, C1, C5, C6, C7 (obstetric checks). Higher charge ratios expected (surgical specialty). Adjust charge score bands upward by 0.5x. |
| Female Pelvic Medicine (207VF0040X) | Skip obstetric checks. Add pelvic floor procedure ratios. Higher surgical code concentration is expected. |

## E/M Distribution Enforcement

E/M distribution is evaluated as part of R1 and R2, not as a separate score. The thresholds account for OB-GYN's specific mix:

- 99215 exceeding 40% of established E/M → R1 triggered
- 99205 exceeding 50% of new E/M → R2 triggered
- 99213 below 15% of established E/M (when combined with 99215 > 30%) → additional upcoding signal

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. ACOG Guideline Concordance** | Whether clinical care meets evidence-based standards |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical OB-GYN |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible |
| **4. Payer Diversity** | Whether practice patterns are consistent across payers |
| **5. Billing Quality (this score)** | Whether charges, code ratios, and E/M patterns are normal — the only score that detects upcoding, charge inflation, over-utilization, and clinically inconsistent billing |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on ACOG Concordance but 35 on Billing Quality. *Interpretation:* Clinically follows ACOG guidelines but billing practices are abnormal. Could be excellent care with billing department problems, or could be upcoding/over-utilization alongside guideline compliance.

**Scenario B:** Provider scores 85 on Peer Comparison and 85 on Volume Adequacy but 40 on Billing Quality. *Interpretation:* Practice scope and volume look normal. The problem is specifically in how they bill — charge inflation, code stacking, or inconsistent procedure pairings. This is a billing integrity signal, not a clinical scope signal.

**Scenario C:** Provider scores 95 on Billing Quality but 45 on ACOG Concordance. *Interpretation:* Billing is clean and normal, but they're not following ACOG guidelines. Clean billing ≠ quality clinical care. They may be doing the wrong things correctly billed.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **Medicare-only billing data** | All ratio and charge analysis is based on Medicare claims. OB-GYN's large commercial and Medicaid populations are invisible. Ratios may differ by payer. |
| **No clinical context** | A "red flag" ratio may be clinically justified for a specific patient population. High NST volume may reflect a genuinely high-risk panel. |
| **Charge variation by geography** | Urban vs. rural charge norms differ substantially. State-level peer cohort partially controls but doesn't fully account for metro-level variation. |
| **CMS suppression** | Low-volume codes (<11 beneficiaries) are suppressed. Some ratio denominators may be understated. |
| **Modifier detail limited** | CMS file includes some modifier information but not all. Modifier-25 analysis may be incomplete. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **High-risk practice bias** | MFM referral centers have legitimately higher ultrasound and NST volumes. Red flags R3/R6 may fire incorrectly. | Subspecialist handling with adjusted thresholds |
| **Academic practice bias** | Teaching hospitals bill with different patterns (more complex E/M due to documentation requirements). | State-level cohort includes academic practices in the peer distribution |
| **New-provider bias** | New OB-GYNs may have skewed ratios in their first year (building patient panel). | Require minimum 100 services; first-year providers will naturally have limited data |
| **Solo vs. group bias** | Solo practitioners may have different E/M distributions than group practices (no partners to see routine visits). | State-level cohort includes mix of practice sizes |

## Update Cadence

- **Charge percentile bands:** Recompute annually from latest CMS data release.
- **Ratio thresholds:** Review annually with clinical input. Adjust if practice patterns shift (e.g., telehealth changes E/M distribution).
- **Green/red flag definitions:** Review annually for new code pairings or retired codes.
- **E/M distribution expectations:** Update if CMS E/M documentation guidelines change (as they did in 2021).

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
| `billing_quality_score` | float | 0-100 composite billing quality score |
| `charge_score` | float | 0-100 charge-to-allowed ratio score |
| `ratio_score` | float | 0-100 code ratio and consistency score |
| `charge_ratio` | float | Provider's average submitted charge / average Medicare allowed |
| `charge_band` | string | "normal" | "elevated" | "outlier" | "low" |
| `green_count` | integer | Number of green flag checks passed |
| `red_count` | integer | Number of red flag checks triggered |
| `neutral_count` | integer | Number of checks with insufficient data |
| `total_checks` | integer | Total checks evaluated |
| `triggered_red_flags` | JSON | List of triggered red flag IDs with details: {flag_id, ratio_value, threshold} |
| `failed_consistency` | JSON | List of failed consistency check IDs with details |
| `em_distribution` | JSON | {99213_pct, 99214_pct, 99215_pct, 99203_pct, 99204_pct, 99205_pct} |
| `peer_cohort_size` | integer | Number of providers in the peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
