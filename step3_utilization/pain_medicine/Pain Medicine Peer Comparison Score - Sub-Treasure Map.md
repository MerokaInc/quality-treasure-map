# Pain Medicine Peer Comparison Score: A Sub-Treasure Map


## What This Document Does

The guideline concordance doc asks: "did this provider follow clinical guidelines for pain management?" This doc asks a different question: **"does this provider's billing pattern look like a normal pain medicine practitioner's?"**

We built a reference code set from the most prevalent codes billed by pain medicine providers nationally. Then we measure how much of that common practice set a given provider covers. A pain medicine provider who bills 23 of 28 typical codes with volume ratios that match peers is practicing a recognizable pain medicine workflow. A provider who bills 9 of 28, or who bills only injection drug codes and nothing else, warrants investigation.

This is peer-normalized. The standard is not a guideline. The standard is what peers actually do.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other scoring dimensions:

1. **CMS Medicare Physician & Other Practitioners** (MUP_PHY_R25_P05_V20_D23_Prov_Svc.csv) -- NPI + HCPCS + service count + beneficiary count + charges + allowed amounts. **This is the primary data source for pain medicine.** Pain medicine is overwhelmingly a Medicare-age specialty (chronic pain prevalence peaks in 50-80 age range). 3.06 GB, 9.66M rows, covers all provider types nationally.
2. **CMS Medicaid Provider Spending** (medicaid-provider-spending.parquet) -- NPI + HCPCS + service volume + beneficiary count. Secondary source. Pain medicine Medicaid volume exists but is lower than Medicare volume (unlike pediatrics, where Medicaid is primary).
3. **NPPES NPI Registry** -- provider identification, taxonomy codes, practice address. Used for cohort filtering and geographic grouping.
4. **Pain Provider Roster** (pain_roster_MA_active.csv, pain_provider_roster.csv) -- Pre-filtered rosters of pain-relevant providers with taxonomy codes and combined service volumes.

The peer comparison approach needs only HCPCS code volumes per NPI. No diagnosis codes required. No Rx data required. This method works entirely within the constraints of the free data.


### How Pain Medicine Differs from Pediatrics: Data Source Priority

| Factor | Pediatrics | Pain Medicine |
|---|---|---|
| Primary payer | Medicaid (children) | Medicare (older adults with chronic pain) |
| Primary CMS data source | Medicaid Provider Spending | Medicare Physician & Other Practitioners |
| Secondary data source | Medicare (low volume) | Medicaid (moderate volume) |
| Procedure vs. E/M mix | Mostly E/M + vaccines + screening | Heavy procedure volume (injections, nerve blocks, imaging guidance) |
| Drug codes (J-codes) | Minimal | Significant (dexamethasone, triamcinolone, contrast media, botox) |

**This inversion matters.** The Medicare file has more fields (charges, allowed amounts, standardized amounts) that are unavailable in the Medicaid file. Pain medicine scoring can leverage charge-based analysis that was not available for pediatrics.


---

# PART B: BUILDING THE PEER COHORT

---


## 1. Defining "Peers" -- The Behavioral Filter Approach

### Why Pain Medicine Cannot Use a Single Taxonomy Code

Pediatrics had one clean taxonomy code: `208000000X`. Every provider under that code is a general pediatrician. Simple.

Pain medicine has four relevant taxonomy codes, and none of them cleanly isolate "pain medicine providers":

| Taxonomy Code | Description | National Count | MA Active Count | Problem |
|---|---|---|---|---|
| `2084P0800X` | Psychiatry & Neurology - Pain Medicine | 12,448 | 1,035 | **Parent specialty is psychiatry/neurology.** Many providers under this code practice primarily psychiatry with a pain subspecialty credential. Their billing includes psychotherapy (90833, 90836, 90837), psychiatric evaluations (90792), hospital rounding (99232), and nursing facility care (99308/99309) -- none of which reflect pain medicine practice. Including all of them contaminates the peer cohort with psychiatric billing patterns. |
| `2081P2900X` | Physical Medicine & Rehabilitation - Pain Medicine | TBD | TBD | PM&R physicians who subspecialize in pain. Their code mix may include rehabilitation services alongside pain procedures. Included as a dedicated pain subspecialty code. |
| `208VP0014X` | Pain Medicine - Interventional | 2,185 | 22 | Clean pain taxonomy but rare. Only 22 active in MA. |
| `208VP0000X` | Pain Medicine | 2,131 | 9 | Clean pain taxonomy but very rare. Only 9 active in MA. |

**The taxonomy code requires careful filtering for pain medicine.** Some taxonomy codes (e.g., 2084P0800X) include providers who practice primarily psychiatry/neurology with a pain credential. Behavioral filtering ensures the peer cohort reflects actual pain medicine practice.


### The Solution: Behavioral Cohort Definition

