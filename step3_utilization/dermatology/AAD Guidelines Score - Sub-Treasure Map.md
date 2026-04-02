# Dermatology Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a dermatologist actually did: every biopsy, every lesion destruction, every excision. AAD (American Academy of Dermatology) clinical practice guidelines tell you what that dermatologist should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.

**Critical caveat upfront:** Dermatology management is heavily medication-based. Topical steroids, retinoids, antibiotics, biologics (dupilumab for atopic dermatitis, IL-17/IL-23 inhibitors for psoriasis), oral medications for acne. Without prescription data, we are blind to the entire medical management side of dermatology. We can only score the procedural and screening side. This is not a minor gap. It means we are scoring roughly half the specialty while the other half is invisible. Every score in this document reflects what a dermatologist does with a scalpel, punch, or cryotherapy gun, not what they prescribe.


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
| Provider specialty | Taxonomy-derived specialty (Dermatology = 207N00000X) |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The dermatology advantage:** Medicare is the stronger signal for dermatology. The 65+ population has the highest prevalence of skin cancer (basal cell carcinoma, squamous cell carcinoma), premalignant lesions (actinic keratoses), and chronic skin conditions. Skin cancer screening, biopsy, destruction, and excision make up a large share of dermatologic billing, and these procedures concentrate in the Medicare-age panel. This file is our primary data source.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. Supplementary for dermatology.

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
| ICD-10 diagnosis codes | Cannot link procedures to clinical reasons. Cannot tell if a biopsy was for suspected melanoma vs. an atypical nevus vs. a rash evaluation. |
| NDC drug codes | Cannot see prescriptions. No topical steroid tracking, no biologic prescribing, no isotretinoin monitoring, no antibiotic stewardship. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track Mohs referrals or surgical complications. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual patient journeys or timelines. |
| Service location details | Limited place-of-service information. |

**Dermatologic relevance:** Medicaid covers a younger, lower-income population. Some dermatologic volume exists in Medicaid: acne, eczema/atopic dermatitis, wart destruction, skin infections, and biopsies for younger patients. But the highest-signal procedures (skin cancer biopsy, AK destruction, malignant excision) concentrate in the Medicare panel. Medicaid is supplementary, not primary, for dermatology.

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every dermatologist by NPI, taxonomy code (207N00000X = Dermatology), practice address, and organizational affiliation. Free, always available. This is how we build the provider roster.

Subspecialty taxonomy codes to flag and exclude from general dermatology scoring:

| Taxonomy Code | Subspecialty | Why Exclude |
|---|---|---|
| 207ND0101X | MOHS Micrographic Surgery | Entirely different billing pattern dominated by Mohs-specific codes, not general derm |
| 207ND0900X | Dermatopathology | Lab/pathology-based practice, not clinical dermatology |
| 207NI0002X | Clinical & Laboratory Immunology | Narrow immunologic focus, different code profile |
| 207NP0225X | Pediatric Dermatology | Different patient population, different condition mix |
| 207NS0135X | Procedural Dermatology | Specialized procedural scope (cosmetic, laser, advanced surgical) that distorts general derm benchmarks |


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given dermatologist:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what procedures they perform) | Why they performed them (no diagnosis codes) |
| How often they bill each code (volume) | What they prescribed (no Rx data) |
| How many patients they see per procedure | Individual patient timelines or sequences |
| Whether they bill biopsy codes (skin cancer screening/evaluation activity) | Whether a specific patient got a full-body skin exam before the biopsy |
| Whether they destroy premalignant lesions (AK treatment) | Whether those AKs were appropriately diagnosed before destruction |
| Whether they excise malignant lesions | Whether staging and margins were adequate |
| Whether they bill across procedure categories (procedural breadth) | What medications they manage (topicals, biologics, oral agents) |
| Their practice location (NPPES) | Cosmetic dermatology activity (not CMS-covered, invisible in claims) |


## 2. What the Codes Tell Us (Analysis on Available Data Only)

Every HCPCS code in the claims files is a fact about what happened. Here is what we can extract from the free data, organized by the quality signals they reveal.

**Key characteristic of dermatology:** This is a heavily procedural specialty. Unlike primary care or even gynecology, a significant portion of dermatology billing is procedures: biopsies, destructions, excisions. The procedural component is not supplementary. It IS the practice. A dermatologist who only does E/M visits without procedures is highly unusual and almost certainly not practicing general dermatology in the typical sense.


### Biopsy: Does This Dermatologist Evaluate Suspicious Lesions?

| Code | Description | Visible In |
|---|---|---|
| 11102 | Tangential biopsy of skin, single lesion | Medicare + Medicaid |
| 11104 | Punch biopsy of skin, single lesion | Medicare + Medicaid |

**What we can measure:** Whether a dermatologist bills skin biopsy codes and at what rate relative to their patient panel. Biopsy is the gateway to skin cancer diagnosis. A dermatologist who sees patients but never biopsies suspicious lesions is not performing adequate skin cancer screening and evaluation.

**What we cannot measure:** Whether the biopsy was clinically indicated (we have no dx codes to know what lesion prompted it). Whether the biopsy result was acted on appropriately. Whether the provider uses dermoscopy to triage before biopsy (no separate billing code for dermoscopy, it is included in E/M).

**What AAD says should happen:** AAD recommends biopsy of any suspicious lesion where melanoma, basal cell carcinoma, or squamous cell carcinoma is in the differential. The AAD Skin Cancer guideline and the AAD Melanoma guideline both position biopsy as the essential diagnostic step. A general dermatologist who sees a Medicare-age population but never biopsies is missing potential skin cancers.

**How we score it:** Ratio of (11102 + 11104 services) to total unique beneficiaries, percentile ranked against peer cohort.


### Premalignant Lesion Destruction: Does This Dermatologist Treat Actinic Keratoses?

| Code | Description | Visible In |
|---|---|---|
| 17000 | Destruction of premalignant lesion, first lesion | Medicare + Medicaid |
| 17003 | Destruction of premalignant lesion, each additional 2-14 | Medicare + Medicaid |
| 17004 | Destruction of premalignant lesions, 15 or more | Medicare + Medicaid |

**What we can measure:** Whether a dermatologist destroys actinic keratoses and at what rate. AKs are the most common premalignant lesion, and their destruction is one of the most frequently billed procedures in dermatology. In a Medicare-age panel, AK volume should be substantial.

