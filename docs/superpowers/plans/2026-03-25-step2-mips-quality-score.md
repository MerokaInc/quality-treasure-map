# Step 2 — MIPS Quality Score: Implementation Plan (Steps 1-3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Jupyter notebook that loads, explores, and cleans CMS MIPS/QPP, Care Compare, Part B, and NPPES data for Massachusetts providers, producing a single per-NPI master table ready for business logic design.

**Architecture:** Single notebook (`step2_mips_quality_score.ipynb`) following the `/malpha-ds` pipeline pattern established in `step1_safety_gate.ipynb`. NPPES MA NPIs form the left side of the master table; QPP, Care Compare, and Part B are left-joined in. The notebook stops after cleaning — business logic (Step 4) is deferred until we explore the cleaned data.

**Tech Stack:** Python, Jupyter Notebook, pandas, numpy, plotly. DuckDB fallback if needed for large files.

**Spec:** `docs/superpowers/specs/2026-03-25-step2-government-quality-score-design.md`

**Pre-requisite:** User must download these 4 files and place them in the project root before running the notebook:

| Dataset | Expected filename(s) | Download from |
|---------|---------------------|---------------|
| QPP/MIPS Final Scores (2023) | `ec_score_file.csv` or similar | `https://data.cms.gov/provider-data/topics/doctors-clinicians` → QPP section |
| Care Compare Clinicians | `DAC_NationalDownloadableFile.csv` | Same page → Doctors and Clinicians section |
| Part B Utilization (2023) | `Medicare_Physician_Other_Practitioners_by_Provider_and_Service_2023.csv` or similar | `https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners` |
| NPPES Full Download | `npidata_pfile_*.csv` (inside ZIP) | `https://download.cms.gov/nppes/NPI_Files.html` |

---

## Task 1: Scaffold the notebook with markdown structure

**Files:**
- Create: `step2_mips_quality_score.ipynb`

- [ ] **Step 1: Create the notebook with all markdown section headers**

Create the notebook with these markdown cells (no code yet):

```markdown
# Step 2 — Government Quality Score (MIPS)

**Business question:** Given a list of Massachusetts provider NPIs, what is each provider's CMS MIPS quality score?

**Logic:** Pull QPP/MIPS final scores, enrich with Care Compare and Part B utilization data, and produce a clean per-NPI table. Business logic (three-situation classification) will be designed after exploring this data.

**Structural ceiling:** All CMS data is Medicare fee-for-service. Providers with mostly commercial patients will look thin in this data. This is a known limitation, not something we can engineer around.
```

```markdown
## Step 1 — Load Data

**What this does:** Load the four datasets needed for the MIPS quality score pipeline:
1. **QPP/MIPS Final Scores** — CMS's official quality assessment per provider
2. **Care Compare** — clinician-level enrichment (telehealth, affiliations)
3. **Part B Utilization** — billing volume and specialty data
4. **NPPES** — provider registry filtered to Massachusetts (our master NPI list)
```

```markdown
## Step 2 — Exploratory Data Analysis

**What this does:** Before cleaning or joining anything, understand what we're working with. Schema, shape, null rates, distributions, and key charts for each dataset.
```

```markdown
## Step 3 — Data Preprocessing & Cleaning

**What this does:** Harmonize NPIs, filter to MA, aggregate Part B to per-NPI, deduplicate, and build the master table via left joins.
```

```markdown
## Output Schema

One row per MA NPI. MIPS scores where available, Part B utilization summary, Care Compare enrichment. This table is the input for the business logic brainstorm (Step 4, to be designed).
```

- [ ] **Step 2: Verify notebook opens and renders in VS Code / Jupyter**

Open the notebook and confirm all markdown cells render correctly.

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "scaffold: Step 2 MIPS quality score notebook with section headers"
```

---

## Task 2: Load QPP/MIPS data

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 1)

- [ ] **Step 1: Write the imports and file detection cell**

```python
import pandas as pd
import numpy as np
import plotly.express as px
import os
import glob

