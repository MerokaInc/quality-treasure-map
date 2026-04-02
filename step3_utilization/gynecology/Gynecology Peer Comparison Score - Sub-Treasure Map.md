# Gynecology Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The ACOG guidelines concordance doc asks: "did this provider do what ACOG says they should for gynecology patients?" This doc asks a different question: "does this provider's billing pattern look like a normal gynecologist's?"

We built a reference code set from the most prevalent codes in the gynecology peer cohort. Then we measure how much of that common practice set a provider covers. A gynecologist who bills 24 of 25 typical codes is practicing a full-spectrum gynecologic workflow. A gynecologist who bills 8 of 25 is either highly specialized or missing large parts of standard care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.

**Scope note: This document covers gynecology only, not obstetrics.** No delivery codes (59400-59622), no prenatal visit codes, no antepartum management codes. The reference set, peer cohort, and scoring all exclude obstetric activity. If a provider coded as OB-GYN actually practices gynecology only (no deliveries), this doc measures them. If they do deliveries, they need a separate obstetric peer comparison.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guidelines concordance doc:

1. **CMS Medicare Physician & Other Practitioners** -- NPI + HCPCS + service volume + beneficiary count, 2018-2024. Significant gynecology volume, especially for women 40+ (menopause management, cervical screening follow-up, surgical gynecology).
2. **CMS Medicaid Provider Spending** -- NPI + HCPCS + service volume + beneficiary count. Significant gynecology volume for reproductive-age women (contraception, cervical screening, well-woman visits).
3. **NPPES NPI Registry** -- provider identification, taxonomy codes, practice address.

**Both CMS files matter for gynecology.** Unlike pediatrics (Medicaid-heavy) or urology (Medicare-heavy), gynecology draws meaningful volume from both payers. Younger women on Medicaid use contraception and cervical screening services. Older women on Medicare use menopause management and surgical services. The reference set and peer scoring use combined volume from both files.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207VG0400X (Gynecology) OR 207V00000X (OB-GYN general) with <5% delivery code volume | Captures gynecology-only practitioners. See taxonomy filtering below. |
| State | Same state as the provider being scored | Practice patterns vary by state (Medicaid policy, scope of practice, cervical screening protocols) |
| Volume | >= 100 total services across both CMS files combined in the measurement year | Excludes inactive, retired, or very low-volume providers. Both payers count. |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

### Taxonomy Filtering: A Methodological Note

Gynecology does not have one clean taxonomy code the way pediatrics (208000000X) or urology (208800000X) does. Most gynecologists in the US are coded as OB-GYN (207V00000X), even if they stopped delivering babies years ago. The dedicated gynecology-only taxonomy (207VG0400X) exists but is underused.

This means we need a two-step identification:

**Step 1: Direct match.** Include any NPI with taxonomy 207VG0400X. These are self-identified gynecology-only practitioners. Clean signal.

**Step 2: Behavioral filter.** Include any NPI with taxonomy 207V00000X (OB-GYN general) where delivery-related codes (59400-59622) represent less than 5% of total service volume. These are OB-GYN coded providers who functionally practice gynecology only. Many senior OB-GYNs stop delivering but never update their taxonomy code.

**Exclude these subspecialist taxonomy codes:**

| Taxonomy Code | Subspecialty | Why Exclude |
|---|---|---|
| 207VX0201X | Gynecologic Oncology | Surgical and chemotherapy practice, not general gynecology |
| 207VF0040X | Female Pelvic Medicine & Reconstructive Surgery | Urogynecology focus, different procedure mix |
| 207VM0101X | Maternal-Fetal Medicine | Obstetric subspecialty, no general gynecology |
| 207VE0102X | Reproductive Endocrinology & Infertility | ART and hormonal focus, not general gynecology |

These subspecialists should be flagged in output but not scored against the general gynecology reference set. Their billing patterns are legitimately different.

This taxonomy filtering introduces more noise than pediatrics or urology, where a single taxonomy code cleanly identifies the cohort. Some OB-GYN coded providers with <5% delivery volume may still do occasional deliveries. The 5% threshold is a pragmatic cutoff, not a clinical one. The output should record which taxonomy path was used for each NPI (`taxonomy_match_type`: "direct_gyn" or "behavioral_filter").

For a typical state, this should yield roughly 300-1,500 active gynecology-only practitioners, depending on state population and age distribution.


### Geographic Grouping