**What we cannot measure:** Whether the destroyed lesions were correctly identified as AKs (no pathology data). Whether field therapy (topical 5-FU, imiquimod) was used as an alternative or complement (no Rx data). Whether destruction was the right treatment choice for the clinical situation.

**What AAD says should happen:** AAD recommends treatment of actinic keratoses to prevent progression to squamous cell carcinoma. Treatment options include cryotherapy (destruction), topical agents, and photodynamic therapy. High AK destruction volume is expected in a practice with a Medicare-age panel. Low or zero volume in a provider who sees many elderly patients is a signal.

**How we score it:** Ratio of (17000 + 17003 + 17004 services) to total unique beneficiaries, percentile ranked against peer cohort.


### Malignant Lesion Excision: Does This Dermatologist Treat What They Find?

| Code | Description | Visible In |
|---|---|---|
| 11600 | Excision, malignant lesion, trunk/arms/legs, <=0.5 cm | Medicare + Medicaid |
| 11640 | Excision, malignant lesion, face/ears/eyelids/nose/lips, <=0.5 cm | Medicare + Medicaid |

**What we can measure:** Whether a dermatologist performs malignant excisions and at what rate. When biopsy confirms basal cell or squamous cell carcinoma, excision is the standard treatment for non-Mohs cases. A dermatologist who biopsies and diagnoses skin cancer but never excises may be referring all surgical management.

**What we cannot measure:** Whether the excision was the appropriate treatment vs. Mohs referral (depends on tumor type, location, size, which requires dx codes). Whether margins were clear. Whether the patient was the right candidate for excision vs. other modalities.

**What AAD says should happen:** AAD Non-Melanoma Skin Cancer guidelines recommend surgical excision with appropriate margins for basal cell and squamous cell carcinoma. Not all cases require Mohs (which is excluded from our scoring since Mohs surgeons are a separate subspecialty). A general dermatologist should be able to excise straightforward malignant lesions.

**How we score it:** Ratio of (11600 + 11640 services) to total unique beneficiaries, percentile ranked among providers who bill biopsy codes (only scored if biopsy volume > 0, since excision without biopsy is clinically incoherent).


### Procedural Breadth: Does This Dermatologist Manage a Full Scope of Conditions?

| Category | Codes | Description |
|---|---|---|
| Biopsy | 11102, 11104 | Tangential and punch biopsy |
| AK destruction | 17000, 17003, 17004 | Premalignant lesion destruction |
| Wart destruction | 17110, 17111 | Flat/common wart destruction |
| Malignant excision | 11600, 11640 | Excision of malignant lesions |
| Benign excision | 11400, 11440 | Excision of benign lesions |
| I&D | 10060 | Incision and drainage |
| Intralesional injection | 11900 | Injection into lesion (keloids, cysts, alopecia) |
| Wound repair | 12001 | Simple wound repair/closure |

**What we can measure:** How many of these 8 distinct procedure categories a dermatologist bills. This is a proxy for the breadth of conditions they manage procedurally.

**What we cannot measure:** Whether the procedures were appropriate. Whether cosmetic procedures (not CMS-covered) round out their scope further.

**What AAD says should happen:** A general dermatologist should manage a wide scope of skin conditions. Missing entire procedure categories suggests either a very narrow practice or referral of conditions that a general dermatologist should handle. Not every provider will bill all 8 categories, but a provider who only destroys AKs and nothing else has a very limited scope.

**How we score it:** (categories_with_billing / 8) * 100. Provider performing 6 of 8 categories scores 75.


### Biopsy-to-Destruction Ratio: Does This Dermatologist Diagnose Before Destroying?

| Code | Description | Visible In |
|---|---|---|
| 11102, 11104 | Skin biopsy (tangential + punch) | Medicare + Medicaid |
| 17000, 17003, 17004 | AK destruction | Medicare + Medicaid |

**What we can measure:** The ratio of biopsy volume to AK destruction volume. A provider who destroys many premalignant lesions should also be biopsying suspicious ones. If destruction volume is very high but biopsy volume is near zero, the provider may be treating without adequately diagnosing. Expected ratio: 0.15-0.60.

**What we cannot measure:** Whether the biopsied and destroyed lesions are clinically related (no patient-level linkage). Whether some lesions were appropriately treated without biopsy based on clinical appearance.

**What AAD says should happen:** AAD recommends biopsy of suspicious lesions before treatment. Not every AK requires biopsy (clinical diagnosis is standard for typical-appearing AKs), but a practice that destroys thousands of lesions with zero biopsies raises a question about whether suspicious lesions are being missed or ignored. Conversely, a practice with very high biopsy rates and minimal destruction may be over-diagnosing or under-treating.

**How we score it:** Ratio of (11102 + 11104) / (17000 + 17003 + 17004), percentile ranked against peers. Red flag if ratio < 0.05 (massive destruction volume with near-zero biopsy volume).

Edge cases:
- If destruction services = 0, cannot compute ratio. Skip this measure.
- If both are zero, skip.


### Benign Lesion Management: Does This Dermatologist Handle Common Conditions?

| Code | Description | Visible In |
|---|---|---|
| 17110 | Destruction of flat warts, up to 14 | Medicare + Medicaid |
| 17111 | Destruction of flat warts, 15 or more | Medicare + Medicaid |
| 11400 | Excision, benign lesion, trunk/arms/legs, <=0.5 cm | Medicare + Medicaid |
| 11440 | Excision, benign lesion, face/ears/eyelids/nose/lips, <=0.5 cm | Medicare + Medicaid |

**What we can measure:** Whether a dermatologist handles common benign conditions. Warts and benign lesions (seborrheic keratoses, cysts, lipomas, nevi) are a significant part of general dermatology. A provider who only treats cancer/premalignant lesions but never handles benign conditions may have a very narrow scope.

**What we cannot measure:** Whether benign excisions were clinically indicated vs. patient preference. Whether alternative treatments (topical, observation) were discussed.

**What AAD says should happen:** AAD Warts guideline recommends treatment of warts that are symptomatic, spreading, or persistent. General dermatology includes management of the full spectrum of skin lesions, not just the malignant ones. A balanced practice should show some benign lesion management alongside the cancer-focused work.

**How we score it:** Ratio of (17110 + 17111 + 11400 + 11440 services) to total unique beneficiaries, percentile ranked against peer cohort.


### Procedure-to-Visit Ratio: Is This a Procedural Dermatology Practice?

