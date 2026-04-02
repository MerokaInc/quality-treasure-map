# Internal Medicine Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The ACOG/AUA-style guidelines concordance doc asks: "did this provider do what clinical guidelines say they should?" This doc asks a different question: "does this provider's billing pattern look like a normal internist's?"

We built a reference code set from the most prevalent codes in the internal medicine peer cohort. Then we measure how much of that common practice set a provider covers. An internist who bills 23 of 25 typical codes is practicing a full-spectrum primary care workflow. An internist who bills 9 of 25 is either a hospitalist, a subspecialist miscoded under general IM, or missing large parts of standard primary care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.

**Critical framing for internal medicine:** Unlike procedural specialties (urology, dermatology), the differentiator here is not procedural breadth. Internal medicine is E/M dominant. Almost every internist bills office visits. The real variation is in how much the practice invests in preventive care, screening, immunizations, and care management beyond just sick visits. Two internists can both see 2,000 patients a year, but one does annual wellness visits, depression screening, immunizations, and chronic care management while the other only sees patients when they're sick. The peer comparison catches that difference.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guidelines concordance doc:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. Internal medicine is a Medicare-heavy specialty (large elderly patient panel). This is the primary dataset.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count. Lower volume for IM relative to Medicare, but useful for payer diversity analysis.
3. **NPPES NPI Registry** — provider identification, taxonomy code 207R00000X (Internal Medicine), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207R00000X (Internal Medicine, general) — exact match only | Excludes all subspecialists, non-IM specialties, NPs/PAs (different billing patterns) |
| State | Same state as the provider being scored | Practice patterns vary by state (Medicare reimbursement, patient demographics, preventive care norms) |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort the reference set |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

Internal medicine has a large number of subspecialty taxonomy codes. Any taxonomy that is not **exactly** 207R00000X must be excluded from the general IM peer cohort. The following subspecialist taxonomies are the most common and must be flagged and excluded:

| Taxonomy Code | Subspecialty |
|---|---|
| 207RC0000X | Cardiovascular Disease (Cardiology) |
| 207RE0101X | Endocrinology, Diabetes & Metabolism |
| 207RG0100X | Gastroenterology |
| 207RG0300X | Geriatric Medicine |
| 207RH0003X | Hematology & Oncology |
| 207RI0200X | Infectious Disease |
| 207RN0300X | Nephrology |
| 207RP1001X | Pulmonary Disease |
| 207RR0500X | Rheumatology |
| 207RC0200X | Critical Care Medicine |
| 207RX0202X | Medical Oncology |
| 207RS0010X | Sports Medicine |
| 207RS0012X | Sleep Medicine |
| 207RH0000X | Hematology |

This is not exhaustive. The rule is simple: if the taxonomy is not exactly 207R00000X, exclude it. The list above covers the most common ones so data engineers know what to expect.

These subspecialists should be flagged in output but not scored against the general IM reference set. Their billing patterns are legitimately different. A cardiologist bills echo and stress tests. A gastroenterologist bills colonoscopies. Neither should be compared to a general internist's preventive care pattern.

For a typical state, this should yield roughly 1,000-5,000 active general internists, depending on state population. Internal medicine is one of the largest specialties, much larger than urology or dermatology.


### Geographic Grouping

Peer cohorts are built at the **state level** by default. Practice patterns vary by state because of differences in Medicare coverage policies, patient demographics (age distribution, chronic disease burden), and local norms around preventive care. An internist in Florida should be compared to Florida peers, not a national average.

The pipeline should support grouping by:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Secondary benchmark. Useful for cross-state comparison: "how does the FL internal medicine workforce compare to TX?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Urban internists with large practice support staff vs. solo rural internists have different screening/vaccination patterns. Not implemented now, but the data supports it. |

Every score in this doc (code coverage, category coverage, volume concordance) uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, which changes the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set in Section 2 below is based on national data. When scoring at the state level, rebuild the reference set from the state-level peer cohort. If a code falls out of the top 25 in a given state (e.g., a state where few internists offer in-office ECGs), it drops from that state's reference set. The reference set size may vary by state (20-25 codes).


## 2. The Reference Code Set: What Normal Internal Medicine Practice Looks Like

