# Gastroenterology Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a gastroenterologist actually did: every colonoscopy, every endoscopy, every screening test ordered. ACG, AGA, and ASGE guidelines tell you what that provider should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today. Where we can measure something, we do. Where we cannot, we say so plainly and explain why.


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
| Provider specialty | Taxonomy-derived specialty (Gastroenterology = 207RG0100X) |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The GI advantage:** Unlike pediatrics, gastroenterology is Medicare-heavy. The majority of GI patients are older adults. Colorectal cancer screening starts at 45, Barrett's surveillance skews older, hepatitis C screening targets baby boomers, and liver disease prevalence increases with age. Medicare is the PRIMARY data source here, not the supplementary one. This file carries the strongest signal for GI quality scoring.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. Adds younger adult and disability populations.

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
| ICD-10 diagnosis codes | Cannot link procedures to clinical indications. Cannot tell if a colonoscopy was screening vs. diagnostic for symptoms. |
| NDC drug codes | Cannot see prescriptions. No PPI tracking, no biologics for IBD, no hepatitis C treatment. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track GI bleeding admissions or post-procedure complications. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual screening intervals. |
| Pathology results | Cannot determine adenoma detection rate, Barrett's dysplasia, or H. pylori biopsy results. |

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every gastroenterology provider by NPI, taxonomy code (207RG0100X = Internal Medicine, Gastroenterology), practice address, and organizational affiliation. Free, always available. This is how we build the provider roster.


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given GI provider:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what procedures they perform) | Why they performed them (screening vs. diagnostic indication) |
| How often they bill each code (volume) | What they prescribed (no Rx data: no PPIs, no biologics, no antivirals) |
| How many patients they see per procedure | Individual patient timelines or screening intervals |
| Whether they perform colonoscopies and at what volume | Whether polyps found were adenomas (needs pathology) |
| Whether they perform upper endoscopies and biopsy | Whether Barrett's esophagus was found or graded (needs pathology) |
| Whether they order hepatitis screening tests | Whether patients were treated or achieved SVR (needs Rx + labs) |
| Whether they order H. pylori testing | Whether eradication was confirmed (needs follow-up test linkage) |
| Their practice location (NPPES) | How outcomes compare across their patient panel |


## 2. What the Codes Tell Us (Analysis on Available Data Only)

Every HCPCS code in the claims files is a fact about what happened. Here is what we can extract from the free data, organized by the quality signals they reveal.


### Colorectal Cancer Screening & Surveillance: Does This Provider Perform Colonoscopies to Guideline Standards?

| Code | Description | Visible In |
|---|---|---|
| 45378 | Diagnostic colonoscopy | Medicare + Medicaid |
| 45380 | Colonoscopy with biopsy | Medicare + Medicaid |
| 45384 | Colonoscopy with lesion removal, hot biopsy | Medicare + Medicaid |
| 45385 | Colonoscopy with polypectomy, snare technique | Medicare + Medicaid |
| 45386 | Colonoscopy with balloon dilation | Medicare + Medicaid |
| 45388 | Colonoscopy with ablation | Medicare + Medicaid |
| 45390 | Colonoscopy with removal of foreign body by snare | Medicare + Medicaid |
| G0121 | CRC screening colonoscopy, high risk individual | Medicare + Medicaid |
| G0105 | CRC screening colonoscopy, not high risk | Medicare + Medicaid |

Note: G0121 and G0105 are legacy screening-specific codes. CMS has updated billing rules over time, and these may still appear in historical data alongside the 4537x procedural codes.

**What we can measure:** For each GI NPI, we can count total colonoscopy volume, polypectomy volume (45385 is the workhorse polypectomy code), and calculate a polypectomy-to-colonoscopy ratio. This ratio is the best available proxy for adenoma detection rate (ADR), the gold standard colonoscopy quality measure. A provider who finds and removes polyps in a meaningful share of their colonoscopies is more likely to have a high ADR. We can also look at the screening-specific G-codes to estimate the screening-vs-diagnostic mix.

**What we cannot measure:** Adenoma detection rate (ADR). ADR requires pathology reports confirming that a removed polyp was an adenomatous polyp, not a hyperplastic or other benign polyp. Claims data tells us a polypectomy happened, not what the pathologist found. We also cannot measure whether screening intervals are appropriate (3 years after adenomas, 10 years after a clean screening) because we have no patient-level longitudinal data. Bowel prep quality (a major determinant of colonoscopy effectiveness) is invisible.

**What ACG/AGA/ASGE say should happen:** CRC screening colonoscopy starting at age 45 for average-risk individuals (ACG 2021, aligned with USPSTF 2021). Surveillance colonoscopy after polypectomy at guideline-recommended intervals: 3 years for high-risk adenomas, 5-10 years for low-risk adenomas, 10 years for negative screening (ACG 2020 Post-Polypectomy Surveillance Guidelines). ADR should be at least 25% overall (30% for men, 20% for women) per ACG/ASGE quality indicators.

**How we score it:** Percentile ranking of colonoscopy volume per beneficiary (measures whether the provider is performing screening-level volume) plus percentile ranking of polypectomy-to-colonoscopy ratio (proxy for ADR). Details in Section 4.


### Upper GI Evaluation & Barrett's Surveillance: Does This Provider Follow EGD Guidelines?

| Code | Description | Visible In |
|---|---|---|
| 43235 | EGD diagnostic (esophagogastroduodenoscopy) | Medicare + Medicaid |
| 43239 | EGD with biopsy | Medicare + Medicaid |
| 43249 | EGD with dilation of esophagus | Medicare + Medicaid |
| 43233 | EGD with balloon dilation >30mm | Medicare + Medicaid |
| 43248 | EGD with dilation, guide wire | Medicare + Medicaid |
| 43250 | EGD with removal of tumor/polyp by snare | Medicare + Medicaid |
| 43251 | EGD with removal by hot biopsy forceps | Medicare + Medicaid |

