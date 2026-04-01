# Otolaryngology Payer Diversity Score: A Sub-Treasure Map

## What This Document Does

This score answers one question: **Is this ENT provider's practice pattern consistent across Medicare and Medicaid?** We measure both-payer code overlap -- the fraction of the provider's total HCPCS code repertoire that appears in both CMS files rather than just one. ENT is one of the specialties where meaningful dual-payer volume is genuinely expected: elderly patients need hearing aids, cancer workups, and sinus procedures, while children need ear tubes, tonsillectomies, and hearing evaluations. A provider who bills dramatically different code sets to each payer -- or who only appears in one file when their peers appear in both -- warrants a closer look. The result is a 0-100 score where higher means more cross-payer consistency. Single-payer providers are flagged and down-weighted, not penalized.

---

# PART A: WHAT WE HAVE

---

## The Free Data We Need

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes and service counts per NPI for Medicare population | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes and service counts per NPI for Medicaid population | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes, practice location, entity type | Weekly updates |

**Why ENT has a dual-payer story worth measuring:** Medicare patients bring hearing loss, head/neck cancer, chronic sinusitis, and vertigo. Medicaid patients bring pediatric ear tubes, tonsillectomy, ear infections, and hearing evaluation. Unlike pediatrics (Medicaid-dominant) or geriatrics (Medicare-dominant), ENT sees **significant volume from both payers**, making payer diversity a more informative signal here than for many other specialties.

---

# PART B: THE LOGIC

---

## 1. The Metric: Both-Payer Code Overlap

For a given NPI, collect the set of distinct HCPCS codes from each file:

```
medicare_codes = SET of distinct hcpcs_code WHERE npi = X
    from Medicare Physician & Other Practitioners (any service count > 0)

medicaid_codes = SET of distinct hcpcs_code WHERE npi = X
    from Medicaid Provider Spending (any claim count > 0)

all_codes = medicare_codes UNION medicaid_codes
both_payer_codes = medicare_codes INTERSECT medicaid_codes

payer_overlap = COUNT(both_payer_codes) / COUNT(all_codes)
```

This is the Jaccard similarity coefficient: the proportion of the provider's total code repertoire that appears in both payer files.

| Overlap | Interpretation for ENT |
|---|---|
| 0% | Provider appears in only one file. Less common in ENT than in pediatrics, but not impossible. |
| 1-10% | Minimal overlap. A few shared E/M codes, but the practice is overwhelmingly single-payer. |
| 10-25% | Moderate overlap. Typical for an ENT who sees both populations but with age-driven code differences. |
| 25-40% | High overlap. Consistent practice pattern across payers. Broad-based ENT. |
| 40%+ | Very high overlap. Unusual but indicates fully payer-agnostic billing. |

## 2. The ENT Payer Context

ENT sits in a sweet spot for payer diversity measurement. **STRONG Medicare presence** -- the elderly drive audiologic assessment (92557, 92567), nasal endoscopy (31231), head/neck cancer surveillance, and hearing aid evaluation. **MODERATE Medicaid presence** -- children drive myringotomy with tubes (69436), tonsillectomy (42826), adenoidectomy (42830), and otitis media treatment. **Expected overlap is MODERATE to HIGH** -- many codes (office visits, endoscopy, basic audiometry) cross both populations, but age-specific procedures create natural divergence.

| Metric | Expected Range (Dual-Payer ENT Providers) | Rationale |
|--------|-------------------------------------------|-----------|
| Code-level overlap | 0.15 - 0.25 | Age-driven procedure differences: pediatric surgical codes in Medicaid, audiologic/cancer codes in Medicare |
| Category-level overlap | 0.65 - 0.85 | Most ENT providers perform office visits, endoscopy, and audiologic testing across both populations |
| Composite overlap | 0.35 - 0.50 | |
| Estimated mean both-payer overlap | ~15-25% | Higher than pediatrics (~6-8%), lower than allergy (~35-65%) |
| Estimated p90 | ~35-40% | Providers with truly mixed adult/pediatric ENT panels |

## 3. Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207Y00000X | Otolaryngology |
| **Grouping** | State-level (default), national fallback < 30 providers | |
| **Minimum volume** | >= 50 services in **each** payer file the provider appears in | Single-payer providers need >= 50 in their payer |
| **Entity type** | Type 1 NPI (individual) | |
| **Dual-payer filter** | For overlap calculation, provider must appear in both Medicare AND Medicaid files | Single-payer providers scored separately |

## 4. Category-Level Overlap

