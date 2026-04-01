# Pain Medicine Volume Adequacy Score: A Sub-Treasure Map


## What This Document Does

The peer comparison doc checks whether a provider bills the right codes. This doc checks whether those codes show up at believable volume relative to the provider's practice size.

A pain medicine provider who bills 64493 (lumbar facet joint injection) twice in a year while seeing 400 patients is not routinely performing facet blocks. They billed it twice, maybe as a one-off, maybe by accident. A provider who bills 64493 eighty times with 400 patients is running a real facet block practice. The first should not get credit. The second should.

For each detected category, we test: does this code volume look like a routine part of this provider's workflow, or is it a trace? Each category gets scored **ok** or **flag**. The final score is the percent marked ok. If no measurable categories are detected at all, the provider gets a neutral **50** instead of an automatic fail.


---

# PART A: WHAT WE HAVE

---

Same free CMS data as the other pain medicine docs:

1. **CMS Medicare Physician & Other Practitioners** — NPI + HCPCS + service count + beneficiary count. Primary data source for pain medicine (Medicare-heavy specialty).
2. **CMS Medicaid Provider Spending** — NPI + HCPCS + service volume + beneficiary count, 2018-2024. Secondary source. Lower pain medicine volume than Medicare but significant for dual-eligible patients.
3. **NPPES NPI Registry** — provider identification, taxonomy codes 208VP0000X, 208VP0014X, 2084P0800X, 2081P2900X.

Volume adequacy needs only HCPCS code volumes per NPI and total visit volume. No diagnosis codes required. No Rx data required.

### Combined Payer Scoring

**Design decision:** Volume is computed from **combined Medicare + Medicaid claims**. Unlike pediatrics, where Medicare is a thin supplement, Medicare is the primary payer signal for pain medicine. Splitting payers would artificially deflate volume for providers with a mixed payer panel, which is most pain medicine providers in Massachusetts.

Payer source is tracked separately in the output schema so that downstream consumers can identify payer concentration and data completeness. See Output Schema.

**Known limitation:** Combined volume does not mean combined patient counts. Beneficiary deduplication across Medicare and Medicaid is not possible with the free CMS data. Total beneficiary counts will be overstated for dual-eligible patients. This affects beneficiary-based metrics but does not affect volume adequacy scoring, which uses service counts only.


---

# PART B: THE LOGIC

---


## 1. Peer Cohort Structure

**This is a departure from the pediatrics model.** Pediatrics has one taxonomy code (208000000X) and one peer cohort. Pain medicine has four taxonomy codes with structurally different practice patterns. Providers are assigned to cohorts as follows:

| Cohort | Taxonomy Codes | Inclusion Rule |
|---|---|---|
| **Core Pain** (default) | 208VP0000X (Pain Medicine), 208VP0014X (Pain Medicine - Interventional) | Always included |
| **Core Pain** | 2081P2900X (PM&R - Pain Medicine) | Always included — dedicated pain subspecialty code |
| **Neuro-Pain** (separate) | 2084P0800X (Psychiatry & Neurology - Pain Medicine) | Always scored in own cohort with different benchmarks |

**Why the split:**

- PM&R - Pain Medicine providers (2081P2900X) are included in the Core Pain cohort as a dedicated pain subspecialty. Their code mix may include rehabilitation services alongside pain procedures, but the subspecialty designation confirms pain medicine practice.
- Psychiatry & Neurology pain providers (2084P0800X) practice non-interventional pain medicine. Their workflow is medication management and E/M-heavy, not procedural. Scoring them against interventionalists would systematically penalize their legitimate practice pattern.

**Output schema requirement:** Every scored provider gets a `taxonomy_cohort` field ("core_pain" or "neuro_pain") so employers see which peer group a provider was scored against.


## 2. What We Measure Against: Visit Volume as the Denominator

Every volume check is a ratio: category volume divided by total visit volume. The denominator is the provider's total outpatient E/M visit count plus consultation codes, which is the best proxy for practice size in an outpatient-dominant specialty.

```
visit_codes = [99202, 99203, 99204, 99205,              -- new patient
               99211, 99212, 99213, 99214, 99215,       -- established patient
               99241, 99242, 99243, 99244, 99245,       -- outpatient consults
               99251, 99252, 99253, 99254, 99255]       -- inpatient consults (referral-initiated)

total_visit_volume = SUM(total_services) WHERE hcpcs_code IN visit_codes
```

