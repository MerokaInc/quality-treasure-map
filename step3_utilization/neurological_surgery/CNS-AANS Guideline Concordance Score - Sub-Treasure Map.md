# Neurological Surgery Guideline Concordance Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a neurosurgeon actually did: every spine fusion, every craniotomy, every shunt placement, every office visit. CNS/AANS clinical guidelines tell you what that provider should be doing for patients with degenerative spine disease, brain tumors, traumatic brain injury, cerebrovascular disease, and other neurosurgical conditions. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.

**Guideline bodies:**
- **Primary:** Congress of Neurological Surgeons (CNS) — evidence-based clinical guidelines, systematic reviews, quality improvement initiatives
- **Secondary:** American Association of Neurological Surgeons (AANS) — joint guidelines with CNS, practice parameters, Neurosurgical Quality Improvement (N2QOD) measures


---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---


## 1. The Free Data We Have Right Now

We have access to two provider-level claims datasets from CMS, plus a provider registry. No paywalls, no data use agreements.


### Dataset 1: CMS Medicare Physician & Other Practitioners

Source: https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners

| Field | What It Tells Us |
|---|---|
| NPI | Which provider performed the service |
| HCPCS/CPT code | What they did |
| Number of services | How many times they did it |
| Number of beneficiaries | How many unique patients |
| Place of service | Office (O), Facility (F), ASC |
| Average Medicare payment | What Medicare paid per service |
| Beneficiary demographics | Age, sex, race, chronic conditions (aggregated) |
| Provider specialty | Taxonomy-derived specialty |

**The neurosurgery context:** Neurosurgery is a Medicare-significant specialty. Degenerative spine disease, brain tumors, and normal pressure hydrocephalus are predominantly conditions of aging. The Medicare file captures the majority of neurosurgical volume for adult neurosurgeons. However, many surgical procedures are performed in hospital inpatient settings where the facility bills separately — the physician component (professional fee) appears under the surgeon's NPI, but some bundled arrangements may reduce visibility.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

| Field | What It Tells Us |
|---|---|
| NPI (billing provider) | Who billed for the service |
| NPI (servicing provider) | Who performed the service |
| HCPCS procedure code | What they did |
| Month/year | When (2018-2024) |
| Beneficiary count | How many unique patients for that procedure in that month |
| Claim count | How many claims |
| Total spending | Dollars paid |

**What it does NOT have:**

| Missing Field | What We Lose |
|---|---|
| ICD-10 diagnosis codes | Cannot link procedures to clinical indications (e.g., disc herniation vs. spinal stenosis vs. tumor) |
| NDC drug codes | Cannot track post-operative medication management |
| Institutional claims | No hospital inpatient data unless billed under physician NPI |
| Patient-level linkage | Cannot track surgical outcomes, readmissions, or complication rates |

**Neurosurgery Medicaid context:** Medicaid neurosurgery volume includes trauma (younger patients), pediatric neurosurgery (hydrocephalus, congenital anomalies), and some working-age spine disease. This file supplements Medicare for the non-elderly population.

**Note:** This dataset was temporarily unavailable as of late March 2026. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every neurosurgeon by NPI, taxonomy code `207T00000X` (Neurological Surgery), practice address, and organizational affiliation.

Unlike retina specialists (who lack a dedicated taxonomy code), neurosurgeons have a clean, dedicated taxonomy code that directly identifies the specialty.


### What These Three Files Give Us

| We Can See | We Cannot See |
|---|---|
| Which surgical procedures a neurosurgeon performs and how often | Why they performed them (no diagnosis codes in Medicaid) |
| Whether they do spine, cranial, or both | Surgical outcomes (complications, reoperation, functional improvement) |
| E/M visit complexity and volume | Post-operative medication management |
| Whether they use image guidance and neuromonitoring | Whether the surgical approach was appropriate for the pathology |
| Their practice location and subspecialty breadth | Readmission rates or patient-reported outcomes |
| Procedure volume relative to peers | Whether conservative treatment was attempted before surgery |


## 2. What the Codes Tell Us


### Spine Surgery: The Volume Driver of Modern Neurosurgery

