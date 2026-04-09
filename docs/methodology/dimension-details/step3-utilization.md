# Step 3: Practice Pattern Analysis

**Weight in composite:** 20% (redistributes when insufficient data)
**Confidence Tier:** Moderate (Tier 2 — utilization proxy, not direct clinical quality)

*Return to [How Meroka Scores Providers](../quality-scoring-methodology.md)*

---

## What This Dimension Measures

Step 3 answers: do this provider's billing patterns look like a well-functioning practice in their specialty?

This dimension does not measure clinical outcomes. It measures what providers bill for, how their procedure volumes compare to peers in the same specialty and state, and whether their billing behavior is consistent with typical practice patterns. These are proxies for quality — useful signals, not direct evidence.

The core intuition is that systematic billing anomalies (unusually high charge ratios, absence of expected screening codes, atypical procedure distributions) can be a flag worth investigating. Equally, billing patterns that closely resemble high-functioning peers in the same specialty provide some evidence of an organized, active practice.

Peer comparison is specialty-specific and state-level. A family physician in rural West Virginia is compared to other family physicians in West Virginia, not to urban cardiologists in Massachusetts. When a state cohort is too small (fewer than 30 providers in a specialty), we fall back to national peer comparison.

---

## Data Sources

| Source | What It Gives Us | Access |
|--------|-----------------|--------|
| CMS Medicare Physician & Other Practitioners | Per-NPI HCPCS code, service count, beneficiary count, average submitted charge, average Medicare allowed amount, average Medicare payment | CMS bulk download, free |
| CMS Medicaid Provider Spending (T-MSIS) | Per-NPI total services and total spending for Medicaid. No per-code detail. | CMS bulk download, free |
| NPPES NPI Registry | Taxonomy code, specialty confirmation, state, entity type (individual vs. organization) | CMS bulk download, free |

---

## How the Score Is Calculated

The Practice Pattern Analysis produces a composite 0-100 score from five sub-dimensions. Each sub-dimension is scored against a specialty-specific peer cohort.

| Sub-Dimension | What It Measures |
|---------------|-----------------|
| Measurable Guideline Adherence | Whether billing patterns reflect expected adherence to clinical guidelines that are detectable through procedure codes |
| Peer Comparison | How closely the provider's HCPCS code distribution matches their specialty peer cohort |
| Volume Adequacy | Whether service volumes are sufficient to reflect an active, experienced practice in the specialty |
| Payer Presence | Whether the provider has both Medicare and Medicaid activity, as a signal of breadth of patient panel |
| Billing Quality | Whether charge-to-allowed ratios and procedure code distributions are within normal ranges for the specialty |

**Specialty coverage:** 14 specialties are covered in the current implementation:

Allergy & Immunology, Family Medicine, Gastroenterology, General Surgery, Hematology/Oncology, Internal Medicine, Neurology, OB-GYN, Orthopaedic Surgery, Otolaryngology, Pain Medicine, Pediatrics, Psychiatry, and Urology.

Providers in specialties not on this list receive a null score for Step 3, and the dimension's weight redistributes to other dimensions in the composite.

**Peer cohort construction:** For each specialty, the peer cohort is built from providers in the same state with the same primary taxonomy code, a minimum service volume (typically 100 Medicare services per year), and entity type 1 (individual practitioner). Sub-specialty codes are handled as separate cohorts where volume permits, to avoid comparing a subspecialist's billing pattern against a generalist's.

**Score computation:** Each sub-dimension produces a 0-100 score. The five sub-dimensions are weighted and combined into the Step 3 composite. The resulting score is normalized to 0-100 before contributing to the overall composite.

---

## What This Dimension Catches

- Billing outliers: charge-to-allowed ratios significantly above or below specialty peers
- Under-screening: absence of expected preventive or diagnostic procedure codes that should appear at baseline rates for a specialty
- Unusual procedure volumes: volumes far above or below peers, which may reflect an unusually narrow or unusually broad practice scope
- Coding anomalies: procedure code distributions inconsistent with typical practice in the specialty
- Low volume flags: providers with service counts insufficient to draw meaningful conclusions

---

## Known Limitations

**Only 19% of clinical guidelines are measurable from billing data.** Clinical guidelines typically describe decisions made in the exam room: when to prescribe, what to counsel, how to interpret test results, what follow-up to schedule. Most of these decisions do not produce a distinct billing code. The subset of guidelines that produce a specific CPT or HCPCS code — screening procedures, diagnostic tests, specific treatments — is the only portion visible in claims data. Guideline adherence estimates from billing data represent a minority of the full clinical guideline landscape.

**Peer comparison measures conformity, not quality.** A high peer comparison score means the provider bills like their peers. This is not the same as billing correctly, or billing in the way that produces the best patient outcomes. If a peer cohort has a systematic practice pattern that diverges from guidelines (a common finding in specialties with significant geographic variation), conforming to that peer group scores well while deviating from it (in a potentially correct direction) scores poorly. We treat peer comparison as one signal among several, not as a quality verdict.

**Payer presence scoring is limited by Medicaid data depth.** The T-MSIS Medicaid spending file provides provider-level totals (total services, total spending) but not per-code detail. This limits payer presence analysis to a binary or volume-only check (is the provider billing Medicaid at all, and how much?). We cannot compare Medicaid procedure code distributions the same way we can for Medicare.

**Thresholds are initial defaults, pending outcome validation.** The specific ranges used for peer comparison (what counts as "normal," what counts as an outlier) are calibrated from the distribution of the peer cohort itself, not from validated outcomes data. We do not yet have evidence that providers who score highly on Practice Pattern Analysis produce better patient outcomes than those who score lower. The thresholds reflect current best judgment pending validation against employer claims data or clinical outcome data when available.

**OB-GYN analysis is Medicare-only for a Medicaid-dominant specialty.** OB-GYN serves a predominantly working-age, commercially insured patient population. Medicare OB-GYN data reflects a small and potentially unrepresentative slice of an OB-GYN's practice — primarily gynecological care for patients 65 and older, not obstetric care, which is the majority of many OB-GYN practices. Procedure code ratios built from this Medicare data (delivery rates, prenatal visit ratios, postpartum follow-up rates) will look structurally different from what the same provider's full claims data would show. This is a known limitation that affects the validity of OB-GYN practice pattern scores more than most other specialties.

**Practice Pattern Analysis cannot see commercial patients.** Like all CMS-sourced dimensions, this step is blind to commercially insured patients. A provider who sees 80% commercially insured patients is scored on the 20% who appear in Medicare or Medicaid data. For some specialties (internal medicine, geriatrics), this is a reasonable proxy. For others (OB-GYN, pediatrics, psychiatry), the Medicare/Medicaid population may be systematically different from the provider's full practice, making the billing pattern analysis less representative.

---

## Confidence Tier

**Moderate (Tier 2).** This dimension measures billing behavior, not clinical outcomes. The inferences — that appropriate billing patterns correlate with appropriate clinical care — are reasonable but not proven. Results should be interpreted as signals that merit follow-up, not as clinical quality verdicts.

Scores are clearly labeled with the number of years of data available, the size of the peer cohort used for comparison, and the Medicare service volume underlying the analysis. Low-volume scores (providers with fewer than 100 Medicare services per year) are flagged as lower confidence because small sample sizes produce less stable peer comparison results.
