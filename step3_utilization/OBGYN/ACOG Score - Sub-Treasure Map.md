# OB-GYN ACOG Guideline Concordance: A Sub-Treasure Map

## What This Document Does

This score answers: **Does this OB-GYN provider follow the American College of Obstetricians and Gynecologists (ACOG) clinical guidelines?** It maps all 45 ACOG guidelines to available data sources, identifies which are scorable from public data, organizes them into 6 clinical domains, and produces a 0-100 composite score reflecting guideline adherence.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | Level | What It Gives Us |
|---|---|---|
| **CMS Medicare Physician & Other Practitioners** | Provider | HCPCS codes, service counts, beneficiary counts, charges, payments for individual OB-GYN NPIs billing Medicare |
| **CMS Medicaid Provider Spending** | Provider | Total services, beneficiaries, and spending per NPI for Medicaid enrollees |
| **NPPES NPI Registry** | Provider | Taxonomy code 207V00000X (OB-GYN), subspecialty codes, entity type, state, credentialing |
| **CMS Care Compare** | Facility | Severe maternal morbidity (PC-07), patient safety indicators, hospital-level quality measures |
| **Leapfrog Group** | Facility | NTSV C-section rate, episiotomy rate, exclusive breastfeeding, newborn complications |
| **Joint Commission** | Facility | PC-02 (NTSV C-section), PC-05 (exclusive breastfeeding), PC-06 (newborn complications) |
| **CDC WONDER** | State/County | Preterm birth rate, low birthweight rate, prenatal care timing |
| **HEDIS (published reports)** | Plan-level | Prenatal/postpartum care, depression screening, cervical cancer screening, contraceptive care |
| **CHIA Case Mix** | Facility/Provider | Discharge data with ICD-10/DRG for obstetric admissions (MA-specific) |
| **MPQC** | Facility | AIM bundle compliance — hemorrhage and hypertension protocols (participating hospitals) |

## 2. What's Scorable vs. Not Scorable

### Summary by Domain

| Domain | Total Guidelines | Scorable (T1/T2) | Not Scorable (T3 only) | Why Not Scorable |
|---|---|---|---|---|
| **Labor & Delivery** | 10 | 8 | 2 | Macrosomia documentation and levels-of-care compliance require chart review |
| **Prenatal Care** | 10 | 6 | 4 | HbA1c monitoring, aneuploidy offering, folic acid counseling, aspirin prophylaxis require Rx/chart data |
| **Maternal Safety** | 8 | 5 | 3 | VTE assessment, hemorrhage drills, and mortality review participation require attestation |
| **Postpartum Care** | 6 | 5 | 1 | Breastfeeding support program is binary attestation |
| **Gynecologic Care** | 6 | 3 | 3 | Adnexal mass imaging, AUB evaluation, and LARC counseling require chart-level data |
| **Equity & Mental Health** | 5 | 0 | 5 | All require self-attestation or internal process documentation |
| **TOTAL** | **45** | **27** | **18** | |

### Full Guideline-by-Guideline Audit

#### Labor & Delivery

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| ACOG-OCC-1 | NTSV C-section rate | YES | T1 | Leapfrog | — |
| ACOG-PB-205 | VBAC attempt rate | YES | T1 | CHIA Case Mix | — |
| ACOG-PB-205-SUCCESS | VBAC success rate | YES | T1 | CHIA Case Mix | — |
| ACOG-PB-198 | 3rd/4th degree laceration rate | YES | T1 | CHIA Case Mix | — |
| ACOG-PB-198-EPIS | Episiotomy rate | YES | T1 | Leapfrog | — |
| ACOG-CO-766 | Elective induction <39 wks | YES | T2 | CHIA Case Mix | Proxy via DRG timing |
| ACOG-CO-766-AUGMENT | Augmentation use rate | YES | T2 | CHIA Case Mix | Proxy via procedure codes |
| TJC-PC-02 | NTSV C-section (JC) | YES | T1 | Joint Commission | — |
| ACOG-PB-216 | Macrosomia documentation | NO | T3 | Self-attestation | Requires estimated fetal weight in chart |
| ACOG-OCC-2 | Levels of maternal care | NO | T3 | Self-attestation | Compliance is self-reported designation |

