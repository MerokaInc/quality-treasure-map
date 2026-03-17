# Quality Workstream Treasure Map
## 30-60-90 Day Sprint | March 2026

---

## Summary

We're building a marketplace where employers direct contract with independent practices. For that to work, employers need confidence the providers meet a quality bar, legally and commercially. This doc sequences how we build that.

**Six steps, in order:**
- Safety gate: binary pass/fail per NPI using NPDB, state boards, and PECOS exclusion data. Fail = out of the marketplace entirely
- Credentials: board cert, med school, years in practice from NPPES, ABMS, and PECOS. Highest ERISA weight
- Patient experience: normalised review scores from Google, Healthgrades, and Doximity. Due diligence beyond paper qualifications
- Access & availability: practice-reported onboarding fields (hours, wait times, telehealth, languages). Employer proxy for value
- Clinical quality (MIPS): QPP scores where available, with three-situation logic for present/absent/low scores
- Clinical outcomes: claims-based metrics from employer data. Phase 2, not required for initial bar

**Timeline:**
- 30 days (mid-April): steps 1-4 delivered as notebooks to eng. Clara delivers ERISA methodology
- 60 days (mid-May): step 5 delivered. Composite score v1. Eng productionises all dimensions. API endpoint live
- 90 days (mid-June): clinical outcomes schema designed. Safety gate monitoring automated. Score validation complete. Slack agent live

Clara's parallel workstream defines what quality evidence satisfies ERISA fiduciary duty, documents the methodology for the employer-facing product, and identifies legal thresholds that gate marketplace inclusion.

Each dimension hands off to eng as a separate notebook with data sources, business logic, and expected NPI-level output. Eng productionises incrementally into a relational DB behind an API endpoint.

---

## 1. Where we are

We shipped the first quality treasure map in a 60-day sprint. It defined the problem, the ERISA context, and the six dimensions we score providers on. That work gave us the framework. This doc picks up where it left off and sequences the actual build.

The goal hasn't changed: create a pricing and market mechanism where an employer pays less for better care, while a practice earns more. Quality scoring is how we prove the providers on our marketplace meet a defensible bar, legally and commercially.

What follows is the workstream broken into concrete steps, with data sources, business logic, timelines, and how each piece hands off to engineering.

---

## 2. The workstream

Six steps. Ordered by dependency and priority. Steps 1-4 are the 30-day target. Step 5 follows at 60 days. Step 6 is Phase 2.

### Step 1. Safety gate

**Binary output per NPI. Pass = proceed to scoring. Fail = excluded from marketplace.**

What it answers: should this provider be in the marketplace at all?

Business logic:
- query each NPI against NPDB, state medical board records, and the PECOS/OIG exclusion list
- if any of the three returns an active sanction, unresolved adverse action, or exclusion, the provider fails the gate
- this is not a score. It's a binary check. No weighting, no partial credit
- a provider who fails the gate does not receive a composite quality score and is not listed
- refresh cadence matters. Hecht v. Cigna settled for $5.7M because provider data went stale. We need a monitoring interval, not just a one-time check

Data sources:
- NPDB: federal database of malpractice payments and adverse actions. Access via NPDB query (requires registration as eligible entity). Continuous query enrollment available
- State medical boards: license status, disciplinary actions, suspensions. State-by-state APIs or scraping (varies widely). Quarterly minimum refresh
- PECOS / OIG exclusion list: CMS exclusions from Medicare billing. CMS bulk download (LEIE + PECOS). Monthly updates from CMS

Eng handoff: notebook with NPI-level pass/fail output, source documentation, and refresh logic.

### Step 2. Credentials and training

**Structured fields per NPI. Weight: 25% of composite score.**

What it answers: is this provider qualified to practice in their claimed specialty?

Business logic:
- pull board certification status, medical school, residency program, and years in practice for each NPI
- board certification from ABMS is the primary signal. Active cert = full credit. Expired or never certified = flag, not automatic zero (some specialties have low cert rates)
- NPPES gives us taxonomy code, practice address, and enrollment date as validation
- PECOS cross-reference confirms Medicare enrollment status and specialty alignment
- years in practice is a context variable, not a quality signal. We include it for employer transparency, not scoring

ERISA value: highest legal weight under the duty of prudence. Employers must show they verified qualifications.

Data sources:
- NPPES: NPI, taxonomy, practice address, enrollment date. CMS bulk download, weekly refresh
- ABMS: board certification status, specialty, expiration. ABMS API or verification service. Annual cert cycle
- PECOS: Medicare enrollment, specialty, practice affiliations. CMS bulk download, monthly refresh

Eng handoff: notebook with NPI-level credential fields, ABMS cert status flag, and specialty validation logic.

### Step 3. Patient experience

**Normalised composite from Google, Healthgrades, Doximity. Weight: 25% of composite score.**

What it answers: what do patients actually say about this provider?

