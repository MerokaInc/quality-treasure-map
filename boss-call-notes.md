# Quality Scoring: How the Two Approaches Connect

Notes for call with boss, March 2026

---

## The short version

I looked at your provider report mockup and mapped every data point in it against our treasure map. The good news: there's no gap in what data we're pulling. The difference is how we present it. Your mockup scores by clinical bundle (Maternity 71, GYN Surgery 83). Our pipeline scores by NPI. I've added a step that bridges the two so we can do both.

---

## What your mockup uses and where it lives in our pipeline

| Data in the mockup | Our step |
|---|---|
| Board cert, med school, residency, publications, hospital affiliation | Step 2, Credentials (NPPES, ABMS, PECOS) |
| 2018 malpractice flag (fetal monitoring) | Step 1, Safety gate (NPDB) |
| 5.0 stars, 1,396 Press Ganey reviews | Step 3, Patient experience (Google, Healthgrades) |
| Practice locations (Princeton WV, Wytheville VA) | Step 4, Access (onboarding + NPPES) |
| "Lab over-ordering" flag, procedure volumes | **New Step 5b, CMS utilization & bundles** |
| "Pre-claims estimate" label | Step 6 placeholder, confirms claims data isn't needed yet |

Everything in your mockup fits within our existing dimensions. No new data sources required beyond what we already planned.

---

## The one thing I added: Step 5b

Your mockup does something our original plan didn't: it scores by clinical bundle, not just by NPI. That's the key difference and it's what makes the report useful to an employer. "This provider is strong for GYN surgery but flagged for maternity" is a much better signal than "this provider is a 77."

To make that work, I added Step 5b: CMS Utilization & Bundle Scoring.

What it does:
- Pulls per-NPI procedure-level data from **Medicare Provider Utilization** files and **Medicaid Provider Spending** (T-MSIS, covers FFS + managed care + CHIP, 2018-2024)
- Maps CPT codes to clinical bundles per specialty (maternity, GYN surgery, preventive, etc.)
- Flags cost patterns vs. peers (lab over-ordering, billing outliers)
- Uses procedure volume as a confidence signal per bundle

This is what lets us go from "one composite score" to "score sliced by clinical service line," which is exactly what your mockup shows.

Weight: 15%, taken from Step 6 (clinical outcomes) which is unweighted until we have employer claims data flowing.

---

## How the "hard problem" fits

The hard problem is claims-based episode grouping: linking individual claim lines into complete care episodes, then scoring outcomes per episode. That's real, it's defensible, and it's what makes Meroka's data asset unique long-term.

But your own mockup proves we don't need to solve it first. It says "pre-claims estimate" on every score. The bundle-level framing works now with public CMS utilization data. Claims-based scoring layers on top when we have live employer contracts.

The sequence:
1. **Now (30 days):** Steps 1-4 deliver the provider profile (credentials, safety, reviews, access)
2. **60 days:** Steps 5 + 5b add MIPS scores and utilization-based bundle scoring. Composite v1 with bundle-level slicing
3. **When claims flow:** Step 6 replaces the "pre-claims estimate" with real outcome data per bundle. That's when we solve the hard problem for real

We're not skipping the hard problem. We're sequencing to it. The pipeline is designed so claims scoring drops into the same bundle structure we're building now.

---

## The Medicaid angle

One data source I found that strengthens this: the **Medicaid Provider Spending dataset** from HHS Open Data (T-MSIS). It gives us provider-level spending by procedure code for Medicaid FFS, managed care, and CHIP, going back to 2018.

This matters because the biggest caveat with CMS data is that it's Medicare-only. Providers who mostly see commercially insured or Medicaid patients look thin. Adding Medicaid utilization data gives us a much fuller picture, especially for OB/GYN, pediatrics, and primary care where Medicaid is a huge share of patients.

One flag: the dataset is currently listed as "temporarily unavailable" on the HHS portal. We can start with Medicare-only and add Medicaid when it comes back online.

---

## What I need from you

- Does the bundle taxonomy per specialty need to come from us, or do you have a view on how bundles should be defined? Right now the plan is Antoine + Othmane + Clara jointly.
- How granular do we go? Top 3-5 bundles per specialty to start, or comprehensive?
- The composite weights are 25/25/20/15/15. Do we validate against employer priorities before shipping, or ship and adjust?
