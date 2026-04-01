# Hematology/Oncology Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other four docs ask about clinical practice: does this provider follow guidelines, look like peers, have adequate volume, practice consistently across payers? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** — is their pricing in line with peers?
2. **Procedure-to-procedure ratios** — do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that shouldn't go together, or go together too often)?
3. **E/M level distribution** — are they billing visit complexity at a level appropriate for an oncology practice, or skewing abnormally high or low?

The standard is always the peer distribution. Scored against state-level cohorts by default.


---

# PART A: WHAT WE HAVE

---

This score uses both CMS datasets:

**CMS Medicare Physician & Other Practitioners (By Provider and Service)** — for charge-to-allowed analysis

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged (their list price) |
| average_medicare_allowed_amt | What Medicare says the service is worth (the allowed amount) |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Hematology & Oncology |

**CMS Medicaid Provider Spending** — for procedure ratio analysis

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined, giving us full hem/onc volume.

**The hem/onc Medicare advantage:** Unlike pediatrics, the Medicare file is the primary data source here. Most hem/onc patients are 65+, so the charge-to-allowed analysis has strong data.


---

# PART B: THE LOGIC — CHARGE-TO-ALLOWED RATIO

---


## 1. The Metric: Charge-to-Allowed Ratio

For each provider, we calculate the ratio of what they charge to what Medicare allows:

```
For a given NPI:

    total_charges = SUM(average_submitted_chrg_amt * number_of_services)
        across all HCPCS codes for this NPI

    total_allowed = SUM(average_medicare_allowed_amt * number_of_services)
        across all HCPCS codes for this NPI

    charge_to_allowed_ratio = total_charges / total_allowed
```

A ratio of 2.5x means the provider charges, on average, 2.5 times what Medicare allows. This is normal for oncology. Many oncology practices charge significantly above Medicare rates because their fee schedules are set to negotiate with commercial payers, and the same schedule applies to all payers.


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual for oncology. Could indicate a practice that has never updated its fee schedule. |
| 1.5x - 3.5x | Typical range for oncology. Charges are above Medicare allowed but within normal range. Oncology tends to run higher than primary care due to drug costs and procedure complexity. |
| 3.5x - 6.0x | High charges relative to Medicare. May reflect a high-cost market, aggressive pricing, or heavy commercial payer negotiation. |
| >6.0x | Outlier. Worth investigating. Could be billing errors, unusual fee schedule, or a practice with very different pricing for non-drug services. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Possible data error. |

**Oncology-specific note:** Drug administration codes (96413, 96365, etc.) and the drugs themselves (J-codes) can significantly inflate charge-to-allowed ratios if the practice buys drugs at 340B prices but charges at ASP rates. This is legal and common but creates naturally higher ratios. The peer comparison controls for this since other oncology practices in the same state face similar market dynamics.


## 2. Building the Peer Distribution

### Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All hem/onc NPIs (taxonomy 207RH0003X, >= 10 Medicare services) in the same state | Primary scoring. Captures local pricing norms. |
| **National** | All states combined | Secondary benchmark. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA | Urban vs. rural pricing dynamics differ significantly in oncology. |

Minimum peer cohort: 30 providers. Fall back to national if under 30.


### Computing Peer Anchors

```
peer_cohort = all hem/onc NPIs in the same state
    WHERE taxonomy_code = '207RH0003X'
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio
peer_p25 = 25th percentile
peer_median = 50th percentile
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Illustrative peer anchors (national hem/onc):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.50x |
| p25 | ~2.00x |
| Median | ~2.70x |
| p75 | ~3.50x |
| p90 | ~4.50x |

These are illustrative. Actual anchors must be computed from real CMS data. Oncology ratios tend to run higher than primary care.


## 3. Scoring Bands

```
provider_ratio = charge_to_allowed_ratio for this NPI

IF peer_p25 <= provider_ratio <= peer_p75:
    charge_score = 100        -- inside the middle 50%, normal

ELIF peer_p10 <= provider_ratio <= peer_p90:
    charge_score = 70         -- inside the middle 80%, somewhat unusual

ELSE:
    charge_score = 40         -- outside the middle 80%, outlier
