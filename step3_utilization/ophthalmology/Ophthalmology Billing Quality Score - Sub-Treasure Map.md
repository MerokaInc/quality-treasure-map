# Ophthalmology Billing Quality Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Are this ophthalmology provider's charges, code ratios, and E/M distribution normal?** It detects billing anomalies — upcoding, abnormal charge-to-allowed ratios, clinically inconsistent code pairings, and procedure ratios that diverge from what a well-functioning ophthalmology practice should produce. A provider can follow AAO guidelines and have adequate volume but still bill in ways that signal problems.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Billing Quality |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count, average submitted charge, average Medicare allowed amount, average Medicare payment. Contains all the fields needed to compute charge ratios, code distributions, and procedure pairings. |
| **CMS Medicaid Provider Spending** | Per-NPI total services and spending. Provides total Medicaid billing volume but lacks per-code detail. |
| **NPPES NPI Registry** | Taxonomy code 207W00000X confirms ophthalmology specialty. Entity Type 1 filters to individual practitioners. |
| **CMS Medicare Part D Prescribers — by Provider** | Per-NPI brand vs. generic ratio, opioid prescribing rate, total drug costs. Enables post-surgical opioid stewardship checks and cost-consciousness signals. |
| **CMS Medicare Part D Prescribers — by Provider and Drug** | Per-NPI per-drug prescribing detail. Enables drug cost pattern analysis (e.g., brand-name glaucoma drops when generics exist). |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207W00000X (Ophthalmology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |

## Component 1: Charge Score (Weight: 35%)

### Ophthalmology Expected Charge-to-Allowed Ratio

The charge-to-allowed ratio measures how much a provider charges relative to what Medicare allows. Ophthalmology is a mixed medical-surgical specialty with significant procedural revenue.

**Ophthalmology charge context:** Ophthalmology has moderate-to-high charge ratios — higher than primary care (significant surgical volume including cataract surgery) but mixed because of high E/M and diagnostic testing volume alongside procedures. Intravitreal injection drug costs add a separate dimension.

| Charge Pattern | Expected Ratio Range | What It Signals |
|---|---|---|
| Very low (< p10) | <1.3x | Possible under-billing or coding errors |
| Normal (p25-p75) | 1.5x - 2.8x | Standard ophthalmology practice |
| Elevated (p75-p90) | 2.8x - 4.0x | High side — may reflect surgical mix or premium IOL practice |
| Outlier (> p90) | >4.0x | Significantly above peers — warrants investigation |

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

**Three-band scoring** is intentionally coarse. Charge-to-allowed ratios have legitimate variance (urban vs. rural, academic vs. private, ASC vs. hospital-based). We flag outliers, not gradients.

## Component 2: Ratio Score (Weight: 65%)

The ratio score evaluates clinically meaningful code pairings and patterns. Each check is classified as **green flag** (good practice), **red flag** (anomaly), or **neutral** (insufficient data to classify).

### Green Flag Ratios (Indicators of Quality Ophthalmology Practice)

| # | Ratio | Numerator | Denominator | Expected Range | Clinical Rationale |
|---|---|---|---|---|---|
| G1 | **Biometry-to-cataract ratio** | Ophthalmic biometry (92136+76519) | Cataract surgeries (66984+66982) | 0.80-1.20 | Pre-op biometry should be performed for virtually every cataract. Ratio near 1.0 indicates complete pre-op workup. |
| G2 | **OCT-to-injection ratio** | Retinal OCT (92134) | Intravitreal injections (67028) | 0.30-1.00 | OCT should guide injection treatment decisions. Ratio indicates monitoring frequency per injection. |
| G3 | **Visual field-to-glaucoma visit ratio** | Visual fields (92083) | Glaucoma-related E/M visits (proxy: 92133 volume) | 0.30-0.80 | Visual field testing 1-2x per year for monitored glaucoma patients. |
| G4 | **OCT nerve-to-OCT retina ratio** | Optic nerve OCT (92133) | Retinal OCT (92134) | 0.20-2.00 | Both types of OCT should be present in a practice managing glaucoma AND retinal disease. |
| G5 | **SLT-to-glaucoma monitoring ratio** | SLT (65855) | Glaucoma OCT (92133) | 0.02-0.15 | SLT should be a fraction of total glaucoma management — most visits are monitoring, not laser. |
| G6 | **Fundus photo-to-retina patient ratio** | Fundus photography (92250) | Retinal disease patients (proxy: 67028 beneficiaries + 92134 beneficiaries) | 0.10-0.60 | Fundus photography for documentation in a fraction of retinal disease patients. |
| G7 | **FA-to-injection ratio** | Fluorescein angiography (92235) | Intravitreal injections (67028) | 0.01-0.10 | FA is diagnostic, not routine monitoring. Should be a small fraction of injection volume. |
| G8 | **Post-cataract follow-up pattern** | YAG capsulotomy (66821) | Cataract surgeries (66984+66982) | 0.05-0.25 | YAG rate of 5-25% within a year is expected for posterior capsule opacification. |
| G9 | **Comprehensive-to-intermediate exam ratio** | Comprehensive exams (92014+92004) | Intermediate exams (92012) | 0.50-3.00 | A mix of exam types appropriate to patient acuity. |
| G10 | **Diagnostic testing breadth** | Distinct diagnostic test CPTs billed (92133, 92134, 92083, 92250, 92235) | Total distinct CPTs | ≥3 distinct test codes | Offering multiple diagnostic modalities signals comprehensive care. |
| G11 | **Post-surgical opioid stewardship** | Opioid prescribing rate (`Opioid_Prscrbr_Rate` from Part D) | Peer ophthalmology median | <peer_p50 | Low opioid prescribing rate relative to peers signals appropriate post-cataract pain management (most cataract patients should not need opioids). Source: CMS Part D by Provider. |
| G12 | **Glaucoma Rx generic rate** | Generic glaucoma drug claims / total glaucoma drug claims (from Part D by Provider and Drug) | Total glaucoma Rx claims | 0.50-1.00 | High generic utilization for glaucoma medications signals cost-effective, formulary-concordant prescribing. |

### Red Flag Ratios (Indicators of Billing Anomalies)

| # | Ratio/Pattern | What to Check | Threshold | What It Signals |
|---|---|---|---|---|
| R1 | **Complex cataract overuse** | 66982 / (66982+66984) | >0.25 | Complex cataract rate >25% far exceeds the national benchmark of 10-15%. Strong upcoding signal. |
| R2 | **E/M upcoding signal** | 99215 / (99213+99214+99215) | >0.35 | Disproportionate use of highest-complexity E/M. Ophthalmology typically skews 99213-99214. |
| R3 | **Comprehensive exam overuse** | 92014 / (92012+92014) | >0.85 | Billing comprehensive exam at nearly every visit. Not all established patients need comprehensive evaluation. |
| R4 | **OCT overutilization** | 92134 / total E/M visits | >0.80 | Billing retinal OCT at >80% of visits. Even retina specialists don't OCT every patient every time. |
| R5 | **Visual field overutilization** | 92083 / total E/M visits | >0.50 | Visual fields at >50% of all visits. Should be primarily for glaucoma patients, 1-2x/year. |
| R6 | **Modifier -25 overuse** | Services with modifier -25 / total E/M services | >0.40 | Excessive use of separate E/M on procedure days. Major ophthalmology audit target. |
| R7 | **Same-day injection + E/M stacking** | E/M billed same day as 67028 / total 67028 | >0.80 | Billing office visits on top of nearly every injection visit. The injection E/M must be separately identifiable. |
| R8 | **Injection volume outlier** | 67028 services per year | >3000 | Extremely high injection volume (>60/week) raises questions about quality and appropriate monitoring. |
| R9 | **Charge outlier concentration** | Codes where charge > p95 of peers | >30% of billed codes | Systematically charging far above peers across many codes. |
| R10 | **Single-code dominance** | Highest-volume code / total services | >0.50 | More than half of all billing from one code. Unusually narrow billing concentration. |
| R11 | **MIGS-without-cataract** | 66183 without same-day 66984 | >0.10 | MIGS devices are typically implanted during cataract surgery. Standalone MIGS is unusual and may warrant review. |
| R12 | **Fundus photo overutilization** | 92250 / total E/M visits | >0.40 | Routine fundus photography at >40% of visits without clinical indication signals overutilization. |
| R13 | **Drug cost outlier (injected + prescribed)** | Average drug payment (J-codes from Medicare claims + total drug cost from Part D) vs. peer median | >p90 | Systematically using the most expensive anti-VEGF agents AND prescribing brand-name drops when generics exist. Combined signal from both CMS Medicare claims (intravitreal drugs) and Part D (prescribed medications). |
| R14 | **Opioid prescribing outlier** | Opioid prescribing rate (`Opioid_Prscrbr_Rate` from Part D) | >peer_p90 | Ophthalmology is a low-opioid specialty. Rates in the top decile warrant review — most ophthalmic procedures require only topical anesthesia and OTC analgesics. Source: CMS Part D by Provider. |

### Cross-Category Consistency Checks

| # | Check | Codes That Should Go Together | Codes That Shouldn't Go Together | What Inconsistency Signals |
|---|---|---|---|---|
| C1 | **Cataract surgical completeness** | Biometry (92136) + Cataract surgery (66984) + Post-op management | Cataract surgery without biometry | Operating without measuring the eye for IOL implant |
| C2 | **Glaucoma monitoring pathway** | OCT nerve (92133) + Visual fields (92083) | One without the other at sustained volume | Glaucoma monitoring requires both structural (OCT) and functional (VF) testing. Missing one suggests incomplete care. |
| C3 | **Injection treatment context** | Injections (67028) + OCT retina (92134) + E/M visit | High injection volume with zero OCT | Injecting without monitoring response to treatment |
| C4 | **Retinal disease diagnostic pathway** | FA (92235) + Injections (67028) or Laser (67210/67228) | FA without treatment codes | Performing diagnostic angiography without managing the disease found |
| C5 | **Surgical cascade appropriateness** | Office evaluation → Diagnostic testing → Surgical procedure | Cataract surgery (66984) without any E/M visits | Performing surgery without documented evaluation |
| C6 | **Glaucoma treatment escalation** | SLT (65855) before MIGS (66183) before trabeculectomy (66170) | Trabeculectomy without prior SLT or MIGS | Jumping to major surgery without stepwise treatment. Some cases warrant this, but as a pattern it's a flag. |
| C7 | **OCT context** | OCT (92133/92134) + corresponding E/M or procedure visit | High OCT volume with disproportionately low E/M | Billing diagnostic tests without corresponding clinical encounters |
| C8 | **YAG capsulotomy context** | YAG (66821) preceded by cataract surgery (66984) | YAG volume exceeding cataract volume by >50% | More capsulotomies than cataracts is biologically implausible from a single provider's practice |

### E/M Code Distribution for Ophthalmology

Ophthalmology uses both standard E/M codes (99213-99215) and eye-specific exam codes (92012, 92014). Expected distributions:

**Standard E/M codes (when used):**

| E/M Code | Expected Distribution | Notes |
|---|---|---|
| 99213 (established, low) | 30-45% | Stable glaucoma follow-ups, routine post-op checks |
| 99214 (established, moderate) | 35-50% | Most common — AMD monitoring, diabetic eye exams, glaucoma medication adjustments |
| 99215 (established, high) | 5-15% | New diagnoses with complex management planning, multimorbid patients |
| 99203 (new, low) | 3-8% | Routine referral evaluations |
| 99204 (new, moderate) | 5-12% | New patient with established disease |
| 99205 (new, high) | 1-5% | Complex new patients (multiple ocular conditions) |

**Eye exam codes:**

| Eye Exam Code | Expected Distribution | Notes |
|---|---|---|
| 92012 (intermediate, established) | 20-40% | Focused follow-up — stable conditions, single-issue visits |
| 92014 (comprehensive, established) | 40-60% | Full evaluation — dilated exam, multiple conditions |
| 92004 (comprehensive, new) | 5-15% | New patient comprehensive evaluation |

**Key difference from other specialties:** Ophthalmology's dual coding system (92xxx vs. 99xxx) means E/M distribution analysis must account for which system the practice uses. Some practices use exclusively 92xxx, some exclusively 99xxx, some mix. All are valid.

## Ratio Score Computation

```
FOR each ratio check (G1-G10, R1-R13, C1-C8):
    IF insufficient data to compute (denominator = 0 or <5 services):
        classification = "neutral"
    ELIF ratio within expected range (green flags) or below threshold (red flags):
        classification = "green" (for G checks) or "not_triggered" (for R/C checks)
    ELSE:
        classification = "red"

green_count = green flags triggered + red flags NOT triggered + consistency checks passed
red_count = red flags triggered + green flags missed + consistency checks failed
neutral_count = checks with insufficient data
total_checks = green_count + red_count + neutral_count  # G1-G12, R1-R14, C1-C8 = 34 checks

ratio_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0)) / total_checks * 100
```

## Composite Billing Quality Score

```
billing_quality_score = (charge_score * 0.35) + (ratio_score * 0.65)
```

**Why 65% ratio weight:** Charge-to-allowed ratios are blunt instruments with legitimate variance. Code ratios and consistency checks are more clinically informative and specific to ophthalmology practice quality.

### Worked Examples

**Example 1: Clean billing profile (Score ~87)**

Dr. A: Charge ratio = 2.0x (normal band, charge_score = 100). 26 of 34 checks green, 4 neutral, 4 red (mild: R4 slightly elevated, C7 borderline).

- ratio_score = ((26 × 1.0) + (4 × 0.5) + (4 × 0.0)) / 34 × 100 = 82.4
- **billing_quality_score = (100 × 0.35) + (82.4 × 0.65) = 35.0 + 53.6 = 88.6**

**Example 2: Moderate billing concerns (Score ~60)**

Dr. B: Charge ratio = 3.5x (elevated band, charge_score = 70). 17 of 34 checks green, 6 neutral, 11 red (R1 complex cataract overuse, R6 modifier-25 excess, R7 injection stacking, R14 opioid outlier, several consistency failures).

- ratio_score = ((17 × 1.0) + (6 × 0.5) + (11 × 0.0)) / 34 × 100 = 58.8
- **billing_quality_score = (70 × 0.35) + (58.8 × 0.65) = 24.5 + 38.2 = 62.7**

**Example 3: Significant billing anomalies (Score ~34)**

Dr. C: Charge ratio = 5.0x (outlier band, charge_score = 40). 9 of 34 checks green, 5 neutral, 20 red (R1, R2, R4, R6, R7, R8, R9, R13, R14 all triggered, multiple consistency failures).

- ratio_score = ((9 × 1.0) + (5 × 0.5) + (20 × 0.0)) / 34 × 100 = 33.8
- **billing_quality_score = (40 × 0.35) + (33.8 × 0.65) = 14.0 + 22.0 = 36.0**

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
| **Retina/Vitreoretinal (207WX0107X)** | Skip G1, G8, R1, R11, C1, C5 (cataract checks). Adjust R8 threshold upward (injection volume threshold = 5000 for high-volume retina). Expected E/M distribution shifts to higher complexity. G2 (OCT-to-injection) becomes primary quality signal. |
| **Glaucoma Specialist (207WX0009X)** | Skip G2, G6, G7, R7, R8, C3, C4 (retinal procedure checks). G3 and G5 become primary signals. R5 threshold adjusted upward (VF rate expected higher in glaucoma-focused practice). |
| **Cornea/External Disease (207WX0120X)** | Skip retinal and glaucoma procedure checks. Focus on cataract quality metrics (G1, G8, R1). Add corneal transplant-specific checks if volume is sufficient. |
| **Oculoplastics (207WX0200X)** | Exclude from general billing quality scoring. Practice pattern too specialized. Score = null with flag. |

## E/M Distribution Enforcement

E/M distribution is evaluated as part of R2 and R3, not as a separate score. The thresholds account for ophthalmology's specific characteristics:

- Dual coding systems (92xxx and 99xxx) are both valid
- Providers using primarily eye exam codes (92012/92014) should not be evaluated on 99xxx distribution
- Providers using primarily E/M codes should not be evaluated on 92xxx distribution
- When a provider uses both systems, evaluate each independently

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. AAO Guideline Concordance** | Whether clinical care meets evidence-based standards |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical ophthalmologist |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible |
| **4. Payer Diversity** | Whether practice patterns are consistent across payers |
| **5. Billing Quality (this score)** | Whether charges, code ratios, and E/M distribution are normal — the only score that detects billing anomalies like upcoding, modifier abuse, and clinically inconsistent procedure pairings |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on AAO Guideline Concordance but 40 on Billing Quality. *Interpretation:* Clinically appropriate care patterns but abnormal charge ratios or modifier usage. Good medicine, questionable billing practices.

**Scenario B:** Provider scores 85 on Volume Adequacy but 50 on Billing Quality. *Interpretation:* Adequate volume — they're actually doing the procedures — but charges and ratios signal billing irregularities. Real practice, billing concerns.

**Scenario C:** Provider scores 35 on Billing Quality but 80 on Peer Comparison. *Interpretation:* Billing breadth looks normal (right codes, right categories) but the way they bill those codes (charges, modifiers, ratios) is abnormal. Correct scope, incorrect billing patterns.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **No per-claim modifier visibility** | CMS public file provides service-level aggregates, not per-claim modifiers. Modifier -25 and -59 analysis is estimated from code-pair frequency, not directly observed. |
| **Drug cost variation** | Anti-VEGF drug costs vary dramatically (bevacizumab ~$50 vs. aflibercept ~$1,800). Part D adds prescribed medication cost data. R13 (drug cost outlier) now combines injected drug costs (J-codes from Medicare claims) with prescribed drug costs (Part D), but may still flag legitimate clinical decisions. |
| **ASC facility fee invisible** | Physician-owned ASC facility fees are billed separately and not linked to the provider's professional NPI in CMS data. Cannot fully assess facility-professional billing patterns. |
| **92xxx vs. E/M ambiguity** | The dual coding system in ophthalmology makes E/M distribution analysis more complex. Must handle both coding paradigms. |
| **Global period suppression** | Post-cataract care within the 90-day global period is bundled. Cannot directly observe post-operative visit billing patterns. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Subspecialty billing pattern** | Retina specialists will trigger R8 (injection volume) and R10 (single-code dominance) at higher rates. This reflects their practice, not billing abuse. | Subspecialist-specific thresholds. |
| **Practice setting** | Academic ophthalmologists may have different charge ratios than private practice. Hospital-based providers charge at facility rates. | State-level peer cohort partially controls. |
| **Drug choice is clinical** | Anti-VEGF drug choice (bevacizumab vs. branded agents) has financial implications but is a legitimate clinical decision. R13 is a cost signal, not a quality signal. | R13 is flagged for review, not automatically penalized in the ratio score. |
| **Geographic variation** | Practice patterns, charge levels, and modifier usage vary regionally. | State-level peer cohort is the primary control. |

## Update Cadence

- **Green/red flag definitions:** Review annually with input from ophthalmology billing compliance experts.
- **E/M distribution expectations:** Update if CMS changes documentation guidelines or ophthalmology-specific coding rules.
- **Charge ratio bands:** Recompute percentile anchors annually from latest CMS data release.
- **New codes:** Monitor for new MIGS devices, new anti-VEGF agents (new J-codes), new diagnostic modalities.

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
| `ratio_score` | float | 0-100 ratio and consistency check score |
| `charge_ratio` | float | Provider's average charge / average allowed |
| `charge_band` | string | "normal" | "elevated" | "outlier" | "very_low" |
| `green_flag_count` | integer | Number of green flags triggered |
| `red_flag_count` | integer | Number of red flags triggered |
| `neutral_count` | integer | Number of checks with insufficient data |
| `total_checks` | integer | Total checks evaluated |
| `red_flag_details` | JSON | List of triggered red flags: {flag_id, ratio_value, threshold, description} |
| `consistency_failures` | JSON | List of failed consistency checks: {check_id, description} |
| `peer_cohort_size` | integer | Number of providers in the peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
