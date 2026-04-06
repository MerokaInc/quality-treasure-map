# Retina Specialist Guideline Concordance Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a retina specialist actually did: every injection, every surgery, every imaging study. ASRS and AAO clinical guidelines tell you what that provider should be doing for patients with age-related macular degeneration, diabetic retinopathy, retinal vein occlusion, and other retinal diseases. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.

**Guideline bodies:**
- **Primary:** American Society of Retina Specialists (ASRS) — clinical guidelines, Preferences and Trends (PAT) Survey, best practice recommendations
- **Secondary:** American Academy of Ophthalmology (AAO) — Preferred Practice Patterns (PPPs) for AMD, Diabetic Retinopathy, RVO, Retinal Detachment


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
| Place of service | Office, facility, ASC, etc. |
| Average Medicare payment | What Medicare paid per service |
| Beneficiary demographics | Age, sex, race, chronic conditions (aggregated) |
| Provider specialty | Taxonomy-derived specialty |

**The retina advantage:** Unlike pediatrics, retina is a Medicare-heavy specialty. Age-related macular degeneration, diabetic retinopathy in elderly patients, and retinal vein occlusion are predominantly Medicare conditions. This file is the **primary** data source for retina, not supplementary.


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
| ICD-10 diagnosis codes | Cannot link injections to specific retinal conditions (AMD vs. DR vs. RVO) |
| NDC drug codes | Cannot distinguish anti-VEGF agents by manufacturer beyond J-codes |
| Institutional claims | No hospital-based surgical records unless billed under physician NPI |
| Patient-level linkage | Cannot track individual treatment courses (e.g., injection frequency per patient) |

**Retina Medicaid context:** Medicaid retina volume is low compared to Medicare. Younger patients with diabetic retinopathy, retinopathy of prematurity (ROP), and trauma represent the Medicaid segment. This file is supplementary for retina.

**Note:** This dataset was temporarily unavailable as of late March 2026. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies providers by NPI, taxonomy code, practice address, and organizational affiliation.

> **ASSUMPTION — Taxonomy Code Limitation:** NPPES does not have a dedicated "Retina Specialist" taxonomy code. Retina specialists register under `207W00000X` (Ophthalmology, general). We cannot filter to retina specialists by taxonomy alone. Instead, we identify retina specialists using a **procedure-based classification**: any ophthalmologist NPI with intravitreal injection (67028) volume above a threshold (e.g., ≥50 injections/year) AND/OR vitrectomy codes (67036-67043) is classified as a retina specialist. This method requires validation against known retina practice rosters.
>
> **EXTERNAL RESOURCE NEEDED:** ASRS membership directory or similar roster to validate the procedure-based classification against known retina specialists. Also check if a subspecialty taxonomy code exists under 207WX0XXX series in current NPPES data.


### What These Three Files Give Us

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes a retina provider bills (injections, surgeries, imaging) | Why they performed them (AMD vs. DR vs. RVO — no diagnosis codes in Medicaid) |
| How often they bill each code (volume) | Which anti-VEGF agent was used (J-code granularity is limited) |
| How many patients they treat per procedure | Individual patient treatment courses or injection intervals |
| Whether they perform diagnostic imaging before/alongside treatment | Whether imaging findings justified treatment decisions |
| Whether they perform surgical procedures (vitrectomy, retinal repair) | Surgical outcomes or complication rates |
| Their practice location and setting (office vs. ASC vs. hospital) | Patient visual acuity outcomes |


## 2. What the Codes Tell Us


### Intravitreal Injections: The Core of Modern Retina Practice

| Code | Description | Visible In |
|---|---|---|
| 67028 | Intravitreal injection of a pharmacologic agent | Medicare + Medicaid |
| J0178 | Aflibercept injection (Eylea) | Medicare + Medicaid |
| J2778 | Ranibizumab injection (Lucentis) | Medicare + Medicaid |
| J9035 | Bevacizumab injection (Avastin, off-label) | Medicare + Medicaid |
| J3490 | Unclassified drugs (sometimes used for newer agents like faricimab, brolucizumab) | Medicare + Medicaid |
| Q5124 | Biosimilar ranibizumab | Medicare + Medicaid |

