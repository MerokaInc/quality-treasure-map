# Quality Treasure Map

Data science POC notebooks for Meroka's quality scoring pipeline. Each step produces a per-provider signal that feeds into the final composite score.

## Steps

### Step 1 — Safety Gate: OIG LEIE Exclusion Check

**Notebook:** `step1_safety_gate.ipynb`

Binary pass/fail gate. Checks each provider NPI against the federal exclusion list (OIG LEIE) and Medicare enrollment (PECOS, informational only). A provider who fails here is excluded from the marketplace entirely.

**Data sources:**
| Dataset | Source | URL |
|---------|--------|-----|
| LEIE | OIG/HHS | https://oig.hhs.gov/exclusions/exclusions_list.asp |
| PECOS | CMS | https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment |

### Step 2 — State Medical Board Disciplinary Check: West Virginia

**Notebook:** `step2_wv_board_disciplinary.ipynb`

Matches WV Board of Medicine roster and disciplinary records to NPI numbers via the NPPES API. Produces a per-provider disciplinary flag.

**Data sources:**
| Dataset | Source | URL |
|---------|--------|-----|
| WV Active MD Roster | WV Board of Medicine | https://wvbom.wv.gov/Rosters.asp |
| WV Public Discipline Spreadsheet | WV Board of Medicine | https://wvbom.wv.gov/public/board-actions.asp |
| NPI Registry API | CMS/NPPES | https://npiregistry.cms.hhs.gov/api/ |

**Match strategy:**
- WV roster has no NPI column. We use NPPES API to resolve (first_name, last_name, state) to NPI.
- High confidence: unique match in NPPES for name + state. Medium: unique match without state filter. No match: ambiguous or not found.
- Discipline records joined to roster by name, then bridged to NPI through the NPPES lookup.

**Output columns:** `npi`, `first_name`, `last_name`, `wv_license_number`, `license_expiration`, `disciplinary_flag`, `most_recent_discipline_date`, `discipline_action_count`, `match_method`, `confidence`

## Massachusetts — Pending Public Records Request

MA does not offer a bulk download of physician profiles. The data exists (profiles include NPI, license status, disciplinary actions, malpractice history) but access requires a formal public records request to BORIM.

**Draft request email:**

> To: BORIM.RAO@state.ma.us
> Subject: Public Records Request — Physician Profile Data Export
>
> Hi,
>
> I'm requesting a bulk export of physician profile data under the Massachusetts Public Records Law (M.G.L. Chapter 66, Section 10).
>
> Specifically, I'm looking for all records from the Physician Profiles database (FindMyDoctor.mass.gov) in a structured format (CSV or Excel preferred), including these fields:
> - License number
> - NPI (National Provider Identifier)
> - First name, last name, date of birth
> - License status (active, expired, revoked, suspended)
> - Disciplinary action flag and details (if any)
> - Malpractice payment history (if available in the export)
>
> This data is for a healthcare analytics platform focused on provider quality scoring. We need the bulk dataset to match against federal provider registries (NPPES, LEIE) at scale.
>
> Happy to narrow the scope if needed, or to discuss format options. What's the typical turnaround for a request like this?
>
> Thanks,
> Antoine Bertrand

**Contact:** Tara Douglas, Primary Records Access Officer, BORIM.RAO@state.ma.us, 781-876-8200

**Why MA matters:** MA profiles are richer than WV. They include NPI natively (no NPPES bridge needed), malpractice history, hospital privilege suspensions, and criminal convictions. Once the data lands, the notebook will be simpler and more accurate.

## West Virginia Board — Notes

WV turned out to have better data availability than expected:
- Monthly roster downloads (Excel) with active MDs, PAs, DPMs
- Public discipline spreadsheet going back to 1953
- But no NPI in the source data, and no action type in the discipline file (just dates and names)

## How to reproduce

1. Clone this repo
2. Download the large CSV files (links above) into the project root. They're gitignored.
3. `pip install pandas numpy plotly requests openpyxl`
4. Run each notebook top to bottom

## Workstream context

This is the Quality dimension of the Meroka treasure map. Each step produces a provider-level signal. Steps run independently but feed into the same composite score downstream. The safety gate (Step 1) is a hard pass/fail. State board checks (Step 2+) produce flags that inform scoring but don't automatically exclude.
