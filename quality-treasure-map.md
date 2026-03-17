# Quality Workstream Treasure Map
## 30-60-90 Day Sprint | March 2026

---

## Summary

We're building a marketplace where employers direct contract with independent practices. For that to work, employers need confidence the providers meet a quality bar, legally and commercially. This doc sequences how we build that.

### Seven steps, in order

| Step | Dimension | What it does | Weight |
|------|-----------|-------------|--------|
| 1 | Safety gate | Binary pass/fail per NPI using NPDB, state boards, PECOS exclusion data. Fail = out | Gate |
| 2 | Credentials & training | Board cert, med school, years in practice from NPPES, ABMS, PECOS | 25% |
| 3 | Patient experience | Normalised review scores from Google, Healthgrades, Doximity | 25% |
| 4 | Access & availability | Practice-reported onboarding fields (hours, wait times, telehealth, languages) | 15% |
| 5 | Clinical quality (MIPS) | QPP scores where available, three-situation logic for present/absent/low | 20% |
| 5b | CMS utilization & bundles | Medicare + Medicaid procedure-level data mapped to clinical bundles per specialty | 15% |
| 6 | Clinical outcomes | Claims-based metrics from employer data. Phase 2, not required for initial bar | Phase 2 |

### Timeline

| Window | Deliverables |
|--------|-------------|
| 30 days (mid-April) | Steps 1-4 as notebooks to eng. Clara delivers ERISA methodology |
| 60 days (mid-May) | Steps 5 + 5b delivered. Bundle taxonomy defined. Composite score v1. Eng productionises all dimensions. API endpoint live |
| 90 days (mid-June) | Clinical outcomes schema designed. Safety gate monitoring automated. Score validation complete. Slack agent live |

Clara's parallel workstream defines what quality evidence satisfies ERISA fiduciary duty, documents the methodology for the employer-facing product, and identifies legal thresholds that gate marketplace inclusion.

Each dimension hands off to eng as a separate notebook with data sources, business logic, and expected NPI-level output. Eng productionises incrementally into a relational DB behind an API endpoint.

---

## 1. Where we are

We shipped the first quality treasure map in a 60-day sprint. It defined the problem, the ERISA context, and the six dimensions we score providers on. That work gave us the framework. This doc picks up where it left off and sequences the actual build.

The goal hasn't changed: create a pricing and market mechanism where an employer pays less for better care, while a practice earns more. Quality scoring is how we prove the providers on our marketplace meet a defensible bar, legally and commercially.

What follows is the workstream broken into concrete steps, with data sources, business logic, timelines, and how each piece hands off to engineering.

---

## 2. The workstream

Seven steps. Ordered by dependency and priority. Steps 1-4 are the 30-day target. Steps 5 and 5b follow at 60 days. Step 6 is Phase 2.

---

### Step 1. Safety gate

> **Binary output per NPI. Pass = proceed to scoring. Fail = excluded from marketplace.**

What it answers: should this provider be in the marketplace at all?

**Business logic:**
- Query each NPI against NPDB, state medical board records, and the PECOS/OIG exclusion list
- If any of the three returns an active sanction, unresolved adverse action, or exclusion, the provider fails the gate
- This is not a score. It's a binary check. No weighting, no partial credit
- A provider who fails the gate does not receive a composite quality score and is not listed
- Refresh cadence matters. Hecht v. Cigna settled for $5.7M because provider data went stale. We need a monitoring interval, not just a one-time check

**Data sources:**

| Source | What it gives us | Access | Refresh |
|--------|-----------------|--------|---------|
| NPDB | Malpractice payments, adverse actions | NPDB query (requires registration as eligible entity). Continuous query enrollment available | Continuous |
| State medical boards | License status, disciplinary actions, suspensions | State-by-state APIs or scraping (varies widely) | Quarterly min |
| PECOS / OIG exclusion list | CMS exclusions from Medicare billing | CMS bulk download (LEIE + PECOS) | Monthly |

**Eng handoff:** Notebook with NPI-level pass/fail output, source documentation, and refresh logic.

---

### Step 2. Credentials and training

> **Structured fields per NPI. Weight: 25% of composite score.**

What it answers: is this provider qualified to practice in their claimed specialty?

**Business logic:**
- Pull board certification status, medical school, residency program, and years in practice for each NPI
- Board certification from ABMS is the primary signal. Active cert = full credit. Expired or never certified = flag, not automatic zero (some specialties have low cert rates)
- NPPES gives us taxonomy code, practice address, and enrollment date as validation
- PECOS cross-reference confirms Medicare enrollment status and specialty alignment
- Years in practice is a context variable, not a quality signal. We include it for employer transparency, not scoring