```

| Band | Range | Score | Interpretation |
|---|---|---|---|
| Normal | p25 to p75 | 100 | Provider's pricing is within the typical range for hem/onc peers in this state. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | Provider is in the tails but not extreme. Could reflect market positioning. |
| Outlier | Below p10 or above p90 | 40 | Provider's pricing is significantly different from peers. Worth investigating. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 2.5x is not "better" than 3.0x in any clinical sense. Both are normal for oncology. The purpose is to flag outliers, not rank providers.


## 4. Per-Code Analysis (Optional Detail Layer)

```
For each HCPCS code billed by this NPI:

    provider_code_ratio = average_submitted_chrg_amt / average_medicare_allowed_amt

    peer_code_median = MEDIAN(average_submitted_chrg_amt / average_medicare_allowed_amt)
        across all peer NPIs billing this code

    code_deviation = provider_code_ratio / peer_code_median

    IF code_deviation > 2.0 OR code_deviation < 0.5:
        code_flag = "outlier"
    ELSE:
        code_flag = "normal"

outlier_code_count = COUNT of codes WHERE code_flag = "outlier"
outlier_code_pct = outlier_code_count / total_codes_billed * 100
```

This answers: "is the provider's pricing outlier status driven by one or two codes, or is it across the board?"


---

# PART C: PROCEDURE RATIO ANALYSIS (Green Flags and Red Flags)

---

Charge-to-allowed is about pricing. This section is about the relationships between procedures. Certain code ratios reveal practice quality, and certain combinations are warning signs. All of these use HCPCS volumes from both Medicare and Medicaid combined.


## 5. Green Flags (Good Practice Signals)

Green flags are procedure ratios or code patterns that signal guideline-concordant, high-quality oncology care. The presence of these patterns is a positive signal.

| # | Green Flag | Ratio / Pattern | What It Signals | How to Score |
|---|---|---|---|---|
| 1 | **Hydration with chemo** | (96360 + 96361) / (96413 + 96415 + 96417) | Provider hydrates patients during chemo — standard supportive care for many regimens | Ratio > 0.3 = green |
| 2 | **Antiemetic co-administration** | 96374 services / 96413 services | Provider gives IV antiemetics with chemo infusions — NCCN guideline for emetogenic chemo | Ratio > 0.5 = green |
| 3 | **Growth factor support** | Beneficiaries with 96372 / beneficiaries with 96413 | Provider gives SC injections (growth factors) to chemo patients | Ratio > 0.15 = green |
| 4 | **CBC before chemo** | 85025 services / (96413 + 96409) services | Lab monitoring before each chemo cycle — mandatory for dose decisions | Ratio > 0.5 = green |
| 5 | **CMP before chemo** | 80053 services / (96413 + 96409) services | Metabolic panel monitoring — required for renal/hepatic clearance drugs | Ratio > 0.4 = green |
| 6 | **Multi-drug regimens** | (96415 + 96417) / 96413 | Extended infusions and additional agents — reflects modern multi-drug protocols | Ratio > 1.0 = green |
| 7 | **Psychosocial screening** | 96127 beneficiaries / total unique beneficiaries | Distress screening per NCCN guidelines | Ratio > 0.10 = green |
| 8 | **New patient evaluations** | 99205 beneficiaries / total unique beneficiaries | Provider accepts and works up new cancer patients | Ratio > 0.05 = green |
| 9 | **Bone marrow biopsy in hematology** | 38222 services > 0 (for providers with hematology volume) | Provider performs diagnostic procedures rather than referring all | Presence = green |
| 10 | **Complexity add-on usage** | G2211 services / (99214 + 99215) services | Provider bills for longitudinal complexity — appropriate for ongoing cancer management | Ratio > 0.5 = green |


## 6. Red Flags (Warning Signals)

Red flags are patterns that suggest billing anomalies, upcoding, or clinically inconsistent behavior. They are not proof of problems — they are signals that warrant investigation.

| # | Red Flag | Ratio / Pattern | What It Signals | How to Score |
|---|---|---|---|---|
| 1 | **Chemo without supportive care** | (96360 + 96361 + 96374 + 96375) = 0 AND (96413 + 96415) > 50 | Provider gives chemo but never hydrates or gives premeds — unusual and potentially unsafe | Flag = red |
| 2 | **99215 dominance** | 99215 services / (99213 + 99214 + 99215) services > 0.85 | Over 85% of established visits at highest complexity. Oncology skews high, but >85% is extreme upcoding risk. | Flag = red |
| 3 | **99211 overuse** | 99211 services / total E/M services > 0.30 | Over 30% of visits are minimal complexity. In oncology, most visits should be 99214-99215. High 99211 may indicate inappropriate nurse-only visits or billing manipulation. | Flag = red |
| 4 | **Chemo admin without labs** | (85025 + 80053) services = 0 AND (96413 + 96409) > 20 | Provider administers chemo but never bills labs. Either labs are billed elsewhere (possible) or monitoring is absent (concerning). | Flag = red |
| 5 | **Hormonal-only "oncology"** | 96402 services > 50 AND (96413 + 96409) = 0 AND 99215 > 100 | Provider bills only hormonal injections and high-complexity visits — could be appropriate (prostate cancer) or could be a urology practice miscategorized. | Flag = red |
| 6 | **Transfusion without diagnosis workup** | 36430 services > 20 AND 38222 = 0 AND (85025) < 10 | Provider transfuses frequently but never does bone marrow biopsy or labs — unusual pattern for hematologic management. | Flag = red |
| 7 | **Very high infusion-to-patient ratio** | (96413 + 96415 + 96417) services / total beneficiaries > 50 | Over 50 chemo admin services per patient suggests very frequent administration or possible billing inflation. | Flag = red |
| 8 | **No new patients for 12+ months** | 99205 + 99204 + 99203 = 0 | Provider sees zero new patients. Could be winding down or a closed panel, but unusual for active oncology. | Flag = red |
| 9 | **Injection volume without corresponding drugs** | 96372 services > 200 AND 96413 = 0 AND chemo codes = 0 | High injection volume without any infusion or chemo — could indicate a practice focused solely on supportive injections without active treatment management. | Flag = red (investigate) |
| 10 | **Single E/M code billing** | One E/M code (e.g., 99214) accounts for > 90% of all E/M services | Natural practice has a distribution of visit complexity. Single-code dominance suggests templated billing. | Flag = red |
| 11 | **Growth factor without chemo** | 96372 (growth factor pattern) > 50 AND all chemo codes = 0 | Growth factors should accompany chemo. Standalone growth factor administration without chemo is unusual unless the provider is managing a referred patient's supportive care. | Flag = yellow (investigate) |
| 12 | **Very low services per beneficiary** | Total services / total beneficiaries < 3 | In oncology, patients typically have multiple services per visit (labs, infusion, injection, E/M). Fewer than 3 services per patient is very unusual. | Flag = red |


## 7. E/M Level Distribution

Oncology E/M distribution is different from primary care. Cancer management visits are inherently complex — multiple active problems, medication management, treatment toxicity assessment, psychosocial issues. The expected distribution skews toward 99214-99215.

**Expected E/M distribution for hematology/oncology:**

| E/M Code | Expected Range | What's Normal |
|---|---|---|
| 99211 | 2-8% | Minimal visits (nurse-supervised infusion check-ins) |
| 99212 | 0-3% | Rare in oncology. Very simple visit. |
| 99213 | 8-18% | Stable disease, routine follow-up, straightforward labs review |
| 99214 | 30-45% | Moderate complexity — active treatment monitoring, side effect management |
| 99215 | 35-55% | High complexity — new diagnoses, treatment changes, multi-system management |

**Scoring the E/M distribution:**

```
em_codes = [99211, 99212, 99213, 99214, 99215]

