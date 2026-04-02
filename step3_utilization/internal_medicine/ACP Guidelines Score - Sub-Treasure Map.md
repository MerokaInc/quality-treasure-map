# Internal Medicine Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what an internist actually did: every office visit, every wellness exam, every screening code, every care management service. ACP (American College of Physicians) clinical guidelines and USPSTF preventive care recommendations tell you what that internist should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.

**The fundamental problem with internal medicine:** Internal medicine quality is defined by medical management. Did the internist control this patient's diabetes? Did they titrate the antihypertensive? Did they prescribe statins for the right patients? Did they avoid unnecessary antibiotics? Every one of those questions requires prescription data, diagnosis codes, or patient-level lab results. We have none of those. We are left scoring the structure of preventive care, not the substance of chronic disease management. This document is honest about that.

Out of approximately 80 ACP and USPSTF recommendations relevant to general internal medicine, we can score about 8 from free CMS data. Those 8 cluster around preventive care delivery and care infrastructure. The other 72 require data we do not have. What we can measure still tells a meaningful story: an internist who delivers annual wellness visits, screens for depression, vaccinates, manages chronic care, and maintains in-office diagnostic capability is practicing differently from one who only sees patients when they are sick. But we cannot tell you who is a better doctor. We can only tell you who has a more complete preventive care structure.


---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---


## 1. The Free Data We Have Right Now

We have access to two provider-level claims datasets from CMS, plus a provider registry. No paywalls, no data use agreements.


### Dataset 1: CMS Medicare Physician & Other Practitioners

Source: https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners

What's in it:

| Field | What It Tells Us |
|---|---|
| NPI | Which provider performed the service |
| HCPCS/CPT code | What they did |
| Number of services | How many times they did it |
| Number of beneficiaries | How many unique patients |
| Place of service | Office, facility, etc. |
| Average Medicare payment | What Medicare paid per service |
| Beneficiary demographics | Age, sex, race, chronic conditions (aggregated) |
| Provider specialty | Taxonomy-derived specialty (Internal Medicine = 207R00000X) |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The internal medicine reality:** Medicare is where the internal medicine signal lives. The typical general internist's panel skews heavily toward adults 50+ and Medicare covers adults 65+. Internal medicine is primary care for adults, and Medicare beneficiaries are the core patient population. The Medicare file will have high volume for most general internists. This file is our primary data source.

**The E/M dominance factor:** Unlike procedural specialties (urology, dermatology), internal medicine billing is overwhelmingly E/M visits. Office visits (99202-99215), preventive visits (99385-99397), and care management codes (99490) make up the vast majority of an internist's claims. Procedures are rare. This means the signal we are looking for is not "what procedures does this provider do?" but rather "beyond office visits, what preventive and management infrastructure does this provider invest in?"


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. Supplementary for internal medicine.

| Field | What It Tells Us |
|---|---|
| NPI (billing provider) | Who billed for the service |
| NPI (servicing provider) | Who performed the service |
| HCPCS procedure code | What they did |
| Month/year | When (2018-2024) |
| Beneficiary count | How many unique patients for that procedure in that month |
| Claim count | How many claims |
| Total spending | Dollars paid |

Covers both fee-for-service AND managed care Medicaid claims.

**What it does NOT have:**

| Missing Field | What We Lose |
|---|---|
| ICD-10 diagnosis codes | Cannot link visits to clinical reasons. Cannot tell if an E/M visit was for diabetes management vs. acute URI. |
| NDC drug codes | Cannot see prescriptions. No metformin for diabetes, no lisinopril for hypertension, no statin prescribing, no antibiotic stewardship. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track readmissions or care transitions. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual patient care over time. |
| Lab results | No A1c values, no lipid panels, no blood pressure readings. Cannot measure disease control. |

**Internal medicine relevance:** Medicaid covers a younger, lower-income adult population. Some internal medicine volume exists in Medicaid (chronic disease management in younger adults, preventive care for Medicaid-eligible populations), but it is thin compared to Medicare. The Medicaid file is supplementary, not primary, for internal medicine.

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every internist by NPI, taxonomy code (207R00000X = Internal Medicine), practice address, and organizational affiliation. Free, always available. This is how we build the provider roster.

Subspecialty taxonomy codes to flag and **exclude** from general internal medicine scoring:

| Taxonomy Code | Subspecialty | Why Exclude |
|---|---|---|
| 207RC0000X | Cardiovascular Disease (Cardiology) | Completely different code profile: echos, stress tests, catheterizations |
| 207RE0101X | Endocrinology, Diabetes & Metabolism | Narrow disease focus, different visit mix |
| 207RG0100X | Gastroenterology | Procedure-heavy: colonoscopies, EGDs |
| 207RG0300X | Geriatric Medicine | Overlapping but different emphasis and patient acuity |
| 207RH0003X | Hematology & Oncology | Chemotherapy administration, infusions |
| 207RI0200X | Infectious Disease | Consultation-heavy, narrow disease scope |
| 207RN0300X | Nephrology | Dialysis management, different patient population |
| 207RP1001X | Pulmonary Disease | PFTs, bronchoscopy, critical care overlap |
| 207RR0500X | Rheumatology | Infusion therapy, narrow disease focus |
| 207RC0200X | Critical Care Medicine | ICU-based, completely different billing pattern |
| 207RH0000X | Hematology | Narrow disease focus |
| 207RX0202X | Medical Oncology | Chemotherapy, infusion codes |
| 207RS0010X | Sports Medicine | Musculoskeletal focus, younger population |
| 207RS0012X | Sleep Medicine | Sleep studies, narrow scope |

**The exclusion rule is simple:** if the taxonomy code is not **exactly** 207R00000X, exclude it from the general internal medicine scoring cohort. The list above covers the most common subspecialties so data engineers know what to expect, but any deviation from 207R00000X is excluded. Internal medicine has more subspecialties than any other base specialty, which makes this filtering step critical.


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given internist:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what services they provide) | Why they provided them (no diagnosis codes) |
| How often they bill each code (volume) | What they prescribed (no Rx data) |
| How many patients they see per service type | Individual patient timelines or sequences |
| Whether they bill preventive visit codes (wellness exams, AWVs) | Whether a specific patient received all recommended preventive services |
| Whether they bill screening codes (depression, health risk assessment) | Whether screening results led to appropriate follow-up |
| Whether they bill care management codes (CCM) | Whether chronic diseases are actually being managed well |
| Whether they perform in-office diagnostics (ECG, urinalysis, phlebotomy) | Lab values, test results, or clinical outcomes |
| Their practice location (NPPES) | How outcomes compare across their patient panel |


## 2. What the Codes Tell Us (Analysis on Available Data Only)

Every HCPCS code in the claims files is a fact about what happened. Here is what we can extract from the free data, organized by the quality signals they reveal.

**Critical framing:** In a procedural specialty, we look for whether the provider does the right procedures at the right rates. In internal medicine, we look for whether the provider invests in the infrastructure of good primary care beyond just seeing sick patients. The codes that matter are not surgical codes. They are preventive visit codes, screening codes, care management codes, and in-office diagnostic codes.


### Preventive/Wellness Visits: Does This Internist Prioritize Preventive Care?

| Code | Description | Visible In |
|---|---|---|
| 99385-99387 | Preventive visit, new patient (18-39, 40-64, 65+) | Medicare + Medicaid |
| 99395-99397 | Preventive visit, established patient (18-39, 40-64, 65+) | Medicare + Medicaid |
| G0438 | Initial Annual Wellness Visit (AWV), Medicare | Medicare |
| G0439 | Subsequent Annual Wellness Visit (AWV), Medicare | Medicare |

**What we can measure:** Whether an internist bills preventive/wellness visit codes and at what rate relative to their total E/M volume. A preventive visit is a structured encounter focused on health maintenance, screening, and counseling, not a response to a specific complaint.

