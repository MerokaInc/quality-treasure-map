# Allergy & Immunology Volume Adequacy: A Sub-Treasure Map

## What This Document Does

This score answers one question: **For the services this allergist claims to provide, is the volume believable?** We identify clinical activity categories where billing just 1–2 services is a red flag — it suggests either credential-padding (listing a service without really performing it) or data anomalies. For each category where a provider has *any* billing, we check whether the volume meets a minimum floor derived from peer behavior. The result is a 0–100 score where higher means more believable volumes.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes, service counts per NPI | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes, service counts per NPI | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes (207K00000X), entity type | Weekly updates |

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207K00000X | Allergy & Immunology |
| **Grouping** | State-level (default), national fallback < 30 providers | |
| **Minimum volume** | >= 50 total services (either payer) | |
| **Entity type** | Type 1 NPI (individual) | |

## Volume Adequacy Categories

We define **10 categories** of clinical activities where trace billing (1–2 claims) is a meaningful red flag for an allergist. We deliberately **exclude** inherently high-volume activities (E/M office visits, routine immunotherapy injections) where even low-volume providers will naturally exceed any reasonable floor.

| # | Category | HCPCS Codes | Why Trace Billing Is a Red Flag | Floor Calculation |
|---|----------|-------------|-------------------------------|-------------------|
| 1 | **Percutaneous Skin Testing** | 95004 | If you do allergy skin testing at all, you do many — a single test session typically involves 20–80 punctures billed as multiple units | peer_median / 3 |
| 2 | **Intradermal Testing** | 95024, 95027 | Follow-up to skin testing; if performed, should reflect systematic workup | peer_median / 3 |
| 3 | **Patch Testing** | 95044 | Applied in panels (typically 36–80 patches); 1–2 services is not a real panel | peer_median / 3 |
| 4 | **Oral Food Challenge** | 95076, 95079 | A food challenge is a structured, supervised procedure; one claim suggests incomplete billing | peer_median / 3 |
| 5 | **Spirometry** | 94010 | If an allergist performs spirometry, they do it routinely for asthma patients — not once a year | peer_median / 3 |
| 6 | **Bronchodilator Response** | 94060 | Paired with spirometry; if present, should appear consistently | peer_median / 3 |
| 7 | **FeNO Testing** | 95012 | Point-of-care test; if the device is present, it should be used regularly | peer_median / 3 |
| 8 | **Antigen Preparation** | 95165 | Preparing allergen extracts requires infrastructure; trace billing suggests coding errors | peer_median / 3 |
| 9 | **IV Infusion** | 96365, 96366 | Infusion requires chair time, nursing, monitoring; 1–2 sessions is not a real infusion program | peer_median / 3 |
| 10 | **Immunoglobulin Quantification** | 82784, 82785 | Lab test for immunodeficiency; if ordered, should reflect ongoing monitoring, not one-off | peer_median / 3 |

### Floor Calculation

For each category, the **volume floor** = peer median service count (for providers who bill that category) / 3.

- We use the median of providers **who bill the category at all** (not all providers in the cohort), because the denominator should reflect normal practice for providers who actually perform this service.
- Dividing by 3 is intentionally generous — we're only flagging the lowest tail, not moderate performers.

**Example:** If the peer median for percutaneous skin testing (among allergists who do any skin testing) is 900 services/year, the floor = 300. A provider with 5 skin test services gets flagged.

## Scoring Logic

For each category, a provider falls into one of three states:

| State | Condition | Meaning |
|-------|-----------|---------|
| `not_detected` | Provider has zero services in this category | Not relevant — provider doesn't claim to offer this service |
| `ok` | Provider has services >= floor | Volume is believable |
| `flag` | Provider has services > 0 but < floor | Trace billing detected — suspicious |

### Score Calculation

```
detected_categories = [c for c in categories if provider_services[c] > 0]
ok_categories = [c for c in detected_categories if provider_services[c] >= floor[c]]
flagged_categories = [c for c in detected_categories if provider_services[c] < floor[c]]

if len(detected_categories) == 0:
    volume_adequacy_score = 50  # neutral — nothing to evaluate
else:
    volume_adequacy_score = (len(ok_categories) / len(detected_categories)) * 100
```

### Worked Examples

**Provider A — Full-scope allergist, all volumes adequate (Score: 100)**
- Detected categories: 8 of 10 (no oral challenge, no IV infusion)
- All 8 detected categories above their floors
- ok = 8, flagged = 0
- **Score: (8/8) * 100 = 100**

**Provider B — Testing-focused, one trace category (Score: 86)**
- Detected categories: 7 of 10
- Skin testing: 1,200 services (floor 300) → ok
- Intradermal: 450 (floor 120) → ok
- Patch testing: 3 services (floor 40) → **flag**
- Spirometry: 280 (floor 90) → ok
- Bronchodilator: 190 (floor 70) → ok
- FeNO: 45 (floor 15) → ok
- Antigen prep: 600 (floor 180) → ok
- ok = 6, flagged = 1
- **Score: (6/7) * 100 = 85.7 → 86**

The 3 patch test services suggest the provider may have billed a handful of patch tests without really running a patch testing program. Worth investigating.

**Provider C — Multiple trace categories (Score: 50)**
- Detected categories: 6 of 10
- Skin testing: 12 services (floor 300) → **flag**
- Intradermal: 2 services (floor 120) → **flag**
- Spirometry: 8 services (floor 90) → **flag**
- Antigen prep: 800 (floor 180) → ok
- Immunotherapy injections tracked elsewhere, but antigen prep is adequate
- IV infusion: 450 (floor 100) → ok
- Ig quant: 180 (floor 50) → ok
- ok = 3, flagged = 3
- **Score: (3/6) * 100 = 50**