| Code | Description | Visible In |
|---|---|---|
| 63047 | Laminectomy, single lumbar segment (decompression) | Medicare + Medicaid |
| 63048 | Laminectomy, each additional lumbar segment | Medicare + Medicaid |
| 63030 | Lumbar discectomy (microdiscectomy) | Medicare + Medicaid |
| 63042 | Laminotomy with disc fragment removal, lumbar | Medicare + Medicaid |
| 22551 | Anterior cervical discectomy and fusion (ACDF), single level | Medicare + Medicaid |
| 22552 | ACDF, each additional level | Medicare + Medicaid |
| 22612 | Posterolateral lumbar fusion, single segment | Medicare + Medicaid |
| 22614 | Posterolateral lumbar fusion, each additional segment | Medicare + Medicaid |
| 22630 | Posterior lumbar interbody fusion (PLIF/TLIF) | Medicare + Medicaid |
| 22633 | Combined posterolateral + interbody fusion, single level | Medicare + Medicaid |
| 22853 | Insertion of interbody biomechanical device | Medicare + Medicaid |
| 22842 | Posterior segmental instrumentation, 3-6 vertebral segments | Medicare + Medicaid |
| 22840 | Posterior non-segmental instrumentation | Medicare + Medicaid |
| 20930 | Morselized allograft for spine surgery | Medicare + Medicaid |
| 20936 | Autograft for spine surgery (local) | Medicare + Medicaid |

**What we can measure:** Decompression volume, fusion volume, fusion-to-decompression ratio, instrumentation usage, multi-level surgery rates, and cervical vs. lumbar distribution.

**What we cannot measure:** Whether surgery was indicated (requires diagnosis + failed conservative treatment), surgical outcomes, complication rates, or reoperation rates.

**What CNS/AANS guidelines say:** CNS/AANS joint guidelines for degenerative lumbar disease recommend decompression alone for lumbar stenosis without instability, and fusion only when instability is present. Guidelines for cervical spondylotic myelopathy recommend surgical decompression. The proportion of decompressions-only vs. fusions is a proxy for appropriate surgical selection.

**How we score it:** Fusion-to-decompression ratio ranked against peers. Providers with very high fusion rates relative to decompression may be over-fusing. Providers with reasonable decompression volumes and moderate fusion rates suggest appropriate surgical selection.

> **ASSUMPTION:** We cannot determine if fusion was clinically indicated without diagnosis codes. A provider treating primarily spondylolisthesis (instability) will have higher fusion rates than one treating primarily stenosis. The fusion-to-decompression ratio is a population-level proxy, not an individual case assessment.


### Cranial Surgery: Tumor, Trauma, and Cerebrovascular

| Code | Description | Visible In |
|---|---|---|
| 61510 | Craniectomy/craniotomy for supratentorial tumor excision | Medicare + Medicaid |
| 61518 | Craniectomy for infratentorial tumor excision | Medicare + Medicaid |
| 61312 | Craniectomy for evacuation of hematoma, supratentorial | Medicare + Medicaid |
| 61314 | Craniectomy for evacuation of hematoma, infratentorial | Medicare + Medicaid |
| 61154 | Burr holes with evacuation of hematoma, extradural or subdural | Medicare + Medicaid |
| 61107 | Twist drill hole for subdural drainage | Medicare + Medicaid |
| 61210 | Burr holes for ventricular catheter, shunt, or reservoir | Medicare + Medicaid |
| 62223 | Creation of ventriculoperitoneal shunt | Medicare + Medicaid |
| 62230 | Shunt revision/replacement | Medicare + Medicaid |
| 61624 | Transcatheter permanent occlusion or embolization (endovascular) | Medicare + Medicaid |
| 61630 | Balloon angioplasty, intracranial | Medicare + Medicaid |

**What we can measure:** Cranial surgical volume, tumor surgery volume, trauma surgery volume, shunt volume, and endovascular neurosurgery volume.

**What we cannot measure:** Tumor grade/type, surgical completeness (extent of resection), neurological outcomes, or whether endovascular vs. open approach was appropriate.

**What CNS/AANS guidelines say:** CNS guidelines for brain metastases recommend surgery for accessible single lesions. AANS/CNS guidelines for traumatic brain injury recommend surgical evacuation of large epidural and subdural hematomas. Volume-outcome relationships in cranial neurosurgery are well-documented — higher-volume centers have better outcomes.

**How we score it:** Cranial surgical breadth (number of distinct cranial procedure codes), volume ranked against peers.


### Image Guidance and Neuronavigation

| Code | Description | Visible In |
|---|---|---|
| 61781 | Stereotactic computer-assisted navigation, cranial | Medicare + Medicaid |
| 61782 | Stereotactic computer-assisted navigation, spinal | Medicare + Medicaid |
| 61783 | Stereotactic computer-assisted navigation, cranial, additional | Medicare + Medicaid |
| 20660 | Application of cranial tongs/caliper (for traction) | Medicare + Medicaid |