**What we can measure:** Total intravitreal injection volume per provider (67028), injection-to-patient ratio (average injections per beneficiary), and which drug J-codes are used. Injection volume per beneficiary is a proxy for treatment intensity.

**What we cannot measure:** Whether each injection was clinically appropriate (requires diagnosis + imaging correlation), whether the injection interval follows treat-and-extend or PRN protocols, or whether the patient's condition was actually anti-VEGF-responsive.

**What ASRS/AAO guidelines say:** Anti-VEGF is first-line treatment for neovascular AMD, diabetic macular edema (DME), and macular edema from RVO. ASRS PAT survey shows >95% of retina specialists use anti-VEGF as primary treatment for wet AMD. AAO PPP recommends loading doses followed by treat-and-extend or PRN regimens. Expected injection frequency: 6-12 per eye per year for active disease.

**How we score it:** Injection volume per beneficiary, ranked against retina specialist peers. A provider with very low injection-to-patient ratios may be undertreating. Very high ratios are less concerning (active disease requires frequent treatment) but extreme outliers warrant investigation.

> **ASSUMPTION:** J-codes for anti-VEGF drugs may be billed by the facility (hospital outpatient department) rather than the physician NPI, especially in non-office settings. Providers practicing in hospital-based clinics may show high 67028 volume but low J-code volume under their NPI. We score on 67028 (the procedure) rather than J-codes (the drug) to avoid this artifact.


### Diagnostic Imaging: Does This Provider Image Before and During Treatment?

| Code | Description | Visible In |
|---|---|---|
| 92134 | Scanning computerized ophthalmic diagnostic imaging, posterior segment (OCT) | Medicare + Medicaid |
| 92235 | Fluorescein angiography (FA) | Medicare + Medicaid |
| 92240 | Indocyanine green angiography (ICG) | Medicare + Medicaid |
| 92250 | Fundus photography | Medicare + Medicaid |
| 76512 | Ophthalmic ultrasound, diagnostic, B-scan | Medicare + Medicaid |
| 92227 | Imaging of retina for detection/monitoring of disease (remote imaging) | Medicare + Medicaid |

**What we can measure:** OCT volume (92134) relative to injection volume (67028), FA usage rate, fundus photography rate, and B-scan ultrasound for surgical planning.

**What we cannot measure:** Whether imaging findings were used to guide treatment decisions, imaging quality, or whether the correct imaging modality was selected for the clinical scenario.

**What ASRS/AAO guidelines say:** OCT is considered standard-of-care monitoring for all anti-VEGF-treated patients. AAO PPP for AMD recommends OCT at every treatment visit to guide retreatment decisions. FA is recommended at initial diagnosis and when disease activity is uncertain. Fundus photography is recommended for documentation at baseline and follow-up.

**How we score it:** OCT-to-injection ratio is the primary metric. A retina specialist who injects without imaging is not following guideline-based monitoring. Expected ratio: ≥0.8 OCT per injection visit (some visits may be injection-only in established patients).


### Vitreoretinal Surgery: Does This Provider Perform the Full Surgical Spectrum?

| Code | Description | Visible In |
|---|---|---|
| 67036 | Vitrectomy, mechanical, pars plana approach | Medicare + Medicaid |
| 67039 | Vitrectomy with focal endolaser | Medicare + Medicaid |
| 67040 | Vitrectomy with endolaser panretinal photocoagulation | Medicare + Medicaid |
| 67041 | Vitrectomy with removal of internal limiting membrane (ILM peel) | Medicare + Medicaid |
| 67042 | Vitrectomy with removal of epiretinal membrane | Medicare + Medicaid |
| 67043 | Vitrectomy with subretinal membrane removal | Medicare + Medicaid |
| 67108 | Repair of retinal detachment, with vitrectomy | Medicare + Medicaid |
| 67113 | Repair of complex retinal detachment | Medicare + Medicaid |
| 67145 | Prophylaxis of retinal detachment (e.g., laser demarcation) | Medicare + Medicaid |
| 67101 | Repair of retinal detachment, cryotherapy or diathermy | Medicare + Medicaid |
| 67105 | Repair of retinal detachment, photocoagulation | Medicare + Medicaid |
| 67110 | Repair of retinal detachment, scleral buckle | Medicare + Medicaid |

