# Dermatology Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The guidelines concordance doc asks: "did this provider do what clinical guidelines say they should?" This doc asks a different question: "does this provider's billing pattern look like a normal dermatologist's?"

We built a reference code set from the most prevalent codes in the dermatology peer cohort. Then we measure how much of that common practice set a provider covers. A dermatologist who bills 23 of 25 typical codes is practicing a full-spectrum dermatologic workflow. A dermatologist who bills 9 of 25 is either a subspecialist, a very new practice, or missing large parts of standard care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guidelines concordance doc:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. Dermatology is moderately Medicare-heavy because skin cancer (AK, BCC, SCC, melanoma) is concentrated in older adults. This is the primary dataset.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count. Lower dermatologic volume relative to Medicare, but contributes data on acne, eczema, and wart treatment in younger populations. Both payers are useful.
3. **NPPES NPI Registry** — provider identification, taxonomy code 207N00000X (Dermatology), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207N00000X (Dermatology, general) | Excludes subspecialists, non-dermatologic specialties, NPs/PAs (different billing patterns) |
| State | Same state as the provider being scored | Practice patterns vary by state (sun exposure, demographics, facility access, referral networks) |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort the reference set |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

Subspecialist taxonomies to flag and exclude from the general peer cohort:

| Taxonomy Code | Subspecialty |
|---|---|
| 207ND0101X | MOHS Surgery |
| 207ND0900X | Dermatopathology |
| 207NI0002X | Clinical & Laboratory Dermatological Immunology |
| 207NP0225X | Pediatric Dermatology |
| 207NS0135X | Procedural Dermatology |

These subspecialists should be flagged in output but not scored against the general dermatology reference set. Their billing patterns are legitimately different. A Mohs surgeon will bill heavily in Mohs-specific codes (17311-17315) and excision/repair codes but will not have the balanced E/M and destruction mix of a general dermatologist. A dermatopathologist may bill almost exclusively pathology codes.

For a typical state, this should yield roughly 200-1000 active general dermatologists, depending on state population. Dermatology is a moderate-size specialty, larger than urology in most states but smaller than internal medicine.


### Geographic Grouping

Peer cohorts are built at the **state level** by default. Practice patterns vary by state because of differences in sun exposure and latitude (Florida has far more actinic keratosis destruction than Minnesota), demographic mix, available procedural facilities, and referral patterns. A dermatologist in Arizona should be compared to Arizona peers, not a national average.

The pipeline should support grouping by:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Secondary benchmark. Useful for cross-state comparison: "how does the AZ dermatology workforce compare to WA?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Urban dermatologists with phototherapy suites and in-office pathology vs. rural office-only dermatologists have different procedure mixes. Not implemented now, but the data supports it. |

Every score in this doc (code coverage, category coverage, volume concordance) uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, which changes the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set in Section 2 below is based on national data. When scoring at the state level, rebuild the reference set from the state-level peer cohort. If a code falls out of the top 25 in a given state (e.g., a northern state where AK destruction volume is lower), it drops from that state's reference set. The reference set size may vary by state (20-25 codes).


## 2. The Reference Code Set: What Normal Dermatology Practice Looks Like