Beyond raw code overlap, check which ENT workflow categories (from the Peer Comparison dimension) appear in both files:

```
categories = {
    'office_visits':          [99213, 99214, 99215, G2211, 99243, 99244],
    'audiologic_assessment':  [92557, 92567, 92568, 92550, 92579, 92588],
    'endoscopic_evaluation':  [31231, 31575, 31579, 92511, 92612],
    'in_office_procedures':   [69210, 30903, 31237, 30520, 42700, 69200],
    'allergy_services':       [95004, 95024, 95044, 95165, 95180],
    'surgical_procedures':    [69436, 42826, 42830, 30140, 31255, 31256, 42820, 31267]
}

For each category:
    in_medicare = ANY code in category appears in medicare_codes
    in_medicaid = ANY code in category appears in medicaid_codes
    in_both = in_medicare AND in_medicaid

categories_in_both = COUNT of categories WHERE in_both = true
categories_in_either = COUNT of categories WHERE (in_medicare OR in_medicaid) = true
category_overlap = categories_in_both / categories_in_either
```

A provider who does office visits and audiologic assessment for both payers but surgical procedures only through Medicaid (pediatric tubes) has category-level insight into where their payer-specific patterns diverge.

## 5. Composite Overlap and Scoring

```
composite_overlap = (payer_overlap * 0.60) + (category_overlap * 0.40)
```

Code-level overlap is weighted more heavily because it is more granular. Category overlap provides a safety net -- a provider who bills 92557 to Medicare and 92550 to Medicaid is doing audiologic assessment for both payers, even though the specific codes differ.

```
peer_p90 = 90th percentile of composite_overlap among dual-payer peers in cohort

payer_diversity_score = min(composite_overlap / peer_p90, 1.0) * 100
```

The p90 cap means a provider matching the 90th percentile of their dual-payer peers scores 100. Providers above p90 also score 100.

## 6. Single-Payer Handling

Single-payer providers cannot be scored on overlap -- there is nothing to compare. But in ENT, being single-payer is itself a signal worth recording.

| Single-Payer Type | Expected For ENT? | Handling |
|------------------|-------------------|---------|
| **Medicare-only** | Common. Practices focused on elderly hearing loss, head/neck cancer, chronic sinusitis in older adults. | Score = **50** (neutral). Flag as `single_payer_medicare`. Reduce weight of Payer Diversity in composite to 50% of normal. |
| **Medicaid-only** | Uncommon but real. Pediatric ENT subspecialists at children's hospitals or in underserved areas. | Score = **50** (neutral). Flag as `single_payer_medicaid`. Reduce weight to 50% of normal. |

Medicare-only is the more common single-payer pattern in ENT. Medicaid-only is rarer and usually signals a pediatric ENT focus. Neither is inherently suspicious.

---

# PART C: BUSINESS LOGIC

---

## 7. Full Calculation for One NPI

```
INPUT:  npi = "1234567890"
        measurement_year = 2023
        state = "TX"

STEP 1: Collect code sets
    medicare_codes = {99213, 99214, 99215, G2211, 31231, 31575, 92557,
                      92567, 92568, 69210, 30903, 95004, 95165, 30140}
    -- 14 codes: office visits, endoscopy, audiology, cerumen removal,
    -- epistaxis, allergy testing, allergy immunotherapy, turbinate reduction

    medicaid_codes = {99213, 99214, G2211, 31231, 92557, 69210,
                      69436, 42826, 42830, 92550, 42700}
    -- 11 codes: office visits, endoscopy, basic audiology, cerumen removal,
    -- ear tubes, tonsillectomy, adenoidectomy, tympanometry, uvulectomy

STEP 2: Compute code overlap
    all_codes = 20 distinct codes
    both_payer_codes = {99213, 99214, G2211, 31231, 92557, 69210} = 6 codes
    payer_overlap = 6 / 20 = 0.300

STEP 3: Compute category overlap
    office_visits:         Medicare YES, Medicaid YES  -> BOTH
    audiologic_assessment: Medicare YES (92557,92567,92568), Medicaid YES (92557,92550) -> BOTH
    endoscopic_evaluation: Medicare YES (31231,31575), Medicaid YES (31231) -> BOTH
    in_office_procedures:  Medicare YES (69210,30903), Medicaid YES (69210,42700) -> BOTH
    allergy_services:      Medicare YES (95004,95165), Medicaid NO -> MEDICARE ONLY
    surgical_procedures:   Medicare YES (30140), Medicaid YES (69436,42826,42830) -> BOTH

    categories_in_both = 5
    categories_in_either = 6
    category_overlap = 5 / 6 = 0.833

STEP 4: Composite
    composite_overlap = (0.300 * 0.60) + (0.833 * 0.40) = 0.180 + 0.333 = 0.513

STEP 5: Score
    peer_p90 = 0.45 (illustrative for TX ENT cohort)
    score = min(0.513 / 0.45, 1.0) * 100 = min(1.14, 1.0) * 100 = 100

OUTPUT: payer_diversity_score = 100
```