Peer cohorts are built at the **state level** by default. Practice patterns vary by state because of differences in Medicaid contraception coverage, cervical screening protocols, surgical facility access, and demographic mix. A gynecologist in California should be compared to California peers, not a national average.

The pipeline should support grouping by:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Secondary benchmark. Useful for cross-state comparison: "how does the CA gynecology workforce compare to TX?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Urban gynecologists with hospital/ASC access vs. rural office-only gynecologists have different procedure mixes. Not implemented now, but the data supports it. |

Every score in this doc (code coverage, category coverage, volume concordance) uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, which changes the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set in Section 2 below is based on national data. When scoring at the state level, rebuild the reference set from the state-level peer cohort. If a code falls out of the top 25 in a given state (e.g., a state where few gynecologists perform hysteroscopy), it drops from that state's reference set. The reference set size may vary by state (20-25 codes).


## 2. The Reference Code Set: What Normal Gynecology Practice Looks Like

We analyzed the most prevalent HCPCS codes billed by gynecology-only practitioners nationally. The top 25 codes account for approximately 78% of all gynecologic billing volume. These 25 codes define the "typical gynecology workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 99214 | Office visit, established, moderate complexity | The dominant gynecology visit. AUB evaluation, menopause management, complex contraception counseling. | ~18% |
| 2 | 99213 | Office visit, established, low-moderate complexity | Simpler follow-ups, contraception check, routine concerns | ~14% |
| 3 | 99396 | Preventive visit, established, 40-64 | Well-woman visit for middle-aged women. Cervical screening, breast exam, menopause. | ~6% |
| 4 | 99395 | Preventive visit, established, 18-39 | Well-woman visit for younger women. Contraception, STI screening, Pap. | ~5% |
| 5 | 99215 | Office visit, established, high complexity | Complex management: cancer follow-up, multi-system pelvic disorders | ~4% |
| 6 | 99204 | New patient visit, moderate complexity | New patient GYN evaluation | ~3% |
| 7 | G2211 | Visit complexity add-on | Ongoing care coordination for chronic GYN conditions | ~3% |
| 8 | 76830 | Transvaginal ultrasound | Pelvic mass evaluation, AUB workup, ovarian cyst monitoring | ~3% |
| 9 | 99386 | Preventive visit, new patient, 40-64 | New well-woman, middle-aged | ~2.5% |
| 10 | 99385 | Preventive visit, new patient, 18-39 | New well-woman, younger | ~2% |
| 11 | Q0091 | Obtaining cervical/vaginal smear | Specimen collection for Pap/HPV testing. The GYN bills this; lab bills the test. | ~2% |
| 12 | 58100 | Endometrial biopsy | AUB evaluation. ACOG recommends for women 45+ with abnormal bleeding. | ~2% |
| 13 | 76856 | Pelvic ultrasound, transabdominal | Complementary to TVUS. Fibroid sizing, pelvic mass evaluation. | ~2% |
| 14 | 57454 | Colposcopy with cervical biopsy | Follow-up for abnormal Pap. Cervical dysplasia evaluation. | ~1.5% |
| 15 | 58300 | IUD insertion | LARC provision. ACOG recommends as first-line contraception. | ~1.5% |
| 16 | 99203 | New patient visit, low complexity | Simpler new patient presentations | ~1.5% |
| 17 | 81003 | Urinalysis, automated | Basic GYN workup, UTI evaluation | ~1.5% |
| 18 | 57452 | Colposcopy, diagnostic | Cervical evaluation without biopsy | ~1.5% |
| 19 | 58301 | IUD removal | Contraception management | ~1% |
| 20 | 11981 | Subdermal contraceptive implant insertion | LARC provision (Nexplanon) | ~0.8% |
| 21 | 58558 | Hysteroscopy with biopsy/polypectomy | Intrauterine evaluation and treatment | ~1% |
| 22 | 57460 | LEEP/loop electrode excision | Cervical dysplasia treatment | ~0.8% |
| 23 | 99205 | New patient visit, high complexity | Complex new evaluations | ~1% |
| 24 | 58571 | Total laparoscopic hysterectomy | Definitive treatment for AUB, fibroids, endometriosis | ~0.5% |
| 25 | 11982 | Subdermal contraceptive implant removal | Contraception management | ~0.5% |

Source: CMS Medicare Physician & Other Practitioners and CMS Medicaid Provider Spending data, national gynecology claims analysis, filtered to gynecology-only practitioners.


### What This Set Reveals

