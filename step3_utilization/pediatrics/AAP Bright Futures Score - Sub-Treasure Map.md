# Pediatric Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a pediatric provider actually did: every visit, every screening, every vaccine. AAP and Bright Futures tell you what that provider should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.


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
| Provider specialty | Taxonomy-derived specialty (Pediatrics = 208000000X) |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The pediatric problem:** Medicare covers almost no children. Most kids are on Medicaid/CHIP (~40% of U.S. children) or commercial insurance. The Medicare file will show pediatric providers who also see Medicare patients (some do, especially those seeing young adults aging out of pediatric care or dual-eligible patients), but the volume is low. This file is more useful for identifying provider practice patterns than for measuring pediatric-specific quality.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. This is where the pediatric signal lives.

| Field | What It Tells Us |
|---|---|
| NPI (billing provider) | Who billed for the service |
| NPI (servicing provider) | Who performed the service |
| HCPCS procedure code | What they did |
| Month/year | When (2018-2024) |
| Beneficiary count | How many unique patients for that procedure in that month |
| Claim count | How many claims |
| Total spending | Dollars paid |

Covers both fee-for-service AND managed care Medicaid claims, plus CHIP.

**What it does NOT have:**

| Missing Field | What We Lose |
|---|---|
| ICD-10 diagnosis codes | Cannot link procedures to clinical reasons. Cannot tell if an antibiotic was prescribed for a viral vs. bacterial infection. |
| NDC drug codes | Cannot see prescriptions. No asthma medication ratio, no ADHD medication tracking, no antipsychotic monitoring. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track post-discharge or post-ED follow-up. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual patient journeys or timelines. |
| Service location details | Limited place-of-service information. |

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every pediatric provider by NPI, taxonomy code (208000000X = Pediatrics, plus subspecialty codes), practice address, and organizational affiliation. Free, always available. This is how we build the provider roster.


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given pediatric provider:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what procedures they perform) | Why they performed them (no diagnosis codes in Medicaid file) |
| How often they bill each code (volume) | What they prescribed (no Rx data) |
| How many patients they see per procedure | Individual patient timelines or sequences |
| Whether they bill preventive visit codes | Whether patients were hospitalized or visited the ED |
| Whether they bill screening codes (96110, 96127, 83655) | Which specific screening tool was used for 96127 |
| Whether they administer vaccines (product codes) | Whether a patient completed a full vaccine series (no patient-level tracking) |
| Their practice location (NPPES) | How outcomes compare across their patient panel |


## 2. What the Codes Tell Us (Analysis on Available Data Only)

Every HCPCS code in the claims files is a fact about what happened. Here is what we can extract from the free data, organized by the quality signals they reveal.


### Well-Child Visits: Does This Provider Do Preventive Care?

| Code Range | Description | Visible In |
|---|---|---|
| 99381-99385 | New patient preventive visit, by age group | Medicare + Medicaid |
| 99391-99395 | Established patient preventive visit, by age group | Medicare + Medicaid |
| 99460-99463 | Newborn care (initial and subsequent hospital days) | Medicare (maybe), Medicaid unclear (institutional) |

**What we can measure:** For each pediatric NPI, we can count the total number of preventive visit claims (99381-99395) and the total number of beneficiaries seen for those codes. We can calculate:
- Preventive visit volume per provider
- Ratio of preventive visits to total visits (preventive visits as % of all E/M services)
- Which age-specific preventive codes they bill (tells us the age distribution of their panel)

**What we cannot measure:** Whether a specific child got the recommended number of visits (6 by 15 months, annual after age 3). We see provider-level aggregates, not individual patient visit counts.

**What AAP says should happen:** Bright Futures Periodicity Schedule recommends 12 well-child visits in the first 3 years (6 in the first 15 months, 2 more by 30 months), then annually through age 21. CMS measures this as W30-CH (first 30 months) and WCV-CH (ages 3-21).

**How we score it:** Percentile ranking. We rank each provider's preventive-visit-to-total-visit ratio against all other pediatric providers in the state. A provider in the 90th percentile for preventive care volume scores 90.


