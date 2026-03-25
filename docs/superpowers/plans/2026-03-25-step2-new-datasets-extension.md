# Step 2 — New Dataset Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Step 2 notebook with Part D Prescriber, Hospital Quality, and Open Payments data, loading/cleaning/joining each to the existing master table to increase coverage beyond the 6.4% who have MIPS scores.

**Architecture:** Add new load, EDA, and cleaning cells to the existing `step2_mips_quality_score.ipynb`. Each data source gets loaded, explored, cleaned, and joined to the master table via left join on NPI (Part D, Open Payments) or via facility affiliation crosswalk (Hospital Quality). The master table checkpoint is re-saved with all new columns.

**Tech Stack:** Python, Jupyter Notebook, pandas, numpy, plotly. Chunked loading for Open Payments (~8GB).

**Existing notebook:** `step2_mips_quality_score.ipynb` — 23 cells (cells 0-22). New cells insert into existing sections.

**Data files (in `2_datasets/`):**

| Dataset | Filename | Size | NPI Column | Join Strategy |
|---|---|---|---|---|
| Part D Prescriber | `MUP_DPR_RY25_P04_V10_DY23_NPI.csv` | ~583MB | `PRSCRBR_NPI` | Direct left join to master on NPI |
| Hospital General Info | `Hospital_General_Information.csv` | ~1.5MB | `Facility ID` | Join to hospitals, then attribute to providers via Care Compare `org_pac_id`/`Facility Name` |
| HCAHPS | `HCAHPS-Hospital.csv` | ~105MB | `Facility ID` | Same facility crosswalk |
| Healthcare-Associated Infections | `Healthcare_Associated_Infections-Hospital.csv` | ~39MB | `Facility ID` | Same facility crosswalk |
| Complications and Deaths | `Complications_and_Deaths-Hospital.csv` | ~23MB | `Facility ID` | Same facility crosswalk |
| Unplanned Hospital Visits | `Unplanned_Hospital_Visits-Hospital.csv` | ~19MB | `Facility ID` | Same facility crosswalk |
| HVBP Total Performance Score | `hvbp_tps.csv` | ~568KB | `Facility ID` | Same facility crosswalk |
| Open Payments | `OP_DTL_GNRL_PGYR2023_P01302025_01212025.csv` | ~8.2GB | `Covered_Recipient_NPI` | Direct left join to master on NPI (chunked aggregation) |

**Hospital Quality attribution strategy:** Care Compare has `Facility Name` and `org_pac_id` per provider NPI. Hospital files have `Facility ID` and `Facility Name`. We need to build a crosswalk: NPI → Care Compare facility → Hospital Quality `Facility ID`. The join key is `Facility Name` (fuzzy) or we use the separate CMS Facility Affiliations file (which maps individual NPI to CCN/Facility ID). Since we already loaded Care Compare with facility info, we'll match on facility name + state as the crosswalk.

---

## Task 1: Load Part D Prescriber data

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell after cell 6, the NPPES load)

- [ ] **Step 1: Add Part D load cell after the NPPES load cell**

Insert after cell 6 (NPPES load), before cell 7 (EDA markdown):

