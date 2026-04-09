# Edge Case Catalog

Providers whose scores are unexpected — either high-quality providers scoring low, or concerning providers scoring high. Each entry documents what happened and whether the methodology needs adjustment.

## Template

| NPI | Specialty | Expected Score | Actual Score | Why the Discrepancy | Methodology Issue? | Action Taken |
|-----|-----------|---------------|--------------|--------------------|--------------------|-------------|

## Known Edge Cases to Test

1. **WV provider with disciplinary flag + high MIPS score** — Safety gate should catch them, but does MIPS give a misleading signal?
2. **Medicaid-only pediatrician** — Payer diversity will penalize; this is structural, not quality
3. **Rural solo practitioner** — Thin data across all dimensions; should score "insufficient data" not "low"
4. **High-volume urban practice** — Should score well on most dimensions; validates the happy path
5. **Subspecialist billing under general taxonomy code** — Peer comparison will flag as atypical; need subspecialist detection
6. **Provider who recently got board certified** — Credentials dimension should update; tests enrichment flow
7. **Safety-net clinic / FQHC** — Single-payer Medicaid by mission; payer diversity should not penalize
8. **Provider with 50 total services** — At minimum threshold; scores should be flagged as low confidence
9. **OB-GYN with Medicare-only billing data** — Billing quality score based on tiny, skewed sample
10. **Provider in Medicaid managed care state** — May not appear in T-MSIS file despite serving Medicaid patients

## Findings

*To be populated after running validation notebook against real data.*

## Resolution Log

| Date | Edge Case # | Resolution | Score Change? | Methodology Update? |
|------|------------|------------|--------------|-------------------|