**What we can measure:** Whether the neurosurgeon uses image guidance/neuronavigation for cranial and spinal procedures.

**What we cannot measure:** Whether image guidance was appropriate for the specific case or whether it improved outcomes.

**What CNS/AANS guidelines say:** Image guidance is recommended for brain tumor surgery and complex spinal instrumentation. Its use is a marker of modern, technology-enabled surgical practice.

**How we score it:** Image guidance utilization rate relative to surgical volume. Presence of 61781/61782 indicates the surgeon uses navigation technology.

> **ASSUMPTION:** Image guidance codes (61781/61782) are add-on codes billed alongside the primary surgical code. They should appear proportional to cranial tumor surgery and complex spine fusion volume. Absence does not necessarily mean the surgeon does not use navigation — some facilities bill navigation under the facility, not the surgeon.


### Peripheral Nerve Surgery

| Code | Description | Visible In |
|---|---|---|
| 64721 | Carpal tunnel release (neurectomy, median nerve) | Medicare + Medicaid |
| 64718 | Ulnar nerve transposition at elbow | Medicare + Medicaid |
| 64708 | Neuroplasty, major peripheral nerve, arm/leg | Medicare + Medicaid |

**What we can measure:** Whether the neurosurgeon performs peripheral nerve procedures (some neurosurgeons subspecialize in this area).

**How we score it:** Presence contributes to surgical breadth but is not a separate scored domain. Peripheral nerve surgery is a smaller component of most neurosurgical practices.


### Office Visits and Consultations

| Code | Description | Visible In |
|---|---|---|
| 99213 | Office visit, established, low-moderate complexity | Medicare + Medicaid |
| 99214 | Office visit, established, moderate complexity | Medicare + Medicaid |
| 99215 | Office visit, established, high complexity | Medicare + Medicaid |
| 99204 | Office visit, new patient, moderate-high complexity | Medicare + Medicaid |
| 99205 | Office visit, new patient, high complexity | Medicare + Medicaid |
| 99223 | Initial hospital care, high complexity | Medicare + Medicaid |
| 99233 | Subsequent hospital care, high complexity | Medicare + Medicaid |
| 99291 | Critical care, first 30-74 minutes | Medicare + Medicaid |

> **ASSUMPTION:** Neurosurgeons legitimately bill at higher E/M complexity than primary care. 99214 and 99215 should be dominant codes. Neurosurgical patients typically have complex conditions requiring detailed evaluation and management. Do NOT apply primary care E/M norms to neurosurgery.


## 3. What We Can and Cannot Score (Honest Assessment)

| Domain | Weight | Scorable Guidelines | Not Scorable | Why Not |
|---|---|---|---|---|
| Spine Surgery Patterns | 35% | 3 of 12 (decompression volume, fusion-to-decompression ratio, instrumentation usage rate) | 9 | Cannot determine surgical indication, cannot assess failed conservative treatment, cannot track outcomes or reoperation |
| Cranial Surgery Patterns | 25% | 2 of 8 (cranial surgical breadth, cranial volume relative to peers) | 6 | Cannot determine tumor grade, resection extent, neurological outcomes, or approach appropriateness |
| Technology Utilization | 15% | 2 of 4 (image guidance rate, neuronavigation usage) | 2 | Cannot confirm technology improved outcomes or was used appropriately |
| Surgical Breadth & Case Mix | 15% | 2 of 5 (procedure diversity, spine-to-cranial ratio) | 3 | Cannot determine case complexity, ASA class, or patient comorbidity burden |
| Post-Operative Care | 10% | 0 of 8 | 8 | Requires patient-level visit sequencing, readmission data, complication codes, Rx data |
| **Total** | | **9 of 37** | **28** | |

**Bottom line:** With free CMS data, we can score 9 guidelines concentrated in surgical volume patterns, procedure diversity, technology utilization, and case mix proxies. We are blind to outcomes, appropriateness of surgical indication, and post-operative care quality.

