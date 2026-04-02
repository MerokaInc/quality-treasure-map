# Gynecology Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other four docs ask about clinical practice: does this provider follow ACOG guidelines, do they look like a normal gynecologist, is their volume believable, is their billing consistent across payers? This doc asks about billing behavior: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** -- is their pricing in line with peers?
2. **Procedure-to-procedure ratios** -- do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that shouldn't go together, or go together too often)?
3. **E/M level distribution** -- are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against state-level cohorts by default.

Important context for gynecology: this is a mixed specialty sitting between primary care and surgery. Gynecologists do significant office-based E/M work (well-woman exams, contraceptive counseling, menopause management) AND in-office and surgical procedures (colposcopy, LEEP, endometrial biopsy, hysteroscopy, hysterectomy). E/M complexity runs higher than primary care but lower than pure surgical specialties. The benchmarks in this doc reflect that reality.

**This doc covers gynecology only, not obstetrics.** We filter to providers whose practice is gynecologic in nature using taxonomy and delivery code volume.

**Taxonomy filter:**
- 207VG0400X (Gynecology) -- primary inclusion
- 207V00000X (Obstetrics & Gynecology) -- included only if delivery code volume is <5% of total services
- Exclude: 207VX0201X (Gynecologic Oncology), 207VF0040X (Female Pelvic Medicine), 207VM0101X (Maternal-Fetal Medicine), 207VE0102X (Reproductive Endocrinology)

Providers under the general OB-GYN taxonomy who deliver babies as their primary work are not gynecologists for our purposes. The <5% delivery code threshold separates GYN-focused from OB-focused providers.


---

# PART A: WHAT WE HAVE

---

This score uses both CMS datasets:

**CMS Medicare Physician & Other Practitioners (By Provider and Service)** -- for charge-to-allowed analysis

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged (their list price) |
| average_medicare_allowed_amt | What Medicare says the service is worth (the allowed amount) |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Obstetrics & Gynecology or Gynecology |

**CMS Medicaid Provider Spending** -- for procedure ratio analysis

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined, giving us full gynecologic volume.

**Both datasets contribute meaningfully to gynecology.** Medicare covers moderate GYN volume: older women with menopause management, post-menopausal bleeding workups, cancer screening in women 65+, and vulvar/vaginal conditions. Medicaid covers significant GYN volume: younger women with contraception, cervical screening, well-woman preventive visits, and reproductive health services. Neither dataset alone gives the full picture. The charge-to-allowed analysis is Medicare-only (Medicaid does not publish charge detail), but the procedure ratio analysis uses both files combined.

Gynecology sits between pediatrics and urology on Medicare coverage strength. It is not as strong as urology (where Medicare is the dominant payer), but it is substantially stronger than pediatrics (where Medicare covers almost no one). Most gynecologists see enough Medicare patients to produce a usable charge-to-allowed ratio.


---

# PART B: THE LOGIC

---


## 1. The Metric: Charge-to-Allowed Ratio

For each provider, we calculate the ratio of what they charge to what Medicare allows:

```
For a given NPI:

    total_charges = SUM(average_submitted_chrg_amt * number_of_services)
        across all HCPCS codes for this NPI

    total_allowed = SUM(average_medicare_allowed_amt * number_of_services)
        across all HCPCS codes for this NPI

    charge_to_allowed_ratio = total_charges / total_allowed
```

A ratio of 2.0x means the provider charges, on average, twice what Medicare allows. This is normal for gynecology. Gynecologists have a mix of E/M billing (priced similarly to primary care) and procedural billing (priced with wider charge variation). The expected range falls between primary care and surgical specialties.


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual. Could indicate a practice that has never updated its fee schedule, or one that primarily serves government-payer patients. |
| 1.5x - 2.5x | Typical range for most gynecologists. Charges are above Medicare allowed but within normal commercial pricing. Reflects the E/M-heavy nature of GYN practice. |
| 2.5x - 3.5x | Higher end of normal. May reflect a more procedural practice (colposcopy, LEEP, hysteroscopy), a high-cost market, or aggressive commercial rate negotiations. |
| 3.5x - 5.0x | High charges relative to Medicare. Worth a closer look. Could be aggressive pricing, a high-cost metro market, or a practice heavy on surgical procedures that carry wider charge variation. |
| >5.0x | Outlier. Worth investigating. Could be billing errors, a fee schedule that has not been reconciled, or a single high-charge surgical code distorting the average. |
| <1.0x | Provider charges less than Medicare allows. Very unusual. Could be data error, or a provider in an unusual payment arrangement. |

The distribution runs about 0.3x to 0.5x higher than pediatrics but 0.5x to 1.0x lower than urology. A gynecologist's charge ratio of 2.5x is roughly median. That same ratio would be high for a pediatrician and low for a urologist.


## 2. Building the Peer Distribution

The peer distribution is what makes this score meaningful. A ratio of 2.5x means nothing in isolation. It means something when you know the peer median is 2.2x.


### Geographic Grouping

Charge-to-allowed ratios vary significantly by geography because of differences in cost of living, commercial payer rates, and local market dynamics. A gynecologist in San Francisco charging 3.0x may be normal for that market. A gynecologist in rural Arkansas charging 3.0x is an outlier.

Peer distributions are built at the **state level** by default:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | All GYN NPIs (taxonomy 207VG0400X or 207V00000X with <5% delivery codes, >= 10 Medicare services) in the same state | Primary scoring. Captures local market pricing norms. |
| **National** | All states combined | Secondary benchmark. Cross-state comparison: "how does GYN pricing in CA compare to OH?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | When state cohorts are large enough. Urban vs. rural have very different pricing dynamics. |

The minimum peer cohort size is 30 providers. If a state has fewer than 30 GYN NPIs with Medicare data, fall back to national.


### Computing Peer Anchors

From the state-level peer cohort, compute the following percentile anchors:

```
peer_cohort = all GYN NPIs in the same state
    WHERE taxonomy_code IN ('207VG0400X', '207V00000X')
    AND delivery_code_pct < 0.05
    AND taxonomy_code NOT IN ('207VX0201X', '207VF0040X', '207VM0101X', '207VE0102X')
    AND total_medicare_services >= 10

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio across peer_cohort
peer_p25 = 25th percentile
peer_median = 50th percentile (median)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

**Example peer anchors (national gynecology, illustrative):**

| Percentile | Charge-to-Allowed Ratio |
|---|---|
| p10 | ~1.50x |
| p25 | ~1.85x |
| Median | ~2.25x |
| p75 | ~2.80x |
| p90 | ~3.40x |

These are illustrative. Actual anchors should be computed from the real CMS data once loaded. They will differ by state.


## 3. Scoring Bands

The score uses three bands based on where the provider's ratio falls in the peer distribution:

```
provider_ratio = charge_to_allowed_ratio for this NPI

IF peer_p25 <= provider_ratio <= peer_p75:
    billing_quality_score = 100        -- inside the middle 50%, normal

ELIF peer_p10 <= provider_ratio <= peer_p90:
    billing_quality_score = 70         -- inside the middle 80%, somewhat unusual

ELSE:
    billing_quality_score = 40         -- outside the middle 80%, outlier
```

| Band | Range | Score | Interpretation |
|---|---|---|---|
| Normal | p25 to p75 | 100 | Provider's pricing is within the typical range for GYN peers in this state. No signal. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | Provider is in the tails of the peer distribution but not extreme. Could reflect market positioning, not a problem. |
| Outlier | Below p10 or above p90 | 40 | Provider's pricing is significantly different from peers. Worth investigating. Not an automatic fail. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 2.2x is not "better" than 2.5x in any clinical sense. Both are normal. The purpose of this score is to flag outliers, not to rank providers. A three-band system (normal / somewhat unusual / outlier) communicates this clearly: you are either in line with peers, at the edge, or outside the norm.


## 4. Per-Code Analysis (Optional Detail Layer)

The composite ratio in Section 1 blends all codes together. For a deeper look, compute the ratio per HCPCS code and flag codes where the provider deviates significantly from the peer median for that code:

```
For each HCPCS code billed by this NPI:

    provider_code_ratio = average_submitted_chrg_amt / average_medicare_allowed_amt

    peer_code_median = MEDIAN(average_submitted_chrg_amt / average_medicare_allowed_amt)
        across all peer NPIs billing this code

    code_deviation = provider_code_ratio / peer_code_median

    IF code_deviation > 2.0 OR code_deviation < 0.5:
        code_flag = "outlier"
    ELSE:
        code_flag = "normal"

outlier_code_count = COUNT of codes WHERE code_flag = "outlier"
outlier_code_pct = outlier_code_count / total_codes_billed * 100
```

This layer answers: "is the provider's pricing outlier status driven by one or two codes, or is it across the board?" A provider who charges 5x the peer median for 99214 but is normal on everything else has a different story from one who is 3x+ on every code.


---

# PART C: PROCEDURE RATIO ANALYSIS (Green Flags and Red Flags)

---

Charge-to-allowed is about pricing. This section is about the relationships between procedures. Certain code ratios reveal practice quality, and certain combinations are warning signs. All of these use HCPCS volumes from both Medicare and Medicaid combined.


## 5. E/M Level Distribution (Upcoding Check)

Every office visit is billed at a complexity level. Peers have a typical distribution. A provider who consistently bills at higher complexity than peers may be upcoding.

```
em_codes = {
    99211: 'minimal',
    99212: 'straightforward',
    99213: 'low',
    99214: 'moderate',
    99215: 'high'
}

For this NPI:
    em_total = SUM(total_services) WHERE hcpcs_code IN [99211-99215]

    For each level:
        provider_pct = services for this code / em_total

For peer cohort (same state):
    peer_median_pct for each level
```

**What normal looks like in gynecology:**

| Code | Level | Typical Peer Distribution |
|---|---|---|
| 99211 | Minimal (nurse visit) | ~1-2% |
| 99212 | Straightforward | ~3-6% |
| 99213 | Low complexity | ~30-40% |
| 99214 | Moderate complexity | ~35-45% |
| 99215 | High complexity | ~5-10% |

Gynecology E/M distribution is different from both pediatrics and urology. In pediatrics, 99213 is clearly dominant (~45-55%). In urology, 99214 is clearly dominant (~40-50%) with high 99215. In gynecology, 99213 and 99214 are roughly co-dominant. A gynecologist's E/M mix reflects the blend of straightforward well-woman exams (99213) and more complex visits for menopause management, AUB workup, or chronic conditions (99214). Neither code dominating completely is normal.

**Note:** Gynecology has a significant preventive visit component (99385-99397) that is SEPARATE from the E/M distribution above. Preventive visits (well-woman exams) are coded using the 99385-99397 series, not the 99211-99215 E/M codes. These should be analyzed separately. The E/M distribution here covers only problem-oriented office visits.

**Red flag:** Provider's 99215 alone exceeds 15% of E/M volume. Very high complexity visits should be uncommon in general gynecology.

**Red flag:** Provider's 99214 + 99215 combined is above the peer p90. This means they bill at higher complexity than 90% of GYN peers.

**Green flag:** Provider's distribution closely matches peer median (all levels within 10 percentage points of peer median).

```
high_complexity_pct = (services_99214 + services_99215) / em_total

peer_p90_high_complexity = 90th percentile of high_complexity_pct across peer cohort

em_distribution_flag = "red"  IF high_complexity_pct > peer_p90_high_complexity
                      "yellow" IF high_complexity_pct > peer_p75_high_complexity
                      "green"  IF high_complexity_pct <= peer_p75_high_complexity
```


## 6. Green Flag Ratios (Good Practice Signals)

These ratios indicate a provider is doing things right. High ratios compared to peers are positive signals.


### 6A. Cervical Screening to Well-Woman Ratio

Does the provider collect Pap/HPV specimens at most well-woman visits?

```
cervical_ratio = services_Q0091 / (services_99385 + services_99386 +
                                    services_99395 + services_99396)
    -- Q0091 = obtaining Pap smear / HPV specimen collection
    -- 99385 = new patient preventive visit age 18-39
    -- 99386 = new patient preventive visit age 40-64
    -- 99395 = established preventive visit age 18-39
    -- 99396 = established preventive visit age 40-64
