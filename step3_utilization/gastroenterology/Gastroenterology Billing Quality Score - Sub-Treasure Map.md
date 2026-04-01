# Gastroenterology Billing Quality Score: A Sub-Treasure Map

> **Dimension 5 of 5** in the Provider Quality Scoring System
> Scope: Billing behavior analysis for gastroenterology providers
> Version: 1.0
> Last updated: 2026-04-01

---

## What This Document Does

This document describes how we compute a **Billing Quality Score** (0-100) for
gastroenterology providers. The score checks billing behavior: charges, procedure
ratios, and E/M distribution. It answers one question:

> "Does this provider's billing pattern look like their GI peers, or are there
> statistical outliers that warrant a closer look?"

A high score means the provider's billing fingerprint is unremarkable -- charges
fall within peer norms, procedure mix is balanced, and no red flags fire. A low
score means one or more billing patterns deviate from the peer group. Deviation is
not fraud. It is a statistical signal that invites further review.

**Why GI billing is different from primary care.** Gastroenterology is a
procedural subspecialty. Colonoscopies, upper endoscopies, liver biopsies, and
therapeutic interventions generate high charges. Charge-to-allowed ratios are
naturally higher than in primary care or pediatrics. E/M visits skew toward 99214
(moderate complexity), not 99213, because GI patients present with inflammatory
bowel disease, chronic liver disease, cancer surveillance needs, and complex
medication management. The scoring system accounts for these specialty norms.

---

# PART A: WHAT WE HAVE

---

We pull from three public data sources. No private claims data is required.

### A1. Medicare Provider Utilization and Payment Data

Published annually by CMS. Each row is one provider-HCPCS code pair for a
calendar year. Key columns:

| Column | What it tells us |
|--------|-----------------|
| `Rndrng_NPI` | 10-digit National Provider Identifier |
| `HCPCS_Cd` | CPT/HCPCS code billed |
| `Tot_Srvcs` | Total service count for that code |
| `Tot_Benes` | Distinct beneficiaries who received the service |
| `Avg_Sbmtd_Chrg` | Average submitted (billed) charge |
| `Avg_Mdcr_Alowd_Amt` | Average Medicare allowed amount |
| `Avg_Mdcr_Pymt_Amt` | Average Medicare payment |

From these we derive the **charge-to-allowed ratio** per code and aggregate.

### A2. Medicaid State Drug Utilization / Provider Files

Where available, Medicaid files give us procedure-level counts by provider. We
use these to supplement Medicare ratios, particularly for providers with split
payer mixes.

### A3. NPPES (National Plan and Provider Enumeration System)

Gives us provider taxonomy codes. We filter to gastroenterology taxonomy
(207RG0100X) to build the specialty peer group. NPPES also provides practice
address for geographic peer grouping.

### A4. Derived Fields

From the raw data we compute:

| Derived field | Formula |
|---------------|---------|
| `charge_to_allowed` | `Avg_Sbmtd_Chrg / Avg_Mdcr_Alowd_Amt` per code |
| `weighted_charge_ratio` | Weighted average of per-code ratios by `Tot_Srvcs` |
| `total_em_visits` | Sum of `Tot_Srvcs` for 99211-99215 |
| `total_procedures` | Sum of `Tot_Srvcs` for colonoscopy, EGD, and therapeutic codes |
| `visits_per_beneficiary` | `total_em_visits / distinct_beneficiaries` |
| `colonoscopies_per_beneficiary` | `total_colonoscopy_services / distinct_beneficiaries` |

---

# PART B: THE LOGIC

---

## 1. Charge-to-Allowed Ratio

The charge-to-allowed ratio measures how much a provider bills relative to what
Medicare allows. Every provider sets their own charge master. Medicare pays a
fixed allowed amount regardless of the submitted charge.

**Formula (per code):**

```
charge_ratio_code = Avg_Sbmtd_Chrg / Avg_Mdcr_Alowd_Amt
```

**Formula (aggregate across all codes for one provider):**

```
weighted_charge_ratio = SUM(Avg_Sbmtd_Chrg * Tot_Srvcs) / SUM(Avg_Mdcr_Alowd_Amt * Tot_Srvcs)
```

The aggregate weights each code by volume so that high-volume codes (like 45378
diagnostic colonoscopy or 99214 office visit) dominate the ratio, while rarely
billed codes have minimal influence.

**Why GI ratios run higher than primary care.** Endoscopy facility charges and
professional fees are large dollar amounts. A colonoscopy submitted charge of
$3,500 against an allowed amount of $900 yields a 3.9x ratio on that code alone.
Primary care codes like 99213 might bill $250 against $110 allowed (2.3x). When
a GI provider's volume is 40% procedures, the aggregate ratio naturally rises.

---

## 2. Building the Peer Distribution

We compute `weighted_charge_ratio` for every gastroenterology provider in the
Medicare dataset (taxonomy 207RG0100X). Then we calculate percentiles.

**Illustrative GI peer distribution for charge-to-allowed ratio:**

| Percentile | p10 | p25 | Median | p75 | p90 |
|------------|-----|-----|--------|-----|-----|
| Ratio | 1.60x | 2.10x | 2.80x | 3.70x | 4.80x |

These are higher than pediatrics or family medicine benchmarks. That is expected.
A GI provider at 2.80x is right in the middle of the pack, not overbilling.

**Geographic adjustment (optional).** Charge master norms vary regionally. If we
have enough GI providers per state or MSA, we can build state-level peer groups.
The scoring logic is the same -- only the percentile thresholds change.

---

## 3. Scoring Bands

We use a **3-band scoring model** that converts the charge-to-allowed ratio into
a 0-100 score.

