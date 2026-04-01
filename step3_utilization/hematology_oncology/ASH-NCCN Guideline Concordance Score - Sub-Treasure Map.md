# Hematology/Oncology Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a hematology/oncology provider actually did: every chemotherapy administration, every E/M visit, every supportive care intervention. ASH (American Society of Hematology) and NCCN (National Comprehensive Cancer Network) tell you what that provider should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.

Hematology/oncology is a subspecialty of internal medicine. Providers treat cancers (solid tumors and hematologic malignancies), blood disorders (anemia, coagulation disorders, sickle cell disease), and manage complex multi-drug regimens. The clinical decision-making is highly individualized — treatment depends on cancer type, stage, molecular markers, and patient comorbidities. Most of that decision-making is invisible in claims data. What we can measure is whether the observable patterns of care align with what guidelines say should happen alongside treatment.


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
| Provider specialty | Taxonomy-derived specialty (Hematology & Oncology = 207RH0003X) |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The hematology/oncology advantage:** Unlike pediatrics, hematology/oncology is Medicare-heavy. Cancer incidence peaks after age 65 — roughly 60% of new cancer diagnoses occur in the 65+ population. The Medicare file is the primary data source for this specialty. Most hem/onc providers have substantial Medicare volume.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. Covers both fee-for-service and managed care Medicaid claims, plus CHIP.

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
| ICD-10 diagnosis codes | Cannot link procedures to cancer type. Cannot tell if chemo was for breast cancer vs. lymphoma. |
| NDC drug codes | Cannot see which specific chemotherapy drugs were administered. Cannot assess regimen appropriateness. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track post-chemo hospitalizations. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual patient treatment courses. |
| Service location details | Limited place-of-service information. |

**The Medicaid role in hem/onc:** Medicaid covers younger cancer patients (under 65), patients who spend down to Medicaid eligibility during treatment, and dual-eligible patients. The Medicaid volume is smaller than Medicare for this specialty but still meaningful — particularly for hematologic conditions like sickle cell disease, which disproportionately affects Medicaid populations.

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every hematology/oncology provider by NPI, taxonomy code (207RH0003X = Hematology & Oncology, plus related subspecialty codes), practice address, and organizational affiliation. Free, always available. This is how we build the provider roster.


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given hem/onc provider:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what procedures they perform) | Why they performed them (no diagnosis codes in Medicaid file) |
| How often they bill each code (volume) | Which specific drugs they administered (no NDC codes) |
| How many patients they see per procedure | Individual patient treatment courses or sequences |
| Whether they bill chemotherapy administration codes | Whether the chemo regimen was guideline-appropriate for the cancer type |
| Whether they bill supportive care codes (growth factors, antiemetics, transfusions) | Whether supportive care was given at the right time relative to chemo cycles |
| Whether they perform bone marrow biopsies, infusions, injections | Patient outcomes (response rates, survival, toxicity) |
| Their practice location and taxonomy (NPPES) | Molecular/genomic testing results that drove treatment decisions |


## 2. What's Scorable vs. Not Scorable

This is the critical section. Hematology/oncology guidelines are overwhelmingly about treatment selection — which drug, which regimen, which sequence, for which cancer at which stage. Almost none of that is visible in our data. We must be honest about what we can and cannot measure.


### ASH Guidelines — Scorability Audit

| Guideline Domain | Key Recommendations | Scorable? | Why / Why Not |
|---|---|---|---|
| **VTE prophylaxis in cancer** | Assess all cancer patients for VTE risk; consider prophylaxis for high-risk ambulatory patients | Partially | We can see if a provider bills for VTE assessment (99213-99215 with pattern), anticoagulant injection admin codes (96372). Cannot confirm which patients received assessment. |
| **Sickle cell disease management** | Hydroxyurea for eligible patients, transcranial Doppler screening, chronic transfusion therapy | Partially | Can see transfusion codes (36430, 36455) and drug admin codes. Cannot see hydroxyurea prescribing (Rx data) or TCD ordering (imaging not in these files). |
| **Immune thrombocytopenia (ITP)** | Observation for mild, corticosteroids first-line, TPO-RA for chronic | No | Treatment selection requires diagnosis + Rx data. Cannot measure. |
| **VTE treatment** | Anticoagulation duration and type | No | Requires Rx data (oral anticoagulants) and diagnosis linkage. |
| **Iron deficiency anemia** | IV iron for appropriate candidates | Partially | Can see IV iron infusion codes (96365 with J codes if available). Cannot confirm diagnosis or appropriateness. |
| **Heparin-induced thrombocytopenia** | Alternative anticoagulation | No | Requires diagnosis linkage and Rx data. |

