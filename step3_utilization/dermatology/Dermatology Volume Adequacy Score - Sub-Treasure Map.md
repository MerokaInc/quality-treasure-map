# Dermatology Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A dermatologist who bills 11102 (skin biopsy) five times in a year while seeing 600 patients is not routinely biopsying suspicious lesions. They billed it five times, maybe during a single busy week. A dermatologist who bills 11102 120 times with 600 patients is genuinely evaluating skin lesions as part of their core workflow. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other scoring docs:

1. **CMS Medicare Physician & Other Practitioners** -- NPI + HCPCS + service count + beneficiary count, 2018-2024.
2. **NPPES NPI Registry** -- provider identification, taxonomy 207N00000X.

Subspecialists are excluded from the cohort: 207ND0101X (MOHS surgery), 207ND0900X, 207NI0002X, 207NP0225X, 207NS0135X. These subspecialties have fundamentally different procedure mixes and should not be evaluated on the same floors.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.

**Minimum volume:** providers must have >= 100 Medicare services across all codes to be included. This is the general dermatology minimum, not the visit-specific threshold below.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total E/M visit count, which is the best proxy we have for practice size.

```
visit_codes = [99201, 99202, 99203, 99204, 99205,        -- new patient
               99211, 99212, 99213, 99214, 99215]        -- established patient

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

If `total_visit_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.

Note: dermatology does not have preventive visit codes (no well-child equivalent). The denominator is purely sick/evaluation visits, which is what makes it clean. Nearly all dermatology encounters start with an E/M code.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from the peer median volume data, set at roughly one-third of the peer median rate. The idea: if the peer median for skin biopsy is 20% of total visit volume, the floor is 7%. Anything below that is a trace, not a practice pattern.


### Geographic Grouping of Floors

The floors in the table below are national defaults. In production, floors should be computed at the **state level** from the state peer cohort median, because practice patterns vary by state:

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all general dermatology NPIs in the state. Floor = median / 3. | Primary scoring. A provider in FL is evaluated against FL norms. |
| **National** | Floors from the table below (national CMS data). | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Sun Belt vs. northern states have very different AK destruction and skin cancer rates. Not implemented now, but the data supports it once cohort sizes are large enough. |

When using state-level floors, the output should record which state peer cohort was used and the cohort size. If a state cohort has fewer than 50 active general dermatologists, fall back to national floors.


| # | Category | Codes | Peer Median Rate | Floor (median/3) | What the Floor Means |
|---|---|---|---|---|---|
| 1 | Skin biopsy | 11102, 11104 | ~20% of visits | 7% | Provider biopsies suspicious lesions routinely, not just 1-2 per year |
| 2 | AK destruction | 17000, 17003, 17004 | ~25% of visits | 8% | Provider treats actinic keratoses as standard practice (very common in Medicare panel) |
| 3 | Wart destruction | 17110, 17111 | ~5% of visits | 1.5% | Provider treats warts routinely |
| 4 | Malignant excision | 11600, 11640 | ~5% of visits | 1.5% | Provider excises skin cancers as part of practice, not a rare event |
| 5 | Benign excision | 11400, 11440 | ~4% of visits | 1% | Provider removes benign lesions routinely |
| 6 | I&D / abscess | 10060 | ~2% of visits | 0.5% | Provider drains abscesses/cysts as part of regular workflow |
| 7 | Intralesional injection | 11900 | ~2% of visits | 0.5% | Provider does steroid injections for keloids, alopecia, etc. |
| 8 | Wound repair | 12001 | ~2% of visits | 0.5% | Provider closes wounds after excisions |
| 9 | Pathology | 88305 | ~4% of visits | 1% | Provider reads own dermatopathology (legitimate variation: many send out) |


**Why only 9 categories, not every procedure code?**

We do not volume-check every individual code. E/M visit codes (99213, 99214) do not need volume floors. If a provider is seeing patients at all, those codes are inherently high-volume. Biopsy "each additional" codes (11103, 11105) are also not separately volume-checked since they always accompany the primary biopsy code. The volume check matters for the categories where a provider might bill a code a few times without it being a real practice pattern: procedures, testing, in-office path.

**Special note on category 9 (Pathology):** 88305 is legitimately absent for many dermatologists who send biopsies to external dermatopathology labs. This is a known and expected variation. If absent, it scores "not_detected" and is excluded from the denominator, same as any other not_detected category. It should be interpreted more leniently than procedural categories. A dermatologist who does not read their own path is not practicing worse medicine, they are practicing differently.


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
| 100 | Every detected category is at believable volume. This provider's procedural practice patterns are real. |
| 75-99 | Most categories are adequate. One or two are flagged as low-volume. |
| 50-74 | Mixed. Several categories are present but at trace volume. Investigate which ones. |
| Below 50 | Most detected categories are below floor. Provider may be billing codes they do not routinely perform. |
| 50 (neutral) | No measurable categories detected. Cannot evaluate. Not a fail. |