# --- File detection ---
# QPP/MIPS: try known filename patterns
qpp_candidates = glob.glob("ec_score*.csv") + glob.glob("MIPS*2023*.csv") + glob.glob("*qpp*.csv") + glob.glob("*QPP*.csv")
if not qpp_candidates:
    raise FileNotFoundError(
        "QPP/MIPS file not found. Expected 'ec_score_file.csv' or 'MIPS_2023_PS_Public_Use_File.csv' in project root. "
        "Download from https://data.cms.gov/provider-data/topics/doctors-clinicians (QPP section)"
    )
qpp_file = qpp_candidates[0]
print(f"Using QPP file: {qpp_file}")
```

- [ ] **Step 2: Run the cell, confirm it finds the QPP file (or gives a clear error if not yet downloaded)**

Expected: either prints the filename or raises `FileNotFoundError` with download instructions.

- [ ] **Step 3: Write the QPP load cell**

```python
# Load QPP/MIPS final scores
qpp = pd.read_csv(qpp_file, dtype=str)
print(f"QPP/MIPS: {qpp.shape[0]:,} rows, {qpp.shape[1]} columns")
print(f"Columns: {list(qpp.columns)}")

# Sanity check: expect ~800k-1M rows nationally
if qpp.shape[0] < 500_000:
    print(f"⚠️ WARNING: Only {qpp.shape[0]:,} rows. Expected ~800k-1M. Check if this is the right file/year.")
elif qpp.shape[0] > 2_000_000:
    print(f"⚠️ WARNING: {qpp.shape[0]:,} rows is unusually high. May contain multiple years.")
else:
    print(f"✓ Row count looks reasonable for national MIPS data")
```

- [ ] **Step 4: Run and verify output**

Expected: prints shape, columns, and row count validation message.

- [ ] **Step 5: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load QPP/MIPS data with file detection and row count validation"
```

---

## Task 3: Load Care Compare data

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell under Step 1)

- [ ] **Step 1: Write the Care Compare load cell**

```python
# Load Care Compare clinician data
cc_candidates = glob.glob("DAC_National*.csv") + glob.glob("*care_compare*.csv") + glob.glob("*CareCompare*.csv")
if not cc_candidates:
    raise FileNotFoundError(
        "Care Compare file not found. Expected 'DAC_NationalDownloadableFile.csv' in project root. "
        "Download from https://data.cms.gov/provider-data/topics/doctors-clinicians"
    )
cc_file = cc_candidates[0]
print(f"Using Care Compare file: {cc_file}")

care_compare = pd.read_csv(cc_file, dtype=str)
print(f"Care Compare: {care_compare.shape[0]:,} rows, {care_compare.shape[1]} columns")
print(f"Columns: {list(care_compare.columns)}")
```

- [ ] **Step 2: Run and verify output**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load Care Compare clinician data"
```

---

## Task 4: Load Part B utilization data

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell under Step 1)

- [ ] **Step 1: Write the Part B load cell**

Part B is ~2GB+. Try normal load first, fall back to chunked if memory is an issue.

```python
# Load Medicare Part B utilization
partb_candidates = (
    glob.glob("Medicare_Physician*Provider_and_Service*2023*.csv")
    + glob.glob("Medicare_Physician*Provider_and_Service*.csv")
    + glob.glob("*partb*.csv")
)
if not partb_candidates:
    raise FileNotFoundError(
        "Part B file not found. Expected 'Medicare_Physician_Other_Practitioners_by_Provider_and_Service_2023.csv'. "
        "Download from https://data.cms.gov/provider-summary-by-type-of-service/"
    )
partb_file = partb_candidates[0]
print(f"Using Part B file: {partb_file}")
print(f"File size: {os.path.getsize(partb_file) / 1e9:.1f} GB")

# Try direct load; if OOM, we'll switch to chunked
partb = pd.read_csv(partb_file, dtype=str)
print(f"Part B: {partb.shape[0]:,} rows, {partb.shape[1]} columns")
print(f"Columns: {list(partb.columns)}")

# Sanity check
if partb.shape[0] < 5_000_000:
    print(f"⚠️ WARNING: Only {partb.shape[0]:,} rows. National Part B by-service typically has 9M+ rows.")
else:
    print(f"✓ Row count looks reasonable for national Part B data")
