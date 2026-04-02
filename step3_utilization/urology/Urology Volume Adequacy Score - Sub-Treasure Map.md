# Urology Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A urologist who bills 52000 (diagnostic cystoscopy) 3 times in a year while seeing 500 patients is not performing cystoscopy as a routine part of practice. They billed it a handful of times, maybe for a colleague's overflow, maybe for a complex referral. A urologist who bills 52000 75 times with 500 patients is genuinely doing diagnostic cystoscopy as a core part of their workup. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other scoring docs:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count, 2018-2024. This is the primary data source. Urology is Medicare-dominant, so Medicare claims carry the strongest signal.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count (supplementary).
3. **NPPES NPI Registry** — provider identification, taxonomy 208800000X (Urology). Subspecialists excluded: 2088P0231X (Pediatric Urology), 2088F0040X (Female Pelvic Medicine), 2088P0210X (not a recognized primary subspecialty, excluded for cohort purity).

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.

**Minimum volume threshold:** >= 100 total Medicare services across all codes. Urology is Medicare-dominant, and providers below 100 total services are either part-time, winding down, or misclassified.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total E/M office visit count, which is the best proxy we have for practice size.

```
visit_codes = [99201, 99202, 99203, 99204, 99205,        -- new patient
               99211, 99212, 99213, 99214, 99215]        -- established patient

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

If `total_visit_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.

Note: urology does not have preventive visit codes (no 9938x/9939x equivalent). The denominator is purely office E/M visits. This is simpler than pediatrics but still a reliable proxy for practice size.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from peer median volume data, set at roughly one-third of the peer median rate. The idea: if the peer median for diagnostic cystoscopy is 15% of total volume, the floor is 5%. Anything below that is a trace, not a practice pattern.


### Geographic Grouping of Floors

The floors in the table below are national defaults. In production, floors should be computed at the **state level** from the state peer cohort median, because practice patterns vary by state:

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all urology NPIs in the state. Floor = median / 3. | Primary scoring. A provider in TX is evaluated against TX norms. |
| **National** | Floors from the table below (national estimated data). | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Urban vs. rural have different procedure and lab patterns. Not implemented now, but the data supports it once cohort sizes are large enough. |

When using state-level floors, the output should record which state peer cohort was used and the cohort size. If a state cohort has fewer than 50 active urologists, fall back to national floors.


| # | Category | Codes | Peer Median Rate (est.) | Floor (median/3) | What the Floor Means |
|---|---|---|---|---|---|
| 1 | Diagnostic cystoscopy | 52000 | ~15% of visits | 5% | Provider performs cystoscopy as a routine part of practice, not a rare occurrence |
| 2 | PSA testing | 84153 | ~10% of visits | 3% | Provider routinely orders PSA for prostate monitoring, not just occasionally |
| 3 | Urinalysis | 81003, 81001 | ~12% of visits | 4% | Provider does urinalysis as standard workup, not sporadically |
| 4 | Pelvic/renal imaging | 76857, 76770 | ~8% of visits | 2.5% | Provider does in-office ultrasound as part of regular evaluation |
| 5 | Post-void residual | 51798 | ~5% of visits | 1.5% | Provider measures PVR for BPH/LUTS patients routinely |
| 6 | Prostate biopsy | 55700 | ~3% of visits | 1% | Provider performs biopsies as part of prostate cancer workup, not just 1-2 per year |
| 7 | Urine culture | 87086 | ~3% of visits | 1% | Provider orders cultures for UTI workup routinely |
| 8 | Therapeutic cystoscopy | 52310, 52214, 52281, 52234, 52287 | ~5% of visits | 1.5% | Provider does therapeutic procedures regularly, not as one-off events |
| 9 | Urodynamics | 51741 | ~2% of visits | 0.5% | Provider performs urodynamic evaluation for incontinence/OAB routinely |


**Why only 9 categories, not every HCPCS code?**

We do not volume-check every individual code. E/M office visit codes (99213, 99214) and venipuncture (36415) do not need volume floors. If a provider is seeing patients at all, those codes are inherently high-volume. The volume check matters for the categories where a provider might bill a code a few times without it being a real practice pattern: diagnostic procedures, labs, imaging, therapeutic procedures. These are the codes where trace billing (1-2 claims) is a red flag.


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

If a provider only bills E/M office visits (no procedures, no labs, no imaging), they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing, the answer is neither yes nor no. It is 50.