**Why outpatient E/M only (not total services):** Pain medicine is overwhelmingly an outpatient specialty. Using total services as the denominator would dilute the signal because procedure codes and E/M codes measure different things. Including consult codes (99241-99255) captures referral-initiated patient encounters, which are core to pain medicine workflow where most patients arrive via referral.

**Why inpatient consults are included:** Unlike inpatient management (99221-99233), consult codes 99251-99255 represent a discrete referral encounter, not ongoing hospital management. Pain medicine providers frequently see patients via inpatient consult for post-surgical pain or acute pain crises, then transition them to outpatient management. Excluding these would undercount actual patient-facing visit volume.


### Minimum Threshold (Design Decision: Departure from Pediatrics)

Pediatrics uses a single threshold of 50 visits. Pain medicine requires a **split threshold by provider type** because interventionalists and non-interventional providers have fundamentally different billing profiles.

```
Core Pain cohort (interventional):
    INCLUDE IF total_visit_volume >= 30 OR total_procedure_volume >= 50

Neuro-Pain cohort (non-interventional):
    INCLUDE IF total_visit_volume >= 30
```

Where `total_procedure_volume` = SUM of services across Categories 1-6 (spinal injections, peripheral nerve blocks, RFA, neuromodulation, joint/trigger point, imaging guidance).

**Why the OR condition:** An interventionalist with 30 E/M visits but 150 procedure codes is a high-volume legitimate provider. Using E/M as the sole floor would incorrectly flag them as low-volume. The OR condition ensures procedural-dominant practices are not excluded.

**Procedure-only provider flag:** Providers who clear the minimum threshold on procedures but have total_visit_volume < 15 get a `procedure_only_provider = true` flag in the output schema. Not a disqualification — some legitimate pain practices are purely procedural (e.g., ambulatory surgery center-based). But employers should see it, and it affects how the composite score is interpreted.

If neither condition is met, skip this provider entirely. Too little data to evaluate.


## 3. The Categories and Their Floors

Each category has a **floor**: the minimum percentage of total visit volume that constitutes believable, routine practice. Floors are derived from the peer median volume for the relevant cohort, set at roughly one-third of the peer median rate.

**Important:** Category floors differ between the Core Pain and Neuro-Pain cohorts. The table below shows Core Pain floors. Neuro-Pain floors are documented separately in Section 3b.


### Geographic Grouping of Floors

| Level | How Floors Are Set | When to Use |
|---|---|---|
| **State** (default) | For each category, compute the median rate across all pain NPIs in the state cohort. Floor = median / 3. | Primary scoring. A provider in MA is evaluated against MA norms. |
| **National** | Floors computed from national pain medicine peer data. | Fallback when state cohort is too small (<50 peers), or for cross-state benchmarking. |
| **Sub-state (future)** | Compute median rates at ZIP-3 or CBSA level. | Not implemented now. Pain medicine practice patterns may vary less geographically than pediatrics because the procedure mix is more standardized. |


### 3a. Core Pain Cohort Categories

| # | Category | Codes | What the Floor Means |
|---|---|---|---|
| 1 | **Spinal injections** | 62320, 62321, 62322, 62323, 62324, 62325, 62326, 62327, 64479, 64480, 64483, 64484, 64490, 64491, 64492, 64493, 64494, 64495, 27096, 64451 | Provider performs epidural and facet joint injections as a routine part of their practice, not as a one-off |
| 2 | **Peripheral nerve blocks** | 64415, 64416, 64417, 64418, 64420, 64421, 64425, 64430, 64445, 64446, 64447, 64448, 64449, 64450, 64505, 64510, 64517, 64520, 64530 | Provider does nerve blocks routinely |
| 3 | **Radiofrequency ablation (RFA)** | 64633, 64634, 64635, 64636 | Provider performs the evidence-based follow-up to diagnostic facet blocks. A provider who does diagnostic blocks but never does RFA is either referring out or stopping short of the guideline-recommended next step. Distinct quality signal from spinal injections. |
| 4 | **Neuromodulation** | 63650, 63655, 63685, 63688, 63661, 63662, 63663, 63664, 64555, 64560, 64561, 64580, 64581, 64590, 64595 | Provider does spinal cord stimulator implantation and management. This is a specialized niche — many legitimate pain providers do not do this. See scoring notes below. |
| 5 | **Joint and trigger point injections** | 20550, 20551, 20552, 20553, 20600, 20604, 20605, 20606, 20610, 20611 | Provider performs musculoskeletal injections routinely |
| 6 | **Imaging guidance** | 77003, 76942, 77012 | Provider uses fluoroscopy or ultrasound guidance with injectable procedures. These are add-on codes and should correlate with Categories 1, 2, and 5. |
| 7 | **E/M visits** | 99202-99215, 99241-99255 | Provider sees patients for evaluation and management. This is the baseline — if a provider clears the minimum threshold, this category is almost always ok. Included for completeness. |
| 8 | **Medication management** | 99202-99215 with volume pattern analysis | Non-interventional providers live here. Providers whose E/M volume significantly exceeds their procedure volume are medication management-dominant. This category gives volume signal for the non-interventional segment of the Core Pain cohort. **Scored as:** E/M-to-procedure ratio. If E/M volume > 3x total procedure volume, provider is medication-management dominant. Flag as `practice_profile = medication_management` in output. Not a penalty — a classification. |
| 9 | **Behavioral/psychological** | 96116, 96130, 96131, 96156, 96158, 96159 | **PRESENCE FLAG ONLY — not a volume threshold.** See Section 3c. |

