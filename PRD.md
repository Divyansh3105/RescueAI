# Product Requirements Document

**Product:** RescueAI — Explainable Decision Support for Disaster Rescue and Volunteer Coordination
**Source:** Project synopsis CSE27-364 (Graphic Era Hill University, Sept 2026)
**Status:** Draft v2 (2026-09-15). MVP scope agreed and owner decisions recorded, but not yet formally approved.
- Items marked **[Assumption]** are proposed but not confirmed.
- Items marked **[Provisional]** are decided for now and must be reconsidered against scenario data in Phase 6.
- See the last section for both lists.

---

## Product Overview

RescueAI is a web-based decision support system for the **response phase** of a disaster. It takes rescue requests from citizens, ranks them by priority, and recommends the best-matched **civilian volunteers** and **SDRF/NDRF rescue teams** for each request. Each recommendation shows how it was calculated. **Nothing is dispatched until an on-site commander selects the responders and an office commander approves the selection.**

The MVP delivers one end-to-end loop:

> citizen submits request → request enters prioritized queue → system ranks volunteers and teams with explanations → on-site commander selects / modifies / rejects → office commander approves or sends back → volunteer accepts / declines / completes → every decision is logged.

The MVP is a prototype demonstrated on **flood and landslide** scenarios in **Uttarakhand**.

## Target Users

| Role | Access | What they do in MVP |
|---|---|---|
| **Citizen** | No login | Submits a rescue request, in English or Hindi. |
| **Volunteer** | Self-registers, logs in | Declares skills, sets availability, shares location (including when commanders ask), accepts/declines offers, reports completion. Uses English or Hindi. |
| **On-site Commander** (SDRF/NDRF) | Account created by Admin | Works at the disaster site. Triages the queue, reviews recommendations, selects responders, modifies or rejects recommendations. |
| **Office Commander** (SDRF/NDRF) | Account created by Admin | Works at the command office. Approves the on-site commander's selection, or sends it back. |
| **Admin** | Seeded account | Creates/deactivates commander accounts, edits scoring weights, views audit log, loads scenarios, exports evaluation data. Never sees citizen phone numbers or volunteer locations. |

Both commander types can also verify volunteer skills, manage rescue team records, override severity, withdraw offers, ask volunteers to share their location, and resolve or cancel requests. **[Assumption]** None of these shared actions is restricted to one commander type. In this document, "commander" means either type unless a type is named.

Hospital and shelter staff are **future** roles.

## Problem Statement

During disaster response, commanders decide which rescue request to serve first and whom to send. To do that, they manually piece together information from separate systems while under severe time pressure. The reasoning behind these decisions is not recorded and cannot be reviewed later. Meanwhile, civilian volunteers who arrive at the site are an unmanaged resource. They are not registered, their skills are unverified, the command centre doesn't know where they are, and nobody tracks their assignments. The result is duplicated effort in some places and unmet need in others. No available system does all three of the following:

- tasks professional teams and verified volunteers through one workflow
- explains each recommendation well enough for a commander to check it before acting
- records the decision for audit

## Goals

- **G1:** Reduce the time between a request being submitted and a responder being approved for it, compared with manual coordination on the same scenarios.
- **G2:** Turn civilian volunteers into a verified resource pool that commanders can search by skill, location and availability.
- **G3:** Show an explanation with every recommendation, require two-level commander approval (on-site selection, then office approval) before any dispatch, and log every decision.
- **G4:** Deliver a deployed, demonstrable prototype plus a quantitative evaluation by **January 2027** (Research Paper Part 3, Results and Discussion). Later milestones run to the Phase-II Examination in May 2027; see `PLAN.md`.

## Non-Goals

- Autonomous dispatch. The system only recommends; humans always approve.
- Live integration with operational SDRF/NDRF or government systems.
- Real-time satellite imagery processing.
- Formal field deployment.
- A native mobile app. Volunteers use the responsive web app.
- Offline or low-connectivity operation.
- Hazard types other than flood and landslide in the MVP.
- Automatic detection of duplicate reports of one incident. Commanders cancel duplicates by hand.

## Core Features

### MVP

**F1 — Rescue request intake (citizen, no login)**
- Required fields: location (map pin or device GPS), hazard type (Flood / Landslide), contact phone (10-digit Indian mobile number).
- Optional fields: contact name, people affected, people trapped, people injured, vulnerability flags (children, elderly, injured, persons with disability), free-text description.
- On submit, the citizen sees a request reference ID in the form `RQ-4821`, short enough to read out over the phone.
- The form is available in English and Hindi.

