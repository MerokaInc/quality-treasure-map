# Audit Trail Schema

**Schema file:** `ops/audit_trail_schema.json`  
**Schema version:** v1.0.0  
**JSON Schema draft:** 2020-12

---

## Purpose

The audit trail is an immutable, append-only log of every consequential action in the quality scoring system. It records:

- Every scoring computation, publication, and hold decision
- Every data source refresh (start, success, failure, quarantine)
- Every provider status change, onboarding, suspension, removal, and reinstatement
- Every dispute submission, acknowledgment, escalation, and resolution
- Every methodology update, enrichment submission, anomaly detection, and validation run

**Retention policy:** 6 years from event creation. This aligns with the ERISA statute of limitations for civil enforcement actions and is consistent with CMS data retention guidance for quality reporting programs.

All events are immutable once written. No update or delete operations are permitted on audit records. Corrections are handled by writing a new corrective event that references the `event_id` of the original (see Immutability Rule below).

---

## Top-Level Event Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `event_id` | string (uuid) | yes | UUID v4 uniquely identifying this event |
| `event_type` | string (enum) | yes | Event classification; determines payload shape |
| `timestamp` | string (date-time) | yes | UTC ISO 8601 timestamp set by the system at creation |
| `actor` | string | yes | `"system"` for automated actions; authenticated user ID (e.g., `"user:jsmith"`) for manual actions |
| `npi` | string or null | yes | 10-digit NPI; null for system-wide events |
| `payload` | object | yes | Event-type-specific data (see examples below) |

### Event Types (24 total)

| Category | Event Types |
|---|---|
| Scoring | `score_computed`, `score_published`, `score_held_stale` |
| Data Refresh | `data_refresh_started`, `data_refresh_succeeded`, `data_refresh_failed`, `data_refresh_quarantined` |
| Provider Lifecycle | `provider_status_changed`, `provider_onboarded`, `provider_flagged`, `provider_suspended`, `provider_removed`, `provider_reinstated` |
| Disputes | `dispute_submitted`, `dispute_acknowledged`, `dispute_resolved`, `dispute_escalated` |
| Methodology & Enrichment | `methodology_changed`, `enrichment_submitted`, `enrichment_verified`, `enrichment_rejected` |
| Anomalies & Validation | `anomaly_detected`, `anomaly_reviewed`, `validation_run_completed` |

---

## Event Payload Examples

Each event type has a defined payload shape. The following examples show expected fields for the most commonly queried event types. All payload fields are in addition to the top-level required fields.

### `score_computed`

Emitted every time the scoring pipeline computes a dimensional score for a provider. One event per dimension per run.