**Floor values:** The table intentionally omits numeric peer median rates and floors. Unlike pediatrics, where published data from PCC provides national benchmarks, pain medicine peer medians must be computed from the actual CMS claims data for the MA cohort. The pipeline should:

1. Compute the state-level peer median rate for each category from the MA pain cohort
2. Set floor = median / 3
3. Record the computed floor in the output schema for each provider

If state cohort size < 50 for either cohort, fall back to national data.


**Scoring notes for specific categories:**

- **Neuromodulation (Category 4):** This is a specialized procedure. Many legitimate pain medicine providers do not implant spinal cord stimulators. If `not_detected`, this is expected and excluded from the score. Only volume-check if the provider bills neuromodulation codes at all.
- **Imaging guidance (Category 6):** This is an add-on code, not a standalone procedure. Volume should be evaluated relative to injectable procedure volume (Categories 1 + 2 + 5), not relative to E/M volume. See Section 4 for the adjusted formula.
- **Medication management (Category 8):** This is a practice profile classification, not a volume floor. See the table above.


### 3b. Neuro-Pain Cohort Categories

The Neuro-Pain cohort (2084P0800X) is scored on a reduced category set. These providers practice non-interventional pain management — medication management, behavioral pain strategies, and E/M-focused care.

| # | Category | Codes | What the Floor Means |
|---|---|---|---|
| 1 | **E/M visits** | 99202-99215, 99241-99255 | Baseline practice volume. Should always be ok if the provider clears the minimum threshold. |
| 2 | **Behavioral/psychological** | 96116, 96130, 96131, 96156, 96158, 96159 | **PRESENCE FLAG ONLY.** Same as Core Pain. |

**Why only 2 categories:** Neuro-Pain providers are not expected to bill interventional procedure codes. Volume-checking them on spinal injections, nerve blocks, or RFA would produce universal `not_detected` results. The peer comparison and billing quality scores handle the non-interventional quality signals.

**Neuro-Pain volume adequacy is therefore a minimal score.** It confirms that the provider has real practice volume and flags behavioral co-management. The other four Sub-Treasure Map dimensions carry the quality signal for this cohort.


### 3c. Behavioral/Psychological: Presence Flag (Not Volume Threshold)

**Design decision:** Behavioral/psychological codes are scored as a **binary presence/absence flag**, not a volume threshold.

The question is not "how much psych did they do?" but "does this provider ever refer to or co-manage with behavioral health?" This aligns with AAPM's biopsychosocial model of pain management as a quality marker.

```
behavioral_codes = [96116, 96130, 96131, 96156, 96158, 96159]
behavioral_services = SUM(total_services) WHERE hcpcs_code IN behavioral_codes

IF behavioral_services > 0:
    behavioral_flag = true     -- provider engages with behavioral component
ELSE:
    behavioral_flag = false    -- no behavioral billing detected
```

This flag appears in the output schema but is **not counted in the volume adequacy score calculation**. It is an informational quality signal for employers. A provider without behavioral codes is not penalized in this score — the absence is captured in other dimensions (peer comparison, guideline concordance).


## 4. Scoring Each Category

