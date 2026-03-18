# Quality Treasure Map

Data science POC notebooks for Meroka's quality scoring pipeline. Each step produces a per-provider signal that feeds into the final composite score.

## Steps

### Step 1 — Safety Gate

**Notebooks:** `step1_safety_gate.ipynb` (LEIE + PECOS), `step2_wv_board_disciplinary.ipynb` (WV state board)

Binary pass/fail gate. Checks each provider against the OIG exclusion list (LEIE), PECOS enrollment (informational only), and state medical board disciplinary records. A provider who fails here is excluded from the marketplace entirely.

**Data sources:**
| Dataset | Source | URL |
|---------|--------|-----|
| LEIE | OIG/HHS | https://oig.hhs.gov/exclusions/exclusions_list.asp |
| PECOS | CMS | https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment |

**State board check: West Virginia**

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

MA does not offer a bulk download of physician profiles. The data exists (profiles include NPI, license status, disciplinary actions, malpractice history) but access requires a formal public records request to BORIM. Pending response.

## West Virginia Board — Notes

WV turned out to have better data availability than expected:
- Monthly roster downloads (Excel) with active MDs, PAs, DPMs
- Public discipline spreadsheet going back to 1953
- But no NPI in the source data, and no action type in the discipline file (just dates and names)

## Dataset files

Input files are too large for git. Download them from the shared Drive folder and place in the project root.

**[Google Drive folder](https://drive.google.com/drive/folders/1POC7QWQ9XS_3DbMRG3KgGnfMm3b9tkW1)**

| File | Size | Source | Source URL |
|------|------|--------|------------|
| `LEIE_UPDATED.csv` | 15 MB | OIG/HHS | https://oig.hhs.gov/exclusions/exclusions_list.asp |
| `PECOS_Enrollment.csv` | 304 MB | CMS | https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/medicare-fee-for-service-public-provider-enrollment |
| `sample_npi_list.csv` | 17 KB | Generated | Test NPI list for validation |
| `wv_discipline.xlsx` | 115 KB | WV Board of Medicine | https://wvbom.wv.gov/public/board-actions.asp |
| `wv_md_roster.xlsx` | 516 KB | WV Board of Medicine | https://wvbom.wv.gov/Rosters.asp |

## How to reproduce

1. Clone this repo
2. Download the dataset files from the [Drive folder](https://drive.google.com/drive/folders/1POC7QWQ9XS_3DbMRG3KgGnfMm3b9tkW1) into the project root
3. `pip install pandas numpy plotly requests openpyxl`
4. Run each notebook top to bottom

## Workstream context

This is the Quality dimension of the Meroka treasure map. Each step produces a provider-level signal. Steps run independently but feed into the same composite score downstream. The safety gate (Step 1) is a hard pass/fail that covers LEIE, PECOS, and state board checks.
