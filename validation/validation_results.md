# Score Validation Results

## Status: PENDING
## Date: [to be filled when validation runs]
## Dataset: [CMS release year, states covered]

---

### Face Validity

- [ ] High-scoring providers look right on manual review
- [ ] Low-scoring providers have identifiable issues
- [ ] Safety gate failures don't have high composite scores
- [ ] Known-disciplined providers (WV board data) score appropriately
- [ ] MIPS Tier 1 providers show reasonable composite scores
- [ ] Providers with thin data are flagged, not penalized

### Sensitivity Analysis

- [ ] Composite rank order is stable across ±10% weight changes
- [ ] No single dimension dominates the composite inappropriately
- [ ] Weight redistribution (for missing dimensions) doesn't create artifacts
- [ ] Dimension weights are documented with rationale

### Edge Cases

- [ ] Edge case catalog populated with ≥10 real providers
- [ ] Each edge case has a documented resolution
- [ ] Methodology adjustments (if any) are documented and versioned
- [ ] Subspecialist handling validated

### Caveats for Disclosure (must be finalized before external launch)

- [ ] "What we can't measure" list is complete
- [ ] Confidence tier for each dimension is documented
- [ ] Rename decisions for misleading dimension names are made
  - [ ] "Guideline Concordance" → "Measurable Guideline Adherence" (or similar)
  - [ ] "Payer Diversity" → "Payer Presence" (or similar)
- [ ] Commercial insurance blind spot is prominently disclosed
- [ ] Medicaid data limitations (no code-level detail) are disclosed
- [ ] All threshold values labeled as "initial defaults pending outcome validation"

### Sign-off

- [ ] Data science team has reviewed all findings
- [ ] Clara has reviewed ERISA implications of disclosed caveats
- [ ] Edge case resolutions approved by team lead
- [ ] Methodology version bumped if any scoring logic changed