This provider has an unusual profile — strong on immunotherapy prep and infusions but trace allergy testing. May be a legitimate immunology-focused practice (check subspecialist flag) or a billing anomaly.

---

# PART C: BUSINESS RULES

---

## Composite Formula

This dimension produces a single score — no sub-components to weight. The score is simply the proportion of detected categories that pass the volume floor.

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider has zero detected categories | Score = **50** (neutral). Nothing to evaluate. |
| Provider has < 50 total services | Do not score. Return `null` with reason = "insufficient_volume." |
| A category has < 5 providers billing it in the peer cohort | Use national median for floor calculation instead of state. Flag category as "national_floor." |
| Peer cohort < 30 providers | Use national peer medians for all floor calculations. |

## Subspecialist Handling

| Subspecialty | Handling |
|-------------|---------|
| Clinical & Laboratory Immunology (207KI0005X) | Trace billing in allergy testing categories (1–4) is **expected**. Exclude allergy-specific categories from the score. Only evaluate immunology-relevant categories (8–10). |
| Pediatric Allergy (2080A0000X) | Use pediatric allergy peer cohort for floor calculation if >= 30 providers available. Pediatric allergists may have different volume patterns. |

## Floor Recalibration

- Floors are recalculated annually when new CMS data is released.
- If the peer median for a category drops below 10 services, the floor effectively becomes 3. At this point, flagging is very permissive — which is appropriate for rare procedures.

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (Caught by This Score) |
|-----------|----------------|--------------------------------------|
| **Guideline Concordance** | Whether clinical guidelines are followed | Doesn't check whether claimed services have adequate volume. A provider could get credit for "having spirometry" even with trace billing. Volume adequacy catches this. |
| **Peer Comparison** | Whether the overall code mix is normal | Peer comparison measures breadth and proportionality but doesn't flag individual categories with suspiciously low volume. A provider might hit enough categories for decent coverage but have 2 services in three of them. |
| **This score (Volume Adequacy)** | Whether individual service volumes are believable | — |
| **Payer Diversity** | Cross-payer consistency | Payer diversity doesn't evaluate absolute volume levels — a provider could have consistent-but-trace billing across both payers. |
| **Billing Quality** | Charge ratios and financial patterns | Billing quality checks price; volume adequacy checks quantity. A provider can have normal charges on 2 services — that's still suspicious volume. |

### Scenario: Provider with high peer comparison but low volume adequacy

A provider bills 21 of 29 reference codes (Peer Comparison = 78) but has trace volumes in 4 categories — skin testing (8 services), spirometry (3 services), patch testing (1 service), FeNO (2 services). The provider's code profile *looks* broad, but the actual volumes in several categories are not credible. Peer Comparison = 78, Volume Adequacy = 43. The combination reveals potential credential-padding.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| CMS data may suppress low-volume line items | Some claims with <= 10 beneficiaries are redacted by CMS for privacy | This actually reinforces volume adequacy — if CMS suppresses a line, the volume is already very low |
| Shared NPI billing (locum tenens) | A provider covering another's patients may have trace billing in categories they don't routinely perform | Document as known limitation; no reliable detection method |
| New practice establishment | A provider who started mid-year will have legitimately lower volumes | Year-over-year trending (future enhancement) would help; currently flagged but not penalized beyond the score |

## Known Biases

| Bias | Direction | Handling |
|------|-----------|---------|
| **Part-time providers** | May have lower volumes across all categories | If they're below floor in most categories they detect, the score appropriately reflects insufficient evidence of practice |
| **Practice setting** | Hospital-based allergists may bill under facility NPI for some services | Type 1 NPI filter reduces this but doesn't eliminate it |
| **Regional procedure availability** | Some procedures (FeNO, food challenges) may be less available in certain regions | State-level cohorting normalizes; national fallback for small cohorts |

## Update Cadence

- **Category definitions:** Reviewed annually. New categories added only if a new procedure type becomes common enough that trace billing is meaningful.
- **Floors:** Recalculated annually from new CMS data.
- **Category list:** Stable unless major CPT/HCPCS code changes occur.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| `npi` | string(10) | National Provider Identifier |
| `provider_name` | string | Provider last name, first name |
| `state` | string(2) | Practice state |
| `data_year` | integer | CMS data year |
| `peer_cohort_level` | string | "state" or "national" |
| `peer_cohort_size` | integer | Number of providers in cohort |
| `total_categories` | integer | Always 10 |
| `detected_categories` | integer | Categories where provider has > 0 services |
| `ok_categories` | integer | Detected categories above floor |
| `flagged_categories` | integer | Detected categories below floor |
| `flagged_category_details` | array[object] | List of {category, code, services, floor, peer_median} for each flag |
| `volume_adequacy_score` | float | 0–100 |
| `subspecialist_flag` | boolean | True if subspecialty taxonomy detected |
| `subspecialist_type` | string | Null or subspecialty name |
| `excluded_categories` | array[string] | Categories excluded due to subspecialist handling |
| `insufficient_volume_flag` | boolean | True if below minimum volume |
| `national_floor_categories` | array[string] | Categories using national floor due to small state cohort |
| `confidence_tier` | string | Always "Tier 2" |
| `score_version` | string | Scoring algorithm version |
