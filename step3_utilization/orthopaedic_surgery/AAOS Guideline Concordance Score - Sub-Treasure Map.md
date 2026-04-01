# Orthopaedic Surgery — AAOS Guideline Concordance Score: A Sub-Treasure Map

## What This Document Does

This score measures how well an orthopaedic surgeon's billing pattern aligns with the clinical practice guidelines published by the **American Academy of Orthopaedic Surgeons (AAOS)**. It answers: *Does this provider deliver care consistent with evidence-based orthopaedic standards, as visible through claims data?*

Source: [AAOS Clinical Practice Guidelines](https://www.aaos.org/quality/quality-programs/clinical-practice-guidelines/)

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Key Limitation |
|---------|-----------------|----------------|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI, per-HCPCS: service count, beneficiary count, charges, allowed amounts. Medicare is the dominant payer for orthopaedic surgery (older adults = joint replacements, hip fractures, OA). | No diagnosis codes in the aggregated file. Cannot link procedure to specific indication. |
| **CMS Medicaid Provider Spending** | Per-NPI, per-HCPCS: service count. Covers younger trauma patients, some pediatric ortho. | No diagnosis codes, no charge detail, lower ortho volume than Medicare. |
| **NPPES NPI Registry** | Taxonomy code (207X00000X = Orthopaedic Surgery), subspecialty taxonomy, state, entity type. | Self-reported taxonomy. Some providers may be miscoded. |

### What We Cannot Measure From These Data

- **Diagnosis-specific appropriateness** — We cannot confirm *why* a procedure was done (e.g., was a TKA done for OA vs. rheumatoid arthritis vs. post-traumatic).
- **Non-operative management quality** — Physical therapy referrals, weight management counseling, NSAID prescriptions are invisible in these files.
- **Imaging appropriateness** — X-rays/MRIs ordered by the surgeon are typically billed by radiology facilities, not the surgeon's NPI.
- **Timing and sequencing** — Cannot measure time-to-surgery, conservative trial duration before operative intervention, or follow-up visit cadence.
- **Outcomes** — No readmission, complication, revision, or patient-reported outcome data.
- **Antibiotic prophylaxis** — Rx data not available.

---

## 2. AAOS Clinical Practice Guidelines: Scorability Audit

AAOS publishes 21 clinical practice guidelines across 5 categories. We audit each against our data constraints.

### Upper Extremity Guidelines

| Guideline | Year | Key Procedure Codes | Scorable? | Rationale |
|-----------|------|-------------------|-----------|-----------|
| Management of Rotator Cuff Injuries | 2025 | 29827 (arthroscopic RC repair), 23412 (open RC repair), 29826 (acromioplasty) | **Yes** | Procedure codes are specific to rotator cuff. Can measure surgical volume, technique mix (arthroscopic vs. open), and repair-to-decompression ratio. |
| Management of Carpal Tunnel Syndrome | 2024 | 64721 (CTR open), 29848 (CTR endoscopic) | **Yes** | Pathognomonic procedure codes. Can measure volume and technique preference. |
| Management of Distal Radius Fractures | 2020 | 25607-25609 (ORIF distal radius), 25600-25605 (closed treatment) | **Yes** | Can measure operative vs. non-operative treatment ratio and surgical volume. |
| Management of Glenohumeral Joint OA | 2020 | 23472 (TSA), 23473-23474 (reverse TSA), 29822-29823 (shoulder arthroscopy debridement) | **Yes** | Can measure arthroplasty volume, reverse vs. anatomic TSA ratio. |
| Treatment of Clavicle Fractures | 2022 | 23515 (ORIF clavicle), 23500-23505 (closed treatment) | **Partial** | Can measure ORIF rate. Cannot assess non-operative management quality. |

### Lower Extremity Guidelines

| Guideline | Year | Key Procedure Codes | Scorable? | Rationale |
|-----------|------|-------------------|-----------|-----------|
| Surgical Management of OA of the Knee | 2022 | 27447 (TKA), 27446 (unicompartmental), 29881 (arthroscopic meniscectomy) | **Yes** | Core ortho procedures. Can measure TKA volume, unicompartmental-to-TKA ratio, arthroscopy-before-arthroplasty pattern. |
| Management of OA of the Knee (non-surgical) | 2021 | 20610 (joint injection), J-codes (corticosteroid, hyaluronic acid) | **Partial** | Can measure injection volume. Cannot measure PT referrals, weight counseling, NSAID use. |
| Management of OA of the Hip | 2023 | 27130 (THA), 20610 (hip injection) | **Partial** | Can measure THA volume and injection use. Non-operative management largely invisible. |
| Management of Hip Fractures in Older Adults | 2021 | 27235-27236 (hip pinning), 27125 (hemiarthroplasty), 27130 (THA for fracture) | **Yes** | Procedure codes clearly identify hip fracture management. Can measure surgical approach distribution. |
| Management of ACL Injuries | 2022 | 29888 (ACL reconstruction) | **Yes** | Specific procedure code. Can measure volume. Cannot assess graft choice or rehab protocol. |
| Management of Acute Isolated Meniscal Pathology | 2024 | 29881 (meniscectomy), 29882 (meniscus repair) | **Yes** | Can measure repair-to-meniscectomy ratio (guideline favors repair when possible). |
| Diagnosis and Treatment of Osteochondritis Dissecans | 2023 | 29886-29887 (arthroscopic chondral procedures) | **Partial** | Low volume, less specific codes. |

### Pediatric Orthopaedic Guidelines

| Guideline | Year | Key Procedure Codes | Scorable? | Rationale |
|-----------|------|-------------------|-----------|-----------|
| Detection of Pediatric DDH | 2022 | Limited — screening/bracing, not surgical | **No** | Non-operative management. No distinctive HCPCS codes. |
| Pediatric Diaphyseal Femur Fractures | 2020 | 27244-27245 (IM nailing), 27506 (ORIF femur) | **Partial** | Codes exist but cannot isolate pediatric patients in aggregated data. **ASSUMPTION: Medicare data will not capture pediatric fractures; Medicaid data may but without age stratification.** |
| Pediatric Supracondylar Humerus Fractures | 2011 | 24538 (percutaneous pinning) | **Partial** | Same age limitation as above. |

### Infection Prevention & Control Guidelines

| Guideline | Year | Key Procedure Codes | Scorable? | Rationale |
|-----------|------|-------------------|-----------|-----------|
| PJI Prevention (Dental Procedures) | 2024 | N/A | **No** | Antibiotic prescribing decision; no procedure codes. |
| Diagnosis/Prevention of PJI | 2019 | N/A | **No** | Diagnostic workup and prevention protocols; not procedure-based. |
| Management of Surgical Site Infections | 2018 | N/A | **No** | Process-of-care guideline. SSI is a complication, not a procedure. |

### Trauma Guidelines

| Guideline | Year | Key Procedure Codes | Scorable? | Rationale |
|-----------|------|-------------------|-----------|-----------|
| Acute Compartment Syndrome | 2025 | 27600-27602 (fasciotomy) | **No** | Emergency/complication. Low volume, not attributable to guideline adherence. |
| Limb Salvage or Early Amputation | 2019 | 27590-27598, 27880-27889 (amputation) | **No** | Decision-making guideline. Cannot assess from procedure code alone whether amputation vs. salvage was guideline-concordant. |
| SSI Prevention After Major Extremity Trauma | 2022 | N/A | **No** | Prevention protocol, not procedure-based. |

---

## 3. Scorability Summary

| Category | Total Guidelines | Scorable | Partially Scorable | Not Scorable |
|----------|-----------------|----------|-------------------|--------------|
| Upper Extremity | 5 | 4 | 1 | 0 |
| Lower Extremity | 7 | 5 | 2 | 0 |
| Pediatric | 3 | 0 | 2 | 1 |
| Infection | 3 | 0 | 0 | 3 |
| Trauma | 3 | 0 | 0 | 3 |
| **Total** | **21** | **9** | **5** | **7** |

**Bottom line:** 9 of 21 AAOS guidelines are scorable from free CMS claims data. An additional 5 are partially scorable. The infection, trauma, and pediatric guidelines are largely not scorable due to data constraints.

> **ASSUMPTION:** We treat "partially scorable" guidelines as scorable for their procedural components only, with explicit documentation of what's missing. This gives us 14 guidelines contributing signal, organized into 4 clinical domains below.

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value |
|-----------|-------|
| Taxonomy code | **207X00000X** (Orthopaedic Surgery) |
| Geographic grouping | State-level (default); national fallback if state cohort < 30 providers |
| Minimum volume threshold | ≥ 50 total Medicare services (ortho is procedure-heavy; lower floor than primary care's visit-based threshold) |
| Entity type filter | Type 1 NPI (individual providers only) |
| Subspecialist handling | Flag and exclude providers with subspecialty taxonomy codes (see below) |

### Subspecialty Taxonomy Codes to Flag

| Taxonomy Code | Subspecialty |
|--------------|-------------|
| 207XS0114X | Orthopaedic Surgery — Sports Medicine |
| 207XS0106X | Orthopaedic Surgery — Hand Surgery |
| 207XP0101X | Orthopaedic Surgery — Pediatric Orthopaedics |
| 207XX0004X | Orthopaedic Surgery — Foot and Ankle |
| 207XX0801X | Orthopaedic Surgery — Spine Surgery |
| 207XT0002X | Orthopaedic Surgery — Trauma |
| 207XR0100X | Orthopaedic Surgery — Adult Reconstructive (Joint Replacement) |

> **ASSUMPTION:** Subspecialists self-reporting these taxonomy codes are excluded from the general orthopaedic peer cohort. A provider reporting only 207X00000X is assumed to be a general orthopaedic surgeon. This is imperfect — many surgeons subspecialize without updating their taxonomy code. **External resource needed:** Cross-referencing with hospital credentialing or board certification data would improve subspecialty identification but is not freely available.

---

## Clinical Domains and Measures

We organize the 9 fully scorable + 5 partially scorable guidelines into **4 clinical domains** natural to orthopaedic surgery practice:

### Domain 1: Joint Replacement & Reconstruction (Weight: 35%)

**Why 35%:** Joint replacement (TKA, THA, TSA) is the highest-volume, highest-cost category in orthopaedic surgery and the area with the most robust AAOS guideline coverage.

**Guidelines mapped:**
- Surgical Management of OA of the Knee (2022)
- Management of OA of the Hip (surgical component, 2023)
- Management of Glenohumeral Joint OA (2020)
- Management of Hip Fractures in Older Adults (2021)

**Measures (from claims data):**

| Measure | HCPCS Codes | What It Captures | Scoring Method |
|---------|-------------|-----------------|----------------|
| TKA volume adequacy | 27447 | Does provider perform enough TKAs to maintain competency? | Percentile rank vs. peer cohort |
| THA volume adequacy | 27130 | Same for total hip | Percentile rank vs. peer cohort |
| TSA/reverse TSA volume | 23472, 23473, 23474 | Shoulder arthroplasty activity | Binary: present/absent + percentile if present |
| Unicompartmental-to-TKA ratio | 27446 / 27447 | Guideline recommends unicompartmental when appropriate; ratio signals surgical judgment | Percentile rank (higher is not always better — flag extremes) |
| Hip fracture surgical approach mix | 27235, 27236, 27125, 27130 | Distribution across pinning, hemiarthroplasty, and THA for fracture | Deviation from peer median distribution |
| Arthroscopy-before-arthroplasty rate | 29881 billed same NPI as 27447 | AAOS advises against routine arthroscopy before TKA in OA patients | Lower rate = more concordant. Percentile rank (inverted). |

**Domain score:** Weighted average of measure percentile ranks. Each measure equally weighted within domain.

### Domain 2: Arthroscopy & Soft Tissue (Weight: 25%)

**Why 25%:** High-volume, high-variability area with strong guideline coverage, particularly around meniscal treatment and rotator cuff repair.

**Guidelines mapped:**
- Management of ACL Injuries (2022)
- Management of Acute Isolated Meniscal Pathology (2024)
- Management of Rotator Cuff Injuries (2025)

**Measures:**

| Measure | HCPCS Codes | What It Captures | Scoring Method |
|---------|-------------|-----------------|----------------|
| ACL reconstruction volume | 29888 | Surgical competency signal | Percentile rank vs. peer cohort |
| Meniscus repair-to-meniscectomy ratio | 29882 / 29881 | AAOS favors repair when possible; higher ratio = more concordant | Percentile rank (higher = better) |
| Rotator cuff repair volume | 29827, 23412 | Practice in this guideline area | Percentile rank |
| Arthroscopic vs. open RC repair ratio | 29827 / (29827 + 23412) | Trend toward arthroscopic approach | Percentile rank |
| Acromioplasty-to-RC-repair ratio | 29826 / (29827 + 23412) | Decompression without repair is scrutinized; ratio contextualizes | Percentile rank |

**Domain score:** Weighted average of measure percentile ranks.

### Domain 3: Fracture Care (Weight: 20%)

**Why 20%:** Core orthopaedic competency but somewhat less guideline-dense from AAOS specifically. Also harder to score precisely because fracture management depends heavily on fracture pattern (which requires diagnosis codes we don't have).

**Guidelines mapped:**
- Management of Distal Radius Fractures (2020)
- Treatment of Clavicle Fractures (2022)
- Pediatric fracture guidelines (partial signal only)

**Measures:**

| Measure | HCPCS Codes | What It Captures | Scoring Method |
|---------|-------------|-----------------|----------------|
| Distal radius ORIF volume | 25607-25609 | Surgical fracture care activity | Percentile rank |
| Distal radius operative-to-nonoperative ratio | 25607-25609 / (25607-25609 + 25600-25605) | Mix of surgical vs. conservative management | Percentile rank (middle of distribution = most concordant) |
| Clavicle ORIF volume | 23515 | Fracture fixation activity | Percentile rank |
| Fracture care breadth | Count of distinct fracture HCPCS codes billed | Generalist fracture competency | Percentile rank |

**Domain score:** Weighted average of measure percentile ranks.

> **ASSUMPTION:** We cannot distinguish pediatric from adult fracture patients in aggregated data. Fracture codes (27244, 24538) may be billed for both populations. Scoring treats all fracture volume uniformly. **This is a known limitation.**

### Domain 4: Non-Operative & Injection Management (Weight: 20%)

**Why 20%:** While less directly procedural, AAOS guidelines for knee and hip OA emphasize appropriate non-operative management before surgical intervention. Injection codes are the primary visible signal.

**Guidelines mapped:**
- Management of OA of the Knee (non-surgical, 2021)
- Management of OA of the Hip (non-surgical component, 2023)

**Measures:**

| Measure | HCPCS Codes | What It Captures | Scoring Method |
|---------|-------------|-----------------|----------------|
| Joint injection volume | 20610, 20611 | Non-operative OA management activity | Percentile rank |
| Injection-to-arthroplasty ratio | 20610 / (27447 + 27130) | Higher ratio suggests conservative management before surgery | Percentile rank (higher = more concordant, to a ceiling) |
| Corticosteroid injection presence | J1030, J1040, J1094 | Appropriate injection agent use | Binary: present/absent |
| Hyaluronic acid injection presence | J7321-J7327 | AAOS guideline is equivocal/against routine HA for knee OA | Flag if HA volume is high relative to peers (inverted scoring) |

> **CRITICAL ASSUMPTION — Hyaluronic Acid Scoring:** AAOS 2021 knee OA guideline provides a **moderate-strength recommendation against** routine hyaluronic acid injections for knee OA. We score high HA-to-corticosteroid ratio as a mild negative signal (yellow flag, not a penalty). This is a guideline-concordance decision that may be controversial. **Recommend external clinical review before finalizing this measure.**

**Domain score:** Weighted average of measure percentile ranks.

---

## Composite Guideline Concordance Score

```
guideline_concordance_score = (
    domain_1_score * 0.35 +   # Joint Replacement & Reconstruction
    domain_2_score * 0.25 +   # Arthroscopy & Soft Tissue
    domain_3_score * 0.20 +   # Fracture Care
    domain_4_score * 0.20     # Non-Operative & Injection Management
)
```

All domain scores are 0–100 (percentile-based). Composite is 0–100.

### Worked Examples

**Provider A — High-volume joint replacement surgeon, state of Florida:**
- Domain 1: TKA top quartile, THA top quartile, good hip fracture mix → 82
- Domain 2: Moderate ACL volume, good meniscus repair ratio → 71
- Domain 3: Low fracture volume (subspecializes in joints) → 45
- Domain 4: Good injection-to-arthroplasty ratio, no HA red flag → 75
- **Composite:** (82 × 0.35) + (71 × 0.25) + (45 × 0.20) + (75 × 0.20) = 28.7 + 17.75 + 9.0 + 15.0 = **70.5**

**Provider B — Community orthopaedist, mixed practice:**
- Domain 1: Moderate arthroplasty volume, reasonable mix → 58
- Domain 2: Good arthroscopy breadth, solid repair ratios → 65
- Domain 3: Strong fracture breadth, moderate volume → 70
- Domain 4: Active injection practice, appropriate agents → 68
- **Composite:** (58 × 0.35) + (65 × 0.25) + (70 × 0.20) + (68 × 0.20) = 20.3 + 16.25 + 14.0 + 13.6 = **64.2**

**Provider C — Sports medicine focus (flagged subspecialist, NOT in general cohort):**
- Would be scored against sports medicine peers if cohort exists.
- If no subspecialty cohort: excluded, no score generated.

---

# PART C: BUSINESS RULES

---

## Composite Formula

See above. Domain weights sum to 100%. Weights reflect:
- Clinical volume and cost impact (joint replacement = highest)
- Guideline coverage density (more guidelines = more measurable signal = more weight)
- Data reliability (procedure codes are more reliable than injection J-codes)

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider has zero volume in a domain | Domain score = **50** (neutral). Do not penalize for subspecialization. |
| Provider has volume in only 1 of 4 domains | Score only that domain; other domains = 50. Flag as "limited scope — interpret with caution." |
| Measure has < 11 beneficiaries (CMS suppression) | Measure excluded from domain. Domain score computed from remaining measures. |
| State cohort < 30 providers | Fall back to national cohort. Flag in output. |

## Subspecialist Handling

- Providers with subspecialty taxonomy codes (see table above) are **excluded** from the general orthopaedic peer cohort.
- Subspecialists are **not penalized** for narrow practice scope — they are simply not scored against general peers.
- Future enhancement: build subspecialty-specific cohorts (e.g., sports medicine, hand surgery) with adapted measure sets.

## Hyaluronic Acid Flag

- HA injection volume in the top quartile of peers: **yellow flag** (reduces Domain 4 score by 10 points, floor 0).
- This is a soft signal, not a hard penalty, because:
  - AAOS recommendation strength is "moderate," not "strong."
  - Some patients and payers still request/cover HA.
  - J-code specificity is imperfect (some J-codes cover multiple products).

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (That Others Catch) |
|-----------|----------------|-----------------------------------|
| **Guideline Concordance** (this score) | Whether the provider's procedure mix aligns with AAOS evidence-based recommendations | Billing integrity, practice breadth, volume believability, payer consistency |
| **Peer Comparison** | Whether the billing pattern looks like a normal orthopaedic surgeon's | Clinical quality of the specific procedures |
| **Volume Adequacy** | Whether claimed activities are done at believable volume | Whether the activities themselves are guideline-concordant |
| **Payer Diversity** | Whether practice is consistent across Medicare and Medicaid | Clinical content of the practice |
| **Billing Quality** | Whether charges, ratios, and E/M distribution are normal | Whether the procedures themselves are clinically appropriate |

### Complementary Scenarios

1. **Provider bills high TKA volume (good guideline concordance) but charges 3x peers** → Guideline score high, Billing Quality score flags anomaly.
2. **Provider has excellent procedure mix but only bills 5 HCPCS codes total** → Guideline score may be good in narrow domains, Peer Comparison flags limited scope.
3. **Provider does 2 ACL reconstructions/year (trace volume)** → Guideline concordance may rate Domain 2 poorly; Volume Adequacy also flags low-volume concern.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| **No diagnosis codes** | Cannot confirm indication for surgery. A TKA for OA vs. trauma vs. RA looks identical. | Score volume and ratios, not indication-specific appropriateness. Accept Tier 2 confidence. |
| **No outcomes data** | Cannot measure complication rates, revision rates, functional outcomes, or patient satisfaction. | This score measures *process* concordance with guidelines, not *outcome* concordance. |
| **No imaging data** | Cannot assess appropriateness of imaging before surgical decision-making. | Imaging guidelines excluded from scoring entirely. |
| **No Rx data** | Cannot measure antibiotic prophylaxis, pain management protocols, or post-operative medication appropriateness. | Infection prevention guidelines excluded from scoring. |
| **Aggregated data** | Cannot track individual patient journeys (e.g., injection → failed conservative care → surgery). | Injection-to-arthroplasty ratio is a population-level proxy, not a patient-level pathway measure. |
| **Self-reported taxonomy** | Subspecialist identification is imperfect. | Accept misclassification risk. Future: cross-reference with board certification data if available. |

## Known Biases

| Bias | Direction | Notes |
|------|-----------|-------|
| **Geographic variation** | Large | Arthroplasty rates vary 2-3x across states. State-level peer grouping mitigates but does not eliminate. |
| **Practice setting** | Moderate | Academic centers vs. community practices have different case mix. Data cannot distinguish. |
| **Subspecialization without taxonomy update** | Moderate | A hand surgeon coded as 207X00000X will be scored against general peers, likely appearing to have low joint replacement volume. |
| **Medicare bias** | Moderate | Medicare covers predominantly older adults. Scores are biased toward conditions of aging (OA, hip fracture). Trauma and sports injuries are underrepresented. |

## Confidence Tier

**Tier 2** — Utilization-based proxy measure. Scores measure billing pattern concordance with guideline-covered procedure domains, not direct clinical quality.

## Update Cadence

- Rebuild percentile anchors annually when CMS releases updated data files.
- Re-audit AAOS guidelines for new publications or major revisions (AAOS publishes/revises ~2-3 CPGs per year).

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| npi | string | 10-digit NPI |
| provider_last_name | string | From NPPES |
| provider_first_name | string | From NPPES |
| provider_state | string | 2-letter state code |
| taxonomy_code | string | Primary taxonomy (207X00000X for general ortho) |
| subspecialty_flag | boolean | True if subspecialty taxonomy detected |
| subspecialty_taxonomy | string | Subspecialty taxonomy code, if any |
| peer_cohort_level | string | "state" or "national" |
| peer_cohort_size | integer | Number of providers in cohort |
| domain_1_joint_replacement_score | float | 0–100 |
| domain_1_tka_volume_pctl | float | Percentile rank for TKA volume |
| domain_1_tha_volume_pctl | float | Percentile rank for THA volume |
| domain_1_tsa_present | boolean | Whether TSA codes are billed |
| domain_1_unicompartmental_ratio | float | 27446 / 27447 ratio |
| domain_1_hip_fracture_mix_deviation | float | Deviation from peer median distribution |
| domain_1_arthroscopy_before_tka_rate | float | Rate of 29881 + 27447 on same NPI |
| domain_2_arthroscopy_score | float | 0–100 |
| domain_2_acl_volume_pctl | float | Percentile rank |
| domain_2_meniscus_repair_ratio | float | 29882 / 29881 |
| domain_2_rc_repair_volume_pctl | float | Percentile rank |
| domain_2_rc_arthroscopic_ratio | float | 29827 / (29827 + 23412) |
| domain_2_acromioplasty_ratio | float | 29826 / (29827 + 23412) |
| domain_3_fracture_score | float | 0–100 |
| domain_3_distal_radius_orif_volume | integer | Count of 25607-25609 |
| domain_3_radius_operative_ratio | float | ORIF / (ORIF + closed treatment) |
| domain_3_clavicle_orif_volume | integer | Count of 23515 |
| domain_3_fracture_breadth | integer | Distinct fracture HCPCS codes billed |
| domain_4_nonoperative_score | float | 0–100 |
| domain_4_injection_volume | integer | Count of 20610/20611 |
| domain_4_injection_to_arthroplasty_ratio | float | Injection / (TKA + THA) |
| domain_4_corticosteroid_present | boolean | J1030/J1040/J1094 billed |
| domain_4_ha_flag | string | "green", "yellow" based on HA volume |
| guideline_concordance_score | float | 0–100 composite |
| confidence_tier | string | Always "Tier 2" |
| data_source | string | "CMS Medicare + Medicaid + NPPES" |
| scoring_year | string | Data vintage year |
| limited_scope_flag | boolean | True if provider has volume in only 1 domain |
