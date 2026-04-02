# Gynecology Claims to Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a gynecologist actually did: every well-woman visit, every colposcopy, every IUD insertion. ACOG clinical practice guidelines tell you what that gynecologist should have done. This document shows how we compare the two and produce a quality score, starting only from the free CMS data we have access to today.

**Important: This document covers gynecology only.** No obstetric content. No delivery codes, no prenatal care, no postpartum care. The scoring focuses on non-pregnancy gynecologic care.


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
| Provider specialty | Taxonomy-derived specialty |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The gynecology picture:** Medicare covers women 65+, which is a meaningful gynecologic population — cervical cancer surveillance, post-menopausal bleeding evaluation, pelvic organ prolapse, vulvar conditions, and ongoing preventive care. The Medicare file will have moderate gynecologic volume. Not as dominant as urology (where the core population is 65+), but not as thin as pediatrics (where Medicare covers almost no children). This file is one of two primary sources.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

Released February 2026. This is where the younger women's gynecologic signal lives.

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
| ICD-10 diagnosis codes | Cannot link procedures to clinical reasons. Cannot tell if an endometrial biopsy was for AUB workup vs. post-menopausal bleeding. |
| NDC drug codes | Cannot see prescriptions. No oral contraceptive prescribing, no hormone replacement therapy, no GnRH agonist tracking for endometriosis. |
| Institutional claims | No hospital admissions, no ED visits. Cannot track post-surgical outcomes or emergency gynecologic visits. |
| Patient-level linkage | Data is aggregated by provider + procedure + month. Cannot track individual patient journeys or timelines. |
| Service location details | Limited place-of-service information. |

**Gynecologic relevance:** Medicaid covers a large population of reproductive-age women. Contraception, STI screening, cervical cancer screening, and well-woman visits for younger women are heavily represented in Medicaid. Unlike urology (where Medicaid is thin) or pediatrics (where Medicaid is dominant), **gynecology draws meaningful volume from both CMS files.** Medicare covers older women; Medicaid covers younger women. Both matter.

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

This is how we build the provider roster. But gynecology has a taxonomy problem that pediatrics and urology do not have. There is no single clean taxonomy code for "gynecologist."


### The Gynecology Taxonomy Problem

In pediatrics, the taxonomy code is simple: 208000000X = Pediatrics. In urology: 208800000X = Urology. One code, one specialty, clean roster.

Gynecology is different. The relevant taxonomy codes are:

| Taxonomy Code | Description | How We Use It |
|---|---|---|
| **207VG0400X** | Gynecology | Direct match. This is a provider who self-identifies as gynecology-only. Primary inclusion. |
| **207V00000X** | Obstetrics & Gynecology (general) | This is the general OB-GYN code. Most providers in the U.S. who do gynecology are coded under this taxonomy, even if they no longer deliver babies. **Requires filtering.** |
| 207VX0201X | Gynecologic Oncology | Subspecialist. Exclude from general gynecology scoring. |
| 207VF0040X | Female Pelvic Medicine & Reconstructive Surgery | Subspecialist. Exclude. |
| 207VM0101X | Maternal-Fetal Medicine | Subspecialist (obstetric focus). Exclude. |
| 207VE0102X | Reproductive Endocrinology & Infertility | Subspecialist. Exclude. |

**The filtering logic for 207V00000X:**

Most OB-GYN providers in the U.S. use the general 207V00000X taxonomy code regardless of whether they deliver babies or not. Many OB-GYN physicians have stopped doing deliveries — either by choice, because of malpractice costs, or because they transitioned to gyn-only practice later in their career. These providers are effectively gynecologists but are coded as general OB-GYN.

To identify gyn-only providers within 207V00000X, we look at their claims:

```
obstetric_delivery_codes = [59400, 59409, 59410, 59414,   -- vaginal delivery
                            59510, 59514, 59515,          -- cesarean delivery
                            59610, 59612, 59614,          -- VBAC
                            59618, 59620, 59622]          -- cesarean after VBAC

delivery_services = SUM(total_services) WHERE hcpcs_code IN obstetric_delivery_codes
total_services = SUM(total_services) across all HCPCS codes

delivery_fraction = delivery_services / total_services
```

**Rule:** If a provider under 207V00000X has `delivery_fraction < 0.05` (less than 5% of total services are delivery codes), they are effectively gyn-only and are included in the gynecology peer cohort.

**Why 5%?** A provider who does 2,000 total services per year and bills 80 deliveries (4%) is doing occasional deliveries but is primarily a gynecologist. A provider billing 400 deliveries out of 2,000 services (20%) is an active OB-GYN and should not be in the gyn-only cohort. The 5% threshold is conservative — it captures providers who have largely stopped delivering but may still have a handful of delivery codes from covering a partner or handling an emergency.

This taxonomy filtering approach is unique to gynecology among our scored specialties. It introduces some noise (see Risks, Part E), but it is necessary because there is no other way to build a gyn-only peer cohort from public data.


### What These Three Files Give Us

Between Medicare, Medicaid, and NPPES, here is what we can see for a given gynecologist:

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes they bill (what procedures they perform) | Why they performed them (no diagnosis codes in Medicaid file) |
| How often they bill each code (volume) | What they prescribed (no Rx data) |
| How many patients they see per procedure | Individual patient timelines or sequences |
| Whether they bill well-woman preventive visit codes | Whether patients were referred for mammography or bone density |
| Whether they bill cervical screening collection codes (Q0091) | The Pap/HPV test result (billed by the lab) |
| Whether they perform colposcopy and biopsy | Whether abnormal Pap results triggered timely follow-up |
| Whether they insert IUDs and implants (LARC) | What oral contraceptives they prescribe |
| Whether they perform endometrial biopsy | Whether AUB was the indication |
| Their practice location (NPPES) | How outcomes compare across their patient panel |


## 2. What the Codes Tell Us (Analysis on Available Data Only)

Every HCPCS code in the claims files is a fact about what happened. Here is what we can extract from the free data, organized by the quality signals they reveal.


### Well-Woman Visits: Does This Gynecologist Do Preventive Care?

| Code | Description | Visible In |
|---|---|---|
| 99385 | New patient preventive visit, 18-39 | Medicare + Medicaid |
| 99386 | New patient preventive visit, 40-64 | Medicare + Medicaid |
| 99387 | New patient preventive visit, 65+ | Medicare + Medicaid |
| 99395 | Established patient preventive visit, 18-39 | Medicare + Medicaid |
| 99396 | Established patient preventive visit, 40-64 | Medicare + Medicaid |
| 99397 | Established patient preventive visit, 65+ | Medicare + Medicaid |

**What we can measure:** For each gynecology NPI, we can count the total number of preventive visit claims and the total number of beneficiaries seen for those codes. We can calculate:
- Preventive visit volume per provider
- Ratio of preventive visits to total E/M services (preventive visits as % of all encounters)
- Which age-specific preventive codes they bill (tells us the age distribution of their panel)

**What we cannot measure:** Whether a specific patient received the recommended annual well-woman visit. We see provider-level aggregates, not individual patient visit counts.