```

**Green flag:** Ratio above peer p75. Provider collects cervical specimens at most well-woman visits.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does fewer cervical screens relative to well-woman visits. Could reflect age-appropriate intervals (ACOG says screening every 3 years for some age groups), but very low ratios in a practice seeing reproductive-age women deserve a look.

ACOG recommends cervical screening at well-woman visits per age-appropriate intervals: Pap every 3 years ages 21-29, Pap + HPV co-test every 5 years or Pap every 3 years ages 30-65.


### 6B. Colposcopy to Cervical Screening Ratio

Does the provider follow up abnormal screenings with colposcopy?

```
colpo_ratio = (services_57452 + services_57454) / services_Q0091
    -- 57452 = colposcopy of cervix, without biopsy
    -- 57454 = colposcopy of cervix, with biopsy
    -- Q0091 = cervical specimen collection
```

**Green flag:** Ratio between 0.05 and 0.30 and above peer p25. Provider follows up abnormal screenings with colposcopy at a reasonable rate. Not every screen produces an abnormal result, so the ratio should be well below 1.0. A ratio of 0.10-0.20 means roughly 10-20% of screens lead to colposcopy, which aligns with typical abnormal Pap rates.

**Signal:** Ratio of 0.0 with high screening volume (Q0091 > 30). Provider collects many Pap specimens but never does colposcopy. This could mean they refer all colposcopies out. Not a red flag, but a note: the provider screens but does not manage abnormal results in-house.

**Signal:** Ratio above 0.30. Provider does colposcopy at a very high rate relative to screening. Could indicate a referral-heavy practice that receives abnormal results from other providers.


### 6C. Colposcopy Biopsy Rate

When the provider does colposcopy, how often do they biopsy?

```
colpo_biopsy_rate = services_57454 / (services_57452 + services_57454)
    -- 57454 = colposcopy with biopsy
    -- 57452 = colposcopy without biopsy
```

**Green flag:** Above peer p75. When this provider does colposcopy, they biopsy when indicated. ASCCP guidelines recommend biopsy at colposcopy when abnormalities are visualized. A high biopsy rate during colposcopy suggests thorough evaluation.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does colposcopy but rarely biopsies. Could be appropriate if most colposcopies show normal findings, but very low biopsy rates during colposcopy are unusual.


### 6D. LARC to Well-Woman Ratio

Does the provider actively offer long-acting reversible contraception?

```
larc_ratio = (services_58300 + services_11981) / (services_99385 + services_99395 +
                                                    services_99386 + services_99396)
    -- 58300 = IUD insertion
    -- 11981 = implant insertion (Nexplanon)
    -- denominator = well-woman preventive visits
```

**Green flag:** Above peer p75. Provider actively offers LARC at well-woman visits. ACOG recommends LARC as first-line contraception for most women, including adolescents. A provider who places IUDs and implants at a high rate relative to their preventive visits is following this guidance.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider does well-woman visits but rarely places LARC. Could reflect patient demographics (post-menopausal practice), referral pattern, or a practice that does not offer LARC.


### 6E. Endometrial Biopsy to Visit Ratio

Does the provider evaluate abnormal uterine bleeding with biopsy routinely?

```
emb_ratio = services_58100 / total_established_em_visits
    -- 58100 = endometrial biopsy
    -- denominator = total established E/M visits (99211-99215)
```

**Green flag:** Above peer p75. Provider evaluates AUB with in-office endometrial biopsy at a higher rate than most peers. ACOG recommends endometrial sampling for women with AUB who are over 45, or younger women with risk factors. A gynecologist who does this routinely is practicing evidence-based medicine.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25. Provider rarely does endometrial biopsies relative to visit volume. Could refer out, or could indicate a practice focused on younger women where endometrial biopsy is less common.


### 6F. In-Office Imaging to Visit Ratio

Does the provider have in-office ultrasound capability?

```
imaging_ratio = (services_76830 + services_76856) / total_em_visits
    -- 76830 = transvaginal ultrasound
    -- 76856 = pelvic ultrasound (transabdominal)
    -- denominator = all E/M visits (99211-99215)
```

**Green flag:** Above peer p75. Provider has and uses in-office ultrasound. In-office imaging enables same-visit diagnosis of fibroids, ovarian cysts, endometrial pathology, and IUD positioning. A gynecologist with a high imaging-to-visit ratio is providing more complete care per encounter.

**Neutral:** Between peer p25 and p75.

**Signal:** Below peer p25 or zero. Provider does not bill ultrasound. Could be referring all imaging out, or could be a practice without ultrasound equipment. Not a red flag, but less comprehensive in-office capability.


### 6G. Preventive-to-Total Visit Ratio

What proportion of this provider's visits are preventive (well-woman)?

```
preventive_visits = services_99385 + services_99386 + services_99387 +
                    services_99395 + services_99396 + services_99397
    -- 99385-99387 = new patient preventive visits by age band
    -- 99395-99397 = established patient preventive visits by age band

total_visits = preventive_visits + total_em_visits
    -- total_em_visits = services_99211 + ... + services_99215

preventive_ratio = preventive_visits / total_visits
```

**Green flag:** Above peer p75. Practice is more prevention-oriented than most GYN peers. A high preventive-to-total ratio means the provider spends more of their practice on well-woman care, screening, and health maintenance.

**Neutral:** Between p25 and p75.

**Signal:** Below peer p25. Practice is overwhelmingly problem-oriented visits. Could be a referral practice that only sees patients with existing complaints, not necessarily bad, but atypical for a general GYN practice where well-woman care is a cornerstone.


### 6H. IUD Insertion-to-Removal Ratio

Does the provider place more IUDs than they remove?

```
iud_ratio = services_58300 / services_58301
    -- 58300 = IUD insertion
    -- 58301 = IUD removal
