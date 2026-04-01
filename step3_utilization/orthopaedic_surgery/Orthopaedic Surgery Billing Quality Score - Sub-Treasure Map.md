# Orthopaedic Surgery Billing Quality Score: A Sub-Treasure Map

## What This Document Does

This score examines the **integrity** of an orthopaedic surgeon's billing behavior. It answers: *Are this provider's charges, procedure-to-procedure ratios, E/M level distribution, and code relationships normal for an orthopaedic surgeon?* This is the "financial sanity check" layer — it does not measure clinical quality, but whether billing patterns are consistent with honest, standard orthopaedic practice.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | Role in This Score |
|---------|-------------------|
| **CMS Medicare Physician & Other Practitioners** | Charge-to-allowed ratio analysis. This file has both `average_submitted_charge` and `average_Medicare_allowed_amount` per NPI per HCPCS code. |
| **CMS Medicaid Provider Spending** | Procedure ratio analysis. Service counts per HCPCS. No charge detail. |
| **NPPES NPI Registry** | Peer cohort definition. |

**Key distinction:** Charge-to-allowed analysis uses Medicare data only (Medicaid file has no charge detail). Ratio analysis uses merged Medicare + Medicaid data for broader code coverage.

---

# PART B: THE LOGIC

---

## Section 1–4: Charge-to-Allowed Ratio Analysis

### 1. What It Measures

For each NPI in the Medicare file, CMS reports:
- `average_submitted_charge_amount` per HCPCS code
- `average_Medicare_allowed_amount` per HCPCS code

The charge-to-allowed ratio = submitted_charges / allowed_amounts. This measures how much a provider charges relative to what Medicare pays.

**Orthopaedic context:** Surgical specialties typically have higher charge-to-allowed ratios than primary care because procedure fees are negotiated differently, and the spread between billed charges and Medicare rates is wider for surgical codes.

> **ASSUMPTION:** Orthopaedic charge-to-allowed ratios are expected to be higher than the all-specialty average. Peer comparison must be within orthopaedic surgery, not against all physicians. **External resource needed:** Actual p25/p50/p75/p90 of charge-to-allowed ratios for taxonomy 207X00000X should be computed from CMS data.

### 2. Provider-Level Charge Ratio

```
total_charges = sum(avg_submitted_charge * service_count) for all HCPCS
total_allowed = sum(avg_allowed_amount * service_count) for all HCPCS
provider_charge_ratio = total_charges / total_allowed
```

### 3. Peer Distribution

Compute `provider_charge_ratio` for all providers in the peer cohort. Extract: p10, p25, median, p75, p90.

### 4. Charge Score

| Provider Charge Ratio Position | Score | Interpretation |
|-------------------------------|-------|----------------|
| Between p25 and p75 | **100** | Normal range |
| Between p10–p25 or p75–p90 | **70** | Somewhat unusual |
| Below p10 or above p90 | **40** | Outlier |

### Per-Code Analysis (Informational)

For outlier providers (score = 40), identify which HCPCS codes drive the outlier status:

```
For each HCPCS code the provider bills:
  code_charge_ratio = avg_submitted_charge / avg_allowed_amount
  peer_median_code_ratio = median of this ratio across peer cohort
  deviation = code_charge_ratio - peer_median_code_ratio
```

Report the top 5 codes by absolute deviation. This helps explain *why* a provider is an outlier.

---

## Section 5: E/M Level Distribution (Upcoding Check)

### Expected Orthopaedic E/M Distribution

Orthopaedic surgery has a **different E/M complexity distribution** from primary care. Surgical follow-ups are often lower complexity (99212, 99213), while new patient consults and pre-operative evaluations are higher complexity (99204, 99205, 99214, 99215).

> **ASSUMPTION:** The expected E/M distribution below is estimated from specialty norms. **External resource needed:** Actual distribution should be computed from CMS data for taxonomy 207X00000X.

