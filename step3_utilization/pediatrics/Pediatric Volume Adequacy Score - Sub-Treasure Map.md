# Pediatric Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A pediatrician who bills 96110 (developmental screening) twice in a year while seeing 600 patients is not screening. They billed it twice, maybe by accident, maybe for a consult. A pediatrician who bills 96110 300 times with 600 patients is genuinely screening most of their young patients. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other two docs:

1. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024.
2. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count.
3. **NPPES NPI Registry** — provider identification, taxonomy 208000000X.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total E/M visit count (sick + well-child combined), which is the best proxy we have for practice size.

```
visit_codes = [99201, 99202, 99203, 99204, 99205,        -- new patient sick
               99211, 99212, 99213, 99214, 99215,        -- established patient sick
               99381, 99382, 99383, 99384, 99385,        -- new patient preventive
               99391, 99392, 99393, 99394, 99395]        -- established patient preventive

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

If `total_visit_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from the peer median volume data (PCC 2024 analysis), set at roughly one-third of the peer median rate. The idea: if the peer median for developmental screening is 3% of total volume, the floor is 1%. Anything below that is a trace, not a practice pattern.


### Geographic Grouping of Floors

The floors in the table below are national defaults. In production, floors should be computed at the **state level** from the state peer cohort median, because practice patterns vary by state:

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all pediatric NPIs in the state. Floor = median / 3. | Primary scoring. A provider in MA is evaluated against MA norms. |
| **National** | Floors from the table below (national PCC data). | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Urban vs. rural have different lab/testing patterns. Not implemented now, but the data supports it once cohort sizes are large enough. |

When using state-level floors, the output should record which state peer cohort was used and the cohort size. If a state cohort has fewer than 50 active pediatricians, fall back to national floors.


| # | Category | Codes | Peer Median Rate | Floor | What the Floor Means |
|---|---|---|---|---|---|
| 1 | Well-child visits | 99391, 99392, 99393, 99394 | ~20% of visits | 8% | Provider is doing preventive care as a real part of their practice, not just occasionally |
| 2 | Immunization administration | 90460, 90461, 90471 | ~20% of total services | 5% | Provider routinely vaccinates (admin codes relative to visits, not total services) |
| 3 | Developmental screening | 96110 | ~3% of visits | 1% | Provider screens more than a handful of patients. At 1%, a 500-visit practice would need at least 5 screenings. |
| 4 | Behavioral/emotional screening | 96127 | ~4% of visits | 1.5% | Provider is using PHQ-A, M-CHAT, Vanderbilt, or EPDS routinely, not as a one-off |
| 5 | Vision screening | 99173, 99177 | ~3% of visits | 1% | Provider does vision screening as part of well-child workflow |
| 6 | Hearing screening | 92551 | ~2% of visits | 0.5% | Provider does audiometric screening at recommended ages |
| 7 | Health risk assessment | 96160, 96161 | ~3% of visits | 1% | Provider administers health risk questionnaires (social determinants, caregiver stress) routinely |
| 8 | Anemia screening | 85018, 36416 | ~3% of visits | 0.5% | Provider does hemoglobin and/or capillary blood draws for screening, not just rare cases |
| 9 | Point-of-care rapid testing | 87880, 87804 | ~3% of visits | 1% | Provider does in-office strep and flu testing as standard acute-care workflow |


**Why only 9 categories, not 25 codes?**

We do not volume-check every individual code. Sick visit codes (99213, 99214) and vaccine product codes (90680, 90686, 90677) do not need volume floors. If a provider is seeing patients and vaccinating at all, those codes are inherently high-volume. The volume check matters for the categories where a provider might bill a code a few times without it being a real practice pattern: screening, testing, assessments.


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
| 100 | Every detected category is at believable volume. This provider's practice patterns are real. |
| 75-99 | Most categories are adequate. One or two are flagged as low-volume. |
| 50-74 | Mixed. Several categories are present but at trace volume. Investigate which ones. |
| Below 50 | Most detected categories are below floor. Provider may be billing codes they do not routinely perform. |
| 50 (neutral) | No measurable categories detected. Cannot evaluate. Not a fail. |


## 5. Why the Neutral Fallback Matters

If a provider only bills sick visits and well-child visits (no screening codes, no rapid tests, no assessments), they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing, the answer is neither yes nor no. It is 50.


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

    Category: Developmental Screening
        codes = [96110]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    (repeat for all 9 categories)

STEP 3: Compute score
    detected = count of categories with status "ok" or "flag"
    ok = count of categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 4: Output detail
    For each category, record: name, services, rate, floor, status