For each code in em_codes:
    provider_pct = services for this code / total E/M services for this NPI * 100
    peer_median_pct = MEDIAN of (services for this code / total E/M services)
        across peer cohort

    deviation = ABS(provider_pct - peer_median_pct)

mean_em_deviation = MEAN(deviation across all 5 E/M levels)

em_distribution_score = MAX(0, 100 - (mean_em_deviation * 5))
```

The `* 5` multiplier converts percentage-point deviation into a meaningful 0-100 scale. A provider whose E/M distribution deviates by an average of 10 percentage points from the peer median in each level scores 50. A provider matching the peer median exactly scores 100.

| Score | Interpretation |
|---|---|
| 85-100 | E/M distribution closely matches oncology peers. Normal complexity billing. |
| 70-84 | Some deviation. Could be panel mix (more new diagnoses = more 99215). |
| 50-69 | Significant deviation. Investigate which levels are over/under-represented. |
| Below 50 | Very atypical E/M distribution. Strong signal of upcoding or downcoding. |


## 8. Cross-Category Consistency Checks

These checks verify that code combinations make clinical sense. They are binary (pass/fail) and feed into the ratio score.

| # | Check | Logic | Pass If |
|---|---|---|---|
| 1 | **Chemo and E/M co-occur** | Provider bills both chemo admin codes and E/M codes | Both categories present |
| 2 | **Labs and chemo co-occur** | Provider bills both lab codes and chemo admin codes | Both categories present (or neither — consultative practice) |
| 3 | **Hydration with cisplatin-pattern chemo** | If very high hydration volume (top quartile), chemo volume should also be high | Hydration quartile <= chemo quartile + 1 |
| 4 | **Injection volume proportional to patient panel** | 96372 services / beneficiaries should be within peer range | Ratio between peer p10 and peer p90 |
| 5 | **New patient visits proportional to total visits** | New patient E/M / total E/M should be within peer range | Ratio between peer p10 and peer p90 |
| 6 | **Bone marrow biopsy not without hematology context** | If 38222 > 0, provider should also bill E/M or infusion codes | 38222 present → E/M or infusion also present |
| 7 | **Transfusion with lab monitoring** | If 36430 > 0, 85025 (CBC) should also be present | Both present or neither |
| 8 | **G2211 not without qualifying E/M** | G2211 services <= (99214 + 99215) services | G2211 count <= qualifying E/M count |


---

# PART D: COMPOSITE BILLING QUALITY SCORE

---


## Composite Formula

```
billing_quality_score = (charge_score * 0.35) + (ratio_score * 0.65)
```

Where:

**charge_score** = the band score from Section 3 (100, 70, or 40)

**ratio_score** is computed from green flags, red flags, and consistency checks:

```
green_count = COUNT of green flags WHERE condition is met (out of 10)
red_count = COUNT of red flags WHERE condition is met (out of 12)
consistency_pass = COUNT of consistency checks that pass (out of 8)
total_checks = green_count_possible + red_count_possible + consistency_checks_possible
    -- only count checks where the provider has data to evaluate