| E/M Code | Expected Share (Est.) | Notes |
|----------|----------------------|-------|
| 99212 | 5–10% | Simple follow-ups |
| 99213 | 30–40% | Standard follow-ups, routine visits |
| 99214 | 30–40% | Pre-op evaluations, complex follow-ups |
| 99215 | 5–15% | Complex new evaluations, multi-problem visits |
| 99203 | 3–8% | New patient, low complexity |
| 99204 | 5–12% | New patient, moderate complexity |
| 99205 | 2–5% | New patient, high complexity |

**Key difference from primary care:** Orthopaedic surgeons typically have a **higher 99214/99215 share** than primary care because:
1. Pre-operative evaluations for surgical candidates are inherently moderate-to-high complexity.
2. Post-operative visits within the global period are bundled (not separately billable), so the E/M visits that *are* billed tend to be higher-complexity non-global evaluations.

### Upcoding Flag

```
high_complexity_share = (99214_count + 99215_count) / total_em_count
peer_p90_high_share = p90 of high_complexity_share in peer cohort
```

If `high_complexity_share > peer_p90_high_share`: **upcoding_flag = true**

This is a **flag**, not an automatic penalty. Orthopaedic surgeons who see complex cases (revision arthroplasty, multi-trauma) may legitimately bill higher-complexity E/M.

---

## Sections 6–8: Green Flag Ratios (Good Practice Signals)

Green flags are procedure-to-procedure ratios that signal clinically sound, guideline-concordant practice when present at appropriate levels.

### 10 Green Flag Ratios

| # | Ratio | Numerator | Denominator | What It Signals | Expected Range |
|---|-------|-----------|-------------|----------------|----------------|
| 1 | **Meniscus repair-to-meniscectomy** | 29882 | 29881 | Guideline favors repair when feasible | 0.15–0.50 |
| 2 | **Arthroscopic-to-open RC repair** | 29827 | 29827 + 23412 | Modern surgical technique | 0.70–0.95 |
| 3 | **Unicompartmental-to-TKA** | 27446 | 27447 | Appropriate use of less invasive option | 0.05–0.25 |
| 4 | **Reverse-to-anatomic TSA** | 23473 | 23472 + 23473 | Appropriate indication-based selection | 0.40–0.80 |
| 5 | **Injection-to-arthroplasty** | 20610 | 27447 + 27130 | Conservative management before surgery | 1.0–5.0 |
| 6 | **New-to-established visit** | 99203 + 99204 + 99205 | 99212 + 99213 + 99214 + 99215 | Healthy practice growth signal | 0.10–0.40 |
| 7 | **Hip fracture hemiarthroplasty-to-ORIF** | 27125 | 27235 + 27236 | Appropriate surgical approach for displaced fractures | 0.20–0.80 |
| 8 | **Fracture operative-to-nonoperative (radius)** | 25607–25609 | 25600–25605 + 25607–25609 | Balanced fracture management | 0.30–0.70 |
| 9 | **Shoulder decompression-to-repair** | 29826 | 29827 + 23412 | Decompression should accompany repair, not replace it | 0.30–1.20 |
| 10 | **G2211 complexity add-on usage** | G2211 | total E/M visits | Reflects complex case management | 0.10–0.50 |

**Scoring per ratio:**
- Within expected range → **green** (1.0 points)
- Outside range but within 2× range bounds → **yellow** (0.5 points)
- Far outside range or denominator = 0 → **neutral** (0.5 points, excluded from denominator)

---

## Sections 9–10: Red Flag Ratios (Warning Signals)

Red flags are patterns that signal potential billing anomalies, upcoding, or clinical inconsistency.

### 12 Red Flag Ratios

