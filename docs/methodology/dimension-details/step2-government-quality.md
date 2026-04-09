# Step 2: Government Quality (MIPS)

**Weight in composite:** 20% (when Tier 1 or Tier 2 data is present; redistributes to other dimensions for Tier 3)
**Confidence Tier:** High for Tier 1 (direct MIPS score). Low-to-none for Tier 3 (no government data).

*Return to [How Meroka Scores Providers](../quality-scoring-methodology.md)*

---

## What This Dimension Measures

Step 2 answers: has the federal government independently assessed this provider's clinical quality?

If yes — and that assessment exists — it is one of the strongest signals in our composite. MIPS (the Merit-based Incentive Payment System) is CMS's mandatory quality reporting program for Medicare providers above volume thresholds. It evaluates performance across four categories: clinical quality, cost, improvement activities, and promoting interoperability. The government runs this program at scale, and the resulting scores are independently verified.

If no government assessment exists — which is the case for the large majority of providers — Step 2 contributes nothing to the composite. The weight redistributes. The absence of a MIPS score does not mean the provider is low quality. It means they practice outside Medicare's visibility window.

---

## Data Sources

| Source | What It Gives Us | National Row Count | Access |
|--------|-----------------|-------------------|--------|
| CMS QPP/MIPS Final Scores (PY 2023) | MIPS final score plus category scores (quality, cost, improvement activities, promoting interoperability) per NPI | 541,334 scored providers | CMS bulk download, free |
| CMS Facility Affiliations | NPI-to-hospital CCN crosswalk | 1,623,829 records | CMS bulk download, free |
| Hospital General Information | Overall star rating (1-5), hospital type, ownership | 5,426 hospitals | CMS bulk download, free |
| HVBP Total Performance Score | Hospital Value-Based Purchasing composite | ~2,500 hospitals | CMS bulk download, free |
| HCAHPS | Patient experience star rating at hospital level | ~4,800 hospitals | CMS bulk download, free |
| Healthcare-Associated Infections | Infection rates vs. national benchmark | ~4,800 hospitals | CMS bulk download, free |
| Complications and Deaths | Mortality and complication rates vs. national | ~4,800 hospitals | CMS bulk download, free |
| Unplanned Hospital Visits | Readmission rates vs. national | ~4,800 hospitals | CMS bulk download, free |
| NPPES NPI Registry | Provider identity layer, specialty, and state filtering | 9.4M nationally | CMS bulk download, free |

---

## How the Score Is Calculated

Step 2 assigns every provider to one of three confidence tiers based on what government data is available.

| Tier | Label | Prevalence (MA, 2023) | What the composite does |
|------|-------|----------------------|------------------------|
| Tier 1 | Government-assessed | ~3% of providers | Full weight. MIPS final score passes through at 0-100. |
| Tier 2 | Hospital affiliation signal | ~9% of providers | Indirect signal from affiliated hospital's quality ratings. Partial weight or cross-reference only. |
| Tier 3 | No government assessment | ~88% of providers | No government data. Step 2 weight redistributes to other dimensions. Not a penalty. |

**Tier 1 — Direct MIPS score:** The provider's MIPS final score (0-100) passes through directly. Among MA physicians (MD/DO only), 11.1% have MIPS scores. Among all provider types, 3%. For low MIPS scores (below 50), the composite cross-references Step 1 (safety gate) and patient experience before applying a penalty. A low MIPS score combined with a clean safety record and positive patient reviews typically reflects administrative burden or reporting complexity, not poor clinical care.

**Tier 2 — Hospital affiliation signal:** The provider is not MIPS-scored but is affiliated with a hospital that has CMS quality ratings. Hospital quality is inferred from star rating, HVBP performance, HCAHPS patient experience, and any infection/complication/readmission flags worse than the national benchmark. This signal is indirect — being affiliated with a high-rated hospital does not make a provider high-quality — and is used conservatively. When a provider has multiple hospital affiliations, we keep the best-rated one.

**Tier 3 — No government assessment:** No MIPS score, no qualifying hospital affiliation. The Step 2 dimension is null. The composite redistributes its 20% weight proportionally across the other scored dimensions. This tier applies to the vast majority of providers and is entirely expected.

---

## What This Dimension Catches

- Government-validated clinical quality performance for Medicare fee-for-service providers in MIPS
- Participation in quality improvement activities (MIPS improvement activities category)
- Technology adoption for care coordination (MIPS promoting interoperability category)
- Indirect hospital quality signals via affiliation when direct MIPS data is unavailable
- Hospital-level infection, complication, and readmission flags worse than national benchmarks

---

## Known Limitations

**Only 3% of providers have direct MIPS scores.** MIPS applies to Medicare fee-for-service providers above volume thresholds (generally 200+ Medicare patients and $90,000+ in Medicare revenue). Providers below these thresholds are excluded from the program. Commercially focused practices, smaller independent practices, and many specialists fall below MIPS thresholds entirely.

**MIPS covers only Medicare fee-for-service.** A physician whose patients are primarily commercially insured appears as Tier 3 regardless of their actual clinical quality. This is a structural limitation of the underlying program, not a flaw in our implementation. We document it here so users understand that Tier 3 assignment is often a reflection of patient mix, not quality.

**MIPS scores cluster high.** Among providers who do have MIPS scores, the distribution is not a normal bell curve. The median score in MA is 91.4 out of 100, and 72% of scored providers fall above 85. This clustering reflects the fact that providers who participate in MIPS have strong incentive to score well (MIPS affects Medicare payment rates). Differentiation at the top end is limited. The more informative signal is often who has a score versus who doesn't, rather than small differences within the scored population.

**Hospital affiliation is an indirect quality signal.** Tier 2 uses hospital quality ratings as a proxy for affiliated physician quality. The relationship is real but imperfect. A provider can be affiliated with a high-performing hospital while practicing below their peers. This signal is used conservatively and clearly labeled as an indirect inference.

**Hospital data is hospital-level, not specialty-level.** HVBP, HCAHPS, and infection/complication/readmission metrics reflect the performance of the entire hospital, not specific departments or providers within it. A surgeon's quality at a hospital with good nursing ratios but a challenging surgical complication profile may be mis-characterized in either direction.

---

## Confidence Tier

**High when Tier 1 (direct MIPS score).** The data comes directly from CMS, is independently collected, and directly measures the quality dimension we are claiming to assess.

**Moderate when Tier 2 (hospital affiliation signal).** Hospital quality is real signal, but the relationship between hospital quality and individual provider quality is indirect.

**Low-to-none when Tier 3 (no government data).** No score is produced. The weight redistributes. Users should treat this as an information gap, not a quality finding.