**What we cannot measure:** Whether the content of the preventive visit was actually comprehensive (whether all USPSTF-recommended screenings were discussed and ordered). The code tells us the visit happened, not what happened during it.

**What ACP/USPSTF says should happen:** USPSTF recommends periodic health assessments with evidence-based screening and counseling tailored to age, sex, and risk factors. ACP supports the annual wellness visit structure as the delivery mechanism for preventive care in adults. An internist who never bills preventive visits is seeing patients only when they are sick, which means preventive screening is either not happening or is being squeezed into acute visit time.

**How we score it:** Ratio of preventive visit services (99385-99397, G0438, G0439) to total E/M services. Percentile ranked against peer cohort.


### Depression Screening: Does This Internist Screen for a Common, Treatable Condition?

| Code | Description | Visible In |
|---|---|---|
| 96127 | Brief emotional/behavioral assessment (e.g., PHQ-2/PHQ-9) | Medicare + Medicaid |
| G0444 | Annual depression screening, Medicare | Medicare |

**What we can measure:** Whether an internist bills depression screening codes and at what rate relative to their patient panel. Depression affects roughly 7-8% of US adults and is higher in Medicare populations with chronic disease. Screening is a 2-minute validated instrument (PHQ-2) that can be administered by staff before the provider even enters the room.

**What we cannot measure:** Whether positive screens led to treatment (we have no Rx data for antidepressants, no referral data for behavioral health).

**What USPSTF says should happen:** USPSTF recommends screening for depression in the general adult population when adequate systems are in place. This is a Grade B recommendation. ACP endorses depression screening as part of comprehensive primary care. An internist who never screens for depression is missing a high-prevalence, treatable condition that compounds every chronic disease they manage.

**How we score it:** Two components. Binary: does the provider bill 96127 or G0444 at all? (0 or 100). Rate: ratio of screening services to total unique beneficiaries, percentile ranked among peers who bill it. Combined: (binary * 0.30) + (rate_percentile * 0.70). A provider who never screens gets 0. A provider who screens occasionally gets partial credit.


### Immunization Practice: Does This Internist Vaccinate?

| Code | Description | Visible In |
|---|---|---|
| 90471 | Immunization administration | Medicare + Medicaid |
| 90686 | Influenza vaccine (quadrivalent) | Medicare + Medicaid |

**What we can measure:** Whether an internist bills immunization codes and at what volume relative to their patient panel. Influenza vaccination is the most common vaccine delivered by internists. Administration codes (90471) capture all in-office vaccination events.

**What we cannot measure:** Whether all eligible patients received recommended vaccines, whether vaccine type was appropriate for the patient, or whether the patient was up to date on the full immunization schedule (pneumococcal, shingles, Tdap, etc.).

**What ACP/USPSTF says should happen:** USPSTF recommends annual influenza vaccination for all adults. ACP supports immunization as a core primary care responsibility. Pneumococcal vaccination is recommended for adults 65+ and those with chronic conditions. An internist with a large Medicare panel who never bills immunization codes is either not vaccinating (a gap) or referring all vaccinations to pharmacies (a workflow choice, not a quality failure, but still a loss of the in-office touchpoint).

**How we score it:** Ratio of immunization services (90471 + 90686) to total unique beneficiaries, percentile ranked against peer cohort.

Caveat: Many patients now receive flu shots at pharmacies, not at their doctor's office. An internist who encourages pharmacy vaccination but does not administer vaccines in-office will score lower here. Known limitation.


### Chronic Care Management: Does This Internist Invest in Between-Visit Care?

| Code | Description | Visible In |
|---|---|---|
| 99490 | Chronic care management, 20+ minutes/month | Medicare + Medicaid |

**What we can measure:** Whether an internist bills CCM services. CCM (99490) represents at least 20 minutes of clinical staff time per month dedicated to a patient with two or more chronic conditions. This is care coordination, medication reconciliation, follow-up, and communication that happens between office visits.

**What we cannot measure:** Whether the CCM time was well spent or improved outcomes. We also cannot see the underlying chronic conditions being managed (no dx codes).

**What ACP says should happen:** ACP supports the management of multiple chronic conditions as a core competency of internal medicine. Medicare introduced CCM billing specifically to incentivize this work. An internist with a Medicare panel full of patients with diabetes, hypertension, heart failure, and COPD who never bills CCM is either doing the work without billing it (leaving money on the table) or not doing it (a care gap).

**How we score it:** Two components. Binary: does the provider bill 99490 at all? (0 or 100). Rate: ratio of 99490 services to total unique beneficiaries, percentile ranked among peers who bill it. Combined: (binary * 0.40) + (rate_percentile * 0.60). The binary component is weighted higher (0.40 vs. 0.30 for depression screening) because CCM adoption requires practice infrastructure that many practices have not implemented.


### Health Risk Assessment: Does This Internist Systematically Evaluate Patient Risk?

| Code | Description | Visible In |
|---|---|---|
| 96160 | Health risk assessment instrument (e.g., health risk appraisal) | Medicare + Medicaid |

**What we can measure:** Whether an internist bills 96160 during preventive visits. A health risk assessment is a standardized tool (questionnaire, checklist) used to identify patients' health risks and guide counseling. It is often administered at Annual Wellness Visits.

**What we cannot measure:** Which specific tool was used, whether the results were acted on, or whether the assessment identified actionable risks.

**What ACP/USPSTF says should happen:** The Medicare AWV structure includes a health risk assessment as a required component. USPSTF recommendations for screening assume a systematic risk evaluation process. An internist who performs AWVs but never bills a health risk assessment may not be using standardized tools.

**How we score it:** Two components. Binary: does the provider bill 96160 at all? (0 or 100). Rate: ratio of 96160 services to preventive visit services, percentile ranked among peers who bill it. Combined: (binary * 0.30) + (rate_percentile * 0.70).


### In-Office Diagnostics: Does This Internist Have Basic Diagnostic Capability?

| Code | Description | Visible In |
|---|---|---|
| 93000 | Electrocardiogram (ECG), 12-lead | Medicare + Medicaid |
| 81003 | Urinalysis, automated | Medicare + Medicaid |
| 36415 | Venipuncture (blood draw) | Medicare + Medicaid |

**What we can measure:** Whether an internist performs these three basic diagnostic services in-office. ECGs, urinalysis, and blood draws are the minimum diagnostic toolkit for an internal medicine practice managing chronic disease.

**What we cannot measure:** Whether the diagnostic was clinically indicated, or what the results were.

**What ACP says should happen:** Internal medicine practices managing hypertension, diabetes, renal disease, and cardiovascular risk need in-office access to ECGs (cardiac rhythm and ischemia screening), urinalysis (renal function, UTI, diabetes monitoring), and phlebotomy (lab work for chronic disease monitoring). An internist who refers all diagnostics externally creates friction in the patient journey and may reduce the likelihood that tests get done.

**How we score it:** Count of the 3 diagnostic modalities the provider bills (0-3). Score = (modalities_billed / 3) * 100. A provider billing all three scores 100. A provider billing none scores 0.


### Medicare Annual Wellness Visit Adoption: Does This Internist Use Medicare's Preventive Structure?

| Code | Description | Visible In |
|---|---|---|
| G0438 | Initial Annual Wellness Visit (AWV) | Medicare |
| G0439 | Subsequent Annual Wellness Visit (AWV) | Medicare |

**What we can measure:** Whether an internist bills AWV codes and at what rate relative to their Medicare panel. The AWV is a Medicare-specific preventive visit that includes health risk assessment, review of functional ability and safety, depression screening, and creation of a personalized prevention plan.

**What we cannot measure:** Whether the AWV content was complete, whether the prevention plan was followed, or patient outcomes resulting from the visit.

**What CMS/ACP says should happen:** Medicare covers an Initial AWV (G0438) once in a beneficiary's lifetime, and a Subsequent AWV (G0439) every 12 months thereafter. ACP supports the AWV as a high-value preventive care delivery mechanism. An internist with a large Medicare panel who never bills AWVs is leaving a core preventive care tool unused. This is one of the strongest signals available to us: a provider who actively uses AWVs is investing in structured preventive care for their Medicare patients.

