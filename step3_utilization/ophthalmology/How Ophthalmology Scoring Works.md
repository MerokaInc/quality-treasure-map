# How We Score Ophthalmologists: A Plain-English Guide

## What Is This?

We built a system that scores every ophthalmologist in the United States on a 0-to-100 scale using only free, publicly available government data. No chart review. No surveys. No special agreements. Just billing records that Medicare and Medicaid already publish.

The goal is to understand which eye doctors are practicing high-quality, evidence-based ophthalmology — and which ones have patterns that raise questions.

---

## Where Does the Data Come From?

We use four datasets, all free and published by the Centers for Medicare and Medicaid Services (CMS):

1. **Medicare Physician & Other Practitioners File** — Every time an ophthalmologist bills Medicare for a service (an eye exam, a cataract surgery, an injection, an OCT scan), it shows up here. We can see what they did, how many times, how many patients, and what they charged. This is the backbone of everything.

2. **Medicaid Provider Spending File** — Shows which providers also see Medicaid patients and how much volume they have there. Less detailed than the Medicare file (no procedure codes), but tells us who serves both populations.

3. **Medicare Part D Prescriber Files** — Shows what medications each provider prescribes: which drugs, how many prescriptions, how many patients, brand vs. generic. For ophthalmology, this is how we see who prescribes glaucoma eye drops and what kind.

4. **NPPES Registry** — The national provider directory. Tells us who is an ophthalmologist, what state they practice in, and whether they have a subspecialty (retina, glaucoma, cornea, etc.).

### What We Cannot See

These datasets have real limits. We cannot see:
- What diagnosis a patient has (no ICD-10 codes in the Medicaid file, no diagnosis linkage in Medicare)
- Individual patient journeys (data is aggregated per doctor, not per patient)
- Clinical chart notes (exam findings, counseling, informed consent)
- Whether patients actually take their medications (we see prescribing, not adherence)
- Commercial insurance claims (only Medicare and Medicaid)

Because of these limits, every score we produce is a **proxy** — a billing-pattern signal that correlates with quality, not a direct measure of clinical outcomes.

---

## How Does the Scoring Work?

Every ophthalmologist gets **five separate scores**, each answering a different question about their practice. Think of them as five different lenses looking at the same provider.

---

### Score 1: Guideline Concordance — "Are they following the rules?"

The American Academy of Ophthalmology (AAO) publishes clinical guidelines called Preferred Practice Patterns. These are the evidence-based standards for how eye care should be delivered. We mapped every guideline and found 23 that we can actually measure from billing data.

We organize these into four areas:

**Cataract and anterior segment (30% of the score):** When a doctor does cataract surgery, did they measure the eye beforehand (biometry)? Is their rate of "complex" cataract surgery in line with normal, or are they billing complex when it should be routine? How often do their patients need a follow-up YAG laser?

**Glaucoma management (25% of the score):** Are they ordering visual field tests and OCT scans to monitor their glaucoma patients? Are they using SLT laser as the evidence says? Thanks to the Part D prescribing data, we can also see: do they prescribe across multiple classes of glaucoma drops (showing they adjust treatment), and do they use generics when available?

**Retina and macular disease (25% of the score):** For patients getting injections for conditions like macular degeneration or diabetic eye disease — is the doctor monitoring with OCT scans? Are they communicating results back to the patient's primary care doctor? Is the injection volume per patient in a reasonable range?

**Comprehensive and preventive care (20% of the score):** Are they doing comprehensive eye exams? Are they ordering appropriate diagnostic tests — not too many, not too few?

For each measure, we compare the provider to their peers in the same state. If you're in the 80th percentile for visual field testing among California ophthalmologists, that's a strong score. If you're in the 10th percentile, that's a concern.

The four area scores combine into one Guideline Concordance score from 0 to 100.

**What this catches:** An ophthalmologist who does lots of injections but never orders OCTs to check if the treatment is working. A cataract surgeon who bills "complex" cataracts at three times the national rate. A glaucoma doctor who never orders visual fields.