## 8. Four Worked Examples

**Provider A -- High overlap (Score: 100)**
- Medicare codes: 18 unique HCPCS
- Medicaid codes: 14 unique HCPCS
- Shared: 10 codes (office visits, endoscopy, audiology, cerumen removal, basic procedures)
- All codes: 22 unique
- payer_overlap = 10/22 = 0.455
- Category overlap: 6/6 = 1.0 (all ENT categories in both payers)
- Composite: (0.455 * 0.60) + (1.0 * 0.40) = 0.273 + 0.400 = 0.673
- peer_p90 = 0.45
- **Score: min(0.673 / 0.45, 1.0) * 100 = 100**

This is a general ENT who sees adults and children with similar workflows. Mixed-age panel, broad code set.

**Provider B -- Moderate overlap (Score: 68)**
- Medicare codes: 20 unique -- heavy on audiologic evaluation, nasal endoscopy, allergy testing, hearing aid codes
- Medicaid codes: 12 unique -- heavy on ear tubes, tonsillectomy, office visits
- Shared: 5 codes (99213, 99214, G2211, 31231, 69210)
- All codes: 27 unique
- payer_overlap = 5/27 = 0.185
- Category overlap: 4/6 = 0.667 (allergy and audiologic assessment Medicare-only)
- Composite: (0.185 * 0.60) + (0.667 * 0.40) = 0.111 + 0.267 = 0.378
- peer_p90 = 0.45
- **Score: min(0.378 / 0.45, 1.0) * 100 = 84.0 -> 84**

Moderate overlap reflecting natural age-based divergence. Score of 84 is within normal range.

**Provider C -- Single-payer, Medicare-only (Score: 50)**
- Medicare codes: 22 unique HCPCS
- Medicaid codes: 0 (not in Medicaid file)
- Overlap: not computable
- single_payer = true, single_payer_type = "medicare_only"
- **Score: 50 (neutral default)**
- Weight in composite: 50% of normal

This is a head-and-neck oncology-focused ENT or a practice in a retirement community. All patients are elderly. No Medicaid volume. Not unusual, not penalized.

**Provider D -- Different codes per payer (Score: 22)**
- Medicare codes: 15 unique -- office visits, hearing aid evaluation (92590, 92591), cerumen removal, audiometry
- Medicaid codes: 13 unique -- office visits, myringotomy (69436), tonsillectomy (42826), adenoidectomy (42830), allergy testing
- Shared: 2 codes (99213, 99214 only)
- All codes: 26 unique
- payer_overlap = 2/26 = 0.077
- Category overlap: 2/6 = 0.333 (only office visits and in-office procedures in both)
- Composite: (0.077 * 0.60) + (0.333 * 0.40) = 0.046 + 0.133 = 0.179
- peer_p90 = 0.45
- **Score: min(0.179 / 0.45, 1.0) * 100 = 39.8 -> 40**

This provider effectively runs two separate practices under one NPI. Low overlap is a genuine signal here because ENT peers typically share more codes across payers.

---

# PART D: HOW THIS FITS WITH THE OTHER FOUR SCORES

---

## 9. The Five Dimensions Together

| Dimension | Question It Answers | Type |
|-----------|-------------------|------|
| **AAO-HNS Guideline Concordance** | Does this ENT follow society guidelines? | Clinical quality |
| **Peer Comparison** | Does their billing look like a normal otolaryngologist? | Practice pattern |
| **Volume Adequacy** | Are the service volumes believable? | Behavior check |
| **Payer Diversity** | Is the practice pattern consistent across payers? | Access proxy |
| **Billing Quality** | Are charges and procedure ratios clean? | Pricing and integrity |

The other four scores aggregate Medicare and Medicaid data together. A provider with a perfectly normal aggregate profile could be running two different practices depending on who is paying. This score detects that.

## 10. What Payer Diversity Catches