A provider belongs in the pain medicine peer cohort if their **billing behavior** looks like a pain medicine provider, regardless of what their taxonomy code says.

**Step 1: Start with the broad candidate pool.**

Include any NPI with taxonomy code in:
- `2084P0800X` (Psychiatry & Neurology - Pain Medicine)
- `208VP0014X` (Pain Medicine - Interventional)
- `208VP0000X` (Pain Medicine)
- `2081P2900X` (PM&R - Pain Medicine)

**Step 2: Apply the behavioral filter.**

A candidate NPI qualifies for the pain medicine peer cohort if they meet **all** of the following:

| Filter | Rule | Why |
|---|---|---|
| **Pain procedure volume** | >= 50 annual services in core pain procedure codes (see Section 1a below) | Proves the provider actually performs pain medicine procedures at meaningful volume. A psychiatrist who happens to have a pain credential but bills zero procedures is not a pain peer. |
| **Pain procedure ratio** | >= 10% of total Medicare services are core pain procedure codes | Prevents including high-volume generalists who do a few pain procedures on the side. If 90% of your billing is psychotherapy and 10% is nerve blocks, your billing pattern is not a useful pain peer. |
| **Entity type** | Individual (Type 1 NPI) | Excludes organizational NPIs |
| **Volume floor** | >= 50 total Medicare services in the measurement year | Excludes inactive or very-low-volume providers. Lower than the pediatrics threshold (100) because pain medicine has smaller cohorts. **See Part B, Section 3 for why this is 50 not 100.** |

**Step 3: Geographic grouping (see Section 2).**


### Section 1a: Core Pain Procedure Code Set (Behavioral Filter)