**ERISA value:** Highest legal weight under the duty of prudence. Employers must show they verified qualifications.

**Data sources:**

| Source | What it gives us | Access | Refresh |
|--------|-----------------|--------|---------|
| NPPES | NPI, taxonomy, practice address, enrollment date | CMS bulk download | Weekly |
| ABMS | Board certification status, specialty, expiration | ABMS API or verification service | Annual cert cycle |
| PECOS | Medicare enrollment, specialty, practice affiliations | CMS bulk download | Monthly |

**Eng handoff:** Notebook with NPI-level credential fields, ABMS cert status flag, and specialty validation logic.

---

### Step 3. Patient experience

> **Normalised composite from Google, Healthgrades, Doximity. Weight: 25% of composite score.**

What it answers: what do patients actually say about this provider?

**Business logic:**
- Pull star ratings and review counts from Google, Healthgrades, and Doximity for each NPI
- Normalise across platforms to a common 0-100 scale. Google uses 1-5 stars, Healthgrades uses a different scale, Doximity has its own
- Review volume is a confidence signal, not a score input. A provider with 3 reviews at 4.8 stars is less reliable than one with 200 reviews at 4.3. We apply a minimum review threshold before weighting
- Sentiment categories we care about: bedside manner, wait times, communication, follow-up. If platforms expose these, we use them. If not, aggregate star rating is the fallback
- Absence of reviews is not a penalty. Many indie practices have thin online footprints. Null = redistribute weight to other dimensions

**ERISA value:** Demonstrates due diligence beyond credentials. Shows employers assessed patient-reported quality, not just paper qualifications.

**Data sources:**

| Source | What it gives us | Access | Refresh |
|--------|-----------------|--------|---------|
| Google Maps / Places API | Star rating, review count, review text snippets | API (usage limits apply) | Real-time |
| Healthgrades | Overall rating, patient satisfaction scores, review count | Scraping or data partnership | Quarterly |
| Doximity | Peer reputation, patient reviews where available | Doximity API or partnership | Quarterly |
| RateMDs | Supplementary patient ratings and review volume | Scraping | As needed |

**Eng handoff:** Notebook with NPI-level normalised score (0-100), confidence flag based on review volume, and platform-level raw values.

---

### Step 4. Access and availability

> **Structured onboarding form fields. Defined schema for pipeline. Weight: 15% of composite score.**

What it answers: can patients actually get to this provider and get seen?

**Business logic:**
- This dimension is practice-reported, not pulled from public data. We define the schema, practices fill it in during onboarding
- Scoring: telehealth = bonus, short wait times = bonus, extended hours = bonus. Additive signals, not pass/fail
- This is the dimension employers care most about for utilisation. If they're directing employees to a provider, they need to know that provider can actually see them in a reasonable timeframe
- Self-reported data has an obvious trust problem. Phase 2 validates against claims and appointment data. For now, the schema is the deliverable

**ERISA value:** Drives utilisation, which is the employer's proxy for value. Showing you assessed access, not just credentials, strengthens the fiduciary argument.

**Onboarding fields:**

| Field | Type | Scoring |
|-------|------|---------|
| Office hours | Structured: day + open/close times | Flag extended hours as bonus |
| New patient wait time | Integer (days) | < 14 days = good, < 7 = great |
| Telehealth | Boolean | Additive bonus |
| Languages spoken | Array of strings | Enriches access for diverse populations |
| Accepting new patients | Boolean | If no, flag for employer visibility |
| Wheelchair accessible | Boolean | ADA compliance signal |

**Eng handoff:** Schema definition (JSON schema), sample onboarding form output, and scoring rubric for each field.

---

### Step 5. Clinical quality (MIPS)

> **QPP score + threshold flag per NPI. Three-situation logic. Weight: 20% of composite score.**

What it answers: has the government independently assessed this provider's clinical quality?

**Business logic (three situations):**

| Situation | Action | Rationale |
|-----------|--------|-----------|
| Score present and strong | Weight at 20% | Only place where a federal agency independently evaluated this provider's quality. Strong evidentiary claim |
| No score (below low-volume threshold) | Null out, redistribute weight | Below ~200 Medicare patients or ~$90k billed. Size signal, not quality signal. Not a penalty |
| Score present but low | Cross-reference credentials and patient reviews before penalising | Low MIPS + clean record + good reviews = likely admin burden. Low MIPS + sanctions + bad reviews = real flag |

**Structural ceiling:** All CMS data is Medicare fee-for-service. A physician whose patients are commercially insured will look thin in CMS data because of who they treat, not how well they treat them. We can't engineer around this, but we can be transparent about it.

**Data sources:**

