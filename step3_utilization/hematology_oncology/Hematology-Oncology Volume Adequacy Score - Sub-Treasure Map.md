# Hematology/Oncology Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

The peer comparison doc asks: "does this provider bill the same codes as peers?" This doc asks a narrower question: "for the codes they do bill, is the volume believable?"

A provider who bills bone marrow biopsy code 38222 once per year is not performing bone marrow biopsies as part of routine practice. They billed it once. That is trace billing — a code that appears in the claims file but at a volume too low to represent genuine, ongoing capability in that service area.

Trace billing is not fraud. It can happen for many legitimate reasons: a provider transitioning their practice focus, a one-off case, a billing correction. But when we see trace billing across multiple categories, it raises questions about whether the provider's claims profile accurately represents their actual practice.

This score flags categories where a provider's volume falls below a minimum floor derived from peer norms. It does not penalize low-volume categories that are inherently rare. It only flags categories where most peers who bill these codes do so at meaningfully higher volumes.


---

# PART A: WHAT WE HAVE

---

Same free CMS data:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count. Primary source for hem/onc.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + claim count + beneficiary count. Supplementary.
3. **NPPES NPI Registry** — provider identification, taxonomy code 207RH0003X.

Volume adequacy needs service counts per NPI per code. Both CMS files provide this. We combine both files for total volume when both are available.


---

# PART B: THE LOGIC

---


## 1. Peer Cohort (Same as Other Dimensions)

| Filter | Rule |
|---|---|
| Taxonomy | 207RH0003X (Hematology & Oncology) |
| State | Same state as provider being scored |
| Volume | >= 50 total Medicare services |
| Entity type | Individual (Type 1 NPI) |
| National fallback | When state cohort < 30 providers |


## 2. Volume Adequacy Categories

We define 10 categories of clinical activity where volume matters. For each category, we identify the HCPCS codes, compute the peer median volume (among providers who bill at least one service in that category), and set a floor at **peer median / 3**. Volumes below the floor are flagged.

**Why peer median / 3?** This is a generous threshold. A provider billing at one-third the median volume for a category is not necessarily inadequate — but they are at the low end of believable practice. The floor catches trace billing (1-5 services) without flagging providers who simply have smaller panels.

| # | Category | Codes | What Adequate Volume Looks Like | Why Trace Billing Matters |
|---|---|---|---|---|
| 1 | **Chemotherapy infusion** | 96413, 96415, 96416, 96417 | Peer median ~300-600 services/year. Floor ~100-200. | An oncologist billing 3 chemo infusions/year is not running an infusion practice. |
| 2 | **Chemotherapy IV push** | 96409, 96411 | Peer median ~50-150 services/year. Floor ~17-50. | Some regimens are push-only. But 1-2 pushes/year is not a pattern. |
| 3 | **Hormonal therapy injection** | 96402 | Peer median ~20-80 services/year. Floor ~7-27. | Leuprolide/goserelin injections for prostate/breast cancer. Should recur monthly or quarterly per patient. |
| 4 | **Non-chemo therapeutic infusion** | 96365, 96366, 96367 | Peer median ~100-300 services/year. Floor ~33-100. | Iron infusions, rituximab maintenance, biologics. Should be recurring. |
| 5 | **Supportive injections** | 96372, 96374, 96375 | Peer median ~200-500 services/year. Floor ~67-167. | Growth factors, antiemetics, premeds. High-frequency in active chemo practice. |
| 6 | **Hydration** | 96360, 96361 | Peer median ~100-250 services/year. Floor ~33-83. | Standard co-administration with many chemo regimens. |
| 7 | **Bone marrow biopsy/aspiration** | 38220, 38222 | Peer median ~10-40 services/year among providers who do them. Floor ~3-13. | Essential diagnostic procedure for hematologic malignancies. 1 per year is not an active practice. |
| 8 | **Transfusion** | 36430, 36455 | Peer median ~15-50 services/year. Floor ~5-17. | Blood product administration for anemia management. |
| 9 | **In-office laboratory** | 36415, 85025, 80053 | Peer median ~200-800 services/year. Floor ~67-267. | Routine labs before every chemo cycle. Very high volume expected. |
| 10 | **Psychosocial screening** | 96127, 96160, 96161 | Peer median ~20-80 services/year among providers who bill these. Floor ~7-27. | NCCN recommends distress screening for all cancer patients. |

