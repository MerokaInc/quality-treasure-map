# Gastroenterology Peer Comparison Score: A Sub-Treasure Map

## What This Document Does

The guideline concordance doc asks: "did this provider follow evidence-based gastroenterology guidelines?" This doc asks a different question: "does this provider's billing pattern look like a normal gastroenterologist's?"

We built a reference code set from the most prevalent codes in the GI peer cohort. Then we measure how much of that common practice set a provider covers. A gastroenterologist who bills 23 of 25 typical codes is practicing a full-spectrum GI workflow. A gastroenterologist who bills 9 of 25 is either highly subspecialized (e.g., hepatology-only) or missing large parts of standard care.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---
# PART A: WHAT WE HAVE

---

Same free CMS data as the guideline concordance doc:

1. **CMS Medicare Physician & Other Practitioners** -- NPI + HCPCS + service count + beneficiary count, 2018-2024. High GI volume. This is the primary data source because gastroenterology is Medicare-heavy (colonoscopy screening population skews 45+, liver disease and IBD management skew older).
2. **CMS Medicaid Provider Spending** -- NPI + HCPCS + service volume + beneficiary count. Lower GI volume than Medicare but captures younger IBD, Crohn's, and celiac patients.
3. **NPPES NPI Registry** -- provider identification, taxonomy code 207RG0100X (Internal Medicine, Gastroenterology), practice address.

The peer comparison approach needs nothing beyond HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. Note that GI is Medicare-heavy, so Medicare data is the primary source for peer cohort construction and volume calculations.

---
# PART B: BUILDING THE PEER COHORT
---

## 1. Defining "Peers"

A peer is any NPI that meets all of these criteria:

| Filter | Rule | Why |
|---|---|---|
| Taxonomy | 207RG0100X (Internal Medicine, Gastroenterology) | Excludes other internal medicine subspecialties, surgeons, NPs/PAs (different billing patterns) |
| State | Same state as the provider being scored | Practice patterns vary by state (Medicare Advantage penetration, screening colonoscopy rates, demographics) |
| Volume | >= 100 total Medicare services in the measurement year | Excludes inactive, retired, or very low-volume providers who would distort the reference set |
| Entity type | Individual (Type 1 NPI) | Excludes organizational NPIs |

For a large state like Florida or Texas, this should yield roughly 800-1,500 active gastroenterologists. For a small state like Wyoming or Vermont, the cohort may be 20-50.

### Geographic Grouping

Peer cohorts are built at the **state level** by default. A gastroenterologist in Florida should be compared to Florida peers, not to a national average.

| Level | How | When to Use |
|---|---|---|
| **State** (default) | `provider_state` from NPPES | Primary scoring. Each provider is ranked against peers in their state. |
| **National** (fallback) | All states combined | Fallback when state cohort is too small (<30 peers). Also useful for cross-state comparison. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA code from NPPES practice address | When state cohorts are large enough. Not implemented now, but the data supports it. |

Every score uses the peer cohort as its reference. Changing the geographic grouping changes the peer cohort, the reference code set, the peer medians, and the percentile ranks. The output should always record which geographic level was used.

The reference code set below is based on national data. When scoring at the state level, rebuild from the state-level peer cohort. The reference set size may vary by state (20-25 codes).

## 2. The Reference Code Set: What Normal GI Practice Looks Like

The top 25 codes account for approximately 65-70% of all GI billing volume. These define the "typical GI workflow."