#### Prenatal Care

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| ACOG-PB-190 | GDM screening rate | YES | T1 | CHIA Case Mix | — |
| ACOG-PB-222 | Aspirin prophylaxis (preeclampsia) | YES | T2 | CHIA Case Mix | Proxy via Dx codes, no Rx data |
| ACOG-PB-171 | Antenatal corticosteroid rate | YES | T1 | CHIA Case Mix | — |
| ACOG-PB-188 | GBS prophylaxis rate | YES | T2 | CHIA Case Mix | Proxy via procedure codes |
| ACOG-PRENATAL-TIMING | First trimester prenatal care | YES | T2 | CDC WONDER | State/county level proxy |
| ACOG-PB-171-PROXY | Preterm birth rate | YES | T2 | CDC WONDER | Outcome proxy, not direct measure |
| ACOG-OUTCOME-LBW | Low birthweight rate | NO | T3 | Self-attestation | — |
| ACOG-PB-226 | Aneuploidy screening offering | NO | T3 | Self-attestation | Requires counseling documentation |
| ACOG-PB-201 | HbA1c monitoring | NO | T3 | Self-attestation | Requires lab values not in claims |
| ACOG-PB-187 | Folic acid counseling | NO | T3 | Self-attestation | Requires counseling documentation |

#### Maternal Safety

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| ACOG-PB-183 | Hemorrhage protocol | YES | T1 | MPQC | — |
| ACOG-CO-794 | QBL measurement rate | YES | T1 | MPQC | — |
| ACOG-AIM-HTN | Severe HTN time-to-treatment | YES | T1 | MPQC | — |
| CMS-PC-07 | Severe maternal morbidity | YES | T1 | CMS Care Compare | — |
| TJC-PC-06 | Unexpected newborn complications | YES | T1 | Leapfrog | — |
| ACOG-PB-196 | VTE risk assessment | NO | T3 | Self-attestation | Requires chart review |
| ACOG-AIM-HEMORRHAGE | Hemorrhage drill compliance | NO | T3 | Self-attestation | Requires internal process documentation |
| ACOG-MATERNAL-MORTALITY | Mortality review participation | NO | T3 | Self-attestation | Requires committee membership proof |

#### Postpartum Care

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| ACOG-CO-736 | Postpartum visit completion | YES | T1 | HEDIS PPC | — |
| ACOG-CO-757 | Depression screening rate | YES | T1 | HEDIS PRS-E | — |
| ACOG-CO-670 | Postpartum contraceptive care | YES | T1 | HEDIS CCP | — |
| TJC-PC-05 | Exclusive breast milk feeding | YES | T1 | Leapfrog | — |
| ACOG-CO-736-TIMING | Early postpartum visit (3 wks) | YES | T2 | HEDIS PPC | Proxy via visit timing window |
| ACOG-BREASTFEEDING | Breastfeeding support program | NO | T3 | Self-attestation | Binary attestation |

#### Gynecologic Care

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| ACOG-PB-168 | Cervical cancer screening | YES | T1 | HEDIS CCS | — |
| ACOG-CO-701 | Minimally invasive hysterectomy | YES | T1 | CHIA Case Mix | — |
| ACOG-PB-195 | Surgical antibiotic prophylaxis | YES | T2 | CHIA Case Mix | Proxy via procedure + admin codes |
| ACOG-PB-174 | Adnexal mass imaging | NO | T3 | Self-attestation | Requires imaging order review |
| ACOG-PB-128 | AUB evaluation documentation | NO | T3 | Self-attestation | Requires chart documentation |
| ACOG-LARC | LARC counseling rate | NO | T3 | Self-attestation | HEDIS tracks provision, not counseling directly |

