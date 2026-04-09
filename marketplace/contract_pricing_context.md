# F3: Contract & Pricing Context

## Overview

Quality scores provide evidence to support contract negotiations between employers and providers. This spec defines how quality data surfaces in the contracting context, what framing is appropriate, and what must not be automated or exposed.

---

## 1. Core Principle

**Quality scores inform, they do not dictate, contract terms.**

The system does not set prices, generate price offers, or enforce pricing tiers. Quality data is evidence that supports a human negotiation — nothing more. All pricing decisions remain with the employer and provider.

---

## 2. Quality-Tiered Pricing Support

Providers are grouped into quality tiers to give negotiations a starting orientation. Tiers are informational, not binding.

| Tier | Composite Score Range | Label |
|---|---|---|
| Premium | ≥ 80 | Premium |
| Standard | 60–79 | Standard |
| Review Required | < 60 | Review Required |

**How tiers are used:**
- Tier is surfaced as context during contract initiation: "This provider qualifies as a Premium-tier provider based on their composite quality score."
- Tier informs the negotiation starting point — a Premium-tier provider has quality evidence to justify higher rates; a Review Required provider warrants additional scrutiny before finalizing terms.
- Tiers are not published to providers or used in automated pricing logic.

**What tiers do not do:**
- Do not set or cap prices
- Do not guarantee any specific rate
- Do not penalize Review Required providers in ways unrelated to quality (e.g., thin data alone does not move a provider to Review Required)

---

## 3. Cost Pattern Transparency

From the utilization and billing quality data (Step 3), the system surfaces cost pattern context during contract preparation. This is comparative context, not absolute pricing data.

**Data points surfaced:**

| Data Point | Display Format | Example |
|---|---|---|
| Charge ratio vs. peers | Relative position | "Charges 1.2x the state median for E/M visits" |
| Bundle cost comparison | Percent above/below regional average | "Maternity bundle: 15% below regional average" |
| Billing anomaly flags | Surfaced if present from Step 3 scoring | "Lab ordering rate 2x peers (flagged in billing quality score)" |

**Charge ratio position:**
- Expressed as a ratio relative to state median (e.g., 0.9x, 1.0x, 1.2x)
- Rounded to one decimal place
- Not expressed as an exact dollar amount or as a percentile rank (see Section 5)

**Bundle cost comparison:**
- Expressed as a percentage above or below the regional average for the full bundle
- Regional average is the same geographic cohort used for quality scoring
- Direction is explicit: "above" or "below," not just a number

**Billing anomaly flags:**
- Displayed only if a flag exists from Step 3 billing quality scoring
- Flag text is passed through from the Step 3 flag description
- No new billing analysis is performed at the contract context layer

---

## 4. Value Framing Templates

Pre-written framing text is generated for each provider based on their quality and cost data. These are used in employer-facing contract preparation materials and are editable by account managers.

**Template 1: Bundle quality + cost**
```
"This provider's maternity bundle costs 15% less than the regional average
with a quality score of 83."
```

**Template 2: Direct contracting savings estimate**
```
"Compared to traditional network rates, direct contracting with this provider
saves an estimated $[savings] per employee per year."
```
Note: `$[savings]` is populated from employer-provided actuarial data or a configurable savings model. If no savings estimate is available, this template is suppressed.

**Template 3: Billing quality framing**
```
"This provider has a billing quality score of 78, with charges within
the p25–p75 range for their specialty."
```

**Template generation rules:**
- Templates are generated server-side and returned via the API
- Account managers can edit template text before it is included in employer materials
- If a required data point is missing (e.g., no bundle cost data), that template is omitted rather than shown with blank fields
- Templates reference quality scores and relative cost positions only — no absolute dollar amounts

---

## 5. What Not to Show

The following data must not be surfaced in the employer-facing contract context UI or API responses:

| Prohibited | Reason |
|---|---|
| Raw charge amounts (in dollars) | Competitive sensitivity — could be used for price-fixing |
| Exact peer percentile for charges | Gaming risk — providers could optimize to a specific percentile |
| Automated price offers based on scores | Prices are negotiated, not generated |
| Penalization of low-volume providers on pricing | Thin data is a confidence issue, not a cost issue |

These restrictions apply to the contract context layer. The underlying scoring pipeline may use these data points internally; they are not to be surfaced in employer or provider-facing outputs.

---

## 6. API Contract

### Pricing context for a provider

```
GET /api/providers/{npi}/pricing-context
```

**Path parameters:**
- `npi` — National Provider Identifier

**Query parameters:**
- `employer_id` — Required. Scopes cost comparisons to the relevant geographic region.
- `bundle` — Optional. If provided, includes bundle-specific cost comparison.

**Response schema:**
```json
{
  "npi": "1234567890",
  "name": "Provider Name",
  "specialty": "OB-GYN",
  "quality_tier": "premium",
  "composite_score": 83,
  "composite_confidence": "high",
  "cost_context": {
    "charge_ratio_vs_state_median": 0.9,
    "charge_ratio_label": "Charges 0.9x the state median for E/M visits",
    "bundle_cost_comparison": {
      "bundle": "maternity",
      "vs_regional_avg_pct": -15,
      "label": "Maternity bundle: 15% below regional average"
    },
    "billing_flags": [
      {
        "flag_type": "lab_ordering_rate",
        "description": "Lab ordering rate 2x peers (flagged in billing quality score)"
      }
    ]
  },
  "value_framing": [
    {
      "template_id": "bundle_quality_cost",
      "text": "This provider's maternity bundle costs 15% less than the regional average with a quality score of 83."
    },
    {
      "template_id": "billing_quality",
      "text": "This provider has a billing quality score of 78, with charges within the p25–p75 range for their specialty."
    }
  ]
}
```

**Notes for eng:**
- `billing_flags` is an empty array if no flags exist — do not omit the key.
- `bundle_cost_comparison` is omitted from the response if `bundle` query param is not provided or if no bundle cost data exists for this provider.
- `value_framing` templates are editable post-generation; store the edited version per employer-provider pair, not just the generated text.
- This endpoint requires employer-level authentication. Raw charge data must not appear anywhere in the response chain, including intermediate computation objects logged to application logs.