This scenario is unusual for urology. Most urologists bill at least cystoscopy and PSA codes. A provider with zero detected categories is likely misclassified or inactive.


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

    Category: Diagnostic Cystoscopy
        codes = [52000]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.05
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.05
                 "flag"         IF rate < 0.05 AND services > 0

    Category: PSA Testing
        codes = [84153]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.03
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.03
                 "flag"         IF rate < 0.03 AND services > 0

    Category: Urinalysis
        codes = [81003, 81001]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.04
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.04
                 "flag"         IF rate < 0.04 AND services > 0

    Category: Pelvic/Renal Imaging
        codes = [76857, 76770]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.025
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.025
                 "flag"         IF rate < 0.025 AND services > 0

    Category: Post-Void Residual
        codes = [51798]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.015
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.015
                 "flag"         IF rate < 0.015 AND services > 0

    Category: Prostate Biopsy
        codes = [55700]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: Urine Culture
        codes = [87086]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: Therapeutic Cystoscopy
        codes = [52310, 52214, 52281, 52234, 52287]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.015
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.015
                 "flag"         IF rate < 0.015 AND services > 0

    Category: Urodynamics
        codes = [51741]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.005
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.005
                 "flag"         IF rate < 0.005 AND services > 0

STEP 3: Compute score
    detected = count of categories with status "ok" or "flag"
    ok = count of categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 4: Output detail
    For each category, record: name, services, rate, floor, status