**What ACOG says should happen:** ACOG recommends annual well-woman visits for all women. The well-woman visit is the backbone of gynecologic preventive care — it includes cervical screening (when due), breast exam, pelvic exam (when indicated), contraceptive counseling, and screening for STIs, intimate partner violence, and mood disorders. A gynecologist with a low preventive-to-total visit ratio is not providing the preventive care foundation that ACOG recommends.

**How we score it:** Percentile ranking. We rank each provider's preventive-visit-to-total-E/M ratio against all other gynecologists in the state. A provider in the 90th percentile for preventive care volume scores 90.


### Cervical Cancer Screening: Does This Gynecologist Collect Specimens?

| Code | Description | Visible In |
|---|---|---|
| Q0091 | Obtaining screening cervical or vaginal smear (Pap/HPV collection) | Medicare + Medicaid |

**What we can measure:** Whether a gynecologist bills Q0091 and at what rate relative to their preventive visit volume. Q0091 is the collection code — the gynecologist obtains the specimen. The lab then processes it and bills the cytology (88141-88175) and/or HPV DNA test (87624-87625) codes separately.

**What we cannot measure:** The Pap/HPV result (normal, ASC-US, LSIL, HSIL). Whether the screening was performed at the correct interval (every 3 years for Pap alone ages 21-29, every 5 years for Pap+HPV co-testing ages 30-65). Whether women over 65 with adequate prior screening were appropriately exited from screening.

**What ACOG/USPSTF says should happen:** ACOG and USPSTF recommend cervical cancer screening for women 21-65. Pap cytology every 3 years for ages 21-29. Pap + HPV co-testing every 5 years (or Pap alone every 3 years) for ages 30-65. Primary HPV testing every 5 years is also acceptable for 25-65. A gynecologist who sees women for well-woman visits but never collects cervical specimens is not performing a core part of the visit.

**How we score it:** Ratio of Q0091 services to total preventive visit services. Percentile ranked against peers.

Caveat: Q0091 is a collection code, not the test itself. A gynecologist may collect the specimen but we have no way to see the result. Also, because screening intervals are 3-5 years (not annual), a gynecologist should NOT be collecting a Pap at every single visit. A ratio of 100% would actually be concerning (over-screening). We are measuring whether the provider collects at all, and whether the rate is consistent with peers.


### Age-Group Breadth: Does This Gynecologist Serve Women Across the Lifespan?

| Code | Age Group |
|---|---|
| 99385 / 99395 | 18-39 (contraception, STI screening, fertility) |
| 99386 / 99396 | 40-64 (perimenopause, AUB, fibroids, cancer screening) |
| 99387 / 99397 | 65+ (post-menopausal care, prolapse, vulvar conditions) |

**What we can measure:** Whether a gynecologist bills preventive visit codes for 1, 2, or all 3 adult age groups. This is a proxy for practice breadth.

**What ACOG says should happen:** Gynecologic care spans all of adult womanhood. A comprehensive gynecology practice should serve young women (contraception, STIs), middle-aged women (AUB, fibroids, menopause transition), and older women (post-menopausal care, prolapse, cervical surveillance exit). Missing an entire age group suggests a narrow practice.

**How we score it:** Count of age groups with any preventive visits (0-3). Score = (age_groups_with_visits / 3) * 100.


### In-Office Diagnostics: Does This Gynecologist Have Comprehensive Evaluation Capability?

| Code | Description | Visible In |
|---|---|---|
| 76830 | Ultrasound, transvaginal | Medicare + Medicaid |
| 76856 | Ultrasound, pelvic (transabdominal) | Medicare + Medicaid |
| 58100 | Endometrial biopsy (sampling of uterine lining) | Medicare + Medicaid |
| 81003 | Urinalysis, automated | Medicare + Medicaid |

**What we can measure:** Whether a gynecologist bills any of these four diagnostic modalities. Each maps to a different ACOG recommendation.

**What we cannot measure:** Whether the diagnostic was clinically indicated, or whether the results changed management.

**What ACOG says should happen:**
- Abnormal uterine bleeding guideline: recommends transvaginal ultrasound (76830) to evaluate uterine anatomy and endometrial biopsy (58100) for women 45+ with AUB or younger women with risk factors.
- Adnexal mass guideline: pelvic ultrasound (76856 or 76830) is the first-line imaging modality.
- Urinalysis (81003) is basic workup for pelvic complaints, urinary symptoms, and routine preventive care.
- A gynecologist with in-office diagnostic capability can provide a more complete, guideline-concordant evaluation without referring out.

**How we score it:** Count of the 4 diagnostic modalities the provider bills (0-4). Score = (modalities_billed / 4) * 100.


### Colposcopy: Does This Gynecologist Follow Up on Abnormal Screening?

| Code | Description | Visible In |
|---|---|---|
| 57452 | Colposcopy, cervix (diagnostic) | Medicare + Medicaid |
| 57454 | Colposcopy with cervical biopsy | Medicare + Medicaid |
| 57460 | Colposcopy with LEEP/cone biopsy | Medicare + Medicaid |

**What we can measure:** Whether a gynecologist performs colposcopy and, among colposcopies performed, what fraction involve biopsy or treatment. A colposcopy without biopsy can be appropriate (no visible lesion), but a provider who does many colposcopies and never biopsies is unusual.

**What we cannot measure:** Whether the colposcopy was triggered by an abnormal Pap (no patient-level linkage). Whether the biopsy result was acted on appropriately. The time interval between abnormal Pap and colposcopy.

**What ACOG says should happen:** ASCCP (closely aligned with ACOG) consensus guidelines recommend colposcopy for most abnormal cervical screening results. When a lesion is visualized, biopsy should be taken. LEEP/cone is the treatment for high-grade dysplasia (CIN2+). A gynecologist who does the well-woman visit, collects the Pap, but then does not perform colposcopy when needed is leaving the evaluation incomplete.

**How we score it:** Among providers who bill any colposcopy codes, the ratio of (57454 + 57460 services) to (57452 + 57454 + 57460 services) — what fraction of colposcopies involve biopsy or treatment? Percentile ranked among colposcopy-performing peers.


### Procedure Breadth: Does This Gynecologist Manage a Full Scope?

| Code | Description | Visible In |
|---|---|---|
| 58100 | Endometrial biopsy | Medicare + Medicaid |
| 57454 | Colposcopy with cervical biopsy | Medicare + Medicaid |
| 57460 | LEEP/cone biopsy | Medicare + Medicaid |
| 58558 | Hysteroscopy with biopsy/polypectomy | Medicare + Medicaid |
| 58300 | IUD insertion | Medicare + Medicaid |
| 58571 | Laparoscopic hysterectomy (total) | Medicare + Medicaid |
| 11981 | Subdermal contraceptive implant insertion | Medicare + Medicaid |

**What we can measure:** How many distinct procedure categories a gynecologist bills out of these 7. This is a proxy for procedural scope.

**What we cannot measure:** Surgical outcomes, complication rates, or whether the procedure was the appropriate treatment choice.

