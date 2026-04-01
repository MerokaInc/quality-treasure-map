# Otolaryngology Peer Comparison Score — Sub-Treasure Map

**Specialty:** Otolaryngology (ENT)
**Taxonomy Code:** 207Y00000X
**Score Type:** Peer Comparison (Utilization Pattern)
**Parent Document:** Quality Treasure Map — Step 3: Utilization
**Last Updated:** 2026-04-01

---

## What This Document Does

This sub-treasure map explains how we build a single numeric score that answers one
question: **does this ENT provider's billing pattern look like a normal
otolaryngologist's?** We pull every HCPCS code the provider billed through Medicare
and Medicaid, compare that list and those volumes against a peer cohort of
otolaryngologists in the same state, and collapse the comparison into a 0-100
composite score. A high score means the provider's practice looks like their peers.
A low score means something is unusual — maybe they are a subspecialist, maybe they
are upcoding, maybe they are running a high-volume allergy mill. The score does not
say *why* the pattern is different; it just flags *that* it is different so a human
reviewer knows where to look.

---

## PART A: WHAT WE HAVE (Data Sources)

We use three free, public CMS datasets. Nothing proprietary, nothing behind a
paywall.

| # | Dataset | What We Pull | Refresh Cadence |
|---|---------|-------------|-----------------|
| 1 | **Medicare Physician & Other Practitioners** (Part B Public Use File) | Every HCPCS code billed by a given NPI: service count, beneficiary count, average submitted charge, average Medicare payment. | Annual (2-year lag) |
| 2 | **Medicaid State Drug Utilization / Provider Spending** | Medicaid-side service counts by provider, giving us a fuller picture than Medicare alone. | Annual |
| 3 | **NPPES (NPI Registry)** | Taxonomy code (207Y00000X confirms otolaryngology), entity type (Type 1 = individual), practice state. | Weekly |

**Why these three are enough.** Medicare Part B tells us what the provider billed
and how much. NPPES tells us the provider's specialty and location so we can build
the peer cohort. Medicaid fills the gap for providers with a mixed payer panel. Put
together, we can see the provider's coding footprint and compare it against peers
without needing commercial claims data.

---

## PART B: BUILDING THE PEER COHORT

### Step 1: Define Who Counts as a Peer

Not every otolaryngologist is a fair comparison. We filter to keep the cohort
meaningful:

| Filter | Rule | Why |
|--------|------|-----|
| Taxonomy | 207Y00000X (Otolaryngology) | Matches the target specialty exactly |
| Geography | Same U.S. state as the target provider | Controls for regional practice patterns and fee schedules |
| Volume | >= 100 total services (Medicare + Medicaid combined) | Drops moonlighters, retirees winding down, and data noise |
| Entity type | Individual NPI (Type 1 only) | Excludes group practices and facility NPIs |

A typical state-level ENT cohort will have somewhere between 30 and 200 providers,
which is plenty to build stable medians.

### Step 2: Build the Reference Code Set

We start with the **top 25 most prevalent HCPCS codes** billed nationally by
otolaryngologists (taxonomy 207Y00000X). "Prevalent" means the most providers bill
them, not the highest dollar amount. This keeps the reference set anchored to what
a typical ENT practice actually does day-to-day.

Here is the reference set, sorted by national prevalence rank:

| Rank | HCPCS | Short Description |
|------|-------|-------------------|
| 1 | 99213 | Office visit, established patient, low-moderate complexity |
| 2 | 99214 | Office visit, established patient, moderate complexity |
| 3 | 99203 | Office visit, new patient, low complexity |
| 4 | 99204 | Office visit, new patient, moderate complexity |
| 5 | 92557 | Comprehensive audiometry (threshold + speech) |
| 6 | 31231 | Nasal endoscopy, diagnostic |
| 7 | 92567 | Tympanometry |
| 8 | 69210 | Cerumen removal, impacted, one or both ears |
| 9 | 31575 | Laryngoscopy, flexible, diagnostic |
| 10 | 92552 | Pure tone audiometry, air only |
| 11 | 92568 | Acoustic reflex testing |
| 12 | G2211 | Visit complexity inherent to E/M (add-on) |
| 13 | 99215 | Office visit, established patient, high complexity |
| 14 | 95004 | Percutaneous allergy skin testing |
| 15 | 30903 | Nasal cautery and/or packing, anterior |
| 16 | 92553 | Pure tone audiometry, air and bone |
| 17 | 69200 | Foreign body removal, external auditory canal |
| 18 | 42820 | Tonsillectomy and adenoidectomy, under age 12 |
| 19 | 31579 | Laryngoscopy, flexible, with stroboscopy |
| 20 | 87880 | Strep rapid antigen detection test |
| 21 | 95024 | Intradermal allergy testing |
| 22 | 92588 | Distortion product otoacoustic emissions (DPOAE) |
| 23 | 99205 | Office visit, new patient, high complexity |
| 24 | 30520 | Septoplasty |
| 25 | 31237 | Nasal endoscopy with biopsy/polypectomy |