We analyzed the most prevalent HCPCS codes billed by internal medicine practices nationally. The top 25 codes account for approximately 82% of all IM billing volume. These 25 codes define the "typical internal medicine workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 99214 | Office visit, established, moderate complexity | The dominant IM code. Chronic disease management, medication adjustments. | ~22% |
| 2 | 99213 | Office visit, established, low-moderate complexity | Simpler follow-ups, stable chronic conditions, acute minor illness | ~15% |
| 3 | G2211 | Visit complexity add-on | Ongoing care coordination. Very common in IM due to multi-morbidity. | ~5% |
| 4 | 99215 | Office visit, established, high complexity | Complex multi-morbidity. Multiple chronic conditions requiring high-level management. | ~5% |
| 5 | 99396 | Preventive visit, established, 40-64 | Annual physical for middle-aged adults | ~4% |
| 6 | 99397 | Preventive visit, established, 65+ | Annual physical for older adults | ~4% |
| 7 | 99395 | Preventive visit, established, 18-39 | Annual physical for younger adults | ~2% |
| 8 | 99204 | New patient visit, moderate complexity | New patient evaluation | ~3% |
| 9 | G0439 | Medicare annual wellness visit, subsequent | Structured Medicare preventive visit (returning patients) | ~3% |
| 10 | 99203 | New patient visit, low complexity | Simpler new patient | ~2% |
| 11 | G0438 | Medicare annual wellness visit, initial | Structured Medicare preventive visit (first time) | ~3% |
| 12 | 36415 | Venipuncture | Blood draws for labs (HbA1c, lipids, CBC, CMP) | ~2% |
| 13 | 90471 | Immunization administration | Vaccine administration | ~1.5% |
| 14 | 96127 | Brief behavioral/emotional assessment | Depression screening (PHQ-2/PHQ-9) | ~1.5% |
| 15 | 99386 | Preventive visit, new, 40-64 | New patient preventive, middle-aged | ~1% |
| 16 | 99387 | Preventive visit, new, 65+ | New patient preventive, older | ~0.8% |
| 17 | 81003 | Urinalysis, automated | Basic urine screening | ~1% |
| 18 | 93000 | ECG, 12-lead | Cardiac screening/evaluation | ~1% |
| 19 | 96160 | Patient-focused health risk assessment | Social determinants, health risk screening | ~1% |
| 20 | 90686 | Influenza vaccine | Flu shot | ~0.8% |
| 21 | 99211 | Office visit, minimal (nurse visit) | Nurse-only visits, vitals checks, injections | ~0.8% |
| 22 | G0444 | Annual depression screening (Medicare) | Medicare-specific depression screening code | ~0.7% |
| 23 | 99490 | Chronic care management, 20+ min/month | Between-visit chronic disease management | ~0.5% |
| 24 | 99205 | New patient visit, high complexity | Complex new evaluations | ~0.5% |
| 25 | 99385 | Preventive visit, new, 18-39 | New patient preventive, younger | ~0.4% |

Source: CMS Medicare Physician & Other Practitioners data, national internal medicine claims analysis.


### What This Set Reveals

These 25 codes are not random. They map to the six things a general internist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits** | 99213, 99214, 99215, 99203, 99204, 99205, G2211, 99211 | Provider may not do office-based IM (impossible if they passed the volume filter, so check data quality) |
| **Preventive/wellness visits** | 99395, 99396, 99397, 99385, 99386, 99387, G0438, G0439 | Provider does not do preventive care. This is a major gap for primary care. An internist who never bills preventive visits is either a hospitalist who slipped through the filter or a practice that does not invest in wellness. |
| **Screening & assessment** | 96127, 96160, G0444 | Provider does not screen for depression or health risks. Growing standard of care, but adoption varies. |
| **Immunizations** | 90471, 90686 | Provider does not vaccinate patients. Some practices refer all immunizations to pharmacies, but most IM practices administer vaccines. |
| **In-office diagnostics** | 36415, 81003, 93000 | No in-office labs, urinalysis, or ECG capability. Possible for small solo practices, but unusual for established IM groups. |
| **Care management** | 99490 | Provider does not bill structured chronic care management. This is the most legitimately variable category. Many practices have not adopted CCM billing, even though the service itself (managing chronic patients between visits) is standard IM work. Absence is not necessarily a quality signal. |

A provider missing entire categories is a stronger signal than a provider missing a single code.

**Key structural difference from procedural specialties:** In urology or dermatology, missing a procedural category (cystoscopy, skin surgery) is a major red flag. In internal medicine, every provider will cover the office visit category. The meaningful variation is in the non-visit categories: preventive care, screening, immunizations, and care management. These are the categories that separate a reactive sick-visit practice from a proactive primary care practice.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (the core metric)

Simple and defensible.

