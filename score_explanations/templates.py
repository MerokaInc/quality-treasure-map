"""
Templates for per-dimension score explanations.

Each template set contains:
  - summary: One-sentence overview (f-string compatible)
  - detail: 2-3 sentences with specific data points (f-string compatible)
  - structural_caveat: Optional note about factors the provider cannot control
"""

# ---------------------------------------------------------------------------
# Safety Gate
# ---------------------------------------------------------------------------

SAFETY_GATE = {
    "pass": {
        "summary": "You passed the safety gate.",
        "detail": (
            "No active sanctions, exclusions, or disciplinary actions were found "
            "in federal or state records. We check the OIG exclusion list, SAM.gov, "
            "and state medical board databases. This check is repeated periodically; "
            "you will be notified if anything changes."
        ),
        "structural_caveat": None,
    },
    "fail": {
        "summary": "You did not pass the safety gate. {reason}.",
        "detail": (
            "Providers who fail the safety gate are not listed on the marketplace. "
            "The specific finding is: {reason}. "
            "If you believe this is an error, you can initiate a dispute through "
            "the provider portal."
        ),
        "structural_caveat": None,
    },
}

# ---------------------------------------------------------------------------
# Government Quality (MIPS)
# ---------------------------------------------------------------------------

MIPS = {
    "tier1": {
        "summary": (
            "The federal government assessed your quality through the MIPS program. "
            "Your MIPS score is {mips_score}, placing you at the {percentile}th "
            "percentile among scored providers in {state}."
        ),
        "detail": (
            "MIPS (Merit-based Incentive Payment System) is CMS's primary quality "
            "measurement program for Medicare providers. Your score of {mips_score} "
            "reflects performance across quality measures, promoting interoperability, "
            "improvement activities, and cost. "
            "The {state} average MIPS score for {specialty} is {state_avg}."
        ),
        "structural_caveat": (
            "MIPS only covers Medicare fee-for-service. If your patients are primarily "
            "commercially insured, this data gap is expected and does not reflect your quality."
        ),
    },
    "tier2": {
        "summary": (
            "No direct MIPS score is available for you. However, your affiliated "
            "hospital ({hospital_name}) has a {star_rating}-star CMS rating, which "
            "provides an indirect quality signal."
        ),
        "detail": (
            "CMS Hospital Star Ratings summarize quality across safety, readmission, "
            "mortality, patient experience, and timely care. Your affiliation with "
            "{hospital_name} ({star_rating} stars) is used as a proxy for your "
            "clinical environment. "
            "This indirect signal carries reduced weight compared to a direct MIPS score."
        ),
        "structural_caveat": (
            "MIPS only covers Medicare fee-for-service. If your patients are primarily "
            "commercially insured, this data gap is expected and does not reflect your quality."
        ),
    },
    "tier3": {
        "summary": (
            "No government quality assessment is available for your practice."
        ),
        "detail": (
            "This is common — {pct_no_data}% of providers in {state} don't have MIPS "
            "scores, typically because they see fewer than ~200 Medicare patients annually. "
            "This dimension's weight is redistributed to other scores."
        ),
        "structural_caveat": (
            "MIPS only covers Medicare fee-for-service. If your patients are primarily "
            "commercially insured, this data gap is expected and does not reflect your quality."
        ),
    },
}

# ---------------------------------------------------------------------------
# Practice Pattern Analysis (Step 3) — sub-dimension templates
# ---------------------------------------------------------------------------

