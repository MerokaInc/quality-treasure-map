# Allergy & Immunology Billing Quality: A Sub-Treasure Map

## What This Document Does

This score answers one question: **Are this allergist's charges, code ratios, and E/M distribution normal?** We examine three aspects of billing behavior: (1) whether charges are within expected ranges for the specialty, (2) whether clinically meaningful procedure-to-procedure ratios signal good or problematic practice, and (3) whether E/M code distribution matches expected complexity for allergy/immunology. The result is a 0–100 score where higher means more normal billing patterns. A low score does not prove fraud — it identifies providers whose billing deserves a closer look.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes, service counts, average submitted charge, average Medicare allowed amount, average Medicare payment per NPI | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes, service counts per NPI (no charge data for Medicaid) | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes, practice location, entity type | Weekly updates |

**Important:** Charge data is only available in the Medicare file. Medicaid data contributes to volume-based ratio checks but not to charge analysis.

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207K00000X | Allergy & Immunology |
| **Grouping** | State-level (default), national fallback < 30 providers | |
| **Minimum volume** | >= 50 Medicare services (for charge analysis) OR >= 100 total services (for ratio analysis) | |
| **Entity type** | Type 1 NPI (individual) | |

## Component 1: Charge Analysis (Weight: 35%)

### E/M Code Distribution

Allergy & Immunology has a distinct E/M complexity distribution. Allergists typically bill a mix of lower-complexity visits (immunotherapy follow-ups, quick allergy checks) and higher-complexity visits (new patient workups, complex immunodeficiency management).

**Expected E/M distribution for Allergy & Immunology (established patients):**

| Code | Description | Expected Share | Rationale |
|------|------------|----------------|-----------|
| 99211 | Minimal | 2–8% | Nurse-only immunotherapy injection visits |
| 99212 | Straightforward | 3–10% | Simple follow-ups |
| 99213 | Low-moderate | 25–40% | Routine allergy follow-ups, stable asthma |
| 99214 | Moderate-high | 30–45% | Complex allergy management, immunotherapy adjustments |
| 99215 | High | 5–15% | New diagnoses, complex immunodeficiency, multi-system allergic disease |

**Upcoding signal:** If 99215 > 25% of established visits, or 99214+99215 > 75%, this is unusual for allergy/immunology and warrants review.

**Downcoding signal:** If 99211+99212 > 40% of established visits, the provider may be underdocumenting complexity.

### Charge-to-Allowed Ratio

For each HCPCS code the provider bills in Medicare:

```
charge_ratio = average_submitted_charge / average_medicare_allowed_amount
```

Compare to peer cohort percentiles:

| Provider's Position | Charge Sub-Score |
|--------------------|-----------------|
| Between p25 and p75 | 100 (normal range) |
| Between p10 and p25 OR p75 and p90 | 70 (mildly unusual) |
| Below p10 or above p90 | 40 (outlier) |

### Charge Score Calculation

```
For each code c with charge data:
    ratio[c] = submitted_charge[c] / allowed_amount[c]
    peer_ratios = [ratio for all peers]

    if p25 <= ratio[c] <= p75:
        code_score[c] = 100
    elif p10 <= ratio[c] <= p90:
        code_score[c] = 70
    else:
        code_score[c] = 40

# Weight by service volume (codes with more services matter more)
charge_score = sum(code_score[c] * services[c] for c) / sum(services[c] for c)

# E/M distribution adjustment
em_distribution = compute_em_shares(provider)
em_penalty = 0
if share_99215 > 0.25:
    em_penalty += 10
if (share_99214 + share_99215) > 0.75:
    em_penalty += 10
if (share_99211 + share_99212) > 0.40:
    em_penalty += 5

charge_score = max(0, charge_score - em_penalty)
```

## Component 2: Ratio Analysis (Weight: 65%)

Ratio analysis examines whether clinically meaningful procedure-to-procedure relationships are normal. We define green flags (good signals), red flags (concerning signals), and cross-category consistency checks.

### Green Flag Ratios (Good Practice Signals)

