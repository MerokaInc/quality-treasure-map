# Internal Medicine Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

Internal medicine is minimally procedural. Unlike urology (cystoscopy, destruction) or dermatology (biopsies, excisions), the quality-differentiating activities for an internist are preventive care delivery, screening adoption, immunization practice, and care management. Volume adequacy in internal medicine asks: does this provider actually deliver preventive care and screening at scale, or are those codes trace noise?

An internist who bills 96127 (depression screening) twice a year while seeing 800 patients is not screening. They billed it twice, maybe for a consult, maybe by accident. An internist who bills 96127 200 times with 800 patients is genuinely integrating behavioral health screening into their workflow. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other scoring docs:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count, 2018-2024.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024.
3. **NPPES NPI Registry** — provider identification, taxonomy 207R00000X (Internal Medicine, general).

**Taxonomy filtering:** 207R00000X only. Exclude all subspecialists: 207RC0000X (Cardiovascular Disease), 207RE0101X (Endocrinology), 207RG0100X (Gastroenterology), 207RG0300X (Geriatric Medicine), 207RH0003X (Hematology & Oncology), 207RI0200X (Infectious Disease), 207RN0300X (Nephrology), 207RP1001X (Pulmonary Disease), 207RR0500X (Rheumatology), and any other 207R subspecialty codes. We want general internists only.

**Minimum volume threshold:** Provider must have >= 100 total Medicare services to be included. Below that, the data is too sparse to evaluate.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total E/M office visit count (new + established, sick visits only, not preventive), which is the best proxy we have for practice size.

```
visit_codes = [99201, 99202, 99203, 99204, 99205,        -- new patient office visit
               99211, 99212, 99213, 99214, 99215]        -- established patient office visit

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

Note: unlike pediatrics, preventive visit codes (99381-99395) are NOT included in the denominator for internal medicine. The denominator is office E/M visits only. Preventive/wellness visits are themselves a volume adequacy category being measured.

If `total_visit_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from peer median volume data, set at roughly one-third of the peer median rate. The idea: if the peer median for depression screening is 5% of total visit volume, the floor is ~1.5%. Anything below that is a trace, not a practice pattern.

**Why preventive care delivery, not procedures?** In most other specialties, volume adequacy focuses on procedures (biopsies, scopes, excisions) because those are the activities where trace billing is meaningful. Internal medicine is different. General internists are minimally procedural. The activities that differentiate quality in internal medicine are: delivering preventive/wellness care, screening for depression and health risks, vaccinating patients, doing basic in-office diagnostics, and billing structured care management. These are the categories where a provider might bill a code a few times without it being a real practice pattern.


### Geographic Grouping of Floors

The floors in the table below are national defaults. In production, floors should be computed at the **state level** from the state peer cohort median, because practice patterns vary by state:

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all general internist NPIs in the state. Floor = median / 3. | Primary scoring. A provider in TX is evaluated against TX norms. |
| **National** | Floors from the table below (national data). | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Urban vs. rural have different lab/testing patterns. Not implemented now, but the data supports it once cohort sizes are large enough. |

When using state-level floors, the output should record which state peer cohort was used and the cohort size. If a state cohort has fewer than 50 active general internists, fall back to national floors.


| # | Category | Codes | Peer Median Rate | Floor (median/3) | What the Floor Means |
|---|---|---|---|---|---|
| 1 | Preventive/wellness visits | 99395, 99396, 99397, G0438, G0439 | ~20% of visits | 7% | Provider does preventive care as a real part of practice, not a handful of Medicare AWVs |
| 2 | Depression screening | 96127, G0444 | ~5% of visits | 1.5% | Provider routinely screens for depression, not a one-off |
| 3 | Health risk assessment | 96160 | ~3% of visits | 1% | Provider uses standardized health risk assessments routinely |
| 4 | Immunization administration | 90471 | ~4% of visits | 1% | Provider vaccinates patients as routine workflow |
| 5 | Influenza vaccine | 90686 | ~2% of visits | 0.5% | Provider gives flu shots (seasonal, so rate varies) |
| 6 | Venipuncture | 36415 | ~5% of visits | 1.5% | Provider draws blood in-office for lab monitoring |
| 7 | Urinalysis | 81003 | ~3% of visits | 1% | Provider does basic urine testing in-office |
| 8 | ECG | 93000 | ~3% of visits | 1% | Provider does in-office ECGs for cardiac screening/evaluation |
| 9 | Chronic care management | 99490 | ~1% of visits | 0.3% | Provider bills structured CCM (still emerging, so floor is very low) |