```

- [ ] **Step 2: Run and verify**

If this hits memory limits, replace with chunked loading that drops unnecessary columns:

```python
# Chunked fallback — reduce memory by selecting only needed columns
partb_usecols = [c for c in pd.read_csv(partb_file, nrows=0).columns
                 if any(kw in c.lower() for kw in ["npi", "hcpcs", "srvc", "bene", "chrg", "alowd", "amt", "type"])]
print(f"Loading Part B with {len(partb_usecols)} of {len(pd.read_csv(partb_file, nrows=0).columns)} columns")
partb = pd.read_csv(partb_file, dtype=str, usecols=partb_usecols)
```

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load Part B utilization data with size validation"
```

---

## Task 5: Load NPPES and filter to Massachusetts

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell under Step 1)

- [ ] **Step 1: Write the NPPES chunked load cell**

NPPES is ~8GB. Must chunk-load and filter to MA during read.

```python
# Load NPPES — chunked, filter to MA on the fly
nppes_candidates = glob.glob("npidata_pfile_*.csv")
if not nppes_candidates:
    raise FileNotFoundError(
        "NPPES file not found. Expected 'npidata_pfile_*.csv' in project root. "
        "Download from https://download.cms.gov/nppes/NPI_Files.html and extract the ZIP."
    )
nppes_file = nppes_candidates[0]
print(f"Using NPPES file: {nppes_file}")
print(f"File size: {os.path.getsize(nppes_file) / 1e9:.1f} GB")

# Key columns to keep (minimizes memory)
nppes_cols = [
    "NPI",
    "Entity Type Code",
    "Provider Last Name (Legal Name)",
    "Provider First Name",
    "Provider Credential Text",
    "Provider Business Practice Location Address State Name",
    "Provider Business Practice Location Address City Name",
    "Provider Business Practice Location Address Postal Code",
    "Healthcare Provider Taxonomy Code_1",
    "Provider Enumeration Date",
    "NPI Deactivation Date",
]

# Chunked load, filter to MA
ma_chunks = []
total_rows = 0
for chunk in pd.read_csv(nppes_file, dtype=str, usecols=nppes_cols, chunksize=50_000):
    total_rows += len(chunk)
    ma_chunk = chunk[
        chunk["Provider Business Practice Location Address State Name"].str.upper().str.strip().isin(["MA", "MASSACHUSETTS"])
    ]
    if len(ma_chunk) > 0:
        ma_chunks.append(ma_chunk)

nppes_ma = pd.concat(ma_chunks, ignore_index=True)
print(f"NPPES total rows processed: {total_rows:,}")
print(f"NPPES MA providers: {nppes_ma.shape[0]:,}")

# Sanity check: expect ~80k-120k MA NPIs
if nppes_ma.shape[0] < 30_000:
    print(f"⚠️ WARNING: Only {nppes_ma.shape[0]:,} MA NPIs. Expected ~80k-120k. Check filter column.")
elif nppes_ma.shape[0] > 200_000:
    print(f"⚠️ WARNING: {nppes_ma.shape[0]:,} MA NPIs is unusually high. Filter may not be working.")
else:
    print(f"✓ MA NPI count looks reasonable")
```

- [ ] **Step 2: Run and verify**

Expected: prints total rows (~7-8M nationally), MA count (~80-120k), and validation message. This cell will take a few minutes due to file size.

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: load NPPES with chunked MA filtering"
```

---

## Task 6: EDA — QPP/MIPS

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 2)

- [ ] **Step 1: Write QPP schema/stats cell**

```python
# --- QPP/MIPS EDA ---
print("=" * 60)
print("QPP/MIPS FINAL SCORES")
print("=" * 60)

print(f"\nShape: {qpp.shape}")
print(f"\nColumns: {list(qpp.columns)}")

print(f"\nNull rates:")
print((qpp.isnull().sum() / len(qpp) * 100).round(1).to_string())

print(f"\nData types:")
print(qpp.dtypes.to_string())

# Identify the score column(s) — name may vary
score_cols = [c for c in qpp.columns if "score" in c.lower() or "final" in c.lower()]
print(f"\nPotential score columns: {score_cols}")