### Immunizations: Does This Provider Vaccinate?

| Code Range | Description | Visible In |
|---|---|---|
| 90460-90461 | Immunization administration through age 18 (with counseling) | Medicare + Medicaid |
| 90471-90474 | Immunization administration (any age) | Medicare + Medicaid |
| 90633 | Hepatitis A vaccine | Medicare + Medicaid |
| 90647-90648 | HiB vaccine | Medicare + Medicaid |
| 90670 | PCV13 vaccine | Medicare + Medicaid |
| 90680-90681 | Rotavirus vaccine | Medicare + Medicaid |
| 90696, 90700 | DTaP / DTaP-IPV combination | Medicare + Medicaid |
| 90707, 90710 | MMR / MMRV vaccine | Medicare + Medicaid |
| 90713 | IPV vaccine | Medicare + Medicaid |
| 90715 | Tdap (adolescent booster) | Medicare + Medicaid |
| 90716 | Varicella (VZV) vaccine | Medicare + Medicaid |
| 90723 | DTaP-HepB-IPV combination | Medicare + Medicaid |
| 90734 | Meningococcal vaccine | Medicare + Medicaid |
| 90744 | Hepatitis B (pediatric) | Medicare + Medicaid |
| 90649-90651 | HPV vaccine | Medicare + Medicaid |

**What we can measure:** For each pediatric NPI, we can see which vaccine products they administer and in what volume. We can calculate:
- Total immunization administrations per provider
- Immunization volume per beneficiary (are they giving vaccines to most of their patients?)
- Which specific vaccines they administer (do they cover the full ACIP schedule or skip certain vaccines?)
- Vaccine breadth: number of distinct vaccine product codes billed (a proxy for schedule completeness)

**What we cannot measure:** Whether a specific child completed the full Combo 10 series by age 2. We see provider totals, not patient-level completion rates.

**What AAP says should happen:** By age 2, a child should have received 4 DTaP, 3 IPV, 1 MMR, 3 HiB, 3 HepB, 1 VZV, 4 PCV, 2 HepA, 2-3 Rotavirus, and 2 Influenza doses (CIS-CH Combo 10). By age 13: meningococcal, Tdap, and HPV series (IMA-CH Combo 2).

**How we score it:** Two sub-scores. (1) Vaccine breadth: does the provider bill for all 10+ vaccine products in the ACIP schedule? Missing products score lower. (2) Immunization volume per beneficiary: ranked against peers. Combined into a single Immunization domain score.


### Developmental Screening: Does This Provider Screen?

| Code | Description | Visible In |
|---|---|---|
| 96110 | Developmental screening with standardized instrument (ASQ, PEDS, etc.) | Medicare + Medicaid |

**What we can measure:** Whether a provider bills 96110 at all, and how often relative to their panel size. A provider with 500 patients under age 3 who bills 96110 zero times is not screening. A provider who bills it 400+ times is likely screening most eligible patients.

**What we cannot measure:** Whether the screening happened at exactly 9, 18, and 30 months (no patient-level timeline). Which instrument was used (ASQ vs. PEDS vs. other).

**What AAP says should happen:** Developmental screening using a standardized instrument at 9, 18, and 30 months (DEV-CH).

**How we score it:** Ratio of 96110 claims to estimated eligible patients (beneficiaries seen for 99391, the under-1 and 1-4 age group preventive codes). Ranked against peers.


### Behavioral & Emotional Screening: Depression, Autism, ADHD, Maternal Depression

| Code | Description | Visible In |
|---|---|---|
| 96127 | Brief emotional/behavioral assessment (PHQ-A, M-CHAT, Vanderbilt, EPDS, PSC) | Medicare + Medicaid |

**What we can measure:** Whether a provider bills 96127 and in what volume. 96127 is the billing code for administering any brief standardized behavioral/emotional screening tool.

**What we cannot measure:** Which specific screening was performed. Without the paired ICD-10 diagnosis code (not available in the Medicaid file), we cannot distinguish between:
- Autism screening (M-CHAT) at 18/24 months
- Adolescent depression screening (PHQ-A) at 12-17 years
- ADHD assessment (Vanderbilt)
- Maternal depression screening (EPDS) at infant visits