**What ACOG says should happen:** A general gynecologist should have broad procedural capability covering cervical disease management (colposcopy, LEEP), uterine evaluation (endometrial biopsy, hysteroscopy), contraception (IUD, implant), and definitive surgical management (hysterectomy). Missing entire procedure categories suggests either a very narrow practice or referral of cases that could be managed locally.

**How we score it:** (procedure_types_billed / 7) * 100. Provider performing 5 of 7 procedure categories scores 71.


### LARC Provision: Does This Gynecologist Offer Long-Acting Reversible Contraception?

| Code | Description | Visible In |
|---|---|---|
| 58300 | IUD insertion | Medicare + Medicaid |
| 11981 | Subdermal contraceptive implant insertion (e.g., Nexplanon) | Medicare + Medicaid |

**What we can measure:** Whether a gynecologist inserts IUDs and/or implants, and at what rate relative to their patient panel.

**What we cannot measure:** Whether LARC was offered and declined (patient preference is invisible). Whether oral contraceptives or other methods were prescribed (no Rx data). Whether counseling about all contraceptive options occurred.

**What ACOG says should happen:** ACOG recommends that LARCs (IUDs and subdermal implants) should be offered as first-line contraception for most women. They are the most effective reversible methods. A gynecologist who sees reproductive-age women but never inserts an IUD or implant may be deferring this to other providers or may not be offering it.

**How we score it:** Two components. Binary: does the provider bill any LARC insertion code? (0 or 100). Rate: percentile rank of LARC insertions per beneficiary among providers who bill LARC codes. Combined: (binary * 0.30) + (rate_percentile * 0.70).


### Endometrial Evaluation: Does This Gynecologist Evaluate Abnormal Bleeding?

| Code | Description | Visible In |
|---|---|---|
| 58100 | Endometrial biopsy | Medicare + Medicaid |

**What we can measure:** Whether a gynecologist performs endometrial biopsy and at what rate relative to their patient panel.

**What we cannot measure:** Whether AUB was the indication (no dx codes). Whether the patient was 45+ (no patient-level age data linked to procedure). Whether the biopsy result was acted on.

**What ACOG says should happen:** ACOG recommends endometrial biopsy as the standard evaluation for abnormal uterine bleeding in women 45+ and in younger women with risk factors (obesity, anovulation, unopposed estrogen). A gynecologist who never performs endometrial biopsy may be referring all AUB workup, which delays evaluation.

**How we score it:** Binary (30%) + rate percentile (70%). Same structure as LARC provision.


## 3. What We Can and Cannot Score (Honest Assessment)

Out of the 3 scoring domains and approximately 70 ACOG gynecology guideline recommendations, here is what is scorable with the free CMS data:

| Domain | Weight | Scorable Measures | Not Scorable | Why Not |
|---|---|---|---|---|
| Preventive & Screening Practice | 40% | 3 measures (well-woman visit ratio, cervical screening rate, age-group breadth) | ~25 guideline recs | No Pap results, no mammography referral data, no STI treatment data, no counseling documentation, no patient-level screening intervals |
| Diagnostic & Procedural Practice | 35% | 3 measures (in-office diagnostic breadth, colposcopy follow-through, procedure breadth) | ~25 guideline recs | No dx codes to link procedures to indications, no outcomes, no complication data |
| Contraception & Comprehensive Care | 25% | 2 measures (LARC provision rate, endometrial evaluation) | ~12 guideline recs | No Rx data for oral contraceptives/HRT, no counseling documentation, no dx codes |
| **Total** | | **8 measures mapping to ~8 of ~70 ACOG gynecology recommendations** | **~62** | |

**Bottom line:** With free CMS data, we can score approximately 8 of ~70 ACOG gynecology guideline recommendations. These concentrate in three areas: preventive visit and screening patterns (does the gynecologist do well-woman visits and cervical screening?), diagnostic and procedural breadth (does the gynecologist evaluate and treat findings?), and comprehensive care signals (does the gynecologist provide LARC and evaluate abnormal bleeding?). We are blind to everything that requires diagnosis codes, prescription data, lab results, or patient-level timelines.

The 8 scorable measures still tell a meaningful story. A gynecologist who performs frequent well-woman visits, collects cervical specimens, has in-office diagnostic capability, follows through on colposcopy with biopsy, manages a broad procedural scope, and provides LARC is practicing differently from one who does not. The score will not be a complete clinical quality assessment, but it is a defensible utilization profile.


### What's Not Scorable and Why

| ACOG Guideline Area | Why Not Scorable from Free CMS Data |
|---|---|
| Mammography referral rates | No referral/order data. Mammograms are billed by the imaging facility, not the gynecologist. |
| STI treatment appropriateness | No Rx data, no dx codes. Cannot see whether chlamydia/gonorrhea was treated with the correct antibiotic. |
| Contraceptive counseling | No documentation data. Counseling is not a separately billed event in most cases. |
| Hormone therapy appropriateness (menopause) | No Rx data. Cannot see whether HRT was prescribed, at what dose, or for what duration. |
| Endometriosis medical management | No Rx data. GnRH agonists, oral contraceptives, and progestins are invisible. |
| Bone density screening referrals (osteoporosis) | DEXA scans are billed by the imaging facility. No referral data. |
| HPV vaccination counseling/administration | Vaccine codes (90649-90651) are possible but may be billed by PCP, not gynecologist. Attribution is unreliable. |
| Cervical screening interval adherence | No patient-level timeline. Cannot determine if screening happened at the guideline-recommended interval. |
| Follow-up after abnormal Pap (time to colposcopy) | No patient-level linkage. Cannot connect an abnormal Pap to a subsequent colposcopy for the same patient. |
| Pelvic organ prolapse non-surgical management | No documentation. Pessary fitting (57160) is rarely billed. No Rx data for estrogen cream. |
| Urinary incontinence evaluation completeness | No dx codes to link. Cannot tell if incontinence was the indication for any given procedure. |
| Sexual health counseling | No documentation data. Not separately billed. |
| Genetic counseling/BRCA referral | No referral data. |
| Vulvar disease management | No dx codes. Cannot identify vulvar conditions or link them to treatments. |


## 4. Business Logic: How We Compare What They Did vs. What ACOG Says

For a given NPI, here is exactly how we compute each measure. Every calculation uses only the free CMS data described in Section 1.


### Step 0: Build the Provider Roster

**Input:** NPPES NPI Registry

**Primary filter:** taxonomy_code = '207VG0400X' (Gynecology). These providers are included automatically.

**Secondary filter:** taxonomy_code = '207V00000X' (OB-GYN, general). These providers are included ONLY if their delivery code fraction is < 5%.

```
-- For each NPI with taxonomy 207V00000X:
delivery_codes = [59400, 59409, 59410, 59414,
                  59510, 59514, 59515,
                  59610, 59612, 59614,
                  59618, 59620, 59622]

delivery_services = SUM(total_services) WHERE hcpcs_code IN delivery_codes
total_services = SUM(total_services) across ALL HCPCS codes

IF delivery_services / total_services < 0.05:
    include in gynecology roster
ELSE:
    exclude (active OB-GYN, not gyn-only)
```