**What we can measure:** Total EGD volume per provider, biopsy rate during EGD (43239 relative to total EGD volume), and therapeutic intervention rate (dilation, removal codes relative to total EGD). The biopsy-to-EGD ratio is meaningful: Barrett's esophagus surveillance requires systematic biopsies according to the Seattle protocol. A provider who performs EGD and almost always biopsies is more likely to be following surveillance protocols than one who rarely does.

**What we cannot measure:** Barrett's segment length (short vs. long segment), dysplasia grading (none, low-grade, high-grade), whether the biopsies followed the Seattle protocol (4-quadrant biopsies every 1-2 cm), PPI appropriateness or deprescribing efforts (no Rx data), or GERD symptom response.

**What ACG/AGA say should happen:** Barrett's esophagus surveillance with systematic biopsies per the Seattle protocol, at intervals determined by dysplasia status: every 3-5 years for non-dysplastic Barrett's, every 6-12 months for low-grade dysplasia (ACG 2022 Barrett's Guidelines). GERD management should minimize long-term PPI use when possible (ACG 2022 GERD Guidelines). EGD should not be repeated without clinical indication.

**How we score it:** Percentile ranking of EGD volume per beneficiary plus percentile ranking of biopsy-to-EGD ratio. Details in Section 4.


### Hepatitis & Liver Disease Screening: Does This Provider Screen for Viral Hepatitis?

| Code | Description | Visible In |
|---|---|---|
| 87340 | Hepatitis B surface antigen (HBsAg) | Medicare + Medicaid |
| 87341 | Hepatitis B surface antigen, neutralization confirmation | Medicare + Medicaid |
| 86803 | Hepatitis C antibody | Medicare + Medicaid |
| 86804 | Hepatitis C antibody, confirmatory | Medicare + Medicaid |
| 87520 | Hepatitis C RNA, qualitative | Medicare + Medicaid |
| 87521 | Hepatitis C RNA, quantitative | Medicare + Medicaid |
| 87522 | Hepatitis C RNA, quantitative (alternate code) | Medicare + Medicaid |
| 80076 | Hepatic function panel | Medicare + Medicaid |
| 82977 | GGT (gamma-glutamyl transferase) | Medicare + Medicaid |

**What we can measure:** Whether a GI provider orders hepatitis screening tests at all (many GI providers focus purely on endoscopy and do not order lab work), and the volume of hepatitis screening relative to their patient panel. We can also look at confirmatory testing (87521/87522 after 86803/86804) as a signal that the provider is following through after a positive antibody screen.

**What we cannot measure:** Whether screening was risk-appropriate (no diagnosis codes in Medicaid file to know patient risk factors), treatment initiation after positive results (no Rx data -- cannot see direct-acting antiviral prescriptions for HCV), fibrosis staging (FibroScan/transient elastography bills under 91200 but adoption is limited and it may be billed by the facility, not the provider), or sustained virologic response (SVR) rates.

**What USPSTF/AASLD/CDC say should happen:** Universal HCV screening for all adults aged 18-79 at least once (USPSTF 2020, reinforced by CDC). Universal HBV screening for all adults at least once (USPSTF 2020, AASLD). A gastroenterologist should be ordering hepatitis screening on patients without documented prior screening, and following through with confirmatory testing and referral to treatment.

**How we score it:** Binary component (does the provider bill any hepatitis screening codes at all?) plus rate percentile among those who do. Details in Section 4.


### H. pylori Testing & Management: Does This Provider Test Appropriately?

| Code | Description | Visible In |
|---|---|---|
| 87338 | H. pylori stool antigen | Medicare + Medicaid |
| 86677 | H. pylori antibody (serology) | Medicare + Medicaid |
| 83009 | H. pylori breath test (analysis) | Medicare + Medicaid |
| 83013 | H. pylori breath test, analysis | Medicare + Medicaid |
| 83014 | H. pylori breath test, drug administration | Medicare + Medicaid |
| 43239 | EGD with biopsy (may include CLO test, but indistinguishable) | Medicare + Medicaid |

**What we can measure:** H. pylori testing volume by any method (stool, breath, serology), and the non-invasive to invasive testing ratio. ACG strongly recommends non-invasive testing (stool antigen or urea breath test) over serology for initial diagnosis, because serology cannot distinguish active from past infection. A provider who uses stool antigen (87338) and breath test (83009/83013) more than serology (86677) is practicing closer to guidelines.

**What we cannot measure:** Whether eradication was confirmed with a test-of-cure (requires a second non-invasive test 4+ weeks after treatment -- we cannot link sequential tests to individual patients). Antibiotic selection (no Rx data -- cannot tell if the provider used guideline-recommended quadruple therapy vs. outdated triple therapy). Treatment success rates.

**What ACG says should happen:** Test-and-treat strategy for H. pylori using non-invasive testing (stool antigen or urea breath test preferred over serology) (ACG 2017, updated 2024). Confirm eradication with test-of-cure in all treated patients. Avoid serology for initial diagnosis where possible.

**How we score it:** H. pylori testing volume per GI visit percentile, with a bonus for non-invasive test preference. Details in Section 4.


## 3. What We Can and Cannot Score (Honest Assessment)

Out of the 4 clinical domains and approximately 35-40 major GI guidelines from ACG, AGA, ASGE, AASLD, and USPSTF, here is what is scorable with the free CMS data:

| Domain | Weight | Scorable Guidelines | Not Scorable | Why Not |
|---|---|---|---|---|
| CRC Screening & Surveillance | 35% | 3 of 8 (colonoscopy volume, polypectomy ratio as ADR proxy, screening code mix) | 5 | ADR needs pathology; interval appropriateness needs patient-level timeline; prep quality not in claims; sessile serrated lesion detection needs pathology; cecal intubation rate not coded |
| Upper GI / Barrett's | 25% | 3 of 7 (EGD volume, biopsy ratio, therapeutic rate) | 4 | Barrett's segment length needs endoscopy report; dysplasia grading needs pathology; Seattle protocol adherence needs biopsy count per case; PPI appropriateness needs Rx data |
| Hepatitis & Liver Disease | 20% | 2 of 10 (screening test presence, screening volume rate) | 8 | Treatment initiation needs Rx data; SVR needs lab results; fibrosis staging limited in claims; risk-appropriate screening needs dx codes; HBV vaccination follow-through needs patient-level data; cirrhosis surveillance (HCC screening) needs dx + imaging linkage; NAFLD/MASLD assessment needs dx codes; alcohol-related liver disease screening needs dx codes |
| H. pylori Testing | 20% | 2 of 7 (testing volume, non-invasive test preference) | 5 | Eradication confirmation needs patient-level linkage; antibiotic selection needs Rx data; treatment success needs labs; re-testing patterns need patient-level data; resistance-guided therapy needs culture data |
| **Total** | | **10 of ~35** | **~25** | |

**What is completely dark (not scorable at all from free CMS data):**

| Guideline Area | Why It Is Dark |
|---|---|
| Adenoma detection rate (ADR) | Requires pathology reports confirming adenomatous histology. THE gold standard for colonoscopy quality. |
| Appropriate screening intervals | Requires patient-level longitudinal data to measure time between colonoscopies. |
| PPI appropriateness / deprescribing | Requires prescription data. No Rx data in either CMS file. |
| IBD medication management (biologics, immunomodulators) | Requires Rx data. Some biologics are infused (J-codes visible) but oral meds invisible. |
| Bowel prep quality | Not coded in claims. Documented in endoscopy reports only. |
| Celiac disease diagnosis accuracy | Requires pathology + serology linkage. |
| Liver fibrosis assessment (FibroScan) | 91200 exists but limited adoption; often billed by facility. |
| Cancer staging and outcomes | No outcome data in claims. |
| Patient symptoms / quality of life | No patient-reported data. |
| Appropriate use of anesthesia for endoscopy | Requires anesthesia claims linkage (different NPI). |
| ERCP quality metrics (cannulation rate, complication rate) | Requires procedure reports, not available in claims. |
| Capsule endoscopy appropriateness | Cannot determine clinical indication from claims alone. |

**Bottom line:** With free CMS data, we can score roughly 10 of 35 guidelines. These concentrate in three areas: procedure volumes, procedure ratios (proxy for quality), and screening test ordering patterns. We are blind to medications, pathology, outcomes, and patient-level timelines. The 10 scorable guidelines still tell a meaningful story. A GI provider who performs high-volume colonoscopy with strong polypectomy rates, biopsies during EGD, screens for hepatitis, and uses non-invasive H. pylori testing is practicing differently from one who does not. The score is a defensible utilization profile, not a comprehensive clinical quality assessment.


## 4. Business Logic: How We Compare What They Did vs. What ACG/AGA/ASGE Say

For a given NPI, here is exactly how we compute each measure. Every calculation uses only the free CMS data described in Section 1.


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code = '207RG0100X' (Internal Medicine, Gastroenterology)
**Filter by state:** provider_state = target state (e.g., 'TX')
**Output:** A table of GI NPIs with practice address, entity type, and taxonomy.

This is the denominator. Every NPI in this roster gets scored.

Note: Some hepatologists have separate taxonomy codes (207RI0011X = Internal Medicine, Hepatology). Include them but flag as subspecialists. They will naturally score lower on endoscopy-heavy domains but higher on hepatitis screening, which is expected.


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners (primary) + Medicaid Provider Spending (supplementary)
**Join:** On NPI (npi in Medicare, servicing_npi in Medicaid)
**Aggregate:** Sum across all months in the measurement year (e.g., 2023) to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes. Medicare and Medicaid claims are additive.

**GI-specific note:** For gastroenterology, Medicare is the primary file (not Medicaid). Most GI patients are Medicare-age adults. The Medicaid file adds younger adults and disability populations but carries less volume for most GI providers.


### Geographic Grouping for Percentile Scoring

Several measures in this document use percentile ranking ("rank this provider against all other GI providers"). The peer cohort for percentile scoring should be grouped by geography:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All GI NPIs (taxonomy 207RG0100X, >= 50 services) in the same state | Primary scoring. A provider in TX is ranked against TX peers. |
| **National** (fallback) | All qualifying GI NPIs across all states | When the state has fewer than 30 GI providers. GI is a specialty, so small states may not have enough for stable percentiles. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | Urban vs. rural comparison. Not implemented now, but the output schema carries the fields to support it later. |

The peer cohort used for percentile ranks directly affects scores. A provider at the 80th percentile in a high-volume state might be at the 60th nationally. The output records which cohort was used.


---

### DOMAIN 1: Colorectal Cancer Screening & Surveillance (Weight: 35%)


**Measure 1A: Colonoscopy Volume per Beneficiary**

What it answers: Relative to their patient panel, how many colonoscopies does this provider perform?

```
colonoscopy_codes = [45378, 45380, 45384, 45385, 45386, 45388, 45390, G0121, G0105]

total_colonoscopies = SUM(total_services) WHERE hcpcs_code IN colonoscopy_codes
total_provider_beneficiaries = (from Medicare "By Provider" file or estimated from
    MAX(total_beneficiaries) across all HCPCS codes for this NPI)

metric = total_colonoscopies / total_provider_beneficiaries
```

ACG/USPSTF standard: CRC screening colonoscopy recommended for all average-risk adults starting at age 45. The Medicare population is overwhelmingly eligible. A GI provider with a large patient panel should be performing colonoscopies at a rate consistent with screening guidelines.

Score: Percentile rank of `metric` among all GI NPIs in the state. 90th percentile = score of 90.

Edge cases:
- If `total_provider_beneficiaries` = 0, no patient data. Mark as insufficient.
- If `total_colonoscopies` < 10, insufficient procedure volume to characterize practice. Mark as insufficient.
- Hepatologists will have low colonoscopy volume. Flag subspecialists; do not penalize.


**Measure 1B: Polypectomy-to-Colonoscopy Ratio (ADR Proxy)**

What it answers: When this provider performs a colonoscopy, how often do they find and remove polyps?

```
polypectomy_codes = [45385, 45384, 45390]
all_colonoscopy_codes = [45378, 45380, 45384, 45385, 45386, 45388, 45390, G0121, G0105]

polypectomy_services = SUM(total_services) WHERE hcpcs_code IN polypectomy_codes
total_colonoscopy_services = SUM(total_services) WHERE hcpcs_code IN all_colonoscopy_codes

metric = polypectomy_services / total_colonoscopy_services
```

ACG/ASGE standard: Adenoma detection rate (ADR) should be at least 25%. ADR is the single most important colonoscopy quality metric. We cannot measure ADR directly (requires pathology), but the polypectomy ratio is a recognized proxy. Studies have shown that polypectomy rates correlate with ADR, though imperfectly. A provider who removes polyps in 30-40% of colonoscopies likely has a higher ADR than one who does so in 10%.

Score: Percentile rank of `metric` among peers. The 90th percentile polypectomy ratio scores 90.

Edge cases:
- If `total_colonoscopy_services` < 30, insufficient volume for a stable ratio. Mark as insufficient.
- Very high ratios (>60%) may indicate a surveillance-heavy practice (patients referred specifically for known polyps) rather than high-quality screening detection. We note this but do not penalize, because the data cannot distinguish the two.

Caveat: This is an imperfect proxy. A provider could have a high polypectomy rate because they remove hyperplastic polyps aggressively (which does not improve ADR) or because they see high-risk patients. Without pathology, we cannot refine further.


**Measure 1C: Screening Code Utilization**

What it answers: Does this provider use screening-specific billing codes, suggesting intentional CRC screening activity?

```
screening_codes = [G0121, G0105]
all_colonoscopy_codes = [45378, 45380, 45384, 45385, 45386, 45388, 45390, G0121, G0105]

screening_services = SUM(total_services) WHERE hcpcs_code IN screening_codes
total_colonoscopy_services = SUM(total_services) WHERE hcpcs_code IN all_colonoscopy_codes

metric = screening_services / total_colonoscopy_services
```

Note: G0121 and G0105 are CMS-specific screening codes. Their presence in billing indicates the provider is explicitly coding for CRC screening (not just diagnostic colonoscopy). Some providers may have switched to using standard 4537x codes with modifiers for screening, so a low G-code rate does not necessarily mean low screening activity. This measure is supplementary.

Score: Percentile rank of `metric` among peers, but weighted lower than 1A and 1B.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.35) + (measure_1b * 0.45) + (measure_1c * 0.20)
```

Polypectomy ratio (1B) gets the highest weight because it is the closest proxy for ADR, which is the most clinically meaningful CRC quality metric.


---

### DOMAIN 2: Upper GI Evaluation & Barrett's Surveillance (Weight: 25%)


**Measure 2A: EGD Volume per Beneficiary**

What it answers: Relative to their patient panel, how active is this provider in upper GI evaluation?

```
egd_codes = [43235, 43239, 43249, 43233, 43248, 43250, 43251]