```python
# Load Medicare Part D Prescriber data (by Provider, 2023)
partd_candidates = glob.glob("2_datasets/MUP_DPR*DY23*NPI*.csv")
if not partd_candidates:
    raise FileNotFoundError(
        "Part D Prescriber file not found. Expected 'MUP_DPR_RY25_P04_V10_DY23_NPI.csv' in 2_datasets/. "
        "Download from https://data.cms.gov/provider-summary-by-type-of-service/medicare-part-d-prescribers"
    )
partd_file = partd_candidates[0]
print(f"Using Part D file: {partd_file}")

# Load with key columns only
partd_usecols = [
    "PRSCRBR_NPI", "Prscrbr_Last_Org_Name", "Prscrbr_First_Name",
    "Prscrbr_Type", "Prscrbr_State_Abrvtn",
    "Tot_Clms", "Tot_30day_Fills", "Tot_Drug_Cst", "Tot_Day_Suply", "Tot_Benes",
    "Brnd_Tot_Clms", "Brnd_Tot_Drug_Cst", "Gnrc_Tot_Clms", "Gnrc_Tot_Drug_Cst",
    "Opioid_Tot_Clms", "Opioid_Tot_Drug_Cst", "Opioid_Prscrbr_Rate",
    "Opioid_LA_Tot_Clms", "Opioid_LA_Prscrbr_Rate",
    "Antbtc_Tot_Clms", "Antbtc_Tot_Drug_Cst",
    "Bene_Avg_Age", "Bene_Avg_Risk_Scre",
]
partd = pd.read_csv(partd_file, dtype=str, usecols=partd_usecols)
print(f"Part D: {partd.shape[0]:,} rows, {partd.shape[1]} columns")

if partd.shape[0] < 800_000:
    print(f"WARNING: Only {partd.shape[0]:,} rows. Expected ~1.1M+.")
else:
    print(f"Row count looks reasonable")
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load Part D prescriber data with key columns"
```

---

## Task 2: Load Hospital Quality files

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell after Part D load)

- [ ] **Step 1: Add Hospital Quality load cell**

```python
# Load Hospital Quality files (all keyed by Facility ID)
hosp_general = pd.read_csv("2_datasets/Hospital_General_Information.csv", dtype=str)
print(f"Hospital General Info: {hosp_general.shape[0]:,} rows")

hcahps = pd.read_csv("2_datasets/HCAHPS-Hospital.csv", dtype=str)
print(f"HCAHPS: {hcahps.shape[0]:,} rows")

infections = pd.read_csv("2_datasets/Healthcare_Associated_Infections-Hospital.csv", dtype=str)
print(f"Infections: {infections.shape[0]:,} rows")

complications = pd.read_csv("2_datasets/Complications_and_Deaths-Hospital.csv", dtype=str)
print(f"Complications: {complications.shape[0]:,} rows")

readmissions = pd.read_csv("2_datasets/Unplanned_Hospital_Visits-Hospital.csv", dtype=str)
print(f"Readmissions: {readmissions.shape[0]:,} rows")

hvbp = pd.read_csv("2_datasets/hvbp_tps.csv", dtype=str)
print(f"HVBP TPS: {hvbp.shape[0]:,} rows")

# Build a single hospital quality summary: one row per Facility ID
# Hospital General: overall star rating
hosp_summary = hosp_general[["Facility ID", "Facility Name", "State", "Hospital overall rating", "Hospital Type", "Hospital Ownership"]].copy()
hosp_summary = hosp_summary.rename(columns={"Hospital overall rating": "hospital_star_rating"})
print(f"\nHospital summary: {len(hosp_summary):,} facilities")
print(f"Star rating distribution:")
print(hosp_summary["hospital_star_rating"].value_counts().sort_index().to_string())

# HVBP: Total Performance Score
hvbp_scores = hvbp[["Facility ID", "Total Performance Score"]].copy()
hvbp_scores = hvbp_scores.rename(columns={"Total Performance Score": "hvbp_total_score"})
hosp_summary = hosp_summary.merge(hvbp_scores, on="Facility ID", how="left")

# HCAHPS: pivot to get overall hospital rating star
hcahps_overall = hcahps[hcahps["HCAHPS Measure ID"] == "H_STAR_RATING"][
    ["Facility ID", "Patient Survey Star Rating"]
].copy()
hcahps_overall = hcahps_overall.rename(columns={"Patient Survey Star Rating": "hcahps_star_rating"})
hosp_summary = hosp_summary.merge(hcahps_overall, on="Facility ID", how="left")

# Infections: count of "Worse than National" measures
inf_worse = infections[infections["Compared to National"] == "Worse than the National Benchmark"]
inf_worse_count = inf_worse.groupby("Facility ID").size().reset_index(name="infection_measures_worse_than_national")
hosp_summary = hosp_summary.merge(inf_worse_count, on="Facility ID", how="left")
hosp_summary["infection_measures_worse_than_national"] = hosp_summary["infection_measures_worse_than_national"].fillna(0)

# Complications: count of "Worse than National" measures
comp_worse = complications[complications["Compared to National"] == "Worse than the National Rate"]
comp_worse_count = comp_worse.groupby("Facility ID").size().reset_index(name="complication_measures_worse_than_national")
hosp_summary = hosp_summary.merge(comp_worse_count, on="Facility ID", how="left")
hosp_summary["complication_measures_worse_than_national"] = hosp_summary["complication_measures_worse_than_national"].fillna(0)

# Readmissions: count of "Worse than National" measures
readm_worse = readmissions[readmissions["Compared to National"] == "Worse than the National Rate"]
readm_worse_count = readm_worse.groupby("Facility ID").size().reset_index(name="readmission_measures_worse_than_national")
hosp_summary = hosp_summary.merge(readm_worse_count, on="Facility ID", how="left")
hosp_summary["readmission_measures_worse_than_national"] = hosp_summary["readmission_measures_worse_than_national"].fillna(0)

print(f"\nFinal hospital summary: {len(hosp_summary):,} facilities, {hosp_summary.shape[1]} columns")
print(f"Columns: {list(hosp_summary.columns)}")
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load and summarize hospital quality files into per-facility table"
```