**Exclude subspecialists:** 207VX0201X (gyn oncology), 207VF0040X (female pelvic medicine), 207VM0101X (maternal-fetal medicine), 207VE0102X (reproductive endocrinology).

**Filter by state:** provider_state = target state (e.g., 'MA')

**Filter by entity:** Entity Type 1 (Individual NPI). Excludes organizational NPIs.

**Output:** A table of gyn-only NPIs with practice address, entity type, taxonomy, and a flag indicating whether they were identified via 207VG0400X (direct) or 207V00000X (filtered).


### Step 1: Load Claims for Each NPI

**Input:** Medicare Physician & Other Practitioners + Medicaid Provider Spending. **Both files are primary for gynecology** — Medicare covers older women, Medicaid covers younger women.

**Join:** On NPI (npi in Medicare, servicing_npi in Medicaid)

**Aggregate:** Sum across the measurement year (e.g., 2023) to get annual totals per NPI per HCPCS code.

The result is one row per NPI per HCPCS code with:
- `total_services` (service/claim count)
- `total_beneficiaries` (unique patients)
- `total_spending` (dollars)

If an NPI appears in both files, sum the volumes. Medicare and Medicaid claims are additive. Unlike pediatrics (Medicaid-dominant) or urology (Medicare-dominant), gynecology draws meaningful volume from both files.


### Geographic Grouping for Percentile Scoring

Several measures use percentile ranking ("rank this provider against all other gynecologists"). The peer cohort for percentile scoring is grouped by geography:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All gynecology NPIs (taxonomy-qualified, >= 100 total services across both CMS files) in the same state | Primary scoring. A gynecologist in MA is ranked against MA peers. |
| **National** (fallback) | All qualifying gynecology NPIs across all states | When state cohort has < 30 providers. Also useful for cross-state benchmarking. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | Urban vs. rural comparison. Not implemented now, but the output schema carries the fields to support it later. |

The peer cohort used for percentile ranks directly affects scores. A gynecologist at the 80th percentile in a high-performing state might be at the 60th nationally. The output records which cohort was used.

**Peer Cohort Definition:**

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207VG0400X OR (207V00000X with <5% delivery code volume) | Captures gyn-only providers, excludes active OB-GYN and subspecialists |
| State | Same state as the provider being scored | Practice patterns vary by state |
| Volume | >= 100 total services across both CMS files combined in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort percentiles |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |


---

### DOMAIN 1: Preventive & Screening Practice (Weight: 40%)


**Measure 1A: Well-Woman Visit Ratio**

What it answers: What share of this gynecologist's patient encounters are preventive well-woman visits?

```
preventive_codes = [99385, 99386, 99387,   -- new patient preventive (adult age groups)
                    99395, 99396, 99397]   -- established patient preventive (adult age groups)

em_codes = [99202, 99203, 99204, 99205,   -- new patient E/M
            99211, 99212, 99213, 99214, 99215,  -- established patient E/M
            99385, 99386, 99387,           -- new patient preventive
            99395, 99396, 99397]           -- established patient preventive

preventive_services = SUM(total_services) WHERE hcpcs_code IN preventive_codes
total_em_services = SUM(total_services) WHERE hcpcs_code IN em_codes

metric = preventive_services / total_em_services
```

ACOG standard: ACOG recommends annual well-woman visits for all women. The well-woman visit is the backbone of gynecologic preventive care. A gynecologist with a high preventive-to-total visit ratio is investing in prevention. A very low ratio suggests a problem-visit-only practice.

Score: Percentile rank of `metric` among all gynecology NPIs in the state. 90th percentile = score of 90.

Edge cases:
- If `total_em_services` = 0, provider has no visit data. Mark as insufficient.
- If `total_em_services` < 10, insufficient volume. Mark as insufficient.


**Measure 1B: Cervical Screening Rate**

What it answers: Among this gynecologist's preventive visits, how often do they collect cervical specimens?

```
q0091_services = SUM(total_services) WHERE hcpcs_code = 'Q0091'
preventive_services = (same as 1A)

metric = q0091_services / preventive_services
```

ACOG/USPSTF standard: Cervical cancer screening is recommended for women 21-65. Because screening intervals are 3-5 years (not annual), we do not expect 100% — that would indicate over-screening. But a gynecologist who sees hundreds of women for preventive visits and never collects a cervical specimen is not performing a core component of the well-woman visit.

Score: Percentile rank of `metric` among peers.

Edge cases:
- If `preventive_services` = 0, skip this measure.
- Q0091 = 0 is a meaningful signal: the provider never collects cervical specimens. Score = 0th percentile.

Caveat: Q0091 is the collection code. The lab codes for Pap cytology (88141-88175) and HPV DNA (87624-87625) are billed by the laboratory, not the gynecologist. We can only see whether the gynecologist collected the specimen.


**Measure 1C: Age-Group Breadth**

What it answers: Does this gynecologist see patients across all adult age groups, or only one segment?

```
age_group_codes = {
    'young_adult':   [99385, 99395],   -- 18-39
    'middle_aged':   [99386, 99396],   -- 40-64
    'older_adult':   [99387, 99397]    -- 65+
}

age_groups_with_visits = COUNT of age_group_codes keys WHERE
    SUM(total_services) for those codes > 0

metric = age_groups_with_visits   -- integer 0-3
```

ACOG standard: Gynecologic care spans all of adult womanhood. A comprehensive gynecology practice should serve women across the age spectrum. Missing entire age groups suggests a narrow practice.

Score: `(age_groups_with_visits / 3) * 100`. Provider covering all 3 age groups scores 100. Provider covering 2 of 3 scores 67.


**Domain 1 Score:**

```
domain_1 = (measure_1a * 0.40) + (measure_1b * 0.35) + (measure_1c * 0.25)
```


---

### DOMAIN 2: Diagnostic & Procedural Practice (Weight: 35%)


**Measure 2A: In-Office Diagnostic Breadth**

What it answers: Does this gynecologist have comprehensive in-office diagnostic capability?

```
diagnostic_modalities = {
    'transvaginal_ultrasound':  [76830],
    'pelvic_ultrasound':        [76856],
    'endometrial_biopsy':       [58100],
    'urinalysis':               [81003]
}

modalities_billed = COUNT of diagnostic_modalities keys WHERE
    SUM(total_services) for ANY code in that modality > 0

metric = modalities_billed  -- integer 0-4
```

ACOG standard: AUB guideline recommends transvaginal ultrasound and endometrial biopsy. Adnexal mass guideline recommends pelvic ultrasound. Urinalysis is a basic workup component. A gynecologist with in-office diagnostic capability can provide a more complete, guideline-concordant evaluation.

Score: `(modalities_billed / 4) * 100`. Provider with 3 of 4 modalities scores 75.


**Measure 2B: Colposcopy Follow-Through**

What it answers: When this gynecologist performs colposcopy, do they biopsy or treat when indicated?

```
colposcopy_biopsy_services = SUM(total_services) WHERE hcpcs_code IN (57454, 57460)
total_colposcopy_services = SUM(total_services) WHERE hcpcs_code IN (57452, 57454, 57460)

metric = colposcopy_biopsy_services / total_colposcopy_services
```