**What we can measure:** Whether a retina specialist performs surgical procedures and which types, surgical volume per year, and surgical breadth (number of distinct surgical codes billed).

**What we cannot measure:** Surgical outcomes, complication rates, reoperation rates, or whether the surgical approach was appropriate for the specific pathology.

**What ASRS/AAO guidelines say:** AAO PPP for retinal detachment recommends prompt surgical repair. ASRS guidelines recommend vitrectomy as primary repair for most rhegmatogenous retinal detachments. Surgical approach (vitrectomy vs. scleral buckle vs. pneumatic retinopexy) depends on detachment characteristics.

**How we score it:** Surgical breadth (number of distinct surgical procedure codes billed) ranked against peers. A retina specialist who performs vitrectomy with membrane peeling, retinal detachment repair, and endolaser is practicing a broader surgical portfolio than one who does only basic vitrectomy.

> **ASSUMPTION:** Surgical volume may be undercounted for retina specialists who operate in hospital settings where procedures are billed under the facility NPI. Office-based and ASC-based surgeons will show higher surgical volumes under their individual NPI.


### Laser Photocoagulation: Does This Provider Use Laser Appropriately?

| Code | Description | Visible In |
|---|---|---|
| 67210 | Photocoagulation of retinal vascular lesion | Medicare + Medicaid |
| 67220 | Photocoagulation of choroidal lesion | Medicare + Medicaid |
| 67228 | Treatment of extensive retinal lesion (e.g., PRP) | Medicare + Medicaid |

**What we can measure:** Whether the provider performs laser photocoagulation and in what volume.

**What we cannot measure:** Whether laser was indicated (requires diagnosis), whether it was applied correctly, or whether it was used appropriately alongside anti-VEGF.

**What ASRS/AAO guidelines say:** Panretinal photocoagulation (PRP) remains a standard treatment for proliferative diabetic retinopathy (PDR), though anti-VEGF is increasingly used as an alternative. Focal laser for clinically significant diabetic macular edema has been largely supplanted by anti-VEGF. A retina specialist with SOME laser volume alongside high injection volume suggests appropriate multi-modal treatment.

**How we score it:** Laser-to-total-procedure ratio ranked against peers. A moderate laser presence alongside dominant injection volume is the expected modern pattern.


### Ophthalmologic Examinations

| Code | Description | Visible In |
|---|---|---|
| 92014 | Ophthalmological examination, comprehensive, established patient | Medicare + Medicaid |
| 92012 | Ophthalmological examination, intermediate, established patient | Medicare + Medicaid |
| 92004 | Ophthalmological examination, comprehensive, new patient | Medicare + Medicaid |
| 92002 | Ophthalmological examination, intermediate, new patient | Medicare + Medicaid |
| 99213 | Office visit, established patient, low-moderate complexity | Medicare + Medicaid |
| 99214 | Office visit, established patient, moderate complexity | Medicare + Medicaid |
| 99215 | Office visit, established patient, high complexity | Medicare + Medicaid |
| 99205 | Office visit, new patient, high complexity | Medicare + Medicaid |

> **ASSUMPTION:** Ophthalmologists may bill either specialty-specific exam codes (920xx) or standard E/M codes (992xx). Post-2021 E/M documentation changes shifted some ophthalmologists toward 992xx codes. Our calculations must include BOTH code families when counting office visits or computing denominators.

