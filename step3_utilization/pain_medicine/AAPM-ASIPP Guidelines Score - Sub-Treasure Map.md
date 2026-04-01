# Pain Medicine Claims to Guideline Quality Score: A Sub-Treasure Map


## What This Document Does

A claims file tells you what a pain medicine provider actually did: every injection, every nerve block, every office visit. AAPM (American Academy of Pain Medicine) and ASIPP (American Society of Interventional Pain Physicians) tell you what best practice should look like. This document shows how we compare the two and produce a guideline concordance score for pain medicine providers in Massachusetts, starting only from the free CMS data we have access to today.

**Important framing:** Pain medicine guideline concordance is fundamentally harder to score from claims data than pediatrics. Pediatric guidelines (AAP/Bright Futures) are built around *specific screenings and preventive visits at specific intervals* — things that map directly to HCPCS codes. Pain medicine guidelines are built around *treatment appropriateness given a diagnosis and prior treatment history* — things that require clinical context we do not have. This document is transparent about what we can and cannot measure, and designs scoring around what the data actually supports.


---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---


## 1. The Free Data We Have Right Now

We have access to two provider-level claims datasets from CMS, plus a provider registry. No paywalls, no data use agreements.


### Dataset 1: CMS Medicare Physician & Other Practitioners

Source: https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners

What's in it:

| Field | What It Tells Us |
|---|---|
| NPI | Which provider performed the service |
| HCPCS/CPT code | What they did |
| Number of services | How many times they did it |
| Number of beneficiaries | How many unique patients |
| Place of service | Office, facility, etc. |
| Average Medicare payment | What Medicare paid per service |
| Average submitted charge | What the provider charged |
| Beneficiary demographics | Age, sex, race, chronic conditions (aggregated) |
| Provider specialty | Taxonomy-derived specialty |

Available as: "By Provider and Service" (one row per NPI per HCPCS code) and "By Provider" (one row per NPI with aggregated stats). Free download or API.

**The pain medicine advantage:** Unlike pediatrics (where Medicare covers almost no children), pain medicine serves a heavily Medicare-eligible population. Chronic pain prevalence increases with age. The Medicare file is the **primary data source** for this specialty — it will contain substantial volume for most pain medicine providers.


### Dataset 2: CMS Medicaid Provider Spending

Source: https://data.medicaid.gov / https://opendata.hhs.gov/datasets/medicaid-provider-spending/

| Field | What It Tells Us |
|---|---|
| NPI (billing provider) | Who billed for the service |
| NPI (servicing provider) | Who performed the service |
| HCPCS procedure code | What they did |
| Month/year | When (2018-2024) |
| Beneficiary count | How many unique patients for that procedure in that month |
| Claim count | How many claims |
| Total spending | Dollars paid |

Covers both fee-for-service AND managed care Medicaid claims.

**What it does NOT have (critical for pain medicine):**

| Missing Field | What We Lose |
|---|---|
| ICD-10 diagnosis codes | Cannot link a procedure to the underlying pain condition. Cannot tell if an epidural was for lumbar radiculopathy vs. spinal stenosis. Cannot assess appropriateness. |
| NDC drug codes | Cannot see opioid prescriptions, medication management, or multimodal therapy. Cannot measure AAPM opioid therapy guideline adherence at all. |
| Temporal sequencing | Data is aggregated by provider + procedure + month. Cannot determine if conservative care was tried before interventional escalation. |
| Patient-level linkage | Cannot track individual patient treatment journeys or count procedures per patient. |
| Prior authorization data | Cannot see if procedures were pre-authorized or denied. |

**Note:** This dataset was temporarily unavailable as of late March 2026 while CMS makes improvements. Check back at the source URL.


### Dataset 3: NPPES NPI Registry

Source: https://npiregistry.cms.hhs.gov/ (API)

Identifies every pain medicine provider by NPI, taxonomy code, practice address, and organizational affiliation. Free, always available.

**Pain medicine taxonomy codes (final selection):**

| Taxonomy Code | Description | Scope |
|---|---|---|
| 208VP0014X | Interventional Pain Medicine | Subspecialty — providers who primarily perform interventional procedures |
| 208VP0000X | Pain Medicine | General pain medicine — may be interventional, medical, or both |
| 2084P0800X | Psychiatry & Neurology - Pain Medicine | Neurologists/psychiatrists with pain subspecialty |
| 2081P2900X | Physical Medicine & Rehabilitation - Pain Medicine | PM&R physicians who subspecialize in pain |

> **DECIDED:** These four taxonomy codes define the pain medicine peer cohort. See "Peer Cohort Definition" in Part B for rationale.


### What These Three Files Give Us

| We Can See | We Cannot See |
|---|---|
| Which HCPCS codes a pain provider bills | Why they performed a specific procedure (no diagnosis) |
| How often they bill each code (volume) | What medications they prescribe (no Rx data) |
| How many patients per procedure | Whether conservative care preceded interventional care |
| Whether they use image guidance with injections | Individual patient treatment timelines |
| Their procedure-to-visit ratio | Whether procedures were medically necessary for the specific patient |
| Which types of injections/blocks they perform | Patient outcomes or pain scores |
| Their practice location in Massachusetts | Prior authorization outcomes |


## 2. The Guideline Landscape: AAPM and ASIPP

Pain medicine has two major professional society guideline bodies relevant to this scoring effort. Unlike pediatrics (which had one unified body in AAP/Bright Futures), these two organizations cover **overlapping but distinct scopes**.


### AAPM (American Academy of Pain Medicine)