| Scenario | Guideline Score | Peer Score | Payer Diversity Score | What Happened |
|----------|----------------|------------|----------------------|---------------|
| Good ENT, consistent across payers | 82 | 88 | 95 | Nothing unusual. Consistent practice. |
| Good ENT, Medicare-only panel | 78 | 85 | 50 (flagged) | Retirement community practice. Score neutral, weight reduced. |
| ENT who scopes Medicare but not Medicaid | 75 | 80 | 52 | Nasal endoscopy (31231) billed only to Medicare. Medicaid kids get office visits only. Guideline and peer scores look fine because endoscopy volume is adequate in aggregate. Payer diversity reveals the split. |
| ENT with completely split code sets | 70 | 72 | 22 | Two different practices under one NPI. Other scores are mediocre because the aggregate is diluted. Payer diversity confirms the pattern is payer-driven, not just random variation. |

**Key insight for ENT:** Because this specialty genuinely serves both payer populations, low overlap is a stronger signal here than for pediatrics or geriatrics. An ENT provider with a payer diversity score below 40 is doing something their peers are not.

---

# PART E: RISKS AND LIMITATIONS

---

## 11. ENT-Specific Risks

**Low overlap is more meaningful for ENT than for single-payer specialties.** In pediatrics, low overlap is the norm. In ENT, the dual-payer expectation means that unusually low overlap warrants genuine scrutiny -- but "unusually low" is defined relative to peers, not by an arbitrary cutoff.

**Medicare hearing aid coverage changes (post-2025) may shift code patterns.** If Medicare begins covering hearing aids more broadly, expect overlap with Medicaid audiologic codes to increase. The p90 threshold will need recalibration.

**Surgical codes may appear in facility claims, not physician office data.** The physician professional component should still appear in the CMS physician file, but some surgical codes may be underrepresented. Affects both payers roughly equally, so impact on overlap is modest.

**State variation in Medicaid ENT coverage is real.** Some states cover pediatric hearing aids, others do not. Some cover allergy testing liberally, others restrict it. State-level peer cohorting normalizes for this.

## 12. General Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Medicaid data completeness varies by state | Some states report fewer codes | State-level cohorting normalizes |
| Commercial payer data not available | Many ENT patients have commercial insurance | We measure what we have |
| Dual-eligible patients | Services may be split across files | Minor impact; no reliable detection at aggregate level |
| CMS suppression of low-volume lines | Lines with <= 10 beneficiaries suppressed | Small impact on measured overlap |
| Pediatric ENT subspecialists (2080P0006X) | May be coded under pediatric taxonomy | Would not appear in ENT cohort |

## 13. Update Cadence

- **p90 thresholds:** Recalculated annually from new CMS data.
- **Category definitions:** Inherited from Peer Comparison dimension; updated in sync.
- **Single-payer classification:** Re-evaluated annually as payer mix shifts.
- **Hearing aid policy monitoring:** Flag if Medicare hearing coverage legislation changes materially.

---

## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string(10) | National Provider Identifier |
| provider_name | string | Last name, first name |
| provider_state | string(2) | Practice state from NPPES |
| taxonomy_code | string | 207Y00000X (Otolaryngology) |
| data_year | integer | CMS data year |
| peer_cohort_level | string | "state" or "national" |
| peer_cohort_size | integer | Dual-payer providers in cohort |
| national_fallback_flag | boolean | True if national p90 used (cohort < 30) |
| medicare_code_count | integer | Distinct HCPCS in Medicare file |
| medicaid_code_count | integer | Distinct HCPCS in Medicaid file |
| total_distinct_codes | integer | Union of both code sets |
| both_payer_code_count | integer | Codes in both files |
| payer_overlap | float | Jaccard similarity (0-1) |
| categories_in_both | integer | ENT categories in both files (0-6) |
| category_overlap | float | categories_in_both / categories_in_either (0-1) |
| composite_overlap | float | (payer_overlap * 0.60) + (category_overlap * 0.40) |
| peer_p90 | float | 90th percentile composite overlap in cohort |
| payer_diversity_score | float | 0-100 |
| single_payer_flag | boolean | True if provider in only one payer file |
| single_payer_type | string | Null, "medicare_only", or "medicaid_only" |
| limited_secondary_payer_flag | boolean | True if secondary payer < 50 services |
| insufficient_data_flag | boolean | True if total distinct codes < 5 |
| volume_weighted_overlap | float | Share of total services from both-payer codes |
| medicare_only_codes | string | Comma-separated codes only in Medicare |
| medicaid_only_codes | string | Comma-separated codes only in Medicaid |
| both_payer_codes | string | Comma-separated codes in both files |
| confidence_tier | string | Always "Tier 2" |
| score_version | string | Scoring algorithm version |