```

**Green flag:** Ratio between 1.5 and 5.0 and within peer p25-p75. Provider inserts more IUDs than they remove. This indicates net LARC adoption: the provider is actively starting women on IUDs, not just maintaining or removing them.

**Signal:** Ratio far below 1.0 (more removals than insertions). Could signal that patients come to this provider specifically to remove IUDs placed elsewhere, or higher-than-normal dissatisfaction/side-effect management. Not necessarily bad, but worth noting.

**Signal:** Ratio above 5.0. Very high insertion relative to removal. Could be a newer practice that has not yet accumulated removals, or could indicate patients are leaving the practice before removal time.

**Neutral:** Skip if neither code billed. A GYN practice that does not offer IUDs at all is not penalized.


## 7. Red Flag Ratios (Warning Signals)

These ratios indicate potential problems: unusual billing patterns, possible complications, or codes that should not appear together at high rates.


### 7A. Return Visit Intensity

How many total visits does each patient have per year?

```
visits_per_beneficiary = total_em_services / total_unique_beneficiaries
    -- (from Medicare "By Provider" file which has both)

peer_median_visits_per_bene = MEDIAN across peer cohort
peer_p90_visits_per_bene = 90th percentile
```

**Red flag:** `visits_per_beneficiary` above peer p90. Provider's patients come back significantly more than peers' patients.

**Neutral:** Between p25 and p75.

Note: high visit intensity can be legitimate for gynecology (managing complex menopause, chronic pelvic pain, post-surgical follow-up). But for a general GYN practice, most patients should be annual well-woman visits plus occasional problem visits. A very high per-patient visit rate is unusual and could indicate unnecessary follow-ups or billing anomalies.


### 7B. New-to-Established Patient Ratio

What proportion of visits are new patients vs. established?

```
new_patient_pct = new_patient_services / total_em_services
    -- new patient services = 99201 + ... + 99205 + 99385 + 99386 + 99387
    -- total_em_services = all E/M visit codes
```

**Red flag (high):** New patient percentage far above peer p90. Could indicate high patient turnover (patients leaving the practice), or a practice that codes established patients as new (billing error or fraud).

**Red flag (very low):** New patient percentage near zero. Could indicate a closed panel or a practice not accepting new patients. Not a billing issue, but a signal about practice accessibility.


### 7C. High-Complexity Visit Rate

```
high_complexity_pct = services_99215 / total_em_services
```

**Red flag:** Above 15% of E/M volume. Gynecology visits are typically moderate complexity. 99215 requires extensive time or medical decision-making. While some complex GYN conditions (endometriosis management, complex menopause, cancer surveillance) justify 99215, the code should be uncommon relative to total volume.

**Neutral:** Below 10%. Normal for general GYN.


### 7D. Well-Woman Visits Without Cervical Screening

```
wellwoman_no_screening = total_preventive_visits > 50 AND services_Q0091 = 0
    -- total_preventive_visits = 99385 + 99386 + 99387 + 99395 + 99396 + 99397
```

**Red flag:** Provider does many well-woman visits but never collects cervical specimens. ACOG mandates cervical screening as part of well-woman care for women ages 21-65. A gynecologist doing 50+ preventive visits and billing zero Q0091 is either not screening or not billing for it. Either way, this is a strong signal.

Note: A provider seeing mostly women over 65 (post-screening age per USPSTF) could legitimately have low cervical screening volume. But zero Q0091 with 50+ preventive visits is very unusual for any GYN practice.


### 7E. Cervical Screening Without Well-Woman Visits

```
screening_no_wellwoman = services_Q0091 > 10 AND total_preventive_visits = 0
```

**Red flag:** Provider collects Pap/HPV specimens but bills zero preventive visit codes. Cervical specimen collection normally happens at a well-woman visit. A provider who bills Q0091 without any preventive visit codes is either miscoding the visit (billing E/M instead of preventive) or has an unusual workflow. Worth investigating.


### 7F. LEEP Without Colposcopy

```
leep_no_colpo = services_57460 > 3 AND (services_57452 + services_57454) = 0
    -- 57460 = LEEP (loop electrosurgical excision procedure)
    -- 57452 + 57454 = colposcopy (with and without biopsy)
```

**Red flag:** Provider does cervical excision procedures (LEEP) without any colposcopy volume. LEEP should follow colposcopic evaluation. ASCCP guidelines require colposcopy with biopsy confirmation of high-grade dysplasia before proceeding to excision. A provider doing LEEP with zero colposcopy is either receiving all referrals post-colposcopy (possible, but unusual at this volume) or skipping the evaluation step.


### 7G. Single-Code Dominance

Is any one code an unusually large share of the provider's total billing?

```
For each HCPCS code billed by this NPI:
    code_pct = services_for_code / total_services

max_code_pct = MAX(code_pct)
dominant_code = the HCPCS code with the highest code_pct
```

**Red flag:** `max_code_pct` > 30% AND dominant code is NOT 99214 or 99213. For a general GYN practice, 99214 or 99213 as the dominant code is expected. Any other code exceeding 30% of total billing suggests an unusual practice pattern. A provider whose top code is an ultrasound or a surgical code at 30%+ is not a typical general gynecologist.

**Normal:** For most gynecologists, no single code exceeds 20-25% except 99213 or 99214.


### 7H. E/M Complexity Trend (Multi-Year)

Is the provider's E/M complexity increasing year over year faster than peers?

```
For each year in [2021, 2022, 2023]:
    high_complexity_pct_year = (services_99214 + services_99215) / total_em_services

