# Ophthalmology Payer Diversity Score: A Sub-Treasure Map

## What This Document Does

This score answers: **Is this ophthalmology provider's practice consistent across Medicare and Medicaid?** It measures the overlap in services billed to both payer populations. Providers who serve both payers with similar breadth demonstrate equitable access. Providers who bill completely different service profiles to each payer — or who serve only one — may indicate payer-selective behavior.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | What It Gives Us for Payer Diversity |
|---|---|
| **CMS Medicare Physician & Other Practitioners** | Per-NPI HCPCS code-level detail: which codes billed, service count, beneficiary count. Defines the Medicare side of the payer overlap calculation. |
| **CMS Medicaid Provider Spending** | Per-NPI total services, beneficiaries, and spending. Confirms Medicaid participation but lacks code-level detail. |
| **NPPES NPI Registry** | Taxonomy code 207W00000X confirms ophthalmology specialty. State field for cohort grouping. |

**Critical data gap:** CMS Medicaid file provides only total services per NPI, not per-HCPCS breakdown. Payer overlap is therefore computed using Medicare code-level data plus Medicaid participation status, not a true code-by-code comparison across both payers.

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207W00000X (Ophthalmology) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥50 total services across Medicare + Medicaid |
| **Entity type** | Type 1 NPI (individual practitioners only) |
| **Both-payer requirement** | For payer diversity scoring, provider must appear in both CMS Medicare and CMS Medicaid files |

## Expected Overlap Baseline for Ophthalmology

Ophthalmology has a **low-to-moderate expected payer overlap** — skewing heavily toward Medicare due to the elderly patient population.

| Characteristic | Ophthalmology Reality |
|---|---|
| **Medicare population** | The dominant payer. Cataracts, glaucoma, AMD, and diabetic eye disease all disproportionately affect patients 65+. Estimated 50-65% of ophthalmology revenue is Medicare. |
| **Medicaid population** | Smaller share. Diabetic retinopathy screening in younger adults, pediatric eye exams, trauma. Medicaid reimbursement for eye care is low in many states, suppressing participation. |
| **Expected overlap** | Low-to-moderate. Both populations need comprehensive exams, some diagnostic testing, and diabetic eye care. Cataract surgery and AMD injections skew heavily Medicare. Pediatric services are Medicaid-only. |
| **Typical overlap range** | 20-45% of workflow categories appear in both payers for dual-payer ophthalmologists |
| **Medicare-only is normal** | Many ophthalmologists legitimately serve only Medicare patients. This is structural (elderly disease burden), not payer selectivity. |

**Comparison to other specialties:**
- Much lower overlap than OB-GYN (which serves both reproductive-age Medicaid and postmenopausal Medicare women)
- Similar to cardiology (Medicare-dominant, procedure-heavy)
- Higher overlap than geriatrics (almost entirely Medicare)
- Lower overlap than family medicine or general surgery

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
peer_p90 = 90th percentile of category_overlap among dual-payer ophthalmology peers

