# RescueAI — Formula decisions for mentor review

**Team CSE27-364** · Ayush Rawat (2318609), Divyansh Garg (2318760), Suryanshu Bisht (2319705)
**Mentor:** Mr. Rahul Chauhan
**Prepared:** 22 September 2026
**Needed by:** **15 October 2026** — Research Paper Part 2 (Methodology) is due **20 October 2026**
and must state these formulas in their final form.

---

## What we are asking

RescueAI ranks rescue requests and recommends responders using deterministic formulas — no machine
learning in the prototype. Most of the formulas are settled. **Three parameters are still marked as
assumptions in our requirements document**, because they are engineering judgments that we cannot
justify from data, and they are exactly the kind of choice a paper reviewer will question.

For each one below we give: what it does, why the choice matters, **our recommendation**, and a box
for your decision. If you agree with a recommendation, we only need a tick.

If we do not hear back by 15 October we will proceed with our recommendations, mark them
`[Provisional]` in the requirements document, and re-examine them against scenario data in
January — but we would much rather have your judgment first.

### Where these fit

Requests are ordered by a **priority score**:

> P(r) = α·Sev(r) + β·Vul(r) + γ·Wait(r)   — each term in [0, 1], α + β + γ = 1

Responders are ordered by a **volunteer score**:

> S(v,r) = w₁·Skill + w₂·Proximity + w₃·Freshness + w₄·Reliability   — each term in [0, 1], weights sum to 1

The weights (α, β, γ, w₁–w₄) are adjustable by an administrator at runtime and start equal. **The
three questions below are not about the weights** — they are about how the underlying quantities are
calculated.

---

## Item 1 — How should a 1–5 severity be converted to a 0–1 number?

### What it does

Our severity rule outputs an integer from 1 to 5. The priority formula needs it as a number between
0 and 1.

### Current proposal

> **Sev = (severity − 1) ÷ 4**

| Severity | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Contributes | 0.00 | 0.25 | 0.50 | 0.75 | 1.00 |

### Why it matters

A severity of 1 contributes **nothing** to the priority score. Such a request is still ranked, but
only on the vulnerability of the people involved and on how long it has been waiting.

The alternative, `severity ÷ 5`, would give severity 1 a floor of 0.2. A third option is a curve
that makes severity 5 count disproportionately more than severity 4.

### Our recommendation — keep (severity − 1) ÷ 4

1. **Consistency.** Every other quantity in both formulas spans a true 0 to 1. Severity would be the
   only one that cannot reach 0.
2. **Explainability is the project's core claim.** Every recommendation must show a reader how its
   score was produced. "Severity 4 of 5, so 0.75" needs no explanation. A curve would need one, and
   would need defending.
3. **Severity 1 genuinely is the floor** — under our rule it means a flood report with nobody
   trapped and nobody injured.
4. **We have no data to justify a curve.** Choosing an exponent without evidence would be false
   precision, and a reviewer would be right to challenge it.

**Known consequence:** trapped and injured counts are optional on the citizen form, and a blank
count is scored as 0, so a sparse report becomes severity 1. If many real requests are sparse, much
of the queue sits at Sev = 0. Our view is that the correct response is to re-tune the priority band
thresholds in January, not to bend the severity curve.

> **Your decision:**
> ☐ Agree — keep (severity − 1) ÷ 4
> ☐ Use severity ÷ 5 instead
> ☐ Other: ______________________________________________

---

## Item 2 — How should rescue teams be scored?

### What it does

Alongside civilian volunteers, the system recommends SDRF/NDRF **teams**. Volunteers are scored on
four things: skill match, proximity, how recent their location is, and their past reliability.
**Two of those do not apply to teams** — a team has a fixed base location (so there is nothing to
keep fresh) and no record of accepting or declining offers.

### Current proposal

> **Team score = (w₁·Capability + w₂·Proximity) ÷ (w₁ + w₂)**

Capability is the fraction of required skills the team has; Proximity is measured from the team's
base. The division rescales the result back into 0–1 so team scores and volunteer scores can be read
on the same axis. With the default equal weights this is simply the average of capability and
proximity.

### Why it matters

This reuses the volunteer weights rather than introducing separate ones. That means **the balance
between capability and proximity is forced to be the same for teams as for volunteers.** One could
argue teams should weight capability more heavily — an SDRF team without boat capability is of
little use in a flood rescue however close it is.

### Our recommendation — keep the formula, and add one safeguard

Keep it. Separate team weights would mean two more numbers for an administrator to set, more
validation, and more to explain in the paper — and we have no evidence to set them differently.

**However, the formula as written has a defect.** An administrator is allowed to set any weights
that sum to 1. If they set w₁ = w₂ = 0, putting all weight on freshness and reliability, then
`w₁ + w₂ = 0` and the formula **divides by zero**. We propose that the administrator form reject any
weights where w₁ + w₂ = 0, alongside the existing rule that the weights sum to 1.

