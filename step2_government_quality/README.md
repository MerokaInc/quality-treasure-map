# Step 2: Government Quality Score (MIPS)

> **MIPS score + hospital affiliation quality per NPI. Confidence tiers. Weight: 20% of composite score.**

What it answers: has the government independently assessed this provider's clinical quality?

---

## What we found

Tested on 250,974 MA providers (2023 performance year data). The government has directly assessed quality for a small slice of providers:

- **3.0%** have a direct CMS MIPS quality score (7,591 providers)
- **8.9%** have an indirect signal via hospital affiliation quality (22,265 providers)
- **88.1%** have no government quality assessment at all (221,118 providers)

For MA physicians specifically (MD/DO only, 39,487 providers): 11.1% have MIPS scores and 44.3% have hospital affiliation data. The rest are commercially focused or below CMS volume thresholds.

MIPS scores in MA skew high. Median: 91.4. 72% of scored providers are above 85. The differentiation is less about the score itself and more about who has one vs who doesn't.

---

## Business logic: confidence tiers

The original spec proposed three situations (strong score / no score / low score). After seeing the data, we replaced this with confidence tiers that tell the composite how much to trust this dimension:

| Tier | Label | Count | % | What the composite does |
|------|-------|-------|---|------------------------|
| 1 | government_assessed | 7,591 | 3.0% | Full weight. MIPS score passes through 0-100. |
| 2 | hospital_signal | 22,265 | 8.9% | Indirect signal from hospital affiliation. Partial weight or cross-reference only. |
| 3 | no_government_assessment | 221,118 | 88.1% | No government data. Redistribute weight to other dimensions. Not a penalty. |

Key design decision: Step 2 outputs a structured profile, not a blended score. The composite layer decides how to weight MIPS vs hospital quality. Step 2 delivers the data and says how reliable it is.

---

## Data sources

| Source | What it gives us | Rows nationally | Access |
|--------|-----------------|-----------------|--------|
| CMS QPP/MIPS Final Scores (PY 2023) | MIPS final score, category scores (quality, cost, IA, PI) | 541,334 | CMS bulk download |
| CMS Facility Affiliations | NPI-to-hospital CCN crosswalk | 1,623,829 | CMS bulk download |
| Hospital General Information | Overall star rating (1-5), hospital type, ownership | 5,426 | CMS bulk download |
| HVBP Total Performance Score | Value-Based Purchasing composite score | ~2,500 | CMS bulk download |
| HCAHPS | Patient experience star rating | ~4,800 | CMS bulk download |
| Healthcare-Associated Infections | Infection rates vs national benchmark | ~4,800 | CMS bulk download |
| Complications and Deaths | Mortality/complication rates vs national | ~4,800 | CMS bulk download |
| Unplanned Hospital Visits | Readmission rates vs national | ~4,800 | CMS bulk download |
| NPPES NPI Registry | Provider identity layer, filtered to MA | 9,415,362 (250,974 MA) | CMS bulk download |

All datasets are free CMS bulk downloads. No registration, no fees. Download links in step2_README.md.

---

## What was explored but moved to other steps

To try and close the 88% gap, we loaded four additional datasets: Part B utilization, Part D prescribing, Care Compare (clinician directory), and Open Payments (industry payments). Combined with MIPS and hospital quality, this got physician coverage up to 67.4%.

But most of that data overlaps with what Steps 3 and 4 need:
- Part B and Part D are utilization/prescribing data, which is Step 3 (Utilization & Bundle Profiling)
- Care Compare credentials (med school, specialty, graduation year) are Step 4 (Credentials & Training)
- Open Payments is a transparency signal, not a quality assessment

We kept Step 2 focused on what only it can answer: did the government assess this provider's quality? The other datasets are downloaded and ready for their respective steps.

---

## Output schema

21 columns per NPI. Saved as `step2_output_final.parquet`.

| Group | Columns |
|-------|---------|
| Identity (6) | npi, entity_type, provider_name, provider_state, provider_zip, taxonomy_code |
| MIPS (5) | mips_final_score, mips_quality_score, mips_cost_score, mips_ia_score, mips_pi_score |
| Hospital (7) | affiliated_hospital_ccn, affiliated_hospital_star_rating, affiliated_hospital_hvbp_score, affiliated_hospital_hcahps_rating, affiliated_hospital_infection_flags, affiliated_hospital_complication_flags, affiliated_hospital_readmission_flags |
| Confidence (3) | data_source_count (0-2), confidence_tier (1-3), confidence_tier_label |

---

## How the composite should use this

**Tier 1 (government_assessed):** MIPS score passes through at full weight (0-100). For low scores (below 50), cross-reference Step 1 (safety gate) and Step 5 (patient experience) before penalizing. Low MIPS + clean record + good reviews = likely administrative burden, not bad care.

**Tier 2 (hospital_signal):** Hospital quality is indirect. A provider at a 5-star hospital is not necessarily a 5-star provider. The composite may give partial weight or use it for cross-referencing only. Hospital flags (infection, complication, readmission counts worse than national) are negative signals worth surfacing.

**Tier 3 (no_government_assessment):** Redistribute this dimension's weight to other steps. NULL means "no data," not "bad data." Never penalize. Most indie practices are commercially focused. The absence of government data is expected and is an information gap, not a quality gap.

---

## Structural ceiling

All CMS data is Medicare fee-for-service. A physician whose patients are commercially insured will appear "dark" (Tier 3) because of who they treat, not how well they treat them. We can't engineer around this, but we document it transparently. Other pipeline steps (utilization, credentials, patient experience, employer claims) will carry the signal for these providers.

---

## Notebook

`step2_mips_quality_score.ipynb` on branch `ds/step-renumber-and-step6-framework`. 28 cells. 8 smoke tests passing.

Pipeline: Load (4 data sources) > EDA > Clean (NPI harmonization, QPP dedup, hospital crosswalk via Facility Affiliations CCN) > Core Transformation (schema rename, confidence tier computation) > Proof of Correctness (8 assertions).

Hospital quality attribution uses the CMS Facility Affiliations file to map NPI to hospital CCN, then joins hospital quality scores. 99.1% of CCNs matched. When a provider has multiple hospital affiliations, we keep the best-rated one.
