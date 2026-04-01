# Otolaryngology (ENT) Volume Adequacy Score — Sub-Treasure Map

**Specialty:** Otolaryngology (ENT)
**Taxonomy Code:** 207Y00000X
**Score Type:** Volume Adequacy
**Last Updated:** 2026-04-01

---

## What This Document Does

For a provider who claims to practice otolaryngology, is their billing volume believable? This score asks a simple question: does this ENT provider actually perform the diagnostic and procedural work that defines ENT practice? A provider who bills audiometry twice a year while seeing 500 patients is not really doing audiometric evaluation — they billed it twice, probably incidentally. Volume adequacy does not measure quality or outcomes. It measures whether the provider's utilization pattern is consistent with someone who routinely practices the specialty they claim. If you say you are an ENT, we expect to see nasal endoscopy, audiometry, tympanometry, and laryngoscopy showing up at rates that make sense relative to your total visit volume.

---

## PART A: WHAT WE HAVE

We use three free, publicly available CMS datasets. No purchased data, no proprietary feeds.

| # | Dataset | What It Gives Us | Refresh Cadence |
|---|---------|-------------------|-----------------|
| 1 | **Medicare Physician & Other Practitioners — by Provider and Service** | Line-level counts: how many times NPI X billed HCPCS code Y | Annual (calendar year, ~18-month lag) |
| 2 | **Medicare Physician & Other Practitioners — by Provider** | Provider-level summary: total services, total beneficiaries, specialty self-designation | Annual (same file family) |
| 3 | **NPPES NPI Registry** | Taxonomy code, address, credential, enumeration date | Weekly snapshot |

That is the entire input. Three flat files, all free, all public.

---

## PART B: THE LOGIC

### Step 1 — Identify the Denominator

The denominator is the provider's total E/M visit volume: new patient visits plus established patient visits combined.

Relevant E/M codes for office-based ENT:

| Type | CPT Codes |
|------|-----------|
| New patient office visits | 99201-99205 |
| Established patient office visits | 99211-99215 |

Sum all line counts for these codes. This is `total_em_visits`.

**Minimum volume threshold:** If `total_em_visits < 50`, skip this provider entirely. We cannot draw meaningful conclusions from tiny denominators. The provider gets no volume adequacy score (null, not zero).

### Step 2 — Check Each Category Against Its Floor

Here are the categories. Each one represents a cluster of procedures that a practicing ENT should perform at some non-trivial rate relative to their visit volume.

| # | Category | HCPCS Codes | Estimated Peer Median Rate | Floor (median / 3) |
|---|----------|-------------|---------------------------|---------------------|
| 1 | Audiometric evaluation | 92552, 92553, 92557 | ~15% of visits | 5% |
| 2 | Tympanometry | 92567, 92568 | ~10% of visits | 3% |
| 3 | Nasal endoscopy | 31231, 31237 | ~12% of visits | 4% |
| 4 | Laryngoscopy | 31575, 31579 | ~8% of visits | 2.5% |
| 5 | Cerumen management | 69210 | ~5% of visits | 1.5% |
| 6 | Allergy testing | 95004, 95024 | ~4% of visits | 1% |
| 7 | Otoacoustic emissions (OAE) | 92588 | ~3% of visits | 1% |
| 8 | In-office hemostasis | 30903 | ~2% of visits | 0.5% |

**How to read the table:** If the median ENT provider performs audiometric evaluation at about 15% of their visit volume, the floor is one-third of that — 5%. Any provider billing audiometry at less than 5% of their visit volume gets a flag for that category. They are doing it, but barely.

### Why These Categories?

We deliberately skip inherently high-volume codes like E/M visits themselves. Every provider bills those. Instead, we focus on diagnostic and procedural codes where trace billing is a red flag.