For each category (except behavioral, which is a flag), the logic is:

```
category_services = SUM(total_services) WHERE hcpcs_code IN category_codes
category_rate = category_services / total_visit_volume

IF category_services = 0:
    status = "not_detected"        -- provider does not bill this code at all
ELIF category_rate >= floor:
    status = "ok"                  -- volume is believable
ELSE:
    status = "flag"                -- code is present but volume is too low to be routine
```

**Exception: Imaging Guidance (Category 6)**

Imaging guidance codes are add-on codes. They should be evaluated against injectable procedure volume, not E/M volume:

```
injectable_volume = SUM(total_services) WHERE hcpcs_code IN
    (spinal_injection_codes + peripheral_nerve_block_codes + joint_trigger_codes)

imaging_services = SUM(total_services) WHERE hcpcs_code IN [77003, 76942, 77012]
imaging_rate = imaging_services / injectable_volume

IF injectable_volume = 0:
    imaging_status = "not_detected"   -- no injectable procedures, no guidance expected
ELIF imaging_services = 0:
    imaging_status = "not_detected"   -- no guidance billed
ELIF imaging_rate >= imaging_floor:
    imaging_status = "ok"
ELSE:
    imaging_status = "flag"
```

The imaging guidance floor should be computed from the peer median imaging-to-injectable ratio (not from the E/M-based floor). Expect this rate to be high (40-70%) — most spinal and nerve block injections should have imaging guidance.


**Three possible states per category:**

| Status | Meaning | Counted in Score? |
|---|---|---|
| not_detected | Provider does not bill any codes in this category | No. Excluded from denominator. |
| ok | Provider bills this category at or above the floor | Yes. Numerator + denominator. |
| flag | Provider bills this category but below the floor | Yes. Denominator only. |


## 5. The Volume Adequacy Score

```
scored_categories = Categories 1-7 (excluding 8 medication management and 9 behavioral)
detected_categories = COUNT of scored_categories WHERE status IN ("ok", "flag")
ok_categories = COUNT of scored_categories WHERE status = "ok"

IF detected_categories = 0:
    volume_adequacy_score = 50     -- neutral fallback, not an automatic fail
ELSE:
    volume_adequacy_score = (ok_categories / detected_categories) * 100
```

| Score | Interpretation |
|---|---|
| 100 | Every detected category is at believable volume. This provider's practice patterns are real. |
| 75-99 | Most categories are adequate. One or two are flagged as low-volume. |
| 50-74 | Mixed. Several categories are present but at trace volume. Investigate which ones. |
| Below 50 | Most detected categories are below floor. Provider may be billing codes they do not routinely perform. |
| 50 (neutral) | No measurable categories detected. Cannot evaluate. Not a fail. |


## 6. Why the Neutral Fallback Matters

If a Neuro-Pain provider only bills E/M codes (no procedures, no screening codes), they have zero detected categories for volume checking beyond E/M. That is already captured in the peer comparison score and the practice profile classification. We do not double-penalize here. The volume adequacy score says: "of the things you claim to do, do you do them for real?" If you claim nothing procedural, the answer is neither yes nor no. It is 50.

For Core Pain providers, a neutral 50 is more notable. An interventionalist with no detected procedure categories is unusual and should be investigated, but the investigation belongs in the peer comparison and billing quality dimensions, not here.


---

# PART C: BUSINESS LOGIC DETAIL

---


## 7. Full Calculation for One NPI (Core Pain Cohort)