**How we score it:** Exam volume as a practice size denominator, not scored independently. The exam-to-procedure ratio helps contextualize whether the provider is a high-volume injector vs. a mixed medical-surgical retina practice.


## 3. What We Can and Cannot Score (Honest Assessment)

We mapped ASRS/AAO clinical guidelines against available CMS data. Out of the guideline domains identified, here is what is scorable:

| Domain | Weight | Scorable Guidelines | Not Scorable | Why Not |
|---|---|---|---|---|
| Anti-VEGF Treatment Patterns | 35% | 3 of 9 (injection volume, injection-per-beneficiary rate, drug code breadth) | 6 | Cannot determine condition-specific appropriateness, injection intervals, or treat-and-extend compliance without patient-level data and diagnosis codes |
| Diagnostic Imaging Utilization | 25% | 3 of 6 (OCT volume, OCT-to-injection ratio, imaging modality breadth) | 3 | Cannot confirm imaging-guided treatment decisions, imaging quality, or whether correct modality was chosen |
| Surgical Practice Patterns | 20% | 2 of 7 (surgical breadth, surgical volume relative to peers) | 5 | Cannot measure outcomes, complication rates, reoperation rates, or surgical appropriateness |
| Laser Utilization | 10% | 1 of 4 (laser volume relative to total procedures) | 3 | Cannot determine indication, cannot distinguish focal from PRP, cannot confirm appropriateness |
| Follow-Up & Monitoring | 10% | 0 of 5 | 5 | Requires patient-level visit sequencing to measure follow-up intervals, lost-to-follow-up rates, post-op checks |
| **Total** | | **9 of 31** | **22** | |

**Bottom line:** With free CMS data, we can score 9 guidelines concentrated in three areas: injection patterns, imaging utilization, and surgical breadth. We are blind to everything requiring diagnosis codes, patient-level treatment courses, or outcomes data.

The 9 scorable guidelines still tell a meaningful story. A retina specialist who performs high-volume injections with appropriate imaging monitoring, uses multiple anti-VEGF agents, and maintains a broad surgical portfolio is practicing differently from one who injects without imaging or lacks surgical capability.