> **Note:** 92551 (screening audiometry) is included in the Audiologic Assessment
> category below even though it falls just outside the top 25. It rounds out the
> audiometry cluster and is common enough to be worth tracking.

### Step 3: Assign Codes to Workflow Categories

ENT has a natural structure: office visits, hearing tests, looking-down-the-nose
scopes, quick in-office procedures, allergy work, and OR cases. We group the
reference codes into **six categories** that mirror how an ENT practice actually
runs:

#### Category 1 — Office Visits
The bread and butter. Every ENT bills these.

| HCPCS | Description |
|-------|-------------|
| 99203 | New patient, low complexity |
| 99204 | New patient, moderate complexity |
| 99205 | New patient, high complexity |
| 99213 | Established patient, low-moderate complexity |
| 99214 | Established patient, moderate complexity |
| 99215 | Established patient, high complexity |
| G2211 | Visit complexity add-on |

#### Category 2 — Audiologic Assessment
Hearing evaluation is core ENT. Many offices have an in-house audiologist billing
under the physician's NPI.

| HCPCS | Description |
|-------|-------------|
| 92551 | Screening audiometry |
| 92552 | Pure tone audiometry, air only |
| 92553 | Pure tone audiometry, air and bone |
| 92557 | Comprehensive audiometry |
| 92567 | Tympanometry |
| 92568 | Acoustic reflex testing |
| 92588 | Distortion product otoacoustic emissions |

#### Category 3 — Endoscopic Evaluation
Scoping the nose, sinuses, and larynx is what separates ENT from primary care.

| HCPCS | Description |
|-------|-------------|
| 31231 | Nasal endoscopy, diagnostic |
| 31237 | Nasal endoscopy with biopsy/polypectomy |
| 31575 | Laryngoscopy, flexible, diagnostic |
| 31579 | Laryngoscopy with stroboscopy |

#### Category 4 — In-Office Procedures
Quick procedural work done chairside, no OR needed.

| HCPCS | Description |
|-------|-------------|
| 69210 | Cerumen removal, impacted |
| 30903 | Nasal cautery/packing, anterior |
| 69200 | Foreign body removal, external ear |

#### Category 5 — Allergy Services
A sizable subset of ENTs run allergy programs. Providers who do not will simply
score zero in this category — that is expected and the composite formula accounts
for it.

| HCPCS | Description |
|-------|-------------|
| 95004 | Percutaneous allergy skin testing |
| 95024 | Intradermal allergy testing |

#### Category 6 — Surgical Procedures
OR-based work that shows up in the Medicare Part B file (facility and professional
component).

| HCPCS | Description |
|-------|-------------|
| 42820 | Tonsillectomy/adenoidectomy, under age 12 |
| 30520 | Septoplasty |

---

## PART C: BUSINESS LOGIC — Three Metrics and a Composite

Every specialty uses the same three metrics. The weights never change. This makes
cross-specialty comparisons meaningful.

### Metric 1: Code Coverage (Weight: 40%)

**Question:** How many of the 25 reference codes does this provider bill at least
once?

```
code_coverage = (codes_billed_in_reference_set / 25) * 100
```

**Example:** A general ENT bills 20 of the 25 codes. Score = (20 / 25) * 100 = 80.

**Why 40% weight?** Code coverage is the single strongest signal. A provider who
bills most of the reference set is almost certainly doing general otolaryngology. A
provider who bills only 8 of 25 is either a subspecialist or something unusual is
going on.

### Metric 2: Category Coverage (Weight: 30%)

**Question:** How many of the 6 workflow categories does this provider touch at
least once?

```
category_coverage = (categories_with_at_least_one_code / 6) * 100
```

