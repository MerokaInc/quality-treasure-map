# Neurological Surgery Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The guideline concordance doc asks: "did this neurosurgeon do what CNS/AANS says they should?" This doc asks a different question: "does this neurosurgeon's billing pattern look like a normal neurosurgeon's?"

We built a reference code set from the most prevalent codes in the neurosurgical peer cohort. Then we measure how much of that common practice set a provider covers. A neurosurgeon who bills 22 of 25 typical codes is practicing a broad neurosurgical workflow. A neurosurgeon who bills 10 of 25 is either highly subspecialized (spine-only, cranial-only) or missing large parts of standard practice.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guideline concordance doc:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count. Primary source for neurosurgery.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. Supplementary.
3. **NPPES NPI Registry** — provider identification, taxonomy code 207T00000X (Neurological Surgery), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207T00000X (Neurological Surgery) | Clean filter — dedicated taxonomy code for neurosurgeons |
| State | Same state as the provider being scored | Practice patterns vary by state (tort environment, payer mix, referral patterns) |
| Volume | >= 50 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

For a large state like California, Texas, or New York, this should yield roughly 200-500 neurosurgeons. Smaller states may have 30-80.


### Geographic Grouping

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. |
| **National** | All states combined | Fallback when state cohort < 30 neurosurgeons. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES | Academic vs. community neurosurgeons have different case mixes. |


## 2. The Reference Code Set: What Normal Neurosurgical Practice Looks Like

The top 25 codes account for approximately 65% of all neurosurgical billing volume.

> **ASSUMPTION — Code Prevalence Estimates:** Rankings and volume percentages below are estimates based on neurosurgical practice patterns and CMS utilization trends. Must be validated against actual CMS data filtered for taxonomy 207T00000X.
>
> **EXTERNAL RESOURCE NEEDED:** CMS Medicare Physician & Other Practitioners data filtered for neurosurgery NPIs to compute actual code prevalence. AANS Practice Profile data can serve as validation.

| Rank | Code | Description | What It Tells You | Est. % of Volume |
|---|---|---|---|---|
| 1 | 99214 | Office visit, established, moderate complexity | Post-operative and follow-up care | 12% |
| 2 | 99213 | Office visit, established, low-moderate complexity | Routine follow-up | 8% |
| 3 | 63047 | Laminectomy, single lumbar segment | Core spine decompression | 5% |
| 4 | 99215 | Office visit, established, high complexity | Complex patient management | 5% |
| 5 | 22633 | Combined posterior + interbody fusion, single level | Complex lumbar fusion | 4% |
| 6 | 99205 | Office visit, new patient, high complexity | Initial neurosurgical consultation | 3% |
| 7 | 22853 | Insertion of interbody biomechanical device | Spinal implant/cage | 3% |
| 8 | 63048 | Laminectomy, each additional lumbar segment | Multi-level decompression | 3% |
| 9 | 22842 | Posterior segmental instrumentation, 3-6 segments | Pedicle screw fixation | 3% |
| 10 | 22551 | ACDF, single level | Cervical spine fusion | 2% |
| 11 | 22612 | Posterolateral lumbar fusion, single segment | Lumbar fusion | 2% |
| 12 | G2211 | Visit complexity add-on | Longitudinal care coordination | 2% |
| 13 | 20936 | Autograft for spine surgery (local) | Bone graft harvesting | 2% |
| 14 | 99204 | Office visit, new patient, moderate-high complexity | New patient evaluation | 2% |
| 15 | 63030 | Lumbar discectomy | Microdiscectomy | 1% |
| 16 | 22552 | ACDF, each additional level | Multi-level cervical fusion | 1% |
| 17 | 22614 | Posterolateral lumbar fusion, additional segment | Multi-level lumbar fusion | 1% |
| 18 | 61781 | Stereotactic computer-assisted navigation, cranial | Image-guided cranial surgery | 1% |
| 19 | 22840 | Posterior non-segmental instrumentation | Spinal rod/hook fixation | 1% |
| 20 | 64721 | Carpal tunnel release | Peripheral nerve procedure | 1% |
| 21 | 61510 | Craniotomy for supratentorial tumor excision | Brain tumor surgery | <1% |
| 22 | 62223 | Ventriculoperitoneal shunt creation | CSF diversion | <1% |
| 23 | 61154 | Burr holes for hematoma evacuation | Trauma surgery | <1% |
| 24 | 61782 | Stereotactic navigation, spinal | Image-guided spine surgery | <1% |
| 25 | 62230 | Shunt revision/replacement | CSF shunt management | <1% |


