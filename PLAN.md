# Elevator Saga — Fork, Modernize, Mobilize

Working plan for the `richdr` fork of [magwo/elevatorsaga](https://github.com/magwo/elevatorsaga)
(MIT, © 2015 Magnus Wolffelt and contributors — attribution stays).

**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` dropped

---

## Baseline (as cloned, upstream `master` @ `e0c55bf`, v1.6.5)

| Aspect | Current state |
| --- | --- |
| Build | None. `index.html` loads 12 `<script>` tags in dependency order; globals everywhere. |
| Deps (vendored) | jQuery 2.1.1, lodash (old), riot.js (only for `riot.observable`), CodeMirror 5, Font Awesome 4.1, `unobservable.js` |
| Language | ES5 (`var`, `function`), no modules, no types |
| Rendering | DOM elements positioned with `transform: translate(...)`, fixed pixel geometry |
| Tests | Jasmine 2.x in a browser page (`test/index.html`) |
| Deploy | `autopublish.sh` — merges `master` into a `gh-pages` branch by hand |
| Mobile | **No `<meta viewport>` at all.** No media queries. Fixed-px world, hover-dependent affordances. |
| Other | Dead Google Analytics UA property (`UA-56810935-1`) |

Engine (`movable.js`, `elevator.js`, `floor.js`, `user.js`, `world.js`, `challenges.js`, `fitness.js`)
is genuinely framework-agnostic — the only couplings are `riot.observable` for events and lodash.
The jQuery/DOM coupling is confined to `presenters.js` + `app.js`. That's what makes this
modernization cheap: **the simulation can move over almost untouched.**

---

## Phase 0 — Fork & housekeeping (prerequisite, ~15 min) — ✅ COMPLETE

Has to come first — everything else needs somewhere to push. `richdr` is a personal
account, not an org, so the fork lands at `richdr/elevatorsaga`.

- [x] `gh repo fork magwo/elevatorsaga --remote --remote-name origin` (lands at `richdr/elevatorsaga`)
- [x] Keep `upstream` remote pointing at `magwo/elevatorsaga` so upstream fixes can still be pulled
- [x] Branch protection off / not needed; work on short-lived branches, merge to `main`
- [x] Rename default branch `master` → `main`
- [x] Add `.nvmrc`, `.editorconfig`, `.gitignore` for `node_modules`/`dist`
- [x] Update README: what this fork is, what changed, link back to upstream + original author
- [x] Delete `testcommitfile.txt`, `autopublish.sh` (replaced by Actions)
- [x] Strip the dead Google Analytics snippet

**Exit criteria:** `git push` works, README states the fork's purpose and attribution.

**Outcome:** fork at [richdr/elevatorsaga](https://github.com/richdr/elevatorsaga), default branch
`main`, `origin` → fork and `upstream` → `magwo/elevatorsaga`. Node pinned to 24 (LTS) in `.nvmrc`.
GA removed from `index.html`, `documentation.html` and `test/index.html`.

Left alone for now: upstream's stale branches came across with the fork
(`angularized`, `floorpassing`, `gotoforce`, `gh-pages`). `gh-pages` becomes obsolete in phase 2;
the other three are abandoned upstream experiments. Deleting them is a one-liner whenever you want.

---

## Phase 1 — Modernize the frontend stack

Goal: a real build, real modules, types on the simulation, and an editor that works
on a touchscreen. Do this *before* the UI work so the mobile work is done once, in
the final architecture, rather than twice.

### Recommended target stack

| Concern | Choice | Why |
| --- | --- | --- |
| Bundler / dev server | **Vite** | Zero-config for this shape of app, instant HMR, correct `base` handling for GH Pages subpaths |
| Language | **TypeScript** (strict), ESM | The simulation has real domain types (`Elevator`, `Floor`, `User`, `World`) and the *player-facing API* becoming typed is a genuine feature |
| UI layer | **No framework** — plain TS modules + the existing DOM/`transform` renderer | The whole UI is three panels and a stats strip. React/etc. would be more ceremony than the app has. Reassess only if the UI grows. |
| Events | Small typed `EventEmitter` (~30 lines) | Drops `riot.js`, gives autocomplete on `elevator.on("idle", …)` |
| lodash | **Remove** — native `map`/`filter`/`reduce`, keep a tiny local `debounce`/`limitNumber` | Only ~10 lodash functions are used. But: the *player's* code samples use `_.max`, `_.each` — see risk below. |
| jQuery | **Remove** — `querySelector`, `classList`, `addEventListener` | Used only for DOM plumbing in `presenters.js` / `app.js` |
| Code editor | **CodeMirror 6** (`@codemirror/{state,view,lang-javascript}`) | CM5 is unmaintained and its mobile input handling is poor; CM6 is built for touch + IME. Not Monaco — Monaco is effectively unusable on phones. |
| Icons | Inline SVG sprite (subset of the ~8 icons used) | Kills the 400KB Font Awesome 4 directory |
| Fonts | Self-host Oswald via `@fontsource/oswald` | Removes the `fonts.googleapis.com` request |
| Styling | Plain CSS with custom properties + `@layer` | No preprocessor needed; enables a light/dark theme and consistent spacing tokens |
| Tests | **Vitest** (node env) | Same assertions, no browser page; the engine tests are pure logic. Keeps `test/tests.js` largely intact. |
| Lint/format | ESLint (flat config) + Prettier | |
| CI | GitHub Actions: typecheck + test on PR | |

### Steps

- [ ] Scaffold `package.json`, `vite.config.ts`, `tsconfig.json`; move source to `src/`
- [ ] Convert engine files to ESM one at a time, `.js` → `.ts`, in dependency order:
      `base` → `movable` → `floor` → `user` → `elevator` → `interfaces` → `world` → `challenges` → `fitness`
- [ ] Replace `riot.observable` with the typed emitter; delete `libs/riot.js`, `libs/unobservable.js`
- [ ] Port `test/tests.js` to Vitest; **green tests are the gate for every conversion step**
- [ ] Convert `presenters.ts` / `app.ts`, dropping jQuery
- [ ] Swap CodeMirror 5 → CodeMirror 6 (editor, autosave to `localStorage`, error markers)
- [ ] Extract the HTML `<script type="text/template">` blocks into typed render functions
- [ ] Move `documentation.html` content into the app (needed anyway for Phase 3's in-app help)
- [ ] Delete `libs/`, `font-awesome-4.1-1.0/`

### Risks / decisions to make

- **Player code compatibility.** Saved solutions live in `localStorage` and in the upstream
  wiki, and many use `_.each` / `_.max`. Removing lodash breaks them.
  → **Decided:** keep a `_` shim in the player sandbox scope — cheap, and it preserves every
  existing solution. The app's own code still drops lodash.
- **`localStorage` key.** Upstream uses `elevatorCrushCode_v5`. Keep it, so anyone with an
  in-progress solution on the original site keeps it. Don't bump the key.
- **Player sandbox.** Code is currently eval'd as an object literal. Keep that contract
  identical; TS must not change what the player writes.
- **Fitness worker.** `fitnessworker.js` uses `importScripts` — needs converting to a
  Vite `?worker` module import.
- Upstream is effectively dormant, so divergence cost is low, but keep engine changes
  behavioural-no-ops where possible in case anything is worth upstreaming.

**Exit criteria:** `npm run dev` serves the game, `npm run test` green, `npm run build`
produces a working static `dist/`, gameplay identical to upstream (all 19 challenges beatable
with the wiki solutions).

---

## Phase 2 — Publish to GitHub Pages

Deliberately before the mobile work: a public URL is how the responsive work actually gets
tested — on a real phone, not a devtools emulator.

- [ ] Enable Pages with **GitHub Actions** as the source (no `gh-pages` branch, no `autopublish.sh`)
- [ ] `.github/workflows/deploy.yml` — build on push to `main`, `actions/upload-pages-artifact` + `deploy-pages`
- [ ] Set Vite `base: '/elevatorsaga/'` for the project-pages subpath (env-switched so `dev` stays at `/`)
- [ ] Verify no absolute `/`-rooted asset paths survive the port
- [ ] Add PR preview builds (build-only check; optional: artifact upload)
- [ ] Add the live URL to the README and the repo's About field

**Exit criteria:** pushing to `main` publishes to `https://richdr.github.io/elevatorsaga/` within a couple of minutes.

---

## Phase 3 — Mobile-friendly UI

The headline feature: **a view toggle between the code editor and the elevator shaft**,
because both cannot usefully share a phone screen.

### Layout model

- Breakpoint at ~900px. Wide = today's stacked layout (world above, code below), improved.
  Narrow = single-pane with a toggle.
- Narrow layout, top to bottom:
  1. Compact sticky header: challenge number + condition, start/stop, time-scale
  2. **Segmented control: `Elevators | Code`** (the toggle)
  3. The active pane, filling remaining viewport height
  4. Stats as a collapsible bottom sheet (peek showing transported + elapsed)

### Steps

- [ ] **Add `<meta name="viewport" content="width=device-width, initial-scale=1">`** — it's genuinely absent today, which is why the site is unusable on a phone
- [ ] `100dvh` + `env(safe-area-inset-*)` so iOS Safari's toolbars don't clip controls
- [ ] Build the segmented toggle; persist the choice; keyboard + `aria-selected` accessible
- [ ] **Auto-switch to Elevators on Apply/Start**, and to Code on a code error — the toggle should mostly manage itself
- [ ] Make the world responsive: floor height and elevator width from CSS custom properties, computed to fit the viewport instead of hardcoded px in `world.ts`/`presenters.ts`
- [ ] Horizontal scroll/pinch for challenges with many elevators; snap to elevator columns
- [ ] Touch targets ≥44×44px for start/stop, time-scale, Apply/Save/Reset
- [ ] Replace hover-only affordances (e.g. the "Moves" `title` tooltip) with tap-to-reveal
- [ ] Editor on mobile: CM6 with `EditorView.lineWrapping`, no line numbers on narrow, an
      insert-symbol toolbar row (`{ } ( ) . ; =>`), and keyboard-avoidance so the caret
      isn't hidden behind the on-screen keyboard
- [ ] Floating action button for Apply while in Code view
- [ ] Feedback/challenge-complete overlay sized for narrow screens
- [ ] In-app help/docs as a sheet rather than a separate page (touch: no new tab)
- [ ] Dark mode via `prefers-color-scheme` (phones, evenings)
- [ ] `prefers-reduced-motion` for the user/elevator animations
- [ ] Verify on real hardware: iOS Safari + Android Chrome, portrait and landscape
- [ ] Lighthouse mobile pass (perf + a11y)

**Exit criteria:** a challenge can be read, coded, run, and watched to completion on a phone,
one-handed, without pinch-zooming.

---

## Phase 4 — Nice-to-haves (only after 0–3 ship)

- [ ] Challenge progress persisted + a challenge picker (currently URL-hash driven)
- [ ] Share-a-solution via URL (compressed code in the fragment)
- [ ] Replay / step-through debugging of a run
- [ ] Add `elevator.js`-side typed API docs generated from the TS types
- [ ] PWA manifest + offline (it's a fully static, self-contained game — this is nearly free)
- [ ] Consider upstreaming the engine's TS types or bug fixes to `magwo/elevatorsaga`

---

## Sequencing summary

```
Phase 0  Fork              ──►  Phase 1  Modernize stack  ──►  Phase 2  GH Pages  ──►  Phase 3  Mobile UI
(plumbing, must be first)       (Vite + TS + CM6)               (deploy target)         (the actual goal)
```

Phase 1 before Phase 3 so the responsive work is written once against the final architecture.
Phase 2 between them so Phase 3 can be validated on real devices.

## Decisions

1. **lodash `_` in player code** — ✅ **keep the shim.** The app drops its own lodash dependency,
   but `_` stays in the player sandbox scope so every published wiki solution keeps working.
   Same reasoning applies to the `elevatorCrushCode_v5` `localStorage` key: unchanged.
2. **Repo name** — ✅ **keep `elevatorsaga`.** Lineage stays obvious; the README differentiates.
3. **Scope of the fork** — ⏳ **TBD.** Personal playground vs. maintained community successor.
   Not blocking phases 1–3; revisit before investing in upstream-syncability, contribution docs
   or issue templates. Until decided, default to *keeping the engine's behaviour identical to
   upstream* so the option stays open.