**How we score it:** Two components. Binary: does the provider bill G0438 or G0439 at all? (0 or 100). Rate: ratio of AWV services (G0438 + G0439) to total Medicare beneficiaries, percentile ranked among peers who bill AWVs. Combined: (binary * 0.30) + (rate_percentile * 0.70).

**Important:** G0438 and G0439 are Medicare-only codes. They do not exist in Medicaid. This measure is inherently limited to the Medicare population. For an internist whose panel is predominantly Medicaid, this measure will undercount preventive care. The preventive visit codes (99385-99397) in Measure 1A partially compensate by covering all-payer preventive visits.


### Age-Group Breadth: Does This Internist Serve the Full Adult Spectrum?

Internal medicine covers adults 18+. Some internists serve a broad age range (young adults through elderly), while others serve primarily Medicare-age patients. A practice that delivers preventive visits across all adult age groups is more likely to be functioning as comprehensive primary care.

**What we can measure:** Whether the internist bills preventive visit codes across the three adult age bands:
- 18-39 (codes 99385, 99395)
- 40-64 (codes 99386, 99396)
- 65+ (codes 99387, 99397, G0438, G0439)

**How we score it:** Count of age groups with at least one preventive visit billed. Score = (age_groups_served / 3) * 100. A provider with preventive visits in all three age groups scores 100. A provider with preventive visits in only the 65+ group scores 33.

Caveat: Some internists legitimately serve only Medicare-age patients. A practice near a retirement community may have no patients under 65. Scoring 33 is not a quality failure in that case. It is a limitation of using age-group breadth as a proxy for comprehensive care. The 20% weight keeps this from dominating the domain.


## 3. What We Can and Cannot Score (Honest Assessment)

Out of the 3 scoring domains and approximately 80 ACP/USPSTF recommendations relevant to general internal medicine, here is what is scorable with the free CMS data:

| Domain | Weight | Scorable Measures | Not Scorable | Why Not |
|---|---|---|---|---|
| Preventive Care & Screening | 40% | 4 measures (preventive visit ratio, depression screening rate, age-group breadth, immunization practice) | ~30 USPSTF screening/prevention recs | No dx codes to link screenings to indications, no Rx for preventive medications, no lab results for screening outcomes, cancer screenings billed by imaging/GI facilities |
| Chronic Disease Management Signals | 35% | 3 measures (CCM adoption, health risk assessment, visit complexity appropriateness) | ~35 ACP chronic disease recs | No Rx data for medication management, no dx codes for disease identification, no A1c/BP/lipid values, no patient-level timelines |
| Comprehensive Care | 25% | 2 measures (in-office diagnostic capability, Medicare AWV adoption) | ~7 ACP comprehensive care recs | Limited to structural indicators, no outcome measurement |
| **Total** | | **9 measures mapping to ~8 of ~80 ACP/USPSTF recommendations** | **~72** | |

**This is the most important paragraph in this document.** Internal medicine quality is defined by chronic disease management. The top causes of morbidity and mortality in an internist's panel are diabetes, hypertension, hyperlipidemia, heart failure, COPD, chronic kidney disease, and depression. Managing these conditions requires the right medications at the right doses, titrated over time, monitored by lab values, adjusted based on patient response. We cannot see any of that. No prescriptions. No diagnosis codes. No lab results. No patient timelines. We are scoring the waiting room, not the exam room. The 9 measures we can score are real and meaningful, but they are the structural shell around the thing that actually matters.

An internist who scores 90 on this composite has a strong preventive care infrastructure: they do wellness visits, screen for depression, vaccinate, manage chronic care, and use in-office diagnostics. That is genuinely better than an internist who scores 30. But we cannot tell you whether the internist who scores 90 is actually controlling their diabetics' A1c, managing their hypertensives' blood pressure, or prescribing statins appropriately. That requires data we do not have.


### What's Not Scorable and Why

| ACP/USPSTF Guideline Area | Why Not Scorable from Free CMS Data |
|---|---|
| Diabetes management (A1c control, metformin first-line, annual eye/foot exams) | No Rx data. No dx codes to identify diabetics. No A1c lab values. Eye exams billed by ophthalmology, foot exams not separately coded. |
| Hypertension management (BP targets, medication titration, lifestyle counseling) | No Rx data. No dx codes to identify hypertensives. No blood pressure values in claims data. |
| Statin prescribing (ASCVD risk, appropriate initiation, LDL targets) | No Rx data. No dx codes. No lipid panel results. |
| Cancer screening completion (colonoscopy, mammography, lung CT, cervical) | Screening procedures billed by imaging facilities, GI practices, or gynecologists, not by the internist who ordered them. We see the order was not placed by IM, we just see the referral endpoint. |
| Antibiotic stewardship (appropriate prescribing for URI, UTI, sinusitis) | No Rx data. No dx codes. Cannot link antibiotic choice to clinical indication. |
| Tobacco cessation counseling (assess, advise, assist) | Counseling codes (99406, 99407) exist but are rarely billed. Most cessation counseling happens within an E/M visit without separate billing. |
| Obesity management (BMI documentation, counseling, referral) | No dx codes. No documentation data. BMI not captured in claims. |
| Osteoporosis screening and treatment (DEXA scan, bisphosphonates) | DEXA billed by imaging facility. No Rx data for bisphosphonates. |
| Falls prevention in elderly (assessment, intervention) | No standardized billing code. Falls assessment is part of the AWV but not separately identifiable. |
| Advance care planning (goals of care, healthcare proxy) | 99497 exists but is rarely billed. Cannot measure documentation quality. |
| Opioid prescribing patterns (appropriate use, tapering, PDMP checking) | No Rx data. Cannot see prescriptions at all. |
| Hepatitis C screening (one-time for adults born 1945-1965, now expanded to all adults) | Lab-billed. The internist orders it, but the lab bills the test code. |
| HIV screening (one-time for adults 15-65) | Same as HepC. Lab-billed, not attributed to the internist. |
| Alcohol misuse screening and counseling | No standardized code widely billed. AUDIT-C is typically administered within an E/M visit. |


## 4. Business Logic: How We Compare What They Did vs. What ACP/USPSTF Says

For a given NPI, here is exactly how we compute each measure. Every calculation uses only the free CMS data described in Section 1.


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code = '207R00000X' (Internal Medicine, general). Exact match only. Exclude every other taxonomy code under the 207R umbrella: 207RC0000X (Cardiovascular), 207RE0101X (Endocrinology), 207RG0100X (GI), 207RG0300X (Geriatrics), 207RH0003X (Hem/Onc), 207RI0200X (ID), 207RN0300X (Nephrology), 207RP1001X (Pulmonary), 207RR0500X (Rheumatology), 207RC0200X (Critical Care), 207RH0000X (Hematology), 207RX0202X (Medical Oncology), 207RS0010X (Sports Medicine), 207RS0012X (Sleep Medicine), and any other non-207R00000X code.
**Filter by state:** provider_state = target state (e.g., 'MA')
**Filter by entity:** Entity Type 1 (Individual NPI). Excludes organizational NPIs.
**Output:** A table of general internal medicine NPIs with practice address, entity type, and taxonomy.

