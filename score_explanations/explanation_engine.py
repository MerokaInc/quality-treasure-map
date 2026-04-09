"""
Score Explanation Engine

Generates plain-English explanations for provider scores, per dimension.
Powers the "why did I get this score?" feature in the Provider Quality Profile (B2).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from score_explanations import templates


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _fmt(template_str: str, data: dict) -> str:
    """
    Fill a template string using .format_map so that missing keys produce a
    clear placeholder rather than raising KeyError.
    """
    try:
        return template_str.format_map(data)
    except (KeyError, IndexError):
        # Fall back: replace any remaining {key} tokens with '—'
        import re
        return re.sub(r"\{[^}]+\}", "—", template_str)


def _fill_template(tmpl: dict, data: dict) -> dict:
    """Return a new dict with all string values in tmpl filled from data."""
    return {
        k: _fmt(v, data) if isinstance(v, str) else v
        for k, v in tmpl.items()
    }


# ---------------------------------------------------------------------------
# Improvement hints
# ---------------------------------------------------------------------------

_IMPROVEMENT_HINTS: dict[str, str] = {
    "mips": (
        "Consider participating in a MIPS Value Pathway (MVP) relevant to your "
        "specialty to build a scored quality record with CMS."
    ),
    "practice_pattern_guideline_adherence": (
        "Review your {weak_area} protocols against {guideline_body} guidelines — "
        "small documentation or coding changes can meaningfully improve this score."
    ),
    "practice_pattern_peer_comparison": (
        "Closing the gap on the {gap_count} missing reference codes for {specialty} "
        "would improve your peer comparison score."
    ),
    "practice_pattern_volume_adequacy": (
        "Increasing documented volume in {flagged_categories} above the minimum "
        "threshold would raise your volume adequacy score."
    ),
    "practice_pattern_billing_quality": (
        "Reviewing and resolving the {red_count} flagged billing patterns with your "
        "billing team could improve your billing quality score."
    ),
    "credentials": (
        "Submitting your board certification evidence through the provider portal "
        "will restore full weight to your credentials score."
    ),
    "patient_experience": (
        "Inviting patients to leave reviews on Healthgrades or Zocdoc can raise "
        "your review count above the confidence threshold."
    ),
    "access": (
        "Adding telehealth, expanded hours, or additional insurance plans accepted "
        "would improve your access score."
    ),
}

# Dimensions (or sub-dimensions) where improvement is not actionable by the provider
_STRUCTURAL_DIMENSIONS = {
    "safety_gate",
    "mips_tier2",
    "mips_tier3",
    "practice_pattern_payer_presence",
}


def generate_improvement_hint(dimension: str, score_data: dict) -> Optional[str]:
    """
    If the score has room for improvement AND the improvement is actionable,
    return a one-sentence hint. Returns None if the score is structural or already high.

    Args:
        dimension: Dimension key (e.g. 'mips', 'credentials', 'patient_experience').
                   For practice pattern sub-dimensions use 'practice_pattern_<sub>'.
        score_data: Dict with scored values and metadata for this dimension.

    Returns:
        A one-sentence improvement hint, or None.
    """
    # No hint for structural dimensions
    if dimension in _STRUCTURAL_DIMENSIONS:
        return None

    # No hint if score is already high (>= 80 out of 100)
    score = score_data.get("score")
    if score is not None and score >= 80:
        return None

    # Safety gate pass — no room for improvement needed
    if dimension == "safety_gate" and score_data.get("passed"):
        return None

    template_str = _IMPROVEMENT_HINTS.get(dimension)
    if template_str is None:
        return None

    return _fmt(template_str, score_data)


# ---------------------------------------------------------------------------
# Core explanation generator
# ---------------------------------------------------------------------------

def generate_explanation(npi: str, dimension: str, score_data: dict) -> dict:
    """
    Generate a plain-English explanation for a provider's score in a given dimension.

    Args:
        npi: Provider NPI.
        dimension: One of 'safety_gate', 'mips', 'practice_pattern', 'credentials',
                   'patient_experience', 'access'.
        score_data: Dict containing the scored values and metadata for this dimension.

    Returns:
        dict with keys:
            dimension       - echoed back
            summary         - one-sentence overview
            detail          - 2-3 sentence elaboration
            structural_caveat - string or None
            controllable    - bool (False when score is driven by structural factors)
            improvement_hint - string or None
    """
    summary = ""
    detail = ""
    structural_caveat = None
    controllable = True
    hint_dimension = dimension  # key used for improvement hint lookup

    # --- Safety Gate ---
    if dimension == "safety_gate":
        if score_data.get("passed", True):
            tmpl = _fill_template(templates.SAFETY_GATE["pass"], score_data)
        else:
            tmpl = _fill_template(templates.SAFETY_GATE["fail"], score_data)
        summary = tmpl["summary"]
        detail = tmpl["detail"]
        structural_caveat = tmpl["structural_caveat"]
        controllable = False  # outcome of regulatory records, not direct provider action

    # --- MIPS ---
    elif dimension == "mips":
        tier = score_data.get("tier", "tier3")
        tmpl = _fill_template(templates.MIPS[tier], score_data)
        summary = tmpl["summary"]
        detail = tmpl["detail"]
        structural_caveat = tmpl["structural_caveat"]
        # Tier 1 is partially controllable (provider chooses to participate)
        controllable = tier == "tier1"
        hint_dimension = f"mips_{tier}" if tier != "tier1" else "mips"

    # --- Practice Pattern ---
    elif dimension == "practice_pattern":
        sub = score_data.get("sub_dimension", "guideline_adherence")
        key = f"practice_pattern_{sub}"
        tmpl = _fill_template(templates.PRACTICE_PATTERN[sub], score_data)
        summary = tmpl["summary"]
        detail = tmpl["detail"]
        structural_caveat = tmpl["structural_caveat"]
        controllable = sub not in ("payer_presence",)
        hint_dimension = key

    # --- Credentials ---
    elif dimension == "credentials":
        if score_data.get("certified", False):
            tmpl = _fill_template(templates.CREDENTIALS["certified"], score_data)
        else:
            tmpl = _fill_template(templates.CREDENTIALS["not_certified"], score_data)
        summary = tmpl["summary"]
        detail = tmpl["detail"]
        structural_caveat = tmpl["structural_caveat"]
        controllable = True

    # --- Patient Experience ---
    elif dimension == "patient_experience":
        review_count = score_data.get("review_count", 0)
        min_threshold = score_data.get("min_threshold", 10)
        if review_count == 0:
            variant = "no_reviews"
        elif review_count < min_threshold:
            variant = "few_reviews"
        else:
            variant = "has_reviews"
        tmpl = _fill_template(templates.PATIENT_EXPERIENCE[variant], score_data)
        summary = tmpl["summary"]
        detail = tmpl["detail"]
        structural_caveat = tmpl["structural_caveat"]
        controllable = True

    # --- Access ---
    elif dimension == "access":
        tmpl = _fill_template(templates.ACCESS["standard"], score_data)
        summary = tmpl["summary"]
        detail = tmpl["detail"]
        structural_caveat = tmpl["structural_caveat"]
        controllable = True

    else:
        summary = f"No explanation template found for dimension '{dimension}'."
        detail = ""
        structural_caveat = None
        controllable = True

    improvement_hint = generate_improvement_hint(hint_dimension, score_data)

    return {
        "dimension": dimension,
        "summary": summary,
        "detail": detail,
        "structural_caveat": structural_caveat,
        "controllable": controllable,
        "improvement_hint": improvement_hint,
    }


# ---------------------------------------------------------------------------
# Full-profile explanation
# ---------------------------------------------------------------------------

def generate_full_profile_explanation(npi: str, all_scores: dict) -> list[dict]:
    """
    Generate explanations for all dimensions for a provider.

    Args:
        npi: Provider NPI.
        all_scores: Dict keyed by dimension name, each value is a score_data dict.
                    For 'practice_pattern', the value should be a list of sub-dimension
                    score_data dicts (each with a 'sub_dimension' key), OR a single dict
                    with 'sub_dimension' set.

    Returns:
        List of explanation dicts (one per dimension / sub-dimension).
    """
    DIMENSION_ORDER = [
        "safety_gate",
        "mips",
        "practice_pattern",
        "credentials",
        "patient_experience",
        "access",
    ]

    results = []
    for dim in DIMENSION_ORDER:
        if dim not in all_scores:
            continue
        score_data = all_scores[dim]

        # Practice pattern may contain multiple sub-dimensions
        if dim == "practice_pattern" and isinstance(score_data, list):
            for sub_data in score_data:
                results.append(generate_explanation(npi, dim, sub_data))
        else:
            results.append(generate_explanation(npi, dim, score_data))

    return results
