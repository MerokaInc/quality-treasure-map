# Urology Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a urologist actually did: every cystoscopy, every biopsy, every office visit. AUA clinical practice guidelines tell you what that urologist should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.


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
| Provider specialty | Taxonomy-derived specialty (Urology = 208800000X) |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The urology advantage:** This is the opposite of pediatrics. Medicare is where the urologic signal lives. The vast majority of urologic conditions (BPH, prostate cancer, bladder cancer, kidney stones, overactive bladder) affect adults 50+, and Medicare covers adults 65+. The Medicare file will have high volume for most urologists. This file is our primary data source.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. Supplementary for urology.

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
| ICD-10 diagnosis codes | Cannot link procedures to clinical reasons. Cannot tell if a cystoscopy was for hematuria workup vs. bladder cancer surveillance. |
| NDC drug codes | Cannot see prescriptions. No alpha-blocker trial before BPH surgery, no OAB medication management, no testosterone therapy tracking. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track post-surgical outcomes. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual patient journeys or timelines. |
| Service location details | Limited place-of-service information. |

**Urologic relevance:** Medicaid covers a younger, lower-income population. Some urologic volume does exist in Medicaid (kidney stones, UTIs, hematuria workup in younger adults), but it is thin compared to Medicare. The Medicaid file is supplementary, not primary, for urology.

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every urologist by NPI, taxonomy code (208800000X = Urology), practice address, and organizational affiliation. Free, always available. This is how we build the provider roster.

Subspecialty taxonomy codes to flag and exclude from general urology scoring:

| Taxonomy Code | Subspecialty | Why Exclude |
|---|---|---|
| 2088P0231X | Urologic Oncology | Practice pattern dominated by cancer surgery, not general urology |
| 2088F0040X | Female Pelvic Medicine & Reconstructive Surgery | Narrow surgical scope, different code profile |
| 2088P0210X | Pediatric Urology | Different patient population, different code set entirely |


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given urologist:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what procedures they perform) | Why they performed them (no diagnosis codes in Medicaid file, limited in Medicare aggregate) |
| How often they bill each code (volume) | What they prescribed (no Rx data) |
| How many patients they see per procedure | Individual patient timelines or sequences |
| Whether they bill diagnostic evaluation codes (cystoscopy, urinalysis, imaging) | Whether a specific patient got a complete hematuria workup |
| Whether they perform therapeutic procedures (tumor treatment, lithotripsy, biopsy) | Whether a patient completed active surveillance protocol |
| Whether they bill PSA testing | Whether shared decision-making preceded the PSA test |
| Their practice location (NPPES) | How outcomes compare across their patient panel |


## 2. What the Codes Tell Us (Analysis on Available Data Only)

Every HCPCS code in the claims files is a fact about what happened. Here is what we can extract from the free data, organized by the quality signals they reveal.


### Cystoscopy: Does This Urologist Perform the Core Diagnostic Procedure?

| Code | Description | Visible In |
|---|---|---|
| 52000 | Cystourethroscopy, diagnostic | Medicare + Medicaid |

**What we can measure:** Whether a urologist bills 52000 and at what rate relative to their patient panel. Cystoscopy is the defining procedure of urology. A general urologist who never performs diagnostic cystoscopy is highly unusual.

**What we cannot measure:** Whether the cystoscopy was indicated for the right clinical reason (hematuria vs. surveillance vs. LUTS evaluation). That requires diagnosis codes we do not have.

**What AUA says should happen:** AUA Microhematuria guideline recommends cystoscopy for patients >= 35 with microhematuria. NMIBC guideline recommends surveillance cystoscopy at defined intervals. LUTS/BPH guideline recommends cystoscopy when indicated for evaluation. Cystoscopy is woven into nearly every major urologic condition.

**How we score it:** Ratio of 52000 services to total unique beneficiaries, percentile ranked against peer cohort.


### PSA Testing: Does This Urologist Engage in Prostate Cancer Early Detection?

| Code | Description | Visible In |
|---|---|---|
| 84153 | PSA, total (prostate-specific antigen) | Medicare + Medicaid |

**What we can measure:** Whether a urologist orders/bills PSA testing and at what rate relative to their Medicare panel. A urologist who sees a substantial number of male Medicare patients but orders very few PSAs may not be following up on prostate health.

**What we cannot measure:** Whether shared decision-making preceded the PSA test (no documentation data). Whether the PSA was a screening test or a surveillance test for known prostate cancer (no diagnosis codes). Whether abnormal results were acted on appropriately.

**What AUA says should happen:** AUA Early Detection of Prostate Cancer guideline recommends shared decision-making for PSA testing in men 55-69, with the option to begin at 40-54 for higher-risk populations. For men with a prior diagnosis, PSA monitoring is standard.

**How we score it:** Ratio of 84153 services to total unique beneficiaries, percentile ranked against peer cohort.

Caveat: PSA tests are frequently ordered by primary care, not by urologists. A urologist may rely on referring PCPs for PSA ordering. However, many urologists do bill 84153 directly when managing prostate patients, and a urologist with zero PSA billing but a large Medicare panel is at least worth flagging.


### Urinalysis: Does This Urologist Perform the Fundamental First-Line Test?

| Code | Description | Visible In |
|---|---|---|
| 81003 | Urinalysis, automated | Medicare + Medicaid |
| 81001 | Urinalysis, manual, with microscopy | Medicare + Medicaid |

**What we can measure:** Whether a urologist bills urinalysis and at what rate. Urinalysis is the most fundamental diagnostic test in urology. It is the starting point for hematuria evaluation, UTI workup, BPH/LUTS evaluation, and kidney stone assessment.