This is the denominator. Every NPI in this roster gets scored.


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners (primary) + Medicaid Provider Spending (supplementary)
**Join:** On NPI (npi in Medicare, servicing_npi in Medicaid)
**Aggregate:** Sum across the measurement year (e.g., 2023) to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (service/claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes. Medicare and Medicaid claims are additive. In practice, Medicare will dominate for most general internists.


### Geographic Grouping for Percentile Scoring

Several measures use percentile ranking ("rank this provider against all other internists"). The peer cohort for percentile scoring is grouped by geography:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All general IM NPIs (taxonomy 207R00000X, >= 100 total Medicare services) in the same state | Primary scoring. An internist in MA is ranked against MA peers. |
| **National** (fallback) | All qualifying general IM NPIs across all states | When state cohort has < 30 providers. Also useful for cross-state benchmarking. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | Urban vs. rural comparison. Not implemented now, but the output schema carries the fields to support it later. |

The peer cohort used for percentile ranks directly affects scores. An internist at the 80th percentile in a high-performing state might be at the 60th nationally. The output records which cohort was used.

**Peer Cohort Definition:**

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207R00000X (Internal Medicine, general) exact match | Excludes subspecialists, other specialties |
| State | Same state as the provider being scored | Practice patterns vary by state |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort percentiles |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

For a typical state, this should yield roughly 1,000-5,000 active general internists. Internal medicine is one of the largest specialties, much larger than urology or dermatology. Large cohort sizes mean percentile ranks will be stable and meaningful.


---

### DOMAIN 1: Preventive Care & Screening (Weight: 40%)


**Measure 1A: Preventive/Wellness Visit Ratio**

What it answers: How much of this internist's practice is dedicated to structured preventive care vs. sick visits?

```
preventive_codes = [99385, 99386, 99387,   -- new patient preventive (18-39, 40-64, 65+)
                    99395, 99396, 99397,   -- established patient preventive (18-39, 40-64, 65+)
                    G0438, G0439]          -- Medicare AWV (initial, subsequent)

preventive_services = SUM(total_services) WHERE hcpcs_code IN preventive_codes

em_codes = [99202, 99203, 99204, 99205,   -- new patient E/M
            99211, 99212, 99213, 99214, 99215]  -- established patient E/M

total_em_services = SUM(total_services) WHERE hcpcs_code IN em_codes

metric = preventive_services / total_em_services
```

ACP/USPSTF standard: Preventive visits are the delivery mechanism for evidence-based screening and counseling. USPSTF recommends periodic health assessments for all adults. ACP supports the AWV as a high-value encounter. An internist whose entire practice is sick visits (metric near 0) is not delivering structured preventive care. An internist with a healthy ratio of preventive visits (metric 0.15-0.40) is investing time in keeping patients well, not just treating disease.

Score: Percentile rank of `metric` among all general IM NPIs in the state. 90th percentile = score of 90.

Weight within domain: **0.35**

Edge cases:
- If `total_em_services` = 0, no E/M visit data. Mark as insufficient.
- If `total_em_services` < 10, insufficient volume. Mark as insufficient.
- A very high ratio (> 0.50) may indicate a concierge or executive health practice. Not a quality problem, but unusual. Do not cap.


**Measure 1B: Depression Screening Rate**

What it answers: Does this internist screen for depression?

```
depression_screening_services = SUM(total_services) WHERE hcpcs_code IN (96127, G0444)
total_beneficiaries = MAX(total_beneficiaries) across all HCPCS codes for this NPI
    (or from the "By Provider" Medicare file)

metric_binary = 1 IF depression_screening_services > 0 ELSE 0
metric_rate = depression_screening_services / total_beneficiaries (if > 0)
```

USPSTF standard: Grade B recommendation for depression screening in the general adult population. Depression is under-diagnosed and under-treated. Screening with a validated instrument (PHQ-2, PHQ-9) takes 2 minutes and can be administered by staff. An internist who never bills a depression screening code is likely not systematically screening.

Score: Two components.
- Binary: does the provider bill 96127 or G0444? (0 or 100)
- Rate: percentile rank of `metric_rate` among peers who DO bill screening codes.
- Combined: `(binary * 0.30) + (rate_percentile * 0.70)`.

A provider who never screens gets 0. A provider who screens occasionally gets partial credit. A provider who screens a high proportion of their panel ranks highly.

Weight within domain: **0.25**

Edge cases:
- If the provider bills neither 96127 nor G0444, score = 0 for this measure.
- 96127 is more commonly billed than G0444. Accept either.


**Measure 1C: Age-Group Breadth**

What it answers: Does this internist deliver preventive care across the full adult age spectrum?

```
age_group_18_39 = SUM(total_services) WHERE hcpcs_code IN (99385, 99395) > 0
age_group_40_64 = SUM(total_services) WHERE hcpcs_code IN (99386, 99396) > 0
age_group_65_plus = SUM(total_services) WHERE hcpcs_code IN (99387, 99397, G0438, G0439) > 0

age_groups_served = COUNT of [age_group_18_39, age_group_40_64, age_group_65_plus] that are TRUE

metric = age_groups_served  -- integer 0-3
```

ACP/USPSTF standard: Internal medicine covers adults 18+. USPSTF screening recommendations are age-stratified (different recommendations for 18-39, 40-64, 65+). An internist serving all three age groups is more likely to be practicing comprehensive primary care. An internist serving only one age group may be functioning as a geriatrician (65+ only) or a subspecialist-in-disguise.

Score: `(age_groups_served / 3) * 100`. Provider serving all three groups scores 100.

Weight within domain: **0.20**

Edge cases:
- A provider serving only Medicare-age patients (65+ only) scores 33. This is not inherently a quality problem, it may reflect the practice's patient demographics. The 20% weight keeps this from dominating.
- If a provider bills no preventive visit codes at all, `age_groups_served` = 0. Score = 0.


**Measure 1D: Immunization Practice**

What it answers: Does this internist vaccinate patients in-office?

```
immunization_services = SUM(total_services) WHERE hcpcs_code IN (90471, 90686)
total_beneficiaries = (same as 1B)

metric = immunization_services / total_beneficiaries
```

ACP/USPSTF standard: USPSTF recommends annual influenza vaccination for all adults. CDC/ACIP recommends pneumococcal and shingles vaccination for adults 65+ and those with chronic conditions. ACP supports in-office immunization as a core primary care function. An internist with a large panel who never vaccinates is either referring all immunizations to pharmacies (a workflow choice) or not ensuring patients are vaccinated (a care gap).

Score: Percentile rank of `metric` among peers.

Weight within domain: **0.20**

Edge cases:
- Pharmacy vaccination is increasingly common and will suppress this measure for many internists. Known limitation.
- Some practices have separate staff who bill under the practice NPI, not the individual provider NPI. This could undercount for Type 1 (individual) NPIs. Known limitation.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.35) + (measure_1b * 0.25) + (measure_1c * 0.20) + (measure_1d * 0.20)
```


---

### DOMAIN 2: Chronic Disease Management Signals (Weight: 35%)


**Measure 2A: CCM Adoption**

What it answers: Does this internist invest in between-visit care management for patients with multiple chronic conditions?

```
ccm_services = SUM(total_services) WHERE hcpcs_code = 99490
total_beneficiaries = (same as before)

metric_binary = 1 IF ccm_services > 0 ELSE 0
metric_rate = ccm_services / total_beneficiaries (if > 0)
```

ACP standard: ACP supports comprehensive chronic disease management as a core competency. Medicare created CCM billing (99490) to incentivize care coordination for patients with 2+ chronic conditions. The typical Medicare internal medicine panel has a high prevalence of multi-morbidity (diabetes + hypertension + hyperlipidemia is common). An internist who never bills CCM is either doing the work without billing it (a revenue problem) or not doing it (a care gap).

Score: Two components.
- Binary: does the provider bill 99490? (0 or 100)
- Rate: percentile rank of `metric_rate` among peers who DO bill CCM.
- Combined: `(binary * 0.40) + (rate_percentile * 0.60)`.

The binary component has a higher weight (0.40) than other binary measures because CCM adoption requires deliberate practice infrastructure (dedicated staff time, care plans, patient consent). Billing it at all is a meaningful signal that the practice has invested in chronic care infrastructure.

Weight within domain: **0.35**

Edge cases:
- As of 2023, CCM adoption among internists was growing but still not universal. A provider who does not bill CCM is not unusual, but it is a missed opportunity.
- If a practice uses 99491 (CCM by physician, 30+ minutes) instead of 99490, we should include it. For now, 99490 is the primary code; 99491 can be added.


**Measure 2B: Health Risk Assessment**

What it answers: Does this internist use standardized risk assessment tools?

```
hra_services = SUM(total_services) WHERE hcpcs_code = 96160
preventive_services = (same as Measure 1A calculation)