Business logic:
- pull star ratings and review counts from Google, Healthgrades, and Doximity for each NPI
- normalise across platforms to a common 0-100 scale. Google uses 1-5 stars, Healthgrades uses a different scale, Doximity has its own
- review volume is a confidence signal, not a score input. A provider with 3 reviews at 4.8 stars is less reliable than one with 200 reviews at 4.3. We apply a minimum review threshold before weighting
- sentiment categories we care about: bedside manner, wait times, communication, follow-up. If platforms expose these, we use them. If not, aggregate star rating is the fallback
- absence of reviews is not a penalty. Many indie practices have thin online footprints. Null = redistribute weight to other dimensions

ERISA value: demonstrates due diligence beyond credentials. Shows employers assessed patient-reported quality, not just paper qualifications.

Data sources:
- Google Maps / Places API: star rating, review count, review text snippets. Real-time refresh. Usage limits apply
- Healthgrades: overall rating, patient satisfaction scores, review count. Scraping or data partnership. Quarterly
- Doximity: peer reputation, patient reviews where available. Doximity API or partnership. Quarterly
- RateMDs: supplementary patient ratings and review volume. Scraping. As needed

Eng handoff: notebook with NPI-level normalised score (0-100), confidence flag based on review volume, and platform-level raw values.

### Step 4. Access and availability

**Structured onboarding form fields. Defined schema for pipeline. Weight: 15% of composite score.**

What it answers: can patients actually get to this provider and get seen?

Business logic:
- this dimension is practice-reported, not pulled from public data. We define the schema, practices fill it in during onboarding
- fields: office hours, average wait time for new patient appointment, telehealth availability, languages spoken, accepting new patients (yes/no), wheelchair accessibility
- scoring: telehealth = bonus, short wait times = bonus, extended hours = bonus. Additive signals, not pass/fail
- this is the dimension employers care most about for utilisation. If they're directing employees to a provider, they need to know that provider can actually see them in a reasonable timeframe
- self-reported data has an obvious trust problem. Phase 2 validates against claims and appointment data. For now, the schema is the deliverable

ERISA value: drives utilisation, which is the employer's proxy for value. Showing you assessed access, not just credentials, strengthens the fiduciary argument.

Onboarding fields:
- office hours (structured: day + open/close times). Flag extended hours as bonus
- new patient wait time (integer, days). < 14 days = good, < 7 = great
- telehealth (boolean). Additive bonus
- languages spoken (array of strings). Enriches access for diverse populations
- accepting new patients (boolean). If no, flag for employer visibility
- wheelchair accessible (boolean). ADA compliance signal

Eng handoff: schema definition (JSON schema), sample onboarding form output, and scoring rubric for each field.

### Step 5. Clinical quality (MIPS)

**QPP score + threshold flag per NPI. Three-situation logic. Weight: 20% of composite score.**

What it answers: has the government independently assessed this provider's clinical quality?

Business logic (three situations):

- **Score present and strong:** weight at 20%. This is the only place where we can say a federal agency independently evaluated this provider's quality. Strong evidentiary claim.
- **No score (below low-volume threshold):** null out, redistribute weight to other dimensions. Below ~200 Medicare patients or ~$90k billed is the CMS threshold. This is a size signal, not a quality signal. Not a penalty.
- **Score present but low:** cross-reference credentials and patient reviews before penalising. Low MIPS + clean record + good reviews = likely admin burden. Low MIPS + sanctions + bad reviews = real flag.

Structural ceiling: all CMS data is Medicare fee-for-service. A physician whose patients are commercially insured will look thin in CMS data because of who they treat, not how well they treat them. We can't engineer around this, but we can be transparent about it.

Data sources:
- CMS QPP / Provider Data Catalog: MIPS final score, category scores, low-volume flag. CMS bulk download. Annual (with lag)
- CMS Care Compare: QPP scores, telehealth flags, facility affiliations, procedure volume. CMS API or bulk download. Quarterly
- Part B claims (supplementary): billing volume, specialty consistency, practice activity. CMS bulk download. Annual

Eng handoff: notebook with NPI-level QPP score, threshold flag (above/below low-volume), and the three-situation decision logic as documented rules.

### Step 6. Clinical outcomes (Phase 2)

**Care journey, preventive care, readmissions. Weight: 15% of composite score. Not required for initial bar.**

What it answers: what are the actual health results for patients treated by this provider?

Phase 2. We can't build it until we have employer claims data flowing, which requires live contracts. Including it here because it's the most important dimension long-term and we need to design for it now.
- data comes from employer claims and payer feeds, not public sources
- metrics: care journey completion, preventive care adherence, readmission rates, ER utilisation
- this is the gold standard for quality and the data asset we can actually own. No one else will have this for independent practices
- Phase 2 timeline depends on contract velocity. Earliest realistic: 90+ days from first live employer

---

## 3. Timeline

