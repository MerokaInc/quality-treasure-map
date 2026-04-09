# F1: Quality-Informed Search & Matching

## Overview

Employers use the marketplace search to find providers that meet their quality standards. This spec defines how quality data surfaces in search filters, sort options, result display, and the underlying API.

---

## 1. Search Filters

Employers can narrow results using the following quality-based filters (in addition to existing specialty and geography filters):

| Filter | UI Control | Notes |
|---|---|---|
| Minimum composite score | Slider, 0–100 | Default: no minimum |
| Minimum dimension score | Per-dimension slider | Dimensions: safety, outcomes, utilization, billing, experience |
| Bundle-level score | Bundle selector + minimum score | e.g., "maternity score ≥ 70" |
| Confidence level | Checkbox: High only / All | Default: All (with caveat display) |
| Safety gate status | Toggle: Pass only / All | Default: Pass only — cannot be disabled for employer-facing search |
| Specialty | Existing filter | Required |
| Geography | Existing filter (state/county/zip radius) | Required |

**Safety gate default:** The safety gate filter is always on by default. Employers cannot surface safety-gate-failed providers in standard search results. An admin override path exists for case review only.

---

## 2. Sort Options

Users can sort results by:

- **Composite score** (default sort within confidence band)
- **Specific dimension score** (e.g., sort by outcomes score)
- **Bundle score** (available when a bundle filter is active)
- **Distance** (requires zip code input)
- **Name** (alphabetical, for locating a known provider)

Sort applies within anti-leaderboard rules described in Section 5.

---

## 3. Bundle-Level Matching

When an employer specifies a care bundle need, the search parses intent and returns bundle-relevant results.

**Example query:** "I need strong maternity care in southern WV"

Parsed as:
- `specialty = OB-GYN`
- `bundle = maternity`
- `geography = southern WV` (county list derived from region name)

**Result behavior:**
- Providers sorted by maternity bundle score in the specified area
- Bundle score displayed prominently in result card (above composite score)
- Composite score shown as secondary context

**Bundle matching rules:**
- If a bundle filter is active, bundle score drives ranking (subject to anti-leaderboard banding)
- Providers without sufficient data for the requested bundle are shown separately under "Limited bundle data" with explicit caveat
- Specialty-only results are returned if no bundle-scoring data is available for a provider

---

## 4. Confidence-Aware Display

Quality scores are displayed differently based on confidence level. Providers with thin data are not hidden, but their data limitations are clearly communicated.

| Confidence Level | Score Display | Additional Text |
|---|---|---|
| High | Solid score badge (e.g., 82) | None required |
| Moderate | Score badge with indicator | "Based on limited data" |
| Low | Score badge with explicit caveat | "Score based on fewer than [N] data points — interpret with caution" |

**Default ranking behavior:**
- High-confidence providers rank above moderate/low-confidence providers with equal scores
- Confidence level can be used as a sort tiebreaker
- Low-confidence providers are not buried — they appear in results but are visually distinguished

---

## 5. Anti-Leaderboard Design

To avoid winner-take-all dynamics and discourage gaming, the following rules apply to all search result displays:

**No exact rank positions.** Do not display "Provider is #3 of 47 results." Use percentile bands instead: "Top 20%" or "Above average."

**Score banding.** Providers within ±3 composite score points are considered the same band. Within a band, results are randomized on each query (not by score order).

**Percentile band labels:**

| Composite Score Range | Label |
|---|---|
| 90–100 | Top 10% |
| 80–89 | Top 20% |
| 70–79 | Above average |
| 60–69 | Average |
| <60 | Below average |

Labels are relative to all providers in the same specialty + state cohort.

**Thin-data protection.** Low-confidence providers are not automatically ranked last. Confidence is displayed alongside score so employers can make informed decisions rather than the system burying thin-data providers by default.

---

## 6. API Contract

### Search endpoint

```
GET /api/providers/search
```

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `specialty` | string | Required. Specialty code (e.g., `OB-GYN`) |
| `state` | string | State abbreviation (e.g., `WV`) |
| `county` | string | Optional. County name or FIPS code |
| `zip` | string | Optional. Zip code for distance filtering |
| `radius_miles` | integer | Optional. Radius from zip (default: 30) |
| `min_composite` | integer | Optional. Minimum composite score (0–100) |
| `min_dimension_{name}` | integer | Optional. Minimum score for a specific dimension |
| `bundle` | string | Optional. Bundle identifier (e.g., `maternity`) |
| `min_bundle_score` | integer | Optional. Minimum bundle score (requires `bundle`) |
| `confidence` | string | Optional. `high` to restrict to high-confidence only; default returns all |
| `sort` | string | One of: `composite_score`, `bundle_score`, `distance`, `name`. Default: `composite_score` |
| `page` | integer | Page number (default: 1) |
| `page_size` | integer | Results per page (default: 20, max: 100) |

**Example:**
```
GET /api/providers/search?specialty=OB-GYN&state=WV&min_composite=60&bundle=maternity&sort=bundle_score
```

**Response schema:**
```json
{
  "total": 47,
  "page": 1,
  "page_size": 20,
  "results": [
    {
      "npi": "1234567890",
      "name": "Provider Name",
      "specialty": "OB-GYN",
      "location": {
        "city": "Charleston",
        "state": "WV",
        "county": "Kanawha",
        "distance_miles": 12.4
      },
      "composite_score": 82,
      "composite_confidence": "high",
      "percentile_band": "top_20",
      "safety_gate": "pass",
      "dimensions": {
        "safety": 85,
        "outcomes": 80,
        "utilization": 78,
        "billing": 84,
        "experience": 83
      },
      "bundles": {
        "maternity": {
          "score": 86,
          "confidence": "high"
        }
      },
      "flags": []
    }
  ]
}
```

**Notes for eng:**
- Safety gate failures are excluded from results by default. Include `&safety_gate=all` only for admin-authenticated requests.
- Score banding and within-band randomization must be applied server-side before returning results.
- `percentile_band` is pre-computed relative to the specialty + state cohort, not the filtered result set.
- Confidence level `low` providers are included in default results; do not filter them out unless `confidence=high` is specified.