**What we cannot measure:** Whether the urinalysis was ordered at the right clinical moment for the right indication.

**What AUA says should happen:** AUA Microhematuria guideline begins with urinalysis. UTI guidelines begin with urinalysis. BPH/LUTS guideline includes urinalysis as part of initial evaluation. OAB guideline recommends urinalysis to rule out infection. A urologist who does not routinely perform urinalysis is skipping the standard first step.

**How we score it:** Ratio of (81003 + 81001 services) to total E/M visits, percentile ranked against peer cohort.


### In-Office Diagnostics: Does This Urologist Have Comprehensive Evaluation Capability?

| Code | Description | Visible In |
|---|---|---|
| 76857 | Ultrasound, pelvic (non-obstetric), limited | Medicare + Medicaid |
| 76770 | Ultrasound, retroperitoneal (renal) | Medicare + Medicaid |
| 51798 | Measurement of post-void residual urine | Medicare + Medicaid |
| 51741 | Complex cystometrogram (urodynamics) | Medicare + Medicaid |

**What we can measure:** Whether a urologist bills any of these four diagnostic modalities. Each one maps to a different AUA guideline recommendation.

**What we cannot measure:** Whether the diagnostic was clinically indicated, or whether the results changed management.

**What AUA says should happen:**
- BPH/LUTS guideline: recommends post-void residual (51798) measurement and may involve renal ultrasound (76770) to assess upper tract.
- OAB/Incontinence guideline: recommends urodynamic evaluation (51741) before invasive treatment.
- Hematuria guideline: upper tract imaging (76770) is part of complete evaluation.
- A urologist with in-office diagnostic capability can provide a more complete, guideline-concordant evaluation without referring out.

**How we score it:** Count of the 4 diagnostic modalities the provider bills (0-4). Score = (modalities_billed / 4) * 100.


### Therapeutic Procedures: Does This Urologist Treat What They Find?

| Code | Description | Visible In |
|---|---|---|
| 52310 | Cystoscopy with stent removal | Medicare + Medicaid |
| 52214 | Cystoscopy with fulguration | Medicare + Medicaid |
| 52234 | Cystoscopy with tumor treatment, small | Medicare + Medicaid |
| 52281 | Cystoscopy with urethral dilation | Medicare + Medicaid |
| 52287 | Cystoscopy with Botox injection | Medicare + Medicaid |
| 55700 | Prostate needle biopsy | Medicare + Medicaid |
| 55866 | Laparoscopic/robotic prostatectomy | Medicare + Medicaid |
| 50590 | Lithotripsy (ESWL) | Medicare + Medicaid |

**What we can measure:** How many distinct procedure categories a urologist bills out of these 8. This is a proxy for procedural breadth.

**What we cannot measure:** Surgical outcomes, complication rates, or whether the procedure was the appropriate treatment choice.

**What AUA says should happen:** A general urologist should manage a wide scope of urologic conditions procedurally. Missing entire procedure categories suggests either a very narrow practice (which may be fine for a subspecialist, but unusual for a general urologist) or referral of cases that could be managed locally.

**How we score it:** (procedure_types_billed / 8) * 100. Provider performing 6 of 8 procedure categories scores 75.


### Prostate Biopsy Relative to PSA Volume: Does This Urologist Follow Through?

| Code | Description | Visible In |
|---|---|---|
| 55700 | Prostate needle biopsy | Medicare + Medicaid |
| 84153 | PSA, total | Medicare + Medicaid |

**What we can measure:** The ratio of biopsy volume to PSA volume for the same provider. A urologist who orders many PSAs but never biopsies may be screening without clinical follow-through. Not all elevated PSAs warrant biopsy, but zero biopsies with high PSA volume is a signal.

**What we cannot measure:** Whether the biopsy decision was clinically appropriate (we need PSA values, DRE findings, risk calculators, and patient preferences). Whether MRI-targeted biopsy was used (different CPT code, 55706 or image guidance codes).

**What AUA says should happen:** AUA Prostate Cancer Early Detection guideline recommends biopsy when PSA and clinical findings warrant it, following shared decision-making. Active surveillance is appropriate for many patients. We cannot distinguish appropriate non-biopsy from neglect.

**How we score it:** Ratio of 55700 services to 84153 services, percentile ranked against peer cohort among providers who bill both codes.


### Urodynamics: Does This Urologist Evaluate Before Treating OAB/Incontinence?

| Code | Description | Visible In |
|---|---|---|
| 51741 | Complex cystometrogram (urodynamics) | Medicare + Medicaid |

**What we can measure:** Whether a urologist performs urodynamics at all, and at what rate relative to their panel.

**What we cannot measure:** Whether urodynamics preceded invasive treatment (no patient-level timeline). Whether OAB/incontinence is even part of this provider's practice (no diagnosis codes).

**What AUA says should happen:** AUA OAB guideline and Incontinence guideline recommend urodynamic evaluation before invasive treatments (surgery, neuromodulation, Botox). A urologist who treats OAB/incontinence but never performs urodynamics may be skipping the evaluation step.

**How we score it:** Two components. Binary: does the provider bill 51741 at all? (0 or 100). Rate: percentile rank of 51741/total beneficiaries among providers who bill it. Combined: (binary * 0.30) + (rate_percentile * 0.70). Not all urologists treat OAB/incontinence, so the binary component gives partial credit just for having the capability.


## 3. What We Can and Cannot Score (Honest Assessment)

Out of the 3 scoring domains and approximately 95 AUA clinical guideline recommendations across all major urologic conditions, here is what is scorable with the free CMS data:

| Domain | Weight | Scorable Measures | Not Scorable | Why Not |
|---|---|---|---|---|
| Diagnostic Evaluation Practice | 40% | 4 measures (cystoscopy rate, PSA rate, urinalysis rate, in-office diagnostic breadth) | ~35 guideline recs | No dx codes to link tests to indications, no Rx to verify medication trials, no patient-level data for workup completeness |
| Procedural Practice | 35% | 2 measures (procedure breadth, therapeutic-to-diagnostic ratio) | ~30 guideline recs | No outcomes, no complication data, no dx linkage to verify appropriateness |
| Comprehensive Evaluation Signals | 25% | 2 measures (biopsy-to-PSA ratio, urodynamics practice) | ~22 guideline recs | No Rx data, no patient timelines, no dx codes for condition-specific scoring |
| **Total** | | **8 measures mapping to ~8 of ~95 AUA recommendations** | **~87** | |

**Bottom line:** With free CMS data, we can score approximately 8 of ~95 AUA guideline recommendations. These concentrate in two areas: diagnostic evaluation patterns (does the urologist perform the standard workup procedures?) and procedural breadth (does the urologist manage a full scope of urologic conditions?). We are blind to everything that requires diagnosis codes, prescription data, outcome data, or patient-level timelines.

The 8 scorable measures still tell a meaningful story. A urologist who performs diagnostic cystoscopy, orders PSAs and urinalysis, has in-office diagnostic capability, treats across multiple procedure categories, and follows through on abnormal findings is practicing differently from one who does not. The score will not be a complete clinical quality assessment, but it is a defensible utilization profile.


### What's Not Scorable and Why

| AUA Guideline Area | Why Not Scorable from Free CMS Data |
|---|---|
| BPH: medication trial (alpha-blocker, 5-ARI) before surgery | No Rx data. Cannot see whether tamsulosin/finasteride was prescribed before a TURP. |
| BPH: watchful waiting counseling | No documentation or encounter detail. Counseling is not separately billed. |
| Prostate cancer: shared decision-making for PSA | No documentation data. The decision-making conversation is not a billing event. |
| Prostate cancer: appropriate active surveillance | No dx codes (cannot identify who has prostate cancer), no patient-level timeline (cannot track surveillance intervals). |
| Bladder cancer: intravesical BCG therapy | No drug administration linkage in aggregated data. BCG is a drug, not a procedure code. |
| Bladder cancer: surveillance interval adherence (NMIBC) | No patient-level timeline. Cannot measure whether cystoscopy happened at 3, 6, 12 months. |
| Hematuria: complete workup (UA + imaging + cystoscopy for same patient) | No patient-level linkage. We see each service in aggregate but cannot connect them to the same patient. No dx codes. |
| Kidney stones: metabolic evaluation (24-hour urine) | No dx codes to identify stone patients. 24-hour urine collection codes (81050) may be billed by the lab, not the urologist. |
| Kidney stones: dietary and fluid counseling | No documentation. Counseling is not separately billed. |
| OAB: behavioral therapy before medication | No Rx data, no documentation. Cannot verify step therapy. |
| OAB: medication trial before invasive treatment | No Rx data. Cannot see whether antimuscarinics/beta-3 agonists were tried before Botox. |
| Incontinence: type-specific evaluation (stress vs. urgency) | No dx codes to distinguish stress from urgency incontinence. Different workup, different treatment. |
| Testosterone deficiency: appropriate testing before treatment | No Rx data (cannot see testosterone prescriptions), no dx codes (cannot confirm low-T diagnosis). |
| UTI: antibiotic appropriateness and stewardship | No Rx + dx linkage. Cannot match antibiotic choice to pathogen or clinical context. |
| Erectile dysfunction: cardiovascular risk assessment | No dx codes. Cannot verify whether CV workup preceded ED treatment. |
| Post-surgical outcomes (all conditions) | No outcome data. No readmission, no complication, no functional outcome tracking. |


## 4. Business Logic: How We Compare What They Did vs. What AUA Says

For a given NPI, here is exactly how we compute each measure. Every calculation uses only the free CMS data described in Section 1.


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry
**Filter:** taxonomy_code = '208800000X' (Urology, general). Exclude subspecialists: 2088P0231X (urologic oncology), 2088F0040X (female pelvic medicine), 2088P0210X (pediatric urology).
**Filter by state:** provider_state = target state (e.g., 'MA')
**Filter by entity:** Entity Type 1 (Individual NPI). Excludes organizational NPIs.
**Output:** A table of general urology NPIs with practice address, entity type, and taxonomy.