metric_binary = 1 IF hra_services > 0 ELSE 0
metric_rate = hra_services / preventive_services (if preventive_services > 0)
```

ACP/CMS standard: The Medicare AWV requires a health risk assessment as a component. CMS expects that AWVs include a standardized health risk appraisal instrument. An internist who bills AWVs but never bills 96160 may not be using standardized tools or may be bundling the assessment into the AWV code without separate billing. An internist who bills both AWVs and 96160 is documenting the structured risk assessment separately.

Score: Two components.
- Binary: does the provider bill 96160? (0 or 100)
- Rate: percentile rank of `metric_rate` among peers who DO bill 96160.
- Combined: `(binary * 0.30) + (rate_percentile * 0.70)`.

Weight within domain: **0.30**

Edge cases:
- 96160 billing is inconsistent across practices. Some practices include HRA in the AWV without separate billing. A score of 0 here does not definitively mean no risk assessment is happening.
- If `preventive_services` = 0, rate cannot be computed. Use binary only: score = metric_binary * 100 * 0.30.


**Measure 2C: Visit Complexity Appropriateness**

What it answers: Is this internist's E/M complexity distribution within normal range?

```
complex_em_services = SUM(total_services) WHERE hcpcs_code IN (99214, 99215)
total_em_services = SUM(total_services) WHERE hcpcs_code IN
    (99202, 99203, 99204, 99205, 99211, 99212, 99213, 99214, 99215)

metric = complex_em_services / total_em_services
```

ACP standard: ACP does not prescribe an E/M distribution, but clinical logic says this: an internist managing chronic diseases should bill a meaningful proportion of level 4 (99214) and level 5 (99215) visits because chronic disease management is inherently complex. An internist who bills almost entirely 99213 (moderate complexity) for a panel with high chronic disease burden may be under-coding or under-managing. An internist who bills almost entirely 99215 may be over-coding.

Score: This is not a percentile rank. It is a range check.
- Compute the p25 and p75 of `metric` among the peer cohort.
- Also compute p10 and p90.
- Score:
  - If `metric` is between p25 and p75: score = 100 (normal range)
  - If `metric` is between p10 and p25 OR between p75 and p90: score = 70 (mild outlier)
  - If `metric` is below p10 or above p90: score = 50 (significant outlier)

This measure rewards being within the normal distribution. Both extremes (too few complex visits, too many complex visits) are flagged.

Weight within domain: **0.35**

Edge cases:
- If `total_em_services` < 10, insufficient volume. Mark as insufficient.
- A provider who sees only complex patients (e.g., a hospitalist who is miscoded as general IM) will score 50 here. The taxonomy filter should exclude hospitalists, but some may slip through.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.35) + (measure_2b * 0.30) + (measure_2c * 0.35)
```


---

### DOMAIN 3: Comprehensive Care (Weight: 25%)


**Measure 3A: In-Office Diagnostic Capability**

What it answers: Does this internist maintain basic in-office diagnostic capability?

```
diagnostic_modalities = {
    'ecg':          [93000],
    'urinalysis':   [81003],
    'phlebotomy':   [36415]
}

modalities_billed = COUNT of diagnostic_modalities keys WHERE
    SUM(total_services) for ANY code in that modality > 0

metric = modalities_billed  -- integer 0-3
```

ACP standard: An internal medicine practice managing hypertension, diabetes, kidney disease, and cardiovascular risk needs in-office access to ECGs (cardiac evaluation), urinalysis (renal function, UTI, diabetes monitoring), and phlebotomy (blood draws for lab work). A practice with all three modalities can provide point-of-care evaluation without external referrals. A practice with none is operating as a consult-only or telehealth practice.

Score: `(modalities_billed / 3) * 100`. Provider with all 3 modalities scores 100. Provider with 2 scores 67. Provider with 0 scores 0.

Weight within domain: **0.40**

Edge cases:
- Phlebotomy (36415) is very commonly billed. ECG (93000) is common in practices with ECG equipment. Urinalysis (81003) is common in practices with CLIA-waived testing. Missing all three is unusual for a general IM practice and is a signal worth capturing.
- Some practices perform these services but bill under the organizational NPI rather than the individual NPI. Known attribution limitation.


**Measure 3B: Medicare AWV Adoption**

What it answers: Does this internist use Medicare's Annual Wellness Visit structure for their Medicare patients?

```
awv_services = SUM(total_services) WHERE hcpcs_code IN (G0438, G0439)
medicare_beneficiaries = total beneficiaries from Medicare file only

metric_binary = 1 IF awv_services > 0 ELSE 0
metric_rate = awv_services / medicare_beneficiaries (if medicare_beneficiaries > 0)
```

ACP/CMS standard: The AWV is Medicare's primary preventive care encounter. It is designed to provide personalized prevention plans, health risk assessments, and care coordination for Medicare beneficiaries. An internist with a large Medicare panel who never bills AWVs is not using Medicare's core preventive structure. This is one of the clearest signals we have: a provider who bills AWVs is investing in structured preventive care for their Medicare population.

Score: Two components.
- Binary: does the provider bill G0438 or G0439? (0 or 100)
- Rate: percentile rank of `metric_rate` among peers who DO bill AWVs.
- Combined: `(binary * 0.30) + (rate_percentile * 0.70)`.

Weight within domain: **0.60**

