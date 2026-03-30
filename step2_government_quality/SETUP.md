# Step 2: Government Quality Score (MIPS)

**Question:** Has the government independently assessed this provider's clinical quality?

**Output:** `step2_output_final.parquet` — 21 columns, one row per MA NPI (250,974 providers)

**Coverage:** 11.9% of MA providers have a government quality signal (3.0% direct MIPS + 8.9% hospital affiliation)

## How to run

1. Download the datasets listed below into `2_datasets/`
2. Open `step2_mips_quality_score.ipynb` and run all cells
3. Output saves to `2_datasets/step2_output_final.parquet`

## Datasets to download

| File | Source | Download |
|---|---|---|
| `ec_score_file.csv` | CMS QPP/MIPS Final Scores (PY 2023) | https://data.cms.gov/provider-data/dataset/a174-a962 |
| `npidata_pfile_*.csv` | NPPES NPI Registry (extract from ZIP) | https://download.cms.gov/nppes/NPI_Files.html |
| `Facility_Affiliation.csv` | CMS Facility Affiliations | https://data.cms.gov/provider-data/dataset/27ea-46a8 |
| `Hospital_General_Information.csv` | Hospital General Info | https://data.cms.gov/provider-data/dataset/xubh-q36u |
| `HCAHPS-Hospital.csv` | HCAHPS Patient Experience | https://data.cms.gov/provider-data/dataset/dgck-syfz |
| `Healthcare_Associated_Infections-Hospital.csv` | Healthcare-Associated Infections | https://data.cms.gov/provider-data/dataset/77hc-ibv8 |
| `Complications_and_Deaths-Hospital.csv` | Complications and Deaths | https://data.cms.gov/provider-data/dataset/ynj2-r877 |
| `Unplanned_Hospital_Visits-Hospital.csv` | Unplanned Hospital Visits | https://data.cms.gov/provider-data/dataset/632h-zaca |
| `hvbp_tps.csv` | HVBP Total Performance Score | https://data.cms.gov/provider-data/dataset/ypbt-wvdk |

All files are free CMS bulk downloads. No registration or fees.

## Output schema

| Group | Columns |
|---|---|
| Identity (6) | `npi`, `entity_type`, `provider_name`, `provider_state`, `provider_zip`, `taxonomy_code` |
| MIPS (5) | `mips_final_score`, `mips_quality_score`, `mips_cost_score`, `mips_ia_score`, `mips_pi_score` |
| Hospital (7) | `affiliated_hospital_ccn`, `affiliated_hospital_star_rating`, `affiliated_hospital_hvbp_score`, `affiliated_hospital_hcahps_rating`, `affiliated_hospital_infection_flags`, `affiliated_hospital_complication_flags`, `affiliated_hospital_readmission_flags` |
| Confidence (3) | `data_source_count` (0-2), `confidence_tier` (1-3), `confidence_tier_label` |

## Confidence tiers

| Tier | Label | Count | % | Composite action |
|---|---|---|---|---|
| 1 | government_assessed | 7,591 | 3.0% | Full weight. MIPS score passes through 0-100. |
| 2 | hospital_signal | 22,265 | 8.9% | Indirect signal. Partial weight or cross-reference only. |
| 3 | no_government_assessment | 221,118 | 88.1% | Redistribute weight to other dimensions. Not a penalty. |

## Composite layer guidance

See the final markdown cell in the notebook for full documentation. Key rules:
- Tier 1: MIPS score passes through at full weight
- Tier 2: hospital quality is context, not a direct provider score
- Tier 3: redistribute weight. NULL = no data, not bad data. Never penalize.
- For low MIPS scores (below 50): cross-reference Step 1 (safety gate) and Step 5 (patient experience) before penalizing