We analyzed the most prevalent HCPCS codes billed by dermatology practices nationally. The top 25 codes account for approximately 80% of all dermatologic billing volume. These 25 codes define the "typical dermatology workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 99214 | Office visit, established, moderate complexity | The dominant derm visit. Management decisions: biopsy results, treatment plans, chronic skin disease follow-up. | ~16% |
| 2 | 99213 | Office visit, established, low-moderate complexity | Simpler follow-ups: acne check, eczema stable, mole recheck | ~14% |
| 3 | 17000 | Destruction premalignant lesion, first | Actinic keratosis (AK) treatment. Cryotherapy with liquid nitrogen. Bread-and-butter dermatology in Medicare populations. | ~8% |
| 4 | 17003 | Destruction premalignant, each additional (2-14) | Multiple AKs treated same visit. High volume expected in Medicare panel. | ~6% |
| 5 | 11102 | Tangential biopsy (shave), single lesion | Skin biopsy for suspicious lesions. Gateway to skin cancer diagnosis. | ~5% |
| 6 | 11104 | Punch biopsy, single lesion | Deeper biopsy for inflammatory or deeper lesions | ~4% |
| 7 | 99203 | New patient visit, low complexity | New patient evaluation for skin concerns | ~3% |
| 8 | 99204 | New patient visit, moderate complexity | New patient with more complex presentation | ~3% |
| 9 | 11103 | Tangential biopsy, each additional | Multiple shave biopsies same visit | ~2.5% |
| 10 | G2211 | Visit complexity add-on | Ongoing management of chronic dermatologic conditions (psoriasis, eczema, skin cancer surveillance) | ~2.5% |
| 11 | 11105 | Punch biopsy, each additional | Multiple punch biopsies same visit | ~2% |
| 12 | 17110 | Destruction benign lesions (warts), up to 14 | Wart treatment. Common across all ages. | ~2% |
| 13 | 99215 | Office visit, established, high complexity | Complex management: cancer treatment decisions, severe inflammatory disease | ~2% |
| 14 | 11600 | Excision malignant lesion, trunk/arms/legs ≤0.5cm | Skin cancer excision (non-Mohs). BCC/SCC treatment. | ~1.5% |
| 15 | 17004 | Destruction premalignant, 15+ lesions | Heavy AK burden. Very common in sun-damaged Medicare patients. | ~1.5% |
| 16 | 88305 | Surgical pathology, level IV | Biopsy interpretation. Some dermatologists read their own pathology in-office. | ~1.5% |
| 17 | 11640 | Excision malignant lesion, face ≤0.5cm | Facial skin cancer excision | ~1% |
| 18 | 10060 | I&D abscess, simple | Abscess/cyst drainage. Basic procedural dermatology. | ~1% |
| 19 | 11400 | Excision benign lesion, trunk/arms/legs ≤0.5cm | Benign lesion removal (nevi, cysts, lipomas) | ~1% |
| 20 | 11900 | Intralesional injection, up to 7 lesions | Steroid injection for keloids, alopecia areata, cystic acne | ~1% |
| 21 | 12001 | Simple repair, ≤2.5cm | Wound closure after excision | ~0.8% |
| 22 | 99205 | New patient, high complexity | Complex new presentations | ~0.8% |
| 23 | 11440 | Excision benign lesion, face ≤0.5cm | Facial benign lesion removal | ~0.7% |
| 24 | 17111 | Destruction benign lesions (warts), 15+ | Heavy wart burden treatment | ~0.5% |
| 25 | 96910 | Phototherapy (photochemotherapy) | UV treatment for psoriasis, vitiligo, eczema | ~0.5% |

Source: CMS Medicare Physician & Other Practitioners data, national dermatology claims analysis.


### What This Set Reveals

These 25 codes are not random. They map to the six things a general dermatologist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits** | 99213, 99214, 99215, 99203, 99204, 99205, G2211 | Provider may not do office-based dermatology (very unusual) |
| **Biopsy** | 11102, 11103, 11104, 11105 | Provider does not biopsy suspicious lesions (major gap for skin cancer detection) |
| **Destruction** | 17000, 17003, 17004, 17110, 17111 | Provider does not treat premalignant lesions or warts in-office (missing core AK management) |
| **Excision** | 11600, 11640, 11400, 11440 | Provider does not excise lesions, refers all surgery out |
| **Minor procedures** | 10060, 11900, 12001 | No I&D, injection, or wound repair capability |
| **Pathology & phototherapy** | 88305, 96910 | Provider does not read own pathology or offer phototherapy (legitimate variation, see Risks) |

A provider missing entire categories is a stronger signal than a provider missing a single code.

**Key structural difference from urology:** Dermatology's workflow categories are organized around what happens to a lesion: see it (office visit), sample it (biopsy), destroy it (destruction), cut it out (excision), or handle the minor procedural follow-through (I&D, injection, repair). The sixth category (pathology and phototherapy) is the one where legitimate variation is highest. Not every dermatologist reads their own slides or has a phototherapy unit, and neither absence indicates a quality problem.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (the core metric)

Simple and defensible.

