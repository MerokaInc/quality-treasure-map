# Step 2 — Government Quality Score (MIPS): Design Spec

**Date:** 2026-03-25
**Status:** Sections 1-3 approved. Section 4 (business logic) deferred until data exploration.
**Author:** Antoine Bertrand
**Notebook:** `step2_mips_quality_score.ipynb`

---

## Problem Statement

Pull CMS MIPS/QPP final scores for Massachusetts providers and produce a per-NPI quality assessment. This is the only federal data source where the government has independently evaluated a provider's clinical quality. Weight: 20% of composite score.

The three-situation classification logic (strong score / no score / low score) will be designed after exploring the cleaned data. This spec covers data acquisition through cleaning only.

---

## Data Sources (2023 Performance Year)

| # | Dataset | Landing Page | Expected Filename | NPI Column | Est. Size |
|---|---------|-------------|-------------------|------------|-----------|
| 1 | QPP/MIPS Final Scores | `https://data.cms.gov/provider-data/topics/doctors-clinicians` (QPP section) | `ec_score_file.csv` or `MIPS_2023_PS_Public_Use_File.csv` | `npi` or `NPI` | ~500MB |
| 2 | Care Compare — Clinician Data | `https://data.cms.gov/provider-data/topics/doctors-clinicians` | `DAC_NationalDownloadableFile.csv` | `NPI` | ~200MB |
| 3 | Medicare Part B Utilization (by Provider and Service) | `https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners/medicare-physician-other-practitioners-by-provider-and-service` | `Medicare_Physician_Other_Practitioners_by_Provider_and_Service_2023.csv` | `Rndrng_NPI` | ~2GB+ |
| 4 | NPPES NPI Registry | `https://download.cms.gov/nppes/NPI_Files.html` | ZIP contains CSV like `npidata_pfile_20050523-YYYYMMDD.csv` | `NPI` | ~8GB full |

**Note on filenames:** CMS periodically changes naming conventions. The notebook's load step should attempt known filename patterns and fail loudly if none match, rather than silently loading the wrong file.

**Year alignment:** QPP 2023 performance year scores + Part B 2023 utilization data + most recent NPPES full replacement file. NPPES is a rolling snapshot with no year filter — it will include providers who weren't active in 2023. This is intentional: we want the full MA provider universe so that providers without Medicare activity correctly fall into Situation 2 (no score). The "no MIPS score" population will be larger than the "actively practicing in 2023" population, and that's expected.

---

## Expected Row Counts

Rough estimates to sanity-check the pipeline at each stage:

| Stage | Expected rows | Red flag if... |
|-------|--------------|----------------|
| NPPES filtered to MA | ~80k-120k NPIs | < 30k (filter bug) or > 200k (didn't filter) |
| QPP/MIPS national file | ~800k-1M rows | significantly fewer (wrong file or year) |
| QPP matched to MA NPIs | ~15k-30k | < 5k (join key mismatch) or > 50k (dedup issue) |
| Part B matched to MA NPIs | ~20k-40k | similar thresholds |
| Final master table | ~80k-120k (same as NPPES MA) | should match NPPES MA count exactly since it's a left join |

These are estimates. The notebook should print actual counts at each stage and flag if they fall outside these ranges.

---

## Tech Stack

Per `/malpha-ds` skill: Python, Jupyter Notebook, pandas, numpy, plotly. DuckDB fallback if any file exceeds ~10GB.

---

## Pipeline (follows `/malpha-ds` step naming)

### Step 1 — Load Data

- Detect CSV format and load each dataset from project root
- QPP: try known filename patterns (`ec_score_file.csv`, `MIPS_2023_PS_Public_Use_File.csv`); raise clear error if neither found
- NPPES (~8GB): chunk-load and filter to MA immediately using `Provider Business Practice Location Address State Name` column (NOT mailing address). Don't hold full file in memory
- Part B (~2GB): may need chunked loading depending on available RAM
- Care Compare should fit in memory

### Step 2 — EDA

For each dataset, produce:
- Schema (column names), shape, null rates, dtypes

Key Plotly visualizations:

| Dataset | Charts |
|---------|--------|
| QPP/MIPS | MIPS final score distribution (histogram), category score distributions (quality, cost, IA, PI), low-volume flag rate (bar chart with counts) |
| Care Compare | Telehealth flag rates (bar), facility affiliation count per NPI (histogram), distinct procedure count per NPI (histogram) |
| Part B | Total charges per NPI (histogram), top 15 specialties by claim count (bar), average charge per service distribution (histogram) |
| NPPES (MA) | Provider type breakdown (bar), top specialties (bar), ZIP code distribution across MA (bar or map) |

### Step 3 — Data Preprocessing & Cleaning

Execute in this order:

1. **NPI harmonization** — Strip whitespace, cast to string, validate 10-digit format across all four datasets
2. **Filter NPPES to MA** — Use `Provider Business Practice Location Address State Name` = "MA" (or "Massachusetts") to build the MA NPI master list. Print count and validate against expected range (~80k-120k)
3. **QPP cleaning** — Parse category scores (quality, cost, improvement activities, promoting interoperability) into separate numeric columns. Check whether a `low_volume_flag` column exists in the QPP data; if not, we'll infer it from Part B in the join step
4. **Part B aggregation** — Filter to 2023 records, aggregate to per-NPI level using these columns: `Tot_Srvcs` (total services), `Tot_Benes` (total unique beneficiaries), `Tot_Sbmtd_Chrg` (total submitted charges), `Tot_Mdcr_Alowd_Amt` (total Medicare allowed amount), distinct `HCPCS_Cd` count, primary specialty from `Rndrng_Prvdr_Type` (mode). Exact column names to be confirmed against the actual file header during load.
5. **Care Compare cleaning** — Select columns for deferred Step 4 enrichment: telehealth flag, facility affiliations, procedure indicators. These are not used in Sections 1-3 but are loaded now so the master table is ready for the business logic brainstorm. They may inform how we handle Situation 3 (cross-referencing context for low-score providers).
6. **Deduplication** — Check for and handle duplicate NPIs in QPP and Care Compare (providers may appear under multiple TINs). Strategy for QPP: keep the row with the highest MIPS score. **Trade-off acknowledged:** this biases upward. A provider under two TINs may have different scores reflecting different practice contexts. For the MVP, we accept this bias and document it. A future iteration could weight by patient volume under each TIN. For Care Compare: deduplicate to one row per NPI, keeping all facility affiliations as a list.
7. **Build master table** — Start from NPPES MA NPIs (left side). Left join QPP on NPI, left join Part B aggregates on NPI, left join Care Compare on NPI. Every MA provider gets a row whether or not they have MIPS data. Final row count should match NPPES MA count.

### Output of Step 3

A single clean DataFrame: one row per MA NPI, with MIPS scores (where available), Part B utilization summary, and Care Compare enrichment. This table is the input for the business logic brainstorm.

---

## What Comes Next (Not Yet Designed)

### Step 4 — Core Transformation (deferred)

After building through Step 3, we pause to explore the cleaned data together:
- What do the MIPS score distributions actually look like for MA?
- What % of MA providers have no MIPS score?
- Where do natural breakpoints fall in the score distribution?
- What does the low-volume population look like?

These observations will drive the three-situation classification thresholds and the dimension score mapping. That design will be added to this spec before building Step 4.

### Step 5 — Proof of Correctness (deferred)

Per `/malpha-ds` skill: smoke test validating the final output. Will be designed alongside Step 4.

### Step 6 — README (deferred)

Per `/malpha-ds` skill: README.md with dataset download links, source URLs, and reproduction instructions. Will be written after the full notebook is complete.

### Step 7 — Push to GitHub

Commit and push to a feature branch (e.g., `ds/step2-mips-quality-score`).

---

## Structural Ceiling

All CMS data is Medicare fee-for-service. Providers with mostly commercial patients will look thin in this data. This is a known limitation, not something we can engineer around. The notebook should document this transparently.

---

## Eng Handoff

**After Steps 1-3:** Clean per-NPI master DataFrame for MA with MIPS scores, Part B utilization, and Care Compare enrichment. No classification logic yet.

**After full notebook (Steps 1-5):** NPI-level QPP score, threshold flag, three-situation classification, and documented rules. Output as CSV/parquet, one row per NPI.

---

## Naming Note

Existing `step2_wv_board_disciplinary.ipynb` covers WV state board checks. This was originally "Step 2" under a previous numbering scheme; after the step renumber, state board work is part of Step 1 (safety gate). That notebook should be renamed in a separate cleanup task. This new notebook is named `step2_mips_quality_score.ipynb` to reflect the current step numbering.