complexity_trend = high_complexity_pct_2023 - high_complexity_pct_2021
peer_median_trend = MEDIAN(complexity_trend) across peer cohort
```

**Red flag:** Provider's complexity trend is above peer p90. Their E/M billing is escalating faster than peers. Could indicate progressive upcoding.

**Neutral:** Trend within p25-p75 of peers. Some upward drift is normal (CMS documentation changes in 2021 shifted coding patterns nationally).

Note: Requires multi-year data. The Medicaid Provider Spending file covers 2018-2024, so this is computable.


### 7I. Hysterectomy Without Office Volume

```
surg_no_office = services_58571 > 5 AND total_em_visits < 30
    -- 58571 = laparoscopic hysterectomy (most common route)
    -- total_em_visits = 99211 + ... + 99215
```

**Red flag:** Provider has meaningful surgical volume but minimal corresponding office practice. A gynecologist doing 5+ hysterectomies should have a proportional office visit base (pre-op evaluation, post-op follow-up, the visits that lead to the decision for surgery). Surgical volume without office visits suggests the provider may be billing procedures under this NPI while office visits are billed under a different entity, or the practice operates primarily as a surgical referral practice without continuity of care.


### 7J. After-Hours Rate

```
after_hours_pct = services_99051 / total_em_visits
```

**Red flag:** Above peer p90. Unusually high proportion of visits billed as after-hours. Gynecology is primarily a daytime office-based specialty. Some after-hours billing is normal (urgent visits for pelvic pain, bleeding), but a high rate suggests either a non-standard practice model or inflated after-hours add-on billing.

**Neutral:** Most GYN providers bill 99051 at 0-2% of visits.


## 8. Cross-Category Consistency Checks

These checks look for logical consistency between categories. They are not about volume but about whether the provider's code mix makes sense as a coherent gynecology practice.

| Check | Logic | Flag |
|---|---|---|
| Well-woman visits but no cervical screening | total_preventive > 50 AND Q0091 = 0 | Red: ACOG mandates cervical screening as part of well-woman care |
| Colposcopy but no cervical screening | (57452 + 57454) > 10 AND Q0091 = 0 | Red: colposcopy follows abnormal screening. Doing colposcopies with zero screening suggests all referrals (possible) or miscoding. |
| LEEP but no colposcopy | 57460 > 3 AND (57452 + 57454) = 0 | Red: LEEP follows colposcopy per ASCCP. Skipping colposcopy before excision is a protocol break. |
| IUD removal but no insertion | 58301 > 10 AND 58300 = 0 | Yellow: provider only removes IUDs, never places them. Could be a referral pattern where patients come to this provider to remove devices placed elsewhere. Not necessarily bad, but unusual. |
| Endometrial biopsy but no ultrasound | 58100 > 10 AND (76830 + 76856) = 0 | Yellow: AUB workup usually includes imaging alongside biopsy. A provider doing biopsies without any pelvic/transvaginal ultrasound is either referring all imaging out or working up bleeding without imaging. Unusual. |
| Hysteroscopy but no endometrial biopsy | 58558 > 5 AND 58100 = 0 | Yellow: ACOG recommends trying office-based endometrial biopsy before proceeding to hysteroscopy for AUB evaluation. Jumping directly to hysteroscopy without ever doing the simpler biopsy first is unusual. |
| Imaging but no office visits | (76830 + 76856) > 20 AND total_em < 20 | Red: an imaging-only practice under an individual gynecologist NPI is unusual. Could indicate a provider doing only ultrasound reads without seeing patients in a clinical capacity. |


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | E/M level distribution | 5 | Red flag | Medicare + Medicaid |
| 2 | Cervical screening to well-woman ratio | 6A | Green flag | Medicare + Medicaid |
| 3 | Colposcopy to cervical screening ratio | 6B | Green flag | Medicare + Medicaid |
| 4 | Colposcopy biopsy rate | 6C | Green flag | Medicare + Medicaid |
| 5 | LARC to well-woman ratio | 6D | Green flag | Medicare + Medicaid |
| 6 | Endometrial biopsy to visit ratio | 6E | Green flag | Medicare + Medicaid |
| 7 | In-office imaging to visit ratio | 6F | Green flag | Medicare + Medicaid |
| 8 | Preventive-to-total visit ratio | 6G | Green flag | Medicare + Medicaid |
| 9 | IUD insertion-to-removal ratio | 6H | Green flag | Medicare + Medicaid |
| 10 | Return visit intensity | 7A | Red flag | Medicare |
| 11 | New-to-established ratio | 7B | Red flag | Medicare + Medicaid |
| 12 | High-complexity visit rate | 7C | Red flag | Medicare + Medicaid |
| 13 | Well-woman visits without cervical screening | 7D | Red flag | Medicare + Medicaid |
| 14 | Cervical screening without well-woman visits | 7E | Red flag | Medicare + Medicaid |
| 15 | LEEP without colposcopy | 7F | Red flag | Medicare + Medicaid |
| 16 | Single-code dominance | 7G | Red flag | Medicare + Medicaid |
| 17 | E/M complexity trend (multi-year) | 7H | Red flag | Medicare + Medicaid |
| 18 | Hysterectomy without office volume | 7I | Red flag | Medicare + Medicaid |
| 19 | After-hours billing rate | 7J | Red flag | Medicare + Medicaid |
| 20-26 | Cross-category consistency (7 checks) | 8 | Yellow/Red | Medicare + Medicaid |

**Total: ~26 ratio checks** (8 green flags, 10 red flags, 1 E/M distribution check, 7 cross-category consistency checks).


## 10. Scoring the Ratio Analysis

Each ratio check produces a flag: green, neutral/yellow, or red. We roll them up into a single ratio analysis score.

```
ratio_checks = [all ~26 checks listed above, excluding those with insufficient data]

green_count = COUNT WHERE flag = "green"
red_count = COUNT WHERE flag = "red"
neutral_count = COUNT WHERE flag = "neutral" OR flag = "yellow"
total_checks = COUNT of all applicable checks (skip those with insufficient data)

ratio_analysis_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0))
                       / total_checks * 100