**F2 — Volunteer registration and profile**
- Self-registration: name, phone, password (at least 8 characters). Volunteers log in with their phone number, and a session lasts 12 hours.
- Volunteers declare skills from a fixed list: First Aid, Swimming, Boat Handling, Heavy Lifting, Driving, Local Language Proficiency.
- Each declared skill starts as *Unverified*.
- The volunteer can toggle availability between **Available** and **Unavailable**. Setting Available requires sharing location.
- The profile shows the last-known location with a timestamp, plus service history (offers, accepts, declines, completions).
- **Location request:** a commander can ask all volunteers to share their location, for example when a disaster hits. Until a volunteer shares a location newer than that request, their home screen shows a banner asking them to share it. This is an in-app banner, not a push notification.
- Volunteer screens are available in English and Hindi.

**F3 — Skill verification**
- A commander marks each declared skill *Verified* or *Rejected*.
- Only verified skills count in matching.
- A volunteer with no verified skills is never recommended.

**F4 — Rescue team records**
- The commander creates and edits teams with these fields: name, force (SDRF/NDRF), capabilities (same skill list as volunteers), base location, and status (Available / Deployed / Unavailable).
- Teams have no login.

**F5 — Severity estimation (rule-based) with override**
- Severity is set automatically on a 1–5 scale by a documented, deterministic rule. The rule uses hazard type, number trapped and number injured.
- A commander can override severity. Each override is logged with the old value, the new value, the commander and the time.
- **[Provisional]** The rule is a points table (decided 2026-09-18, D-047). It uses only the three inputs above, is monotonic in each of them, and saturates at 5:

  `severity = min(5, 1 + trapped_points + injured_points + hazard_points)`

  | Input | Value | Points |
  |---|---|---|
  | People trapped | 0 | 0 |
  | | 1-2 | 2 |
  | | 3-5 | 3 |
  | | 6 or more | 4 |
  | People injured | 0 | 0 |
  | | 1-2 | 1 |
  | | 3-5 | 2 |
  | | 6 or more | 3 |
  | Hazard type | Flood | 0 |
  | | Landslide | +1 |

  **A blank count is scored as 0**, because people trapped and people injured are optional in F1.

  Worked examples: Flood with nobody trapped or injured = 1. Flood with 1 trapped = 3. Flood with 1 trapped and 2 injured = 4. Landslide with 1 trapped = 4. Landslide with 3 trapped = 5.

  Landslide carries +1 because burial and crush injury give a much shorter survival window than flood isolation.

  **This table is provisional and must be reconsidered against scenario data in Phase 6.** The value most likely to need changing is the blank-count rule: if most real submissions omit the optional counts, the queue clusters at severity 1-2 and depends on Vul, Wait and commander override to separate requests.

**F6 — Prioritized request queue**
- The queue shows Pending and In-Progress requests, sorted by priority score:
  `P(r) = α·Sev(r) + β·Vul(r) + γ·Wait(r)`, with each term normalized to [0, 1] and α + β + γ = 1.
  - `Sev` is the normalized severity. **[Assumption]** `Sev = (severity − 1) ÷ 4`, so severity 1 contributes 0.
  - `Vul` is the number of vulnerability flags present divided by 4.
  - `Wait = min(minutes since submission ÷ 60, 1)`. A request gets the full wait score after 1 hour, so older requests are not starved by newer ones. **[Provisional]**
- Each row shows its score and the three components.
- Each request has a **priority band**: **Critical** when P(r) ≥ 0.70, **High** when P(r) ≥ 0.50, otherwise **Normal**. The band colors the queue and the map. **[Provisional]**

**F7 — Responder recommendation**
- For a selected request, the system shows ranked shortlists of volunteers and teams.
- **Required skills** default from the hazard type and can be edited by the commander. Defaults: Flood → Swimming, Boat Handling, First Aid; Landslide → Heavy Lifting, First Aid.
- Volunteer score: `S(v,r) = w1·Skill + w2·Proximity + w3·Freshness + w4·Reliability`, with each term normalized to [0, 1].
  - Skill = |required ∩ verified| / |required|.
  - Proximity = max(0, 1 − d ÷ 25 km), where d is the straight-line distance from the volunteer's last-known location to the request location. A volunteer 25 km or more away gets 0.
  - Freshness = max(0, 1 − location age in minutes ÷ 120). It measures how recent the volunteer's last-known location is. A location 2 hours old or older gets 0. **[Assumption]** The 2-hour window.
  - Reliability = completed ÷ (offered − withdrawn). Declined offers count against the volunteer; offers a commander withdrew do not. It is 0.5 for a volunteer with no counted offers.
  - **Eligibility:** only volunteers who are Available, have no active assignment and have at least one verified skill are ranked. An old location does not exclude a volunteer; it lowers their Freshness instead.
