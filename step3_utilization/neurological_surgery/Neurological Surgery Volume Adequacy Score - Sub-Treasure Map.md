# Neurological Surgery Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

Presence alone is weak. The peer comparison doc checks whether a neurosurgeon bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A neurosurgeon who bills 22853 (interbody device insertion) twice in a year while performing 80 fusions is not routinely using interbody devices — they billed it twice, possibly for a specific case. A neurosurgeon who bills 22853 70 times with 80 fusions is genuinely incorporating interbody fusion into their practice. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50**.


---

# PART A: WHAT WE HAVE

---

Same free CMS data:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service volume + beneficiary count.
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count.
3. **NPPES NPI Registry** — taxonomy 207T00000X.

Volume adequacy needs only HCPCS code volumes per NPI and total visit/procedure volume. No diagnosis codes required.


---

# PART B: THE LOGIC

---


## 1. What We Measure Against: Visit + Procedure Volume as the Denominator

Neurosurgery uses two denominators depending on the category being checked:

**Denominator A: Total encounter volume** (for technology and ancillary categories)
```
encounter_codes = [99213, 99214, 99215, 99204, 99205, 99203, 99212,  -- E/M
                   99223, 99232, 99233,                                -- hospital
                   63047, 63048, 63030, 22551, 22612, 22633,           -- major spine
                   61510, 61518, 61312, 61154, 62223]                  -- major cranial

total_encounter_volume = SUM(total_services) WHERE hcpcs_code IN encounter_codes
```

**Denominator B: Total spine surgical volume** (for fusion-specific categories)
```
spine_surgical_volume = SUM(total_services) WHERE hcpcs_code IN
    [63047, 63048, 63030, 63042, 22551, 22552, 22612, 22614, 22630, 22633]
```

**Denominator C: Total fusion volume** (for instrumentation categories)
```
fusion_volume = SUM(total_services) WHERE hcpcs_code IN
    [22551, 22552, 22612, 22614, 22630, 22633, 22634]
```

If `total_encounter_volume` < 50 in the measurement year, skip this provider. Too little data.


## 2. The Categories and Their Floors

> **ASSUMPTION:** Peer median rates and floors are estimates based on neurosurgical practice patterns. Must be validated against actual CMS data. Floors are set at approximately one-third of the estimated peer median rate.

| # | Category | Codes | Denominator | Peer Median Rate | Floor | What the Floor Means |
|---|---|---|---|---|---|---|
| 1 | Spine instrumentation | 22842, 22843, 22844, 22840 | fusion_volume | ~85% of fusions | 28% | Provider instruments a meaningful proportion of fusions, not occasionally |
| 2 | Interbody device insertion | 22853 | fusion_volume | ~60% of fusions | 20% | Provider uses interbody cages/devices routinely with fusion |
| 3 | Bone graft harvesting | 20936, 20930, 20937, 20938 | fusion_volume | ~70% of fusions | 23% | Provider harvests/uses graft material routinely |
| 4 | Image guidance / navigation | 61781, 61782, 61783 | total_encounter_volume | ~3% of encounters | 1% | Provider uses stereotactic navigation as routine surgical adjunct |
| 5 | Cranial tumor surgery | 61510, 61518, 61519, 61520, 61521 | total_encounter_volume | ~1% of encounters | 0.3% | Provider performs craniotomies for tumor at a real volume |
| 6 | CSF diversion (shunts) | 62223, 62230, 61210 | total_encounter_volume | ~0.5% of encounters | 0.15% | Provider manages hydrocephalus as part of practice |
| 7 | Trauma cranial surgery | 61312, 61314, 61154, 61107 | total_encounter_volume | ~0.3% of encounters | 0.1% | Provider does emergency cranial procedures |
| 8 | Multi-level decompression | 63048 | spine_surgical_volume | ~15% of spine cases | 5% | Provider does multi-level decompressions routinely, not rarely |
| 9 | Cervical fusion (ACDF) | 22551, 22552 | fusion_volume | ~30% of fusions | 10% | Provider does cervical as well as lumbar fusion |
| 10 | Peripheral nerve surgery | 64721, 64718, 64708 | total_encounter_volume | ~1% of encounters | 0.3% | Provider performs nerve procedures as routine part of practice |

**Why only 10 categories, not 25 codes?**

We do not volume-check E/M codes (99213, 99214, 99215) or the dominant spine decompression code (63047). If a neurosurgeon is seeing patients and operating at all, those codes are inherently high-volume. The volume check matters for categories where a provider might bill a code once or twice without it being a real practice pattern: instrumentation, interbody devices, navigation, cranial procedures.

> **ASSUMPTION:** Category 1-3 (instrumentation, interbody device, bone graft) are the most affected by the facility billing artifact. Some hospitals bill implant and graft codes under the facility NPI. If a provider's fusion volume is high but instrumentation/device/graft volume is near zero, check place-of-service before flagging — it may be a billing arrangement, not a practice deficiency.