```

| Score | Interpretation |
|---|---|
| 80-100 | Most ratios are green or neutral. Practice patterns look clean. |
| 60-79 | Mixed. Some green flags, some red. Worth looking at which reds. |
| 40-59 | Multiple red flags. Billing patterns deviate from peers in several areas. |
| Below 40 | Significant red flags across multiple ratio checks. Investigate. |

Green flags can offset neutral, but cannot offset red flags in isolation. A provider with 5 greens and 3 reds is different from a provider with 5 greens and 0 reds.


---

# PART D: COMPOSITE BILLING QUALITY SCORE

---


## 11. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "CA"

STEP 1: Compute provider ratio
    charges = SUM(average_submitted_chrg_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023
    allowed = SUM(average_medicare_allowed_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023

    IF allowed = 0 OR total services < 10: RETURN insufficient_data

    provider_ratio = charges / allowed

STEP 2: Build peer distribution
    peer_cohort = all NPIs WHERE taxonomy IN ('207VG0400X', '207V00000X')
        AND delivery_code_pct < 0.05
        AND taxonomy NOT IN ('207VX0201X', '207VF0040X', '207VM0101X', '207VE0102X')
        AND state = "CA" AND total_medicare_services >= 10

    IF COUNT(peer_cohort) < 30: use national cohort instead

    Compute peer_p10, peer_p25, peer_median, peer_p75, peer_p90

STEP 3: Score
    IF peer_p25 <= provider_ratio <= peer_p75:
        charge_score = 100
    ELIF peer_p10 <= provider_ratio <= peer_p90:
        charge_score = 70
    ELSE:
        charge_score = 40

STEP 4: Flag direction
    IF provider_ratio > peer_p75:
        direction = "above_peers"
    ELIF provider_ratio < peer_p25:
        direction = "below_peers"
    ELSE:
        direction = "in_range"

STEP 5: Per-code analysis (optional)
    For each HCPCS code, compute code_deviation and flag outliers.

STEP 6: Compute ratio_analysis_score (Section 10)

STEP 7: Composite
    billing_quality_composite = (charge_score * 0.35) + (ratio_analysis_score * 0.65)

    IF no Medicare charge data available:
        billing_quality_composite = ratio_analysis_score
```


## 12. Worked Examples

**Provider A in California.** Medicare data for 2023.

**Charge analysis:**
Provider A charges $210,000 total, Medicare allowed $95,000. Ratio = **2.21x**.

**CA peer anchors:**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.55x | 1.90x | 2.30x | 2.85x | 3.45x |

Provider A ratio of 2.21x falls between p25 (1.90x) and p75 (2.85x). Charge score = **100**. Direction = **in_range**.

**Ratio analysis:**
Provider A's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99213 at 36%, 99214 at 40%, 99215 at 7% | Within peer p25-p75 | Green |
| Cervical screening to well-woman | 0.62 | Above peer p75 (0.50) | Green |
| Colposcopy to screening | 0.14 | Between 0.05-0.30, above peer p25 | Green |
| Colposcopy biopsy rate | 0.72 | Above peer p75 (0.60) | Green |
| LARC to well-woman | 0.08 | Between p25-p75 | Neutral |
| Endometrial biopsy to visit | 0.04 | Between p25-p75 | Neutral |
| In-office imaging to visit | 0.15 | Above peer p75 (0.10) | Green |
| Preventive-to-total visit | 0.42 | Above peer p75 (0.35) | Green |
| IUD insertion-to-removal | 2.8 | Between 1.5-5.0, within p25-p75 | Green |
| Return visit intensity | 1.9 visits/bene | Between p25-p75 | Neutral |
| New-to-established ratio | 22% | Between p25-p75 | Neutral |
| High-complexity rate | 7% 99215 | Below 15% | Neutral |
| Well-woman without screening | N/A (has both) | -- | Neutral |
| Screening without well-woman | N/A (has both) | -- | Neutral |
| LEEP without colposcopy | N/A (has colposcopy) | -- | Neutral |
| Single-code dominance | 24% (99214) | Normal (99214 expected) | Neutral |
| E/M trend | +2% over 2 years | Within peer p25-p75 | Neutral |
| Hysterectomy without office | N/A (has office visits) | -- | Neutral |
| After-hours billing | 1% | Normal | Neutral |
| Consistency checks (7) | 0 fired | -- | All neutral |

Green count: 7. Neutral count: 19. Red count: 0. Total applicable: 26.

```
ratio_analysis_score = ((7 * 1.0) + (19 * 0.5) + (0 * 0.0)) / 26 * 100
                     = (7.0 + 9.5 + 0) / 26 * 100
                     = 16.5 / 26 * 100
                     = 63.5
```

```
billing_quality_composite = (100 * 0.35) + (63.5 * 0.65)
                          = 35.0 + 41.3
                          = 76.3
```

Provider A scores **76.3** on billing quality. Clean charge ratio, strong screening and prevention metrics, in-office imaging, solid colposcopy follow-through. No red flags. This is a well-run general GYN practice with clean billing.

---

**Provider B in California.**

**Charge analysis:**
Provider B charges $490,000 total, Medicare allowed $115,000. Ratio = **4.26x**.

Same CA peer anchors. Provider B ratio of 4.26x is above p90 (3.45x). Charge score = **40**. Direction = **above_peers**.

Per-code analysis shows: 58558 (hysteroscopy) at 6.8x peer median (flagged), 99214 at 4.5x peer median (flagged), most other codes also above 3x. Provider B's pricing is consistently aggressive across the board, not driven by one code.

**Ratio analysis:**
Provider B's ratio checks:

| Check | Value | Peer Comparison | Flag |
|---|---|---|---|
| E/M distribution | 99213 at 22%, 99214 at 42%, 99215 at 19% | 99215 above 15% | Red |
| Cervical screening to well-woman | 0.0 | Provider does 80 preventive visits, zero Q0091 | Red |
| Colposcopy to screening | N/A | No screening volume | Neutral (skip) |
| Colposcopy biopsy rate | 0.30 | Below peer p25 | Signal |
| LARC to well-woman | 0.0 | Zero IUD/implant placement | Neutral |
| Endometrial biopsy to visit | 0.0 | Zero 58100 | Neutral |
| In-office imaging to visit | 0.28 | Above peer p90 | Green (high imaging is good) |
| Preventive-to-total visit | 0.18 | Below peer p25 | Signal |
| IUD insertion-to-removal | N/A | Neither code billed | Neutral (skip) |
| Return visit intensity | 4.6 visits/bene | Above peer p90 | Red |
| New-to-established ratio | 5% | Near zero, below p10 | Red |
| High-complexity rate | 19% 99215 | Above 15% | Red |
| Well-woman without screening | Fires (80 preventive, Q0091 = 0) | -- | Red |
| Screening without well-woman | N/A | -- | Neutral |
| LEEP without colposcopy | N/A (no LEEP) | -- | Neutral |
| Single-code dominance | 28% (99214) | Normal code but high % | Neutral |
| E/M trend | +7% over 2 years | Above peer p90 | Red |
| Hysterectomy without office | N/A (has office visits) | -- | Neutral |
| After-hours billing | 5% | Above peer p90 | Red |
| Consistency: well-woman no screening | Fires | -- | Red (already counted in 7D) |
| Consistency: hysteroscopy no biopsy | 58558 = 8, 58100 = 0. Fires. | -- | Yellow |
| Consistency: imaging no office visits | Does not fire (has visits) | -- | Neutral |
| Other consistency checks | 0 more fire | -- | Neutral |

Green count: 1. Neutral count: 13. Red count: 7. Yellow count: 1. Total applicable: 22 (some checks skipped for insufficient data).

```
ratio_analysis_score = ((1 * 1.0) + (14 * 0.5) + (7 * 0.0)) / 22 * 100
                     = (1.0 + 7.0 + 0) / 22 * 100
                     = 8.0 / 22 * 100
                     = 36.4
```

```
billing_quality_composite = (40 * 0.35) + (36.4 * 0.65)
                          = 14.0 + 23.7
                          = 37.7
```

Provider B scores **37.7** on billing quality. Aggressive pricing across the board, 19% high-complexity visits and trending upward, patients returning 4.6 times per year, near-zero new patients, after-hours billing in an office specialty, and most damning: 80 well-woman visits with zero cervical screening. That last one is not just a billing anomaly. It is a clinical quality signal. This provider is performing well-woman exams without the core preventive service that defines them. Combine that with hysteroscopy volume but zero endometrial biopsies (skipping the simpler workup), and you have a practice where the billing pattern tells a story about clinical shortcuts.


---

# PART E: HOW THIS FITS WITH THE OTHER FOUR SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **ACOG Guidelines Concordance** | Does this provider follow ACOG guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal gynecologist? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume believable? | Behavior check |
| **Payer Diversity** | Is practice consistent across payers? | Access proxy |
| **Billing Quality** | Are their charges, ratios, and E/M distribution in line with peers? | Pricing + integrity check |

Billing quality is the integrity layer. It checks pricing behavior (charge-to-allowed) AND practice pattern behavior (procedure ratios). A provider can score well on the other four scores but get flagged here for upcoding, unusual visit intensity, or pricing outliers.

| Scenario | Guidelines | Peer | Volume | Payer | Billing |
|---|---|---|---|---|---|
| Good GYN, normal billing | High | High | High | High | High |
| Good GYN, aggressive pricing | High | High | High | High | Low (charge ratio outlier) |
| Provider upcoding E/M levels | High | High | High | High | Low (red flag on E/M distribution) |
| Provider who screens but never follows up | High (screens are there) | High (bills the codes) | High | High | Low (red flag: zero colposcopy with high screening, or zero LEEP follow-through) |
| Prevention-heavy practice, clean billing | High | High | High | High | High (green flags on preventive ratio, screening, LARC) |
| Low-quality provider, clean billing | Low | Low | Low | Low | High |

The green and red flags in this doc add nuance the other scores miss. A provider with a great peer comparison score (they bill all the right codes) but whose cervical-screening-to-well-woman ratio is zero is performing the visit without the screening that defines it. The volume adequacy doc catches "no Q0091 volume" as a volume gap. This doc catches "80 preventive visits and zero Q0091" as a ratio problem, which is worse.

Similarly, a provider who follows ACOG guidelines on paper but bills 99215 for 19% of visits is claiming their patients are more complex than what 85% of gynecologists see. That might be true for a gynecologic oncology practice. For a general gynecologist seeing well-woman exams and AUB, it is a red flag.


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed analysis uses Medicare, which is moderate for gynecology.** Not as strong as urology (where Medicare is dominant), not as weak as pediatrics (where Medicare covers almost no one). Most gynecologists see enough Medicare-age women (menopause management, post-menopausal screening, vulvar conditions) to generate a usable charge-to-allowed ratio. But for a gynecologist whose practice is entirely reproductive-age women, Medicare data may be thin. We require >= 10 Medicare services to score the charge ratio. Providers with no Medicare data get scored on procedure ratios only.

**Procedure ratios use aggregated data, not same-day linkage.** We cannot confirm that a specific cervical screening happened on the same day as a specific well-woman visit. We can only check whether the total volumes are proportional. Some ideal checks (did the provider do colposcopy within 3 months of an abnormal Pap?) require claims-level data with dates and are reserved for MA APCD or similar.

**E/M distribution for gynecology is between primary care and surgical specialties.** The 99213/99214 co-dominance pattern is the expected norm for GYN. Anyone applying primary care benchmarks (99213 dominant) or urology benchmarks (99214 strongly dominant, high 99215) to gynecology will generate false positives. We compare to GYN peers specifically.

**Preventive visits are a major component and should be analyzed separately from E/M.** Well-woman visits (99385-99397) are a large share of gynecologic practice. They are coded differently from problem-oriented E/M (99211-99215). The E/M distribution analysis in Section 5 covers only problem-oriented visits. The preventive-to-total ratio in Section 6G captures the preventive component. Combining them would distort the E/M complexity assessment.