| Source | What it gives us | Access | Refresh |
|--------|-----------------|--------|---------|
| CMS QPP / Provider Data Catalog | MIPS final score, category scores, low-volume flag | CMS bulk download | Annual (with lag) |
| CMS Care Compare | QPP scores, telehealth flags, facility affiliations, procedure volume | CMS API or bulk download | Quarterly |
| Part B claims (supplementary) | Billing volume, specialty consistency, practice activity | CMS bulk download | Annual |

**Eng handoff:** Notebook with NPI-level QPP score, threshold flag (above/below low-volume), and the three-situation decision logic as documented rules.

---

### Step 5b. CMS utilization & bundle scoring

> **Per-CPT procedure volume, cost patterns, and clinical bundle mapping per NPI. Weight: 15% of composite score.**

What it answers: what does this provider actually do, how much of it, and are there cost or volume red flags at the bundle level?

**Business logic:**
- Pull per-NPI procedure-level data from Medicare Provider Utilization files and Medicaid Provider Spending (T-MSIS): CPT/HCPCS codes billed, service counts, average charges, beneficiary counts
- Map CPT codes to clinical bundles by specialty (e.g., OB/GYN: maternity CPTs to Maternity bundle, surgical CPTs to GYN Surgery, screening CPTs to Preventive)
- This is what enables bundle-level scoring with public data. Instead of one flat composite per NPI, you can slice the score by clinical service line
- Cost pattern flags: compare provider utilization against specialty peers. Lab over-ordering, unusual billing concentration, outlier charge ratios. These are cost signals for employers, not quality penalties
- Procedure volume is a confidence signal per bundle. High volume in a bundle = reliable score. Low volume = flag for transparency, not a penalty
- Combining Medicare + Medicaid gives a much fuller picture, especially for specialties with heavy Medicaid populations (OB/GYN, pediatrics, primary care)

**Structural caveat:** Both datasets are still government-payer only. Providers whose patients are mostly commercially insured will still look thin. We can't engineer around this, but we can be transparent about it.

**Data sources:**

| Source | What it gives us | Access | Refresh |
|--------|-----------------|--------|---------|
| Medicare Physician & Other Practitioners | Per-NPI, per-HCPCS line items. Service count, beneficiary count, avg submitted/allowed charges | CMS bulk download | Annual |
| Medicaid Provider Spending (T-MSIS) | Provider-level spending by procedure code and month. FFS, managed care, and CHIP. 2018-2024 | HHS Open Data portal (currently temporarily unavailable) | TBD |
| Bundle taxonomy (internal) | CPT-to-bundle mapping per specialty. Starts with top specialties on the marketplace | Defined jointly by Antoine, Othmane, and Clara | As needed |

**Eng handoff:** Notebook with per-NPI procedure profile across Medicare + Medicaid, CPT-to-bundle mapping, peer comparison flags, and cost pattern signals. Schema supports slicing composite score by bundle.

---

### Step 6. Clinical outcomes (Phase 2)

> **Care journey, preventive care, readmissions. Unweighted until employer claims data is live. Not required for initial bar.**

What it answers: what are the actual health results for patients treated by this provider?

Phase 2. We can't build it until we have employer claims data flowing, which requires live contracts. Including it here because it's the most important dimension long-term and we need to design for it now.
- Data comes from employer claims and payer feeds, not public sources
- Metrics: care journey completion, preventive care adherence, readmission rates, ER utilisation
- This is the gold standard for quality and the data asset we can actually own. No one else will have this for independent practices
- Phase 2 timeline depends on contract velocity. Earliest realistic: 90+ days from first live employer

---

## 3. Timeline

### 30 days (by mid-April 2026)

| Deliverable | Owner |
|------------|-------|
| Step 1, safety gate: NPI-level pass/fail from NPDB + PECOS + state boards. Notebook to eng | Othmane + Antoine |
| Step 2, credentials: NPI-level structured fields from NPPES + ABMS + PECOS. Notebook to eng | Othmane |
| Step 3, patient experience: normalised composite score from Google / Healthgrades / Doximity. Notebook to eng | Antoine |
| Step 4, access & availability: onboarding form schema, sample output, scoring rubric | Antoine |
| ERISA methodology: legal definition of quality evidence for fiduciary duty. Methodology doc for employer-facing product | Clara |

### 60 days (by mid-May 2026)

| Deliverable | Owner |
|------------|-------|
| Step 5, MIPS / clinical quality: QPP score per NPI with three-situation logic, cross-referenced against credentials and reviews. Notebook to eng | Othmane + Antoine |
| Step 5b, CMS utilization & bundle scoring: Medicare + Medicaid procedure-level data mapped to clinical bundles. Bundle taxonomy defined. Notebook to eng | Antoine + Othmane + Clara |
| Composite score v1: first full composite combining steps 1-5b. Weighting validated against sample NPI cohort. Bundle-level slicing enabled | Antoine |
| Eng integration: all dimension notebooks productionised. API endpoint serving NPI-level quality data | Eng team |
| ERISA integration: methodology visible in product. Legal thresholds for marketplace inclusion defined | Clara + Product |