### NCCN Guidelines — Scorability Audit

| Guideline Domain | Key Recommendations | Scorable? | Why / Why Not |
|---|---|---|---|
| **Treatment regimen selection** (all cancer types) | Specific drug combinations by cancer type, stage, biomarkers | No | Requires diagnosis codes, drug identification (NDC), staging, and molecular data. None available. |
| **Supportive care: Antiemetics** | Prophylactic antiemetics with emetogenic chemo | Partially | Can see antiemetic administration (96372, J-codes for ondansetron, etc.) alongside chemo admin codes. Cannot confirm timing or appropriateness to regimen. |
| **Supportive care: Growth factors** | G-CSF (filgrastim/pegfilgrastim) for high-risk febrile neutropenia regimens | Partially | Can see growth factor injection codes (96372 + J1442, J2505). Cannot link to specific chemo regimen or neutropenia risk level. |
| **Supportive care: Bone-modifying agents** | Denosumab or zoledronic acid for bone metastases | Partially | Can see infusion/injection codes. Cannot confirm bone metastasis diagnosis. |
| **Survivorship care** | Follow-up visits, surveillance imaging, screening for secondary cancers | Partially | Can see E/M visit patterns over time and some surveillance-related codes. Cannot confirm surveillance intent vs. active treatment. |
| **Palliative care integration** | Early palliative care referral for advanced cancer | No | Cannot distinguish palliative intent from curative intent in claims. |
| **Genetic counseling/testing** | BRCA, Lynch syndrome, other hereditary cancer testing | Partially | Can see genetic counseling codes (96040, S0265) and some molecular testing codes (81162, 81211-81217, 81292-81300). Cannot confirm appropriateness. |
| **Cancer screening** (for providers who also do primary care) | Age-appropriate screening (colonoscopy, mammography referral) | No | Hem/onc providers rarely bill screening procedures directly. Screening happens in primary care. |
| **Pain management** | Multimodal pain management for cancer pain | No | Requires Rx data (opioids, adjuvants) and cannot assess pain control. |
| **Psychosocial distress screening** | Distress screening for all cancer patients | Partially | Can see 96127 (brief emotional/behavioral assessment) or 96160/96161 (health risk assessment). Volume relative to patient panel is measurable. |


### Summary: What We Can Score

| Scorable Domain | What We Measure | Source Codes |
|---|---|---|
| **Chemotherapy administration patterns** | Does the provider administer chemo? What's the volume? Mix of IV push vs. infusion? | 96401, 96402, 96409, 96411, 96413, 96415, 96416, 96417 |
| **Supportive care delivery** | Does the provider deliver growth factors, antiemetics, transfusions, hydration alongside chemo? | 96360, 96361 (hydration), 96365-96368 (therapeutic infusion), 96372 (injection), 36430 (transfusion) |
| **Evaluation & management complexity** | Are visit levels appropriate for an oncology practice? | 99211-99215, 99241-99245 (consults where applicable) |
| **Psychosocial screening** | Does the provider screen for distress? | 96127, 96160, 96161 |
| **Genetic counseling/molecular testing** | Does the provider offer genetic services? | 96040, S0265, 81162, 81211-81217, 81292-81300 |

**What we absolutely cannot score:**
- Whether the right drug was used for the right cancer
- Whether treatment was started at the right time
- Whether dose reductions were appropriate
- Whether the patient responded to treatment
- Whether end-of-life care preferences were honored
- Whether clinical trial enrollment was offered


---

# PART B: THE LOGIC

---


