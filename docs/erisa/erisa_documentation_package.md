# ERISA Documentation Package

## 1. Purpose

Self-insured employers are fiduciaries under ERISA. The Consolidated Appropriations Act of 2021 (CAA 2021) raised the bar, requiring employers to demonstrate they made prudent, documented decisions about the provider networks they offer to plan participants.

Recent enforcement actions have made this obligation concrete. Lawsuits including Johnson & Johnson, Wells Fargo, and Hecht v. Cigna have established that fiduciary liability extends to network quality and cost decisions. Employers can no longer rely on delegation to a health plan administrator as a complete defense.

This package gives self-insured employers the artifacts they need to demonstrate they ran a structured, documented quality assessment before directing employees to providers on the Meroka marketplace. It links each ERISA prudence element to specific scoring dimensions, data sources, and confidence levels.

---

## 2. The Three Elements of Prudence

ERISA's duty of prudence (29 U.S.C. § 1104) requires fiduciaries to act as a prudent expert would under similar circumstances. For network selection, courts and regulators have interpreted this to require assessment of three elements:

### Qualifications
Are providers qualified to deliver care?

Employers must verify that providers in the network hold appropriate credentials, are not excluded from federal programs, and are in good standing with state licensing authorities.

Maps to:
- Step 1 (Safety Gate) — federal exclusion screening, state board verification
- Step 4 (Credentials) — board certification, specialty validation

### Quality of Services
Is the care good?

Employers must assess whether providers deliver care that meets recognized quality standards. Where government data exists, it should be used. Where it does not, reasonable proxy measures with documented limitations are acceptable.

Maps to:
- Step 2 (MIPS) — government quality assessment where available
- Step 3 (Practice Patterns) — peer comparison, guideline adherence, billing quality
- Step 5 (Patient Experience) — patient ratings and reviews

### Reasonableness of Fees
Are costs appropriate?

Employers must assess whether the costs associated with network providers are reasonable relative to peers. This includes both charge patterns and overall cost efficiency.

Maps to:
- Step 3 (Billing Quality sub-dimension) — charge ratios, E/M distribution, peer benchmarks
- F3 (Contract & Pricing) — contracted rates, unit cost analysis

---

## 3. Dimension-to-Prudence Mapping

| ERISA Element | Meroka Dimension | Evidence Type | Confidence |
|---|---|---|---|
| Qualifications | Step 1: Safety Gate | Federal exclusion check, state board verification | High |
| Qualifications | Step 4: Credentials | Board certification, specialty validation | High (when ABMS live) |
| Quality of Services | Step 2: MIPS | Government quality assessment (where available) | High for ~3% of providers, N/A for ~88% |
| Quality of Services | Step 3: Practice Patterns | Peer comparison, guideline adherence, billing quality | Moderate (Tier 2 proxy) |
| Quality of Services | Step 5: Patient Experience | Patient ratings and reviews | Moderate |
| Reasonableness of Fees | Step 3: Billing Quality | Charge ratios, E/M distribution, peer benchmarks | Moderate |
| Access | Step 6: Access & Availability | Office hours, wait times, telehealth | Low (self-reported) |

**Confidence Tier Definitions:**
- **High** — Based on government-verified data with direct quality relevance
- **Moderate (Tier 2)** — Utilization proxy data with documented limitations; reasonable basis for decision-making
- **Low** — Self-reported or minimally verified data; useful for access planning, not quality determination

---

## 4. Package Contents

For each employer, the ERISA documentation package includes the following components:

### 4.1 Quality Assessment Report
Generated per the `employer_quality_assessment_template.md` template. Covers:
- Network-level quality summary
- Provider-level assessment table with scores and flags
- Explicit mapping of evidence to ERISA prudence elements
- Limitations and caveats drawn from methodology documentation

### 4.2 Methodology Description
Links to `docs/methodology/` for the full technical specification. Relevant documents:
- `quality-scoring-methodology.md` — overall scoring approach
- `what-we-cant-measure.md` — documented gaps and limitations

This documentation supports the employer's ability to explain and defend the process used, not just the outcome.

### 4.3 Monitoring Evidence Report
Generated per the `monitoring_evidence_template.md` template. Covers:
- Data refresh activity during the reporting period
- Provider status changes (additions, removals, flags)
- Score changes exceeding material thresholds
- Anomalies detected and resolved
- Disputes filed and resolved

Ongoing monitoring is required for ERISA compliance. A single point-in-time assessment is not sufficient.

### 4.4 Audit Trail Excerpts
Machine-readable event logs for network providers, drawn from the audit trail system defined in `ops/audit_trail_schema.json`. Provides an immutable record of all scoring events, data pulls, and status changes for providers in the employer's network.

---

## 5. Generation Cadence

| Trigger | Package Type | Scope |
|---|---|---|
| Employer selects network | Initial Quality Assessment Report | All network providers |
| Quarterly data refresh | Updated Quality Assessment Report + Monitoring Evidence Report | All network providers |
| Material change — provider removed | Ad hoc Quality Assessment Report update | Affected provider(s) |
| Material change — methodology updated | Full Quality Assessment Report reissue | All network providers |
| Employer request | Any component on demand | As specified |

**Material change** is defined as any event that would cause a reasonable employer to reconsider a network inclusion decision. This includes:
- A provider failing the safety gate after previously passing
- A composite score drop of 15 or more points
- A methodology change affecting the dimensions used for ERISA mapping

---

## 6. Legal Disclaimers

- Meroka provides quality evidence to support employer decision-making. The employer retains fiduciary responsibility for network selection and cannot delegate that responsibility to Meroka.
- Scores for the majority of providers are Tier 2 confidence (utilization proxy data) unless otherwise noted. The employer should treat these as a reasonable basis for decision-making, not as a definitive quality determination.
- Step 4 (Credentials) confidence is listed as High only when the ABMS verification integration is live. Until then, credential data is sourced from NPPES self-attestation and carries Moderate confidence.
- This package does not constitute legal advice. Employers should consult ERISA counsel regarding their specific fiduciary obligations.
- Data freshness dates are included in each report. Employers should not rely on reports more than one quarter old without requesting a refresh.