These 25 codes are not random. They map to the six things a general gynecologist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits** | 99213, 99214, 99215, 99203, 99204, 99205, G2211 | Provider may not do office-based gynecology (very unusual) |
| **Well-woman preventive** | 99395, 99396, 99385, 99386 | Provider does not do preventive well-woman visits (major gap for gynecology) |
| **Cervical screening & colposcopy** | Q0091, 57452, 57454, 57460 | Provider does not screen for cervical cancer or evaluate abnormal results (significant gap) |
| **In-office diagnostics** | 76830, 76856, 58100, 81003 | Provider does not do in-office imaging, biopsy, or basic labs (refers everything out) |
| **Contraception management** | 58300, 58301, 11981, 11982 | Provider does not insert/remove IUDs or implants (may not offer LARC) |
| **Surgical procedures** | 58558, 58571 | No hysteroscopic or laparoscopic surgical capability. Office-only practice. |

A provider missing entire categories is a stronger signal than a provider missing a single code.

**Key structural differences from pediatrics and urology:** Gynecology has six workflow categories like urology. The well-woman preventive category is distinctly gynecologic, covering the age-banded preventive visit codes that represent a core part of GYN practice. The cervical screening and colposcopy category captures the full pipeline from Pap collection through dysplasia treatment, which is unique to gynecology. Contraception management (LARC insertion/removal) is another category with no analog in other specialties.

The surgical category (hysteroscopy and laparoscopic hysterectomy) is facility-dependent. A gynecologist without OR access will never bill 58571. Missing surgical codes is less concerning than missing office-based categories, but it still narrows the practice scope.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (the core metric)

Simple and defensible.