**Why these 9 categories, not 30 codes?**

We do not volume-check every individual code. Sick visit codes (99213, 99214) are inherently high-volume if a provider is seeing patients at all. The volume check matters for the categories where a provider might bill a code a few times without it being a real practice pattern: preventive care delivery, screening, immunizations, in-office diagnostics, and care management.

**Special note on category 9 (Chronic Care Management):** 99490 adoption is still growing nationally. Many excellent practices haven't adopted CCM billing yet. If absent, it is "not_detected" and excluded from the denominator. The floor is set very low (0.3%) to only flag providers who bill it at trace volume, not to penalize non-adoption.


## 3. Scoring Each Category

For each of the 9 categories, the logic is:

```
category_services = SUM(total_services) WHERE hcpcs_code IN category_codes
category_rate = category_services / total_visit_volume

IF category_services = 0:
    status = "not_detected"        -- provider does not bill this code at all
ELIF category_rate >= floor:
    status = "ok"                  -- volume is believable
ELSE:
    status = "flag"                -- code is present but volume is too low to be routine
```

**Three possible states per category:**

| Status | Meaning | Counted in Score? |
|---|---|---|
| not_detected | Provider does not bill any codes in this category | No. Excluded from denominator. |
| ok | Provider bills this category at or above the floor | Yes. Numerator + denominator. |
| flag | Provider bills this category but below the floor | Yes. Denominator only. |


## 4. The Volume Adequacy Score

```
detected_categories = COUNT of categories WHERE status IN ("ok", "flag")
ok_categories = COUNT of categories WHERE status = "ok"

IF detected_categories = 0:
    volume_adequacy_score = 50     -- neutral fallback, not an automatic fail
ELSE:
    volume_adequacy_score = (ok_categories / detected_categories) * 100
```

| Score | Interpretation |
|---|---|
| 100 | Every detected category is at believable volume. This provider's preventive care and screening patterns are real. |
| 75-99 | Most categories are adequate. One or two are flagged as low-volume. |
| 50-74 | Mixed. Several categories are present but at trace volume. Investigate which ones. |
| Below 50 | Most detected categories are below floor. Provider may be billing codes they do not routinely perform. |
| 50 (neutral) | No measurable categories detected. Cannot evaluate. Not a fail. |


## 5. Why the Neutral Fallback Matters

If a provider only bills sick visits (99213, 99214, 99215) with no preventive codes, no screening, no immunizations, and no care management, they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing, the answer is neither yes nor no. It is 50.

This is particularly relevant for hospitalist-leaning internists who may bill zero preventive or screening codes. That is an expected practice pattern for hospitalists, not a quality failure. The peer comparison score handles the signal about scope of practice.


---

# PART C: BUSINESS LOGIC DETAIL

---


## 6. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023

STEP 1: Get total visit volume
    total_visit_volume = SUM(total_services)
        WHERE npi = "1234567890"
        AND hcpcs_code IN visit_codes
        AND year = 2023

    IF total_visit_volume < 50: RETURN insufficient_data

STEP 2: For each category, compute rate and status

    Category: Preventive/wellness visits
        codes = [99395, 99396, 99397, G0438, G0439]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.07
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.07
                 "flag"         IF rate < 0.07 AND services > 0

    Category: Depression screening
        codes = [96127, G0444]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.015
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.015
                 "flag"         IF rate < 0.015 AND services > 0

    Category: Health risk assessment
        codes = [96160]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: Immunization administration
        codes = [90471]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: Influenza vaccine
        codes = [90686]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.005
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.005
                 "flag"         IF rate < 0.005 AND services > 0

    Category: Venipuncture
        codes = [36415]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.015
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.015
                 "flag"         IF rate < 0.015 AND services > 0

    Category: Urinalysis
        codes = [81003]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: ECG
        codes = [93000]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: Chronic care management
        codes = [99490]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.003
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.003
                 "flag"         IF rate < 0.003 AND services > 0

STEP 3: Compute score
    detected = count of categories with status "ok" or "flag"
    ok = count of categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 4: Output detail
    For each category, record: name, services, rate, floor, status