**Categories deliberately excluded from volume adequacy:**

| Excluded Category | Why |
|---|---|
| **E/M visits (99211-99215)** | Every hem/onc provider bills E/M codes at high volume. There is no trace billing problem here. |
| **New patient visits (99205)** | Volume depends entirely on referral patterns and practice size. Low volume is not a red flag. |
| **G2211 (complexity add-on)** | Adoption varies by coding awareness, not clinical practice. |
| **Genetic testing codes** | Many providers appropriately refer genetic testing to specialized labs. Absence is not a volume flag. |


## 3. Computing Floors

For each category, the floor is computed from the peer cohort:

```
For category C with codes [c1, c2, ...]:

    provider_volume(NPI) = SUM(total_services for codes c1, c2, ...) for this NPI

    active_peers = all NPIs in peer cohort WHERE provider_volume(NPI) > 0

    IF COUNT(active_peers) < 10:
        -- Not enough peers bill this category to compute a reliable floor
        -- Skip this category for all providers
        category_status = "insufficient_peer_data"
    ELSE:
        peer_median = MEDIAN(provider_volume across active_peers)
        floor = peer_median / 3
```


## 4. Scoring a Provider

For each category, classify the provider into one of three states:

```
For each category C:

    provider_volume = SUM(total_services for codes in C) for this NPI

    IF provider_volume = 0:
        state = "not_detected"     -- provider doesn't bill these codes at all

    ELIF provider_volume < floor:
        state = "flag"             -- trace billing: volume below minimum floor

    ELSE:
        state = "ok"              -- adequate volume
```

**The score:**

```
detected_categories = categories WHERE state IN ("ok", "flag")
    -- only score categories where the provider bills at least one code

ok_count = COUNT of categories WHERE state = "ok"
flag_count = COUNT of categories WHERE state = "flag"

IF COUNT(detected_categories) = 0:
    volume_adequacy_score = 50     -- neutral: provider bills none of these category codes
    -- This would be very unusual for a hem/onc provider. Flag for review.

ELSE:
    volume_adequacy_score = (ok_count / COUNT(detected_categories)) * 100
```

**Interpretation:**

| Score | Meaning |
|---|---|
| 100 | Every category the provider bills has adequate volume. No trace billing detected. |
| 80-99 | Most categories adequate. 1-2 categories flagged for low volume. |
| 50-79 | Multiple categories flagged. Significant trace billing. |
| Below 50 | More flagged categories than adequate ones. Provider's billing profile does not match their apparent scope. |
| 50 (neutral) | Provider bills none of the checked categories. Unusual — likely a consultative-only practice or data issue. |


## 5. Worked Examples

**Provider E (active community oncologist, Florida):**

```
Category              Volume    Floor    State
Chemo infusion          420      150     ok
Chemo IV push            85       25     ok
Hormonal injection       45       10     ok
Non-chemo infusion      180       50     ok
Supportive injections   350       80     ok
Hydration               200       50     ok
Bone marrow biopsy       22        5     ok
Transfusion              35        8     ok
In-office lab           650      100     ok
Psychosocial screening   60       10     ok

detected = 10, ok = 10, flag = 0
volume_adequacy_score = 10/10 * 100 = 100.0
```

**Provider F (hematology-focused, New York):**