PRACTICE_PATTERN = {
    "guideline_adherence": {
        "summary": (
            "Your measurable guideline adherence score is {score}."
        ),
        "detail": (
            "This measures {pct_scorable}% of {guideline_body} guidelines that are "
            "detectable from billing data. "
            "{strong_area} is your strongest area. "
            "{weak_area} has the most room for improvement."
        ),
        "structural_caveat": (
            "Practice pattern scores are based on {data_year} Medicare and Medicaid "
            "billing data. They measure what you bill for, not clinical outcomes. "
            "Only {pct_guidelines}% of clinical guidelines are measurable this way."
        ),
    },
    "peer_comparison": {
        "summary": (
            "Your billing pattern matches {code_count} of {reference_count} codes "
            "typical for {specialty} in {state}."
        ),
        "detail": (
            "Code coverage: {coverage}%. "
            "{interpretation}."
        ),
        "structural_caveat": (
            "Practice pattern scores are based on {data_year} Medicare and Medicaid "
            "billing data. They measure what you bill for, not clinical outcomes. "
            "Only {pct_guidelines}% of clinical guidelines are measurable this way."
        ),
    },
    "volume_adequacy": {
        "summary": (
            "{ok_count} of {detected_count} service categories meet the minimum "
            "volume threshold."
        ),
        "detail": (
            "{flagged_categories}."
        ),
        "structural_caveat": (
            "Practice pattern scores are based on {data_year} Medicare and Medicaid "
            "billing data. They measure what you bill for, not clinical outcomes. "
            "Only {pct_guidelines}% of clinical guidelines are measurable this way."
        ),
    },
    "payer_presence": {
        "summary": (
            "You appear in {payer_description}."
        ),
        "detail": (
            "Category overlap: {overlap}%. "
            "{caveat_if_single_payer}."
        ),
        "structural_caveat": (
            "Practice pattern scores are based on {data_year} Medicare and Medicaid "
            "billing data. They measure what you bill for, not clinical outcomes. "
            "Only {pct_guidelines}% of clinical guidelines are measurable this way."
        ),
    },
    "billing_quality": {
        "summary": (
            "Your charge ratio is {charge_position} (score: {charge_score})."
        ),
        "detail": (
            "{green_count} billing patterns look normal, {red_count} are flagged. "
            "{top_red_flag_detail}."
        ),
        "structural_caveat": (
            "Practice pattern scores are based on {data_year} Medicare and Medicaid "
            "billing data. They measure what you bill for, not clinical outcomes. "
            "Only {pct_guidelines}% of clinical guidelines are measurable this way."
        ),
    },
}

# ---------------------------------------------------------------------------
# Credentials
# ---------------------------------------------------------------------------

CREDENTIALS = {
    "certified": {
        "summary": (
            "You are board certified by {board} in {specialty}, active through {expiration}."
        ),
        "detail": (
            "Board certification is the primary credential signal. "
            "Certification by {board} requires passing a rigorous exam and meeting "
            "ongoing maintenance-of-certification requirements. "
            "Your certification in {specialty} is current and verified."
        ),
        "structural_caveat": None,
    },
    "not_certified": {
        "summary": (
            "We did not find active board certification for you."
        ),
        "detail": (
            "This may be because certification data hasn't been verified yet. "
            "You can submit certification evidence through the provider portal. "
            "Unverified credentials reduce your composite score until confirmed."
        ),
        "structural_caveat": None,
    },
}

# ---------------------------------------------------------------------------
# Patient Experience
# ---------------------------------------------------------------------------

PATIENT_EXPERIENCE = {
    "has_reviews": {
        "summary": (
            "Your average rating is {rating} across {review_count} reviews ({platforms})."
        ),
        "detail": (
            "This places you at the {percentile}th percentile for {specialty} in {state}. "
            "Reviews are aggregated from {platforms}. "
            "Sentiment analysis of written reviews is included where available."
        ),
        "structural_caveat": None,
    },
    "few_reviews": {
        "summary": (
            "You have {review_count} reviews, which is below our confidence threshold "
            "({min_threshold})."
        ),
        "detail": (
            "This score has reduced weight in your composite. "
            "As more reviews accumulate, the weight will increase toward the standard level. "
            "Encouraging patients to leave reviews on Healthgrades or Zocdoc can help."
        ),
        "structural_caveat": None,
    },
    "no_reviews": {
        "summary": (
            "No patient reviews were found on the platforms we monitor."
        ),
        "detail": (
            "This is common for independent practices. "
            "This dimension's weight is redistributed to other scores — no reviews "
            "does not mean poor experience. "
            "You can link to existing reviews or invite patients via the provider portal."
        ),
        "structural_caveat": None,
    },
}

# ---------------------------------------------------------------------------
# Access
# ---------------------------------------------------------------------------

ACCESS = {
    "standard": {
        "summary": (
            "Your access score reflects: {features_list}."
        ),
        "detail": (
            "These are based on information your practice reported during onboarding. "
            "Access factors include appointment availability, telehealth options, "
            "insurance accepted, and languages spoken."
        ),
        "structural_caveat": (
            "Access data is self-reported and has not been independently verified."
        ),
    },
}
