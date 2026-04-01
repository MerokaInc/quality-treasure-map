# Orthopaedic Surgery Volume Adequacy Score: A Sub-Treasure Map

## What This Document Does

This score answers: *For the clinical activities this orthopaedic surgeon claims to perform, is the volume believable?* It sits between guideline concordance ("Do they do the right things?") and peer comparison ("Does their practice look normal?"). Volume adequacy asks: "For the things they bill, do they do enough to suggest genuine, sustained practice — not trace billing?"

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | Role in This Score |
|---------|-------------------|
| **CMS Medicare Physician & Other Practitioners** | Primary data source. Service counts per HCPCS per NPI. Medicare is the dominant payer for most orthopaedic procedures (joint replacement, hip fracture, OA management). |
| **CMS Medicaid Provider Spending** | Supplementary. Captures younger patient volume (trauma, sports injuries). |
| **NPPES NPI Registry** | Peer cohort definition (taxonomy 207X00000X, state, entity type). |

---

# PART B: THE LOGIC

---

## 1. Visit Volume as Denominator

Every volume check is a ratio: **category volume / total E/M + procedural visit volume**.

Visit codes used as denominator:
- **E/M visits:** 99202–99215 (new + established office visits)
- **Surgical encounters:** Sum of all procedural HCPCS codes billed (arthroplasty, arthroscopy, fracture, etc.)

Combined denominator = total_encounters = E/M visits + unique procedural encounters.

**Minimum encounter volume:** ≥ 50 total encounters. Providers below this threshold are excluded (insufficient data to assess volume patterns).

> **ASSUMPTION:** Unlike pediatrics where the denominator is purely E/M visits, orthopaedic surgery requires including procedural encounters because a significant proportion of orthopaedic "practice" is surgical, not visit-based. A surgeon with 200 procedures and 30 office visits should not be penalized for a low E/M denominator. **We use total encounters as the denominator for rate calculations.**

---

## 2. Ten Categories with Floors

We define **10 clinical activity categories** where trace billing (1–2 claims) is a meaningful signal worth flagging. We deliberately exclude inherently high-volume codes (E/M visits) and focus on procedural and service categories where low volume raises questions about genuine practice.

Floors are set at **peer median rate / 3** (computed from state-level peer cohort). National defaults below are starting estimates.

> **ASSUMPTION:** Floor values below are estimates based on general orthopaedic practice patterns. **External resource needed:** Actual floors should be computed from CMS data by calculating the median rate for each category within the 207X00000X peer cohort, then dividing by 3.

| # | Category | HCPCS Codes | What It Checks | Est. National Default Floor (% of encounters) |
|---|----------|-------------|---------------|----------------------------------------------|
| 1 | **Total Knee Arthroplasty** | 27447 | Core joint replacement competency | 2% |
| 2 | **Total Hip Arthroplasty** | 27130 | Core joint replacement competency | 1.5% |
| 3 | **Knee Arthroscopy** | 29881, 29882, 29880 | Meniscal surgery activity | 1.5% |
| 4 | **Shoulder Arthroscopy** | 29827, 29826, 29823, 29824 | Rotator cuff and shoulder surgery | 1% |
| 5 | **ACL Reconstruction** | 29888 | Ligament reconstruction activity | 0.5% |
| 6 | **Fracture Fixation (Upper Extremity)** | 25607-25609, 23515, 24538 | Upper extremity fracture management | 0.5% |
| 7 | **Fracture Fixation (Lower Extremity)** | 27235, 27236, 27244, 27506 | Lower extremity fracture management (incl. hip fracture) | 1% |
| 8 | **Joint Injections** | 20610, 20611 | Non-operative management activity | 2% |
| 9 | **Carpal Tunnel Release** | 64721, 29848 | Hand/upper extremity minor procedure | 0.3% |
| 10 | **Shoulder Arthroplasty** | 23472, 23473, 23474 | Shoulder replacement activity | 0.3% |

### Why These Categories?

- **Joint replacement (categories 1, 2, 10):** Volume-outcome relationship is well-established. Low-volume joint replacement is a genuine quality concern per CMS and multiple studies.
- **Arthroscopy (categories 3, 4, 5):** High-variability procedures. Trace billing of arthroscopy codes suggests the provider may not maintain adequate surgical skill.
- **Fracture care (categories 6, 7):** Core orthopaedic competency. A general orthopaedist billing 1 fracture fixation per year is unusual.
- **Injections (category 8):** Most common non-operative orthopaedic procedure. Trace injection billing from a provider who also does arthroplasty may signal incomplete claims capture rather than a quality issue — but still worth flagging.
- **Carpal tunnel (category 9):** Common minor procedure. Trace billing suggests dabbling rather than competency.

### What's NOT a Category (and Why)