| Metric | Description |
|---|---|
| Numerator | Total procedure services (all procedure codes listed above) |
| Denominator | Total E/M visit services (99202-99215) |

**What we can measure:** The ratio of procedural services to E/M visits. Dermatology is inherently procedural. A general dermatologist should have a substantial procedure-to-visit ratio. If visits are very high but procedures near zero, the practice pattern is atypical for the specialty.

**What we cannot measure:** Whether medical management (prescriptions, counseling) fills the gap. A dermatologist who focuses on medical dermatology (acne management, eczema, psoriasis) may have a legitimately low procedure ratio because they are managing with medications we cannot see.

**What AAD says should happen:** There is no AAD guideline that prescribes a procedure ratio. But the specialty norms are clear: a general dermatologist sees patients and performs procedures on a substantial percentage of those visits. This is a practice-pattern signal, not a guideline-concordance measure per se, but it contextualizes the other measures.

**How we score it:** Total procedure services / total E/M services, percentile ranked against peer cohort.

Caveat: A provider with a low procedure-to-visit ratio may be an excellent medical dermatologist managing acne, eczema, and psoriasis with prescriptions we cannot see. This is a known limitation. The measure should be interpreted in context, not as a standalone quality indicator.


## 3. What We Can and Cannot Score (Honest Assessment)

Out of the 3 scoring domains and approximately 60 AAD clinical guideline recommendations across all major dermatologic conditions, here is what is scorable with the free CMS data:

| Domain | Weight | Scorable Measures | Not Scorable | Why Not |
|---|---|---|---|---|
| Skin Cancer Screening & Management | 40% | 3 measures (biopsy rate, premalignant treatment rate, malignant excision rate) | ~20 guideline recs | No dx codes to link biopsy to indication, no pathology results, no staging, no Rx for topical field therapy |
| Procedural Completeness | 35% | 2 measures (procedure breadth, biopsy-to-destruction ratio) | ~18 guideline recs | No outcomes, no Rx for medical alternatives, no dx linkage |
| Comprehensive Care Signals | 25% | 2 measures (benign lesion management rate, procedure-to-visit density) | ~15 guideline recs | No Rx data, no patient timelines, no dx codes for condition-specific scoring |
| **Total** | | **7 measures mapping to ~7 of ~60 AAD recommendations** | **~53** | |

**Bottom line:** With free CMS data, we can score approximately 7 of ~60 AAD guideline recommendations. These concentrate entirely in the procedural and screening side of dermatology: does the dermatologist biopsy, does the dermatologist destroy premalignant lesions, does the dermatologist excise malignancies, does the dermatologist manage a full breadth of procedural conditions? We are completely blind to medical dermatology management: acne treatment, eczema management, psoriasis treatment ladders, biologic prescribing, antibiotic stewardship, and every other condition managed with prescriptions rather than procedures.

**This is the biggest gap in any specialty we have scored so far.** Pediatrics had limited signal because Medicare was thin. Urology was missing medical management but had strong procedural signal. Dermatology is missing the entire medical management half of the specialty, and that half covers conditions (acne, atopic dermatitis, psoriasis) that affect millions of patients. The 7 scorable measures still tell a meaningful story about the procedural side, but they are silent on whether a dermatologist appropriately manages a teenager's acne or an adult's psoriasis.


### What's Not Scorable and Why

| AAD Guideline Area | Why Not Scorable from Free CMS Data |
|---|---|
| Acne management (topicals, isotretinoin, oral antibiotics) | No Rx data. Cannot see whether tretinoin was prescribed, whether isotretinoin monitoring is happening, whether antibiotics are being limited per AAD stewardship recommendations. |
| Atopic dermatitis management (topical steroids, calcineurin inhibitors, biologics like dupilumab) | No Rx data. Cannot see whether step therapy is followed (topicals first, then systemics). Cannot verify biologic prescribing appropriateness. |
| Psoriasis treatment ladder (topicals, phototherapy, biologics) | No Rx data. Phototherapy (96910) is visible as a procedure code, but the rest of the treatment ladder is invisible. Cannot verify step therapy or biologic selection. |
| Melanoma staging and follow-up intervals | No dx codes (cannot identify melanoma patients), no patient-level timeline (cannot track surveillance intervals), no pathology data (cannot see Breslow depth or staging). |
| Full-body skin exam documentation | No documentation data. The skin exam is part of the E/M visit, not separately billed. We can see that a visit happened but not what was examined. |
| Dermoscopy use | Dermoscopy is included in the E/M visit, not separately billed. No way to determine whether a provider uses dermoscopy for lesion evaluation. |
| Sunscreen/UV protection counseling | No documentation data. Counseling is not a billing event. |
| Antibiotic stewardship (topical and oral) | No Rx data. Cannot see whether antibiotic courses are appropriately limited, whether topical antibiotics are combined with benzoyl peroxide per AAD recommendation, or whether oral antibiotics are used as monotherapy (AAD advises against). |
| Biologic prescribing appropriateness (psoriasis, atopic dermatitis) | No Rx data. Cannot verify that biologics are reserved for moderate-to-severe disease, that appropriate screening (TB, hepatitis) preceded initiation, or that monitoring is occurring. |
| Wound care follow-up adequacy | No patient-level timeline. Cannot measure whether post-excision follow-up happened at appropriate intervals. |
| Patch testing for contact dermatitis | 95044 (patch testing) exists but is rarely billed by general dermatologists. Most patch testing happens in specialized contact dermatitis clinics. Not enough volume for meaningful scoring. |
| Hair loss evaluation and treatment | No Rx data (minoxidil, finasteride, spironolactone). Evaluation codes are included in E/M. Cannot measure whether appropriate workup (labs, biopsy) preceded treatment. |
| Nail disorder management | No Rx data (oral antifungals, topical treatments). Cannot measure treatment patterns. |


## 4. Business Logic: How We Compare What They Did vs. What AAD Says

For a given NPI, here is exactly how we compute each measure. Every calculation uses only the free CMS data described in Section 1.


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code = '207N00000X' (Dermatology, general). Exclude subspecialists: 207ND0101X (MOHS), 207ND0900X (Dermatopathology), 207NI0002X (Clinical & Lab Immunology), 207NP0225X (Pediatric Dermatology), 207NS0135X (Procedural Dermatology).
**Filter by state:** provider_state = target state (e.g., 'MA')
**Filter by entity:** Entity Type 1 (Individual NPI). Excludes organizational NPIs.
**Output:** A table of general dermatology NPIs with practice address, entity type, and taxonomy.

