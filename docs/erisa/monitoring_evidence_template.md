# Monitoring Evidence Report

**Employer:** {employer_name}
**Reporting Period:** {start_date} to {end_date}
**Network:** {network_name}

---

## Monitoring Summary

Meroka continuously monitors provider quality on a defined cadence. This report documents monitoring activities during the reporting period and provides the evidence base required for ongoing ERISA fiduciary compliance.

Ongoing monitoring is a distinct obligation from initial network assessment. This report demonstrates that the employer's network was actively overseen during the period, not merely assessed at inception.

---

## Data Refresh Activity

| Source | Refreshes This Period | Status | Last Pull |
|---|---|---|---|
| [Populated from audit trail: data_refresh events for this period] | | | |

Refresh cadences per source are defined in `ops/data_refresh_pipeline.md`. Any source that missed its scheduled refresh will be noted with status "Delayed" and an explanation.

---

## Provider Status Changes

| NPI | Provider | Change | Date | Reason |
|---|---|---|---|---|
| [Populated from audit trail: provider_status_changed events during period] | | | | |

**Change types:**
- **Added** — Provider joined network
- **Removed** — Provider left network or was removed due to quality flag
- **Safety gate fail** — Provider failed exclusion check during period
- **Reinstated** — Provider previously flagged was cleared and returned to active status
- **Flagged** — Provider flagged for review; pending resolution

---

## Score Changes

| NPI | Provider | Dimension | Previous | Current | Change | Attribution |
|---|---|---|---|---|---|---|
| [Populated from longitudinal tracking: changes >5 points during period] | | | | | | |

Score changes of 5 points or more are reported. Changes of 15 points or more are flagged as material and may trigger an ad hoc Quality Assessment Report update per the generation cadence defined in `docs/erisa/erisa_documentation_package.md`.

**Attribution values:** Data refresh / Methodology update / Source correction / Dispute resolution

---

## Anomalies Detected & Resolved

| Date | Type | Severity | Resolution |
|---|---|---|---|
| [Populated from anomaly records during period] | | | |

**Severity values:** High / Medium / Low
**Resolution values:** Corrected / Accepted / Escalated / Pending

Unresolved anomalies at the end of the reporting period are carried forward to the next report.

---

## Disputes Filed & Resolved

| NPI | Type | Filed | Resolved | Outcome |
|---|---|---|---|---|
| [Populated from dispute records during period] | | | | |

**Type values:** Score dispute / Data error / Credential correction / Safety gate appeal
**Outcome values:** Upheld / Reversed / Partially reversed / Withdrawn / Pending

---

## Network Quality Trend

| Metric | Start of Period | End of Period | Change |
|---|---|---|---|
| Average composite score | {start_avg} | {end_avg} | {delta} |
| Providers flagged | {start_flagged} | {end_flagged} | {delta} |
| Providers removed | {removed_count} | — | — |
| Providers added | {added_count} | — | — |
| Providers with MIPS data | {start_mips} | {end_mips} | {delta} |

---

## Certification

This report was generated on {generated_at} from Meroka's quality system audit trail. All events are immutably logged per the audit trail specification defined in `ops/audit_trail_schema.json`. The underlying event records are available for inspection upon request.

This report is provided to support the employer's ERISA fiduciary documentation requirements. The employer retains responsibility for reviewing this report and taking appropriate action on any material changes identified.