#### Equity & Mental Health

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| ACOG-CO-649 | Racial disparity stratification | NO | T3 | Self-attestation | Internal process |
| ACOG-CO-711 | Opioid screening (SBIRT) | NO | T3 | Self-attestation | Screening documentation |
| ACOG-CO-825 | Implicit bias training | NO | T3 | Self-attestation | Training completion records |
| ACOG-CO-726 | Health literacy communication | NO | T3 | Self-attestation | Communication process docs |
| ACOG-EQUITY-STRATIFICATION | Outcome reporting by race | NO | T3 | Self-attestation | Internal reporting process |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207V00000X (Obstetrics & Gynecology) |
| **Subspecialty codes** | 207VB0002X (Bariatric Medicine), 207VC0200X (Critical Care), 207VE0102X (Reproductive Endocrinology), 207VF0040X (Female Pelvic Medicine), 207VG0400X (Gynecologic Oncology), 207VH0002X (Hospice/Palliative), 207VM0101X (Maternal-Fetal Medicine) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥50 total obstetric + gynecologic services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |
| **Exclusions** | Subspecialists flagged separately (see Business Rules) |

## Domains and Measures

### Domain 1: Labor & Delivery (Weight: 25%)

Measures obstetric surgical and intervention practices.

| Measure | ACOG Source | Metric | Direction | Target | Worst | Tier |
|---|---|---|---|---|---|---|
| NTSV C-section rate | OCC #1 | % | Lower is better | 23.9% | 40.0% | T1 |
| VBAC attempt rate | PB #205 | % | Higher is better | 60.0% | 20.0% | T1 |
| VBAC success rate | PB #205 | % | Higher is better | 75.0% | 40.0% | T1 |
| 3rd/4th degree laceration rate | PB #198 | % | Lower is better | 3.0% | 8.0% | T1 |
| Episiotomy rate | PB #198 | % | Lower is better | 5.0% | 15.0% | T1 |
| Elective induction <39 wks | CO #766 | % | Lower is better | 2.0% | 10.0% | T2 |
| Augmentation use rate | CO #766 | % | Lower is better | 20.0% | 40.0% | T2 |
| NTSV C-section (JC) | TJC PC-02 | % | Lower is better | 23.9% | 40.0% | T1 |

### Domain 2: Prenatal Care (Weight: 20%)

Measures screening, prophylaxis, and preventive care during pregnancy.

| Measure | ACOG Source | Metric | Direction | Target | Worst | Tier |
|---|---|---|---|---|---|---|
| GDM screening rate | PB #190 | % | Higher is better | 95.0% | 70.0% | T1 |
| Aspirin prophylaxis (preeclampsia) | PB #222 | % | Higher is better | 90.0% | 50.0% | T2 |
| Antenatal corticosteroid rate | PB #171 | % | Higher is better | 95.0% | 70.0% | T1 |
| GBS prophylaxis rate | PB #188 | % | Higher is better | 95.0% | 75.0% | T2 |
| First trimester prenatal care | Prenatal Guidelines | % | Higher is better | 90.0% | 60.0% | T2 |
| Preterm birth rate (proxy) | PB #171 | % | Lower is better | 8.0% | 14.0% | T2 |

### Domain 3: Maternal Safety (Weight: 20%)

Measures emergency preparedness, protocol adherence, and adverse outcome rates.

| Measure | ACOG Source | Metric | Direction | Target | Worst | Tier |
|---|---|---|---|---|---|---|
| Hemorrhage protocol in place | PB #183 | Binary | Higher is better | — | — | T1 |
| QBL measurement rate | CO #794 | % | Higher is better | 90.0% | 50.0% | T1 |
| Severe HTN time-to-treatment | AIM Bundle | % | Higher is better | 90.0% | 50.0% | T1 |
| Severe maternal morbidity | CMS PC-07 | per 10k | Lower is better | 8.0 | 20.0 | T1 |
| Unexpected newborn complications | TJC PC-06 | per 1k | Lower is better | 2.0 | 5.0 | T1 |