This is the denominator. Every NPI in this roster gets scored.


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners (primary) + Medicaid Provider Spending (supplementary)
**Join:** On NPI (npi in Medicare, servicing_npi in Medicaid)
**Aggregate:** Sum across the measurement year (e.g., 2023) to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (service/claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes. Medicare and Medicaid claims are additive. In practice, Medicare will dominate for most dermatologists due to the high prevalence of skin cancer and premalignant lesions in the 65+ population.


### Geographic Grouping for Percentile Scoring

Several measures use percentile ranking ("rank this provider against all other dermatologists"). The peer cohort for percentile scoring is grouped by geography:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All dermatology NPIs (taxonomy 207N00000X, >= 100 total Medicare services) in the same state | Primary scoring. A dermatologist in MA is ranked against MA peers. |
| **National** (fallback) | All qualifying dermatology NPIs across all states | When state cohort has < 30 providers. Also useful for cross-state benchmarking. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | Urban vs. rural comparison. Not implemented now, but the output schema carries the fields to support it later. |

The peer cohort used for percentile ranks directly affects scores. A dermatologist at the 80th percentile in a high-performing state might be at the 60th nationally. The output records which cohort was used.

**Peer Cohort Definition:**

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207N00000X (Dermatology, general) | Excludes subspecialists, other specialties |
| State | Same state as the provider being scored | Practice patterns vary by state (sun exposure, demographics) |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort percentiles |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |


---

### DOMAIN 1: Skin Cancer Screening & Management (Weight: 40%)


**Measure 1A: Biopsy Rate**

What it answers: How frequently does this dermatologist biopsy suspicious lesions relative to their patient panel?

```
biopsy_services = SUM(total_services) WHERE hcpcs_code IN (11102, 11104)
total_beneficiaries = MAX(total_beneficiaries) across all HCPCS codes for this NPI
    (or from the "By Provider" Medicare file)

metric = biopsy_services / total_beneficiaries
```

AAD standard: Biopsy is the gateway to skin cancer diagnosis. AAD Skin Cancer and Melanoma guidelines recommend biopsy of any suspicious lesion. A general dermatologist who sees a Medicare-age population but never biopsies is not performing adequate skin cancer screening and evaluation. Biopsy is expected to be among the most frequently billed procedures for any general dermatologist.

Score: Percentile rank of `metric` among all general dermatology NPIs in the state. 90th percentile = score of 90.

Edge cases:
- If `total_beneficiaries` < 10, insufficient volume. Mark as insufficient.
- If `biopsy_services` = 0, the provider either does not biopsy (highly unusual for a general dermatologist) or refers all biopsies. Score = 0.


**Measure 1B: Premalignant Treatment Rate**

What it answers: Does this dermatologist treat actinic keratoses at a rate consistent with managing a Medicare-age panel?

```
ak_services = SUM(total_services) WHERE hcpcs_code IN (17000, 17003, 17004)
total_beneficiaries = (same as 1A)

metric = ak_services / total_beneficiaries
```

AAD standard: AAD recommends treatment of actinic keratoses to prevent progression to squamous cell carcinoma. Treatment options include cryotherapy (what we see), topical agents (what we cannot see), and photodynamic therapy. High AK destruction volume is expected in a practice with a Medicare-age panel. A dermatologist with hundreds of elderly patients and zero AK destruction is either treating only with topicals (invisible to us) or not treating at all.

Score: Percentile rank of `metric` among peers.

Caveat: Some dermatologists may manage AKs primarily with topical 5-fluorouracil or imiquimod rather than destruction. These providers will score lower on this measure despite following AAD guidelines. This is a known limitation of not having Rx data.


**Measure 1C: Malignant Excision Practice**

What it answers: When biopsy confirms malignancy, does this dermatologist excise it?

```
excision_services = SUM(total_services) WHERE hcpcs_code IN (11600, 11640)
total_beneficiaries = (same as 1A)

metric = excision_services / total_beneficiaries
```

AAD standard: AAD Non-Melanoma Skin Cancer guidelines recommend surgical excision with appropriate margins for basal cell and squamous cell carcinoma. Not all skin cancers require Mohs (and Mohs surgeons are excluded from our scoring). A general dermatologist who biopsies and finds cancer but never excises is referring all surgery. Some referral to Mohs is expected and appropriate (high-risk locations, recurrent tumors), but zero excisions with positive biopsy volume suggests the provider does not manage any surgical cases themselves.

Score: Percentile rank of `metric` among providers who bill biopsy codes (only score if biopsy volume > 0). If a provider does not biopsy, this measure is skipped, because excision without biopsy is clinically incoherent.

Edge cases:
- If `biopsy_services` = 0, skip this measure.
- If `excision_services` = 0 but `biopsy_services` > 0, score = 0. This is not necessarily bad (the provider may refer all surgical cases to Mohs), but it is a signal of limited surgical scope.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.40) + (measure_1b * 0.35) + (measure_1c * 0.25)
```


---

### DOMAIN 2: Procedural Completeness (Weight: 35%)


**Measure 2A: Procedure Breadth**

What it answers: Does this dermatologist perform a full range of procedures, or only a narrow subset?

```
procedure_categories = {
    'biopsy':                [11102, 11104],
    'ak_destruction':        [17000, 17003, 17004],
    'wart_destruction':      [17110, 17111],
    'malignant_excision':    [11600, 11640],
    'benign_excision':       [11400, 11440],
    'incision_drainage':     [10060],
    'intralesional_injection': [11900],
    'wound_repair':          [12001]
}

categories_billed = COUNT of procedure_categories keys WHERE
    SUM(total_services) for ANY code in that category > 0

metric = categories_billed  -- integer 0-8
```

AAD standard: A general dermatologist should manage a broad scope of skin conditions. The 8 procedure categories above span the core of general dermatology: cancer screening, premalignant treatment, benign lesion management, wart treatment, abscess drainage, lesion injection, and wound closure. Missing entire categories suggests a very narrow practice. Not every provider will bill all 8, but a provider who only bills AK destruction and nothing else has a very limited scope for a general dermatologist.

Score: `(categories_billed / 8) * 100`. Provider performing 6 of 8 categories scores 75.

Note: Some categories (wound repair, I&D) may be billed less frequently by dermatologists than by surgeons or emergency physicians. Missing one or two of the less common categories is not alarming. But missing 4+ categories is a meaningful signal.


**Measure 2B: Biopsy-to-Destruction Ratio**

What it answers: Does this dermatologist adequately biopsy relative to their destruction volume?

```
biopsy_services = SUM(total_services) WHERE hcpcs_code IN (11102, 11104)
destruction_services = SUM(total_services) WHERE hcpcs_code IN (17000, 17003, 17004)