| Rank | Code | Description | What It Tells You | % of Total Volume |
|---|---|---|---|---|
| 1 | 45378 | Colonoscopy, diagnostic | Provider performs diagnostic colonoscopies | 8% |
| 2 | 43239 | EGD with biopsy | Provider performs upper endoscopy with tissue sampling | 7% |
| 3 | 99214 | Office visit, moderate complexity | Bread-and-butter GI management visit | 7% |
| 4 | 45380 | Colonoscopy with biopsy | Provider takes tissue samples during colonoscopy (IBD surveillance, polyp evaluation) | 6% |
| 5 | 99213 | Office visit, low-moderate complexity | Routine follow-up visit | 5% |
| 6 | 45385 | Colonoscopy with polypectomy, snare | Provider removes polyps during colonoscopy (core cancer prevention) | 5% |
| 7 | 43235 | EGD, diagnostic | Provider performs diagnostic upper endoscopy without biopsy | 4% |
| 8 | 99215 | Office visit, high complexity | Complex GI management (IBD flares, liver disease, multi-system) | 4% |
| 9 | 99205 | New patient visit, high complexity | New complex GI referral | 3% |
| 10 | G2211 | Visit complexity add-on | Provider bills for longitudinal complexity (managing chronic GI conditions) | 3% |
| 11 | 88305 | Surgical pathology, gross & micro | Provider bills for pathology review of biopsy specimens | 3% |
| 12 | 45384 | Colonoscopy with hot biopsy removal | Provider performs tissue removal via hot forceps during colonoscopy | 2% |
| 13 | 43249 | EGD with dilation of esophagus | Provider dilates esophageal strictures (GERD, eosinophilic esophagitis) | 2% |
| 14 | 99204 | New patient visit, moderate complexity | Standard new GI referral | 2% |
| 15 | 74263 | CT colonography, screening | Provider orders or performs virtual colonoscopy | 1% |
| 16 | 91065 | Breath hydrogen/methane test | Provider performs SIBO or lactose intolerance breath testing in-office | 2% |
| 17 | 43248 | EGD with dilation, guide wire | Provider performs guide wire-assisted esophageal dilation | 1% |
| 18 | 45390 | Colonoscopy with removal, snare | Provider removes lesions during colonoscopy via snare technique | 1% |
| 19 | 87338 | H. pylori stool antigen | Provider tests for H. pylori infection (dyspepsia workup) | 2% |
| 20 | 76975 | GI endoscopic ultrasound | Provider performs EUS (advanced staging, pancreatic evaluation) | 1% |
| 21 | 43250 | EGD with removal, snare | Provider removes upper GI lesions via snare technique | 1% |
| 22 | 91200 | Liver elastography (FibroScan) | Provider performs in-office liver stiffness measurement (NAFLD/MASLD, hepatitis staging) | 1% |
| 23 | 86803 | Hepatitis C antibody | Provider screens for hepatitis C (CDC universal screening recommendation) | 1% |
| 24 | 99203 | New patient visit, low complexity | Straightforward new GI referral | 1% |
| 25 | 45381 | Colonoscopy with directed submucosal injection | Provider performs injection-assisted polypectomy during colonoscopy | 1% |

### What This Set Reveals

These 25 codes map to the six things a general gastroenterologist does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Colonoscopy** | 45378, 45380, 45384, 45385, 45390, 45381 | Provider does not perform colonoscopies (unusual for general GI -- may be purely cognitive/consultative) |
| **Upper Endoscopy (EGD)** | 43235, 43239, 43249, 43248, 43250 | Provider does not perform upper endoscopy (rare for GI unless purely hepatology-focused) |
| **E/M Visits** | 99213, 99214, 99215, 99204, 99205, 99203, G2211 | Provider does not see office patients (very unusual) |
| **Diagnostic Testing** | 91065, 87338, 91200 | Provider does not do breath tests, H. pylori testing, or liver elastography in-office |
| **Pathology/Lab** | 88305, 86803 | Provider does not bill for pathology or hepatitis screening (may be billed under lab NPI) |
| **Advanced Procedures** | 76975, 74263 | Provider does not do EUS or CT colonography (subspecialty -- not expected for all GI) |

A provider missing entire categories is a stronger signal than a provider missing a single code.


---
# PART C: BUSINESS LOGIC
---

## 3. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance.

### Metric 1: Code Coverage (the core metric)

