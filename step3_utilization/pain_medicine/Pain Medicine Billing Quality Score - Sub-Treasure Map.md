# Pain Medicine Billing Quality Score: A Sub-Treasure Map


## What This Document Does

The other Sub-Treasure Map docs ask about clinical practice: does this provider follow guidelines, does their code mix look like a normal pain medicine provider? This doc asks about **billing behavior**: do the ratios between this provider's procedures look normal?

We check three things:
1. **Charge-to-allowed ratios** — is their pricing in line with peers?
2. **Procedure-to-procedure ratios** — do the relationships between their codes make clinical sense? Are there green flags (good practice signals) or red flags (things that shouldn't go together, or go together too often)?
3. **E/M level distribution** — are they billing visit complexity at a similar level to peers, or skewing high (possible upcoding)?

The standard is always the peer distribution. Scored against Massachusetts state-level cohorts by default.


> **Important:** This score has no access to prescription data. See **Part F, Section 14: "No Rx Data"** for the full discussion of what this score cannot measure — including opioid prescribing, monitoring compliance, and medication management quality. This is the single biggest limitation of the scoring system.


> ### METHODOLOGY STRENGTH: MEDICARE AS PRIMARY DATA SOURCE
>
> Unlike pediatrics — where Medicare covers few children and the charge-to-allowed analysis relies on thin data — pain medicine has **substantial Medicare volume**. Pain patients skew older (chronic low back pain, degenerative disc disease, neuropathy, post-surgical pain). This means:
>
> - **Charge-to-allowed analysis is robust.** Large sample sizes per provider. Percentile scoring is statistically reliable.
> - **Peer cohorts are large.** MA has 1,952+ pain providers with >=100 combined services. No national fallback needed.
> - **Per-code charge analysis is meaningful.** Enough volume per HCPCS code to compute reliable peer medians at the code level.
>
> This is a genuine structural advantage over the pediatric model. The same scoring methodology produces more reliable results when applied to a Medicare-heavy specialty.


> ### ⚠️ ASSUMPTION LOG
>
> This document was written using clinical knowledge of pain medicine billing patterns — the same documentation-first approach used for the pediatrics Sub-Treasure Maps, which were also written as methodology specs before pulling actual CMS data. The following need validation against actual CMS data for Massachusetts pain medicine providers:
>
> 1. **HCPCS code landscape** — The top 25-30 codes by volume have NOT been extracted from CMS data yet. The codes referenced here are based on known pain medicine billing patterns. Run the code landscape extraction against the MA pain roster before finalizing.
> 2. **E/M distribution expectations** — The expected 99213/99214/99215 split for pain medicine is estimated from national patterns. MA-specific peer anchors must be computed from the data.
> 3. **All ratio thresholds** (p25, p75, p90 references) are placeholders that must be computed from the actual MA peer cohort.
> 4. **Drug testing ratios** — Included as billing quality signals. Green flag = provider bills both presumptive and definitive (legitimate workflow). Red flag = high definitive-to-presumptive ratio or definitive-only billing. See Section 7A for full logic.
> 5. **Fluoroscopy guidance ratios** — Green/yellow/red buckets defined, but the exact ratio thresholds are configurable and must be validated against the actual MA data before finalizing. Do not hardcode.


---

# PART A: WHAT WE HAVE

---

This score uses both CMS datasets:

**CMS Medicare Physician & Other Practitioners (By Provider and Service)** — for charge-to-allowed analysis

| Field | What We Use It For |
|---|---|
| npi | Provider identification |
| hcpcs_code | Which service |
| average_submitted_chrg_amt | What the provider charged (their list price) |
| average_medicare_allowed_amt | What Medicare says the service is worth (the allowed amount) |
| number_of_services | Volume (for weighting) |
| provider_type | Filter to Pain Medicine / Interventional Pain Medicine |

**CMS Medicaid Provider Spending** — for procedure ratio analysis

| Field | What We Use It For |
|---|---|
| servicing_npi | Provider identification |
| hcpcs_code | Which service |
| claim_count | Service volume |
| beneficiary_count | Unique patients |

The charge-to-allowed analysis (Section 1) is Medicare-only because Medicaid does not publish charge-vs-allowed detail. The procedure ratio analysis (Sections 2-4) uses both files combined, giving us full pain medicine volume.

**Unlike pediatrics, pain medicine has substantial Medicare volume** (see "Methodology Strength" callout above). The charge-to-allowed analysis is far more robust here.


> ### 🔑 PAIN MEDICINE vs. PEDIATRICS: KEY STRUCTURAL DIFFERENCE
>
> Pediatrics is a **cognitive/preventive** specialty — the dominant codes are E/M visits, well-child checks, screenings, and immunizations. The billing quality ratios in pediatrics check whether screening-to-visit and vaccine-to-visit ratios make sense.
>
> Pain medicine is a **procedural** specialty — the dominant codes are injections, nerve blocks, ablations, and imaging guidance. The billing quality ratios here check whether **procedure-to-guidance**, **procedure-to-E/M**, and **drug-testing-to-visit** ratios make sense. The entire green/red flag framework is rebuilt around procedural logic rather than preventive care logic.


---

# PART B: THE LOGIC

---


## Peer Cohort Definition

All four taxonomy codes remain in the **marketplace roster** (providers are listed and discoverable), but they are scored in **separate peer cohorts** because their billing patterns are fundamentally different.

### Three Scoring Cohorts

| Cohort | Taxonomy Codes | Description | Scoring Approach |
|---|---|---|---|
| **Cohort A** (Primary) | `208VP0000X` + `208VP0014X` | Dedicated pain medicine — interventional and non-interventional | Primary quality scoring cohort. All ratios, green/red flags, and peer benchmarks in this document are calibrated against Cohort A. Scored against AAPM/ASIPP clinical benchmarks. |
| **Cohort B** | `207L00000X` with pain-indicating HCPCS volume | Anesthesiology-pain hybrid — anesthesiologists who bill significant pain procedure volume | Scored **against each other**, not against dedicated pain providers. Their overall code mix includes anesthesia services that would distort Cohort A benchmarks. Filter: provider must bill >=20 pain-specific procedure codes (64XXX series, 62321-62324, 27096) to qualify for Cohort B. Otherwise they are general anesthesiologists and are excluded from pain scoring. |
| **Cohort C** | `2084P0800X` | Pain psychiatry/neurology — behavioral pain management | Scored separately or flagged as a **different care model entirely**. Expect: high E/M proportion, minimal procedures, no injection/ablation codes. The procedural ratio checks in this document (Sections 6A-6D) are largely inapplicable. Cohort C providers are scored on E/M distribution, drug testing ratios, and charge-to-allowed only. |

### Why Three Cohorts

Scoring a psychiatry-trained pain provider against an interventional pain provider would penalize the psychiatrist for not doing injections (they shouldn't be) and reward them for high E/M proportion (that's their entire practice). Scoring an anesthesiologist-pain hybrid against a dedicated pain provider would dilute the peer distribution with anesthesia codes that have nothing to do with pain management. Separate cohorts ensure "normal" means normal for that provider type.

### Cohort B Filtering Logic

```
For each NPI with taxonomy_code = '207L00000X':

    pain_procedure_volume = SUM(services) WHERE hcpcs_code IN [
        64400-64495,    -- nerve blocks, facet joints
        64633-64636,    -- radiofrequency ablation
        62321-62324,    -- epidural injections
        64479-64484,    -- transforaminal epidurals
        27096           -- SI joint injection
    ]

    IF pain_procedure_volume >= 20:
        assign to Cohort B (anesthesiology-pain hybrid)
    ELSE:
        exclude from pain quality scoring (general anesthesiologist)
```

### Geographic Grouping

Charge-to-allowed ratios vary by geography. Pain medicine pricing in Boston differs from western Massachusetts.

| Level | How | When to Use |
|---|---|---|
| **State (MA)** (default) | All pain medicine NPIs in the provider's cohort (A, B, or C), >= 10 Medicare services, in Massachusetts | Primary scoring. |
| **National** | All states combined | Secondary benchmark. Use when MA cohort < 30 providers. |
| **Sub-state (future)** | ZIP-3 prefix or CBSA/MSA from NPPES practice address | When MA cohort is large enough to split. Boston metro vs. rest-of-state. |

The MA active roster has **1,952 providers** with >=100 combined services and **5,178 total** — the state cohort is comfortably large. No national fallback needed unless after taxonomy filtering the core cohort shrinks below 30.

Minimum peer cohort size: **30 providers**.


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

A ratio of 2.0x means the provider charges, on average, twice what Medicare allows.


### What the Ratio Tells You

| Ratio | Interpretation |
|---|---|
| ~1.0x | Provider charges close to Medicare allowed amounts. Unusual. |
| 1.5x - 3.0x | Typical range for most providers. |
| 3.0x - 5.0x | High charges. May reflect aggressive pricing, a high-cost market (Boston), or a practice with high commercial negotiated rates. |
| >5.0x | Outlier. Worth investigating. Could be billing errors, upcoding, or an unreconciled fee schedule. |
| <1.0x | Very unusual. Possible data error or unusual payment arrangement. |

> ### PAIN MEDICINE NOTE
>
> Pain medicine procedures (injections, nerve blocks, ablations) tend to have **higher charge-to-allowed ratios** than cognitive E/M visits because facility and equipment overhead is priced into the charge. Expect the peer median for pain medicine to be higher than for primary care or pediatrics. The three-band scoring system (peer-relative) handles this automatically — we score against pain medicine peers, not against all-specialty averages.


## 2. Building the Peer Distribution

### Computing Peer Anchors

```
# For Cohort A (primary). Cohorts B and C use the same formula
# but with their own filtered peer set.

peer_cohort = all pain medicine NPIs in Massachusetts
    WHERE taxonomy_code IN ('208VP0000X', '208VP0014X')
    AND total_medicare_services >= 10
    AND entity_type = 1  (individual provider)

For each NPI in peer_cohort:
    compute charge_to_allowed_ratio (formula from Section 1)

peer_p10 = 10th percentile of charge_to_allowed_ratio across peer_cohort
peer_p25 = 25th percentile
peer_median = 50th percentile (median)
peer_p75 = 75th percentile
peer_p90 = 90th percentile
```

> **Illustrative anchors need to be computed from real MA data.** Pain medicine charge ratios are expected to be higher than pediatrics (illustrative peds national median was ~2.20x). Do not assume the same anchors. Each cohort (A, B, C) will have its own peer anchors.


## 3. Scoring Bands

```
provider_ratio = charge_to_allowed_ratio for this NPI

IF peer_p25 <= provider_ratio <= peer_p75:
    charge_score = 100        -- inside the middle 50%, normal

ELIF peer_p10 <= provider_ratio <= peer_p90:
    charge_score = 70         -- inside the middle 80%, somewhat unusual

ELSE:
    charge_score = 40         -- outside the middle 80%, outlier
```

| Band | Range | Score | Interpretation |
|---|---|---|---|
| Normal | p25 to p75 | 100 | Pricing within typical range for pain medicine peers in MA. |
| Somewhat unusual | p10 to p25, or p75 to p90 | 70 | In the tails but not extreme. Could reflect market positioning. |
| Outlier | Below p10 or above p90 | 40 | Significantly different from peers. Worth investigating. |


### Why Bands, Not a Continuous Scale

Charge-to-allowed ratio is not a quality measure. A ratio of 2.5x is not "better" than 2.8x. Both are normal. The purpose is to flag outliers, not rank providers.


## 4. Per-Code Analysis (Optional Detail Layer)

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

This answers: is the pricing outlier status driven by one or two codes, or across the board? A provider who charges 5x the peer median for 64483 (epidural injection) but is normal on everything else has a different story from one who is 3x+ on every code.


---

# PART C: PROCEDURE RATIO ANALYSIS (Green Flags and Red Flags)

---

Charge-to-allowed is about pricing. This section is about the **relationships between procedures**. Certain code ratios reveal practice quality, and certain combinations are warning signs. All of these use HCPCS volumes from both Medicare and Medicaid combined.


> ### PAIN MEDICINE vs. PEDIATRICS: COMPLETELY DIFFERENT RATIO FRAMEWORK
>
> In pediatrics, the ratios check screening-to-visit, vaccine-to-visit, and preventive-to-sick proportions. None of those apply to pain medicine.
>
> In pain medicine, the key relationships are:
> - **Procedure + imaging guidance** (every injection should have a guidance code)
> - **Procedure complexity ladder** (simple → complex procedures should form a clinical progression)
> - **Drug testing patterns** (presumptive vs. definitive testing ratios)
> - **E/M + procedure balance** (how much of the practice is evaluation vs. procedures)
> - **Bilateral/multi-level billing** (legitimate but a known area of abuse)


## 5. E/M Level Distribution (Upcoding Check)

Every office visit is billed at a complexity level. Pain medicine providers have a different expected distribution than primary care.

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

For peer cohort (MA pain medicine):
    peer_median_pct for each level
```

**What normal looks like in pain medicine:**

> ⚠️ **ASSUMPTION — VALIDATE AGAINST MA DATA**

| Code | Level | Expected Pain Medicine Distribution |
|---|---|---|
| 99211 | Minimal (nurse visit) | ~1-2% |
| 99212 | Straightforward | ~2-5% |
| 99213 | Low complexity | ~25-40% |
| 99214 | Moderate complexity | ~40-55% **(the dominant code)** |
| 99215 | High complexity | ~5-15% |

> ### PAIN MEDICINE vs. PEDIATRICS: E/M DISTRIBUTION DIFFERENCE
>
> In pediatrics, **99213 is the dominant code** (~45-55%). In pain medicine, **99214 is expected to be dominant** (~40-55%). Pain patients typically present with moderate complexity — chronic pain management, medication adjustments, procedure planning. This is NOT upcoding; it reflects the clinical reality that pain patients are inherently more complex than a child with an ear infection.
>
> **Do not apply pediatric E/M expectations to pain medicine.** A pain provider billing 50% at 99214 is normal. A pediatrician billing 50% at 99214 would be a red flag.

**Red flag:** Provider's 99214+99215 combined is above the **pain medicine** peer p90. Even for a procedural specialty, billing at higher complexity than 90% of pain medicine peers is unusual.

**Red flag:** Provider's 99215 alone exceeds 20% of E/M volume. Very high-complexity visits should be uncommon even in pain medicine unless the practice specializes in complex cases (e.g., intrathecal pump management, spinal cord stimulator programming).

**Green flag:** Provider's distribution closely matches peer median (all levels within 10 percentage points).

```
high_complexity_pct = (services_99214 + services_99215) / em_total

peer_p90_high_complexity = 90th percentile of high_complexity_pct across peer cohort

em_distribution_flag = "red"  IF high_complexity_pct > peer_p90_high_complexity
                      "yellow" IF high_complexity_pct > peer_p75_high_complexity
                      "green"  IF high_complexity_pct <= peer_p75_high_complexity
```


## 6. Green Flag Ratios (Good Practice Signals)

These ratios indicate a provider is following expected clinical workflows. High ratios compared to peers are positive signals.


### 6A. Imaging Guidance-to-Procedure Ratio

**The most important billing quality signal in pain medicine.** Nearly every injection or ablation should be performed under imaging guidance (fluoroscopy, CT, or ultrasound). A provider doing procedures without billing guidance codes is either: (a) not using guidance (substandard care), (b) bundling incorrectly, or (c) billing the guidance under a different NPI (facility billing).

```
guidance_codes = {
    77003: 'fluoroscopic guidance',
    77012: 'CT guidance',
    76942: 'ultrasound guidance'
}

injection_procedure_codes = {
    # Epidural / Transforaminal
    62321: 'cervical/thoracic epidural - without imaging',
    62322: 'lumbar/sacral epidural - without imaging',
    62323: 'cervical/thoracic epidural - with imaging',
    62324: 'lumbar/sacral epidural - with imaging',
    64479: 'cervical transforaminal epidural',
    64480: 'cervical transforaminal - each additional level',
    64483: 'lumbar transforaminal epidural',
    64484: 'lumbar transforaminal - each additional level',

    # Facet / Medial Branch Blocks
    64490: 'cervical/thoracic facet - 1st level',
    64491: 'cervical/thoracic facet - 2nd level',
    64492: 'cervical/thoracic facet - 3rd+ level',
    64493: 'lumbar/sacral facet - 1st level',
    64494: 'lumbar/sacral facet - 2nd level',
    64495: 'lumbar/sacral facet - 3rd+ level',

    # Sacroiliac Joint
    27096: 'SI joint injection',

    # Peripheral Nerve Blocks
    64400: 'trigeminal nerve block',
    64405: 'greater occipital nerve block',
    64450: 'other peripheral nerve block',
    64454: 'genicular nerve block',

    # Radiofrequency Ablation
    64633: 'cervical/thoracic facet RFA - 1st level',
    64634: 'cervical/thoracic facet RFA - each additional',
    64635: 'lumbar/sacral facet RFA - 1st level',
    64636: 'lumbar/sacral facet RFA - each additional'
}

total_procedures = SUM(services) for all injection_procedure_codes
total_guidance = SUM(services) for all guidance_codes

guidance_to_procedure_ratio = total_guidance / total_procedures
```

Scoring uses green/yellow/red buckets. **The exact ratio thresholds are configurable and must be validated against actual MA data before finalizing.** Default thresholds below assume standard fluoroscopy billing for MA independent (non-facility) providers:

**Green flag:** Ratio within the expected range (default: 0.7 to 1.3, configurable). Provider bills guidance for most/all procedures.

**Yellow flag:** Ratio below the expected range but not absent (default: 0.4 to 0.7, configurable). Provider bills guidance for some but not all procedures. Could be partial facility billing, or a mix of guided and unguided procedures.

**Red flag (low):** Ratio below floor (default: 0.4, configurable). Provider does many procedures but bills very little imaging guidance. Investigate whether guidance is billed under facility NPI.

**Red flag (high):** Ratio above ceiling (default: 2.0, configurable). Provider bills more guidance than procedures. Could indicate billing guidance for non-procedural services, or data anomaly.

> ⚠️ **BUNDLING NOTE**: Some codes (64479-64484 transforaminal epidurals, 64490-64495 facet joints) include imaging guidance in the code definition per CMS bundling rules. If guidance is bundled into the procedure code, the separate 77003 should NOT also be billed. This ratio must be computed only against procedures where separate guidance billing is appropriate. Validate the current CMS bundling rules for pain medicine codes before finalizing. The threshold values above are starting points — calibrate against the peer distribution once the code landscape is extracted.


### 6B. Diagnostic Block Before Ablation Ratio

Radiofrequency ablation (RFA) of facet nerves should be preceded by diagnostic medial branch blocks (MBBs). Performing ablation without prior diagnostic blocks is clinically inappropriate and is a well-known CMS audit target.

```
mbb_services = services_64490 + services_64491 + services_64492 +
               services_64493 + services_64494 + services_64495

rfa_services = services_64633 + services_64634 +
               services_64635 + services_64636

diagnostic_to_ablation_ratio = mbb_services / rfa_services
```

**Green flag:** Ratio >= 2.0. Provider performs at least 2 diagnostic blocks per ablation (consistent with dual-block paradigm required by most payers, including Massachusetts MassHealth and Medicare).

**Neutral:** Ratio between 1.0 and 2.0. Provider performs some diagnostic blocks. Could be single-block paradigm or established patients returning for repeat ablation.

**Red flag:** Ratio below 0.5. Provider performs ablations far in excess of diagnostic blocks. Either: (a) performing ablations without appropriate diagnostic workup, (b) diagnostic blocks billed in a prior year not captured in this snapshot, or (c) billing anomaly.

> ⚠️ **IMPORTANT NUANCE**: This ratio uses aggregated annual data. A provider may have done the diagnostic blocks in a prior year and is now performing the ablation. Multi-year data (available in Medicaid file: 2018-2024) can mitigate this. For single-year analysis, a low ratio is a **signal**, not proof of inappropriate care.


### 6C. E/M-to-Procedure Balance

What proportion of the provider's total services are E/M visits vs. procedures?

```
total_em = SUM(services) WHERE hcpcs_code IN [99211-99215, 99201-99205]
total_procedures = SUM(services) for all injection/ablation/implant codes
total_services = total_em + total_procedures + other_services

em_proportion = total_em / total_services
procedure_proportion = total_procedures / total_services
```

**Green flag:** `em_proportion` between 0.25 and 0.50 and `procedure_proportion` between 0.30 and 0.55. A balanced practice sees patients for evaluation AND performs procedures.

**Signal (procedure-heavy):** `procedure_proportion` above peer p90. Practice is overwhelmingly procedural with little E/M. Could indicate a procedures-only practice (legitimate, e.g., ASC-based) or underbilling E/M.

**Signal (E/M-heavy):** `em_proportion` above peer p90 with minimal procedures. Could be a non-interventional pain practice (legitimate if taxonomy is `2084P0800X`) or a provider who evaluates but refers out for procedures.

> ⚠️ **ASSUMPTION**: The E/M-to-procedure balance expectations are estimates. The actual split varies significantly between interventional pain (more procedures) and non-interventional/medical pain management (more E/M). This is another reason the peer cohort taxonomy decision matters.


### 6D. Multi-Level Billing Consistency

When a provider bills multi-level spinal procedures (e.g., lumbar facet block at L3-4, L4-5, L5-S1), the first level has a "primary" code and subsequent levels have "add-on" codes. The ratio between add-on and primary codes reveals whether multi-level billing is proportionate.

```
# Facet joints (lumbar)
primary_lumbar_facet = services_64493
addon_lumbar_facet = services_64494 + services_64495

addon_to_primary_lumbar = addon_lumbar_facet / primary_lumbar_facet

# Facet joints (cervical)
primary_cervical_facet = services_64490
addon_cervical_facet = services_64491 + services_64492

addon_to_primary_cervical = addon_cervical_facet / primary_cervical_facet

# Transforaminal epidurals (lumbar)
primary_lumbar_tfesi = services_64483
addon_lumbar_tfesi = services_64484

addon_to_primary_tfesi = addon_lumbar_tfesi / primary_lumbar_tfesi
```

**Green flag (facet):** Addon-to-primary ratio between 1.0 and 3.0. Most facet procedures treat 2-4 levels, so 1-3 add-on units per primary is normal.

**Red flag (facet):** Addon-to-primary ratio above 4.0. Provider routinely bills 5+ levels per session. While not impossible, this is unusual and a known OIG audit target.

**Green flag (TFESI):** Addon-to-primary ratio between 0.3 and 1.5. Many transforaminal injections are single-level. Some are bilateral or two-level.

**Red flag (TFESI):** Addon-to-primary ratio above 2.0. Routinely billing 3+ levels per transforaminal session is unusual.


### 6E. Established Patient Continuity

Does the provider see patients for follow-up after procedures?

```
established_visits = SUM(services) WHERE hcpcs_code IN [99211-99215]
new_visits = SUM(services) WHERE hcpcs_code IN [99201-99205]

established_to_new_ratio = established_visits / new_visits
```

**Green flag:** Ratio above peer p75. Provider maintains ongoing relationships — sees patients for follow-up, manages outcomes.

**Neutral:** Between p25 and p75.

**Signal:** Below peer p25. Very high proportion of new patients with little follow-up. Could indicate a "churn" practice or a pure consultation practice.


## 7. Red Flag Ratios (Warning Signals)


### 7A. Drug Testing Ratios

Urine drug testing is standard in pain medicine (monitoring compliance with controlled substances, checking for illicit use). Two tiers exist:

```
presumptive_testing = services_80305 + services_80306 + services_80307
    # 80305 = instrument-based presumptive (cup/dipstick)
    # 80306 = instrument-based, read by lab
    # 80307 = instrument-based, quantitative

definitive_testing = services_G0480 + services_G0481 + services_G0482 + services_G0483
    # G0480 = definitive, 1-7 drug classes
    # G0481 = definitive, 8-14 drug classes
    # G0482 = definitive, 15-21 drug classes
    # G0483 = definitive, 22+ drug classes

definitive_to_presumptive_ratio = definitive_testing / presumptive_testing
```

**Green flag:** Provider bills **both** presumptive and definitive testing, with a definitive-to-presumptive ratio between 0.1 and 0.5. This is the legitimate clinical pattern: presumptive screening first (cup/dipstick), then definitive confirmation when clinically indicated (unexpected results, confirmation needed for treatment decisions). The presence of both test types in appropriate ratios signals a provider following the guideline-concordant workflow.

**Yellow flag:** Ratio between 0.5 and 1.0. Provider sends a higher-than-typical proportion for definitive testing. Could be a higher-acuity patient population, or could be drifting toward overutilization. Context-dependent.

**Red flag:** Ratio above 1.0. Provider does more definitive testing than presumptive. Definitive testing is significantly more expensive. Performing definitive testing on every patient without presumptive screening first is a well-documented pattern of overutilization in pain medicine and a primary OIG/CMS audit target.

**Red flag (pattern):** Definitive-only billing — `definitive_testing > 20 AND presumptive_testing < 5`. Provider skips presumptive screening entirely and goes straight to expensive definitive testing. This is the clearest overutilization signal. There is no clinical justification for routine definitive-first testing.

**Red flag (severity):** High volume of G0482 or G0483 (15+ or 22+ drug classes per test). Testing for 22+ drug classes on every specimen is rarely clinically necessary and is one of the most common billing fraud patterns in pain medicine.

> ⚠️ **SENSITIVITY NOTE**: Drug testing is the single most audited area in pain medicine billing. These ratios are clinically well-supported (ASIPP guidelines, OIG reports) but should be presented carefully. A high ratio is a signal for investigation, not an accusation. Note: UDS billing ratios are a partial proxy for opioid monitoring compliance (see "What This Score Cannot Measure" at the top of this document), but billing a drug test is not the same as integrating the result into prescribing decisions.


### 7B. Drug Testing-to-Visit Ratio

How often does the provider test relative to their patient visit volume?

```
total_drug_tests = presumptive_testing + definitive_testing
total_em_visits = SUM(services) WHERE hcpcs_code IN [99211-99215, 99201-99205]

testing_to_visit_ratio = total_drug_tests / total_em_visits
```

**Normal:** Ratio between 0.3 and 1.0. Provider tests at a reasonable frequency — roughly every 1-3 visits.

**Red flag:** Ratio above 2.0. Provider bills more drug tests than visits. Could indicate: (a) billing drug tests without associated visits, (b) multiple test types per visit, or (c) testing done by staff without a provider visit.

**Signal:** Ratio below 0.1 or zero. Provider does very little drug testing despite (presumably) managing chronic pain patients on controlled substances. Could be legitimate (non-opioid practice), could indicate inadequate monitoring.

> ### PAIN MEDICINE vs. PEDIATRICS: DRUG TESTING IS UNIQUE TO PAIN MEDICINE
>
> Pediatrics has no equivalent of the drug testing ratio framework. This entire section (7A-7B) is new for pain medicine and does not exist in the pediatrics template. It reflects the specialty's unique relationship with controlled substance monitoring.


### 7C. Return Visit Intensity

How many total visits does each patient have per year?

```
visits_per_beneficiary = total_em_services / total_unique_beneficiaries

peer_median_visits_per_bene = MEDIAN across peer cohort
peer_p90_visits_per_bene = 90th percentile
```

**Red flag:** `visits_per_beneficiary` above peer p90. Provider's patients come back significantly more than peers' patients.

**Neutral:** Between p25 and p75.

> **PAIN MEDICINE NOTE**: Chronic pain patients legitimately visit more frequently than, say, a pediatric well-child panel. Pain management often requires monthly visits for medication management and periodic procedures. Expect the peer median visits-per-beneficiary to be higher than in primary care. The peer-relative scoring handles this.


### 7D. Single-Code Dominance

Is any one code an unusually large share of the provider's total billing?

```
For each HCPCS code billed by this NPI:
    code_pct = services_for_code / total_services

max_code_pct = MAX(code_pct)
dominant_code = the HCPCS code with the highest code_pct
```

**Red flag:** `max_code_pct` > 30% AND dominant code is NOT a standard E/M code (99213 or 99214). In pain medicine, no single procedure code should dominate more than 30% of total billing. A provider billing 40% of their services as a single injection code is unusual.

**Normal:** For most pain medicine providers, the dominant code is 99213 or 99214 (office visit), with procedures spread across several injection/ablation categories.


### 7E. Ablation Without Follow-Up

Provider performs radiofrequency ablation but has very low follow-up visit volume.

```
rfa_services = services_64633 + services_64634 + services_64635 + services_64636
followup_em = SUM(services) WHERE hcpcs_code IN [99211-99215]

followup_to_rfa_ratio = followup_em / rfa_services
```

**Red flag:** Ratio below 1.0 with rfa_services > 10. Provider performs ablations but sees fewer patients for follow-up than ablation procedures performed. Ablation patients should be followed to assess outcomes.

**Normal:** Ratio above 2.0. Provider sees patients multiple times around each ablation (pre-procedure evaluation, post-procedure follow-up).


### 7F. After-Hours Billing Rate

```
after_hours_pct = services_99051 / total_em_services
```

**Red flag:** Above peer p90. Unusually high proportion of visits billed as after-hours.

**Neutral:** Most pain medicine providers bill 99051 at 0-3% of visits.


### 7G. New-to-Established Patient Ratio

```
new_patient_pct = (services_99201 + services_99202 + services_99203 +
                   services_99204 + services_99205) / total_em_services
```

**Red flag (high):** New patient percentage far above peer p90. Could indicate high patient turnover or miscoding established patients as new.

**Red flag (very low):** New patient percentage near zero. Could indicate a closed panel.


### 7H. Trigger Point Injection Volume

Trigger point injections (20552, 20553) are legitimate but are a well-known area of overutilization in pain medicine.

```
trigger_point_pct = (services_20552 + services_20553) / total_procedure_services
```

**Red flag:** `trigger_point_pct` above peer p90. Provider bills a disproportionate amount of trigger point injections relative to their total procedure volume. Trigger points are low-complexity, high-reimbursement procedures that some practices overuse.

**Neutral:** Between p25 and p75.


### 7I. E/M Complexity Trend (Multi-Year)

Is the provider's E/M complexity increasing year over year faster than peers?

```
For each year in available data:
    high_complexity_pct_year = (services_99214 + services_99215) / total_em_services

complexity_trend = high_complexity_pct_latest - high_complexity_pct_earliest
peer_median_trend = MEDIAN(complexity_trend) across peer cohort
```

**Red flag:** Provider's complexity trend is above peer p90. E/M billing is escalating faster than peers.

**Neutral:** Trend within p25-p75. Some upward drift is normal (2021 E/M documentation changes shifted coding nationally).

Note: Medicaid file covers 2018-2024, so this is computable.


## 8. Cross-Category Consistency Checks

These checks look for logical consistency between code categories. They are not about volume but about whether the provider's code mix makes sense as a coherent pain medicine practice.

| # | Check | Logic | Flag |
|---|---|---|---|
| 1 | Epidural injection without fluoroscopy | services for 62323/62324/64479/64483 > 10 AND services_77003 = 0 | Red: transforaminal epidurals require fluoroscopy for safe needle placement |
| 2 | Facet blocks without fluoroscopy | services for 64490-64495 > 10 AND services_77003 = 0 | Red: facet procedures require imaging guidance |
| 3 | RFA without diagnostic blocks (annual) | rfa_services > 10 AND mbb_services = 0 | Red: ablation without any diagnostic blocks in the same year (see caveat in 6B) |
| 4 | Drug testing without E/M visits | total_drug_tests > 20 AND total_em_visits < 5 | Red: testing without associated patient visits |
| 5 | Definitive-only testing (no presumptive) | definitive_testing > 20 AND presumptive_testing < 5 | Red: skipping presumptive screening entirely — clearest overutilization signal, no clinical justification for routine definitive-first |
| 6 | Procedures but no E/M visits | total_procedures > 50 AND total_em_visits < 10 | Yellow: could be ASC-based practice where E/M is billed by a different provider. Not necessarily wrong, but unusual for a solo billing pattern. |
| 7 | Spinal cord stim trial without permanent implant (or reverse) | services_63650 (trial) > 5 AND services_63685 (permanent) = 0 | Yellow: trials should lead to some permanent implants (50-70% conversion is typical). Zero permanent implants despite trials is unusual but could be legitimate (patients declined). |
| 8 | High bilateral modifier usage | Count of procedures billed with modifier -50 > peer p90 | Yellow: bilateral billing is legitimate but overuse is an audit target |
| 9 | SI joint injection without any sacroiliac diagnostic code | services_27096 > 10 AND no sacroiliac-related E/M documented | Yellow: SI injection should follow clinical evaluation |
| 10 | High G2211 complexity add-on | services_G2211 / total_established_em > peer p90 | Yellow: G2211 has been flagged nationally for overuse since 2024 |

> ⚠️ **ASSUMPTION**: The HCPCS codes used in these consistency checks (e.g., 63650 for SCS trial, 63685 for SCS permanent) should be verified against current CPT definitions. Some codes may have been revised or replaced. Cross-reference with the actual MA CMS data code landscape.


## 9. Summary: All Ratio Checks

| # | Check | Section | Type | Data Source |
|---|---|---|---|---|
| 1 | E/M level distribution | 5 | Red flag | Medicare + Medicaid |
| 2 | Imaging guidance-to-procedure ratio | 6A | Green flag | Medicare + Medicaid |
| 3 | Diagnostic block before ablation ratio | 6B | Green flag | Medicare + Medicaid |
| 4 | E/M-to-procedure balance | 6C | Green flag | Medicare + Medicaid |
| 5 | Multi-level billing consistency (lumbar facet) | 6D | Green flag | Medicare + Medicaid |
| 6 | Multi-level billing consistency (cervical facet) | 6D | Green flag | Medicare + Medicaid |
| 7 | Multi-level billing consistency (TFESI) | 6D | Green flag | Medicare + Medicaid |
| 8 | Established patient continuity | 6E | Green flag | Medicare + Medicaid |
| 9 | Definitive-to-presumptive drug testing ratio | 7A | Red flag | Medicare + Medicaid |
| 10 | High drug class count (G0482/G0483) volume | 7A | Red flag | Medicare + Medicaid |
| 11 | Drug testing-to-visit ratio | 7B | Red flag | Medicare + Medicaid |
| 12 | Return visit intensity | 7C | Red flag | Medicare |
| 13 | Single-code dominance | 7D | Red flag | Medicare + Medicaid |
| 14 | Ablation without follow-up | 7E | Red flag | Medicare + Medicaid |
| 15 | After-hours billing rate | 7F | Red flag | Medicare + Medicaid |
| 16 | New-to-established ratio | 7G | Red flag | Medicare + Medicaid |
| 17 | Trigger point injection volume | 7H | Red flag | Medicare + Medicaid |
| 18 | E/M complexity trend (multi-year) | 7I | Red flag | Medicare + Medicaid |
| 19-28 | Cross-category consistency (10 checks) | 8 | Yellow/Red | Medicare + Medicaid |

**Total: 28 ratio checks** (7 green flags, 11 red flags, 10 cross-category consistency checks).


## 10. Scoring the Ratio Analysis

Each ratio check produces a flag: green, neutral/yellow, or red. We roll them up into a single ratio analysis score.

```
ratio_checks = [all 28 checks listed above, excluding those with insufficient data]

green_count = COUNT WHERE flag = "green"
neutral_count = COUNT WHERE flag = "neutral" or "yellow"
red_count = COUNT WHERE flag = "red"
total_checks = COUNT of all applicable checks (skip those with insufficient data)

ratio_analysis_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0))
                       / total_checks * 100
