# Urology Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The AUA guidelines concordance doc asks: "did this provider do what AUA says they should?" This doc asks a different question: "does this provider's billing pattern look like a normal urologist's?"

We built a reference code set from the most prevalent codes in the urology peer cohort. Then we measure how much of that common practice set a provider covers. A urologist who bills 24 of 25 typical codes is practicing a full-spectrum urologic workflow. A urologist who bills 8 of 25 is either a subspecialist, a very new practice, or missing large parts of standard care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the guidelines concordance doc:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. High urologic volume. No diagnosis codes, no Rx. This is the primary dataset for urology (unlike pediatrics, which relied on Medicaid).
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count. Low urologic volume relative to Medicare, but useful for payer diversity analysis.
3. **NPPES NPI Registry** — provider identification, taxonomy code 208800000X (Urology), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 208800000X (Urology, general) | Excludes subspecialists, non-urologic specialties, NPs/PAs (different billing patterns) |
| State | Same state as the provider being scored | Practice patterns vary by state (Medicare reimbursement, OR access, referral networks) |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort the reference set |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

Subspecialist taxonomies to flag and exclude from the general peer cohort:

| Taxonomy Code | Subspecialty |
|---|---|
| 2088P0231X | Urologic Oncology |
| 2088F0040X | Female Pelvic Medicine & Reconstructive Surgery |
| 2088P0210X | Pediatric Urology |

These subspecialists should be flagged in output but not scored against the general urology reference set. Their billing patterns are legitimately different.

For a typical state, this should yield roughly 200-800 active general urologists, depending on state population. Urology is a smaller specialty than pediatrics.


### Geographic Grouping

Peer cohorts are built at the **state level** by default. Practice patterns vary by state because of differences in Medicare coverage policies, available surgical facilities, referral patterns, and demographic mix (prostate cancer incidence varies by region). A urologist in Florida should be compared to Florida peers, not a national average.

The pipeline should support grouping by:

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** | All states combined | Secondary benchmark. Useful for cross-state comparison: "how does the FL urology workforce compare to TX?" |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Urban urologists with hospital/ASC access vs. rural office-only urologists have different procedure mixes. Not implemented now, but the data supports it. |

Every score in this doc (code coverage, category coverage, volume concordance) uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, which changes the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set in Section 2 below is based on national data. When scoring at the state level, rebuild the reference set from the state-level peer cohort. If a code falls out of the top 25 in a given state (e.g., a state where few urologists have robotic surgery access), it drops from that state's reference set. The reference set size may vary by state (20-25 codes).


## 2. The Reference Code Set: What Normal Urology Practice Looks Like

We analyzed the most prevalent HCPCS codes billed by urology practices nationally. The top 25 codes account for approximately 80% of all urologic billing volume. These 25 codes define the "typical urology workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 99214 | Office visit, established, moderate complexity | The dominant urology visit. Complex conditions requiring management decisions. | ~20% |
| 2 | 99213 | Office visit, established, low-moderate complexity | Simpler follow-ups, post-op checks, stable conditions | ~12% |
| 3 | 52000 | Cystoscopy, diagnostic | Bread-and-butter urology procedure. Hematuria eval, bladder cancer surveillance, LUTS workup. | ~7% |
| 4 | 99215 | Office visit, established, high complexity | Complex management: multi-system disease, cancer treatment decisions | ~5% |
| 5 | 84153 | PSA (prostate-specific antigen) | Prostate cancer screening and monitoring | ~4% |
| 6 | 81003 | Urinalysis, automated | Fundamental urology lab test. Nearly every visit. | ~4% |
| 7 | 99204 | New patient visit, moderate complexity | New patient evaluation for urologic complaints | ~3% |
| 8 | 76857 | Ultrasound, pelvic (non-OB) | Bladder/prostate imaging. BPH evaluation, post-void assessment. | ~3% |
| 9 | G2211 | Visit complexity add-on | Ongoing care coordination for chronic urologic conditions | ~3% |
| 10 | 51798 | Post-void residual measurement | BPH/LUTS evaluation. AUA guideline-recommended. | ~2.5% |
| 11 | 99203 | New patient visit, low complexity | Simpler new patient presentations | ~2% |
| 12 | 36415 | Venipuncture | Blood draws (PSA, creatinine, testosterone) | ~2% |
| 13 | 81001 | Urinalysis with microscopy | Detailed UA with microscopic exam. Hematuria, infection workup. | ~2% |
| 14 | 99205 | New patient visit, high complexity | Complex new evaluations: cancer staging, multi-system | ~1.5% |
| 15 | 55700 | Prostate biopsy, needle | Prostate cancer diagnosis. Transrectal or transperineal. | ~1.5% |
| 16 | 76770 | Ultrasound, renal, complete | Kidney imaging: hydronephrosis, masses, stones | ~1.5% |
| 17 | 52310 | Cystoscopy with stent removal | Ureteral stent management post-stone surgery | ~1% |
| 18 | 87086 | Urine culture | UTI diagnosis and management | ~1% |
| 19 | 52214 | Cystoscopy with fulguration | Treatment of small bladder lesions, cauterization | ~1% |
| 20 | 51741 | Cystometrogram (urodynamics) | OAB/incontinence evaluation | ~1% |
| 21 | 52281 | Cystoscopy with urethral dilation | Urethral stricture treatment | ~0.8% |
| 22 | 52234 | Cystoscopy with tumor treatment, small | Bladder tumor resection (TURBT, small) | ~0.7% |
| 23 | 52287 | Cystoscopy with chemodenervation | Botox injection for OAB | ~0.5% |
| 24 | 55866 | Laparoscopic prostatectomy (robotic) | Prostate cancer surgery | ~0.5% |
| 25 | 50590 | Lithotripsy (ESWL) | Kidney stone treatment, extracorporeal shockwave | ~0.5% |