**Scope:** Broad pain medicine — covers the full spectrum from assessment through multimodal treatment, with significant focus on opioid therapy and comprehensive pain management.

**Key guideline areas:**

| Guideline Area | Core Recommendations | Scorable from Claims? |
|---|---|---|
| **Opioid therapy for chronic non-cancer pain** | Risk assessment before prescribing, informed consent, treatment agreements, monitoring, dose limits, naloxone co-prescribing | **No.** Requires Rx data (NDC codes) which we do not have. Cannot see prescriptions, doses, or co-prescribing patterns. |
| **Multimodal/multidisciplinary pain care** | Combine pharmacological, interventional, psychological, and physical therapy approaches; avoid monotherapy | **Partially.** We can see if a provider bills E/M visits AND procedures (suggesting multimodal approach) vs. procedures only. But we cannot see referrals to PT, psychology, or complementary medicine. |
| **Pain assessment and documentation** | Standardized pain assessment, functional outcome measurement, psychological screening | **No.** Assessment and documentation are clinical activities not captured in procedure codes. No screening code equivalent to pediatric 96127 exists for pain-specific assessment tools. |
| **Methadone safety** | ECG monitoring before and during methadone therapy, dose titration protocols | **No.** Requires Rx data and linked diagnostic testing. |
| **Responsible opioid prescribing** | PDMP checks, urine drug testing, regular reassessment | **Partially.** We can see urine drug testing codes (80305-80307, G0480-G0483) if billed by the pain provider. Cannot see PDMP checks (not a billable event). |

**Bottom line for AAPM:** Most AAPM guidelines center on medication management and opioid prescribing — domains that are **almost entirely invisible in claims data without NDC drug codes.** The few scorable elements are limited proxies.


### ASIPP (American Society of Interventional Pain Physicians)

**Scope:** Specifically interventional pain procedures — epidural injections, facet joint interventions, sacroiliac joint procedures, disc interventions, nerve blocks, neuromodulation (spinal cord stimulation), and regenerative medicine.

**Key guideline areas:**

| Guideline Area | Core Recommendations | Scorable from Claims? |
|---|---|---|
| **Epidural steroid injections** | Fluoroscopic guidance required, frequency limits (typically no more than 4-6/year per region), documented failure of conservative care before escalation | **Partially.** We CAN see if fluoroscopy/image guidance codes (77003, 77012) are billed alongside injection codes. We CANNOT see frequency per patient (no patient-level data) or whether conservative care was tried first. |
| **Facet joint interventions** | Diagnostic blocks before therapeutic ablation (radiofrequency), comparative local anesthetic blocks (dual blocks), image guidance required | **Partially.** We CAN see if a provider bills both diagnostic block codes (64490-64495) and ablation codes (64633-64636), and whether the ratio is clinically sensible. We CANNOT confirm the block-before-ablation sequence happened for the same patient. |
| **Sacroiliac joint interventions** | Image guidance required, diagnostic injection before ablation, limited frequency | **Partially.** Same logic as facet joints — we can check for image guidance co-billing and diagnostic-to-therapeutic ratios. |
| **Spinal cord stimulation** | Trial before permanent implant, psychological evaluation, appropriate patient selection | **Partially.** We CAN see if a provider bills trial codes (63650) and permanent implant codes (63685) and whether the trial-to-implant ratio is reasonable. We CANNOT confirm psychological evaluation happened. |
| **Regenerative medicine (PRP, stem cell)** | Evidence-based indications only, not for all pain conditions | **Limited.** These codes (0232T, 0481T) are often not covered by Medicare/Medicaid, so they may not appear in claims data at all. |
| **Opioid guidelines (ASIPP version)** | Conservative prescribing, risk stratification, monitoring | **No.** Same limitation as AAPM — requires Rx data. |

**Bottom line for ASIPP:** ASIPP guidelines are more scorable than AAPM because interventional procedures generate specific HCPCS codes. However, the most important clinical requirement — **appropriate patient selection and sequential escalation** — is invisible without diagnosis codes and patient-level tracking.


## 3. What's Scorable vs. Not Scorable

This is the most important table in this document. It determines the boundaries of what we can and cannot measure.

### Scorable Domains (What We CAN Build Scores For)

| Domain | What We Can Measure | Guideline Source | Confidence Level |
|---|---|---|---|
| **Image Guidance Compliance** | Whether fluoroscopy/CT guidance codes are billed alongside injection/block procedures | ASIPP (all interventional guidelines require image guidance) | **Moderate.** Co-billing of guidance codes is a strong proxy. Absence could mean the provider doesn't use guidance OR that the facility bills it separately. |
| **Diagnostic-Before-Therapeutic Ratios** | Whether a provider performs diagnostic blocks before proceeding to ablation/neurotomy (at the aggregate level) | ASIPP (facet joint, SI joint guidelines) | **Low-Moderate.** We can see if a provider bills both diagnostic and therapeutic codes and whether the ratio is plausible. We cannot confirm sequencing for individual patients. |
| **Trial-Before-Permanent Ratios (Neuromodulation)** | Whether SCS trial codes appear before permanent implant codes, and at what ratio | ASIPP (spinal cord stimulation guidelines) | **Moderate.** A provider who bills 10 permanent implants and 0 trials is a clear red flag. |
| **Procedure Mix / Multimodal Practice Pattern** | Whether a provider's billing reflects a mix of E/M visits, injections, and other modalities vs. procedures-only | AAPM (multimodal care), ASIPP (comprehensive management) | **Low-Moderate.** Broad proxy. A provider who bills 95% procedures and 5% E/M visits has a very different practice pattern than one at 50/50. This is not a direct guideline measure but reflects the philosophy of both bodies. |
| **Urine Drug Testing** | Whether providers who perform interventional procedures also bill for UDT (monitoring for patients on opioids) | AAPM, ASIPP (opioid monitoring guidelines) | **Low.** UDT may be billed by a different provider (PCP, lab). Presence is a positive signal; absence is not necessarily a negative signal. |
| **E/M Complexity Distribution** | Whether evaluation and management visits reflect appropriate complexity for pain medicine (typically higher complexity — 99214/99215 — given chronic pain management) | General clinical standards | **Moderate.** Pain medicine E/M visits are expected to be higher complexity than primary care. The distribution is informative but not directly tied to a specific AAPM/ASIPP guideline. |