```
INPUT:  npi = "1234567890"
        cohort = "core_pain"
        measurement_year = 2023

STEP 1: Combine claims from Medicare and Medicaid
    medicare_claims = all rows WHERE Rndrng_NPI = npi
    medicaid_claims = all rows WHERE SERVICING_PROVIDER_NPI_NUM = npi
    combined_claims = UNION(medicare_claims, medicaid_claims)

STEP 2: Get total visit volume
    total_visit_volume = SUM(total_services)
        WHERE hcpcs_code IN visit_codes
    total_procedure_volume = SUM(total_services)
        WHERE hcpcs_code IN (categories 1-6 codes)

    IF total_visit_volume < 30 AND total_procedure_volume < 50:
        RETURN insufficient_data

    IF total_visit_volume < 15:
        procedure_only_provider = true
    ELSE:
        procedure_only_provider = false

STEP 3: For each category, compute rate and status

    Category: Spinal Injections
        codes = [62320-62327, 64479, 64480, 64483, 64484,
                 64490-64495, 27096, 64451]
        services = SUM(total_services) WHERE hcpcs_code IN codes
        rate = services / total_visit_volume
        floor = state_peer_median_rate / 3     -- computed from MA cohort
        status = "not_detected" IF services = 0
                 "ok"           IF rate >= floor
                 "flag"         IF rate < floor AND services > 0

    Category: Imaging Guidance (special denominator)
        injectable_volume = SUM(services for categories 1+2+5)
        imaging_services = SUM(total_services) WHERE hcpcs_code IN [77003, 76942, 77012]
        imaging_rate = imaging_services / injectable_volume
        imaging_floor = state_peer_median_imaging_rate / 3
        status = "not_detected" IF injectable_volume = 0 OR imaging_services = 0
                 "ok"           IF imaging_rate >= imaging_floor
                 "flag"         IF imaging_rate < imaging_floor AND imaging_services > 0

    (repeat for all scored categories)

STEP 4: Behavioral flag
    behavioral_services = SUM(total_services) WHERE hcpcs_code IN behavioral_codes
    behavioral_flag = behavioral_services > 0

STEP 5: Practice profile classification
    IF total_visit_volume > 3 * total_procedure_volume:
        practice_profile = "medication_management"
    ELIF total_procedure_volume > 3 * total_visit_volume:
        practice_profile = "procedure_dominant"
    ELSE:
        practice_profile = "mixed"

STEP 6: Compute score
    detected = count of scored categories with status "ok" or "flag"
    ok = count of scored categories with status "ok"
    score = 50 IF detected = 0 ELSE (ok / detected) * 100

STEP 7: Payer source tracking
    medicare_services = SUM(services from medicare_claims)
    medicaid_services = SUM(services from medicaid_claims)
    total = medicare_services + medicaid_services
    medicare_service_pct = medicare_services / total
    medicaid_service_pct = medicaid_services / total
    primary_payer_source = "medicare" IF medicare_service_pct > 0.8
                           "medicaid" IF medicaid_service_pct > 0.8
                           "mixed"    OTHERWISE
    score_data_sources = count of payer files with data for this NPI (1 or 2)

STEP 8: Output detail
    For each category, record: name, services, rate, floor, status
```


## 8. Worked Examples

### Provider A (Core Pain, Interventionalist): 350 visits, 480 procedures

| Category | Services | Rate (vs visits) | Floor | Status |
|---|---|---|---|---|
| Spinal injections | 180 | 51.4% | computed | ok |
| Peripheral nerve blocks | 85 | 24.3% | computed | ok |
| RFA | 45 | 12.9% | computed | ok |
| Neuromodulation | 0 | 0.0% | -- | not_detected |
| Joint/trigger point | 35 | 10.0% | computed | ok |
| Imaging guidance | 290 (vs 300 injectable) | 96.7% | computed | ok |
| E/M visits | 350 | -- | -- | ok |

Detected: 6. Ok: 6. Score: **(6/6) * 100 = 100**.
Behavioral flag: false.
Practice profile: mixed.
Procedure-only: false.

Provider A is a fully-engaged interventional pain practice with real volume across all detected categories. Neuromodulation is not detected — not penalized, as many pain providers do not implant stimulators.


### Provider B (Core Pain, Trace Biller): 200 visits, 18 procedures

| Category | Services | Rate (vs visits) | Floor | Status |
|---|---|---|---|---|
| Spinal injections | 8 | 4.0% | computed | **flag** (assuming floor ~8%) |
| Peripheral nerve blocks | 0 | 0.0% | -- | not_detected |
| RFA | 0 | 0.0% | -- | not_detected |
| Neuromodulation | 0 | 0.0% | -- | not_detected |
| Joint/trigger point | 10 | 5.0% | computed | **flag** (assuming floor ~6%) |
| Imaging guidance | 3 (vs 18 injectable) | 16.7% | computed | **flag** (assuming floor ~20%) |
| E/M visits | 200 | -- | -- | ok |

Detected: 4. Ok: 1. Score: **(1/4) * 100 = 25**.
Behavioral flag: false.
Practice profile: medication_management (200 visits vs 18 procedures).

Provider B bills procedure codes but at volumes that suggest they are not part of routine workflow. Spinal injections, joint injections, and imaging guidance are all present but below floor. This provider's practice is primarily medication management — the procedure billing is trace.