total_egd = SUM(total_services) WHERE hcpcs_code IN egd_codes
total_provider_beneficiaries = (estimated from provider-level data)

metric = total_egd / total_provider_beneficiaries
```

ACG standard: EGD should be performed when clinically indicated (alarm symptoms, Barrett's surveillance, refractory GERD). This is not a "more is better" measure in the same way colonoscopy volume is. However, a GI provider who performs essentially no upper endoscopy may not be managing upper GI disease per guidelines.

Score: Percentile rank of `metric` among peers. This measures practice pattern, not "more = better."

Edge cases:
- If `total_provider_beneficiaries` = 0, mark as insufficient.
- Providers who are exclusively colonoscopists (e.g., ambulatory surgery center-focused screening practices) will have low EGD volume. This is a known limitation.


**Measure 2B: Biopsy-to-EGD Ratio**

What it answers: When this provider performs an EGD, how often do they take biopsies?

```
biopsy_egd = SUM(total_services) WHERE hcpcs_code = 43239
total_egd = SUM(total_services) WHERE hcpcs_code IN [43235, 43239, 43249, 43233, 43248, 43250, 43251]

metric = biopsy_egd / total_egd
```

ACG standard: Barrett's esophagus surveillance requires systematic 4-quadrant biopsies (Seattle protocol). Eosinophilic esophagitis evaluation requires biopsies. Gastric intestinal metaplasia assessment requires biopsies. A provider following these guidelines will have a meaningfully higher biopsy-during-EGD rate than one who performs purely diagnostic "look and see" endoscopies.

Score: Percentile rank of `metric` among peers.

Edge cases:
- If `total_egd` < 20, insufficient volume. Mark as insufficient.
- A very high biopsy rate (>90%) is not concerning; it suggests thorough practice.


**Measure 2C: Therapeutic Intervention Rate**

What it answers: Does this provider perform therapeutic procedures during EGD when appropriate?

```
therapeutic_egd_codes = [43249, 43233, 43248, 43250, 43251]
total_egd = SUM(total_services) WHERE hcpcs_code IN [43235, 43239, 43249, 43233, 43248, 43250, 43251]