### What This Set Reveals

These 25 codes map to six workflow categories:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits / consultations** | 99213, 99214, 99215, 99204, 99205, G2211 | Provider does not see patients in clinic (highly unusual for any neurosurgeon) |
| **Spine decompression** | 63047, 63048, 63030 | Provider does not perform the most common spine procedure |
| **Spine fusion & instrumentation** | 22551, 22552, 22612, 22614, 22633, 22842, 22840, 22853, 20936 | Provider does not fuse — may be decompression-only or cranial-only |
| **Cranial surgery** | 61510, 61154, 62223, 62230 | Provider does not perform cranial procedures — likely spine-only |
| **Image guidance / navigation** | 61781, 61782 | Provider does not use neuronavigation — may be older practice style or facility bills it |
| **Peripheral nerve** | 64721 | Provider does not do carpal tunnel — minor, many neurosurgeons refer this out |

A provider missing entire categories is a stronger signal than one missing a single code.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

Three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage

```
reference_set = [99214, 99213, 63047, 99215, 22633, 99205, 22853, 63048,
                 22842, 22551, 22612, G2211, 20936, 99204, 63030, 22552,
                 22614, 61781, 22840, 64721, 61510, 62223, 61154, 61782,
                 62230]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

| Code Coverage | Interpretation |
|---|---|
| 85-100 (22-25 codes) | Full-spectrum neurosurgical practice: spine + cranial + navigation |
| 65-84 (17-21 codes) | Broad practice with some gaps. Common: missing cranial or missing some fusion codes. |
| 45-64 (12-16 codes) | Significant gaps. Likely spine-only or narrowly focused. |
| Below 45 (<12 codes) | Atypical. Very narrow subspecialization, new practice, or misclassified. |


### Metric 2: Category Coverage

```
categories = {
    'office_visits':        [99213, 99214, 99215, 99204, 99205, G2211],
    'spine_decompression':  [63047, 63048, 63030],
    'spine_fusion':         [22551, 22552, 22612, 22614, 22633, 22842, 22840, 22853, 20936],
    'cranial_surgery':      [61510, 61154, 62223, 62230],
    'image_guidance':       [61781, 61782],
    'peripheral_nerve':     [64721]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-spectrum neurosurgeon |
| 5 of 6 | Missing one area. Most commonly: peripheral nerve (minor) or image guidance. |
| 4 of 6 | Missing two areas. Likely spine-only (no cranial) or cranial-only (no fusion). |
| Below 4 | Narrowly focused or unusual practice. |


### Metric 3: Volume Concordance

```
For each code in the reference_set:

    peer_median_rate = MEDIAN(
        total_services for this code / total_services for all codes
        across all NPIs in the peer cohort
    )

    provider_rate = total_services for this code / total_services for all codes

    code_deviation = ABS(provider_rate - peer_median_rate) / peer_median_rate

volume_concordance = 100 - (MEAN(code_deviation across all matched codes) * 100)
    clamped to [0, 100]
```

A neurosurgeon who bills all 25 codes but has 90% of volume in spine decompression and almost nothing in fusion or cranial work has a high code coverage but low volume concordance.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```


## 5. Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| provider_cbsa | string | Core-Based Statistical Area code |
| taxonomy_code | string | From NPPES (207T00000X) |
| geo_group_level | string | "state", "national", or "zip3" |
| peer_cohort_size | int | Number of peers in cohort |
| peer_cohort_state | string | State of peer cohort (or "US") |
| reference_set_size | int | Number of codes in state reference set |
| total_services | int | Total claims for this NPI |
| total_beneficiaries | int | Estimated unique patients |
| codes_in_reference_set | int | Count of 25 reference codes billed (0-25) |
| codes_matched_list | string | Comma-separated matched codes |
| codes_missing_list | string | Comma-separated missing codes |
| code_coverage_score | float | Metric 1 (0-100) |
| categories_covered | int | Count of 6 workflow categories (0-6) |
| categories_missing_list | string | Names of missing categories |
| category_coverage_score | float | Metric 2 (0-100) |
| volume_concordance_score | float | Metric 3 (0-100) |
| peer_composite_score | float | Weighted composite (0-100) |
| office_visit_pct | float | % of volume in office visit codes |
| spine_decompression_pct | float | % in spine decompression |
| spine_fusion_pct | float | % in spine fusion |
| cranial_surgery_pct | float | % in cranial surgery |
| image_guidance_pct | float | % in image guidance |
| peripheral_nerve_pct | float | % in peripheral nerve |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINE CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | Guideline Concordance | Peer Comparison |
|---|---|---|
| Spine-only surgeon, no cranial work at all | Moderate (strong spine domain, no cranial domain) | Low category coverage (missing cranial + possibly navigation) |
| High-volume cranial surgeon who rarely does spine | Low spine domain | Low (missing spine decompression + fusion categories) |
| Surgeon does everything but in unusual proportions (95% decompression, 2% fusion) | Could be high (decompression volume is good) | Low volume concordance (distribution does not match peers) |
| Surgeon bills all codes in typical ratios | High on all scored measures | High across all metrics |

Peer comparison is a sanity check. It says "this neurosurgeon's practice looks like a neurosurgeon's." If someone claims to be a neurosurgeon but their billing looks nothing like one, that is worth investigating.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a peer average, not a clinical standard.** Peer comparison rewards conformity. If most neurosurgeons over-fuse, that will be in the reference set.

**Subspecialization is penalized by code coverage.** A world-class pediatric neurosurgeon or skull-base tumor surgeon will score lower on code coverage than a generalist who does a bit of everything. The `practice_focus` flag helps contextualize this.

**Hospital billing arrangements affect code visibility.** Academic neurosurgeons employed by hospitals may have some procedure codes billed under the facility. This systematically lowers code coverage for hospital-based practitioners.

**E/M codes dominate volume.** Office visits (99213, 99214, 99215) account for ~25% of total volume. A neurosurgeon with high E/M volume but low surgical volume will have decent code coverage but may not be practicing surgery actively.

**Volume concordance is distorted by case mix.** A neurosurgeon at a Level I trauma center will have a very different volume distribution than a community spine surgeon. The metric does not adjust for practice setting.

**Small state cohorts.** Neurosurgery is a smaller specialty. Many states require national fallback.

**Rebuild annually.** New codes, evolving practice patterns (e.g., robotic-assisted spine surgery codes, endovascular growth) shift the reference set.


---

## Appendix: Reference Code Set by Category

### Office Visits / Consultations (6 codes)
| Code | Description |
|---|---|
| 99213 | Office visit, established, low-moderate complexity |
| 99214 | Office visit, established, moderate complexity |
| 99215 | Office visit, established, high complexity |
| 99204 | Office visit, new patient, moderate-high complexity |
| 99205 | Office visit, new patient, high complexity |
| G2211 | Visit complexity add-on |

### Spine Decompression (3 codes)
| Code | Description |
|---|---|
| 63047 | Laminectomy, single lumbar segment |
| 63048 | Laminectomy, each additional segment |
| 63030 | Lumbar discectomy |

### Spine Fusion & Instrumentation (9 codes)
| Code | Description |
|---|---|
| 22551 | ACDF, single level |
| 22552 | ACDF, each additional level |
| 22612 | Posterolateral lumbar fusion, single segment |
| 22614 | Posterolateral lumbar fusion, additional segment |
| 22633 | Combined posterior + interbody fusion |
| 22842 | Posterior segmental instrumentation, 3-6 segments |
| 22840 | Posterior non-segmental instrumentation |
| 22853 | Insertion of interbody device |
| 20936 | Autograft for spine surgery (local) |

### Cranial Surgery (4 codes)
| Code | Description |
|---|---|
| 61510 | Craniotomy for supratentorial tumor excision |
| 61154 | Burr holes for hematoma evacuation |
| 62223 | Ventriculoperitoneal shunt creation |
| 62230 | Shunt revision/replacement |

### Image Guidance / Navigation (2 codes)
| Code | Description |
|---|---|
| 61781 | Stereotactic navigation, cranial |
| 61782 | Stereotactic navigation, spinal |

### Peripheral Nerve (1 code)
| Code | Description |
|---|---|
| 64721 | Carpal tunnel release |