metric = biopsy_services / destruction_services
```

AAD standard: A provider who destroys many premalignant lesions should also be biopsying suspicious ones among them. Not every AK requires biopsy (clinical diagnosis is standard for typical-appearing AKs), so this ratio will not be 1:1. But if destruction volume is very high and biopsy volume is near zero, the provider may be treating without adequately evaluating for malignancy hiding among the premalignant lesions. Expected ratio: 0.15-0.60.

Score: Percentile rank of `metric` among peers who bill both biopsy and destruction codes. Red flag if ratio < 0.05 (destroying thousands of lesions with near-zero biopsy volume).

Edge cases:
- If `destruction_services` = 0, cannot compute ratio. Skip this measure.
- Very high ratios (> 1.0) may indicate a biopsy-heavy practice that does less destruction (possibly managing AKs with topicals instead). Flag but do not penalize.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.50) + (measure_2b * 0.50)
```


---

### DOMAIN 3: Comprehensive Care Signals (Weight: 25%)


**Measure 3A: Benign Lesion Management Rate**

What it answers: Does this dermatologist manage common benign conditions, or only cancer/premalignant lesions?

```
benign_services = SUM(total_services) WHERE hcpcs_code IN (17110, 17111, 11400, 11440)
total_beneficiaries = (same as before)

metric = benign_services / total_beneficiaries
```

AAD standard: Warts (AAD Warts guideline) and benign lesions are a significant part of general dermatology. A provider who only treats cancer and premalignant lesions but never handles benign conditions may have a very narrow scope. General dermatology includes the full spectrum of skin conditions, not just the malignant ones.

Score: Percentile rank of `metric` among peers.

Caveat: In a heavily Medicare practice, benign lesion volume may be lower simply because skin cancer and AKs dominate. This measure is more informative for practices with a mixed-age panel.


**Measure 3B: In-Office Procedure Density**

What it answers: Is this provider's practice pattern consistent with a procedural dermatology practice?

```
all_procedure_codes = [11102, 11104, 17000, 17003, 17004, 17110, 17111,
                       11600, 11640, 11400, 11440, 10060, 11900, 12001]

total_procedure_services = SUM(total_services) WHERE hcpcs_code IN all_procedure_codes

em_codes = [99202, 99203, 99204, 99205,   -- new patient
            99211, 99212, 99213, 99214, 99215]  -- established patient

total_em_services = SUM(total_services) WHERE hcpcs_code IN em_codes

metric = total_procedure_services / total_em_services
```

AAD standard: Dermatology is inherently procedural. A general dermatologist should have a substantial procedure-to-visit ratio. If visits are very high but procedures near zero, the practice pattern is atypical for the specialty. This does not necessarily mean the provider is practicing poorly (they may be managing medical dermatology conditions with prescriptions we cannot see), but it is worth flagging.

Score: Percentile rank of `metric` among peers.