We know the provider screens. We do not know what they screen for.

**What AAP says should happen:** Autism screening at 18 and 24 months. Depression screening annually ages 12-17 (CDF-CH). Maternal depression at 1, 2, 4, 6 month visits (PDS-CH).

**How we score it:** Volume of 96127 relative to panel size, ranked against peers. This is a blunt measure. It tells us "this provider does behavioral screening" but not "this provider screens for depression at the right age."


### Lead Screening: Does This Provider Test for Lead?

| Code | Description | Visible In |
|---|---|---|
| 83655 | Lead, blood (quantitative) | Medicare + Medicaid |

**What we can measure:** Whether a provider orders/performs blood lead testing and how often.

**What we cannot measure:** Whether the test was done by age 2 specifically (no patient age linkage in claims aggregates).

**What AAP says should happen:** Blood lead screening by 12 months and again by 24 months in high-risk populations (LSC-CH).

**How we score it:** Volume of 83655 relative to estimated panel under age 3. Ranked against peers.


### Weight Assessment & Counseling

| Code | Description | Visible In |
|---|---|---|
| Z68.51-Z68.54 | BMI pediatric percentile (ICD-10, used as secondary dx) | NOT visible (no dx codes in Medicaid file) |
| 97802-97804 | Medical nutrition therapy | Medicare + Medicaid |
| 99188 | Fluoride varnish (medical provider) | Medicare + Medicaid |

**What we can measure:** Whether a provider bills medical nutrition therapy codes. This is a weak signal: most BMI documentation happens within the well-child visit and is not separately billed.

**What we cannot measure:** Whether BMI percentile was documented (ICD-10 Z68.x codes not visible). Whether physical activity counseling occurred (usually documented in visit note, not separately billed).

**What AAP says should happen:** BMI percentile documentation, nutrition counseling, and physical activity counseling ages 3-17 (WCC-CH).

**How we score it:** Limited. Nutrition therapy volume only. This domain is weak with current data.


### Oral Health (Medical Provider Contribution)

| Code | Description | Visible In |
|---|---|---|
| 99188 | Fluoride varnish application by medical provider | Medicare + Medicaid |
| D0120-D0150 | Dental evaluation codes | Unlikely in medical claims files |
| D1206-D1208 | Topical fluoride (dental) | Unlikely in medical claims files |
| D1351 | Dental sealant | Unlikely in medical claims files |

**What we can measure:** Whether a pediatric medical provider applies fluoride varnish (99188). D-codes are dental procedure codes and typically appear in dental claims, not medical claims files.

**What AAP says should happen:** Fluoride for children ages 1-20 (TFL-CH). Annual dental eval (OEV-CH). Sealants on first molars (SFM-CH).

**How we score it:** 99188 volume only. Dental measures (OEV, SFM) are not scorable from medical claims.


## 3. What We Can and Cannot Score (Honest Assessment)

Out of the 6 quality domains and 47 AAP guidelines we identified in our research, here is what is scorable with the free CMS data:

| Domain | Weight | Scorable Guidelines | Not Scorable | Why Not |
|---|---|---|---|---|
| Preventive Care & Well-Child Visits | 25% | 3 of 10 (visit volume, visit ratio, age-group mix) | 7 | BMI, counseling, vision/hearing/BP screening not separately billed or require dx codes |
| Immunizations | 20% | 2 of 13 (vaccine breadth, immunization volume per beneficiary) | 11 | Cannot track individual patient series completion without patient-level data |
| Developmental & Behavioral Health | 20% | 2 of 10 (96110 volume, 96127 volume) | 8 | Cannot distinguish screening types without dx codes, cannot track ADHD medication |
| Acute Care Management | 15% | 0 of 7 | 7 | Requires dx codes (antibiotic appropriateness), Rx data (asthma meds), institutional claims (hospital follow-up) |
| Chronic Disease Management | 10% | 0 of 4 | 4 | Requires Rx data (antipsychotics, ADHD meds) and visit sequencing |
| Oral Health & Safety Screening | 10% | 2 of 3 (lead screening volume, fluoride varnish volume) | 1 | Dental D-codes not in medical claims |
| **Total** | | **9 of 47** | **38** | |

