# Design System

Read this before creating or modifying any UI. For product behavior (what each screen does), see `PRD.md`.

> **State (2026-09-11):** No UI exists yet. Everything here was **explicitly decided** with the product owner, or follows directly from those decisions and from `PRD.md`. Items marked **Not established** must be decided and recorded here before they are built.

**Foundation decisions:**
- Tailwind CSS with **shadcn/ui** (Radix-based) components. shadcn/ui is React-only, so this commits the frontend to React.
- A calm, light, operational visual direction.
- The system font stack.
- **WCAG 2.2 AA.**

## Design Philosophy

RescueAI is a tool for making decisions under time pressure. Every screen should answer "what needs attention, and what should I do?" as fast as possible.

1. **Meaning before decoration.** Color, weight and position are spent on priority, status and the next action, never on ornament.
2. **Show the reasoning.** A recommendation is never shown without its explanation (PRD F8). The score breakdown is part of the design, not a tooltip.
3. **Approval is deliberate.** Nothing is pre-selected, and a dispatch never happens on a single accidental tap (PRD F9).
4. **Works outdoors on a cheap phone.** Volunteer and citizen screens assume a small Android screen, bright sunlight and a weak network.

## Visual Direction

- **Calm operational light.** White surfaces and subtle gray panels, with near-black text.
- **One blue accent**, used only for actions, links and focus.
- **Red, amber and green are reserved** for priority and status meaning. They are never decorative.
- **Color never carries meaning alone.** Every colored signal comes with a text label, and on the map also an icon or shape.
- Light theme only. Dark mode is **not planned**.

## Colors

Colors are defined as shadcn/ui CSS variables and mapped to Tailwind's default palette. Hex values are the Tailwind v3 shades. Contrast was measured against white (or the tint noted) and meets AA.

| Token | Tailwind | Hex | Use | Contrast |
|---|---|---|---|---|
| `--background` | white | `#ffffff` | Page and cards | — |
| `--muted` | slate-50 | `#f8fafc` | Panels, sidebar, table header | — |
| `--foreground` | slate-900 | `#0f172a` | Primary text | 17.9:1 |
| `--muted-foreground` | slate-600 | `#475569` | Secondary text, metadata | 7.6:1 (7.2 on muted) |
| `--border` | slate-200 | `#e2e8f0` | Decorative dividers and card borders only | — |
| `--input` | slate-500 | `#64748b` | Input, checkbox and switch borders (need 3:1) | 4.8:1 |
| `--primary` | blue-700 | `#1d4ed8` | Primary buttons, links (hover: blue-800) | 6.7:1 |
| `--ring` | blue-600 | `#2563eb` | Focus ring | 5.2:1 |
| `--destructive` / critical | red-700 | `#b91c1c` | Critical priority, destructive actions (badge bg: red-50) | 6.5:1 (5.9 on red-50) |
| `--warning` | amber-700 / amber-800 | `#b45309` / `#92400e` | High priority, waiting states (badge: amber-800 on amber-50) | 5.0:1 / 6.8:1 on amber-50 |
| `--success` | green-700 | `#15803d` | Verified and completed states (badge bg: green-50) | 5.0:1 (4.8 on green-50) |

**Semantic mapping:**

| Meaning | Color | Applies to |
|---|---|---|
| Critical priority | red | Priority band "Critical" |
| High priority | amber | Priority band "High" |
| Normal priority | neutral (slate) | Priority band "Normal" (all other requests) |
| Waiting on someone | amber | Pending (request), Awaiting approval, Sent back, Offered, Unverified skill |
| Done / confirmed | green | Verified skill, Completed, Resolved |
| Everything else | neutral (slate) | In Progress, Accepted, Deployed, Declined, Rejected, Withdrawn, Cancelled |

- Priority bands (PRD F6, **provisional**, to be reconsidered against scenario data): **Critical** when P(r) ≥ 0.70, **High** when P(r) ≥ 0.50, otherwise **Normal**.
- Do not use `amber-600`, `green-600`, `slate-400` or lighter shades for text or for component borders. They fail AA.

