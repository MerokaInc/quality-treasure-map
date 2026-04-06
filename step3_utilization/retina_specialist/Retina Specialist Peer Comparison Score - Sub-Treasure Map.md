# Retina Specialist Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The guideline concordance doc asks: "did this provider do what ASRS/AAO says they should?" This doc asks a different question: "does this provider's billing pattern look like a normal retina specialist's?"

We built a reference code set from the most prevalent codes in the retina specialist peer cohort. Then we measure how much of that common practice set a provider covers. A retina specialist who bills 22 of 25 typical codes is practicing a full-spectrum retinal workflow. A retina specialist who bills 8 of 25 is either highly subspecialized (medical-only or surgical-only) or missing large parts of standard retina care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guideline concordance doc:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count. **Primary source for retina** (Medicare-dominant specialty). Has charge-to-allowed detail.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. Supplementary for retina.
3. **NPPES NPI Registry** — provider identification, taxonomy code 207W00000X (Ophthalmology), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207W00000X (Ophthalmology) | Base specialty filter |
| Retina classification | ≥50 intravitreal injections (67028) in measurement year OR ≥10 vitrectomy procedures (67036-67043, 67108, 67113) | Identifies retina subspecialists within ophthalmology |
| State | Same state as the provider being scored | Practice patterns vary by state |
| Volume | ≥100 total Medicare services in the measurement year | Excludes inactive or very low-volume providers |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

> **ASSUMPTION:** Unlike pediatrics (taxonomy 208000000X cleanly identifies general pediatricians), retina specialists must be identified by procedure mix. The ≥50 injection OR ≥10 vitrectomy threshold is an estimate. This means our peer cohort construction is inherently noisier than for specialties with clean taxonomy codes. A comprehensive ophthalmologist who happens to do 55 injections/year will be included; a retina fellow in their first months may be excluded. Validate thresholds against known retina practice directories.

For a large state like California or Florida, this should yield roughly 200-600 retina specialists. For smaller states, the cohort may be <30, triggering national fallback.


### Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Fallback when state cohort < 30. Also for cross-state comparison. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES | Urban vs. rural retina practices have different case mixes and procedure volumes. |

Every score in this doc uses the peer cohort as its reference. Changing the geographic grouping changes the reference code set and percentile ranks. The output records which level was used.


## 2. The Reference Code Set: What Normal Retina Practice Looks Like

We identified the most prevalent HCPCS codes billed by retina specialists nationally. The top 25 codes account for approximately 70% of all retina specialist billing volume. These 25 codes define the "typical retina workflow."