ACOG/ASCCP standard: Colposcopy is performed to evaluate abnormal cervical screening. When a lesion is visualized, biopsy should be taken. A gynecologist who does colposcopy but never biopsies is unusual — it may indicate the provider is only doing colposcopy for documentation or is missing lesions that should be biopsied.

Score: Percentile rank of `metric` among providers who bill any colposcopy codes (57452, 57454, or 57460).

Edge cases:
- If `total_colposcopy_services` = 0, this provider does not do colposcopy. Skip this measure for Domain 2 scoring and redistribute weight to 2A and 2C.
- Very high ratios (approaching 1.0) are expected for some providers — if a gynecologist only does colposcopy on high-risk patients, most will warrant biopsy.


**Measure 2C: Procedure Breadth**

What it answers: Does this gynecologist perform a full range of gynecologic procedures, or only a narrow subset?

```
procedure_categories = {
    'endometrial_biopsy':      [58100],
    'colposcopy_with_bx':      [57454],
    'leep_cone':               [57460],
    'hysteroscopy':            [58558],
    'iud_insertion':           [58300],
    'laparoscopic_hysterectomy': [58571],
    'implant_insertion':       [11981]
}

procedure_types_billed = COUNT of procedure_categories keys WHERE
    SUM(total_services) for ANY code in that category > 0

metric = procedure_types_billed  -- integer 0-7
```

ACOG standard: A general gynecologist should manage a broad scope of gynecologic conditions procedurally. The 7 procedure categories span cervical disease (colposcopy, LEEP), uterine evaluation (endometrial biopsy, hysteroscopy), contraception (IUD, implant), and definitive surgery (hysterectomy). Missing entire categories suggests either a very narrow practice or referral of cases that a general gynecologist could manage locally.

Score: `(procedure_types_billed / 7) * 100`. Provider performing 5 of 7 categories scores 71.

Note: Not every gynecologist performs laparoscopic hysterectomy (58571). This is an advanced surgical procedure that may be concentrated at larger centers. Missing this one category alone should not significantly penalize a general gynecologist. But missing 4+ categories is a meaningful signal.


**Domain 2 Score:**

```
domain_2 = (measure_2a * 0.30) + (measure_2b * 0.30) + (measure_2c * 0.40)
```


---

### DOMAIN 3: Contraception & Comprehensive Care (Weight: 25%)


**Measure 3A: LARC Provision Rate**

What it answers: Does this gynecologist provide Long-Acting Reversible Contraception?

```
larc_services = SUM(total_services) WHERE hcpcs_code IN (58300, 11981)
total_beneficiaries = MAX(total_beneficiaries) across all HCPCS codes for this NPI

metric_binary = 1 IF larc_services > 0 ELSE 0
metric_rate = larc_services / total_beneficiaries (if larc_services > 0)
```

ACOG standard: ACOG recommends offering LARCs (IUDs and subdermal implants) as first-line contraception for most women. They are the most effective reversible methods. A gynecologist who sees reproductive-age women but never inserts an IUD or implant may not be offering the recommended range of contraceptive options.

Score: Two components.
- Binary: does the provider bill 58300 or 11981 at all? (0 or 100)
- Rate: percentile rank of `metric_rate` among providers who DO bill LARC codes.
- Combined: `(binary * 0.30) + (rate_percentile * 0.70)`. A provider who never inserts LARCs gets 0. A provider who inserts but at low volume gets a partial score.

Caveat: Providers who primarily serve post-menopausal women (Medicare-heavy panels) will have lower LARC volume. This is expected and is partially accounted for by the peer percentile comparison (their peers will also have lower LARC volume). The binary component gives credit just for having the capability.


**Measure 3B: Endometrial Evaluation**

What it answers: Does this gynecologist evaluate abnormal uterine bleeding with endometrial biopsy?

```
emb_services = SUM(total_services) WHERE hcpcs_code = 58100
total_beneficiaries = (same as 3A)

metric_binary = 1 IF emb_services > 0 ELSE 0
metric_rate = emb_services / total_beneficiaries (if emb_services > 0)
```

ACOG standard: Endometrial biopsy is the standard evaluation for abnormal uterine bleeding in women 45+ and in younger women with risk factors. A gynecologist who never performs endometrial biopsy may be referring all AUB workup, which delays evaluation and is inconsistent with ACOG recommendations for office-based gynecology.

Score: Same structure as 3A. Binary (30%) + rate percentile (70%).

Caveat: Not all gynecologists have a patient population with high AUB incidence. A provider whose panel is primarily young women on contraception may have low endometrial biopsy volume. The peer percentile comparison partially accounts for this.


**Domain 3 Score:**

```
domain_3 = (measure_3a * 0.55) + (measure_3b * 0.45)
```


---

### Composite Score

```
composite = (domain_1 * 0.40) + (domain_2 * 0.35) + (domain_3 * 0.25)
```

Range: 0 to 100.

**Minimum data requirement:** A provider must have scores in at least 2 of 3 domains to receive a composite. If only 1 domain is scorable, output: "insufficient data."

**If a domain is missing:** Redistribute its weight proportionally. Example: if Domain 3 is missing (provider does not bill LARC or endometrial biopsy), the composite becomes `(domain_1 * 0.53) + (domain_2 * 0.47)`.


---

### Worked Example

Dr. C is a gynecologist in Massachusetts, identified via taxonomy 207V00000X with 1.8% delivery code fraction (well below the 5% threshold). Here is her claims profile for 2023:

| Metric | Raw Value | Peer Percentile | Notes |
|---|---|---|---|
| Total beneficiaries (both CMS files) | 680 | -- | Moderate-volume gyn-only practice |
| Total E/M services | 2,100 | -- | |
| Total services (all codes) | 3,400 | -- | Delivery codes: 62 services (1.8%) |
| **Domain 1: Preventive & Screening** | | | |
| Well-woman visit ratio (preventive/total E/M) | 720/2,100 = 0.34 | 68th | About a third of visits are preventive |
| Cervical screening rate (Q0091/preventive) | 285/720 = 0.40 | 74th | Collects Pap/HPV at 40% of preventive visits |
| Age-group breadth | 3 of 3 | 100 (fixed) | Sees young, middle-aged, and older women |
| **Domain 1 Score** | (68*0.40)+(74*0.35)+(100*0.25) | **78.1** | |
| **Domain 2: Diagnostic & Procedural** | | | |
| In-office diagnostic breadth | 3 of 4 (no pelvic US transabdominal) | 75 (fixed) | Has TVUS, EMB, UA |
| Colposcopy follow-through | (48+12)/(15+48+12) = 60/75 = 0.80 | 71st | Biopsies or treats 80% of colposcopies |
| Procedure breadth | 5 of 7 (no hysteroscopy, no lap hysterectomy) | 71.4 (fixed) | Cervical + contraceptive + EMB |
| **Domain 2 Score** | (75*0.30)+(71*0.30)+(71.4*0.40) | **72.4** | |
| **Domain 3: Contraception & Comprehensive Care** | | | |
| LARC provision | 45 services, binary=100, rate=63rd | (100*0.30)+(63*0.70) = 74.1 | Inserts IUDs/implants regularly |
| Endometrial evaluation | 38 services, binary=100, rate=58th | (100*0.30)+(58*0.70) = 70.6 | Does EMBs regularly |
| **Domain 3 Score** | (74.1*0.55)+(70.6*0.45) | **72.5** | |
| **Composite** | (78.1*0.40)+(72.4*0.35)+(72.5*0.25) | **74.7** | |