| # | Ratio | Numerator | Denominator | Expected Range | Clinical Logic |
|---|-------|-----------|-------------|----------------|---------------|
| 1 | Skin test-to-visit | 95004 services | 99213+99214+99215 | 0.3–1.5 | Skin testing should accompany a meaningful portion of visits |
| 2 | Immunotherapy-to-testing | 95115+95117 | 95004+86003 | 0.5–3.0 | Testing should lead to treatment |
| 3 | Spirometry-to-asthma visits | 94010 | 99213+99214 (subset) | 0.05–0.40 | Objective testing for asthma patients |
| 4 | Bronchodilator-to-spirometry | 94060 | 94010 | 0.30–0.80 | Reversibility testing should accompany a substantial portion of spirometry |
| 5 | Antigen prep-to-injections | 95165 | 95115+95117 | 0.05–0.50 | Providers who inject should also prepare antigens |
| 6 | New-to-established visit | 99203+99204+99205 | 99213+99214+99215 | 0.05–0.30 | Healthy pipeline of new patients balanced against continuity care |
| 7 | FeNO-to-spirometry | 95012 | 94010 | 0.10–0.60 | FeNO complements spirometry for asthma assessment |
| 8 | IgE-to-skin testing | 86003+86005 | 95004 | 0.05–0.80 | In-vitro testing as complement or alternative to skin testing |

### Red Flag Ratios (Concerning Signals)

| # | Ratio | Numerator | Denominator | Red Flag If | Clinical Concern |
|---|-------|-----------|-------------|------------|-----------------|
| 1 | Intradermal-to-percutaneous | 95024+95027 | 95004 | > 1.0 | More intradermal than percutaneous — guidelines say percutaneous first |
| 2 | High E/M concentration | 99215 | all E/M | > 0.25 | Upcoding risk — 99215 is complex/chronic, not typical allergy visit |
| 3 | Testing without visits | 95004 | all E/M | > 2.0 | More test services than visit services — possible unbundling |
| 4 | Injection-only practice | 95115+95117 | all services | > 0.70 | Practice dominated by immunotherapy injections with minimal evaluation |
| 5 | Patch testing dominance | 95044 | 95004 | > 0.50 | More patch testing than percutaneous — unusual practice pattern |
| 6 | Challenge-to-testing | 95076+95079 | 95004+86003 | > 0.30 | Disproportionate challenge testing relative to initial diagnostic testing |
| 7 | Infusion without Ig ordering | 96365 | 82784+82785 | > 5.0 | Many infusions without corresponding immunodeficiency workup |
| 8 | Single E/M code dominance | max(any single E/M) | all E/M | > 0.60 | Lack of documentation nuance — same code for every visit |
| 9 | High beneficiary-to-service | total services | unique beneficiaries | > 50 | Extremely high service intensity per patient |
| 10 | Testing without follow-up | 95004 services / 95004 beneficiaries | 99213+99214 services / same beneficiaries | > 5.0 | Many tests per patient without proportionate follow-up visits |

### Cross-Category Consistency Checks

| # | Check | Codes Involved | Expected | Concern If Violated |
|---|-------|---------------|----------|-------------------|
| 1 | Skin testing → immunotherapy pathway | 95004 + (95115 OR 95117) | Both present if either > 100 services | Testing without treatment or treatment without testing |
| 2 | Spirometry → bronchodilator pairing | 94010 + 94060 | 94060 present if 94010 > 50 services | Spirometry without reversibility testing |
| 3 | Immunotherapy → antigen preparation | (95115 OR 95117) + 95165 | 95165 present if immunotherapy > 200 services | Injecting without preparing antigens (referral pattern is OK but should be flagged) |
| 4 | Infusion → immunoglobulin drugs | 96365 + (J1459 OR J1557 OR J1561) | Drug code present if infusion > 20 services | Infusion time without corresponding drug billing |
| 5 | High-complexity visits → complex services | 99215 + (95004 OR 94010 OR 95076 OR 96365) | At least one procedure code if 99215 > 30 services | High-complexity E/M without supporting procedures |
| 6 | IgE testing → allergy diagnosis pathway | 86003 + (95004 OR 95115) | At least one allergy procedure if IgE > 50 services | In-vitro testing without skin testing or immunotherapy follow-through |
| 7 | FeNO → spirometry pairing | 95012 + 94010 | Both present if either > 20 services | These tests are complementary for asthma assessment |

### Ratio Score Calculation

Each ratio and consistency check produces one of three outcomes:

| Outcome | Value | Meaning |
|---------|-------|---------|
| **Green** | 1.0 | Ratio is within expected range / check passes |
| **Neutral** | 0.5 | Cannot evaluate (insufficient data for this ratio) |
| **Red** | 0.0 | Ratio is outside expected range / check fails |

```
green_count = count of green outcomes
neutral_count = count of neutral outcomes
red_count = count of red outcomes
total_checks = green_count + neutral_count + red_count

ratio_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0)) / total_checks * 100
```

## Composite Billing Quality Score

```
billing_quality_score = (charge_score * 0.35) + (ratio_score * 0.65)
```

Ratio analysis gets higher weight because it captures clinical logic — whether the right services go together. Charge analysis captures financial behavior.

### Worked Examples