## Typography

- **Font:** Tailwind `font-sans` (the system UI stack). No web fonts.
- **Hindi:** citizen and volunteer screens also appear in Hindi, using the same font stack (Android includes a Devanagari font). Hindi text is often longer than English, so never give buttons or labels on these screens a fixed width. Check Hindi screens on a real Android 10+ phone.
- **Body size:**
  - Citizen and volunteer screens use `text-base` (16px).
  - Commander and admin screens use `text-sm` (14px) for density.
  - `text-xs` (12px) is allowed only for metadata such as timestamps and IDs.
- **Headings:**
  - Page title: `text-2xl font-semibold`
  - Section: `text-lg font-semibold`
  - Card title: `text-base font-semibold`
- **Numbers:** scores, counts, distances and timestamps use `tabular-nums`, so columns line up and live updates don't jitter.
- **Weights:** use only `font-normal`, `font-medium` and `font-semibold`.

## Spacing

- Use only Tailwind's default 4px spacing scale. **No arbitrary values** (for example `p-[13px]`).
- Common values:
  - Inside controls: `gap-2`
  - Inside cards: `p-4` (mobile) and `p-6` (desktop)
  - Between stacked sections: `space-y-6`
  - Page gutter: `px-4` (mobile) and `px-6` (lg and up)

## Border Radius

- A single shadcn `--radius` of `0.5rem` (the shadcn default).
- Cards, inputs and buttons use the derived `rounded-md`/`rounded-lg`. Badges and chips use `rounded-full`.

## Shadows

- Cards and panels are separated by **borders, not shadows**.
- Shadows appear only on overlays (dialogs, popovers, dropdowns, toasts), using the shadcn/ui defaults.

## Layout

The layout has one shell per role (roles and access are defined in PRD AC18):

- **Citizen:** a single centered column (`max-w-lg`) containing only the request form and its confirmation, with an English / हिन्दी language switch at the top. There is no navigation.
- **Volunteer:** a mobile-first single column with a top app bar.
  - The app bar holds the English / हिन्दी language switch.
  - The home screen shows the availability switch and the current offer or assignment.
  - When commanders have asked for locations, the LocationRequestBanner appears at the top of the home screen.
  - Other screens are Profile (skills and verification status) and History.
- **Commander** (on-site and office commanders share this shell; English only):
  - A left sidebar nav on `lg` and up; it collapses into a menu below `lg`.
  - Sections: Queue, Map, Volunteers, Teams, Audit Log.
  - Office commanders get an **Awaiting approval** filter on the Queue rather than a separate screen (D-042): the same split view, with the recommendation panel read-only and the ApprovalBar at the bottom. It shows the same RecommendationCards and ScoreBreakdowns the on-site commander saw.
  - **Queue uses a split view on `lg`:** the prioritized list on the left, the selected request's detail and recommendations on the right. Below `lg`, the detail opens as its own page.
- **Admin:** the commander shell, plus Commanders, Weights, Data (scenario load and CSV export), and Audit Log.
- **Map:** fills the content area. Its legend is always visible. Everything shown on the map is also available as a list (the queue, volunteers, teams).

## Responsive Breakpoints

- Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. Build mobile-first.
- **Minimum supported width is 375px** for every screen. This is required for volunteer screens (PRD AC21).
- Commander and admin screens are laid out for `lg` and up, but must remain usable at 375px.

## Component Patterns

Use shadcn/ui components before building custom ones. These project-specific composites must look the same everywhere:

- **PriorityBadge:** band label plus score, e.g. `Critical · 0.87`. Colored by band per Colors. The score uses `tabular-nums`.
- **StatusBadge:** the status text, colored per the semantic mapping. It uses the shadcn Badge.
- **SkillChip:** the skill name plus a state label with an icon (✓ Verified, Unverified, Rejected).
- **ScoreBreakdown:** the explanation (PRD F8).
  - One row per factor, showing the factor name, its normalized value, weight and contribution.
  - Contributions are shown as a horizontal bar and a number, followed by the **total**, which must equal the displayed score.
  - The one-line reason sits above the rows.
  - It is visible by default in the request detail view, never hidden behind a tooltip.