---

## Task 3: Load Open Payments data (chunked)

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell after Hospital Quality load)

- [ ] **Step 1: Add Open Payments chunked load cell**

```python
# Load Open Payments (General Payments, 2023) — ~8GB, chunked aggregation
op_file = "2_datasets/OP_DTL_GNRL_PGYR2023_P01302025_01212025.csv"
if not os.path.exists(op_file):
    raise FileNotFoundError(f"Open Payments file not found at {op_file}")
print(f"Using Open Payments file: {op_file}")
print(f"File size: {os.path.getsize(op_file) / 1e9:.1f} GB")

# Aggregate on the fly: sum payments per NPI
# Only need NPI and payment amount — skip the 89 other columns
op_usecols = [
    "Covered_Recipient_NPI",
    "Total_Amount_of_Payment_USDollars",
    "Nature_of_Payment_or_Transfer_of_Value",
    "Covered_Recipient_Type",
]

print("Aggregating Open Payments per NPI (this takes a few minutes)...")
op_agg = {}  # NPI -> {total_payments, payment_count, nature_counts}
total_rows = 0
for chunk in pd.read_csv(op_file, dtype=str, usecols=op_usecols, chunksize=100_000):
    total_rows += len(chunk)
    chunk["_amount"] = pd.to_numeric(chunk["Total_Amount_of_Payment_USDollars"], errors="coerce")

    for npi, grp in chunk.groupby("Covered_Recipient_NPI"):
        if pd.isna(npi) or npi == "":
            continue
        if npi not in op_agg:
            op_agg[npi] = {"total_payment_amount": 0, "payment_count": 0, "food_bev_count": 0, "consulting_count": 0}
        op_agg[npi]["total_payment_amount"] += grp["_amount"].sum()
        op_agg[npi]["payment_count"] += len(grp)
        op_agg[npi]["food_bev_count"] += (grp["Nature_of_Payment_or_Transfer_of_Value"] == "Food and Beverage").sum()
        op_agg[npi]["consulting_count"] += (grp["Nature_of_Payment_or_Transfer_of_Value"].str.contains("Consulting", case=False, na=False)).sum()

open_payments = pd.DataFrame.from_dict(op_agg, orient="index")
open_payments.index.name = "NPI"
open_payments = open_payments.reset_index()

print(f"Open Payments rows processed: {total_rows:,}")
print(f"Unique NPIs with payments: {len(open_payments):,}")
print(f"\nPayment stats:")
print(open_payments["total_payment_amount"].describe().to_string())
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load and aggregate Open Payments per NPI (chunked)"
```

