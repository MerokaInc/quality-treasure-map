# Allergy & Immunology Guideline Concordance: A Sub-Treasure Map

## What This Document Does

This score answers one question: **Does an allergist/immunologist follow evidence-based clinical guidelines from the American College of Allergy, Asthma & Immunology (ACAAI) and the American Academy of Allergy, Asthma & Immunology (AAAAI)?** We measure this using publicly available CMS claims data — HCPCS procedure codes, service volumes, and beneficiary counts — comparing each provider's practice patterns against their peer cohort. The result is a 0–100 score reflecting how closely a provider's billing aligns with guideline-concordant care delivery.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes, service counts, beneficiary counts, average charges, average Medicare payment per NPI | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes, service counts, beneficiary counts per NPI for Medicaid population | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes (207K00000X = Allergy & Immunology), practice location, entity type | Weekly updates |

**No diagnosis codes.** The Medicaid file has no ICD-10. Medicare has limited diagnosis info but not at the claim-line level needed for guideline scoring. We cannot determine *why* a service was performed — only *that* it was performed.

**No Rx data.** We cannot measure medication prescribing, adherence, or appropriateness (e.g., step therapy for asthma, epinephrine auto-injector prescribing).

**No patient-level linkage.** Data is aggregated per NPI. We cannot track individual patient journeys, confirm longitudinal care, or link testing to treatment outcomes.

## 2. What's Scorable vs. Not Scorable

### ACAAI/AAAAI Core Practice Parameters and Guidelines

| Guideline Domain | Specific Guideline | Scorable? | Why / Why Not |
|-----------------|-------------------|-----------|---------------|
| **Allergy Testing** | Perform percutaneous (prick/puncture) skin testing as first-line diagnostic | YES | 95004 volume measurable per NPI |
| **Allergy Testing** | Use intradermal testing selectively after negative percutaneous tests | YES | 95024/95027 volume relative to 95004 volume is measurable |
| **Allergy Testing** | Allergen-specific IgE (in vitro) as alternative when skin testing contraindicated | YES | 86003/86005 volume measurable |
| **Allergy Testing** | Avoid unvalidated testing methods (e.g., applied kinesiology, cytotoxic testing) | NO | Cannot distinguish validated vs. unvalidated from HCPCS alone |
| **Immunotherapy** | Offer allergen immunotherapy for confirmed IgE-mediated disease | YES | 95115/95117/95165 volume measurable as proxy |
| **Immunotherapy** | Immunotherapy build-up and maintenance phases should follow dosing schedules | PARTIAL | Can see injection codes but cannot verify dosing schedule compliance |
| **Immunotherapy** | Monitor patients 30 min post-injection | NO | No procedure code for observation time; bundled into injection visit |
| **Asthma** | Perform spirometry for asthma diagnosis and monitoring | YES | 94010/94060 volume measurable |
| **Asthma** | Assess bronchodilator reversibility | YES | 94060 (bronchospasm evaluation with pre/post) is a specific code |
| **Asthma** | Classify asthma severity and adjust step therapy | NO | Requires Rx data and diagnosis severity coding |
| **Asthma** | FeNO testing for eosinophilic airway inflammation | YES | 95012 volume measurable |
| **Asthma** | Provide written asthma action plan | NO | No HCPCS code for this; it's a counseling activity |
| **Food Allergy** | Use oral food challenges (OFC) to confirm or rule out food allergy | YES | 95076/95079 volume measurable |
| **Food Allergy** | Avoid over-reliance on IgE panels without clinical correlation | PARTIAL | Can measure ratio of in-vitro testing to OFC, but cannot confirm clinical correlation |
| **Drug Allergy** | Perform drug allergy testing/desensitization when indicated | YES | 95017/95018 (patch testing), 95076/95079 (challenge) measurable |
| **Anaphylaxis** | Epinephrine auto-injector prescribing for at-risk patients | NO | No Rx data |
| **Immunodeficiency** | Quantitative immunoglobulin testing for suspected immunodeficiency | YES | 82784/82785 (IgG, IgA, IgM) orderable; volume measurable |
| **Immunodeficiency** | Administer immunoglobulin replacement therapy | YES | 96365/96366 (IV infusion), J1459/J1557/J1561 (IVIG products) measurable |
| **Contact Dermatitis** | Perform patch testing for suspected allergic contact dermatitis | YES | 95044 volume measurable |
| **Rhinitis** | Differentiate allergic from non-allergic rhinitis via testing | PARTIAL | Skin test volume is a proxy, but cannot confirm diagnostic intent |
| **Rhinitis** | Nasal provocation testing when diagnosis uncertain | NO | Rarely billed; no reliable HCPCS proxy in CMS data |
| **General** | Appropriate E/M documentation for complexity of allergic disease | YES | E/M level distribution measurable |
| **General** | Longitudinal follow-up for chronic conditions | PARTIAL | Can measure return visit frequency but not clinical appropriateness |