### Domain 4: Postpartum Care (Weight: 15%)

Measures continuity of care, mental health screening, and family planning after delivery.

| Measure | ACOG Source | Metric | Direction | Target | Worst | Tier |
|---|---|---|---|---|---|---|
| Postpartum visit completion | CO #736 | % | Higher is better | 90.0% | 60.0% | T1 |
| Depression screening rate | CO #757 | % | Higher is better | 90.0% | 50.0% | T1 |
| Postpartum contraceptive care | CO #670 | % | Higher is better | 80.0% | 40.0% | T1 |
| Exclusive breast milk feeding | TJC PC-05 | % | Higher is better | 80.0% | 50.0% | T1 |
| Early postpartum visit (3 wks) | CO #736 | % | Higher is better | 70.0% | 30.0% | T2 |

### Domain 5: Gynecologic Care (Weight: 10%)

Measures preventive screening and surgical quality in non-obstetric gynecologic practice.

| Measure | ACOG Source | Metric | Direction | Target | Worst | Tier |
|---|---|---|---|---|---|---|
| Cervical cancer screening | PB #168 | % | Higher is better | 85.0% | 50.0% | T1 |
| Minimally invasive hysterectomy | CO #701 | % | Higher is better | 70.0% | 30.0% | T1 |
| Surgical antibiotic prophylaxis | PB #195 | % | Higher is better | 95.0% | 75.0% | T2 |

### Domain 6: Equity & Mental Health (Weight: 10%)

All 5 guidelines in this domain are T3 (self-attestation). This domain is scored only when self-attestation data is submitted. When absent, its 10% weight redistributes proportionally to other domains.

## Scoring Formula

### Per-Guideline Raw Score (Threshold-Based)

```
IF direction = "lower_is_better":
    IF metric_value <= target:
        raw_score = 100
    ELSE:
        raw_score = max(0, 100 - ((metric_value - target) / (worst - target)) * 100)

IF direction = "higher_is_better":
    IF metric_value >= target:
        raw_score = 100
    ELSE:
        raw_score = max(0, 100 - ((target - metric_value) / (target - worst)) * 100)

IF scoring_method = "binary":
    raw_score = 100 if compliant else 0
```

### Tier-Adjusted Score

```
adjusted_score = raw_score * tier_multiplier

WHERE tier_multiplier:
    T1 = 1.00
    T2 = 0.75
    T3 = 0.50
```

### Domain Roll-Up

```
domain_score = sum(adjusted_score_i * clinical_weight_i) / sum(clinical_weight_i)
```

All clinical weights default to 1.0 (equal weight within domain). Refinable with clinical advisor input.

### Worked Examples

**Example 1: High-performing OB-GYN (Score ~88)**

Provider A at a facility with: NTSV C-section 20% (score=100), VBAC attempt 65% (100), laceration 2.5% (100), episiotomy 4% (100), GDM screening 97% (100), postpartum visit 92% (100), depression screening 85% (87.5), cervical screening 88% (100).

- Labor & Delivery domain: ~100 (all T1, full credit)
- Prenatal domain: ~95
- Postpartum domain: ~94
- Composite: 0.25(100) + 0.20(95) + 0.20(85) + 0.15(94) + 0.10(80) + 0.10(0 redistributed) = **~88**

**Example 2: Average OB-GYN (Score ~65)**

Provider B: NTSV C-section 30% (score=62), VBAC attempt 40% (50), laceration 5% (40), episiotomy 10% (50), GDM screening 82% (48), postpartum visit 75% (50), depression screening 65% (37.5).

- Labor & Delivery domain: ~55
- Prenatal domain: ~48
- Postpartum domain: ~52
- Composite: **~52** (mostly T1 data, scores reflect real performance gaps)