| Excluded | Why |
|----------|-----|
| E/M visits (99213, 99214, etc.) | Inherently high-volume. Every orthopaedist has office visits. Not informative for volume adequacy. |
| Spinal procedures | Excluded because spine surgery has its own subspecialty taxonomy (207XX0801X). General orthopaedists doing spine should be flagged via subspecialist handling, not volume adequacy. |
| Casting/splinting (29xxx) | Ancillary to fracture care, not independently meaningful for volume check. |

---

## 3. Scoring Each Category

For each of the 10 categories, a provider receives one of three states:

| State | Condition | Meaning |
|-------|-----------|---------|
| **not_detected** | Provider bills 0 services in this category | Not part of their practice. Excluded from scoring denominator. |
| **ok** | category_rate ≥ floor | Volume is at or above the minimum believable threshold. |
| **flag** | 0 < category_rate < floor | Provider bills this category but at trace volume. Raises a question. |

Where:
```
category_rate = category_services / total_encounters * 100
```

---

## 4. Volume Adequacy Score

```
detected_categories = count of categories with state "ok" or "flag"
ok_categories = count of categories with state "ok"

volume_adequacy_score = (ok_categories / detected_categories) * 100
```

**Neutral fallback:** If `detected_categories = 0` (provider only has E/M visits, no procedural categories detected), score = **50**.

**Why neutral?** A provider with no detected procedural categories is already penalized in peer comparison (low code coverage) and guideline concordance (no procedure-based measures). Volume adequacy asks "of what you *claim* to do, is it real?" If you claim nothing procedural, the answer is neither yes nor no.

### Worked Examples

**Provider A — Full-spectrum orthopaedist:**
- Detected categories: TKA (ok), THA (ok), knee arthroscopy (ok), shoulder arthroscopy (ok), ACL (ok), fractures upper (ok), fractures lower (ok), injections (ok), carpal tunnel (flag — only 2 CTRs), shoulder arthroplasty (not_detected)
- detected = 9, ok = 8
- **Score: (8/9) × 100 = 88.9**

**Provider B — Joint replacement specialist:**
- Detected: TKA (ok), THA (ok), injections (ok), shoulder arthroplasty (ok). All others not_detected.
- detected = 4, ok = 4
- **Score: (4/4) × 100 = 100.0** (narrow but believable in what they do)

**Provider C — Dabbler with trace billing across many categories:**
- Detected: TKA (flag — 1 case), knee arthroscopy (flag — 2 cases), ACL (flag — 1 case), injections (ok), fractures lower (flag — 1 case)
- detected = 5, ok = 1
- **Score: (1/5) × 100 = 20.0** (red flag — trace volume across multiple surgical categories)

---

# PART C: BUSINESS RULES

---

## Floor Computation

- **Default:** peer median rate / 3 for each category, computed from state-level peer cohort.
- **National fallback:** Use national peer cohort if state cohort < 30 providers.
- **Annual rebuild:** Floors are recomputed each time CMS releases new data.

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider has < 50 total encounters | Excluded from scoring |
| CMS suppresses a code (< 11 beneficiaries) | That code's volume is treated as 0 for the category. If all codes in a category are suppressed, category = not_detected. |
| All 10 categories are not_detected | Score = 50 (neutral fallback) |
| Only 1 category detected | Score computed from that single category. Flag "single_category_detected" in output. |

## Subspecialist Handling

- Subspecialists (by taxonomy code) are excluded from the general orthopaedic peer cohort.
- A hand surgeon would naturally have not_detected for joint replacement and arthroscopy — this is expected, not a flag.
- Volume adequacy for subspecialists should use specialty-specific categories (future enhancement).

## Volume-Outcome Context

For joint replacement specifically (categories 1, 2, 10), there is strong evidence that higher surgical volume correlates with better outcomes. While this score does not directly measure outcomes, a "flag" state for joint replacement categories is a more concerning signal than a "flag" for injections or carpal tunnel.

> **ASSUMPTION:** We do not differentially weight "flag" severity by category in this version. All flags are treated equally in the score formula. A future enhancement could weight surgical flags more heavily than non-surgical flags. **Recommend discussing with clinical advisors.**

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What Volume Adequacy Adds |
|-----------|----------------|--------------------------|
| **Guideline Concordance** | Whether procedures align with AAOS guidelines | Whether the guideline-concordant procedures are done at believable volume |
| **Peer Comparison** | Whether the overall billing pattern is normal | Peer comparison measures breadth; volume adequacy flags trace billing in specific categories |
| **Volume Adequacy** (this score) | Whether claimed activities are done at believable volume | — |
| **Payer Diversity** | Whether practice is consistent across payers | Payer diversity is code-type agnostic; volume adequacy is category-specific |
| **Billing Quality** | Whether charges and ratios are normal | A provider with normal charges but trace surgical volume could be doing real procedures at tiny scale — volume adequacy catches this |

### Complementary Scenarios