**Bottom line:** With free CMS data, we can score 9 guidelines. These concentrate in three areas: preventive visit patterns, immunization patterns, and screening volume (developmental, behavioral, lead, fluoride). We are blind to everything that requires diagnosis codes, prescription data, or individual patient timelines.

The 9 scorable guidelines still tell a meaningful story. A provider who does frequent well-child visits, administers a broad range of vaccines, screens for developmental delays, and tests for lead is practicing differently from one who does not. The score will not be a complete clinical quality assessment, but it is a defensible utilization profile.


## 4. Business Logic: How We Compare What They Did vs. What AAP Says

For a given NPI, here is exactly how we compute each measure. Every calculation uses only the free CMS data described in Section 1.


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code IN ('208000000X') — General Pediatrics. Optionally include subspecialty codes (Pediatric Cardiology 2080P0006X, etc.) but flag them as subspecialists.
**Filter by state:** provider_state = target state (e.g., 'MA')
**Output:** A table of pediatric NPIs with practice address, entity type, and taxonomy.

This is the denominator. Every NPI in this roster gets scored.


### Step 1: Load Claims for Each NPI

**Input:** Medicaid Provider Spending (primary) + Medicare Physician & Other Practitioners (supplementary)
**Join:** On NPI (servicing_npi in Medicaid, npi in Medicare)
**Aggregate:** Sum across all months in the measurement year (e.g., 2023) to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes. Medicare and Medicaid claims are additive.


### Geographic Grouping for Percentile Scoring

Several measures in this doc use percentile ranking ("rank this provider against all other pediatric providers"). The peer cohort for percentile scoring should be grouped by geography:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All pediatric NPIs (taxonomy 208000000X, >= 100 services) in the same state | Primary scoring. A provider in MA is ranked against MA peers. |
| **National** | All qualifying pediatric NPIs across all states | Cross-state benchmarking. Useful for answering "how does the MA pediatric workforce compare nationally?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | Urban vs. rural comparison. Not implemented now, but the output schema carries the fields to support it later. |

The peer cohort used for percentile ranks directly affects scores. A provider at the 80th percentile in a high-performing state might be at the 60th nationally. The output records which cohort was used.


---

### DOMAIN 1: Preventive Care & Well-Child Visits (Adjusted Weight: 40%)


**Measure 1A: Preventive Visit Ratio**

What it answers: What share of this provider's patient encounters are preventive well-child visits?

```
preventive_codes = [99381, 99382, 99383, 99384, 99385,   -- new patient
                    99391, 99392, 99393, 99394, 99395]   -- established patient

all_em_codes = [99201-99215, 99381-99395, 99460-99465]   -- all E/M + preventive + newborn

preventive_services = SUM(total_services) WHERE hcpcs_code IN preventive_codes
total_em_services   = SUM(total_services) WHERE hcpcs_code IN all_em_codes

metric = preventive_services / total_em_services
```

AAP standard: A pediatric practice following Bright Futures should have a high ratio of preventive to total visits, since well-child care is the backbone of pediatric practice.

Score: Percentile rank of `metric` among all pediatric NPIs in the state. 90th percentile = score of 90.

Edge cases:
- If `total_em_services` = 0, provider has no visit data. Mark as insufficient.
- If `total_em_services` < 10, insufficient volume. Mark as insufficient.


**Measure 1B: Age-Group Breadth**

What it answers: Does this provider see patients across the full pediatric age range, or only one segment?

```
age_group_codes = {
    'infant':     [99381, 99391],          -- under 1
    'early_child': [99382, 99392],         -- 1-4
    'late_child':  [99383, 99393],         -- 5-11
    'adolescent':  [99384, 99394],         -- 12-17
    'young_adult': [99385, 99395]          -- 18-21 (sometimes 18-39)
}

age_groups_with_visits = COUNT of age_group_codes keys WHERE
    SUM(total_services) for those codes > 0

metric = age_groups_with_visits   -- integer 0-5
```