# Identify NPI column
npi_col = [c for c in qpp.columns if c.upper() == "NPI"][0]
print(f"NPI column: {npi_col}")
print(f"Unique NPIs: {qpp[npi_col].nunique():,}")
```

- [ ] **Step 2: Run and verify output. Note the actual column names for score fields.**

- [ ] **Step 3: Write QPP visualization cell**

```python
# QPP visualizations
# NOTE: Update column names below based on actual schema from EDA above

# MIPS final score distribution
# Replace 'final_score_col' with actual column name
final_score_col = "PLACEHOLDER"  # <-- UPDATE after seeing schema
qpp_scores = pd.to_numeric(qpp[final_score_col], errors="coerce")

fig1 = px.histogram(
    qpp_scores.dropna(),
    nbins=50,
    title="QPP: MIPS Final Score Distribution (National)",
    labels={"value": "MIPS Final Score", "count": "Providers"},
)
fig1.show()

# Low volume flag rate (if column exists)
lv_col = [c for c in qpp.columns if "low" in c.lower() and "vol" in c.lower()]
if lv_col:
    fig2 = px.bar(
        qpp[lv_col[0]].value_counts().reset_index(),
        x=lv_col[0], y="count",
        title="QPP: Low Volume Flag Distribution",
    )
    fig2.show()
else:
    print("No low-volume flag column found in QPP data. Will infer from Part B.")

# Category score distributions
cat_cols = [c for c in qpp.columns if any(
    kw in c.lower() for kw in ["quality", "cost", "improvement", "interoperability", "promoting"]
) and "score" in c.lower()]
print(f"Category score columns found: {cat_cols}")

for col in cat_cols:
    vals = pd.to_numeric(qpp[col], errors="coerce").dropna()
    fig = px.histogram(vals, nbins=30, title=f"QPP: {col} Distribution")
    fig.show()
```

- [ ] **Step 4: Run. Update PLACEHOLDER column names based on actual schema. Re-run.**

- [ ] **Step 5: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: QPP/MIPS EDA with score distributions and low-volume flag"
```

---

## Task 7: EDA — Care Compare

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 2)

- [ ] **Step 1: Write Care Compare schema/stats cell**

```python
# --- Care Compare EDA ---
print("=" * 60)
print("CARE COMPARE — CLINICIAN DATA")
print("=" * 60)

print(f"\nShape: {care_compare.shape}")
print(f"\nColumns: {list(care_compare.columns)}")

print(f"\nNull rates:")
print((care_compare.isnull().sum() / len(care_compare) * 100).round(1).to_string())

print(f"\nData types:")
print(care_compare.dtypes.to_string())

print(f"\nUnique NPIs: {care_compare['NPI'].nunique():,}")
```

- [ ] **Step 2: Write Care Compare visualization cell**

```python
# Care Compare visualizations

# Telehealth flag (if column exists)
telehealth_cols = [c for c in care_compare.columns if "telehealth" in c.lower()]
if telehealth_cols:
    fig = px.bar(
        care_compare[telehealth_cols[0]].value_counts().reset_index(),
        x=telehealth_cols[0], y="count",
        title="Care Compare: Telehealth Flag Distribution",
    )
    fig.show()

# Facility affiliation count per NPI (if group/affiliation columns exist)
affil_cols = [c for c in care_compare.columns if "affil" in c.lower() or "hospital" in c.lower()]
print(f"Affiliation-related columns: {affil_cols}")

# Specialty distribution
spec_cols = [c for c in care_compare.columns if "spec" in c.lower() or "credential" in c.lower()]
if spec_cols:
    fig = px.bar(
        care_compare[spec_cols[0]].value_counts().head(15).reset_index(),
        x=spec_cols[0], y="count",
        title=f"Care Compare: Top 15 {spec_cols[0]}",
    )
    fig.update_layout(xaxis_tickangle=-45)
    fig.show()
```

- [ ] **Step 3: Run and verify**

- [ ] **Step 4: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Care Compare EDA"
```

---

## Task 8: EDA — Part B Utilization

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 2)

- [ ] **Step 1: Write Part B schema/stats cell**

```python
# --- Part B EDA ---
print("=" * 60)
print("MEDICARE PART B UTILIZATION")
print("=" * 60)

print(f"\nShape: {partb.shape}")
print(f"\nColumns: {list(partb.columns)}")