```

| Score | Interpretation |
|---|---|
| 80-100 | Most ratios are green or neutral. Billing patterns look clean. |
| 60-79 | Mixed. Some green flags, some red. Worth looking at which reds. |
| 40-59 | Multiple red flags. Billing patterns deviate from peers in several areas. |
| Below 40 | Significant red flags across multiple checks. Investigate. |


---

# PART D: COMPOSITE BILLING QUALITY SCORE

---


## 11. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "MA"

STEP 1: Compute provider charge ratio
    charges = SUM(average_submitted_chrg_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023
    allowed = SUM(average_medicare_allowed_amt * number_of_services)
        WHERE npi = "1234567890" AND year = 2023

    IF allowed = 0 OR total services < 10: RETURN insufficient_data

    provider_ratio = charges / allowed

STEP 2: Build peer distribution
    Determine provider's cohort (A, B, or C) from taxonomy code + HCPCS volume.

    peer_cohort = all NPIs in the SAME cohort
        AND state = "MA" AND total_medicare_services >= 10

    IF COUNT(peer_cohort) < 30: use national cohort instead

    Compute peer_p10, peer_p25, peer_median, peer_p75, peer_p90

STEP 3: Score charge ratio
    IF peer_p25 <= provider_ratio <= peer_p75:
        charge_score = 100
    ELIF peer_p10 <= provider_ratio <= peer_p90:
        charge_score = 70
    ELSE:
        charge_score = 40

STEP 4: Score procedure ratios
    Run all 28 ratio checks.
    Compute ratio_analysis_score per Section 10.

STEP 5: Composite
    billing_quality_composite = (charge_score * 0.35) + (ratio_analysis_score * 0.65)

    -- Ratio analysis gets higher weight because it captures clinical
    -- practice patterns, not just pricing.
    -- If no Medicare data (charge_score unavailable):
    --     billing_quality_composite = ratio_analysis_score
```