This is the denominator. Every NPI in this roster gets scored.


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners (primary) + Medicaid Provider Spending (supplementary)
**Join:** On NPI (npi in Medicare, servicing_npi in Medicaid)
**Aggregate:** Sum across the measurement year (e.g., 2023) to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (service/claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes. Medicare and Medicaid claims are additive. In practice, Medicare will dominate for most urologists.


### Geographic Grouping for Percentile Scoring

Several measures use percentile ranking ("rank this provider against all other urologists"). The peer cohort for percentile scoring is grouped by geography:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All urology NPIs (taxonomy 208800000X, >= 100 total Medicare services) in the same state | Primary scoring. A urologist in MA is ranked against MA peers. |
| **National** (fallback) | All qualifying urology NPIs across all states | When state cohort has < 30 providers. Also useful for cross-state benchmarking. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | Urban vs. rural comparison. Not implemented now, but the output schema carries the fields to support it later. |

The peer cohort used for percentile ranks directly affects scores. A urologist at the 80th percentile in a high-performing state might be at the 60th nationally. The output records which cohort was used.

**Peer Cohort Definition:**

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 208800000X (Urology, general) | Excludes subspecialists, other specialties |
| State | Same state as the provider being scored | Practice patterns vary by state |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort percentiles |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |


---

### DOMAIN 1: Diagnostic Evaluation Practice (Weight: 40%)


**Measure 1A: Cystoscopy Rate**

What it answers: How frequently does this urologist perform diagnostic cystoscopy relative to their patient panel?

```
cystoscopy_services = SUM(total_services) WHERE hcpcs_code = 52000
total_beneficiaries = MAX(total_beneficiaries) across all HCPCS codes for this NPI
    (or from the "By Provider" Medicare file)

metric = cystoscopy_services / total_beneficiaries
```

AUA standard: Cystoscopy is the central diagnostic tool of urology. AUA guidelines recommend it for hematuria evaluation (Microhematuria guideline), bladder cancer surveillance (NMIBC guideline), and LUTS evaluation when indicated (BPH guideline). A general urologist who never performs cystoscopy is highly unusual.

Score: Percentile rank of `metric` among all general urology NPIs in the state. 90th percentile = score of 90.

Edge cases:
- If `total_beneficiaries` < 10, insufficient volume. Mark as insufficient.
- If `cystoscopy_services` = 0, the provider either does not do cystoscopy (unusual for a general urologist) or refers all endoscopy to another provider. Score = 0.


**Measure 1B: PSA Screening Pattern**

What it answers: Does this urologist order/bill PSA testing at a rate consistent with managing prostate health?

```
psa_services = SUM(total_services) WHERE hcpcs_code = 84153
total_beneficiaries = (same as 1A)

metric = psa_services / total_beneficiaries
```

AUA standard: AUA Early Detection of Prostate Cancer guideline recommends shared decision-making for PSA in men 55-69. A urologist seeing a substantial Medicare panel (predominantly men 65+) should have meaningful PSA volume, either from screening/surveillance orders or from management of known prostate conditions.

Score: Percentile rank of `metric` among peers.

Caveat: Many PSA tests are ordered by PCPs, not urologists. A urologist who relies on referring PCPs for PSA ordering will have a lower rate. This does not necessarily mean they are not following the guideline. However, zero PSA billing with a large Medicare panel is a signal.


**Measure 1C: Urinalysis Rate**

What it answers: Does this urologist routinely perform urinalysis as part of their evaluation?

```
ua_services = SUM(total_services) WHERE hcpcs_code IN (81003, 81001)

em_codes = [99202, 99203, 99204, 99205,   -- new patient
            99211, 99212, 99213, 99214, 99215]  -- established patient

total_em_services = SUM(total_services) WHERE hcpcs_code IN em_codes

metric = ua_services / total_em_services
```

AUA standard: Urinalysis is the fundamental first-line test in urology. AUA Microhematuria, UTI, BPH/LUTS, and OAB guidelines all begin with urinalysis. A urologist who does not routinely perform urinalysis is skipping the standard first step of workup.

Score: Percentile rank of `metric` among peers.

Edge cases:
- If `total_em_services` = 0, no E/M visit data. Mark as insufficient.
- If `total_em_services` < 10, insufficient volume. Mark as insufficient.
- Some urologists may refer urinalysis to external labs. If so, they will score low here. Known limitation.


**Measure 1D: In-Office Diagnostic Breadth**

What it answers: Does this urologist have comprehensive in-office diagnostic capability?

```
diagnostic_modalities = {
    'pelvic_ultrasound':  [76857],
    'renal_ultrasound':   [76770],
    'post_void_residual': [51798],
    'urodynamics':        [51741]
}

modalities_billed = COUNT of diagnostic_modalities keys WHERE
    SUM(total_services) for ANY code in that modality > 0

metric = modalities_billed  -- integer 0-4
```

AUA standard: BPH guideline recommends PVR measurement and may involve renal imaging. OAB/Incontinence guideline recommends urodynamics before invasive treatment. Hematuria guideline recommends upper tract imaging. A urologist with in-office diagnostic capability can provide more complete, guideline-concordant evaluation.

Score: `(modalities_billed / 4) * 100`. Provider with 3 of 4 modalities scores 75.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.35) + (measure_1b * 0.25) + (measure_1c * 0.25) + (measure_1d * 0.15)
```


---

### DOMAIN 2: Procedural Practice (Weight: 35%)


**Measure 2A: Procedure Breadth**

What it answers: Does this urologist perform a full range of therapeutic procedures, or only a narrow subset?

```
therapeutic_procedures = {
    'stent_removal':      [52310],
    'fulguration':        [52214],
    'tumor_treatment':    [52234],
    'urethral_dilation':  [52281],
    'botox_injection':    [52287],
    'prostate_biopsy':    [55700],
    'prostatectomy':      [55866],
    'lithotripsy':        [50590]
}

procedure_types_billed = COUNT of therapeutic_procedures keys WHERE
    SUM(total_services) for ANY code in that category > 0

metric = procedure_types_billed  -- integer 0-8
```

AUA standard: A general urologist should manage a broad scope of urologic conditions. The 8 procedure categories above span the core of general urology: endoscopic management, prostate cancer diagnosis and treatment, stone management, and OAB treatment. Missing entire categories suggests either a very narrow practice or referral of cases that a general urologist could manage locally.

Score: `(procedure_types_billed / 8) * 100`. Provider performing 6 of 8 categories scores 75.

Note: Not every urologist performs robotic prostatectomy (55866). This is an advanced procedure often concentrated at high-volume centers. Missing this one category alone should not significantly penalize a general urologist. But missing 4+ categories is a meaningful signal.


**Measure 2B: Therapeutic-to-Diagnostic Cystoscopy Ratio**

What it answers: When this urologist finds something on cystoscopy, do they treat it?

```
therapeutic_cysto_services = SUM(total_services) WHERE hcpcs_code IN
    (52214, 52234, 52310, 52281, 52287)

