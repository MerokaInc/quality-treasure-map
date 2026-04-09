# F4: Ongoing Quality Reporting

## Overview

After a network is contracted, employers need ongoing visibility into provider quality over time. This spec defines the three report types (quarterly, alert, annual), their contents, delivery mechanisms, ERISA integration, and the API contract.

---

## 1. Report Types

| Report | Cadence | Trigger | Primary Audience |
|---|---|---|---|
| Quarterly Network Report | Every quarter | Scheduled (auto-generated) | Employer benefits team |
| Provider Alert | Real-time | Event-driven | Employer benefits team |
| Annual Review | Yearly | Scheduled (auto-generated, reviewed by account manager) | Employer benefits team, ERISA documentation |

---

## 2. Quarterly Network Report

The quarterly report is the standard ongoing quality touchpoint. It summarizes network quality over the past quarter and surfaces anything requiring attention.

**Contents:**

### Network Quality Trend
- Composite average this quarter vs. prior quarter (delta)
- Per-dimension average this quarter vs. prior quarter
- Trend direction label: Improving / Stable / Declining

### Provider Scorecards
Per provider in the network:
- Current composite score and confidence level
- Score vs. prior quarter (delta, trend arrow)
- Active flags (if any)
- Safety gate status

### New Data Highlights
- Which data sources refreshed this quarter (e.g., "CMS claims data updated through Q3 2025")
- Any methodology changes applied this quarter, with brief description of impact
- Data coverage changes (new providers with sufficient data, providers dropping below data threshold)

### Anomaly Summary
- Anomalies detected during the quarter (from the monitoring pipeline)
- Resolution status for each: resolved, under review, or unresolved

### Dispute Summary
- Disputes filed during the quarter
- Outcomes: upheld, not upheld, pending

### Recommendations
- Providers showing consistent improvement (positive signal)
- Providers showing decline (attention warranted)
- Coverage gaps emerging (new gaps since last quarter)
- Providers approaching quality threshold (early warning)

---

## 3. Provider Alert

Provider alerts are event-driven notifications sent outside the quarterly cycle for material changes requiring timely employer awareness.

**Alert triggers:**

| Trigger | Timing | Severity |
|---|---|---|
| Safety gate failure | Immediate (within 1 hour of flag) | Critical |
| Provider suspended or removed from network | Within 1 business day | Critical |
| Score drop > 15 points | At next reporting cycle (not immediate) | High |
| Provider flagged for review | Next business day | Informational |

**Alert message template:**
```
Provider Alert: {provider_name} ({specialty}) — {alert_type}.
{detail}.
Recommended action: {action}.
```

**Example alerts:**

```
Provider Alert: Dr. Jane Smith (OB-GYN) — Safety Gate Failure.
A safety indicator has failed for this provider as of 2026-04-09.
This provider has been automatically suppressed from new member matching.
Recommended action: Review provider status and determine whether to suspend the contract.
```

```
Provider Alert: Charleston Women's Health (OB-GYN) — Score Decline.
Composite score dropped from 79 to 61 (–18 points) in the most recent scoring cycle.
Recommended action: Review provider scorecard and consider scheduling a contract review conversation.
```

**Alert delivery:** Email to employer contacts on file + webhook (if configured). See Section 5.

---

## 4. Annual Review

The annual review is a comprehensive report covering the full contract year. It is the primary ERISA monitoring artifact for the year and informs renewal decisions.

**Contents:**

### Full-Year Quality Trajectory
- Per-provider: quarterly scores for each quarter of the year, trend summary
- Network composite trend across all four quarters
- Providers with consistent improvement vs. consistent decline

### Network Composition Changes
- Providers added during the year (with date and quality at time of addition)
- Providers removed during the year (with date and reason if available)
- Providers flagged or placed under review during the year

### Year-Over-Year Quality Comparison
- Network composite score: this year vs. prior year
- Per-dimension comparison: this year vs. prior year
- New providers added to scoring pool since last year

### ERISA Monitoring Evidence Summary
- Links to quarterly reports (all four quarters) as monitoring evidence (per E3 capability)
- Count of alerts issued and resolved during the year
- Disputes filed and outcomes
- Statement of monitoring activity: "This network was actively monitored during [year] per the Meroka quality monitoring program."

### Methodology Changes
- Any methodology changes applied during the year
- Impact assessment for each change

### Renewal Recommendations
Per provider, one of three recommendations with supporting rationale:

| Recommendation | Criteria |
|---|---|
| Keep | Consistent quality at or above threshold, no unresolved flags |
| Review | Score near threshold, declining trend, unresolved flag, or low confidence |
| Replace | Safety gate failure, sustained score below threshold, unresolved critical flag |

Recommendations are generated by the system and reviewed by the Meroka account manager before delivery.

---

## 5. Delivery

| Report | Generation | Review | Delivery Channel |
|---|---|---|---|
| Quarterly | Auto-generated on schedule | No review required | Employer portal + email summary |
| Provider Alert | Auto-generated on trigger | No review required | Email to employer contacts + webhook |
| Annual | Auto-generated on schedule | Reviewed by Meroka account manager before delivery | Employer portal + account manager delivery |

**Email summary (quarterly):** A brief email with the top 3–5 highlights from the report (key metric changes, alerts, recommendations). Full report linked in the portal.

**Webhook (alerts):** Employer can subscribe to receive alert payloads via webhook for integration with their HR/benefits systems. See API contract below.

**Portal access:** All reports are available in the employer portal for the duration of the contract + 7 years (ERISA retention requirement).

---

## 6. ERISA Integration

The reporting system is designed to support ERISA fiduciary obligations for plan sponsors.

- Every quarterly report is a monitoring evidence record per the E3 capability (Ongoing Monitoring)
- The annual review is the primary ERISA monitoring artifact for the year
- All reports reference the underlying audit trail events from the scoring pipeline for verifiability
- Reports are stored with a tamper-evident record (hash + timestamp) to support audit use
- Retention: 7 years minimum, in line with ERISA record-keeping requirements

**ERISA documentation package (on demand):**
Employers can export a full ERISA documentation package containing:
- All quarterly reports for the requested period
- All annual reviews
- All provider alerts
- Audit trail event log (from E3)

This package is suitable for submission in a DOL audit or fiduciary review.

---

## 7. API Contract

### Quarterly report

```
GET /api/employers/{id}/reports/quarterly?period=2026-Q2
```

**Path parameters:**
- `id` — Employer ID

**Query parameters:**
- `period` — Quarter in `YYYY-QN` format (e.g., `2026-Q2`)

**Response:** Full quarterly report data including network quality trend, provider scorecards, data highlights, anomaly summary, dispute summary, and recommendations. Report metadata includes generated timestamp and report ID.

---

### Annual review

```
GET /api/employers/{id}/reports/annual?year=2026
```

**Path parameters:**
- `id` — Employer ID

**Query parameters:**
- `year` — Four-digit year (e.g., `2026`)

**Response:** Full annual review data including full-year trajectory, composition changes, year-over-year comparison, ERISA evidence summary, methodology changes, and renewal recommendations. Includes `reviewed_by` and `reviewed_at` fields (populated after account manager review).

---

### Alert webhook subscription

```
POST /api/employers/{id}/alerts/subscribe
```

**Request body:**
```json
{
  "webhook_url": "https://employer-system.example.com/hooks/quality-alerts",
  "secret": "webhook_signing_secret",
  "alert_types": ["safety_gate_failure", "score_decline", "provider_removed", "provider_flagged"],
  "contacts": ["benefits@employer.example.com"]
}
```

**Response:** Subscription ID and confirmation. Webhooks are signed with the provided secret using HMAC-SHA256.

**Webhook payload (example):**
```json
{
  "event_type": "safety_gate_failure",
  "employer_id": "emp_123",
  "provider_npi": "1234567890",
  "provider_name": "Dr. Jane Smith",
  "specialty": "OB-GYN",
  "alert_message": "Provider Alert: Dr. Jane Smith (OB-GYN) — Safety Gate Failure. A safety indicator has failed for this provider as of 2026-04-09. Recommended action: Review provider status and determine whether to suspend the contract.",
  "triggered_at": "2026-04-09T14:32:00Z",
  "report_url": "https://portal.meroka.com/employers/emp_123/alerts/alert_456"
}
```

---

**Notes for eng:**
- Quarterly reports are generated on the 15th of the month following quarter end (e.g., Q1 report generated April 15).
- Annual reviews are generated January 31 of the following year, held in draft status until account manager approval.
- Alert webhooks must be retried up to 3 times with exponential backoff if the endpoint returns a non-2xx response. Failed deliveries after 3 attempts are logged and the employer is notified via email.
- All report endpoints require employer-level authentication.
- Report data must not include raw claims data or patient-identifiable information. All data is aggregated and de-identified before inclusion in reports.
