# Retina Specialist Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A retina specialist who bills 92134 (OCT) five times in a year while performing 600 injections is not monitoring patients with imaging. They billed OCT five times, maybe for a consult, maybe by accident. A retina specialist who bills 92134 550 times with 600 injections is genuinely imaging most injection patients. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other docs:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count. Primary source for retina.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count. Supplementary.
3. **NPPES NPI Registry** — provider identification, taxonomy 207W00000X.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit + Injection Volume as the Denominator

Every volume check is a ratio: category volume divided by a relevant denominator. For retina, the denominator depends on the category being checked. We use two denominators:

**Denominator A: Total encounter volume** (for imaging and exam categories)
```
encounter_codes = [92014, 92012, 92004, 92002,          -- ophthalmologic exams
                   99213, 99214, 99215, 99205, 99204,   -- E/M visits
                   67028]                                -- injection visits (each is an encounter)

total_encounter_volume = SUM(total_services) WHERE hcpcs_code IN encounter_codes
```

> **ASSUMPTION:** We include 67028 (intravitreal injection) in the encounter denominator because each injection visit is a patient encounter. In retina practice, injection visits are the dominant encounter type and should be counted. If we only used exam codes, the denominator would drastically undercount encounters for injection-heavy providers.

**Denominator B: Total injection volume** (for drug and imaging-to-injection categories)
```
injection_volume = SUM(total_services) WHERE hcpcs_code = '67028'
```

If `total_encounter_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of the relevant denominator that constitutes believable, routine practice. Floors are derived from the peer median volume data, set at roughly one-third of the peer median rate.

### Geographic Grouping of Floors

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all retina NPIs in the state. Floor = median / 3. | Primary scoring. |
| **National** | Floors from the table below (national estimates). | Fallback when state cohort < 30 retina specialists. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Not implemented now. |

> **ASSUMPTION — Floor Estimates:** The peer median rates and floors below are estimates based on retina practice patterns. They must be validated against actual CMS data once the pipeline is built. Retina practice patterns differ significantly from primary care — the expected rates for imaging and injections are much higher.
>
> **EXTERNAL RESOURCE NEEDED:** CMS Medicare data filtered for the retina specialist peer cohort to compute actual peer median rates per category. The ASRS Preferences and Trends (PAT) survey data (https://www.asrs.org/) can serve as a validation benchmark.

| # | Category | Codes | Denominator | Peer Median Rate | Floor | What the Floor Means |
|---|---|---|---|---|---|---|
| 1 | OCT monitoring | 92134 | injection_volume | ~90% of injections | 30% | Provider is doing OCT at a meaningful proportion of injection visits, not just occasionally |
| 2 | Fundus photography | 92250 | total_encounter_volume | ~15% of encounters | 5% | Provider documents retinal findings with photography as part of routine workflow |
| 3 | Fluorescein angiography | 92235 | total_encounter_volume | ~5% of encounters | 1.5% | Provider uses FA for diagnosis and treatment planning, not as a one-off |
| 4 | Anti-VEGF drug codes | J0178, J9035, J2778 | injection_volume | ~85% of injections | 25% | Provider bills drug codes alongside injection codes (not all billed under facility) |
| 5 | Laser photocoagulation | 67210, 67228 | total_encounter_volume | ~3% of encounters | 1% | Provider uses laser as part of treatment repertoire, not trace billing |
| 6 | B-scan ultrasound | 76512 | total_encounter_volume | ~2% of encounters | 0.5% | Provider performs ultrasound for surgical planning or media opacities routinely |
| 7 | Vitreoretinal surgery | 67036-67043, 67108, 67113 | total_encounter_volume | ~2% of encounters | 0.5% | Provider performs surgery as a real part of their practice |
| 8 | New patient evaluations | 92004, 92002, 99205, 99204 | total_encounter_volume | ~8% of encounters | 3% | Provider takes new patients at a rate consistent with an active practice |
| 9 | Retinal detachment prophylaxis/repair | 67145, 67101, 67105, 67108, 67110, 67113 | total_encounter_volume | ~1% of encounters | 0.3% | Provider manages retinal detachments as part of practice |


**Why only 9 categories, not 25 codes?**

We do not volume-check every individual code. The core injection code (67028) and standard exam codes (92014, 99214) do not need volume floors — if a provider is seeing patients and injecting at all, those codes are inherently high-volume. The volume check matters for categories where a provider might bill a code a few times without it being a real practice pattern: imaging beyond OCT, laser, surgery, ultrasound.

> **ASSUMPTION:** Category 4 (anti-VEGF drug codes) is the most problematic for volume checking due to the facility billing issue. Hospital-based retina specialists will systematically show low or zero J-code volume under their NPI even though they are actively using these drugs. If the cohort has significant hospital-based representation, consider dropping this category or building a facility-adjusted floor. The `single_payer` flag from the payer diversity doc can help identify hospital-based patterns.


## 3. Scoring Each Category

For each of the 9 categories, the logic is:

```
category_services = SUM(total_services) WHERE hcpcs_code IN category_codes
category_rate = category_services / relevant_denominator

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
    volume_adequacy_score = 50     -- neutral fallback