### 90 days (by mid-June 2026)

| Deliverable | Owner |
|------------|-------|
| Step 6, clinical outcomes design: schema and methodology for claims-based outcomes scoring. Ready when claims data is live | Antoine + Othmane |
| Safety gate monitoring: automated refresh cadence for NPDB / PECOS / state boards. Alerting for status changes | Eng team |
| Score validation: back-test composite scores against known quality signals. Identify edge cases. Adjust weights if needed | Antoine + Clara |
| Slack agent (#m-alpha-agent): natural language interface querying quality DB via API endpoint. Internal tool for team | Eng team |

---

## 4. Clara's workstream: ERISA and fiduciary duty

Clara's work runs parallel to the data science build and directly informs what we surface in the product. Three deliverables:

### 4a. Define what quality evidence employers need

Self-insured employers are fiduciaries under ERISA. The CAA 2021 raised the bar, and recent lawsuits (J&J, Wells Fargo, Hecht v. Cigna) have made enforcement real. Clara's job is to define exactly what evidence an employer needs to satisfy their duty of prudence when directing employees to providers on our marketplace.

The legal standard: run an objective process to assess qualifications, quality of services, and reasonableness of fees. The key word is process, not outcomes.
- What counts as a "structured, documented assessment"
- What data points satisfy each element of the prudence standard
- How our dimensions map to the legal requirements

### 4b. Document the methodology for employer-facing product

The score alone doesn't close the loop. The visible process does. We need to surface the methodology to employers inside the product, not buried in a PDF.
- Employer-readable description of how we evaluate providers
- Which data sources feed each dimension and why
- How the composite score is calculated
- How often data is refreshed and what triggers a re-evaluation

A self-insured employer should be able to point to this and say they ran a structured assessment before directing employees to a provider. That's the defensibility test.

### 4c. Identify legal thresholds that gate marketplace inclusion

Some quality signals are informational. Others are gatekeepers. Clara defines which ones are hard requirements vs. scored dimensions.
- Does a failed safety gate create legal exposure, or is it our policy choice?
- Are there credential minimums that ERISA case law has established?
- What monitoring obligations exist once a provider is listed?
- Does our methodology need external validation (e.g., NCQA-style accreditation) to be defensible?

---

## 5. Connection to engineering

Eng takes our validated notebooks and scripts and productionises them. The handoff format is the same for every dimension:

| Handoff component | Description |
|-------------------|-------------|
| Notebook/script | The code itself |
| Business question | Plain English description of what question is being answered |
| Data sources | Which sources were used and where we got them |
| Expected output | What the answer looks like at the NPI level (schema, sample rows) |
| Caveats | Assumptions, coverage gaps, population limitations, trust gaps |

Each dimension is a separate handoff. We don't bundle them. Eng can productionise each one as it's validated, so we ship incrementally.

**Pipeline (data science handoff):**

`Pull raw data` → `Build logic` → `Validate locally` → `Document` → `Ship to GitHub`

- Pull raw data from CMS, NPPES, review APIs, and scraping
- Build the business logic per dimension (scoring rules, thresholds, normalisation)
- Validate end-to-end in local notebooks (dataset to NPI-level output)
- Document everything: sources, caveats, assumptions, expected output schema
- Ship to GitHub as one notebook per dimension, ready for eng to pick up

---

## 6. Open questions

| Question | Impact |
|----------|--------|
| NPDB access: query directly or through an authorized agent? | Gates safety gate timeline |
| ABMS access: API vs. batch verification service? | Cost and turnaround TBD |
| State board coverage: start with states where we have practices, or solve nationally? | Scope of Step 1 |
| Review platform rights: Google API limits, Healthgrades/Doximity scraping legality. Partnership? | Step 3 feasibility |
| MIPS low-volume: neutral signal or slight negative? | Step 5 scoring logic |
| Composite weights (25/25/20/15/15): validate against employer priorities or ship and adjust? | Composite methodology |
| Medicaid Provider Spending dataset: currently unavailable on HHS Open Data portal. Medicare-only fallback until then | Step 5b data completeness |
| Bundle taxonomy granularity: top 3-5 bundles per specialty, or comprehensive from day one? | Step 5b scope |
| Safety gate refresh cadence: what interval satisfies the monitoring obligation? | Legal exposure (Hecht v. Cigna) |