**Case mix affects ratios.** A menopause-focused practice will have different ratios than a reproductive-age-focused practice. A menopause practice will have lower LARC ratios and lower cervical screening ratios (appropriate, since their patients may be past screening age). A reproductive-age practice will have lower endometrial biopsy ratios (appropriate, since AUB evaluation is less common in younger women). Without diagnosis codes, we cannot adjust for case mix. Peer comparisons assume the average gynecologist sees a mix. Niche practices will deviate. Red flags need investigation, not automatic penalty.

**Some contraception codes may be billed by family planning clinics.** Community health centers and Title X clinics bill IUD insertions (58300) and implant placements (11981) under NPIs that may or may not be gynecologists. The peer cohort is filtered by taxonomy, so family planning clinics staffed by nurse practitioners or family medicine physicians are excluded. But some GYN-taxonomy providers at these clinics may have unusually high LARC-to-visit ratios that reflect their clinic's mission, not aberrant billing.

**Red flags need investigation, not automatic penalty.** Every red flag in this doc has a plausible benign explanation. High return visit intensity could mean a complex panel. Zero cervical screening with high preventive visits could mean a post-menopausal practice (though unlikely at 50+ visits). LEEP without colposcopy could mean a referral-only LEEP practice. The score surfaces signals. Someone has to look at them.

**Geographic variation affects all ratios.** State Medicaid policy, local referral patterns, and urban/rural differences all shape billing patterns. State-level peer grouping captures most of this. Sub-state grouping (ZIP-3 or CBSA) would help.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| **Identity & Geography** | | |
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code, derived from ZIP |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used |
| peer_cohort_state | string | State of the peer cohort (or "US" if national) |
| peer_cohort_size | int | Number of peers in the cohort |
| **Charge-to-Allowed (Medicare only)** | | |
| total_medicare_services | int | Total Medicare services for this NPI |
| total_charges | float | SUM(avg_charge * services) across all codes |
| total_allowed | float | SUM(avg_allowed * services) across all codes |
| charge_to_allowed_ratio | float | total_charges / total_allowed |
| charge_peer_p10 | float | 10th percentile of peer cohort ratios |
| charge_peer_p25 | float | 25th percentile |
| charge_peer_median | float | 50th percentile |
| charge_peer_p75 | float | 75th percentile |
| charge_peer_p90 | float | 90th percentile |
| charge_score | float | 100 (p25-p75), 70 (p10-p90), or 40 (outside p90) |
| charge_direction | string | "in_range", "above_peers", or "below_peers" |
| outlier_code_count | int | HCPCS codes where charge ratio > 2x or < 0.5x peer median |
| outlier_code_list | string | Comma-separated outlier HCPCS codes |
| **E/M Distribution** | | |
| em_99211_pct | float | % of office visits billed as 99211 |
| em_99212_pct | float | % of office visits billed as 99212 |
| em_99213_pct | float | % of office visits billed as 99213 |
| em_99214_pct | float | % of office visits billed as 99214 |
| em_99215_pct | float | % of office visits billed as 99215 |
| em_high_complexity_pct | float | (99214 + 99215) / total E/M visits |
| em_distribution_flag | string | "green", "yellow", or "red" |
| **Green Flag Ratios** | | |
| cervical_screening_ratio | float | Q0091 / (99385 + 99386 + 99395 + 99396) |
| cervical_screening_flag | string | "green", "neutral", or "signal" |
| colpo_to_screening_ratio | float | (57452 + 57454) / Q0091 |
| colpo_screening_flag | string | Flag |
| colpo_biopsy_rate | float | 57454 / (57452 + 57454) |
| colpo_biopsy_flag | string | Flag |
| larc_to_wellwoman_ratio | float | (58300 + 11981) / (99385 + 99386 + 99395 + 99396) |
| larc_flag | string | Flag |
| emb_to_visit_ratio | float | 58100 / total established E/M visits |
| emb_flag | string | Flag |
| imaging_to_visit_ratio | float | (76830 + 76856) / total E/M visits |
| imaging_flag | string | Flag |
| preventive_to_total_ratio | float | Preventive visits / (preventive + E/M visits) |
| preventive_ratio_flag | string | Flag |
| iud_insertion_removal_ratio | float | 58300 / 58301 |
| iud_ratio_flag | string | Flag |
| **Red Flag Ratios** | | |
| visits_per_beneficiary | float | Total E/M services / unique beneficiaries |
| return_visit_flag | string | "green", "neutral", or "red" |
| new_patient_pct | float | New patient visits / total E/M visits |
| new_patient_flag | string | Flag |
| high_complexity_pct | float | 99215 / total E/M visits |
| high_complexity_flag | string | Flag |
| wellwoman_no_screening | boolean | total_preventive > 50 AND Q0091 = 0 |
| wellwoman_no_screening_flag | string | Flag |
| screening_no_wellwoman | boolean | Q0091 > 10 AND total_preventive = 0 |
| screening_no_wellwoman_flag | string | Flag |
| leep_no_colpo | boolean | 57460 > 3 AND (57452 + 57454) = 0 |
| leep_no_colpo_flag | string | Flag |
| max_single_code_pct | float | Highest single-code % of total services |
| single_code_dominance_flag | string | Flag |
| em_complexity_trend | float | Change in high-complexity % from earliest to latest year |
| em_trend_flag | string | Flag (multi-year) |
| surg_without_office | boolean | 58571 > 5 AND total_em < 30 |
| surg_without_office_flag | string | Flag |
| after_hours_pct | float | 99051 / total E/M visits |
| after_hours_flag | string | Flag |
| **Cross-Category Consistency** | | |
| consistency_flags | int | Count of cross-category consistency checks that fired (0-7) |
| consistency_flag_list | string | Comma-separated names of fired consistency checks |
| **Composite** | | |
| total_checks_run | int | Number of ratio checks with sufficient data to evaluate |
| green_flag_count | int | Number of ratio checks flagged green |
| neutral_flag_count | int | Number flagged neutral/yellow |
| red_flag_count | int | Number of ratio checks flagged red |
| ratio_analysis_score | float | Weighted roll-up of all ratio flags (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score (or ratio only if no Medicare) |