print(f"\nNull rates (top 20 by null %):")
null_rates = (partb.isnull().sum() / len(partb) * 100).round(1).sort_values(ascending=False)
print(null_rates.head(20).to_string())

print(f"\nData types:")
print(partb.dtypes.to_string())

# Identify key columns
npi_col_partb = [c for c in partb.columns if "npi" in c.lower()][0]
print(f"\nNPI column: {npi_col_partb}")
print(f"Unique NPIs: {partb[npi_col_partb].nunique():,}")

# Identify charge/payment columns
charge_cols = [c for c in partb.columns if any(kw in c.lower() for kw in ["chrg", "charge", "pay", "alowd", "amt"])]
print(f"Charge/payment columns: {charge_cols}")

# Identify beneficiary columns
bene_cols = [c for c in partb.columns if "bene" in c.lower()]
print(f"Beneficiary columns: {bene_cols}")

# Identify service columns
svc_cols = [c for c in partb.columns if "srvc" in c.lower() or "hcpcs" in c.lower()]
print(f"Service columns: {svc_cols}")
```

- [ ] **Step 2: Write Part B visualization cell**

```python
# Part B visualizations

# Top specialties by claim count
spec_col = [c for c in partb.columns if "type" in c.lower() and "prvdr" in c.lower()]
if spec_col:
    fig = px.bar(
        partb[spec_col[0]].value_counts().head(15).reset_index(),
        x=spec_col[0], y="count",
        title="Part B: Top 15 Specialties by Claim Lines",
    )
    fig.update_layout(xaxis_tickangle=-45)
    fig.show()

# Total charges distribution per NPI (sample to avoid OOM on plotting)
if charge_cols:
    charge_col = charge_cols[0]
    npi_charges = partb.groupby(npi_col_partb)[charge_col].apply(
        lambda x: pd.to_numeric(x, errors="coerce").sum()
    ).reset_index(name="total_charges")

    fig = px.histogram(
        npi_charges["total_charges"].clip(upper=npi_charges["total_charges"].quantile(0.99)),
        nbins=50,
        title=f"Part B: Total Charges per NPI (clipped at 99th percentile)",
    )
    fig.show()

    print(f"Charge stats per NPI:")
    print(npi_charges["total_charges"].describe())
```

- [ ] **Step 3: Run and verify**

- [ ] **Step 4: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Part B utilization EDA"
```

---

## Task 9: EDA — NPPES (MA)

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 2)

- [ ] **Step 1: Write NPPES MA schema/stats cell**

```python
# --- NPPES (MA) EDA ---
print("=" * 60)
print("NPPES — MASSACHUSETTS PROVIDERS")
print("=" * 60)

print(f"\nShape: {nppes_ma.shape}")
print(f"\nColumns: {list(nppes_ma.columns)}")

print(f"\nNull rates:")
print((nppes_ma.isnull().sum() / len(nppes_ma) * 100).round(1).to_string())

print(f"\nEntity Type Code distribution:")
print(nppes_ma["Entity Type Code"].value_counts().to_string())

print(f"\nUnique NPIs: {nppes_ma['NPI'].nunique():,}")

# Check for deactivated NPIs
deactivated = nppes_ma["NPI Deactivation Date"].notna().sum()
print(f"\nDeactivated NPIs: {deactivated:,} ({deactivated/len(nppes_ma)*100:.1f}%)")
```

- [ ] **Step 2: Write NPPES MA visualization cell**

```python
# NPPES MA visualizations

# Provider type (Entity Type 1=Individual, 2=Organization)
fig = px.bar(
    nppes_ma["Entity Type Code"].value_counts().reset_index(),
    x="Entity Type Code", y="count",
    title="NPPES MA: Entity Type (1=Individual, 2=Organization)",
)
fig.show()

# Top taxonomy codes (proxy for specialty)
fig = px.bar(
    nppes_ma["Healthcare Provider Taxonomy Code_1"].value_counts().head(20).reset_index(),
    x="Healthcare Provider Taxonomy Code_1", y="count",
    title="NPPES MA: Top 20 Taxonomy Codes",
)
fig.update_layout(xaxis_tickangle=-45)
fig.show()

# City distribution
fig = px.bar(
    nppes_ma["Provider Business Practice Location Address City Name"].value_counts().head(20).reset_index(),
    x="Provider Business Practice Location Address City Name", y="count",
    title="NPPES MA: Top 20 Cities",
)
fig.update_layout(xaxis_tickangle=-45)
fig.show()

# ZIP code distribution
zip_counts = nppes_ma["Provider Business Practice Location Address Postal Code"].str[:5].value_counts().head(25)
fig = px.bar(
    zip_counts.reset_index(),
    x="Provider Business Practice Location Address Postal Code", y="count",
    title="NPPES MA: Top 25 ZIP Codes",
)
fig.update_layout(xaxis_tickangle=-45)
fig.show()
```