- Team score uses capability match and proximity. Only Available teams are ranked. **[Assumption]** Team score = (w1·Capability + w2·Proximity) ÷ (w1 + w2). Capability is computed like Skill, and Proximity like the volunteer term, from the team's base location.
- The shortlist shows the top 10 volunteers and top 10 teams.
- The Admin can change the weights (w1–w4, α, β, γ) without a code change.
  - w1 + w2 + w3 + w4 = 1 and α + β + γ = 1. The Admin form rejects weights that don't sum to 1.
  - Initial weights are equal (each w = 0.25; α = β = γ = 1/3) until domain-informed values exist.

**F8 — Explanation**
- Every recommendation shows each feature's contribution to the score. The contributions add up to the displayed total.
- It also shows a one-line plain-language reason, for example: *"Ranked #1: verified First Aid and Swimming, 1.2 km away, location updated 5 min ago, 90% completion rate."*
- Explanations are shown to commanders, in English.

**F9 — Two-level commander decision (human-in-the-loop)**

Level 1, the on-site commander:
- **Select:** choose one or more responders from the shortlist and send the selection to the office commander.
- **Modify:** change the required skills and recompute the ranking, or pick any other eligible responder that isn't in the shortlist, then send the selection.
- **Reject:** dismiss the recommendation, with an optional reason. The request stays Pending.

Level 2, the office commander:
- **Approve:** accept the selection. Only now do selected volunteers receive offers and selected teams become Deployed.
- **Send back:** return the selection to the on-site commander with a reason. Nothing is dispatched, and the request stays Pending.

Rules:
- No offer or deployment happens without **both** a logged on-site selection and a logged office approval of that same selection.
- **[Assumption]** The office commander approves the selection exactly as sent and cannot add or remove responders. To change it, they send it back.
- If a selected responder is no longer eligible when the office commander approves (for example, they took another assignment), that responder is not offered or deployed, and the office commander is told.

**F10 — Assignment handling**
- An approved volunteer receives an **offer** in the app and can accept or decline it.
- After accepting, the volunteer sees the incident location on a map and can mark the task **Completed**.
- The volunteer never sees the citizen's phone number. Commanders contact the citizen and pass on what the volunteer needs.
- A decline notifies the commanders. The on-site commander can select another responder, which again needs office approval.
- An approved team is recorded as **Deployed**, and the commander marks it complete.
- A volunteer or team holds at most one active assignment. The commander can withdraw a pending offer.
- Request statuses: Pending → In Progress (at least one responder accepted or deployed) → Resolved or Cancelled. Only a commander sets Resolved or Cancelled.

**F11 — Map view**
- Commanders see requests (colored by priority band), Available volunteers and teams on an OpenStreetMap map.

**F12 — Live in-app updates**
- New requests, selections waiting for office approval, offers, location requests and status changes appear on open screens without a manual reload.
- Push notifications are not part of the MVP.

**F13 — Audit log**
- An append-only record of these events:
  - on-site select, modify and reject actions
  - office approve and send-back actions
  - severity overrides
  - skill verifications
  - location requests
  - offer responses and withdrawals
  - status changes
- Each entry records the actor, a timestamp, and the recommendation and explanation shown at the time.
- Entries never contain citizen phone numbers or volunteer coordinates, because the Admin can read the log.
- Commanders and Admin can view the log. Nobody can edit or delete entries.

**F14 — Evaluation support**
- The system timestamps each request at submission, first recommendation shown, on-site selection, office approval, acceptance and completion.
- The Admin can export these timestamps and the audit log as CSV. Exports contain no citizen phone numbers or volunteer locations.
- The Admin can load a scenario dataset (requests, synthetic volunteers, teams) for demos and evaluation. A scenario sets its own submission times, volunteer location timestamps and service histories, so the Wait, Freshness and Reliability terms vary within it instead of being constant.

## User Flows