diagnostic_cysto_services = SUM(total_services) WHERE hcpcs_code = 52000

metric = therapeutic_cysto_services / diagnostic_cysto_services
```

AUA standard: A urologist who performs many diagnostic cystoscopies but never treats what they find is unusual. This ratio is a proxy for whether the provider manages findings vs. only diagnosing. Most cystoscopies are surveillance/diagnostic with a minority requiring intervention, so expected ratio is roughly 0.10-0.40. A ratio of 0 (many diagnostics, zero therapeutics) is a flag.

Score: Percentile rank of `metric` among peers who bill both diagnostic and therapeutic cystoscopy.

Edge cases:
- If `diagnostic_cysto_services` = 0, cannot compute ratio. Skip this measure.
- Very high ratios (> 1.0) may indicate a provider who only does therapeutic work and refers diagnostic cystoscopy elsewhere. Flag but do not penalize.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.50) + (measure_2b * 0.50)
```


---

### DOMAIN 3: Comprehensive Evaluation Signals (Weight: 25%)


**Measure 3A: Biopsy Rate Relative to PSA Volume**

What it answers: For a urologist who orders PSAs, do they follow through with biopsies when warranted?

```
biopsy_services = SUM(total_services) WHERE hcpcs_code = 55700
psa_services = SUM(total_services) WHERE hcpcs_code = 84153

metric = biopsy_services / psa_services
```

AUA standard: AUA Prostate Cancer Early Detection guideline recommends biopsy when PSA and clinical findings warrant it. Not all elevated PSAs should lead to biopsy (many are appropriately observed or further evaluated with MRI). But a urologist with high PSA volume and zero biopsies may be screening without follow-through.

Score: Percentile rank of `metric` among peers who bill both 55700 and 84153.

Edge cases:
- If `psa_services` = 0, skip this measure (provider does not bill PSA).
- Expected ratio varies widely. Some urologists will have a ratio of 0.05 (1 biopsy per 20 PSAs), others 0.30. Both can be appropriate depending on patient population. We are scoring relative to peers, not against an absolute standard.


**Measure 3B: Urodynamics Practice**

What it answers: Does this urologist evaluate bladder function before treating OAB/incontinence?

```
urodynamics_services = SUM(total_services) WHERE hcpcs_code = 51741
total_beneficiaries = (same as before)

metric_binary = 1 IF urodynamics_services > 0 ELSE 0
metric_rate = urodynamics_services / total_beneficiaries (if > 0)
```

AUA standard: AUA OAB and Incontinence guidelines recommend urodynamic evaluation before invasive treatment (surgery, neuromodulation, intravesical Botox). A urologist who treats OAB/incontinence but never performs urodynamics may be skipping the evaluation step.

Score: Two components.
- Binary: does the provider bill 51741 at all? (0 or 100)
- Rate: percentile rank of `metric_rate` among providers who DO bill 51741.
- Combined: `(binary * 0.30) + (rate_percentile * 0.70)`. A provider who never performs urodynamics gets 0 for this measure. A provider who performs it but at low volume gets a partial score.

Caveat: Not all urologists treat OAB/incontinence. A urologist whose practice is dominated by stones and prostate cancer may legitimately have zero urodynamics volume. This is a known limitation. The 25% domain weight keeps this from dominating the composite.


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

**If a domain is missing:** Redistribute its weight proportionally. Example: if Domain 3 is missing (provider does not bill PSA or urodynamics), the composite becomes `(domain_1 * 0.53) + (domain_2 * 0.47)`.


---

### Worked Example

Dr. A is a general urologist in Massachusetts. Here is her claims profile for 2023:

| Metric | Raw Value | Peer Percentile | Notes |
|---|---|---|---|
| Total Medicare beneficiaries | 820 | -- | Moderate-volume practice |
| Total E/M services | 2,450 | -- | |
| **Domain 1: Diagnostic Evaluation** | | | |
| Cystoscopy rate (52000/beneficiaries) | 385/820 = 0.47 | 72nd | She scopes about half her patients |
| PSA rate (84153/beneficiaries) | 210/820 = 0.26 | 58th | Moderate PSA ordering |
| Urinalysis rate (UA/E/M) | 1,680/2,450 = 0.69 | 81st | UA on most visits |
| In-office diagnostic breadth | 3 of 4 (no urodynamics) | 75 (fixed) | Missing urodynamics |
| **Domain 1 Score** | (72*0.35)+(58*0.25)+(81*0.25)+(75*0.15) | **71.2** | |
| **Domain 2: Procedural Practice** | | | |
| Procedure breadth | 5 of 8 | 62.5 (fixed) | No prostatectomy, no lithotripsy, no Botox |
| Therapeutic/diagnostic cysto ratio | 95/385 = 0.25 | 64th | Treats some findings |
| **Domain 2 Score** | (62.5*0.50)+(64*0.50) | **63.3** | |
| **Domain 3: Comprehensive Evaluation** | | | |
| Biopsy/PSA ratio | 42/210 = 0.20 | 71st | Reasonable follow-through |
| Urodynamics practice | 0 services | 0 (binary=0, rate=N/A) | Does not do urodynamics |
| **Domain 3 Score** | (71*0.50)+(0*0.50) | **35.5** | |
| **Composite** | (71.2*0.40)+(63.3*0.35)+(35.5*0.25) | **59.5** | |

