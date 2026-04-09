# Anomaly Detection

**Version:** 1.0.0
**Last updated:** 2026-04-09
**Owner:** Antoine (detection pipeline & scoring logic), Othmane (data-level checks)

---

## 1. Anomaly Types

| Type | Description | Detection Method | Severity Default |
|------|-------------|-----------------|-----------------|
| `score_swing` | Provider score changes >20 pts between cycles | Compare current vs prior snapshot | Warning |
| `score_extreme_swing` | Provider score changes >40 pts | Compare current vs prior snapshot | Critical |
| `safety_gate_change` | Provider safety gate status changed (pass→fail or fail→pass) | Compare safety gate output | Critical |
| `data_disappearance` | Provider appeared in prior source pull but missing from current | Compare NPI sets across pulls | Warning |
| `data_appearance` | New NPI appears with extreme scores (>95 or <20) | Check new NPIs against thresholds | Info |
| `npi_mismatch` | NPI resolves to different provider details than prior pull | Compare NPPES fields | Warning |
| `duplicate_detection` | Two NPIs appear to be the same provider (name+address match) | Fuzzy matching on NPPES fields | Info |
| `cohort_shift` | State-level peer cohort median shifts >10 pts for a specialty | Compare cohort statistics across pulls | Warning |
| `cohort_extreme_shift` | State cohort shifts >20 pts (likely data issue) | Compare cohort stats | Critical |
| `source_stale` | Data source missed its refresh window | Check last_pull vs expected cadence | Warning (→Critical at 2x cadence) |
| `source_record_count_change` | Source record count changes >20% between pulls | Compare record counts | Warning |

---

## 2. Severity Levels

- `info` — Logged, no action required. Available for review.
- `warning` — Queued for next ops review cycle. Reviewer assigned.
- `critical` — Immediate review required. Ops team alerted. May trigger provider lifecycle change (D2).

---

## 3. Detection Pipeline

Run after every data refresh (D1):

1. **Score-level checks** — Compare new scores to prior snapshots (from C3 longitudinal tracking). Detect `score_swing`, `score_extreme_swing`, and `safety_gate_change`.
2. **Data-level checks** — Compare source pulls for record counts and NPI presence/absence. Detect `data_disappearance`, `data_appearance`, `npi_mismatch`, `duplicate_detection`, `source_stale`, and `source_record_count_change`.
3. **Cohort-level checks** — Compare peer cohort statistics (median, distribution) across pulls. Detect `cohort_shift` and `cohort_extreme_shift`.
4. **Generate anomaly records** — For each detected condition, write one anomaly record (see `anomaly_schema.json`) with all relevant metadata.
5. **Route by severity** — Critical anomalies trigger immediate alerts; warnings are queued; info events are logged only.
6. **Write to audit trail** — Every anomaly record produces an `anomaly_detected` event in the audit trail (`audit_trail_schema.json`). The resulting `event_id` is stored as `audit_event_id` on the anomaly record.

---

## 4. Routing Rules

| Severity | Routing | SLA |
|----------|---------|-----|
| Critical | Slack/email alert to ops lead + data science lead. Provider lifecycle: auto-flag provider if anomaly is safety gate related. | Review within 1 business day |
| Warning | Added to ops review queue. Visible in B3 ops dashboard. | Review within 5 business days |
| Info | Logged only. Visible in B3 ops dashboard anomaly section. | No SLA |

### `source_stale` Escalation

`source_stale` starts at `warning` severity. If the same source remains un-refreshed for 2× its expected cadence interval, the anomaly is re-raised (or updated) to `critical` and follows the Critical routing path.

---

## 5. Resolution

Each anomaly record must be reviewed and resolved by an ops team member. Resolution is recorded on the anomaly record and produces an `anomaly_reviewed` event in the audit trail.

| Resolution | Meaning | Next Action |
|------------|---------|-------------|
| `confirmed_real` | The anomaly reflects a genuine change in provider data or performance. No correction needed. | Close. If safety-gate-related, confirm provider lifecycle action taken. |
| `data_issue` | The anomaly was caused by a data problem (bad pull, upstream error, NPI collision). | Trigger data correction or hold affected scores until resolved. |
| `methodology_issue` | The anomaly exposed a problem in scoring logic or cohort construction. | Trigger methodology review. Coordinate with data science lead (Antoine). |
| `false_positive` | The detection rule fired incorrectly — threshold was too sensitive or edge case not anticipated. | Close. Consider threshold adjustment; document in anomaly_notes for tuning. |

---

## 6. Relationship to Other Processes

- **Data refresh pipeline** (`data_refresh_pipeline.md`) — Anomaly detection runs as a post-stage step after Stage 3 (Score) and again after Stage 2 (Validate) for data-level checks.
- **Longitudinal tracking** (`longitudinal_tracking.md`) — Score-level checks consume the versioned snapshot store. The prior snapshot for each NPI × dimension is the comparison baseline.
- **Provider lifecycle** (`provider_lifecycle.md`) — Critical anomalies, especially `safety_gate_change`, may auto-trigger a provider lifecycle status change (flag or suspend) pending review.
- **Audit trail** (`audit_trail_schema.json`) — Every anomaly detection and resolution produces a corresponding audit event.