**Example:** A provider bills codes in Office Visits, Audiologic Assessment,
Endoscopic Evaluation, In-Office Procedures, and Surgical Procedures (5 of 6
categories, skipping Allergy). Score = (5 / 6) * 100 = 83.3.

**Why this matters.** A provider could bill 15 codes but all from two categories
(say, office visits and allergy testing). Category coverage catches that kind of
lopsidedness.

### Metric 3: Volume Concordance (Weight: 30%)

**Question:** For the codes this provider *does* bill, are their volumes in line
with their peers?

```
For each code in the reference set that the provider bills:
    peer_median_rate = median(service_count / total_services) across cohort
    provider_rate    = provider_service_count / provider_total_services
    deviation        = abs(provider_rate - peer_median_rate)

mean_deviation = mean(all deviations)
volume_concordance = max(0, (1 - mean_deviation) * 100)
```

**Example:** The provider bills 18 reference codes. For each, we compute how far
their utilization rate is from the peer median. If the average deviation is 0.05
(5 percentage points), volume concordance = (1 - 0.05) * 100 = 95.

**Why this matters.** A provider might bill all 25 codes but do 60% of their work
in allergy testing (where peers average 8%). Code coverage would look fine;
volume concordance would flag the imbalance.

### Composite Score

```
composite = (code_coverage * 0.40)
          + (category_coverage * 0.30)
          + (volume_concordance * 0.30)
```

All three inputs are on a 0-100 scale, so the composite is also 0-100.

### Output Schema (One Row per NPI)

```json
{
  "npi": "1234567890",
  "provider_name": "Jane Smith, MD",
  "state": "TX",
  "taxonomy": "207Y00000X",
  "peer_cohort_size": 142,
  "total_services": 4821,
  "codes_billed_in_reference_set": 21,
  "code_coverage": 84.0,
  "categories_covered": 5,
  "category_coverage": 83.3,
  "volume_concordance": 91.2,
  "composite_score": 86.0,
  "flags": ["allergy_category_missing"],
  "score_date": "2026-04-01",
  "data_vintage": "CY2024"
}
```

### Interpreting the Score

| Composite Range | Interpretation |
|----------------|----------------|
| 85 - 100 | Typical general ENT pattern. No flags. |
| 70 - 84 | Mildly atypical. Possibly a subspecialist or a practice with a narrow focus. Worth a glance, rarely actionable. |
| 50 - 69 | Moderately atypical. Missing multiple categories or significant volume skew. Review recommended. |
| 0 - 49 | Highly atypical. Either a very narrow subspecialist or a genuinely unusual billing pattern. Prioritize for review. |

---

## PART D: WHAT THIS CATCHES THAT GUIDELINE CONCORDANCE MISSES

The Peer Comparison score and the Guideline Concordance score are designed to work
as a pair. Each one catches things the other cannot.

| Scenario | Guideline Concordance | Peer Comparison | Who Catches It? |
|----------|----------------------|-----------------|-----------------|
| Provider always bills 99214 for established visits (never 99213 or 99215) | Might look fine — 99214 is a legitimate code | Flags abnormal volume distribution vs. peers who use a mix of levels | **Peer Comparison** |
| Provider bills 31231 (nasal endoscopy) on 95% of visits | No guideline violation — endoscopy is appropriate for many ENT complaints | Massive deviation from peer median rate for 31231 | **Peer Comparison** |
| Provider bills an unlisted procedure code (30999) with no documentation | Guideline concordance flags missing documentation for unlisted code | Code not in reference set, so invisible to peer comparison | **Guideline Concordance** |
| Provider consistently omits modifier -59 on separately identifiable procedures | Guideline flags the modifier error | Peer comparison sees normal code volumes and nothing unusual | **Guideline Concordance** |
| Provider runs a pure allergy practice under an ENT NPI (90%+ allergy codes) | Allergy codes individually look fine | Extreme volume skew plus missing categories (no endoscopy, minimal surgery) | **Peer Comparison** |
| Provider bills 42820 (T&A) at 3x the peer rate with short LOS | Guideline might flag if documentation is thin | Volume concordance catches the elevated surgical rate | **Both** |

**Bottom line:** Guideline concordance asks "is each individual claim coded
correctly?" Peer comparison asks "does the overall practice pattern make sense for
this specialty?" You need both.

---

## PART E: RISKS AND LIMITATIONS

