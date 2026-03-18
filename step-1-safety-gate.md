# Step 1: Safety Gate

> **Binary output per NPI. Pass = proceed to scoring. Fail = excluded from marketplace.**

What it answers: should this provider be in the marketplace at all?

---

## Immediate next steps

1. **OIG LEIE** - free bulk download, no blockers. Pull the file, match against a sample NPI list, confirm pass/fail logic works end-to-end. PECOS is loaded as informational context (Medicare enrollment status) but does not affect the gate decision.
2. **State boards** - pull WV and MA board data directly. In parallel, test FSMB Physician Data Center against the same two states to compare coverage and quality.

NPDB is out of scope for this sprint.

---

## Business logic

- Query each NPI against NPDB, state medical boards, and the OIG LEIE exclusion list
- If any of those returns an active sanction, unresolved adverse action, or exclusion, the provider fails the gate
- PECOS enrollment is checked as informational context (tells us who bills Medicare) but does not affect pass/fail. Many good independent practices don't bill Medicare.
- This is not a score. It's a binary check. No weighting, no partial credit
- A provider who fails the gate does not receive a composite quality score and is not listed
- Refresh cadence matters. Hecht v. Cigna settled for $5.7M because provider data went stale. We need a monitoring interval, not just a one-time check

---

## Data sources

### 1. NPDB (National Practitioner Data Bank)

**What it is:** Federal database run by HRSA. The government's central repository for adverse actions against healthcare providers.

**What gets reported:**
- Malpractice payments - any settlement or judgment paid on behalf of a provider
- Adverse licensure actions - state boards revoking, suspending, or restricting a license
- Clinical privilege actions - hospitals restricting or removing a provider's hospital privileges
- DEA actions - controlled substance violations
- Medicare/Medicaid exclusions (though OIG/LEIE is the primary source for those)

**Why it matters:** Only place where malpractice settlements are aggregated nationally. A provider could have paid out multiple claims across different states and nothing would show on any single state board. NPDB captures it all.

**Access:**
- Not public. Must be a registered "querying entity"
- Eligible categories include hospitals, health plans, licensing boards, and credentialing organizations
- Continuous Query: enroll a provider's NPI for 12 months at $2.50. Get the initial query result immediately, then receive automatic alerts for any new reports filed during the year. This is the monitoring mechanism that satisfies our refresh obligation.

**Out of scope for this sprint.** NPDB access requires resolving a registration question that could take weeks to months. Will revisit in a future sprint.

**Access paths (future sprint):**

| Path | Notes | Cost | Timeline |
|------|-------|------|----------|
| CVO (Verisys, Aperture, symplr, CAQH) | Already registered NPDB entities. Query on our behalf, no registration required from Meroka | $1-5/NPI | Fast once contracted |
| Direct registration as health plan | Requires Clara to evaluate whether Meroka fits the statutory definition (42 U.S.C. § 11151), specifically the "panel of providers" / PPO-adjacent language once we have employer contracts | Free per query | Weeks to months |
| Partner with employer/TPA | Self-insured employers qualify as health plans and can run queries on our behalf | Depends on contract | Depends on deal flow |

---

### 2. OIG LEIE (List of Excluded Individuals/Entities)

**What it is:** The OIG's master list of every individual or entity excluded from participating in federal healthcare programs (Medicare, Medicaid, CHIP, etc.).

**Why excluded:** Fraud convictions, patient abuse, license revocation, default on health education loans, and others. Some are mandatory (conviction = automatic), some are permissive (OIG discretion).

**Why it matters:** If a provider is on this list, any entity that pays them for federally reimbursable services faces civil monetary penalties. An employer directing employees to an excluded provider has real legal exposure.

**Access:** Completely public and free.
- Full database CSV download at `exclusions.oig.hhs.gov`
- Monthly supplement file for new additions/updates only
- NPI included for most records; name + address for older records

**Refresh:** Monthly full download or monthly supplement.

---

### 3. PECOS (Provider Enrollment, Chain and Ownership System) — evaluated, not used as a gate input

**What it is:** CMS's enrollment system for providers who bill Medicare.

**What it tells us:**
- Whether a provider is actively enrolled in Medicare
- Specialty and taxonomy code
- Practice location and group affiliations
- Enrollment status: active, inactive, deactivated, revoked

**Why we evaluated it for the gate:** PECOS revocation is a serious signal. CMS revokes enrollment for felony convictions, license loss, exclusion, or billing abuse. Different from OIG exclusion but often overlapping. We initially considered it as a gate input.

**Why we removed it from the gate:** Absence from PECOS does not indicate a problem. Many legitimate independent practices don't bill Medicare: concierge, cash-pay, commercial-only. Failing providers on PECOS absence would knock out the exact providers Meroka is trying to serve. The public PECOS extract also only contains currently enrolled providers, so we can't distinguish "never enrolled" from "was enrolled, got revoked" without historical snapshots or the separate CMS revocation files.

**What we kept it for:**
- **Informational context in Step 1:** We flag `pecos_enrolled` as a data point for eng but it does not affect pass/fail. We also cross-reference LEIE exclusions against PECOS enrollment as a data integrity check (an excluded provider still showing as enrolled suggests CMS hasn't caught up to OIG).
- **Step 2 (Credentials):** PECOS is a legitimate input for specialty validation, enrollment history, and practice affiliations.
- **Step 5b (Bundles):** Medicare billing patterns from PECOS cross-referenced with utilization data.

**Access:** CMS publishes a public extract called the **Medicare Fee-for-Service Public Provider Enrollment** file on data.cms.gov. Free bulk download, updated monthly. No registration required.

---

### 4. State Medical Boards

**What they track:**
- Active license status (valid, expired, lapsed)
- Disciplinary actions (suspensions, revocations, probation, reprimands)
- Consent orders and settlements
- Practice restrictions
- Reinstatements

**The access problem:** No single national database. Each of the 50 states runs its own board with its own infrastructure.

| Tier | States | What's available |
|------|--------|-----------------|
| Good | ~15 states | Bulk download or clean API (CA, TX, NY) |
| Okay | ~20 states | Individual lookup pages, scrapeable |
| Bad | ~15 states | PDF-only, manual lookup only |

No standardized format. Many boards use license number rather than NPI, requiring a crosswalk.

**The practical solution: FSMB (Federation of State Medical Boards)**

- **DocInfo.org** - free public lookup, one physician at a time. Not useful at scale.
- **FSMB Physician Data Center** - bulk/API access aggregating data from all 70+ medical and osteopathic boards in the US. License status, disciplinary history, board certifications. This is what hospitals and health plans use. Paid enterprise contract.

**This sprint:** Test two approaches in parallel.

1. **West Virginia + Massachusetts direct** - pull from each state board directly for these two states. Proves the per-state logic and gives us a working baseline.
2. **FSMB Physician Data Center** - test FSMB's feed against the same two states to validate coverage and data quality. If it matches, FSMB becomes the production path for national expansion.

**Access paths:**

| Path | Coverage | Cost | Speed |
|------|----------|------|-------|
| WV + MA direct (this sprint) | 2 states | Low | Immediate |
| FSMB Physician Data Center (test this sprint) | All 50 states, one feed | Enterprise contract | Fastest to full national coverage |
| State-by-state scraping | Varies, patchy | Engineering time | Slow, fragile |