## 12. Worked Example

**Provider A** in Massachusetts. Interventional pain medicine.

**Charge ratio:** Charges $420,000 total, Medicare allowed $195,000. Ratio = **2.15x**.

**MA peer anchors (illustrative — compute from real data):**

| p10 | p25 | Median | p75 | p90 |
|---|---|---|---|---|
| 1.50x | 1.90x | 2.40x | 3.10x | 3.80x |

Provider A ratio of 2.15x falls between p25 (1.90x) and p75 (3.10x). Charge score = **100**.

**Ratio analysis:**
- Imaging guidance-to-procedure: 0.85 → **green**
- Diagnostic block before ablation: 2.3 → **green**
- E/M-to-procedure balance: 0.35 E/M, 0.45 procedure → **green**
- Multi-level facet ratio: 2.1 → **green**
- Drug testing: presumptive dominant, definitive ratio 0.3 → **green**
- E/M distribution: 99214 at 48%, high-complexity 55% → **yellow** (slightly above p75)
- Return visit intensity: 5.2 visits/beneficiary → **neutral**
- No red flags fired.

Ratio score: (5 green × 1.0 + 2 neutral × 0.5 + 0 red) / 7 applicable = **86**.

Composite: (100 × 0.35) + (86 × 0.65) = 35 + 55.9 = **90.9**.