### 1. ENT Is a Surgical Specialty with Wide Practice Variation

Some otolaryngologists spend most of their time in the OR (head and neck oncology,
complex sinus surgery, cochlear implants). Others run predominantly office-based
diagnostic practices. A heavily surgical ENT will naturally bill fewer office visit
and audiometry codes, pulling their code coverage and category coverage down even
though their practice is perfectly legitimate.

**Mitigation:** The 70-84 "mildly atypical" band exists for exactly this reason.
Do not treat moderate scores as red flags without context.

### 2. Subspecialists Will Score Low by Design

Otolaryngology has recognized subspecialties:

- **Otology/Neurotology** — mostly hearing and balance, heavy on audiometry, light
  on allergy and nasal endoscopy.
- **Laryngology** — mostly voice and swallowing, heavy on laryngoscopy and
  stroboscopy.
- **Rhinology** — mostly sinus disease, heavy on nasal endoscopy and sinus surgery.
- **Facial Plastic Surgery** — mostly reconstruction and cosmetic, very little
  audiometry or allergy.
- **Pediatric Otolaryngology** — mostly T&A, tubes, and airway; different code mix
  than adult general ENT.
- **Head and Neck Oncology** — surgical codes dominate, office visit mix skews
  toward 99215.

A pure otologist will legitimately score 50-65 on this metric because they do not
touch half the reference categories. The score is working as intended — it is
telling you "this provider does not look like a general otolaryngologist" — but it
is not an accusation.

**Mitigation:** When the composite is low but the provider's subspecialty is known,
note it and move on. Future versions may add subspecialty-specific reference sets.

### 3. The Reference Code Set Must Be Rebuilt Annually

CPT codes change. New codes get introduced (G2211 was new in 2024). Old codes get
deleted or bundled. The top-25 prevalence ranking shifts as practice patterns
evolve.

**Mitigation:** Re-derive the reference set each year from the latest Medicare Part
B public use file. Do not hardcode it.

### 4. Medicare/Medicaid Data Does Not See Commercial Payers

A provider with a predominantly commercial payer mix will show lower service
volumes in CMS data than their actual practice. This could depress their code
coverage if they fall below the threshold for some codes.

**Mitigation:** The 100-service minimum helps, but it is not a complete fix.
Interpret cautiously for providers known to have small Medicare panels.

### 5. State-Level Cohorts Can Be Small

In states with fewer ENTs (Wyoming, Vermont, Alaska), the peer cohort might be
under 20 providers. Small cohorts produce unstable medians.

**Mitigation:** If the cohort is smaller than 20, flag the score as
"low-confidence" and consider falling back to a regional (multi-state) or national
cohort.

### 6. Group Billing Artifacts

When multiple providers in a group practice bill under a single NPI (even though
we filter to Type 1), the aggregated code mix can look artificially broad or
artificially skewed. This is a data quality issue, not a methodology issue.

**Mitigation:** Cross-check against NPPES entity type. If anything looks off,
verify the NPI is truly an individual provider.

---

## Appendix: Reference Code Set by Category (Quick-Reference Table)

| Category | HCPCS | Description | Typical ENT Use |
|----------|-------|-------------|-----------------|
| **Office Visits** | 99203 | New, low complexity | New patient intake, straightforward complaint |
| | 99204 | New, moderate complexity | New patient, multiple ENT complaints |
| | 99205 | New, high complexity | New patient, complex history (cancer workup, etc.) |
| | 99213 | Established, low-moderate | Follow-up, stable condition |
| | 99214 | Established, moderate | Follow-up with active management changes |
| | 99215 | Established, high complexity | Complex follow-up (post-op complication, etc.) |
| | G2211 | Visit complexity add-on | Ongoing care for chronic ENT conditions |
| **Audiologic Assessment** | 92551 | Screening audiometry | Basic hearing screen |
| | 92552 | Pure tone, air only | Air conduction threshold testing |
| | 92553 | Pure tone, air and bone | Full threshold testing |
| | 92557 | Comprehensive audiometry | Complete hearing evaluation |
| | 92567 | Tympanometry | Middle ear function assessment |
| | 92568 | Acoustic reflex testing | Reflex arc evaluation |
| | 92588 | DPOAE | Otoacoustic emission testing |
| **Endoscopic Evaluation** | 31231 | Nasal endoscopy, diagnostic | Sinus and nasal cavity visualization |
| | 31237 | Nasal endoscopy with biopsy | Tissue sampling during endoscopy |
| | 31575 | Laryngoscopy, flexible | Larynx and vocal cord evaluation |
| | 31579 | Laryngoscopy with stroboscopy | Vocal cord vibration assessment |
| **In-Office Procedures** | 69210 | Cerumen removal | Impacted earwax removal |
| | 30903 | Nasal cautery/packing | Epistaxis management |
| | 69200 | Foreign body removal, ear | Object removal from ear canal |
| **Allergy Services** | 95004 | Percutaneous allergy testing | Skin prick testing panels |
| | 95024 | Intradermal allergy testing | Intradermal injection testing |
| **Surgical Procedures** | 42820 | Tonsillectomy/adenoidectomy <12 | Pediatric T&A |
| | 30520 | Septoplasty | Deviated septum repair |