## 3. Scoring Each Category

```
category_services = SUM(total_services) WHERE hcpcs_code IN category_codes
category_rate = category_services / relevant_denominator

IF category_services = 0:
    status = "not_detected"
ELIF category_rate >= floor:
    status = "ok"
ELSE:
    status = "flag"
```

| Status | Meaning | Counted in Score? |
|---|---|---|
| not_detected | Provider does not bill any codes in this category | No. Excluded from denominator. |
| ok | Provider bills at or above the floor | Yes. Numerator + denominator. |
| flag | Provider bills but below the floor | Yes. Denominator only. |


## 4. The Volume Adequacy Score

```
detected_categories = COUNT WHERE status IN ("ok", "flag")
ok_categories = COUNT WHERE status = "ok"

IF detected_categories = 0:
    volume_adequacy_score = 50     -- neutral fallback
ELSE:
    volume_adequacy_score = (ok_categories / detected_categories) * 100
```


## 5. Why the Neutral Fallback Matters

If a neurosurgeon only bills E/M visits and basic decompressions (no fusion, no cranial, no navigation), they have zero detected categories for volume checking. That is already penalized in peer comparison (low code/category coverage). Volume adequacy says: "of the things you claim to do, do you do them for real?" If you claim nothing beyond basics, the answer is neither yes nor no. It is 50.


---

# PART C: BUSINESS LOGIC DETAIL

---


## 6. Worked Examples

**Provider A: Full-spectrum neurosurgeon.** 1,500 total encounters, 120 spine surgeries, 60 fusions.

| Category | Services | Rate | Denominator | Floor | Status |
|---|---|---|---|---|---|
| Spine instrumentation | 54 | 90.0% of fusions | fusion_vol | 28% | ok |
| Interbody device | 38 | 63.3% of fusions | fusion_vol | 20% | ok |
| Bone graft | 48 | 80.0% of fusions | fusion_vol | 23% | ok |
| Image guidance | 22 | 1.5% of encounters | encounter_vol | 1% | ok |
| Cranial tumor | 18 | 1.2% of encounters | encounter_vol | 0.3% | ok |
| CSF diversion | 8 | 0.5% of encounters | encounter_vol | 0.15% | ok |
| Trauma cranial | 5 | 0.3% of encounters | encounter_vol | 0.1% | ok |
| Multi-level decompression | 25 | 20.8% of spine | spine_vol | 5% | ok |
| Cervical fusion (ACDF) | 20 | 33.3% of fusions | fusion_vol | 10% | ok |
| Peripheral nerve | 12 | 0.8% of encounters | encounter_vol | 0.3% | ok |

Detected: 10. Ok: 10. Score: **(10/10) * 100 = 100**.


**Provider B: Spine-only, community practice.** 1,200 total encounters, 100 spine surgeries, 50 fusions.

| Category | Services | Rate | Denominator | Floor | Status |
|---|---|---|---|---|---|
| Spine instrumentation | 42 | 84.0% of fusions | fusion_vol | 28% | ok |
| Interbody device | 30 | 60.0% of fusions | fusion_vol | 20% | ok |
| Bone graft | 35 | 70.0% of fusions | fusion_vol | 23% | ok |
| Image guidance | 5 | 0.4% of encounters | encounter_vol | 1% | **flag** |
| Cranial tumor | 0 | — | — | — | not_detected |
| CSF diversion | 0 | — | — | — | not_detected |
| Trauma cranial | 0 | — | — | — | not_detected |
| Multi-level decompression | 18 | 18.0% of spine | spine_vol | 5% | ok |
| Cervical fusion (ACDF) | 15 | 30.0% of fusions | fusion_vol | 10% | ok |
| Peripheral nerve | 8 | 0.7% of encounters | encounter_vol | 0.3% | ok |

Detected: 7. Ok: 6. Score: **(6/7) * 100 = 85.7**.

Provider B is a strong spine surgeon. Image guidance is present but at trace volume — flagged. Cranial categories are not detected (already penalized in peer comparison). Score reflects that what they claim to do is mostly at believable volume.


**Provider C: Hospital-employed neurosurgeon, implant codes billed under facility.** 1,000 encounters, 80 spine surgeries, 45 fusions.

| Category | Services | Rate | Denominator | Floor | Status |
|---|---|---|---|---|---|
| Spine instrumentation | 2 | 4.4% of fusions | fusion_vol | 28% | **flag** |
| Interbody device | 0 | — | — | — | not_detected |
| Bone graft | 1 | 2.2% of fusions | fusion_vol | 23% | **flag** |
| Image guidance | 15 | 1.5% of encounters | encounter_vol | 1% | ok |
| Cranial tumor | 10 | 1.0% of encounters | encounter_vol | 0.3% | ok |
| CSF diversion | 5 | 0.5% of encounters | encounter_vol | 0.15% | ok |
| Trauma cranial | 3 | 0.3% of encounters | encounter_vol | 0.1% | ok |
| Multi-level decompression | 12 | 15.0% of spine | spine_vol | 5% | ok |
| Cervical fusion (ACDF) | 12 | 26.7% of fusions | fusion_vol | 10% | ok |
| Peripheral nerve | 0 | — | — | — | not_detected |