Edge cases:
- If `total_em_services` = 0, no E/M visit data. Mark as insufficient.
- If `total_em_services` < 10, insufficient volume. Mark as insufficient.
- A low ratio may reflect a legitimate medical dermatology focus (acne, eczema, psoriasis managed with Rx). This is the biggest known limitation of this measure.


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.50) + (measure_3b * 0.50)
```


---

### Composite Score

```
composite = (domain_1 * 0.40) + (domain_2 * 0.35) + (domain_3 * 0.25)
```

Range: 0 to 100.

**Minimum data requirement:** A provider must have scores in at least 2 of 3 domains to receive a composite. If only 1 domain is scorable, output: "insufficient data."

**If a domain is missing:** Redistribute its weight proportionally. Example: if Domain 3 is missing (provider has insufficient E/M data for procedure density), the composite becomes `(domain_1 * 0.53) + (domain_2 * 0.47)`.


---

### Worked Example

Dr. A is a general dermatologist in Massachusetts. Here is her claims profile for 2023:

| Metric | Raw Value | Peer Percentile | Notes |
|---|---|---|---|
| Total Medicare beneficiaries | 1,450 | -- | High-volume practice (dermatology panels tend to be large) |
| Total E/M services | 3,200 | -- | |
| **Domain 1: Skin Cancer Screening & Management** | | | |
| Biopsy rate (11102+11104 / beneficiaries) | 620/1,450 = 0.43 | 68th | Biopsies about 43% of patients |
| Premalignant treatment rate (17000+17003+17004 / beneficiaries) | 1,850/1,450 = 1.28 | 74th | More AK services than patients (patients have multiple lesions) |
| Malignant excision rate (11600+11640 / beneficiaries) | 85/1,450 = 0.06 | 55th | Modest excision volume, refers some to Mohs |
| **Domain 1 Score** | (68*0.40)+(74*0.35)+(55*0.25) | **66.8** | |
| **Domain 2: Procedural Completeness** | | | |
| Procedure breadth | 6 of 8 (no I&D, no wound repair) | 75.0 (fixed) | Missing two less common categories |
| Biopsy-to-destruction ratio | 620/1,850 = 0.34 | 62nd | Healthy ratio, biopsying among destructions |
| **Domain 2 Score** | (75.0*0.50)+(62*0.50) | **68.5** | |
| **Domain 3: Comprehensive Care Signals** | | | |
| Benign lesion management rate (17110+17111+11400+11440 / beneficiaries) | 310/1,450 = 0.21 | 58th | Moderate benign work |
| Procedure density (procedures / E/M) | 3,520/3,200 = 1.10 | 71st | More procedures than visits (typical for derm) |
| **Domain 3 Score** | (58*0.50)+(71*0.50) | **64.5** | |
| **Composite** | (66.8*0.40)+(68.5*0.35)+(64.5*0.25) | **66.8** | |

Dr. A scores 66.8. She has solid biopsy and AK treatment volume, decent breadth, and a healthy procedure-to-visit ratio. Her excision rate is moderate, suggesting she refers more complex cases to Mohs (which is reasonable). Benign lesion management is lower, which could reflect a cancer-focused Medicare panel.

Compare with Dr. B in the same state:

| Metric | Raw Value | Peer Percentile |
|---|---|---|
| Total Medicare beneficiaries | 1,800 | -- |
| Total E/M services | 4,100 | -- |
| Biopsy rate | 980/1,800 = 0.54 | 85th |
| Premalignant treatment rate | 2,900/1,800 = 1.61 | 88th |
| Malignant excision rate | 195/1,800 = 0.11 | 78th |
| **Domain 1 Score** | (85*0.40)+(88*0.35)+(78*0.25) | **84.3** |
| Procedure breadth | 8 of 8 | 100.0 |
| Biopsy-to-destruction ratio | 980/2,900 = 0.34 | 63rd |
| **Domain 2 Score** | (100*0.50)+(63*0.50) | **81.5** |
| Benign lesion management rate | 520/1,800 = 0.29 | 72nd |
| Procedure density | 5,800/4,100 = 1.41 | 84th |
| **Domain 3 Score** | (72*0.50)+(84*0.50) | **78.0** |
| **Composite** | (84.3*0.40)+(81.5*0.35)+(78.0*0.25) | **82.0** |

Dr. B scores 82.0. Higher volume, full procedural breadth, strong biopsy and destruction rates, and a high procedure-to-visit ratio. Her claims pattern is more consistent with a dermatologist performing comprehensive skin cancer screening and management across the full procedural scope.

**What these scores do NOT tell us:** Whether Dr. A or Dr. B is a better medical dermatologist. If Dr. A spends half her day managing psoriasis patients on biologics and running an acne clinic, none of that shows up here. Her lower procedural scores may reflect a more balanced practice, not a worse one. We are scoring only the procedural side.


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
| is_subspecialist | boolean | True if taxonomy is not 207N00000X |
| **Cohort Context** | | |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used for percentile ranks |
| percentile_cohort_state | string | State of the peer cohort used for percentile scoring (or "US" if national) |
| percentile_cohort_size | int | Number of peers in the cohort |
| **Volume** | | |
| total_beneficiaries | int | Estimated total unique patients |
| total_services | int | Total claim lines across all codes |
| total_em_services | int | Total E/M services (99202-99215) |
| **Domain 1: Skin Cancer Screening & Management** | | |
| biopsy_services | int | Count of 11102 + 11104 services |
| biopsy_rate | float | Measure 1A metric (biopsy / total beneficiaries) |
| biopsy_percentile | float | Measure 1A percentile rank |
| premalignant_services | int | Count of 17000 + 17003 + 17004 services |
| premalignant_treatment_rate | float | Measure 1B metric (AK destruction / total beneficiaries) |
| premalignant_percentile | float | Measure 1B percentile rank |
| malignant_excision_services | int | Count of 11600 + 11640 services |
| malignant_excision_rate | float | Measure 1C metric (excision / total beneficiaries) |
| malignant_excision_percentile | float | Measure 1C percentile rank |
| domain_1_score | float | Skin Cancer Screening & Management domain (0-100) |
| **Domain 2: Procedural Completeness** | | |
| procedure_categories_billed | int | Measure 2A metric (0-8) |
| procedure_breadth_score | float | (categories / 8) * 100 |
| biopsy_destruction_ratio | float | Measure 2B metric (biopsy / AK destruction) |
| biopsy_destruction_percentile | float | Measure 2B percentile rank |
| biopsy_destruction_red_flag | boolean | True if ratio < 0.05 |
| domain_2_score | float | Procedural Completeness domain (0-100) |
| **Domain 3: Comprehensive Care Signals** | | |
| benign_services | int | Count of 17110 + 17111 + 11400 + 11440 services |
| benign_mgmt_rate | float | Measure 3A metric (benign / total beneficiaries) |
| benign_mgmt_percentile | float | Measure 3A percentile rank |
| total_procedure_services | int | Sum of all procedure codes |
| procedure_density | float | Measure 3B metric (procedures / E/M services) |
| procedure_density_percentile | float | Measure 3B percentile rank |
| domain_3_score | float | Comprehensive Care Signals domain (0-100) |
| **Composite** | | |
| composite_score | float | Weighted composite (0-100), null if insufficient data |
| scorable_domains | int | Number of domains with enough data to score (0-3) |
| **Confidence** | | |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing volume as a proxy for clinical practice quality. This is real data from credible sources, but it does not directly measure what AAD is asking for (e.g., "did this patient have a suspicious lesion evaluated with biopsy?" vs. "does this provider bill biopsy at a rate consistent with performing adequate skin cancer screening").

**The procedural-only limitation cannot be overstated.** For dermatology specifically, Tier 2 proxy data misses the entire medication-management side of the specialty. In urology, we missed medical management of BPH and OAB. In dermatology, we miss acne, atopic dermatitis, psoriasis, contact dermatitis, hair loss, nail disorders, and every other condition managed primarily with prescriptions. The procedural score we produce is real and defensible for what it measures, but it is roughly half the clinical picture.


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **MA APCD (All-Payer Claims Database)** | $5-7K, 2-4 weeks | Individual patient-level claims with diagnosis codes AND Rx data across ALL payers. Inpatient + outpatient. The most complete picture possible for MA. | +25-30 guidelines. Unlocks: acne treatment patterns (topical retinoid → oral antibiotic → isotretinoin ladder), atopic dermatitis step therapy (topicals → dupilumab), psoriasis treatment ladder (topicals → phototherapy → biologics), antibiotic stewardship, biologic prescribing appropriateness, condition-specific procedure appropriateness, melanoma staging and follow-up. |
| **State Cancer Registry (MA Cancer Registry)** | Free (application required), 4-8 weeks | Skin cancer incidence, staging, treatment, and outcomes linked to treating providers. Melanoma Breslow depth, margin status. | +5-8 guidelines. Unlocks: melanoma stage-appropriate management, excision margin adequacy, sentinel lymph node biopsy rates for appropriate-thickness melanomas, non-melanoma recurrence rates. |
| **Medicare Part D Prescriber Data** | Free (CMS) | NPI-level aggregate Rx data for Medicare Part D. Shows which drugs a provider prescribes and in what volume. | +8-10 guidelines. Unlocks: topical medication prescribing patterns, antibiotic stewardship (duration, combination therapy), biologic prescribing volume, oral retinoid management. Available now but requires separate pipeline. |
| **EHR Data (Direct or via Registry)** | Varies ($50K-$500K+) | Documentation-level clinical detail. Biopsy results, pathology reports, dermoscopy findings, full-body skin exam documentation, patient-reported outcomes. | Remaining guidelines. Unlocks: dermoscopy use, full-body skin exam frequency, biopsy-to-diagnosis concordance, margin status on excisions, follow-up interval documentation, counseling documentation. |
| **Medicaid T-MSIS Full Access** | Restricted (DUA required) | National Medicaid claims at the claim line level. Patient-level, dx codes, Rx data, institutional. | Same as MA APCD for Medicaid population. Adds younger adult/pediatric dermatologic conditions (acne, eczema, warts). |


### Unlock Path

| Stage | Data | Guideline Recommendations Scorable | Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Provider Spending + NPPES | ~7 of ~60 | 3 domains, procedural side only |
| +Medicare Part D (free, separate pipeline) | Add NPI-level Rx data | ~17 of ~60 | Adds medication management for acne, eczema, psoriasis (Medicare patients) |
| +MA APCD ($5-7K) | Add all-payer patient-level claims with dx and Rx | ~45 of ~60 | Adds condition-specific scoring, step therapy, antibiotic stewardship, full-age-range Rx |
| +State Cancer Registry (free, application) | Add skin cancer staging and outcomes | ~50 of ~60 | Adds melanoma-specific guideline scoring, margin adequacy |
| +EHR (varies) | Add documentation and clinical detail | ~55 of ~60 | Near-complete, adds documentation-based measures and outcomes |
| Full (all above) | Everything | ~55-58 of ~60 | Remaining 2-5 require patient-reported outcomes or long-term follow-up |


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring the procedural side of dermatology only, and we are blind to medical management.** This is the single most important thing to understand about this score. A very large portion of dermatology is medication-based: topical steroids for eczema, retinoids for acne, biologics for psoriasis and atopic dermatitis, oral antibiotics, antifungals, and more. Without prescription data, we cannot see any of it. A dermatologist who runs an excellent acne clinic, manages 200 psoriasis patients on biologics, and treats atopic dermatitis across all ages will score low if they do not also biopsy and destroy lesions at high rates. This is not a minor edge case. It is a structural bias in the score.

**No diagnosis codes means we cannot link procedures to clinical indications.** We cannot tell if a biopsy was for a suspicious pigmented lesion (appropriate melanoma screening) or for a rash that did not require biopsy. We cannot tell if AK destruction happened on appropriately diagnosed premalignant lesions. Without the clinical context, we can only measure whether things happened, not whether they should have happened.

**No prescription data means we miss the fastest-growing part of dermatology.** Biologic medications for psoriasis and atopic dermatitis represent one of the most significant advances in dermatology in the past decade. Dupilumab, secukinumab, risankizumab, and others have transformed outcomes for millions of patients. We cannot see any of this. A dermatologist who is an expert in biologic management, carefully monitoring patients and achieving excellent outcomes, is invisible to our scoring.

**Data is aggregated, not patient-level.** We see "Provider X billed 11102 620 times in 2023." We do not see "Patient Y had a suspicious mole biopsied, confirmed as melanoma, and was excised with appropriate margins within 2 weeks." We cannot measure whether a complete cancer care pathway happened for a given patient. We can only measure whether the provider performs the component parts in aggregate.

**7 of ~60 AAD guideline recommendations is a partial score.** We are transparent about this. The composite represents a procedural utilization profile, not a comprehensive clinical quality assessment. It answers: "Does this dermatologist's billing pattern suggest they perform skin cancer screening, premalignant treatment, and a broad range of procedures consistent with AAD guidelines?" It does not answer: "Does this dermatologist deliver high-quality dermatologic care across all conditions?"

**Mohs surgeons must be excluded.** Mohs micrographic surgery is a subspecialty with an entirely different billing pattern (17311, 17312, 17313, 17314 are the Mohs codes). A Mohs surgeon scored against general dermatologists would appear anomalous. We exclude 207ND0101X (MOHS) taxonomy, but some Mohs surgeons may register under the general 207N00000X code. The output should flag any provider with high Mohs code volume.

**Cosmetic dermatology is invisible in CMS data.** A significant portion of many dermatology practices involves cosmetic procedures (Botox for cosmetic use, fillers, laser treatments, chemical peels). These are not covered by Medicare or Medicaid and will not appear in the claims data. A provider whose practice is 50% cosmetic will appear to have lower volume than a provider whose practice is 100% medical, even if they see the same number of total patients.

**Pathology codes (88305) may be billed by external labs, not the dermatologist.** When a biopsy is sent for pathologic evaluation, the pathology read (88305) is typically billed by the pathology lab or dermatopathologist, not the performing dermatologist. This means we cannot see biopsy results and cannot link biopsy to diagnosis.

**Medicare data is moderately strong for dermatology, but Medicaid adds important breadth.** Medicare captures the skin cancer and AK side well (65+ population). Medicaid captures acne, eczema, and wart treatment in younger patients. The procedural focus of our scoring is biased toward the Medicare-heavy conditions. The Medicaid dataset was temporarily unavailable as of late March 2026.

**Procedure breadth rewards breadth over depth.** A dermatologist who is the best skin cancer surgeon in the state but only does biopsies and excisions will score lower on breadth than a generalist who bills across all categories. We mitigate this by excluding taxonomy-flagged subspecialists, but not all narrow-practice dermatologists use subspecialty taxonomy codes.

**The procedure-to-visit ratio penalizes medical dermatologists.** A provider who sees 4,000 patients a year for acne, eczema, and psoriasis, managing them with prescriptions, will have a low procedure-to-visit ratio. Their practice pattern is not atypical, it is just focused on the medical side we cannot see. The 25% weight on Domain 3 keeps this effect moderate, but it exists.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 7. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **AAD Guidelines Concordance** (this doc) | Does this dermatologist follow AAD guideline recommendations? | Clinical quality proxy |
| **Peer Comparison** | Does their billing pattern look like a normal dermatologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is the practice pattern consistent across Medicare and Medicaid? | Access proxy |
| **Billing Quality** | Are charges, code ratios, and E/M distribution normal? | Pricing + integrity |

Guideline concordance is the most clinically grounded of the five scores. It does not just ask "is this provider normal?" (peer comparison) or "is the volume real?" (volume adequacy). It asks "does this provider do what AAD says they should do?"

Here is what this score catches that the others miss:

| Scenario | Guideline Concordance | Other Scores |
|---|---|---|
| Dermatologist who does high-volume E/M visits but never biopsies, never destroys AKs, never excises | Low (Domain 1 near zero, Domain 2 low, Domain 3 low procedure density) | Peer comparison catches this too (missing procedure codes). But guideline concordance flags the clinical implication: this provider is not screening for or treating skin cancer. |
| Dermatologist who destroys thousands of AKs but never biopsies anything | Low (Domain 2 biopsy-to-destruction ratio is red flagged) | Peer comparison may not flag this (AK destruction is common). Billing quality may look normal. Guideline concordance specifically flags the missing diagnostic step. |
| Dermatologist who biopsies and destroys but never excises malignancies | Moderate (Domain 1C = 0, but Domains 1A and 1B compensate partially) | Peer comparison may not distinguish. Guideline concordance identifies the specific gap: diagnosis without surgical follow-through. |
| Dermatologist who biopsies, destroys, excises, manages warts, does I&D, injects lesions | High | Other scores may also be high. This is the concordance signal: all five dimensions align for a provider following guidelines across the procedural scope. |
| Medical dermatologist focused on acne/eczema/psoriasis with prescriptions | Low (procedural volume is thin) | Peer comparison also catches this. Billing quality may be fine. **This is our known blind spot.** The provider may be excellent but invisible to our procedural-only scoring. |


---

# PART E: RISKS AND LIMITATIONS

---

These are repeated from Part C in summary form, plus cross-cutting risks.


## 8. Summary of Limitations

1. **Scoring procedural side only, blind to medical management.** This is the most significant limitation. Topical treatments, biologics, oral medications, isotretinoin, antibiotic stewardship: all invisible. A dermatologist focused on medication management will score low despite potentially excellent care.

2. **No prescription data is devastating for dermatology.** More than any other specialty we have scored, dermatology relies on medications. Acne, atopic dermatitis, psoriasis, contact dermatitis, fungal infections, hair loss: all managed primarily with prescriptions. We are scoring the specialty with one eye closed.

3. **No diagnosis codes.** Cannot link any procedure to its clinical indication. Cannot distinguish a biopsy for melanoma screening from one for a benign rash evaluation. Cannot identify which patients have which conditions.

4. **Aggregated data.** Cannot track individual patients through a care pathway. Cannot measure whether a specific patient got biopsy, then excision, then follow-up in the right sequence.

5. **~7 of ~60 guidelines.** This is a partial score. It covers skin cancer screening, premalignant treatment, and procedural breadth. It misses medical management, outcomes, documentation, counseling, and patient-level adherence.

6. **Mohs surgeons must be excluded.** Completely different billing pattern. Taxonomy filter helps, but some Mohs surgeons may use the general dermatology code.

7. **Pathology codes (88305) billed by external labs.** Cannot see biopsy results or link biopsy to diagnosis.

8. **Cosmetic dermatology is invisible.** Not CMS-covered. A provider with a large cosmetic practice appears to have lower volume than they actually do.

9. **Medicaid dataset temporarily unavailable.** If only Medicare data is available, younger-patient conditions (acne, warts, eczema) are underrepresented. The guideline concordance score is primarily Medicare-driven and will function, but payer diversity score (separate doc) is impacted.

10. **Procedure-to-visit ratio penalizes medical dermatologists.** Known bias. A provider managing psoriasis, acne, and eczema with prescriptions will have a low procedural ratio despite following AAD guidelines with medications we cannot see.

11. **No outcomes.** We cannot measure surgical complications, recurrence rates, margin adequacy, or patient satisfaction. The score is about process, not results.


---


## Appendix: AAD Guideline Crosswalk

These are the major AAD clinical practice guidelines and their scorability with free CMS data.

| AAD Guideline | Key Recommendations | Scorable Now? | What's Missing |
|---|---|---|---|
| Acne Vulgaris (2024) | Topical retinoids as first-line, limit oral antibiotic duration, isotretinoin for severe/refractory, no antibiotic monotherapy | No | Rx data for all treatment recommendations. Zero visibility. |
| Atopic Dermatitis (2023-2024) | Topical steroids/calcineurin inhibitors first, step up to phototherapy/systemics/biologics for moderate-severe | No (except phototherapy 96910 if billed) | Rx data, dx codes to identify AD patients, step therapy sequencing |
| Psoriasis (2019-2021, multiple parts) | Topicals for mild, phototherapy/systemics for moderate, biologics for moderate-severe, comorbidity screening | No (except phototherapy 96910 if billed) | Rx data, dx codes, comorbidity screening, biologic selection criteria |
| Melanoma (2019, amended) | Biopsy suspicious pigmented lesions, excision with appropriate margins based on Breslow depth, sentinel lymph node biopsy when indicated, surveillance intervals | Partial (biopsy volume as proxy) | Pathology results, staging, margin data, patient-level follow-up timeline |
| Non-Melanoma Skin Cancer / BCC (2018, 2021) | Biopsy to confirm, excision with margins, Mohs for high-risk, radiation for non-surgical candidates | Partial (biopsy rate, excision rate) | Dx codes to identify BCC cases, margin data, Mohs referral tracking |
| Non-Melanoma Skin Cancer / SCC (2018, 2021) | Biopsy to confirm, excision with margins, risk stratification | Partial (biopsy rate, excision rate) | Same as BCC above |
| Actinic Keratoses (2022) | Treat to prevent SCC progression, cryotherapy or topical field therapy, follow-up | Partial (AK destruction rate) | Rx data for topical field therapy, follow-up intervals |
| Warts (2019) | Destructive therapy for symptomatic/spreading warts, patient preference for treatment method | Partial (wart destruction rate) | Patient-level outcomes, alternative treatment methods |
| Contact Dermatitis (2015) | Patch testing for suspected allergic contact dermatitis, allergen avoidance counseling | No | Patch testing (95044) rarely billed by general derm, no counseling data |
| Urticaria (2014) | Second-generation antihistamines first-line, step-up to omalizumab for chronic spontaneous urticaria | No | Rx data, dx codes |
| Dermatomyositis (2017) | Skin-directed therapy, systemic immunosuppression for severe | No | Rx data, dx codes, lab data |
| Alopecia (various) | Workup (labs, biopsy), medical management (minoxidil, finasteride, spironolactone, JAK inhibitors) | No | Rx data, lab data, dx codes |