---

## Task 4: EDA — Part D Prescriber

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells in EDA section)

- [ ] **Step 1: Add Part D EDA stats cell**

Insert after the existing NPPES EDA cells (after cell 15), before the Step 3 Cleaning markdown:

```python
# --- Part D Prescriber EDA ---
print("=" * 60)
print("MEDICARE PART D PRESCRIBER")
print("=" * 60)

print(f"\nShape: {partd.shape}")
print(f"\nColumns: {list(partd.columns)}")

print(f"\nNull rates:")
print((partd.isnull().sum() / len(partd) * 100).round(1).to_string())

print(f"\nUnique NPIs: {partd['PRSCRBR_NPI'].nunique():,}")

# Key stats
for col in ["Tot_Clms", "Tot_Drug_Cst", "Tot_Benes", "Opioid_Prscrbr_Rate"]:
    vals = pd.to_numeric(partd[col], errors="coerce")
    print(f"\n{col}:")
    print(vals.describe().to_string())
```

- [ ] **Step 2: Add Part D EDA visualization cell**

```python
# Part D visualizations

# Top prescriber types
fig = px.bar(
    partd["Prscrbr_Type"].value_counts().head(15).reset_index(),
    x="Prscrbr_Type", y="count",
    title="Part D: Top 15 Prescriber Types",
)
fig.update_layout(xaxis_tickangle=-45)
fig.show()

# Total drug cost per NPI distribution
drug_cost = pd.to_numeric(partd["Tot_Drug_Cst"], errors="coerce")
fig = px.histogram(
    drug_cost.clip(upper=drug_cost.quantile(0.99)),
    nbins=50,
    title="Part D: Total Drug Cost per NPI (clipped at 99th pctile)",
)
fig.show()

# Opioid prescribing rate distribution
opioid_rate = pd.to_numeric(partd["Opioid_Prscrbr_Rate"], errors="coerce").dropna()
fig = px.histogram(
    opioid_rate,
    nbins=50,
    title="Part D: Opioid Prescribing Rate Distribution",
)
fig.show()
```

- [ ] **Step 3: Run and verify**

- [ ] **Step 4: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Part D prescriber EDA"
```

---

## Task 5: EDA — Hospital Quality Summary

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells in EDA section)

- [ ] **Step 1: Add Hospital Quality EDA cell**

```python
# --- Hospital Quality EDA ---
print("=" * 60)
print("HOSPITAL QUALITY SUMMARY")
print("=" * 60)

print(f"\nShape: {hosp_summary.shape}")
print(f"\nNull rates:")
print((hosp_summary.isnull().sum() / len(hosp_summary) * 100).round(1).to_string())

# Star rating distribution
fig = px.bar(
    hosp_summary["hospital_star_rating"].value_counts().sort_index().reset_index(),
    x="hospital_star_rating", y="count",
    title="Hospital Overall Star Rating Distribution",
)
fig.show()

# HVBP TPS distribution
hvbp_vals = pd.to_numeric(hosp_summary["hvbp_total_score"], errors="coerce").dropna()
fig = px.histogram(hvbp_vals, nbins=30, title="HVBP Total Performance Score Distribution")
fig.show()

# "Worse than national" counts
for col in ["infection_measures_worse_than_national", "complication_measures_worse_than_national", "readmission_measures_worse_than_national"]:
    vals = pd.to_numeric(hosp_summary[col], errors="coerce")
    print(f"\n{col}:")
    print(vals.describe().to_string())
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Hospital Quality summary EDA"
```

---

## Task 6: EDA — Open Payments

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells in EDA section)

- [ ] **Step 1: Add Open Payments EDA cell**

```python
# --- Open Payments EDA ---
print("=" * 60)
print("OPEN PAYMENTS (GENERAL PAYMENTS)")
print("=" * 60)