```


## 7. Worked Examples

**Provider A:** 1000 total office visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Preventive/wellness visits | 180 | 18.0% | 7% | ok |
| Depression screening | 95 | 9.5% | 1.5% | ok |
| Health risk assessment | 0 | 0.0% | 1% | not_detected |
| Immunization admin | 45 | 4.5% | 1% | ok |
| Influenza vaccine | 30 | 3.0% | 0.5% | ok |
| Venipuncture | 60 | 6.0% | 1.5% | ok |
| Urinalysis | 8 | 0.8% | 1% | **flag** |
| ECG | 35 | 3.5% | 1% | ok |
| Chronic care management | 0 | 0.0% | 0.3% | not_detected |

Detected: 7. Ok: 6. Flagged: 1 (urinalysis trace). Score: **(6/7) * 100 = 86**.

Provider A runs a comprehensive primary care practice. Preventive visits are robust, depression screening is strong, immunizations and in-office diagnostics are routine. Urinalysis is present but trace, flagged. Health risk assessment and CCM are not billed at all, excluded from scoring and handled by peer comparison.


**Provider B:** 700 total office visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Preventive/wellness visits | 35 | 5.0% | 7% | **flag** |
| Depression screening | 5 | 0.7% | 1.5% | **flag** |
| Health risk assessment | 0 | 0.0% | 1% | not_detected |
| Immunization admin | 0 | 0.0% | 1% | not_detected |
| Influenza vaccine | 0 | 0.0% | 0.5% | not_detected |
| Venipuncture | 12 | 1.7% | 1.5% | ok |
| Urinalysis | 0 | 0.0% | 1% | not_detected |
| ECG | 0 | 0.0% | 1% | not_detected |
| Chronic care management | 0 | 0.0% | 0.3% | not_detected |

Detected: 3. Ok: 1. Flagged: 2. Score: **(1/3) * 100 = 33**.

Provider B has preventive visits and depression screening on the books, but both are well below floor. The preventive visits look like occasional Medicare Annual Wellness Visits, not a routine part of practice. Depression screening at 5 services out of 700 visits is a one-off, not a workflow. Only venipuncture is at believable volume.


**Provider C:** 900 total office visits in 2023. Purely sick visits. No preventive codes, no screening, no immunizations detected.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Preventive/wellness visits | 0 | 0.0% | 7% | not_detected |
| Depression screening | 0 | 0.0% | 1.5% | not_detected |
| Health risk assessment | 0 | 0.0% | 1% | not_detected |
| Immunization admin | 0 | 0.0% | 1% | not_detected |
| Influenza vaccine | 0 | 0.0% | 0.5% | not_detected |
| Venipuncture | 0 | 0.0% | 1.5% | not_detected |
| Urinalysis | 0 | 0.0% | 1% | not_detected |
| ECG | 0 | 0.0% | 1% | not_detected |
| Chronic care management | 0 | 0.0% | 0.3% | not_detected |

Detected: 0. Score: **50 (neutral)**.

Provider C bills nothing beyond sick visits. Could be a hospitalist-leaning internist, a new provider, or someone with non-standard billing. No categories to check, so volume adequacy is neutral. The peer comparison score will handle the signal about missing code coverage.


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## 8. The Five Scores Together

Internal medicine quality scoring uses five dimensions. Volume adequacy is Dimension 3.

| Score | Question It Answers | Standard |
|---|---|---|
| **ACP Guidelines Concordance** | Does this provider follow ACP/USPSTF guidelines? | ACP / USPSTF clinical guidelines |
| **Peer Comparison** | Does this provider's billing pattern look like a normal general internist's? | The peer cohort (top codes by volume) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |
| **Billing Quality** | Are the billing patterns clean and proportional? | Ratio analysis across code pairs |
| **Payer Diversity** | Does this provider serve a broad patient population? | Payer mix analysis |

They catch different problems:

| Problem | Concordance | Peer | Volume |
|---|---|---|---|
| Provider never screens | Caught (low screening domain) | Caught (missing screening codes) | Not applicable (nothing to check) |
| Provider bills screening codes but only 1-2 times a year | Partial (volume metric is low) | Not caught (code is present) | **Caught** (below floor, flagged) |
| Provider does everything but in wrong proportions | Missed (concordance scores may still be ok) | Caught (low volume concordance) | Partially caught (some categories may be below floor) |
| Provider does nothing beyond sick visits | Caught (low across all domains) | Caught (low code + category coverage) | Neutral (no categories to check, score = 50) |
| Provider bills CCM at trace volume | Missed | Not caught (code present) | **Caught** (below 0.3% floor, flagged) |

Volume adequacy is the behavior check. It sits between the other scores and says: "your peer comparison score says you bill these codes, but do you really?" The key insight for internal medicine is that the peer comparison shows a provider has preventive and screening codes in their billing profile, and volume adequacy checks whether those codes represent real clinical volume or trace artifacts.


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Floors are estimates, not validated thresholds.** We set floors at roughly one-third of the peer median. This is reasonable but not clinically validated. If the peer median for depression screening (96127) is actually 3% instead of 5%, the floor should be lower. Floors should be recalibrated once we have the actual CMS data loaded and can compute real peer medians.

**Medicare-specific codes inflate floors relative to Medicaid-only analysis.** G0438 and G0439 (Initial and Subsequent Annual Wellness Visit) and G0444 (depression screening, Medicare) are Medicare-only codes. In a Medicaid-only dataset, preventive visit and depression screening volumes will appear lower because these codes do not exist. When scoring across payer mixes, be aware that the floors assume a Medicare-inclusive population.

**Hospitalist internists will have zero preventive/screening volume.** This is expected, not a quality failure. A hospitalist bills inpatient E/M codes (99221-99223, 99231-99233), not office visits, preventive care, or screening. Their total office visit volume will likely be below the 50-visit threshold and they will be excluded. If they somehow cross the threshold, they will score 50 (neutral). The peer comparison score is the right place to flag scope-of-practice concerns.

**CCM (99490) adoption is still growing.** Many excellent practices haven't adopted structured chronic care management billing. The floor is deliberately low (0.3%) to avoid penalizing early adopters with small volumes. Non-adoption is "not_detected" and excluded, not penalized. This floor should be revisited annually as CCM billing becomes more prevalent.

**Lab codes (36415, 81003) may be billed by an external lab, not the ordering provider.** A provider who orders venipuncture or urinalysis but uses an external lab will show zero volume for those categories under their NPI. This is a known limitation of claims-level data. The provider genuinely orders these tests but they appear under the lab's NPI.

**ECG (93000) may be done by a cardiologist referral.** An internist who refers all ECGs to cardiology will show zero ECG volume. This is clinically reasonable (cardiology handles cardiac evaluation) but means the provider will not get volume credit for ECG. The category becomes "not_detected" and is excluded from scoring.

**Seasonal variation in influenza vaccine volume.** Flu shots are concentrated in fall/winter. A provider measured in a partial year (e.g., January-June data only) will have artificially low or zero influenza vaccine volume. Annual data is required for this category to be meaningful.

**The 50 neutral fallback is a design choice, not a clinical judgment.** A provider with no detected preventive or screening categories could genuinely be practicing low-quality medicine. But they could also be a locum, a new provider, a hospitalist, or someone with a non-standard billing setup. We choose not to penalize ambiguity and let the peer comparison score handle the absence signal.

**Floors should be rebuilt annually.** As new codes emerge, CCM adoption grows, and practice patterns shift, the peer median rates change. Recalibrate floors each year from fresh claims data.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort set the floors |
| floor_cohort_state | string | State used for floor computation (or "US" if national) |
| floor_cohort_size | int | Number of peers in the cohort used to compute floors |
| total_visit_volume | int | Total E/M office visits (sick only, not preventive) in measurement year |
| preventive_wellness_services | int | Service count for 99395, 99396, 99397, G0438, G0439 |
| preventive_wellness_rate | float | preventive_wellness_services / total_visit_volume |
| preventive_wellness_status | string | "ok", "flag", or "not_detected" |
| depression_screening_services | int | Service count for 96127, G0444 |
| depression_screening_rate | float | Rate |
| depression_screening_status | string | Status |
| health_risk_services | int | 96160 service count |
| health_risk_rate | float | Rate |
| health_risk_status | string | Status |
| immunization_admin_services | int | 90471 service count |
| immunization_admin_rate | float | Rate |
| immunization_admin_status | string | Status |
| influenza_vaccine_services | int | 90686 service count |
| influenza_vaccine_rate | float | Rate |
| influenza_vaccine_status | string | Status |
| venipuncture_services | int | 36415 service count |
| venipuncture_rate | float | Rate |
| venipuncture_status | string | Status |
| urinalysis_services | int | 81003 service count |
| urinalysis_rate | float | Rate |
| urinalysis_status | string | Status |
| ecg_services | int | 93000 service count |
| ecg_rate | float | Rate |
| ecg_status | string | Status |
| ccm_services | int | 99490 service count |
| ccm_rate | float | Rate |
| ccm_status | string | Status |
| detected_categories | int | Count of categories with status ok or flag (0-9) |
| ok_categories | int | Count of categories with status ok (0-9) |
| flagged_categories | int | Count of categories with status flag (0-9) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