### Not Scorable (What We CANNOT Build Scores For)

| Guideline Area | Why It's Not Scorable | What Would Be Needed |
|---|---|---|
| **Opioid prescribing appropriateness** | No Rx/NDC data in claims files | CMS Part D prescriber file (available but separate), state PDMP data |
| **Conservative care before intervention** | Cannot track treatment sequence — no patient-level temporal data | Patient-level linked claims with dates |
| **Procedure frequency per patient** | Data is aggregated by provider, not by patient | Patient-level claims |
| **Diagnostic accuracy / patient selection** | No diagnosis codes in Medicaid file; Medicare has specialty but not procedure-linked diagnosis | Linked diagnosis-procedure data |
| **Pain assessment and functional outcome measurement** | No procedure codes for pain assessment tools (unlike pediatric screening codes like 96110/96127) | Clinical registry data or EHR data |
| **Psychological evaluation before implants** | Psych eval may be billed by a different provider; no way to link to the pain provider's patient | Cross-provider patient-level linkage |
| **Naloxone co-prescribing** | Requires Rx data | Part D prescriber file |
| **PDMP compliance** | PDMP checks are not billable events | State PDMP audit logs |
| **Treatment agreement / informed consent** | Documentation-level activity, not captured in claims | EHR/chart audit |
| **Dose limits and tapering protocols** | Requires Rx data with dosage information | Part D data with dose/quantity fields |

> **Transparency note:** The "Not Scorable" list is substantially longer than the "Scorable" list. This is an honest reflection of pain medicine guidelines' reliance on clinical context (diagnosis, treatment sequence, medication data) that aggregated claims data does not provide. The scorable domains represent **utilization pattern proxies**, not direct clinical quality measures. All scores produced from this methodology are **Tier 2 (proxy/utilization measures)**.


---

# PART B: THE LOGIC

---


## Peer Cohort Definition

### The Taxonomy Code Decision

Pain medicine is not like pediatrics, where one taxonomy code (208000000X) captures the vast majority of general pediatricians. Pain medicine providers are fragmented across multiple parent specialties and subspecialty codes.

**Option A: Narrow cohort — Interventional Pain Medicine only**

| Filter | Value |
|---|---|
| Taxonomy code | 208VP0014X (Interventional Pain Medicine) |
| State | Massachusetts |
| Entity type | Type 1 (Individual) |
| Minimum volume | TBD (see below) |

- **Pro:** Homogeneous group. All providers are interventional pain specialists. Billing patterns should be comparable.
- **Con:** Smaller cohort. Massachusetts may have fewer than 30-50 providers with this specific taxonomy code, triggering national fallback.

**Option B: Broad cohort — All pain medicine taxonomy codes**

| Filter | Value |
|---|---|
| Taxonomy codes | 208VP0014X, 208VP0000X, 2084P0800X, 2081P2900X |
| State | Massachusetts |
| Entity type | Type 1 (Individual) |
| Minimum volume | TBD |

- **Pro:** Larger cohort. More likely to reach the 30-50 provider minimum at the state level.
- **Con:** Mixes interventional and non-interventional pain providers. A non-interventional pain physician (primarily medication management) will have a fundamentally different billing pattern than an interventional pain specialist. Comparing them directly is clinically questionable.

**✓ DECISION: Option B selected.** Final taxonomy codes: 208VP0014X, 208VP0000X, 2084P0800X, 2081P2900X.

**Option C: Stratified cohort — Score interventional and non-interventional separately**

- **Pro:** Clinically appropriate. Compares like with like.
- **Con:** Two smaller cohorts. Both may fall below minimum thresholds in Massachusetts.
- **Complexity:** Requires defining a rule to classify providers as interventional vs. non-interventional (could use taxonomy code OR a billing-based rule, e.g., >X% of claims are procedural codes).

> **DECISION:** We are using **Option B (broad cohort) with a billing-based stratification flag** — the five selected pain medicine taxonomy codes (208VP0014X, 208VP0000X, 2084P0800X, 2081P2900X) are included, and each provider gets an `interventional_flag` based on whether >40% of their total services are procedural (injection/block/implant) codes. Guideline concordance scoring uses this flag to apply appropriate benchmarks.


### Massachusetts State Cohort Parameters

| Parameter | Value | Rationale |
|---|---|---|
| Geographic scope | Massachusetts (state-level) | Default per methodology. MA has specific practice patterns and regulations. |
| National fallback | If MA cohort < 30 providers | Use national peer cohort with MA providers flagged |
| Minimum total services | 50 in the measurement year | Excludes inactive/incidental providers |
| Minimum Medicare services | 50 (for Medicare-based metrics) | Pain medicine is Medicare-dominant; this is a low bar |
| Minimum Medicaid services | 30 (for Medicaid-based metrics) | Lower than pediatrics (100) because pain medicine Medicaid volume is lower |
| Entity type | Type 1 NPI (Individual) | Excludes group/facility NPIs |