**Example 3: Limited-data OB-GYN (Score ~45)**

Provider C: Only facility-level data available (Leapfrog + CMS). NTSV C-section 35% (score=31), episiotomy 12% (30), severe morbidity 15/10k (score=42). 3 of 6 domains scored. Coverage: 15%.

- Composite: ~35 with low coverage flag
- **Interpretation:** Score is real but narrow — reflects only what's measurable.

---
# PART C: BUSINESS RULES
---

## Composite Formula

```
composite_score = sum(domain_score_j * domain_weight_j) / sum(active_domain_weights)
```

| Domain | Weight |
|---|---|
| Labor & Delivery | 25% |
| Prenatal Care | 20% |
| Maternal Safety | 20% |
| Postpartum Care | 15% |
| Gynecologic Care | 10% |
| Equity & Mental Health | 10% |

**When a domain has insufficient data** (fewer than 2 guidelines with T1/T2 data), its weight redistributes proportionally to scored domains.

## Domain Sufficiency Rule

A domain is scored only if **≥2 guidelines within it have T1 or T2 data**. This prevents a single data point from representing an entire clinical area.

## Composite Sufficiency Rule

A composite score is generated only if **≥3 of 6 domains** meet the domain sufficiency threshold. Otherwise, the provider receives individual domain scores only (no composite).

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Guideline has no data for this provider | Excluded from domain calculation; does not penalize or help |
| Domain has <2 scored guidelines | Domain not scored; weight redistributes |
| <3 domains scored | No composite; individual domain scores only |
| T3 data submitted later | Score recalculated with T3 guidelines included at 0.50x multiplier |

## Coverage Transparency

Every score includes:
- `coverage_pct` = (guidelines with T1 or T2 data) / (total guidelines) * 100
- `domain_coverage` = per-domain breakdown of data availability
- `score_basis` = "direct" | "facility-derived" | "aggregated"

## Subspecialist Handling

| Subspecialty | Taxonomy Code | Handling |
|---|---|---|
| Maternal-Fetal Medicine | 207VM0101X | Score only on Labor & Delivery + Prenatal + Maternal Safety. Exclude Gynecologic Care domain. |
| Gynecologic Oncology | 207VG0400X | Score only on Gynecologic Care + Surgical measures. Exclude obstetric domains. |
| Reproductive Endocrinology | 207VE0102X | Exclude from general cohort entirely. Too specialized for this scoring framework. |
| Female Pelvic Medicine | 207VF0040X | Score only on Gynecologic Care. Exclude obstetric domains. |
| All other subspecialties | Various | Flag in output. Include in general cohort with notation. |

**Rule:** Subspecialists are never penalized for not billing in domains outside their practice scope. Absent domains are excluded, not scored as zero.

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | What It Catches | What It Misses (Covered By Others) |
|---|---|---|
| **1. ACOG Guideline Concordance (this score)** | Clinical quality against evidence-based standards. Are they doing the right things? | Whether billing patterns are normal, volume is adequate, or payer mix is diverse |
| **2. Peer Comparison** | Whether an OB-GYN's billing profile looks like a typical practitioner. Detects outlier practice patterns. | Whether clinical outcomes are good (billing normally doesn't mean high quality) |
| **3. Volume Adequacy** | Whether claimed procedures have credible volume. Catches "trace billing" in OB-GYN services. | Whether high-volume providers are following guidelines |
| **4. Payer Diversity** | Whether practice spans Medicare and Medicaid consistently. Detects payer-selective behavior. | Clinical quality within either payer population |
| **5. Billing Quality** | Whether charges, code ratios, and E/M distributions are normal. Detects upcoding and billing anomalies. | Whether clinically appropriate care was delivered |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on ACOG Concordance but 30 on Billing Quality. *Interpretation:* Clinically excellent but billing anomalies — possible upcoding or charge irregularities. Investigate billing patterns.

