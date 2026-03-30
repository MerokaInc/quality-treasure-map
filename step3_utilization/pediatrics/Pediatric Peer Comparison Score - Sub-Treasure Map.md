# Pediatric Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The guideline concordance doc asks: "did this provider do what AAP says they should?" This doc asks a different question: "does this provider's billing pattern look like a normal pediatrician's?"

We built a reference code set from the most prevalent codes in the pediatric peer cohort. Then we measure how much of that common practice set a provider covers. A pediatrician who bills 24 of 25 typical codes is practicing a full-spectrum pediatric workflow. A pediatrician who bills 8 of 25 is either highly specialized or missing large parts of standard care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guideline concordance doc:

1. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. High pediatric volume. No diagnosis codes, no Rx.
2. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count. Low pediatric volume but has more fields.
3. **NPPES NPI Registry** — provider identification, taxonomy code 208000000X (Pediatrics), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 208000000X (Pediatrics, general) | Excludes subspecialists, adult medicine, NPs/PAs (different billing patterns) |
| State | Same state as the provider being scored | Practice patterns vary by state (Medicaid rules, scope of practice, demographics) |
| Volume | >= 100 total Medicaid services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort the reference set |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

For Massachusetts, this should yield roughly 1,500-2,500 active general pediatricians.


### Geographic Grouping

Peer cohorts are built at the **state level** by default. Practice patterns vary significantly by state because of differences in Medicaid policy, scope-of-practice laws, demographic mix, and urban/rural distribution. A pediatrician in Massachusetts should be compared to Massachusetts peers, not to a national average.

The pipeline should support grouping by:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Secondary benchmark. Useful for cross-state comparison: "how does the MA pediatric workforce compare to TX?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Urban vs. rural pediatricians have different billing patterns (access to labs, specialists, etc.). Not implemented now, but the data supports it. |

Every score in this doc (code coverage, category coverage, volume concordance) uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, which changes the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set in Section 2 below is based on national data. When scoring at the state level, rebuild the reference set from the state-level peer cohort. If a code falls out of the top 25 in a given state (e.g., a state where few pediatricians do in-office rapid testing), it drops from that state's reference set. The reference set size may vary by state (20-25 codes).


## 2. The Reference Code Set: What Normal Pediatric Practice Looks Like

We analyzed the most prevalent HCPCS codes billed by pediatric practices nationally. The top 25 codes account for approximately 66% of all pediatric billing volume. These 25 codes define the "typical pediatric workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 90460 | Immunization admin, under 18, with counseling | Provider vaccinates and counsels on vaccines | 11% |
| 2 | 99213 | Office visit, established patient, low-moderate complexity | Bread-and-butter sick visit | 8% |
| 3 | 90461 | Immunization admin, each additional vaccine component | Provider gives multiple vaccines per visit (normal) | 8% |
| 4 | 99214 | Office visit, established patient, moderate complexity | More complex sick visit or management visit | 4% |
| 5 | 96127 | Brief emotional/behavioral assessment | Provider screens for depression, ADHD, autism, maternal depression | 4% |
| 6 | 96110 | Developmental screening (standardized instrument) | Provider performs ASQ, PEDS, or similar developmental screen | 3% |
| 7 | 99392 | Preventive visit, established, ages 1-4 | Well-child care for toddlers | 2% |
| 8 | 99173 | Visual acuity screening (Snellen chart or equivalent) | Provider performs basic vision screening | 2% |
| 9 | 99393 | Preventive visit, established, ages 5-11 | Well-child care for school-age kids | 2% |
| 10 | 99391 | Preventive visit, established, under 1 year | Well-child care for infants | 2% |
| 11 | 96160 | Patient-focused health risk assessment | Administers a health risk questionnaire (social determinants, safety) | 2% |
| 12 | 87880 | Strep rapid antigen test | Provider does in-office strep testing (common acute care) | 2% |
| 13 | 90686 | Influenza vaccine, quadrivalent, preservative-free | Provider gives flu shots | 1% |
| 14 | 36416 | Capillary blood collection (finger/heel stick) | Provider does point-of-care blood draws (lead, hemoglobin, glucose) | 2% |
| 15 | G2211 | Visit complexity add-on (ongoing care coordination) | Provider bills for longitudinal complexity (managing chronic conditions) | 2% |
| 16 | 99394 | Preventive visit, established, ages 12-17 | Well-child care for adolescents | 1% |
| 17 | 92551 | Hearing screening, pure tone | Provider performs audiometric screening | 2% |
| 18 | 90471 | Immunization administration (any age) | Alternate immunization admin code | 1% |
| 19 | 87804 | Influenza rapid test | Provider does in-office flu testing | 1% |
| 20 | 96161 | Caregiver-focused health risk assessment | Screens the parent/caregiver (maternal depression, family stress) | 1% |
| 21 | 99051 | Services outside regular office hours | Provider sees patients evenings/weekends | 1% |
| 22 | 85018 | Hemoglobin (blood count) | Provider screens for anemia (Bright Futures recommendation) | 1% |
| 23 | 99177 | Instrument-based vision screening, bilateral | Provider uses automated vision screening device (Spot, PlusOptix) | 1% |
| 24 | 90680 | Rotavirus vaccine | Provider administers rotavirus vaccine (infant schedule) | 1% |
| 25 | 90677 | Pneumococcal vaccine (PCV20) | Provider administers pneumococcal vaccine | 1% |