**Provider A — Clean billing patterns (Score: 88)**
- Charge ratios: 85% of volume in p25-p75 range, 15% in p10-p90 → charge_score = 95.5
- E/M distribution: 99213 = 35%, 99214 = 38%, 99215 = 10% → no penalty
- Green flags: 6 of 8 green, 2 neutral → ratio component from greens = 6.0
- Red flags: 1 of 10 red (intradermal ratio = 1.05, slightly high), 3 neutral, 6 green → ratio component = 0 + 1.5 + 6.0 = 7.5
- Consistency: 6 of 7 pass, 1 neutral → 6.0 + 0.5 = 6.5
- Total ratio checks: 25 outcomes (8 green flags + 10 red flags + 7 consistency)
- Total green: 18, neutral: 6, red: 1
- ratio_score = ((18 × 1.0) + (6 × 0.5) + (1 × 0.0)) / 25 × 100 = 21.0 / 25 × 100 = 84
- **Composite: (95.5 × 0.35) + (84 × 0.65) = 33.4 + 54.6 = 88**

**Provider B — Upcoding pattern (Score: 52)**
- Charge ratios: mostly normal → charge_score = 82
- E/M distribution: 99215 = 32%, 99214+99215 = 78% → penalty of 20 points → charge_score = 62
- Red flags: 3 triggered (high E/M, single E/M dominance, high beneficiary-to-service)
- Green flags: 4 green, 2 neutral, 2 red
- Consistency: 5 pass, 1 fail, 1 neutral
- Total: 12 green, 5 neutral, 8 red
- ratio_score = ((12 × 1.0) + (5 × 0.5) + (8 × 0.0)) / 25 × 100 = 14.5 / 25 × 100 = 58
- **Composite: (62 × 0.35) + (58 × 0.65) = 21.7 + 37.7 = 59.4 → 59**

**Provider C — Injection mill pattern (Score: 35)**
- Charge ratios: normal (injections have standard rates) → charge_score = 88
- E/M distribution: 99211 = 45% (nurse visits for shots), 99213 = 30% → downcoding penalty of 5 → charge_score = 83
- Red flags: 4 triggered (injection-only practice = 72% of services, testing without follow-up, high beneficiary-to-service, single E/M dominance with 99211)
- Green flags: 2 green, 3 neutral, 3 red
- Consistency: 2 pass (testing→immunotherapy OK, immunotherapy→antigen OK), 2 fail (spirometry pathway missing, high E/M without procedures), 3 neutral
- Total: 6 green, 9 neutral, 10 red
- ratio_score = ((6 × 1.0) + (9 × 0.5) + (10 × 0.0)) / 25 × 100 = 10.5 / 25 × 100 = 42
- **Composite: (83 × 0.35) + (42 × 0.65) = 29.1 + 27.3 = 56.4 → 56**

*Note: This provider's charges are normal, but the ratio analysis reveals a practice heavily dominated by immunotherapy injections with limited diagnostic or management services.*

---

# PART C: BUSINESS RULES

---

## Composite Formula

| Component | Weight | Justification |
|-----------|--------|---------------|
| Charge Score | 35% | Financial behavior is important but less specialty-specific; many charge anomalies are administrative |
| Ratio Score | 65% | Clinical logic — whether the right services co-occur — is the strongest quality signal available from billing data |

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| No Medicare data (Medicaid only) | Charge score = **neutral (50)** — no charge data available for Medicaid. Ratio analysis uses Medicaid volumes only. Overall score relies more heavily on ratios. |
| Provider has < 50 Medicare services | Charge analysis limited to codes with >= 10 services. If < 3 codes qualify, charge score = neutral (50). |
| A specific ratio cannot be evaluated (denominator = 0) | Outcome = neutral (0.5). Does not help or hurt. |
| Peer cohort < 30 for charge percentiles | Use national percentiles. Flag as "national_fallback." |

## Subspecialist Handling

| Subspecialty | Handling |
|-------------|---------|
| Clinical & Laboratory Immunology (207KI0005X) | Adjust expected E/M distribution: 99215 up to 20% is normal (complex immunodeficiency). Reduce red flag threshold for injection-only practice. Immunologists naturally have different ratio profiles. |
| Pediatric Allergy (2080A0000X) | Adjust expected E/M distribution to reflect lower complexity codes. Pediatric allergy has more 99213 and fewer 99215. Adjust green flag ranges for skin-test-to-visit ratio (higher for pediatrics — more panel testing). |

## E/M Distribution Benchmarks by Subspecialty