**30 days (by mid-April 2026)**
- step 1, safety gate: NPI-level pass/fail from NPDB + PECOS + state boards. Notebook to eng. (Othmane + Antoine)
- step 2, credentials: NPI-level structured fields from NPPES + ABMS + PECOS. Notebook to eng. (Othmane)
- step 3, patient experience: normalised composite score from Google / Healthgrades / Doximity. Notebook to eng. (Antoine)
- step 4, access & availability: onboarding form schema, sample output, scoring rubric. (Antoine)
- ERISA methodology: legal definition of quality evidence for fiduciary duty. Methodology doc for employer-facing product. (Clara)

**60 days (by mid-May 2026)**
- step 5, MIPS / clinical quality: QPP score per NPI with three-situation logic, cross-referenced against credentials and reviews. Notebook to eng. (Othmane + Antoine)
- composite score v1: first full composite combining steps 1-5. Weighting validated against sample NPI cohort. (Antoine)
- eng integration: all dimension notebooks productionised. API endpoint serving NPI-level quality data. (Eng team)
- ERISA integration: methodology visible in product. Legal thresholds for marketplace inclusion defined. (Clara + Product)

**90 days (by mid-June 2026)**
- step 6, clinical outcomes design: schema and methodology for claims-based outcomes scoring. Ready when claims data is live. (Antoine + Othmane)
- safety gate monitoring: automated refresh cadence for NPDB / PECOS / state boards. Alerting for status changes. (Eng team)
- score validation: back-test composite scores against known quality signals. Identify edge cases. Adjust weights if needed. (Antoine + Clara)
- Slack agent (#m-alpha-agent): natural language interface querying quality DB via API endpoint. Internal tool for team. (Eng team)

---

## 4. Clara's workstream: ERISA and fiduciary duty

Clara's work runs parallel to the data science build and directly informs what we surface in the product. Three deliverables:

### 4a. Define what quality evidence employers need

Self-insured employers are fiduciaries under ERISA. The CAA 2021 raised the bar, and recent lawsuits (J&J, Wells Fargo, Hecht v. Cigna) have made enforcement real. Clara's job is to define exactly what evidence an employer needs to satisfy their duty of prudence when directing employees to providers on our marketplace.

The legal standard: run an objective process to assess qualifications, quality of services, and reasonableness of fees. The key word is process, not outcomes.
- what counts as a "structured, documented assessment"
- what data points satisfy each element of the prudence standard
- how our six dimensions map to the legal requirements

### 4b. Document the methodology for employer-facing product

The score alone doesn't close the loop. The visible process does. We need to surface the methodology to employers inside the product, not buried in a PDF.
- employer-readable description of how we evaluate providers
- which data sources feed each dimension and why
- how the composite score is calculated
- how often data is refreshed and what triggers a re-evaluation

A self-insured employer should be able to point to this and say they ran a structured assessment before directing employees to a provider. That's the defensibility test.

### 4c. Identify legal thresholds that gate marketplace inclusion

Some quality signals are informational. Others are gatekeepers. Clara defines which ones are hard requirements vs. scored dimensions.
- does a failed safety gate create legal exposure, or is it our policy choice?
- are there credential minimums that ERISA case law has established?
- what monitoring obligations exist once a provider is listed?
- does our methodology need external validation (e.g., NCQA-style accreditation) to be defensible?

---

## 5. Connection to engineering

Eng takes our validated notebooks and scripts and productionises them. The handoff format is the same for every dimension:

- the notebook or script itself
- a plain English description of the business question being answered
- which data sources were used and where we got them
- the expected output: what does the answer look like at the NPI level (schema, sample rows)
- assumptions and caveats (MIPS coverage gaps, CMS population limitations, self-report trust gaps)

Each dimension is a separate handoff. We don't bundle them. Eng can productionise each one as it's validated, so we ship incrementally.

Our pipeline (data science handoff):
- pull raw data from CMS, NPPES, review APIs, and scraping
- build the business logic per dimension (scoring rules, thresholds, normalisation)
- validate end-to-end in local notebooks (dataset to NPI-level output)
- document everything: sources, caveats, assumptions, expected output schema
- ship to GitHub as one notebook per dimension, ready for eng to pick up

---

## 6. Open questions

- NPDB access: are we eligible to query directly, or do we need to go through an authorized agent? This gates the safety gate timeline
- ABMS access: API vs. batch verification service. Cost and turnaround time TBD
- state medical board coverage: some states have APIs, many don't. Do we start with the states where we have practices, or try to solve nationally?
- review platform data rights: Google Places API has usage limits. Healthgrades and Doximity scraping has legal considerations. Partnership path?
- MIPS threshold logic: do we treat the low-volume exclusion as a neutral signal or a slight negative? The original doc says neutral. Confirm
- composite score weights: the current weights (25/25/20/15/15) came from the first treasure map. Do we validate against employer priorities, or ship as-is and adjust?
- refresh cadence for the safety gate: what interval satisfies the monitoring obligation? Hecht v. Cigna says "stale" is a liability, but doesn't define a threshold