> **ASSUMPTION:** The minimum Medicaid threshold of 30 is an estimate. The actual distribution of Medicaid volume among MA pain medicine providers should be examined before setting this floor. If most pain providers have <30 Medicaid services, this threshold may need to drop further or Medicaid metrics may need to be deprioritized.


## Scorable Domains and Measures

Based on the scorability analysis in Part A, we define **four clinical domains** for pain medicine guideline concordance. This is fewer than pediatrics (which had five) because more of pain medicine's guideline landscape falls into the "not scorable" category.


### Domain 1: Image Guidance Compliance

**Guideline basis:** ASIPP guidelines universally recommend fluoroscopic or CT guidance for interventional spine procedures. This is one of the clearest, most measurable quality signals in pain medicine.

**What it measures:** For each provider, what proportion of their interventional procedures include a co-billed image guidance code?

**Relevant procedure codes (interventional spine):**

| Code Range | Description |
|---|---|
| 62320-62327 | Epidural/subarachnoid injections (cervical, thoracic, lumbar, sacral) |
| 64490-64495 | Facet joint injections / medial branch blocks (diagnostic) |
| 64633-64636 | Facet joint radiofrequency ablation / neurotomy |
| 27096 | Sacroiliac joint injection |
| 64451 | SI joint neurotomy |
| 62380 | Endoscopic decompression |
| 63650 | Spinal cord stimulator trial lead placement |
| 63685 | Spinal cord stimulator permanent implant |

**Image guidance codes:**

| Code | Description |
|---|---|
| 77003 | Fluoroscopic guidance for needle placement |
| 77012 | CT guidance for needle placement |

> **Note:** Ultrasound guidance (76942) is **excluded** for spine procedures. For spine interventions specifically, ultrasound is generally considered inferior to fluoroscopy or CT — some guidelines do not endorse it for certain injections at all. Counting 76942 as equivalent to 77003/77012 would overcount "guideline-concordant" procedures and potentially reward lower-standard practice.

**Scoring logic:**

```
if total_interventional_procedures < 10:
  score = null  # Insufficient volume — do not score this domain
else:
  image_guided_procedures = count of services where an interventional spine code
                            AND an image guidance code (77003 or 77012 only)
                            are billed by the same NPI

  total_interventional_procedures = count of all interventional spine code services
                                    billed by the NPI

  image_guidance_rate = image_guided_procedures / total_interventional_procedures

  score = percentile_rank(image_guidance_rate, peer_cohort) * 100
```

**Limitations and assumptions:**

| Limitation | Impact |
|---|---|
| Image guidance may be billed separately by the facility | Provider's rate would appear artificially low even if guidance was used. **This is the biggest confounder.** Facility-based providers may have guidance billed under the facility NPI, not the physician NPI. |
| Some procedures have guidance bundled into the code | Newer CPT codes (e.g., 64490-64495 as revised) may include imaging guidance in the primary code. The image guidance code would not be separately billable. |
| Ultrasound guidance excluded for spine | 76942 is not counted as guideline-concordant guidance for spine procedures. This is a deliberate decision — ultrasound is generally considered inferior to fluoroscopy/CT for spine interventions. |
| Low-volume instability | Providers with very few interventional procedures have volatile rates. A minimum of 10 interventional procedures is required to score this domain. |
| 64999 excluded | Unlisted procedure codes are a catch-all with no reliable way to determine whether image guidance was clinically indicated. Excluded to avoid inflating the denominator with unclassifiable procedures. |
| Place of service matters | Office (11) vs. ASC (24) vs. hospital outpatient (22) affects who bills the guidance component. |

> **DECISIONS:** (1) Only 77003 (fluoroscopy) and 77012 (CT) count as image guidance — 76942 (ultrasound) is excluded for spine procedures as clinically contested. (2) Minimum 10 interventional procedures required to score this domain — below that, the rate is too volatile. (3) 64999 (unlisted procedure) is excluded from the procedure denominator as too noisy. We acknowledge that facility-billed guidance will cause undercounting for some providers. A future refinement could incorporate place-of-service data to adjust expectations (lower guidance co-billing rate expected for facility-based providers).


### Domain 2: Diagnostic-Before-Therapeutic Practice Pattern

**Guideline basis:** ASIPP guidelines for facet joint and sacroiliac joint interventions require diagnostic blocks with comparative local anesthetic (dual blocks) before proceeding to therapeutic radiofrequency ablation. This is a foundational quality principle in interventional pain — you confirm the pain source before you destroy the nerve.

**What it measures:** At the aggregate provider level, is the ratio of diagnostic procedures to therapeutic procedures consistent with the guideline expectation that diagnostic procedures should precede therapeutic ones?

**Relevant code pairs:**

| Diagnostic Code | Therapeutic Code | Body Region |
|---|---|---|
| 64490-64495 (medial branch blocks) | 64633-64636 (radiofrequency neurotomy) | Facet joints (cervical, thoracic, lumbar) |
| 27096 (SI joint injection - diagnostic) | 64451 (SI joint neurotomy) | Sacroiliac joint |
| 63650 (SCS trial) | 63685 (SCS permanent implant) | Spinal cord stimulation |

**Expected ratios (from ASIPP guidelines):**