green_contribution = green_count * 1.0
neutral_checks = total_checks - green_count - red_count
neutral_contribution = neutral_checks * 0.5
red_contribution = red_count * 0.0

ratio_score = ((green_contribution + neutral_contribution + red_contribution) / total_checks) * 100
```

**Weight justification:**
- Ratio score (65%): The procedure-to-procedure ratios and E/M distribution are more informative than pricing because they reflect clinical practice patterns, not market dynamics.
- Charge score (35%): Pricing outliers are worth flagging but are less diagnostically useful — many legitimate reasons for pricing variation.


## Worked Examples

**Provider K (community oncologist, normal billing, Ohio):**

```
Charge-to-allowed ratio: 2.8x (peer p25-p75 = 2.0-3.5)
    charge_score = 100

Green flags met: 8 of 10 (missing bone marrow biopsy and psychosocial screening)
Red flags triggered: 0 of 12
Consistency checks passed: 7 of 8

Evaluable checks: 10 + 12 + 8 = 30
green_contribution = 8 * 1.0 = 8.0
neutral = 30 - 8 - 0 = 22, neutral_contribution = 22 * 0.5 = 11.0
red_contribution = 0 * 0.0 = 0.0
ratio_score = (8.0 + 11.0 + 0.0) / 30 * 100 = 63.3

billing_quality_score = (100 * 0.35) + (63.3 * 0.65) = 35.0 + 41.1 = 76.1