1. **Provider bills 25 reference codes (great peer comparison) but does 1 TKA/year** → Peer comparison score is high, but volume adequacy flags TKA as trace volume.
2. **Provider does 200 TKAs/year but no arthroscopy, no fractures, no injections** → Volume adequacy score = 100 (all detected categories are ok), but peer comparison score is low (narrow code coverage).
3. **Provider has good guideline concordance scores but only because they bill the *right codes* at trace volume** → Guideline concordance may look acceptable; volume adequacy catches the low-volume reality.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact |
|-----------|--------|
| **Cannot distinguish primary vs. assistant surgeon** | A provider listed as assistant surgeon on a TKA still accumulates volume for that code. May inflate apparent volume. |
| **Aggregated data** | Cannot determine if services are spread across the year or clustered (e.g., locum tenens work). |
| **Medicare-Medicaid merge** | Younger patient volume (trauma, sports) appears in Medicaid. Merging both payer files gives more complete picture but introduces double-counting risk if the same service appears in both (unlikely but possible for dual-eligible patients). |

## Known Biases

| Bias | Direction |
|------|-----------|
| **New graduates** | Will naturally have lower volume in their first 1–2 years. May score low on volume adequacy despite building a legitimate practice. Consider a "new provider" flag based on NPPES enumeration date. |
| **Part-time providers** | Surgeons who work part-time or split time across institutions may appear low-volume. Not necessarily a quality concern. |
| **Locum tenens** | Traveling surgeons billing under their own NPI may have unusual volume patterns. |

## Confidence Tier

**Tier 2** — Utilization volume proxy. Measures whether billing volume is believable, not whether clinical quality is adequate.

## Update Cadence

Rebuild floors and peer medians annually from latest CMS data.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| npi | string | 10-digit NPI |
| provider_last_name | string | From NPPES |
| provider_first_name | string | From NPPES |
| provider_state | string | 2-letter state code |
| total_encounters | integer | E/M visits + procedural encounters |
| total_em_visits | integer | E/M visit count only |
| total_procedural | integer | Procedural encounter count only |
| cat_1_tka_services | integer | Service count for TKA |
| cat_1_tka_rate | float | Rate as % of encounters |
| cat_1_tka_floor | float | Peer-derived floor |
| cat_1_tka_status | string | "not_detected", "ok", or "flag" |
| cat_2_tha_services | integer | Service count for THA |
| cat_2_tha_rate | float | Rate as % of encounters |
| cat_2_tha_floor | float | Peer-derived floor |
| cat_2_tha_status | string | "not_detected", "ok", or "flag" |
| cat_3_knee_arthroscopy_services | integer | Service count |
| cat_3_knee_arthroscopy_rate | float | Rate |
| cat_3_knee_arthroscopy_floor | float | Floor |
| cat_3_knee_arthroscopy_status | string | Status |
| cat_4_shoulder_arthroscopy_services | integer | Service count |
| cat_4_shoulder_arthroscopy_rate | float | Rate |
| cat_4_shoulder_arthroscopy_floor | float | Floor |
| cat_4_shoulder_arthroscopy_status | string | Status |
| cat_5_acl_services | integer | Service count |
| cat_5_acl_rate | float | Rate |
| cat_5_acl_floor | float | Floor |
| cat_5_acl_status | string | Status |
| cat_6_fracture_upper_services | integer | Service count |
| cat_6_fracture_upper_rate | float | Rate |
| cat_6_fracture_upper_floor | float | Floor |
| cat_6_fracture_upper_status | string | Status |
| cat_7_fracture_lower_services | integer | Service count |
| cat_7_fracture_lower_rate | float | Rate |
| cat_7_fracture_lower_floor | float | Floor |
| cat_7_fracture_lower_status | string | Status |
| cat_8_injections_services | integer | Service count |
| cat_8_injections_rate | float | Rate |
| cat_8_injections_floor | float | Floor |
| cat_8_injections_status | string | Status |
| cat_9_carpal_tunnel_services | integer | Service count |
| cat_9_carpal_tunnel_rate | float | Rate |
| cat_9_carpal_tunnel_floor | float | Floor |
| cat_9_carpal_tunnel_status | string | Status |
| cat_10_shoulder_arthroplasty_services | integer | Service count |
| cat_10_shoulder_arthroplasty_rate | float | Rate |
| cat_10_shoulder_arthroplasty_floor | float | Floor |
| cat_10_shoulder_arthroplasty_status | string | Status |
| detected_categories | integer | Count of categories with ok or flag |
| ok_categories | integer | Count of categories with ok |
| flagged_categories | integer | Count of categories with flag |
| single_category_flag | boolean | True if only 1 category detected |
| volume_adequacy_score | float | 0–100 |
| confidence_tier | string | Always "Tier 2" |
| peer_cohort_level | string | "state" or "national" |
| peer_cohort_size | integer | Number of providers in cohort |
