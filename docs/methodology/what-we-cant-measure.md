# What We Can't Measure

This page documents the known limitations of Meroka's quality scoring. It exists because we think you deserve to know what the scores are not saying, not just what they are.

These are not edge cases or theoretical gaps. They are structural limitations of the underlying data sources. Understanding them will help you interpret scores correctly and avoid drawing conclusions the data doesn't support.

---

## No Diagnosis Codes

The CMS Medicaid billing file (T-MSIS) contains provider and spending information but does not include ICD-10 diagnosis codes. Medicare Part B data does not include diagnosis codes at the encounter level either.

**What this means in practice:**

- We cannot measure antibiotic prescribing appropriateness (we can't see what diagnosis drove the prescription)
- We cannot assess chronic disease management quality (we can see diabetes-related procedure codes but not whether the patient's A1c was actually controlled)
- We cannot evaluate age-appropriate screening (we can see that a Pap smear was billed, but cannot verify it was indicated for this patient's age and history)
- We cannot distinguish appropriate high-utilization from unnecessary high-utilization at the patient level

This is not a gap we can engineer around with the current data. It would require access to clinical records or encounter-level claims with diagnosis codes — neither of which is available in free CMS bulk data.

---

## No Prescription Data

Our current pipeline does not incorporate prescription data. CMS publishes a Medicare Part D prescribing dataset, but we have not integrated it into the active scoring pipeline, and Medicaid prescription data at the provider level is not consistently available.

**What this means in practice:**

- We cannot measure medication appropriateness (are opioids being prescribed in alignment with guidelines?)
- We cannot assess adherence support or medication management quality
- We cannot evaluate prescribing patterns for high-risk drug classes
- We cannot identify providers with unusual prescribing behavior relative to peers

This is a gap we can close for Medicare Part D providers. Medicaid prescribing will remain harder to measure given state variation in data availability.

---

## No Patient-Level Linkage

All data in our current pipeline is aggregated at the provider level. We receive counts of services, averages of charges, and totals by procedure code — not individual patient records.

**What this means in practice:**

- We cannot track individual care journeys (whether a patient who had a procedure also received appropriate follow-up)
- We cannot measure episode quality (what happened from the first visit through the resolution of a condition)
- We cannot compute patient-level outcomes (did the treatment work?)
- We cannot identify providers whose aggregate numbers look fine but whose worst-outcome patients are consistently worse than peers

This limitation is fundamental to working with claims summary data. Addressing it would require access to de-identified patient-level claims, which is available through employer data partnerships but not through public CMS downloads.

---

## Commercial Insurance Blind Spot

Every CMS dataset we use — MIPS, Medicare Physician & Other Practitioners, Medicaid T-MSIS — covers Medicare and Medicaid patients only. Patients with commercial insurance (employer-sponsored, ACA marketplace, individual coverage) are invisible in this data.

**What this means in practice:**

- A provider who sees primarily commercially insured patients will have limited or no data in our pipeline, regardless of their actual quality
- This disproportionately affects certain specialties: OB-GYN serves a predominantly working-age population with commercial coverage; pediatricians see patients covered by CHIP and commercial plans. Their billing behavior in Medicare data is essentially a different (and smaller) practice than their full scope of work
- A provider's billing pattern analysis is based on their Medicare patients only, not their entire panel. A specialist who sees 500 Medicare patients a year and 1,500 commercially insured patients a year is scored on 25% of their practice
- Scores are labeled with data coverage information, but the gap can still mislead if not understood

The commercial blind spot is the single largest structural limitation of public claims-based quality measurement. The only path to closing it is employer data partnerships that provide de-identified commercial claims.

---

## What "No Data" Actually Means

Across every dimension, an absence of data is treated as a data gap, not a quality signal.

- A provider with no MIPS score is not penalized — their Step 2 weight redistributes to other dimensions
- A provider with no Medicare billing history does not fail the Practice Pattern Analysis — they are flagged as having insufficient data
- A provider with no Google or Healthgrades reviews receives a lower-confidence score, not a lower score
- A provider who doesn't report telehealth availability is not ranked below one who does

This design is intentional. We believe it is worse to penalize good providers for data absence than to be conservative about scores where evidence is thin. Scores with limited supporting data are clearly marked with their confidence tier.

---

## What We're Working Toward

The following improvements are in progress or planned:

**Clinical outcomes from employer claims.** Self-insured employers receive de-identified claims data for their employees. Partnerships with employers or TPAs (third-party administrators) would give us access to commercial claims with diagnosis codes, allowing episode-level quality measurement and genuine outcome tracking. This is the highest-impact data gap to close.

**ABMS integration.** The American Board of Medical Specialties maintains authoritative board certification data across all major specialties. Integrating ABMS data into the Credentials & Training dimension would improve certification verification accuracy and add continuing certification (MOC) status.

**Validated patient experience from partnerships.** Current patient experience scores aggregate Google and Healthgrades reviews, which vary widely in volume, recency, and representativeness. Partnerships with validated patient satisfaction survey vendors (Press Ganey, NRC Health) would provide standardized, high-volume, verified experience data.

**NPDB access.** The National Practitioner Data Bank aggregates malpractice settlements and adverse actions nationally. Access requires registration as a querying entity. Establishing this access would significantly strengthen the Safety Gate and surface malpractice patterns not visible in state board records alone.

---

*This document is updated when data sources change or new limitations are identified. Last updated: 2026-04-09.*

*Return to [How Meroka Scores Providers](./quality-scoring-methodology.md)*
