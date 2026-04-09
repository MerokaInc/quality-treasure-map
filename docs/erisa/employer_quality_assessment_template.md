# Quality Assessment Report

**Employer:** {employer_name}
**Assessment Date:** {date}
**Network:** {network_name} ({provider_count} providers)
**Methodology Version:** {version}

---

## Executive Summary

Meroka conducted a structured quality assessment of {provider_count} providers in your network using {dimension_count} evaluation dimensions. {summary_stats}.

This report documents the evidence base supporting your network selection decision and maps each dimension to the applicable ERISA prudence element. It is intended for use by the plan fiduciary and ERISA counsel in demonstrating a prudent process for network oversight.

---

## Assessment Methodology

Full methodology: `docs/methodology/quality-scoring-methodology.md`

Assessment uses publicly available federal data sources including CMS, OIG, and NPPES. No proprietary claims data is required. Scoring dimensions and weights are versioned; this report reflects methodology version {version}.

**Primary confidence tier:** {primary_tier}

Where government quality data (MIPS) is available, it is used and carries High confidence. For the majority of providers where MIPS data is not available, the assessment relies on Tier 2 utilization proxy data. See `docs/methodology/what-we-cant-measure.md` for documented limitations.

---

## Network Quality Summary

| Metric | Value |
|---|---|
| Providers passing safety gate | {pass_count} / {total} |
| Providers failing safety gate (excluded from network) | {fail_count} / {total} |
| Average composite score | {avg_score} |
| Providers with government quality data (MIPS) | {mips_count} |
| Providers scored via Tier 2 proxy only | {tier2_count} |
| Specialties covered | {specialty_list} |
| Assessment date | {date} |
| Data freshness (oldest source) | {oldest_source_date} |

---

## Provider-Level Assessment

| NPI | Provider Name | Specialty | Safety Gate | Composite Score | Confidence | Flags |
|---|---|---|---|---|---|---|
| [One row per provider in the network] | | | | | | |

**Safety Gate values:** Pass / Fail
**Confidence values:** High / Moderate (Tier 2) / Low
**Flags:** Any material issues identified during assessment (e.g., score below threshold, single-source data, credential verification pending)

---

## ERISA Prudence Mapping

| Prudence Element | Evidence Provided | Dimensions Used | Assessment |
|---|---|---|---|
| Qualifications | Safety gate pass + credential verification | Steps 1, 4 | {assessment} |
| Quality of Services | Multi-dimensional scoring | Steps 2, 3, 5 | {assessment} |
| Reasonableness of Fees | Billing quality + peer charge comparison | Step 3 | {assessment} |

**Assessment values:**
- **Supported** — Direct evidence available for this element from government or verified sources
- **Supported (proxy)** — Indirect evidence available; limitations documented
- **Partial** — Evidence available for some providers in the network; gaps documented
- **Not available** — Insufficient data to assess this element for the network

---

## Limitations & Caveats

{auto-populated from docs/methodology/what-we-cant-measure.md}

Standard limitations applicable to all assessments:

- MIPS data is available for approximately 3% of providers (those billing above the threshold in eligible specialties). The majority of providers in any network will be scored using Tier 2 utilization proxy data.
- Step 4 (Credentials) relies on NPPES self-attestation until ABMS verification is live. Board certification claims are not independently verified against primary source data in the current version.
- Patient experience data (Step 5) is sourced from public review platforms and may not be representative of all patients. Low review counts reduce reliability.
- Access and availability data (Step 6) is self-reported by providers and is not independently verified.
- This assessment reflects a point-in-time snapshot. Provider status can change between assessments. See the Monitoring Evidence Report for ongoing tracking.

---

## Data Sources & Freshness

| Source | Last Updated | Next Expected |
|---|---|---|
| [Populated from ops/source_registry.json at report generation time] | | |

Freshness targets per source are defined in `ops/data_refresh_pipeline.md`. If any source has exceeded its staleness threshold, it will be flagged in this table.
