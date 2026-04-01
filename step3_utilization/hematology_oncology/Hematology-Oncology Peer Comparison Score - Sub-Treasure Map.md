# Hematology/Oncology Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The guideline concordance doc asks: "did this provider do what ASH and NCCN say they should?" This doc asks a different question: "does this provider's billing pattern look like a normal hematologist-oncologist's?"

We built a reference code set from the most prevalent codes in the hem/onc peer cohort. Then we measure how much of that common practice set a provider covers. A hematologist-oncologist who bills 22 of 25 typical codes is practicing a full-spectrum hem/onc workflow. A provider who bills 8 of 25 is either highly subspecialized or missing large parts of standard care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guideline concordance doc:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count. Primary data source for hem/onc (Medicare-heavy specialty).
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. Supplements Medicare for younger patients and dual-eligibles. No diagnosis codes, no Rx.
3. **NPPES NPI Registry** — provider identification, taxonomy code 207RH0003X (Hematology & Oncology), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207RH0003X (Hematology & Oncology) | Excludes hematology-only, radiation oncology, surgical oncology, NPs/PAs (different billing patterns) |
| State | Same state as the provider being scored | Practice patterns vary by state (payer mix, academic vs. community, formulary access, state Medicaid rules) |
| Volume | >= 50 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers. Threshold is lower than primary care because hem/onc has fewer providers per state. |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

For a large state like Texas or California, this should yield roughly 500-1,500 active hematologist-oncologists. Smaller states may have 30-100.


### Geographic Grouping

Peer cohorts are built at the **state level** by default. Practice patterns vary significantly by state because of differences in payer mix (some states have high Medicaid expansion populations), academic medical center concentration, 340B drug pricing participation, and community oncology vs. hospital-based practice ratios.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Secondary benchmark. Useful for cross-state comparison: "how does FL oncology compare to NY?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Urban academic centers vs. rural community oncology have very different patterns. |

Every score in this doc (code coverage, category coverage, volume concordance) uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, which changes the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set in Section 2 below is based on national data. When scoring at the state level, rebuild the reference set from the state-level peer cohort. If a code falls out of the top 25 in a given state, it drops from that state's reference set. The reference set size may vary by state (20-25 codes).


## 2. The Reference Code Set: What Normal Hem/Onc Practice Looks Like

