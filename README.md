# Step 1 — Safety Gate: OIG LEIE + PECOS Exclusion Check

## Business question

Should this provider be in the Meroka marketplace at all?

This is a binary gate. Pass = proceed to quality scoring. Fail = excluded from the marketplace. No partial credit, no weighting.

If a provider is on the federal exclusion list (LEIE), any entity that pays them for federally reimbursable services faces civil monetary penalties. An employer directing employees to an excluded provider has real legal exposure.

## What this notebook does

Takes a list of provider NPIs and checks each one against:
1. **OIG LEIE** — is this provider federally excluded?
2. **PECOS** — is this provider actively enrolled in Medicare?

Produces a `gate_result` column: PASS or FAIL.

## Data sources

| Dataset | Source | URL | Size | Refresh |
|---------|--------|-----|------|---------|
| LEIE (List of Excluded Individuals/Entities) | OIG/HHS | https://oig.hhs.gov/exclusions/exclusions_list.asp | ~83K records | Monthly |
| PECOS Medicare Enrollment | CMS | https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment | ~2.96M enrollment rows, ~2.54M unique NPIs | Monthly |

**Note:** The CSV files are too large for GitHub. Download them directly:
- LEIE: https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv
- PECOS: Download from the CMS data.gov page above (Jan 2026 extract, 318 MB)

## Output schema

| Column | Type | Description |
|--------|------|-------------|
| `NPI` | str | 10-digit National Provider Identifier |
| `FIRST_NAME` | str | Provider first name |
| `LAST_NAME` | str | Provider last name |
| `STATE` | str | State code |
| `PROVIDER_TYPE` | str | Provider type description |
| `leie_excluded` | bool | True if NPI is on the active LEIE exclusion list |
| `pecos_enrolled` | bool | True if NPI appears in PECOS Medicare enrollment |
| `gate_result` | str | PASS or FAIL |
| `leie_excl_type` | str | OIG exclusion type code (if excluded) |
| `leie_excl_date` | str | Date of exclusion, YYYYMMDD (if excluded) |

## Known caveats

- **NPDB is absent.** The National Practitioner Data Bank (malpractice settlements, adverse actions) requires registration that could take weeks to months. Out of scope for this sprint.
- **~90% of LEIE records lack an NPI.** These are older records from before the NPI system (pre-2007). Matching them requires name + address logic, which is not implemented here. This is a gap that underestimates the true exclusion count.
- **State medical boards are a separate workstream.** License revocations and disciplinary actions from state boards are checked in a different step.
- **PECOS enrollment is informational, not a gate blocker.** A provider not in PECOS may just not bill Medicare (cash-pay, commercial-only, etc.).

## How to reproduce

1. Download the LEIE and PECOS CSVs (links above) into the project root
2. `pip install pandas numpy plotly`
3. Run `step1_safety_gate.ipynb` from top to bottom
4. The validation cells at the end confirm the gate logic works

## Workstream context

This is Step 1 of the Quality Treasure Map. The safety gate runs before any quality scoring. A provider who fails here never receives a composite score and is not listed in the marketplace.