| # | Red Flag | How Detected | Why It's Concerning |
|---|----------|-------------|-------------------|
| 1 | **Arthroscopy-before-TKA** | 29881 + 27447 both billed, high arthroscopy-to-TKA ratio | AAOS advises against routine arthroscopy before TKA for OA. High ratio suggests unnecessary arthroscopy. |
| 2 | **Single-code dominance** | Any one HCPCS > 25% of total services | Healthy ortho practice has diverse billing. Extreme concentration is unusual. |
| 3 | **High E/M without procedures** | E/M visits > 80% of total services, < 5 distinct procedure codes | May indicate a consulting-only practice miscoded as surgeon, or undertreated surgical candidates. |
| 4 | **Injection-only practice** | 20610/20611 > 40% of total services, < 3 surgical codes | Orthopaedic surgeon billing primarily injections is unusual. May indicate pain-management-style practice under ortho taxonomy. |
| 5 | **Bilateral modifier overuse** | Modifier -50 or bilateral codes at rates > peer p90 | May signal upcoding of unilateral procedures as bilateral. |
| 6 | **Revision-without-primary** | Revision arthroplasty codes (27486-27487, 27134-27138) but zero primary arthroplasty | Unusual unless this is specifically a revision-only referral practice. Flag for review. |
| 7 | **Fracture care without E/M follow-up** | Fracture HCPCS billed but < 2 E/M visits per fracture code | May indicate incomplete billing capture or hit-and-run surgical practice. |
| 8 | **Arthroplasty without injection history** | TKA or THA volume > 20 but zero injection codes | Most patients should have conservative management before surgery. Zero injections is unusual. |
| 9 | **High shoulder arthroscopy-to-repair ratio** | (29823 + 29822) / (29827 + 23412) > 2.0 | Excessive diagnostic/debridement arthroscopy relative to definitive repair suggests possible unnecessary procedures. |
| 10 | **E/M complexity spike** | 99215 share > peer p95 | Extreme high-complexity billing. Requires justification. |
| 11 | **Carpal tunnel volume outlier** | 64721 > peer p95 volume | Unusual surgical volume concentration in a minor procedure. |
| 12 | **Assistant surgeon without primary codes** | Modifier -80/-82 present but < 3 primary procedure codes | May indicate the provider primarily assists rather than performs independently. Not wrong, but atypical for a general orthopaedist. |

> **ASSUMPTION for Red Flag #5 (bilateral modifier):** The aggregated CMS file does not include modifier-level detail. This flag may only be assessable from the Medicare Provider Utilization file's line-level records or a future data source. **Mark as "not currently scorable" until modifier data is confirmed available.**

> **ASSUMPTION for Red Flag #12 (assistant surgeon):** Same modifier limitation as above. **Mark as "not currently scorable."**

**Scoring per flag:**
- Flag NOT triggered → **green** (1.0 points)
- Flag triggered → **red** (0.0 points)
- Cannot assess (data limitation) → **neutral** (0.5 points)

---

## Section 11: Cross-Category Consistency Checks

These checks validate that clinically related activities appear together in a provider's billing.

### 7 Cross-Category Consistency Checks

| # | Check | Logic | Expected Relationship |
|---|-------|-------|----------------------|
| 1 | **Arthroplasty + post-op E/M** | Bills TKA/THA + bills 99213/99214 | Joint replacement should generate follow-up visits (outside global period) |
| 2 | **Arthroscopy + follow-up** | Bills 29881/29827 + bills 99213 | Arthroscopy patients need post-op check |
| 3 | **Injections + E/M** | Bills 20610 + bills 99213/99214 | Injections occur during or alongside E/M visits |
| 4 | **Fracture care + imaging orders** | Bills fracture ORIF + bills 99213/99214 | Fracture patients need follow-up (imaging billed by radiology, but E/M by surgeon) |
| 5 | **Shoulder arthroscopy + RC repair** | Bills 29826 (acromioplasty) + bills 29827 or 23412 (RC repair) | Decompression alone without any repair in the practice is unusual |
| 6 | **New patient visits + procedure codes** | Bills 99203-99205 + bills at least 3 procedure codes | Seeing new patients should lead to interventions |
| 7 | **TKA + unicompartmental** | If bills 27447, should also bill 27446 OR have very high TKA volume | A surgeon who does TKA should consider unicompartmental when appropriate, unless they are a high-volume TKA specialist |