We analyzed the most prevalent HCPCS codes billed by hematology/oncology practices nationally from CMS Medicare data. The top 25 codes account for approximately 65% of all hem/onc billing volume. These 25 codes define the "typical hematology/oncology workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 99215 | Office visit, established, high complexity | Complex cancer management visit — the bread-and-butter of oncology | 14% |
| 2 | 99214 | Office visit, established, moderate complexity | Follow-up visit, surveillance, stable disease management | 10% |
| 3 | 96413 | Chemo admin, IV infusion, first substance/first hour | Provider administers IV chemotherapy | 7% |
| 4 | 96415 | Chemo admin, IV infusion, each additional hour | Extended chemo infusions (many regimens run 2-4 hours) | 5% |
| 5 | G2211 | Visit complexity add-on (ongoing care coordination) | Longitudinal complexity — expected in oncology where every visit involves multi-system management | 5% |
| 6 | 96375 | Therapeutic/prophylactic/diagnostic injection, each additional sequential IV push | Additional IV push drugs (antiemetics, premeds) | 4% |
| 7 | 96365 | Therapeutic/prophylactic/diagnostic IV infusion, first hour | Non-chemo infusions: iron, biologics, supportive care drugs | 3% |
| 8 | 96372 | Therapeutic/prophylactic/diagnostic injection, SC or IM | Subcutaneous injections: growth factors (filgrastim, pegfilgrastim), denosumab, hormonal agents | 3% |
| 9 | 96417 | Chemo admin, IV infusion, each additional sequential substance | Multi-drug chemo regimens (FOLFOX, R-CHOP, etc.) | 3% |
| 10 | 96374 | Therapeutic/prophylactic/diagnostic injection, single IV push | IV push drugs: antiemetics (ondansetron), steroids (dexamethasone) | 2% |
| 11 | 96361 | Hydration IV infusion, each additional hour | Extended hydration with chemo (cisplatin protocols, etc.) | 2% |
| 12 | 96360 | Hydration IV infusion, initial 31 min to 1 hour | Pre/post-chemo hydration — standard supportive care | 2% |
| 13 | 99213 | Office visit, established, low-moderate complexity | Simpler follow-up: stable remission, routine labs review | 1% |
| 14 | 36415 | Venipuncture (routine blood draw) | In-office phlebotomy for labs — extremely common in oncology | 1% |
| 15 | 85025 | CBC with differential | Standard blood count before every chemo cycle — monitors neutropenia, anemia, thrombocytopenia | 1% |
| 16 | 80053 | Comprehensive metabolic panel | Monitors liver/kidney function during treatment — required before most chemo regimens | 1% |
| 17 | 96409 | Chemo admin, IV push, single substance | IV push chemo (some regimens: 5-FU bolus, vincristine) | 1% |
| 18 | 96411 | Chemo admin, IV push, each additional substance | Multi-agent IV push chemo | 1% |
| 19 | 96367 | Therapeutic IV infusion, each additional sequential substance | Additional non-chemo infusions (pre-meds, supportive agents) | 1% |
| 20 | 99205 | Office visit, new patient, high complexity | New cancer patient workup — initial consultation and treatment planning | 1% |
| 21 | 96366 | Therapeutic IV infusion, each additional hour | Extended non-chemo infusions (iron infusions, rituximab maintenance) | 1% |
| 22 | 38222 | Bone marrow biopsy | Diagnostic procedure for hematologic malignancies and staging | <1% |
| 23 | 36430 | Transfusion, blood or blood components | Blood product administration — anemia management in chemo patients | <1% |
| 24 | 99211 | Office visit, established, minimal complexity | Nurse-supervised infusion visits, brief check-ins | <1% |
| 25 | 96402 | Chemo admin, SC or IM, hormonal agent | Hormonal therapy injections (leuprolide, goserelin for prostate/breast cancer) | <1% |

Source: CMS Medicare Physician & Other Practitioners, national hem/onc cohort (taxonomy 207RH0003X), most recent available year.


### What This Set Reveals

These 25 codes are not random. They map to the six things a hematologist-oncologist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits (E/M)** | 99211, 99213, 99214, 99215, 99205, G2211 | Provider may not be managing patients longitudinally (unusual for hem/onc) |
| **Chemotherapy administration** | 96409, 96411, 96413, 96415, 96417, 96402 | Provider does not administer chemo (may be hematology-only or consultative practice) |
| **Non-chemo drug infusion/injection** | 96360, 96361, 96365, 96366, 96367, 96372, 96374, 96375 | Provider does not deliver supportive care drugs, hydration, or biologics in-office |
| **Laboratory** | 36415, 85025, 80053 | Provider does not perform in-office labs (sends to external lab — not uncommon but atypical for busy hem/onc) |
| **Procedures** | 38222, 36430 | Provider does not perform bone marrow biopsies or transfusions (refers out — more common in smaller practices) |
| **New patient evaluation** | 99205 | Provider does not see new patients (unusual — could indicate a winding-down practice) |

A provider missing entire categories is a stronger signal than a provider missing a single code.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (Weight: 40%)