```


## 7. Worked Examples

**Provider A: 800 total visits in 2023.**

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Diagnostic cystoscopy (52000) | 136 | 17.0% | 5% | ok |
| PSA testing (84153) | 88 | 11.0% | 3% | ok |
| Urinalysis (81003/81001) | 120 | 15.0% | 4% | ok |
| Pelvic/renal imaging (76857/76770) | 72 | 9.0% | 2.5% | ok |
| Post-void residual (51798) | 48 | 6.0% | 1.5% | ok |
| Prostate biopsy (55700) | 18 | 2.3% | 1% | ok |
| Urine culture (87086) | 24 | 3.0% | 1% | ok |
| Therapeutic cystoscopy (52310 etc.) | 20 | 2.5% | 1.5% | ok |
| Urodynamics (51741) | 3 | 0.4% | 0.5% | **flag** |

Detected: 9. Ok: 8. Score: **(8/9) * 100 = 89**.

Provider A does almost everything at believable volume. Urodynamics is present but at trace volume, flagged. This makes sense: urodynamics is a subspecialty procedure that not every general urologist does regularly. The flag does not mean the provider is bad, it means this specific category is not a routine part of their workflow.


**Provider B: 600 total visits in 2023.**

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Diagnostic cystoscopy (52000) | 42 | 7.0% | 5% | ok |
| PSA testing (84153) | 8 | 1.3% | 3% | **flag** |
| Urinalysis (81003/81001) | 10 | 1.7% | 4% | **flag** |
| Pelvic/renal imaging (76857/76770) | 0 | 0.0% | 2.5% | not_detected |
| Post-void residual (51798) | 5 | 0.8% | 1.5% | **flag** |
| Prostate biopsy (55700) | 3 | 0.5% | 1% | **flag** |
| Urine culture (87086) | 0 | 0.0% | 1% | not_detected |
| Therapeutic cystoscopy (52310 etc.) | 12 | 2.0% | 1.5% | ok |
| Urodynamics (51741) | 0 | 0.0% | 0.5% | not_detected |

Detected: 6. Ok: 2. Score: **(2/6) * 100 = 33**.

Provider B bills several procedure and lab codes but at volumes that suggest they are not part of routine workflow. PSA at 1.3% with a 3% floor is concerning: a urologist seeing 600 patients who only orders 8 PSAs is either sending all lab work to an external reference lab, or not doing routine prostate monitoring. Imaging and cultures are absent entirely (not_detected), so they are excluded from the score and handled by the peer comparison score instead.


**Provider C: 200 total visits in 2023, only E/M codes billed.**

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Diagnostic cystoscopy (52000) | 0 | 0.0% | 5% | not_detected |
| PSA testing (84153) | 0 | 0.0% | 3% | not_detected |
| Urinalysis (81003/81001) | 0 | 0.0% | 4% | not_detected |
| Pelvic/renal imaging (76857/76770) | 0 | 0.0% | 2.5% | not_detected |
| Post-void residual (51798) | 0 | 0.0% | 1.5% | not_detected |
| Prostate biopsy (55700) | 0 | 0.0% | 1% | not_detected |
| Urine culture (87086) | 0 | 0.0% | 1% | not_detected |
| Therapeutic cystoscopy (52310 etc.) | 0 | 0.0% | 1.5% | not_detected |
| Urodynamics (51741) | 0 | 0.0% | 0.5% | not_detected |

Detected: 0. Ok: 0. Score: **50 (neutral fallback)**.

This is unusual for urology. A urologist billing zero procedures, labs, or imaging is either misclassified in NPPES, working exclusively as a consultant (no procedures), or has all ancillary services billed under a different NPI (group practice). The neutral 50 avoids punishing ambiguity. The peer comparison score will catch the missing code coverage.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 8. The Five Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **AUA Guidelines Concordance** | Does this provider do what AUA says they should? | AUA clinical guidelines for prostate cancer, BPH, OAB, stone disease |
| **Peer Comparison** | Does this provider's billing pattern look like a normal urologist's? | The peer cohort (top codes by volume) |
| **Volume Adequacy** (this doc) | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |
| **Payer Diversity** | Is practice consistent across Medicare and Medicaid? | Cross-payer comparison of code presence and rates |
| **Billing Quality** | Are charges, code ratios, and E/M distribution normal? | Expected ratios and charge benchmarks |

They catch different problems:

| Problem | Guidelines | Peer | Volume | Payer Diversity | Billing Quality |
|---|---|---|---|---|---|
| Provider never does cystoscopy | Caught (low diagnostic domain) | Caught (missing key codes) | Not applicable (nothing to check) | Not applicable | Not applicable |
| Provider bills 52000 but only 3 times a year | Partial (volume is low) | Not caught (code is present) | **Caught** (below floor, flagged) | May be caught (if only billed to one payer) | Not caught |
| Provider does everything but in wrong proportions | Missed (guideline scores may still pass) | Caught (low volume concordance) | Partially caught (some categories may be below floor) | Partially caught | Caught (ratio anomalies) |
| Provider does nothing beyond E/M visits | Caught (low across all domains) | Caught (low code + category coverage) | Neutral (no categories to check, score = 50) | May be caught | Caught (E/M-only distribution is abnormal) |

The key scenario: peer comparison says provider bills 52000 (diagnostic cystoscopy), but volume adequacy catches that they only billed it 3 times in a year with 500 patients. That is trace billing, not a real practice pattern. Peer comparison sees the code. Volume adequacy checks the volume.


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Floors are estimates, not validated thresholds.** We set floors at roughly one-third of the peer median. This is reasonable but not clinically validated. If the actual peer median for 52000 is 12% instead of 15%, the floor should be lower. Floors should be recalibrated once we have the actual CMS data loaded and can compute real peer medians.

**Case mix affects expected rates.** A urologist focusing on BPH/LUTS will have higher post-void residual (51798) and urodynamics (51741) volumes but lower prostate biopsy (55700) volumes than a urologist focusing on prostate cancer. A stone-focused practice will skew toward imaging and therapeutic cystoscopy. Volume adequacy does not adjust for subspecialty case mix. With aggregated data, we cannot.

**Lab codes may be billed by the lab, not the ordering urologist.** 84153 (PSA), 81003/81001 (urinalysis), and 87086 (urine culture) may show up under a reference lab's NPI, not the ordering urologist's. A provider who routinely orders these tests but uses an external lab will appear to have zero or low lab volumes. Known limitation. This is why lab categories are included but should be interpreted carefully.

**Some procedures require hospital or ASC access.** Codes like 55866 (robotic prostatectomy) and 50590 (lithotripsy) require operating room or ambulatory surgery center access. Their absence from a provider's claims does not mean the provider cannot perform them. It may mean they are billed under a facility NPI, or the provider refers out for those procedures. We intentionally excluded facility-dependent major surgical codes from our volume categories.

**The 50 neutral fallback is a design choice, not a clinical judgment.** A urologist with no detected procedure, lab, or imaging categories could genuinely be practicing low-quality medicine. But they could also be a new provider, working in a large group where ancillary services bill under a group NPI, or a consultant who only does E/M evaluations. We choose not to penalize ambiguity and let the peer comparison score handle the absence signal.

**Floors should be rebuilt annually.** As practice patterns shift, new codes emerge, and CMS data updates, the peer median rates change. Recalibrate floors each year from fresh claims data.


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
| total_visit_volume | int | Total E/M office visits in measurement year |
| diagnostic_cystoscopy_services | int | Service count for 52000 |
| diagnostic_cystoscopy_rate | float | diagnostic_cystoscopy_services / total_visit_volume |
| diagnostic_cystoscopy_status | string | "ok", "flag", or "not_detected" |
| psa_testing_services | int | Service count for 84153 |
| psa_testing_rate | float | Rate |
| psa_testing_status | string | Status |
| urinalysis_services | int | Service count for 81003 + 81001 |
| urinalysis_rate | float | Rate |
| urinalysis_status | string | Status |
| pelvic_renal_imaging_services | int | Service count for 76857 + 76770 |
| pelvic_renal_imaging_rate | float | Rate |
| pelvic_renal_imaging_status | string | Status |
| post_void_residual_services | int | Service count for 51798 |
| post_void_residual_rate | float | Rate |
| post_void_residual_status | string | Status |
| prostate_biopsy_services | int | Service count for 55700 |
| prostate_biopsy_rate | float | Rate |
| prostate_biopsy_status | string | Status |
| urine_culture_services | int | Service count for 87086 |
| urine_culture_rate | float | Rate |
| urine_culture_status | string | Status |
| therapeutic_cystoscopy_services | int | Service count for 52310 + 52214 + 52281 + 52234 + 52287 |
| therapeutic_cystoscopy_rate | float | Rate |
| therapeutic_cystoscopy_status | string | Status |
| urodynamics_services | int | Service count for 51741 |
| urodynamics_rate | float | Rate |
| urodynamics_status | string | Status |
| detected_categories | int | Count of categories with status ok or flag (0-9) |
| ok_categories | int | Count of categories with status ok (0-9) |
| flagged_categories | int | Count of categories with status flag (0-9) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