**Scoring per check:**
- Consistent → **green** (1.0 points)
- Inconsistent → **yellow** (0.5 points)
- Cannot assess (one side of the pair is not billed) → **neutral** (excluded)

---

## Section 12: Composite Billing Quality Score

### Component 1: Charge-to-Allowed Score (Weight: 35%)

From Section 1–4. Score = 100, 70, or 40 based on peer percentile bands.

### Component 2: Ratio Analysis Score (Weight: 65%)

Combines green flags, red flags, and consistency checks:

```
green_flag_points = sum of points from 10 green flag ratios
red_flag_points = sum of points from 12 red flag checks (minus 2 not currently scorable = 10 assessable)
consistency_points = sum of points from 7 consistency checks

total_assessable = count of non-neutral checks across all three categories
total_points = green_flag_points + red_flag_points + consistency_points

ratio_analysis_score = (total_points / total_assessable) * 100
```

### Composite

```
billing_quality_score = (charge_score * 0.35) + (ratio_analysis_score * 0.65)
```

### Worked Examples

**Provider A — Normal billing orthopaedist:**
- Charge ratio in p25–p75 → charge_score = 100
- Green flags: 8/10 green, 2 neutral → 9.0 / 10 assessable
- Red flags: 0/10 triggered → 10.0 / 10
- Consistency: 6/7 consistent, 1 not assessable → 6.0 / 6 assessable
- ratio_analysis_score = (9.0 + 10.0 + 6.0) / (10 + 10 + 6) × 100 = 25.0/26 × 100 = 96.2
- **Composite: (100 × 0.35) + (96.2 × 0.65) = 35.0 + 62.5 = 97.5**

**Provider B — High-charging, injection-heavy practice:**
- Charge ratio above p90 → charge_score = 40
- Green flags: 5/10 green, 3 yellow, 2 neutral → (5×1.0 + 3×0.5 + 2×0.5) / 10 = 8.0/10
- Red flags: 2 triggered (injection-only, single-code dominance) → 8.0/10
- Consistency: 4/7 consistent, 1 inconsistent, 2 not assessable → 4.5/5
- ratio_analysis_score = (8.0 + 8.0 + 4.5) / (10 + 10 + 5) × 100 = 20.5/25 × 100 = 82.0
- **Composite: (40 × 0.35) + (82.0 × 0.65) = 14.0 + 53.3 = 67.3**

**Provider C — Billing anomaly profile:**
- Charge ratio above p90 → charge_score = 40
- Green flags: 3/10 green, 2 yellow, 5 neutral → (3×1.0 + 2×0.5 + 5×0.5) / 10 = 6.5/10
- Red flags: 4 triggered → 6.0/10
- Consistency: 2/7 consistent, 3 inconsistent, 2 not assessable → 3.5/5
- ratio_analysis_score = (6.5 + 6.0 + 3.5) / (10 + 10 + 5) × 100 = 16.0/25 × 100 = 64.0
- **Composite: (40 × 0.35) + (64.0 × 0.65) = 14.0 + 41.6 = 55.6**

---

# PART C: BUSINESS RULES

---

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider not in Medicare file | Cannot compute charge score. Charge component = 50 (neutral). Ratio analysis uses Medicaid data only. |
| Provider has < 50 total services | Excluded from scoring. |
| Ratio denominator = 0 | Ratio treated as neutral (0.5 points). Does not count toward assessable checks. |
| CMS suppression on a code | Suppressed code treated as 0 volume. If it was the numerator or denominator of a ratio, that ratio = neutral. |
| State cohort < 30 | National cohort for charge percentile bands. |

## Subspecialist Handling

- Subspecialists excluded from the general orthopaedic peer cohort.
- Expected green/red flag profiles differ by subspecialty (e.g., a sports medicine surgeon may have high arthroscopy-to-arthroplasty ratios — normal for them, flagged in general ortho).

## Modifier Data Limitation