- **Facet joint:** ASIPP recommends dual comparative blocks (two separate diagnostic injections with different local anesthetics) before ablation. At the provider level, we would expect the diagnostic block volume to be **at least 1.5-2x the ablation volume** (since each ablation patient should have had 2+ diagnostic blocks, minus patients who had diagnostic blocks but did NOT proceed to ablation because the blocks were negative).
- **SCS:** Every permanent implant should be preceded by a trial. Trial-to-implant ratio should be **>= 1.0** (since some trials are unsuccessful and do not proceed to permanent implant).

**Scoring logic:**

```
For each diagnostic-therapeutic pair:
  diagnostic_volume = total services for diagnostic codes
  therapeutic_volume = total services for therapeutic codes

  if therapeutic_volume == 0:
    ratio = neutral (provider doesn't do this procedure type)
  else:
    ratio = diagnostic_volume / therapeutic_volume

  if ratio >= expected_minimum:
    pair_score = 100
  elif ratio >= expected_minimum * 0.5:
    pair_score = 70  (below guideline but not absent)
  else:
    pair_score = 30  (well below guideline expectation)

domain_score = weighted average of pair_scores for all pairs where
               therapeutic_volume > 0
```

**Limitations and assumptions:**

| Limitation | Impact |
|---|---|
| Cannot confirm patient-level sequencing | A provider could bill diagnostic blocks for Patient A and ablations for Patient B — the ratio looks correct but the actual sequencing is unknown. |
| Diagnostic blocks may be performed by a referring provider | The pain specialist doing the ablation may not be the one who performed the diagnostic block. This would make the specialist's ratio appear low even if the diagnostic step was completed. |
| Dual block requirement specifically | ASIPP recommends TWO diagnostic blocks (comparative). We can see total diagnostic block volume but cannot confirm that two separate blocks were done per patient before ablation. |
| SI joint diagnostic vs. therapeutic coding | 27096 is used for both diagnostic and therapeutic SI joint injections. Without a modifier or diagnosis context, we cannot always distinguish. |

> **ASSUMPTION:** We use the aggregate ratio as a proxy for guideline-concordant sequencing. Providers with very low diagnostic-to-therapeutic ratios (e.g., many ablations but almost no diagnostic blocks) are flagged as potentially non-concordant. We acknowledge this is an imperfect measure and explicitly note that per-patient sequencing cannot be confirmed.


### Domain 3: Multimodal Practice Pattern

**Guideline basis:** Both AAPM and ASIPP emphasize that pain management should be multimodal — combining evaluation and management (cognitive care), interventional procedures, and coordination with other modalities (physical therapy, behavioral health). Neither body endorses a "procedures-only" practice pattern.

**What it measures:** Does the provider's billing reflect a mix of E/M visits and procedures, suggesting comprehensive pain management rather than a procedure mill?

**Relevant code categories:**

| Category | Codes | What It Represents |
|---|---|---|
| E/M visits (new patient) | 99201-99205 | Initial evaluations, consultations |
| E/M visits (established) | 99211-99215 | Follow-up visits, ongoing management |
| Interventional procedures | 62320-62327, 64490-64495, 64633-64636, 27096, 64451, 63650, 63685, etc. | Injections, blocks, ablations, implants |
| Urine drug testing | 80305-80307, G0480-G0483 | Monitoring patients on controlled substances |
| Psychological screening/testing | 96127, 96130-96139 | Behavioral health assessment (if billed by pain provider) |

**Scoring logic:**

```
em_ratio = total_em_services / total_all_services
procedure_ratio = total_procedural_services / total_all_services
udt_flag = 1 if any UDT codes billed, 0 if none

# Expected: a balanced practice bills both E/M and procedures
# Pure procedure practices (em_ratio < 0.15) score lower
# Pure E/M practices are not penalized (may be non-interventional)

if interventional_flag == true:
  balance_score = percentile_rank(em_ratio, interventional_peer_cohort) * 100
  # Higher E/M ratio among interventionalists = more guideline-concordant
else:
  balance_score = 50 (neutral — non-interventional providers are expected
                       to be E/M heavy)

udt_bonus = 5 if udt_flag == 1 else 0
# Small bonus for evidence of monitoring; not penalized for absence
# because UDT may be billed by another provider

domain_score = min(balance_score + udt_bonus, 100)
```

**Limitations and assumptions:**

| Limitation | Impact |
|---|---|
| E/M visits may be billed by a different provider in the same group | A group practice may have one physician doing procedures and another doing consultations. The proceduralist's E/M ratio would appear low. |
| Cannot see referrals | A provider who refers every patient to PT and psychology is doing multimodal care — but this is invisible in their own claims. |
| UDT may be billed by the lab or PCP | Absence of UDT codes does not mean the provider isn't monitoring. |
| Non-interventional providers | This metric is most meaningful for interventional providers. Non-interventional pain physicians will naturally have high E/M ratios regardless of quality. |

> **ASSUMPTION:** We apply this domain primarily to providers flagged as interventional (>40% procedural billing). For non-interventional providers, this domain receives a neutral score of 50, which effectively removes it from influencing their composite.


### Domain 4: Procedure Diversity and Appropriateness Proxies

**Guideline basis:** ASIPP guidelines cover a range of interventional techniques. A provider who performs only one type of procedure (e.g., exclusively epidural injections) for all patients may not be practicing in accordance with the full scope of evidence-based interventional pain medicine, which recognizes that different pain generators require different treatments.

**What it measures:** Does the provider's procedural repertoire reflect the range of evidence-based interventional techniques, rather than an over-concentration on a single procedure type?