print(f"\nShape: {open_payments.shape}")
print(f"\nPayment amount stats:")
print(open_payments["total_payment_amount"].describe().to_string())

print(f"\nPayment count stats:")
print(open_payments["payment_count"].describe().to_string())

# Payment amount distribution (clipped)
fig = px.histogram(
    open_payments["total_payment_amount"].clip(upper=open_payments["total_payment_amount"].quantile(0.99)),
    nbins=50,
    title="Open Payments: Total Payment per NPI (clipped at 99th pctile)",
)
fig.show()

# Food & beverage vs consulting counts
print(f"\nFood & beverage payments: {open_payments['food_bev_count'].sum():,.0f} total across {(open_payments['food_bev_count'] > 0).sum():,} NPIs")
print(f"Consulting payments: {open_payments['consulting_count'].sum():,.0f} total across {(open_payments['consulting_count'] > 0).sum():,} NPIs")
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Open Payments EDA"
```

---

## Task 7: Clean Part D and join to master

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells in cleaning section)

- [ ] **Step 1: Add Part D cleaning and aggregation cell**

Insert after existing cleaning cells (after QPP dedup, Part B agg cells), before the master table build cell:

```python
# Part D cleaning — NPI harmonization and aggregation
partd = clean_npi(partd, npi_col="PRSCRBR_NPI")

# Convert key columns to numeric
for col in ["Tot_Clms", "Tot_30day_Fills", "Tot_Drug_Cst", "Tot_Day_Suply", "Tot_Benes",
            "Brnd_Tot_Clms", "Brnd_Tot_Drug_Cst", "Gnrc_Tot_Clms", "Gnrc_Tot_Drug_Cst",
            "Opioid_Tot_Clms", "Opioid_Prscrbr_Rate", "Opioid_LA_Prscrbr_Rate",
            "Antbtc_Tot_Clms", "Bene_Avg_Age", "Bene_Avg_Risk_Scre"]:
    partd[col] = pd.to_numeric(partd[col], errors="coerce")

# Part D is already one row per NPI — check for dupes
partd_dupes = partd["PRSCRBR_NPI"].duplicated().sum()
print(f"Part D duplicate NPIs: {partd_dupes:,}")
if partd_dupes > 0:
    partd = partd.drop_duplicates(subset="PRSCRBR_NPI", keep="first")

# Compute derived columns
partd["brand_pct"] = (partd["Brnd_Tot_Clms"] / partd["Tot_Clms"] * 100).round(1)
partd["opioid_pct"] = (partd["Opioid_Tot_Clms"] / partd["Tot_Clms"] * 100).round(1)

# Select columns for master join
partd_for_join = partd[["PRSCRBR_NPI", "Tot_Clms", "Tot_Drug_Cst", "Tot_Benes",
                         "brand_pct", "opioid_pct", "Opioid_Prscrbr_Rate",
                         "Bene_Avg_Age", "Bene_Avg_Risk_Scre"]].copy()
partd_for_join = partd_for_join.rename(columns={
    "PRSCRBR_NPI": "NPI",
    "Tot_Clms": "partd_total_claims",
    "Tot_Drug_Cst": "partd_total_drug_cost",
    "Tot_Benes": "partd_total_beneficiaries",
    "brand_pct": "partd_brand_pct",
    "opioid_pct": "partd_opioid_pct",
    "Opioid_Prscrbr_Rate": "partd_opioid_rate",
    "Bene_Avg_Age": "partd_bene_avg_age",
    "Bene_Avg_Risk_Scre": "partd_bene_avg_risk",
})

print(f"Part D ready for join: {len(partd_for_join):,} NPIs")
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Part D cleaning and column selection for master join"
```

---

## Task 8: Build hospital-to-provider crosswalk and clean Open Payments

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells in cleaning section)

- [ ] **Step 1: Add hospital crosswalk cell**

```python
# Hospital Quality attribution: map hospital scores to provider NPIs
# Strategy: Care Compare has Facility Name per NPI. Hospital files have Facility ID + Facility Name.
# Join on Facility Name + State to create NPI -> hospital quality mapping.