```


## 7. Worked Example

Provider A: 800 total visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Well-child visits | 240 | 30.0% | 8% | ok |
| Immunization admin | 56 | 7.0% | 5% | ok |
| Developmental screening (96110) | 42 | 5.3% | 1% | ok |
| Behavioral screening (96127) | 28 | 3.5% | 1.5% | ok |
| Vision screening | 15 | 1.9% | 1% | ok |
| Hearing screening | 6 | 0.8% | 0.5% | ok |
| Health risk assessment | 3 | 0.4% | 1% | **flag** |
| Anemia screening | 8 | 1.0% | 0.5% | ok |
| Point-of-care testing | 45 | 5.6% | 1% | ok |

Detected: 9. Ok: 8. Score: **(8/9) * 100 = 89**.

Provider A does almost everything at believable volume. Health risk assessments are present but at trace volume, flagged.


Provider B: 600 total visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Well-child visits | 150 | 25.0% | 8% | ok |
| Immunization admin | 35 | 5.8% | 5% | ok |
| Developmental screening (96110) | 2 | 0.3% | 1% | **flag** |
| Behavioral screening (96127) | 1 | 0.2% | 1.5% | **flag** |
| Vision screening | 0 | 0.0% | 1% | not_detected |
| Hearing screening | 0 | 0.0% | 0.5% | not_detected |
| Health risk assessment | 0 | 0.0% | 1% | not_detected |
| Anemia screening | 4 | 0.7% | 0.5% | ok |
| Point-of-care testing | 40 | 6.7% | 1% | ok |

Detected: 6. Ok: 4. Score: **(4/6) * 100 = 67**.

Provider B bills 96110 and 96127 but at volumes that suggest they are not part of routine workflow. Flagged. Vision, hearing, and health risk assessment are not billed at all, so they are excluded from the score (already penalized in peer comparison).


---

# PART D: HOW THIS FITS WITH THE OTHER TWO SCORES

---


## 8. The Three Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **Guideline Concordance** | Does this provider do what AAP says they should? | AAP / Bright Futures clinical guidelines |
| **Peer Comparison** | Does this provider's billing pattern look like a normal pediatrician's? | The peer cohort (top 25 codes) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |

They catch different problems:

| Problem | Guideline | Peer | Volume |
|---|---|---|---|
| Provider never screens | Caught (low screening domain) | Caught (missing screening codes) | Not applicable (nothing to check) |
| Provider bills screening codes but only 1-2 times a year | Partial (volume metric is low) | Not caught (code is present) | **Caught** (below floor, flagged) |
| Provider does everything but in wrong proportions | Missed (guideline scores may still be ok) | Caught (low volume concordance) | Partially caught (some categories may be below floor) |
| Provider does nothing beyond sick visits | Caught (low across all domains) | Caught (low code + category coverage) | Neutral (no categories to check, score = 50) |

Volume adequacy is the behavior check. It sits between the other two and says: "your peer comparison score says you bill these codes, but do you really?"


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Floors are estimates, not validated thresholds.** We set floors at roughly one-third of the peer median. This is reasonable but not clinically validated. If the peer median for 96110 is actually 2% instead of 3%, the floor should be lower. Floors should be recalibrated once we have the actual CMS data loaded and can compute real peer medians.

**Panel age mix affects expected rates.** A provider with a mostly adolescent panel will have lower 96110 volume (developmental screening is for ages 0-3) and higher 96127 volume (depression screening is for ages 12+). Volume adequacy does not adjust for panel composition. With aggregated data, we cannot.

**Lab codes may be billed by the lab, not the ordering provider.** 85018 (hemoglobin) and 36416 (capillary blood) may show up under a reference lab's NPI, not the pediatrician's. A provider who orders these tests but uses an external lab will be flagged here. Known limitation.

**The 50 neutral fallback is a design choice, not a clinical judgment.** A provider with no detected screening or testing categories could genuinely be practicing low-quality medicine. But they could also be a locum, a new provider, or someone with a non-standard billing setup. We choose not to penalize ambiguity and let the peer comparison score handle the absence signal.

**Immunization admin floor uses visit volume as denominator, not total services.** Total services includes every claim line (each vaccine dose is a separate line). Immunization admin codes would dominate if measured against total services. We use visit volume to keep the ratio interpretable.

**Floors should be rebuilt annually.** As new codes emerge (G2211 was new in 2024) and practice patterns shift, the peer median rates change. Recalibrate floors each year from fresh claims data.


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
| total_visit_volume | int | Total E/M visits (sick + preventive) in measurement year |
| well_child_services | int | Service count for well-child codes |
| well_child_rate | float | well_child_services / total_visit_volume |
| well_child_status | string | "ok", "flag", or "not_detected" |
| immunization_admin_services | int | Service count for admin codes |
| immunization_admin_rate | float | Rate |
| immunization_admin_status | string | Status |
| dev_screening_services | int | 96110 service count |
| dev_screening_rate | float | Rate |
| dev_screening_status | string | Status |
| behavioral_screening_services | int | 96127 service count |
| behavioral_screening_rate | float | Rate |
| behavioral_screening_status | string | Status |
| vision_screening_services | int | 99173 + 99177 service count |
| vision_screening_rate | float | Rate |
| vision_screening_status | string | Status |
| hearing_screening_services | int | 92551 service count |
| hearing_screening_rate | float | Rate |
| hearing_screening_status | string | Status |
| health_risk_services | int | 96160 + 96161 service count |
| health_risk_rate | float | Rate |
| health_risk_status | string | Status |
| anemia_screening_services | int | 85018 + 36416 service count |
| anemia_screening_rate | float | Rate |
| anemia_screening_status | string | Status |
| poc_testing_services | int | 87880 + 87804 service count |
| poc_testing_rate | float | Rate |
| poc_testing_status | string | Status |
| detected_categories | int | Count of categories with status ok or flag (0-9) |
| ok_categories | int | Count of categories with status ok (0-9) |
| flagged_categories | int | Count of categories with status flag (0-9) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