payer_diversity_score = min(category_overlap / peer_p90, 1.0) * 100
```

**P90 cap:** The score is capped at 100 when overlap reaches the 90th percentile of peers. This prevents penalizing providers who don't exceed the highest overlap levels.

**Expected p90 for ophthalmology:** ~0.50 (50% category overlap). Providers reaching this level score 100. This is lower than OB-GYN (~0.70) because ophthalmology's Medicare dominance means fewer dual-payer providers exist, and those who do have narrower Medicaid category breadth.

### Worked Examples

**Example 1: Dual-payer, high overlap (Score = 100)**

Dr. A bills Medicare across 5 categories and has Medicaid patients. Both-payer categories: Office Visits & Eye Exams, Diagnostic Testing, Cataract Surgery. All active categories: 5. Peer p90 = 0.50.

- category_overlap = 3/5 = 0.60
- score = min(0.60 / 0.50, 1.0) × 100 = **100**

**Example 2: Dual-payer, moderate overlap (Score = 60)**

Dr. B bills Medicare across 6 categories. Both-payer categories: Office Visits & Eye Exams only. All active categories: 6. Peer p90 = 0.50.

- category_overlap = 1/6 = 0.167
- score = min(0.167 / 0.50, 1.0) × 100 = **33.3**

**Example 3: Medicare-only provider (Score = 50, flagged)**

Dr. C bills Medicare across 5 categories. No Medicaid file entry.

- Flag as `single_payer_medicare`. Score = **50** (neutral).

---
# PART C: BUSINESS RULES
---

## Single-Payer Handling

Ophthalmology providers frequently serve only one payer population, and Medicare-only is the norm:

| Single-Payer Pattern | Is This Normal? | Handling |
|---|---|---|
| **Medicare-only** | Very common and expected. The core ophthalmology conditions (cataracts, AMD, glaucoma) affect the elderly. Many ophthalmologists legitimately have zero Medicaid patients. | Flag as `single_payer_medicare`. Reduce payer diversity weight in composite. Score = 50 (neutral). |
| **Medicaid-only** | Uncommon. Could indicate a community health center or safety-net provider focusing on diabetic screening or pediatric ophthalmology. Legitimate but rare. | Flag as `single_payer_medicaid`. Reduce payer diversity weight in composite. Score = 50 (neutral). |

**Rule:** Single-payer status is **structural, not a quality signal.** It reflects patient population demographics, not provider choice. Never penalize. Always flag and reduce weight.

### Weight Reduction for Single-Payer Providers

When this score feeds into a composite across all 5 dimensions:
- Dual-payer providers: Payer Diversity receives its full weight
- Single-payer providers: Payer Diversity weight is reduced by 50%, redistributed proportionally to other dimensions

**Ophthalmology-specific note:** Because Medicare-only is the dominant pattern, a larger proportion of ophthalmologists will receive the reduced-weight treatment than in specialties like OB-GYN. This is by design — payer diversity is inherently less informative for Medicare-dominant specialties.

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
| **Retina/Vitreoretinal (207WX0107X)** | Heavily Medicare-skewed (AMD, diabetic retinopathy in elderly). Some Medicaid for younger diabetics. | Use retina peer cohort for p90 computation. |
| **Glaucoma Specialist (207WX0009X)** | Medicare-skewed (glaucoma prevalence increases with age). | Use glaucoma peer cohort for p90. |
| **Pediatric Ophthalmology (207WX0110X)** | Heavily Medicaid-skewed (children on Medicaid/CHIP). Medicare-only is abnormal. | Flag as expected Medicaid-dominant. Use pediatric ophthalmology peer cohort. |
| **Oculoplastics (207WX0200X)** | Mixed. Cosmetic procedures are self-pay. Functional procedures (ptosis repair) are Medicare. | Use general ophthalmology cohort. |
| **Cornea/External Disease (207WX0120X)** | Medicare-skewed (corneal transplants in elderly). | Use general ophthalmology cohort. |

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. AAO Guideline Concordance** | Whether clinical care meets evidence-based standards |
| **2. Peer Comparison** | Whether billing breadth and distribution resemble a typical ophthalmologist |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible |
| **4. Payer Diversity (this score)** | Whether this provider serves both Medicare and Medicaid populations — the only score that detects payer-selective practice patterns |
| **5. Billing Quality** | Whether charges and code ratios are normal |

## Complementary Scenarios

**Scenario A:** Provider scores 30 on Payer Diversity but 90 on AAO Guideline Concordance. *Interpretation:* Clinically excellent but serving only Medicare patients. For ophthalmology, this is the most common pattern and often structural, not a quality concern.

**Scenario B:** Provider scores 85 on Payer Diversity but 40 on Billing Quality. *Interpretation:* Serves both populations but billing patterns are abnormal. Equitable access but questionable billing practices.

**Scenario C:** Provider scores 90 on Payer Diversity but 50 on Volume Adequacy. *Interpretation:* Bills to both payers broadly but at trace volumes in some categories. Payer breadth doesn't guarantee clinical depth.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **No Medicaid code-level data** | The biggest limitation. Cannot compute true code-by-code payer overlap. Category-level overlap is a proxy. |
| **Commercial insurance invisible** | CMS data covers only Medicare + Medicaid. Many ophthalmology patients are commercially insured, especially for cataract surgery with premium IOLs and refractive services. |
| **Medicaid managed care obscures** | In states with Medicaid managed care, some ophthalmologists may not appear in the CMS Medicaid spending file even though they serve Medicaid patients through MCO contracts. |
| **Vision plan vs. medical insurance** | Ophthalmology straddles medical insurance (Medicare, Medicaid) and vision plans (VSP, EyeMed). Refractive services and routine eye exams may be billed to vision plans, which are invisible in CMS data. |
| **Medicare Advantage gap** | Medicare Advantage patients (~50% of Medicare beneficiaries) may not appear in fee-for-service CMS data. This increasingly underrepresents the ophthalmology Medicare population. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Medicare dominance** | Ophthalmology's elderly patient base means Medicare-only is the norm. Payer diversity is inherently less discriminating for this specialty than for OB-GYN or family medicine. | Reduced weight in composite for single-payer providers + lower p90 threshold. |
| **Medicaid reimbursement suppression** | States with low Medicaid reimbursement for eye care have fewer ophthalmologists accepting Medicaid. This is a policy/economic issue, not a quality signal. | State-level peer cohort partially controls for Medicaid payment levels. |
| **Geographic variation** | States with Medicaid expansion have more dual-payer ophthalmologists. Non-expansion states produce more single-payer flags. | State-level peer cohort is the primary control. |
| **Pediatric ophthalmology** | Pediatric ophthalmologists serve almost entirely Medicaid/CHIP patients. They will appear as single-payer Medicaid, which is expected. | Subspecialist handling with pediatric ophthalmology peer cohort. |

## Update Cadence

- **P90 benchmark:** Recompute annually from latest CMS data release.
- **Single-payer thresholds:** Review annually based on Medicaid expansion status changes and Medicare Advantage penetration.
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