> **EXTERNAL RESOURCE NEEDED:** The specific ASRS/AAO guideline recommendations should be cross-referenced against the published AAO Preferred Practice Patterns (available at https://www.aao.org/preferred-practice-pattern) and the ASRS clinical guidelines (https://www.asrs.org/) to validate the scorable vs. not-scorable classification. The guideline count of 31 is an estimate based on available knowledge; the actual AAO PPP documents for AMD, DR, RVO, and retinal detachment should be reviewed line-by-line to get an exact count.


## 4. Business Logic: How We Compare What They Did vs. What ASRS/AAO Says


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code = '207W00000X' (Ophthalmology)
**Secondary filter (procedure-based retina classification):**
- NPI has ≥50 intravitreal injections (67028) in the measurement year, OR
- NPI has ≥10 vitrectomy procedures (67036-67043, 67108, 67113) in the measurement year
- This identifies providers whose practice is retina-focused rather than general ophthalmology

**Filter by state:** provider_state = target state
**Output:** A table of retina specialist NPIs with practice address, entity type, and classification confidence.

> **ASSUMPTION:** The ≥50 injection threshold is a starting estimate. It should be validated against known retina specialist rosters. Some general ophthalmologists perform intravitreal injections at moderate volume (20-40/year) for simple AMD cases. The threshold must be high enough to exclude them but not so high that it excludes low-volume retina specialists (e.g., those in rural settings or those with predominantly surgical practices).


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners (primary) + Medicaid Provider Spending (supplementary)
**Join:** On NPI
**Aggregate:** Sum across all months in the measurement year to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (service/claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes.


### Geographic Grouping for Percentile Scoring

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All retina specialist NPIs in the same state | Primary scoring. |
| **National** | All states combined | Fallback when state cohort < 30 retina specialists. Also used for cross-state benchmarking. |
| **Sub-state (future)** | ZIP-3 or CBSA from NPPES | When state cohorts are large enough. Not implemented now. |

> **ASSUMPTION:** Some states may have very few retina specialists (rural states). The national fallback threshold of 30 providers may need to be used more frequently for retina than for general pediatrics or ophthalmology. Retina is a smaller subspecialty.


---

### DOMAIN 1: Anti-VEGF Treatment Patterns (Weight: 45%)


**Measure 1A: Injection Volume per Beneficiary**

What it answers: For the patients this provider sees, how many intravitreal injections does each receive per year?

```
injection_services = SUM(total_services) WHERE hcpcs_code = '67028'
total_provider_beneficiaries = MAX(total_beneficiaries) across all HCPCS codes for this NPI

metric = injection_services / total_provider_beneficiaries
```

ASRS/AAO standard: Active neovascular AMD patients require 6-12 injections per eye per year on average. A retina specialist's panel includes treatment-naive patients, stable patients (fewer injections), and active patients. An annualized ratio of 3-8 injections per unique beneficiary is expected for a typical mixed retina panel.

Score: Percentile rank of `metric` among retina specialist peers in the state.

Edge cases:
- If `injection_services` = 0 but provider qualifies via surgical codes, skip this measure (surgical retina specialist).
- If `total_provider_beneficiaries` < 20, insufficient volume.


**Measure 1B: Anti-VEGF Drug Breadth**

What it answers: Does this provider use multiple anti-VEGF agents, or only one?

```
anti_vegf_agents = {
    'aflibercept':    [J0178],
    'ranibizumab':    [J2778, Q5124],
    'bevacizumab':    [J9035],
    'faricimab':      [J3490],  -- may use unclassified code; check for specific J-code
    'other_agents':   [J3590]   -- unclassified biologics
}

agents_used = COUNT of agent keys WHERE
    SUM(total_services) for ANY code in that agent group > 0

metric = agents_used  -- integer 0-5
```

ASRS/AAO standard: ASRS PAT survey shows most retina specialists use 2-3 anti-VEGF agents depending on indication and patient response. Using a single agent exclusively is not necessarily wrong (cost-driven bevacizumab-only practices exist) but using multiple agents suggests individualized treatment.

Score: `(agents_used / 3) * 100`, capped at 100. Using 3+ agents = 100.

> **ASSUMPTION:** J-code assignment for newer agents (faricimab/Vabysmo, brolucizumab/Beovu) may use J3490 (unclassified drugs) or newly assigned specific J-codes. The drug mapping should be validated against the current CMS HCPCS file. Faricimab received J-code J0224 effective 2023 — verify if this appears in CMS data.
>
> **EXTERNAL RESOURCE NEEDED:** Current CMS HCPCS quarterly update files to map new anti-VEGF agents to their J-codes accurately.


**Measure 1C: Injection-to-Exam Ratio**

What it answers: Does the provider perform clinical examinations proportional to their injection volume? (Are they seeing patients or just injecting?)

```
exam_codes = [92012, 92014, 92002, 92004, 99213, 99214, 99215, 99205]

total_exam_services = SUM(total_services) WHERE hcpcs_code IN exam_codes
injection_services = SUM(total_services) WHERE hcpcs_code = '67028'

metric = total_exam_services / injection_services
```

ASRS/AAO standard: Every injection visit should include a clinical examination. A ratio near 1.0 or above means the provider examines patients at least as often as they inject. A ratio well below 1.0 could indicate injection-only visits without proper examination.

Score: Percentile rank among peers. Ratio below 0.5 is flagged.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.40) + (measure_1b * 0.25) + (measure_1c * 0.35)
```


---

### DOMAIN 2: Diagnostic Imaging Utilization (Weight: 30%)


**Measure 2A: OCT-to-Injection Ratio**

What it answers: Does this provider monitor patients with OCT when giving injections?

```
oct_services = SUM(total_services) WHERE hcpcs_code = '92134'
injection_services = SUM(total_services) WHERE hcpcs_code = '67028'

metric = oct_services / injection_services
```

ASRS/AAO standard: AAO PPP recommends OCT at each treatment visit for anti-VEGF-treated patients to guide retreatment decisions. Expected ratio: 0.8-1.2 (near 1:1). A ratio significantly below 0.5 suggests the provider is not routinely imaging before injection decisions.

Score: Percentile rank among peers. This is the highest-signal imaging metric.

Edge case: If `injection_services` = 0 (surgical-only retina specialist), use OCT-to-exam ratio instead.


**Measure 2B: Imaging Modality Breadth**

What it answers: Does this provider use the full range of retinal imaging tools?

```
imaging_modalities = {
    'OCT':                [92134],
    'fluorescein_angio':  [92235],
    'ICG_angio':          [92240],
    'fundus_photo':       [92250],
    'B_scan_ultrasound':  [76512],
    'remote_imaging':     [92227]
}

modalities_used = COUNT of keys WHERE
    SUM(total_services) for ANY code in that modality > 0

metric = modalities_used  -- integer 0-6
```

ASRS/AAO standard: A well-equipped retina practice should routinely use OCT, FA (for diagnosis and treatment planning), and fundus photography (for documentation). ICG angiography is used for specific conditions (polypoidal choroidal vasculopathy, central serous). B-scan is used for media opacities. Remote imaging is newer. Expected: 3-5 modalities for a typical retina practice.

Score: `(modalities_used / 5) * 100`, capped at 100. Using 5+ modalities = 100.


**Measure 2C: OCT Volume Relative to Practice Size**

What it answers: How many OCTs does this provider perform per unique patient?

```
oct_services = SUM(total_services) WHERE hcpcs_code = '92134'
total_provider_beneficiaries = MAX(total_beneficiaries) across all codes

metric = oct_services / total_provider_beneficiaries
```

ASRS/AAO standard: Most retina patients require multiple OCTs per year for monitoring. Expected ratio: 2-6 OCTs per patient per year depending on disease activity.

Score: Percentile rank among peers.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.45) + (measure_2b * 0.25) + (measure_2c * 0.30)
```


---

### DOMAIN 3: Surgical & Laser Practice Patterns (Weight: 25%)


**Measure 3A: Surgical Breadth**

What it answers: Does this retina specialist perform the full range of vitreoretinal surgical procedures?

```
surgical_categories = {
    'basic_vitrectomy':         [67036],
    'vitrectomy_with_laser':    [67039, 67040],
    'membrane_peel':            [67041, 67042, 67043],
    'retinal_detachment_vit':   [67108, 67113],
    'retinal_detachment_other': [67101, 67105, 67110],
    'prophylaxis':              [67145],
    'laser_retinal':            [67210, 67228],
    'laser_choroidal':          [67220]
}

categories_with_volume = COUNT of keys WHERE
    SUM(total_services) for ANY code in that category > 0

metric = categories_with_volume  -- integer 0-8
```

ASRS/AAO standard: A comprehensive retina specialist should be capable of vitrectomy, membrane surgery, retinal detachment repair (multiple approaches), and laser. Expected: 4-6 categories for a full-spectrum retina surgeon. Medical-only retina specialists (injection-focused) may have 1-2 categories (laser only).

Score: `(categories_with_volume / 6) * 100`, capped at 100.

Note: Not all retina specialists are surgical. Some focus exclusively on medical retina (injections + imaging). A low surgical breadth is not a quality deficiency if the provider has high injection and imaging scores. This is captured in the composite weighting.


**Measure 3B: Laser Utilization Rate**

What it answers: Does this provider use laser photocoagulation as part of their treatment arsenal?

```
laser_services = SUM(total_services) WHERE hcpcs_code IN [67210, 67220, 67228]
total_procedure_services = injection_services + laser_services +
    SUM(total_services) WHERE hcpcs_code IN [67036-67043, 67108, 67113]

metric_binary = 1 IF laser_services > 0 ELSE 0
metric_rate = laser_services / total_procedure_services  (if total > 0)
```

ASRS/AAO standard: Although anti-VEGF has largely replaced laser for macular edema, PRP remains standard for proliferative diabetic retinopathy, and focal laser has a role in select cases. A retina specialist with zero laser volume is not necessarily wrong (pure AMD practice) but a moderate laser presence alongside injection volume suggests appropriate multi-modal treatment.

Score: Binary (30%) + rate percentile (70%).


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.60) + (measure_3b * 0.40)
```


---

### Composite Score

```
composite = (domain_1 * 0.45) + (domain_2 * 0.30) + (domain_3 * 0.25)
```

Range: 0 to 100.

**Minimum data requirement:** A provider must have scores in at least 2 of 3 domains. If only 1 domain is scorable, output: "insufficient data."

**If a domain is missing:** Redistribute weight proportionally. Example: if Domain 3 is missing (medical-only retina specialist, no surgical or laser data), the composite becomes `(domain_1 * 0.60) + (domain_2 * 0.40)`.

**Medical vs. Surgical retina handling:** Some retina specialists are medical-only (injections + imaging, no surgery). This is a legitimate practice pattern. When Domain 3 is redistributed, these providers are scored on what they actually do, not penalized for not operating.


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
| taxonomy_code | string | From NPPES (207W00000X for most) |
| retina_classification | string | "injection_based", "surgical_based", or "both" — how this NPI was identified as retina |
| is_medical_only | boolean | True if no surgical procedure codes billed |
| geo_group_level | string | "state", "national", or "zip3" |
| percentile_cohort_state | string | State of peer cohort (or "US") |
| percentile_cohort_size | int | Number of retina peers in cohort |
| total_beneficiaries | int | Estimated total unique patients |
| total_services | int | Total claim lines across all codes |
| injection_volume | int | Total 67028 services |
| injection_per_beneficiary | float | Measure 1A metric |
| anti_vegf_agent_breadth | int | Measure 1B metric (0-5) |
| injection_to_exam_ratio | float | Measure 1C metric |
| domain_1_score | float | Anti-VEGF Treatment Patterns (0-100) |
| oct_volume | int | Total 92134 services |
| oct_to_injection_ratio | float | Measure 2A metric |
| imaging_modality_breadth | int | Measure 2B metric (0-6) |
| oct_per_beneficiary | float | Measure 2C metric |
| domain_2_score | float | Diagnostic Imaging (0-100) |
| surgical_breadth | int | Measure 3A metric (0-8) |
| laser_binary | boolean | Whether any laser codes billed |
| laser_rate | float | Measure 3B metric |
| domain_3_score | float | Surgical & Laser Patterns (0-100) |
| composite_score | float | Weighted composite (0-100), null if insufficient |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |
| scorable_domains | int | Number of domains with enough data to score (0-3) |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing volume as a proxy for clinical practice quality. This is real data from credible sources, but it does not directly measure the thing ASRS/AAO is asking for (e.g., "was OCT performed before each injection decision?" vs. "does this provider bill OCT at a rate consistent with monitoring most injection patients").


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **MA APCD (All-Payer Claims Database)** | $5-7K, 2-4 weeks | Patient-level claims with diagnosis codes + Rx data across ALL payers. Links injections to specific retinal conditions. | +14 guidelines. Unlocks: condition-specific injection appropriateness, treatment course analysis (injection intervals), follow-up compliance, post-surgical visit patterns, complication detection. |
| **IRIS Registry (AAO Intelligent Research in Sight)** | Restricted, requires AAO participation | EHR-derived quality measures for ophthalmology. Visual acuity outcomes, imaging results linked to treatment. | +8 guidelines. Unlocks: outcome-based quality (visual acuity change), imaging-guided treatment validation, complete surgical outcome tracking. |
| **Medicare Part B Drug Spending Data** | Free (CMS) | Provider-level drug spending for Part B drugs including anti-VEGF. More detail on which drugs and at what cost. | +0 new guidelines, but strengthens drug breadth analysis and identifies biosimilar adoption patterns. |
| **ASC Quality Reporting Data** | Free (CMS) | Quality measures for ambulatory surgery centers where retina surgeries are performed. | +3 guidelines. Unlocks: surgical setting quality, infection rates, complication tracking at facility level. |

### Unlock Path

| Stage | Data | Guidelines Scorable | Composite Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Spending + NPPES | 9 of 31 | 3 of 5 domains (partial) |
| +MA APCD ($5-7K) | Add all-payer patient-level claims with dx | 23 of 31 | 5 of 5 domains |
| +IRIS Registry (restricted) | Add EHR-derived outcomes | 28 of 31 | 5 of 5 domains (near-complete) |
| Full (all above) | Everything | 28 of 31 | 3 remaining require surgical outcome registries |


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring utilization patterns, not clinical quality.** Injection volume per beneficiary does not tell us whether each injection was appropriate. A provider with high injection volume could be treating active disease correctly or over-treating stable disease. Without diagnosis codes, we cannot distinguish these.

**Retina specialist identification is procedure-based, not taxonomy-based.** The ≥50 injection threshold is an approximation. Some comprehensive ophthalmologists perform a moderate number of injections without being retina specialists. Some retina specialists in their first year of practice may not yet meet the threshold. Validation against known retina rosters is essential.

**J-code billing for drugs varies by practice setting.** Hospital-based retina specialists may have their drug codes billed under the facility, not their personal NPI. This affects drug breadth analysis (Measure 1B). Office-based practices will show complete drug billing under the physician NPI.

**Surgical volume is undercounted for hospital-based surgeons.** Similar to the drug issue, surgical procedures performed in hospital ORs may be billed under facility NPIs. This biases against hospital-employed retina surgeons and toward those in ASCs or office-based settings.

**No patient-level treatment courses.** We cannot tell if a patient received 8 injections in 12 months (appropriate for active AMD) or 2 injections in 12 months (possible undertreatment). We see provider totals, not per-patient trajectories.

**Medicaid file has no diagnosis codes.** The Medicaid retina population (younger diabetics, ROP, trauma) cannot be analyzed by condition.

**The 9 of 31 scorable guidelines represent a partial view.** The composite is a utilization profile, not a comprehensive quality assessment. We are transparent about this limitation.

**OCT-to-injection ratio has legitimate variation.** A provider using a treat-and-extend protocol with OCT at every visit will have a ratio near 1.0. A provider doing injection-only visits between OCT monitoring visits may have a ratio of 0.5-0.7. Both can be guideline-concordant depending on the protocol.


---


## Appendix: CMS/AAO Quality Measure Crosswalk

| Measure ID | Measure Name | Scorable Now? | What's Missing |
|---|---|---|---|
| IRIS-1 | Dilated Macular Examination | No | Requires exam documentation, not a billing code |
| IRIS-2 | Anti-VEGF Treatment for AMD | Partial (injection volume) | Diagnosis linkage needed to confirm AMD indication |
| IRIS-12 | OCT Monitoring for AMD | Partial (OCT-to-injection ratio) | Cannot confirm OCT was for AMD specifically |
| AAO PPP-AMD | Complete AMD Evaluation | No | Requires diagnosis + multiple exam elements |
| AAO PPP-DR | Diabetic Retinopathy Management | Partial (injection + laser volume) | Cannot separate DR from AMD injections |
| AAO PPP-RVO | RVO Treatment | Partial (injection volume) | Cannot identify RVO-specific treatment |
| AAO PPP-RD | Retinal Detachment Repair | Partial (surgical breadth) | Cannot measure timing or outcomes |
| MIPS 14 | AMD: Dilated Macular Exam | No | Requires diagnosis code + exam documentation |
| MIPS 19 | Diabetic Retinopathy: Communication with PCP | No | Cannot measure care coordination from claims |
| MIPS 141 | Primary Open Angle Glaucoma: Optic Nerve Eval | No | Not retina-specific, requires diagnosis |