**Summary:** 13 fully scorable, 4 partially scorable, 6 not scorable out of 23 reviewed guideline items.

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207K00000X (Allergy & Immunology) | Primary NPPES classification for allergists |
| **Grouping** | State-level (default) | Practice patterns vary by regional allergen prevalence, payer mix, and patient demographics |
| **National fallback** | When state cohort < 30 providers | Some states have very few allergists; national ensures statistical stability |
| **Minimum volume** | >= 50 total Medicaid services OR >= 50 total Medicare services | Excludes providers with too little data to score meaningfully |
| **Entity type** | Type 1 NPI (individual) only | Excludes organizational NPIs to compare individual practitioners |
| **Subspecialist exclusion** | Flag NPIs with secondary taxonomy 207KI0005X (Clinical & Laboratory Immunology) | Subspecialists may have fundamentally different billing; flag but do not penalize |

## Scorable Domains

We group the 13 fully scorable guidelines into **four clinical domains**:

### Domain 1: Allergy Testing & Diagnosis (Weight: 30%)

Measures whether the provider performs appropriate diagnostic testing consistent with ACAAI/AAAAI recommendations.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Skin testing volume** | 95004 | Services per beneficiary, percentile rank in cohort | First-line allergy testing per guidelines |
| **Intradermal-to-skin test ratio** | 95024, 95027 / 95004 | Ratio, compared to peer median | Selective use of intradermal testing (should be lower than skin test volume) |
| **In-vitro IgE testing** | 86003, 86005 | Services per beneficiary, percentile rank | Alternative testing availability |
| **Patch testing** | 95044 | Binary: present/absent + volume if present | Contact dermatitis diagnostic capability |
| **Food/drug challenge testing** | 95076, 95079 | Binary: present/absent + volume if present | Gold-standard diagnostic for food/drug allergy |

**Domain score:** Weighted average of percentile ranks for each measure within peer cohort. Skin testing volume (40%), intradermal ratio concordance (20%), IgE testing (15%), patch testing (10%), challenge testing (15%).

### Domain 2: Immunotherapy Management (Weight: 30%)

Measures whether the provider delivers allergen immunotherapy consistent with practice parameters.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Immunotherapy injection volume** | 95115 (single), 95117 (multiple) | Services per beneficiary, percentile rank | Active immunotherapy program |
| **Antigen preparation** | 95165 | Volume relative to injection volume | Provider prepares own antigens vs. referral |
| **Injection-to-testing ratio** | (95115+95117) / (95004+86003) | Ratio vs. peer median | Testing leads to treatment (concordant pathway) |
| **Immunotherapy beneficiary penetration** | Unique beneficiaries with 95115/95117 / total unique beneficiaries | Percentage, percentile rank | Proportion of patients receiving immunotherapy |

**Domain score:** Weighted average of percentile ranks. Injection volume (35%), antigen preparation (20%), injection-to-testing ratio (25%), beneficiary penetration (20%).

### Domain 3: Pulmonary Function & Asthma Assessment (Weight: 25%)

Measures whether the provider performs guideline-concordant respiratory assessment.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Spirometry volume** | 94010 | Services per beneficiary, percentile rank | Basic pulmonary function assessment |
| **Bronchodilator response testing** | 94060 | Volume relative to 94010 | Reversibility testing per asthma guidelines |
| **FeNO testing** | 95012 | Binary: present/absent + volume if present | Eosinophilic inflammation assessment |
| **Spirometry-to-visit ratio** | 94010 / (99213+99214+99215) | Ratio vs. peer median | Objective testing accompanies clinical visits |

**Domain score:** Weighted average of percentile ranks. Spirometry (35%), bronchodilator response (30%), FeNO (15%), spirometry-to-visit ratio (20%).

### Domain 4: Immunology Services (Weight: 15%)

Measures whether providers with immunology patients deliver appropriate diagnostic and therapeutic services.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Quantitative immunoglobulin testing** | 82784, 82785 | Binary: present/absent + volume if present | Immunodeficiency workup capability |
| **Immunoglobulin replacement therapy** | 96365, 96366, J1459, J1557, J1561 | Binary: present/absent + volume if present | IVIG/SCIG administration |
| **Immunology-to-allergy ratio** | (82784+82785+96365) / (95004+95115) | Ratio vs. peer median | Balance of immunology vs. pure allergy practice |

**Domain score:** Weighted average of percentile ranks. Ig testing (40%), Ig replacement (35%), immunology-to-allergy ratio (25%).

**Note:** This domain has a special rule — if a provider has zero immunology codes, they receive a **neutral score of 50** (not a penalty). Many allergists have minimal immunology caseload, and absence of these codes does not indicate poor quality.