Red flags #5 (bilateral modifier overuse) and #12 (assistant surgeon) are **not currently scorable** because the aggregated CMS files do not include modifier-level detail. These are documented for future implementation if line-level data becomes available. They score as neutral (0.5) and are excluded from the assessable denominator.

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What Billing Quality Adds |
|-----------|----------------|--------------------------|
| **Guideline Concordance** | Whether procedures align with AAOS | Whether the billing *around* those procedures is clean |
| **Peer Comparison** | Whether the code profile is normal | Peer comparison checks *what*; billing quality checks *how* it's charged |
| **Volume Adequacy** | Whether volume is believable | Volume adequacy checks quantity; billing quality checks pricing and ratios |
| **Payer Diversity** | Whether practice spans payers | Payer diversity is structural; billing quality is behavioral |
| **Billing Quality** (this score) | Whether charges, ratios, and patterns are honest | — |

### The Four Scores Together

The five-dimension composite catches different failure modes:

| Scenario | Guideline | Peer | Volume | Payer | Billing |
|----------|-----------|------|--------|-------|---------|
| Good surgeon, normal practice | High | High | High | Moderate-High | High |
| Subspecialist (e.g., hand) | Low (narrow) | Low (narrow) | High (in scope) | Varies | High |
| Upcoding risk | High | High | High | High | **Low** |
| Trace-volume dabbler | Moderate | Moderate | **Low** | High | Moderate |
| Injection mill | Low | **Low** | **Low** | Moderate | **Low** |
| Medicare-only joint specialist | High | Moderate | High | **Low** | High |

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact |
|-----------|--------|
| **No modifier detail** | Cannot assess bilateral coding or assistant surgeon patterns. 2 of 12 red flags are not currently scorable. |
| **Charge-to-allowed is Medicare-only** | Medicaid charge behavior is invisible. Providers may price differently for Medicaid. |
| **Global surgical periods** | Many post-operative visits are bundled into the surgical fee (90-day global for major ortho procedures). E/M distribution only reflects non-bundled visits, which may not be representative. |
| **Aggregate data, no claim dates** | Cannot assess temporal patterns (e.g., billing spikes, seasonal variation, claim clustering). |

## Known Biases

| Bias | Direction |
|------|-----------|
| **Practice overhead variation** | High-cost markets (NYC, SF) may have higher charge-to-allowed ratios simply due to practice costs, not billing behavior. State-level peer grouping helps but doesn't fully control. |
| **Chargemaster variation** | Hospitals and groups set chargemasters; employed surgeons may not control their own charge-to-allowed ratios. The charge score reflects institutional billing, not individual provider behavior. |
| **Surgical case complexity** | Providers who take on complex cases (revisions, trauma, reoperations) may have different E/M distributions and ratio profiles. Not captured by peer cohort filtering. |

> **ASSUMPTION:** Charge-to-allowed ratios reflect a mix of provider billing behavior and institutional chargemaster policies. For employed surgeons, this score partly measures institutional practice, not personal choice. **We accept this limitation at Tier 2 confidence.** A future enhancement could flag employed vs. independent practitioners (institutional vs. individual NPI).

## Confidence Tier

**Tier 2** — Billing pattern analysis, not direct quality measure.

## Update Cadence