| Band | Condition | Score |
|------|-----------|-------|
| **Normal** | p25 <= ratio <= p75 | **100** |
| **Moderate outlier** | p10 <= ratio < p25 OR p75 < ratio <= p90 | **70** |
| **Extreme outlier** | ratio < p10 OR ratio > p90 | **40** |

**Pseudocode:**

```
function score_charge_ratio(provider_ratio, peer_percentiles):
    if peer_percentiles.p25 <= provider_ratio <= peer_percentiles.p75:
        return 100
    elif peer_percentiles.p10 <= provider_ratio <= peer_percentiles.p90:
        return 70
    else:
        return 40
```

**Why not a continuous score?** Charge masters are set by practice administrators,
not individual physicians. A provider at p76 is not meaningfully different from
one at p74. The 3-band model avoids false precision and focuses attention on true
outliers.

**Why the floor is 40, not 0.** An extreme charge ratio is a billing signal, not
proof of wrongdoing. Some practices deliberately set high charge masters to
maximize out-of-network reimbursement. That is a business decision, not a quality
failure. The floor of 40 reflects "notable but not disqualifying."

---

## 4. Per-Code Analysis

Beyond the aggregate ratio, we examine individual high-volume GI codes:

| HCPCS | Description | Typical GI charge ratio |
|-------|-------------|------------------------|
| 45378 | Diagnostic colonoscopy | 3.0-4.5x |
| 45385 | Colonoscopy with polypectomy (snare) | 3.2-4.8x |
| 45380 | Colonoscopy with biopsy | 3.0-4.5x |
| 43239 | EGD with biopsy | 2.8-4.2x |
| 43235 | EGD diagnostic | 2.8-4.0x |
| 99214 | Office visit, moderate complexity | 2.0-3.0x |
| 99215 | Office visit, high complexity | 2.0-3.2x |
| 99205 | New patient visit, high complexity | 2.2-3.5x |
| 91200 | Liver elastography (FibroScan) | 2.5-4.0x |

If a provider's aggregate ratio falls in the normal band but one specific code
has a ratio above p90, we note it as a per-code flag. Per-code flags do not
change the charge score directly but feed into the narrative summary.

---

# PART C: PROCEDURE RATIO ANALYSIS

---

The charge-to-allowed ratio tells us about pricing. Procedure ratio analysis
tells us about **practice patterns**. We look at the relationships between
different services to see if the provider's clinical behavior matches GI peers.

---

## 5. E/M Level Distribution