### Provider C (Neuro-Pain): 450 visits, 0 procedures

| Category | Services | Rate | Floor | Status |
|---|---|---|---|---|
| E/M visits | 450 | -- | -- | ok |

Detected: 1. Ok: 1. Score: **(1/1) * 100 = 100**.
Behavioral flag: true (12 behavioral assessment services detected).

Provider C is a Neuro-Pain provider scored against the Neuro-Pain cohort. No interventional procedures expected. Score of 100 reflects that their detected categories are at real volume. The behavioral flag is an additional positive quality signal for employers.


---

# PART D: HOW THIS FITS WITH THE OTHER SCORES

---


## 9. The Five Scores Together

| Score | Question It Answers | Standard |
|---|---|---|
| **Guideline Concordance** | Does this provider follow AAPM/ASIPP clinical guidelines? | Professional society pain management guidelines |
| **Peer Comparison** | Does this provider's billing pattern look like a normal pain medicine practitioner's? | The peer cohort (reference code set) |
| **Volume Adequacy** | For the things this provider claims to do, do they do them at believable volume? | Minimum floor rates derived from peer medians |
| **Payer Diversity** | Is their practice consistent across Medicare and Medicaid? | Overlap of code sets between payers |
| **Billing Quality** | Are charges, code ratios, and E/M distribution normal? | Peer percentile ranges and ratio analysis |

They catch different problems:

| Problem | Guideline | Peer | Volume | Payer | Billing |
|---|---|---|---|---|---|
| Provider bills facet blocks but only 2/year | Partial | Not caught (code is present) | **Caught** (below floor) | Not relevant | Not caught |
| Provider does diagnostic blocks but never RFA | **Caught** (guideline gap) | Caught (missing RFA codes) | Not applicable if RFA = not_detected | Not relevant | Not caught |
| Provider bills everything but at wrong charge ratios | Not caught | Not caught | Not caught | Not caught | **Caught** |
| Provider bills same codes to Medicare but not Medicaid | Not caught | Partially caught | Not caught | **Caught** | Not caught |
| Provider does nothing beyond E/M | Caught (low procedure domains) | Caught (low code coverage) | Neutral (score = 50) | Not relevant | **Caught** (E/M-only distribution) |
| Provider bills spinal injections at trace volume | Not caught directly | Not caught (code exists) | **Caught** (flagged) | Not caught | Partially caught (ratio analysis) |

Volume adequacy is the behavior check. It sits between peer comparison and billing quality and says: "your peer comparison score says you bill these codes, but do you really?"


---

# PART E: RISKS AND LIMITATIONS

---


## 10. Risks

**Floors are computed, not clinically validated.** We set floors at one-third of the peer median. This is a reasonable heuristic but not derived from clinical literature. If the peer median for spinal injections is actually lower than expected in MA (e.g., due to prior authorization burden), the floor may be too low. Floors should be inspected by a clinical advisor before production scoring.

**PM&R - Pain Medicine (2081P2900X) cohort placement.** These providers are included in the Core Pain cohort by default as a dedicated pain subspecialty. Their code mix may include rehabilitation services that differ from pure interventional pain providers. Monitor whether this creates meaningful distortion in peer benchmarks and consider a separate sub-cohort if needed.

**RFA-to-facet-block ratio is a quality signal, not a hard rule.** Category 3 (RFA) captures a clinically meaningful pattern: diagnostic facet blocks should lead to RFA when diagnostic criteria are met. However, the absence of RFA does not always indicate substandard care — the provider may refer RFA to a colleague, or the patient may decline. The volume adequacy score flags the pattern; clinical interpretation is left to the consumer.

**Procedure-only providers require careful interpretation.** Providers flagged as `procedure_only_provider = true` may have legitimately structured practices (e.g., ambulatory surgery center-based interventionalists whose E/M is handled by a referring provider). Their volume adequacy score is valid for procedure categories but cannot capture E/M-based signals. Document this limitation when presenting scores.

**Lab and imaging codes may be billed by the facility, not the ordering provider.** Imaging guidance codes (77003, 76942, 77012) may appear under the facility NPI rather than the rendering provider in some billing arrangements. A provider who consistently uses image guidance but bills through a facility may be incorrectly flagged as having low imaging guidance volume. Known limitation of claims-level data.