---

**Provider B** in Massachusetts. Pain medicine.

**Charge ratio:** Charges $680,000 total, Medicare allowed $140,000. Ratio = **4.86x**.

Above p90 (3.80x). Charge score = **40**.

**Ratio analysis:**
- Imaging guidance-to-procedure: 0.2 → **red** (few guidance codes)
- Diagnostic block before ablation: 0.3 → **red** (ablations without diagnostic workup)
- Drug testing: definitive-to-presumptive ratio 3.5, G0483 volume high → **red, red**
- Multi-level facet ratio: 4.8 → **red** (billing 5+ levels per session)
- Single-code dominance: 64635 at 35% of total billing → **red**
- Trigger point injections at peer p95 → **red**
- E/M distribution: within normal → **green**
- Established patient continuity: high → **green**
- Cross-category: procedures without guidance (red), definitive without presumptive (red)

Ratio score: (2 green × 1.0 + 1 neutral × 0.5 + 7 red × 0.0) / 10 = **25**.

Composite: (40 × 0.35) + (25 × 0.65) = 14 + 16.25 = **30.25**.

Multiple signals: outlier pricing + procedures without guidance + excessive drug testing + high multi-level billing + ablation without diagnostic workup.


---

# PART E: HOW THIS FITS WITH THE OTHER SCORES