Detected: 8. Ok: 6. Score: **(6/8) * 100 = 75.0**.

Provider C flags on instrumentation and bone graft — these are billed under the hospital NPI, not the surgeon. This is the known facility billing artifact.


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## 7. The Scores Together

| Score | Question | Standard |
|---|---|---|
| **Guideline Concordance** | Does this neurosurgeon follow CNS/AANS guidelines? | CNS/AANS clinical guidelines |
| **Peer Comparison** | Does their billing look like a normal neurosurgeon? | Peer cohort (top 25 codes) |
| **Volume Adequacy** | For what they claim to do, is the volume real? | Minimum floor rates |

| Problem | Guideline | Peer | Volume |
|---|---|---|---|
| Provider never does cranial surgery | Caught (cranial domain = 0) | Caught (missing cranial category) | Not applicable (nothing to check) |
| Provider bills navigation but only twice a year | Partial | Not caught (code is present) | **Caught** (below floor) |
| Provider does everything but in wrong proportions | Missed | Caught (low volume concordance) | Partially caught |
| Provider only does E/M visits, no surgery | Caught (all surgical domains = 0) | Caught (low code/category coverage) | Neutral (score = 50) |


---

# PART E: RISKS AND LIMITATIONS

---


## 8. Risks

**Floors are estimates.** Set at one-third of estimated peer medians. Actual medians must be computed from CMS data.

**The facility billing artifact is significant for neurosurgery.** Instrumentation (22842), interbody devices (22853), and bone graft (20936) codes are the most affected. Hospital-employed neurosurgeons will systematically flag on these categories. Consider excluding implant/graft categories for providers identified as hospital-based via place-of-service data.

**Case mix drives expected rates.** A spine-only surgeon will have different category detection patterns than a general neurosurgeon. Volume adequacy does not adjust for practice focus.

**Trauma volume is unpredictable.** Emergency cranial surgery volume depends on practice setting (Level I trauma center vs. community hospital), not provider quality. Low trauma volume in a community setting is structural, not a deficiency.

**New neurosurgeons and fellows will have incomplete patterns.** Require >=12 months of data before scoring.

**Floors should be rebuilt annually.** Practice patterns evolve (e.g., growth of robotic-assisted spine surgery, minimally invasive approaches).


---

## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP |
| geo_group_level | string | "state", "national", or "zip3" |
| floor_cohort_state | string | State used for floor computation (or "US") |
| floor_cohort_size | int | Number of peers in cohort |
| total_encounter_volume | int | Total encounters |
| spine_surgical_volume | int | Total spine procedures |
| fusion_volume | int | Total fusion procedures |
| instrumentation_services | int | Instrumentation code count |
| instrumentation_rate | float | Rate against fusion volume |
| instrumentation_status | string | "ok", "flag", or "not_detected" |
| interbody_services | int | 22853 count |
| interbody_rate | float | Rate against fusion volume |
| interbody_status | string | Status |
| graft_services | int | Bone graft code count |
| graft_rate | float | Rate against fusion volume |
| graft_status | string | Status |
| nav_services | int | Navigation code count |
| nav_rate | float | Rate against encounter volume |
| nav_status | string | Status |
| cranial_tumor_services | int | Craniotomy/tumor code count |
| cranial_tumor_rate | float | Rate |
| cranial_tumor_status | string | Status |
| csf_diversion_services | int | Shunt code count |
| csf_diversion_rate | float | Rate |
| csf_diversion_status | string | Status |
| trauma_cranial_services | int | Trauma cranial code count |
| trauma_cranial_rate | float | Rate |
| trauma_cranial_status | string | Status |
| multilevel_decomp_services | int | 63048 count |
| multilevel_decomp_rate | float | Rate against spine volume |
| multilevel_decomp_status | string | Status |
| cervical_fusion_services | int | ACDF code count |
| cervical_fusion_rate | float | Rate against fusion volume |
| cervical_fusion_status | string | Status |
| peripheral_nerve_services | int | Nerve procedure count |
| peripheral_nerve_rate | float | Rate against encounter volume |
| peripheral_nerve_status | string | Status |
| detected_categories | int | Count with status ok or flag (0-10) |
| ok_categories | int | Count with status ok (0-10) |
| flagged_categories | int | Count with status flag (0-10) |
| flagged_category_list | string | Names of flagged categories |
| volume_adequacy_score | float | (ok/detected)*100, or 50 if detected=0 |