## 5. Why the Neutral Fallback Matters

If a provider only bills E/M visits (no procedures, no biopsies, no destructions), they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing, the answer is neither yes nor no. It is 50.

This matters for dermatology specifically because some providers practice as "medical derm" only, managing eczema, acne, and psoriasis without performing procedures. They will have low or zero detected procedural categories. That is a different practice style, not necessarily a quality problem. Peer comparison already captures the narrow scope.


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

    Category: Skin Biopsy
        codes = [11102, 11104]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.07
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.07
                 "flag"         IF rate < 0.07 AND services > 0

    (repeat for all 9 categories)

STEP 3: Compute score
    detected = count of categories with status "ok" or "flag"
    ok = count of categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 4: Output detail
    For each category, record: name, services, rate, floor, status
```


## 7. Worked Examples

**Provider A:** 900 total visits in 2023. Full-scope general dermatologist.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Skin biopsy (11102, 11104) | 180 | 20.0% | 7% | ok |
| AK destruction (17000, 17003, 17004) | 270 | 30.0% | 8% | ok |
| Wart destruction (17110, 17111) | 50 | 5.6% | 1.5% | ok |
| Malignant excision (11600, 11640) | 45 | 5.0% | 1.5% | ok |
| Benign excision (11400, 11440) | 40 | 4.4% | 1% | ok |
| I&D / abscess (10060) | 20 | 2.2% | 0.5% | ok |
| Intralesional injection (11900) | 18 | 2.0% | 0.5% | ok |
| Wound repair (12001) | 3 | 0.3% | 0.5% | **flag** |
| Pathology (88305) | 0 | 0.0% | 1% | not_detected |

Detected: 8. Ok: 7. Score: **(7/8) * 100 = 88**.

Provider A does nearly everything at believable volume. Wound repair is present but at trace volume, flagged. Pathology is not billed (sends out to external lab), excluded from score. Strong procedural practice.


**Provider B:** 600 total visits in 2023. Mixed medical/surgical derm.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Skin biopsy (11102, 11104) | 90 | 15.0% | 7% | ok |
| AK destruction (17000, 17003, 17004) | 60 | 10.0% | 8% | ok |
| Wart destruction (17110, 17111) | 4 | 0.7% | 1.5% | **flag** |
| Malignant excision (11600, 11640) | 3 | 0.5% | 1.5% | **flag** |
| Benign excision (11400, 11440) | 2 | 0.3% | 1% | **flag** |
| I&D / abscess (10060) | 0 | 0.0% | 0.5% | not_detected |
| Intralesional injection (11900) | 15 | 2.5% | 0.5% | ok |
| Wound repair (12001) | 0 | 0.0% | 0.5% | not_detected |
| Pathology (88305) | 0 | 0.0% | 1% | not_detected |

Detected: 6. Ok: 3. Score: **(3/6) * 100 = 50 (rounds to 50)**.

Provider B biopsies and destroys AKs at real volume, but wart destruction, malignant excision, and benign excision are all present at trace levels. These codes appear in their billing but are not a routine part of practice. The 3 flagged categories pull the score down.


**Provider C:** 500 total visits in 2023. Medical derm only, no procedures detected.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Skin biopsy (11102, 11104) | 0 | 0.0% | 7% | not_detected |
| AK destruction (17000, 17003, 17004) | 0 | 0.0% | 8% | not_detected |
| Wart destruction (17110, 17111) | 0 | 0.0% | 1.5% | not_detected |
| Malignant excision (11600, 11640) | 0 | 0.0% | 1.5% | not_detected |
| Benign excision (11400, 11440) | 0 | 0.0% | 1% | not_detected |
| I&D / abscess (10060) | 0 | 0.0% | 0.5% | not_detected |
| Intralesional injection (11900) | 0 | 0.0% | 0.5% | not_detected |
| Wound repair (12001) | 0 | 0.0% | 0.5% | not_detected |
| Pathology (88305) | 0 | 0.0% | 1% | not_detected |

Detected: 0. Ok: 0. Score: **50 (neutral fallback)**.

Provider C bills E/M only. No procedural categories detected, so nothing to volume-check. Score defaults to 50. This provider is already penalized in peer comparison for having no code coverage beyond visits.


---

# PART D: HOW THIS FITS WITH THE OTHER TWO SCORES

---


## 8. The Three Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **ACOG Concordance** | Does this provider do what clinical guidelines say they should? | AAD / evidence-based dermatology guidelines |
| **Peer Comparison** | Does this provider's billing pattern look like a normal dermatologist's? | The peer cohort (top codes by volume) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |

They catch different problems:

| Problem | Guideline | Peer | Volume |
|---|---|---|---|
| Provider never biopsies suspicious lesions | Caught (low procedural domain) | Caught (missing biopsy codes) | Not applicable (nothing to check) |
| Provider bills biopsy codes but only 5 times with 600 patients | Partial (volume metric is low) | Not caught (code is present) | **Caught** (below floor, flagged) |
| Provider does everything but in wrong proportions | Missed (guideline scores may still be ok) | Caught (low volume concordance) | Partially caught (some categories may be below floor) |
| Provider does nothing beyond E/M visits | Caught (low across procedural domains) | Caught (low code + category coverage) | Neutral (no categories to check, score = 50) |

Volume adequacy is the behavior check. It sits between the other two and says: "your peer comparison score says you bill these codes, but do you really?"

The key scenario: peer comparison sees a biopsy code present in the provider's billing, but volume adequacy catches that it is only 5 biopsies across 600 patients. That is trace billing, not routine practice. Peer comparison alone would give partial credit. Volume adequacy flags it.


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Floors are estimates, not validated thresholds.** We set floors at roughly one-third of the peer median. This is reasonable but not clinically validated. If the peer median for skin biopsy is actually 15% instead of 20%, the floor should be lower. Floors should be recalibrated once we have the actual CMS data loaded and can compute real peer medians.

**Case mix affects expected rates.** A skin-cancer-heavy practice (Florida, Arizona) will have much higher AK destruction and malignant excision rates than a medical derm practice managing eczema and psoriasis. Volume adequacy does not adjust for case mix composition. With aggregated data, we cannot. State-level floors partially account for this (FL floors will be higher for AK destruction than MN floors), but within-state variation remains.

**88305 pathology may be billed by an external lab.** Many dermatologists send all biopsies to a dermatopathology lab. The lab bills 88305 under its own NPI, not the ordering dermatologist's. A provider who biopsies every suspicious lesion but uses an external pathologist will show "not_detected" for pathology. This is a known and expected variation, which is why pathology is excluded from the score when absent, not penalized.

**Some procedures may be performed in an ASC under a facility NPI.** Excisions done in an ambulatory surgery center are billed under the facility's NPI, not the individual dermatologist's. A provider who does all their excisions at an ASC will have lower excision volumes in their individual claims data. Known limitation.

**Cosmetic procedures are invisible in CMS data.** CMS does not cover cosmetic dermatology (Botox for aesthetic use, laser resurfacing, chemical peels for cosmetic purposes). A provider with a large cosmetic practice may appear to have low procedural volume in Medicare data simply because their procedures are self-pay. This doc only evaluates what CMS can see.

**The 50 neutral fallback is a design choice, not a clinical judgment.** A provider with no detected procedural categories could genuinely be practicing low-quality medicine. But they could also be a medical derm specialist, a new provider, or someone with a non-standard billing setup. We choose not to penalize ambiguity and let the peer comparison score handle the absence signal.

**Floors should be rebuilt annually.** As coding guidelines change and practice patterns shift, peer median rates change. Recalibrate floors each year from fresh claims data.


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
| total_visit_volume | int | Total E/M visits in measurement year |
| skin_biopsy_services | int | Service count for 11102 + 11104 |
| skin_biopsy_rate | float | skin_biopsy_services / total_visit_volume |
| skin_biopsy_status | string | "ok", "flag", or "not_detected" |
| ak_destruction_services | int | Service count for 17000 + 17003 + 17004 |
| ak_destruction_rate | float | Rate |
| ak_destruction_status | string | Status |
| wart_destruction_services | int | Service count for 17110 + 17111 |
| wart_destruction_rate | float | Rate |
| wart_destruction_status | string | Status |
| malignant_excision_services | int | Service count for 11600 + 11640 |
| malignant_excision_rate | float | Rate |
| malignant_excision_status | string | Status |
| benign_excision_services | int | Service count for 11400 + 11440 |
| benign_excision_rate | float | Rate |
| benign_excision_status | string | Status |
| iand_abscess_services | int | Service count for 10060 |
| iand_abscess_rate | float | Rate |
| iand_abscess_status | string | Status |
| intralesional_injection_services | int | Service count for 11900 |
| intralesional_injection_rate | float | Rate |
| intralesional_injection_status | string | Status |
| wound_repair_services | int | Service count for 12001 |
| wound_repair_rate | float | Rate |
| wound_repair_status | string | Status |
| pathology_services | int | Service count for 88305 |
| pathology_rate | float | Rate |
| pathology_status | string | Status |
| detected_categories | int | Count of categories with status ok or flag (0-9) |
| ok_categories | int | Count of categories with status ok (0-9) |
| flagged_categories | int | Count of categories with status flag (0-9) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