therapeutic_services = SUM(total_services) WHERE hcpcs_code IN therapeutic_egd_codes
metric = therapeutic_services / total_egd
```

This is a practice pattern indicator. Providers who perform dilations and polyp removals during EGD are more likely managing complex upper GI disease per guidelines. This measure is supplementary and gets lower weight.

Score: Percentile rank of `metric` among peers.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.30) + (measure_2b * 0.50) + (measure_2c * 0.20)
```

Biopsy ratio (2B) gets the highest weight because it is the strongest proxy for adherence to Barrett's surveillance and systematic tissue sampling guidelines.


---

### DOMAIN 3: Hepatitis & Liver Disease Screening (Weight: 20%)


**Measure 3A: Hepatitis Screening Presence (Binary)**

What it answers: Does this GI provider order hepatitis screening at all?

```
hepatitis_codes = [87340, 87341, 86803, 86804, 87520, 87521, 87522, 80076, 82977]

hepatitis_services = SUM(total_services) WHERE hcpcs_code IN hepatitis_codes

metric_binary = 1 IF hepatitis_services > 0 ELSE 0
```

USPSTF/AASLD standard: Universal HCV screening for all adults 18-79. Universal HBV screening for all adults. A gastroenterologist should be ordering these tests. Many GI practices are endoscopy-focused and do not order lab work (labs are ordered by primary care). But guideline-concordant GI care includes hepatitis screening, especially in a specialty that manages liver disease.