---


## 13. The Five Scores Together

| Score | Question | Type |
|---|---|---|
| **Guideline Concordance** | Does this provider follow pain medicine clinical guidelines? | Clinical quality |
| **Peer Comparison** | Does their code mix look like a normal pain medicine provider? | Practice pattern |
| **Volume Adequacy** | For what they claim to do, is the volume real? | Behavior check |
| **Payer Diversity** | Is practice consistent across Medicare and Medicaid? | Consistency check |
| **Billing Quality** | Are charges, procedure ratios, and E/M distribution normal? | Pricing + integrity check |

Billing quality is the integrity layer. It checks pricing behavior AND practice pattern behavior. A provider can score 100 on the other four scores but get flagged here for:
- Excessive drug testing ratios
- Procedures without imaging guidance
- Ablations without diagnostic blocks
- Unusual charge-to-allowed ratios
- Multi-level billing beyond normal patterns

| Scenario | Guideline | Peer | Volume | Payer | Billing |
|---|---|---|---|---|---|
| Good provider, normal billing | High | High | High | High | High |
| Good provider, aggressive pricing | High | High | High | High | Low (charge ratio outlier) |
| Good provider, excessive drug testing | High | High | High | High | Low (red on drug testing ratios) |
| Proceduralist who skips guidance imaging | High | High | High | High | Low (red on guidance-to-procedure) |
| Ablation mill (high RFA, no diagnostic blocks) | Medium | High | High | High | Low (red on diagnostic-to-ablation, multi-level) |
| Non-interventional pain, clean billing | Medium | Low | Low | High | High |


