# Data Refresh Pipeline

**Version:** 1.0.0
**Last updated:** 2026-04-09
**Owner:** Antoine (pipeline logic), Othmane (data intake & state boards)

---

## 1. Pipeline Stages

Each pipeline run executes five sequential stages. A stage failure invokes the
failure action defined for the relevant source in `source_registry.json` before
deciding whether to continue or halt.

| # | Stage | Description | Failure behavior |
|---|-------|-------------|-----------------|
| 1 | **Pull** | Download raw file(s) from each source URL. Compute checksum; compare to prior run. Store raw artifact in `data/raw/<source_id>/<YYYY-MM-DD>/`. | See Failure Handling table below. Critical-source failures may block remaining stages. |
| 2 | **Validate** | Schema check (expected columns present, key field non-null), row-count plausibility (± 20% vs prior run triggers warning; ± 50% triggers error), and referential integrity spot-checks (e.g., NPI format). | Log validation report to `logs/validation/<source_id>/<run_id>.json`. On error, reject file and apply source failure action. |
| 3 | **Score** | Run dimension-specific scoring logic against validated inputs. Produces a candidate score table with full provenance (`source_versions` dict, `methodology_version`, `scored_at`). | If scoring fails for a dimension, that dimension is marked `null` with `confidence_tier: null`; other dimensions continue. Alert Antoine. |
| 4 | **Store** | Write candidate scores to the versioned score store. Each write is immutable and tagged with a `score_version` UUID. Replaces the "current" pointer only after a successful publish. | On write failure, abort without updating the "current" pointer. Retry up to 3 times, then page oncall. |
| 5 | **Publish** | Promote the stored score version to the live API/dashboard. Update the `published_at` timestamp. Send pipeline completion notification. | If any critical source is stale beyond its threshold (see table below), publish is blocked and the prior version remains live. |

---

## 2. Failure Handling

| Failure type | Action | Stale threshold before escalation |
|---|---|---|
| **Pull fails — critical source** | Retain last-known-good raw file. Block publish for affected dimensions. Page oncall immediately. | 1 missed cycle (e.g., 1 month for LEIE, 1 week for NPPES) |
| **Pull fails — non-critical source** | Retain last-known-good raw file. Log warning. Notify source owner. Continue pipeline with stale data; set `confidence_tier` to `low` for affected dimension. | 2 missed cycles |
| **Pull fails — T-MSIS specifically** | Switch to cached Feb 2026 snapshot automatically. Set `confidence_tier: low` on utilization dimension. Do not block publish. Alert Antoine. | N/A — always use cached fallback; escalate if cache is also missing |
| **Validation fails** | Reject new file. Apply same logic as "Pull fails" for the source's criticality level. Do not promote rejected file to scoring. | Same as pull-fail thresholds above |
| **Scoring fails (dimension)** | Mark dimension score `null`, `confidence_tier: null`. Other dimensions unaffected. Alert Antoine. | N/A — scoring failures do not trigger stale clock |
| **Publish blocked (critical source stale)** | Prior published version remains live. Incident opened. Oncall notified. Daily re-check until resolved. | Immediate block on first missed cycle for critical sources |

---

## 3. Versioning Contract

Every row written to the score store must include the following fields. This
contract is enforced at the **Store** stage; rows missing required fields are
rejected.

| Field | Type | Description |
|---|---|---|
| `npi` | string(10) | National Provider Identifier — primary key |
| `dimension` | string | Scoring dimension (e.g., `safety`, `quality`, `utilization`, `experience`, `cost`) |
| `score` | float or null | Computed score value; `null` if dimension could not be scored |
| `confidence_tier` | enum | `high`, `medium`, `low`, or `null`. Reflects completeness and recency of source data. |
| `source_versions` | object | Dict mapping each `source_id` used in this score to the raw-file artifact path or datestamp (e.g., `{"oig_leie": "2026-04-01", "nppes": "2026-04-06"}`) |
| `methodology_version` | string (semver) | Version of the scoring methodology applied (e.g., `2.1.0`). Must match a tagged release in the methodology docs. |
| `scored_at` | ISO 8601 datetime | Timestamp when the score was computed (Stage 3 completion) |
| `published_at` | ISO 8601 datetime or null | Timestamp when this score version was promoted to live (Stage 5 completion); `null` until published |

**Score version immutability:** Once written to the store, a score row is never
modified in place. Corrections produce a new row with an updated `scored_at`
and a new `score_version` UUID. The "current" pointer is updated atomically
during Stage 5.

---

## 4. Refresh Calendar

| Source | Cadence | Check day | Owner |
|---|---|---|---|
| OIG LEIE Exclusion List (`oig_leie`) | Monthly | 1st Monday of each month | Othmane |
| NPPES NPI Registry (`nppes`) | Weekly | Every Sunday (automated pull) | Automated; Othmane reviews on failure |
| CMS QPP/MIPS Final Scores (`cms_qpp_mips`) | Annual | First Monday of July | Antoine |
| Medicare Physician Utilization (`medicare_utilization`) | Annual | First Monday of November | Antoine |
| Medicaid T-MSIS (`medicaid_tmsis`) | Annual (variable) | First Monday of March; monitor monthly | Antoine |
| CMS Facility Affiliations (`cms_facility_affiliations`) | Quarterly | 2nd Monday of Jan, Apr, Jul, Oct | Antoine |
| Hospital Quality Measures (`hospital_quality`) | Quarterly | 2nd Monday of Jan, Apr, Jul, Oct | Othmane |
| State Medical Board Records (`state_boards`) | Quarterly | 2nd Monday of Jan, Apr, Jul, Oct | Othmane |
| Provider-Submitted Data (`provider_submitted`) | Continuous | Real-time ingestion monitoring | Automated; Antoine on escalation |

### Notes on Calendar Execution

- **Automated pulls** (NPPES weekly) are triggered by the pipeline scheduler.
  Othmane receives a Slack alert if the pull job does not report success by
  Sunday 23:59 UTC.
- **Manual check days** indicate the day an owner verifies the source URL has
  published a new file. If the file is not yet available on the check day, the
  owner re-checks daily and updates the pipeline run log.
- **Methodology docs** (versioning, scoring spec changes) are owned by Antoine.
  Any methodology version bump must be merged and tagged before the next
  scheduled Score stage run.
- **T-MSIS special monitoring:** Antoine checks the CMS release page every
  Monday until a stable annual cadence is re-established. The Feb 2026 local
  cache must be kept until a newer verified file is confirmed.
