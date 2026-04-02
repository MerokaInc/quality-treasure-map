# Gynecology Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A gynecologist who bills 58100 (endometrial biopsy) twice in a year while seeing 500 patients is not really doing endometrial sampling. They billed it twice, maybe a one-off, maybe a coding artifact. A gynecologist who bills 58100 30 times with 500 patients is genuinely evaluating abnormal uterine bleeding. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.

**Scope: Gynecology only.** No obstetric codes. This doc applies to providers whose taxonomy and billing pattern indicate a gynecology-focused practice, not a delivery-heavy OB practice.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other sub-treasure maps:

1. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024.
2. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count.
3. **NPPES NPI Registry** — provider identification, taxonomy codes.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.


### Taxonomy Filtering

| Include / Exclude | Taxonomy | Description |
|---|---|---|
| **Primary include** | 207VG0400X | Gynecology |
| **Conditional include** | 207V00000X | Obstetrics & Gynecology (general), only if <5% of total services are delivery codes (59400, 59409, 59410, 59510, 59514, 59515, 59610, 59612, 59614, 59618, 59620, 59622) |
| **Exclude** | 207VX0201X | Gynecologic Oncology |
| **Exclude** | 207VF0040X | Female Pelvic Medicine & Reconstructive Surgery |
| **Exclude** | 207VM0101X | Maternal & Fetal Medicine |
| **Exclude** | 207VE0102X | Reproductive Endocrinology |

The conditional include for 207V00000X matters because most OB-GYN providers carry the general taxonomy code. We need a behavioral filter: if delivery codes make up 5% or more of their volume, they are practicing obstetrics and should be scored under an OB framework, not this one. Below 5% delivery volume, they are functionally a gynecology practice.

**Minimum volume threshold:** >= 100 total services across both CMS files (Medicare + Medicaid combined). Below that, insufficient data.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total E/M office visit count (new + established), which is the best proxy we have for practice size.

```
visit_codes = [99201, 99202, 99203, 99204, 99205,        -- new patient
               99211, 99212, 99213, 99214, 99215]        -- established patient

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

**No preventive visit codes in the denominator.** Unlike pediatrics (where well-child visits are part of the denominator), we exclude preventive codes (99385, 99386, 99395, 99396) from the denominator here. Well-woman preventive visits are a checked category, not a baseline. Keeping them out of the denominator makes the ratio comparable across providers who do varying amounts of preventive care.

If `total_visit_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from peer median volume data, set at roughly one-third of the peer median rate. The idea: if the peer median for cervical specimen collection is 8% of total volume, the floor is ~2.5%. Anything below that is a trace, not a practice pattern.


### Geographic Grouping of Floors

The floors in the table below are national defaults. In production, floors should be computed at the **state level** from the state peer cohort median, because practice patterns vary by state:

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all gynecology NPIs in the state. Floor = median / 3. | Primary scoring. A provider in TX is evaluated against TX norms. |
| **National** | Floors from the table below (national data). | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Urban vs. rural have different procedure and lab patterns. Not implemented now, but the data supports it once cohort sizes are large enough. |

When using state-level floors, the output should record which state peer cohort was used and the cohort size. If a state cohort has fewer than 50 active gynecology providers, fall back to national floors.


| # | Category | Codes | Peer Median Rate (est.) | Floor (median/3) | What the Floor Means |
|---|---|---|---|---|---|
| 1 | Well-woman preventive visits | 99385, 99386, 99395, 99396 | ~25% of total visits | 8% | Provider does well-woman care as a real part of practice, not occasionally |
| 2 | Cervical specimen collection | Q0091 | ~8% of visits | 2.5% | Provider routinely collects Pap/HPV specimens, not just 1-2 per year |
| 3 | Colposcopy | 57452, 57454, 57460 | ~4% of visits | 1% | Provider evaluates/treats abnormal cervical screening routinely |
| 4 | Pelvic/transvaginal imaging | 76830, 76856 | ~8% of visits | 2.5% | Provider does in-office ultrasound as standard diagnostic tool |
| 5 | Endometrial biopsy | 58100 | ~3% of visits | 1% | Provider performs endometrial sampling for AUB evaluation routinely |
| 6 | IUD services | 58300, 58301 | ~4% of visits | 1% | Provider inserts/removes IUDs as routine part of practice |
| 7 | Contraceptive implant services | 11981, 11982 | ~2% of visits | 0.5% | Provider offers subdermal implants, not just a one-off |
| 8 | Hysteroscopy | 58558 | ~2% of visits | 0.5% | Provider does hysteroscopic evaluation/treatment routinely |
| 9 | Urinalysis | 81003 | ~4% of visits | 1% | Provider performs basic urine testing as standard workup |


**Why only 9 categories, not every gynecology code?**