Dr. A scores 59.5. She has strong diagnostic evaluation habits (high urinalysis rate, good cystoscopy volume) but limited procedural breadth and no urodynamics practice. Domain 3 drags her composite down because she does not perform urodynamics and is only scored on the biopsy-to-PSA ratio.

Compare with Dr. B in the same state:

| Metric | Raw Value | Peer Percentile |
|---|---|---|
| Total Medicare beneficiaries | 1,150 | -- |
| Total E/M services | 3,800 | -- |
| Cystoscopy rate | 680/1,150 = 0.59 | 88th |
| PSA rate | 420/1,150 = 0.37 | 79th |
| Urinalysis rate | 3,200/3,800 = 0.84 | 92nd |
| In-office diagnostic breadth | 4 of 4 | 100 |
| **Domain 1 Score** | (88*0.35)+(79*0.25)+(92*0.25)+(100*0.15) | **88.6** |
| Procedure breadth | 7 of 8 | 87.5 |
| Therapeutic/diagnostic cysto ratio | 0.32 | 78th |
| **Domain 2 Score** | (87.5*0.50)+(78*0.50) | **82.8** |
| Biopsy/PSA ratio | 0.18 | 65th |
| Urodynamics practice | 38 services, binary=100, rate=73rd | (100*0.30)+(73*0.70) = 81.1 |
| **Domain 3 Score** | (65*0.50)+(81.1*0.50) | **73.1** |
| **Composite** | (88.6*0.40)+(82.8*0.35)+(73.1*0.25) | **82.7** |

Dr. B scores 82.7. Higher volume, broader diagnostic and procedural scope, and she performs urodynamics. Her claims pattern is more consistent with a urologist following AUA guideline recommendations across multiple conditions.


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
| is_subspecialist | boolean | True if taxonomy is not 208800000X |
| **Cohort Context** | | |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used for percentile ranks |
| percentile_cohort_state | string | State of the peer cohort used for percentile scoring (or "US" if national) |
| percentile_cohort_size | int | Number of peers in the cohort |
| **Volume** | | |
| total_beneficiaries | int | Estimated total unique patients |
| total_services | int | Total claim lines across all codes |
| total_em_services | int | Total E/M services (99202-99215) |
| **Domain 1: Diagnostic Evaluation** | | |
| cystoscopy_services | int | Count of 52000 services |
| cystoscopy_rate | float | Measure 1A metric (52000 / total beneficiaries) |
| cystoscopy_percentile | float | Measure 1A percentile rank |
| psa_services | int | Count of 84153 services |
| psa_rate | float | Measure 1B metric (84153 / total beneficiaries) |
| psa_percentile | float | Measure 1B percentile rank |
| urinalysis_services | int | Count of 81003 + 81001 services |
| urinalysis_rate | float | Measure 1C metric (UA / E/M services) |
| urinalysis_percentile | float | Measure 1C percentile rank |
| diagnostic_modalities_billed | int | Measure 1D metric (0-4) |
| diagnostic_breadth_score | float | (modalities / 4) * 100 |
| domain_1_score | float | Diagnostic Evaluation domain (0-100) |
| **Domain 2: Procedural Practice** | | |
| procedure_types_billed | int | Measure 2A metric (0-8) |
| procedure_breadth_score | float | (types / 8) * 100 |
| therapeutic_cysto_services | int | Count of therapeutic cystoscopy codes |
| diagnostic_cysto_services | int | Count of 52000 services |
| therapeutic_diagnostic_ratio | float | Measure 2B metric |
| therapeutic_diagnostic_percentile | float | Measure 2B percentile rank |
| domain_2_score | float | Procedural Practice domain (0-100) |
| **Domain 3: Comprehensive Evaluation** | | |
| biopsy_services | int | Count of 55700 services |
| biopsy_psa_ratio | float | Measure 3A metric (55700 / 84153) |
| biopsy_psa_percentile | float | Measure 3A percentile rank |
| urodynamics_services | int | Count of 51741 services |
| urodynamics_binary | int | 1 if any 51741 billed, else 0 |
| urodynamics_rate | float | 51741 / total beneficiaries |
| urodynamics_score | float | Measure 3B combined score |
| domain_3_score | float | Comprehensive Evaluation domain (0-100) |
| **Composite** | | |
| composite_score | float | Weighted composite (0-100), null if insufficient data |
| scorable_domains | int | Number of domains with enough data to score (0-3) |
| **Confidence** | | |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing volume as a proxy for clinical practice quality. This is real data from credible sources, but it does not directly measure the thing AUA is asking for (e.g., "did this patient get urodynamics before Botox injection?" vs. "does this provider bill urodynamics at a rate consistent with performing pre-treatment evaluation").


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **MA APCD (All-Payer Claims Database)** | $5-7K, 2-4 weeks | Individual patient-level claims with diagnosis codes AND Rx data across ALL payers. Inpatient + outpatient. The most complete picture possible for MA. | +30-35 guidelines. Unlocks: BPH medication management (alpha-blocker/5-ARI trial before surgery), OAB step therapy (behavioral therapy > medication > invasive), testosterone deficiency workup (dx + Rx linkage), antibiotic stewardship for UTI, post-surgical readmission tracking, condition-specific procedure appropriateness. |
| **State Cancer Registry (MA Cancer Registry)** | Free (application required), 4-8 weeks | Prostate and bladder cancer incidence, staging, treatment, and outcomes linked to treating providers. | +8-10 guidelines. Unlocks: prostate cancer active surveillance adherence, bladder cancer stage-appropriate treatment (NMIBC vs. MIBC pathway concordance), radical cystectomy outcomes, prostatectomy outcomes. |
| **Medicare Part D Prescriber Data** | Free (CMS) | NPI-level aggregate Rx data for Medicare Part D. Shows which drugs a provider prescribes and in what volume. | +10-12 guidelines. Unlocks: BPH medication prescribing patterns, OAB medication management, testosterone prescribing, alpha-blocker use before stone passage. Available now but requires separate pipeline. |
| **EHR Data (Direct or via Registry)** | Varies ($50K-$500K+) | Documentation-level clinical detail. Lab values, imaging results, surgical outcomes, patient-reported outcomes. | Remaining guidelines. Unlocks: shared decision-making documentation, PSA values and trends, Gleason scores, post-surgical functional outcomes (continence, potency), stone composition and metabolic workup, cystoscopy findings documentation. |
| **Medicaid T-MSIS Full Access** | Restricted (DUA required) | National Medicaid claims at the claim line level. Patient-level, dx codes, Rx data, institutional. | Same as MA APCD for Medicaid population. Adds younger adult urologic conditions (stones, UTIs). |