**Scenario B:** Provider scores 85 on Peer Comparison but 45 on ACOG Concordance. *Interpretation:* Bills like a normal OB-GYN but doesn't follow key ACOG guidelines. May be doing routine procedures without evidence-based protocols.

**Scenario C:** Provider scores 75 on ACOG Concordance but 35 on Volume Adequacy. *Interpretation:* Good guideline adherence where they practice, but trace billing in several categories suggests they may not be fully practicing OB-GYN.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **40% of guidelines are T3-only** | 18 of 45 guidelines require self-attestation. Composite score is incomplete without provider participation. |
| **No Rx data** | Cannot measure medication prescribing (aspirin prophylaxis is proxy-scored via diagnosis codes, not actual prescriptions). |
| **No patient-level linkage** | Data is aggregated. Cannot track individual patient outcomes or care episodes. |
| **Facility vs. provider attribution** | Most T1 data is facility-level. Provider scores inherit facility performance, which may not reflect individual practice. |
| **HEDIS is plan-level** | Medicaid HEDIS rates represent MCO performance, not individual provider rates. Applied as proxy. |
| **CHIA is MA-specific** | Case mix data is Massachusetts only. National expansion requires state-by-state equivalents. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **High-volume facility bias** | Facilities delivering more babies have more data, producing more stable scores | Flag low-volume providers; require minimum volume for scoring |
| **Payer mix bias** | Medicaid-heavy practices may have worse outcome metrics due to population health factors, not care quality | Peer cohort is within-specialty; consider payer-adjusted benchmarks |
| **Geographic bias** | Rural OB-GYNs have fewer data sources and higher risk of domain insufficiency | National fallback when state cohort is small; flag rural providers |
| **Subspecialty scope bias** | MFM specialists appear to "miss" gynecologic guidelines they don't practice | Subspecialist handling rules exclude irrelevant domains |

## Update Cadence

- **ACOG guideline catalog:** Review annually when ACOG publishes new Practice Bulletins or Committee Opinions. Add/retire guidelines as clinical standards evolve.
- **Scoring targets/worst values:** Recalibrate annually against updated national benchmarks.
- **Data source refresh:** Leapfrog (annual), CMS Care Compare (quarterly), HEDIS (annual), CHIA (annual), CDC WONDER (annual).
- **Percentile anchors:** Rebuild annually from latest CMS data release.

---
# OUTPUT SCHEMA
---

## Per-NPI Output Row

| Field | Type | Description |
|---|---|---|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | Full name from NPPES |
| `taxonomy_code` | string | Primary taxonomy (207V00000X or subspecialty) |
| `is_subspecialist` | boolean | True if taxonomy indicates subspecialty |
| `subspecialty` | string | Subspecialty name if applicable, null otherwise |
| `state` | string | 2-letter state code |
| `acog_composite_score` | float | 0-100 composite ACOG guideline concordance score |
| `acog_composite_sufficient` | boolean | True if ≥3 domains met sufficiency threshold |
| `coverage_pct` | float | Percentage of guidelines with T1/T2 data |
| `labor_delivery_score` | float | 0-100 domain score (null if insufficient data) |
| `labor_delivery_coverage` | float | Domain-level coverage percentage |
| `prenatal_score` | float | 0-100 domain score |
| `prenatal_coverage` | float | Domain-level coverage percentage |
| `maternal_safety_score` | float | 0-100 domain score |
| `maternal_safety_coverage` | float | Domain-level coverage percentage |
| `postpartum_score` | float | 0-100 domain score |
| `postpartum_coverage` | float | Domain-level coverage percentage |
| `gynecologic_score` | float | 0-100 domain score |
| `gynecologic_coverage` | float | Domain-level coverage percentage |
| `equity_mental_health_score` | float | 0-100 domain score (usually null without T3 data) |
| `equity_mental_health_coverage` | float | Domain-level coverage percentage |
| `score_basis` | string | "direct" | "facility-derived" | "aggregated" |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | Most recent data year used |