# Get unique facility names from Care Compare (already deduped)
cc_facilities = care_compare_dedup[care_compare_dedup["Facility Name"].notna()][
    ["NPI", "Facility Name"]
].copy()
cc_facilities["Facility Name"] = cc_facilities["Facility Name"].str.strip().str.upper()
print(f"Care Compare NPIs with facility affiliation: {len(cc_facilities):,}")

# Normalize hospital summary facility names for matching
hosp_summary["_facility_name_upper"] = hosp_summary["Facility Name"].str.strip().str.upper()

# Join: CC facility name -> hospital summary
cc_with_hospital = cc_facilities.merge(
    hosp_summary[["_facility_name_upper", "Facility ID", "hospital_star_rating", "hvbp_total_score",
                   "hcahps_star_rating", "infection_measures_worse_than_national",
                   "complication_measures_worse_than_national", "readmission_measures_worse_than_national"]],
    left_on="Facility Name",
    right_on="_facility_name_upper",
    how="left"
).drop(columns=["_facility_name_upper", "Facility Name"])

matched = cc_with_hospital["hospital_star_rating"].notna().sum()
print(f"NPIs matched to a hospital: {matched:,} of {len(cc_with_hospital):,} ({matched/len(cc_with_hospital)*100:.1f}%)")

# Deduplicate: if an NPI matched multiple hospitals, keep the first
cc_with_hospital = cc_with_hospital.drop_duplicates(subset="NPI", keep="first")

# Rename for master join
hosp_for_join = cc_with_hospital.rename(columns={
    "Facility ID": "affiliated_hospital_id",
    "hospital_star_rating": "affiliated_hospital_star_rating",
    "hvbp_total_score": "affiliated_hospital_hvbp_score",
    "hcahps_star_rating": "affiliated_hospital_hcahps_rating",
    "infection_measures_worse_than_national": "affiliated_hospital_infection_flags",
    "complication_measures_worse_than_national": "affiliated_hospital_complication_flags",
    "readmission_measures_worse_than_national": "affiliated_hospital_readmission_flags",
})

print(f"Hospital attribution ready for join: {len(hosp_for_join):,} NPIs")
```

- [ ] **Step 2: Add Open Payments cleaning cell**

```python
# Open Payments cleaning — NPI harmonization
open_payments["NPI"] = open_payments["NPI"].astype(str).str.strip()
valid_mask = open_payments["NPI"].str.match(r"^\d{10}$")
invalid = (~valid_mask).sum()
if invalid > 0:
    print(f"Open Payments: {invalid:,} invalid NPIs removed")
    open_payments = open_payments[valid_mask].copy()

# Rename for master join
op_for_join = open_payments.rename(columns={
    "total_payment_amount": "open_payments_total",
    "payment_count": "open_payments_count",
    "food_bev_count": "open_payments_food_bev_count",
    "consulting_count": "open_payments_consulting_count",
})

print(f"Open Payments ready for join: {len(op_for_join):,} NPIs")
```

- [ ] **Step 3: Run and verify**

- [ ] **Step 4: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: hospital crosswalk and Open Payments cleaning"
```

---

## Task 9: Update master table build to include new sources

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (update the master table build cell)

- [ ] **Step 1: Update the master table build cell to add the 3 new left joins**

Add these joins AFTER the existing Care Compare join, BEFORE the assert:

```python
# Left join Part D
master = master.merge(partd_for_join, on="NPI", how="left")
partd_matched = master["partd_total_claims"].notna().sum()
print(f"Part D matched: {partd_matched:,} / {len(master):,} ({partd_matched/len(master)*100:.1f}%)")

# Left join Hospital Quality (via facility affiliation)
master = master.merge(hosp_for_join, on="NPI", how="left")
hosp_matched = master["affiliated_hospital_star_rating"].notna().sum()
print(f"Hospital Quality matched: {hosp_matched:,} / {len(master):,} ({hosp_matched/len(master)*100:.1f}%)")

# Left join Open Payments
master = master.merge(op_for_join, on="NPI", how="left")
op_matched = master["open_payments_total"].notna().sum()
print(f"Open Payments matched: {op_matched:,} / {len(master):,} ({op_matched/len(master)*100:.1f}%)")
```