---

# PART F: RISKS AND LIMITATIONS

---


## 14. Risks

**Charge-to-allowed analysis is Medicare-only.** Medicaid does not publish charge-vs-allowed detail. Unlike pediatrics, this is less of a limitation for pain medicine because Medicare volume is substantial. Providers with no Medicare data get scored on procedure ratios only.

**Procedure ratios use aggregated data, not same-day linkage.** We cannot confirm that imaging guidance was billed on the same day as a specific injection. We check whether total volumes are proportional. Claims-level data (MA APCD) would enable same-day verification.

**Diagnostic-to-ablation ratio has a temporal limitation.** Diagnostic blocks and subsequent ablation may span calendar years. Single-year analysis may undercount diagnostic blocks for providers whose ablation patients were diagnosed in a prior year. Multi-year analysis (Medicaid file: 2018-2024) partially addresses this.

**E/M distribution varies by practice model.** A provider managing complex chronic pain patients on high-dose opioids may legitimately bill more 99214/99215 than one doing mostly injection-based pain management. Without diagnosis codes, we cannot adjust for panel complexity.

**Drug testing ratios are a well-documented fraud vector but also a clinical necessity.** High drug testing is not inherently wrong — some patient populations require intensive monitoring. Red flags need investigation, not automatic penalty.

