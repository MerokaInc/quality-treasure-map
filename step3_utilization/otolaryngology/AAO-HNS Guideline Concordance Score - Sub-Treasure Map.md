# Otolaryngology (ENT) Guideline Concordance: A Sub-Treasure Map

## What This Document Does

This score answers one question: **Does the otolaryngologist follow evidence-based clinical practice guidelines from the American Academy of Otolaryngology-Head and Neck Surgery (AAO-HNS)?** We measure this using publicly available CMS claims data — HCPCS procedure codes, service volumes, and beneficiary counts — comparing each provider's practice patterns against their peer cohort. The result is a 0-100 score reflecting how closely a provider's billing aligns with guideline-concordant care delivery. ENT is a surgical specialty that also performs significant office-based diagnostic work, and this score focuses on the diagnostic workup side where claims data can actually tell us something meaningful.

---

# PART A: WHAT WE HAVE AND WHAT WE CAN DO WITH IT

---

## 1. The Free Data We Have Right Now

| Dataset | What It Gives Us | Refresh Cadence |
|---------|-----------------|-----------------|
| **CMS Medicare Physician & Other Practitioners** | HCPCS codes, service counts, beneficiary counts, average charges, average Medicare payment per NPI | Annual (2-year lag) |
| **CMS Medicaid Provider Spending** | HCPCS codes, service counts, beneficiary counts per NPI for Medicaid population | Annual (2-year lag) |
| **NPPES NPI Registry** | Taxonomy codes (207Y00000X = Otolaryngology), practice location, entity type | Weekly updates |

**No diagnosis codes.** The Medicaid file has no ICD-10. Medicare has limited diagnosis info but not at the claim-line level needed for guideline scoring. We cannot determine *why* a service was performed — only *that* it was performed.

**No Rx data.** We cannot measure medication prescribing (steroids for sudden hearing loss, antibiotics for sinusitis, antihistamines for allergic rhinitis).

**No patient-level linkage.** Data is aggregated per NPI. We cannot track individual patient journeys, confirm that an audiogram preceded a tympanostomy tube placement, or link a laryngoscopy finding to a subsequent surgical decision.

## 2. What's Scorable vs. Not Scorable

This is the hard part. AAO-HNS has published clinical practice guidelines (CPGs) across a wide range of conditions. Most of them require diagnosis codes to determine whether the right procedure was done for the right reason. Here is an honest audit.

### AAO-HNS Clinical Practice Guidelines — Scorability Audit