AAP standard: Bright Futures periodicity schedule covers birth through 21. A general pediatric provider following the schedule should bill preventive visit codes across multiple age groups.

Score: `(age_groups_with_visits / 5) * 100`. Provider covering 4 of 5 age groups scores 80.

Note: Subspecialists (e.g., pediatric cardiologists) may legitimately serve only one age group. Flag subspecialists separately; do not penalize.


**Measure 1C: Preventive Visit Intensity**

What it answers: On average, how many preventive visits does each patient get per year from this provider?

```
preventive_beneficiaries = SUM(total_beneficiaries) WHERE hcpcs_code IN preventive_codes
    (note: use MAX across codes, not SUM, to avoid double-counting patients
     seen for multiple preventive codes. If not possible with aggregated data,
     use total_beneficiaries from the single most-billed preventive code as proxy)

metric = preventive_services / preventive_beneficiaries
```

AAP standard: Bright Futures recommends 6 visits in the first 15 months alone. Annualized across a mixed-age panel, a well-performing provider should average well above 1.0 preventive visits per patient per year.

Score: Percentile rank among peers.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.40) + (measure_1b * 0.30) + (measure_1c * 0.30)
```


---

### DOMAIN 2: Immunizations (Adjusted Weight: 35%)


**Measure 2A: Vaccine Product Breadth**

What it answers: Does this provider administer the full range of childhood vaccines, or only some?

```
acip_vaccine_products = {
    'DTaP':        [90696, 90700, 90723],
    'IPV':         [90696, 90713, 90723],
    'MMR':         [90707, 90710],
    'HiB':         [90647, 90648],
    'HepB':        [90723, 90744],
    'VZV':         [90710, 90716],
    'PCV':         [90670],
    'HepA':        [90633],
    'Rotavirus':   [90680, 90681],
    'Influenza':   [90685, 90686, 90687, 90688],
    'Tdap':        [90715],
    'Meningococcal': [90734],
    'HPV':         [90649, 90650, 90651]
}

products_administered = COUNT of acip_vaccine_products keys WHERE
    SUM(total_services) for ANY code in that product group > 0

metric = products_administered   -- integer 0-13
```

AAP standard: The ACIP childhood + adolescent schedule includes all 13 product groups. A provider following the full schedule should bill for most or all of them.

Score: `(products_administered / 13) * 100`. Provider administering 11 of 13 products scores 85.


**Measure 2B: Immunization Volume per Beneficiary**

What it answers: For the patients this provider sees, how many immunization administrations happen?

```
admin_codes = [90460, 90461, 90471, 90472, 90473, 90474]

total_admin_services = SUM(total_services) WHERE hcpcs_code IN admin_codes
total_provider_beneficiaries = (from Medicare "By Provider" file or estimated from
    MAX(total_beneficiaries) across all HCPCS codes for this NPI)

metric = total_admin_services / total_provider_beneficiaries
```

AAP standard: A child on the full ACIP schedule receives ~25-30 vaccine doses by age 18. Annualized across a mixed-age panel, a provider actively vaccinating should have a ratio well above 1.0.

Score: Percentile rank among peers.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.50) + (measure_2b * 0.50)
```


---

### DOMAIN 3: Screening & Safety (Adjusted Weight: 25%)


**Measure 3A: Developmental Screening (96110)**

What it answers: Does this provider perform standardized developmental screenings?

```
dev_screen_services = SUM(total_services) WHERE hcpcs_code = 96110
dev_screen_beneficiaries = SUM(total_beneficiaries) WHERE hcpcs_code = 96110

-- Estimate eligible population: beneficiaries seen for infant/toddler preventive visits
eligible_proxy = SUM(total_beneficiaries) WHERE hcpcs_code IN [99381, 99391, 99382, 99392]

metric_binary = 1 IF dev_screen_services > 0 ELSE 0
metric_rate   = dev_screen_services / eligible_proxy  (if eligible_proxy > 0)
```