**UF1 — Citizen reports an emergency**
1. The citizen opens the site, chooses English or Hindi, and fills in the request form.
2. They submit and receive a reference ID.
3. The request appears in the commander queue with an automatic severity and priority score.

**UF2 — Volunteer onboarding**
1. The volunteer registers and declares skills.
2. A commander verifies or rejects each skill.
3. The volunteer sets status to Available and shares location.
4. The volunteer is now eligible for recommendations.
5. When a disaster hits and a commander asks all volunteers for their location, the volunteer sees a banner and shares it again.

**UF3 — Two-level triage and dispatch**
1. The on-site commander opens the queue (highest priority first) and selects a request.
2. They optionally override severity or edit the required skills.
3. They review the ranked volunteers and teams, with explanations.
4. They select responders, modify the recommendation, or reject it. The action is logged.
5. The office commander sees the selection with the same explanations, and approves it or sends it back with a reason. The action is logged.
6. After approval, selected volunteers receive offers and selected teams are marked Deployed.

**UF4 — Volunteer handles an assignment**
1. The volunteer receives an offer and views the details.
2. They accept or decline.
3. After accepting, they go to the location and mark the task Completed.
4. Their reliability score updates.

**UF5 — Closing a request**
1. The commander sees responder completions.
2. The commander marks the request Resolved (or Cancelled). This is logged.

**UF6 — Admin setup**
1. The Admin creates on-site and office commander accounts.
2. The Admin sets scoring weights.
3. The Admin loads a scenario dataset and exports evaluation data.

## Future Features

Everything below comes from the synopsis and is **deferred beyond the MVP**:

- **Hospital module:** beds, ICU and ambulance status, plus receiving-hospital recommendation.
- **Shelter module:** capacity, occupancy and supplies, plus shelter recommendation.
- **Safe routing:** hazard-aware routes over the OSM road network, and road travel time for the proximity term.
- **Equipment:** inventory and allocation.
- **Trained models:** a gradient-boosted severity classifier, a learning-to-rank volunteer model and SHAP-based explanations.
- **Assignment optimization:** constrained assignment across the whole queue, based on team capability, equipment and facility capacity.
- **Few-shot severity:** few-shot classification for rare hazards (GLOF, cloudburst).
- **Knowledge graph and RAG:** a knowledge graph plus retrieval over NDMA/SDRF SOPs, with procedural guidance that cites its sources.
- **Citizen features:** an emergency safety chatbot and an active alerts view for the citizen's area.
- **Reporting:** situation report generation.
- **Weather:** IMD weather feed integration.
- **Notifications:** push notifications (e.g., FCM).
- **Command dashboard:** an analytics view.
- **Learning loop:** a feedback loop from commander decisions into the training data.

## Technical Constraints

- **Timeline:** built by a team of 3 to the department timeline (ref. GEHU/CSE/Major-Project/2026-2027/01). Phase-I Examination Oct 26 – Nov 3, 2026; deployed prototype plus evaluation by January 2027; Phase-II Examination May 2027. Full milestone list in `PLAN.md`.
- **Platform:** a web application. The volunteer UI must work in a mobile browser on Android 10+ with GPS, and be installable as a PWA. The PWA is install-only, with no offline caching, because offline operation is a non-goal.
- **Stack:** synopsis Table 5.2 is **indicative, not mandatory**. Simpler alternatives are allowed if the features are delivered.
- **Hosting:** the demo instance must run on about 2 vCPU, 4 GB RAM and 40 GB storage (synopsis Table 5.1).
- **Map data:** OpenStreetMap.
- **Time:** timestamps are stored in UTC and shown in IST everywhere, including CSV exports.
- **Data:** no public volunteer dataset exists, so volunteers are **synthetic**. Evaluation uses historical Uttarakhand flood/landslide records and simulated tabletop scenarios.
- **Human approval is mandatory at two levels:** no code path may offer an assignment or deploy a team without a logged on-site commander selection and a logged office commander approval.
- **Security:**
  - Role-based access control and hashed passwords.
  - Citizen phone numbers and volunteer locations are visible **only on the commander (SDRF/NDRF) dashboards**. Volunteers (including the assigned volunteer) and the Admin never see them, and audit entries and CSV exports leave them out. A volunteer can still see their own location.
- **Language:** citizen and volunteer screens are available in English and Hindi, with a switch between them. Commander and Admin screens, and explanations, are English only.

## Success Metrics

The owner confirmed these targets on 2026-09-15. They are not yet grounded in domain data, so the real numbers are reported honestly even when a target is missed. The two 100% rules are hard requirements.

