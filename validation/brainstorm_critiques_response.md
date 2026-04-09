# Brainstorm Critiques & Responses

Every critique raised during brainstorming about the scoring methodology, documented with severity, response, and action items. This is a living document — update as new critiques surface or actions are completed.

---

## Step 2 (MIPS) Critiques

| Critique | Severity | Response | Action |
|----------|----------|----------|--------|
| 88% of providers have no MIPS data | Critical | Expected for indie practices. Weight redistribution handles this. | Validate redistribution doesn't distort composite. |
| MIPS scores cluster high (median 91.4, 72% >85) | High | Minimal differentiation. MIPS is a "government endorsement badge," not a differentiator. | Consider downweighting from 20% to 5-10%. Document as Tier 1 confidence only. |
| Hospital affiliation is guilt-by-proximity | Medium | Acknowledged. Tier 2 signal only. | Keep as cross-reference, do not use as primary score input. |

---

## Step 3 (Utilization) Critiques

| Critique | Severity | Response | Action |
|----------|----------|----------|--------|
| Only 19% of pediatric guidelines scorable | Critical | Honest limitation of public data. | Rename "Guideline Concordance" to "Guideline Proxy" or "Measurable Guideline Adherence." Add prominent caveat. |
| OB-GYN billing quality is Medicare-only for Medicaid-dominant specialty | Critical | Medicare slice is small and skewed for OB. | Flag OB-GYN billing quality as low-confidence. Consider reduced weight for specialties with <20% Medicare representation. |
| Payer diversity can't measure payer diversity (no Medicaid code-level data) | Critical | Metric measures CMS file presence, not true diversity. | Rename or restructure. Consider dropping or converting to binary signal. |
| All thresholds are arbitrary | High | No outcome validation for any threshold. | Run sensitivity analysis. Document thresholds as "initial defaults pending validation." |
| Medicaid T-MSIS data is operationally fragile | High | Already went temporarily unavailable. | Build fallback logic. Document data dependency risk. |
| Peer comparison is circular | Medium | Conformity ≠ quality. But no better anchor available from public data. | Document limitation. Add guideline concordance as the "should" counterweight to peer comparison's "does." |
| Neutral scores mask gaps | Medium | Score of 50 for "no data" = same as 25th percentile provider who tries. | Consider three-state output: scored / insufficient data / not applicable. Don't collapse into a number. |