- **RecommendationCard:**
  - Contents: rank, responder name, type (Volunteer or Team), score, distance, skill chips, ScoreBreakdown and a selection checkbox.
  - **Checkboxes start unchecked.**
  - Volunteers and teams appear in separate, labeled lists.
- **DecisionBar** (on-site commander):
  - Buttons: Send for approval (primary, disabled until at least one responder is selected; the label includes the count, e.g. "Send 2 for approval"), Modify (outline) and Reject (outline).
  - It stays anchored at the bottom of the recommendation panel.
  - After sending, the panel shows a StatusBadge "Awaiting approval" and the bar stays disabled until the office commander acts.
- **ApprovalBar** (office commander):
  - Buttons: Approve (primary) and Send back (outline).
  - It stays anchored at the bottom of the read-only recommendation panel.
  - RecommendationCards in this view are read-only, with no checkboxes.
- **LocationRequestBanner** (volunteer home):
  - A shadcn Alert (default variant) saying that commanders have asked volunteers to share their location, with a "Share my location" button in `lg` size.
  - It disappears once the volunteer shares a location newer than the request.
- **AvailabilitySwitch:**
  - A shadcn Switch with the visible text "Available" or "Unavailable", sized for touch.
  - Turning it on requests location access.
- **Timestamp:** relative text (for example "12 min ago"). The absolute time is in `title` or `<time datetime>`.

## Buttons

- shadcn Button variants:
  - `default` (primary blue): the single main action in a region
  - `outline` / `secondary`: alternatives
  - `ghost`: toolbar and icon actions
  - `destructive`: irreversible removals
  - `link`
- **At most one primary button per region.**
- Button labels are verbs describing the outcome ("Approve 2 responders", "Submit request"), never "OK".
- **Loading:** disable the button, show a spinner and a progressive label ("Approving…"), and keep the button's width.
- **Size:**
  - Commander and admin screens use the default size.
  - Citizen and volunteer screens use `lg` with at least 44×44px targets.
- Icon-only buttons need an `aria-label`.

## Forms

- Use shadcn form components.
- Every input has a visible `<label>` above it. Required fields are marked "(required)" in text, not with a color or asterisk alone.
- **Validation:**
  - Validate on submit, then re-validate the changed field as the user edits.
  - Errors appear as text below the field, linked with `aria-describedby`. Focus moves to the first invalid field.
- **Phone:** `type="tel"` and `inputmode="numeric"`, with the expected format shown as hint text (10-digit mobile).
- **Location:** a "Use my location" button, with a map pin picker as a fallback. Show the chosen coordinates in text.
- **Never lose entered data.**
  - If a submit fails, keep all values and offer "Try again".
  - This matters most on the citizen request form.

## Cards

- shadcn Card: `--border`, `rounded-lg`, no shadow, padding `p-4` (mobile) or `p-6` (desktop).
- Card header: title plus an optional badge on the right. Card footer: actions, right-aligned (full-width stacked on mobile).
- Do not nest cards inside cards.

## Navigation

- **Commander and admin:** a sidebar with a text label plus icon for each section. The active item uses `--muted` background and `font-medium`, with `aria-current="page"`.
- **Volunteer:** a top app bar with the page title. Navigation is a menu on the app bar. **Not established:** a bottom tab bar has not been decided.
- **Citizen:** no navigation.
- Include a skip-to-content link on every shell that has navigation.

## Modals

- Use a shadcn **Dialog** for focused tasks:
  - Reject (with optional reason)
  - Severity override (new value)
  - Withdraw offer
  - Send back (with a required reason)
- Use an **AlertDialog** to confirm outward or irreversible actions:
  - **Approve** (office commander) opens one that summarizes exactly who will be offered or deployed.
  - **Ask volunteers to share location** opens one that says every volunteer will see the request.
- Never nest dialogs, and never use a dialog to show read-only content that belongs on the page.
- Closing a dialog returns focus to the element that opened it (Radix default).