---

### Score 2: Peer Comparison — "Do they look like a real ophthalmologist?"

We build a reference list of the 30 most common billing codes used by ophthalmologists nationally. Then we check three things:

**Code coverage (40%):** Of those 30 codes, how many does this provider bill? A full-scope ophthalmologist should bill most of them. Someone billing only 10 out of 30 has a narrow practice.

**Category coverage (30%):** We group codes into six categories: office visits, cataract surgery, glaucoma procedures, retinal procedures, diagnostic testing, and refraction. How many categories does this provider touch? Someone who bills codes in all six categories has a well-rounded practice.

**Volume distribution (30%):** For the codes they do bill, is the volume proportion similar to their peers? If a typical ophthalmologist does 20% cataract surgery and 15% injections, but this provider does 5% cataracts and 70% injections, the distribution is off.

These three metrics combine into a Peer Comparison score from 0 to 100.

**What this catches:** A provider who has ophthalmology credentials but only bills basic office visits and nothing else. A practice that is wildly skewed toward one procedure type in a way that doesn't match normal ophthalmology.

---

### Score 3: Volume Adequacy — "When they say they do something, do they do enough of it?"

This is the "trace billing" detector. We define 10 categories of ophthalmic procedures where doing only 1 or 2 per year is a red flag: cataract surgery, intravitreal injections, SLT laser, glaucoma surgery, vitreoretinal surgery, YAG capsulotomy, retinal laser, OCT imaging, visual field testing, and fluorescein angiography.

For each category, we calculate a minimum threshold (the peer median divided by 3). Then we classify each provider:

- **Not billing it at all** — That's fine. A cataract surgeon who doesn't do retinal injections isn't penalized.
- **Billing above the threshold** — Good. Adequate volume.
- **Billing 1 or 2 per year** — Red flag. They're claiming to do this procedure but at an implausibly low volume.

The score is simply: of the categories they bill, what fraction meets the minimum threshold?

**What this catches:** A provider who bills a little bit of everything — one injection here, one SLT there — to create the appearance of broad practice without actually doing meaningful volume in any of it.

---

### Score 4: Payer Diversity — "Do they treat Medicare and Medicaid patients the same?"

We check whether the provider serves both Medicare and Medicaid populations, and whether they offer a similar range of services to both.

Ophthalmology is unusual because it is **extremely Medicare-heavy**. Most eye conditions we score for — cataracts, glaucoma, macular degeneration — affect people over 65. So being a Medicare-only ophthalmologist is completely normal. We do not penalize this.

For providers who do serve both populations, we measure how many of their six workflow categories are active in both payers. We compare this overlap to the 90th percentile of their peers.

Providers who only serve one payer get a neutral score of 50, and this dimension's weight is cut in half in any composite scoring.

**What this catches:** A provider who delivers comprehensive ophthalmology to Medicare patients but provides only basic exams to Medicaid patients, suggesting they offer different levels of care depending on who's paying.

---

### Score 5: Billing Quality — "Are their charges and coding patterns normal?"

This is the billing integrity check. Two parts:

**Charge analysis (35%):** How much does this provider charge compared to what Medicare allows? We compare their charge-to-allowed ratio to peers. Most ophthalmologists fall in a normal range. Extreme outliers get flagged.

**Code ratio analysis (65%):** We run 34 individual checks on the provider's billing patterns:

*Green flags (things that should be present):*
- Biometry before cataract surgery (they're measuring the eye before operating)
- OCT scans at injection visits (they're monitoring treatment)
- Visual fields for glaucoma patients (they're checking for vision loss)
- Low opioid prescribing (most eye procedures don't need opioids)
- High generic prescribing rate for glaucoma drops (cost-effective care)

*Red flags (things that shouldn't be present):*
- Complex cataract rate above 25% (the national norm is 10-15% — higher suggests upcoding)
- Highest-level office visit (99215) at more than 35% of visits (upcoding signal)
- Billing a separate office visit on top of every injection (modifier -25 abuse)
- More than 3,000 injections per year (volume that raises quality questions)
- Opioid prescribing rate in the top 10% of ophthalmologists

*Consistency checks (things that should go together):*
- Cataract surgery should have biometry beforehand
- Injections should have OCT monitoring
- Glaucoma should have both visual fields AND OCT
- YAG capsulotomy volume shouldn't exceed cataract volume (that's biologically impossible from one doctor)

Each check scores green, neutral (not enough data), or red. The ratio of green to total checks drives the score.

**What this catches:** Upcoding (billing complex procedures when they should be routine). Modifier abuse (double-dipping on office visit charges). Charge inflation. Clinically nonsensical billing patterns like doing surgery without diagnostic workup.

---

## How the Five Scores Work Together

No single score tells the whole story. The power is in the combination:

| Pattern | Guideline | Peer | Volume | Payer | Billing | Interpretation |
|---|---|---|---|---|---|---|
| Great doctor, bad billing | 90 | 85 | 85 | 70 | 35 | Clinically sound, but charges and coding are abnormal |
| Looks right, poor care | 40 | 85 | 80 | 65 | 75 | Bills like a normal ophthalmologist but isn't following clinical guidelines |
| Retina specialist | 70 | 45 | 90 | 50 | 80 | Narrow scope is expected — low peer comparison is structural, not a problem |
| Trace biller | 50 | 75 | 30 | 60 | 60 | Claims to do everything, but volume says they don't really do any of it |
| Upcoder | 70 | 80 | 85 | 65 | 30 | Real practice, real volume, but billing pattern is full of red flags |

---

## How Subspecialists Are Handled

Not all ophthalmologists are the same. A retina specialist who does 50 injections a day should not be scored the same way as a general ophthalmologist who does cataracts, glaucoma, and comprehensive exams.

We detect subspecialists through their NPPES taxonomy codes and adjust:

- **Retina specialists:** Retina domain gets 50% weight (instead of 25%). Cataract and glaucoma domains drop. Volume adequacy only checks retinal categories.
- **Glaucoma specialists:** Glaucoma domain gets 50% weight. Volume only checks glaucoma-relevant categories.
- **Cornea specialists:** Cataract domain gets 40% weight (cornea and cataract overlap). Retina drops.
- **Oculoplastics and pediatric ophthalmology:** Excluded from scoring entirely. Their practice patterns are too different from general ophthalmology, and (for pediatrics) Medicare data barely covers their patients.

When a subspecialty has enough providers (30+), we build a separate peer cohort just for them. A retina specialist is compared to other retina specialists, not to general ophthalmologists.

---

## What This System Is and Isn't

**What it is:**
- A systematic, transparent way to flag ophthalmologists whose billing patterns diverge from evidence-based norms
- Built entirely on free, public data that anyone can verify
- Relative scoring (compared to peers), not absolute thresholds
- Updated annually as CMS releases new data

**What it is not:**
- A direct measure of patient outcomes (we don't know if patients see better)
- A replacement for chart review or clinical audit
- A definitive quality judgment (a low score means "worth investigating," not "bad doctor")
- Complete (13 AAO guidelines can't be scored without clinical data we don't have)

Every score is a Tier 2 proxy measure. The billing pattern says "this provider's practice is consistent with good ophthalmology." The billing pattern cannot say "this provider's patients have good outcomes." That distinction matters.

---

## The Data Pipeline at a Glance

```
Step 1: Download four free datasets from CMS + NPPES
            |
Step 2: Identify ophthalmologists (taxonomy 207W00000X)
            |
Step 3: Build state-level peer cohorts
            |
Step 4: Compute five scores per provider
            |
Step 5: Output one row per NPI with all five scores + details
            |
Result: ~19,000+ ophthalmologists scored nationally
```

Each of the five Sub-Treasure Map documents in this folder describes the exact logic, formulas, worked examples, business rules, and output schema for its dimension. This document is the plain-English overview. The Sub-Treasure Maps are the technical specification.