Source: CMS Medicare Physician & Other Practitioners data, national urology claims analysis.


### What This Set Reveals

These 25 codes are not random. They map to the six things a general urologist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits** | 99213, 99214, 99215, 99203, 99204, 99205, G2211 | Provider may not do office-based urology (very unusual) |
| **Diagnostic cystoscopy** | 52000 | Provider does not scope patients (highly unusual for a urologist) |
| **In-office diagnostics** | 76857, 51798, 76770, 51741 | Provider does not do in-office imaging/testing (may refer all diagnostics out) |
| **Laboratory** | 84153, 81003, 81001, 87086, 36415 | Provider does not order/perform basic urologic labs (unusual) |
| **Therapeutic cystoscopy** | 52310, 52214, 52281, 52234, 52287 | Provider only diagnoses, does not treat via cystoscopy (could be a referral pattern) |
| **Major procedures** | 55700, 55866, 50590 | Office-based only, no biopsy or surgical capability (legitimate for some, but limits scope) |

A provider missing entire categories is a stronger signal than a provider missing a single code.

**Key structural difference from pediatrics:** Urology has six workflow categories instead of five. The split between diagnostic and therapeutic cystoscopy is important. A urologist who scopes but never treats is a different provider profile from one who does both. Similarly, major procedures (biopsy, robotic surgery, lithotripsy) are facility-dependent, so missing them is less concerning than missing office-based categories.


---

# PART C: BUSINESS LOGIC

---


## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.


### Metric 1: Code Coverage (the core metric)

Simple and defensible.