```
Category              Volume    Floor    State
Chemo infusion            0       --     not_detected
Chemo IV push             0       --     not_detected
Hormonal injection        0       --     not_detected
Non-chemo infusion       85       50     ok
Supportive injections    40       80     flag  (below floor)
Hydration                 0       --     not_detected
Bone marrow biopsy       30        5     ok
Transfusion              45        8     ok
In-office lab           400      100     ok
Psychosocial screening    3       10     flag  (below floor)

detected = 6, ok = 4, flag = 2
volume_adequacy_score = 4/6 * 100 = 66.7
```

**Provider G (suspicious profile, Texas):**

```
Category              Volume    Floor    State
Chemo infusion            3      150     flag
Chemo IV push             1       25     flag
Hormonal injection        2       10     flag
Non-chemo infusion        5       50     flag
Supportive injections    12       80     flag
Hydration                 2       50     flag
Bone marrow biopsy        1        5     flag
Transfusion               0       --     not_detected
In-office lab            15      100     flag
Psychosocial screening    0       --     not_detected

detected = 8, ok = 0, flag = 8
volume_adequacy_score = 0/8 * 100 = 0.0

Every detected category is trace billing. This provider bills the codes
of an active oncology practice at volumes that are 1-2% of peer norms.
```


---

# PART C: BUSINESS RULES

---


## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider bills zero codes in all 10 categories | Score = 50 (neutral). Flag as `no_volume_categories_detected`. Extremely unusual — verify NPI is actually hem/onc. |
| Category has < 10 active peers in the cohort | Skip category. Do not include in detected count or scoring. Mark as `insufficient_peer_data`. |
| Provider has fewer than 11 unique beneficiaries total | All scores = NULL. Mark as `low_volume_excluded`. |
| State peer cohort < 30 providers | Use national cohort for floor computation. Mark as `national_fallback`. |
| Medicare and Medicaid volumes both available | Sum volumes across both files before comparing to floor. |
| Only one payer file available | Use available file. Mark `data_completeness` accordingly. Floors may be lower if computed from single-payer cohort. |


## Subspecialist Handling

| Provider Type | Detection | Handling |
|---|---|---|
| **Hematology-only** | Taxonomy 207RH0000X OR chemo categories all `not_detected` | Score only on categories relevant to hematology practice (non-chemo infusion, bone marrow, transfusion, in-office lab, psychosocial). Exclude chemo-related categories from detected count. |
| **Oncology-only (medical oncology)** | Taxonomy 207RX0202X | Include in cohort but flag. Unlikely to do bone marrow biopsies. Exclude bone marrow category from detected count. |
| **Infusion-center-only** | High chemo/infusion volume, minimal E/M, no procedures | Score normally — volume adequacy should be high for their billed categories. Other dimensions will flag the narrow scope. |


## Interaction with Other Dimensions

Volume adequacy is designed to catch a specific failure mode that other dimensions miss: a provider whose code coverage looks reasonable (Peer Comparison score is moderate) but whose volume in each category is implausibly low. The Peer Comparison score can be 70+ if the provider bills 18 of 25 reference codes, even if most of those codes have only 1-2 services. Volume adequacy catches that discrepancy.


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## What Each Dimension Catches

| Dimension | What It Catches | What It Misses (Caught by Others) |
|---|---|---|
| **1. Guideline Concordance** | Whether care aligns with ASH/NCCN supportive care and practice patterns | Whether volume is adequate (this doc) |
| **2. Peer Comparison** | Whether code set breadth and distribution match peers | Whether each category has believable volume (this doc) |
| **3. Volume Adequacy** (this doc) | Whether detected categories have adequate volume (vs. trace billing) | Whether the right codes are billed (Dim 2), whether care is guideline-concordant (Dim 1), whether pricing is fair (Dim 5) |
| **4. Payer Diversity** | Whether practice patterns differ by payer | Whether volumes are adequate within either payer (this doc) |
| **5. Billing Quality** | Charge outliers and code ratio anomalies | Whether the underlying volumes are adequate (this doc) |