Score: Binary. 100 if the provider bills any hepatitis code, 0 if not.


**Measure 3B: Hepatitis Screening Volume Rate**

What it answers: Among providers who DO screen, how actively do they screen?

```
hepatitis_screen_codes = [86803, 86804, 87340, 87341]   -- antibody/antigen screening
total_provider_beneficiaries = (estimated)

metric = SUM(total_services) WHERE hcpcs_code IN hepatitis_screen_codes
         / total_provider_beneficiaries
```

Score: Percentile rank of `metric` among GI providers who have metric_binary = 1. Providers who do not screen at all are excluded from the percentile calculation (they already score 0 on Measure 3A).

Edge cases:
- Lab codes may be billed by the lab, not the ordering provider. If the GI provider orders hepatitis screening but the lab bills under its own NPI, the GI provider's score will undercount. This is a known limitation.
- If `total_provider_beneficiaries` < 20, mark as insufficient.


**Measure 3C: Confirmatory Testing Follow-Through**

What it answers: When this provider orders a hepatitis C antibody screen, do they follow through with RNA confirmatory testing?

```
hcv_antibody = SUM(total_services) WHERE hcpcs_code IN [86803, 86804]
hcv_rna = SUM(total_services) WHERE hcpcs_code IN [87520, 87521, 87522]

metric = hcv_rna / hcv_antibody   (if hcv_antibody > 0)
```

AASLD standard: A positive HCV antibody should be followed by HCV RNA quantitative testing to confirm active infection. A provider who orders antibody tests but never orders RNA tests may not be completing the diagnostic pathway.

Score: Percentile rank of `metric` among providers with hcv_antibody > 0.

Edge cases:
- If `hcv_antibody` = 0, skip this measure.
- A ratio > 1.0 is possible (RNA monitoring for known HCV patients), which is fine and not penalized.


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.30) + (measure_3b * 0.40) + (measure_3c * 0.30)
```


---

### DOMAIN 4: H. pylori Testing & Management (Weight: 20%)


**Measure 4A: H. pylori Testing Volume**

What it answers: Does this provider test for H. pylori, and how often?

```
hpylori_codes = [87338, 86677, 83009, 83013, 83014]

hpylori_services = SUM(total_services) WHERE hcpcs_code IN hpylori_codes
total_provider_beneficiaries = (estimated)

metric_binary = 1 IF hpylori_services > 0 ELSE 0
metric_rate = hpylori_services / total_provider_beneficiaries
```

ACG standard: Test-and-treat for H. pylori is recommended for patients with uninvestigated dyspepsia, active or history of peptic ulcer disease, and several other indications. A GI provider should be ordering H. pylori testing at a meaningful rate.

Score: Binary (30%) + rate percentile among those who test (70%).

Edge cases:
- If `total_provider_beneficiaries` < 20, mark as insufficient.
- Endoscopy-only practices may not order standalone H. pylori tests (they biopsy during EGD instead). The EGD biopsy (43239) may include CLO testing, but we cannot distinguish CLO from other biopsy indications.


**Measure 4B: Non-Invasive Test Preference**

What it answers: When this provider tests for H. pylori, do they prefer guideline-recommended non-invasive methods?

```
noninvasive_hpylori = SUM(total_services) WHERE hcpcs_code IN [87338, 83009, 83013, 83014]
serology_hpylori = SUM(total_services) WHERE hcpcs_code = 86677
total_hpylori = noninvasive_hpylori + serology_hpylori

metric = noninvasive_hpylori / total_hpylori   (if total_hpylori > 0)
```

ACG standard: Stool antigen (87338) and urea breath test (83009/83013) are preferred over serology (86677) for H. pylori diagnosis. Serology cannot distinguish active from past infection and is considered an inferior test in the ACG 2017/2024 guidelines. A provider who predominantly uses stool antigen or breath test is more guideline-concordant.

Score: Percentile rank of `metric` among providers with total_hpylori > 0. Higher non-invasive fraction = higher score.

Edge cases:
- If `total_hpylori` < 10, insufficient volume. Mark as insufficient.
- A metric of 1.0 (all non-invasive) is the ideal.


**Domain 4 Score:**

```
domain_4 = (measure_4a * 0.60) + (measure_4b * 0.40)
```


---

### Composite Score

```
composite = (domain_1 * 0.35) + (domain_2 * 0.25) + (domain_3 * 0.20) + (domain_4 * 0.20)
```

Range: 0 to 100.

**Minimum data requirement:** A provider must have scores in at least 2 of 4 domains to receive a composite. If only 1 domain is scorable, output: "insufficient data."

**If a domain is missing:** Redistribute its weight proportionally among the remaining domains. Example: if Domain 3 is missing (no hepatitis data) and Domain 4 is missing (no H. pylori data), the composite becomes:

```
adjusted_weight_1 = 0.35 / (0.35 + 0.25) = 0.583
adjusted_weight_2 = 0.25 / (0.35 + 0.25) = 0.417