ELSE:
    volume_adequacy_score = (ok_categories / detected_categories) * 100
```

| Score | Interpretation |
|---|---|
| 100 | Every detected category is at believable volume. This provider's practice patterns are real. |
| 75-99 | Most categories are adequate. One or two are flagged as low-volume. |
| 50-74 | Mixed. Several categories are present but at trace volume. Investigate. |
| Below 50 | Most detected categories are below floor. Provider may be billing codes they do not routinely perform. |
| 50 (neutral) | No measurable categories detected. Cannot evaluate. Not a fail. |


## 5. Why the Neutral Fallback Matters

If a retina specialist only bills injections and exams (no imaging codes, no surgery, no laser), they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing beyond core injection work, the answer is neither yes nor no. It is 50.


---

# PART C: BUSINESS LOGIC DETAIL

---


## 6. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023

STEP 1: Get encounter volumes
    total_encounter_volume = SUM(total_services)
        WHERE npi = "1234567890"
        AND hcpcs_code IN encounter_codes
        AND year = 2023

    injection_volume = SUM(total_services)
        WHERE npi = "1234567890"
        AND hcpcs_code = '67028'

    IF total_encounter_volume < 50: RETURN insufficient_data

STEP 2: For each category, compute rate and status

    Category: OCT monitoring
        codes = [92134]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / injection_volume
        floor = 0.30
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.30
                 "flag"         IF rate < 0.30 AND services > 0

    (repeat for all 9 categories)

STEP 3: Compute score
    detected = count of categories with status "ok" or "flag"
    ok = count of categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 4: Output detail
    For each category, record: name, services, rate, floor, status
```


## 7. Worked Examples

**Provider A: Full-spectrum retina specialist.** 1,200 total encounters, 800 injections in 2023.

| Category | Services | Rate | Denominator | Floor | Status |
|---|---|---|---|---|---|
| OCT monitoring (92134) | 720 | 90.0% of injections | injection_volume | 30% | ok |
| Fundus photography (92250) | 240 | 20.0% of encounters | encounter_volume | 5% | ok |
| Fluorescein angiography (92235) | 85 | 7.1% of encounters | encounter_volume | 1.5% | ok |
| Anti-VEGF drug codes | 760 | 95.0% of injections | injection_volume | 25% | ok |
| Laser photocoagulation | 35 | 2.9% of encounters | encounter_volume | 1% | ok |
| B-scan ultrasound (76512) | 18 | 1.5% of encounters | encounter_volume | 0.5% | ok |
| Vitreoretinal surgery | 30 | 2.5% of encounters | encounter_volume | 0.5% | ok |
| New patient evaluations | 110 | 9.2% of encounters | encounter_volume | 3% | ok |
| Retinal detachment work | 12 | 1.0% of encounters | encounter_volume | 0.3% | ok |

Detected: 9. Ok: 9. Score: **(9/9) * 100 = 100**.

Provider A does everything at believable volume. Full-spectrum retina practice.


**Provider B: Medical retina specialist, injection-focused.** 900 total encounters, 700 injections in 2023.

| Category | Services | Rate | Denominator | Floor | Status |
|---|---|---|---|---|---|
| OCT monitoring (92134) | 650 | 92.9% of injections | injection_volume | 30% | ok |
| Fundus photography (92250) | 80 | 8.9% of encounters | encounter_volume | 5% | ok |
| Fluorescein angiography (92235) | 25 | 2.8% of encounters | encounter_volume | 1.5% | ok |
| Anti-VEGF drug codes | 680 | 97.1% of injections | injection_volume | 25% | ok |
| Laser photocoagulation | 5 | 0.6% of encounters | encounter_volume | 1% | **flag** |
| B-scan ultrasound (76512) | 0 | 0.0% | — | — | not_detected |
| Vitreoretinal surgery | 0 | 0.0% | — | — | not_detected |
| New patient evaluations | 60 | 6.7% of encounters | encounter_volume | 3% | ok |
| Retinal detachment work | 0 | 0.0% | — | — | not_detected |

Detected: 6. Ok: 5. Score: **(5/6) * 100 = 83**.

Provider B is a strong medical retina specialist. Laser is present but at trace volume — flagged. Surgical categories are not detected (already penalized in peer comparison). Score reflects that what they DO claim to do is mostly at believable volume.


**Provider C: Hospital-based retina specialist, drug codes billed under facility.** 1,000 total encounters, 750 injections.

| Category | Services | Rate | Denominator | Floor | Status |
|---|---|---|---|---|---|
| OCT monitoring (92134) | 700 | 93.3% of injections | injection_volume | 30% | ok |
| Fundus photography (92250) | 150 | 15.0% of encounters | encounter_volume | 5% | ok |
| Fluorescein angiography (92235) | 40 | 4.0% of encounters | encounter_volume | 1.5% | ok |
| Anti-VEGF drug codes | 3 | 0.4% of injections | injection_volume | 25% | **flag** |
| Laser photocoagulation | 20 | 2.0% of encounters | encounter_volume | 1% | ok |
| B-scan ultrasound (76512) | 15 | 1.5% of encounters | encounter_volume | 0.5% | ok |
| Vitreoretinal surgery | 25 | 2.5% of encounters | encounter_volume | 0.5% | ok |
| New patient evaluations | 90 | 9.0% of encounters | encounter_volume | 3% | ok |
| Retinal detachment work | 8 | 0.8% of encounters | encounter_volume | 0.3% | ok |