- **Audiometry, tympanometry, and nasal endoscopy** are the core ENT diagnostic procedures. If you practice ENT, you do these routinely. Trace billing suggests you claim the specialty but do not routinely perform ENT-specific workup.
- **Laryngoscopy** is fundamental to voice and airway evaluation. An ENT who never scopes a larynx is unusual.
- **Cerumen management** is bread-and-butter ENT. It is not glamorous, but it shows up consistently in real ENT practices.
- **Allergy testing** captures the substantial subset of ENTs who manage allergic rhinitis in-house.
- **Otoacoustic emissions** confirm the provider does hearing workup beyond basic audiometry.
- **In-office hemostasis (epistaxis control)** is a classic ENT urgent procedure. Low volume is expected, but zero is odd for a busy ENT.

### Step 3 — Classify Each Category

Each category lands in one of three states:

| State | Meaning | Rule |
|-------|---------|------|
| `not_detected` | Provider billed zero claims for every code in this category | No data to evaluate — skip it |
| `ok` | Provider's rate meets or exceeds the floor | rate >= floor |
| `flag` | Provider billed the category but below the floor | 0 < rate < floor |

The rate for a category is:

```
category_count = sum of line counts for all HCPCS codes in the category
rate = category_count / total_em_visits
```

### Step 4 — Compute the Score

```
detected_count = number of categories that are "ok" or "flag"
ok_count       = number of categories that are "ok"

if detected_count == 0:
    score = 50          # neutral fallback — no data to judge
else:
    score = round((ok_count / detected_count) * 100)
```

The score runs from 0 to 100. Higher is better. A score of 100 means every category the provider touched was at or above the floor. A score of 0 means the provider billed every category but was below the floor on all of them — that is a provider who dabbles in everything but commits to nothing.

The neutral fallback of 50 applies when a provider has enough E/M visits to qualify but billed zero in every single diagnostic/procedural category. This is unusual but possible (e.g., a purely surgical ENT whose office workup is coded differently). We do not punish them, but we do not reward them either.

---

## PART C: BUSINESS LOGIC DETAIL

### Full Pseudocode for One NPI

```
function compute_volume_adequacy(npi):

    # 1. Pull E/M visit counts
    em_codes = [99201, 99202, 99203, 99204, 99205,
                99211, 99212, 99213, 99214, 99215]
    total_em_visits = sum(claim_count for code in em_codes
                         where provider = npi)

    # 2. Minimum volume gate
    if total_em_visits < 50:
        return {score: null, reason: "below_minimum_volume"}

    # 3. Define categories
    categories = [
        {name: "Audiometric evaluation",  codes: [92552, 92553, 92557], floor: 0.05},
        {name: "Tympanometry",            codes: [92567, 92568],        floor: 0.03},
        {name: "Nasal endoscopy",         codes: [31231, 31237],        floor: 0.04},
        {name: "Laryngoscopy",            codes: [31575, 31579],        floor: 0.025},
        {name: "Cerumen management",      codes: [69210],               floor: 0.015},
        {name: "Allergy testing",         codes: [95004, 95024],        floor: 0.01},
        {name: "Otoacoustic emissions",   codes: [92588],               floor: 0.01},
        {name: "In-office hemostasis",    codes: [30903],               floor: 0.005},
    ]

    # 4. Evaluate each category
    results = []
    for cat in categories:
        cat_count = sum(claim_count for code in cat.codes
                        where provider = npi)
        rate = cat_count / total_em_visits

        if cat_count == 0:
            state = "not_detected"
        elif rate >= cat.floor:
            state = "ok"
        else:
            state = "flag"

        results.append({
            name:  cat.name,
            count: cat_count,
            rate:  rate,
            floor: cat.floor,
            state: state
        })

    # 5. Compute score
    detected = [r for r in results if r.state != "not_detected"]
    ok_count = len([r for r in detected if r.state == "ok"])
    detected_count = len(detected)

    if detected_count == 0:
        score = 50
    else:
        score = round((ok_count / detected_count) * 100)

    return {
        npi:            npi,
        total_em_visits: total_em_visits,
        detected_count: detected_count,
        ok_count:       ok_count,
        flag_count:     detected_count - ok_count,
        score:          score,
        details:        results
    }
```

### Worked Example 1: High-Scoring Provider