composite = (domain_1 * 0.583) + (domain_2 * 0.417)
```


---

### Worked Examples

**Example 1: High-Scoring GI Provider (Dr. A, Score: 87)**

Dr. A is a gastroenterologist in Texas. In 2023:
- Performed 1,200 colonoscopies across 950 beneficiaries (high volume, 92nd percentile in TX)
- Polypectomy rate: 38% of colonoscopies involved polypectomy (88th percentile -- strong ADR proxy)
- Screening G-code usage: 25% of colonoscopies billed as screening (75th percentile)
- EGD volume: 400 EGDs across 350 beneficiaries (70th percentile)
- Biopsy-during-EGD rate: 72% (85th percentile -- suggests good Barrett's surveillance practices)
- Therapeutic EGD rate: 18% (60th percentile)
- Hepatitis screening: Yes, bills 86803 and 87521 regularly (binary = 100, volume 80th percentile, confirmatory ratio 90th percentile)
- H. pylori testing: Bills 87338 (stool antigen) frequently (binary = 100, rate 75th percentile, non-invasive preference 95th percentile)

```
Domain 1: (92 * 0.35) + (88 * 0.45) + (75 * 0.20) = 32.2 + 39.6 + 15.0 = 86.8
Domain 2: (70 * 0.30) + (85 * 0.50) + (60 * 0.20) = 21.0 + 42.5 + 12.0 = 75.5
Domain 3: (100 * 0.30) + (80 * 0.40) + (90 * 0.30) = 30.0 + 32.0 + 27.0 = 89.0
Domain 4: (100*0.30 + 75*0.70) * 0.60 + (95 * 0.40) = (30+52.5)*0.60 + 38.0 = 49.5 + 38.0 = 87.5

Composite: (86.8 * 0.35) + (75.5 * 0.25) + (89.0 * 0.20) + (87.5 * 0.20)
         = 30.4 + 18.9 + 17.8 + 17.5 = 84.6
```

Dr. A scores well across all domains: high colonoscopy volume with good polypectomy rates, active EGD practice with biopsies, hepatitis screening with follow-through, and guideline-concordant H. pylori testing.


**Example 2: Medium-Scoring GI Provider (Dr. B, Score: 58)**

Dr. B is a gastroenterologist in Ohio. In 2023:
- Performed 600 colonoscopies across 500 beneficiaries (55th percentile)
- Polypectomy rate: 22% (35th percentile -- below the ADR proxy threshold)
- Screening G-code usage: 10% (30th percentile)
- EGD volume: 250 EGDs (50th percentile)
- Biopsy-during-EGD rate: 45% (40th percentile)
- Therapeutic EGD rate: 12% (45th percentile)
- Hepatitis screening: No hepatitis codes billed at all (binary = 0)
- H. pylori testing: Bills 86677 (serology) only (binary = 100, rate 40th percentile, non-invasive preference: 0th percentile because all tests are serology)

```
Domain 1: (55 * 0.35) + (35 * 0.45) + (30 * 0.20) = 19.3 + 15.8 + 6.0 = 41.0
Domain 2: (50 * 0.30) + (40 * 0.50) + (45 * 0.20) = 15.0 + 20.0 + 9.0 = 44.0
Domain 3: (0 * 0.30) + (0 * 0.40) + (0 * 0.30) = 0.0 (no hepatitis screening at all)
Domain 4: (100*0.30 + 40*0.70) * 0.60 + (0 * 0.40) = (30+28)*0.60 + 0 = 34.8

Composite: (41.0 * 0.35) + (44.0 * 0.25) + (0.0 * 0.20) + (34.8 * 0.20)
         = 14.4 + 11.0 + 0.0 + 7.0 = 32.3
```

Dr. B's low score reflects: below-average polypectomy rates (possible low ADR), no hepatitis screening (completely absent), and reliance on serology for H. pylori (guideline-discordant). The zero on Domain 3 is particularly punishing.


**Example 3: Low-Scoring GI Provider (Dr. C, Score: 22)**

Dr. C is a gastroenterologist in a small state with limited procedure volume. In 2023:
- Performed 80 colonoscopies across 70 beneficiaries (15th percentile)
- Polypectomy rate: 12% (10th percentile)
- Screening G-code usage: 5% (10th percentile)
- EGD volume: 30 EGDs (10th percentile)
- Biopsy-during-EGD rate: 25% (15th percentile)
- Therapeutic EGD rate: 5% (10th percentile)
- Hepatitis screening: No codes billed (binary = 0)
- H. pylori testing: No codes billed (binary = 0)

```
Domain 1: (15 * 0.35) + (10 * 0.45) + (10 * 0.20) = 5.3 + 4.5 + 2.0 = 11.8
Domain 2: (10 * 0.30) + (15 * 0.50) + (10 * 0.20) = 3.0 + 7.5 + 2.0 = 12.5
Domain 3: 0.0
Domain 4: 0.0

Composite: (11.8 * 0.35) + (12.5 * 0.25) + (0.0 * 0.20) + (0.0 * 0.20)
         = 4.1 + 3.1 + 0.0 + 0.0 = 7.3
