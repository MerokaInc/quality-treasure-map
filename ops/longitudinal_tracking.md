# Longitudinal Tracking

**Version:** 1.0.0
**Last updated:** 2026-04-09
**Owner:** Antoine (pipeline logic & trend computation), Othmane (data intake)

---

## 1. Score History Storage

Every time a score is computed during a D1 refresh pipeline run, the result is stored as a versioned snapshot. Snapshots are **append-only** — previous records are never overwritten or mutated. Corrections produce a new snapshot row; the historical record is preserved for audit and trend purposes.

### Storage Unit

One row per **NPI × dimension × refresh cycle**.

| Field | Type | Description |
|---|---|---|
| `npi` | string(10) | National Provider Identifier |
| `dimension` | string | Scoring dimension (e.g., `safety`, `quality`, `utilization`, `experience`, `cost`, or `composite`) |
| `score` | float or null | Computed score (0–100); `null` if dimension could not be scored in this cycle |
| `confidence_tier` | integer (1–3) or null | 1 = high, 2 = medium, 3 = low; `null` if dimension unscored |
| `sub_scores` | object or null | Dict of component scores that roll up into `score`; `null` if not applicable |
| `source_versions` | object | Dict mapping each `source_id` used to the artifact path or datestamp (e.g., `{"oig_leie": "2026-04-01"}`) |
| `methodology_version` | string (semver) | Version of the scoring methodology applied (e.g., `2.1.0`) |
| `scored_at` | ISO 8601 datetime | Timestamp when the score was computed (Stage 3 of the pipeline) |
| `refresh_cycle_id` | string | Unique identifier for the pipeline run that produced this snapshot |

### Bundle-Level Scores

For Step 3 specialties (where multiple dimensions are evaluated as a specialty-specific bundle), a bundle-level composite row is also stored. The `dimension` field is set to `bundle:<specialty_slug>` (e.g., `bundle:cardiology`). Bundle scores participate in trend computation the same way individual dimension scores do.

### Immutability Guarantee

Consistent with the versioning contract in `data_refresh_pipeline.md` (Section 3): once written, a snapshot row is never modified. Any correction — whether from a resolved dispute or a pipeline reprocessing — produces a new row tagged with the corrected `scored_at` and the same `refresh_cycle_id` suffixed with `-correction` (e.g., `2026-Q2-correction`).

---

## 2. Trend Computation

Trends are computed per NPI per dimension after each refresh cycle by scanning the snapshot history for that NPI × dimension combination.

### Window

- Default lookback: **4 most recent refresh cycles** (configurable per dimension).
- For annual data sources (e.g., `cms_qpp_mips`, `medicare_utilization`), 4 cycles corresponds to approximately 4 years of history.
- For more frequently refreshed dimensions, the window count may be adjusted so the effective lookback period does not exceed 2 years.

### Trend Categories

| Category | Condition |
|---|---|
| `improving` | Score increased ≥ 5 points from the oldest snapshot in the window to the most recent |
| `stable` | Score changed < 5 points (either direction) across the window |
| `declining` | Score decreased ≥ 5 points from the oldest snapshot in the window to the most recent |
| `new` | Fewer than 2 scored snapshots are available for this dimension |
| `insufficient_data` | The dimension was unscored (`score: null`) in the most recent cycle |

Notes:
- Trend is computed independently for **each individual dimension** and for the **composite score**.
- Cycles where `score` is `null` are skipped when computing the numeric delta; they do not count toward the "2 snapshots" threshold for the `new` category.
- If all snapshots in the window are `null`, the category is `insufficient_data`.

---

## 3. Change Attribution

When a score changes between the prior cycle and the current cycle, the system attributes the delta to one or more causes. Attribution is stored as an array on the snapshot record and surfaced in the provider profile and audit trail.

### Attribution Causes

| Cause | Description |
|---|---|
| `new_cms_data` | A new CMS (or other source) data release changed the underlying input numbers |
| `methodology_update` | The scoring logic changed — a new `methodology_version` was applied |
| `peer_cohort_shift` | Peer benchmark statistics changed (new providers entered the cohort, or cohort distribution shifted) without a data or methodology change |
| `provider_action` | The provider took a direct action: obtained board certification, submitted enrichment data, changed billing patterns, or similar |
| `data_correction` | A dispute was resolved or a data error was corrected, causing the score to be recomputed |
| `source_unavailable` | A data source became unavailable (e.g., T-MSIS outage); score held at last known good value or recomputed with fallback |

### Attribution Logic (Evaluated in Order)

Attribution is not mutually exclusive — a score change may carry multiple causes.

1. **`methodology_update`** — Include if `methodology_version` differs from the prior cycle's snapshot.
2. **`new_cms_data`** — Include if any key in `source_versions` carries a different value than the prior cycle's snapshot (i.e., a source file was refreshed).
3. **`provider_action`** — Include if the audit trail contains an `enrichment_submitted` or `enrichment_verified` event for this NPI with a `timestamp` between the prior cycle's `scored_at` and the current cycle's `scored_at`.
4. **`data_correction`** — Include if the audit trail contains a `dispute_resolved` event for this NPI within the same window, and the resolved dispute produced a score change (`payload.score_change != 0`).
5. **`source_unavailable`** — Include if any source contributing to this dimension is flagged as stale or unavailable in the pipeline run log for this `refresh_cycle_id`.
6. **`peer_cohort_shift`** — Include if none of the above causes apply but a score change is detected. A shift in peer cohort statistics (benchmark mean/SD changed) is the residual explanation.

If `change_from_prior` is `0` or `null`, `change_attributions` is an empty array.

---

## 4. Trajectory as a Signal

The computed trend category (trajectory) is **metadata** — it does not feed back into the composite score calculation. It is surfaced in downstream views as a signal to providers, employers, and plan operators.

### Surfaces

| Surface | How Trajectory Appears |
|---|---|
| **Provider Quality Profile (B2)** | Timeline visualization (see Section 5); trend badge showing category and delta |
| **Employer Quality View (B1)** | Trend indicator badge next to each provider's score (e.g., ↑ Improving, → Stable, ↓ Declining) |
| **Ongoing Quality Reporting (F4)** | Network-level trend aggregates — percentage of in-network providers improving/stable/declining per dimension |

Trajectory is always rendered with appropriate uncertainty caveats when the category is `new` or `insufficient_data`.

---

## 5. Visual Timeline Spec

The Provider Quality Profile (B2) renders a score timeline for each NPI. The following spec governs the chart.

### Axes

- **X-axis:** Refresh cycle dates (ISO date label per cycle, e.g., `2025-Q3`, `2026-Q1`)
- **Y-axis:** Score (0–100), fixed scale

### Series

- One line per scored dimension (safety, quality, utilization, experience, cost)
- Composite score rendered as a **bold highlighted line** distinct from dimension lines
- Bundle scores (Step 3 specialties) rendered as a separate dashed line when present

### Null Handling

- Cycles where a dimension score is `null` produce a gap in the line (no interpolation)
- A marker or footnote at gap points indicates the cause (e.g., "Source unavailable — T-MSIS outage")

### Hover / Tooltip

On hover over any data point, the tooltip displays:

| Field | Content |
|---|---|
| Score | Numeric value (e.g., `84.2`) |
| Change from prior | Signed delta (e.g., `+3.1` or `−6.0`); omitted for `new` providers |
| Attribution | Human-readable label for each cause in `change_attributions` (e.g., "New CMS data", "Provider action") |
| Confidence tier | 1 / 2 / 3 with label (High / Medium / Low) |
| Cycle | Refresh cycle ID and date |
