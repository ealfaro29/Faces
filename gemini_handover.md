# Gemini Handover — Faces Scoring Module

Updated: 2026-03-24
Repo path: `/Users/tbnalfaro/Desktop/Apps Gerald/Faces`
Live site: `https://ealfaro29.github.io/Faces/`
Primary area: scoring flow under `/session/*`

## Current Git State

- Local worktree was clean before this handover update.
- Latest deployed feature baseline on `main`: `355171e` — `Add scoring session settings`
- `gh-pages` currently points to: `a86eece5f0398bc917ee6f2955df0517bfed109a`
- Most recent scoring-related commits before this doc update:
  - `355171e` — `Add scoring session settings`
  - `b961bfd` — `Fix report image export sizing`
  - `16e5920` — `Add cumulative scoring results report`
  - `2827a42` — `Add scoring phase rollback`
  - `4e6eed1` — `Polish scoring i18n and theme consistency`

## User Working Agreement

The user explicitly wants this workflow on every substantial change:

1. edit code
2. verify with `npm run build`
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
  - Entry page for scoring.
  - Handles theme, accent and ES/EN selection.

- `src/pages/scoring/CreateSession.jsx`
  - Creates the Firestore session document.
  - Persists `language` into the session.

- `src/pages/scoring/JoinSession.jsx`
  - Judge join flow.
  - Reads session language before navigation.
  - Blocks re-entry for judges listed in `removedJudges`.

- `src/pages/scoring/SessionBoard.jsx`
  - Main scoring engine.
  - Handles scoring, progression, rollback, winner reveal, stable ordering, host settings and live results.

- `src/pages/scoring/SessionSettingsModal.jsx`
  - Host-only settings modal.
  - Supports renaming the contest and expelling judges.

- `src/pages/scoring/PhaseReportModal.jsx`
  - Export/report UI.
  - Has per-phase reports, cumulative totals and winner summary.
  - Export logic now expands scrollable content before generating images.

- `src/pages/scoring/scoringI18n.js`
  - Scoring-only translations.
  - Also contains language normalization helpers and country-name localization helpers.

- `src/pages/scoring/scoringTheme.js`
  - Shared scoring theme helpers for light/dark and accent persistence.

- `src/pages/scoring/ScoringLanguageToggle.jsx`
  - Reusable ES/EN toggle.

- `src/pages/scoring/ParticipantSetup.jsx`
  - Legacy. Still present, not used in the active routed scoring flow.

## Current Behavior

### 1. Stable phase ordering

The scoring table no longer re-sorts live while judges are voting.

- Phase 0 uses the original participant insertion order.
- Later phases use a frozen `participantIds` list saved into each phase when advancing.
- Global results still re-order live.

### 2. Slider-based scoring

Each contestant row uses a `0.0 -> 10.0` slider with `0.1` step.

- Save is near-live via debounce plus blur/release flush.
- Each judge writes only their own score.
- The clear button removes only that judge's score.

### 3. Final round / winner reveal

If the host sets the cutoff to `1`, that phase is treated as the final.

- The host CTA changes from advance to winner reveal.
- On reveal, the session is completed instead of creating a new phase.
- Winner info is stored in the session document.
- Connected users see a persistent winner celebration card.

Session fields used for that:

- `status: 'completed'`
- `winnerId`
- `winnerPhaseIndex`
- `completedAt`

### 4. Undo / rollback after advancing

The host can now go back after advancing.

- `Volver una fase` appears once the session is past phase 0.
- If the current phase already has saved scores, the rollback requires confirmation.
- Rolling back clears scores from discarded future phases to avoid stale data.
- If the final was already revealed, the host can use `Reabrir final`.

### 5. Cumulative reports

The reports modal now includes an accumulated-results tab.

- `Acumulado Total` / `Overall Totals` shows every participant.
- It includes one column per visible phase.
- It shows accumulated total and global average.
- It is sorted by accumulated total so the winner's full path is obvious.

### 6. Report image export

Report export was fixed so wide tables are fully included in the PNG.

- Before export, scrollable containers are temporarily expanded.
- Export uses the real `scrollWidth` / `scrollHeight`.
- This is especially relevant for cumulative reports and wide phase tables.

### 7. Host settings

The host now has an `Ajustes` / `Settings` button in the board header.

Current settings supported:

- rename the contest after the session has started
- expel judges from the session

Judge expulsion is enforced:

- expelled judge is removed from `judges`
- judge name is appended to `removedJudges`
- `JoinSession` blocks re-entry with the same name
- if that judge is currently connected, `SessionBoard` revokes access and sends them back to join

### 8. Bilingual UI and localized countries

Scoring supports Spanish and English.

- Language is selected from the scoring flow and persisted in localStorage.
- New sessions store `language`.
- The board prefers `session.language`, then falls back to local scoring language.

Countries are loaded from:

- `https://restcountries.com/v3.1/all?fields=name,translations,cca3,flag`

Behavior:

- English uses `name.common`
- Spanish uses `translations.spa.common` with fallback to `name.common`
- `apiName` is kept in English for the city API

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
  removedJudges: ["Judge 3"],
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

`SessionBoard.jsx` normalizes old `phases` structures in memory.

- Old sessions that stored `phases` as an object should no longer crash.
- Missing `participantIds` are derived on the fly from previous completed rankings.

## Known Risks / Caveats

These are real, not hypothetical:

- Judge identity is still keyed by plain `judgeName`.
  - If two judges join with the exact same name, they will overwrite each other in scores.
  - Expulsion also works by name, so identical names are still a weak point.
  - A safer future refactor would add stable judge IDs separate from display names.

- Expelled judges are blocked by exact normalized name match only.
  - They can still re-enter using a different display name.
  - If stronger moderation is needed, add judge tokens or auth.

- `globalResults` in `SessionBoard.jsx` is still not a strict cross-phase statistical rollup.
  - The new accumulated report in `PhaseReportModal.jsx` is the proper totalized view.
  - If the right-side live panel should also become cumulative, that logic still needs to be refactored.

- `ParticipantSetup.jsx` is still legacy and not part of the active scoring route flow.

- User-entered phase names are persisted data, so old sessions may contain phase labels in Spanish even if viewed later in English.

## Verification Status

Latest verified locally before this handover update:

- `npm run build` passed
- scoring changes were committed, pushed to `main`, and deployed to `gh-pages`

## Operational Notes For Future Sync/Deploy

In this environment, SSH push may fail with:

- `Permission to ealfaro29/Faces.git denied to deploy key`

If that happens again:

1. temporarily switch `origin` to the HTTPS remote
2. push `main`
3. run deploy
4. restore `origin` back to SSH

Do not leave the HTTPS remote configured persistently.

## Good Next Tasks

If the user wants more scoring work next, the most likely follow-ups are:

1. introduce stable judge IDs instead of using names as primary keys
2. let the host rename or edit judge display names without corrupting historical scores
3. add stronger expelled-judge enforcement beyond name matching
4. improve mobile density in `SessionBoard.jsx` for long judge lists and many phases
5. add a dedicated post-final summary screen separate from the live board