These are the codes used to determine whether a provider is "practicing pain medicine." They are NOT the full reference code set for scoring (that's in Part C). They are the gatekeeping codes for cohort membership.

| Category | Codes | What They Prove |
|---|---|---|
| **Epidural/intrathecal injections** | 62320, 62321, 62322, 62323 | Provider performs spinal injections |
| **Transforaminal epidural steroid injections** | 64479, 64480, 64483, 64484 | Provider performs image-guided nerve root injections |
| **Facet joint injections** | 64490, 64491, 64492, 64493, 64494, 64495 | Provider performs facet joint procedures |
| **Radiofrequency ablation (RFA)** | 64633, 64634, 64635, 64636 | Provider destroys nerve tissue for pain relief |
| **Sacroiliac joint injection** | 27096 | Provider treats SI joint pain |
| **Joint injections/aspirations** | 20605, 20606, 20610, 20611 | Provider performs peripheral joint procedures |
| **Peripheral nerve blocks** | 64400, 64405, 64415, 64445, 64447, 64450 | Provider performs diagnostic/therapeutic nerve blocks |
| **Spinal cord stimulator** | 63650, 63685 | Provider implants/manages neuromodulation devices |
| **Fluoroscopic guidance** | 77002, 77003 | Provider uses imaging guidance for procedures (almost always accompanies interventional pain work) |

**Validation from CMS data:** We tested this behavioral filter against the national Medicare dataset:

| Group | Medicare Providers Found | Qualify for Pain Cohort | Rate |
|---|---|---|---|
| Pure pain taxonomy (208VP*) | 3,123 | 1,466 (interventional) + 759 (mixed) | 47% clearly interventional |
| PM&R - Pain Medicine (2081P2900X) | TBD | TBD | TBD |
| Psych/Neuro Pain (2084P0800X) | ~17,600 | TBD -- requires same filter | Expected low qualification rate |

PM&R - Pain Medicine and Psych/Neuro Pain qualification rates need to be computed from CMS data.


### What About Non-Interventional Pain Providers?

**This is an important limitation.** The behavioral filter above is biased toward interventional pain medicine. A provider who practices pain medicine exclusively through medication management, behavioral therapy, or non-procedural approaches will fail the procedure volume threshold and be excluded from the peer cohort.

From the CMS data: **898 of 3,123 pure pain taxonomy providers (29%) bill zero interventional codes.** These are real pain medicine providers whose practice is non-interventional.

**Current approach:** Non-interventional pain providers are excluded from the peer cohort for this scoring dimension. They cannot be reliably distinguished from psychiatrists, neurologists, or PM&R physicians who happen to hold a pain credential but don't practice pain medicine.

**Future improvement:** If a reliable non-interventional pain procedure set can be defined (e.g., specific E/M patterns + drug screening + specific J-codes that together signal non-interventional pain practice rather than general psychiatry/neurology), a second peer sub-cohort could be created. This is a research task, not a v1 implementation task.

**Impact on scoring:** Providers who are genuinely non-interventional pain practitioners will score low on this dimension. The composite score across all five dimensions should account for this -- the guideline concordance and billing quality dimensions can still score non-interventional providers fairly.


## 2. Geographic Grouping: National Primary, State Secondary

### Why Pain Medicine Inverts the Pediatrics Model

Pediatrics uses state-level cohorts as the primary benchmark (1,500-2,500 pediatricians per state) with national as a fallback. Pain medicine **must flip this** because the state-level cohorts are too small for reliable percentile scoring.

Massachusetts numbers after behavioral filtering (estimated):

| Taxonomy | MA Active | Est. After Behavioral Filter |
|---|---|---|
| Pain taxonomies (208VP* + 2084P0800X) | 1,066 | ~200-350 (based on national 30-47% qualification rate) |
| PM&R - Pain Medicine (2081P2900X) | TBD | TBD |
| **Total MA pain cohort** | **1,952** | **~290-440** |

290-440 is workable for a single combined cohort but breaks down if you try to split by practice type or sub-region. And that's Massachusetts -- smaller states will be far worse.

**Primary/secondary scoring model:**

| Level | Role | How It Works |
|---|---|---|
| **National** (primary) | Defensible benchmark | All percentile scores, percentile ranks, and peer medians are computed against the national pain cohort. This is the score that goes in the output. |
| **State (MA)** (secondary) | Local context label | MA rank is computed and shown as a supplementary label: "Ranked 45th of 312 pain providers in MA." Employers see both. The state rank adds local market context without pretending it's a robust percentile. |

Every output row records which cohort level produced each score. The national score is the primary score. The state rank is informational.


## 3. Volume Threshold and Cohort Size Adjustments

### Lower Volume Floor (50 vs. 100)

Pediatrics used >= 100 Medicaid services as the minimum volume threshold. Pain medicine uses **>= 50 Medicare services** for two reasons:

1. **Smaller specialty.** A 100-service floor on a specialty with 290-440 MA providers could drop 20-30% of the cohort below scoring threshold. With national pooling this is less severe, but consistency matters.
2. **Different service mix.** A pain provider doing 50 interventional procedures (epidurals, nerve blocks, RFA) in a year represents meaningful clinical activity. These are not high-frequency services like pediatric office visits. 50 interventional pain procedures might represent 200+ patient encounters (multiple procedure codes per visit).

**Document this threshold change explicitly in every output.** It affects confidence tier labeling.


### Cohort Size Warning Flag

Any percentile rank derived from a cohort under 30 providers gets a `thin_cohort` flag in the output:

```
IF peer_cohort_size < 30:
    thin_cohort = TRUE
    confidence_note = "Percentile rank based on <30 peers. Interpret as approximate rank order, not robust percentile."
ELSE:
    thin_cohort = FALSE
    confidence_note = NULL
```

This applies to:
- State-level ranks (likely to trigger for smaller states)
- Any sub-cohort analysis (e.g., interventional-only within a state)

The flag is not hidden. It appears in the output schema and in any employer-facing report. ERISA documentation includes it.


---

# PART C: THE REFERENCE CODE SET AND SCORING

---


## 4. The Reference Code Set: What Normal Pain Medicine Practice Looks Like

Built from CMS Medicare Physician & Other Practitioners data for providers with pain medicine taxonomy codes (`208VP0014X`, `208VP0000X`). The top 28 codes account for approximately 68% of total billing volume across 3,123 providers nationally.

**Important:** The reference set below is drawn from pure pain taxonomy providers only (not anesthesiology crossovers). This is intentional -- the reference set should reflect what pain medicine practice looks like, not what anesthesiology-trained pain providers bill (which may include residual anesthesiology codes).

| Rank | Code | Description | % Volume | % Providers | Category |
|---|---|---|---|---|---|
| 1 | 99214 | Office visit, established, moderate complexity | 9.8% | 78.8% | Office visits |
| 2 | 99213 | Office visit, established, low-moderate complexity | 6.2% | 72.7% | Office visits |
| 3 | J1100 | Injection, dexamethasone sodium phosphate, 1 mg | 10.7% | 29.1% | Injection drugs |
| 4 | J3301 | Injection, triamcinolone acetonide, 10 mg | 6.9% | 26.2% | Injection drugs |
| 5 | Q9966 | Low osmolar contrast material, 200-299 mg/ml | 4.1% | 11.2% | Imaging supplies |
| 6 | 80307 | Drug testing, chemistry analyzers | 2.2% | 20.6% | Drug screening |
| 7 | 64483 | Transforaminal epidural injection, lumbar, single level | 1.5% | 51.6% | Spinal injections |
| 8 | 99204 | New patient office visit, 45-59 min | 1.4% | 63.8% | Office visits |
| 9 | 62323 | Lumbar epidural injection with imaging guidance | 1.1% | 45.6% | Spinal injections |
| 10 | 64493 | Facet joint injection, lumbar, single level, with imaging | 1.1% | 52.8% | Facet procedures |
| 11 | 64494 | Facet joint injection, lumbar, second level, with imaging | 1.0% | 50.7% | Facet procedures |
| 12 | 20610 | Large joint injection/aspiration | 0.9% | 43.0% | Joint injections |
| 13 | Q9967 | Low osmolar contrast material, 300-399 mg/ml | 1.9% | 6.4% | Imaging supplies |
| 14 | J0702 | Injection, betamethasone, 3mg/3mg | 0.8% | 7.0% | Injection drugs |
| 15 | J1030 | Injection, methylprednisolone acetate, 40 mg | 0.7% | 16.2% | Injection drugs |
| 16 | 27096 | SI joint injection with imaging guidance | 0.7% | 44.7% | Joint injections |
| 17 | 64636 | RFA lumbar facet, each additional level | 0.7% | 42.7% | Radiofrequency ablation |
| 18 | 64484 | Transforaminal epidural injection, lumbar, additional level | 0.7% | 36.0% | Spinal injections |
| 19 | 64635 | RFA lumbar facet, single level | 0.7% | 44.8% | Radiofrequency ablation |
| 20 | 80305 | Drug testing, direct observation | 0.6% | 11.6% | Drug screening |
| 21 | 77002 | Fluoroscopic guidance for needle placement | 0.6% | 29.1% | Imaging guidance |
| 22 | 99215 | Office visit, established, high complexity | 1.0% | 11.6% | Office visits |
| 23 | 99212 | Office visit, established, low complexity | 0.8% | 6.0% | Office visits |
| 24 | 96372 | Therapeutic injection, subcutaneous/intramuscular | 0.4% | 3.3% | Injection admin |
| 25 | 99442 | Telephone E/M, 11-20 min | 0.4% | 3.7% | Telehealth/phone |
| 26 | G2211 | Visit complexity add-on (care coordination) | 0.4% | est. | Office visits |
| 27 | 99203 | New patient office visit, 30-44 min | 0.3% | est. | Office visits |
| 28 | 64490 | Facet joint injection, cervical/thoracic, single level | 0.3% | est. | Facet procedures |

Source: CMS Medicare Physician & Other Practitioners, 2023 data year, filtered to taxonomy codes 208VP0014X and 208VP0000X. Volumes are aggregate national.


### Codes Excluded from the Reference Set (and Why)

Several high-volume codes were deliberately excluded:

| Code | Volume | Why Excluded |
|---|---|---|
| J0585 (onabotulinumtoxinA/Botox) | 6.3% of volume | Billed by only 1.7% of providers. Extremely concentrated -- a handful of high-volume Botox practices dominate. Including it would penalize the 98% of pain providers who don't administer Botox. |
| K1034 (COVID test provision) | 2.0% | Temporary pandemic code, not clinical pain practice. |
| J0717 (certolizumab pegol) | 2.2% | Billed by 1 provider nationally. Extreme outlier, not representative. |
| J7328, J7320, J7329 (hyaluronan/viscosupplementation) | 4.0% combined | Billed by <1% of providers each. These are orthopedic/rheumatologic procedures done by a very small number of pain practices. |
| J3300 (triamcinolone, preservative-free) | 2.5% | Billed by only 1.1% of providers. Variant of J3301 which is already in the set. |
| 99232, 99231, 99233 (hospital subsequent care) | Combined ~3% | Hospital rounding codes. Present because the 2084P0800X taxonomy includes neurologists and psychiatrists who round. Not core outpatient pain practice. |
| 90833, 90836, 90837, 90834 (psychotherapy) | Present in broad cohort | Psychiatric billing contamination from the 2084P0800X taxonomy. Excluded from the pure pain reference set. |
| J2704 (propofol) | 0.8% | Sedation drug, billed by only 1.6% of providers doing sedation-based procedures. Not a universal pain practice pattern. |

**Decision rule for inclusion:** A code makes the reference set if it appears in the top 40 by volume AND is billed by >= 3% of providers (with exceptions for clinically essential codes billed by many providers at lower volume). Codes concentrated in <2% of providers represent niche practices, not "normal pain medicine."


### What This Set Reveals

These 28 codes map to six workflow categories that define what a pain medicine provider does:

| Workflow Category | Codes in Reference Set | What It Means If Missing |
|---|---|---|
| **Office visits** | 99212, 99213, 99214, 99215, 99204, 99203, G2211, 99442 | Provider may not see patients in an office setting (unusual for outpatient pain) |
| **Spinal injections** | 64483, 64484, 62323, 64490 | Provider does not perform the most common interventional pain procedures |
| **Facet procedures** | 64493, 64494, 64635, 64636 | Provider does not treat facet-mediated pain (a core pain medicine domain) |
| **Joint injections** | 20610, 27096 | Provider does not perform peripheral or SI joint procedures |
| **Drug screening** | 80307, 80305 | Provider does not monitor patients for controlled substance compliance -- a significant red flag in pain medicine |
| **Injection drugs and imaging** | J1100, J3301, J0702, J1030, Q9966, Q9967, 77002, 96372 | Provider does not bill for the drugs and imaging supplies that accompany procedures (suggests procedures may not be happening or billing is incomplete) |


### Pain-Specific Observation: Drug Screening as a Quality Signal

In pediatrics, the reference set categories (sick visits, well-child, immunizations, screening, point-of-care testing) are all clinically positive activities. Missing a category means missing a type of care.

In pain medicine, **drug screening (80307, 80305) carries a different weight.** Pain management providers prescribing opioids or other controlled substances are expected to perform urine drug testing as part of standard-of-care monitoring. A pain provider with significant E/M volume and zero drug screening codes is either:

1. Not prescribing controlled substances (possible but unusual for pain medicine)
2. Not monitoring patients on controlled substances (a compliance and quality concern)
3. Sending all drug testing to an external lab (the codes wouldn't appear under their NPI)

Interpretation 3 is common and legitimate. This is a limitation -- we can only see what's billed under the provider's NPI. Drug screening absence is a flag worth investigating, not a definitive quality failure.


---

## 5. Defining Interventional vs. Non-Interventional Practice Type

### Why This Section Exists

The user's direction is to define the interventional/non-interventional split **behaviorally, not by taxonomy.** A provider with taxonomy `208VP0000X` (Pain Medicine, general) could be either. A provider with `208VP0014X` (Pain Medicine, Interventional) should be interventional by definition but might have shifted practice. The taxonomy label is a credential, not a practice description.

### Classification Logic

```
core_interventional_codes = {
    62320, 62321, 62322, 62323,       -- epidural/intrathecal
    64479, 64480, 64483, 64484,       -- transforaminal epidural
    64490, 64491, 64492,              -- facet injection cervical/thoracic
    64493, 64494, 64495,              -- facet injection lumbar
    64633, 64634, 64635, 64636,       -- radiofrequency ablation
    27096,                             -- SI joint injection
    20605, 20606, 20610, 20611,       -- joint injection/aspiration
    63650, 63685,                      -- spinal cord stimulator
    77002, 77003                       -- fluoroscopic guidance
}

interventional_volume = SUM(services) for codes IN core_interventional_codes
total_volume = SUM(services) for all codes

IF interventional_volume >= 50 AND (interventional_volume / total_volume) >= 0.10:
    practice_type = "interventional"
ELIF interventional_volume == 0:
    practice_type = "non_interventional"
ELSE:
    practice_type = "mixed"
```

### National Distribution (from CMS Medicare data, pure pain taxonomy providers)

| Practice Type | Count | % of Total | Billing Characteristics |
|---|---|---|---|
| Interventional | 1,466 | 47% | High procedure volume, significant J-code and imaging supply billing, drug screening present |
| Non-interventional | 898 | 29% | E/M visits dominant, may include psychotherapy codes, medication management focus |
| Mixed | 759 | 24% | Some procedures but below the interventional threshold -- may be transitioning, part-time, or early-career |

### How Practice Type Affects Scoring

**For v1, all practice types are scored against the same reference set and peer cohort.** The practice type is recorded in the output as a label, not as a filter.

**Why not separate cohorts now?**

1. Splitting an already-small cohort (especially at state level) creates groups too thin for percentile scoring.
2. The reference code set already captures the full spectrum -- a non-interventional provider will naturally score lower on code coverage for procedural categories, which is an accurate reflection of their practice pattern.
3. The `practice_type` label in the output lets downstream consumers filter or adjust interpretation without requiring separate scoring runs.

**Future state:** When the national cohort is large enough (likely is already for national scoring), separate reference sets for interventional and non-interventional practice could be built. This would make the peer comparison more meaningful for non-interventional providers. This is a v2 enhancement.


---

# PART D: SCORING LOGIC

---


## 6. Scoring a Provider Against the Peer Set

For a given NPI, we compute three metrics: code coverage, category coverage, and volume concordance. The formulas are identical to the pediatrics model. Only the reference set and categories change.


### Metric 1: Code Coverage (weight: 40%)

```
reference_set = [99214, 99213, J1100, J3301, Q9966, 80307, 64483,
                 99204, 62323, 64493, 64494, 20610, Q9967, J0702,
                 J1030, 27096, 64636, 64484, 64635, 80305, 77002,
                 99215, 99212, 96372, 99442, G2211, 99203, 64490]

codes_billed_by_provider = SET of HCPCS codes WHERE total_services > 0
    for this NPI in the measurement year

codes_matched = codes_billed_by_provider INTERSECT reference_set

code_coverage = COUNT(codes_matched) / 28 * 100
```

**Score:** `code_coverage` directly (0-100 scale).

| Code Coverage | Interpretation |
|---|---|
| 85-100 (24-28 codes) | Full-spectrum pain medicine practice. Billing pattern consistent with peers. |
| 65-84 (18-23 codes) | Broad practice with some gaps. May not perform certain procedure types or may refer out some work. |
| 45-64 (13-17 codes) | Missing significant parts of typical pain workflow. Investigate which categories are absent. |
| Below 45 (<13 codes) | Atypical practice pattern. Could be non-interventional, a subspecialist (e.g., neuromodulation-only), a very new practice, or a genuine outlier. Cross-reference with `practice_type` field. |


### Metric 2: Category Coverage (weight: 30%)

```
categories = {
    'office_visits':      [99212, 99213, 99214, 99215, 99204, 99203, G2211, 99442],
    'spinal_injections':  [64483, 64484, 62323, 64490],
    'facet_procedures':   [64493, 64494, 64635, 64636],
    'joint_injections':   [20610, 27096],
    'drug_screening':     [80307, 80305],
    'injection_drugs_imaging': [J1100, J3301, J0702, J1030, Q9966, Q9967, 77002, 96372]
}

categories_covered = COUNT of category keys WHERE
    ANY code in that category has total_services > 0

category_coverage = categories_covered / 6 * 100
```

**Score:** `category_coverage` (0-100 scale).

| Categories Covered | Interpretation |
|---|---|
| 6 of 6 | Full-workflow pain medicine practice |
| 5 of 6 | Missing one workflow area. Flag which one. |
| 4 of 6 | Missing two areas. May be non-interventional (missing spinal + facet) or may have an unusual setup. |
| 3 or below | Not a standard pain medicine practice pattern. Cross-reference `practice_type`. |

**Pain-specific note:** A non-interventional pain provider will typically cover 3-4 of 6 categories (office visits, drug screening, possibly injection drugs for trigger point injections or joint injections). Scoring 3-4/6 for a non-interventional provider is expected, not alarming. The `practice_type` field in the output provides this context.


### Metric 3: Volume Concordance (weight: 30%)

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

A provider who bills all 28 codes but has 70% of volume in J1100 (dexamethasone injections) and near-zero in office visits has high code coverage but low volume concordance. They are billing the right codes in unusual proportions.

**Score:** `volume_concordance` (0-100). Higher = more similar to peer distribution.

**Pain-specific note on volume concordance:** Pain medicine volume ratios are more variable than pediatrics. A provider running a high-volume epidural clinic will have a very different code distribution from a provider doing mostly office-based medication management with occasional trigger point injections. Volume concordance will be noisier for pain medicine than for pediatrics. The 30% weight (same as pediatrics) may need to be reduced to 20% after initial data analysis if the variance is too high. Document this as a calibration decision for v2.


## 7. Composite Peer Score

```
peer_composite = (code_coverage * 0.40) + (category_coverage * 0.30) + (volume_concordance * 0.30)
```

| Weight | Metric | Why This Weight |
|---|---|---|
| 40% | Code Coverage | Headline metric. "This provider covers X of 28 typical pain medicine codes." Transparent, defensible, easy to explain. |
| 30% | Category Coverage | Catches providers who hit a good code count but are missing whole workflow areas (e.g., zero drug screening, zero facet procedures). |
| 30% | Volume Concordance | Catches providers who bill the right codes but at unusual volumes (e.g., 80% injection drugs, minimal E/M). |


## 8. Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| taxonomy_code | string | From NPPES |
| taxonomy_description | string | Human-readable taxonomy |
| practice_type | string | "interventional", "non_interventional", or "mixed" (behavioral classification) |
| cohort_inclusion_method | string | "pain_taxonomy" or "anesthesiology_behavioral_filter" -- how this NPI entered the cohort |
| geo_group_level | string | "national" (primary) or "state" (secondary context) |
| national_cohort_size | int | Number of providers in the national peer cohort |
| state_cohort_size | int | Number of providers in the state peer cohort |
| thin_cohort | boolean | TRUE if the cohort used for scoring has < 30 providers |
| confidence_note | string | NULL if thin_cohort is FALSE; explanatory text if TRUE |
| volume_threshold_used | int | The minimum service count used (50 for pain medicine) |
| total_services | int | Total Medicare services for this NPI in measurement year |
| total_beneficiaries | int | Estimated unique patients |
| interventional_volume | int | Services in core interventional pain codes |
| interventional_ratio | float | interventional_volume / total_services |
| reference_set_size | int | Number of codes in the reference set used (28 nationally; may vary by state rebuild) |
| codes_in_reference_set | int | Count of reference codes this NPI billed (0-28) |
| codes_matched_list | string | Comma-separated list of matched codes |
| codes_missing_list | string | Comma-separated list of unmatched codes |
| code_coverage_score | float | Metric 1 (0-100) |
| categories_covered | int | Count of 6 workflow categories with any billing (0-6) |
| categories_missing_list | string | Names of missing categories |
| category_coverage_score | float | Metric 2 (0-100) |
| volume_concordance_score | float | Metric 3 (0-100) |
| peer_composite_score | float | Weighted composite (0-100) -- national benchmark |
| state_rank | int | Rank within state cohort (NULL if state cohort < 10) |
| state_rank_of | int | Total providers in state cohort used for ranking |
| office_visit_pct | float | % of total volume in office visit codes |
| spinal_injection_pct | float | % of total volume in spinal injection codes |
| facet_procedure_pct | float | % of total volume in facet procedure codes |
| joint_injection_pct | float | % of total volume in joint injection codes |
| drug_screening_pct | float | % of total volume in drug screening codes |
| injection_drugs_imaging_pct | float | % of total volume in injection drugs + imaging codes |


---

# PART E: HOW THIS FITS WITH THE OTHER SCORES

---


## 9. Why Both Peer Comparison and Guideline Concordance Matter

| Scenario | Guideline Score | Peer Comparison Score |
|---|---|---|
| Provider follows pain guidelines but only does epidurals (no facet, no joint, no RFA) | Could be high (doing what they do well) | Low (missing 3-4 workflow categories) |
| Provider bills all typical codes in typical ratios but doesn't do drug screening | May miss guideline on monitoring | Low category coverage (drug screening category = 0) |
| Provider does everything but 80% of volume is injection drug codes (J1100, J3301) and minimal E/M | Could be moderate | Low volume concordance (distribution skewed away from peers) |
| Anesthesiologist doing part-time pain and part-time OR anesthesiology | N/A if excluded from pain cohort | Caught: behavioral filter may exclude, or low coverage if included |
| Non-interventional pain provider (medication management only) | Could score well on med management guidelines | Low on procedural categories -- but `practice_type = non_interventional` explains it |

The peer comparison is a sanity check. It does not say "this provider follows pain management guidelines." It says "this provider's billing pattern looks like a pain medicine provider's." If someone is in the pain medicine cohort but their billing looks nothing like one, that's worth investigating.


---

# PART F: RISKS AND LIMITATIONS

---


## 10. Risks

**The behavioral filter excludes non-interventional pain providers.** This is the biggest known limitation. A provider who practices pain medicine exclusively through medication management, physical therapy referrals, and behavioral approaches will not meet the procedure volume threshold. They will either be excluded from the cohort entirely or, if included via taxonomy alone, will score poorly on procedural categories. The `practice_type` label mitigates interpretation risk but does not solve the underlying coverage gap.

**The reference set is biased toward Medicare-age pain practice.** Pain medicine for younger populations (e.g., sports injuries, post-surgical pain in working-age adults) may look different. Medicaid pain practice is underrepresented in the reference set because Medicare is the primary data source.

**Drug code volume (J-codes) inflates some providers' total service counts.** A single epidural injection visit generates multiple line items: the procedure code (64483), the drug code (J1100 or J3301), the imaging supply code (Q9966), and possibly the guidance code (77002). This is correct billing but means a provider doing 100 epidurals generates 300-400 total services. Volume concordance partially accounts for this (it measures ratios, not absolutes) but the reference set's volume percentages reflect this multi-code-per-visit reality.

**Fluoroscopic guidance (77002/77003) is migrating.** CMS has been transitioning from separately billable fluoroscopy codes to bundled procedure codes. The reference set should be rebuilt annually to capture this shift. A provider who performs image-guided procedures but doesn't separately bill 77002 is not doing anything wrong -- the code may be bundled into the procedure payment.

**Small state cohorts make state-level ranks unreliable.** The `thin_cohort` flag handles this at the data level. At the interpretation level: a state rank of "3rd of 12" is not meaningfully different from "7th of 12." Do not treat state ranks from thin cohorts as quality signals. They are market context only.

**Subspecialists within pain medicine will score lower.** A provider who exclusively does spinal cord stimulator implants (63650/63685) has a narrow but highly specialized practice. They will score low on code coverage and category coverage because they don't do the breadth of typical pain practice. This is a practice choice, not a quality deficiency. The output schema includes `practice_type` and `codes_matched_list` to support manual review of apparent outliers.

**Taxonomy misclassification is endemic in pain medicine.** Unlike pediatrics (where nearly all general pediatricians use 208000000X), pain medicine providers are scattered across four taxonomy codes with many providers in the wrong category. The behavioral filter addresses this but is imperfect -- it catches interventional providers reliably but may miss medication-management-focused providers.

**The 10% interventional ratio threshold is a judgment call.** At 10%, a provider doing 500 total services needs only 50 pain procedures to qualify. This could include providers for whom pain is a sideline, not a primary practice. At 20%, the cohort shrinks and may exclude legitimate pain providers who also do general anesthesiology or neurology. The 10% threshold was chosen based on the anesthesiology qualification rate (10.4% of anesthesiologists qualify, which matches the known fellowship-trained ratio). Monitor this threshold against false positive/negative rates after initial scoring.


---

## Appendix A: Reference Code Set by Category

Quick-reference for implementation.

### Office Visits (8 codes)
| Code | Description |
|---|---|
| 99212 | Established patient, low complexity |
| 99213 | Established patient, low-moderate complexity |
| 99214 | Established patient, moderate complexity |
| 99215 | Established patient, high complexity |
| 99203 | New patient, 30-44 min |
| 99204 | New patient, 45-59 min |
| G2211 | Visit complexity add-on |
| 99442 | Telephone E/M, 11-20 min |

### Spinal Injections (4 codes)
| Code | Description |
|---|---|
| 62323 | Lumbar epidural injection with imaging guidance |
| 64483 | Transforaminal epidural, lumbar, single level |
| 64484 | Transforaminal epidural, lumbar, additional level |
| 64490 | Facet injection, cervical/thoracic, single level |

### Facet Procedures (4 codes)
| Code | Description |
|---|---|
| 64493 | Facet joint injection, lumbar, single level |
| 64494 | Facet joint injection, lumbar, second level |
| 64635 | RFA lumbar facet, single level |
| 64636 | RFA lumbar facet, each additional level |

### Joint Injections (2 codes)
| Code | Description |
|---|---|
| 20610 | Large joint injection/aspiration |
| 27096 | SI joint injection with imaging guidance |

### Drug Screening (2 codes)
| Code | Description |
|---|---|
| 80307 | Drug testing, chemistry analyzers |
| 80305 | Drug testing, direct observation |

### Injection Drugs and Imaging (8 codes)
| Code | Description |
|---|---|
| J1100 | Dexamethasone sodium phosphate, 1 mg |
| J3301 | Triamcinolone acetonide, 10 mg |
| J0702 | Betamethasone, 3mg/3mg |
| J1030 | Methylprednisolone acetate, 40 mg |
| Q9966 | Low osmolar contrast, 200-299 mg/ml |
| Q9967 | Low osmolar contrast, 300-399 mg/ml |
| 77002 | Fluoroscopic guidance for needle placement |
| 96372 | Therapeutic injection, SC/IM |


## Appendix B: Core Interventional Code Set (Behavioral Filter Only)

These codes are used ONLY for the behavioral filter (cohort membership decision) and the `practice_type` classification. They are NOT the scoring reference set.

| Category | Codes |
|---|---|
| Epidural/intrathecal | 62320, 62321, 62322, 62323 |
| Transforaminal epidural | 64479, 64480, 64483, 64484 |
| Facet injection (cervical/thoracic) | 64490, 64491, 64492 |
| Facet injection (lumbar) | 64493, 64494, 64495 |
| Radiofrequency ablation | 64633, 64634, 64635, 64636 |
| SI joint injection | 27096 |
| Joint injection/aspiration | 20605, 20606, 20610, 20611 |
| Peripheral nerve blocks | 64400, 64405, 64415, 64445, 64447, 64450 |
| Spinal cord stimulator | 63650, 63685 |
| Fluoroscopic guidance | 77002, 77003 |


## Appendix C: Differences from the Pediatrics Model

A summary of every structural decision that differs from the pediatric peer comparison scoring.

| Decision | Pediatrics | Pain Medicine | Why Different |
|---|---|---|---|
| Peer cohort definition | Single taxonomy code (208000000X) | Behavioral filter across 4 taxonomy codes | Taxonomy is unreliable for pain medicine |
| Geographic grouping | State primary, national fallback | **National primary, state secondary** | State cohorts too small for percentile scoring |
| Volume threshold | >= 100 Medicaid services | >= 50 Medicare services | Smaller specialty, different service mix (procedures vs. visits) |
| Primary data source | CMS Medicaid | **CMS Medicare** | Pain is a Medicare-dominant specialty |
| Reference set size | 25 codes | 28 codes | Pain practice has more procedure + drug code combinations |
| Workflow categories | 5 (sick visits, well-child, immunizations, screening, POC testing) | 6 (office visits, spinal injections, facet procedures, joint injections, drug screening, injection drugs/imaging) | Different clinical workflow |
| Practice type classification | Not applicable | **interventional / non_interventional / mixed** | Fundamental practice split unique to pain medicine |
| Subspecialist handling | Flag via taxonomy, exclude | Flag via behavioral classification + thin practice pattern | Taxonomy-based flagging doesn't work here |
| Cohort size warning | Not needed (large cohorts) | **thin_cohort flag for < 30 providers** | Small specialty requires transparency about statistical power |
| ~~Anesthesiology crossover~~ | Not applicable | **No longer applicable** — 207L00000X removed from taxonomy list | PM&R - Pain Medicine (2081P2900X) replaces anesthesiology in the cohort |
