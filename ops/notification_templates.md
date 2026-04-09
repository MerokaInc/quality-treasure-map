# Notification Templates

Templates for all provider lifecycle status transition notifications. Placeholders use `{variable_name}` syntax and must be substituted before sending.

---

## Provider Notifications

Sent directly to the provider on every status transition.

### `pending_review → active`

**Subject:** Your Meroka quality profile is now live

> Welcome to Meroka. Your quality profile has been reviewed and is now active. Your scores are publicly visible to employers on the marketplace.
>
> View your quality profile at {profile_link}.
>
> If you have questions about your scores or believe any data is inaccurate, you may submit a dispute through your provider portal.

---

### `active → flagged`

**Subject:** Your Meroka quality profile has been flagged for review

> Your quality profile has been flagged for review.
>
> **Reason:** {reason}
>
> A member of our team will complete the review within {sla_days} business days. No action is required from you at this time. Your profile remains visible on the marketplace while the review is in progress.
>
> You will receive a follow-up notification when the review is complete. If you have relevant information to share, contact us at {ops_contact_email}.

---

### `flagged → active`

**Subject:** Your Meroka quality profile review is complete

> Your quality profile review has been completed. No issues were found.
>
> Your profile remains active and visible on the Meroka marketplace. No changes to your scores or listing have been made as a result of this review.
>
> If you have questions, contact us at {ops_contact_email}.

---

### `flagged → suspended`

**Subject:** Your Meroka quality profile has been suspended

> Your quality profile has been suspended and is temporarily removed from the Meroka marketplace.
>
> **Reason:** {reason}
>
> **What you need to do:** {resolution_instructions}
>
> Please resolve the issue and contact us at {ops_contact_email} to begin the re-evaluation process. If the issue is not resolved within 30 days of this notice, your profile will be permanently removed from the marketplace.
>
> **Suspension date:** {suspension_date}
> **Resolution deadline:** {resolution_deadline}

---

### `suspended → active`

**Subject:** Your Meroka quality profile suspension has been lifted

> Your suspension has been lifted. Your quality profile is active again and visible on the Meroka marketplace.
>
> Thank you for resolving the issue. Your updated profile and scores are now live.
>
> View your quality profile at {profile_link}.

---

### `suspended → removed`

**Subject:** Your Meroka quality profile has been removed

> Your quality profile has been removed from the Meroka marketplace.
>
> **Reason:** {reason}
>
> If you believe this decision was made in error, contact us at {ops_contact_email} within {appeal_window_days} days of this notice.
>
> If you wish to re-apply to the Meroka marketplace after resolving the underlying issue, you may submit a re-application after {waiting_period}. Re-applications require a full safety gate review and re-scoring.

---

### `pending_review → removed` (safety gate failure)

**Subject:** Meroka onboarding review: action required

> We were unable to complete your onboarding to the Meroka marketplace. Your application did not pass our initial safety review.
>
> **Reason:** {reason}
>
> If you believe this is an error or have documentation that addresses the concern, contact us at {ops_contact_email} within {appeal_window_days} days.
>
> You may re-apply after {waiting_period} if the underlying issue has been resolved.

---

### `removed → pending_review` (re-application received)

**Subject:** Meroka re-application received

> Your re-application to the Meroka marketplace has been received.
>
> We will conduct a full review, including a safety gate assessment and complete re-scoring. You will be notified of the outcome within {sla_days} business days.
>
> Your previous profile history is retained in our records. If your re-application is approved, you will receive a separate notification with a link to your restored profile.
>
> If you have questions during the review, contact us at {ops_contact_email}.

---

### `active → removed` (voluntary removal)

**Subject:** Your Meroka quality profile has been removed

> Your request to remove your quality profile from the Meroka marketplace has been processed. Your profile is no longer visible to employers.
>
> If you change your mind and wish to re-list, you may re-apply at any time. Re-applications require a full safety gate review and re-scoring.
>
> Thank you for your time on the Meroka platform. Contact us at {ops_contact_email} if you have any questions.

---

## Employer Notifications

Sent to all employers who have the affected provider in their network. Triggered whenever a provider in their network undergoes a network-impacting status transition.

### Provider flagged (`active → flagged`)

**Subject:** Provider under review — {provider_name} ({npi})

> A provider in your network, **{provider_name}** (NPI: {npi}), has been flagged for a quality review.
>
> **No action is needed from you at this time.** The provider's profile remains active on the marketplace while the review is in progress. We will notify you when the review is complete.
>
> If you have questions, contact your Meroka account manager or reach us at {employer_support_email}.

---

### Provider suspended (`flagged → suspended`)

**Subject:** Provider temporarily removed from marketplace — {provider_name} ({npi})

> A provider in your network, **{provider_name}** (NPI: {npi}), has been temporarily suspended and removed from the Meroka marketplace.
>
> **We recommend identifying alternative providers** for any employees currently using this provider, as their profile is not accessible while the suspension is active.
>
> We will notify you of any further status changes. For questions, contact your Meroka account manager or reach us at {employer_support_email}.

---

### Provider removed (`suspended → removed` or `active → removed` or `pending_review → removed`)

**Subject:** Provider removed from marketplace — {provider_name} ({npi})

> A provider in your network, **{provider_name}** (NPI: {npi}), has been permanently removed from the Meroka marketplace.
>
> **Please update your provider network** to remove this provider. Employees directed to this provider will no longer find an active Meroka profile.
>
> If you need help identifying replacement providers, contact your Meroka account manager or reach us at {employer_support_email}.

---

### Provider re-activated (`flagged → active`)

**Subject:** Provider review complete — {provider_name} ({npi}) confirmed active

> The quality review for **{provider_name}** (NPI: {npi}), a provider in your network, has been completed. No issues were found.
>
> This provider's profile is active and no changes to their marketplace listing have been made as a result of the review.
>
> No action is required. For questions, contact your Meroka account manager or reach us at {employer_support_email}.

---

### Provider re-activated after suspension (`suspended → active`)

**Subject:** Provider suspension lifted — {provider_name} ({npi}) is active again

> The suspension for **{provider_name}** (NPI: {npi}), a provider in your network, has been lifted. Their quality profile is active again on the Meroka marketplace.
>
> No action is required on your end. For questions, contact your Meroka account manager or reach us at {employer_support_email}.

---

## Template Variable Reference

| Variable | Description |
|----------|-------------|
| `{provider_name}` | Provider's full name |
| `{npi}` | Provider's 10-digit NPI |
| `{reason}` | Short human-readable reason for the transition |
| `{resolution_instructions}` | Specific steps the provider must take to resolve the issue |
| `{sla_days}` | Number of business days in the applicable SLA |
| `{suspension_date}` | ISO 8601 date the suspension took effect |
| `{resolution_deadline}` | ISO 8601 date by which the provider must resolve the issue (suspension_date + 30 days) |
| `{waiting_period}` | How long before re-application is permitted (e.g., "90 days") |
| `{appeal_window_days}` | Number of days the provider has to appeal a removal decision |
| `{profile_link}` | URL to the provider's profile in the Meroka portal |
| `{ops_contact_email}` | Internal ops contact address for provider inquiries |
| `{employer_support_email}` | Account management contact address for employer inquiries |