- [ ] **Step 3: Run and verify**

- [ ] **Step 4: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: NPPES MA EDA with entity types, taxonomy, and geography"
```

---

## Task 10: Cleaning — NPI harmonization

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 3)

- [ ] **Step 1: Write the NPI harmonization cell**

```python
# --- Step 3: Data Preprocessing & Cleaning ---

# 1. NPI harmonization across all datasets
def clean_npi(df, npi_col="NPI"):
    """Strip whitespace, cast to string, validate 10-digit format."""
    df[npi_col] = df[npi_col].astype(str).str.strip()
    valid_mask = df[npi_col].str.match(r"^\d{10}$")
    invalid_count = (~valid_mask).sum()
    if invalid_count > 0:
        print(f"  ⚠️ {invalid_count:,} invalid NPIs removed (not 10 digits)")
        df = df[valid_mask].copy()
    return df

print("NPI harmonization:")

print(f"\nNPPES MA: {len(nppes_ma):,} rows before")
nppes_ma = clean_npi(nppes_ma)
print(f"  → {len(nppes_ma):,} rows after")

# NOTE: Update npi_col names below based on actual column names found in EDA
print(f"\nQPP: {len(qpp):,} rows before")
qpp = clean_npi(qpp, npi_col="NPI")  # <-- UPDATE column name if different
print(f"  → {len(qpp):,} rows after")

print(f"\nCare Compare: {len(care_compare):,} rows before")
care_compare = clean_npi(care_compare, npi_col="NPI")
print(f"  → {len(care_compare):,} rows after")

print(f"\nPart B: {len(partb):,} rows before")
partb = clean_npi(partb, npi_col="Rndrng_NPI")  # <-- UPDATE column name if different
print(f"  → {len(partb):,} rows after")
```

- [ ] **Step 2: Run. Update column names if they differ from expected. Re-run.**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: NPI harmonization across all four datasets"
```

---

## Task 11: Cleaning — QPP score parsing and deduplication

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 3)

- [ ] **Step 1: Write QPP cleaning cell**

```python
# 3. QPP cleaning — parse scores and deduplicate
# NOTE: Update column names based on actual schema from EDA

# Parse MIPS final score to numeric
# Replace column names with actual ones found in EDA
final_score_col = "PLACEHOLDER"  # <-- UPDATE
qpp["mips_final_score"] = pd.to_numeric(qpp[final_score_col], errors="coerce")

# Parse category scores (update column names)
category_mapping = {
    # "actual_col_name": "clean_name",
    # "PLACEHOLDER_quality": "quality_score",
    # "PLACEHOLDER_cost": "cost_score",
    # "PLACEHOLDER_ia": "improvement_activities_score",
    # "PLACEHOLDER_pi": "promoting_interoperability_score",
}
for orig_col, clean_name in category_mapping.items():
    qpp[clean_name] = pd.to_numeric(qpp[orig_col], errors="coerce")

# Check for low-volume flag column
lv_cols = [c for c in qpp.columns if "low" in c.lower() and "vol" in c.lower()]
if lv_cols:
    print(f"Low-volume flag column found: {lv_cols[0]}")
    qpp["low_volume_flag"] = qpp[lv_cols[0]].str.strip().str.upper().isin(["Y", "YES", "TRUE", "1"])
else:
    print("No low-volume flag in QPP. Will infer from Part B billing volume.")
    qpp["low_volume_flag"] = None

print(f"\nMIPS final score stats:")
print(qpp["mips_final_score"].describe())

# 6. Deduplication — keep highest MIPS score per NPI
# Trade-off: biases upward. A provider under two TINs may have different scores.
# For MVP we accept this and document it.
npi_col_qpp = "NPI"  # <-- UPDATE if different
dupes = qpp[npi_col_qpp].duplicated().sum()
print(f"\nDuplicate NPIs in QPP: {dupes:,}")
if dupes > 0:
    qpp = qpp.sort_values("mips_final_score", ascending=False).drop_duplicates(subset=npi_col_qpp, keep="first")
    print(f"After dedup (kept highest score): {len(qpp):,} rows")
```