Source: PCC analysis of pediatric practice CPT volume, 2024. Consistent year-over-year.


### What This Set Reveals

These 25 codes are not random. They map to the five things a general pediatrician does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Sick visits** | 99213, 99214, G2211 | Provider may not see acute illness (unusual for general peds) |
| **Well-child visits** | 99391, 99392, 99393, 99394 | Provider is not doing preventive care across age groups |
| **Immunizations** | 90460, 90461, 90471, 90686, 90680, 90677 | Provider does not vaccinate (refers out or skips vaccines) |
| **Screening** | 96110, 96127, 99173, 99177, 92551, 96160, 96161, 85018 | Provider does not screen for developmental, behavioral, vision, hearing, or anemia issues |
| **Point-of-care testing** | 87880, 87804, 36416 | Provider does not do in-office rapid tests (sends everything to lab or skips) |

A provider missing entire categories is a stronger signal than a provider missing a single code.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (the core metric)

This is the score shown in the screenshot. Simple and defensible.

```
reference_set = [90460, 99213, 90461, 99214, 96127, 96110, 99392,
                 99173, 99393, 99391, 96160, 87880, 90686, 36416,
                 G2211, 99394, 92551, 90471, 87804, 96161, 99051,
                 85018, 99177, 90680, 90677]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum pediatric practice. Billing pattern indistinguishable from peers. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do certain screenings or point-of-care tests. |
| 50-69 (13-17 codes) | Missing significant parts of typical pediatric workflow. Investigate which categories. |
| Below 50 (<13 codes) | Atypical practice pattern. Could be a subspecialist miscoded, a very new practice, or a genuine outlier. |


### Metric 2: Category Coverage

Code coverage counts individual codes. Category coverage counts whether the provider covers each of the five workflow categories.

```
categories = {
    'sick_visits':     [99213, 99214, G2211],
    'well_child':      [99391, 99392, 99393, 99394],
    'immunizations':   [90460, 90461, 90471, 90686, 90680, 90677],
    'screening':       [96110, 96127, 99173, 99177, 92551, 96160, 96161, 85018],
    'poc_testing':     [87880, 87804, 36416]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 5 * 100
```

**Score:** `category_coverage` (0-100 scale).

A provider billing 20 of 25 codes but missing the entire screening category (0 of 8 screening codes) is a different story from a provider billing 20 of 25 codes with at least one code in every category.

| Categories Covered | Interpretation |
|---|---|
| 5 of 5 | Full-workflow pediatric practice |
| 4 of 5 | Missing one workflow area. Flag which one. |
| 3 of 5 | Missing two areas. Likely not practicing general peds or has an unusual setup. |
| Below 3 | Not a standard general pediatric practice pattern. |


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

A provider who bills all 25 codes but has 60% of their volume in 99213 (sick visits) and almost nothing in preventive codes has a high code coverage but low volume concordance. They are doing a lot of one thing and not enough of others.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical pediatric codes." |
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
| is_subspecialist | boolean | True if taxonomy is not 208000000X |
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
| categories_covered | int | Count of 5 workflow categories with any billing (0-5) |
| categories_missing_list | string | Names of missing categories |
| category_coverage_score | float | Metric 2 (0-100) |
| volume_concordance_score | float | Metric 3 (0-100) |
| peer_composite_score | float | Weighted composite (0-100) |
| sick_visit_pct | float | % of total volume that is sick visit codes |
| well_child_pct | float | % of total volume that is well-child codes |
| immunization_pct | float | % of total volume that is immunization codes |
| screening_pct | float | % of total volume that is screening codes |
| poc_testing_pct | float | % of total volume that is point-of-care testing codes |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINE CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | Guideline Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider does well-child visits and screens, but never vaccinates (refers all vaccines out) | High (screens + preventive visits = good) | Low (missing 6 immunization codes = big gap in coverage) |
| Provider vaccinates and does well-child visits, but never bills 96110 or 96127 (no screening) | Moderate (strong on visits + vaccines, 0 on screening) | Low (missing 8 screening codes) |
| Provider does everything but at very different volume ratios (80% sick visits, 5% preventive) | Could be high (they bill the right codes) | Low volume concordance (distribution does not match peers) |
| Provider bills all the typical codes in typical ratios but is a pediatric subspecialist | N/A (not scored against general peds guidelines) | Caught: subspecialist flag in output |

The peer comparison is a sanity check. It does not say "this provider follows AAP guidelines." It says "this provider's practice looks like a pediatrician's." If someone claims to be a general pediatrician but their billing pattern looks nothing like one, that's worth investigating.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a national average, not a clinical standard.** If most pediatricians do something wrong, it will be in the reference set. Peer comparison rewards conformity, not quality. That's why you need BOTH this score and the guideline concordance score.

**Some codes have legitimate variation.** 99051 (after-hours services) depends on practice model, not quality. 87880 (strep test) depends on whether the practice does in-office labs or refers out. A provider missing these codes is not necessarily worse.

**Subspecialists will score low.** A pediatric cardiologist will only bill a small subset of the reference codes. The `is_subspecialist` flag handles this. Only score providers with taxonomy 208000000X.

**Volume concordance can be gamed or distorted by panel composition.** A provider with a mostly adolescent panel will bill more 99394 and less 99391 than a provider with an infant-heavy panel. The metric does not adjust for panel age mix (we do not have patient-level data to do so).

**New practices will have incomplete code sets.** A provider in their first year may not have billed all 25 codes yet. Consider requiring a minimum of 12 months of claims data and >= 100 total services before scoring.

**The 25-code reference set should be rebuilt periodically.** Codes change (G2211 was new in 2024). Vaccine product codes shift (PCV20 replacing PCV13). Rebuild the reference set annually from the latest claims data.


---

## Appendix: Reference Code Set by Category

Quick-reference for implementation.

### Sick Visits (3 codes)
| Code | Description |
|---|---|
| 99213 | Office visit, established, low-moderate complexity |
| 99214 | Office visit, established, moderate complexity |
| G2211 | Visit complexity add-on |

### Well-Child Visits (4 codes)
| Code | Description |
|---|---|
| 99391 | Preventive visit, established, under 1 year |
| 99392 | Preventive visit, established, ages 1-4 |
| 99393 | Preventive visit, established, ages 5-11 |
| 99394 | Preventive visit, established, ages 12-17 |

### Immunizations (6 codes)
| Code | Description |
|---|---|
| 90460 | Immunization admin, under 18, with counseling |
| 90461 | Immunization admin, each additional component |
| 90471 | Immunization admin (any age) |
| 90686 | Influenza vaccine (quadrivalent) |
| 90680 | Rotavirus vaccine |
| 90677 | Pneumococcal vaccine (PCV20) |

### Screening (8 codes)
| Code | Description |
|---|---|
| 96110 | Developmental screening |
| 96127 | Behavioral/emotional assessment |
| 99173 | Visual acuity screening |
| 99177 | Instrument-based vision screening |
| 92551 | Hearing screening, pure tone |
| 96160 | Patient-focused health risk assessment |
| 96161 | Caregiver-focused health risk assessment |
| 85018 | Hemoglobin (anemia screening) |

### Point-of-Care Testing (3 codes)
| Code | Description |
|---|---|
| 87880 | Strep rapid antigen test |
| 87804 | Influenza rapid test |
| 36416 | Capillary blood collection (finger/heel stick) |