Dr. C scores 74.7. She has strong preventive care habits (full age-group coverage, solid cervical screening rate), good diagnostic capability, and provides LARC and endometrial evaluation. Her composite is pulled down slightly by missing hysteroscopy and laparoscopic hysterectomy, which is common for a community gynecologist.

Compare with Dr. D in the same state:

| Metric | Raw Value | Peer Percentile |
|---|---|---|
| Total beneficiaries | 950 | -- |
| Total E/M services | 3,200 | -- |
| Well-woman visit ratio | 1,280/3,200 = 0.40 | 82nd |
| Cervical screening rate | 590/1,280 = 0.46 | 85th |
| Age-group breadth | 3 of 3 | 100 |
| **Domain 1 Score** | (82*0.40)+(85*0.35)+(100*0.25) | **87.6** |
| In-office diagnostic breadth | 4 of 4 | 100 |
| Colposcopy follow-through | 0.85 | 79th |
| Procedure breadth | 6 of 7 | 85.7 |
| **Domain 2 Score** | (100*0.30)+(79*0.30)+(85.7*0.40) | **88.0** |
| LARC provision | binary=100, rate=81st | (100*0.30)+(81*0.70) = 86.7 |
| Endometrial evaluation | binary=100, rate=74th | (100*0.30)+(74*0.70) = 81.8 |
| **Domain 3 Score** | (86.7*0.55)+(81.8*0.45) | **84.5** |
| **Composite** | (87.6*0.40)+(88.0*0.35)+(84.5*0.25) | **86.9** |

Dr. D scores 86.9. Higher volume, broader diagnostic and procedural scope, strong LARC provision, and comprehensive in-office diagnostics. Her claims pattern is more consistent with a gynecologist following ACOG guideline recommendations across preventive, diagnostic, and therapeutic domains.


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
| taxonomy_code | string | From NPPES (207VG0400X or 207V00000X) |
| taxonomy_match_type | string | "direct" (207VG0400X) or "filtered" (207V00000X with <5% delivery) |
| delivery_code_fraction | float | Fraction of total services that are obstetric delivery codes. 0.0 for 207VG0400X providers. |
| **Cohort Context** | | |
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort was used for percentile ranks |
| percentile_cohort_state | string | State of the peer cohort used for percentile scoring (or "US" if national) |
| percentile_cohort_size | int | Number of peers in the cohort |
| **Volume** | | |
| total_beneficiaries | int | Estimated total unique patients (across both CMS files) |
| total_services | int | Total claim lines across all codes |
| total_em_services | int | Total E/M + preventive services |
| medicare_services | int | Services from Medicare file |
| medicaid_services | int | Services from Medicaid file |
| **Domain 1: Preventive & Screening** | | |
| preventive_services | int | Count of 99385-99387, 99395-99397 services |
| preventive_visit_ratio | float | Measure 1A metric (preventive / total E/M) |
| preventive_visit_percentile | float | Measure 1A percentile rank |
| q0091_services | int | Count of Q0091 services |
| cervical_screening_rate | float | Measure 1B metric (Q0091 / preventive services) |
| cervical_screening_percentile | float | Measure 1B percentile rank |
| age_groups_with_visits | int | Measure 1C metric (0-3) |
| age_group_breadth_score | float | (age_groups / 3) * 100 |
| domain_1_score | float | Preventive & Screening domain (0-100) |
| **Domain 2: Diagnostic & Procedural** | | |
| diagnostic_modalities_billed | int | Measure 2A metric (0-4) |
| diagnostic_breadth_score | float | (modalities / 4) * 100 |
| colposcopy_total_services | int | Count of 57452 + 57454 + 57460 services |
| colposcopy_biopsy_services | int | Count of 57454 + 57460 services |
| colposcopy_followthrough_ratio | float | Measure 2B metric |
| colposcopy_followthrough_percentile | float | Measure 2B percentile rank |
| procedure_types_billed | int | Measure 2C metric (0-7) |
| procedure_breadth_score | float | (types / 7) * 100 |
| domain_2_score | float | Diagnostic & Procedural domain (0-100) |
| **Domain 3: Contraception & Comprehensive Care** | | |
| larc_services | int | Count of 58300 + 11981 services |
| larc_binary | int | 1 if any LARC insertion billed, else 0 |
| larc_rate | float | LARC services / total beneficiaries |
| larc_score | float | Measure 3A combined score |
| emb_services | int | Count of 58100 services |
| emb_binary | int | 1 if any 58100 billed, else 0 |
| emb_rate | float | 58100 / total beneficiaries |
| emb_score | float | Measure 3B combined score |
| domain_3_score | float | Contraception & Comprehensive Care domain (0-100) |
| **Composite** | | |
| composite_score | float | Weighted composite (0-100), null if insufficient data |
| scorable_domains | int | Number of domains with enough data to score (0-3) |
| **Confidence** | | |
| confidence_tier | int | 2 (all free data is Tier 2 / proxy) |
| confidence_tier_label | string | "claims_proxy" |
| data_source_count | int | Number of CMS files with data for this NPI (1 or 2) |


### Data Quality

All scores from the free CMS data are Tier 2 (proxy). We are measuring provider billing volume as a proxy for clinical practice quality. This is real data from credible sources, but it does not directly measure the thing ACOG is asking for (e.g., "was this patient screened for cervical cancer at the guideline-recommended interval?" vs. "does this provider bill cervical specimen collection at a rate consistent with performing screening on eligible patients").


---

# PART B: WHAT WE WISH WE HAD

---


## 5. Additional Data Sources and What Each Would Unlock

