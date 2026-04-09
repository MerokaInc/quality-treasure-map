"""
Improvement Path Generator

Produces ranked, actionable recommendations for a provider based on their
current scores across all quality dimensions. Each recommendation includes:
  - which dimension it addresses
  - the current and estimated post-action scores
  - estimated composite score impact
  - a plain-English action description
  - feasibility horizon: 'quick' | 'moderate' | 'long_horizon'
  - actionable: True if the provider can act on it, False if structural
  - category: 'credentials' | 'billing' | 'access' | 'screening' | 'documentation'
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

# ---------------------------------------------------------------------------
# Feasibility ordering for sorting
# ---------------------------------------------------------------------------

_FEASIBILITY_ORDER = {"quick": 0, "moderate": 1, "long_horizon": 2}

# ---------------------------------------------------------------------------
# Recommendation rules
# ---------------------------------------------------------------------------
# Each entry is a dict describing the rule's output fields *before* any
# template substitution from score_data.  Variable placeholders use
# str.format_map() syntax so they can be filled from score_data at runtime.

RECOMMENDATION_RULES: dict[str, list[dict]] = {
    # -----------------------------------------------------------------------
    # Credentials (Step 4)
    # -----------------------------------------------------------------------
    "credentials": [
        {
            "_condition": "not_certified",
            "dimension": "credentials",
            "potential_score": 85,
            "impact": 8.0,
            "action": (
                "Get board certified in your specialty. Board certification is the "
                "primary credentials signal and raises this dimension score from ~45 "
                "to ~85 upon verification."
            ),
            "feasibility": "long_horizon",
            "actionable": True,
            "category": "credentials",
        },
        {
            "_condition": "expiring_soon",
            "dimension": "credentials",
            "potential_score": 90,
            "impact": 4.0,
            "action": (
                "Renew your board certification before it expires. Your current "
                "certification expires within 12 months; allowing it to lapse will "
                "drop your credentials score significantly."
            ),
            "feasibility": "moderate",
            "actionable": True,
            "category": "credentials",
        },
    ],

    # -----------------------------------------------------------------------
    # Practice Patterns (Step 3)
    # -----------------------------------------------------------------------
    "practice_pattern_guideline_adherence": [
        {
            "_condition": "low_adherence",  # score < 60
            "dimension": "practice_pattern_guideline_adherence",
            "potential_score": 75,
            "impact": 5.0,
            "action": (
                "Review {guideline_body} recommendations for {weak_area}. "
                "Focus on measurable screenings that can be captured in billing data. "
                "Small documentation or coding adjustments often close adherence gaps."
            ),
            "feasibility": "moderate",
            "actionable": True,
            "category": "screening",
        },
    ],

    "practice_pattern_peer_comparison": [
        {
            "_condition": "low_coverage",  # peer comparison score < 50
            "dimension": "practice_pattern_peer_comparison",
            "potential_score": 70,
            "impact": 4.0,
            "action": (
                "Your billing pattern covers {coverage}% of the typical procedure "
                "codes for {specialty}. Review whether all services you perform are "
                "being captured and billed — underbilling is common and directly "
                "lowers this score."
            ),
            "feasibility": "quick",
            "actionable": True,
            "category": "billing",
        },
    ],

    "practice_pattern_volume_adequacy": [
        {
            "_condition": "flagged_volume",
            "dimension": "practice_pattern_volume_adequacy",
            "potential_score": 80,
            "impact": 3.0,
            "action": (
                "The following service categories are below minimum volume thresholds: "
                "{flagged_list}. If you perform these services, verify they are being "
                "billed under your NPI rather than a facility or group billing number."
            ),
            "feasibility": "quick",
            "actionable": True,
            "category": "billing",
        },
    ],

    "practice_pattern_billing_quality": [
        {
            "_condition": "red_flags",
            "dimension": "practice_pattern_billing_quality",
            "potential_score": 85,
            "impact": 4.5,
            "action": (
                "Your billing has {red_count} flagged pattern(s). "
                "The most common flag is: {top_flag}. "
                "Review these with your billing team — resolving flagged patterns "
                "improves your billing quality score."
            ),
            "feasibility": "moderate",
            "actionable": True,
            "category": "billing",
        },
    ],

    "practice_pattern_payer_presence": [
        {
            "_condition": "structural",
            "dimension": "practice_pattern_payer_presence",
            "potential_score": None,  # structural — no improvement target
            "impact": 0.0,
            "action": (
                "Your payer presence score reflects the payer mix available in your "
                "geographic area, not a quality judgment. We weight this dimension "
                "accordingly. No action is required."
            ),
            "feasibility": "long_horizon",
            "actionable": False,
            "category": "billing",
        },
    ],

    # -----------------------------------------------------------------------
    # Access (Step 6)
    # -----------------------------------------------------------------------
    "access_no_telehealth": [
        {
            "_condition": "no_telehealth",
            "dimension": "access",
            "potential_score": 80,
            "impact": 3.5,
            "action": (
                "Adding telehealth to your practice would improve your access score. "
                "Telehealth is one of the highest-weighted access factors. "
                "Even limited availability (e.g., follow-ups only) earns credit."
            ),
            "feasibility": "moderate",
            "actionable": True,
            "category": "access",
        },
    ],

    "access_wait_time": [
        {
            "_condition": "long_wait",
            "dimension": "access",
            "potential_score": 78,
            "impact": 2.5,
            "action": (
                "Your reported wait time ({wait_days} days) is above the 14-day "
                "benchmark. Reducing average wait time to under 14 days improves "
                "your access score and increases patient conversion on the marketplace."
            ),
            "feasibility": "moderate",
            "actionable": True,
            "category": "access",
        },
    ],

    "access_no_extended_hours": [
        {
            "_condition": "no_extended_hours",
            "dimension": "access",
            "potential_score": 75,
            "impact": 2.0,
            "action": (
                "Offering extended or weekend hours adds to your access score. "
                "Even one evening or Saturday morning session per week earns "
                "the extended-hours credit."
            ),
            "feasibility": "moderate",
            "actionable": True,
            "category": "access",
        },
    ],

    # -----------------------------------------------------------------------
    # Patient Experience (Step 5)
    # -----------------------------------------------------------------------
    "patient_experience_few_reviews": [
        {
            "_condition": "few_reviews",
            "dimension": "patient_experience",
            "potential_score": 85,
            "impact": 2.0,
            "action": (
                "You currently have {count} reviews, which is below the confidence "
                "threshold. Encouraging patients to leave reviews on Healthgrades "
                "or Zocdoc increases score confidence weighting — more reviews means "
                "your score carries more weight in the composite."
            ),
            "feasibility": "quick",
            "actionable": True,
            "category": "documentation",
        },
    ],

    "patient_experience_no_reviews": [
        {
            "_condition": "no_reviews",
            "dimension": "patient_experience",
            "potential_score": None,
            "impact": 1.5,
            "action": (
                "No patient reviews were found. Review volume affects the confidence "
                "weighting of this dimension, not the score itself. Inviting patients "
                "to leave reviews on Healthgrades or Zocdoc will allow this dimension "
                "to carry its full weight in your composite score."
            ),
            "feasibility": "quick",
            "actionable": True,
            "category": "documentation",
        },
    ],

    # -----------------------------------------------------------------------
    # MIPS / Government Quality (Step 2)
    # -----------------------------------------------------------------------
    "mips_tier3": [
        {
            "_condition": "no_mips_data",
            "dimension": "mips",
            "potential_score": None,
            "impact": 0.0,
            "action": (
                "No government quality data is available for your practice. "
                "This is common for commercially-focused practices that see fewer "
                "than ~200 Medicare patients annually. This dimension's weight is "
                "redistributed to your other scores; no action is required."
            ),
            "feasibility": "long_horizon",
            "actionable": False,
            "category": "documentation",
        },
    ],

    "mips_tier2": [
        {
            "_condition": "hospital_signal_only",
            "dimension": "mips",
            "potential_score": None,
            "impact": 0.0,
            "action": (
                "Only an indirect quality signal is available via your hospital "
                "affiliation. A direct MIPS score would carry more weight, but "
                "that requires reaching the Medicare volume threshold (~200 patients/year). "
                "This is a structural limitation for commercially-focused practices."
            ),
            "feasibility": "long_horizon",
            "actionable": False,
            "category": "documentation",
        },
    ],

    # -----------------------------------------------------------------------
    # Safety Gate
    # -----------------------------------------------------------------------
    # Pass: no recommendation generated (handled in logic below).
    # Fail: handled by lifecycle process, not improvement paths.
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _days_until(date_str: str) -> Optional[int]:
    """Return days until a date string (ISO 8601 or 'YYYY-MM-DD'). None if unparseable."""
    try:
        target = datetime.fromisoformat(date_str.rstrip("Z")).date()
        return (target - date.today()).days
    except (ValueError, AttributeError):
        return None


def _fmt(template_str: str, data: dict) -> str:
    """Fill a template string using .format_map; unknown keys become '—'."""
    import re
    try:
        return template_str.format_map(data)
    except (KeyError, IndexError):
        return re.sub(r"\{[^}]+\}", "—", template_str)


def _make_rec(rule: dict, score_data: dict, current_score: Optional[float]) -> dict:
    """
    Build a recommendation dict from a rule template, filling action text
    from score_data and attaching the current_score.
    """
    filled_action = _fmt(rule["action"], score_data)
    potential = rule.get("potential_score")
    if potential is None and current_score is not None:
        potential = current_score  # structural: no change expected
    return {
        "dimension": rule["dimension"],
        "current_score": current_score,
        "potential_score": potential,
        "impact": rule["impact"],
        "action": filled_action,
        "feasibility": rule["feasibility"],
        "actionable": rule["actionable"],
        "category": rule["category"],
    }


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate_improvement_path(npi: str, all_scores: dict) -> list[dict]:
    """
    Generate ranked improvement recommendations for a provider.

    Args:
        npi: Provider NPI string.
        all_scores: Dict keyed by dimension.  Each value is a score_data dict
                    (same shape accepted by explanation_engine.generate_explanation).
                    For 'practice_pattern', the value may be a list of sub-dimension
                    dicts (each with a 'sub_dimension' key) or a single dict.

    Returns:
        Prioritized list of recommendation dicts, each containing:
          - dimension: str
          - current_score: float | None
          - potential_score: float | None
          - impact: float   (estimated composite score point improvement)
          - action: str     (plain-English recommendation)
          - feasibility: 'quick' | 'moderate' | 'long_horizon'
          - actionable: bool
          - category: str
    """
    recommendations: list[dict] = []

    # -----------------------------------------------------------------------
    # Safety gate — no recommendations generated
    # -----------------------------------------------------------------------
    # (fail handled by lifecycle; pass needs nothing)

    # -----------------------------------------------------------------------
    # MIPS
    # -----------------------------------------------------------------------
    mips_data = all_scores.get("mips", {})
    if mips_data:
        tier = mips_data.get("tier", "tier3")
        mips_score = mips_data.get("score")
        if tier == "tier3":
            for rule in RECOMMENDATION_RULES["mips_tier3"]:
                recommendations.append(_make_rec(rule, mips_data, mips_score))
        elif tier == "tier2":
            for rule in RECOMMENDATION_RULES["mips_tier2"]:
                recommendations.append(_make_rec(rule, mips_data, mips_score))
        # tier1: already has data — no structural recommendation needed

    # -----------------------------------------------------------------------
    # Practice patterns
    # -----------------------------------------------------------------------
    pp_raw = all_scores.get("practice_pattern", [])
    pp_list: list[dict] = pp_raw if isinstance(pp_raw, list) else [pp_raw]

    for sub_data in pp_list:
        sub = sub_data.get("sub_dimension", "")
        score = sub_data.get("score")

        if sub == "guideline_adherence":
            if score is not None and score < 60:
                for rule in RECOMMENDATION_RULES["practice_pattern_guideline_adherence"]:
                    recommendations.append(_make_rec(rule, sub_data, score))

        elif sub == "peer_comparison":
            if score is not None and score < 50:
                for rule in RECOMMENDATION_RULES["practice_pattern_peer_comparison"]:
                    recommendations.append(_make_rec(rule, sub_data, score))

        elif sub == "volume_adequacy":
            flagged = sub_data.get("flagged_categories") or sub_data.get("flagged_list")
            if flagged:
                enriched = {**sub_data, "flagged_list": flagged}
                for rule in RECOMMENDATION_RULES["practice_pattern_volume_adequacy"]:
                    recommendations.append(_make_rec(rule, enriched, score))

        elif sub == "billing_quality":
            red_count = sub_data.get("red_count", 0)
            if red_count and int(red_count) > 0:
                for rule in RECOMMENDATION_RULES["practice_pattern_billing_quality"]:
                    recommendations.append(_make_rec(rule, sub_data, score))

        elif sub == "payer_presence":
            structural = sub_data.get("structural", True)
            payer_low = (score is not None and score < 60) or structural
            if payer_low:
                for rule in RECOMMENDATION_RULES["practice_pattern_payer_presence"]:
                    recommendations.append(_make_rec(rule, sub_data, score))

    # -----------------------------------------------------------------------
    # Credentials
    # -----------------------------------------------------------------------
    cred_data = all_scores.get("credentials", {})
    if cred_data:
        cred_score = cred_data.get("score")
        certified = cred_data.get("certified", False)
        expiration = cred_data.get("expiration")

        if not certified:
            for rule in RECOMMENDATION_RULES["credentials"]:
                if rule["_condition"] == "not_certified":
                    not_cert_data = {**cred_data, "current_score": cred_score or 45}
                    rec = _make_rec(rule, not_cert_data, cred_score or 45)
                    recommendations.append(rec)
        else:
            # Check if expiring within 1 year (365 days)
            if expiration:
                days_left = _days_until(expiration)
                if days_left is not None and days_left <= 365:
                    for rule in RECOMMENDATION_RULES["credentials"]:
                        if rule["_condition"] == "expiring_soon":
                            recommendations.append(_make_rec(rule, cred_data, cred_score))

    # -----------------------------------------------------------------------
    # Patient experience
    # -----------------------------------------------------------------------
    pe_data = all_scores.get("patient_experience", {})
    if pe_data:
        pe_score = pe_data.get("score")
        review_count = pe_data.get("review_count", 0)
        min_threshold = pe_data.get("min_threshold", 10)
        enriched_pe = {**pe_data, "count": review_count}

        if review_count == 0:
            for rule in RECOMMENDATION_RULES["patient_experience_no_reviews"]:
                recommendations.append(_make_rec(rule, enriched_pe, pe_score))
        elif review_count < min_threshold:
            for rule in RECOMMENDATION_RULES["patient_experience_few_reviews"]:
                recommendations.append(_make_rec(rule, enriched_pe, pe_score))

    # -----------------------------------------------------------------------
    # Access
    # -----------------------------------------------------------------------
    access_data = all_scores.get("access", {})
    if access_data:
        access_score = access_data.get("score")
        has_telehealth = access_data.get("telehealth", False)
        wait_days = access_data.get("wait_days")
        has_extended_hours = access_data.get("extended_hours", False)

        if not has_telehealth:
            for rule in RECOMMENDATION_RULES["access_no_telehealth"]:
                recommendations.append(_make_rec(rule, access_data, access_score))

        if wait_days is not None and wait_days > 14:
            enriched_wait = {**access_data, "wait_days": wait_days}
            for rule in RECOMMENDATION_RULES["access_wait_time"]:
                recommendations.append(_make_rec(rule, enriched_wait, access_score))

        if not has_extended_hours:
            for rule in RECOMMENDATION_RULES["access_no_extended_hours"]:
                recommendations.append(_make_rec(rule, access_data, access_score))

    return prioritize_recommendations(recommendations)


# ---------------------------------------------------------------------------
# Prioritizer
# ---------------------------------------------------------------------------

def prioritize_recommendations(recommendations: list[dict]) -> list[dict]:
    """
    Sort recommendations by:
      1. actionable first (True before False)
      2. impact descending (higher impact first)
      3. feasibility ascending (quick < moderate < long_horizon)

    Args:
        recommendations: List of recommendation dicts produced by
                         generate_improvement_path (or assembled manually).

    Returns:
        New sorted list — original list is not mutated.
    """
    return sorted(
        recommendations,
        key=lambda r: (
            0 if r.get("actionable", True) else 1,        # actionable first
            -(r.get("impact") or 0),                       # higher impact first
            _FEASIBILITY_ORDER.get(r.get("feasibility", "moderate"), 1),
        ),
    )