### No Rx Data — The Single Biggest Limitation of This Scoring System

A pain medicine quality score without opioid prescribing data is like a pediatric quality score without immunization data — you are missing the most clinically important signal. There is no opioid prescribing information in CMS claims files. This score measures billing behavior and procedure ratios. It does not and cannot measure:

- **Opioid prescribing volume, appropriateness, or tapering compliance**
- **Opioid monitoring compliance** — whether urine drug screens were ordered in the context of opioid prescribing, whether PDMP checks were performed, whether informed consent was documented
- **Medication management quality** — non-opioid analgesic use, multimodal therapy adoption, medication appropriateness

The urine drug screening ratios captured in Section 7A are a **partial proxy** for monitoring compliance — a provider who bills presumptive and definitive UDS in appropriate ratios is likely monitoring patients — but billing a drug test is not the same as integrating the result into prescribing decisions. UDS ratios measure billing behavior around testing, not clinical monitoring quality.

**Employers and plan sponsors should understand:** this Billing Quality Score tells you whether a pain medicine provider's billing patterns look normal compared to peers. It does not tell you whether they prescribe opioids responsibly. That requires PDMP data, pharmacy claims, or clinical chart review — none of which are available from free CMS public use files.

**No diagnosis codes.** Medicaid file has no ICD-10. We cannot determine whether procedures are being performed for appropriate diagnoses. A facet joint injection for low back pain is appropriate; the same injection for a condition not affecting the facet joints is not. We cannot distinguish these.

