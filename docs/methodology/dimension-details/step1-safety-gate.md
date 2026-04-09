# Step 1: Safety Gate

**Type:** Binary pass/fail — not a scored dimension
**Confidence Tier:** High

*Return to [How Meroka Scores Providers](../quality-scoring-methodology.md)*

---

## What This Dimension Measures

The Safety Gate answers one question: should this provider be in the marketplace at all?

It is not a quality score. It does not contribute to the composite. It is a binary check that runs before any scoring takes place. A provider who fails the Safety Gate is not scored, not listed, and not visible to employers or employees using the platform.

The gate checks for active sanctions, exclusions, and disciplinary actions — situations where a government agency or licensing authority has taken formal action against a provider's ability to practice or participate in federal healthcare programs. These are not performance concerns. They are disqualifying events.

---

## Data Sources

| Source | What It Checks | Refresh Cadence |
|--------|---------------|-----------------|
| OIG LEIE (List of Excluded Individuals/Entities) | Federal exclusion from Medicare, Medicaid, and CHIP participation. Includes fraud convictions, patient abuse findings, license revocations, and DEA actions. | Monthly full download or monthly supplement file |
| State Medical Boards | Active license status, disciplinary actions (suspensions, revocations, probation, reprimands), consent orders, and practice restrictions | Quarterly (varies by state) |
| NPDB (National Practitioner Data Bank) | Malpractice payments, adverse licensure actions, clinical privilege restrictions, DEA actions. Federal database run by HRSA. | Continuous Query enrollment — receives alerts for new reports |
| PECOS (Provider Enrollment, Chain and Ownership System) | Medicare enrollment status and revocations. Used as an informational cross-reference, not a gate input. | Monthly |

**PECOS note:** PECOS revocation is a serious signal, but absence from PECOS is not. Many legitimate providers — concierge practices, cash-pay clinics, commercial-only specialists — do not bill Medicare and are not enrolled. We cross-reference LEIE exclusions against PECOS enrollment as a data integrity check (an excluded provider still showing as enrolled in PECOS is a flag that CMS may not have caught up to OIG), but PECOS status alone does not affect pass/fail.

---

## How the Score Is Calculated

There is no score. The Safety Gate produces a binary output: pass or fail.

**Pass:** No active sanctions, exclusions, or disciplinary actions found across any monitored source. Provider proceeds to scoring.

**Fail:** Any active sanction, active exclusion, or unresolved adverse disciplinary action found in any source. Provider is excluded from the marketplace. No partial credit. No score is generated.

The logic is intentionally simple. A provider with an active OIG exclusion and an excellent patient experience score is still excluded. The gate is not a weighing exercise.

Monitoring is continuous, not one-time. Providers are re-checked against updated source files on each source's refresh cadence. A provider who passes the gate at onboarding is checked again when OIG publishes its monthly supplement, when state board data is refreshed, and when NPDB continuous query generates an alert.

---

## What This Catches

- Providers currently excluded from Medicare and Medicaid participation (OIG LEIE)
- Providers with active license suspensions or revocations at the state level
- Providers with malpractice payment history or adverse clinical privilege actions (NPDB)
- Providers whose Medicare enrollment has been formally revoked by CMS

---

## Known Limitations

**State board coverage is uneven.** There is no single national database of state disciplinary actions. Approximately 15 states provide bulk downloads or clean APIs. Another 20 states offer individual lookup pages that can be queried at scale. The remaining 15 states publish PDF-only records or require manual lookup. In practice, this means state board coverage is strong in major states and weaker in others. The long-term path to consistent national coverage is the FSMB Physician Data Center (a paid enterprise contract aggregating all 70+ medical and osteopathic boards), which is not yet in place.

**NPDB access requires registration.** The National Practitioner Data Bank is not public. Access requires registration as a querying entity under federal statute. Eligible categories include hospitals, health plans, and credentialing organizations. Meroka is working toward establishing a registration pathway, but until that is in place, the NPDB check has limited coverage. A credentialing verification organization (CVO) partnership is an alternative path: CVOs are already registered NPDB entities and can query on behalf of clients.

**Refresh cadence creates a window of exposure.** State board actions taken between quarterly refreshes will not appear in our data until the next pull. OIG exclusions added between monthly updates will not appear until the following month. The Hecht v. Cigna settlement ($5.7M) established that stale provider data creates real legal and financial exposure for entities relying on it. We document refresh cadences in our data pipeline and apply a data-age flag when a source has not been refreshed within its expected window.

**NPDB captures only reported actions.** The NPDB is only as good as its inputs. Malpractice settlements are reportable above $10,000 but not all settlements are properly reported. Hospital-based adverse privilege actions are reportable, but adverse actions in non-hospital settings (outpatient surgery centers, office practices) may not be captured.

---

## Confidence Tier

**High.** The Safety Gate is binary — a provider either has an active sanction or does not. The data sources are authoritative (federal agencies and state licensing boards), not inferred or estimated. False positives are possible due to name/NPI matching errors and are addressed through a manual review process before a provider is listed as failed. False negatives are possible due to refresh cadence gaps and incomplete NPDB coverage, which is why we document known gaps explicitly.
