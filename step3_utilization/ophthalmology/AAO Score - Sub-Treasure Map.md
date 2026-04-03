# Ophthalmology AAO Guideline Concordance: A Sub-Treasure Map

## What This Document Does

This score answers: **Does this ophthalmology provider follow the American Academy of Ophthalmology (AAO) Preferred Practice Patterns (PPPs)?** It maps AAO clinical guidelines to available public data sources, identifies which are scorable from claims data, organizes them into 4 clinical domains, and produces a 0-100 composite score reflecting guideline adherence.

---
# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT
---

## 1. The Free Data We Have Right Now

| Data Source | Level | What It Gives Us |
|---|---|---|
| **CMS Medicare Physician & Other Practitioners** | Provider | HCPCS codes, service counts, beneficiary counts, charges, payments for individual ophthalmology NPIs billing Medicare |
| **CMS Medicaid Provider Spending** | Provider | Total services, beneficiaries, and spending per NPI for Medicaid enrollees |
| **NPPES NPI Registry** | Provider | Taxonomy code 207W00000X (Ophthalmology), subspecialty codes, entity type, state, credentialing |
| **CMS Care Compare** | Facility | Patient safety indicators, hospital-level quality measures applicable to ophthalmic ASCs |
| **IRIS Registry (published benchmarks)** | National | AAO's Intelligent Research in Sight registry publishes aggregate MIPS measure benchmarks for ophthalmology |
| **MIPS Quality Payment Program** | Provider | Ophthalmology-relevant MIPS measures: diabetic retinopathy communication, IOP documentation, post-cataract VA outcomes |
| **CMS Medicare Part D Prescribers — by Provider** | Provider | Per-NPI total prescription claims, 30-day fills, drug costs, beneficiary counts, brand vs. generic ratio, opioid prescribing rate. Free, no DUA. File: `MUP_DPR_RY25_P04_V10_DY23_NPI.csv` |
| **CMS Medicare Part D Prescribers — by Provider and Drug** | Provider × Drug | Per-NPI per-drug detail: brand name, generic name, claim count, 30-day fills, days supply, drug cost, beneficiary count. Enables glaucoma medication class analysis. Free, no DUA. File: `MUP_DPR_RY25_P04_V10_DY23_NPIBN.csv` |

## 2. What's Scorable vs. Not Scorable

### Summary by Domain

| Domain | Total Guidelines | Scorable (T1/T2) | Not Scorable (T3 only) | Why Not Scorable |
|---|---|---|---|---|
| **Cataract & Anterior Segment** | 8 | 5 | 3 | Informed consent documentation, IOL selection counseling, and complication rate benchmarking require chart review |
| **Glaucoma Management** | 11 | 8 | 3 | Target IOP documentation, gonioscopy-per-new-patient, and medication adherence counseling require chart-level data |
| **Retina & Macular Disease** | 10 | 6 | 4 | Anti-VEGF treatment interval optimization, AREDS counseling, and OCT-guided retreatment protocols require clinical records |
| **Comprehensive & Preventive Eye Care** | 7 | 4 | 3 | Refraction documentation, patient education, and referral coordination documentation require chart review |
| **TOTAL** | **36** | **23** | **13** | |

### Full Guideline-by-Guideline Audit

#### Cataract & Anterior Segment

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| AAO-CAT-1 | Pre-operative biometry rate (76519/92136 per 66984) | YES | T1 | CMS Medicare | — |
| AAO-CAT-2 | Complex vs. routine cataract ratio (66982 / [66982+66984]) | YES | T1 | CMS Medicare | — |
| AAO-CAT-3 | Post-operative visit adherence (E/M within 90-day global) | YES | T2 | CMS Medicare | Proxy via modifier -24/-79 billing patterns |
| AAO-CAT-4 | Second-eye surgery timing (bilateral 66984 within 2-4 weeks) | YES | T2 | CMS Medicare | Proxy via service date spacing in annual data |
| AAO-CAT-5 | Posterior capsulotomy rate (66821 per 66984) | YES | T2 | CMS Medicare | Proxy for complication/sequel rate |
| AAO-CAT-6 | Informed consent documentation | NO | T3 | Chart review | Requires documentation verification |
| AAO-CAT-7 | IOL selection counseling documentation | NO | T3 | Chart review | Requires counseling records |
| AAO-CAT-8 | Posterior capsule rupture rate (<2%) | NO | T3 | Chart review | Complication rate requires surgical records |