## Peer Cohort Definition

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207RH0003X (Hematology & Oncology) | The primary taxonomy for medical oncologists and hematologist-oncologists |
| State | Same state as the provider being scored | Practice patterns vary by state (payer mix, academic vs. community, formulary differences) |
| Volume | >= 50 total Medicare services in the measurement year | Excludes inactive or very low-volume providers. Hem/onc has lower provider counts than primary care, so threshold is lower. |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

**Related taxonomy codes (for subspecialist flagging, not scoring cohort):**

| Taxonomy | Subspecialty | Handling |
|---|---|---|
| 207RH0003X | Hematology & Oncology | **Primary cohort** |
| 207RH0000X | Hematology (Internal Medicine) | Flag — hematology-only, different practice pattern |
| 207RX0202X | Medical Oncology | Flag — oncology-only, different code mix |
| 2080P0207X | Pediatric Hematology/Oncology | Exclude — pediatric population, different guidelines |
| 207RC0200X | Critical Care (some overlap) | Exclude — different scope |
| 364SX0200X | Oncology Nursing | Exclude — different provider type |

**National fallback:** Use when state cohort < 30 providers. Some small states may have very few hem/onc providers.


## Scoring Domains

We organize the scorable measures into three domains, weighted by clinical importance and data reliability.


### Domain 1: Supportive Care Delivery (Weight: 45%)

**Why this gets the highest weight:** Supportive care is the area where guidelines are most measurable from claims and where variation most directly affects patient outcomes. Growth factor support, hydration, and blood product management are standard-of-care components that should co-occur with chemotherapy.

**Measures:**

| Measure | Numerator | Denominator | What It Captures |
|---|---|---|---|
| **Growth factor rate** | Beneficiaries receiving growth factor injections (J1442 filgrastim, J2505 pegfilgrastim, via 96372) | Beneficiaries receiving chemotherapy (96413-96417) | Are patients getting myeloid support when on chemo? |
| **Hydration rate** | Services for hydration (96360, 96361) | Chemotherapy administration services (96409-96417) | Is the provider hydrating patients during chemo infusions? |
| **Transfusion rate** | Transfusion services (36430, 36455) as proportion of practice | Total beneficiaries | Does the provider manage blood products? (Expected in active chemo practice) |
| **Antiemetic co-administration** | Injection services (96372) co-occurring with chemo admin codes in same provider's billing | Chemotherapy administration services | Is the provider administering antiemetics alongside chemo? |

**Scoring:** For each measure, compute the provider's rate, then percentile-rank against the state peer cohort. Domain score = average of measure percentile ranks.

**Worked example:**

```
Provider A in Texas:
    Growth factor rate:     18% of chemo patients → 65th percentile among TX hem/onc peers
    Hydration rate:         0.4 hydrations per chemo admin → 55th percentile
    Transfusion rate:       12% of total beneficiaries → 70th percentile
    Antiemetic co-admin:    0.8 injections per chemo admin → 60th percentile

    Domain 1 score = MEAN(65, 55, 70, 60) = 62.5
```


### Domain 2: Practice Completeness (Weight: 35%)

**Why this weight:** A hematology/oncology practice that provides comprehensive care — E/M visits of appropriate complexity, procedures, psychosocial support — signals a practice that manages patients holistically rather than just administering drugs.

**Measures:**

| Measure | What We Look At | What It Captures |
|---|---|---|
| **E/M complexity ratio** | Proportion of E/M visits at 99214-99215 vs. 99211-99213 | Oncology is complex. Providers should bill mostly moderate-to-high complexity visits. A practice billing predominantly 99212-99213 may be undercoding or not managing complexity. |
| **Psychosocial screening rate** | Volume of 96127/96160/96161 per 100 unique beneficiaries | NCCN recommends distress screening for all cancer patients. |
| **Procedure capability** | Does the provider perform bone marrow biopsies (38222), aspirations (38220), or other diagnostic procedures? | Presence of procedural codes signals a practice that does its own workup rather than referring everything out. |
| **Genetic counseling/testing** | Any billing for 96040, S0265, 81162, 81211-81217 | Signals awareness of hereditary cancer screening — increasingly standard of care. |

**Scoring:** Each measure is scored 0-100 based on percentile rank within the peer cohort, except Procedure capability and Genetic counseling, which are binary (present = 75, absent = 25 — not penalized heavily since referral patterns vary by practice setting).