> **ASSUMPTION — Code Prevalence Estimates:** The ranking and volume percentages below are estimates based on knowledge of retina practice patterns and CMS Medicare utilization trends. They should be validated against actual CMS data filtered for the retina specialist peer cohort once the pipeline is built.
>
> **EXTERNAL RESOURCE NEEDED:** CMS Medicare Physician & Other Practitioners data filtered for ophthalmology NPIs with high 67028 volume to compute actual code prevalence rankings and percentages. The ASRS PAT Survey annual reports (https://www.asrs.org/) also publish practice pattern data that can validate these estimates.

| Rank | Code | Description | What It Tells You | Est. % of Total Volume |
|---|---|---|---|---|
| 1 | 67028 | Intravitreal injection of a pharmacologic agent | Core procedure — anti-VEGF treatment | 18% |
| 2 | 92134 | OCT, posterior segment | Monitoring imaging — guides treatment decisions | 14% |
| 3 | 92014 | Comprehensive eye exam, established patient | Clinical evaluation at each visit | 10% |
| 4 | J0178 | Aflibercept injection (Eylea) | Anti-VEGF drug — most commonly used agent | 8% |
| 5 | 92250 | Fundus photography | Documentation and baseline imaging | 5% |
| 6 | 92012 | Intermediate eye exam, established patient | Focused follow-up evaluation | 4% |
| 7 | J9035 | Bevacizumab injection (Avastin) | Anti-VEGF drug — cost-effective alternative | 3% |
| 8 | 92235 | Fluorescein angiography | Diagnostic imaging for vascular disease | 3% |
| 9 | J2778 | Ranibizumab injection (Lucentis) | Anti-VEGF drug | 2% |
| 10 | 99214 | Office visit, established, moderate complexity | Standard E/M visit code | 2% |
| 11 | 92004 | Comprehensive eye exam, new patient | Initial evaluation | 2% |
| 12 | G2211 | Visit complexity add-on | Ongoing care coordination | 2% |
| 13 | 67210 | Photocoagulation, retinal vascular lesion | Focal laser treatment | 1% |
| 14 | 67228 | Treatment of extensive retinal lesion (PRP) | Panretinal photocoagulation | 1% |
| 15 | 76512 | Ophthalmic ultrasound, B-scan | Surgical planning, media opacities | 1% |
| 16 | 92240 | Indocyanine green angiography (ICG) | Specialized vascular imaging | 1% |
| 17 | 67036 | Vitrectomy, mechanical, pars plana | Core surgical procedure | 1% |
| 18 | 67042 | Vitrectomy with epiretinal membrane removal | Membrane peel surgery | <1% |
| 19 | 67041 | Vitrectomy with ILM peel | Macular hole surgery | <1% |
| 20 | 67108 | Retinal detachment repair with vitrectomy | Retinal detachment surgery | <1% |
| 21 | 67145 | Prophylaxis of retinal detachment (laser) | Preventive laser treatment | <1% |
| 22 | 67113 | Complex retinal detachment repair | Complex surgical repair | <1% |
| 23 | 99213 | Office visit, established, low-moderate complexity | Lower-complexity visits | <1% |
| 24 | 92002 | Intermediate eye exam, new patient | New patient focused eval | <1% |
| 25 | 92227 | Remote retinal imaging | Screening/monitoring imaging | <1% |


### What This Set Reveals

These 25 codes map to the six things a retina specialist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Intravitreal injections** | 67028, J0178, J9035, J2778 | Provider does not perform the core procedure of modern retina practice |
| **Diagnostic imaging** | 92134, 92235, 92240, 92250, 76512, 92227 | Provider does not image patients — cannot be monitoring treatment response appropriately |
| **Clinical examinations** | 92014, 92012, 92004, 92002, 99214, 99213, G2211 | Provider is not performing clinical evaluations (highly unusual) |
| **Laser treatment** | 67210, 67228, 67145 | Provider does not use laser — may be purely injection-focused (legitimate for medical retina) |
| **Vitreoretinal surgery** | 67036, 67041, 67042, 67108, 67113 | Provider does not operate — medical-only retina specialist (legitimate but narrower scope) |

A provider missing entire categories is a stronger signal than a provider missing a single code. Missing injections + imaging is a very different pattern from missing surgery only.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (the core metric)

```
reference_set = [67028, 92134, 92014, J0178, 92250, 92012, J9035, 92235,
                 J2778, 99214, 92004, G2211, 67210, 67228, 76512, 92240,
                 67036, 67042, 67041, 67108, 67145, 67113, 99213, 92002,
                 92227]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 85-100 (22-25 codes) | Full-spectrum retina practice. Medical + surgical + full imaging. |
| 65-84 (17-21 codes) | Broad practice with some gaps. May lack surgical codes or some imaging modalities. |
| 45-64 (12-16 codes) | Missing significant parts of typical retina workflow. Likely medical-only or narrowly focused. |
| Below 45 (<12 codes) | Atypical. Could be purely surgical (no injections), a new practice, or misclassified. |

> **ASSUMPTION:** J-codes for anti-VEGF drugs may not appear under the physician's NPI in hospital-based settings. A retina specialist in a hospital outpatient department may bill 67028 (the injection procedure) but the J-code may be billed under the facility. This means code coverage will systematically undercount drug codes for hospital-based providers. Consider excluding J-codes from the reference set if hospital-based practice is common in the peer cohort, or build a "facility-adjusted" reference set.


### Metric 2: Category Coverage

```
categories = {
    'injections':        [67028, J0178, J9035, J2778],
    'diagnostic_imaging': [92134, 92235, 92240, 92250, 76512, 92227],
    'clinical_exams':    [92014, 92012, 92004, 92002, 99214, 99213, G2211],
    'laser':             [67210, 67228, 67145],
    'surgery':           [67036, 67041, 67042, 67108, 67113]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 5 * 100
```

**Score:** `category_coverage` (0-100 scale).

| Categories Covered | Interpretation |
|---|---|
| 5 of 5 | Full-spectrum retina practice: injections, imaging, exams, laser, and surgery |
| 4 of 5 | Missing one workflow area. Most commonly: no surgery (medical-only) or no laser. |
| 3 of 5 | Missing two areas. Likely a narrowly focused practice. |
| Below 3 | Not a standard retina practice pattern. Investigate classification. |


### Metric 3: Volume Concordance

```
For each code in the reference_set:

    peer_median_rate = MEDIAN(
        total_services for this code / total_services for all codes
        across all NPIs in the peer cohort
    )

    provider_rate = total_services for this code / total_services for all codes
        for this NPI

    code_deviation = ABS(provider_rate - peer_median_rate) / peer_median_rate

volume_concordance = 100 - (MEAN(code_deviation across all matched codes) * 100)
    clamped to [0, 100]
```

A provider who bills all 25 codes but has 80% of their volume in 67028 (injections) and almost nothing in surgical codes has a high code coverage but low volume concordance relative to a mixed medical-surgical peer.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical retina codes." |
| 30% | Category Coverage | Catches providers who hit good code counts but are missing entire workflow areas (e.g., no imaging). |
| 30% | Volume Concordance | Catches providers who bill the right codes but in unusual proportions (e.g., 90% injections, 1% imaging). |


## 5. Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| provider_cbsa | string | Core-Based Statistical Area code |
| taxonomy_code | string | From NPPES |
| retina_classification | string | "injection_based", "surgical_based", or "both" |
| geo_group_level | string | "state", "national", or "zip3" |
| peer_cohort_size | int | Number of peers in cohort |
| peer_cohort_state | string | State of peer cohort (or "US") |
| reference_set_size | int | Number of codes in the state-level reference set (may be <25 in small states) |
| total_services | int | Total claims for this NPI in measurement year |
| total_beneficiaries | int | Estimated unique patients |
| codes_in_reference_set | int | Count of the 25 reference codes this NPI billed (0-25) |
| codes_matched_list | string | Comma-separated list of matched codes |
| codes_missing_list | string | Comma-separated list of unmatched codes |
| code_coverage_score | float | Metric 1 (0-100) |
| categories_covered | int | Count of 5 workflow categories with any billing (0-5) |
| categories_missing_list | string | Names of missing categories |
| category_coverage_score | float | Metric 2 (0-100) |
| volume_concordance_score | float | Metric 3 (0-100) |
| peer_composite_score | float | Weighted composite (0-100) |
| injection_pct | float | % of total volume that is injection codes |
| imaging_pct | float | % of total volume that is diagnostic imaging codes |
| exam_pct | float | % of total volume that is clinical exam codes |
| laser_pct | float | % of total volume that is laser codes |
| surgery_pct | float | % of total volume that is surgical codes |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINE CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | Guideline Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider injects at high volume with OCT monitoring but never performs surgery or laser | High (injection + imaging domains score well) | Moderate (missing surgery + laser categories lowers coverage) |
| Provider does vitrectomy and retinal detachment repair but rarely injects | Low (injection domain is weak) | Moderate (surgical categories covered but injection category missing) |
| Provider does everything but in very different ratios (95% injections, 1% imaging) | Could be moderate (injection volume high, imaging ratio flagged) | Low volume concordance (distribution doesn't match peers) |
| Provider bills all typical codes in typical ratios but is actually a comprehensive ophthalmologist, not a true retina specialist | N/A (may not meet retina classification threshold) | Caught: if they do meet threshold, their surgical category will likely be missing specific retina surgical codes |

The peer comparison is a sanity check. It does not say "this provider follows ASRS/AAO guidelines." It says "this provider's practice looks like a retina specialist's." If someone's billing is classified as retina but their pattern looks nothing like one, that is worth investigating.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a peer average, not a clinical standard.** If most retina specialists over-inject and under-image, that will be in the reference set. Peer comparison rewards conformity, not quality. That is why you need BOTH this score and the guideline concordance score.

**Medical-only retina specialists will score lower on category coverage.** A medical retina specialist who focuses exclusively on injections and imaging may cover only 3 of 5 categories. This is a legitimate practice pattern, not a quality deficiency. The `retina_classification` field and `is_medical_only` flag handle this. Consider building separate reference sets for medical-only vs. surgical retina peers.

**J-code availability varies by practice setting.** Hospital-based providers may show gaps in drug codes that are billed under the facility. This systematically lowers code coverage for hospital-employed retina specialists.

**Volume concordance can be distorted by case mix.** A provider specializing in retinal detachment repair (surgical-heavy) will have a very different volume distribution than an AMD-focused injection specialist. The metric does not adjust for case mix (we do not have diagnosis data).

**Small state cohorts.** Retina is a smaller subspecialty than general pediatrics or general ophthalmology. Many states may have <30 retina specialists, requiring national fallback. National comparisons lose geographic specificity.

**The 25-code reference set should be rebuilt annually.** New drug codes (biosimilars, new anti-VEGF agents), new procedure codes, and evolving practice patterns (e.g., increasing use of sustained-release implants) will shift the reference set over time.

**New practices and fellows will have incomplete code sets.** A retina specialist in their first year of independent practice may not yet have billed all 25 codes. Require ≥12 months of data and meet the minimum volume thresholds before scoring.


---

## Appendix: Reference Code Set by Category

Quick-reference for implementation.

### Intravitreal Injections (4 codes)
| Code | Description |
|---|---|
| 67028 | Intravitreal injection of pharmacologic agent |
| J0178 | Aflibercept injection |
| J9035 | Bevacizumab injection |
| J2778 | Ranibizumab injection |

### Diagnostic Imaging (6 codes)
| Code | Description |
|---|---|
| 92134 | OCT, posterior segment |
| 92235 | Fluorescein angiography |
| 92240 | ICG angiography |
| 92250 | Fundus photography |
| 76512 | Ophthalmic ultrasound, B-scan |
| 92227 | Remote retinal imaging |

### Clinical Examinations (7 codes)
| Code | Description |
|---|---|
| 92014 | Comprehensive eye exam, established patient |
| 92012 | Intermediate eye exam, established patient |
| 92004 | Comprehensive eye exam, new patient |
| 92002 | Intermediate eye exam, new patient |
| 99214 | Office visit, established, moderate complexity |
| 99213 | Office visit, established, low-moderate complexity |
| G2211 | Visit complexity add-on |

### Laser Treatment (3 codes)
| Code | Description |
|---|---|
| 67210 | Photocoagulation, retinal vascular lesion |
| 67228 | Treatment of extensive retinal lesion (PRP) |
| 67145 | Prophylaxis of retinal detachment (laser) |

### Vitreoretinal Surgery (5 codes)
| Code | Description |
|---|---|
| 67036 | Vitrectomy, mechanical, pars plana |
| 67041 | Vitrectomy with ILM peel |
| 67042 | Vitrectomy with epiretinal membrane removal |
| 67108 | Retinal detachment repair with vitrectomy |
| 67113 | Complex retinal detachment repair |