**Procedure categories:**

| Category | Codes | What It Represents |
|---|---|---|
| Epidural injections | 62320-62327 | Steroid injections for radicular pain |
| Facet joint interventions | 64490-64495, 64633-64636 | Diagnostic blocks and ablation for facet-mediated pain |
| Sacroiliac joint interventions | 27096, 64451 | SI joint injections and ablation |
| Peripheral nerve blocks | 64400-64450 | Targeted nerve blocks for specific pain conditions |
| Trigger point injections | 20552-20553 | Myofascial pain treatment |
| Neuromodulation | 63650, 63685, 63661-63664, 64590 | Spinal cord stimulation and peripheral nerve stimulation |
| Joint injections | 20600-20611 | Intra-articular injections |
| Vertebral augmentation | 22510-22515 | Vertebroplasty/kyphoplasty for compression fractures |

**Scoring logic:**

```
categories_billed = count of distinct procedure categories with > 0 services
total_categories = 8 (or fewer if some categories are not relevant to
                       the provider's declared scope)

# Concentration ratio: what % of procedural volume is the single
# most-billed category?
top_category_share = services_in_top_category / total_procedural_services

diversity_score = percentile_rank(categories_billed, peer_cohort) * 50
                + (1 - top_category_share) * 50
# 50% weight on breadth, 50% weight on not being over-concentrated

domain_score = diversity_score
```

**Limitations and assumptions:**

| Limitation | Impact |
|---|---|
| Subspecialization is legitimate | A provider who exclusively does neuromodulation (SCS) is not necessarily lower quality — they may be a highly specialized implanter. This score should not penalize legitimate subspecialization. |
| Practice setting affects procedure mix | A provider in a spine surgery center may do different procedures than one in a standalone pain clinic. |
| Volume thresholds | A provider who bills 1 claim in 6 categories is not demonstrating diversity — they may be dabbling. Minimum volume per category should be considered. |

> **ASSUMPTION:** Providers who bill >80% of their procedural volume in neuromodulation codes (63650, 63685, etc.) are flagged as `neuromodulation_specialist` and receive a neutral score for this domain, to avoid penalizing legitimate subspecialization. The same logic should be considered for other highly specialized procedural niches. **The specific threshold (80%) and the list of recognized subspecializations need validation.**


## Composite Guideline Concordance Score

```
For interventional providers (interventional_flag = true):
  composite = (image_guidance * 0.35)
            + (diagnostic_therapeutic_ratio * 0.30)
            + (multimodal_practice * 0.20)
            + (procedure_diversity * 0.15)

For non-interventional providers (interventional_flag = false):
  composite = (multimodal_practice * 0.50)
            + (udt_presence * 0.50)
  # Very limited scoring — most guideline concordance measures
  # require Rx data we don't have
```

**Weight justification:**

| Domain | Weight (Interventional) | Rationale |
|---|---|---|
| Image Guidance | 35% | Most directly measurable, most clearly tied to ASIPP guidelines. Image guidance is a binary quality marker — you either use it or you don't. |
| Diagnostic-Before-Therapeutic | 30% | Core ASIPP principle. The block-before-ablation paradigm is a foundational quality standard. |
| Multimodal Practice | 20% | Important but harder to measure accurately. Captures AAPM's emphasis on comprehensive care. |
| Procedure Diversity | 15% | Supplementary signal. Meaningful at extremes (a provider doing ONLY epidurals) but less discriminating in the middle range. |

> **ASSUMPTION:** These weights are initial estimates based on clinical importance and data quality. They should be reviewed with a pain medicine clinician and adjusted based on how well each domain discriminates between providers in the actual Massachusetts data.

> **IMPORTANT — Non-interventional gap:** For non-interventional pain providers (primarily medication management), the guideline concordance score is severely limited by the absence of Rx data. The composite score for these providers should be interpreted with caution and flagged as `low_confidence`. If CMS Part D prescriber data is incorporated in the future, the non-interventional scoring model should be substantially expanded.


---

# PART C: BUSINESS RULES

---


## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has no interventional procedure codes | Do not score Domains 1, 2, or 4. Score only Domain 3 (multimodal). Flag as `non_interventional`. |
| Provider has procedures but no image guidance codes | Score Domain 1 as 0 (or per the percentile distribution). Do not auto-penalize — investigate whether facility-billing explains the absence. |
| Provider has ablation codes but no diagnostic block codes | Score Domain 2 as low (30). This is a meaningful signal — ablation without documented diagnostic workup. |
| Provider has only one procedure category | Score Domain 4 as low. Flag for review but do not auto-penalize if the provider is a recognized subspecialist. |
| Provider has <50 total services | Do not score. Exclude from peer cohort. |
| No Medicaid data available | Score from Medicare data only. Flag as `medicare_only_data`. |

## Subspecialist Handling

Pain medicine subspecialists who should be flagged and potentially scored separately:

| Subspecialty Flag | Detection Rule | Handling |
|---|---|---|
| `neuromodulation_specialist` | >80% of procedural volume in SCS/PNS codes | Neutral score for Domain 4 (diversity). Score all other domains normally. |
| `non_interventional` | <10% of total services are procedural codes | Score only Domain 3. Domains 1, 2, 4 get neutral (50). Flag composite as `low_confidence`. |
| ~~`anesthesiology_primary`~~ | ~~Taxonomy 207L00000X~~ | **No longer applicable.** General anesthesiology (207L00000X) is not in the final taxonomy list, so these providers are excluded by default. |