```
reference_set = [99214, 99213, 52000, 99215, 84153, 81003, 99204,
                 76857, G2211, 51798, 99203, 36415, 81001, 99205,
                 55700, 76770, 52310, 87086, 52214, 51741, 52281,
                 52234, 52287, 55866, 50590]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum urology practice. Billing pattern indistinguishable from peers. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do certain procedures or diagnostics. |
| 50-69 (13-17 codes) | Missing significant parts of typical urologic workflow. Investigate which categories. |
| Below 50 (<13 codes) | Atypical practice. Could be a subspecialist miscoded, a very new practice, or a genuine outlier. |


### Metric 2: Category Coverage

Code coverage counts individual codes. Category coverage counts whether the provider covers each of the six workflow categories.

```
categories = {
    'office_visits':          [99213, 99214, 99215, 99203, 99204, 99205, G2211],
    'diagnostic_cystoscopy':  [52000],
    'inoffice_diagnostics':   [76857, 51798, 76770, 51741],
    'laboratory':             [84153, 81003, 81001, 87086, 36415],
    'therapeutic_cystoscopy': [52310, 52214, 52281, 52234, 52287],
    'major_procedures':       [55700, 55866, 50590]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

A provider billing 20 of 25 codes but missing the entire therapeutic cystoscopy category (0 of 5 therapeutic codes) is a different story from a provider billing 20 of 25 codes with at least one code in every category.

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow urology practice |
| 5 of 6 | Missing one workflow area. Flag which one. Most commonly major procedures (facility-dependent). |
| 4 of 6 | Missing two areas. Investigate. Could be office-only or diagnostics-only. |
| Below 4 | Not a standard general urology practice pattern. |


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

A provider who bills all 25 codes but has 50% of their volume in 52000 (diagnostic cystoscopy) and almost nothing in office visits has a high code coverage but low volume concordance. They are doing a lot of one thing and not enough of others. In urology, the most common distortion is a provider skewed heavily toward one disease area (e.g., mostly stone procedures, or mostly prostate cancer) rather than the balanced mix of a general urologist.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical urology codes." |
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
| is_subspecialist | boolean | True if taxonomy is not 208800000X (flags urologic oncology, female pelvic medicine, pediatric urology) |
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
| diagnostic_cysto_pct | float | % of total volume that is diagnostic cystoscopy codes |
| inoffice_diagnostic_pct | float | % of total volume that is in-office diagnostic codes |
| laboratory_pct | float | % of total volume that is laboratory codes |
| therapeutic_cysto_pct | float | % of total volume that is therapeutic cystoscopy codes |
| major_procedure_pct | float | % of total volume that is major procedure codes |


---

# PART D: WHAT THIS CATCHES THAT GUIDELINES CONCORDANCE MISSES

---


## 6. Why Both Scores Matter

| Scenario | AUA Guidelines Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider follows AUA BPH guidelines (alpha-blockers, PVR measurement) but never does cystoscopy | High (right workup per AUA) | Low (missing diagnostic cystoscopy category, missing therapeutic cystoscopy category) |
| Provider does full cystoscopic evaluation and treatment but never orders PSA or basic labs | Moderate (strong on procedures, weak on screening/monitoring) | Low (missing laboratory category, missing 5 lab codes) |
| Provider does everything but at very different volume ratios (60% cystoscopy, 10% office visits) | Could be high (they bill the right codes) | Low volume concordance (distribution does not match peers) |
| Provider bills all typical codes in typical ratios but is a urologic oncology subspecialist | N/A (not scored against general urology guidelines) | Caught: subspecialist flag in output |
| Provider does office visits, labs, and diagnostics but no therapeutic procedures at all | Could be high (following guidelines for the patients they see) | Low (missing therapeutic cystoscopy and major procedures, 2 of 6 categories gone) |

The peer comparison is a sanity check. It does not say "this provider follows AUA guidelines." It says "this provider's practice looks like a urologist's." If someone claims to be a general urologist but their billing pattern looks nothing like one, that's worth investigating.

The five dimensions for urology are:

1. **AUA Guidelines Concordance** — does the provider follow AUA guidelines?
2. **Peer Comparison (this doc)** — does their billing look like a normal urologist?
3. **Volume Adequacy** — for what they claim to do, is the volume believable?
4. **Payer Diversity** — is practice consistent across Medicare and Medicaid?
5. **Billing Quality** — are charges, code ratios, and E/M distribution normal?

Each catches things the others miss. A provider can score high on guidelines concordance (following AUA recommendations for the conditions they treat) but low on peer comparison (only treating one condition). A provider can look normal on peer comparison (billing the same codes as everyone else) but have abnormal billing quality (unusual charge amounts or E/M distributions). The five scores together paint a complete picture.


---

# PART E: RISKS AND LIMITATIONS

---


## 7. Risks

**The reference set is a national average, not a clinical standard.** If most urologists do something wrong, it will be in the reference set. Peer comparison rewards conformity, not quality. That's why you need BOTH this score and the guidelines concordance score.

**Some codes have legitimate variation.** 55866 (robotic prostatectomy) depends on operating room access and credentialing, not quality. A community urologist without hospital-based robotic privileges will never bill it. 50590 (lithotripsy) depends on whether the practice has ESWL equipment or refers to a center. Missing these codes is not necessarily a quality signal.

**Subspecialists will score low.** A urologic oncologist will bill heavily in prostate biopsy, TURBT, and prostatectomy but may not bill routine office diagnostics or BPH codes. A female pelvic medicine specialist will bill urodynamics and Botox but not PSA or prostate biopsy. The `is_subspecialist` flag handles this. Only score providers with taxonomy 208800000X against this reference set.

**Volume concordance can be distorted by case mix.** A urologist with mostly stone patients will bill heavily in 50590, 52310, and 76770 but less in 84153 and 55700. A urologist with mostly prostate patients will show the opposite pattern. Both are legitimate general urologists. The metric does not adjust for disease-area mix (we do not have diagnosis codes to do so). Volume concordance catches extreme outliers, not moderate case-mix variation.

**New practices will have incomplete code sets.** A provider in their first year may not have billed all 25 codes yet. Require a minimum of 12 months of claims data and >= 100 total Medicare services before scoring.

**The 25-code reference set should be rebuilt annually.** Codes change (G2211 was new in 2024). New procedure codes emerge (transperineal biopsy coding, single-use cystoscope codes). Rebuild the reference set from the latest claims data each year.

**Urology cohorts are smaller than pediatrics.** Some states may have fewer than 50 general urologists. When a state cohort is below 30 providers, fall back to national-level scoring and record `geo_group_level = "national"` in the output. Small cohorts produce unreliable medians.


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

### Diagnostic Cystoscopy (1 code)
| Code | Description |
|---|---|
| 52000 | Cystoscopy, diagnostic |

### In-Office Diagnostics (4 codes)
| Code | Description |
|---|---|
| 76857 | Ultrasound, pelvic (non-OB) |
| 51798 | Post-void residual measurement |
| 76770 | Ultrasound, renal, complete |
| 51741 | Cystometrogram (urodynamics) |

### Laboratory (5 codes)
| Code | Description |
|---|---|
| 84153 | PSA (prostate-specific antigen) |
| 81003 | Urinalysis, automated |
| 81001 | Urinalysis with microscopy |
| 87086 | Urine culture |
| 36415 | Venipuncture |

### Therapeutic Cystoscopy (5 codes)
| Code | Description |
|---|---|
| 52310 | Cystoscopy with stent removal |
| 52214 | Cystoscopy with fulguration |
| 52281 | Cystoscopy with urethral dilation |
| 52234 | Cystoscopy with tumor treatment, small |
| 52287 | Cystoscopy with chemodenervation |

### Major Procedures (3 codes)
| Code | Description |
|---|---|
| 55700 | Prostate biopsy, needle |
| 55866 | Laparoscopic prostatectomy (robotic) |
| 50590 | Lithotripsy (ESWL) |