| ID | Metric | Target |
|---|---|---|
| SM1 | Median time from submission to office approval, compared with a manual baseline that uses the same two-level approval on the same scenarios | ≥ 40% lower |
| SM2 | Volunteer ranking quality against ground-truth assignments from the simulated scenarios, measured on the top 5 of the 10-item shortlist | Precision@5 ≥ 0.70, NDCG@5 ≥ 0.75 |
| SM3 | Usability (SUS questionnaire) from evaluators acting as commander | Mean SUS ≥ 68 |
| SM4 | Dispatched assignments that have both a logged on-site selection and a logged office approval | 100% (hard) |
| SM5 | Recommendations that display an explanation | 100% (hard) |

### Evaluation Protocol

Decided 2026-09-22 (D-049), closing the open evaluation-method item. The *shape* of this was
already published in the project synopsis (Section 4.9), so the paper must stay consistent with
it. What follows fixes **who does each job**, because for SM1 and SM2 the wrong person
invalidates the result. Names are assigned in Phase 4; the roles below are what must not change.

Throughout, **"the scoring author"** means whoever writes `api/src/scoring/` — owner B in
`PLAN.md`.

**SM2 — ground truth for ranking quality.**
- For every request in every scenario, the ground truth lists which volunteers should have been
  offered, with **graded relevance** (ideal / acceptable / wrong). NDCG needs grades, not a
  yes-or-no list.
- **The scoring author must not build the ground truth.** Grading the formula against its own
  author's intuitions is circular: Precision@5 comes out near 1.0 and measures nothing.
- The ground truth is built from a **written rubric fixed before anyone sees system output**.
  The rubric is included in the paper.
- **Two people label independently**, disagreements are resolved by discussion, and
  **Cohen's kappa is reported** as the inter-rater agreement.
- Built during Phases 3 and 4, not Phase 6 (`PLAN.md`, D-048).

**SM1 — the manual baseline.**
- Two team members act as on-site commander and office commander and coordinate the same
  scenarios **by hand**: a messaging group plus a spreadsheet of volunteers, including both
  approval steps. Timed from request submission to office approval.
- **The manual runs happen before those people use RescueAI on the same scenarios**, so the
  baseline is not inflated by already knowing the answer. Scenario order is counterbalanced.
- **The deployed instance is warmed before every timed run.** It is a free Render service that
  sleeps after about 15 minutes idle and cold-starts in roughly 50 seconds (D-044); an unwarmed
  run puts that cold start inside the reported median.
- Both the RescueAI median and the manual median are reported, not only the percentage gap.

**SM3 — usability.**
- The standard 10-item System Usability Scale, administered to evaluators acting as commanders.
- **8–12 evaluators, none of them on the project team.**
- Classmates are acceptable. Faculty are better. **Two or more serving SDRF or NDRF personnel
  would be worth more than twenty classmates**, because it changes the claim from "usable by
  students" to "usable by responders" — ask the mentor whether this can be arranged.
- The evaluator mix is reported in the paper, because it bounds what the SUS score means.

**SM4 and SM5 — no evaluators needed.** Both are computed directly from the audit export
(PRD F14): the share of assignments carrying both a logged on-site selection and a logged office
approval, and the share of recommendations that displayed an explanation. Both targets are hard
100% requirements, so any shortfall is a defect, not a measurement.

**Reporting.** Every number is reported as measured, including missed targets. SM1–SM3 targets
were set on 2026-09-15 without domain data and are not predictions.

## Acceptance Criteria

**Request intake**
- **AC1:** A citizen can submit a request without logging in. Submission fails with a clear message if the location, hazard type or a valid 10-digit phone number is missing.
- **AC2:** A successful submission shows a reference ID, and the request appears in the commander queue within 10 seconds, without a reload.

**Severity and priority**
- **AC3:** The same request inputs always produce the same automatic severity.
- **AC4:** A commander's severity override changes the priority score immediately and creates an audit entry with the old value, new value, actor and time.
- **AC5:** The queue is sorted by P(r) in descending order. For two requests with equal Sev and Vul, the older one ranks higher.

**Volunteers and teams**
- **AC6:** Unverified or rejected skills never contribute to the Skill term. A volunteer with zero verified skills never appears in a shortlist.
- **AC7:** Volunteers who are Unavailable or already on an active assignment never appear in a shortlist. The same applies to teams that are not Available.
- **AC8:** When two volunteers are identical except for one of the following, the first-named one ranks higher:
  - the nearer one, when only distance differs
  - the one with the more recent location, when only location age differs
  - the more reliable one, when only completion rate differs