- [ ] **Step 2: Run. Fill in actual column names from EDA. Re-run.**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: QPP score parsing and deduplication (highest score per NPI)"
```

---

## Task 12: Cleaning — Part B aggregation

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell under Step 3)

- [ ] **Step 1: Write Part B aggregation cell**

```python
# 4. Part B aggregation — per-NPI summary
# NOTE: Update column names based on actual schema from EDA

npi_col_partb = "Rndrng_NPI"  # <-- UPDATE if different

# Convert numeric columns
numeric_cols_map = {
    # "actual_col": "clean_name"
    # "Tot_Srvcs": "total_services",
    # "Tot_Benes": "total_beneficiaries",
    # "Tot_Sbmtd_Chrg": "total_submitted_charges",
    # "Tot_Mdcr_Alowd_Amt": "total_medicare_allowed",
}
for orig, clean in numeric_cols_map.items():
    partb[clean] = pd.to_numeric(partb[orig], errors="coerce")

# Aggregate to per-NPI
partb_agg = partb.groupby(npi_col_partb).agg(
    total_services=("total_services", "sum"),
    total_beneficiaries=("total_beneficiaries", "max"),  # max not sum: Tot_Benes is per-service-line, summing double-counts
    total_submitted_charges=("total_submitted_charges", "sum"),
    total_medicare_allowed=("total_medicare_allowed", "sum"),
    distinct_hcpcs=("HCPCS_Cd", "nunique"),  # <-- UPDATE col name
    primary_specialty=("Rndrng_Prvdr_Type", lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else None),  # <-- UPDATE
).reset_index()

partb_agg = partb_agg.rename(columns={npi_col_partb: "NPI"})

print(f"Part B aggregated: {len(partb_agg):,} unique NPIs")
print(f"\nPer-NPI stats:")
print(partb_agg[["total_services", "total_beneficiaries", "total_submitted_charges"]].describe())
```

- [ ] **Step 2: Run. Fill in actual column names. Re-run.**

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: Part B per-NPI aggregation"
```

---

## Task 13: Cleaning — Care Compare dedup and build master table

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cells under Step 3)

- [ ] **Step 1: Write Care Compare dedup cell**

```python
# 5. Care Compare cleaning — deduplicate to one row per NPI
# 6. Deduplication for Care Compare
# Per spec: keep all facility affiliations as a list, deduplicate NPI-level record

cc_dupes = care_compare["NPI"].duplicated().sum()
print(f"Duplicate NPIs in Care Compare: {cc_dupes:,}")

if cc_dupes > 0:
    # Identify affiliation/hospital columns to aggregate as lists
    affil_cols = [c for c in care_compare.columns if "affil" in c.lower() or "hospital" in c.lower() or "org" in c.lower()]
    print(f"Affiliation columns to aggregate: {affil_cols}")

    # For affiliation columns: aggregate as comma-separated list
    # For other columns: keep first value
    agg_dict = {}
    for col in care_compare.columns:
        if col == "NPI":
            continue
        elif col in affil_cols:
            agg_dict[col] = lambda x: "; ".join(x.dropna().unique())
        else:
            agg_dict[col] = "first"

    care_compare_dedup = care_compare.groupby("NPI").agg(agg_dict).reset_index()
    print(f"After dedup (affiliations aggregated): {len(care_compare_dedup):,} rows")
else:
    care_compare_dedup = care_compare
```

- [ ] **Step 2: Write master table build cell**