```

Dr. C may be semi-retired, part-time, or primarily managing a non-procedural GI practice (e.g., IBD medication management, which we cannot see). Alternatively, this provider may genuinely have a low-quality practice. The score is honest about the signal: very low procedural volume, low polypectomy rates, no screening test ordering. But we acknowledge we may be missing non-procedural care that does not show up in claims.


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **GIQuIC (GI Quality Improvement Consortium)** | Membership required (ACG/ASGE) | True ADR, cecal intubation rate, bowel prep quality, withdrawal time. The gold standard for endoscopy quality. | +5 guidelines. Upgrades CRC domain from proxy to direct measurement. ADR alone is worth more than everything else we measure. |
| **State APCD (All-Payer Claims Database)** | $5-15K depending on state, 2-8 weeks | Individual patient-level claims with diagnosis codes AND Rx data across ALL payers. Inpatient + outpatient. | +15 guidelines. Unlocks: PPI appropriateness (Rx data), IBD medication management (biologics + immunomodulators), appropriate screening intervals (patient-level timeline), diagnosis-linked procedure indication. |
| **Pathology lab data** | Varies, often requires institutional partnership | Histology results for biopsies and polypectomies. | +5 guidelines. Unlocks: true ADR, Barrett's dysplasia grading, H. pylori CLO test results, celiac biopsy interpretation. |
| **Pharmacy claims (Part D / PBM)** | $5-10K or Part D prescriber file (free but limited) | Prescription fills, medication adherence. | +8 guidelines. Unlocks: PPI deprescribing, IBD biologic adherence, HCV antiviral treatment initiation, H. pylori antibiotic selection. |
| **Medicaid T-MSIS Full Access** | Restricted (DUA required) | National Medicaid claims at the claim line level. Patient-level, dx codes, Rx data, institutional. | Same as state APCD for Medicaid population. |


### Unlock Path

| Stage | Data | Guidelines Scorable | Composite Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Provider Spending + NPPES | ~10 of 35 | 4 of 4 domains (partial, proxy-based) |
| +Part D Prescriber File (free) | Add prescription volume by drug | ~14 of 35 | 4 of 4 domains (adds PPI and antiviral signal) |
| +State APCD ($5-15K) | Add patient-level claims with dx and Rx | ~28 of 35 | 4 of 4 domains (most guidelines become directly measurable) |
| +GIQuIC (membership) | Add endoscopy quality metrics | ~33 of 35 | 4 of 4 domains (endoscopy quality becomes gold standard) |
| Full (all above + pathology) | Everything | ~35 of 35 | Comprehensive |


---

# PART C: HOW THIS FITS WITH THE OTHER FOUR DIMENSIONS

---


## 6. What Each Dimension Catches

This guideline concordance score is Dimension 1 of a 5-dimension quality scoring system. Here is what each dimension adds that guideline concordance misses:

| Dimension | What It Measures | What It Catches That Guideline Concordance Misses |
|---|---|---|
| **1. Guideline Concordance (this document)** | Does the provider's billing pattern match ACG/AGA/ASGE guidelines? | N/A -- this is the baseline. |
| **2. Cost Efficiency** | Is the provider's spending per beneficiary appropriate? | Over-utilization. A provider who performs excessive colonoscopies (short intervals, no clinical indication) will score HIGH on Dimension 1 volume but LOW on Dimension 2 cost. This is an important check. |
| **3. Patient Complexity** | How sick are this provider's patients? | Case-mix adjustment. A hepatologist managing cirrhosis patients will have different billing patterns than a screening colonoscopist. Dimension 3 contextualizes the utilization pattern. |
| **4. Network Position** | How connected is this provider to other high-quality providers? | Referral appropriateness. Does the GI provider refer complex cases to surgeons, oncologists, hepatologists? Claims cannot see the referral, but network analysis can infer it. |
| **5. Longitudinal Consistency** | Is the provider's quality stable over time? | One good year vs. sustained excellence. A provider with high colonoscopy volume in 2023 but low volume in 2021-2022 is different from one who is consistently high. |


---

# PART D: RISKS AND LIMITATIONS

---


## 7. Risks

**We are scoring utilization patterns, not clinical quality.** The free data tells us what a provider billed. It does not tell us whether the care was appropriate, timely, or effective. A high polypectomy rate means the provider removes polyps frequently. It does not confirm the polyps were adenomas or that removal prevented cancer.

**ADR is the gold standard for colonoscopy quality, and we cannot measure it.** The polypectomy-to-colonoscopy ratio is a recognized but imperfect proxy. A provider could have a high polypectomy rate by removing hyperplastic polyps (clinically unnecessary) or a low polypectomy rate because they primarily see young, healthy screening patients. Without pathology, we cannot refine.

**Medicaid file has no diagnosis codes.** We cannot determine whether a colonoscopy was for screening vs. diagnostic workup of symptoms. We cannot determine whether hepatitis screening was risk-appropriate. We cannot identify IBD patients, cirrhosis patients, or other high-risk populations.

**No prescription data.** PPI management is one of the most impactful GI quality domains (millions of patients on long-term PPIs, many inappropriately). Biologics for IBD, antivirals for hepatitis C, and antibiotics for H. pylori are all invisible. This blinds us to the entire medical (non-procedural) side of GI practice.

**Data is aggregated, not patient-level.** We cannot measure screening intervals. We cannot track whether a patient with adenomas returned for surveillance colonoscopy at 3 years vs. 10 years. Interval appropriateness is a core guideline metric and it is completely dark.

**GI subspecialists score differently.** A hepatologist who manages liver disease medically will score low on Domains 1 and 2 (endoscopy-focused) but may score high on Domain 3 (hepatitis screening). A motility specialist may score low on everything procedural. We flag subspecialists and note this limitation, but the composite may not fairly represent their practice quality.

**Procedure volume does not equal quality.** A high-volume colonoscopist is not necessarily a high-quality one. Volume is a necessary but insufficient condition. The polypectomy ratio helps, but the true quality metric (ADR) requires pathology data we do not have.

**Lab codes may be billed by the lab, not the ordering provider.** Hepatitis screening, H. pylori testing, and hepatic function panels may show up under the lab's NPI, not the GI provider who ordered them. This systematically undercounts screening activity for providers who use external reference labs.

**The Medicaid Provider Spending dataset is new and potentially unstable.** Released February 2026, temporarily unavailable as of late March 2026. Data quality documentation is limited. Filtering is required to exclude non-clinical entities.

**Rebuild annually.** CMS data is updated annually. Scores should be recomputed each year with fresh data. Year-over-year trends (Dimension 5) require multi-year scoring.


---

# PART E: OUTPUT SCHEMA

---


## 8. Output Schema (per NPI)

One row per NPI. Structured table. Output as parquet + CSV.

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code (metro/micro area), derived from ZIP |
| taxonomy_code | string | From NPPES (207RG0100X for general GI) |
| is_subspecialist | boolean | True if taxonomy is hepatology (207RI0011X) or other GI subspecialty |
| geo_group_level | string | "state" or "national" -- which peer cohort was used for percentile ranks |
| percentile_cohort_state | string | State of the peer cohort used (or "US" if national fallback) |
| percentile_cohort_size | int | Number of peers in the cohort |
| total_beneficiaries | int | Estimated total unique patients (from provider-level file) |
| total_services | int | Total claim lines across all codes |
| colonoscopy_volume | int | Total colonoscopy services (all 4537x + G codes) |
| polypectomy_volume | int | Total polypectomy services (45384, 45385, 45390) |
| polypectomy_ratio | float | Measure 1B metric (polypectomy / total colonoscopy) |
| screening_code_ratio | float | Measure 1C metric (G-codes / total colonoscopy) |
| domain_1_score | float | CRC Screening & Surveillance domain (0-100) |
| egd_volume | int | Total EGD services (all 4323x-4325x codes) |
| egd_biopsy_ratio | float | Measure 2B metric (43239 / total EGD) |
| egd_therapeutic_ratio | float | Measure 2C metric |
| domain_2_score | float | Upper GI / Barrett's domain (0-100) |
| hepatitis_screening_binary | boolean | Measure 3A: does provider bill any hepatitis codes |
| hepatitis_screening_rate | float | Measure 3B metric |
| hcv_confirmatory_ratio | float | Measure 3C metric (RNA / antibody) |
| domain_3_score | float | Hepatitis & Liver Disease domain (0-100) |
| hpylori_testing_binary | boolean | Measure 4A: does provider bill any H. pylori codes |
| hpylori_testing_rate | float | Measure 4A rate metric |
| hpylori_noninvasive_ratio | float | Measure 4B metric (non-invasive / total H. pylori tests) |
| domain_4_score | float | H. pylori domain (0-100) |
| composite_score | float | Weighted composite (0-100), null if insufficient data |
| scorable_domains | int | Number of domains with enough data to score (0-4) |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |
| measurement_year | int | Year of the claims data used |
| score_date | date | Date the score was computed |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing volume and procedural ratios as proxies for clinical practice quality. This is real data from credible sources, but it does not directly measure the thing guidelines are asking for (e.g., "does this provider have an ADR above 25%?" vs. "does this provider's polypectomy rate suggest they find polyps at a rate consistent with adequate adenoma detection"). The gap between proxy and direct measurement is wider in gastroenterology than in some other specialties because the most important quality metrics (ADR, bowel prep quality, screening interval appropriateness) all require data types not available in claims.


---

## Appendix: Major GI Guideline Scorability Crosswalk

| Guideline / Measure | Source | Scorable Now? | What's Missing |
|---|---|---|---|
| CRC screening colonoscopy at age 45+ | ACG 2021, USPSTF 2021 | Partial (volume proxy) | Patient age confirmation in Medicaid, individual screening history |
| Adenoma detection rate >= 25% | ACG/ASGE Quality Indicators | No | Pathology reports (histology) |
| Cecal intubation rate >= 95% | ACG/ASGE Quality Indicators | No | Not coded in claims |
| Adequate bowel prep rate | ACG/ASGE Quality Indicators | No | Not coded in claims |
| Post-polypectomy surveillance intervals | ACG 2020 | No | Patient-level timeline, polyp histology |
| Withdrawal time >= 6 minutes | ASGE Quality Indicators | No | Not coded in claims |
| Barrett's surveillance biopsies (Seattle protocol) | ACG 2022 | Partial (biopsy ratio proxy) | Biopsy count per case, segment length |
| Barrett's surveillance intervals by dysplasia status | ACG 2022 | No | Pathology (dysplasia grading), patient-level timeline |
| GERD management / PPI appropriateness | ACG 2022 | No | Prescription data |
| PPI deprescribing | AGA 2017 | No | Prescription data |
| H. pylori test-and-treat (non-invasive preferred) | ACG 2017/2024 | Partial (test preference ratio) | Cannot confirm eradication |
| H. pylori eradication confirmation (test-of-cure) | ACG 2017/2024 | No | Patient-level linkage for sequential tests |
| Universal HCV screening | USPSTF 2020, CDC | Partial (ordering volume) | Risk appropriateness, treatment initiation |
| HCV treatment and SVR | AASLD/IDSA | No | Prescription data, lab results |
| Universal HBV screening | USPSTF 2020 | Partial (ordering volume) | Treatment initiation, vaccination follow-up |
| HCC surveillance in cirrhosis (q6mo US + AFP) | AASLD 2023 | No | Diagnosis codes (cirrhosis), imaging linkage |
| IBD biologic therapy optimization | AGA 2021 | No | Prescription data |
| IBD steroid-sparing therapy | AGA 2020 | No | Prescription data |
| Celiac disease diagnosis (TTG-IgA + biopsy) | ACG 2023 | No | Serology-pathology linkage |
| NAFLD/MASLD risk stratification | AASLD 2023 | No | Diagnosis codes, FIB-4 lab values |
| Alcohol-related liver disease screening | ACG 2018 | No | Diagnosis codes, screening tool data |
| EoE diagnosis and management | ACG/AGA 2022 | No | Pathology (eosinophil count), Rx data |
| Colon cancer post-resection surveillance | ACG/NCCN | No | Surgical history, patient-level timeline |
| ERCP quality metrics | ASGE 2015 | No | Procedure reports, complication data |
| Capsule endoscopy appropriateness | ACG 2017 | No | Clinical indication (no dx codes) |
| FIT/stool-based screening coordination | USPSTF 2021 | Partial (if GI orders 82274) | Whether FIT was done instead of colonoscopy |
| Colorectal cancer screening in average-risk population coverage | CMS quality measures | Partial (G-code volume) | Denominator (eligible population) |