```
reference_set = [99214, 99213, G2211, 99215, 99396, 99397, 99395,
                 99204, G0439, 99203, G0438, 36415, 90471, 96127,
                 99386, 99387, 81003, 93000, 96160, 90686, 99211,
                 G0444, 99490, 99205, 99385]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum internal medicine practice. Billing pattern indistinguishable from peers. Provider invests in preventive care, screening, and care management. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do immunizations in-house, or has not adopted CCM billing. Common and often fine. |
| 50-69 (13-17 codes) | Missing significant parts of typical IM workflow. Investigate which categories are absent. Likely missing preventive or screening codes. |
| Below 50 (<13 codes) | Atypical practice. Could be a hospitalist miscoded as outpatient IM, a subspecialist with wrong taxonomy, or a very new practice. |


### Metric 2: Category Coverage

Code coverage counts individual codes. Category coverage counts whether the provider covers each of the six workflow categories.

```
categories = {
    'office_visits':           [99213, 99214, 99215, 99203, 99204, 99205, G2211, 99211],
    'preventive_wellness':     [99395, 99396, 99397, 99385, 99386, 99387, G0438, G0439],
    'screening_assessment':    [96127, 96160, G0444],
    'immunizations':           [90471, 90686],
    'inoffice_diagnostics':    [36415, 81003, 93000],
    'care_management':         [99490]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

A provider billing 20 of 25 codes but missing the entire preventive/wellness category (0 of 8 preventive codes) is a fundamentally different practice from a provider billing 20 of 25 codes with at least one code in every category. The first provider is not doing primary care preventive medicine. The second is.

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow internal medicine practice. Invests across all dimensions of primary care. |
| 5 of 6 | Missing one workflow area. Flag which one. Most commonly care management (99490 adoption is still growing). |
| 4 of 6 | Missing two areas. Investigate. If preventive/wellness is one of them, that is a significant gap for a primary care practice. |
| Below 4 | Not a standard general internal medicine practice pattern. Likely a hospitalist, subspecialist, or data quality issue. |


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

A provider who bills all 25 codes but has 80% of their volume in 99214 and 99213 (only office visits) with almost nothing in preventive visits, screening, or immunizations has a high code coverage but low volume concordance. They are doing a lot of sick visits and not enough of everything else. In internal medicine, the most common distortion is a provider skewed heavily toward E/M office visits with little preventive or wellness work, essentially functioning as reactive rather than proactive primary care.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical internal medicine codes." |
| 30% | Category Coverage | Catches providers who hit a good code count but are missing whole workflow areas, especially preventive care. |
| 30% | Volume Concordance | Catches providers who bill the right codes but in unusual proportions (e.g., 80% office visits, 1% preventive). |


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
| is_subspecialist | boolean | True if taxonomy is not 207R00000X (flags cardiology, GI, pulm, nephro, etc.) |
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort was used |
| peer_cohort_size | int | Number of peers in the cohort used for scoring |
| peer_cohort_state | string | State of the peer cohort (or "US" if national) |
| reference_set_size | int | Number of codes in the state-level reference set (may be <25 in small states) |
| total_services | int | Total claims for this NPI in measurement year |
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
| preventive_wellness_pct | float | % of total volume that is preventive/wellness visit codes |
| screening_assessment_pct | float | % of total volume that is screening & assessment codes |
| immunization_pct | float | % of total volume that is immunization codes |
| inoffice_diagnostic_pct | float | % of total volume that is in-office diagnostic codes |
| care_management_pct | float | % of total volume that is care management codes |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINES CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | Guidelines Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider follows diabetes management guidelines (HbA1c monitoring, foot exams) but never does preventive visits or depression screening | High (right workup per guidelines) | Low (missing preventive/wellness category, missing screening & assessment category) |
| Provider does annual wellness visits and full screening for every patient but does not follow evidence-based chronic disease management protocols | Moderate (strong on preventive, weak on disease-specific management) | High (billing pattern looks like a normal internist) |
| Provider does everything but at very different volume ratios (70% office visits, 2% preventive, 0% screening) | Could be high (they bill the right codes) | Low volume concordance (distribution does not match peers) |
| Provider bills all typical codes in typical ratios but is actually a hospitalist with taxonomy 207R00000X | N/A (hospitalist billing pattern should be caught by category gaps) | Low (missing preventive, immunizations, screening, possibly care management) |
| Provider does office visits and preventive care but no immunizations, no screening, no in-office diagnostics | Could be high (following guidelines for the conditions they treat) | Low (missing 3 of 6 categories, ~5 codes absent) |

The peer comparison is a sanity check. It does not say "this provider follows clinical guidelines." It says "this provider's practice looks like an internist's." If someone claims to be a general internist but their billing pattern looks nothing like one, that's worth investigating.

The five dimensions for internal medicine are:

1. **Guidelines Concordance** — does the provider follow evidence-based guidelines?
2. **Peer Comparison (this doc)** — does their billing look like a normal internist?
3. **Volume Adequacy** — for what they claim to do, is the volume believable?
4. **Payer Diversity** — is practice consistent across Medicare and Medicaid?
5. **Billing Quality** — are charges, code ratios, and E/M distribution normal?

Each catches things the others miss. A provider can score high on guidelines concordance (following evidence-based recommendations for the conditions they treat) but low on peer comparison (only doing sick visits, never preventive care). A provider can look normal on peer comparison (billing the same codes as everyone else) but have abnormal billing quality (unusual charge amounts or E/M distributions). The five scores together paint a complete picture.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a national average, not a clinical standard.** If most internists skip depression screening, the reference set still includes 96127 but with a low volume percentage. Peer comparison rewards conformity, not quality. That's why you need BOTH this score and the guidelines concordance score.

**E/M dominant means less code diversity than procedural specialties.** In urology, the 25 codes span office visits, cystoscopy, imaging, labs, and major surgery. In internal medicine, roughly half the reference set is E/M visit codes. This means small differences in the non-visit codes (preventive, screening, immunizations, care management) drive most of the score variation. A provider missing 3 preventive codes and 2 screening codes has a bigger impact on their peer comparison than it would in a specialty with more evenly distributed code types.

**Medicare-specific codes (G0438, G0439, G0444) will not appear in Medicaid data.** These are Medicare Annual Wellness Visit and Medicare depression screening codes. When scoring against Medicaid claims, these codes must be excluded from the reference set or flagged. A provider who only sees Medicaid patients will appear to lack preventive care when they may simply be using different billing codes.

**Hospitalist internists will look very different from outpatient internists.** A hospitalist (inpatient-only) internist may carry taxonomy 207R00000X but bills hospital visit codes (99221-99223, 99231-99233) instead of office visit codes. They will have zero preventive care, zero immunizations, zero screening. The 100-service minimum and outpatient code focus should filter most hospitalists out, but some may slip through. If a provider has zero codes in the preventive/wellness category AND zero codes in the immunizations category, flag them as a potential hospitalist.

**99490 (Chronic Care Management) adoption is still growing.** CMS introduced CCM billing in 2015, but many practices still have not set up the infrastructure to bill it (requires consent forms, documented time tracking, EHR integration). Absence of 99490 is not necessarily a quality signal. The care management category is the most legitimately variable of the six.

**NPs and PAs working in IM practices may bill under supervising physician or their own NPI.** When they bill under their own NPI, they typically have a different taxonomy code and will be excluded from the peer cohort. When they bill under the supervising physician's NPI, their volume inflates the physician's totals. This is a known limitation of NPI-level analysis.

**New practices will have incomplete code sets.** A provider in their first year may not have billed all 25 codes yet. Require a minimum of 12 months of claims data and >= 100 total Medicare services before scoring.

**The 25-code reference set should be rebuilt annually.** Codes change (G2211 was new in 2024). Medicare wellness visit codes may evolve. Screening code requirements shift with USPSTF updates. Rebuild the reference set from the latest claims data each year.

**Internal medicine cohorts are large.** Unlike urology (200-800 per state) or pediatrics, IM may have 1,000-5,000 providers per state. This is an advantage: large cohorts produce stable medians and reliable peer comparisons. When a state cohort is below 30 providers (unlikely for IM, but possible in very small states), fall back to national-level scoring and record `geo_group_level = "national"` in the output.


---

## Appendix: Reference Code Set by Category

Quick-reference for implementation.

### Office Visits (8 codes)
| Code | Description |
|---|---|
| 99213 | Office visit, established, low-moderate complexity |
| 99214 | Office visit, established, moderate complexity |
| 99215 | Office visit, established, high complexity |
| 99203 | New patient visit, low complexity |
| 99204 | New patient visit, moderate complexity |
| 99205 | New patient visit, high complexity |
| G2211 | Visit complexity add-on |
| 99211 | Office visit, minimal (nurse visit) |

### Preventive/Wellness Visits (8 codes)
| Code | Description |
|---|---|
| 99395 | Preventive visit, established, 18-39 |
| 99396 | Preventive visit, established, 40-64 |
| 99397 | Preventive visit, established, 65+ |
| 99385 | Preventive visit, new, 18-39 |
| 99386 | Preventive visit, new, 40-64 |
| 99387 | Preventive visit, new, 65+ |
| G0438 | Medicare annual wellness visit, initial |
| G0439 | Medicare annual wellness visit, subsequent |

### Screening & Assessment (3 codes)
| Code | Description |
|---|---|
| 96127 | Brief behavioral/emotional assessment (PHQ-2/PHQ-9) |
| 96160 | Patient-focused health risk assessment |
| G0444 | Annual depression screening (Medicare) |

### Immunizations (2 codes)
| Code | Description |
|---|---|
| 90471 | Immunization administration |
| 90686 | Influenza vaccine |

### In-Office Diagnostics (3 codes)
| Code | Description |
|---|---|
| 36415 | Venipuncture |
| 81003 | Urinalysis, automated |
| 93000 | ECG, 12-lead |

### Care Management (1 code)
| Code | Description |
|---|---|
| 99490 | Chronic care management, 20+ min/month |