Provider K Billing Quality Score: 76.1
```

**Provider L (high charges, some red flags, California):**

```
Charge-to-allowed ratio: 5.2x (peer p90 = 4.5 → outlier)
    charge_score = 40

Green flags met: 5 of 10
Red flags triggered: 3 of 12 (99215 dominance, chemo without labs, single E/M code)
Consistency checks passed: 5 of 8

Evaluable checks: 10 + 12 + 8 = 30
green_contribution = 5 * 1.0 = 5.0
neutral = 30 - 5 - 3 = 22, neutral_contribution = 22 * 0.5 = 11.0
red_contribution = 3 * 0.0 = 0.0
ratio_score = (5.0 + 11.0 + 0.0) / 30 * 100 = 53.3

billing_quality_score = (40 * 0.35) + (53.3 * 0.65) = 14.0 + 34.6 = 48.6

Provider L Billing Quality Score: 48.6
```

**Provider M (hematology-focused, excellent billing patterns, Massachusetts):**

```
Charge-to-allowed ratio: 2.1x (peer p25-p75 range)
    charge_score = 100

Green flags met: 7 of 8 evaluable (chemo flags not evaluable — no chemo)
Red flags triggered: 0 of 9 evaluable
Consistency checks passed: 6 of 6 evaluable

Evaluable checks: 8 + 9 + 6 = 23
green_contribution = 7 * 1.0 = 7.0
neutral = 23 - 7 - 0 = 16, neutral_contribution = 16 * 0.5 = 8.0
red_contribution = 0 * 0.0 = 0.0
ratio_score = (7.0 + 8.0 + 0.0) / 23 * 100 = 65.2

billing_quality_score = (100 * 0.35) + (65.2 * 0.65) = 35.0 + 42.4 = 77.4