Detected: 9. Ok: 8. Score: **(8/9) * 100 = 89**.

Provider C does everything at volume except drug codes — they are flagged because J-codes are billed under the hospital. This is the known facility billing artifact. The provider is otherwise high quality.


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## 8. The Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **Guideline Concordance** | Does this provider do what ASRS/AAO says they should? | ASRS/AAO clinical guidelines |
| **Peer Comparison** | Does this provider's billing pattern look like a normal retina specialist's? | The peer cohort (top 25 codes) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |

They catch different problems:

| Problem | Guideline | Peer | Volume |
|---|---|---|---|
| Provider never images patients | Caught (low imaging domain) | Caught (missing imaging codes) | Not applicable (nothing to check) |
| Provider bills OCT but only 5 times a year while injecting 600 times | Partial (OCT-to-injection ratio is low) | Not caught (code is present) | **Caught** (below floor, flagged) |
| Provider does everything but in wrong proportions | Missed (guideline scores may be ok) | Caught (low volume concordance) | Partially caught (some categories may be below floor) |
| Provider does nothing beyond injections | Caught (low across imaging + surgical domains) | Caught (low code + category coverage) | Neutral (no additional categories to check, score = 50) |

Volume adequacy is the behavior check. It sits between the other two and says: "your peer comparison score says you bill these codes, but do you really?"


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Floors are estimates, not validated thresholds.** Set at roughly one-third of estimated peer medians. Actual peer medians must be computed from CMS data. If the peer median OCT-to-injection rate is actually 80% instead of 90%, the floor should be lower.

**The facility billing artifact distorts drug code volume.** Hospital-based retina specialists will systematically flag on Category 4 (anti-VEGF drug codes). This is a data artifact, not a quality signal. Consider either (a) excluding Category 4 for hospital-based providers, or (b) identifying hospital-based providers via place-of-service data in Medicare and adjusting accordingly.

**Case mix affects expected rates.** A provider with a predominantly surgical retina practice will have different imaging rates than an injection-focused medical retina practice. Volume adequacy does not adjust for case mix.

**New practices will have incomplete patterns.** A retina specialist in their first year may not have billed all categories at full volume. Require ≥12 months of data before scoring.

**B-scan and ICG have legitimate low utilization.** B-scan ultrasound (76512) and ICG angiography (92240) are used for specific clinical scenarios (media opacities, polypoidal choroidal vasculopathy). A provider who never needs B-scan has a healthy patient population, not a quality deficiency. The "not_detected" status handles this appropriately.

**The 50 neutral fallback is a design choice.** A provider with no detected categories beyond core injections + exams could be practicing excellent narrow medicine or could be underserving patients. We choose not to penalize ambiguity.

**Floors should be rebuilt annually.** As practice patterns evolve (new drugs, new imaging modalities, changes in laser utilization), peer median rates change. Recalibrate annually.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| geo_group_level | string | "state", "national", or "zip3" |
| floor_cohort_state | string | State used for floor computation (or "US") |
| floor_cohort_size | int | Number of peers in cohort |
| total_encounter_volume | int | Total encounters (exams + injections) |
| injection_volume | int | Total 67028 services |
| oct_services | int | 92134 service count |
| oct_rate | float | oct_services / injection_volume |
| oct_status | string | "ok", "flag", or "not_detected" |
| fundus_photo_services | int | 92250 service count |
| fundus_photo_rate | float | Rate against encounter volume |
| fundus_photo_status | string | Status |
| fa_services | int | 92235 service count |
| fa_rate | float | Rate against encounter volume |
| fa_status | string | Status |
| drug_code_services | int | J0178 + J9035 + J2778 service count |
| drug_code_rate | float | Rate against injection volume |
| drug_code_status | string | Status |
| laser_services | int | 67210 + 67228 service count |
| laser_rate | float | Rate against encounter volume |
| laser_status | string | Status |
| bscan_services | int | 76512 service count |
| bscan_rate | float | Rate against encounter volume |
| bscan_status | string | Status |
| surgery_services | int | Vitrectomy + retinal repair service count |
| surgery_rate | float | Rate against encounter volume |
| surgery_status | string | Status |
| new_patient_services | int | New patient exam service count |
| new_patient_rate | float | Rate against encounter volume |
| new_patient_status | string | Status |
| rd_services | int | Retinal detachment procedure count |
| rd_rate | float | Rate against encounter volume |
| rd_status | string | Status |
| detected_categories | int | Count with status ok or flag (0-9) |
| ok_categories | int | Count with status ok (0-9) |
| flagged_categories | int | Count with status flag (0-9) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