| Code | General A&I | Clinical Immunology | Pediatric Allergy |
|------|------------|--------------------|--------------------|
| 99211 | 2–8% | 1–5% | 3–10% |
| 99212 | 3–10% | 2–8% | 5–15% |
| 99213 | 25–40% | 20–35% | 30–45% |
| 99214 | 30–45% | 30–45% | 25–35% |
| 99215 | 5–15% | 10–20% | 3–10% |

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (Caught by This Score) |
|-----------|----------------|--------------------------------------|
| **Guideline Concordance** | Whether clinical guidelines are followed | Doesn't examine whether services are billed at appropriate charges or in clinically logical ratios. A provider can follow guidelines but bill at extreme charge ratios. |
| **Peer Comparison** | Whether the code mix is typical | Peer comparison looks at *what* is billed; billing quality looks at *how much* is charged and whether codes co-occur logically. |
| **Volume Adequacy** | Whether volumes are believable | Volume adequacy checks absolute volume floors. Billing quality checks relative ratios between services — volumes can be adequate but ratios can be wrong. |
| **Payer Diversity** | Cross-payer consistency | Payer diversity checks code overlap; billing quality checks whether the codes themselves make clinical sense together. |
| **This score (Billing Quality)** | Whether charges, ratios, and E/M patterns are normal | — |

### Scenario: Provider with high volume adequacy but low billing quality

A provider has adequate volume in all detected categories (Volume Adequacy = 95) — they bill plenty of skin tests, immunotherapy, and spirometry. But billing quality reveals: intradermal-to-percutaneous ratio = 1.3 (red flag), 99215 = 28% of E/M (upcoding signal), and testing-without-follow-up ratio = 6.2 (red flag). The provider does enough of everything, but the *proportions and patterns* are abnormal. Volume Adequacy = 95, Billing Quality = 44.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Charge data only in Medicare | Cannot assess Medicaid charge behavior | Ratio analysis covers both payers; charge analysis is Medicare-only |
| No modifier detail | Cannot distinguish modifier-25 E/M from standalone E/M | Ratios use total code counts; modifier patterns would improve precision but aren't available |
| No time-of-service data | Cannot assess whether visit length matches E/M level | Use E/M distribution as proxy; direct time verification isn't possible |
| Bundled services | Some services are bundled with E/M; separate billing may look like unbundling | Use peer comparison — if peers bill similarly, it's standard practice |

## Known Biases

| Bias | Direction | Handling |
|------|-----------|---------|
| **Practice complexity** | Providers at tertiary referral centers see sicker patients → legitimately higher E/M | Subspecialist adjustment partially addresses this; complete resolution requires referral pattern data we don't have |
| **Geographic charge variation** | Charges vary by region even after Medicare fee schedule adjustment | State-level peer cohort normalizes; charge analysis uses ratios, not absolute amounts |
| **Multi-provider practices** | Testing may be billed under one NPI, visits under another | Cross-category checks may flag these practices unfairly; acknowledged as limitation |
| **Nurse practitioner/PA supervision** | Immunotherapy injections may be administered by mid-levels under supervising allergist NPI | May inflate injection-to-visit ratios; expected for immunotherapy practices |

## Update Cadence

- **Green/red flag definitions:** Reviewed annually. New flags added when clinical evidence supports them; obsolete flags removed.
- **E/M distribution benchmarks:** Recalculated annually from peer data.
- **Charge percentiles:** Rebuilt annually.
- **Consistency checks:** Updated when major CPT/HCPCS changes affect allergy/immunology codes.

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
| `charge_score` | float | 0–100, charge-to-allowed ratio score (with E/M adjustment) |
| `em_distribution` | object | {99211: pct, 99212: pct, 99213: pct, 99214: pct, 99215: pct} |
| `em_penalty_applied` | float | Points deducted for abnormal E/M distribution |
| `green_flag_count` | integer | Number of green flag ratios in expected range |
| `red_flag_count` | integer | Number of red flag ratios outside expected range |
| `neutral_flag_count` | integer | Number of ratios that couldn't be evaluated |
| `consistency_pass_count` | integer | Cross-category checks that passed |
| `consistency_fail_count` | integer | Cross-category checks that failed |
| `ratio_score` | float | 0–100, ratio analysis score |
| `billing_quality_score` | float | 0–100, weighted composite |
| `flagged_ratios` | array[object] | List of {ratio_name, value, expected_range, outcome} for red flags |
| `flagged_consistency` | array[object] | List of {check_name, detail} for failed consistency checks |
| `subspecialist_flag` | boolean | True if subspecialty taxonomy detected |
| `subspecialist_type` | string | Null or subspecialty name |
| `insufficient_volume_flag` | boolean | True if below minimum volume |
| `medicaid_only_flag` | boolean | True if no Medicare data (charge score = neutral) |
| `national_fallback_flag` | boolean | True if national percentiles used |
| `confidence_tier` | string | Always "Tier 2" |
| `score_version` | string | Scoring algorithm version |