```
reference_set = [45378, 43239, 99214, 45380, 99213, 45385, 43235,
                 99215, 99205, G2211, 88305, 45384, 43249, 99204,
                 74263, 91065, 43248, 45390, 87338, 76975, 43250,
                 91200, 86803, 99203, 45381]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 25 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 90-100 (23-25 codes) | Full-spectrum GI practice. Billing pattern indistinguishable from peers. |
| 70-89 (18-22 codes) | Broad practice with some gaps. May not do advanced procedures or in-office diagnostics. |
| 50-69 (13-17 codes) | Missing significant parts of typical GI workflow. Investigate which categories. |
| Below 50 (<13 codes) | Atypical practice pattern. Could be hepatology-focused, procedure-only, or a genuine outlier. |


### Metric 2: Category Coverage

```
categories = {
    'colonoscopy':          [45378, 45380, 45384, 45385, 45390, 45381],
    'upper_endoscopy':      [43235, 43239, 43249, 43248, 43250],
    'em_visits':            [99213, 99214, 99215, 99204, 99205, 99203, G2211],
    'diagnostic_testing':   [91065, 87338, 91200],
    'pathology_lab':        [88305, 86803],
    'advanced_procedures':  [76975, 74263]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow GI practice |
| 5 of 6 | Missing one workflow area. Flag which one. |
| 4 of 6 | Missing two areas. Investigate which ones. |
| 3 of 6 | Not a standard general GI practice pattern. |
| Below 3 | Atypical. Likely a subspecialist or incorrectly classified provider. |


### Metric 3: Volume Concordance

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

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.

| Volume Concordance | Interpretation |
|---|---|
| 80-100 | Volume distribution closely matches peers. |
| 60-79 | Some volume skew. Provider may lean procedural or cognitive. |
| 40-59 | Significant volume deviation from peers. |
| Below 40 | Highly atypical volume distribution. Investigate. |


## 4. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | The headline number. Easy to explain: "this provider covers X of 25 typical GI codes." |
| 30% | Category Coverage | Catches providers missing whole workflow areas (e.g., no procedures at all). |
| 30% | Volume Concordance | Catches providers billing the right codes in unusual proportions. |

### Worked Examples

**Example 1: Dr. Shah -- Full-Spectrum GI (Texas)**

- Codes matched: 22 of 25 (missing 76975, 74263, 45381)
- Code coverage: 22/25 * 100 = **88** | Categories: 5/6 (missing advanced procedures) = **83.3** | Volume concordance: **82**
- Composite: (88 * 0.40) + (83.3 * 0.30) + (82 * 0.30) = **84.8**
- Interpretation: Strong general GI. Missing advanced procedures is expected.

**Example 2: Dr. Patel -- Hepatology-Focused GI (California)**

- Codes matched: 10 of 25 (E/M codes + 91200, 86803, 87338, G2211 only)
- Code coverage: 10/25 * 100 = **40** | Categories: 3/6 (E/M, diagnostic testing, pathology/lab) = **50** | Volume concordance: **38**
- Composite: (40 * 0.40) + (50 * 0.30) + (38 * 0.30) = **42.4**
- Interpretation: Subspecialty signal, not a quality problem. Flag as hepatology-focused. Cross-reference taxonomy 207RI0011X.

**Example 3: Dr. Kim -- Procedure-Only GI (New York)**

- Codes matched: 13 of 25 (all colonoscopy + EGD codes, 88305)
- Code coverage: 13/25 * 100 = **52** | Categories: 3/6 (colonoscopy, EGD, pathology/lab) = **50** | Volume concordance: **30**
- Composite: (52 * 0.40) + (50 * 0.30) + (30 * 0.30) = **44.8**
- Interpretation: Procedure-only pattern. Practice arrangement signal -- most GI providers do both procedures and office visits.


### Subspecialist Handling

GI has recognized subspecialty patterns that produce lower peer comparison scores by design:

| Subspecialty Pattern | Expected Missing Categories | How to Flag |
|---|---|---|
| Hepatology-focused | Colonoscopy, Upper Endoscopy, Advanced Procedures | Check NPPES for taxonomy 207RI0011X (Hepatology). If absent, flag based on code mix. |
| Advanced endoscopist | E/M Visits, Diagnostic Testing | Check for high volume of 76975 (EUS), 43260-43278 (ERCP codes outside reference set). |
| Procedure-only (ASC-based) | E/M Visits, Diagnostic Testing, Pathology/Lab | Check if provider address is an ambulatory surgery center. |

Set `is_subspecialist = true` if taxonomy is not 207RG0100X or if the code pattern strongly suggests one of the above arrangements.

## 5. Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| provider_cbsa | string | Core-Based Statistical Area code (metro/micro area), derived from ZIP |
| taxonomy_code | string | From NPPES (expected: 207RG0100X) |
| is_subspecialist | boolean | True if taxonomy is not 207RG0100X or if code pattern indicates hepatology/advanced endoscopy |
| geo_group_level | string | "state", "national", or "zip3" -- which peer cohort was used |
| peer_cohort_size | int | Number of peers in the cohort used for scoring |
| peer_cohort_state | string | State of the peer cohort (or "US" if national) |
| reference_set_size | int | Number of codes in the state-level reference set (may be <25 in small states) |
| total_services | int | Total Medicare claims for this NPI in measurement year |
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
| colonoscopy_pct | float | % of total volume that is colonoscopy codes |
| upper_endoscopy_pct | float | % of total volume that is upper endoscopy codes |
| em_visit_pct | float | % of total volume that is E/M visit codes |
| diagnostic_testing_pct | float | % of total volume that is diagnostic testing codes |
| pathology_lab_pct | float | % of total volume that is pathology/lab codes |
| advanced_procedure_pct | float | % of total volume that is advanced procedure codes |

---
# PART D: WHAT THIS CATCHES THAT GUIDELINE CONCORDANCE MISSES
---

## 6. Why Both Scores Matter

| Scenario | Guideline Concordance Score | Peer Comparison Score |
|---|---|---|
| Provider does high-volume colonoscopies but no EGD or office visits | Could be high (colonoscopy technique may meet guidelines) | Low (missing E/M visits, upper endoscopy = big gap in coverage) |
| Provider does only E/M visits, no procedures at all | Could be moderate (may follow referral guidelines) | Low (missing colonoscopy and EGD categories = atypical GI pattern) |
| Provider bills all codes but at very different volume ratios than peers | Could be high (billing the right codes) | Low volume concordance (distribution does not match peers) |
| Provider is a hepatologist classified under general GI taxonomy | N/A (not scored against general GI guidelines) | Caught: low code/category coverage flags atypical pattern |

The peer comparison is a sanity check. It does not say "this provider follows ACG/AGA guidelines." It says "this provider's practice looks like a gastroenterologist's." If someone claims to be a general gastroenterologist but their billing pattern looks nothing like one, that is worth investigating.

---
# PART E: RISKS AND LIMITATIONS
---

## 7. Risks

**The reference set is a national average, not a clinical standard.** If most gastroenterologists over-scope patients, that pattern will be in the reference set. Peer comparison rewards conformity, not quality. That is why you need BOTH this score and the guideline concordance score.

**Hepatology-focused GI providers will score lower on procedural codes.** A gastroenterologist who primarily manages liver disease will not bill colonoscopy or EGD codes. The `is_subspecialist` flag handles this. Cross-reference taxonomy 207RI0011X (Hepatology) when available; otherwise detect hepatology focus from the code pattern (high E/M, high 91200/86803, zero procedural codes).

**Advanced procedures (EUS, ERCP) are subspecialty and not expected for all.** Missing the advanced procedures category is a minor signal, not a red flag.

**Pathology codes may be billed under the laboratory's NPI, not the GI provider.** 88305 and 86803 are frequently billed by pathology groups or reference labs, not the ordering gastroenterologist. Missing both pathology/lab codes is not necessarily a quality concern.

**New practices will have incomplete code sets.** Consider requiring >= 12 months of claims data and >= 100 total Medicare services before scoring.

**The 25-code reference set should be rebuilt annually.** Codes change over time. G2211 was new in 2024. New procedure codes get introduced (e.g., AI-assisted colonoscopy codes). Rebuild annually from the latest Medicare claims data.

**Volume concordance can be distorted by practice setting.** ASC-based providers will have procedure-heavy profiles. Multispecialty group providers may have E/M visits billed under the group NPI. The metric does not adjust for practice setting.

**Medicare-heavy data may miss younger patient populations.** GI conditions like Crohn's disease and celiac disease affect younger patients on commercial insurance or Medicaid. Supplement with Medicaid data where available.

---
## Appendix: Reference Code Set by Category

Quick-reference for implementation.

### Colonoscopy (6 codes)
| Code | Description |
|---|---|
| 45378 | Colonoscopy, diagnostic |
| 45380 | Colonoscopy with biopsy |
| 45384 | Colonoscopy with hot biopsy removal |
| 45385 | Colonoscopy with polypectomy, snare |
| 45390 | Colonoscopy with removal, snare |
| 45381 | Colonoscopy with directed submucosal injection |

### Upper Endoscopy / EGD (5 codes)
| Code | Description |
|---|---|
| 43235 | EGD, diagnostic |
| 43239 | EGD with biopsy |
| 43249 | EGD with dilation of esophagus |
| 43248 | EGD with dilation, guide wire |
| 43250 | EGD with removal, snare |

### E/M Visits (7 codes)
| Code | Description |
|---|---|
| 99213 | Office visit, low-moderate complexity |
| 99214 | Office visit, moderate complexity |
| 99215 | Office visit, high complexity |
| 99204 | New patient visit, moderate complexity |
| 99205 | New patient visit, high complexity |
| 99203 | New patient visit, low complexity |
| G2211 | Visit complexity add-on |

### Diagnostic Testing (3 codes)
| Code | Description |
|---|---|
| 91065 | Breath hydrogen/methane test |
| 87338 | H. pylori stool antigen |
| 91200 | Liver elastography (FibroScan) |

### Pathology/Lab (2 codes)
| Code | Description |
|---|---|
| 88305 | Surgical pathology, gross & micro |
| 86803 | Hepatitis C antibody |

### Advanced Procedures (2 codes)
| Code | Description |
|---|---|
| 76975 | GI endoscopic ultrasound |
| 74263 | CT colonography, screening |