AAP standard: Bright Futures recommends developmental screening at 9, 18, and 30 months (DEV-CH). A provider screening all eligible patients should bill 96110 approximately 3 times per child in the first 30 months.

Score: Two components.
- Binary: does the provider bill 96110 at all? (0 or 100)
- Rate: percentile rank of `metric_rate` among providers who DO bill 96110.
- Combined: `(binary * 0.30) + (rate_percentile * 0.70)`. A provider who never screens gets 0. A provider who screens but at low volume gets a partial score.

Edge case: If `eligible_proxy` = 0 (no infant/toddler patients), skip this measure.


**Measure 3B: Behavioral/Emotional Screening (96127)**

What it answers: Does this provider perform standardized behavioral and emotional screenings?

```
behav_screen_services = SUM(total_services) WHERE hcpcs_code = 96127
total_provider_beneficiaries = (estimated from provider-level data)

metric_binary = 1 IF behav_screen_services > 0 ELSE 0
metric_rate   = behav_screen_services / total_provider_beneficiaries
```

AAP standard: Bright Futures recommends autism screening at 18 and 24 months (M-CHAT), depression screening annually ages 12-17 (PHQ-A), and maternal depression screening at 1, 2, 4, 6 month infant visits (EPDS). All billed under 96127. A provider following all of these should have a high 96127 rate.

Score: Same structure as 3A. Binary (30%) + rate percentile (70%).

Caveat: We cannot distinguish which screening was performed. This is a blunt measure.


**Measure 3C: Lead Screening (83655)**

What it answers: Does this provider order blood lead testing?

```
lead_services = SUM(total_services) WHERE hcpcs_code = 83655

-- Estimate eligible: beneficiaries from infant/toddler age-group preventive codes
eligible_proxy = SUM(total_beneficiaries) WHERE hcpcs_code IN [99381, 99391, 99382, 99392]

metric_binary = 1 IF lead_services > 0 ELSE 0
metric_rate   = lead_services / eligible_proxy  (if eligible_proxy > 0)
```

AAP standard: Blood lead screening by 12 months and again by 24 months (LSC-CH). A provider with a young panel should have a lead screening rate approaching the number of children under 2 in their panel.

Score: Binary (30%) + rate percentile (70%).

Note: 83655 may be billed by the lab, not the ordering provider. If a provider's lead volume is 0 but they refer to external labs, they will score low here incorrectly. This is a known limitation.


**Measure 3D: Fluoride Varnish (99188)**

What it answers: Does this medical provider apply fluoride varnish?

```
fluoride_services = SUM(total_services) WHERE hcpcs_code = 99188
total_provider_beneficiaries = (estimated)

metric_binary = 1 IF fluoride_services > 0 ELSE 0
metric_rate   = fluoride_services / total_provider_beneficiaries
```

AAP standard: USPSTF recommends fluoride varnish for all children ages 1-5 at pediatric primary care visits (TFL-CH). Not all pediatric providers do this (many defer to dentists), so this is a differentiator.