## Tables

- shadcn Table.
- **Queue columns:** Priority, Severity, Hazard, Vulnerability, Waiting, Status.
- The queue's default and only sort is P(r) descending (PRD AC5).
- Numeric columns are right-aligned and use `tabular-nums`. The header row uses a `--muted` background.
- Rows are clickable, with a visible focus state and keyboard activation (Enter).
- Below `md`, table rows render as stacked cards with the same fields.

## Loading States

- Use **Skeletons** shaped like the content for tables, lists, cards and the ScoreBreakdown. The only full-page spinner is the initial app load.
- Show loading state on the button that triggered an action (see Buttons).
- **Live updates** (PRD F12):
  - New or changed rows get a brief highlight.
  - Announce them through a polite `aria-live` region, for example "1 new request".

## Empty States

Each empty state has one sentence of text, plus at most one action:

- **Queue:** "No pending requests."
- **Queue, Awaiting approval filter:** "No selections waiting for approval."
- **Volunteer, no offer:**
  - When Available: "No offers yet. New offers appear here."
  - When Unavailable: "Turn on Available to receive offers."
- **Shortlist empty:** state why ("No available volunteers with the required verified skills"), with the action "Edit required skills" (the Modify action).
- **Audit log / history:** "Nothing recorded yet."

## Error States

- **Field errors:** inline, below the field (see Forms).
- **Form- or page-level errors:** shadcn Alert (destructive variant) at the top of the region, with a retry action where one makes sense.
- **Transient results** (for example "Offer sent", "Could not save"): a toast. A blocking error is **never** shown only as a toast.
- **Location permission denied:** explain in plain words and offer the map pin fallback. Volunteers see why they can't turn on Available.
- Error text says what happened and what to do next. Never show raw error codes or stack traces.

## Animations

- Keep motion functional only: the shadcn/Tailwind defaults for overlay enter/exit, hover and focus (roughly 150–200ms), plus the live-update highlight.
- Respect `prefers-reduced-motion`: no motion beyond an instant state change.
- No decorative, looping or attention-seeking animations (no pulsing markers).

## Accessibility

The target is **WCAG 2.2 AA**, and it is a release requirement.

- **Contrast:**
  - Text: at least 4.5:1 (3:1 for 18px+ or bold 14px+).
  - UI component boundaries and focus indicators: at least 3:1. Use only the tokens in Colors.
- **Keyboard:** every action works by keyboard, including row selection, recommendation selection and all dialogs.
  - The focus ring is always visible (`--ring`). Never write `outline: none` without a replacement.
- **Touch targets:** at least 44×44px on citizen and volunteer screens, and at least 24×24px everywhere (WCAG 2.5.8).
- **Color:** never the only signal (see Visual Direction). Map markers differ by shape or icon as well as color.
- **Structure and announcements:**
  - Semantic HTML landmarks, one `h1` per page, and `lang` on the root set to the chosen language (`en` or `hi`).
  - Status changes are announced via `aria-live`.
- **Labels:** every form input has a programmatic label, and every icon button has an accessible name.
- **Zoom:** never disable zoom. Layouts must work at 200% zoom and 320px reflow.
- **Map:** it must not be the only way to reach any information or action. A list equivalent always exists.

## Do Not

- Don't add colors, fonts, shadows, radii or breakpoints that aren't in this file. Update this file first, with the owner's approval.
- Don't use arbitrary Tailwind values (`[..]`) for color, spacing, size or radius.
- Don't use red, amber or green decoratively. Don't use blue for status.
- Don't use color as the only indicator of priority, status or verification.
- Don't pre-select responders, auto-approve, or put Approve somewhere it can be triggered accidentally.
- Don't hide a recommendation's explanation behind a hover, tooltip or extra click.
- Don't add dark mode, web fonts or decorative motion.
- Don't use a different component library alongside shadcn/ui, and don't restyle shadcn primitives per page. Change the token instead.
- Don't nest cards or dialogs.
- Don't show an error only as a toast, and don't clear a form when a submit fails.