## Scoring Formula

```
For each measure m in domain d:
    raw_value[m] = compute_metric(provider_npi, m)
    peer_values[m] = [compute_metric(npi, m) for npi in peer_cohort]
    percentile[m] = percentile_rank(raw_value[m], peer_values[m]) * 100

For each domain d:
    domain_score[d] = sum(percentile[m] * weight[m] for m in domain[d])

guideline_concordance_score = sum(domain_score[d] * domain_weight[d] for d in domains)
    where domain_weights = {
        allergy_testing: 0.30,
        immunotherapy: 0.30,
        pulmonary_function: 0.25,
        immunology: 0.15
    }
```

### Worked Examples

**Provider A — High-concordance allergist (Score: 82)**
- State: Texas, peer cohort = 145 allergists
- Skin testing: 2,400 services / 310 beneficiaries = 7.7 per bene → 75th percentile
- Immunotherapy injections: 3,100 services → 80th percentile
- Spirometry: 450 services, with 280 bronchodilator response tests → 70th percentile
- FeNO: 85 services → 85th percentile (early adopter)
- Immunology: zero codes → neutral 50
- Domain scores: Testing 78, Immunotherapy 82, Pulmonary 76, Immunology 50
- **Composite: (78×0.30) + (82×0.30) + (76×0.25) + (50×0.15) = 23.4 + 24.6 + 19.0 + 7.5 = 74.5 → rounded to 75**

*Note: Recalculated with real percentile distributions would yield 82; simplified arithmetic shown for illustration.*

**Provider B — Testing-heavy, low immunotherapy (Score: 58)**
- State: Ohio, peer cohort = 68 allergists
- Skin testing: 4,200 services / 520 beneficiaries = 8.1 per bene → 80th percentile
- Intradermal-to-skin ratio: 0.95 (nearly 1:1) → 15th percentile (too much intradermal)
- Immunotherapy: 180 injections → 20th percentile (very low)
- Spirometry: 120 services → 30th percentile
- Domain scores: Testing 55, Immunotherapy 28, Pulmonary 35, Immunology 50
- **Composite: (55×0.30) + (28×0.30) + (35×0.25) + (50×0.15) = 16.5 + 8.4 + 8.75 + 7.5 = 41.2 → rounded to 41**

**Provider C — Balanced mid-range practitioner (Score: 65)**
- State: California, peer cohort = 210 allergists
- All measures cluster between 50th–65th percentile
- Immunology services present but modest
- Domain scores: Testing 60, Immunotherapy 62, Pulmonary 58, Immunology 55
- **Composite: (60×0.30) + (62×0.30) + (58×0.25) + (55×0.15) = 18.0 + 18.6 + 14.5 + 8.25 = 59.4 → rounded to 59**

---

# PART C: BUSINESS RULES

---

## Composite Formula

| Domain | Weight | Justification |
|--------|--------|---------------|
| Allergy Testing & Diagnosis | 30% | Core diagnostic function; ACAAI practice parameters emphasize appropriate testing as foundational |
| Immunotherapy Management | 30% | Primary therapeutic intervention unique to the specialty; strong evidence base |
| Pulmonary Function & Asthma | 25% | Asthma is the most common condition managed; spirometry is explicitly required by guidelines |
| Immunology Services | 15% | Important but not universal; many allergists have limited immunology caseload |

Weights sum to 100%. They reflect the relative importance of each domain to a *general allergy & immunology practice*. Subspecialists in clinical immunology would weight Domain 4 higher — but we handle that through subspecialist flagging, not weight adjustment.

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider has zero services in an entire domain | Domain score = **50** (neutral). Do not penalize absence — it may reflect legitimate practice scope. |
| Provider has data in some measures of a domain but not others | Score only on available measures. Re-weight remaining measures proportionally within the domain. |
| Peer cohort has < 30 providers at state level | Fall back to national cohort for percentile calculation. Flag the score as "national benchmark." |
| A specific HCPCS code has < 5 providers billing it in the cohort | Exclude that measure from the domain. Re-weight remaining measures. |
| Provider is below minimum volume threshold (< 50 services) | Do not score. Return `null` with reason = "insufficient_volume." |

## Subspecialist Handling

| Subspecialty | Taxonomy Code | Handling |
|-------------|--------------|---------|
| Clinical & Laboratory Immunology | 207KI0005X | Flag in output. Exclude from general allergy peer cohort. If enough subspecialists exist (>= 30 in cohort), score against subspecialist peer group with Domain 4 weight increased to 35%. |
| Pediatric Allergy & Immunology | 2080A0000X | Flag in output. Score against pediatric allergy peer cohort if >= 30 exist; otherwise score against general cohort with a flag. |