Gastroenterology E/M visits skew higher in complexity than primary care. GI
patients present with inflammatory bowel disease (Crohn's, ulcerative colitis),
chronic hepatitis B/C, cirrhosis management, cancer surveillance after polypectomy,
and complex motility disorders. These conditions require substantial medical
decision-making, which justifies higher E/M levels.

**Expected GI E/M distribution:**

| Code | Level | Typical GI % | Primary Care % (for comparison) |
|------|-------|--------------|---------------------------------|
| 99211 | Minimal | 0-1% | 2-5% |
| 99212 | Straightforward | 1-3% | 8-15% |
| 99213 | Low complexity | 25-35% | 40-55% (dominant in primary care) |
| 99214 | Moderate complexity | 40-50% | 25-35% |
| 99215 | High complexity | 15-25% | 5-12% |

**KEY DIFFERENCE FROM PEDIATRICS:** In pediatrics, 99213 is the dominant E/M code
because well-child checks and acute minor illness drive volume. In GI, **99214 is
the dominant code**. This is expected and appropriate. A GI consultation involves
interpreting endoscopy results, managing chronic conditions with immunosuppressive
therapy, making cancer screening interval decisions, and coordinating care across
hepatology, oncology, and surgery. These activities meet the criteria for moderate
complexity medical decision-making.

**How we score E/M distribution:**

```
function evaluate_em_distribution(provider_em_counts, peer_distributions):
    provider_pct = calculate_percentages(provider_em_counts)

    flags = []

    # Red flag: 99215 dominance
    if provider_pct['99215'] > 0.30:
        flags.append('RED: 99215 exceeds 30% of E/M visits')

    # Red flag: combined high-complexity dominance
    high_complex_pct = provider_pct['99214'] + provider_pct['99215']
    if high_complex_pct > peer_distributions['99214_99215_combined'].p90:
        flags.append('RED: 99214+99215 combined above peer p90')

    # Green flag: 99214 dominance within expected range
    if 0.35 <= provider_pct['99214'] <= 0.55:
        flags.append('GREEN: 99214 percentage within expected GI range')

    # Yellow flag: 99213 dominance (unusual for GI)
    if provider_pct['99213'] > 0.50:
        flags.append('YELLOW: 99213 dominates -- unusual for GI subspecialty')

    return flags
```

Even for GI, 99215 above 30% is a red flag. High-complexity visits are justified
for some patients (new IBD diagnosis, decompensated cirrhosis), but if nearly a
third of all visits hit the highest level, the documentation and coding should be
examined.

---

## 6. Green Flag Ratios

Green flags are billing patterns that suggest appropriate, thorough clinical care.
When a green flag fires, it means the provider's ratio falls within an expected
range for good GI practice.

We define **11 green flag checks**.

---

### 6A. Polypectomy-to-Colonoscopy Ratio

```
polypectomy_ratio = (services_45385 + services_45384 + services_45390) /
                    (services_45378 + services_45380 + services_45385 +
                     services_45384 + services_45390)
```

**Green flag:** ratio between 25% and 45%.

**Clinical logic:** The adenoma detection rate (ADR) is the single most important
quality metric in colonoscopy. ADR targets are typically 25%+ for average-risk
screening. The polypectomy-to-colonoscopy ratio is the closest billing proxy for
ADR. A ratio of 25-45% suggests the endoscopist finds and removes polyps at
expected rates. Below 15% suggests the endoscopist misses polyps. Above 55%
suggests either an unusual patient population or possible overcoding of
polypectomy services.

---

### 6B. Biopsy-to-EGD Ratio

```
biopsy_egd_ratio = services_43239 / (services_43235 + services_43239)
```

**Green flag:** ratio between 60% and 85%.

**Clinical logic:** Most EGDs should include tissue sampling. Barrett's esophagus
surveillance requires systematic biopsies. Celiac disease diagnosis requires
duodenal biopsies. Gastritis workup benefits from antral and corpus biopsies for
H. pylori and atrophic gastritis assessment. A biopsy rate of 60-85% indicates
thorough endoscopic practice. Below 40% suggests missed sampling opportunities.

---

### 6C. H. pylori Testing-to-EGD Ratio

```
hpylori_ratio = (services_87338 + services_83009 + services_83013) /
                (services_43235 + services_43239)
```

**Green flag:** ratio above peer p75.

**Clinical logic:** H. pylori is a major driver of peptic ulcer disease and
gastric cancer risk. Testing for H. pylori in the context of upper endoscopy is
guideline-concordant. A high ratio indicates the provider actively tests for and
manages H. pylori infection.

---

### 6D. Hepatitis Screening-to-Visit Ratio

```
hep_screen_ratio = (services_86803 + services_87340) / total_em_visits
```

**Green flag:** ratio above peer p75.

**Clinical logic:** GI providers manage chronic hepatitis B and C. Universal
hepatitis C screening is recommended for all adults. A high screening ratio
relative to visit volume suggests the provider follows screening guidelines.

---

### 6E. Therapeutic-to-Diagnostic Colonoscopy Ratio

```
therapeutic_ratio = (services_45385 + services_45384 + services_45390 +
                     services_45381) / services_45378
```

**Green flag:** ratio between 0.5 and 2.0.

**Clinical logic:** A healthy GI practice performs a mix of diagnostic
colonoscopies (45378) and therapeutic interventions (polypectomy, biopsy, control
of bleeding). If the ratio is below 0.5, most colonoscopies are purely diagnostic
with no interventions -- possibly appropriate for a screening-heavy practice, but
worth noting. If above 2.0, the provider performs far more therapeutic procedures
than diagnostic ones, which could indicate upcoding from diagnostic to
therapeutic.

---

### 6F. Liver Elastography-to-Hepatitis Screening Ratio

```
fibroscan_ratio = services_91200 / (services_86803 + services_87340)
```

**Green flag:** ratio above peer p75.

**Clinical logic:** When a patient screens positive for hepatitis B or C, fibrosis
staging is the next clinical step. Transient elastography (FibroScan, CPT 91200)
is the non-invasive standard. A high ratio indicates the provider follows through
from screening to fibrosis assessment, which is guideline-concordant care.

---

### 6G. Pathology-to-Biopsy Ratio

```
path_ratio = services_88305 / (services_43239 + services_45380)
```

**Green flag:** ratio between 0.5 and 1.5.

**Clinical logic:** When tissue is biopsied during endoscopy, it should be sent
for pathologic examination. The ratio should be close to 1.0. Ratios below 0.5
suggest biopsied tissue is not consistently sent for pathology. Ratios above 1.5
suggest either multiple specimen submissions per biopsy or pathology billing
misattribution.

---

### 6H. New Patient-to-Procedure Ratio

```
new_to_proc = (services_99204 + services_99205) / total_procedure_volume
```

**Green flag:** ratio between peer p25 and p75.

**Clinical logic:** Good GI practice involves evaluating new patients in the
office before proceeding to endoscopy. A reasonable ratio of new patient visits
to procedures suggests the provider is not performing procedures without adequate
pre-procedure assessment. Very low ratios raise questions about whether patients
are being scoped without proper evaluation.

---

### 6I. Complexity Add-On (G2211) Ratio

```
g2211_ratio = services_G2211 / total_established_em
```

**Green flag:** ratio between peer p25 and p75.

**Clinical logic:** G2211 is the visit complexity inherent to E/M associated with
medical care services for an ongoing condition. GI providers managing IBD,
cirrhosis, and chronic hepatitis may legitimately bill this add-on. A ratio
within the peer interquartile range suggests appropriate use.

**Red flag:** ratio above peer p90. Excessive G2211 use beyond peers suggests
routine application without clinical justification.

---

### 6J. Breath Test-to-Visit Ratio

```
breath_ratio = services_91065 / total_em_visits
```

**Green flag:** ratio above peer p75.

**Clinical logic:** Hydrogen breath testing (CPT 91065) is used for SIBO (small
intestinal bacterial overgrowth) and lactose intolerance diagnosis. It is a
non-invasive test that can reduce unnecessary endoscopies. A higher-than-average
breath test ratio suggests the provider uses non-invasive diagnostic strategies.

---

### 6K. EGD Dilation-to-EGD Ratio

```
dilation_ratio = (services_43249 + services_43248) / (services_43235 + services_43239)
```

**Green flag:** ratio between 5% and 15%.

**Clinical logic:** Esophageal dilation is performed for strictures, eosinophilic
esophagitis, and dysphagia. A rate of 5-15% of EGDs involving dilation is
consistent with expected stricture prevalence in a general GI endoscopy practice.
Below 5% may indicate the provider refers dilations out. Above 15% may indicate a
specialized practice or potential overuse.

---

## 7. Red Flag Ratios

Red flags are billing patterns that deviate from peer norms in ways that suggest
potential overutilization, upcoding, or unusual practice patterns. A red flag is
not an accusation. It is a data point that says "this is statistically unusual."

We define **14 red flag checks**.

---

### 7A. Return Visit Intensity

```
visits_per_beneficiary = total_em_visits / distinct_beneficiaries
```

**Red flag:** above peer p90.

**Clinical logic:** If a GI provider sees the same patients far more frequently
than peers, it may indicate unnecessary follow-up visits. Some conditions (active
IBD flares, decompensated cirrhosis) justify frequent visits, but the overall
rate should not be an extreme outlier.

---

### 7B. New-to-Established Visit Ratio

```
new_patient_pct = (services_99202 + services_99203 + services_99204 + services_99205) /
                  total_em_visits
```

**Red flag:** new patient percentage far above peer p90.

**Clinical logic:** An unusually high new patient percentage could indicate patient
churning (seeing patients once and not retaining them for continuity) or incorrect
use of new patient codes for established patients.

---

### 7C. Colonoscopy-to-Visit Ratio (Excessive Scoping)

```
scope_intensity = total_colonoscopy_services / total_em_visits
```

**Red flag:** above peer p90.

**Clinical logic:** This is one of the most important GI-specific red flags. A
provider who performs colonoscopies at an unusually high rate relative to office
visits may be over-scoping. Screening colonoscopy guidelines recommend 10-year
intervals for average-risk patients. If the ratio is extreme, the provider may be
performing surveillance colonoscopies at intervals shorter than guidelines
recommend.

---

### 7D. Same-Code Repeat Intensity

**Red flag:** any single procedure code billed more than peer p90 times per
beneficiary.

**Clinical logic:** If a provider bills the same procedure code for the same
patient pool at rates far above peers, it suggests either repeat procedures
(appropriate for some clinical scenarios) or billing errors. For example, a
provider billing 45378 three times per beneficiary on average when peers average
once per beneficiary warrants review.

---

### 7E. High EGD-Without-Biopsy Rate

```
egd_no_biopsy = services_43235 / (services_43235 + services_43239)
```

**Red flag:** ratio above 50%.

**Clinical logic:** If more than half of a GI provider's EGDs do not include
biopsy, it raises questions about missed sampling opportunities. Most upper
endoscopies performed by gastroenterologists should include tissue sampling for
diagnostic purposes (Barrett's surveillance, celiac screening, H. pylori
assessment, gastritis evaluation).

---

### 7F. Colonoscopy Without Polypectomy When Expected

**Red flag:** high colonoscopy volume (above peer median) but polypectomy ratio
below peer p10.

**Clinical logic:** A provider performing many colonoscopies but removing very few
polyps may have a low adenoma detection rate. This is a quality concern. National
guidelines recommend ADR of at least 25%. A very low polypectomy ratio is the
billing proxy for a low ADR.

---

### 7G. After-Hours Billing Rate

```
after_hours_rate = services_99051 / total_em_visits
```

**Red flag:** above peer p90.

**Clinical logic:** After-hours service codes should be used only when services
are rendered outside normal office hours. An unusually high rate suggests possible
inappropriate use of the add-on code.

---

### 7H. High-Complexity Visit Dominance

**Red flag:** 99215 > 30% of E/M visits OR 99214 + 99215 combined above peer p90.

**Clinical logic:** Even in GI, where E/M visits appropriately skew higher than
primary care, an extreme concentration in the highest complexity levels is unusual.
If nearly a third of all visits are coded 99215, the documentation burden should
be examined. This may indicate legitimate complexity (e.g., a hepatology-focused
practice with many cirrhosis patients) or may indicate upcoding.

---

### 7I. Single-Code Dominance

**Red flag:** any single code represents more than 25% of total billing revenue,
with exceptions for 45378 (diagnostic colonoscopy) and 99214 (office visit) which
can naturally be high-volume codes in GI.

**Clinical logic:** Extreme concentration in one billing code suggests a narrow
practice pattern. In most cases this is clinically explicable (an endoscopy-heavy
practice), but it deserves notation.

---

### 7J. Procedures Without Office Visits

**Red flag:** high procedure volume (> 50 total procedures) but fewer than 20
office visits.

**Clinical logic:** A GI provider who performs many endoscopies but sees very few
patients in the office may be working exclusively in an ambulatory surgery center
(ASC). This is not inherently problematic, but it means the pre-procedure
evaluation is happening elsewhere. The flag is informational.

---

### 7K. Pathology Without Biopsy (or Reverse)

**Red flag:** 88305 (surgical pathology) volume > 20 but biopsy procedure codes
(43239, 45380) = 0. Or the reverse: biopsy codes > 20 but pathology = 0.

**Clinical logic:** Tissue biopsied during endoscopy should generate pathology
reports. If the numbers are disconnected, either (a) the provider bills pathology
for specimens from other sources, (b) biopsied tissue is not being sent for
analysis, or (c) there is a billing attribution issue.

---

### 7L. Colonoscopy Volume Per Beneficiary

```
colonoscopies_per_bene = total_colonoscopy_services / distinct_beneficiaries
```

**Red flag:** above peer p90.

**Clinical logic:** If a provider performs colonoscopies on the same patient
population at a rate far above peers, it may indicate surveillance intervals
shorter than guideline recommendations. Screening every 10 years, surveillance
every 3-5 years for history of adenomas.

---

### 7M. E/M Complexity Trend (Multi-Year)

**Red flag:** year-over-year increase in high-complexity visits (99214 + 99215 as
a percentage of total E/M) faster than the peer group trend.

**Clinical logic:** If the entire GI peer group shifts 2% toward higher-complexity
visits over a year (reflecting national coding trends), that is expected. If one
provider shifts 15% while peers shift 2%, that is a statistical outlier. This
check requires multi-year data.

---

### 7N. Modifier 25 Proxy

**Red flag (future check):** high rate of E/M visits on the same day as procedure
codes, suggesting routine use of modifier 25 to bill a separate E/M on procedure
days.

**Note:** This check may not be reliably detectable from aggregated CMS data,
which does not include date-of-service detail at the claim level. We document it
here as a future enhancement if claim-level data becomes available. In the current
implementation, this check is **not scored** and is excluded from ratio totals.

---

## 8. More Green Flags

The 11 green flags defined in Section 6 cover the primary positive billing
signals. No additional green flags are defined in this section, but the framework
supports adding specialty-specific green flags as new data sources become
available (e.g., capsule endoscopy utilization, motility testing ratios).

---

## 9. More Red Flags

The 14 red flags defined in Section 7 cover the primary negative billing signals.
As with green flags, additional red flags can be added as the model evolves. 
Potential future red flags include:

- **Excessive conscious sedation billing** relative to procedure volume
- **High rate of incomplete colonoscopies** (if modifier data becomes available)
- **Unusual infusion therapy volume** (biologic administration codes) without
  corresponding E/M complexity

---

## 10. Cross-Category Consistency Checks

These checks look at whether the provider's billing profile is internally
consistent. They fire as **yellow flags** (or red/neutral as noted) rather than
directly penalizing or rewarding.

We define **8 cross-category checks**.

| # | Check | Logic | Flag Level |
|---|-------|-------|------------|
| 10A | Colonoscopy but no E/M visits | colonoscopy_services > 20 AND total_em = 0 | **Red**: should evaluate patients in office |
| 10B | E/M visits but no procedures | total_em > 100 AND total_procedures = 0 | **Yellow**: cognitive-only GI is unusual |
| 10C | EGD but no colonoscopy | egd_services > 20 AND colonoscopy_services = 0 | **Yellow**: most GI does both upper and lower |
| 10D | Polypectomy but no pathology | polypectomy_services > 10 AND pathology_88305 = 0 | **Yellow**: polyps should be sent for pathology |
| 10E | Pathology but no biopsy procedures | pathology_88305 > 20 AND (services_43239 + services_45380) = 0 | **Yellow**: where are specimens coming from? |
| 10F | Hepatitis screening but no elastography | hep_screening > 20 AND services_91200 = 0 | **Neutral**: elastography adoption varies by practice |
| 10G | High colonoscopy + zero H. pylori testing | colonoscopy_services > 100 AND hpylori_tests = 0 | **Yellow**: H. pylori testing is core GI |
| 10H | Breath test but no H. pylori stool test | services_91065 > 10 AND services_87338 = 0 | **Neutral**: reflects different testing strategy preferences |

**How cross-category flags are scored:**

- **Red** cross-category flags count as red flags in the ratio analysis.
- **Yellow** cross-category flags count as neutral (0.5 weight) in the ratio
  analysis.
- **Neutral** cross-category flags count as neutral (0.5 weight) in the ratio
  analysis.

---

## 11. Summary: All Ratio Checks

The table below lists every ratio check, its section reference, type, and data
source.

| # | Check Name | Section | Type | Data Source |
|---|-----------|---------|------|-------------|
| 1 | Polypectomy-to-colonoscopy ratio | 6A | Green | Medicare utilization |
| 2 | Biopsy-to-EGD ratio | 6B | Green | Medicare utilization |
| 3 | H. pylori testing-to-EGD ratio | 6C | Green | Medicare utilization |
| 4 | Hepatitis screening-to-visit ratio | 6D | Green | Medicare utilization |
| 5 | Therapeutic-to-diagnostic colonoscopy ratio | 6E | Green | Medicare utilization |
| 6 | Liver elastography-to-hepatitis screening ratio | 6F | Green | Medicare utilization |
| 7 | Pathology-to-biopsy ratio | 6G | Green | Medicare utilization |
| 8 | New patient-to-procedure ratio | 6H | Green | Medicare utilization |
| 9 | Complexity add-on (G2211) ratio | 6I | Green | Medicare utilization |
| 10 | Breath test-to-visit ratio | 6J | Green | Medicare utilization |
| 11 | EGD dilation-to-EGD ratio | 6K | Green | Medicare utilization |
| 12 | Return visit intensity | 7A | Red | Medicare utilization |
| 13 | New-to-established visit ratio | 7B | Red | Medicare utilization |
| 14 | Colonoscopy-to-visit ratio (excessive scoping) | 7C | Red | Medicare utilization |
| 15 | Same-code repeat intensity | 7D | Red | Medicare utilization |
| 16 | High EGD-without-biopsy rate | 7E | Red | Medicare utilization |
| 17 | Colonoscopy without polypectomy when expected | 7F | Red | Medicare utilization |
| 18 | After-hours billing rate | 7G | Red | Medicare utilization |
| 19 | High-complexity visit dominance | 7H | Red | Medicare utilization |
| 20 | Single-code dominance | 7I | Red | Medicare utilization |
| 21 | Procedures without office visits | 7J | Red | Medicare utilization |
| 22 | Pathology without biopsy (or reverse) | 7K | Red | Medicare utilization |
| 23 | Colonoscopy volume per beneficiary | 7L | Red | Medicare utilization |
| 24 | E/M complexity trend (multi-year) | 7M | Red | Medicare utilization (multi-year) |
| 25 | Colonoscopy but no E/M visits | 10A | Red (cross) | Medicare utilization |
| 26 | E/M visits but no procedures | 10B | Yellow (cross) | Medicare utilization |
| 27 | EGD but no colonoscopy | 10C | Yellow (cross) | Medicare utilization |
| 28 | Polypectomy but no pathology | 10D | Yellow (cross) | Medicare utilization |
| 29 | Pathology but no biopsy procedures | 10E | Yellow (cross) | Medicare utilization |
| 30 | Hepatitis screening but no elastography | 10F | Neutral (cross) | Medicare utilization |
| 31 | High colonoscopy + zero H. pylori testing | 10G | Yellow (cross) | Medicare utilization |
| 32 | Breath test but no H. pylori stool test | 10H | Neutral (cross) | Medicare utilization |

**Total: 32 scored ratio checks** (11 green, 13 red, 8 cross-category).

Note: Check 7N (Modifier 25 proxy) is excluded from scoring because it requires
claim-level data not currently available. It is documented for future use.

---

## 12. Scoring the Ratio Analysis

Each check produces one of three outcomes:

| Outcome | Weight |
|---------|--------|
| **Green flag fires** (ratio in expected range) | 1.0 |
| **Neutral** (yellow or neutral cross-category, or check not applicable) | 0.5 |
| **Red flag fires** (ratio outside expected range) | 0.0 |

**Formula:**

```
ratio_analysis_score = ((green_count * 1.0) + (neutral_count * 0.5) + (red_count * 0.0))
                       / total_applicable_checks * 100
```

**Pseudocode:**

```
function score_ratio_analysis(provider_data, peer_distributions):
    green = 0
    neutral = 0
    red = 0
    total = 0

    for each check in ALL_RATIO_CHECKS:
        if check.is_applicable(provider_data):
            total += 1
            result = check.evaluate(provider_data, peer_distributions)
            if result == GREEN:
                green += 1
            elif result == RED:
                red += 1
            else:
                neutral += 1

    if total == 0:
        return NULL  # insufficient data

    return ((green * 1.0) + (neutral * 0.5) + (red * 0.0)) / total * 100
```

**Handling inapplicable checks.** If a provider has zero volume for a required
code (e.g., no EGDs billed, so biopsy-to-EGD ratio cannot be computed), that
check is excluded from the denominator. The score reflects only checks where
we have sufficient data.

**Score interpretation:**

| Score Range | Interpretation |
|-------------|---------------|
| 85-100 | Billing patterns consistent with peer norms; mostly green flags |
| 65-84 | Some deviations from peer norms; mix of green and neutral |
| 45-64 | Notable deviations; multiple red flags or predominantly neutral |
| 0-44 | Significant outlier billing patterns; many red flags |

---

# PART D: COMPOSITE BILLING QUALITY SCORE

---

The final Billing Quality Score combines the charge-to-allowed ratio score (Part
B) with the ratio analysis score (Part C) using a weighted average.

## Formula

```
billing_quality_composite = (charge_score * 0.35) + (ratio_analysis_score * 0.65)
```

**Why 35/65 weighting?** The charge-to-allowed ratio reflects charge master
pricing, which is a practice-level decision with limited clinical significance.
The ratio analysis reflects actual clinical practice patterns, which are more
meaningful for quality assessment. We weight clinical behavior more heavily.

## Full Pseudocode

```
function compute_billing_quality_score(provider_npi, data, peer_group):
    # Step 1: Compute charge-to-allowed ratio
    charge_ratio = compute_weighted_charge_ratio(provider_npi, data)

    # Step 2: Look up peer percentiles for GI
    peer_pcts = get_peer_percentiles(peer_group, specialty='gastroenterology')

    # Step 3: Score the charge ratio using 3-band model
    if peer_pcts.p25 <= charge_ratio <= peer_pcts.p75:
        charge_score = 100
    elif peer_pcts.p10 <= charge_ratio <= peer_pcts.p90:
        charge_score = 70
    else:
        charge_score = 40

    # Step 4: Run all ratio checks
    green_count = 0
    neutral_count = 0
    red_count = 0
    total_checks = 0

    for check in ALL_RATIO_CHECKS:
        if check.has_sufficient_data(provider_npi, data):
            total_checks += 1
            result = check.evaluate(provider_npi, data, peer_pcts)
            if result == 'GREEN':
                green_count += 1
            elif result == 'RED':
                red_count += 1
            else:
                neutral_count += 1

    # Step 5: Compute ratio analysis score
    if total_checks > 0:
        ratio_score = ((green_count * 1.0) +
                       (neutral_count * 0.5) +
                       (red_count * 0.0)) / total_checks * 100
    else:
        ratio_score = 50  # default when insufficient data

    # Step 6: Compute composite
    composite = (charge_score * 0.35) + (ratio_score * 0.65)

    # Step 7: Clamp to 0-100
    composite = max(0, min(100, composite))

    return {
        'charge_ratio': charge_ratio,
        'charge_score': charge_score,
        'green_flags': green_count,
        'neutral_flags': neutral_count,
        'red_flags': red_count,
        'total_checks': total_checks,
        'ratio_analysis_score': ratio_score,
        'billing_quality_composite': composite
    }
```

## Worked Example: Provider A (Typical Community GI)

**Charge-to-allowed ratio:** 2.75x

- Peer p25 = 2.10x, p75 = 3.70x
- 2.10 <= 2.75 <= 3.70 --> **Normal band**
- `charge_score = 100`

**Ratio analysis:** 11 checks applicable

| Result | Count | Checks |
|--------|-------|--------|
| Green | 8 | Polypectomy ratio 32%, biopsy-to-EGD 72%, H. pylori testing above p75, hep screening above p75, therapeutic ratio 1.2, pathology ratio 0.9, new-to-proc in IQR, dilation ratio 8% |
| Neutral | 2 | G2211 ratio at p60 (within range but closer to median), breath test at p50 |
| Red | 1 | Return visit intensity at p92 |

```
ratio_score = ((8 * 1.0) + (2 * 0.5) + (1 * 0.0)) / 11 * 100
            = (8.0 + 1.0 + 0.0) / 11 * 100
            = 9.0 / 11 * 100
            = 81.8
```

**Composite:**

```
billing_quality_composite = (100 * 0.35) + (81.8 * 0.65)
                          = 35.0 + 53.2
                          = 88.2
```

**Interpretation:** Score of 88 indicates a provider with normal charge pricing
and mostly appropriate practice patterns. The one red flag (high return visit
intensity) is worth investigating but does not dominate the overall picture.

---

## Worked Example: Provider B (Outlier Pattern)

**Charge-to-allowed ratio:** 5.10x

- Peer p90 = 4.80x
- 5.10 > 4.80 --> **Extreme outlier band**
- `charge_score = 40`

**Ratio analysis:** 12 checks applicable

| Result | Count | Checks |
|--------|-------|--------|
| Green | 3 | Polypectomy ratio 30%, pathology ratio 1.1, dilation ratio 10% |
| Neutral | 4 | Biopsy-to-EGD at 55% (below green threshold), new-to-proc at p30, E/M visits but no procedures (yellow cross), breath test at p40 |
| Red | 5 | Colonoscopy-to-visit ratio above p90, 99215 at 35% of E/M, colonoscopy per bene above p90, EGD without biopsy at 52%, high colonoscopy + zero H. pylori testing |

```
ratio_score = ((3 * 1.0) + (4 * 0.5) + (5 * 0.0)) / 12 * 100
            = (3.0 + 2.0 + 0.0) / 12 * 100
            = 5.0 / 12 * 100
            = 41.7
```

**Composite:**

```
billing_quality_composite = (40 * 0.35) + (41.7 * 0.65)
                          = 14.0 + 27.1
                          = 41.1
```

**Interpretation:** Score of 41 indicates a provider with aggressive charge
pricing AND multiple concerning practice patterns. The combination of excessive
scoping, high per-beneficiary colonoscopy rates, low biopsy rates, and E/M
upcoding paints a picture that warrants closer review. This is not a diagnosis
of fraud -- it is a statistical signal that this provider's billing fingerprint
differs substantially from GI peers.

---

## Worked Example: Provider C (ASC-Based Endoscopist)

**Charge-to-allowed ratio:** 3.50x

- 2.10 <= 3.50 <= 3.70 --> **Normal band**
- `charge_score = 100`

**Ratio analysis:** 8 checks applicable (many E/M-based checks not applicable
due to low office visit volume)

| Result | Count | Checks |
|--------|-------|--------|
| Green | 4 | Polypectomy ratio 38%, pathology ratio 1.0, therapeutic ratio 1.5, biopsy-to-EGD 75% |
| Neutral | 2 | Hepatitis screening N/A (scored neutral), elastography N/A (scored neutral) |
| Red | 2 | Procedures without office visits, colonoscopy but no E/M visits |

```
ratio_score = ((4 * 1.0) + (2 * 0.5) + (2 * 0.0)) / 8 * 100
            = (4.0 + 1.0 + 0.0) / 8 * 100
            = 5.0 / 8 * 100
            = 62.5
```

**Composite:**

```
billing_quality_composite = (100 * 0.35) + (62.5 * 0.65)
                          = 35.0 + 40.6
                          = 75.6
```

**Interpretation:** Score of 76 reflects a provider with normal pricing but a
procedure-heavy practice with minimal office-based care. The red flags are
structural (ASC-only practice) rather than behavioral. This is a legitimate
practice model, and the score reflects that -- it does not fall into the low
range, but the flags document the pattern for context.

---

# PART E: HOW THIS FITS WITH OTHER SCORES

---

The Billing Quality Score is Dimension 5 of a 5-dimension provider quality
scoring system. Each dimension answers a different question.

| Dimension | Score | Question Answered | Type |
|-----------|-------|-------------------|------|
| 1 | Clinical Quality Score | Does this provider deliver evidence-based care? | Clinical outcomes |
| 2 | Patient Experience Score | Do patients report positive experiences? | Patient-reported |
| 3 | Access & Availability Score | Can patients get timely appointments? | Structural |
| 4 | Cost Efficiency Score | Does this provider use resources efficiently? | Economic |
| 5 | **Billing Quality Score** | **Does this provider's billing pattern match peers?** | **Billing behavior** |

### Why All Five Dimensions Matter

No single score tells the whole story. Consider these scenarios:

**Scenario 1: High clinical quality, low billing quality.**
A GI provider has excellent adenoma detection rates (Dimension 1) and great
patient reviews (Dimension 2), but their billing shows 99215 for 40% of visits
and a charge ratio at p95. The Billing Quality Score flags the coding pattern
even though clinical outcomes are strong. This provider may be delivering great
care but overcoding the documentation level.

**Scenario 2: Normal billing, poor clinical quality.**
A provider's billing is perfectly average -- charge ratio at median, no red flags.
But their polypectomy-to-colonoscopy ratio is low AND their clinical quality
metrics show below-average adenoma detection. The Billing Quality Score is fine
(green flag on polypectomy ratio did not fire, but it also did not go red because
the ratio sits at 20%, just below the 25% green threshold). Dimension 1 catches
what Dimension 5 misses.

**Scenario 3: Great billing, poor access.**
A provider bills perfectly within norms, but patients wait 6 months for a
colonoscopy appointment. Dimension 3 (Access) captures this; Dimension 5 does
not.

**Scenario 4: Low cost efficiency, normal billing quality.**
A provider orders expensive biologic medications when cheaper alternatives exist.
Their billing patterns are normal (they bill correctly for what they do), but
Dimension 4 flags the high cost per episode. Billing Quality and Cost Efficiency
measure different things.

**Scenario 5: All dimensions aligned.**
A provider scores 85+ across all five dimensions. This is the target state:
clinically effective, patient-centered, accessible, cost-efficient, and billing
within norms.

### Composite Provider Quality Score

The five dimensions can be combined into an overall Provider Quality Score using
weights determined by the program's priorities:

```
overall_quality = (clinical * w1) + (experience * w2) + (access * w3) +
                  (cost * w4) + (billing * w5)

where w1 + w2 + w3 + w4 + w5 = 1.0
```

Default weights are defined in the master scoring document and are outside the
scope of this sub-treasure map.

---

# OUTPUT SCHEMA

---

The Billing Quality Score module produces one row per provider with the following
columns:

| Column | Type | Description | Range |
|--------|------|-------------|-------|
| `npi` | string | 10-digit National Provider Identifier | -- |
| `provider_name` | string | Last name, first name from NPPES | -- |
| `specialty_taxonomy` | string | NPPES taxonomy code | 207RG0100X for GI |
| `data_year` | integer | Calendar year of Medicare data | e.g. 2023 |
| `total_services` | integer | Sum of Tot_Srvcs across all codes | >= 0 |
| `total_beneficiaries` | integer | Distinct beneficiaries served | >= 0 |
| `total_em_visits` | integer | Sum of E/M visit services | >= 0 |
| `total_procedures` | integer | Sum of endoscopy/procedure services | >= 0 |
| `weighted_charge_ratio` | float | Aggregate charge-to-allowed ratio | > 0 |
| `charge_score` | integer | 3-band score from charge ratio | 40, 70, or 100 |
| `charge_band` | string | Which band the ratio falls in | normal, moderate, extreme |
| `em_99211_pct` | float | Percentage of E/M coded 99211 | 0.0 - 1.0 |
| `em_99212_pct` | float | Percentage of E/M coded 99212 | 0.0 - 1.0 |
| `em_99213_pct` | float | Percentage of E/M coded 99213 | 0.0 - 1.0 |
| `em_99214_pct` | float | Percentage of E/M coded 99214 | 0.0 - 1.0 |
| `em_99215_pct` | float | Percentage of E/M coded 99215 | 0.0 - 1.0 |
| `polypectomy_ratio` | float | Section 6A ratio | 0.0 - 1.0 |
| `biopsy_egd_ratio` | float | Section 6B ratio | 0.0 - 1.0 |
| `hpylori_ratio` | float | Section 6C ratio | >= 0 |
| `hep_screen_ratio` | float | Section 6D ratio | >= 0 |
| `therapeutic_ratio` | float | Section 6E ratio | >= 0 |
| `fibroscan_ratio` | float | Section 6F ratio | >= 0 |
| `pathology_ratio` | float | Section 6G ratio | >= 0 |
| `new_to_proc_ratio` | float | Section 6H ratio | >= 0 |
| `g2211_ratio` | float | Section 6I ratio | 0.0 - 1.0 |
| `breath_test_ratio` | float | Section 6J ratio | >= 0 |
| `dilation_ratio` | float | Section 6K ratio | 0.0 - 1.0 |
| `visits_per_bene` | float | Section 7A metric | >= 0 |
| `scope_intensity` | float | Section 7C ratio | >= 0 |
| `colonoscopies_per_bene` | float | Section 7L metric | >= 0 |
| `green_flag_count` | integer | Number of green flags fired | >= 0 |
| `neutral_flag_count` | integer | Number of neutral/yellow flags | >= 0 |
| `red_flag_count` | integer | Number of red flags fired | >= 0 |
| `total_checks_applied` | integer | Number of applicable checks | >= 0 |
| `ratio_analysis_score` | float | Score from ratio analysis | 0.0 - 100.0 |
| `billing_quality_composite` | float | Final composite score | 0.0 - 100.0 |
| `flag_details` | JSON | Array of objects describing each flag | -- |

**`flag_details` schema (per element):**

```json
{
  "check_number": 1,
  "check_name": "Polypectomy-to-colonoscopy ratio",
  "section": "6A",
  "type": "green",
  "provider_value": 0.32,
  "threshold_low": 0.25,
  "threshold_high": 0.45,
  "result": "GREEN",
  "narrative": "Polypectomy ratio of 32% is within the 25-45% green range, consistent with adequate adenoma detection."
}
```

---

## Key Rules Summary

1. **All scores are 0-100.** No exceptions.
2. **Charge scoring uses 3 bands:** p25-p75 = 100, p10-p90 = 70, outlier = 40.
3. **Ratio formula:** `(green * 1.0 + neutral * 0.5 + red * 0.0) / total * 100`.
4. **Composite formula:** `charge_score * 0.35 + ratio_analysis_score * 0.65`.
5. **GI E/M distribution skews to 99214**, not 99213. This is expected.
6. **32 scored ratio checks:** 11 green, 13 red (plus 7N documented but not scored), 8 cross-category.
7. **Inapplicable checks are excluded** from the denominator, not counted as neutral.
8. **Plain English throughout.** Every formula has a clinical explanation. Every flag has a "why this matters" statement.

---

*End of Gastroenterology Billing Quality Score Sub-Treasure Map.*