We would also like to state explicitly in the requirements that teams have no freshness or
reliability term **by design**, so it is not read later as an oversight.

> **Your decision:**
> ☐ Agree — keep the formula, add the w₁ + w₂ > 0 safeguard
> ☐ Give teams their own separate weights
> ☐ Other: ______________________________________________

---

## Item 3 — How quickly should a volunteer's location go stale?

### What it does

The system knows each volunteer's **last reported** location, which may be old. Rather than exclude
volunteers with old locations, we discount them:

> **Freshness = max(0, 1 − location age in minutes ÷ 120)**

A location reported just now scores 1.0; one hour old scores 0.5; **two hours old or more scores 0**.

### Why it matters

Freshness is really a **confidence measure on proximity**. A volunteer recorded 500 m away three
hours ago may be 30 km away now, and proximity would be misleading. The window sets how fast we stop
trusting it.

- **Too short** and nearly every volunteer scores 0, so the term does nothing.
- **Too long** and the system confidently recommends people who have long since moved.

The practical risk: our application has **no background location tracking**. A volunteer's location
only updates when they open the app. Commanders can send a request asking everyone to share their
location, and volunteers see a banner until they do — but during a response lasting several hours,
locations may well drift past two hours regardless.

### Our recommendation — keep 2 hours, but make it adjustable

Two hours matches the rhythm we expect in an active response, where volunteers are prompted to
re-share.

**We recommend making the window an administrator setting rather than a fixed number in the code**,
stored alongside the weights. Our evaluation window in January is only two weeks, and being able to
try 60, 120 and 240 minutes against the scenario data without redeploying could be the difference
between a tuned result and an assumed one.

The cost is one extra field on a settings form that already exists.

> **Your decision:**
> ☐ Agree — keep 2 hours, and make it adjustable
> ☐ Keep 2 hours fixed in the code
> ☐ Use a different window: __________ minutes
> ☐ Other: ______________________________________________

---

## Also worth your view, if there is time

Not part of the three questions above, but the same conversation.

### The severity rule itself

We had to define how a report becomes a 1–5 severity, and we could not derive it from data: the
historical disaster records we have are aggregated per **event** (total deaths and injuries across a
region over days) and contain nothing about individual rescue requests. So we wrote a rule from
reasoning and marked it provisional.

> severity = min(5, 1 + trapped points + injured points + hazard points)
>
> - people trapped: 0 → 0 · 1–2 → 2 · 3–5 → 3 · 6 or more → 4
> - people injured: 0 → 0 · 1–2 → 1 · 3–5 → 2 · 6 or more → 3
> - hazard: flood → 0 · landslide → +1

Examples: flood with nobody trapped or injured = 1; flood with 1 trapped = 3; landslide with 1
trapped = 4; landslide with 3 trapped = 5.

Landslide carries +1 because burial and crush injury allow far less time than flood isolation.

**If you can point us to an NDMA or SDRF triage convention we should be following instead, that
would be considerably stronger than our reasoning** — and it would let us cite a source in the paper
rather than defend a judgment.

### Evaluators for the usability study

Our evaluation includes a usability questionnaire completed by people acting as commanders. We plan
to recruit 8–12 people from outside the team.

**If you can reach even two serving SDRF or NDRF personnel**, it would change the claim we can make
from "usable by students" to "usable by responders" — worth more to a journal reviewer than twenty
classmates.

---

## For reference — what is already settled

So this document is not read as the whole design being open:

| Settled | Value |
|---|---|
| Priority formula | P(r) = α·Sev + β·Vul + γ·Wait, weights sum to 1 |
| Volunteer formula | S(v,r) = w₁·Skill + w₂·Proximity + w₃·Freshness + w₄·Reliability |
| Proximity | Falls linearly to 0 at 25 km, straight-line distance |
| Waiting time | Reaches maximum after 60 minutes (provisional) |
| Vulnerability | Number of vulnerability flags ÷ 4 |
| Reliability | completed ÷ (offered − withdrawn); 0.5 with no history |
| Shortlist | Top 10 volunteers and top 10 teams |
| Priority bands | Critical ≥ 0.70, High ≥ 0.50 (provisional) |
| Initial weights | All equal, until domain-informed values exist |
| Approval | On-site commander selects; office commander approves; nothing dispatches otherwise |

Full detail is in `PRD.md`; the reasoning behind every decision is recorded in `DECISIONS.md`.

---

**Contact:** Divyansh Garg · divyanshgarg3105@gmail.com
**Deployed prototype:** <https://rescueai-70mu.onrender.com> (no features yet — setup only)
**Repository:** <https://github.com/Divyansh3105/RescueAI>