#### Glaucoma Management

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| AAO-GLAU-1 | Visual field testing rate per glaucoma patient (92083 per beneficiary) | YES | T1 | CMS Medicare | — |
| AAO-GLAU-2 | OCT/RNFL monitoring rate (92133 per glaucoma patient) | YES | T1 | CMS Medicare | — |
| AAO-GLAU-3 | IOP measurement documentation (MIPS #141) | YES | T1 | CMS Medicare / MIPS | — |
| AAO-GLAU-4 | SLT utilization as first-line therapy (65855 relative to total glaucoma services) | YES | T2 | CMS Medicare | Proxy for LiGHT trial concordance |
| AAO-GLAU-5 | MIGS utilization appropriateness (66183 relative to cataract volume) | YES | T2 | CMS Medicare | Proxy — MIGS should be proportional to cataract surgery volume |
| AAO-GLAU-6 | Glaucoma medication prescribing breadth (distinct drug classes per NPI) | YES | T2 | CMS Part D by Provider and Drug | Proxy — providers prescribing across prostaglandins, beta-blockers, alpha-agonists, CAIs demonstrate step-therapy concordance |
| AAO-GLAU-7 | Glaucoma medication volume per beneficiary (30-day fills per glaucoma Rx beneficiary) | YES | T2 | CMS Part D by Provider and Drug | Proxy for ongoing medication management vs. one-time prescribing |
| AAO-GLAU-8 | Generic prescribing rate for glaucoma medications (generic claims / total glaucoma Rx claims) | YES | T2 | CMS Part D by Provider and Drug | Proxy for cost-effective prescribing aligned with formulary guidelines |
| AAO-GLAU-9 | Target IOP documentation per visit | NO | T3 | Chart review | Requires individualized target in chart |
| AAO-GLAU-10 | Gonioscopy at initial evaluation | NO | T3 | Chart review | Requires procedure documentation in chart |
| AAO-GLAU-11 | Medication adherence counseling documentation | NO | T3 | Chart review | Requires counseling documentation (Part D captures prescribing but not adherence counseling) |

#### Retina & Macular Disease

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| AAO-RET-1 | Intravitreal injection volume (67028 per retina beneficiary) | YES | T1 | CMS Medicare | — |
| AAO-RET-2 | OCT monitoring rate for AMD/DME patients (92134 per injection beneficiary) | YES | T1 | CMS Medicare | — |
| AAO-RET-3 | Diabetic retinopathy communication to PCP (MIPS #19) | YES | T1 | CMS Medicare / MIPS | — |
| AAO-RET-4 | Fluorescein angiography utilization (92235 relative to injection volume) | YES | T2 | CMS Medicare | Proxy — FA should be used for diagnosis, not routine monitoring |
| AAO-RET-5 | PRP laser utilization (67228 relative to injection volume) | YES | T2 | CMS Medicare | Proxy — PRP for proliferative disease should be proportional |
| AAO-RET-6 | Fundus photography documentation rate (92250 per retina patient) | YES | T2 | CMS Medicare | — |
| AAO-RET-7 | Anti-VEGF treatment interval optimization (treat-and-extend) | NO | T3 | Chart review | Requires visit-level injection interval tracking |
| AAO-RET-8 | AREDS2 counseling for intermediate AMD | NO | T3 | Chart review | Requires counseling documentation |
| AAO-RET-9 | OCT-guided retreatment protocol adherence | NO | T3 | Chart review | Requires clinical decision documentation |
| AAO-RET-10 | Vitrectomy outcomes tracking | NO | T3 | Chart review | Complication rates require surgical records |

#### Comprehensive & Preventive Eye Care

| Guideline ID | Metric | Scorable? | Tier | Source | Why Not (if N/A) |
|---|---|---|---|---|---|
| AAO-COMP-1 | Comprehensive exam rate (92004/92014 or 99204/99214 per beneficiary) | YES | T1 | CMS Medicare | — |
| AAO-COMP-2 | Dilated fundus exam documentation (MIPS measure) | YES | T1 | CMS Medicare / MIPS | — |
| AAO-COMP-3 | Diagnostic testing-to-visit ratio (92133+92134+92083 per total E/M) | YES | T2 | CMS Medicare | Proxy for appropriate test ordering |
| AAO-COMP-4 | Visual acuity documentation (MIPS quality measure) | YES | T2 | CMS Medicare / MIPS | — |
| AAO-COMP-5 | Refraction documentation per comprehensive exam | NO | T3 | Chart review | 92015 is not covered by Medicare; cannot reliably track |
| AAO-COMP-6 | Patient education documentation | NO | T3 | Chart review | Requires counseling records |
| AAO-COMP-7 | Referral coordination to PCP/endocrinology | NO | T3 | Chart review | Except for MIPS #19 (DR communication), requires referral records |

---
# PART B: THE LOGIC
---

## Peer Cohort Definition

| Parameter | Value |
|---|---|
| **Taxonomy code** | 207W00000X (Ophthalmology) |
| **Subspecialty codes** | 207WX0200X (Oculoplastics), 207WX0009X (Glaucoma), 207WX0107X (Retina), 207WX0108X (Uveitis), 207WX0110X (Pediatric Ophthalmology), 207WX0120X (Cornea) |
| **State grouping** | State-level (default), national fallback when state cohort < 30 providers |
| **Minimum volume** | ≥100 total Medicare services per year |
| **Entity type** | Type 1 NPI (individual practitioners only) |
| **Exclusions** | Subspecialists flagged separately (see Business Rules). Optometrists (152W00000X) excluded. |

## Domains and Measures

### Domain 1: Cataract & Anterior Segment (Weight: 30%)

Measures surgical appropriateness and care completeness for the most common ophthalmic procedure.

| Measure | AAO Source | Metric | Direction | Scoring Method | Tier |
|---|---|---|---|---|---|
| Pre-operative biometry rate | PPP: Cataract | biometry_codes / cataract_surgeries | Higher is better | Percentile rank in peer cohort | T1 |
| Complex cataract ratio | PPP: Cataract | 66982 / (66982+66984) | Inverse U (10-15% expected) | Distance from peer median, penalize extremes | T1 |
| Post-operative visit pattern | PPP: Cataract | modifier -24/-79 frequency | Lower is better (fewer unrelated services in global = proper bundled care) | Percentile rank | T2 |
| Second-eye surgery spacing | PPP: Cataract | bilateral surgery pattern | Expected: 2-4 week spacing | Deviation from expected interval | T2 |
| Posterior capsulotomy rate | PPP: Cataract | 66821 / 66984 | Expected: 5-20% within 1 year | Distance from peer median | T2 |

**Why 30% weight:** Cataract surgery is the single most common surgical procedure in Medicare. It is the dominant revenue and volume driver for most ophthalmology practices and has the deepest data footprint in CMS files.

### Domain 2: Glaucoma Management (Weight: 25%)

Measures monitoring adequacy and treatment appropriateness for chronic glaucoma patients.

| Measure | AAO Source | Metric | Direction | Scoring Method | Tier |
|---|---|---|---|---|---|
| Visual field testing rate | PPP: POAG | 92083 per glaucoma beneficiary | Higher is better (target: 1-2x/year) | Percentile rank | T1 |
| OCT/RNFL monitoring rate | PPP: POAG | 92133 per glaucoma beneficiary | Higher is better (target: 1-2x/year) | Percentile rank | T1 |
| IOP documentation rate | PPP: POAG / MIPS #141 | MIPS compliance rate | Higher is better | Percentile rank | T1 |
| SLT as first-line therapy | PPP: POAG / LiGHT trial | 65855 / total glaucoma services | Higher is better (evidence supports SLT first-line) | Percentile rank | T2 |
| MIGS appropriateness | PPP: POAG | 66183 / 66984 | Expected: 5-25% of cataracts | Distance from peer median | T2 |
| Glaucoma Rx class breadth | PPP: POAG | Distinct glaucoma drug classes prescribed (prostaglandins, beta-blockers, alpha-agonists, CAIs, Rho kinase inhibitors, combo agents) | Higher is better (≥3 classes = step-therapy capability) | Percentile rank | T2 |
| Glaucoma Rx management volume | PPP: POAG | 30-day fills of glaucoma medications per glaucoma Rx beneficiary | Expected: 8-14 fills/year (chronic daily use) | Distance from expected range | T2 |
| Glaucoma generic prescribing rate | PPP: POAG | Generic glaucoma Rx claims / total glaucoma Rx claims | Higher is better | Percentile rank | T2 |

**Why 25% weight:** Glaucoma is the second most common chronic condition managed by ophthalmologists. Monitoring adequacy (visual fields + OCT) combined with medication management (now scorable via Part D prescribing data) provides a comprehensive quality signal.

### Domain 3: Retina & Macular Disease (Weight: 25%)

Measures treatment activity, monitoring, and care coordination for AMD, diabetic retinopathy, and other retinal conditions.

| Measure | AAO Source | Metric | Direction | Scoring Method | Tier |
|---|---|---|---|---|---|
| Injection-to-monitoring ratio | PPP: AMD/DR | 92134 per 67028 | Expected: 0.30-1.00 (OCT at most injection visits) | Distance from expected range | T1 |
| DR communication to PCP | PPP: DR / MIPS #19 | MIPS compliance rate | Higher is better | Percentile rank | T1 |
| Injection volume adequacy | PPP: AMD | 67028 per retina beneficiary | Expected: 4-12 per patient/year (treat-and-extend) | Distance from peer median | T1 |
| FA utilization ratio | PPP: AMD/DR | 92235 / 67028 | Expected: 0.05-0.20 (diagnostic, not routine) | Distance from expected range | T2 |
| PRP laser ratio | PPP: DR | 67228 / total retina services | Expected: declining (anti-VEGF replacing PRP) | Percentile rank | T2 |
| Fundus photography rate | PPP: DR | 92250 / retina beneficiaries | Expected: 0.30-1.00 per patient/year | Distance from expected range | T2 |

**Why 25% weight:** Retinal disease (AMD, diabetic retinopathy) is the leading cause of blindness in adults. Intravitreal injections are among the highest-volume procedures in all of medicine, and monitoring adequacy directly impacts visual outcomes.

### Domain 4: Comprehensive & Preventive Eye Care (Weight: 20%)

Measures general examination quality and diagnostic testing appropriateness.

| Measure | AAO Source | Metric | Direction | Scoring Method | Tier |
|---|---|---|---|---|---|
| Comprehensive exam rate | PPP: Comprehensive Eval | 92004+92014+99204+99214 per beneficiary | Higher is better | Percentile rank | T1 |
| Dilated fundus exam documentation | PPP: Comprehensive Eval / MIPS | MIPS compliance rate | Higher is better | Percentile rank | T1 |
| Diagnostic testing-to-visit ratio | PPP: multiple | (92133+92134+92083) / total E/M | Expected: 0.20-0.60 (not every visit, not never) | Distance from expected range | T2 |
| Visual acuity documentation | PPP: Comprehensive Eval / MIPS | MIPS compliance rate | Higher is better | Percentile rank | T2 |

**Why 20% weight:** Comprehensive eye exams are the foundation of ophthalmic care but are less data-rich in CMS files than procedural domains. Several key quality signals (refraction, patient education) are not scorable.

## Scoring Formula

### Per-Measure Scoring

```
FOR each scorable measure:
    IF scoring_method = "percentile_rank":
        measure_score = percentile_rank_within_peer_cohort(provider_value) * 100
    ELIF scoring_method = "distance_from_expected_range":
        IF provider_value within expected_range:
            measure_score = 100
        ELIF provider_value within 1.5x of range boundary:
            measure_score = 70
        ELSE:
            measure_score = 40
    ELIF scoring_method = "distance_from_peer_median":
        deviation = |provider_value - peer_median| / peer_IQR
        IF deviation <= 0.5:
            measure_score = 100
        ELIF deviation <= 1.5:
            measure_score = 70
        ELSE:
            measure_score = 40
```

### Per-Domain Scoring

```
domain_score = weighted_average(measure_scores within domain)
    # All measures within a domain weighted equally unless otherwise specified
```

### Composite Guideline Concordance Score

```
guideline_concordance_score = (cataract_domain * 0.30)
                            + (glaucoma_domain * 0.25)
                            + (retina_domain * 0.25)
                            + (comprehensive_domain * 0.20)
```

### Worked Examples

**Example 1: Comprehensive general ophthalmologist (Score ~82)**

Dr. A practices full-scope ophthalmology — cataract surgery, glaucoma management, some retina, and comprehensive exams.

- Cataract domain: biometry rate p75, complex ratio 12% (near median), post-op normal → domain = 85
- Glaucoma domain: VF testing p60, OCT p70, IOP doc p80, SLT moderate → domain = 75
- Retina domain: injection-to-OCT ratio in range, DR communication p65, FA low → domain = 80
- Comprehensive domain: exam rate p70, dilated exam p85, testing ratio in range → domain = 82
- **Composite: (85 × 0.30) + (75 × 0.25) + (80 × 0.25) + (82 × 0.20) = 25.5 + 18.8 + 20.0 + 16.4 = 80.7**

**Example 2: Retina specialist (Score ~70, adjusted for scope)**

Dr. B is a vitreoretinal surgeon — primarily injections, vitrectomy, and retinal laser. Minimal cataract or glaucoma.

- Cataract domain: low volume, few measures scored → domain = 50 (neutral for unscored measures)
- Glaucoma domain: minimal glaucoma management → domain = 50 (neutral)
- Retina domain: injection volume p90, OCT-per-injection p85, DR comm p70, FA appropriate → domain = 88
- Comprehensive domain: exam rate p40 (mostly procedure visits), testing ratio high → domain = 55
- **Composite: (50 × 0.30) + (50 × 0.25) + (88 × 0.25) + (55 × 0.20) = 15.0 + 12.5 + 22.0 + 11.0 = 60.5**
- **Subspecialist adjustment:** See Business Rules — retina specialists are scored on retina domain at higher weight.

**Example 3: Low-engagement provider (Score ~42)**

Dr. C does mostly routine exams with minimal diagnostic testing, few visual fields, and limited injection monitoring.

- Cataract domain: no biometry for 15% of cataracts, complex ratio 35% (high outlier) → domain = 45
- Glaucoma domain: VF testing p15, OCT p20, IOP doc p30 → domain = 30
- Retina domain: injection-to-OCT ratio low (under-monitoring), no DR communication → domain = 35
- Comprehensive domain: exam rate p80 but testing ratio very low → domain = 55
- **Composite: (45 × 0.30) + (30 × 0.25) + (35 × 0.25) + (55 × 0.20) = 13.5 + 7.5 + 8.8 + 11.0 = 40.8**

---
# PART C: BUSINESS RULES
---

## Composite Formula

| Domain | Weight | Justification |
|---|---|---|
| Cataract & Anterior Segment | 30% | Highest-volume surgical domain, deepest CMS data, most directly measurable quality signals |
| Glaucoma Management | 25% | Second most common chronic condition, monitoring adequacy is directly scorable |
| Retina & Macular Disease | 25% | Leading cause of blindness, injection monitoring and DR communication are critical quality signals |
| Comprehensive & Preventive | 20% | Foundational but less data-rich; several key measures are T3 (not scorable) |

## Missing Data Handling

| Scenario | Rule |
|---|---|
| Provider has no Medicare billing data | Cannot compute guideline concordance. Score = null. |
| Provider bills <100 total Medicare services | Below minimum volume threshold. Excluded from scoring. |
| Domain has 0 scorable measures (all denominators = 0) | Domain score = 50 (neutral). Weight redistributed only if provider demonstrably does not practice in that domain (no codes billed). |
| Individual measure has denominator = 0 | Measure excluded from domain average. Domain average computed from remaining measures. |
| MIPS measure data unavailable | Measure scored as neutral (50). Non-MIPS proxy measures in same domain still computed. |

## Subspecialist Handling

| Subspecialty | Domain Weight Adjustment |
|---|---|
| **Retina/Vitreoretinal (207WX0107X)** | Retina domain weight → 50%. Cataract → 10%. Glaucoma → 10%. Comprehensive → 30%. |
| **Glaucoma Specialist (207WX0009X)** | Glaucoma domain weight → 50%. Cataract → 15% (MIGS overlap). Retina → 5%. Comprehensive → 30%. |
| **Cornea/External Disease (207WX0120X)** | Cataract domain weight → 40% (cornea/cataract overlap). Glaucoma → 15%. Retina → 5%. Comprehensive → 40%. |
| **Oculoplastics (207WX0200X)** | Exclude from general guideline concordance. Practice pattern too specialized (lid/orbit surgery). Score = null with flag. |
| **Pediatric Ophthalmology (207WX0110X)** | Exclude from general scoring. Medicare population is minimal. Score = null with flag. |
| **Uveitis/Ocular Immunology (207WX0108X)** | Retina domain weight → 30% (injection overlap). Comprehensive → 40%. Cataract → 20%. Glaucoma → 10%. |

**Rule:** Subspecialists are compared against their own subspecialty peer cohort when cohort size ≥ 30. Otherwise, use general ophthalmology cohort with domain weight adjustments above.

---
# PART D: HOW THIS FITS WITH THE OTHER SCORES
---

## What Each Dimension Catches That Others Miss

| Dimension | Unique Contribution |
|---|---|
| **1. AAO Guideline Concordance (this score)** | Whether clinical monitoring and treatment patterns align with AAO evidence-based standards — the only score that measures clinical appropriateness |
| **2. Peer Comparison** | Whether billing breadth and volume distribution resemble a typical ophthalmologist |
| **3. Volume Adequacy** | Whether specific procedure volumes are credible (catches trace billing) |
| **4. Payer Diversity** | Whether practice patterns are consistent across Medicare and Medicaid |
| **5. Billing Quality** | Whether charges, code ratios, and E/M distribution are normal |

## Complementary Scenarios

**Scenario A:** Provider scores 90 on Guideline Concordance but 40 on Billing Quality. *Interpretation:* Clinically appropriate care patterns but abnormal charge ratios or modifier usage. Good medicine, questionable billing.

**Scenario B:** Provider scores 45 on Guideline Concordance but 85 on Peer Comparison. *Interpretation:* Their billing profile looks like a typical ophthalmologist (right codes, right breadth) but they're not following AAO monitoring guidelines. They have the right toolkit but aren't using it according to evidence.

**Scenario C:** Provider scores 80 on Guideline Concordance but 50 on Volume Adequacy. *Interpretation:* When they do things, they do them right — but trace billing in some areas suggests they're not consistently practicing those services.

---
# PART E: RISKS AND LIMITATIONS
---

## Data Limitations

| Limitation | Impact |
|---|---|
| **No diagnosis codes in Medicaid file** | Cannot identify glaucoma vs. AMD vs. cataract patients in Medicaid data. All disease-specific measures rely on Medicare data only. |
| **Part D Rx data is prescribing-level, not adherence-level** | CMS Part D public files show what providers prescribe (drug, claims, fills) but not whether patients actually take medications as directed. True medication adherence assessment still requires chart-level data or beneficiary-level Part D claims (which require a DUA via ResDAC). |
| **No patient-level linkage** | Cannot track individual patient journeys (e.g., injection intervals for a specific AMD patient). All measures are aggregate ratios. |
| **MIPS data availability** | MIPS measure performance is not universally available in public CMS files. Some providers may have MIPS data; many won't. |
| **Global period obscures post-op care** | 90-day global period for cataract surgery bundles all routine post-op visits. Cannot directly measure post-operative visit compliance. |
| **92xxx vs. E/M code ambiguity** | Ophthalmologists can bill eye exam codes (92012/92014) or standard E/M codes (99213-99215). Both are valid, making exam-level analysis complex. |

## Known Biases

| Bias | Direction | Mitigation |
|---|---|---|
| **Medicare age bias** | Ophthalmology patients skew elderly (cataracts, AMD, glaucoma). CMS data is unusually representative for this specialty — less of a bias than for pediatrics or OB-GYN. | Acknowledge that younger-patient conditions (myopia, pediatric strabismus) are invisible. |
| **Subspecialty concentration** | Retina specialists will score poorly on cataract/glaucoma domains unless weight-adjusted. | Subspecialist domain weight adjustments (see Business Rules). |
| **Practice setting bias** | Academic ophthalmologists may have lower billing volume per NPI due to resident involvement. | State-level peer cohort partially controls for academic concentration. |
| **Geographic variation** | Injection rates, SLT adoption, and MIGS utilization vary geographically based on local practice norms. | State-level peer cohort is the primary control. |

## Update Cadence

- **Measures and domain weights:** Review annually when AAO publishes updated PPPs.
- **Peer cohort percentiles:** Recompute annually from latest CMS data release.
- **New HCPCS codes:** Monitor for new ophthalmic procedure codes (e.g., new MIGS devices, new drug J-codes) and update measures accordingly.

---
# OUTPUT SCHEMA
---

| Field | Type | Description |
|---|---|---|
| `npi` | string | 10-digit National Provider Identifier |
| `provider_name` | string | Full name from NPPES |
| `taxonomy_code` | string | Primary taxonomy code |
| `is_subspecialist` | boolean | True if subspecialty taxonomy detected |
| `subspecialty_type` | string | Subspecialty name or null |
| `state` | string | 2-letter state code |
| `guideline_concordance_score` | float | 0-100 composite guideline concordance score |
| `cataract_domain_score` | float | 0-100 cataract & anterior segment domain score |
| `glaucoma_domain_score` | float | 0-100 glaucoma management domain score |
| `retina_domain_score` | float | 0-100 retina & macular disease domain score |
| `comprehensive_domain_score` | float | 0-100 comprehensive & preventive care domain score |
| `domain_weights` | JSON | {domain: weight} — standard or subspecialty-adjusted |
| `measure_details` | JSON | Per-measure breakdown: {measure_id, provider_value, peer_percentile, measure_score, tier} |
| `scorable_measure_count` | integer | Number of measures with sufficient data to score |
| `total_measure_count` | integer | Total measures attempted |
| `peer_cohort_size` | integer | Number of providers in the peer cohort |
| `peer_cohort_level` | string | "state" or "national" (fallback) |
| `scored_at` | datetime | Timestamp of score computation |
| `data_year` | integer | CMS data release year used |
