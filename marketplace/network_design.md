# F2: Network Design Support

## Overview

Employers building a direct-contract network need tools to evaluate quality across a portfolio of providers — not just individual scores. This spec defines the portfolio quality view, gap analysis, scenario modeling, adequacy checks, and the API contract for these capabilities.

---

## 1. Portfolio Quality View

When an employer has selected or is evaluating a set of providers for their network, the portfolio view surfaces aggregate quality metrics for the whole group.

**Metrics displayed:**

- **Average composite score** — mean composite score across all providers in the network
- **Score distribution** — histogram of composite scores (e.g., 10 providers in 60–69 range, 4 in 70–79, etc.)
- **Dimension breakdown** — per-dimension average across the network, surfacing which dimensions are strong or weak overall
- **Specialty coverage with quality** — per specialty: provider count, average composite score, and confidence summary

**Example specialty coverage display:**
```
OB-GYN:      3 providers, avg score 76 (2 high confidence, 1 moderate)
Pediatrics:  0 providers — no coverage
Cardiology:  2 providers, avg score 71 (both high confidence)
```

**Confidence weighting:** Average composite score for the portfolio is confidence-weighted by default (high-confidence scores weighted more heavily). Unweighted average is available as a toggle.

---

## 2. Gap Analysis

Gap analysis identifies weaknesses in the network configuration that may put employees at risk of inadequate access to quality care.

**Gap types detected:**

| Gap Type | Definition |
|---|---|
| No-coverage specialty | A specialty needed by the employee population has zero providers in the network |
| Below-threshold specialty | All providers in a specialty are below the employer's minimum quality score |
| Geographic coverage gap | A county or zip-code radius contains zero providers for a given specialty |
| Bundle coverage gap | A care bundle (e.g., maternity) has weak coverage in one or more counties |
| Single point of failure | Only one provider exists in a specialty — high disruption risk if they leave the network |

**Bundle gap example output:**
```
Maternity care coverage gap: below threshold in 2 of 3 target counties
  - Mingo County: 0 qualified providers
  - McDowell County: 1 provider, score 54 (below 60 threshold)
  - Kanawha County: 2 providers, avg score 79 (adequate)
```

**Single point of failure alert:** Flagged when `provider_count = 1` for any specialty in any county where the employer has employees. Includes a note that network continuity depends on this provider remaining contracted.

---

## 3. Scenario Modeling

The "what if" tool lets employers model network changes before finalizing.

**Supported scenarios:**

- **Add provider** — enter NPI; system shows new portfolio metrics after addition
- **Remove provider** — select existing provider; system shows coverage and quality impact
- **Change quality threshold** — adjust minimum composite score; system shows how many providers fall in/out
- **Side-by-side comparison** — compare two network configurations (e.g., "Network A" vs "Network B")

**Delta display (add/remove):**

When a provider is added or removed, the UI shows the before/after delta:

```
Adding Dr. Jane Smith (OB-GYN, Kanawha County):
  Composite avg: 74 → 76 (+2)
  OB-GYN avg score: 71 → 74 (+3)
  OB-GYN provider count: 2 → 3
  Single point of failure: Removed (McDowell County now has 2 providers)
```

**Threshold change display:**

When the minimum threshold is adjusted, the display shows which providers move in/out of the qualifying set and how the network metrics change.

**Side-by-side comparison:**

Two saved network configurations displayed in parallel columns with the same metric rows:
- Overall composite avg
- Per-specialty avg and count
- Gap analysis summary
- Adequacy check results

---

## 4. Adequacy Checks

Per specialty, the system runs adequacy checks against standard benchmarks and employer-provided employee demographics.

**Check types:**

| Check | Benchmark | Notes |
|---|---|---|
| Provider-to-employee ratio | Configurable per specialty (e.g., 1 OB-GYN per 500 female employees) | Employer inputs employee count and relevant demographics |
| Geographic accessibility | ≥80% of relevant employees within 30 miles of a provider | Uses employee zip code distribution |
| Quality floor | All contracted providers above minimum composite score | Minimum score is employer-configurable |

**Adequacy check output format:**

```
OB-GYN Adequacy:
  Provider ratio: 3 providers / 1,200 eligible employees = 1:400 [PASS, benchmark 1:500]
  Geographic access: 94% of eligible employees within 30 miles [PASS, benchmark 80%]
  Quality floor: All 3 providers above score 60 [PASS]

Pediatrics Adequacy:
  Provider ratio: 0 providers / 800 children [FAIL — no coverage]
  Geographic access: N/A (no providers)
  Quality floor: N/A (no providers)
```

Adequacy results are exportable for ERISA fiduciary documentation.

---

## 5. API Contract

### Analyze portfolio quality

```
POST /api/networks/analyze
```

**Request body:**
```json
{
  "employer_id": "emp_123",
  "npis": ["1234567890", "0987654321"],
  "options": {
    "confidence_weighted": true
  }
}
```

**Response:** Portfolio quality metrics including composite avg, score distribution, dimension breakdown, and specialty coverage summary.

---

### Gap analysis

```
POST /api/networks/gaps
```

**Request body:**
```json
{
  "employer_id": "emp_123",
  "npis": ["1234567890", "0987654321"],
  "employee_demographics": {
    "total": 1200,
    "zip_distribution": {"25301": 400, "25601": 300, "25801": 500},
    "female_count": 600,
    "children_count": 200
  },
  "min_quality_threshold": 60,
  "target_specialties": ["OB-GYN", "Pediatrics", "Cardiology"]
}
```

**Response:** Gap analysis results including specialty gaps, geographic gaps, bundle gaps, and single-point-of-failure flags. Each gap includes severity (`critical`, `warning`, `informational`) and a recommended action.

---

### Scenario modeling

```
POST /api/networks/scenario
```

**Request body:**
```json
{
  "employer_id": "emp_123",
  "current_npis": ["1234567890", "0987654321"],
  "add_npis": ["1122334455"],
  "remove_npis": [],
  "quality_threshold_override": null
}
```

**Response:** Delta object showing before/after values for all portfolio metrics, gap analysis changes, and adequacy check changes. Both the baseline and the modeled configuration are included in the response for side-by-side display.

---

**Notes for eng:**
- `POST /api/networks/analyze` must complete within 2 seconds for networks up to 50 providers. Cache provider quality data; do not recompute from raw claims on each call.
- Employee demographics input is optional for `/analyze`; required for `/gaps` adequacy checks.
- Scenario results are not persisted by default. Include a `save_as` field in the request body to save a configuration for side-by-side comparison.
- All three endpoints require employer-level authentication. Provider data returned is scoped to what the employer is authorized to view.
