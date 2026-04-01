# Otolaryngology Billing Quality Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Are this ENT provider's charges, code ratios, and E/M distribution normal?** It detects billing anomalies -- upcoding, abnormal charge-to-allowed ratios, clinically inconsistent code pairings, and procedure ratios that diverge from what a well-functioning otolaryngology practice should produce. A provider can follow AAO-HNS guidelines, carry adequate volume, and still bill in ways that signal problems. Otolaryngology is a surgical specialty with a broad scope (ear, nose, throat, head and neck), so the benchmarks here are ENT-specific -- not borrowed from primary care or other surgical specialties.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Billing Quality |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code, service count, beneficiary count, average submitted charge, average Medicare allowed amount, average Medicare payment. Contains all the fields needed to compute charge ratios, code distributions, and procedure pairings. |
| **CMS Medicaid Provider Spending** | Per-NPI total services and spending. Provides total Medicaid billing volume but lacks per-code detail. Useful for procedure ratio denominators. |
| **NPPES NPI Registry** | Taxonomy code 207Y00000X confirms otolaryngology specialty. Entity Type 1 filters to individual practitioners. |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207Y00000X (Otolaryngology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | >=100 total Medicare services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |

---

## Component 1: Charge Score (Weight: 35%)

### ENT Expected Charge-to-Allowed Ratio

The charge-to-allowed ratio measures how much a provider charges relative to what Medicare allows. This is the single bluntest instrument in the toolbox, but it catches the providers who systematically charge three or five times what everybody else charges.

**ENT charge context:** Otolaryngology is a **surgical specialty**. Charge ratios tend to be HIGHER than primary care. An internist might sit at 2.0-2.5x; an ENT doing sinus surgery and tympanoplasties will naturally sit higher. The reference distribution must be ENT-specific or the comparison is meaningless.

| Charge Pattern | Expected Ratio Range | What It Signals |
|---|---|---|
| Very low (< p10) | <1.5x | Possible under-billing, coding errors, or purely hospital-based billing |
| Normal (p25-p75) | 2.5x - 3.5x | Standard ENT practice range |
| Elevated (p75-p90) | 3.5x - 4.5x | High side -- may reflect heavy surgical mix or premium facility setting |
| Outlier (> p90) | >4.5x | Significantly above peers -- warrants investigation |

### Charge Score Computation

```
charge_ratio = total_submitted_charges / total_medicare_allowed

IF charge_ratio between p25 and p75 of ENT peer cohort:
    charge_score = 100
ELIF charge_ratio between p10 and p90 of ENT peer cohort:
    charge_score = 70
ELSE:
    charge_score = 40
```

**Three-band scoring** is intentionally coarse. Charge-to-allowed ratios have legitimate variance (urban vs. rural, academic vs. private, ASC vs. hospital-based). We flag outliers, not gradients.

---

## Component 2: Ratio Score (Weight: 65%)

The ratio score evaluates clinically meaningful code pairings and patterns. Each check is classified as **green flag** (good practice), **red flag** (anomaly), or **neutral** (insufficient data to classify).

---

### Section 2: E/M Level Distribution

ENT has a very different E/M profile from primary care. It is a referral specialty, which means a higher proportion of new patients. It is a surgical specialty, which means visits tend to be more complex. Do not apply family-medicine expectations here.

**Standard E/M codes -- expected ENT distribution:**

| E/M Code | Expected % of E/M Volume | Notes |
|---|---|---|
| 99213 (established, low complexity) | 25-35% | Less dominant than primary care. ENT sees more complex cases even for follow-ups. |
| 99214 (established, moderate complexity) | 35-45% | The DOMINANT code for ENT. Most ENT visits involve moderate-complexity decision-making: chronic sinusitis management, hearing loss workup, post-surgical follow-up. |
| 99215 (established, high complexity) | 8-15% | Higher than primary care. Complex head/neck cases, cancer surveillance, multi-system problems. |
| 99203 (new, low complexity) | 3-8% | Straightforward referrals -- earwax, simple nasal obstruction. |
| 99204 (new, moderate complexity) | 8-15% | The workhorse new-patient code. Most ENT referrals arrive with a defined problem needing moderate workup. |
| 99205 (new, high complexity) | 3-8% | Complex new patients -- head/neck mass, multi-symptom presentations. Higher than primary care because referral specialty. |

**Red flags in E/M distribution:**
- 99215 > 20% of total E/M volume -- suggests upcoding
- 99214 + 99215 combined above peer p90 -- skewing high without clinical justification
- New patient codes (99203-99205) below 10% of total E/M -- unusual for a referral specialty

**Green flag in E/M distribution:**
- Distribution closely matches the peer median across all E/M levels -- the single strongest signal of normal billing behavior

---

### Section 3: Green Flag Ratios (Indicators of Quality ENT Practice)

| # | Ratio | Numerator | Denominator | Expected Range | Clinical Rationale |
|---|---|---|---|---|---|
| G1 | **Audiometry-to-visit ratio** | Comprehensive audiometry (92557) | Total E/M visits | 0.15-0.45 | ENT should be doing audiometry on a significant portion of patients. Hearing complaints are a core ENT presentation. |
| G2 | **Endoscopy-to-visit ratio** | Nasal endoscopy (31231) | Total E/M visits | 0.10-0.35 | Nasal endoscopy is a core ENT diagnostic tool. A practice that never scopes noses is underutilizing a fundamental skill. |
| G3 | **Laryngoscopy-to-visit ratio** | Flexible laryngoscopy (31575) | Total E/M visits | 0.05-0.20 | For voice and throat complaints. Should be present at meaningful volume in any general ENT practice. |
| G4 | **Tympanometry-with-audiometry ratio** | Tympanometry (92567) | Comprehensive audiometry (92557) | 0.40-0.90 | These typically go together. When you do a hearing test, you usually do tympanometry to assess middle ear function. |
| G5 | **Bilateral audiometry ratio** | Comprehensive audiometry (92557) | (92552 + 92553 + 92557) total audiometric tests | 0.60-1.00 | Comprehensive (air + bone bilateral) should dominate over basic screening. ENT is the specialist -- they should do the full workup. |
| G6 | **Hearing test completeness** | Presence of both 92567 (tympanometry) and 92568 (acoustic reflex) when 92557 is billed | 92557 volume | Both present when 92557 > 50 services | A full audiometric workup includes tympanometry and acoustic reflexes alongside pure tone audiometry. |
| G7 | **Allergy testing breadth** | Both 95004 (percutaneous) AND 95024 (intradermal) present | Either present | Both codes billed in same year | A thorough allergy workup uses percutaneous testing first, then intradermal for equivocal results. Practices doing both demonstrate complete allergy evaluation. |
| G8 | **Screening-to-diagnosis ratio** | Screening audiometry (92551) | Comprehensive audiometry (92557) | 0.00-0.20 | ENT should predominantly do comprehensive testing (92557), not screening (92551). Screening is for primary care. Low ratio = appropriate. |

---

### Section 4: Red Flag Ratios (Indicators of Billing Anomalies)

| # | Ratio/Pattern | What to Check | Threshold | What It Signals |
|---|---|---|---|---|
| R1 | **Cerumen removal dominance** | 69210 / total E/M visits | > peer p90 | Overtreating earwax. Cerumen removal is a legitimate procedure, but when it dominates the practice profile it signals possible overuse or use as a visit-justification vehicle. |
| R2 | **Bilateral modifier abuse** | Proportion of procedures billed with modifier 50 | > peer p90 | Overuse of bilateral modifier on procedures that should typically be unilateral. Estimated from code-pair frequency in aggregate data. |
| R3 | **Nasal cautery frequency** | 30903 / total E/M visits | > peer p90 | Too many nosebleed treatments relative to visit volume. Epistaxis cautery is common but should not dominate. |
| R4 | **Allergy testing without immunotherapy** | High 95004 volume but no 95115/95117/95165 | 95004 > 200 services AND zero immunotherapy codes | Testing without treating. If a practice does extensive allergy testing but never provides immunotherapy, the testing may not be driving clinical decisions. |
| R5 | **High new-to-established ratio** | New patient E/M / total E/M | > peer p90 | May indicate coding issues (billing established patients as new) or churning patients without continuity. |
| R6 | **Audiometry without clinical context** | 92557 volume / ENT-specific E/M visits | > 0.60 | Hearing tests at more than 60% of all visits suggests possible overuse -- not every ENT visit warrants audiometry. |
| R7 | **Tonsillectomy volume outlier** | 42820 + 42826 services | > peer p90 | Tonsillectomy volume far above peers. May reflect outdated indications or aggressive surgical recommendation patterns. |
| R8 | **Return visit intensity** | Total E/M visits / unique beneficiaries | > peer p90 | Visits per beneficiary above peer p90 suggests patients are being seen more frequently than clinically necessary. |
| R9 | **After-hours billing rate** | 99051 services / total E/M visits | > peer p90 | Excessive after-hours billing relative to peers. |
| R10 | **Surgical-to-office ratio extremes** | Surgical procedure volume / total E/M visits | < peer p10 OR > peer p90 | Too heavily surgical OR too heavily office-based compared to peers. Either extreme is unusual for a general ENT practice. |
| R11 | **Vaccine product without administration** | Vaccine product codes present but no administration codes (or vice versa) | Mismatch > 20% | If applicable -- some ENT practices administer allergy vaccines. Product and administration should pair. |
| R12 | **E/M upcoding signal** | 99215 / (99213 + 99214 + 99215) | > 0.20 | Disproportionate use of highest-complexity E/M code. ENT is more complex than primary care, but 99215 at > 20% of established visits is a strong signal. |

---

### Section 5: Cross-Category Consistency Checks

| # | Check | What Should Co-Occur | What Inconsistency Signals |
|---|---|---|---|
| C1 | **Audiometry + tympanometry coherence** | High 92557 volume should co-occur with high 92567 volume | High audiometry with zero tympanometry suggests incomplete hearing evaluations or unbundling issues. |
| C2 | **Nasal endoscopy + sinus visits** | 31231 volume should correlate with sinus-related procedure codes (31254, 31256, 31267) | High endoscopy volume with zero sinus procedures (or vice versa) is clinically unusual. Endoscopy is the diagnostic gateway to sinus surgery. |
| C3 | **Laryngoscopy + voice codes** | 31575 volume should correlate with voice-related E/M context or laryngeal procedure codes | High laryngoscopy volume with no voice or laryngeal treatment codes suggests diagnostic procedures without follow-through. |
| C4 | **Allergy testing + immunotherapy** | 95004/95024 volume should correlate with 95115/95117/95165 | Testing and treatment should go together over time. A practice that tests heavily but never treats has an inconsistent profile. |
| C5 | **Hearing evaluation + hearing aid codes** | When audiometry (92557) and hearing aid evaluation (92590-92595) are both present, volumes should correlate | High audiometry with zero hearing aid evaluation (in a practice that does both) may indicate incomplete hearing care pathways. |
| C6 | **Surgical volume + pre-op evaluation** | Surgical CPT volume should correlate with E/M visit volume | High surgical volume with disproportionately low E/M suggests operating without adequate pre-operative evaluation documentation. |
| C7 | **E/M complexity + procedure volume correlation** | Higher average E/M complexity should correlate with higher procedure volumes | High E/M complexity (lots of 99215) with very low procedure volume suggests upcoding rather than genuinely complex patients. Complex ENT patients typically generate procedures. |

---

## Ratio Score Computation

```
FOR each ratio check (G1-G8, R1-R12, C1-C7):
    IF insufficient data to compute (denominator = 0 or < 5 services):
        classification = "neutral"
    ELIF ratio within expected range (green flags) or below threshold (red flags):
        classification = "green" (for G checks) or "not_triggered" (for R/C checks)
    ELSE:
        classification = "red"

green_count = green flags triggered + red flags NOT triggered + consistency checks passed
red_count = red flags triggered + green flags missed + consistency checks failed
neutral_count = checks with insufficient data
total_checks = green_count + red_count + neutral_count  # G1-G8, R1-R12, C1-C7 = 27 checks

ratio_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0)) / total_checks * 100
```

---

## Composite Billing Quality Score

```
billing_quality_score = (charge_score * 0.35) + (ratio_score * 0.65)
```

**Why 65% ratio weight:** Charge-to-allowed ratios are blunt instruments with legitimate variance (surgical mix, geographic differences, facility settings). Code ratios and consistency checks are more clinically informative and specific to ENT practice quality.

---

### Worked Examples

**Example 1: Clean billing profile (Score ~88)**

Dr. A is a general ENT in suburban Pennsylvania. Charge ratio = 2.8x (normal band, charge_score = 100). 20 of 27 checks green, 4 neutral, 3 red (mild: R6 slightly elevated audiometry rate, C5 borderline hearing aid gap, R8 borderline visit intensity).

- ratio_score = ((20 x 1.0) + (4 x 0.5) + (3 x 0.0)) / 27 x 100 = 81.5
- **billing_quality_score = (100 x 0.35) + (81.5 x 0.65) = 35.0 + 53.0 = 88.0**

**Example 2: Moderate billing concerns (Score ~59)**

Dr. B is an ENT who runs a heavy allergy practice. Charge ratio = 4.0x (elevated band, charge_score = 70). 13 of 27 checks green, 5 neutral, 9 red (R1 cerumen overuse, R4 allergy testing without immunotherapy, R5 high new-to-established ratio, R12 E/M upcoding signal, several consistency failures).

- ratio_score = ((13 x 1.0) + (5 x 0.5) + (9 x 0.0)) / 27 x 100 = 57.4
- **billing_quality_score = (70 x 0.35) + (57.4 x 0.65) = 24.5 + 37.3 = 61.8**

**Example 3: Significant billing anomalies (Score ~35)**

Dr. C is an ENT with unusual patterns. Charge ratio = 5.5x (outlier band, charge_score = 40). 7 of 27 checks green, 4 neutral, 16 red (R1, R3, R5, R6, R7, R8, R10, R12 all triggered, multiple consistency failures including C2, C4, C6, C7).

- ratio_score = ((7 x 1.0) + (4 x 0.5) + (16 x 0.0)) / 27 x 100 = 33.3
- **billing_quality_score = (40 x 0.35) + (33.3 x 0.65) = 14.0 + 21.6 = 35.6**

---
# PART C: BUSINESS RULES
---

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has no Medicare billing data | Cannot compute billing quality. Score = null. |
| Provider bills < 100 Medicare services | Below minimum threshold. Excluded from scoring. |
| Ratio check has denominator = 0 | Check classified as "neutral" (0.5 credit). |
| Ratio check has denominator < 5 services | Check classified as "neutral" (insufficient volume for reliable ratio). |
| Charge data missing for a provider | Charge score = 50 (neutral). Ratio score computed normally. |

## Per-Code Charge Analysis (Optional Detail Layer)

For providers flagged with charge_score = 40 (outlier), an optional drill-down compares per-HCPCS-code charges against the ENT peer median:

```
FOR each HCPCS code billed by the provider:
    provider_charge = average_submitted_charge for that code
    peer_median_charge = median of average_submitted_charge across ENT peer cohort for that code

    code_charge_ratio = provider_charge / peer_median_charge

    IF code_charge_ratio > 2.0:
        flag as "per-code outlier"
```

This tells you WHETHER the high overall charge ratio comes from one or two codes (maybe a high-cost surgical code) or is systematic across the board. Systematic inflation across many codes is a stronger signal than one outlier code.

## E/M Distribution Enforcement

E/M distribution is evaluated as part of R12 (upcoding signal) and the green-flag distribution match. The thresholds are calibrated for ENT, not primary care:

- ENT legitimately has higher 99214/99215 usage than family medicine
- ENT has a higher proportion of new-patient visits than most specialties (referral specialty)
- Providers whose E/M distribution closely matches the ENT peer median get credit through the green flag system

---
# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. AAO-HNS Guideline Concordance** | Whether clinical care meets evidence-based standards for sinusitis, hearing loss, etc. |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical otolaryngologist |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible for the claimed specialty |
| **4. Payer Diversity** | Whether practice patterns are consistent across Medicare, Medicaid, and other payers |
| **5. Billing Quality (this score)** | Whether charges, code ratios, and E/M distribution are normal -- the only score that detects billing anomalies like upcoding, cerumen overuse, clinically inconsistent procedure pairings, and systematic charge inflation |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on AAO-HNS Guideline Concordance but 40 on Billing Quality. *Interpretation:* Clinically appropriate care patterns but abnormal charge ratios or modifier usage. Good medicine, questionable billing practices.

**Scenario B:** Provider scores 85 on Volume Adequacy but 50 on Billing Quality. *Interpretation:* Adequate volume -- they are actually doing the procedures -- but charges and ratios signal billing irregularities. Real practice, billing concerns.

**Scenario C:** Provider scores 35 on Billing Quality but 80 on Peer Comparison. *Interpretation:* Billing breadth looks normal (right codes, right categories) but the way they bill those codes (charges, modifiers, ratios) is abnormal. Correct scope, incorrect billing patterns.

**Scenario D:** Provider scores 40 on Billing Quality with R4 (allergy testing without immunotherapy) triggered. *Interpretation:* This provider may be running an allergy testing mill -- high-volume skin testing with no treatment follow-through. Billing Quality is the only score that catches this pattern because it specifically checks for clinically coherent code pairings.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **ENT surgical procedures may not appear in physician office data** | Many ENT surgeries (tympanoplasty, septoplasty, FESS, tonsillectomy) are performed in hospital outpatient or ASC settings. The CMS physician file captures the professional component, but facility-based procedure volumes may be incomplete. Surgical ratio checks (R7, R10, C6) should be interpreted with this in mind. |
| **Charge ratios for surgical specialties are inherently higher** | ENT median charge ratios sit well above primary care. All peer comparisons MUST use ENT-specific distributions, never cross-specialty benchmarks. A 3.0x ratio that would be a red flag for a family physician is perfectly normal for an ENT. |
| **Allergy testing patterns vary by practice model** | Some ENT practices have full allergy suites with dedicated testing staff and immunotherapy programs. Others refer allergy patients to allergists. R4 and G7 should be evaluated with awareness that not all ENT practices include allergy services. |
| **E/M distribution expectations differ dramatically from primary care** | ENT sees more 99214 and 99215 visits than family medicine or internal medicine. ENT sees more new patients. Any E/M analysis must use ENT-specific benchmarks or it will generate false positives. |
| **No per-claim modifier visibility** | CMS public file provides service-level aggregates, not per-claim modifiers. Modifier 50 (bilateral) and modifier 25 (separate E/M) analysis is estimated from code-pair frequency, not directly observed. |
| **Hearing aid dispensing varies** | Some ENTs dispense hearing aids; many refer to audiologists. G8 and C5 may not apply to practices that do not include audiology services. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Subspecialty billing pattern** | Head and neck oncology surgeons will have very different profiles from general ENTs (higher E/M complexity, more surgical codes, fewer audiometry/allergy codes). | Consider subspecialty-specific thresholds for otology, rhinology, laryngology, and head/neck oncology when subspecialty taxonomy data is available. |
| **Practice setting** | Academic ENTs may have different charge ratios than private practice. Hospital-employed providers bill at facility rates. | State-level peer cohort partially controls for this. |
| **Allergy practice model** | ENTs with allergy suites will trigger G7 (allergy breadth) as a green flag; ENTs who refer out allergy will not. Neither is wrong. | Allergy-related checks (G7, R4, C4) classified as neutral when allergy testing volume < 50 services. |
| **Geographic variation** | Practice patterns, charge levels, and procedure mix vary regionally. Rural ENTs may do more cerumen removal simply because there is no other provider nearby. | State-level peer cohort is the primary control. |

## Update Cadence

- **Green/red flag definitions:** Review annually with input from otolaryngology billing compliance experts.
- **E/M distribution expectations:** Update if CMS changes documentation guidelines or ENT-specific coding rules.
- **Charge ratio bands:** Recompute percentile anchors annually from latest CMS data release.
- **New codes:** Monitor for new sinus surgery codes, new allergy immunotherapy biologics, changes to audiometry bundling rules.

---
# OUTPUT SCHEMA
---

| Field | Type | Description |
|---|---|---|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | Full name from NPPES |
| `taxonomy_code` | string | 207Y00000X (Otolaryngology) |
| `state` | string | 2-letter state code |
| `billing_quality_score` | float | 0-100 composite billing quality score |
| `charge_score` | float | 0-100 charge-to-allowed ratio score |
| `ratio_score` | float | 0-100 ratio and consistency check score |
| `charge_ratio` | float | Provider's total charges / total allowed |
| `charge_band` | string | "normal" / "elevated" / "outlier" / "very_low" |
| `em_distribution` | JSON | {code: percentage} for each E/M code billed |
| `em_distribution_match` | string | "close_to_peer" / "skewed_high" / "skewed_low" |
| `green_flag_count` | integer | Number of green flags triggered (G1-G8) |
| `red_flag_count` | integer | Number of red flags triggered (R1-R12) |
| `consistency_pass_count` | integer | Number of consistency checks passed (C1-C7) |
| `neutral_count` | integer | Number of checks with insufficient data |
| `total_checks` | integer | Total checks evaluated (27 maximum) |
| `red_flag_details` | JSON | List of triggered red flags: {flag_id, ratio_value, threshold, description} |
| `consistency_failures` | JSON | List of failed consistency checks: {check_id, description} |
| `peer_cohort_size` | integer | Number of ENT providers in the peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