**Dr. A** — NPI 1234567890, 800 total E/M visits.

| Category | Count | Rate | Floor | State |
|----------|-------|------|-------|-------|
| Audiometric evaluation | 140 | 17.5% | 5% | ok |
| Tympanometry | 95 | 11.9% | 3% | ok |
| Nasal endoscopy | 110 | 13.8% | 4% | ok |
| Laryngoscopy | 72 | 9.0% | 2.5% | ok |
| Cerumen management | 50 | 6.3% | 1.5% | ok |
| Allergy testing | 0 | 0.0% | 1% | not_detected |
| Otoacoustic emissions | 30 | 3.8% | 1% | ok |
| In-office hemostasis | 12 | 1.5% | 0.5% | ok |

- `detected_count` = 7 (allergy testing excluded — zero claims)
- `ok_count` = 7
- **Score = round(7 / 7 * 100) = 100**

Dr. A is a general ENT with strong utilization across the board. No allergy testing, which is fine — many ENTs refer that out. Every category they do touch is well above the floor.

### Worked Example 2: Low-Scoring Provider With Flags

**Dr. B** — NPI 9876543210, 600 total E/M visits.

| Category | Count | Rate | Floor | State |
|----------|-------|------|-------|-------|
| Audiometric evaluation | 8 | 1.3% | 5% | flag |
| Tympanometry | 5 | 0.8% | 3% | flag |
| Nasal endoscopy | 12 | 2.0% | 4% | flag |
| Laryngoscopy | 3 | 0.5% | 2.5% | flag |
| Cerumen management | 4 | 0.7% | 1.5% | flag |
| Allergy testing | 0 | 0.0% | 1% | not_detected |
| Otoacoustic emissions | 0 | 0.0% | 1% | not_detected |
| In-office hemostasis | 0 | 0.0% | 0.5% | not_detected |

- `detected_count` = 5
- `ok_count` = 0
- **Score = round(0 / 5 * 100) = 0**

Dr. B has 600 E/M visits — a substantial practice — but performs audiometry 8 times a year, tympanometry 5 times, and endoscopy 12 times. This provider is billing ENT taxonomy code 207Y00000X but their utilization pattern looks nothing like a practicing otolaryngologist. They touch all the core categories but at vanishingly low rates. That is exactly what this score is designed to catch.

---

## PART D: HOW THIS FITS WITH THE OTHER SCORES

Volume adequacy is one piece of a multi-score quality picture. Here is how it relates to its siblings:

| Score | Question It Answers | Standard It Checks |
|-------|--------------------|--------------------|
| **Volume Adequacy** (this score) | Does the billing pattern match someone who actually practices ENT? | Category floors relative to E/M volume |
| **Breadth Score** | Does the provider perform a wide range of ENT services? | Number of distinct HCPCS codes billed |
| **Benchmark Comparison** | How does this provider compare to peers on key metrics? | Percentile rank against specialty peers |
| **Outcome Indicators** | Are there signals of good or bad patient outcomes? | Revision rates, complication codes |

### What Volume Adequacy Catches That Others Miss

- **The taxonomy squatter.** A provider who registers as ENT for credentialing or referral purposes but does almost no ENT-specific work. Breadth might look fine if they bill one claim each for 20 different codes — volume adequacy catches that those are all trace amounts.
- **The E/M-only provider.** Someone who sees patients and bills office visits but rarely performs the diagnostic workup that defines ENT practice. High visit volume, low procedural volume.
- **The slow-fade provider.** A provider who used to practice full-spectrum ENT but has gradually shifted to a narrow niche or administrative role. Their visit count stays high, but their procedural categories thin out one by one.

---

## PART E: RISKS AND LIMITATIONS

This score has known blind spots. Treat it as a signal, not a verdict.

1. **ENT subspecialists may legitimately skip categories.** A facial plastic surgeon (taxonomy 207YX0905X, but some use 207Y00000X) will not perform audiometry or tympanometry. An otologist may not do nasal endoscopy. The score does not penalize zero-billing (those categories land in `not_detected` and are excluded from the denominator), but a subspecialist who dabbles in one outside-subspecialty procedure at trace levels will get flagged.