Edge cases:
- G0438 (initial) can only be billed once per beneficiary's lifetime. G0439 (subsequent) is annual. For established practices, G0439 will dominate. For new practices or practices with high patient turnover, G0438 may be more common.
- If `medicare_beneficiaries` = 0 (unlikely for general IM), skip this measure.
- If provider is Medicaid-only (rare for general IM), AWV codes will not appear. Mark as insufficient for this measure.


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.40) + (measure_3b * 0.60)
```


---

### Composite Score

```
composite = (domain_1 * 0.40) + (domain_2 * 0.35) + (domain_3 * 0.25)
```

Range: 0 to 100.

**Minimum data requirement:** A provider must have scores in at least 2 of 3 domains to receive a composite. If only 1 domain is scorable, output: "insufficient data."

**If a domain is missing:** Redistribute its weight proportionally. Example: if Domain 2 is missing (provider does not bill CCM, HRA, or have enough E/M volume for complexity analysis), the composite becomes `(domain_1 * 0.62) + (domain_3 * 0.38)`.


---

### Worked Example

Dr. A is a general internist in Massachusetts with a strong preventive care practice. Here is her claims profile for 2023:

| Metric | Raw Value | Score | Notes |
|---|---|---|---|
| Total Medicare beneficiaries | 1,200 | -- | Moderate-volume practice |
| Total E/M services | 4,100 | -- | |
| **Domain 1: Preventive Care & Screening** | | | |
| Preventive visit ratio (preventive/E/M) | 580/4,100 = 0.14 | 68th percentile | Decent preventive volume |
| Depression screening rate (96127/beneficiaries) | 310/1,200 = 0.26, binary = 100 | (100*0.30)+(72nd*0.70) = 80.4 | Screens about a quarter of panel |
| Age-group breadth | 3 of 3 age groups | 100 (fixed) | Preventive visits across all adult ages |
| Immunization rate (90471+90686/beneficiaries) | 280/1,200 = 0.23 | 65th percentile | Moderate in-office vaccination |
| **Domain 1 Score** | (68*0.35)+(80.4*0.25)+(100*0.20)+(65*0.20) | **76.9** | |
| **Domain 2: Chronic Disease Management Signals** | | | |
| CCM adoption (99490/beneficiaries) | 85/1,200 = 0.07, binary = 100 | (100*0.40)+(58th*0.60) = 74.8 | Bills CCM for some patients |
| Health risk assessment (96160/preventive) | 120/580 = 0.21, binary = 100 | (100*0.30)+(66th*0.70) = 76.2 | Uses HRA at preventive visits |
| Visit complexity (99214+99215 / E/M) | 2,870/4,100 = 0.70 | 100 (within p25-p75) | Normal complexity distribution |
| **Domain 2 Score** | (74.8*0.35)+(76.2*0.30)+(100*0.35) | **84.0** | |
| **Domain 3: Comprehensive Care** | | | |
| In-office diagnostic capability | 3 of 3 (ECG, UA, phlebotomy) | 100 (fixed) | Full diagnostic toolkit |
| Medicare AWV adoption (G0438+G0439/Medicare benes) | 420/1,200 = 0.35, binary = 100 | (100*0.30)+(78th*0.70) = 84.6 | Strong AWV adoption |
| **Domain 3 Score** | (100*0.40)+(84.6*0.60) | **90.8** | |
| **Composite** | (76.9*0.40)+(84.0*0.35)+(90.8*0.25) | **82.9** | |

Dr. A scores 82.9. She invests in preventive care, screens for depression, vaccinates, uses CCM, performs health risk assessments, bills AWVs at a strong rate, and has full in-office diagnostic capability. Her billing pattern is consistent with an internist who has built infrastructure around prevention and chronic disease management.

**But here is what we cannot see:** Whether her diabetics have controlled A1c. Whether her hypertensives are at goal. Whether she prescribes statins appropriately. Whether her antibiotic prescribing is responsible. Whether her patients are actually healthier because of her preventive care. We know she does the right structural things. We do not know if she does the right clinical things.

Compare with Dr. B in the same state, a sick-visit-only internist:

| Metric | Raw Value | Score | Notes |
|---|---|---|---|
| Total Medicare beneficiaries | 950 | -- | |
| Total E/M services | 3,600 | -- | |
| Preventive visit ratio | 40/3,600 = 0.01 | 8th percentile | Almost no preventive visits |
| Depression screening rate | 0 services | 0 | Never screens |
| Age-group breadth | 1 of 3 (65+ only) | 33 (fixed) | Only Medicare-age patients get any preventive |
| Immunization rate | 15/950 = 0.02 | 5th percentile | Almost no in-office vaccination |
| **Domain 1 Score** | (8*0.35)+(0*0.25)+(33*0.20)+(5*0.20) | **10.4** | |
| CCM adoption | 0 services | 0 | No CCM billing |
| Health risk assessment | 0 services | 0 | No HRA |
| Visit complexity | 3,100/3,600 = 0.86 | 50 (above p90, high outlier) | Almost all visits coded high complexity |
| **Domain 2 Score** | (0*0.35)+(0*0.30)+(50*0.35) | **17.5** | |
| In-office diagnostic capability | 1 of 3 (phlebotomy only) | 33 (fixed) | No ECG, no urinalysis in-office |
| Medicare AWV adoption | 0 services | 0 | No AWVs |
| **Domain 3 Score** | (33*0.40)+(0*0.60) | **13.2** | |
| **Composite** | (10.4*0.40)+(17.5*0.35)+(13.2*0.25) | **13.6** | |

Dr. B scores 13.6. No preventive visits, no screening, no vaccination, no CCM, no AWVs, and only phlebotomy for in-office diagnostics. The extremely high visit complexity (86% level 4-5) combined with no preventive infrastructure suggests a practice that sees patients only when they are sick, and may be over-coding those visits. This billing pattern is inconsistent with a general internist following ACP/USPSTF recommendations for preventive care.

The 69-point gap between Dr. A and Dr. B is real and meaningful. It captures a genuine difference in practice structure. But it is still only a structural score. Dr. B might be an excellent clinician who manages chronic disease brilliantly within sick visits and simply does not bill preventive codes separately. We cannot know that from claims data.


---

### Output Schema (per NPI)

Following the Step 2 pattern (one row per NPI, structured table, parquet + CSV):

| Column | Type | Description |
|---|---|---|
| **Identity & Geography** | | |
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code (metro/micro area), derived from ZIP |
| taxonomy_code | string | From NPPES |
| is_subspecialist | boolean | True if taxonomy is not 207R00000X |
| **Cohort Context** | | |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used for percentile ranks |
| percentile_cohort_state | string | State of the peer cohort used for percentile scoring (or "US" if national) |
| percentile_cohort_size | int | Number of peers in the cohort |
| **Volume** | | |
| total_beneficiaries | int | Estimated total unique patients |
| total_services | int | Total claim lines across all codes |
| total_em_services | int | Total E/M services (99202-99215) |
| medicare_beneficiaries | int | Medicare-only beneficiary count (for AWV rate calculation) |
| **Domain 1: Preventive Care & Screening** | | |
| preventive_services | int | Count of 99385-99397 + G0438 + G0439 services |
| preventive_visit_ratio | float | Measure 1A metric (preventive / total E/M) |
| preventive_visit_percentile | float | Measure 1A percentile rank |
| depression_screening_services | int | Count of 96127 + G0444 services |
| depression_screening_binary | int | 1 if any screening billed, else 0 |
| depression_screening_rate | float | Measure 1B metric (screening / beneficiaries) |
| depression_screening_score | float | Measure 1B combined score |
| age_groups_served | int | Measure 1C metric (0-3) |
| age_group_breadth_score | float | (age_groups / 3) * 100 |
| immunization_services | int | Count of 90471 + 90686 services |
| immunization_rate | float | Measure 1D metric (immunization / beneficiaries) |
| immunization_percentile | float | Measure 1D percentile rank |
| domain_1_score | float | Preventive Care & Screening domain (0-100) |
| **Domain 2: Chronic Disease Management Signals** | | |
| ccm_services | int | Count of 99490 services |
| ccm_binary | int | 1 if any 99490 billed, else 0 |
| ccm_rate | float | Measure 2A metric (99490 / beneficiaries) |
| ccm_score | float | Measure 2A combined score |
| hra_services | int | Count of 96160 services |
| hra_binary | int | 1 if any 96160 billed, else 0 |
| hra_rate | float | Measure 2B metric (96160 / preventive services) |
| hra_score | float | Measure 2B combined score |
| complex_em_services | int | Count of 99214 + 99215 services |
| visit_complexity_ratio | float | Measure 2C metric (complex E/M / total E/M) |
| visit_complexity_score | float | Measure 2C range-check score |
| domain_2_score | float | Chronic Disease Management Signals domain (0-100) |
| **Domain 3: Comprehensive Care** | | |
| diagnostic_modalities_billed | int | Measure 3A metric (0-3) |
| diagnostic_capability_score | float | (modalities / 3) * 100 |
| awv_services | int | Count of G0438 + G0439 services |
| awv_binary | int | 1 if any AWV billed, else 0 |
| awv_rate | float | Measure 3B metric (AWV / Medicare beneficiaries) |
| awv_score | float | Measure 3B combined score |
| domain_3_score | float | Comprehensive Care domain (0-100) |
| **Composite** | | |
| composite_score | float | Weighted composite (0-100), null if insufficient data |
| scorable_domains | int | Number of domains with enough data to score (0-3) |
| **Confidence** | | |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing patterns as a proxy for clinical practice quality. This is real data from credible sources, but it does not directly measure the thing ACP/USPSTF is asking for (e.g., "did this patient get depression screening and appropriate follow-up treatment?" vs. "does this provider bill depression screening codes at a rate consistent with systematic screening").

For internal medicine specifically, the proxy gap is larger than for procedural specialties. In urology, billing a cystoscopy is a direct signal that cystoscopy happened. In internal medicine, the things that define quality (medication management, disease control, patient education) are mostly invisible in claims data. Billing an AWV tells us the visit happened, not whether the prevention plan was meaningful.


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **MA APCD (All-Payer Claims Database)** | $5-7K, 2-4 weeks | Individual patient-level claims with diagnosis codes AND Rx data across ALL payers. Inpatient + outpatient. The most complete picture possible for MA. | +35-40 guidelines. Unlocks: diabetes management (A1c monitoring, metformin first-line, annual eye/foot exams), hypertension management (medication titration, BP targets), statin prescribing (ASCVD risk stratification), antibiotic stewardship (Rx + dx linkage), cancer screening completion (mammography, colonoscopy referral tracking), chronic disease identification and panel composition. This is the single most transformative dataset for internal medicine scoring. |
| **Medicare Part D Prescriber Data** | Free (CMS) | NPI-level aggregate Rx data for Medicare Part D. Shows which drugs a provider prescribes and in what volume. | +15-20 guidelines. Unlocks: statin prescribing patterns, antihypertensive prescribing, diabetes medication management (metformin, insulin, GLP-1), antibiotic prescribing volume and type, opioid prescribing patterns. Available now but requires separate pipeline. For internal medicine, this is arguably the highest-value free dataset we are not yet using. |
| **HEDIS Measures (via Health Plans)** | Varies (plan-dependent) | Standardized quality measures for diabetes (A1c control), hypertension (BP control), preventive screening rates, medication adherence. | +15-20 guidelines. Directly measures clinical outcomes that claims cannot: A1c < 8%, BP < 140/90, statin adherence, breast cancer screening completion. |
| **EHR Data (Direct or via Registry)** | Varies ($50K-$500K+) | Documentation-level clinical detail. Lab values, vital signs, medication lists, problem lists, clinical notes. | Remaining guidelines. Unlocks: patient-level disease control, individualized care plans, counseling documentation, tobacco cessation intervention, advance care planning, falls prevention assessment, complete medication reconciliation. |
| **Medicaid T-MSIS Full Access** | Restricted (DUA required) | National Medicaid claims at the claim line level. Patient-level, dx codes, Rx data, institutional. | Same as MA APCD for Medicaid population. Adds younger adult chronic disease management, social determinants of health. |


### Unlock Path

| Stage | Data | Guideline Recommendations Scorable | Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Provider Spending + NPPES | ~8 of ~80 | 3 domains, structural/preventive only |
| +Medicare Part D (free, separate pipeline) | Add NPI-level Rx data | ~25 of ~80 | Adds medication prescribing patterns for diabetes, HTN, lipids, antibiotics |
| +MA APCD ($5-7K) | Add all-payer patient-level claims with dx and Rx | ~55 of ~80 | Adds disease identification, condition-specific management, step therapy, screening completion |
| +HEDIS (plan-dependent) | Add standardized outcome measures | ~65 of ~80 | Adds clinical outcome measurement (A1c control, BP control, medication adherence) |
| +EHR (varies) | Add documentation and clinical detail | ~75 of ~80 | Near-complete, adds counseling, documentation quality, patient-reported outcomes |
| Full (all above) | Everything | ~75-80 of ~80 | Remaining 5 require long-term outcome tracking or patient-reported measures |

**The Part D unlock is uniquely important for internal medicine.** For procedural specialties, procedures are the primary signal and they are visible in claims. For internal medicine, medications are the primary therapeutic tool and they are completely invisible without Rx data. Adding Part D data would roughly triple the number of scorable guidelines at zero cost.


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring preventive care structure, not clinical quality.** The free data tells us whether an internist builds preventive infrastructure into their practice: wellness visits, screening, immunization, care management, in-office diagnostics. It does not tell us whether they manage chronic disease effectively, prescribe appropriately, or improve patient outcomes. This is the most significant limitation and it is not fixable with free CMS data.

**No prescription data is devastating for internal medicine.** This is not a minor limitation. It is the central blind spot. Internal medicine is a medication-management specialty. The majority of an internist's clinical impact comes through prescribing: metformin for diabetes, lisinopril for hypertension, atorvastatin for lipids, appropriate antibiotics for infections, avoidance of inappropriate medications in the elderly. We cannot see any of this. An internist who is a brilliant prescriber but does not bill AWV codes will score lower than an internist who bills every preventive code but prescribes poorly. This is a fundamental bias in the score.

**No diagnosis codes means we cannot identify who has what.** We cannot tell how many of an internist's patients have diabetes, hypertension, heart failure, or COPD. Without knowing the disease burden of the panel, we cannot evaluate whether management is appropriate. An internist with 800 diabetics who manages them all well is invisible to us. An internist with 50 diabetics who bills AWVs will score higher.

**Data is aggregated, not patient-level.** We see "Provider X billed G0439 420 times in 2023." We do not see "Patient Y received an AWV, was screened for depression, had immunizations updated, and received a personalized prevention plan." We cannot measure whether a complete preventive care visit happened for a given patient. We can only measure whether the provider bills the component codes in aggregate.

**8 of ~80 ACP/USPSTF recommendations is a partial score.** We are transparent about this. The composite represents a preventive care infrastructure profile, not a comprehensive clinical quality assessment. It answers: "Does this internist's billing pattern suggest they invest in preventive care and care management infrastructure?" It does not answer: "Does this internist deliver high-quality internal medicine across all conditions?"

**Medicare-dominant data is actually good for IM, but has a bias.** Medicare covers adults 65+, which is the core of most general IM panels. The Medicare file will have good volume. But it means the score is mostly about how the internist serves their elderly patients. Younger adult care (chronic disease in 40-64 year olds, preventive care for 18-39 year olds) is underrepresented unless Medicaid volume is available.

**The Medicaid Provider Spending dataset was temporarily unavailable as of late March 2026.** If only Medicare data is available, we can still score most measures. The payer diversity score (separate doc) will be impacted, but the guideline concordance score is primarily Medicare-driven and will be minimally affected.

**G0438 and G0439 are Medicare-only codes.** AWV adoption (Measure 3B) is inherently limited to Medicare. An internist with a predominantly Medicaid panel will appear to have low AWV adoption even if they deliver excellent preventive care through the 99385-99397 codes. Measure 1A (preventive visit ratio) partially compensates, but the AWV signal is Medicare-specific.

**Hospitalist vs. office-based distinction is not clean.** Some hospitalists are coded under general IM taxonomy (207R00000X) rather than the hospitalist taxonomy (208M00000X). A hospitalist's billing pattern (all inpatient E/M, no preventive codes, no screening) will look terrible on this score. The taxonomy filter should exclude hospitalists, but if they are registered under 207R00000X, they will contaminate the cohort and distort percentile ranks. Volume filter (>= 100 Medicare services) and the office-based E/M codes partially mitigate this, but it is not a perfect filter.

**Many subspecialist exclusions increase false negative risk.** We exclude 14 subspecialty taxonomy codes. But some subspecialists register under 207R00000X (general IM) rather than their specific subspecialty code. A cardiologist coded as 207R00000X will score poorly on this score because their billing pattern looks nothing like a general internist's. The taxonomy filter is necessary but imperfect.

**Pharmacy vaccination shifts the immunization signal.** Over the past decade, influenza and other adult vaccines have increasingly moved to pharmacies. An internist who proactively ensures their patients are vaccinated but does not administer vaccines in-office will score lower on Measure 1D. This is a known limitation. The 20% weight within Domain 1 keeps it from dominating.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 7. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **ACP Guidelines Concordance** (this doc) | Does this internist follow ACP/USPSTF recommendations for preventive care? | Clinical quality proxy |
| **Peer Comparison** | Does their billing pattern look like a normal internist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is the practice pattern consistent across Medicare and Medicaid? | Access proxy |
| **Billing Quality** | Are charges, code ratios, and E/M distribution normal? | Pricing + integrity |

Guideline concordance is the most clinically grounded of the five scores. It does not just ask "is this provider normal?" (peer comparison) or "is the volume real?" (volume adequacy). It asks "does this provider do what ACP and USPSTF say they should do?"

Here is what this score catches that the others miss:

| Scenario | Guideline Concordance | Other Scores |
|---|---|---|
| Internist who sees 2,000 patients/year but never does a wellness visit, never screens for depression, never vaccinates | Low (Domain 1 near 0, Domain 3 near 0) | Peer comparison may flag missing codes. Volume adequacy is fine (high volume). Billing quality may look normal for E/M distribution. But only guideline concordance names the clinical implication: this provider is not delivering preventive care. |
| Internist who bills all preventive codes at high rates but no chronic care management and no in-office diagnostics | Moderate (strong Domain 1, weak Domain 2 and 3) | Peer comparison might score high (preventive codes are common). But guideline concordance flags the gap: preventive care without chronic disease management infrastructure is half the job. |
| Internist who bills CCM, AWVs, depression screening, immunizations, and has full in-office diagnostics | High (strong across all domains) | Other scores may also be high (normal peer pattern, adequate volume, clean billing). This is the concordance signal: all five dimensions align for a provider following guidelines. |
| Subspecialist miscoded as general IM (e.g., cardiologist under 207R00000X) | Very low (different code profile entirely) | Peer comparison also catches this. Guideline concordance will show near-zero preventive care scores, which is correct: this provider is not practicing general IM regardless of their taxonomy code. |
| Hospitalist miscoded as general IM | Very low (no preventive, no outpatient) | Peer comparison catches this too. But guideline concordance gives the clinical interpretation: this provider is not delivering outpatient primary care. |


---

# PART E: RISKS AND LIMITATIONS

---

These are repeated from Part C in summary form, plus cross-cutting risks.


## 8. Summary of Limitations

1. **Preventive care structure only, not chronic disease management.** This is the defining limitation for internal medicine. The score measures whether a provider builds preventive care infrastructure. It cannot measure whether they manage diabetes, hypertension, or any other chronic disease effectively. The majority of internal medicine quality is invisible to us.

2. **No prescription data.** Devastating for internal medicine. Medications are the primary therapeutic tool of the internist. We cannot see prescriptions for diabetes, hypertension, lipids, antibiotics, or any other condition. An internist's prescribing quality is completely unmeasured.

3. **No diagnosis codes.** Cannot identify which patients have which conditions. Cannot calculate disease burden. Cannot evaluate whether management intensity matches disease complexity. Cannot distinguish a provider managing a panel of healthy patients from one managing a panel of multi-morbid patients.

4. **Aggregated data.** Cannot track individual patients through a preventive care visit or chronic disease management pathway. Cannot measure whether a specific patient received all recommended screenings. Cannot verify workup completeness.

5. **8 of ~80 ACP/USPSTF recommendations.** This is a partial score. We score what we can see: preventive visit patterns, screening codes, care management codes, in-office diagnostics. It misses medication management, disease control, outcomes, counseling, patient-level adherence, and clinical decision-making.

6. **Medicare-dominant data.** Good for IM (the core patient population is 65+). But the score is mostly about how the internist serves their Medicare panel. Younger adult care is underrepresented. The Medicaid file was temporarily unavailable as of late March 2026.

7. **G0438/G0439 are Medicare-only.** AWV adoption is only measurable for Medicare patients. An internist with a predominantly Medicaid panel will appear to have low AWV adoption.

8. **Hospitalist vs. office-based distinction is imperfect.** Some hospitalists code under 207R00000X. Their billing pattern will look terrible on this score and may distort peer cohort percentiles.

9. **14 subspecialty exclusions, but miscoding happens.** We exclude 14 subspecialty taxonomy codes, but subspecialists who register under 207R00000X will be incorrectly included in the general IM cohort.

10. **Pharmacy vaccination suppresses immunization signal.** An internist who ensures patients are vaccinated at pharmacies gets no credit for Measure 1D. Known and accepted limitation.

11. **Attribution gaps.** Labs, imaging centers, and pharmacies may perform services the internist ordered. The internist's claims file may undercount their actual diagnostic and preventive practice.

12. **No outcomes.** We cannot measure hospital readmissions, ED utilization, disease progression, mortality, or patient satisfaction. The score is about process, not results. For internal medicine, where the primary outcome is chronic disease control over years, this is a particularly painful gap.


---


## Appendix: ACP/USPSTF Guideline Crosswalk

These are the major ACP clinical practice guidelines and USPSTF preventive care recommendations and their scorability with free CMS data.

| Guideline / Recommendation | Key Recommendations | Scorable Now? | What's Missing |
|---|---|---|---|
| USPSTF: Depression Screening (2016, reaffirmed) | Screen all adults with validated instrument, ensure follow-up systems in place | **Partial** (screening code billing rate) | No follow-up treatment data (Rx, referral), no outcome |
| USPSTF: Annual Influenza Vaccination | Annual flu vaccine for all adults | **Partial** (immunization billing rate) | Pharmacy vaccination not attributed, cannot verify all eligible patients vaccinated |
| ACP/CMS: Annual Wellness Visit | Structured preventive visit with HRA, personalized prevention plan | **Partial** (AWV billing rate) | Cannot verify visit content quality, Medicare-only |
| ACP: Chronic Care Management | Care coordination for patients with 2+ chronic conditions | **Partial** (CCM billing rate) | Cannot verify quality of care coordination, no outcome data |
| ACP: Comprehensive Health Assessment | Standardized health risk appraisal at preventive visits | **Partial** (96160 billing rate) | Cannot verify tool quality or that results were acted on |
| USPSTF: Colorectal Cancer Screening (adults 45-75) | Colonoscopy, FIT, or stool DNA per schedule | No | Colonoscopy billed by GI specialist, FIT billed by lab |
| USPSTF: Breast Cancer Screening (women 40-74) | Mammography every 2 years | No | Mammography billed by imaging facility |
| USPSTF: Lung Cancer Screening (50-80, 20+ pack-year) | Annual low-dose CT | No | CT billed by imaging facility, no smoking history |
| USPSTF: Cervical Cancer Screening (women 21-65) | Pap/HPV per schedule | No | Billed by OB/GYN or lab |
| ACP: Diabetes Management (Type 2) | Metformin first-line, A1c monitoring, annual eye/foot exams, renal screening | No | No Rx data, no A1c values, no dx codes to identify diabetics |
| ACP: Hypertension Management | Lifestyle modification, medication when indicated, BP targets | No | No Rx data, no BP values, no dx codes |
| ACP/ACC: Statin Therapy for ASCVD Prevention | Risk assessment, statin for high-risk patients | No | No Rx data, no lipid values, no dx codes |
| USPSTF: Hepatitis C Screening (all adults 18-79) | One-time HCV screening | No | Lab-billed, not attributed to internist |
| USPSTF: HIV Screening (adults 15-65) | One-time screening | No | Lab-billed |
| ACP: Antibiotic Stewardship | Appropriate antibiotic use for URI, UTI, sinusitis | No | No Rx data, no dx codes |
| USPSTF: Tobacco Cessation (all adults who use tobacco) | Ask, advise, assist, arrange | No | Counseling codes rarely billed, no Rx data for cessation meds |
| USPSTF: Obesity Screening and Management | BMI measurement, behavioral counseling referral | No | No BMI in claims, counseling not separately billed |
| USPSTF: Osteoporosis Screening (women 65+, at-risk younger) | DEXA scan, bisphosphonate treatment | No | DEXA billed by imaging, no Rx data |
| ACP: Falls Prevention in Elderly | Multifactorial risk assessment and intervention | No | No standardized billing code, part of AWV but not separately identifiable |
| ACP: Advance Care Planning | Goals of care conversation, healthcare proxy documentation | No | 99497 exists but rarely billed, cannot measure documentation quality |
| ACP: Opioid Prescribing for Chronic Pain | Risk assessment, lowest effective dose, PDMP checking | No | No Rx data |
| USPSTF: Alcohol Misuse Screening | Screen with validated instrument, brief intervention | No | No standardized code widely billed, AUDIT-C administered within E/M |
| ACP: Appropriate Use of Imaging for Low Back Pain | Avoid imaging in first 6 weeks without red flags | No | No dx codes, imaging billed by facility |
