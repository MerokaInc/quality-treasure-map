# Gastroenterology Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A gastroenterologist who bills 45378 (colonoscopy) twice in a year while seeing 400 patients is not doing colonoscopies as a real part of their practice. They billed it twice, maybe for a favor, maybe during a coverage shift. A gastroenterologist who bills 45378 280 times with 400 patients is genuinely performing colonoscopy as routine GI practice. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other scoring docs:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. GI is Medicare-heavy; this is the primary data source.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024.
3. **NPPES NPI Registry** — provider identification, taxonomy 207RG0100X.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total E/M office visit count, which is the best proxy we have for practice size. We use E/M visits only (not procedures) to keep the denominator consistent across specialties and avoid inflating practice size with high procedure volumes.

```
visit_codes = [99201, 99202, 99203, 99204, 99205,        -- new patient office
               99211, 99212, 99213, 99214, 99215]        -- established patient office

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

If `total_visit_volume` < 50 in the measurement year, skip this provider entirely. Too little data to evaluate.


## 2. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from the peer median volume data, set at roughly one-third of the peer median rate. The idea: if the peer median for colonoscopy is 60% of total visit volume, the floor is 20%. Anything below that is a trace, not a practice pattern.


### Geographic Grouping of Floors

The floors in the table below are national defaults. In production, floors should be computed at the **state level** from the state peer cohort median, because practice patterns vary by state:

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all GI NPIs in the state. Floor = median / 3. | Primary scoring. A provider in TX is evaluated against TX norms. |
| **National** | Floors from the table below (national data). | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Urban vs. rural and academic vs. community patterns differ. Not implemented now, but the data supports it once cohort sizes are large enough. |

When using state-level floors, the output should record which state peer cohort was used and the cohort size. If a state cohort has fewer than 50 active gastroenterologists, fall back to national floors.


| # | Category | Codes | Peer Median Rate | Floor | What the Floor Means |
|---|---|---|---|---|---|
| 1 | Colonoscopy | 45378, 45380, 45384, 45385, 45390, 45381 | ~60% of visits | 20% | Provider performs colonoscopy as a routine part of practice |
| 2 | Upper endoscopy (EGD) | 43235, 43239, 43249, 43248, 43250, 43251 | ~30% of visits | 10% | Provider performs EGD regularly |
| 3 | Polypectomy / therapeutic colonoscopy | 45385, 45384, 45390 | ~25% of visits | 8% | Provider does not just scope — they remove polyps when found |
| 4 | EGD with biopsy | 43239 | ~20% of visits | 7% | Provider biopsies during EGD (appropriate for Barrett's, celiac, gastritis workup) |
| 5 | H. pylori testing | 87338, 86677, 83009, 83013, 83014 | ~5% of visits | 2% | Provider tests for H. pylori routinely, not just one-off |
| 6 | Hepatitis screening | 86803, 86804, 87340, 87341, 87520, 87521 | ~3% of visits | 1% | Provider orders hepatitis screening as part of GI workup |
| 7 | Pathology specimens | 88305 | ~15% of visits | 5% | Provider sends tissue specimens for analysis (expected with biopsies) |
| 8 | Liver elastography | 91200 | ~2% of visits | 0.5% | Provider uses FibroScan for liver fibrosis assessment |


**Why only 8 categories, not every GI code?**

We do not volume-check E/M visits (inherently high-volume) or advanced subspecialty procedures like EUS (endoscopic ultrasound) and ERCP (endoscopic retrograde cholangiopancreatography) — those are not expected for all gastroenterologists. The volume check matters for categories where a provider might bill a code a few times without it being a real practice pattern: testing, screening, biopsies, therapeutic procedures.


## 3. Scoring Each Category

For each of the 8 categories, the logic is:

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

If a provider only bills E/M office visits and nothing else (no procedures, no screening codes, no lab orders), they have zero detected categories for volume checking. That is already penalized in the peer comparison score (low code coverage). We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing, the answer is neither yes nor no. It is 50.


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

    Category: Colonoscopy
        codes = [45378, 45380, 45384, 45385, 45390, 45381]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.20
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.20
                 "flag"         IF rate < 0.20 AND services > 0

    Category: Upper Endoscopy (EGD)
        codes = [43235, 43239, 43249, 43248, 43250, 43251]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.10
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.10
                 "flag"         IF rate < 0.10 AND services > 0

    Category: Polypectomy / Therapeutic Colonoscopy
        codes = [45385, 45384, 45390]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.08
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.08
                 "flag"         IF rate < 0.08 AND services > 0

    Category: EGD with Biopsy
        codes = [43239]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.07
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.07
                 "flag"         IF rate < 0.07 AND services > 0

    Category: H. pylori Testing
        codes = [87338, 86677, 83009, 83013, 83014]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.02
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.02
                 "flag"         IF rate < 0.02 AND services > 0

    Category: Hepatitis Screening
        codes = [86803, 86804, 87340, 87341, 87520, 87521]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.01
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.01
                 "flag"         IF rate < 0.01 AND services > 0

    Category: Pathology Specimens
        codes = [88305]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = 0.05
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= 0.05
                 "flag"         IF rate < 0.05 AND services > 0

    Category: Liver Elastography
        codes = [91200]
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


## 7. Worked Example

**Provider A:** 400 total office visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Colonoscopy | 320 | 80.0% | 20% | ok |
| Upper endoscopy (EGD) | 150 | 37.5% | 10% | ok |
| Polypectomy / therapeutic | 128 | 32.0% | 8% | ok |
| EGD with biopsy | 95 | 23.8% | 7% | ok |
| H. pylori testing | 25 | 6.3% | 2% | ok |
| Hepatitis screening | 8 | 2.0% | 1% | ok |
| Pathology specimens | 85 | 21.3% | 5% | ok |
| Liver elastography | 3 | 0.8% | 0.5% | ok |

Detected: 8. Ok: 8. Score: **(8/8) * 100 = 100**.

Provider A does everything at believable volume. Colonoscopy, EGD, polypectomy, biopsies, testing, and screening all appear at rates consistent with a full-scope GI practice.


**Provider B:** 300 total office visits in 2023.

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| Colonoscopy | 180 | 60.0% | 20% | ok |
| Upper endoscopy (EGD) | 45 | 15.0% | 10% | ok |
| Polypectomy / therapeutic | 2 | 0.7% | 8% | **flag** |
| EGD with biopsy | 40 | 13.3% | 7% | ok |
| H. pylori testing | 1 | 0.3% | 2% | **flag** |
| Hepatitis screening | 0 | 0.0% | 1% | not_detected |
| Pathology specimens | 35 | 11.7% | 5% | ok |
| Liver elastography | 0 | 0.0% | 0.5% | not_detected |

Detected: 6. Ok: 4. Score: **(4/6) * 100 = 67**.

Provider B bills colonoscopy and EGD at believable rates, but polypectomy volume is nearly zero (2 out of 180 colonoscopies resulted in polypectomy — either the provider refers out therapeutic work or the codes are billing artifacts). H. pylori testing at 1 claim in 12 months is a trace, not a practice pattern. Hepatitis screening and liver elastography are not billed at all, so they are excluded from the score (already penalized in peer comparison).


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## 8. The Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **Guideline Concordance** | Does this provider do what ACG/AGA guidelines say they should? | ACG / AGA clinical guidelines |
| **Peer Comparison** | Does this provider's billing pattern look like a normal gastroenterologist's? | The peer cohort (top codes by specialty) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |

They catch different problems:

| Problem | Guideline | Peer | Volume |
|---|---|---|---|
| Provider never scopes | Caught (low procedure domain) | Caught (missing procedure codes) | Not applicable (nothing to check) |
| Provider bills colonoscopy codes but only 2 times a year | Partial (volume metric is low) | Not caught (code is present) | **Caught** (below floor, flagged) |
| Provider bills H. pylori testing once in 12 months | Missed (guideline may still score ok) | Not caught (code is present) | **Caught** (0.3% rate vs 2% floor) |
| Provider does nothing beyond office visits | Caught (low across all domains) | Caught (low code + category coverage) | Neutral (no categories to check, score = 50) |

Volume adequacy is the behavior check. Peer comparison says "you bill colonoscopy codes." Volume adequacy says "but you only did 2 colonoscopies all year — that is not real." Guideline concordance says "you test for H. pylori." Volume adequacy says "you tested once in 12 months."


---

# PART E: RISKS AND LIMITATIONS

---


## 9. Risks

**Procedure volume varies by practice model.** Academic gastroenterologists, private practice GI, and hospital-employed GI have different billing patterns. An academic GI provider may focus on a subspecialty (motility, hepatology, IBD) and perform fewer colonoscopies than a community GI provider. The floors are set low enough (one-third of median) to accommodate this, but edge cases exist.

**Hospital-based GI may have procedures billed under the facility NPI.** When a gastroenterologist performs colonoscopies at a hospital outpatient department, the facility component is billed under the hospital's NPI. The professional component should still appear under the provider's NPI, but billing practices vary. Some providers will appear to have lower procedure volumes than they actually perform.

**ASC (ambulatory surgery center) procedures may not appear under the GI provider's NPI.** Similar to hospital-based billing, ASC arrangements can split billing in ways that reduce the provider's apparent procedure volume. A provider who performs 300 colonoscopies at an ASC may show fewer claims under their individual NPI.

**Place-of-service differences affect which codes appear.** Office-based procedures, hospital outpatient procedures, and ASC procedures may use different code sets or modifiers. The volume check uses the same codes regardless of place of service, which is correct, but claim routing may cause undercounting.

**Lab codes may be billed by the reference lab, not the ordering provider.** H. pylori testing (87338, 83009) and hepatitis screening (86803, 87340) may show up under a reference lab's NPI rather than the gastroenterologist's. A provider who orders these tests routinely but uses an external lab will be flagged here. Known limitation.

**Pathology codes may be billed by the pathologist.** 88305 (surgical pathology) is typically billed by the pathologist who reads the specimen, not the gastroenterologist who took the biopsy. Providers who send all specimens to an external pathology group will show zero pathology volume even if they biopsy routinely. This category is the most susceptible to billing-split artifacts.

**Floors are estimates, not validated thresholds.** We set floors at roughly one-third of the peer median. This is reasonable but not clinically validated. Floors should be recalibrated once we have the actual CMS data loaded and can compute real peer medians by state.

**The 50 neutral fallback is a design choice, not a clinical judgment.** A provider with no detected procedure or testing categories could genuinely be practicing low-quality medicine. But they could also be a hepatologist who only does consults, a new provider, or someone with a non-standard billing setup. We choose not to penalize ambiguity and let the peer comparison score handle the absence signal.

**Floors should be rebuilt annually.** As practice patterns shift (liver elastography adoption is growing rapidly, for example), the peer median rates change. Recalibrate floors each year from fresh claims data.


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
| colonoscopy_services | int | Service count for colonoscopy codes |
| colonoscopy_rate | float | colonoscopy_services / total_visit_volume |
| colonoscopy_status | string | "ok", "flag", or "not_detected" |
| egd_services | int | Service count for upper endoscopy codes |
| egd_rate | float | Rate |
| egd_status | string | Status |
| polypectomy_services | int | Service count for polypectomy / therapeutic colonoscopy codes |
| polypectomy_rate | float | Rate |
| polypectomy_status | string | Status |
| egd_biopsy_services | int | 43239 service count |
| egd_biopsy_rate | float | Rate |
| egd_biopsy_status | string | Status |
| h_pylori_services | int | Service count for H. pylori testing codes |
| h_pylori_rate | float | Rate |
| h_pylori_status | string | Status |
| hepatitis_screening_services | int | Service count for hepatitis screening codes |
| hepatitis_screening_rate | float | Rate |
| hepatitis_screening_status | string | Status |
| pathology_services | int | 88305 service count |
| pathology_rate | float | Rate |
| pathology_status | string | Status |
| liver_elastography_services | int | 91200 service count |
| liver_elastography_rate | float | Rate |
| liver_elastography_status | string | Status |
| detected_categories | int | Count of categories with status ok or flag (0-8) |
| ok_categories | int | Count of categories with status ok (0-8) |
| flagged_categories | int | Count of categories with status flag (0-8) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