```
reference_set = [99214, 99213, 17000, 17003, 11102, 11104, 99203,
                 99204, 11103, G2211, 11105, 17110, 99215, 11600,
                 17004, 88305, 11640, 10060, 11400, 11900, 12001,
                 99205, 11440, 17111, 96910]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum dermatology practice. Billing pattern indistinguishable from peers. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do certain excisions or advanced destruction. |
| 50-69 (13-17 codes) | Missing significant parts of typical dermatologic workflow. Investigate which categories. |
| Below 50 (<13 codes) | Atypical practice. Could be a subspecialist miscoded, a very new practice, or a genuine outlier. |


### Metric 2: Category Coverage

Code coverage counts individual codes. Category coverage counts whether the provider covers each of the six workflow categories.

```
categories = {
    'office_visits':           [99213, 99214, 99215, 99203, 99204, 99205, G2211],
    'biopsy':                  [11102, 11103, 11104, 11105],
    'destruction':             [17000, 17003, 17004, 17110, 17111],
    'excision':                [11600, 11640, 11400, 11440],
    'minor_procedures':        [10060, 11900, 12001],
    'pathology_phototherapy':  [88305, 96910]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

A provider billing 20 of 25 codes but missing the entire biopsy category (0 of 4 biopsy codes) is a different story from a provider billing 20 of 25 codes with at least one code in every category. A dermatologist who never biopsies is missing the gateway to skin cancer diagnosis.

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow dermatology practice |
| 5 of 6 | Missing one workflow area. Flag which one. Most commonly pathology & phototherapy (equipment-dependent). |
| 4 of 6 | Missing two areas. Investigate. Could be medical-derm-only or very narrow procedural scope. |
| Below 4 | Not a standard general dermatology practice pattern. |


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

A provider who bills all 25 codes but has 40% of their volume in 17000/17003 (AK destruction) and almost nothing in office visits has a high code coverage but low volume concordance. They are doing a lot of one thing and not enough of others. In dermatology, the most common distortion is a provider skewed heavily toward one area (e.g., mostly AK destruction in a sun-belt retirement community, or mostly medical derm E/M with very few procedures) rather than the balanced mix of a general dermatologist.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical dermatology codes." |
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
| is_subspecialist | boolean | True if taxonomy is not 207N00000X (flags Mohs, dermatopathology, immunology, pediatric derm, procedural derm) |
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
| biopsy_pct | float | % of total volume that is biopsy codes |
| destruction_pct | float | % of total volume that is destruction codes |
| excision_pct | float | % of total volume that is excision codes |
| minor_procedure_pct | float | % of total volume that is minor procedure codes |
| pathology_phototherapy_pct | float | % of total volume that is pathology & phototherapy codes |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINES CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | Guidelines Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider follows skin cancer screening guidelines (biopsies suspicious lesions, follows up appropriately) but never does destruction or excision | High (right workup per guidelines) | Low (missing destruction and excision categories, 2 of 6 categories gone) |
| Provider does full procedural dermatology (AK destruction, excisions, biopsies) but never does an office visit above 99213 | Moderate (strong on procedures, weak on documented complexity) | Low (missing 99214, 99215, 99205 from reference set, volume distribution skewed away from peers) |
| Provider bills all typical codes but at very different volume ratios (45% AK destruction, 8% office visits) | Could be high (they bill the right codes) | Low volume concordance (distribution does not match peers) |
| Provider bills all typical codes in typical ratios but is actually a Mohs surgeon miscoded as general derm | N/A (not scored against general derm guidelines) | Caught: subspecialist flag in output |
| Provider does office visits, biopsies, and destruction but no excisions or minor procedures at all | Could be high (following guidelines for the patients they see) | Low (missing excision and minor procedures, 2 of 6 categories gone) |

The peer comparison is a sanity check. It does not say "this provider follows clinical guidelines." It says "this provider's practice looks like a dermatologist's." If someone claims to be a general dermatologist but their billing pattern looks nothing like one, that's worth investigating.

The five dimensions for dermatology are:

1. **Guidelines Concordance** — does the provider follow clinical guidelines for skin cancer screening, AK treatment, and chronic skin disease management?
2. **Peer Comparison (this doc)** — does their billing look like a normal dermatologist?
3. **Volume Adequacy** — for what they claim to do, is the volume believable?
4. **Payer Diversity** — is practice consistent across Medicare and Medicaid?
5. **Billing Quality** — are charges, code ratios, and E/M distribution normal?

Each catches things the others miss. A provider can score high on guidelines concordance (following evidence-based recommendations for the conditions they treat) but low on peer comparison (only treating one type of condition). A provider can look normal on peer comparison (billing the same codes as everyone else) but have abnormal billing quality (unusual charge amounts or E/M distributions). The five scores together paint a complete picture.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a national average, not a clinical standard.** If most dermatologists do something wrong, it will be in the reference set. Peer comparison rewards conformity, not quality. That's why you need BOTH this score and the guidelines concordance score.

**Some codes have legitimate variation.** 88305 (surgical pathology) depends on whether the dermatologist reads their own slides or sends them to an outside dermatopathologist. Either approach is clinically valid. 96910 (phototherapy) depends on whether the practice has phototherapy equipment. Many smaller practices refer phototherapy to academic centers. Missing these codes is not a quality signal.

**Subspecialists will score very low.** A Mohs surgeon will bill heavily in Mohs-specific codes (17311-17315), complex repair codes, and flap codes that do not appear in the general derm reference set at all, while missing office-visit and AK-destruction volume. A dermatopathologist will bill almost entirely pathology codes. The `is_subspecialist` flag handles this. Only score providers with taxonomy 207N00000X against this reference set.

**Volume concordance can be distorted by case mix.** A dermatologist in a sun-belt retirement community will have much heavier AK destruction volume (17000, 17003, 17004) than a dermatologist in an urban practice treating mostly younger patients with acne and eczema. Both are legitimate general dermatologists. The metric does not adjust for disease-area mix (we do not have diagnosis codes to do so). Volume concordance catches extreme outliers, not moderate case-mix variation.

**Cosmetic dermatology is invisible in CMS data.** Botox for cosmetic purposes, laser treatments, chemical peels, and fillers are not covered by Medicare or Medicaid. A dermatologist who spends 50% of their time on cosmetic procedures will appear to be a lower-volume general dermatologist in the CMS data. Their code coverage and volume concordance will reflect only the medical side of their practice. This is a data limitation, not a quality signal.

**New practices will have incomplete code sets.** A provider in their first year may not have billed all 25 codes yet. Require a minimum of 12 months of claims data and >= 100 total Medicare services before scoring.

**The 25-code reference set should be rebuilt annually.** Codes change (G2211 was new in 2024). Biopsy code families were restructured in recent years (the 11102-11107 series replaced older biopsy codes). New procedure codes emerge. Rebuild the reference set from the latest claims data each year.

**Dermatology cohorts vary significantly by state.** Sun-belt states (FL, AZ, TX, CA) will have larger cohorts and heavier AK/skin cancer volume. Northern states may have smaller cohorts and more medical-derm-weighted practices. When a state cohort is below 30 providers, fall back to national-level scoring and record `geo_group_level = "national"` in the output. Small cohorts produce unreliable medians.


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

### Biopsy (4 codes)
| Code | Description |
|---|---|
| 11102 | Tangential biopsy (shave), single lesion |
| 11103 | Tangential biopsy, each additional |
| 11104 | Punch biopsy, single lesion |
| 11105 | Punch biopsy, each additional |

### Destruction (5 codes)
| Code | Description |
|---|---|
| 17000 | Destruction premalignant lesion, first |
| 17003 | Destruction premalignant, each additional (2-14) |
| 17004 | Destruction premalignant, 15+ lesions |
| 17110 | Destruction benign lesions (warts), up to 14 |
| 17111 | Destruction benign lesions (warts), 15+ |

### Excision (4 codes)
| Code | Description |
|---|---|
| 11600 | Excision malignant lesion, trunk/arms/legs ≤0.5cm |
| 11640 | Excision malignant lesion, face ≤0.5cm |
| 11400 | Excision benign lesion, trunk/arms/legs ≤0.5cm |
| 11440 | Excision benign lesion, face ≤0.5cm |

### Minor Procedures (3 codes)
| Code | Description |
|---|---|
| 10060 | I&D abscess, simple |
| 11900 | Intralesional injection, up to 7 lesions |
| 12001 | Simple repair, ≤2.5cm |

### Pathology & Phototherapy (2 codes)
| Code | Description |
|---|---|
| 88305 | Surgical pathology, level IV |
| 96910 | Phototherapy (photochemotherapy) |