We do not volume-check every individual code. E/M visit codes (99213, 99214) do not need volume floors. If a provider is seeing patients at all, those codes are inherently high-volume. The volume check matters for the categories where a provider might bill a code a few times without it being a real practice pattern: preventive visits, specimen collection, procedures, diagnostic imaging, contraceptive services.


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

If a provider only bills office visit codes (no preventive visits, no procedures, no specimen collection, no imaging), they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing, the answer is neither yes nor no. It is 50.


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
        AND hcpcs_code IN visit_codes       -- [99201-99205, 99211-99215]
        AND year = 2023

    IF total_visit_volume < 50: RETURN insufficient_data

STEP 2: For each category, compute rate and status

    Category: Cervical Specimen Collection
        codes = [Q0091]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.025
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.025
                 "flag"         IF rate < 0.025 AND services > 0

    (repeat for all 9 categories)

STEP 3: Compute score
    detected = count of categories with status "ok" or "flag"
    ok = count of categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 4: Output detail
    For each category, record: name, services, rate, floor, status
```


## 7. Worked Examples

### Provider A: Broad gynecology practice, one trace category

Provider A: 700 total E/M visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Well-woman preventive visits | 210 | 30.0% | 8% | ok |
| Cervical specimen collection (Q0091) | 63 | 9.0% | 2.5% | ok |
| Colposcopy | 35 | 5.0% | 1% | ok |
| Pelvic/transvaginal imaging | 56 | 8.0% | 2.5% | ok |
| Endometrial biopsy (58100) | 21 | 3.0% | 1% | ok |
| IUD services | 42 | 6.0% | 1% | ok |
| Contraceptive implant services | 7 | 1.0% | 0.5% | ok |
| Hysteroscopy (58558) | 2 | 0.3% | 0.5% | **flag** |
| Urinalysis (81003) | 35 | 5.0% | 1% | ok |

Detected: 9. Ok: 8. Score: **(8/9) * 100 = 89**.

Provider A does almost everything at believable volume. Hysteroscopy is present but at trace volume (2 cases out of 700 visits), flagged. The rest looks like a real, full-scope gynecology practice.


### Provider B: Narrow practice, multiple gaps

Provider B: 500 total E/M visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Well-woman preventive visits | 30 | 6.0% | 8% | **flag** |
| Cervical specimen collection (Q0091) | 20 | 4.0% | 2.5% | ok |
| Colposcopy | 3 | 0.6% | 1% | **flag** |
| Pelvic/transvaginal imaging | 0 | 0.0% | 2.5% | not_detected |
| Endometrial biopsy (58100) | 10 | 2.0% | 1% | ok |
| IUD services | 8 | 1.6% | 1% | ok |
| Contraceptive implant services | 0 | 0.0% | 0.5% | not_detected |
| Hysteroscopy (58558) | 0 | 0.0% | 0.5% | not_detected |
| Urinalysis (81003) | 15 | 3.0% | 1% | ok |

Detected: 6. Ok: 4. Score: **(4/6) * 100 = 67**.

Provider B bills well-woman visits but below the floor (6% vs. 8% threshold), suggesting preventive care is not a core part of this practice. Colposcopy is present at trace volume (3 cases). No imaging, no implants, no hysteroscopy at all, so those are excluded from scoring (already penalized in peer comparison).


### Provider C: E/M only, no procedures or preventive codes

Provider C: 400 total E/M visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Well-woman preventive visits | 0 | 0.0% | 8% | not_detected |
| Cervical specimen collection (Q0091) | 0 | 0.0% | 2.5% | not_detected |
| Colposcopy | 0 | 0.0% | 1% | not_detected |
| Pelvic/transvaginal imaging | 0 | 0.0% | 2.5% | not_detected |
| Endometrial biopsy (58100) | 0 | 0.0% | 1% | not_detected |
| IUD services | 0 | 0.0% | 1% | not_detected |
| Contraceptive implant services | 0 | 0.0% | 0.5% | not_detected |
| Hysteroscopy (58558) | 0 | 0.0% | 0.5% | not_detected |
| Urinalysis (81003) | 0 | 0.0% | 1% | not_detected |

Detected: 0. Ok: 0. Score: **50 (neutral)**.

Provider C only bills office visit codes. No preventive visits, no procedures, no labs. Volume adequacy cannot evaluate a provider who claims to do nothing beyond E/M visits. The peer comparison score handles this (low code coverage, low category coverage). Volume adequacy returns neutral.


---

# PART D: HOW THIS FITS WITH THE OTHER TWO SCORES

---


## 8. The Three Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **ACOG Concordance** | Does this provider do what ACOG guidelines say they should? | ACOG clinical guidelines for well-woman care, screening, and contraception |
| **Peer Comparison** | Does this provider's billing pattern look like a normal gynecologist's? | The peer cohort (top codes by volume) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |

They catch different problems:

| Problem | ACOG Concordance | Peer Comparison | Volume Adequacy |
|---|---|---|---|
| Provider never does cervical screening | Caught (low screening domain) | Caught (missing Q0091, colposcopy codes) | Not applicable (nothing to check) |
| Provider bills Q0091 but only 2 times a year on 500 visits | Partial (presence metric satisfied, volume metric low) | Not caught (code is present in billing) | **Caught** (2.5% floor not met at 0.4%, flagged) |
| Provider bills everything but in wrong proportions | Missed (concordance scores may still pass) | Caught (low volume concordance) | Partially caught (some categories may fall below floor) |
| Provider does nothing beyond office visits | Caught (low across all domains) | Caught (low code + category coverage) | Neutral (no categories to check, score = 50) |
| Provider bills IUD codes twice but never does contraceptive counseling at scale | Not directly caught | Not caught (code exists) | **Caught** (1% floor not met, flagged) |

Volume adequacy is the behavior check. It sits between the other two and says: "your peer comparison score says you bill these codes, but do you really?"


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Floors are estimates, not validated thresholds.** We set floors at roughly one-third of the peer median. This is reasonable but not clinically validated. If the peer median for Q0091 is actually 5% instead of 8%, the floor should be lower. Floors should be recalibrated once we have the actual CMS data loaded and can compute real peer medians.

**Case mix affects expected rates.** A gynecologist with a predominantly postmenopausal panel will have lower contraceptive service volume (IUDs, implants) and higher endometrial biopsy or imaging volume. A provider focused on younger women will show the opposite pattern. Volume adequacy does not adjust for panel age composition. With aggregated CMS data, we cannot see patient age distributions.

**Lab codes may be billed by the external lab, not the ordering provider.** Q0091 (cervical specimen collection) is typically billed by the provider performing the collection, but urinalysis (81003) may show up under a reference lab's NPI instead of the gynecologist's. A provider who orders urinalysis but uses an external lab will appear to have no urinalysis volume. Known limitation.

**Surgical codes depend on facility access.** Hysteroscopy (58558) requires a procedure suite or operating room access. A gynecologist who practices in a setting without procedural facilities will have zero hysteroscopy volume even if they are clinically competent. This shows up as not_detected (excluded from scoring, not penalized), but if they bill it once or twice from a borrowed OR day, it becomes a flag.

**Well-woman visits may be split with PCP.** Some women get their annual preventive exam from a primary care provider and see the gynecologist only for specific problems. A gynecologist in a health system where PCPs do annual exams will have lower well-woman visit volume, not because they are a worse gynecologist but because their role is different. The 8% floor is set low enough to accommodate this, but edge cases will exist.

**The 50 neutral fallback is a design choice, not a clinical judgment.** A provider with no detected procedure or screening categories could genuinely be practicing low-quality gynecology. But they could also be a new provider, a locum, or someone with a non-standard billing arrangement. We choose not to penalize ambiguity and let the peer comparison score handle the absence signal.

**Floors should be rebuilt annually.** As practice patterns shift and new codes emerge, the peer median rates change. Recalibrate floors each year from fresh claims data.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort set the floors |
| floor_cohort_state | string | State used for floor computation (or "US" if national) |
| floor_cohort_size | int | Number of peers in the cohort used to compute floors |
| total_visit_volume | int | Total E/M visits (office visits only, no preventive codes) in measurement year |
| wellwoman_services | int | Service count for 99385, 99386, 99395, 99396 |
| wellwoman_rate | float | wellwoman_services / total_visit_volume |
| wellwoman_status | string | "ok", "flag", or "not_detected" |
| cervical_collection_services | int | Service count for Q0091 |
| cervical_collection_rate | float | Rate |
| cervical_collection_status | string | Status |
| colposcopy_services | int | Service count for 57452, 57454, 57460 |
| colposcopy_rate | float | Rate |
| colposcopy_status | string | Status |
| pelvic_imaging_services | int | Service count for 76830, 76856 |
| pelvic_imaging_rate | float | Rate |
| pelvic_imaging_status | string | Status |
| endometrial_biopsy_services | int | Service count for 58100 |
| endometrial_biopsy_rate | float | Rate |
| endometrial_biopsy_status | string | Status |
| iud_services | int | Service count for 58300, 58301 |
| iud_rate | float | Rate |
| iud_status | string | Status |
| contraceptive_implant_services | int | Service count for 11981, 11982 |
| contraceptive_implant_rate | float | Rate |
| contraceptive_implant_status | string | Status |
| hysteroscopy_services | int | Service count for 58558 |
| hysteroscopy_rate | float | Rate |
| hysteroscopy_status | string | Status |
| urinalysis_services | int | Service count for 81003 |
| urinalysis_rate | float | Rate |
| urinalysis_status | string | Status |
| detected_categories | int | Count of categories with status ok or flag (0-9) |
| ok_categories | int | Count of categories with status ok (0-9) |
| flagged_categories | int | Count of categories with status flag (0-9) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