> **EXTERNAL RESOURCE NEEDED:** The CNS clinical practice guidelines (https://www.cns.org/) and AANS/CNS joint section guidelines should be reviewed line-by-line for each subspecialty area (spine, tumor, trauma, cerebrovascular, functional, pediatric) to produce an exact guideline count. The 37 total is an estimate. The N2QOD (Neurosurgery Quality Outcomes Database) quality measures should also be cross-referenced for measures that align with billing data.


## 4. Business Logic: How We Compare What They Did vs. What CNS/AANS Says


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code = '207T00000X' (Neurological Surgery)
**Filter by state:** provider_state = target state
**Entity type:** Individual (Type 1 NPI)
**Output:** A table of neurosurgical NPIs with practice address, entity type.

Subspecialists within neurosurgery (pediatric neurosurgery 2080P0008X, if coded separately) should be flagged but included in the general cohort unless their volume is too low for meaningful comparison.


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners (primary) + Medicaid Provider Spending (supplementary)
**Join:** On NPI
**Aggregate:** Sum across all months in the measurement year to get annual totals per NPI per HCPCS code.

If an NPI appears in both files, sum the volumes.


### Geographic Grouping for Percentile Scoring

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All neurosurgical NPIs (taxonomy 207T00000X, >= 50 Medicare services) in the same state | Primary scoring. |
| **National** | All states combined | Fallback when state cohort < 30 neurosurgeons. Also for cross-state benchmarking. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES | Urban academic centers vs. community neurosurgeons. |

> **ASSUMPTION:** Neurosurgery is a smaller specialty than primary care. Many states may have only 50-150 neurosurgeons, which is viable for state-level comparison but does not support sub-state grouping. States like Wyoming, Vermont, or Alaska may have <30 neurosurgeons, requiring national fallback.


---

### DOMAIN 1: Spine Surgery Patterns (Weight: 40%)


**Measure 1A: Fusion-to-Decompression Ratio**

What it answers: What proportion of this neurosurgeon's spine procedures are fusions vs. decompressions-only?

```
decompression_codes = [63047, 63048, 63030, 63042, 63005, 63012, 63017, 63045, 63046]
fusion_codes = [22551, 22552, 22612, 22614, 22630, 22633, 22634]

decompression_services = SUM(total_services) WHERE hcpcs_code IN decompression_codes
fusion_services = SUM(total_services) WHERE hcpcs_code IN fusion_codes

IF decompression_services + fusion_services < 10: insufficient data

metric = fusion_services / (decompression_services + fusion_services)
```

CNS/AANS standard: Guidelines recommend decompression alone for lumbar stenosis without instability. Fusion should be added when instability is documented. A high fusion ratio may suggest over-utilization; a very low ratio may indicate limited surgical capability. Expected range: 20-50% of spine cases include fusion, varying by case mix.

Score: Percentile rank among peers. Middle of the distribution = higher score. Extremes (very high or very low) = flagged.


**Measure 1B: Instrumentation Rate**

What it answers: When this neurosurgeon fuses, do they instrument?

```
instrumentation_codes = [22840, 22842, 22843, 22844, 22853]
instrumentation_services = SUM(total_services) WHERE hcpcs_code IN instrumentation_codes

metric = instrumentation_services / fusion_services  (if fusion_services > 0)
```

CNS/AANS standard: Instrumented fusion has become standard for most spinal fusion procedures. An instrumentation rate near 1.0 (instrumentation with every fusion) is expected. A very low rate may indicate the provider performs non-instrumented fusions (posterolateral fusion without pedicle screws), which is less common in modern practice.

Score: Percentile rank among peers.


**Measure 1C: Spine Surgical Volume**

What it answers: How many spine procedures does this neurosurgeon perform per year?

```
all_spine_codes = decompression_codes + fusion_codes + instrumentation_codes
spine_volume = SUM(total_services) WHERE hcpcs_code IN all_spine_codes

metric = spine_volume
```

CNS/AANS standard: Volume-outcome relationships in spine surgery suggest that higher-volume surgeons have fewer complications. There is no hard minimum, but providers performing <20 spine procedures per year may not maintain proficiency.

Score: Percentile rank among peers.


**Domain 1 Score:**

```
domain_1 = (measure_1a_score * 0.35) + (measure_1b_score * 0.30) + (measure_1c_score * 0.35)
```


---

### DOMAIN 2: Cranial Surgery Patterns (Weight: 30%)


**Measure 2A: Cranial Surgical Breadth**

What it answers: Does this neurosurgeon perform a range of cranial procedures?

```
cranial_categories = {
    'tumor_supra':       [61510, 61512],
    'tumor_infra':       [61518, 61519, 61520, 61521],
    'trauma_hematoma':   [61312, 61314, 61154, 61107],
    'shunt_CSF':         [62223, 62230, 61210],
    'endovascular':      [61624, 61630, 61635],
    'stereotactic':      [61720, 61750, 61781, 61783]
}

categories_with_volume = COUNT of keys WHERE
    SUM(total_services) for ANY code in that category > 0

metric = categories_with_volume  -- integer 0-6
```

CNS/AANS standard: A general neurosurgeon should be capable of tumor surgery, trauma surgery, and CSF diversion at minimum. Endovascular and stereotactic are more subspecialized. Expected: 3-5 categories for a general neurosurgeon.

Score: `(categories_with_volume / 5) * 100`, capped at 100.


**Measure 2B: Cranial Volume Relative to Peers**

What it answers: How does this neurosurgeon's cranial volume compare to peers?

```
all_cranial_codes = [61510, 61518, 61312, 61314, 61154, 61107, 61210,
                     62223, 62230, 61624, 61630, 61720, 61781]
cranial_volume = SUM(total_services) WHERE hcpcs_code IN all_cranial_codes

metric = cranial_volume
```

Score: Percentile rank among peers.

Note: Some neurosurgeons are spine-only and do minimal cranial work. A low cranial volume is not a quality deficiency if the provider has strong spine scores. This is captured in the composite handling.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.50) + (measure_2b * 0.50)
```

**Medical retina analog — spine-only handling:** For neurosurgeons with zero cranial volume, Domain 2 weight is redistributed to Domain 1 and Domain 3. Spine-only practice is a legitimate specialization.


---

### DOMAIN 3: Technology Utilization & Surgical Quality Proxies (Weight: 30%)


**Measure 3A: Image Guidance Utilization**

What it answers: Does this neurosurgeon use stereotactic navigation for complex cases?

```
nav_codes = [61781, 61782, 61783]
nav_services = SUM(total_services) WHERE hcpcs_code IN nav_codes

