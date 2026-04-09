# How Meroka Scores Providers

**Methodology Version:** 1.0.0
**Last Updated:** 2026-04-09
**Audience:** Employers, HR directors, practice managers, and providers who want to understand how scores are produced.

---

## Our Approach

Meroka evaluates providers across multiple dimensions using publicly available federal data, verified credentials, patient feedback, and practice-reported information. No single dimension defines quality. A provider with no Medicare billing history is not a poor-quality provider — they may serve a commercially insured population and leave no federal data footprint at all. Our system is designed to reflect what the evidence actually supports, not manufacture confidence where data is absent.

Where data exists, we use it and tell you how reliable it is. Where data is absent, we say so plainly. We never penalize a provider for an absence of data. Scores with limited supporting evidence are flagged with lower confidence and the missing dimension's weight is redistributed to the dimensions we can measure.

---

## The Dimensions

| Dimension | What It Measures | Data Source | Confidence |
|-----------|-----------------|-------------|------------|
| Safety Gate | Active sanctions, exclusions, and disciplinary actions | OIG LEIE, state medical boards, NPDB | High — binary check against authoritative federal and state sources |
| Government Quality (MIPS) | Federal quality program scores where available | CMS QPP/MIPS, CMS Facility Affiliations, hospital quality datasets | High when present. Available for approximately 3% of providers. |
| Practice Pattern Analysis | Billing patterns, procedure volumes, and peer comparison | CMS Medicare Physician & Other Practitioners, CMS Medicaid Provider Spending (T-MSIS), NPPES | Moderate — utilization proxy, not direct clinical quality |
| Credentials & Training | Board certification and specialty validation | NPPES, ABMS | High — verified credentials from authoritative registries |
| Patient Experience | Patient ratings and reviews | Google, Healthgrades | Moderate — signal quality varies with review volume |
| Access & Availability | Office hours, wait times, telehealth | Practice-reported | Low — self-reported, unverified |

**Notes on naming:** "Practice Pattern Analysis" is what some quality frameworks call "Utilization & Bundle Profiling" or "Guideline Concordance." We use the more descriptive name because we want employers and providers to understand what we actually measure: billing patterns and practice behavior inferred from claims data. These are proxies for quality, not direct measures.

---

## What Confidence Tiers Mean

Not all data is equally reliable. We apply three confidence tiers to communicate how much weight a score should carry.

| Tier | Label | What It Means | Examples |
|------|-------|---------------|---------|
| Tier 1 | Direct evidence | Score comes from authoritative, independently verified data with a direct relationship to the quality dimension being measured | MIPS final score from CMS, OIG exclusion status, ABMS board certification |
| Tier 2 | Proxy evidence | Score is inferred from related data that correlates with the quality dimension but does not measure it directly | Billing patterns, procedure volumes, hospital affiliation quality, peer comparison |
| Tier 3 | Self-reported | Information provided by the practice itself, unverified by a third party | Office hours, telehealth availability, wait times |

**The honest version:** Most current Meroka scoring is Tier 2. We have reliable binary checks (Tier 1) for safety and credentials. We have strong government-assessed quality data (Tier 1) for the roughly 3% of providers in the Medicare fee-for-service MIPS program. For the majority of providers, the signal comes from billing pattern analysis — which is useful but should be interpreted as an informed proxy, not a clinical quality assessment.

---

## How the Composite Score Works

The composite score combines multiple dimensions into a single 0-100 score. The current default weighting distributes equally across the five scored dimensions (Steps 2 through 6), each at 20%.

**Weight redistribution:** When a dimension has no data for a given provider, its weight does not disappear — it redistributes proportionally to the dimensions where data exists. A provider with no MIPS score and no patient reviews is not penalized; the composite draws more heavily on the dimensions that can be measured.

**Specialty adjustments:** Peer comparisons in Practice Pattern Analysis are made against specialty-specific cohorts at the state level. A family physician's billing patterns are not compared against a cardiologist's. This means a provider's composite score reflects performance relative to their professional peer group, not some universal standard.

**Safety Gate:** The Safety Gate (Step 1) is not scored. It is a binary pass/fail. A provider who fails the Safety Gate does not receive a composite score and is not listed in the marketplace. The gate runs continuously, not just at onboarding.

---

## What We Can't Measure

Some of the most important aspects of clinical quality are not visible in the data sources we currently use. We document these limitations in detail so you can calibrate how much weight to place on our scores.

[Read the full limitations disclosure: What We Can't Measure](./what-we-cant-measure.md)

---

## Dimension Detail Pages

Each dimension has a dedicated page with data sources, scoring logic, known limitations, and confidence tier assignment.

- [Step 1: Safety Gate](./dimension-details/step1-safety-gate.md)
- [Step 2: Government Quality (MIPS)](./dimension-details/step2-government-quality.md)
- [Step 3: Practice Pattern Analysis](./dimension-details/step3-utilization.md)

---

## Methodology Version History

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-09 | Initial methodology |
