# Provider Data Enrichment

**Scope:** This document defines the process for provider-initiated data enrichment — what providers can submit, how submissions are verified, and how verified data affects quality scores. Enrichment is distinct from the dispute process: enrichment adds new information, while disputes challenge existing data.

**Related files:**
- `ops/audit_trail_schema.json` — every enrichment event generates an audit event
- `ops/enrichment_schema.json` — machine-readable schema for enrichment submission records
- `ops/dispute_resolution_process.md` — correct path for challenging data from authoritative sources
- `ops/provider_lifecycle.md` — provider status context during enrichment

---

## 1. Submittable Data Types

| Data Type | Feeds Dimension | Score Impact | Verification Method | Verification SLA |
|-----------|----------------|--------------|--------------------|-----------------| 
| Board certification | Step 4 (Credentials) | Direct — updates certification status | ABMS lookup or certificate review | 5 business days |
| Specialty training / fellowships | Step 4 (Credentials) | Informational — adds to profile, no direct score change | Certificate + program verification | 10 business days |
| QI program participation | N/A (future) | None currently — logged for future use | Program confirmation letter | 10 business days |
| Patient satisfaction surveys (Press Ganey, etc.) | Step 5 (Patient Experience) | Supplementary — added alongside public reviews | Survey report verification | 10 business days |
| Telehealth availability | Step 6 (Access) | Direct — updates access dimension | Self-attestation (verified on first patient complaint) | Immediate (self-attested) |
| Office hours / extended hours | Step 6 (Access) | Direct — updates access dimension | Self-attestation | Immediate |
| Languages spoken | Step 6 (Access) | Direct — adds to profile and access scoring | Self-attestation | Immediate |
| New patient wait time | Step 6 (Access) | Direct — updates access dimension | Self-attestation (spot-checked quarterly) | Immediate |
| Practice accreditations (PCMH, etc.) | N/A (future) | None currently — logged for future use | Accreditation body verification | 15 business days |

---

## 2. What CANNOT Be Enriched

Providers cannot override scores derived from CMS data or other authoritative public sources:

- Cannot submit "corrected" Medicare billing data — use the dispute process instead (see `ops/dispute_resolution_process.md`, type `data_error`)
- Cannot override MIPS scores
- Cannot change peer comparison results
- Cannot alter payer diversity/presence data
- Cannot submit clinical outcomes data (that is Step 7, employer claims — not provider-submitted)

**Rule:** If the data comes from a public authoritative source, enrichment is NOT the path to change it. Use the dispute process for data errors. The enrichment process is only for data that is not already collected from an authoritative source.

---

## 3. Submission Workflow

```
Provider submits enrichment
    ↓
Auto-acknowledge (system confirms receipt)
    ↓
Verification (per data type — see §1 for SLAs)
    ↓
    ├── If verified:   Update scores, log to audit trail, notify provider
    ├── If rejected:   Notify provider with reason, log to audit trail
    └── If pending:    Flag record as "provider-reported, verification pending"
```

**Status transitions** (maps to `status` field in `enrichment_schema.json`):

| Status | Description |
|--------|-------------|
| `submitted` | Enrichment received. Not yet reviewed. |
| `pending_verification` | Assigned to reviewer or queued for external lookup. Active verification in progress. |
| `verified` | Confirmed. Score updated if applicable. Provenance updated. |
| `rejected` | Could not verify. No score impact. Provider notified with reason. |
| `expired` | Was previously verified but data is now stale (e.g., board certification expired). Score reverts to pre-enrichment baseline. |

---

## 4. Score Impact Rules

### Self-attested data (telehealth availability, office hours, languages spoken, new patient wait time)

- Score updates **immediately** upon submission
- Data labeled `"provider-reported"` in score provenance
- Spot-checked quarterly against patient complaints and other signals
- False attestation results in: data flagged, score reverted, and potential lifecycle impact per `ops/provider_lifecycle.md`

### Verified data (board certification, specialty training, patient satisfaction surveys)

- Score updates **only after verification is complete**
- While `status = pending_verification`, data is shown in profile as "provider-reported, verification pending" and does not affect the score
- Once verified, data is labeled with the verification date and method in score provenance
- Re-verified annually or on natural expiration (whichever comes first)

### Informational data (specialty training / fellowships, QI participation, practice accreditations)

- Added to provider profile for display purposes
- No direct score change at this time
- Logged and retained for future scoring use when the relevant dimension is built out

---

## 5. Data Lifecycle States

| State | Meaning |
|-------|---------|
| `submitted` | Received, not yet verified. Self-attested types may already be reflected in scores at this stage. |
| `pending_verification` | Assigned to reviewer or external lookup queued. Score not yet updated for verified types. |
| `verified` | Confirmed by verification method. Score updated if the data type has direct or supplementary score impact. |
| `rejected` | Verification failed or could not be completed. No score impact. Provider may resubmit with corrected evidence. |
| `expired` | Previously verified, but now stale (certification lapsed, survey data too old, etc.). Score reverts. System generates `enrichment_submitted` event for the expiration. |

---

## 6. Audit Trail Integration

Every enrichment event generates an audit event in the format defined by `ops/audit_trail_schema.json`. The enrichment record's `audit_event_ids` array holds the UUIDs of all linked audit events.

| Transition | Audit Event Type |
|------------|-----------------|
| Provider submits enrichment | `enrichment_submitted` |
| Verification passes | `enrichment_verified` |
| Verification fails | `enrichment_rejected` |
| Score updates as a result of enrichment | `score_computed` |

The `score_computed` event is only generated when the enrichment results in an actual score change (i.e., direct or supplementary impact data types that pass verification, or self-attested types on submission).

---

## 7. Metrics & Monitoring

Track these as system health indicators monthly:

| Metric | Why It Matters |
|--------|---------------|
| Enrichment submissions per month (by data type) | Volume baseline; spikes may indicate provider education gaps or data pipeline gaps |
| Verification completion time (median, p90 by type) | SLA compliance; identifies slow external verification paths |
| Rejection rate by data type | High rejection rate → submission guidance may be insufficient |
| Self-attestation false positive rate (from quarterly spot checks) | Quality signal for self-attested dimensions |
| Expired enrichment rate | Indicates whether re-verification reminders are working |

**Threshold signals:**
- High rejection rate for a single data type (>20%) → review submission guidance and evidence requirements for that type
- Self-attestation false positive rate >5% on quarterly spot check → tighten spot-check frequency and trigger provider notification review
- High volume of board certification submissions that cannot be verified via ABMS → may indicate ABMS lookup integration issue; escalate to data engineering
