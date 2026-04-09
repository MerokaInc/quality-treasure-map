# Provider Lifecycle Specification

## 1. Status States

```
pending_review → active → flagged → suspended → removed
                   ↑         |          |
                   └─────────┘          |
                   (resolved)           |
                   ↑                    |
                   └────────────────────┘
                   (re-application approved)
```

| Status | Description |
|--------|-------------|
| `pending_review` | Provider has onboarded but initial scoring/safety gate not yet complete |
| `active` | Provider passed safety gate, scored, and listed on marketplace |
| `flagged` | An issue detected that requires human review (score drop, anomaly, data concern) |
| `suspended` | Confirmed issue; provider temporarily removed from marketplace pending resolution |
| `removed` | Provider excluded from marketplace (safety gate failure, sustained issues, or voluntary) |

---

## 2. Transition Triggers

| From | To | Trigger | Auto/Manual | SLA |
|------|----|---------|-------------|-----|
| `pending_review` | `active` | Safety gate pass + initial scores computed + human review (if edge case) | Auto (with manual override) | 5 business days |
| `pending_review` | `removed` | Safety gate failure | Auto | Immediate |
| `active` | `flagged` | Safety gate alert on refresh, score drops >20 pts in one cycle, anomaly detected (D3), dispute filed (E2) | Auto | — |
| `flagged` | `active` | Human review confirms no issue, or dispute resolved favorably | Manual | 10 business days |
| `flagged` | `suspended` | Human review confirms issue, or provider fails to respond within SLA | Manual | — |
| `suspended` | `active` | Provider resolves issue and passes re-evaluation | Manual | — |
| `suspended` | `removed` | Issue not resolved within 30 days, or provider requests removal | Manual/Auto | 30 days |
| `removed` | `pending_review` | Provider re-applies (starts full re-evaluation from scratch) | Manual | — |
| `active` | `removed` | Provider requests voluntary removal | Manual | — |

---

## 3. Notification Rules

Every status transition generates:

1. **Audit trail event** — recorded per `ops/audit_trail_schema.json` with `event_type: provider_status_changed`
2. **Provider notification** — explanation of the new status and any required action (see `ops/notification_templates.md`)
3. **Employer notification** — sent to all employers who have this provider in their network (for network-impacting transitions; see Section 4)
4. **Internal ops alert** — generated for any transition to `flagged`, `suspended`, or `removed`

---

## 4. Employer Notification Rules

When a provider in an employer's network changes status, the following notifications are sent:

| New Status | Message Summary |
|------------|----------------|
| `flagged` | "Provider under review. No action needed yet." |
| `suspended` | "Provider temporarily removed. Recommend identifying alternatives." |
| `removed` | "Provider removed from marketplace. Please update your network." |
| `active` (after `flagged`) | "Review complete. Provider confirmed active." |

Employers are identified via the `employer_networks` field on the provider's lifecycle record. Notifications are not sent for `pending_review → removed` transitions because the provider was never in any employer network.

---

## 5. Re-entry Process

A provider with `removed` status may re-apply. The re-entry process is:

1. Provider submits re-application with evidence of issue resolution
2. Full safety gate re-run (same criteria as initial onboarding)
3. Full re-scoring across all quality dimensions
4. Human review of re-application and resolution evidence
5. If approved: status transitions to `active` via `pending_review`

All previous history is preserved in the audit trail. The prior lifecycle record (including all `transition_history` entries) remains immutable; the re-entry creates new transition events appended to the same record.

---

## 6. Integration Points

| System | Integration |
|--------|-------------|
| Audit trail (E4) | Every transition writes a `provider_status_changed` event to `ops/audit_trail_schema.json` |
| Anomaly detection (D3) | Anomaly alerts trigger `active → flagged` transitions automatically |
| Dispute system (E2) | Dispute filing triggers `active → flagged`; dispute resolution can trigger `flagged → active` |
| Safety gate | Gate pass/fail drives `pending_review → active` and `pending_review → removed` |
| Scoring pipeline | Score drop >20 pts in one cycle triggers `active → flagged` automatically |