---

## Pseudocode: End-to-End Scoring Pipeline

```
FUNCTION score_ent_provider(target_npi):

    -- Step 1: Validate the target
    provider = NPPES.lookup(target_npi)
    ASSERT provider.taxonomy == "207Y00000X"
    ASSERT provider.entity_type == 1

    -- Step 2: Build the peer cohort
    peers = NPPES.query(
        taxonomy = "207Y00000X",
        entity_type = 1,
        state = provider.state
    )

    FOR EACH peer IN peers:
        peer.total_services = Medicare.total_services(peer.npi)
                            + Medicaid.total_services(peer.npi)
        IF peer.total_services < 100:
            REMOVE peer FROM peers

    -- Step 3: Load the reference code set (25 codes, 6 categories)
    reference_codes = load_current_year_reference_set("otolaryngology")

    -- Step 4: Get the target provider's billing data
    target_claims = Medicare.claims(target_npi) + Medicaid.claims(target_npi)
    target_codes  = unique HCPCS codes in target_claims
    target_total  = sum of all service counts

    -- Step 5: Metric 1 — Code Coverage
    matched_codes = intersection(target_codes, reference_codes)
    code_coverage = (count(matched_codes) / count(reference_codes)) * 100

    -- Step 6: Metric 2 — Category Coverage
    categories_hit = 0
    FOR EACH category IN reference_codes.categories:
        IF any code in category is in target_codes:
            categories_hit += 1
    category_coverage = (categories_hit / 6) * 100

    -- Step 7: Metric 3 — Volume Concordance
    deviations = []
    FOR EACH code IN matched_codes:
        peer_rates = []
        FOR EACH peer IN peers:
            rate = peer.service_count(code) / peer.total_services
            APPEND rate TO peer_rates
        peer_median = median(peer_rates)

        target_rate = target_claims.service_count(code) / target_total
        deviation   = abs(target_rate - peer_median)
        APPEND deviation TO deviations

    mean_deviation = mean(deviations)
    volume_concordance = max(0, (1 - mean_deviation) * 100)

    -- Step 8: Composite
    composite = (code_coverage * 0.40)
              + (category_coverage * 0.30)
              + (volume_concordance * 0.30)

    -- Step 9: Flag generation
    flags = []
    IF categories_hit < 4:
        APPEND "narrow_practice_pattern" TO flags
    IF code_coverage < 50:
        APPEND "low_code_coverage" TO flags
    IF volume_concordance < 60:
        APPEND "volume_skew_detected" TO flags
    IF count(peers) < 20:
        APPEND "small_cohort_low_confidence" TO flags
    FOR EACH category IN reference_codes.categories:
        IF no code in category is in target_codes:
            APPEND "{category_name}_missing" TO flags

    RETURN {
        npi: target_npi,
        provider_name: provider.name,
        state: provider.state,
        taxonomy: "207Y00000X",
        peer_cohort_size: count(peers),
        total_services: target_total,
        codes_billed_in_reference_set: count(matched_codes),
        code_coverage: round(code_coverage, 1),
        categories_covered: categories_hit,
        category_coverage: round(category_coverage, 1),
        volume_concordance: round(volume_concordance, 1),
        composite_score: round(composite, 1),
        flags: flags,
        score_date: today(),
        data_vintage: current_data_year()
    }
```

---

*This document is part of the Quality Treasure Map system, Step 3: Utilization.
It is designed to be read by humans and implemented by engineers. If something
is unclear, it is a bug in the document — file an issue.*