```python
# 7. Build master table — NPPES MA left-joined with everything
master = nppes_ma[["NPI", "Entity Type Code", "Provider Last Name (Legal Name)",
                    "Provider First Name", "Provider Credential Text",
                    "Provider Business Practice Location Address City Name",
                    "Provider Business Practice Location Address Postal Code",
                    "Healthcare Provider Taxonomy Code_1"]].copy()

print(f"Master table start: {len(master):,} MA NPIs")

# Left join QPP
qpp_cols_to_join = ["NPI", "mips_final_score", "low_volume_flag"]
# Add category score columns if they exist
for col in ["quality_score", "cost_score", "improvement_activities_score", "promoting_interoperability_score"]:
    if col in qpp.columns:
        qpp_cols_to_join.append(col)

master = master.merge(qpp[qpp_cols_to_join], on="NPI", how="left")
qpp_matched = master["mips_final_score"].notna().sum()
print(f"QPP matched: {qpp_matched:,} / {len(master):,} ({qpp_matched/len(master)*100:.1f}%)")

# Left join Part B
master = master.merge(partb_agg, on="NPI", how="left")
partb_matched = master["total_services"].notna().sum()
print(f"Part B matched: {partb_matched:,} / {len(master):,} ({partb_matched/len(master)*100:.1f}%)")

# Left join Care Compare (select useful columns — update based on EDA)
cc_join_cols = ["NPI"]  # <-- ADD telehealth, affiliation columns found in EDA
master = master.merge(care_compare_dedup[cc_join_cols], on="NPI", how="left")

# Validate: row count should match NPPES MA
assert len(master) == len(nppes_ma), (
    f"Master table has {len(master):,} rows but NPPES MA has {len(nppes_ma):,}. "
    "Left join should preserve all NPPES rows. Check for duplicate NPIs in join sources."
)
print(f"\n✓ Master table: {len(master):,} rows (matches NPPES MA count)")

# Summary
print(f"\nColumn summary:")
print(master.dtypes.to_string())
print(f"\nNull rates:")
print((master.isnull().sum() / len(master) * 100).round(1).sort_values(ascending=False).to_string())
```

- [ ] **Step 3: Run and verify**

Expected: master table row count matches NPPES MA count. QPP match rate will likely be 15-25% (most MA providers won't have MIPS scores).

- [ ] **Step 4: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: build master table with left joins from QPP, Part B, Care Compare"
```

---

## Task 14: Output summary and save checkpoint

**Files:**
- Modify: `step2_mips_quality_score.ipynb` (add code cell under Output Schema section)

- [ ] **Step 1: Write the output summary and checkpoint save cell**

```python
# --- Output: Master table summary ---
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
print(f"\n  NPIs with Part B data: {has_partb:,} ({has_partb/len(master)*100:.1f}%)")

# Save checkpoint for brainstorming
master.to_csv("step2_master_table_checkpoint.csv", index=False)
master.to_parquet("step2_master_table_checkpoint.parquet", index=False)
print(f"\n✓ Checkpoint saved: step2_master_table_checkpoint.csv and .parquet")
print(f"  This table is the input for the three-situation classification brainstorm.")
```

- [ ] **Step 2: Run and verify files are created**

```bash
ls -la step2_master_table_checkpoint.*
```

- [ ] **Step 3: Commit**

```bash
git add step2_mips_quality_score.ipynb
git commit -m "feat: save master table checkpoint for business logic brainstorm"
```

- [ ] **Step 4: Update .gitignore for Step 2 data files**

Add to `.gitignore`:

```
# Step 2 data files
ec_score_file*.csv
MIPS_*Public_Use*.csv
*qpp*.csv
DAC_National*.csv
Medicare_Physician_Other_Practitioners*.csv
npidata_pfile_*.csv
step2_master_table_checkpoint.*
```

- [ ] **Step 5: Commit .gitignore update**

```bash
git add .gitignore
git commit -m "chore: add Step 2 data files to .gitignore"
```

---

## Checkpoint: Ready for Business Logic Brainstorm

After Task 14, the notebook is complete through Step 3. The master table is saved as a checkpoint.

**Next steps:**
1. Open the notebook and review the EDA outputs together
2. Look at MIPS score distributions, match rates, low-volume patterns
3. Design the three-situation classification logic based on what the data actually shows
4. Add that design to the spec, then build Step 4