```json
{
  "event_id": "b3d2e1f0-1234-4abc-8def-9876543210ab",
  "event_type": "score_computed",
  "timestamp": "2026-04-09T14:32:00Z",
  "actor": "system",
  "npi": "1234567890",
  "payload": {
    "dimension": "safety",
    "score": 87.4,
    "confidence_tier": "high",
    "methodology_version": "v3.1.0",
    "source_versions": {
      "cms_quality": "2026-Q1",
      "nppes": "2026-03-15",
      "state_board": "2026-02-28"
    },
    "sub_scores": {
      "malpractice": 92.0,
      "adverse_events": 83.5,
      "board_actions": 90.0
    }
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `dimension` | string | Quality dimension scored (e.g., `safety`, `outcomes`, `utilization`) |
| `score` | number | Computed score (0–100) |
| `confidence_tier` | string | `high`, `medium`, or `low` based on data completeness |
| `methodology_version` | string | Version of the scoring methodology applied |
| `source_versions` | object | Map of source_id to version tag used in this computation |
| `sub_scores` | object | Map of sub-dimension name to score |

---

### `score_published`

Emitted when a computed score is approved and published to the public-facing score surface.

```json
{
  "event_id": "d5f4a3b2-9012-4cde-af01-bcdef1234567",
  "event_type": "score_published",
  "timestamp": "2026-04-09T15:00:00Z",
  "actor": "system",
  "npi": "1234567890",
  "payload": {
    "dimension": "safety",
    "score": 87.4,
    "previous_score": 84.1,
    "score_change": 3.3,
    "validation_run_id": "vr-2026-04-09-001"
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `dimension` | string | Quality dimension published |
| `score` | number | Published score |
| `previous_score` | number or null | Score that was replaced (null if first publication) |
| `score_change` | number or null | `score - previous_score`; null if no previous score |
| `validation_run_id` | string | ID of the validation run that cleared this score for publication |

---

### `data_refresh_succeeded`

Emitted when a data source pull completes successfully and passes ingestion checks.

```json
{
  "event_id": "e6a5b4c3-3456-4def-b012-cdef23456789",
  "event_type": "data_refresh_succeeded",
  "timestamp": "2026-04-09T06:45:00Z",
  "actor": "system",
  "npi": null,
  "payload": {
    "source_id": "cms_quality_measures",
    "pull_timestamp": "2026-04-09T06:30:00Z",
    "record_count": 1482390,
    "previous_record_count": 1479201,
    "file_size_mb": 342.7,
    "version_tag": "2026-Q1"
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `source_id` | string | Identifier of the data source (matches source registry) |
| `pull_timestamp` | string (date-time) | When the pull was initiated |
| `record_count` | integer | Number of records in the refreshed dataset |
| `previous_record_count` | integer or null | Record count of the prior successful pull |
| `file_size_mb` | number | Size of the pulled dataset in megabytes |
| `version_tag` | string | Version label assigned to this pull (used in `source_versions` of score events) |

---

### `data_refresh_failed`

Emitted when a data source pull or ingestion check fails.

```json
{
  "event_id": "f7b6c5d4-7890-4efg-c123-def345678901",
  "event_type": "data_refresh_failed",
  "timestamp": "2026-04-09T06:45:00Z",
  "actor": "system",
  "npi": null,
  "payload": {
    "source_id": "state_board_ny",
    "error": "HTTP 503: upstream source unavailable after 3 retries",
    "retry_count": 3,
    "stale_since": "2026-04-02T06:00:00Z",
    "action_taken": "held_stale_scores_flagged"
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `source_id` | string | Identifier of the data source that failed |
| `error` | string | Human-readable error description |
| `retry_count` | integer | Number of retry attempts made before failing |
| `stale_since` | string (date-time) | Timestamp of the last successful pull for this source |
| `action_taken` | string | System response (e.g., `held_stale_scores_flagged`, `alert_sent`, `manual_review_queued`) |

---

### `provider_status_changed`

Emitted when a provider's status in the quality system changes (e.g., active -> suspended).

```json
{
  "event_id": "a1b2c3d4-1234-4abc-8def-fedcba987654",
  "event_type": "provider_status_changed",
  "timestamp": "2026-04-09T11:20:00Z",
  "actor": "user:compliance-team",
  "npi": "9876543210",
  "payload": {
    "previous_status": "active",
    "new_status": "suspended",
    "trigger": "board_action",
    "trigger_detail": "License revoked by NY State Medical Board, effective 2026-04-08",
    "requires_review": false,
    "notification_sent": true
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `previous_status` | string | Status before this event (`active`, `flagged`, `suspended`, `removed`, `pending`) |
| `new_status` | string | Status after this event |
| `trigger` | string | Category of trigger (e.g., `board_action`, `dispute_resolution`, `data_source_update`, `manual_review`) |
| `trigger_detail` | string | Free-text description of what triggered the change |
| `requires_review` | boolean | Whether this change requires human review before taking effect |
| `notification_sent` | boolean | Whether the provider was notified of this status change |

---

### `dispute_submitted`

Emitted when a provider or authorized representative submits a dispute against a score or data point.

```json
{
  "event_id": "b2c3d4e5-5678-4bcd-9ef0-abcdef012345",
  "event_type": "dispute_submitted",
  "timestamp": "2026-04-09T16:00:00Z",
  "actor": "user:jsmith",
  "npi": "1234567890",
  "payload": {
    "dispute_type": "score_correction",
    "dimension": "safety",
    "provider_claim": "The malpractice case listed (case #2021-MED-0042) was dismissed with prejudice on 2022-11-15 and should not be counted against my score.",
    "current_score": 87.4,
    "evidence_attached": true
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `dispute_type` | string | `score_correction`, `data_error`, `missing_data`, `methodology_challenge` |
| `dimension` | string | Quality dimension being disputed |
| `provider_claim` | string | Provider's description of the dispute |
| `current_score` | number | Score at the time of dispute submission |
| `evidence_attached` | boolean | Whether supporting documentation was uploaded with the dispute |

---

### `dispute_resolved`

Emitted when a dispute is fully resolved (upheld, denied, or partially upheld).

```json
{
  "event_id": "c3d4e5f6-9012-4cde-af01-bcdef1234567",
  "event_type": "dispute_resolved",
  "timestamp": "2026-04-24T10:15:00Z",
  "actor": "user:quality-ops",
  "npi": "1234567890",
  "payload": {
    "dispute_id": "b2c3d4e5-5678-4bcd-9ef0-abcdef012345",
    "resolution": "upheld",
    "explanation": "Evidence confirmed dismissal of case #2021-MED-0042. Score recalculated excluding this record.",
    "previous_score": 87.4,
    "new_score": 91.2,
    "resolution_days": 15
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `dispute_id` | string (uuid) | `event_id` of the originating `dispute_submitted` event |
| `resolution` | string | `upheld`, `denied`, or `partially_upheld` |
| `explanation` | string | Reviewer's explanation of the resolution decision |
| `previous_score` | number | Score before the dispute was resolved |
| `new_score` | number or null | Score after resolution; null if score was not changed (denied) |
| `resolution_days` | integer | Calendar days from `dispute_submitted` to `dispute_resolved` |

---

### `methodology_changed`

Emitted when the scoring methodology is updated. Because methodology changes may affect all providers, `npi` is null.

```json
{
  "event_id": "d4e5f6a7-3456-4def-b012-cdef23456789",
  "event_type": "methodology_changed",
  "timestamp": "2026-04-01T00:00:00Z",
  "actor": "user:chief-methodologist",
  "npi": null,
  "payload": {
    "previous_version": "v3.0.0",
    "new_version": "v3.1.0",
    "change_summary": "Increased weight of board action recency in safety dimension; removed deprecated CMS Star Rating sub-component.",
    "approved_by": "user:medical-director",
    "effective_date": "2026-04-01",
    "affected_dimensions": ["safety"],
    "affected_npis": "all"
  }
}
```

**Payload fields:**

| Field | Type | Description |
|---|---|---|
| `previous_version` | string | Semver of the methodology version being replaced |
| `new_version` | string | Semver of the new methodology version |
| `change_summary` | string | Human-readable summary of what changed and why |
| `approved_by` | string | Actor ID of the approver (separate from the actor who submitted the change) |
| `effective_date` | string (date) | Date the new methodology takes effect for scoring runs |
| `affected_dimensions` | array of string | Quality dimensions affected by this change |
| `affected_npis` | string or array | `"all"` if all providers are affected, or an array of NPI strings for targeted changes |

---

## Query Interface Requirements

The following query patterns must be supported by the audit trail storage layer. Eng should implement these as indexed queries — do not rely on full-table scans.

### Supported Query Patterns

**1. Query by NPI — all events for a provider in a time range**

```
GET /audit?npi=1234567890&from=2026-01-01T00:00:00Z&to=2026-04-09T23:59:59Z
```

Required index: `(npi, timestamp)`. Results should be ordered by `timestamp` ascending. Events with `npi = null` are excluded from NPI-scoped queries.

**2. Query by event type**

```
GET /audit?event_type=dispute_submitted&from=2026-01-01T00:00:00Z
```

Required index: `(event_type, timestamp)`.

**3. Query by dimension**

Because `dimension` lives inside `payload`, this query requires either a promoted column/index on `payload.dimension` or a JSON path index, depending on the storage backend.

```
GET /audit?dimension=safety&from=2026-01-01T00:00:00Z
```

Applicable event types that carry a `dimension` field: `score_computed`, `score_published`, `score_held_stale`, `dispute_submitted`, `dispute_resolved`, `dispute_escalated`, `anomaly_detected`.

**4. Query by date range (system-wide)**

```
GET /audit?from=2026-04-01T00:00:00Z&to=2026-04-09T23:59:59Z
```

Required index: `(timestamp)`. This is the full-history query — paginate results (recommended page size: 500 events).

**5. Combined NPI + event type**

```
GET /audit?npi=1234567890&event_type=score_computed
```

Required index: `(npi, event_type, timestamp)`.

---

## Immutability Rule

**Events cannot be updated or deleted.**

The audit trail is write-once. If a logged event contains an error (e.g., a score was computed with a bug that was later patched), the correction is captured as a new event referencing the original:

- For score corrections: emit a new `score_computed` or `score_published` event. Include the original `event_id` in `payload.corrects_event_id`.
- For dispute resolutions that change a score: emit `dispute_resolved` with `dispute_id` pointing to the original `dispute_submitted` event.
- For data issues discovered after the fact: emit `anomaly_detected` or `anomaly_reviewed` referencing affected event IDs in the payload.

Storage layer must enforce immutability at the database level (e.g., no UPDATE/DELETE grants on the audit table; use INSERT-only roles or an append-only log store).

---

## Implementation Notes

- All timestamps must be UTC. Reject events with non-UTC timestamps at ingestion.
- `event_id` must be generated server-side (UUID v4). Never accept client-supplied event IDs.
- Payloads should be validated against per-event-type schemas at ingestion time. Unknown payload fields should be preserved (do not strip them), but required fields must be present.
- Log shipping latency target: events should be durably written within 5 seconds of the triggering action.
- For high-volume event types (`score_computed`, `validation_run_completed`), consider a write-ahead log or message queue buffer before persistence to avoid blocking the scoring pipeline.
