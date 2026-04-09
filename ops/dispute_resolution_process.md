# Dispute Resolution Process

**Scope:** This document defines the complete process for handling provider disputes against quality scores — from submission through final decision. It covers dispute types, workflow, SLAs, investigation procedures, resolution outcomes, and monitoring.

**Related files:**
- `ops/audit_trail_schema.json` — every dispute state transition generates an audit event
- `ops/dispute_schema.json` — machine-readable schema for dispute records
- `ops/provider_lifecycle.md` — provider status context during disputes
- `validation/edge_case_catalog.md` — referenced during methodology disagreement investigations

---

## 1. Dispute Types

| Type | Description | Example | Resolution Path |
|------|-------------|---------|----------------|
| `data_error` | Provider believes the data used to score them is incorrect | "These billing codes aren't mine" / "I am board certified but your data shows I'm not" | Verify against source data. Correct score if confirmed. |
| `methodology_disagreement` | Provider believes the scoring methodology is unfair for their situation | "Peer comparison is unfair — I'm the only specialist in my county" / "The reference code set doesn't fit my subspecialty" | Review methodology. May result in methodology note, exception, or no change. |
| `context_claim` | Provider wants to provide context for an anomalous score | "My volume dropped because I was on medical leave" / "I recently changed practice settings" | Document context. Flag score as "context available." Score number doesn't change. |

---

## 2. Dispute Workflow

```
Provider submits dispute
    ↓
Auto-acknowledge (within 1 business day)
    ↓
Triage: classify type + assign reviewer
    ↓
Investigation (varies by type)
    ↓
Resolution decision
    ↓
Provider notified with explanation
    ↓
If provider disagrees → Escalation
    ↓
Escalation review (senior reviewer)
    ↓
Final decision (binding)
```

**Status transitions** (maps to `status` field in `dispute_schema.json`):

| Status | Description |
|--------|-------------|
| `submitted` | Dispute received. Awaiting acknowledgment. |
| `acknowledged` | System has confirmed receipt. Triage in progress. |
| `investigating` | Assigned to reviewer. Active investigation underway. |
| `resolved` | Decision reached. Provider notified. Escalation window open. |
| `escalated` | Provider requested escalation. Senior reviewer assigned. |
| `final` | Final decision issued. No further appeal. |

---

## 3. SLAs

| Stage | SLA | Notes |
|-------|-----|-------|
| Acknowledgment | 1 business day | Automated |
| Triage + assignment | 2 business days | Human |
| Investigation | 10 business days (`data_error`), 15 business days (`methodology_disagreement`), 5 business days (`context_claim`) | Depends on type |
| Resolution notification | 1 business day after decision | Human review of communication |
| Escalation window | 10 business days from resolution | Provider must escalate within this window |
| Escalation review | 15 business days | Senior reviewer |

SLA clock pauses if additional information is requested from the provider and not yet received. Clock resumes when provider responds or the request window closes (5 business days).

---

## 4. Investigation Procedures by Type

### 4a. Data Error

1. Identify the specific data point(s) in dispute (billing code, credential, malpractice record, etc.)
2. Pull the raw source data (CMS file, NPPES, DEA, state board, etc.) at the version used for scoring
3. Verify: does the source data match what our scoring pipeline used?
4. If mismatch: identify whether it is our processing error or a source data issue
5. If our error: correct the source mapping and rescore; generate `score_computed` audit event
6. If source error: document the discrepancy, flag the data point, and note in score provenance; do not alter the score based on provider assertion alone — open a source data correction ticket
7. If data is correct: explain to provider exactly how the data maps to their score with specific line-item references

### 4b. Methodology Disagreement

1. Identify the specific scoring rule(s) in dispute (peer group definition, reference code set, volume threshold, etc.)
2. Review whether the rule applies fairly to this provider's situation
3. Check if the provider falls into a known edge case (see `validation/edge_case_catalog.md`)
4. Determine the appropriate response:
   - **(a) No change** — methodology is working as intended; document explanation
   - **(b) Methodology note** — provider's concern is valid and worth flagging; add a methodology note for this provider type; log for methodology review in next version
   - **(c) Flag for methodology review** — concern is systemic; add to the next methodology review cycle; no score change now
5. Never make ad hoc score changes for individual providers. Methodology changes apply to all providers in the affected group, not a single provider.

### 4c. Context Claim

1. Verify the context is plausible (e.g., medical leave dates corroborated by licensure records, practice change documented in NPPES)
2. Document the context in the provider's record with the evidence provided
3. Add `context_available` flag to the score record
4. Score number does NOT change — context is supplementary information, not a scoring input
5. Employers and plan administrators can see the context flag when they view the provider's full profile

---

## 5. Resolution Outcomes

| Outcome | What Happens | Audit Trail Events |
|---------|-------------|-------------------|
| `corrected` | Data error confirmed. Score recalculated with correct data. | `dispute_resolved` + `score_computed` |
| `methodology_noted` | Valid concern. No score change now, but logged for methodology review in next version. | `dispute_resolved` |
| `context_documented` | Context added to provider record. Score unchanged. `context_available` flag set. | `dispute_resolved` |
| `no_change` | Investigation found no error or valid concern. Score stands. Full explanation provided. | `dispute_resolved` |
| `escalated` | Provider disagrees with initial resolution. Sent to senior reviewer. | `dispute_escalated` |
| `final_no_change` | Escalation review upholds original decision. Decision is binding. | `dispute_resolved` |
| `final_corrected` | Escalation review finds original decision was wrong. Score updated. | `dispute_resolved` + `score_computed` |

**Key constraint:** `new_score` is only populated for outcomes `corrected` and `final_corrected`. All other outcomes leave the score unchanged.

---

## 6. Audit Trail Integration

Every state transition in the dispute lifecycle generates an audit event in the format defined by `ops/audit_trail_schema.json`. The dispute record's `audit_event_ids` array holds the UUIDs of all linked audit events, enabling full reconstruction of the dispute history.

| Transition | Audit Event Type |
|------------|-----------------|
| Dispute submitted | `dispute_submitted` |
| Dispute acknowledged | `dispute_acknowledged` |
| Resolution reached | `dispute_resolved` |
| Score corrected after resolution | `score_computed` |
| Escalation opened | `dispute_escalated` |
| Final decision after escalation | `dispute_resolved` |

---

## 7. Metrics & Monitoring

Track these as system health indicators on a monthly basis:

| Metric | Why It Matters |
|--------|---------------|
| Disputes per month (total and by type) | Baseline volume; spikes may indicate data or UI issues |
| Resolution time (median, p90) | SLA compliance; identifies bottlenecks |
| Outcome distribution (% `corrected` vs `no_change`) | High correction rate → data quality issue |
| Escalation rate | High rate → resolution quality or communication problem |
| Provider satisfaction with resolution (if surveyed) | Perception signal even when score doesn't change |
| Repeat dispute rate (same provider, same dimension) | Indicates unresolved underlying issue |

**Threshold signals:**
- High dispute volume concentrated on a specific dimension → possible methodology or data quality issue for that dimension; trigger methodology review
- High correction rate (>15% of disputes result in `corrected`) → systemic data pipeline issue; escalate to data engineering
- High escalation rate (>30% of resolved disputes escalated) → resolution explanations may be insufficient; review communication templates