| Data Source | Cost / Access | What It Adds | Guidelines It Would Unlock |
|---|---|---|---|
| **MA APCD (All-Payer Claims Database)** | $5-7K, 2-4 weeks | Individual patient-level claims with diagnosis codes AND Rx data across ALL payers. Inpatient + outpatient. The most complete picture possible for MA. | +25-30 guidelines. Unlocks: HRT appropriateness (Rx + dx linkage), contraceptive prescribing patterns (oral contraceptives, patches, rings), endometriosis medical management (GnRH agonists, oral contraceptives), STI treatment appropriateness (dx + Rx linkage), cervical screening interval compliance (patient-level timeline), follow-up after abnormal Pap (time to colposcopy), AUB workup completeness (dx + procedure linkage). |
| **State Cancer Registry (MA Cancer Registry)** | Free (application required), 4-8 weeks | Cervical cancer incidence, staging, treatment, and outcomes linked to screening providers. | +5-8 guidelines. Unlocks: cervical cancer screening effectiveness (stage at diagnosis linked to screening provider), HPV-related cancer incidence by provider panel, time from diagnosis to treatment. |
| **Medicare Part D Prescriber Data** | Free (CMS) | NPI-level aggregate Rx data for Medicare Part D. Shows which drugs a provider prescribes and in what volume. | +8-10 guidelines. Unlocks: HRT prescribing patterns (estrogen, progesterone, combination), vaginal estrogen for genitourinary syndrome of menopause, osteoporosis treatment prescribing. Available now but requires separate pipeline. Only covers Medicare population (65+). |
| **EHR Data (Direct or via Registry)** | Varies ($50K-$500K+) | Documentation-level clinical detail. Lab values, imaging results, pathology results, surgical outcomes, patient-reported outcomes. | Remaining guidelines. Unlocks: Pap/HPV results and follow-up, biopsy pathology and management concordance, surgical outcomes (hysterectomy complications, readmissions), counseling documentation (contraceptive, genetic, sexual health), BRCA referral patterns. |
| **Medicaid T-MSIS Full Access** | Restricted (DUA required) | National Medicaid claims at the claim line level. Patient-level, dx codes, Rx data, institutional. | Same as MA APCD for Medicaid population. Adds younger women's gynecologic care nationally — contraception, STI treatment, cervical screening. Critical for gynecology given the Medicaid population's high reproductive-age volume. |


### Unlock Path

| Stage | Data | Guideline Recommendations Scorable | Coverage |
|---|---|---|---|
| Now (free CMS data) | Medicare Physician + Medicaid Provider Spending + NPPES | ~8 of ~70 | 3 domains, partial |
| +Medicare Part D (free, separate pipeline) | Add NPI-level Rx data for Medicare population | ~18 of ~70 | Adds HRT and osteoporosis medication management for older women |
| +MA APCD ($5-7K) | Add all-payer patient-level claims with dx and Rx | ~50 of ~70 | Adds condition-specific scoring, screening interval compliance, Rx management |
| +State Cancer Registry (free, application) | Add cervical cancer staging and outcomes | ~58 of ~70 | Adds cancer screening effectiveness |
| +EHR (varies) | Add documentation and clinical detail | ~63 of ~70 | Near-complete, adds counseling, outcomes, pathology follow-up |
| Full (all above) | Everything | ~63-65 of ~70 | Remaining 5-7 require patient-reported outcomes or long-term follow-up |


---

# PART C: RISKS AND LIMITATIONS

---


## 6. Risks

**We are scoring utilization patterns, not clinical quality.** The free data tells us what a gynecologist billed. It does not tell us whether the care was appropriate, timely, or effective. A high well-woman visit ratio means the provider does preventive visits frequently. It does not confirm the visit included all recommended components.

**No diagnosis codes means we cannot link procedures to clinical indications.** This is the single biggest limitation. We cannot tell if an endometrial biopsy was for AUB (appropriate) or a low-risk finding (potentially unnecessary). We cannot tell if a colposcopy was triggered by an abnormal Pap or done for another reason. Without the clinical context, we can only measure whether things happened, not whether they should have happened.

**No prescription data means we are blind to medication management.** A huge portion of gynecology is medication-based: oral contraceptives, hormone replacement therapy, GnRH agonists for endometriosis, antibiotics for STIs, topical estrogen for genitourinary syndrome of menopause, osteoporosis medications. We cannot see any of this from free CMS data. A gynecologist who excels at medical management but performs few procedures will score lower than one who biopsies and scopes aggressively. This is a significant bias, and it is arguably worse for gynecology than for any other specialty we score, because so much of gynecologic care is pharmaceutical.

**Data is aggregated, not patient-level.** We see "Provider X billed Q0091 285 times in 2023." We do not see "Patient Y received a Pap test at age 28, three years after her last one, as recommended." We cannot measure whether the right thing happened at the right time for the right patient. We can only measure whether it happened at all, in aggregate.

**8 of ~70 ACOG guidelines is a partial score.** We are transparent about this. The composite represents a utilization profile, not a comprehensive clinical quality assessment. It answers: "Does this gynecologist's billing pattern suggest they follow ACOG preventive care and procedural guidelines?" It does not answer: "Does this gynecologist deliver high-quality gynecologic care across all conditions?"

**Both CMS files contribute, but neither is complete.** Unlike pediatrics (Medicaid-dominant) or urology (Medicare-dominant), gynecology needs both files for a full picture. Losing the Medicaid file (which was temporarily unavailable as of late March 2026) disproportionately affects scoring for providers who primarily serve younger women. LARC provision and cervical screening are especially impacted because the Medicaid population is where most contraceptive and screening activity occurs for younger women.

**The taxonomy code filtering introduces noise.** The 5% delivery code threshold is a heuristic. Some providers at 4.9% are genuinely active in obstetrics (a bad month of data, covering for a partner). Some providers at 5.1% are effectively gyn-only (a few deliveries from prior year winding down). The threshold is imperfect. We flag each provider's `taxonomy_match_type` and `delivery_code_fraction` in the output so downstream consumers can adjust.

**Q0091 is a collection code, not a test result.** We know the gynecologist collected a cervical specimen. We do not know whether it was a Pap alone, Pap + HPV co-test, or primary HPV test. We do not know the result (normal, ASC-US, LSIL, HSIL). We cannot measure screening-to-treatment follow-through at the patient level.

**Lab codes are billed by the lab, not the gynecologist.** Pap cytology (88141-88175) and HPV DNA testing (87624-87625) are processed and billed by the laboratory. They will not appear in the gynecologist's claims. This is why we use Q0091 (collection) rather than the test codes.

**Procedural breadth rewards breadth over depth.** A gynecologist who is an expert colposcopist but only does cervical work will score low on procedure breadth. The score rewards generalists. We mitigate this by excluding taxonomy-flagged subspecialists, but not all narrow-practice gynecologists use subspecialty taxonomy codes.

**LARC scoring may penalize providers with older patient panels.** A gynecologist whose practice is primarily post-menopausal women (Medicare-heavy) has no clinical reason to insert IUDs or implants. The peer percentile partially accounts for this (their peers will also have lower LARC volume), but the bias exists.

**Attribution gaps.** Imaging centers, labs, and hospitals may bill for services the gynecologist ordered. Mammograms, DEXA scans, Pap cytology, and surgical facility fees are all billed by entities other than the gynecologist. The gynecologist's claims file may undercount their actual practice.


---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 7. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **ACOG Gynecology Guidelines Concordance** (this doc) | Does this gynecologist follow ACOG guideline recommendations? | Clinical quality proxy |
| **Peer Comparison** | Does their billing pattern look like a normal gynecologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is the practice pattern consistent across Medicare and Medicaid? | Access proxy |
| **Billing Quality** | Are charges, code ratios, and E/M distribution normal? | Pricing + integrity |

Guideline concordance is the most clinically grounded of the five scores. It does not just ask "is this provider normal?" (peer comparison) or "is the volume real?" (volume adequacy). It asks "does this provider do what ACOG says they should do?"

Here is what this score catches that the others miss:

| Scenario | Guideline Concordance | Other Scores |
|---|---|---|
| Gynecologist who does high-volume E/M visits but never collects Pap specimens, never does colposcopy, never inserts LARCs | Low (Domain 1 low on cervical screening, Domain 2 low on colposcopy, Domain 3 low on LARC) | Peer comparison might flag missing codes. Volume adequacy is fine (high E/M volume). Billing quality may look normal. |
| Gynecologist who does well-woman visits and Pap collection but never follows up with colposcopy or biopsy when abnormal | Low (Domain 2 low on colposcopy follow-through) | Peer comparison may not flag this if colposcopy absence is common in the cohort. Billing quality does not evaluate diagnostic-to-therapeutic balance. |
| Gynecologist with broad procedures but no preventive care (never bills preventive codes, never collects cervical specimens) | Low (Domain 1 near zero) | Peer comparison catches missing preventive codes. But guideline concordance flags the clinical implication: this provider is not doing the preventive care that ACOG considers the foundation. |
| Gynecologist who does well-woman visits, collects Pap, performs colposcopy with biopsy, inserts LARCs, does EMB, has in-office diagnostics | High | Other scores may also be high (normal peer pattern, adequate volume, clean billing). This is the concordance signal: all five dimensions align for a provider following guidelines. |
| Subspecialist gyn oncologist using general taxonomy code | May be low (narrow scope by design) | Peer comparison also catches this. But guideline concordance should be excluded (subspecialists filtered out) or flagged with `taxonomy_match_type`. |


---

# PART E: RISKS AND LIMITATIONS

---

These are repeated from Part C in summary form, plus cross-cutting risks.


## 8. Summary of Limitations

1. **Utilization patterns, not clinical quality.** Billing does not equal good care. We measure whether a provider does things, not whether they do them well or for the right reasons.

2. **No diagnosis codes.** Cannot link any procedure to its clinical indication. Cannot distinguish AUB workup from routine biopsy. Cannot identify which patients have which conditions.

3. **No prescription data.** Blind to the largest component of gynecologic management: medication. Oral contraceptives, HRT, endometriosis treatment, STI antibiotics, vaginal estrogen, osteoporosis medications — all invisible. This is arguably the most significant limitation for gynecology among all specialties we score, because medication management is so central to the field.

4. **Aggregated data.** Cannot track individual patients through a screening-to-treatment pathway. Cannot measure whether a specific patient got the right sequence of care (abnormal Pap → colposcopy → biopsy → treatment).

5. **8 of ~70 guidelines.** This is a partial score. We score what we can see. It covers preventive visit patterns, cervical screening, diagnostic breadth, procedural scope, LARC provision, and endometrial evaluation. It misses medication management, outcomes, counseling, lab results, and patient-level adherence.

6. **Taxonomy filtering is a heuristic.** The gyn-only peer cohort depends on a 5% delivery code threshold. This is unique to gynecology and introduces classification noise that pediatrics and urology do not have.

7. **Both CMS files needed.** Gynecology draws meaningful volume from both Medicare and Medicaid. Losing either file (Medicaid was temporarily unavailable as of late March 2026) degrades scoring more than it would for urology (Medicare-dominant) or pediatrics (Medicaid-dominant).

8. **Attribution gaps.** Labs, imaging centers, and hospitals bill for services the gynecologist ordered. Mammograms, Pap cytology, HPV DNA tests, DEXA scans, and surgical facility fees all live outside the gynecologist's claims profile.

9. **No outcomes.** We cannot measure surgical complications, readmissions, cancer detection rates, contraceptive continuation rates, or patient satisfaction. The score is about process, not results.

10. **Q0091 measures collection, not results.** We know a cervical specimen was collected. We do not know the result or whether appropriate follow-up occurred.


---


## Appendix: ACOG Guideline Crosswalk

These are the major ACOG gynecology (non-obstetric) clinical practice guidelines and their scorability with free CMS data.

| ACOG Guideline / Area | Key Recommendations | Scorable Now? | What's Missing |
|---|---|---|---|
| Well-Woman Visit (Annual) | Annual preventive visit for all women, including breast exam, pelvic exam (when indicated), screening, counseling | Partial (visit ratio, age breadth) | Visit content documentation, counseling components |
| Cervical Cancer Screening (ACOG PB 168 / USPSTF) | Pap 21-29 (q3yr), Pap+HPV 30-65 (q5yr), exit at 65 if adequate prior screening | Partial (Q0091 collection rate) | Test results, patient-level intervals, age-appropriate screening exit |
| Abnormal Cervical Screening Follow-Up (ASCCP) | Colposcopy for most abnormal results, biopsy when lesion visualized, LEEP for CIN2+ | Partial (colposcopy follow-through ratio) | Patient-level linkage from Pap to colposcopy, pathology results |
| Abnormal Uterine Bleeding (ACOG PB 128) | Endometrial biopsy for women 45+, ultrasound evaluation, structured workup | Partial (EMB rate, TVUS as diagnostic breadth) | Dx codes (AUB indication), patient age linkage, medication management |
| Contraception (ACOG PB 186) | LARC as first-line, offer full range, shared decision-making | Partial (LARC provision rate) | Rx data (oral contraceptives, patch, ring), counseling documentation |
| Endometriosis (ACOG PB 114) | Medical management (NSAIDs, OCPs, GnRH agonists), laparoscopy for diagnosis/treatment | No (except laparoscopy as procedure breadth) | Rx data, dx codes, symptom documentation |
| Fibroids (ACOG PB 228) | Expectant management, medication, myomectomy, hysterectomy stratified by symptoms/fertility | No (except hysterectomy as procedure breadth) | Dx codes, Rx data, symptom severity, surgical outcomes |
| Menopause/HRT (ACOG PB 141) | Systemic HRT for vasomotor symptoms, vaginal estrogen for GSM, shared decision-making | No | Rx data (estrogen, progesterone), symptom documentation |
| Osteoporosis Screening (ACOG PB 129 / USPSTF) | DEXA for women 65+, younger if risk factors | No | DEXA billed by imaging facility, no referral data |
| Breast Cancer Screening (ACOG PB 179) | Mammography annually starting at age 40 (ACOG) or biennially 50-74 (USPSTF) | No | Mammograms billed by imaging facility, no referral/order data |
| STI Screening and Treatment | Screen for chlamydia/gonorrhea in women <25 and at-risk, treat per CDC guidelines | No | No Rx data, no dx codes, no lab results |
| HPV Vaccination | Recommend HPV vaccine for women 9-26, catch-up through 45 | No | Vaccine may be billed by PCP, attribution unreliable |
| Pelvic Organ Prolapse (ACOG PB 214) | Expectant management, pessary, surgical repair | No | Pessary fitting (57160) rarely billed, no Rx data, no outcomes |
| Urinary Incontinence (ACOG PB 155) | Behavioral therapy, medication, surgery stratified by type | No | Dx codes (stress vs. urgency), Rx data, documentation |
| Vulvovaginal Disease | Diagnosis and treatment of vulvovaginitis, vulvar dermatoses, vulvar lesions | No | Dx codes, Rx data |
| Genetic Testing/BRCA (ACOG PB 182) | Risk assessment, genetic counseling referral, BRCA testing when indicated | No | No referral data, no genetic test results |