2. **Allergy testing may be done by a separate allergist.** Many ENT practices have an in-house allergist or allergy technician who bills under their own NPI. The ENT provider's claims will show zero allergy testing even though the practice does it routinely. This is handled gracefully by the `not_detected` exclusion, but it means allergy testing will not boost their score either.

3. **Surgical procedures happen in facility settings.** Operating room procedures (septoplasty, tympanoplasty, FESS) are billed under facility claims that may not appear in the physician office utilization file. A provider who spends three days a week in the OR may have lower office-based procedural rates than their actual scope of practice suggests.

4. **Floors are estimates, not validated benchmarks.** The peer median rates in the table above are approximations based on aggregate CMS data patterns. Actual medians vary by state, payer mix, practice setting, and year. Ideally, floors should be computed from state-level peer medians for the scoring year.

5. **State-level peer median computation is needed.** A rural ENT in Wyoming and an urban ENT in Manhattan operate in very different environments. National medians may systematically disadvantage providers in certain geographies. Future iterations should compute floors from state-specific peer groups.

6. **CMS data covers Medicare only.** Providers with a primarily pediatric or commercially insured panel will have lower Medicare volume, which may push them below the 50-visit minimum or distort category rates. This is a structural limitation of using Medicare claims as a proxy for total practice patterns.

7. **Code bundling and modifier effects.** Some payers bundle audiometry with the E/M visit or require modifier 59 for separate reporting. Billing practices vary, and some legitimate volume may be invisible in the claims data.

---

## OUTPUT SCHEMA

The final output is one row per NPI. Here is the column-by-column specification:

| Column | Type | Description |
|--------|------|-------------|
| `npi` | string(10) | National Provider Identifier |
| `taxonomy_code` | string | Always "207Y00000X" for this score |
| `specialty` | string | "Otolaryngology" |
| `score_type` | string | "volume_adequacy" |
| `total_em_visits` | integer | Sum of new + established patient E/M visit counts |
| `minimum_volume_met` | boolean | True if total_em_visits >= 50 |
| `detected_count` | integer | Number of categories with at least one claim |
| `ok_count` | integer | Number of categories at or above floor |
| `flag_count` | integer | Number of categories below floor (detected_count - ok_count) |
| `score` | integer or null | 0-100 score, null if minimum volume not met |
| `cat_audiometric_eval_state` | string | "not_detected", "ok", or "flag" |
| `cat_audiometric_eval_rate` | float | Category count / total_em_visits |
| `cat_tympanometry_state` | string | "not_detected", "ok", or "flag" |
| `cat_tympanometry_rate` | float | Category count / total_em_visits |
| `cat_nasal_endoscopy_state` | string | "not_detected", "ok", or "flag" |
| `cat_nasal_endoscopy_rate` | float | Category count / total_em_visits |
| `cat_laryngoscopy_state` | string | "not_detected", "ok", or "flag" |
| `cat_laryngoscopy_rate` | float | Category count / total_em_visits |
| `cat_cerumen_mgmt_state` | string | "not_detected", "ok", or "flag" |
| `cat_cerumen_mgmt_rate` | float | Category count / total_em_visits |
| `cat_allergy_testing_state` | string | "not_detected", "ok", or "flag" |
| `cat_allergy_testing_rate` | float | Category count / total_em_visits |
| `cat_oae_state` | string | "not_detected", "ok", or "flag" |
| `cat_oae_rate` | float | Category count / total_em_visits |
| `cat_hemostasis_state` | string | "not_detected", "ok", or "flag" |
| `cat_hemostasis_rate` | float | Category count / total_em_visits |
| `scoring_year` | integer | Calendar year of the source CMS data |
| `computed_at` | datetime | Timestamp when score was calculated |

---

*Sub-Treasure Map document for the quality-treasure-map methodology. Covers volume adequacy scoring for Otolaryngology (ENT), taxonomy 207Y00000X.*