- **AC9:** Every shortlisted responder shows per-feature contributions that add up to the displayed score (within rounding), plus a one-line reason.
- **AC10:** After the Admin changes a weight, rankings recompute using the new weight, with no code change or redeploy. The Admin cannot save volunteer weights or priority weights that do not sum to 1.

**Commander decisions**
- **AC11:** No volunteer receives an offer, and no team becomes Deployed, unless an on-site commander has selected them (directly or after modifying) and an office commander has approved that selection. Both actions have audit entries.
- **AC12:** A reject action by the on-site commander leaves the request Pending and records the optional reason.
- **AC22:** An office commander cannot approve a request that has no selection waiting for approval, and an on-site commander cannot approve at all. A send-back leaves the request Pending, dispatches nothing, and records the reason.

**Assignments**
- **AC13:** A volunteer can accept or decline an offer. A decline is visible to the commanders, and the request stays assignable.
- **AC14:** After acceptance, the volunteer sees the incident location on a map. The citizen's phone number never appears in any volunteer or Admin response, before or after acceptance.
- **AC15:** When the volunteer marks a task Completed, their reliability score updates (completed ÷ (offered − withdrawn)).
- **AC16:** The request moves to In Progress on the first acceptance or deployment. Only a commander can set Resolved or Cancelled.

**Audit log**
- **AC17:** Audit entries cannot be edited or deleted through any UI or API.

**Access control**
- **AC18:** Citizens can reach only the request form. Volunteers cannot see the queue, other volunteers' locations, or unassigned requests. The Admin cannot see citizen phone numbers or volunteer locations. Only the Admin can create commander accounts or change weights.

**Map and evaluation**
- **AC19:** The map shows all Pending and In-Progress requests and all Available volunteers and teams at their last-known locations.
- **AC20:** The Admin can export per-request timestamps (submitted, first recommended, selected, approved, accepted, completed) and the audit log as CSV. The exports contain no citizen phone numbers or volunteer locations.
- **AC21:** The volunteer screens work on a 375 px-wide Android mobile browser, including location sharing.

**Location request and language**
- **AC23:** After a commander asks volunteers to share their location, every volunteer whose last shared location is older than that request sees a banner on their home screen within 10 seconds, without a reload. The banner disappears once they share a newer location.
- **AC24:** Citizen and volunteer screens can be switched between English and Hindi, and all text on them, including validation errors, appears in the chosen language.

## Open Items and Provisional Values

**Still to confirm ([Assumption]):**
1. ~~The severity rule table (F5).~~ **Closed 2026-09-18 (D-047):** a provisional points table is now in F5. It is `[Provisional]`, not confirmed by domain consultation.
2. Severity scaling `(severity − 1) ÷ 4` (F6).
3. The team score formula (F7).
4. No shared commander action is restricted to one commander type (Target Users).
5. The office commander approves a selection exactly as sent and cannot edit it (F9).
6. The 2-hour window in the Freshness term (F7).
7. **Password reset is missing.** Nothing lets a volunteer who forgot their password back in, and only the Admin creates commander accounts. Either a commander can reset a volunteer's password, or this is accepted as a known limitation.

**Provisional: reconsider against scenario data in Phase 6 ([Provisional]):**
- Priority band cutoffs: Critical ≥ 0.70, High ≥ 0.50 (F6). Decided 2026-09-15.
- Wait reaches its maximum after 60 minutes (F6). Decided 2026-09-15.
- The severity rule table, including scoring a blank count as 0 (F5). Decided 2026-09-18, D-047.

**Confirmed by the owner on 2026-09-15** (details in `DECISIONS.md` D-026 to D-034):
- Proximity falls to 0 at 25 km.
- The Availability term is replaced by location Freshness; availability stays an eligibility filter.
- Weights sum to 1; reliability ignores withdrawn offers and defaults to 0.5.
- Default required skills per hazard.
- Top-10 shortlist.
- Equal initial weights.
- At most one active assignment per responder; commanders can withdraw pending offers.
- Two-level approval: on-site selection, then office approval.
- Personal data only on commander dashboards.
- In-app location request banner.
- English and Hindi on citizen and volunteer screens.
- Success metric targets SM1–SM3.
- The 10-second live-update target.