```
reference_set = [99214, 99213, 99396, 99395, 99215, 99204, G2211,
                 76830, 99386, 99385, Q0091, 58100, 76856, 57454,
                 58300, 99203, 81003, 57452, 58301, 11981, 58558,
                 57460, 99205, 58571, 11982]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year (both CMS files combined)

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum gynecology practice. Billing pattern indistinguishable from peers. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do certain procedures or LARC insertions. |
| 50-69 (13-17 codes) | Missing significant parts of typical gynecologic workflow. Investigate which categories. |
| Below 50 (<13 codes) | Atypical practice. Could be a subspecialist miscoded, a very new practice, or a genuine outlier. |


### Metric 2: Category Coverage

Code coverage counts individual codes. Category coverage counts whether the provider covers each of the six workflow categories.

```
categories = {
    'office_visits':       [99213, 99214, 99215, 99203, 99204, 99205, G2211],
    'well_woman':          [99395, 99396, 99385, 99386],
    'cervical_screening':  [Q0091, 57452, 57454, 57460],
    'inoffice_diagnostics':[76830, 76856, 58100, 81003],
    'contraception':       [58300, 58301, 11981, 11982],
    'surgical':            [58558, 58571]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

A provider billing 20 of 25 codes but missing the entire cervical screening category (0 of 4 cervical codes) is a different story from a provider billing 20 of 25 codes with at least one code in every category.

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow gynecology practice |
| 5 of 6 | Missing one workflow area. Flag which one. Most commonly surgical (facility-dependent) or contraception (patient demographics). |
| 4 of 6 | Missing two areas. Investigate. Could be office-only, or a provider who only does surgical GYN. |
| Below 4 | Not a standard general gynecology practice pattern. |


### Metric 3: Volume Concordance

Code coverage says "does this provider bill this code?" Volume concordance says "does this provider bill it at a similar rate to peers?"

```
For each code in the reference_set:

    peer_median_rate = MEDIAN(
        total_services for this code / total_services for all codes
        across all NPIs in the peer cohort
    )

    provider_rate = total_services for this code / total_services for all codes
        for this NPI

    code_deviation = ABS(provider_rate - peer_median_rate) / peer_median_rate

volume_concordance = 100 - (MEAN(code_deviation across all matched codes) * 100)
    clamped to [0, 100]
```

A provider who bills all 25 codes but has 50% of their volume in 99214 (established visits) and almost nothing in preventive codes has a high code coverage but low volume concordance. They are doing a lot of one thing and not enough of others. In gynecology, the most common distortion is a provider skewed heavily toward one patient population (e.g., mostly menopausal management with no contraception, or mostly young women with no surgical volume) rather than the balanced mix of a general gynecologist.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical gynecology codes." |
| 30% | Category Coverage | Catches providers who hit a good code count but are missing whole workflow areas. |
| 30% | Volume Concordance | Catches providers who bill the right codes but in unusual proportions. |


## 5. Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code (metro/micro area), derived from ZIP |
| taxonomy_code | string | From NPPES |
| taxonomy_match_type | string | "direct_gyn" (207VG0400X) or "behavioral_filter" (207V00000X with <5% delivery volume) |
| is_subspecialist | boolean | True if taxonomy is a gynecologic subspecialty (oncology, pelvic medicine, MFM, REI) |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used |
| peer_cohort_size | int | Number of peers in the cohort used for scoring |
| peer_cohort_state | string | State of the peer cohort (or "US" if national) |
| reference_set_size | int | Number of codes in the state-level reference set (may be <25 in small states) |
| total_services | int | Total claims for this NPI in measurement year (both CMS files combined) |
| total_beneficiaries | int | Estimated unique patients |
| codes_in_reference_set | int | Count of the 25 reference codes this NPI billed (0-25) |
| codes_matched_list | string | Comma-separated list of matched codes |
| codes_missing_list | string | Comma-separated list of unmatched codes |
| code_coverage_score | float | Metric 1 (0-100) |
| categories_covered | int | Count of 6 workflow categories with any billing (0-6) |
| categories_missing_list | string | Names of missing categories |
| category_coverage_score | float | Metric 2 (0-100) |
| volume_concordance_score | float | Metric 3 (0-100) |
| peer_composite_score | float | Weighted composite (0-100) |
| office_visit_pct | float | % of total volume that is office visit codes |
| well_woman_pct | float | % of total volume that is well-woman preventive codes |
| cervical_screening_pct | float | % of total volume that is cervical screening & colposcopy codes |
| inoffice_diagnostic_pct | float | % of total volume that is in-office diagnostic codes |
| contraception_pct | float | % of total volume that is contraception management codes |
| surgical_pct | float | % of total volume that is surgical procedure codes |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINES CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | ACOG Guidelines Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider does well-woman visits and cervical screening but no procedures (no LARC, no surgery) | High (follows ACOG screening guidelines, performs preventive visits) | Low (missing contraception category and surgical category, 2 of 6 categories gone) |
| Provider does surgical gynecology and procedures but no preventive care | Moderate (performs ACOG-concordant procedures) | Low (missing well-woman category and possibly cervical screening, unusual volume distribution) |
| Provider coded as OB-GYN who actually only does gynecology (no deliveries) | Could be missed (OB-GYN taxonomy not scored against GYN-only guidelines) | Caught: behavioral filter identifies them, scores them against GYN peers |
| Provider does everything but at very different volume ratios (60% office visits, 2% preventive) | Could be high (they bill the right codes) | Low volume concordance (distribution does not match peers) |
| Provider bills all typical codes in typical ratios but is a gynecologic oncology subspecialist | N/A (not scored against general GYN guidelines) | Caught: subspecialist flag in output |
| Provider offers LARC and preventive care but never does colposcopy or LEEP | Could be moderate (good on contraception, weak on cervical follow-up) | Low (missing 3 of 4 cervical screening codes, category may still be covered if Q0091 is present) |

The peer comparison is a sanity check. It does not say "this provider follows ACOG gynecology guidelines." It says "this provider's practice looks like a gynecologist's." If someone claims to be a gynecologist but their billing pattern looks nothing like one, that's worth investigating.

The five dimensions for gynecology are:

1. **ACOG Gynecology Guidelines Concordance** -- does the provider follow ACOG gynecology guidelines?
2. **Peer Comparison (this doc)** -- does their billing look like a normal gynecologist?
3. **Volume Adequacy** -- for what they claim to do, is the volume believable?
4. **Payer Diversity** -- is practice consistent across Medicare and Medicaid?
5. **Billing Quality** -- are charges, code ratios, and E/M distribution normal?

Each catches things the others miss. A provider can score high on guidelines concordance (following ACOG recommendations for the conditions they treat) but low on peer comparison (only treating one condition or one age group). A provider can look normal on peer comparison (billing the same codes as everyone else) but have abnormal billing quality (unusual charge amounts or E/M distributions). The five scores together paint a complete picture.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a national average, not a clinical standard.** If most gynecologists do something wrong, it will be in the reference set. Peer comparison rewards conformity, not quality. That's why you need BOTH this score and the guidelines concordance score.

**Taxonomy filtering introduces noise.** The behavioral filter (OB-GYN taxonomy with <5% delivery volume) is a proxy for "gynecology-only." Some providers near the 5% threshold may still do occasional deliveries. Others may have stopped delivering recently and still carry residual delivery claims from earlier in the measurement year. The threshold is pragmatic, not clinical. Sensitivity analysis at 3% and 7% thresholds should be performed during pipeline validation.

**Some codes have legitimate variation.** 58571 (laparoscopic hysterectomy) depends on OR access and surgical credentialing, not quality. A community gynecologist without hospital privileges will never bill it. 58558 (hysteroscopy) depends on whether the practice has hysteroscopic equipment or refers to a surgical center. Missing these codes is not necessarily a quality signal.

**Subspecialists will score low.** A gynecologic oncologist will bill heavily in surgical codes and complex E/M visits but may not bill contraception codes, preventive visits, or routine colposcopy. A reproductive endocrinologist will have a completely different code profile. The `is_subspecialist` flag handles this. Only score providers identified through the taxonomy filtering (207VG0400X or behavioral filter) against this reference set.

**Volume concordance can be distorted by patient population age mix.** A gynecologist with mostly reproductive-age patients will bill heavily in 99395 (young well-woman), 58300 (IUD insertion), and 11981 (implant insertion) but less in 99396 (middle-aged well-woman) and 58100 (endometrial biopsy). A gynecologist with mostly peri-/post-menopausal patients will show the opposite pattern. Both are legitimate general gynecologists. The metric does not adjust for patient age mix (we do not have patient-level data to do so). Volume concordance catches extreme outliers, not moderate age-mix variation.

**Well-woman visits may be performed by PCPs, reducing gynecology preventive visit volume.** In many markets, primary care providers perform well-woman visits and Pap smears, especially for younger women. A gynecologist in a market where PCPs handle most routine screening may have lower well-woman preventive volume without it being a quality problem. This is a market-level effect, not a provider-level one.

**New practices will have incomplete code sets.** A provider in their first year may not have billed all 25 codes yet. Require a minimum of 12 months of claims data and >= 100 total services (both CMS files combined) before scoring.

**The 25-code reference set should be rebuilt annually.** Codes change (G2211 was new in 2024). Screening guidelines evolve (cervical screening intervals shift). Contraception codes may change as new devices enter the market. Rebuild the reference set from the latest claims data each year.

**Gynecology cohorts vary widely by state.** Some smaller states may have fewer than 50 gynecology-only practitioners after taxonomy filtering. When a state cohort is below 30 providers, fall back to national-level scoring and record `geo_group_level = "national"` in the output. Small cohorts produce unreliable medians.


---

## Appendix: Reference Code Set by Category

Quick-reference for implementation.

### Office Visits (7 codes)
| Code | Description |
|---|---|
| 99213 | Office visit, established, low-moderate complexity |
| 99214 | Office visit, established, moderate complexity |
| 99215 | Office visit, established, high complexity |
| 99203 | New patient visit, low complexity |
| 99204 | New patient visit, moderate complexity |
| 99205 | New patient visit, high complexity |
| G2211 | Visit complexity add-on |

### Well-Woman Preventive (4 codes)
| Code | Description |
|---|---|
| 99395 | Preventive visit, established, 18-39 |
| 99396 | Preventive visit, established, 40-64 |
| 99385 | Preventive visit, new patient, 18-39 |
| 99386 | Preventive visit, new patient, 40-64 |

### Cervical Screening & Colposcopy (4 codes)
| Code | Description |
|---|---|
| Q0091 | Obtaining cervical/vaginal smear |
| 57452 | Colposcopy, diagnostic |
| 57454 | Colposcopy with cervical biopsy |
| 57460 | LEEP/loop electrode excision |

### In-Office Diagnostics (4 codes)
| Code | Description |
|---|---|
| 76830 | Transvaginal ultrasound |
| 76856 | Pelvic ultrasound, transabdominal |
| 58100 | Endometrial biopsy |
| 81003 | Urinalysis, automated |

### Contraception Management (4 codes)
| Code | Description |
|---|---|
| 58300 | IUD insertion |
| 58301 | IUD removal |
| 11981 | Subdermal contraceptive implant insertion |
| 11982 | Subdermal contraceptive implant removal |

### Surgical Procedures (2 codes)
| Code | Description |
|---|---|
| 58558 | Hysteroscopy with biopsy/polypectomy |
| 58571 | Total laparoscopic hysterectomy |