**Combined payer volume may mask payer-specific anomalies.** A provider could have normal combined volume but anomalous patterns within a single payer. The Payer Diversity dimension is designed to catch this, but volume adequacy does not discriminate by payer.

**Beneficiary counts are overstated for dual-eligible patients.** Beneficiary deduplication across Medicare and Medicaid is not possible with the free CMS data. This does not affect volume adequacy scoring (which uses service counts), but it affects any downstream metrics that use beneficiary counts as a denominator.

**Neuro-Pain volume adequacy is a minimal score.** With only 1-2 scored categories, the Neuro-Pain volume adequacy score has low discriminating power. The score will be either 50 (neutral) or 100 for most providers. The real quality signals for this cohort come from the other four dimensions.

**Floors should be rebuilt annually.** As CMS releases new data and practice patterns shift (new CPT codes, changing reimbursement incentives), the peer median rates change. Recalibrate floors each year.

**The Medicaid Provider Spending dataset has availability risk.** The dataset was temporarily unavailable in late March 2026. If Medicaid data is unavailable, scores are computed from Medicare only. Providers scored with a single payer source are flagged via `score_data_sources = 1` in the output schema.


---


## Appendix: Output Schema (per NPI)

| Column | Type | Description |
|---|---|---|
| npi | string | National Provider Identifier |
| provider_name | string | From NPPES |
| provider_state | string | From NPPES |
| provider_zip | string | From NPPES |
| provider_zip3 | string | First 3 digits of ZIP (sub-state geography) |
| taxonomy_code | string | Provider's matched taxonomy code |
| taxonomy_cohort | string | "core_pain" or "neuro_pain" — which peer group this provider was scored against |
| practice_profile | string | "medication_management", "procedure_dominant", or "mixed" |
| procedure_only_provider | boolean | True if provider clears procedure threshold but has < 15 E/M visits |
| geo_group_level | string | "state", "national", or "zip3" — which peer cohort set the floors |
| floor_cohort_state | string | State used for floor computation (or "US" if national) |
| floor_cohort_size | int | Number of peers in the cohort used to compute floors |
| total_visit_volume | int | Total E/M + consult visits in measurement year |
| total_procedure_volume | int | Total pain-specific procedure services (Categories 1-6) |
| medicare_service_pct | float | % of total services from Medicare |
| medicaid_service_pct | float | % of total services from Medicaid |
| primary_payer_source | string | "medicare", "medicaid", or "mixed" |
| score_data_sources | int | Number of payer files with data for this NPI (1 or 2) |
| spinal_injection_services | int | Service count |
| spinal_injection_rate | float | services / total_visit_volume |
| spinal_injection_floor | float | Computed from peer cohort |
| spinal_injection_status | string | "ok", "flag", or "not_detected" |
| peripheral_nerve_block_services | int | Service count |
| peripheral_nerve_block_rate | float | Rate |
| peripheral_nerve_block_floor | float | Computed from peer cohort |
| peripheral_nerve_block_status | string | Status |
| rfa_services | int | 64633-64636 service count |
| rfa_rate | float | Rate |
| rfa_floor | float | Computed from peer cohort |
| rfa_status | string | Status |
| neuromodulation_services | int | Service count |
| neuromodulation_rate | float | Rate |
| neuromodulation_floor | float | Computed from peer cohort |
| neuromodulation_status | string | Status |
| joint_trigger_services | int | Service count |
| joint_trigger_rate | float | Rate |
| joint_trigger_floor | float | Computed from peer cohort |
| joint_trigger_status | string | Status |
| imaging_guidance_services | int | Service count |
| imaging_guidance_rate | float | imaging_services / injectable_volume (not E/M volume) |
| imaging_guidance_floor | float | Computed from peer cohort (imaging-to-injectable ratio) |
| imaging_guidance_status | string | Status |
| em_visit_services | int | Service count |
| em_visit_status | string | Status (almost always "ok" if threshold is met) |
| behavioral_flag | boolean | True if any behavioral/psychological codes billed |
| behavioral_services | int | Service count for behavioral codes |
| detected_categories | int | Count of scored categories with status ok or flag (0-7) |
| ok_categories | int | Count of scored categories with status ok (0-7) |
| flagged_categories | int | Count of scored categories with status flag (0-7) |
| flagged_category_list | string | Comma-separated names of flagged categories |
| volume_adequacy_score | float | (ok / detected) * 100, or 50 if detected = 0 |