> **ASSUMPTION:** The subspecialist detection rules above are heuristic. The thresholds (80%, 10%, 50%) should be validated against the actual distribution of MA providers before implementation.


---

# PART C-2: MASSACHUSETTS-SPECIFIC REGULATORY CONTEXT

---

Massachusetts has some of the most stringent pain management regulations in the United States. While these are **regulatory requirements, not clinical guidelines from AAPM/ASIPP**, they shape the practice environment in which MA pain providers operate and provide additional context for interpreting quality scores.

**This section is informational context, not scored.** We include it because:
1. MA regulations may affect billing patterns (e.g., mandatory PDMP checks may correlate with UDT billing patterns)
2. Reviewers of quality scores should understand the regulatory backdrop
3. Some MA requirements overlap with AAPM/ASIPP recommendations, reinforcing their importance

### Key Massachusetts Pain Management Regulations

| Regulation | Requirement | Measurable from Claims? |
|---|---|---|
| **MA Prescription Monitoring Program (MassPAT)** | Mandatory PDMP check before prescribing Schedule II-III controlled substances. Required at initial prescribing and every visit thereafter. | **No.** PDMP checks are not billable. |
| **7-day opioid limit for acute pain** (MA Chapter 55 / 105 CMR 700.000) | First-time opioid prescriptions for acute pain limited to 7-day supply. | **No.** Requires Rx data with quantity/days supply. |
| **CME requirements for opioid prescribing** | MA requires specific opioid-related CME for prescribers. | **No.** Credentialing data, not claims. |
| **Prior authorization for certain pain procedures** | MassHealth (MA Medicaid) requires PA for some interventional pain procedures. | **No.** PA decisions not in claims. But PA requirements may suppress procedure volumes for Medicaid patients, which could affect Medicaid-based metrics. |
| **Board of Registration in Medicine (BORIM) guidelines** | MA BORIM has issued guidance on appropriate pain management, including documentation requirements for chronic opioid therapy. | **No.** Documentation-level requirements. |
| **Informed consent requirements** | MA requires specific informed consent for opioid therapy, including discussion of risks and alternatives. | **No.** Documentation-level. |

### How MA Regulations May Affect Claims Data Patterns

| Regulatory Factor | Potential Claims Data Impact |
|---|---|
| Strict opioid prescribing environment | Pain providers in MA may perform MORE interventional procedures relative to states with looser opioid prescribing (substitution effect). This could make MA providers appear more procedure-heavy than national peers. |
| MassHealth PA requirements | Medicaid patients may have lower procedural volumes due to PA barriers. This is a payer-access issue, not a quality signal. |
| Practice migration | Some pain practices may shift toward non-opioid, non-interventional modalities (PT, behavioral, integrative) that are invisible in claims data. |

> **Key takeaway:** When comparing MA pain providers to a national peer cohort, be aware that MA's regulatory environment may systematically shift practice patterns — particularly toward higher interventional and lower opioid volumes. This is not a quality difference but a regulatory one. State-level peer cohorts partially control for this, which is another reason to prefer state-level scoring.


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

This guideline concordance score is one of five dimensions in the pain medicine quality scoring framework. Each dimension catches different quality signals.

| Quality Problem | Caught by Guideline Concordance? | Caught by Other Dimensions? |
|---|---|---|
| Provider never uses image guidance for spine injections | **Yes** — Domain 1 | Peer Comparison (unusual code mix), Billing Quality (missing expected co-codes) |
| Provider does ablations without diagnostic blocks | **Yes** — Domain 2 | Volume Adequacy (if diagnostic block volume is implausibly low) |
| Provider bills only procedures, no E/M visits | **Yes** — Domain 3 | Peer Comparison (abnormal code distribution), Billing Quality (E/M distribution) |
| Provider does only one type of procedure | **Yes** — Domain 4 | Peer Comparison (narrow code coverage) |
| Provider charges 3x more than peers | No | Billing Quality |
| Provider bills completely different codes for Medicare vs. Medicaid | No | Payer Diversity |
| Provider bills trace amounts of many procedure codes | No | Volume Adequacy |
| Provider's code mix looks nothing like other pain providers | No | Peer Comparison |

**Guideline concordance is most meaningful for interventional providers.** For non-interventional pain medicine providers, the other four dimensions carry more of the quality signal because the clinical guidelines most relevant to their practice (medication management, opioid therapy) are not measurable from claims data.


---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

1. **The biggest gap is diagnosis codes.** Pain medicine quality is fundamentally about treating the right condition with the right intervention. Without ICD-10 diagnosis codes, we cannot assess whether ANY procedure was appropriate for the patient's specific condition. This makes all of our scores utilization pattern proxies, not clinical quality measures.

2. **No medication data.** AAPM's core competency is pain pharmacotherapy, including opioid management. We cannot measure any of this. The entire AAPM opioid therapy guideline set is invisible to us.

3. **No patient-level tracking.** The block-before-ablation sequence is a per-patient quality requirement. We measure it at the provider aggregate level, which is a meaningful but imperfect proxy.

4. **Facility billing splits.** Image guidance codes may be billed by the facility, not the physician. This systematically undercounts guidance usage for facility-based providers and could unfairly lower their scores.

5. **Medicaid data limitations.** The Medicaid file lacks diagnosis codes entirely. The Medicare file has some specialty information but not procedure-linked diagnosis. Neither file supports the clinical context needed for appropriateness assessment.

6. **No outcome data.** We cannot measure whether patients got better. Pain scores, functional improvement, return to work — none of this is in claims data.