```
reference_set = [99215, 99214, 96413, 96415, G2211, 96375, 96365,
                 96372, 96417, 96374, 96361, 96360, 99213, 36415,
                 85025, 80053, 96409, 96411, 96367, 99205, 96366,
                 38222, 36430, 99211, 96402]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum hem/onc practice. Billing pattern indistinguishable from peers. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do procedures or in-office labs. |
| 50-69 (13-17 codes) | Missing significant parts of typical hem/onc workflow. Investigate which categories. |
| Below 50 (<13 codes) | Atypical practice pattern. Could be subspecialized (hematology-only), consultative, or miscategorized. |


### Metric 2: Category Coverage (Weight: 30%)

Code coverage counts individual codes. Category coverage counts whether the provider covers each of the six workflow categories.

```
categories = {
    'office_visits':     [99211, 99213, 99214, 99215, 99205, G2211],
    'chemo_admin':       [96409, 96411, 96413, 96415, 96417, 96402],
    'drug_infusion':     [96360, 96361, 96365, 96366, 96367, 96372, 96374, 96375],
    'laboratory':        [36415, 85025, 80053],
    'procedures':        [38222, 36430],
    'new_patient_eval':  [99205]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow hem/onc practice |
| 5 of 6 | Missing one workflow area. Flag which one. |
| 4 of 6 | Missing two areas. May be subspecialized or have an unusual referral pattern. |
| Below 4 | Not a standard general hem/onc practice pattern. |

**Note:** `new_patient_eval` is a single-code category (99205). If a provider bills 99204 instead (moderate complexity new patient), they would miss this category. The state-level reference set rebuild may substitute 99204 for 99205 depending on local patterns. Both are valid new patient codes.


### Metric 3: Volume Concordance (Weight: 30%)

Code coverage says "does this provider bill this code?" Volume concordance says "does this provider bill it at a similar rate to peers?"

```
For each code in the reference_set:

    peer_median_rate = MEDIAN(
        total_services for this code / total_services for all codes
        across all NPIs in the peer cohort
    )

    provider_rate = total_services for this code / total_services for all codes
        for this NPI

    absolute_deviation = ABS(provider_rate - peer_median_rate)

mean_absolute_deviation = MEAN(absolute_deviation across all codes in reference_set)

volume_concordance = MAX(0, (1.0 - mean_absolute_deviation) * 100)
```

**Score:** `volume_concordance` (0-100 scale). A score of 100 means the provider's code mix perfectly matches the peer median rates. Deviations from the norm reduce the score.

| Volume Concordance | Interpretation |
|---|---|
| 85-100 | Code volume distribution closely matches peers. Normal practice. |
| 70-84 | Some codes billed at unusual rates. Could be panel mix or practice focus. |
| 50-69 | Significant deviation from peer volume norms. Some codes are much higher or lower than expected. |
| Below 50 | Very different from peers. Strong signal of subspecialization, unusual practice, or data issues. |


## 4. Composite Peer Comparison Score

```
peer_comparison_score = (code_coverage * 0.40) +
                        (category_coverage * 0.30) +
                        (volume_concordance * 0.30)
```

**Worked Example — Provider C (full-spectrum community oncologist in Ohio):**

```
Codes matched: 23 of 25 (missing 38222, 96402)
    code_coverage = 23/25 * 100 = 92.0

Categories covered: 5 of 6 (procedures category: has 36430 but 38222 counted, 
    actually 36430 IS in procedures → 5 of 6 since both 38222 missing but 36430 present → 
    procedures covered via 36430. Re-check: 38222 missing but 36430 present → category hit.
    Actually all 6 covered.)
    
    Corrected: 36430 present → procedures category covered. 99205 check → if present, 
    new_patient_eval covered. Let's say 99205 is present.
    category_coverage = 6/6 * 100 = 100.0

Volume concordance:
    Mean absolute deviation from peer medians = 0.08
    volume_concordance = (1.0 - 0.08) * 100 = 92.0

Composite = (92.0 * 0.40) + (100.0 * 0.30) + (92.0 * 0.30)
          = 36.8 + 30.0 + 27.6
          = 94.4

Provider C Peer Comparison Score: 94.4
```

**Worked Example — Provider D (hematology-focused, academic, Massachusetts):**

```
Codes matched: 14 of 25 (missing most chemo admin codes, missing hydration codes)
    code_coverage = 14/25 * 100 = 56.0

Categories covered: 4 of 6 (office_visits yes, chemo_admin no, drug_infusion partial yes,
    laboratory yes, procedures yes via 38222, new_patient_eval yes)
    category_coverage = 5/6 * 100 = 83.3

Volume concordance:
    Mean absolute deviation = 0.22 (E/M codes much higher than peer median, 
    chemo codes much lower)
    volume_concordance = (1.0 - 0.22) * 100 = 78.0

Composite = (56.0 * 0.40) + (83.3 * 0.30) + (78.0 * 0.30)
          = 22.4 + 25.0 + 23.4
          = 70.8

Provider D Peer Comparison Score: 70.8
(Subspecialist flag would explain the lower code coverage)
```


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## What Each Dimension Catches

| Dimension | What It Catches | What It Misses (Caught by Others) |
|---|---|---|
| **1. Guideline Concordance** | Whether supportive care and practice patterns align with ASH/NCCN | Whether the provider looks like a typical peer (this doc) |
| **2. Peer Comparison** (this doc) | Whether the provider's code set and volume match a normal hem/onc practice | Whether those codes represent guideline-concordant care (Dim 1), adequate volumes (Dim 3), or fair pricing (Dim 5) |
| **3. Volume Adequacy** | Whether trace billing in specific categories is a red flag | Whether the overall code set is comprehensive (this doc) |
| **4. Payer Diversity** | Whether practice patterns differ between Medicare and Medicaid | Whether the code set is clinically appropriate for either payer (this doc) |
| **5. Billing Quality** | Charge outliers, code ratio anomalies, E/M upcoding | Whether the clinical scope is appropriate (this doc) |


## Complementary Scenarios

**Scenario 1:** Provider scores 95 on Peer Comparison but 50 on Guideline Concordance. Their code set is comprehensive and volume distribution is normal, but they're low on supportive care measures. The peer comparison says "looks like everyone else" — the guideline score says "everyone else might also be underperforming on supportive care." Investigate cohort-level quality.

**Scenario 2:** Provider scores 55 on Peer Comparison but 80 on Guideline Concordance. They don't bill many of the reference codes (maybe no in-office labs, no procedures), but the codes they do bill show strong guideline alignment. This is a focused practice — possibly consultative or in a multi-provider group where procedures and labs are billed under a different NPI.

**Scenario 3:** Provider scores 90 on Peer Comparison but 30 on Volume Adequacy. Their code set looks right, but in several categories the absolute volume is suspiciously low (1-2 services). They may be billing codes to appear comprehensive without substantive practice in those areas.


---

# PART E: RISKS AND LIMITATIONS

---


## Data Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **Reference set based on national averages** | State-level variation may mean some nationally common codes are rare locally | State-level reference set rebuild. Document which codes dropped/added. |
| **No 340B adjustment** | 340B hospitals bill drug admin codes differently (may split billing, changing code mix) | 340B status detectable from HRSA database. Flag as context, not adjustment. |
| **Group practice billing** | In multi-provider groups, some codes may be billed under one NPI while another provides the service | No mitigation from claims alone. Score reflects billing NPI, not necessarily performing NPI. |
| **Code set evolves** | New codes added annually (e.g., biosimilar J-codes), old codes retired | Annual reference set rebuild from fresh CMS data. |


## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Academic vs. community** | Academic providers may have higher procedure rates and more new patient evaluations; community oncologists may have higher chemo volume | Peer cohort mixing within state. Future stratification possible. |
| **Solo vs. group practice** | Solo practitioners bill all codes under one NPI; group practices may split | No direct mitigation. Flag practice size from NPPES organizational affiliation. |
| **Urban vs. rural** | Rural oncologists may have broader scope (more procedures, more lab) while urban ones specialize | State-level cohort mitigates somewhat. Sub-state grouping in future. |


## Update Cadence

Reference code set, category definitions, and peer medians rebuilt annually as CMS releases new data. The top 25 codes for hem/onc are relatively stable year-over-year, but new drug administration codes, biosimilar codes, and coding guideline changes can shift the set.


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
| reference_set_size | integer | Number of codes in the state-level reference set (typically 20-25) |
| codes_matched | integer | Number of reference codes the provider bills |
| code_coverage_score | float | codes_matched / reference_set_size * 100 |
| categories_covered | integer | Number of workflow categories with at least one code billed (out of 6) |
| category_coverage_score | float | categories_covered / 6 * 100 |
| missing_categories | string[] | List of workflow category names not covered |
| volume_concordance_score | float | 0-100, based on mean absolute deviation from peer median rates |
| mean_absolute_deviation | float | Raw MAD value (lower = more concordant) |
| peer_comparison_score | float | Composite: (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30) |
| subspecialist_flag | string | "general_hemonc", "hematology_focused", "oncology_focused", or null |
| low_volume_excluded | boolean | True if provider has < 50 total Medicare services |
| data_completeness | string | "full", "medicare_only", "medicaid_only" |
| score_confidence_tier | string | Always "tier_2_proxy" for this version |