```
Provider A in Texas:
    E/M complexity ratio:   82% at 99214-99215 → 58th percentile
    Psychosocial screening: 14 per 100 patients → 45th percentile
    Procedure capability:   Bills 38222 → 75 (present)
    Genetic testing:        No billing → 25 (absent)

    Domain 2 score = MEAN(58, 45, 75, 25) = 50.75
```


### Domain 3: Chemotherapy Management Pattern (Weight: 20%)

**Why the lowest weight:** This domain measures whether the provider's chemotherapy administration pattern is consistent with active oncology practice. It's less diagnostic than the other two because volume alone doesn't tell you about quality — but extreme values (very low chemo volume for an "oncologist" or unusual push-to-infusion ratios) are informative.

**Measures:**

| Measure | What We Look At | What It Captures |
|---|---|---|
| **Chemo volume adequacy** | Total chemotherapy administration services relative to peer median | Is this provider actively administering chemo, or are they primarily a consulting hematologist? |
| **IV push vs. infusion ratio** | Ratio of 96401-96402 (IV push) to 96413-96417 (infusion) | Most modern chemo is infusion-based. A very high push-to-infusion ratio is atypical. |
| **Multi-drug administration** | Frequency of additional drug codes (96411, 96415, 96417) relative to initial codes (96409, 96413) | Multi-drug regimens are standard. A provider who always bills single-agent chemo may have an unusual practice. |

**Scoring:** Percentile rank within peer cohort for each measure. Domain score = average of measure percentile ranks.

```
Provider A in Texas:
    Chemo volume:           420 services → 52nd percentile
    Push-to-infusion ratio: 0.15 → 60th percentile (low ratio = more infusion = normal)
    Multi-drug rate:        0.65 additional per initial → 55th percentile

    Domain 3 score = MEAN(52, 60, 55) = 55.67
```


## Composite Guideline Concordance Score

```
guideline_concordance_score = (domain_1_score * 0.45) +
                              (domain_2_score * 0.35) +
                              (domain_3_score * 0.20)
```

**Provider A worked example:**

```
= (62.5 * 0.45) + (50.75 * 0.35) + (55.67 * 0.20)
= 28.13 + 17.76 + 11.13
= 57.02

Provider A's Guideline Concordance Score: 57.0
```

**Interpretation bands:**

| Score Range | Interpretation |
|---|---|
| 80-100 | Strong guideline alignment. Supportive care, practice completeness, and chemo patterns all peer-competitive. |
| 60-79 | Moderate alignment. Some domains strong, others below peer median. Investigate weak domains. |
| 40-59 | Below average. Multiple domains below peer norms. May reflect a specialized practice (hematology-only) or genuine gaps. |
| Below 40 | Significant deviation from peer norms. Review whether provider is actually practicing hem/onc or is miscategorized. |

**Provider B worked example (hematology-focused, low chemo):**

```
Provider B in California (primarily manages blood disorders, minimal chemo):
    Domain 1 (Supportive Care):     Low growth factor, moderate transfusions → 35
    Domain 2 (Practice Completeness): High E/M complexity, strong procedures → 72
    Domain 3 (Chemo Management):     Very low chemo volume → 15

    Composite = (35 * 0.45) + (72 * 0.35) + (15 * 0.20)
             = 15.75 + 25.20 + 3.00
             = 43.95

    Score: 44.0 — flags as below average, but this is a hematology-focused provider.
    The subspecialist flag (see Business Rules) catches this case.
```


---

# PART C: BUSINESS RULES

---


## Composite Formula

```
guideline_concordance_score = (supportive_care_score * 0.45) +
                              (practice_completeness_score * 0.35) +
                              (chemo_management_score * 0.20)
```

**Weight justification:**
- Supportive care (45%): Most directly measurable from claims, most guideline-aligned, highest variation impact on patient outcomes.
- Practice completeness (35%): Captures holistic care delivery, including psychosocial and genetic components that are increasingly guideline-mandated.
- Chemo management pattern (20%): Informative but less diagnostic — volume and route mix are noisy proxies for quality.


## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has zero chemo admin codes | Domain 3 score = 50 (neutral). Provider may be hematology-only. Flag as `no_chemo_detected`. |
| Provider has no growth factor codes | Measure score = 0 (they should have some if they administer chemo). If no chemo either, measure = 50 (neutral). |
| Provider has no psychosocial screening codes | Measure score = 0. This is measurable and expected. Absence is informative. |
| Provider has no genetic testing codes | Measure score = 25. Referral to external genetic services is common and not penalizable from claims. |
| Provider has fewer than 11 unique beneficiaries | All scores = NULL. Insufficient data to score. Mark as `low_volume_excluded`. |
| State peer cohort < 30 providers | Use national cohort for percentile ranking. Mark as `national_fallback`. |


## Subspecialist Handling

Hematology/oncology has significant subspecialization that affects billing patterns:

| Subspecialty Pattern | Detection Method | Handling |
|---|---|---|
| **Hematology-only** | Taxonomy 207RH0000X OR chemo admin < 5% of services | Flag as `hematology_focused`. Reduce Domain 3 weight to 5%, redistribute to Domains 1-2. |
| **Surgical oncology** | Taxonomy 2086S0120X | Exclude from cohort — different scope of practice. |
| **Radiation oncology** | Taxonomy 2085R0001X | Exclude from cohort — completely different code set. |
| **Pediatric hem/onc** | Taxonomy 2080P0207X | Exclude — pediatric population, different guidelines. |
| **Gynecologic oncology** | Taxonomy 207VG0400X | Exclude — overlaps with OB-GYN, different code mix. |

When a hematology-focused provider is detected, the adjusted formula is:

```
adjusted_score = (supportive_care_score * 0.50) +
                 (practice_completeness_score * 0.45) +
                 (chemo_management_score * 0.05)
```


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## What Each Dimension Catches

| Dimension | What It Catches | What It Misses (Caught by Others) |
|---|---|---|
| **1. Guideline Concordance** (this doc) | Supportive care delivery, practice completeness, chemo management patterns | Whether billing looks normal (Peer Comparison), whether volumes are adequate (Volume Adequacy), pricing anomalies (Billing Quality) |
| **2. Peer Comparison** | Whether the provider's code set matches a typical hem/onc practice | Whether those codes reflect guideline-concordant care (this doc) |
| **3. Volume Adequacy** | Whether trace billing suggests capability misrepresentation | Whether appropriate care was delivered at all (this doc) |
| **4. Payer Diversity** | Whether practice patterns differ by payer | Clinical quality of care delivered to either payer (this doc) |
| **5. Billing Quality** | Pricing outliers, suspicious code ratios, upcoding risk | Whether the clinically appropriate codes were billed (this doc) |


## Complementary Scenarios

**Scenario 1:** Provider scores 85 on Guideline Concordance (strong supportive care) but 35 on Billing Quality (charge ratios are outliers). Interpretation: clinically aligned but financially suspicious. Investigate billing, not clinical practice.

**Scenario 2:** Provider scores 45 on Guideline Concordance (low psychosocial screening, no genetic testing) but 90 on Peer Comparison (code set matches peers perfectly). Interpretation: the provider practices like a typical peer — the gap may be a cohort-wide issue, not an individual one. Check whether the state cohort has low screening rates overall.

**Scenario 3:** Provider scores 70 on Guideline Concordance but 25 on Volume Adequacy (trace billing in several categories). Interpretation: the guideline measures look adequate in rate terms, but absolute volumes are suspiciously low. May be a part-time provider or one who is winding down practice.


---

# PART E: RISKS AND LIMITATIONS

---


## Data Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **No diagnosis codes in Medicaid** | Cannot link procedures to cancer type or stage | Score measures process patterns, not treatment appropriateness. Explicitly labeled as proxy measure. |
| **No drug identification** | Cannot assess regimen selection, the core of oncology quality | Domain 3 measures chemo admin patterns only, not drug choice. Weight kept low (20%). |
| **No patient-level linkage** | Cannot track treatment courses, response, or outcomes | All measures are provider-level aggregates. Cannot distinguish a provider with 100 patients getting 1 chemo each from 10 patients getting 10 each. |
| **No imaging or pathology results** | Cannot assess staging appropriateness or response evaluation | Not attempted. Out of scope for claims-based scoring. |
| **Medicare-dominant data** | Younger cancer patients (under 65) underrepresented in primary data source | Medicaid file supplements, but hem/onc Medicaid volume is lower. Score may underrepresent practices focused on younger populations (e.g., sickle cell disease). |
| **Aggregated data suppresses small counts** | CMS suppresses cells with < 11 beneficiaries | Providers with narrow practice (few patients per code) may have incomplete data. `low_volume_excluded` flag handles this. |


## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Academic vs. community** | Academic centers may bill more genetic testing, more procedures, more complex visits | Peer cohort is state-level, mixing academic and community. Consider future stratification. |
| **Practice setting** | Hospital-based providers bill differently from office-based (facility vs. professional component) | Place-of-service field available in Medicare. Could stratify in future. Currently not adjusted. |
| **Hematology vs. oncology mix** | Providers who focus on benign hematology score lower on chemo-related measures | Subspecialist detection and adjusted weighting (see Business Rules). |
| **Drug-only practices** | Some practices primarily administer drugs (infusion centers) and refer complex management | These score high on Domain 3, potentially low on Domain 2. Peer comparison (Dimension 2) catches this pattern. |


## Confidence Tier

**All scores in this document are Tier 2: proxy/utilization measures.** They measure observable billing patterns that correlate with guideline-concordant care, but they do not directly measure clinical quality or patient outcomes. Tier 1 scoring would require patient-level data with diagnosis linkage, treatment outcomes, and survival data — none of which is available in free CMS aggregate files.


## Update Cadence

Reference sets, peer percentiles, and volume anchors should be rebuilt annually as CMS releases updated Medicare and Medicaid files. The 2024 Medicare file is the most recent available as of April 2026. The Medicaid file covers 2018-2024.


---

# OUTPUT SCHEMA

---

One row per NPI. All scores on 0-100 scale.

| Field | Type | Description |
|---|---|---|
| npi | string | 10-digit National Provider Identifier |
| provider_name | string | Provider name from NPPES |
| provider_state | string | 2-letter state code from NPPES practice address |
| taxonomy_code | string | NPPES taxonomy (207RH0003X for primary cohort) |
| measurement_year | integer | Year of CMS data used for scoring |
| peer_cohort_level | string | "state" or "national_fallback" |
| peer_cohort_size | integer | Number of providers in the comparison cohort |
| domain_1_supportive_care_score | float | Supportive care delivery score (0-100) |
| growth_factor_rate_pctile | float | Percentile rank for growth factor administration |
| hydration_rate_pctile | float | Percentile rank for hydration co-administration |
| transfusion_rate_pctile | float | Percentile rank for transfusion services |
| antiemetic_coadmin_pctile | float | Percentile rank for antiemetic co-administration |
| domain_2_practice_completeness_score | float | Practice completeness score (0-100) |
| em_complexity_ratio_pctile | float | Percentile rank for E/M complexity |
| psychosocial_screening_rate_pctile | float | Percentile rank for distress screening volume |
| procedure_capability_flag | boolean | True if provider bills bone marrow biopsy/aspiration codes |
| genetic_testing_flag | boolean | True if provider bills genetic counseling/testing codes |
| domain_3_chemo_management_score | float | Chemotherapy management pattern score (0-100) |
| chemo_volume_pctile | float | Percentile rank for chemo administration volume |
| push_to_infusion_ratio_pctile | float | Percentile rank for IV push vs. infusion ratio |
| multidrug_rate_pctile | float | Percentile rank for multi-drug administration frequency |
| guideline_concordance_score | float | Composite score (0-100), weighted: 45/35/20 |
| subspecialist_flag | string | "general_hemonc", "hematology_focused", or null |
| adjusted_score | float | Score after subspecialist weight adjustment (if applicable) |
| no_chemo_detected | boolean | True if provider has zero chemo admin codes |
| low_volume_excluded | boolean | True if provider has < 11 unique beneficiaries |
| data_completeness | string | "full", "medicare_only", "medicaid_only" |
| score_confidence_tier | string | Always "tier_2_proxy" for this version |