complex_surgery = cranial_tumor_services + complex_spine_fusion_services
    -- cranial_tumor_services = SUM for [61510, 61518]
    -- complex_spine_fusion_services = SUM for [22612, 22633]

metric_binary = 1 IF nav_services > 0 ELSE 0
metric_rate = nav_services / complex_surgery  (if complex_surgery > 0)
```

CNS/AANS standard: Image guidance is recommended for brain tumor surgery and complex spinal instrumentation. Use is a marker of modern surgical practice.

Score: Binary (30%) + rate percentile (70%).


**Measure 3B: Procedure Diversity Index**

What it answers: How broad is this neurosurgeon's procedural portfolio?

```
all_neurosurgical_procedures = spine_codes + cranial_codes + peripheral_nerve_codes
distinct_procedure_codes = COUNT of distinct HCPCS codes billed with services > 0
    WHERE code is a surgical/procedural code (not E/M)

metric = distinct_procedure_codes
```

CNS/AANS standard: A broadly trained neurosurgeon should bill a diverse set of procedure codes spanning multiple anatomic areas. Narrow procedural focus is not inherently wrong but may indicate limited surgical capability.

Score: Percentile rank among peers.


**Measure 3C: Spine-to-Cranial Balance**

What it answers: Is this neurosurgeon's practice heavily weighted toward one area?

```
spine_pct = spine_volume / (spine_volume + cranial_volume)
    -- if both > 0
```

This is informational, not directly scored. It contextualizes the provider's practice focus for interpretation of other scores.


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.45) + (measure_3b * 0.55)
```


---

### Composite Score

```
composite = (domain_1 * 0.40) + (domain_2 * 0.30) + (domain_3 * 0.30)
```

Range: 0 to 100.

**Minimum data requirement:** Provider must have scores in at least 2 of 3 domains.

**If a domain is missing:** Redistribute weight proportionally. Example: if Domain 2 (cranial) is missing (spine-only surgeon), composite becomes `(domain_1 * 0.57) + (domain_3 * 0.43)`.


---

### Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| provider_cbsa | string | Core-Based Statistical Area code |
| taxonomy_code | string | From NPPES (207T00000X) |
| practice_focus | string | "spine_dominant", "cranial_dominant", "balanced", or "mixed" |
| geo_group_level | string | "state", "national", or "zip3" |
| percentile_cohort_state | string | State of peer cohort (or "US") |
| percentile_cohort_size | int | Number of neurosurgeon peers in cohort |
| total_beneficiaries | int | Estimated total unique patients |
| total_services | int | Total claim lines across all codes |
| decompression_volume | int | Total decompression services |
| fusion_volume | int | Total fusion services |
| fusion_to_decompression_ratio | float | Measure 1A metric |
| instrumentation_rate | float | Measure 1B metric |
| spine_volume | int | Measure 1C metric |
| domain_1_score | float | Spine Surgery Patterns (0-100) |
| cranial_breadth | int | Measure 2A metric (0-6) |
| cranial_volume | int | Measure 2B metric |
| domain_2_score | float | Cranial Surgery Patterns (0-100) |
| nav_binary | boolean | Whether image guidance codes billed |
| nav_rate | float | Measure 3A metric |
| procedure_diversity | int | Measure 3B metric |
| spine_pct | float | Measure 3C (informational) |
| domain_3_score | float | Technology & Breadth (0-100) |
| composite_score | float | Weighted composite (0-100) |
| confidence_tier | int | 2 (claims proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data (1 or 2) |
| scorable_domains | int | Number of domains scored (0-3) |


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **N2QOD (Neurosurgery Quality Outcomes Database)** | Restricted (AANS membership) | Surgical outcomes, complications, patient-reported outcomes, 90-day follow-up | +15 guidelines. Unlocks: surgical appropriateness, outcome tracking, complication rates |
| **MA APCD** | $5-7K, 2-4 weeks | Patient-level claims with diagnosis codes + Rx. Links procedures to indications. | +12 guidelines. Unlocks: surgical indication appropriateness, failed conservative treatment, readmission tracking |
| **NSQIP (National Surgical Quality Improvement Program)** | Restricted (ACS membership) | Risk-adjusted surgical complication data | +6 guidelines. Unlocks: risk-adjusted complication rates, SSI, DVT/PE |
| **Spine surgery registries** | Varies | Long-term outcome data for spine procedures | +5 guidelines. Unlocks: reoperation rates, fusion success, functional outcomes |


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring surgical volume patterns, not clinical quality.** A high fusion-to-decompression ratio does not mean the fusions were inappropriate. A low cranial volume does not mean the surgeon is incompetent at cranial procedures. Without diagnosis codes, we cannot assess surgical appropriateness.

**Subspecialization is normal and expected.** Some neurosurgeons are spine-only. Some are cranial-only. Some subspecialize in functional neurosurgery, pediatric neurosurgery, or endovascular neurosurgery. The scoring system must accommodate these legitimate practice patterns without penalizing specialization.

**Hospital-employed neurosurgeons may show lower procedure volumes.** Billing arrangements where the hospital bills the global surgical fee can reduce the surgeon's individual NPI procedure count. Place-of-service data in Medicare can partially identify this.

**Volume-outcome relationships are real but noisy.** Higher surgical volumes are associated with better outcomes in neurosurgery (especially for cranial tumors and complex spine), but volume alone is not quality. A high-volume surgeon with poor technique is worse than a moderate-volume surgeon with excellent outcomes.

**Fusion rates are heavily influenced by case mix.** A neurosurgeon treating primarily spondylolisthesis will have a higher fusion rate than one treating primarily lumbar stenosis. Without diagnosis codes, we cannot adjust for case mix.

**9 of 37 scorable guidelines is a partial view.** The composite is a utilization profile, not a comprehensive quality assessment.

**Instrumentation and device codes may not appear under the surgeon's NPI.** Some hospitals bill implant codes (22853, 22842) under the facility. This affects instrumentation rate calculations.

> **EXTERNAL RESOURCE NEEDED:** Review CNS evidence-based guidelines at https://www.cns.org/ and AANS/CNS joint guidelines for each subspecialty section (spine, tumor, cerebrovascular, trauma, pediatric, functional) to finalize the scorable vs. not-scorable classification.


---

## Appendix: CMS Quality Measure Crosswalk

| Measure ID | Measure Name | Scorable Now? | What's Missing |
|---|---|---|---|
| MIPS 21 | Perioperative care: selection of prophylactic antibiotic | No | Requires Rx data |
| MIPS 23 | Perioperative care: discontinuation of prophylactic antibiotics | No | Requires Rx + timing |
| MIPS 130 | Documentation of current medications | No | Requires EHR data |
| MIPS 226 | Tobacco screening and cessation | No | Requires diagnosis + counseling codes |
| N2QOD-1 | Spine surgical complication rate | No | Requires outcome registry |
| N2QOD-2 | Patient-reported outcomes (PROs) improvement | No | Requires PRO data |
| CNS-GL-Spine | Fusion appropriateness for degenerative disease | Partial (fusion ratio) | Requires diagnosis linkage |
| CNS-GL-Tumor | Extent of resection for glioma | No | Requires imaging + pathology |
| CNS-GL-TBI | Surgical evacuation timing for TBI | No | Requires timing data |