Provider M Billing Quality Score: 77.4
```


---

# PART E: HOW THIS FITS WITH THE OTHER SCORES

---


## What Each Dimension Catches

| Dimension | What It Catches | What It Misses (Caught by Others) |
|---|---|---|
| **1. Guideline Concordance** | Whether supportive care and practice patterns align with ASH/NCCN | Whether billing ratios make sense (this doc) |
| **2. Peer Comparison** | Whether code set breadth matches peers | Whether the relationships between those codes are normal (this doc) |
| **3. Volume Adequacy** | Whether volumes per category are adequate | Whether pricing and code ratios are appropriate (this doc) |
| **4. Payer Diversity** | Whether practice is consistent across payers | Whether the billing itself is normal (this doc) |
| **5. Billing Quality** (this doc) | Pricing outliers, code ratio anomalies, E/M upcoding risk, clinical inconsistencies | Clinical quality of care (Dim 1), scope of practice (Dim 2), volume patterns (Dim 3) |


## Complementary Scenarios

**Scenario 1:** Provider scores 90 on Guideline Concordance and Peer Comparison but 40 on Billing Quality. Clinically looks great — supportive care, broad code set, adequate volumes. But billing ratios are anomalous: 99215 accounts for 90% of E/M, charge ratio is an outlier. Clinical quality may be fine, but the billing pattern needs investigation.

**Scenario 2:** Provider scores 85 on Billing Quality but 45 on Guideline Concordance. Billing is clean — no red flags, normal charges, good E/M distribution. But the clinical pattern shows low supportive care and no psychosocial screening. A well-billed but clinically incomplete practice.

**Scenario 3:** Provider scores 55 on Billing Quality (some red flags: chemo without labs) and 30 on Volume Adequacy (trace billing across categories). Both scores point to the same underlying issue: this may not be a substantive oncology practice. The combination is more informative than either score alone.


---

# PART F: RISKS AND LIMITATIONS

---


## Data Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **Charge-to-allowed is Medicare-only** | Medicaid does not publish charge detail. Charge score reflects Medicare pricing only. | Ratio analysis uses both files, compensating for the single-payer pricing view. |
| **Drug J-codes affect ratios** | If the provider bills drug codes (J-codes), these can dramatically affect charge-to-allowed ratios. Drug pricing is highly variable. | Compute charge ratios with and without J-codes. Flag providers where J-code exclusion changes the band. |
| **340B drug pricing** | 340B providers purchase drugs at steep discounts but may be reimbursed at ASP-based rates, creating artificially high charge-to-allowed ratios for drug codes. | 340B status is detectable from HRSA. Flag as context. Consider excluding drug codes from charge ratio for 340B providers. |
| **Green/red flag thresholds are approximate** | The thresholds for green and red flags are based on clinical expectations, not empirically validated cutoffs. | Thresholds should be refined with actual CMS data analysis. Document the rationale for each threshold. |
| **E/M distribution expectations** | The expected E/M distribution is oncology-wide. Hematology-focused providers may have a different natural distribution. | Subspecialist flag and separate analysis for hematology-only providers. |


## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Academic vs. community** | Academic centers may bill differently (more consults, more complex coding, teaching physician rules) | State-level peer cohort. Future academic/community stratification. |
| **Solo vs. group practice** | Group practices may split billing across NPIs, making individual ratios look different | No direct mitigation. Flag practice size. |
| **Hospital outpatient vs. office** | Hospital-based providers may have different charge structures (facility + professional fees) | Place-of-service field available. Could stratify. Not implemented now. |
| **Coding education** | Providers with better coding education may use G2211, 96127, etc. more appropriately, not necessarily reflecting different clinical practice | This is partially why green flags include these codes — coding awareness correlates with practice quality but is not identical to it. |


## Update Cadence

Green flag and red flag definitions reviewed annually. Charge ratio peer anchors rebuilt annually from new CMS data. E/M distribution expectations updated if CMS coding guidelines change (as happened with the 2021 E/M code revision).


---

# OUTPUT SCHEMA

---

One row per NPI. All scores on 0-100 scale.

| Field | Type | Description |
|---|---|---|
| npi | string | 10-digit National Provider Identifier |
| provider_name | string | Provider name from NPPES |
| provider_state | string | 2-letter state code |
| taxonomy_code | string | NPPES taxonomy |
| measurement_year | integer | Year of CMS data |
| peer_cohort_level | string | "state" or "national_fallback" |
| peer_cohort_size | integer | Number of providers in comparison cohort |
| charge_to_allowed_ratio | float | Provider's overall charge-to-allowed ratio |
| peer_p25 | float | 25th percentile of peer charge ratios |
| peer_median | float | Median peer charge ratio |
| peer_p75 | float | 75th percentile of peer charge ratios |
| peer_p90 | float | 90th percentile of peer charge ratios |
| charge_band | string | "normal", "somewhat_unusual", or "outlier" |
| charge_score | integer | 100, 70, or 40 |
| outlier_code_count | integer | Number of per-code charge outliers |
| outlier_code_pct | float | Percentage of billed codes that are charge outliers |
| green_flag_count | integer | Number of green flags met (out of evaluable) |
| green_flag_evaluable | integer | Number of green flags that could be evaluated |
| red_flag_count | integer | Number of red flags triggered (out of evaluable) |
| red_flag_evaluable | integer | Number of red flags that could be evaluated |
| red_flag_details | string[] | Names of triggered red flags |
| consistency_pass_count | integer | Number of consistency checks passed |
| consistency_evaluable | integer | Number of consistency checks evaluated |
| ratio_score | float | Combined green/red/consistency score (0-100) |
| em_distribution_score | float | E/M level distribution score (0-100) |
| em_99211_pct | float | Percentage of E/M at 99211 |
| em_99212_pct | float | Percentage of E/M at 99212 |
| em_99213_pct | float | Percentage of E/M at 99213 |
| em_99214_pct | float | Percentage of E/M at 99214 |
| em_99215_pct | float | Percentage of E/M at 99215 |
| billing_quality_score | float | Composite: (charge_score * 0.35) + (ratio_score * 0.65) |
| subspecialist_flag | string | "general_hemonc", "hematology_focused", or null |
| b340_flag | boolean | True if provider is in a 340B-covered entity |
| low_volume_excluded | boolean | True if provider has < 11 unique beneficiaries |
| data_completeness | string | "full", "medicare_only", "medicaid_only" |
| score_confidence_tier | string | Always "tier_2_proxy" for this version |