## Known Biases

1. **Facility vs. office-based providers.** Facility-based providers will appear to have lower image guidance rates due to split billing. Office-based providers may appear to have higher rates. This is a billing artifact, not a quality difference.

2. **Group vs. solo practice.** Group practices may split E/M and procedural work across providers. A proceduralist in a group will have a lower E/M ratio than a solo practitioner who does everything, even if the group's overall care is more comprehensive.

3. **MA regulatory effect.** Massachusetts' strict opioid regulations may systematically shift practice patterns (more procedures, fewer opioid prescriptions) compared to national norms. Using MA state-level peer cohorts controls for this when the cohort is large enough.

4. **Medicare vs. Medicaid population differences.** Medicare pain patients tend to be older with degenerative conditions. Medicaid pain patients may be younger with different pain etiologies (trauma, occupational). Procedure mix may legitimately differ by payer.

5. **New vs. established providers.** A new pain medicine provider building a practice may have a different procedure mix than an established one. Volume thresholds partially address this, but the first 1-2 years of practice data should be interpreted cautiously.

## Update Cadence

- Reference code sets, peer percentiles, and floor thresholds should be **rebuilt annually** as CMS releases new data.
- AAPM and ASIPP guideline updates should be reviewed annually. ASIPP has been actively updating guidelines (major revisions in 2013, 2020, and ongoing). New guidelines may introduce new scorable domains or change expectations for existing ones.
- CPT code changes (especially for interventional pain procedures, which are periodically revised) must be tracked. Code redefinitions can break scoring logic if not updated.


---

# OUTPUT SCHEMA

---

One row per NPI. All scores 0-100.

| Column | Type | Description |
|---|---|---|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | From NPPES |
| `taxonomy_code` | string | Primary taxonomy code from NPPES |
| `state` | string | MA (Massachusetts) |
| `measurement_year` | int | Year of CMS data used |
| `interventional_flag` | boolean | True if >40% of services are procedural codes |
| `neuromodulation_specialist_flag` | boolean | True if >80% of procedural volume is SCS/PNS codes |
| `non_interventional_flag` | boolean | True if <10% of services are procedural codes |
| `total_services` | int | Total services across all codes |
| `total_procedural_services` | int | Total interventional procedure code services |
| `total_em_services` | int | Total E/M code services |
| `image_guidance_rate` | float | Proportion of interventional procedures with co-billed guidance code |
| `image_guidance_score` | float | 0-100, percentile rank among peers |
| `diagnostic_therapeutic_ratio_facet` | float | Diagnostic block volume / ablation volume for facet joints |
| `diagnostic_therapeutic_ratio_si` | float | Diagnostic / therapeutic ratio for SI joint |
| `trial_to_implant_ratio_scs` | float | SCS trial volume / permanent implant volume |
| `diagnostic_therapeutic_score` | float | 0-100, composite of all diagnostic-therapeutic pair scores |
| `em_ratio` | float | E/M services / total services |
| `udt_flag` | boolean | True if any urine drug testing codes billed |
| `multimodal_score` | float | 0-100, multimodal practice pattern score |
| `procedure_categories_billed` | int | Count of distinct procedure categories with >0 services |
| `top_category_share` | float | Proportion of procedural volume in single most-billed category |
| `procedure_diversity_score` | float | 0-100, procedure diversity score |
| `guideline_concordance_composite` | float | 0-100, weighted composite of all domain scores |
| `confidence_flag` | string | `standard`, `low_confidence` (non-interventional), or `insufficient_data` |
| `peer_cohort_size` | int | Number of providers in the peer comparison group |
| `peer_cohort_scope` | string | `state` or `national_fallback` |
| `data_sources_used` | string | `medicare_only`, `medicaid_only`, or `both` |


---

# APPENDIX: QUESTIONS REQUIRING CLINICAL INPUT

---

The following decisions were made with assumptions that should be validated by a pain medicine clinician or domain expert before implementation:

| # | Question | Current Assumption | Why It Matters |
|---|---|---|---|
| 1 | ~~Which taxonomy codes define the pain medicine peer cohort?~~ | **RESOLVED.** Option B selected: 208VP0014X, 208VP0000X, 2084P0800X, 2081P2900X with billing-based stratification. | Determines who is compared to whom. Wrong cohort = meaningless percentile ranks. |
| 2 | What is the expected diagnostic-to-therapeutic ratio for facet interventions? | >= 1.5-2.0 based on dual block recommendation | If the clinical standard is single diagnostic block (not dual), the expected ratio drops to ~1.0. |
| 3 | Should the 40% procedural threshold for `interventional_flag` be higher or lower? | 40% of total services | Determines which providers are scored on interventional guideline domains. |
| 4 | Are there other legitimate subspecializations beyond neuromodulation that should get neutral diversity scores? | Only neuromodulation flagged | Intrathecal pump specialists, regenerative medicine specialists, etc. may also be highly concentrated. |
| 5 | Should image guidance scoring account for procedures where guidance is bundled into the primary code? | Currently not accounted for | CPT code revisions may have bundled guidance into some procedure codes, making separate guidance co-billing impossible. |
| 6 | What minimum volume per procedure category constitutes "real" practice vs. incidental billing? | Not yet defined (uses >0 threshold) | A provider billing 1 SCS trial is different from one billing 20. |
| 7 | How should CMS Part D prescriber data be incorporated if/when added? | Not currently included | Would unlock AAPM opioid therapy guideline scoring and dramatically improve non-interventional provider assessment. |