**Subspecialist variation.** Interventional pain (heavy procedures), anesthesiology-pain hybrids, and non-interventional pain (medication management, psychology-adjacent) have fundamentally different billing patterns. This is addressed by the three-cohort model (see Peer Cohort Definition), but within each cohort there is still variation. Cohort B (anesthesiology-pain hybrid) in particular may be heterogeneous.

**Geographic variation within Massachusetts.** Boston academic medical centers, suburban pain practices, and rural providers operate in very different markets. State-level peer grouping is the default; sub-state grouping (ZIP-3 or CBSA) would improve accuracy.

**A red flag is not an accusation.** It means a ratio is statistically unusual compared to peers. There may be a valid explanation. The score surfaces signals for investigation.


---

# PART G: MASSACHUSETTS-SPECIFIC CONSIDERATIONS

---

> ### This section captures MA-specific regulatory and market context that affects billing quality interpretation.

**MassHealth (MA Medicaid) requirements for pain procedures:**
- MassHealth requires prior authorization for many pain procedures including epidural injections, facet joint procedures, and RFA.
- MassHealth follows Medicare LCD (Local Coverage Determination) guidelines for medical necessity, including the dual diagnostic block requirement before RFA.
- These requirements may result in MA pain providers having *higher* diagnostic-to-ablation ratios than national peers (a positive signal).

**MA Prescription Drug Monitoring Program (MassPAT):**
- Massachusetts requires PDMP checks before prescribing Schedule II-III controlled substances.
- While we cannot measure prescribing from CMS data, the drug testing ratios serve as a proxy for monitoring compliance.

**MA opioid prescribing regulations:**
- MA has some of the strictest opioid prescribing laws in the US (Chapter 208, 2016).
- This may affect the E/M-to-procedure balance: stricter opioid rules may push more patients toward interventional procedures as alternatives to medication management.
- This is context, not a scoring adjustment. But it means MA pain providers may have a higher procedure-to-E/M ratio than national averages.

> ⚠️ **LIMITATION**: These regulatory notes are based on known MA pain medicine regulations. Verify current MassHealth prior authorization requirements and LCD guidelines, which may have been updated.


---

## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| **Identity & Geography** | | |
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | "MA" |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| provider_cbsa | string | Core-Based Statistical Area code |
| geo_group_level | string | "state", "national", or "zip3" |
| peer_cohort_state | string | "MA" or "US" if national fallback |
| peer_cohort_size | int | Number of peers in the cohort |
| taxonomy_code | string | Provider's primary taxonomy |
| scoring_cohort | string | "A" (dedicated pain), "B" (anesthesiology-pain hybrid), or "C" (pain psychiatry/neurology) |
| **Charge-to-Allowed (Medicare only)** | | |
| total_medicare_services | int | Total Medicare services |
| total_charges | float | SUM(avg_charge * services) |
| total_allowed | float | SUM(avg_allowed * services) |
| charge_to_allowed_ratio | float | total_charges / total_allowed |
| charge_peer_p10 | float | 10th percentile of peer cohort |
| charge_peer_p25 | float | 25th percentile |
| charge_peer_median | float | 50th percentile |
| charge_peer_p75 | float | 75th percentile |
| charge_peer_p90 | float | 90th percentile |
| charge_score | float | 100, 70, or 40 |
| charge_direction | string | "in_range", "above_peers", or "below_peers" |
| outlier_code_count | int | HCPCS codes with charge ratio > 2x or < 0.5x peer median |
| outlier_code_list | string | Comma-separated outlier HCPCS codes |
| **E/M Distribution** | | |
| em_99213_pct | float | % of office visits at 99213 |
| em_99214_pct | float | % of office visits at 99214 |
| em_99215_pct | float | % of office visits at 99215 |
| em_high_complexity_pct | float | (99214 + 99215) / total E/M |
| em_distribution_flag | string | "green", "yellow", or "red" |
| **Green Flag Ratios** | | |
| guidance_to_procedure_ratio | float | Imaging guidance / injection procedures |
| guidance_flag | string | Flag |
| diagnostic_to_ablation_ratio | float | MBB / RFA services |
| diagnostic_ablation_flag | string | Flag |
| em_to_procedure_balance | float | E/M proportion of total services |
| em_procedure_flag | string | Flag |
| addon_to_primary_lumbar_facet | float | Add-on / primary lumbar facet |
| addon_to_primary_cervical_facet | float | Add-on / primary cervical facet |
| addon_to_primary_tfesi | float | Add-on / primary TFESI |
| multilevel_flag | string | Flag (worst of the three) |
| established_to_new_ratio | float | Established / new patient visits |
| continuity_flag | string | Flag |
| **Red Flag Ratios** | | |
| definitive_to_presumptive_ratio | float | Definitive / presumptive drug tests |
| definitive_testing_flag | string | Flag |
| high_drug_class_volume | int | Services for G0482 + G0483 |
| high_drug_class_flag | string | Flag |
| drug_testing_to_visit_ratio | float | Total drug tests / total E/M visits |
| drug_testing_visit_flag | string | Flag |
| visits_per_beneficiary | float | Total E/M / unique beneficiaries |
| return_visit_flag | string | Flag |
| max_single_code_pct | float | Highest single-code % of total services |
| single_code_dominance_flag | string | Flag |
| rfa_followup_ratio | float | Follow-up E/M / RFA services |
| rfa_followup_flag | string | Flag |
| after_hours_pct | float | 99051 / total E/M |
| after_hours_flag | string | Flag |
| new_patient_pct | float | New patient visits / total E/M |
| new_patient_flag | string | Flag |
| trigger_point_pct | float | Trigger point injections / total procedures |
| trigger_point_flag | string | Flag |
| em_complexity_trend | float | Change in high-complexity % over time |
| em_trend_flag | string | Flag |
| **Cross-Category Consistency** | | |
| consistency_flags | int | Count of consistency checks that fired (0-10) |
| consistency_flag_list | string | Comma-separated names of fired checks |
| **Composite** | | |
| total_checks_run | int | Ratio checks with sufficient data |
| green_flag_count | int | Checks flagged green |
| yellow_flag_count | int | Checks flagged yellow |
| red_flag_count | int | Checks flagged red |
| ratio_analysis_score | float | Weighted roll-up (0-100) |
| billing_quality_composite | float | 0.35 * charge_score + 0.65 * ratio_analysis_score |