## Complementary Scenarios

**Scenario 1:** Provider scores 85 on Peer Comparison (broad code set) but 25 on Volume Adequacy (7 of 8 detected categories are flagged). The provider's billing looks comprehensive on paper but the volumes are implausibly low. This is the classic trace-billing pattern — possibly a provider maintaining a billing profile without substantive practice.

**Scenario 2:** Provider scores 40 on Peer Comparison (narrow code set) but 100 on Volume Adequacy (all detected categories have adequate volume). The provider is specialized — they don't do everything, but what they do, they do at real volume. The low peer comparison score is about scope, not quality.

**Scenario 3:** Provider scores 90 on Volume Adequacy but 35 on Billing Quality (charge-to-allowed ratio is an extreme outlier). They have real volume and practice comprehensively, but their pricing is anomalous. Volume adequacy says "this is a real practice." Billing quality says "investigate the financial side."


---

# PART E: RISKS AND LIMITATIONS

---


## Data Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| **Floors based on peer median** | Peer median is a moving target — it changes with each annual data release and varies by state | Rebuild annually. Document the floor values used for each scoring run. |
| **Combined Medicare + Medicaid may double-count** | If a code appears in both files for the same NPI, volumes are summed. This is correct for total volume but the floor was also computed from combined data. | Compute floors from same combined source. Consistent methodology. |
| **New practices have low volume legitimately** | A provider in their first year of practice will have low volume across all categories | Consider excluding NPIs with < 1 year of data. NPPES enumeration date available. |
| **Part-year data** | Provider who retires mid-year or moves states will have partial volume | No direct mitigation. Partial-year providers will tend to score lower. Consider annualizing if month-level data available from Medicaid file. |


## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Large practices score higher** | More patients = more volume = easier to clear floors | Floors are generous (median / 3). Even small solo practices should clear them if actively practicing. |
| **Hospital-based vs. office-based** | Hospital-based providers may bill fewer drug admin codes (facility billing) | Place-of-service field available in Medicare. Could stratify floors. Not implemented now. |
| **Group NPI vs. individual NPI** | Some services billed under group NPI won't appear on individual NPI | No mitigation from these data. Score reflects individual NPI billing. |


## Update Cadence

Peer medians and floors rebuilt annually. Category definitions reviewed annually for new codes (e.g., new biosimilar admin codes).


---

# OUTPUT SCHEMA

---

One row per NPI. All scores on 0-100 scale.

| Field | Type | Description |
|---|---|---|
| npi | string | 10-digit National Provider Identifier |
| provider_name | string | Provider name from NPPES |
| provider_state | string | 2-letter state code |
| taxonomy_code | string | NPPES taxonomy |
| measurement_year | integer | Year of CMS data |
| peer_cohort_level | string | "state" or "national_fallback" |
| peer_cohort_size | integer | Number of providers in comparison cohort |
| categories_detected | integer | Number of categories where provider bills at least one code (0-10) |
| categories_ok | integer | Number of detected categories with adequate volume |
| categories_flagged | integer | Number of detected categories with trace billing |
| categories_not_detected | integer | Number of categories with zero billing |
| flagged_category_names | string[] | List of category names with trace billing |
| not_detected_category_names | string[] | List of category names with zero billing |
| volume_adequacy_score | float | (categories_ok / categories_detected) * 100, or 50 if detected = 0 |
| category_detail | object[] | Per-category detail: {category_name, provider_volume, peer_median, floor, state} |
| subspecialist_flag | string | "general_hemonc", "hematology_focused", "oncology_focused", or null |
| no_volume_categories_detected | boolean | True if all 10 categories have zero billing |
| low_volume_excluded | boolean | True if provider has < 11 unique beneficiaries |
| data_completeness | string | "full", "medicare_only", "medicaid_only" |
| score_confidence_tier | string | Always "tier_2_proxy" for this version |
