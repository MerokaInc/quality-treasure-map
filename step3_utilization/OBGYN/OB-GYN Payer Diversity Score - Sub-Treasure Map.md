# OB-GYN Payer Diversity Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Is this OB-GYN provider's practice consistent across Medicare and Medicaid?** It measures the overlap in services billed to both payer populations. Providers who serve both payers with similar breadth demonstrate equitable access. Providers who bill completely different service profiles to each payer — or who serve only one — may indicate payer-selective behavior.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Payer Diversity |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code-level detail: which codes billed, service count, beneficiary count. Defines the Medicare side of the payer overlap calculation. |
| **CMS Medicaid Provider Spending** | Per-NPI total services, beneficiaries, and spending. Confirms Medicaid participation but lacks code-level detail. |
| **NPPES NPI Registry** | Taxonomy code 207V00000X confirms OB-GYN specialty. State field for cohort grouping. |

**Critical data gap:** CMS Medicaid file provides only total services per NPI, not per-HCPCS breakdown. Payer overlap is therefore computed using Medicare code-level data plus Medicaid participation status, not a true code-by-code comparison across both payers.

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207V00000X (Obstetrics & Gynecology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥50 total services across Medicare + Medicaid |
| **Entity type** | Type 1 NPI (individual practitioners only) |
| **Both-payer requirement** | For payer diversity scoring, provider must appear in both CMS Medicare and CMS Medicaid files |

## Expected Overlap Baseline for OB-GYN

OB-GYN has a **moderate expected payer overlap** — significantly higher than specialties serving predominantly one age group.

| Characteristic | OB-GYN Reality |
|---|---|
| **Medicare population** | Postmenopausal women (gynecologic care: screening, surgical GYN, pelvic floor). Some obstetric care for older mothers. |
| **Medicaid population** | Reproductive-age women (obstetric care, prenatal, family planning, contraceptive services). Medicaid covers ~42% of US births. |
| **Expected overlap** | Moderate. Both populations need office visits, screening, and some gynecologic procedures. Obstetric codes skew heavily Medicaid. Surgical GYN codes appear in both. |
| **Typical overlap range** | 30-60% of codes appear in both payers for dual-payer OB-GYNs |

**Comparison to other specialties:**
- Lower overlap than geriatrics/cardiology (Medicare-dominant, consistent procedures)
- Higher overlap than pure obstetric practices (which may be almost entirely Medicaid)
- Similar overlap to family medicine (broad patient age range)

## Payer Overlap Metric

### Step 1: Identify Codes by Payer

```
medicare_codes = set of HCPCS codes this provider bills to Medicare
medicaid_flag = True if provider appears in CMS Medicaid file with >0 services

# Since Medicaid lacks code-level detail, we use workflow category overlap:
both_payer_categories = categories where provider bills Medicare AND has Medicaid volume
all_categories = union of categories with any billing activity
```

### Step 2: Compute Category-Level Overlap

Using the 6 workflow categories from Dimension 2 (Peer Comparison):

```
category_overlap = both_payer_categories / all_active_categories
```

**Why category-level instead of code-level:** Medicaid data lacks HCPCS detail. Category-level overlap is the best achievable granularity. This is an acknowledged limitation.

### Step 3: Score Against Peer Benchmark

```
peer_p90 = 90th percentile of category_overlap among dual-payer OB-GYN peers

payer_diversity_score = min(category_overlap / peer_p90, 1.0) * 100
```

**P90 cap:** The score is capped at 100 when overlap reaches the 90th percentile of peers. This prevents penalizing providers who don't exceed the highest overlap levels.

**Expected p90 for OB-GYN:** ~0.70 (70% category overlap). Providers reaching this level score 100.

### Worked Examples

**Example 1: Dual-payer, high overlap (Score = 100)**

Dr. A bills Medicare across 5 categories and has Medicaid patients. Both-payer categories: Office Visits, Obstetric Care, Ultrasound, GYN Procedures, Screening. All active categories: 5. Peer p90 = 0.70.

- category_overlap = 5/5 = 1.00
- score = min(1.00 / 0.70, 1.0) * 100 = **100**

**Example 2: Dual-payer, moderate overlap (Score = 71)**

Dr. B bills Medicare across 6 categories. Both-payer categories: Office Visits, Obstetric Care, Screening. All active categories: 6. Peer p90 = 0.70.

- category_overlap = 3/6 = 0.50
- score = min(0.50 / 0.70, 1.0) * 100 = **71.4**

**Example 3: Dual-payer, low overlap (Score = 43)**

Dr. C bills Medicare across 5 categories. Both-payer categories: Office Visits only. All active categories: 5. Peer p90 = 0.70.

- category_overlap = 1/5 = 0.20
- score = min(0.20 / 0.70, 1.0) * 100 = **28.6**

---
# PART C: BUSINESS RULES
---

## Single-Payer Handling

OB-GYN providers may legitimately serve only one payer population:

| Single-Payer Pattern | Is This Normal? | Handling |
|---|---|---|
| **Medicaid-only** | Common. Many OB-GYNs in safety-net settings or community health centers serve primarily Medicaid-insured reproductive-age women. | Flag as `single_payer_medicaid`. Reduce payer diversity weight in composite. Score = 50 (neutral). |
| **Medicare-only** | Less common but legitimate. GYN-only providers serving postmenopausal women may have no Medicaid volume. | Flag as `single_payer_medicare`. Reduce payer diversity weight in composite. Score = 50 (neutral). |

**Rule:** Single-payer status is **structural, not a quality signal.** It reflects patient population, not provider choice. Never penalize. Always flag and reduce weight.

### Weight Reduction for Single-Payer Providers

When this score feeds into a composite across all 5 dimensions:
- Dual-payer providers: Payer Diversity receives its full weight
- Single-payer providers: Payer Diversity weight is reduced by 50%, redistributed proportionally to other dimensions

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider appears in neither Medicare nor Medicaid | Cannot score. Score = null. |
| Provider in Medicare only, no Medicaid file entry | Flag as single-payer Medicare. Score = 50 (neutral). |
| Provider in Medicaid only, no Medicare file entry | Flag as single-payer Medicaid. Score = 50 (neutral). |
| Peer p90 < 0.10 (extremely low peer overlap) | Use national cohort instead of state. If still < 0.10, set floor p90 = 0.10. |

## Subspecialist Handling

| Subspecialty | Expected Payer Pattern | Handling |
|---|---|---|
| Maternal-Fetal Medicine | Heavily Medicaid-skewed (high-risk pregnancies). Medicare rare. | Flag as expected single-payer Medicaid. Score = 50 (neutral). |
| Gynecologic Oncology | Medicare-skewed (cancer incidence increases with age). | Use GYN-onc peer cohort for p90 computation. |
| Reproductive Endocrinology | Primarily commercial insurance (fertility services). Minimal Medicare or Medicaid. | Exclude from payer diversity scoring. Score = null. |
| Female Pelvic Medicine | Medicare-skewed (pelvic floor disorders increase with age). | Use urogyn peer cohort for p90 computation. |

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. ACOG Guideline Concordance** | Whether clinical care meets evidence-based standards |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical OB-GYN |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible |
| **4. Payer Diversity (this score)** | Whether this provider serves both Medicare and Medicaid populations equitably — the only score that detects payer-selective practice patterns |
| **5. Billing Quality** | Whether charges and code ratios are normal |

## Complementary Scenarios

**Scenario A:** Provider scores 30 on Payer Diversity but 90 on ACOG Concordance. *Interpretation:* Clinically excellent but serving only one payer population. May be a structural issue (community health center = Medicaid-only) rather than a quality concern. Context matters.

**Scenario B:** Provider scores 85 on Payer Diversity but 40 on Billing Quality. *Interpretation:* Serves both populations but billing patterns are abnormal. Equitable access but questionable billing practices.

**Scenario C:** Provider scores 90 on Payer Diversity but 50 on Volume Adequacy. *Interpretation:* Bills to both payers broadly but at trace volumes in some categories. Payer breadth doesn't guarantee clinical depth.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **No Medicaid code-level data** | The biggest limitation. Cannot compute true code-by-code payer overlap. Category-level overlap is a proxy. |
| **Commercial insurance invisible** | CMS data covers only Medicare + Medicaid. Many OB-GYN patients are commercially insured. A provider could be "single-payer" in CMS data but serve a diverse population via commercial plans. |
| **Medicaid managed care obscures** | In states with Medicaid managed care, some providers may not appear in the CMS Medicaid spending file even though they serve Medicaid patients through MCO contracts. |
| **Pregnancy Medicaid vs. ongoing** | Many women qualify for Medicaid only during pregnancy. A provider's Medicaid volume may fluctuate dramatically year to year. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Safety-net provider bias** | Community health centers and safety-net hospitals serve primarily Medicaid. They will systematically score as single-payer, which is structural, not quality. | Flag + neutral score (50) + reduced weight |
| **Geographic Medicaid expansion bias** | States with Medicaid expansion have more dual-payer providers. Non-expansion states systematically produce more single-payer flags. | State-level peer cohort partially controls for this |
| **Age-of-practice bias** | GYN-only providers treating postmenopausal women skew Medicare-only. This is legitimate scope, not payer selectivity. | Subspecialist handling for GYN-focused practices |
| **Pregnancy Medicaid churn** | Short-term Medicaid eligibility during pregnancy creates unstable year-to-year Medicaid volume. | Use most recent year's data; flag if Medicaid volume is <20 total services |

## Update Cadence

- **P90 benchmark:** Recompute annually from latest CMS data release.
- **Single-payer thresholds:** Review annually based on Medicaid expansion status changes.
- **Category definitions:** Aligned with Dimension 2 (Peer Comparison) categories; updated together.

---
# OUTPUT SCHEMA
---

| Field | Type | Description |
|---|---|---|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | Full name from NPPES |
| `taxonomy_code` | string | Primary taxonomy code |
| `is_subspecialist` | boolean | True if subspecialty taxonomy detected |
| `state` | string | 2-letter state code |
| `payer_diversity_score` | float | 0-100 payer diversity score |
| `category_overlap` | float | Fraction of active categories present in both payers (0.0-1.0) |
| `both_payer_categories` | integer | Count of categories with both Medicare and Medicaid billing |
| `all_active_categories` | integer | Count of categories with any billing |
| `peer_p90` | float | 90th percentile overlap in peer cohort |
| `is_single_payer` | boolean | True if provider appears in only one CMS payer file |
| `single_payer_type` | string | "medicare" | "medicaid" | null |
| `has_medicare` | boolean | Provider appears in CMS Medicare Physician file |
| `has_medicaid` | boolean | Provider appears in CMS Medicaid Spending file |
| `medicare_services` | integer | Total Medicare services |
| `medicaid_services` | integer | Total Medicaid services |
| `peer_cohort_size` | integer | Number of dual-payer providers in peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