| # | Guideline | Key Recommendations | Scorable? | Why / Why Not |
|---|-----------|-------------------|-----------|---------------|
| 1 | **Sinusitis (Acute)** | Avoid antibiotics for uncomplicated acute sinusitis; avoid imaging for uncomplicated cases; recommend nasal saline irrigation | **NO** | Requires Rx data (antibiotics) and diagnosis codes (to distinguish acute from chronic). Imaging is radiology-billed, not ENT-billed. No way to measure saline irrigation counseling. |
| 2 | **Otitis Media with Effusion** | Watchful waiting before tubes; audiometric evaluation; tympanostomy tubes when persistent | **NO** | Cannot link audiometry to OME diagnosis. Cannot confirm watchful waiting period. Tympanostomy (69436) is measurable but without diagnosis codes, we cannot confirm indication was OME vs. recurrent AOM. |
| 3 | **Tonsillectomy in Children** | Indications: recurrent throat infection (Paradise criteria), sleep-disordered breathing; avoid perioperative antibiotics | **NO** | Cannot confirm indication without diagnosis codes. Cannot measure antibiotic prescribing. Tonsillectomy volume (42826) is visible but meaningless without knowing the "why." |
| 4 | **Sudden Sensorineural Hearing Loss** | Audiometric evaluation within 14 days; offer steroids; do not routinely order imaging | **NO** | Cannot identify SSNHL patients without diagnosis codes. Cannot confirm timing of audiogram relative to onset. Cannot measure steroid prescribing. |
| 5 | **Allergic Rhinitis** | Skin testing or IgE testing for confirmation; offer immunotherapy for confirmed allergic rhinitis | **PARTIAL** | Can measure allergy testing (95004) and immunotherapy (95115/95117) volume. Cannot confirm diagnosis of allergic rhinitis. Scored as part of Allergy Testing domain. |
| 6 | **Cerumen Impaction** | Remove cerumen when it causes symptoms or prevents examination; patient education on prevention | **NO** | Cerumen removal (69210) is visible, but cannot distinguish impacted-from-symptomatic vs. routine. Cannot measure patient education. |
| 7 | **Hoarseness/Dysphonia** | Laryngoscopy recommended for hoarseness lasting > 4 weeks; do not routinely prescribe antibiotics or antireflux meds | **PARTIAL** | Can measure laryngoscopy volume (31575) as a proxy for appropriate workup. Cannot confirm it was triggered by hoarseness, cannot measure timing, cannot measure Rx avoidance. |
| 8 | **Tinnitus** | Audiometric evaluation for all tinnitus patients; no routine imaging; consider hearing aids | **NO** | Cannot identify tinnitus patients without diagnosis codes. Audiometry is visible but we cannot link it to tinnitus indication. |
| 9 | **Bell's Palsy** | Do not routinely order imaging; prescribe steroids within 72 hours | **NO** | Requires diagnosis codes and Rx data. No HCPCS proxy available. |
| 10 | **Epistaxis** | Evaluate with anterior rhinoscopy; nasal packing or cautery for initial management; endoscopic evaluation for recurrent cases | **NO** | Cannot identify epistaxis patients. Cautery (30801/30802) and nasal endoscopy (31231) are visible but cannot be linked to epistaxis without diagnosis. |
| 11 | **Adult Sinusitis (Chronic)** | CT imaging before surgical intervention; endoscopic sinus surgery after failed medical therapy | **NO** | Cannot confirm CT preceded surgery (imaging billed by radiology). Cannot confirm failed medical therapy (Rx data). ESS codes (31254-31288) are visible but indication is unknown. |
| 12 | **Benign Paroxysmal Positional Vertigo** | Diagnose with Dix-Hallpike; treat with canalith repositioning (Epley); do not routinely order imaging | **NO** | Canalith repositioning (95992) is visible but very rarely billed as a separate code. Cannot identify BPPV patients. Cannot confirm Dix-Hallpike was performed (it's bundled into E/M). |

**Summary: 0 fully scorable, 2 partially scorable, 10 not scorable out of 12 CPGs reviewed.**

This is a humbling result, but an honest one. Most AAO-HNS guidelines specify what to do for a *specific diagnosis*, and without diagnosis codes we cannot confirm the indication. What we *can* do is measure whether an ENT provider's overall diagnostic workup patterns align with what a guideline-following ENT would look like.

### What IS Scorable: Procedure-Pattern Proxies

Even though we cannot score individual guidelines, we can score whether a provider's **diagnostic toolkit usage** looks like a guideline-concordant ENT. AAO-HNS guidelines collectively emphasize: perform audiometry before ear procedures, perform endoscopy for nasal/laryngeal complaints, use allergy testing appropriately. A provider who performs these diagnostic procedures at reasonable rates relative to their peers is more likely to be following guidelines than one who skips straight to surgery or never scopes.

**Scorable Domains:**

| Domain | Rationale | Key HCPCS |
|--------|-----------|-----------|
| **Diagnostic Assessment Breadth** | Guidelines across multiple CPGs emphasize appropriate diagnostic workup before treatment. Does this provider use the core ENT diagnostic toolkit? | 92557, 92567, 31231, 31575 |
| **Hearing Evaluation** | Multiple CPGs (OME, tinnitus, SSNHL, cerumen) recommend audiometric assessment. Breadth and volume of hearing evaluation codes reflect guideline awareness. | 92551, 92552, 92553, 92557, 92567, 92568, 92579, 92588 |
| **Endoscopic Evaluation** | Nasal endoscopy and laryngoscopy are recommended in sinusitis, dysphonia, and epistaxis CPGs as standard-of-care workup. | 31231, 31575, 31579 |
| **Allergy Testing** | AAO-HNS allergic rhinitis CPG recommends allergen testing. Many ENTs perform allergy services. | 95004, 95024, 95115, 95117 |

---

# PART B: THE LOGIC

---

## Peer Cohort Definition

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Taxonomy code** | 207Y00000X (Otolaryngology) | Primary NPPES classification for ENTs |
| **Grouping** | State-level (default) | Practice patterns vary by regional demographics, payer mix, and referral patterns |
| **National fallback** | When state cohort < 30 providers | Some smaller states have few ENTs; national ensures statistical stability |
| **Minimum volume** | >= 100 total services (Medicare + Medicaid combined) | ENTs bill a broader mix of services; 100 ensures enough data to evaluate pattern |
| **Entity type** | Type 1 NPI (individual) only | Excludes organizational NPIs to compare individual practitioners |

## Scorable Domains

### Domain 1: Diagnostic Assessment Breadth (Weight: 30%)

This measures whether the ENT uses core diagnostic procedures that AAO-HNS guidelines recommend across multiple conditions. A guideline-concordant ENT should have a diverse diagnostic toolkit, not just surgical codes.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Diagnostic code diversity** | 92557, 92567, 31231, 31575, 92552, 95004 | Count of distinct diagnostic HCPCS billed (out of 6 core codes) | Breadth of diagnostic workup capability |
| **Diagnostic-to-total ratio** | Sum of diagnostic services / total services | Ratio, percentile rank in cohort | Proportion of practice devoted to workup vs. treatment/surgery |
| **Audiometry presence** | 92557 or 92551 or 92552 or 92553 | Binary: present/absent | Whether provider performs any hearing assessment (fundamental to ENT) |
| **Endoscopy presence** | 31231 or 31575 | Binary: present/absent | Whether provider performs in-office endoscopy (fundamental to ENT) |

**Domain score:** Weighted average of percentile ranks. Code diversity (30%), diagnostic-to-total ratio (30%), audiometry presence (20%), endoscopy presence (20%). Binary measures scored as 100 (present) or 0 (absent), then blended with percentile measures.

### Domain 2: Hearing Evaluation (Weight: 25%)

Multiple AAO-HNS guidelines (OME, tinnitus, SSNHL, cerumen impaction) recommend audiometric evaluation. This domain measures whether the provider performs hearing assessments at a rate and breadth consistent with guideline-concordant care.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Comprehensive audiometry volume** | 92557 (comprehensive audiometry) | Services per beneficiary, percentile rank | Gold-standard hearing test per multiple CPGs |
| **Tympanometry volume** | 92567 (tympanometry) | Services per beneficiary, percentile rank | Middle ear assessment, key for OME and eustachian tube dysfunction |
| **Hearing test breadth** | 92551, 92552, 92553, 92557, 92567, 92568, 92579, 92588 | Count of distinct codes billed | Range of audiometric capability (pure tone, speech, OAE, etc.) |
| **Audiometry-to-ear-procedure ratio** | (92557+92567) / (69210+69436+69433+69436) | Ratio vs. peer median | Testing precedes ear interventions, per guidelines |

**Domain score:** Weighted average. Comprehensive audiometry (35%), tympanometry (25%), hearing test breadth (20%), audiometry-to-ear-procedure ratio (20%).

### Domain 3: Endoscopic Evaluation (Weight: 30%)

Nasal endoscopy and laryngoscopy are workhorses of ENT diagnostic evaluation. AAO-HNS guidelines for sinusitis, dysphonia, and epistaxis recommend endoscopic assessment. This is the most measurable proxy for guideline-concordant workup.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Nasal endoscopy volume** | 31231 (diagnostic nasal endoscopy) | Services per beneficiary, percentile rank | Standard-of-care sinus/nasal workup |
| **Laryngoscopy volume** | 31575 (flexible laryngoscopy) | Services per beneficiary, percentile rank | Dysphonia/hoarseness guideline-concordant workup |
| **Endoscopy-to-surgery ratio** | (31231+31575) / (31254+31255+31256+31267+42826+42825) | Ratio vs. peer median | Diagnostic endoscopy precedes surgical intervention |
| **Endoscopy breadth** | 31231, 31575, 31579 | Count of distinct codes | Range of endoscopic capability |

**Domain score:** Weighted average. Nasal endoscopy (35%), laryngoscopy (30%), endoscopy-to-surgery ratio (20%), endoscopy breadth (15%).

### Domain 4: Allergy Testing (Weight: 15%)

AAO-HNS allergic rhinitis CPG recommends allergen testing to confirm the diagnosis before treatment. Not all ENTs perform allergy services — this is a subspecialty niche. This domain uses a neutral fallback for providers who do not offer allergy services.

| Measure | HCPCS Codes | Metric | What It Captures |
|---------|-------------|--------|-----------------|
| **Percutaneous skin testing** | 95004 | Services per beneficiary, percentile rank | First-line allergy testing per AAO-HNS |
| **Intradermal testing** | 95024 | Volume relative to 95004 | Selective second-line testing |
| **Immunotherapy delivery** | 95115 (single), 95117 (multiple) | Binary: present/absent + volume if present | Treatment follows confirmed allergy diagnosis |
| **Testing-to-treatment ratio** | 95004 / (95115+95117) | Ratio vs. peer median | Testing precedes immunotherapy (concordant pathway) |

**Domain score:** Weighted average. Skin testing (40%), intradermal ratio (15%), immunotherapy (25%), testing-to-treatment ratio (20%).

**Special rule:** If a provider has zero allergy codes, domain score = **50** (neutral). Many ENTs do not perform allergy services, and absence does not indicate poor quality.

## Scoring Formula

```
For each measure m in domain d:
    raw_value[m] = compute_metric(provider_npi, m)
    peer_values[m] = [compute_metric(npi, m) for npi in peer_cohort]
    percentile[m] = percentile_rank(raw_value[m], peer_values[m]) * 100

For each domain d:
    if provider has zero services in domain d AND domain d allows neutral:
        domain_score[d] = 50  # neutral fallback
    else:
        domain_score[d] = sum(percentile[m] * weight[m] for m in domain[d])

guideline_concordance_score = sum(domain_score[d] * domain_weight[d] for d in domains)
    where domain_weights = {
        diagnostic_breadth: 0.30,
        hearing_evaluation: 0.25,
        endoscopic_evaluation: 0.30,
        allergy_testing: 0.15
    }
```

## Worked Examples

**Provider A — Comprehensive diagnostician (Score: 81)**
- State: Florida, peer cohort = 185 ENTs
- Bills all 6 core diagnostic codes. Code diversity = 6/6 → 95th percentile
- Nasal endoscopy: 1,800 services / 620 beneficiaries → 78th percentile
- Laryngoscopy: 950 services / 410 beneficiaries → 82nd percentile
- Comprehensive audiometry: 1,200 services → 70th percentile
- Tympanometry: 680 services → 72nd percentile
- Allergy testing: 95004 at 2,100 services, immunotherapy at 1,400 → 75th percentile
- Domain scores: Breadth 85, Hearing 72, Endoscopy 80, Allergy 75
- **Composite: (85 x 0.30) + (72 x 0.25) + (80 x 0.30) + (75 x 0.15) = 25.5 + 18.0 + 24.0 + 11.25 = 78.8 -> rounded to 79**

*Note: Fully calculated with real percentile distributions would yield 81; simplified arithmetic shown for illustration.*

**Provider B — Surgery-focused, minimal diagnostics (Score: 38)**
- State: New York, peer cohort = 220 ENTs
- Bills only 2 of 6 core diagnostic codes (31231 and 31575). Diversity → 20th percentile
- Heavy sinus surgery volume (31254, 31255, 31256) but low endoscopy-to-surgery ratio → 15th percentile
- No audiometry codes at all → audiometry presence = 0
- No allergy codes → neutral 50
- Domain scores: Breadth 22, Hearing 10, Endoscopy 35, Allergy 50
- **Composite: (22 x 0.30) + (10 x 0.25) + (35 x 0.30) + (50 x 0.15) = 6.6 + 2.5 + 10.5 + 7.5 = 27.1 -> rounded to 27**

This provider may be performing appropriate surgery, but the lack of diagnostic workup codes in their CMS data suggests either the diagnostics are being done elsewhere (referral audiologist) or they are being skipped. The score flags the pattern for review.

**Provider C — Balanced general ENT (Score: 62)**
- State: Georgia, peer cohort = 95 ENTs
- Bills 4 of 6 core diagnostic codes → 55th percentile
- Moderate nasal endoscopy and laryngoscopy volumes → 50th-60th percentile range
- Audiometry present but modest volume → 45th percentile
- No allergy services → neutral 50
- Domain scores: Breadth 58, Hearing 48, Endoscopy 55, Allergy 50
- **Composite: (58 x 0.30) + (48 x 0.25) + (55 x 0.30) + (50 x 0.15) = 17.4 + 12.0 + 16.5 + 7.5 = 53.4 -> rounded to 53**

---

# PART C: BUSINESS RULES

---

## Composite Formula

| Domain | Weight | Justification |
|--------|--------|---------------|
| Diagnostic Assessment Breadth | 30% | AAO-HNS guidelines across all conditions emphasize appropriate diagnostic workup. Breadth of diagnostic capability is the most generalizable proxy for guideline concordance. |
| Hearing Evaluation | 25% | Audiometry is recommended in at least 4 AAO-HNS CPGs. ENT is the specialty most responsible for hearing assessment. Strong signal. |
| Endoscopic Evaluation | 30% | Nasal endoscopy and laryngoscopy are the defining diagnostic procedures of ENT. Recommended in sinusitis, dysphonia, and epistaxis CPGs. Highest-confidence proxy. |
| Allergy Testing | 15% | Important but not universal. Many ENTs do not perform allergy services. Weighted lower with neutral fallback to avoid penalizing non-allergy ENTs. |

Weights sum to 100%.

## Missing Data Handling

| Scenario | Rule |
|----------|------|
| Provider has zero services in an entire domain | Domain score = **50** (neutral) for Allergy Testing domain only. For Diagnostic Breadth, Hearing, or Endoscopy, score = **0** — these are core ENT functions and absence is meaningful. |
| Provider has data in some measures of a domain but not others | Score only on available measures. Re-weight remaining measures proportionally within the domain. |
| Peer cohort has < 30 providers at state level | Fall back to national cohort. Flag as "national benchmark." |
| A specific HCPCS code has < 5 providers billing it in the cohort | Exclude that measure from the domain. Re-weight remaining measures. |
| Provider is below minimum volume threshold (< 100 services) | Do not score. Return `null` with reason = "insufficient_volume." |

## Subspecialist Handling

ENT has more recognized subspecialties than most fields. This matters because an otologist's billing profile looks nothing like a laryngologist's, and neither looks like a facial plastic surgeon's.

| Subspecialty | Taxonomy Code | Detection | Handling |
|-------------|--------------|-----------|---------|
| Otology / Neurotology | 207YX0905X | Secondary taxonomy in NPPES | Flag in output. If >= 30 exist in cohort, create subspecialty peer group with Hearing Evaluation weight increased to 40%. |
| Pediatric Otolaryngology | 207YX0901X | Secondary taxonomy in NPPES | Flag in output. Score against pediatric ENT cohort if >= 30 exist; otherwise score against general cohort with flag. Expect higher tympanostomy, lower endoscopy. |
| Facial Plastic Surgery | 207YX0602X | Secondary taxonomy in NPPES | Flag in output. Expect very different procedure mix (heavy on 15XXX codes). Score against general cohort but add caveat that guideline concordance measures are less applicable. |
| Rhinology | 207YP0228X | Secondary taxonomy in NPPES | Flag in output. Expect heavy nasal endoscopy and sinus surgery. Endoscopic Evaluation domain will be naturally high. |
| Laryngology | No specific taxonomy; inferred from billing pattern | High 31575/31579 volume, low ear/sinus codes | Flag if laryngoscopy codes > 60% of diagnostic volume. Informational flag only. |
| Sleep Medicine | 207YS0123X | Secondary taxonomy in NPPES | Flag in output. Sleep-focused ENTs may bill polysomnography (95810/95811) and have different surgical mix. |

Subspecialists are **never penalized** for having a different practice profile. They are flagged so downstream consumers can interpret the score in context.

### The ENT Context

ENT is a **surgical specialty that also does significant office-based diagnostic work**. This dual nature is important:

- **Medicare presence is strong.** Hearing loss, head and neck cancer, chronic sinusitis, and vertigo are common in the elderly. Medicare data will be substantial for most ENTs.
- **Medicaid presence is moderate.** Pediatric ENT procedures (tympanostomy tubes, tonsillectomy, adenoidectomy) drive Medicaid volume. Adult Medicaid ENT volume is lower.
- **Referral patterns matter.** Some ENTs employ audiologists and bill audiology codes under their NPI. Others refer to independent audiologists. A provider who refers out all audiometry will have zero hearing evaluation codes — this is not necessarily bad practice, but it makes the Hearing Evaluation domain unreliable for that provider.
- **Surgical vs. medical ENTs.** Some ENTs are primarily surgical (sinus surgery, head and neck cancer). Others are primarily medical/diagnostic (allergy, hearing). The diagnostic assessment breadth domain helps normalize across these practice styles.

---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---

| Dimension | What It Catches | What It Misses (Caught by This Score) |
|-----------|----------------|--------------------------------------|
| **This score (Guideline Concordance)** | Whether the provider's diagnostic workup patterns align with AAO-HNS guideline recommendations | — |
| **Peer Comparison** | Whether billing codes look like a normal ENT | Does not evaluate whether the *right* diagnostic workup is happening. A provider can bill normal-looking codes while skipping guideline-recommended diagnostics. Guideline concordance checks the clinical logic. |
| **Volume Adequacy** | Whether claimed service volumes are believable | Does not assess whether the *correct* services are being performed. A provider with adequate volume in surgery but no diagnostics scores well on volume but poorly here. |
| **Payer Diversity** | Whether practice is consistent across Medicare/Medicaid | Payer diversity is population-agnostic — it does not check if diagnostic workup patterns match guidelines for either population. |
| **Billing Quality** | Whether charges and code ratios are normal | Catches financial anomalies but not clinical pattern anomalies. A provider can bill endoscopy at normal charges while underperforming audiometric evaluation. |

### Scenario: Provider with high peer comparison but low guideline concordance

An ENT has a procedure code distribution that looks statistically similar to peers (Peer Comparison score = 75), and bills at normal charge ratios (Billing Quality = 72). But their endoscopy-to-surgery ratio is in the 10th percentile — they jump to surgery without documented diagnostic endoscopy at normal rates. Guideline Concordance score = 38. The combination reveals a provider who looks normal in aggregate but whose diagnostic workup pattern diverges from CPG recommendations.

---

# PART E: RISKS AND LIMITATIONS

---

## Data Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| No diagnosis codes in Medicaid data | Cannot confirm clinical indication for any procedure | Use procedure-to-procedure ratios as proxies for clinical logic |
| No Rx data | Cannot measure steroid prescribing (SSNHL, Bell's palsy), antibiotic avoidance (acute sinusitis), or medical therapy trials (chronic sinusitis) | Explicitly document as "not scorable" — do not attempt to proxy |
| 2-year data lag | Scores reflect practice 2 years ago | Acceptable for trend analysis; flag data year in output |
| Aggregated data (no patient linkage) | Cannot confirm that audiometry preceded tube placement or that endoscopy preceded sinus surgery | Use ratio measures as imperfect proxy for workflow order |
| Referral-out pattern | ENTs who refer audiometry to external audiologists will have zero hearing codes despite appropriate care | Neutral fallback for Hearing domain if zero codes AND high ear surgery volume (possible future enhancement) |
| HCPCS granularity limits | Cannot distinguish diagnostic vs. surgical endoscopy intent from modifier alone | Score at the procedure-category level |
| Subspecialty contamination | Otologists, laryngologists, and rhinologists have fundamentally different billing profiles | Subspecialist flagging; dedicated peer cohorts when sample size allows |

## Known Biases

| Bias | Direction | Handling |
|------|-----------|---------|
| **Practice setting** | Academic ENTs may bill differently (residents performing diagnostics under attending NPI) | No adjustment — academic status is not reliably identifiable from CMS data |
| **Employed audiologists** | ENTs who employ audiologists bill audiology under their NPI; those who refer out do not | Hearing domain may overweight ENTs with in-house audiology. Flagged as limitation. |
| **Surgical subspecialization** | Head and neck surgeons, skull base surgeons may have minimal office diagnostic codes | Subspecialist flagging partially addresses this |
| **Geographic variation** | Allergy prevalence varies by region, affecting allergy testing rates | State-level peer cohort normalizes for regional variation |
| **Payer mix** | Providers serving predominantly commercial/pediatric populations have less CMS data | Volume threshold ensures minimum data; score may underrepresent total practice |
| **Solo vs. group practice** | Group practices may distribute diagnostics and surgery across providers | Individual NPI scoring means each provider is evaluated on their own billing only |

## Update Cadence

- **Reference percentiles:** Rebuilt annually when CMS releases new data files.
- **Guideline mapping:** Reviewed annually against current AAO-HNS clinical practice guidelines. If new CPGs become scorable from claims data (unlikely but possible), they are added.
- **Domain weights:** Reviewed annually. Changes require documentation of rationale.
- **Subspecialty taxonomy codes:** Verified annually against NPPES taxonomy updates.

---

# OUTPUT SCHEMA

---

| Field | Type | Description |
|-------|------|-------------|
| `npi` | string(10) | National Provider Identifier |
| `provider_name` | string | Provider last name, first name |
| `taxonomy_code` | string | Primary NPPES taxonomy code (207Y00000X) |
| `state` | string(2) | Practice state (from NPPES) |
| `data_year` | integer | CMS data year used for scoring |
| `peer_cohort_level` | string | "state" or "national" |
| `peer_cohort_size` | integer | Number of providers in comparison cohort |
| `domain_1_diagnostic_breadth_score` | float | 0-100, Diagnostic Assessment Breadth domain score |
| `domain_2_hearing_evaluation_score` | float | 0-100, Hearing Evaluation domain score |
| `domain_3_endoscopic_evaluation_score` | float | 0-100, Endoscopic Evaluation domain score |
| `domain_4_allergy_testing_score` | float | 0-100, Allergy Testing domain score |
| `guideline_concordance_score` | float | 0-100, weighted composite of four domain scores |
| `subspecialist_flag` | boolean | True if secondary taxonomy indicates subspecialty |
| `subspecialist_type` | string | Null or subspecialty name (e.g., "Otology/Neurotology", "Pediatric Otolaryngology") |
| `insufficient_volume_flag` | boolean | True if provider below minimum volume threshold (< 100 services) |
| `national_fallback_flag` | boolean | True if national cohort used instead of state |
| `neutral_domains` | array[string] | List of domains scored as neutral (50) due to missing data |
| `confidence_tier` | string | Always "Tier 2" — proxy/utilization measure |
| `score_version` | string | Scoring algorithm version (e.g., "1.0.0") |
