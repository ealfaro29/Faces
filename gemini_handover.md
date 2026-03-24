# Gemini Handover — Faces Scoring Module

Updated: 2026-03-23
Repo path: `/Users/tbnalfaro/Desktop/Apps Gerald/Faces`
Live site: `https://ealfaro29.github.io/Faces/`
Primary area: scoring flow under `/session/*`

## Current Git State

- Local worktree is clean.
- `main` HEAD: `30914be` — `Add scoring language support and winner reveal`
- Previous related commits:
  - `b61dde6` — `Preserve phase scoring order`
  - `7cb2028` — `Improve scoring board voting flow`
  - `f2c2cdd` — workflow-based scoring redesign
- `gh-pages` currently points to: `3444bee51657fd56b7a839132719a1e33352fdf1`

## User Working Agreement

The user explicitly wants this workflow on every substantial change:

1. edit code
2. verify (`npm run build`)
3. commit
4. sync `main`
5. deploy GitHub Pages

Do not stop at local code changes unless the user says otherwise.

## Scoring Routes

Defined in `src/App.jsx` and must stay above the wildcard route:

- `/session` -> `ScoringLanding`
- `/session/create` -> `CreateSession`
- `/session/join` -> `JoinSession`
- `/session/:sessionId` -> `SessionBoard`

## Important Files

- `src/pages/scoring/ScoringLanding.jsx`
  - Landing page for scoring.
  - Now includes ES/EN language selection.

- `src/pages/scoring/CreateSession.jsx`
  - Creates sessions.
  - Stores `language` in the Firestore session document.
  - First phase name is localized via `getDefaultPhaseName()`.

- `src/pages/scoring/JoinSession.jsx`
  - Judge join form.
  - Reads session doc before navigation and persists the session language locally.

- `src/pages/scoring/SessionBoard.jsx`
  - Main workflow engine.
  - Handles scoring, cutoff progression, final winner reveal, stable phase ordering, bilingual UI, and country localization.

- `src/pages/scoring/scoringI18n.js`
  - Scoring-only translation source.
  - Also contains language persistence helpers and country-name localization helpers.

- `src/pages/scoring/ScoringLanguageToggle.jsx`
  - Reusable ES/EN toggle used on landing/create/join.

- `src/pages/scoring/ParticipantSetup.jsx`
  - Legacy. Still present, not used in the active route flow.

## Current Behavior

### 1. Stable phase ordering

The scoring table no longer re-sorts live while judges are voting.

- Phase 0 uses the original participant insertion order.
- Later phases use a frozen `participantIds` list saved into each phase when advancing.
- Global results still re-order live.

Implementation details:

- `phases[].participantIds` is now used to preserve the display order of each phase.
- On phase advance, qualified participants are ranked by the completed phase scores, then written into the next phase in that sorted order.

### 2. Slider-based scoring

Each contestant row uses a `0.0 -> 10.0` slider with `0.1` step.

- Save is near-live via short debounce plus flush on blur/release.
- Each judge writes only their own score.
- The clear button removes only that judge's score.

### 3. Final round / winner reveal

If the host sets `Clasifican = 1`, that phase is treated as the final.

- The host CTA changes from advance to winner reveal.
- On reveal, the session is completed instead of creating a new phase.
- Winner data is written to the session document.
- Everyone connected sees a winner celebration card in the left panel.

Firestore fields now used for this:

- `status: 'completed'`
- `winnerId`
- `winnerPhaseIndex`
- `completedAt`

### 4. Bilingual UI (ES / EN)

Scoring now supports Spanish and English.

- The language is selected from the scoring entry flow and persisted in localStorage.
- New sessions store `language`.
- The board uses `session.language` when present, otherwise it falls back to the stored local scoring language.

### 5. Country names localized by selected language

The scoring module now loads countries from:

- `https://restcountries.com/v3.1/all?fields=name,translations,cca3,flag`

Behavior:

- English UI uses `name.common`
- Spanish UI uses `translations.spa.common` with fallback to `name.common`
- Country entries also keep `apiName` in English so the city API still works for national sessions

## Firestore Shape

Session documents now effectively expect:

```js
{
  id: "MU-XXXXX",
  name: "Miss Universe 2026",
  type: "Global" | "Nacional",
  language: "es" | "en",
  host: "Admin",
  judges: ["Admin", "Judge 2"],
  currentPhaseIndex: 0,
  phases: [
    {
      name: "Fase 1",
      cutoff: 10,
      status: "active" | "completed",
      participantIds: ["ARG", "COL", "MEX"]
    }
  ],
  participants: [
    { id: "ARG", name: "Argentina", flag: "🇦🇷", type: "country" }
  ],
  status: "completed",      // only when winner is revealed
  winnerId: "ARG",          // only when completed
  winnerPhaseIndex: 2,      // only when completed
  completedAt: 1234567890,  // only when completed
  createdAt: 1234567890
}
```

Scores document remains in the same collection using `${sessionId}_scores`:

```js
{
  phase_0: {
    ARG: { Admin: 8.5, Judge2: 7.1 }
  }
}
```

## Legacy Compatibility Already Added

`SessionBoard.jsx` now normalizes old `phases` structures in memory.

- Old sessions that stored `phases` as an object should no longer crash.
- Missing `participantIds` are derived on the fly from previous completed phase rankings.

## Known Risks / Caveats

These are real, not hypothetical:

- Judge identity is still keyed by `judgeName` inside the scores map.
  - If two judges join with the exact same name, they will overwrite each other.
  - A safer future refactor would introduce judge IDs separate from display names.

- Global results are not cumulative across all phases in a strict statistical sense.
  - The current `totalAvg` logic effectively reflects the most recent active/completed phase average encountered for that contestant, not a cross-phase weighted rollup.
  - If the user later asks for a real "overall" summary, revisit `globalResults` in `SessionBoard.jsx`.

- `ParticipantSetup.jsx` still exists and uses its own country-loading logic, but it is legacy and not part of the routed scoring flow.

- The scoring board text is bilingual now, but old sessions may still contain user-entered phase names in Spanish because phase names are stored data, not runtime-only labels.

## Verification Status

Last verified locally before this handover:

- `npm run build` passed
- changes were committed, pushed to `main`, and deployed to `gh-pages`

## Operational Notes For Future Sync/Deploy

In this environment, SSH push may fail with:

- `Permission to ealfaro29/Faces.git denied to deploy key`

If that happens again:

- temporarily switch `origin` to the HTTPS push flow already used in prior work
- push/deploy
- restore `origin` back to SSH afterwards

Do not leave the HTTPS remote configured persistently.

## Good Next Tasks

If the user wants more scoring work next, the most likely follow-ups are:

1. add a post-final summary/export screen
2. make the final celebration more theatrical (confetti/audio/animation)
3. fix judge identity collisions by introducing stable judge IDs
4. improve mobile layout for the scoring board
5. revisit global-results math if the user wants cumulative totals rather than current-phase ranking