Score: Binary (40%) + rate percentile (60%). Weighted more toward binary because many providers do not bill this at all, and those who do are a meaningful signal.


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.35) + (measure_3b * 0.25) + (measure_3c * 0.25) + (measure_3d * 0.15)
```


---

### Composite Score

```
composite = (domain_1 * 0.40) + (domain_2 * 0.35) + (domain_3 * 0.25)
```

Range: 0 to 100.

**Minimum data requirement:** A provider must have scores in at least 2 of 3 domains to receive a composite. If only 1 domain is scorable, output: "insufficient data."

**If a domain is missing:** Redistribute its weight proportionally. Example: if Domain 3 is missing (no screening data), the composite becomes `(domain_1 * 0.53) + (domain_2 * 0.47)`.


---

### Output Schema (per NPI)

Following the Step 2 pattern (one row per NPI, structured table, parquet + CSV):

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code (metro/micro area), derived from ZIP |
| taxonomy_code | string | From NPPES |
| is_subspecialist | boolean | True if taxonomy is not 208000000X |
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort was used for percentile ranks |
| percentile_cohort_state | string | State of the peer cohort used for percentile scoring (or "US" if national) |
| percentile_cohort_size | int | Number of peers in the cohort |
| total_beneficiaries | int | Estimated total unique patients |
| total_services | int | Total claim lines across all codes |
| preventive_visit_ratio | float | Measure 1A metric |
| age_group_breadth | int | Measure 1B metric (0-5) |
| preventive_visits_per_patient | float | Measure 1C metric |
| domain_1_score | float | Preventive Care domain (0-100) |
| vaccine_product_breadth | int | Measure 2A metric (0-13) |
| immunization_volume_per_patient | float | Measure 2B metric |
| domain_2_score | float | Immunizations domain (0-100) |
| dev_screening_rate | float | Measure 3A metric |
| behavioral_screening_rate | float | Measure 3B metric |
| lead_screening_rate | float | Measure 3C metric |
| fluoride_rate | float | Measure 3D metric |
| domain_3_score | float | Screening & Safety domain (0-100) |
| composite_score | float | Weighted composite (0-100), null if insufficient data |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |
| scorable_domains | int | Number of domains with enough data to score (0-3) |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing volume as a proxy for clinical practice quality. This is real data from credible sources, but it does not directly measure the thing AAP is asking for (e.g., "was this child screened at 18 months?" vs. "does this provider bill screening codes at a rate consistent with screening most patients").


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **MA APCD (All-Payer Claims Database)** | $5-7K, 2-4 weeks | Individual patient-level claims with diagnosis codes AND Rx data across ALL payers. Inpatient + outpatient. The most complete picture possible for MA. | +22 guidelines. Unlocks: antibiotic appropriateness (dx + Rx linkage), asthma medication ratio (Rx data), ADHD medication follow-up (Rx + visit timing), antipsychotic monitoring (Rx + lab codes), post-hospitalization follow-up (institutional + outpatient linkage), BMI/counseling (dx codes), series-level immunization completion, age-specific screening. |
| **CHIA Case Mix** | $5-7K, 2-4 weeks | Individual hospital discharge and encounter records with procedure and diagnosis codes attributed to individual providers. | +8 guidelines. Unlocks: institutional measures (FUH-CH, FUM-CH, FUA-CH), provider-level screening rates with dx context, visit sequencing. |
| **Massachusetts MIIS (Immunization Registry)** | Free (application required), 2-4 weeks | Individual patient immunization records linked to administering provider. The only source that tracks whether a child completed a full vaccine series. | +11 guidelines. Upgrades immunization domain from volume proxy to true series completion (CIS-CH Combo 10, IMA-CH Combo 2). Provider-level differentiation within same practice. |
| **MassHealth HEDIS Reports** | Free (request), 1-2 weeks | Plan-level quality measures for Medicaid managed care. Well-child visit rates, immunization rates, screening rates. Not provider-level, but useful as benchmarks. | +0 new guidelines, but strengthens scoring context with plan-level denominators. |
| **Medicaid T-MSIS Full Access** | Restricted (DUA required) | National Medicaid claims at the claim line level. Patient-level, dx codes, Rx data, institutional. The national equivalent of MA APCD but Medicaid-only. | Same as MA APCD for Medicaid population. Would allow national scaling beyond MA. |


### Unlock Path

| Stage | Data | Guidelines Scorable | Composite Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Provider Spending + NPPES | 9 of 47 | 3 of 6 domains (partial) |
| +MIIS (free, needs application) | Add immunization registry | 20 of 47 | 3 of 6 domains (immunizations become strong) |
| +MA APCD ($5-7K) | Add all-payer patient-level claims with dx and Rx | 42 of 47 | 6 of 6 domains |
| +CHIA ($5-7K) | Add hospital discharge records | 45 of 47 | 6 of 6 domains (near-complete) |
| Full (all above) | Everything | 45 of 47 | 2 remaining require EHR or self-attestation |


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring utilization patterns, not clinical quality.** The free data tells us what a provider billed. It does not tell us whether the care was appropriate, timely, or effective. A high 96110 volume means the provider bills for developmental screening. It does not confirm the screening was interpreted correctly.

**Medicaid file has no diagnosis codes.** This is the single biggest limitation. Without knowing WHY a service was performed, we cannot distinguish appropriate from inappropriate care. The entire Acute Care domain (antibiotic prescribing, asthma management, follow-up) is dark.

**Medicaid file has no prescription data.** Chronic Disease Management (ADHD meds, antipsychotic monitoring) is entirely unmeasurable. Asthma medication ratio is unmeasurable. These are some of the highest-signal pediatric quality measures and we cannot see them.

**Data is aggregated, not patient-level.** We see "Provider X billed 96110 150 times in 2023." We do not see "Patient Y received a developmental screen at 18 months." This means we cannot measure whether the right thing happened at the right time for the right patient. We can only measure whether it happened at all, in aggregate.

**Medicare has very low pediatric volume.** The Medicare Physician file is detailed (has dx codes, has place of service) but the pediatric signal in it is thin. It is supplementary, not primary.

**The Medicaid Provider Spending dataset is new and potentially unstable.** Released February 2026, temporarily unavailable as of late March 2026. Data quality documentation is limited. KFF has flagged that some of the largest "providers" in the dataset are government agencies, not clinical providers. Filtering is required.

**Code 96127 is a black box without diagnosis codes.** It covers depression screening, autism screening, ADHD assessment, and maternal depression screening under one code. We know screening happened. We do not know which screening.

**9 of 47 guidelines is a partial score.** We are transparent about this. The composite represents a utilization profile, not a comprehensive clinical quality assessment. It answers: "Does this provider's billing pattern suggest they follow AAP preventive care guidelines?" It does not answer: "Does this provider deliver high-quality pediatric care across all domains?"


---


## Appendix: CMS Child Core Set Measure Crosswalk

These are the CMS-standardized measures that map to our analysis. Mandatory state reporting since 2024.

| Abbreviation | Measure Name | Scorable Now? | What's Missing |
|---|---|---|---|
| W30-CH | Well-Child Visits in the First 30 Months | Partial (volume only) | Patient-level visit counts |
| WCV-CH | Child and Adolescent Well-Care Visits | Partial (volume only) | Patient-level visit counts |
| WCC-CH | Weight Assessment and Counseling | No | Diagnosis codes (BMI Z68.x) |
| CIS-CH | Childhood Immunization Status | Partial (breadth + volume) | Patient-level series completion |
| IMA-CH | Immunizations for Adolescents | Partial (breadth + volume) | Patient-level series completion |
| DEV-CH | Developmental Screening in First 3 Years | Partial (96110 volume) | Age-specific timing |
| CDF-CH | Depression Screening: Ages 12 to 17 | Partial (96127 volume, undifferentiated) | Diagnosis codes to isolate depression screening |
| ADD-CH | Follow-Up for ADHD Medication | No | Rx data + visit timing |
| PDS-CH | Postpartum Depression Screening | Partial (96127 volume, undifferentiated) | Diagnosis codes to isolate maternal depression |
| AAB-CH | Avoidance of Antibiotics for Bronchitis | No | Diagnosis codes + Rx linkage |
| AMR-CH | Asthma Medication Ratio | No | Rx data (NDC codes) |
| FUH-CH | Follow-Up After Mental Health Hospitalization | No | Institutional claims + visit timing |
| FUM-CH | Follow-Up After ED Visit for Mental Illness | No | ED claims + visit timing |
| FUA-CH | Follow-Up After ED Visit for Substance Use | No | ED claims + visit timing |
| APM-CH | Metabolic Monitoring on Antipsychotics | No | Rx data + lab codes |
| APP-CH | Psychosocial Care Before Antipsychotics | No | Rx data + visit sequencing |
| LSC-CH | Lead Screening in Children | Partial (83655 volume) | Age-specific timing |
| OEV-CH | Oral Evaluation / Dental Services | No | Dental claims separate from medical |
| TFL-CH | Topical Fluoride for Children | Partial (99188 volume) | Dental fluoride codes in dental claims |
| SFM-CH | Sealant Receipt on Permanent First Molars | No | Dental claims separate from medical |