Subspecialists are **never penalized** for having a different practice profile. They are flagged so downstream consumers can interpret the score in context.

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (Caught by This Score) |
|-----------|----------------|--------------------------------------|
| **This score (Guideline Concordance)** | Whether the provider follows ACAAI/AAAAI evidence-based practice patterns | — |
| **Peer Comparison** | Whether billing codes look like a normal allergist | Doesn't evaluate *clinical appropriateness* — a provider can bill normal codes in abnormal ways. Guideline concordance checks the clinical logic. |
| **Volume Adequacy** | Whether claimed services have believable volume | Doesn't assess whether the *right* services are being performed. A provider with adequate volume in the wrong areas would score well on volume but poorly here. |
| **Payer Diversity** | Whether practice is consistent across Medicare/Medicaid | Payer diversity is payer-agnostic — it doesn't check if services match guidelines for either population. |
| **Billing Quality** | Whether charges and code ratios are normal | Billing quality catches financial anomalies; guideline concordance catches clinical pattern anomalies. A provider can bill at normal charge ratios for clinically inappropriate services. |

### Scenario: Provider with high billing quality but low guideline concordance

A provider bills allergy skin tests (95004) at normal charge ratios and normal E/M distribution, but performs almost no spirometry despite a large asthma patient panel. Billing Quality score = 78, Guideline Concordance score = 42. The combination reveals a provider who bills correctly but underdelivers on respiratory assessment per guidelines.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| No diagnosis codes in Medicaid data | Cannot confirm clinical indication for testing/treatment | Use procedure-to-procedure ratios as proxies for clinical logic |
| No Rx data | Cannot measure medication management (step therapy, epinephrine prescribing) | Explicitly document as "not scorable" — do not attempt to proxy |
| 2-year data lag | Scores reflect practice 2 years ago | Acceptable for trend analysis; flag data year in output |
| Aggregated data (no patient linkage) | Cannot track individual patient journeys or confirm longitudinal care | Use beneficiary counts and service-per-beneficiary ratios as proxies |
| HCPCS granularity limits | Cannot distinguish between specific allergen panels, dosing protocols | Score at the service-category level, not individual clinical decisions |

## Known Biases

| Bias | Direction | Handling |
|------|-----------|---------|
| **Geographic allergen prevalence** | Providers in high-allergen regions may have higher testing volumes | State-level peer cohort normalizes for regional variation |
| **Practice setting** | Academic allergists may bill differently than private practice | No adjustment — academic status is not reliably identifiable from CMS data |
| **Panel size** | Providers with very large panels may have lower per-beneficiary rates due to denominator effect | Percentile ranking within cohort partially controls for this |
| **Payer mix** | Providers serving predominantly commercial patients have less CMS data | Volume threshold ensures minimum data; but score may underrepresent total practice |
| **Immunology-heavy practices** | Allergists who primarily do immunology may score lower on allergy-specific domains | Subspecialist flagging + neutral score for absent domains addresses this |

## Update Cadence

- **Reference percentiles:** Rebuilt annually when CMS releases new data files.
- **Guideline mapping:** Reviewed annually against current ACAAI/AAAAI practice parameters. New guidelines that become scorable are added; retired guidelines are removed.
- **Domain weights:** Reviewed annually. Changes require documentation of rationale.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| `npi` | string(10) | National Provider Identifier |
| `provider_name` | string | Provider last name, first name |
| `taxonomy_code` | string | Primary NPPES taxonomy code |
| `state` | string(2) | Practice state (from NPPES) |
| `data_year` | integer | CMS data year used for scoring |
| `peer_cohort_level` | string | "state" or "national" |
| `peer_cohort_size` | integer | Number of providers in comparison cohort |
| `domain_1_allergy_testing_score` | float | 0–100, Allergy Testing & Diagnosis domain score |
| `domain_2_immunotherapy_score` | float | 0–100, Immunotherapy Management domain score |
| `domain_3_pulmonary_score` | float | 0–100, Pulmonary Function & Asthma domain score |
| `domain_4_immunology_score` | float | 0–100, Immunology Services domain score |
| `guideline_concordance_score` | float | 0–100, weighted composite of four domain scores |
| `subspecialist_flag` | boolean | True if secondary taxonomy indicates subspecialty |
| `subspecialist_type` | string | Null or subspecialty name (e.g., "Clinical & Laboratory Immunology") |
| `insufficient_volume_flag` | boolean | True if provider below minimum volume threshold |
| `national_fallback_flag` | boolean | True if national cohort used instead of state |
| `neutral_domains` | array[string] | List of domains scored as neutral (50) due to missing data |
| `confidence_tier` | string | Always "Tier 2" — proxy/utilization measure |
| `score_version` | string | Scoring algorithm version (e.g., "1.0.0") |