Also update the assert and summary prints to reflect new column count.

- [ ] **Step 2: Run and verify**

Expected: master table still has same row count as NPPES MA (250,974). New match rates will show how much coverage we gained.

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: join Part D, Hospital Quality, and Open Payments to master table"
```

---

## Task 10: Update output summary and re-save checkpoint

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (update the output summary cell)

- [ ] **Step 1: Update the output summary cell to include new data sources**

Replace the existing output cell with:

```python
# --- Output: Master table summary (with all data sources) ---
print("=" * 60)
print("MASTER TABLE — READY FOR BUSINESS LOGIC BRAINSTORM")
print("=" * 60)

print(f"\nShape: {master.shape}")
print(f"\nKey stats:")
has_mips = master["mips_final_score"].notna().sum()
no_mips = master["mips_final_score"].isna().sum()
print(f"  NPIs with MIPS score: {has_mips:,} ({has_mips/len(master)*100:.1f}%)")
print(f"  NPIs without MIPS score: {no_mips:,} ({no_mips/len(master)*100:.1f}%)")

if has_mips > 0:
    print(f"\n  MIPS score distribution (scored providers only):")
    print(f"  {master['mips_final_score'].dropna().describe().to_string()}")

has_partb = master["total_services"].notna().sum()
has_cc = master["pri_spec"].notna().sum()
has_partd = master["partd_total_claims"].notna().sum()
has_hosp = master["affiliated_hospital_star_rating"].notna().sum()
has_op = master["open_payments_total"].notna().sum()

print(f"\n  Data source coverage:")
print(f"  MIPS score:        {has_mips:>8,} ({has_mips/len(master)*100:>5.1f}%)")
print(f"  Part B:            {has_partb:>8,} ({has_partb/len(master)*100:>5.1f}%)")
print(f"  Care Compare:      {has_cc:>8,} ({has_cc/len(master)*100:>5.1f}%)")
print(f"  Part D:            {has_partd:>8,} ({has_partd/len(master)*100:>5.1f}%)")
print(f"  Hospital Quality:  {has_hosp:>8,} ({has_hosp/len(master)*100:>5.1f}%)")
print(f"  Open Payments:     {has_op:>8,} ({has_op/len(master)*100:>5.1f}%)")

# Coverage: any data at all
has_any = master[
    (master["mips_final_score"].notna()) |
    (master["total_services"].notna()) |
    (master["pri_spec"].notna()) |
    (master["partd_total_claims"].notna()) |
    (master["affiliated_hospital_star_rating"].notna()) |
    (master["open_payments_total"].notna())
]
truly_dark = len(master) - len(has_any)
print(f"\n  NPIs with ANY data: {len(has_any):,} ({len(has_any)/len(master)*100:.1f}%)")
print(f"  Truly dark (no data): {truly_dark:,} ({truly_dark/len(master)*100:.1f}%)")

# Save updated checkpoint
master.to_csv("2_datasets/step2_master_table_checkpoint.csv", index=False)
master.to_parquet("2_datasets/step2_master_table_checkpoint.parquet", index=False)
print(f"\nCheckpoint saved to 2_datasets/step2_master_table_checkpoint.csv and .parquet")
print(f"Total columns: {master.shape[1]}")
```

- [ ] **Step 2: Run and verify**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: updated output summary with all 7 data sources and coverage stats"
```

---

## Checkpoint: Extended Master Table Complete

After Task 10, the master table includes data from all 7 sources. The coverage stats will show how much we improved from 6.4% (MIPS only) to the combined coverage across all sources.

**Next step:** Design business logic based on the full coverage picture.