### Unlock Path

| Stage | Data | Guideline Recommendations Scorable | Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Provider Spending + NPPES | ~8 of ~95 | 3 domains, partial |
| +Medicare Part D (free, separate pipeline) | Add NPI-level Rx data | ~20 of ~95 | Adds medication management for BPH, OAB, testosterone |
| +MA APCD ($5-7K) | Add all-payer patient-level claims with dx and Rx | ~55 of ~95 | Adds condition-specific scoring, workup completeness, step therapy |
| +State Cancer Registry (free, application) | Add cancer staging and outcomes | ~65 of ~95 | Adds cancer-specific guideline scoring |
| +EHR (varies) | Add documentation and clinical detail | ~85 of ~95 | Near-complete, adds outcomes and shared decision-making |
| Full (all above) | Everything | ~85-90 of ~95 | Remaining 5-10 require patient-reported outcomes or long-term follow-up |


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring utilization patterns, not clinical quality.** The free data tells us what a urologist billed. It does not tell us whether the care was appropriate, timely, or effective. A high cystoscopy rate means the provider performs cystoscopy frequently. It does not confirm the cystoscopy was indicated for each patient.

**No diagnosis codes means we cannot link procedures to clinical indications.** This is the single biggest limitation. We cannot tell if a cystoscopy was for hematuria workup (appropriate) or unnecessary surveillance (potentially inappropriate). We cannot tell if a PSA was a screening test for a healthy man or a surveillance test for a prostate cancer patient. Without the clinical context, we can only measure whether things happened, not whether they should have happened.

**No prescription data means we are blind to medical management.** A huge portion of urology is medical management: alpha-blockers and 5-alpha-reductase inhibitors for BPH, antimuscarinics and beta-3 agonists for OAB, testosterone replacement, antibiotics for UTI. We cannot see any of this from free CMS data. A urologist who excels at medical management but performs few procedures will score lower than one who scopes and biopsies aggressively. This is a significant bias.

**Data is aggregated, not patient-level.** We see "Provider X billed 52000 385 times in 2023." We do not see "Patient Y received a diagnostic cystoscopy as part of their hematuria workup, followed by imaging and urinalysis." We cannot measure whether a complete workup happened for a given patient. We can only measure whether the provider performs the component parts of workups in aggregate.

**8 of ~95 AUA guideline recommendations is a partial score.** We are transparent about this. The composite represents a utilization profile, not a comprehensive clinical quality assessment. It answers: "Does this urologist's billing pattern suggest they perform diagnostic evaluations and procedures consistent with AUA guideline recommendations?" It does not answer: "Does this urologist deliver high-quality urologic care across all conditions?"

**Medicare data is strong for urology but Medicaid adds little.** The Medicare file has high urologic volume (the core patient population is 65+). The Medicaid file adds some younger adult volume (stones, UTIs, hematuria in younger patients) but it is thin. This is the opposite of pediatrics, where Medicaid was the primary source. For urology, Medicare is the primary source and losing Medicaid is not catastrophic.

**The Medicaid Provider Spending dataset was temporarily unavailable as of late March 2026.** If only Medicare data is available, we can still score most measures. The payer diversity score (separate doc) will be impacted, but the guideline concordance score is primarily Medicare-driven and will be minimally affected.

**Procedural breadth rewards breadth over depth.** A urologist who is the best stone surgeon in the state but only treats stones will score low on procedure breadth. The score rewards generalists over subspecialists. We mitigate this by excluding taxonomy-flagged subspecialists, but not all narrow-practice urologists use subspecialty taxonomy codes.

**PSA and urinalysis may be billed by labs, not by the ordering urologist.** If a urologist orders a PSA or urinalysis but the lab bills for it, the urologist's claims file will not show those services. This is a known attribution problem that could undercount diagnostic testing for some providers.

**Urodynamics is not relevant for all general urologists.** A urologist whose practice is dominated by prostate cancer and kidney stones has no clinical reason to perform urodynamics. Scoring urodynamics as part of the composite penalizes these providers. The 25% weight on Domain 3 and the 50% weight within Domain 3 keep this effect moderate, but it exists.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 7. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **AUA Guidelines Concordance** (this doc) | Does this urologist follow AUA guideline recommendations? | Clinical quality proxy |
| **Peer Comparison** | Does their billing pattern look like a normal urologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is the practice pattern consistent across Medicare and Medicaid? | Access proxy |
| **Billing Quality** | Are charges, code ratios, and E/M distribution normal? | Pricing + integrity |

Guideline concordance is the most clinically grounded of the five scores. It does not just ask "is this provider normal?" (peer comparison) or "is the volume real?" (volume adequacy). It asks "does this provider do what AUA says they should do?"

Here is what this score catches that the others miss:

| Scenario | Guideline Concordance | Other Scores |
|---|---|---|
| Urologist who does high-volume cystoscopy but never biopsies, never orders PSA, never does urinalysis | Low (missing diagnostic evaluation components in Domains 1 and 3) | Peer comparison might be moderate (cystoscopy is a common code). Volume adequacy is fine (high volume). Billing quality may look normal. |
| Urologist who bills all the right E/M codes in normal ratios but never does any procedures | Low (Domain 2 = 0, Domain 1 may be partial) | Peer comparison catches this too (missing procedure codes). But guideline concordance flags the clinical implication: this provider is not treating what they diagnose. |
| Urologist with broad procedural scope but no diagnostic testing (no UA, no PSA, no imaging) | Low (Domain 1 = low, strong Domain 2) | Peer comparison may not flag this if the procedure codes are common enough. Billing quality does not evaluate diagnostic-to-therapeutic balance. |
| Urologist who scopes, biopsies, tests, and treats across all categories | High | Other scores may also be high (normal peer pattern, adequate volume, clean billing). This is the concordance signal: all five dimensions align for a provider following guidelines. |
| Subspecialist urologic oncologist using general taxonomy code | May be low (narrow scope by design) | Peer comparison also catches this. But guideline concordance score should be excluded (taxonomy 208800000X only) or flagged with `is_subspecialist`. |


---

# PART E: RISKS AND LIMITATIONS

---

These are repeated from Part C in summary form, plus cross-cutting risks.


## 8. Summary of Limitations

1. **Utilization patterns, not clinical quality.** Billing does not equal good care. We measure whether a provider does things, not whether they do them well or for the right reasons.

2. **No diagnosis codes.** Cannot link any procedure to its clinical indication. Cannot distinguish hematuria workup cystoscopy from surveillance cystoscopy. Cannot identify which patients have which conditions.

3. **No prescription data.** Blind to the largest component of urologic management: medication. BPH, OAB, testosterone, UTI treatment, stone prevention, all invisible.

4. **Aggregated data.** Cannot track individual patients through a workup or treatment pathway. Cannot measure whether a specific patient got the right sequence of care.

5. **8 of ~95 guidelines.** This is a partial score. We score what we can see. It covers diagnostic evaluation patterns and procedural breadth. It misses medical management, outcomes, documentation, counseling, and patient-level adherence.

6. **Medicare-dominant data.** Good for urology (the patient population aligns). But Medicaid contributes little, and the Medicaid file was temporarily unavailable as of late March 2026.

7. **Attribution gaps.** Labs, imaging centers, and hospitals may bill for services the urologist ordered. The urologist's claims file may undercount their actual practice.

8. **Procedural breadth bias.** Rewards generalists. A highly skilled narrow-scope urologist scores lower than a mediocre generalist who bills everything. The taxonomy filter helps but does not fully solve this.

9. **No outcomes.** We cannot measure surgical complications, readmissions, functional outcomes, cancer recurrence, or patient satisfaction. The score is about process, not results.


---


## Appendix: AUA Guideline Crosswalk

These are the major AUA clinical practice guidelines and their scorability with free CMS data.

| AUA Guideline | Key Recommendations | Scorable Now? | What's Missing |
|---|---|---|---|
| BPH/LUTS (2021, amended 2023) | Urinalysis, PVR measurement, medication trial before surgery, surgical options stratified by prostate size | Partial (UA rate, PVR as diagnostic breadth) | Rx data for medication trial, prostate size, surgical decision criteria |
| Early Detection of Prostate Cancer (2023) | Shared decision-making, PSA for men 55-69, biopsy when warranted | Partial (PSA rate, biopsy-to-PSA ratio) | Documentation of shared decision-making, PSA values, MRI before biopsy |
| Microhematuria (2020) | Urinalysis, cystoscopy for >= 35, upper tract imaging | Partial (UA rate, cystoscopy rate, renal US as diagnostic breadth) | Patient-level linkage (cannot confirm all 3 steps for same patient) |
| Non-Muscle-Invasive Bladder Cancer (2020, amended 2024) | Surveillance cystoscopy intervals, intravesical BCG, risk stratification | No (except cystoscopy volume as general proxy) | Patient-level timeline, drug data (BCG), risk stratification |
| Muscle-Invasive Bladder Cancer (2017, amended 2024) | Neoadjuvant chemotherapy, radical cystectomy, urinary diversion | No | Dx codes, chemo data, surgical outcomes |
| Kidney Stones (2014, amended 2024) | Metabolic evaluation (24-hr urine), dietary counseling, surgical intervention based on stone size/location | Partial (lithotripsy as procedure breadth) | 24-hr urine attribution, dx codes, stone composition, dietary counseling |
| Overactive Bladder (2019, amended 2023) | Behavioral therapy first, then medication, then invasive (Botox/neuromod/surgery) | Partial (urodynamics, Botox as procedure breadth) | Rx data, behavioral therapy documentation, step-therapy sequencing |
| Urinary Incontinence (2017) | Type-specific evaluation, urodynamics before surgery | Partial (urodynamics practice) | Dx codes to distinguish stress vs. urgency, surgical outcomes |
| Testosterone Deficiency (2018) | Confirm low-T with morning testosterone x2, discuss risks before treatment | No | Rx data, lab values, dx codes |
| Erectile Dysfunction (2018) | CV risk assessment, PDE5i first-line, penile prosthesis for refractory | No | Dx codes, Rx data, outcomes |
| UTI (Recurrent, Uncomplicated - 2019) | Urinalysis + culture, antibiotic stewardship, behavioral counseling | Partial (UA rate only) | Rx data, culture results, dx codes |