Rebuild charge percentile bands and ratio benchmarks annually from latest CMS data.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| npi | string | 10-digit NPI |
| provider_last_name | string | From NPPES |
| provider_first_name | string | From NPPES |
| provider_state | string | 2-letter state code |
| total_charges | float | Sum of submitted charges × service counts |
| total_allowed | float | Sum of allowed amounts × service counts |
| provider_charge_ratio | float | total_charges / total_allowed |
| peer_charge_p25 | float | 25th percentile of peer charge ratios |
| peer_charge_median | float | Median of peer charge ratios |
| peer_charge_p75 | float | 75th percentile |
| peer_charge_p90 | float | 90th percentile |
| charge_score | float | 100, 70, or 40 |
| charge_outlier_codes | list[object] | Top 5 codes driving outlier status (if applicable) |
| em_99212_share | float | Share of E/M visits |
| em_99213_share | float | Share of E/M visits |
| em_99214_share | float | Share of E/M visits |
| em_99215_share | float | Share of E/M visits |
| em_99203_share | float | Share of new patient visits |
| em_99204_share | float | Share of new patient visits |
| em_99205_share | float | Share of new patient visits |
| high_complexity_share | float | (99214 + 99215) / total E/M |
| upcoding_flag | boolean | True if high_complexity_share > peer p90 |
| green_flag_1_meniscus_repair_ratio | float | 29882 / 29881 |
| green_flag_1_status | string | "green", "yellow", "neutral" |
| green_flag_2_arthroscopic_rc_ratio | float | 29827 / (29827 + 23412) |
| green_flag_2_status | string | Status |
| green_flag_3_unicompartmental_ratio | float | 27446 / 27447 |
| green_flag_3_status | string | Status |
| green_flag_4_reverse_tsa_ratio | float | 23473 / (23472 + 23473) |
| green_flag_4_status | string | Status |
| green_flag_5_injection_arthroplasty_ratio | float | 20610 / (27447 + 27130) |
| green_flag_5_status | string | Status |
| green_flag_6_new_established_ratio | float | New visits / Established visits |
| green_flag_6_status | string | Status |
| green_flag_7_hip_fx_approach_ratio | float | 27125 / (27235 + 27236) |
| green_flag_7_status | string | Status |
| green_flag_8_radius_operative_ratio | float | ORIF / (ORIF + closed) |
| green_flag_8_status | string | Status |
| green_flag_9_shoulder_decomp_repair_ratio | float | 29826 / (29827 + 23412) |
| green_flag_9_status | string | Status |
| green_flag_10_g2211_ratio | float | G2211 / total E/M |
| green_flag_10_status | string | Status |
| red_flag_1_arthroscopy_before_tka | boolean | Triggered? |
| red_flag_2_single_code_dominance | boolean | Any code > 25% of services? |
| red_flag_3_em_without_procedures | boolean | E/M > 80% + < 5 procedure codes? |
| red_flag_4_injection_only | boolean | Injections > 40% + < 3 surgical codes? |
| red_flag_5_bilateral_overuse | string | "not_scorable" (modifier data unavailable) |
| red_flag_6_revision_without_primary | boolean | Revision codes without primary arthroplasty? |
| red_flag_7_fracture_without_followup | boolean | Fracture codes + < 2 E/M per fracture code? |
| red_flag_8_arthroplasty_without_injections | boolean | High arthroplasty + zero injection codes? |
| red_flag_9_high_arthroscopy_to_repair | boolean | Diagnostic arthroscopy > 2× repair volume? |
| red_flag_10_em_complexity_spike | boolean | 99215 share > peer p95? |
| red_flag_11_ctr_volume_outlier | boolean | 64721 > peer p95 volume? |
| red_flag_12_assistant_only | string | "not_scorable" (modifier data unavailable) |
| consistency_check_1_arthroplasty_followup | string | "consistent", "inconsistent", "not_assessable" |
| consistency_check_2_arthroscopy_followup | string | Status |
| consistency_check_3_injections_em | string | Status |
| consistency_check_4_fracture_followup | string | Status |
| consistency_check_5_shoulder_decomp_repair | string | Status |
| consistency_check_6_new_visits_procedures | string | Status |
| consistency_check_7_tka_unicompartmental | string | Status |
| green_flag_count | integer | Total green flags |
| yellow_flag_count | integer | Total yellow flags |
| red_flag_count | integer | Total red flags triggered |
| neutral_flag_count | integer | Total neutral/not assessable |
| ratio_analysis_score | float | 0–100 |
| billing_quality_score | float | 0–100 composite |
| confidence_tier | string | Always "Tier 2" |
| peer_cohort_level | string | "state" or "national" |
| peer_cohort_size | integer | Number of providers in cohort |
