const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, PageNumber, PageBreak
} = require("docx");

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 26 })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 23 })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 100 },
    children: [new TextRun({ text, font: "Arial", size: 21, bold: opts.bold || false })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 50 },
    children: [new TextRun({ text, font: "Arial", size: 21 })],
  });
}

function mixedBullet(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 50 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 21, ...r })),
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 560, hanging: 280 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u2013", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1000, hanging: 280 } } } },
        ]
      },
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "999999" }),
            ]
          })]
        })
      },
      children: [
        // TITLE
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: "Quality Workstream Treasure Map", font: "Arial", size: 32, bold: true })],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "30-60-90 Day Sprint", font: "Arial", size: 26 })],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "March 2026", font: "Arial", size: 21, color: "666666" })],
        }),

        // ═══ SUMMARY ═══
        heading1("Summary"),
        para("We\u2019re building a marketplace where employers direct contract with independent practices. For that to work, employers need confidence the providers meet a quality bar, legally and commercially. This doc sequences how we build that."),
        spacer(),
        para("Seven steps, in order:", { bold: true }),
        bullet("Safety gate: binary pass/fail per NPI using NPDB, state boards, and PECOS exclusion data. Fail = out of the marketplace entirely"),
        bullet("Credentials: board cert, med school, years in practice from NPPES, ABMS, and PECOS. Highest ERISA weight"),
        bullet("Patient experience: normalised review scores from Google, Healthgrades, and Doximity. Due diligence beyond paper qualifications"),
        bullet("Access & availability: practice-reported onboarding fields (hours, wait times, telehealth, languages). Employer proxy for value"),
        bullet("Clinical quality (MIPS): QPP scores where available, with three-situation logic for present/absent/low scores"),
        bullet("CMS utilization & bundle scoring: Medicare + Medicaid procedure-level data mapped to clinical bundles per specialty. Enables bundle-level scoring with public data"),
        bullet("Clinical outcomes: claims-based metrics from employer data. Phase 2, not required for initial bar"),
        spacer(),
        para("Timeline:", { bold: true }),
        bullet("30 days (mid-April): steps 1-4 delivered as notebooks to eng. Clara delivers ERISA methodology"),
        bullet("60 days (mid-May): steps 5 and 5b delivered. Bundle taxonomy defined. Composite score v1. Eng productionises all dimensions. API endpoint live"),
        bullet("90 days (mid-June): clinical outcomes schema designed. Safety gate monitoring automated. Score validation complete. Slack agent live"),
        spacer(),
        para("Clara\u2019s parallel workstream defines what quality evidence satisfies ERISA fiduciary duty, documents the methodology for the employer-facing product, and identifies legal thresholds that gate marketplace inclusion."),
        spacer(),
        para("Each dimension hands off to eng as a separate notebook with data sources, business logic, and expected NPI-level output. Eng productionises incrementally into a relational DB behind an API endpoint."),
        new Paragraph({ children: [new PageBreak()] }),

        // ═══ 1. WHERE WE ARE ═══
        heading1("1. Where we are"),
        para("We shipped the first quality treasure map in a 60-day sprint. It defined the problem, the ERISA context, and the six dimensions we score providers on. That work gave us the framework. This doc picks up where it left off and sequences the actual build."),
        para("The goal hasn\u2019t changed: create a pricing and market mechanism where an employer pays less for better care, while a practice earns more. Quality scoring is how we prove the providers on our marketplace meet a defensible bar, legally and commercially."),
        para("What follows is the workstream broken into concrete steps, with data sources, business logic, timelines, and how each piece hands off to engineering."),

        // ═══ 2. THE WORKSTREAM ═══
        heading1("2. The workstream"),
        para("Seven steps. Ordered by dependency and priority. Steps 1-4 are the 30-day target. Steps 5 and 5b follow at 60 days. Step 6 is Phase 2."),
        spacer(),

        // STEP 1
        heading2("Step 1. Safety gate"),
        para("Binary output per NPI. Pass = proceed to scoring. Fail = excluded from marketplace.", { bold: true }),
        spacer(),
        para("What it answers: should this provider be in the marketplace at all?"),
        spacer(),
        para("Business logic:"),
        bullet("query each NPI against NPDB, state medical board records, and the PECOS/OIG exclusion list"),
        bullet("if any of the three returns an active sanction, unresolved adverse action, or exclusion, the provider fails the gate"),
        bullet("this is not a score. It\u2019s a binary check. No weighting, no partial credit"),
        bullet("a provider who fails the gate does not receive a composite quality score and is not listed"),
        bullet("refresh cadence matters. Hecht v. Cigna settled for $5.7M because provider data went stale. We need a monitoring interval, not just a one-time check"),
        spacer(),
        para("Data sources:"),
        bullet("NPDB: federal database of malpractice payments and adverse actions. Access via NPDB query (requires registration as eligible entity). Continuous query enrollment available"),
        bullet("State medical boards: license status, disciplinary actions, suspensions. State-by-state APIs or scraping (varies widely). Quarterly minimum refresh"),
        bullet("PECOS / OIG exclusion list: CMS exclusions from Medicare billing. CMS bulk download (LEIE + PECOS). Monthly updates from CMS"),
        spacer(),
        para("Eng handoff: notebook with NPI-level pass/fail output, source documentation, and refresh logic."),
        spacer(),

        // STEP 2
        heading2("Step 2. Credentials and training"),
        para("Structured fields per NPI. Weight: 25% of composite score.", { bold: true }),
        spacer(),
        para("What it answers: is this provider qualified to practice in their claimed specialty?"),
        spacer(),
        para("Business logic:"),
        bullet("pull board certification status, medical school, residency program, and years in practice for each NPI"),
        bullet("board certification from ABMS is the primary signal. Active cert = full credit. Expired or never certified = flag, not automatic zero (some specialties have low cert rates)"),
        bullet("NPPES gives us taxonomy code, practice address, and enrollment date as validation"),
        bullet("PECOS cross-reference confirms Medicare enrollment status and specialty alignment"),
        bullet("years in practice is a context variable, not a quality signal. We include it for employer transparency, not scoring"),
        spacer(),
        para("ERISA value: highest legal weight under the duty of prudence. Employers must show they verified qualifications."),
        spacer(),
        para("Data sources:"),
        bullet("NPPES: NPI, taxonomy, practice address, enrollment date. CMS bulk download, weekly refresh"),
        bullet("ABMS: board certification status, specialty, expiration. ABMS API or verification service. Annual cert cycle"),
        bullet("PECOS: Medicare enrollment, specialty, practice affiliations. CMS bulk download, monthly refresh"),
        spacer(),
        para("Eng handoff: notebook with NPI-level credential fields, ABMS cert status flag, and specialty validation logic."),
        spacer(),

        // STEP 3
        heading2("Step 3. Patient experience"),
        para("Normalised composite from Google, Healthgrades, Doximity. Weight: 25% of composite score.", { bold: true }),
        spacer(),
        para("What it answers: what do patients actually say about this provider?"),
        spacer(),
        para("Business logic:"),
        bullet("pull star ratings and review counts from Google, Healthgrades, and Doximity for each NPI"),
        bullet("normalise across platforms to a common 0-100 scale. Google uses 1-5 stars, Healthgrades uses a different scale, Doximity has its own"),
        bullet("review volume is a confidence signal, not a score input. A provider with 3 reviews at 4.8 stars is less reliable than one with 200 reviews at 4.3. We apply a minimum review threshold before weighting"),
        bullet("sentiment categories we care about: bedside manner, wait times, communication, follow-up. If platforms expose these, we use them. If not, aggregate star rating is the fallback"),
        bullet("absence of reviews is not a penalty. Many indie practices have thin online footprints. Null = redistribute weight to other dimensions"),
        spacer(),
        para("ERISA value: demonstrates due diligence beyond credentials. Shows employers assessed patient-reported quality, not just paper qualifications."),
        spacer(),
        para("Data sources:"),
        bullet("Google Maps / Places API: star rating, review count, review text snippets. Real-time refresh. Usage limits apply"),
        bullet("Healthgrades: overall rating, patient satisfaction scores, review count. Scraping or data partnership. Quarterly"),
        bullet("Doximity: peer reputation, patient reviews where available. Doximity API or partnership. Quarterly"),
        bullet("RateMDs: supplementary patient ratings and review volume. Scraping. As needed"),
        spacer(),
        para("Eng handoff: notebook with NPI-level normalised score (0-100), confidence flag based on review volume, and platform-level raw values."),
        spacer(),

        // STEP 4
        heading2("Step 4. Access and availability"),
        para("Structured onboarding form fields. Defined schema for pipeline. Weight: 15% of composite score.", { bold: true }),
        spacer(),
        para("What it answers: can patients actually get to this provider and get seen?"),
        spacer(),
        para("Business logic:"),
        bullet("this dimension is practice-reported, not pulled from public data. We define the schema, practices fill it in during onboarding"),
        bullet("fields: office hours, average wait time for new patient appointment, telehealth availability, languages spoken, accepting new patients (yes/no), wheelchair accessibility"),
        bullet("scoring: telehealth = bonus, short wait times = bonus, extended hours = bonus. Additive signals, not pass/fail"),
        bullet("this is the dimension employers care most about for utilisation. If they\u2019re directing employees to a provider, they need to know that provider can actually see them in a reasonable timeframe"),
        bullet("self-reported data has an obvious trust problem. Phase 2 validates against claims and appointment data. For now, the schema is the deliverable"),
        spacer(),
        para("ERISA value: drives utilisation, which is the employer\u2019s proxy for value. Showing you assessed access, not just credentials, strengthens the fiduciary argument."),
        spacer(),
        para("Onboarding fields:"),
        bullet("office hours (structured: day + open/close times). Flag extended hours as bonus"),
        bullet("new patient wait time (integer, days). < 14 days = good, < 7 = great"),
        bullet("telehealth (boolean). Additive bonus"),
        bullet("languages spoken (array of strings). Enriches access for diverse populations"),
        bullet("accepting new patients (boolean). If no, flag for employer visibility"),
        bullet("wheelchair accessible (boolean). ADA compliance signal"),
        spacer(),
        para("Eng handoff: schema definition (JSON schema), sample onboarding form output, and scoring rubric for each field."),
        spacer(),

        // STEP 5
        heading2("Step 5. Clinical quality (MIPS)"),
        para("QPP score + threshold flag per NPI. Three-situation logic. Weight: 20% of composite score.", { bold: true }),
        spacer(),
        para("What it answers: has the government independently assessed this provider\u2019s clinical quality?"),
        spacer(),
        para("Business logic (three situations):"),
        spacer(),
        mixedBullet([
          { text: "Score present and strong: ", bold: true },
          { text: "weight at 20%. This is the only place where we can say a federal agency independently evaluated this provider\u2019s quality. Strong evidentiary claim." },
        ]),
        mixedBullet([
          { text: "No score (below low-volume threshold): ", bold: true },
          { text: "null out, redistribute weight to other dimensions. Below ~200 Medicare patients or ~$90k billed is the CMS threshold. This is a size signal, not a quality signal. Not a penalty." },
        ]),
        mixedBullet([
          { text: "Score present but low: ", bold: true },
          { text: "cross-reference credentials and patient reviews before penalising. Low MIPS + clean record + good reviews = likely admin burden. Low MIPS + sanctions + bad reviews = real flag." },
        ]),
        spacer(),
        para("Structural ceiling: all CMS data is Medicare fee-for-service. A physician whose patients are commercially insured will look thin in CMS data because of who they treat, not how well they treat them. We can\u2019t engineer around this, but we can be transparent about it."),
        spacer(),
        para("Data sources:"),
        bullet("CMS QPP / Provider Data Catalog: MIPS final score, category scores, low-volume flag. CMS bulk download. Annual (with lag)"),
        bullet("CMS Care Compare: QPP scores, telehealth flags, facility affiliations, procedure volume. CMS API or bulk download. Quarterly"),
        bullet("Part B claims (supplementary): billing volume, specialty consistency, practice activity. CMS bulk download. Annual"),
        spacer(),
        para("Eng handoff: notebook with NPI-level QPP score, threshold flag (above/below low-volume), and the three-situation decision logic as documented rules."),
        spacer(),

        // STEP 5b
        heading2("Step 5b. CMS utilization & bundle scoring"),
        para("Per-CPT procedure volume, cost patterns, and clinical bundle mapping per NPI. Weight: 15% of composite score.", { bold: true }),
        spacer(),
        para("What it answers: what does this provider actually do, how much of it, and are there cost or volume red flags at the bundle level?"),
        spacer(),
        para("Business logic:"),
        bullet("pull per-NPI procedure-level data from Medicare Provider Utilization files and Medicaid Provider Spending (T-MSIS): CPT/HCPCS codes billed, service counts, average charges, beneficiary counts"),
        bullet("map CPT codes to clinical bundles by specialty (e.g., OB/GYN: maternity CPTs to Maternity bundle, surgical CPTs to GYN Surgery, screening CPTs to Preventive)"),
        bullet("this is what enables bundle-level scoring with public data. Instead of one flat composite per NPI, you can slice the score by clinical service line"),
        bullet("cost pattern flags: compare provider utilization against specialty peers. Lab over-ordering, unusual billing concentration, outlier charge ratios. Cost signals for employers, not quality penalties"),
        bullet("procedure volume is a confidence signal per bundle. High volume = reliable score. Low volume = flag for transparency, not a penalty"),
        bullet("combining Medicare + Medicaid gives a much fuller picture, especially for specialties with heavy Medicaid populations (OB/GYN, pediatrics, primary care)"),
        spacer(),
        para("Structural caveat: both datasets are still government-payer only. Providers whose patients are mostly commercially insured will still look thin. We can\u2019t engineer around this, but we can be transparent about it."),
        spacer(),
        para("Data sources:"),
        bullet("Medicare Physician & Other Practitioners: per-NPI, per-HCPCS line items. Service count, beneficiary count, average submitted/allowed charges. CMS bulk download. Annual"),
        bullet("Medicaid Provider Spending (T-MSIS via HHS Open Data): provider-level spending by procedure code and month. FFS, managed care, and CHIP. 2018-2024. Currently temporarily unavailable on HHS portal, monitor for access"),
        bullet("Bundle taxonomy (internal): CPT-to-bundle mapping per specialty. Starts with top specialties on the marketplace. Defined jointly by Antoine, Othmane, and Clara"),
        spacer(),
        para("Eng handoff: notebook with per-NPI procedure profile across Medicare + Medicaid, CPT-to-bundle mapping, peer comparison flags, and cost pattern signals. Schema supports slicing composite score by bundle."),
        spacer(),

        // STEP 6
        heading2("Step 6. Clinical outcomes (Phase 2)"),
        para("Care journey, preventive care, readmissions. Weight: unweighted until employer claims data is live. Not required for initial bar.", { bold: true }),
        spacer(),
        para("What it answers: what are the actual health results for patients treated by this provider?"),
        spacer(),
        para("Phase 2. We can\u2019t build it until we have employer claims data flowing, which requires live contracts. Including it here because it\u2019s the most important dimension long-term and we need to design for it now."),
        bullet("data comes from employer claims and payer feeds, not public sources"),
        bullet("metrics: care journey completion, preventive care adherence, readmission rates, ER utilisation"),
        bullet("this is the gold standard for quality and the data asset we can actually own. No one else will have this for independent practices"),
        bullet("Phase 2 timeline depends on contract velocity. Earliest realistic: 90+ days from first live employer"),
        spacer(),

        // ═══ 3. TIMELINE ═══
        new Paragraph({ children: [new PageBreak()] }),
        heading1("3. Timeline"),
        spacer(),

        para("30 days (by mid-April 2026)", { bold: true }),
        bullet("step 1, safety gate: NPI-level pass/fail from NPDB + PECOS + state boards. Notebook to eng. (Othmane + Antoine)"),
        bullet("step 2, credentials: NPI-level structured fields from NPPES + ABMS + PECOS. Notebook to eng. (Othmane)"),
        bullet("step 3, patient experience: normalised composite score from Google / Healthgrades / Doximity. Notebook to eng. (Antoine)"),
        bullet("step 4, access & availability: onboarding form schema, sample output, scoring rubric. (Antoine)"),
        bullet("ERISA methodology: legal definition of quality evidence for fiduciary duty. Methodology doc for employer-facing product. (Clara)"),
        spacer(),

        para("60 days (by mid-May 2026)", { bold: true }),
        bullet("step 5, MIPS / clinical quality: QPP score per NPI with three-situation logic, cross-referenced against credentials and reviews. Notebook to eng. (Othmane + Antoine)"),
        bullet("step 5b, CMS utilization & bundle scoring: Medicare + Medicaid procedure-level data mapped to clinical bundles. Bundle taxonomy defined. Notebook to eng. (Antoine + Othmane + Clara)"),
        bullet("composite score v1: first full composite combining steps 1-5b. Weighting validated against sample NPI cohort. Bundle-level slicing enabled. (Antoine)"),
        bullet("eng integration: all dimension notebooks productionised. API endpoint serving NPI-level quality data. (Eng team)"),
        bullet("ERISA integration: methodology visible in product. Legal thresholds for marketplace inclusion defined. (Clara + Product)"),
        spacer(),

        para("90 days (by mid-June 2026)", { bold: true }),
        bullet("step 6, clinical outcomes design: schema and methodology for claims-based outcomes scoring. Ready when claims data is live. (Antoine + Othmane)"),
        bullet("safety gate monitoring: automated refresh cadence for NPDB / PECOS / state boards. Alerting for status changes. (Eng team)"),
        bullet("score validation: back-test composite scores against known quality signals. Identify edge cases. Adjust weights if needed. (Antoine + Clara)"),
        bullet("Slack agent (#m-alpha-agent): natural language interface querying quality DB via API endpoint. Internal tool for team. (Eng team)"),
        spacer(),

        // ═══ 4. CLARA'S WORKSTREAM ═══
        heading1("4. Clara\u2019s workstream: ERISA and fiduciary duty"),
        para("Clara\u2019s work runs parallel to the data science build and directly informs what we surface in the product. Three deliverables:"),
        spacer(),

        heading2("4a. Define what quality evidence employers need"),
        para("Self-insured employers are fiduciaries under ERISA. The CAA 2021 raised the bar, and recent lawsuits (J&J, Wells Fargo, Hecht v. Cigna) have made enforcement real. Clara\u2019s job is to define exactly what evidence an employer needs to satisfy their duty of prudence when directing employees to providers on our marketplace."),
        para("The legal standard: run an objective process to assess qualifications, quality of services, and reasonableness of fees. The key word is process, not outcomes."),
        bullet("what counts as a \"structured, documented assessment\""),
        bullet("what data points satisfy each element of the prudence standard"),
        bullet("how our six dimensions map to the legal requirements"),
        spacer(),

        heading2("4b. Document the methodology for employer-facing product"),
        para("The score alone doesn\u2019t close the loop. The visible process does. We need to surface the methodology to employers inside the product, not buried in a PDF."),
        bullet("employer-readable description of how we evaluate providers"),
        bullet("which data sources feed each dimension and why"),
        bullet("how the composite score is calculated"),
        bullet("how often data is refreshed and what triggers a re-evaluation"),
        para("A self-insured employer should be able to point to this and say they ran a structured assessment before directing employees to a provider. That\u2019s the defensibility test."),
        spacer(),

        heading2("4c. Identify legal thresholds that gate marketplace inclusion"),
        para("Some quality signals are informational. Others are gatekeepers. Clara defines which ones are hard requirements vs. scored dimensions."),
        bullet("does a failed safety gate create legal exposure, or is it our policy choice?"),
        bullet("are there credential minimums that ERISA case law has established?"),
        bullet("what monitoring obligations exist once a provider is listed?"),
        bullet("does our methodology need external validation (e.g., NCQA-style accreditation) to be defensible?"),
        spacer(),

        // ═══ 5. CONNECTION TO ENG ═══
        heading1("5. Connection to engineering"),
        para("Eng takes our validated notebooks and scripts and productionises them. The handoff format is the same for every dimension:"),
        spacer(),
        bullet("the notebook or script itself"),
        bullet("a plain English description of the business question being answered"),
        bullet("which data sources were used and where we got them"),
        bullet("the expected output: what does the answer look like at the NPI level (schema, sample rows)"),
        bullet("assumptions and caveats (MIPS coverage gaps, CMS population limitations, self-report trust gaps)"),
        spacer(),
        para("Each dimension is a separate handoff. We don\u2019t bundle them. Eng can productionise each one as it\u2019s validated, so we ship incrementally."),
        spacer(),
        para("Our pipeline (data science handoff):"),
        bullet("pull raw data from CMS, NPPES, review APIs, and scraping"),
        bullet("build the business logic per dimension (scoring rules, thresholds, normalisation)"),
        bullet("validate end-to-end in local notebooks (dataset to NPI-level output)"),
        bullet("document everything: sources, caveats, assumptions, expected output schema"),
        bullet("ship to GitHub as one notebook per dimension, ready for eng to pick up"),
        spacer(),

        // ═══ 6. OPEN QUESTIONS ═══
        heading1("6. Open questions"),
        bullet("NPDB access: are we eligible to query directly, or do we need to go through an authorized agent? This gates the safety gate timeline"),
        bullet("ABMS access: API vs. batch verification service. Cost and turnaround time TBD"),
        bullet("state medical board coverage: some states have APIs, many don\u2019t. Do we start with the states where we have practices, or try to solve nationally?"),
        bullet("review platform data rights: Google Places API has usage limits. Healthgrades and Doximity scraping has legal considerations. Partnership path?"),
        bullet("MIPS threshold logic: do we treat the low-volume exclusion as a neutral signal or a slight negative? The original doc says neutral. Confirm"),
        bullet("composite score weights: the current weights (25/25/20/15/15) came from the first treasure map. Do we validate against employer priorities, or ship as-is and adjust?"),
        bullet("Medicaid Provider Spending dataset: currently temporarily unavailable on HHS Open Data portal. Monitor for access. Fallback is Medicare-only utilization until it returns"),
        bullet("bundle taxonomy: how granular do we go per specialty? Start with top 3-5 bundles per specialty, or comprehensive from day one?"),
        bullet("refresh cadence for the safety gate: what interval satisfies the monitoring obligation? Hecht v. Cigna says \"stale\" is a liability, but doesn\u2019t define a threshold"),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:\\Users\\antob\\Desktop\\claude_projects\\Quality Workstream Treasure Map - 30-60-90.docx", buffer);
  console.log("Document created successfully.");
});
