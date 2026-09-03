# Elevator Saga — Fork, Modernize, Mobilize

Working plan for the `richdr` fork of [magwo/elevatorsaga](https://github.com/magwo/elevatorsaga)
(MIT, © 2015 Magnus Wolffelt and contributors — attribution stays).

**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[-]` dropped

---

## Baseline (as cloned, upstream `master` @ `e0c55bf`, v1.6.5)

| Aspect          | Current state                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Build           | None. `index.html` loads 12 `<script>` tags in dependency order; globals everywhere.                                |
| Deps (vendored) | jQuery 2.1.1, lodash (old), riot.js (only for `riot.observable`), CodeMirror 5, Font Awesome 4.1, `unobservable.js` |
| Language        | ES5 (`var`, `function`), no modules, no types                                                                       |
| Rendering       | DOM elements positioned with `transform: translate(...)`, fixed pixel geometry                                      |
| Tests           | Jasmine 2.x in a browser page (`test/index.html`)                                                                   |
| Deploy          | `autopublish.sh` — merges `master` into a `gh-pages` branch by hand                                                 |
| Mobile          | **No `<meta viewport>` at all.** No media queries. Fixed-px world, hover-dependent affordances.                     |
| Other           | Dead Google Analytics UA property (`UA-56810935-1`)                                                                 |

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

## Phase 1 — Modernize the frontend stack — ✅ COMPLETE

Goal: a real build, real modules, types on the simulation, and an editor that works
on a touchscreen. Do this _before_ the UI work so the mobile work is done once, in
the final architecture, rather than twice.

### Recommended target stack

| Concern              | Choice                                                                                  | Why                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundler / dev server | **Vite**                                                                                | Zero-config for this shape of app, instant HMR, correct `base` handling for GH Pages subpaths                                                   |
| Language             | **TypeScript** (strict), ESM                                                            | The simulation has real domain types (`Elevator`, `Floor`, `User`, `World`) and the _player-facing API_ becoming typed is a genuine feature     |
| UI layer             | **No framework** — plain TS modules + the existing DOM/`transform` renderer             | The whole UI is three panels and a stats strip. React/etc. would be more ceremony than the app has. Reassess only if the UI grows.              |
| Events               | Small typed `EventEmitter` (~30 lines)                                                  | Drops `riot.js`, gives autocomplete on `elevator.on("idle", …)`                                                                                 |
| lodash               | **Remove** — native `map`/`filter`/`reduce`, keep a tiny local `debounce`/`limitNumber` | Only ~10 lodash functions are used. But: the _player's_ code samples use `_.max`, `_.each` — see risk below.                                    |
| jQuery               | **Remove** — `querySelector`, `classList`, `addEventListener`                           | Used only for DOM plumbing in `presenters.js` / `app.js`                                                                                        |
| Code editor          | **CodeMirror 6** (`@codemirror/{state,view,lang-javascript}`)                           | CM5 is unmaintained and its mobile input handling is poor; CM6 is built for touch + IME. Not Monaco — Monaco is effectively unusable on phones. |
| Icons                | Inline SVG sprite (subset of the ~8 icons used)                                         | Kills the 400KB Font Awesome 4 directory                                                                                                        |
| Fonts                | Self-host Oswald via `@fontsource/oswald`                                               | Removes the `fonts.googleapis.com` request                                                                                                      |
| Styling              | Plain CSS with custom properties + `@layer`                                             | No preprocessor needed; enables a light/dark theme and consistent spacing tokens                                                                |
| Tests                | **Vitest** (node env)                                                                   | Same assertions, no browser page; the engine tests are pure logic. Keeps `test/tests.js` largely intact.                                        |
| Lint/format          | ESLint (flat config) + Prettier                                                         |                                                                                                                                                 |
| CI                   | GitHub Actions: typecheck + test on PR                                                  |                                                                                                                                                 |

### Steps

- [x] Scaffold `package.json`, `vite.config.ts`, `tsconfig.json`; move source to `src/`
- [x] Convert engine files to ESM one at a time, `.js` → `.ts`, in dependency order:
      `base` → `movable` → `floor` → `user` → `elevator` → `interfaces` → `world` → `challenges` → `fitness`
- [x] Replace `riot.observable` with the typed emitter; delete `libs/riot.js`, `libs/unobservable.js`
- [x] Port `test/tests.js` to Vitest; **green tests are the gate for every conversion step**
- [x] Convert `presenters.ts` / `app.ts`, dropping jQuery
- [x] Swap CodeMirror 5 → CodeMirror 6 (editor, autosave to `localStorage`, error markers)
- [x] Extract the HTML `<script type="text/template">` blocks into typed render functions
- [-] Move `documentation.html` content into the app — **deferred to phase 3**, where it becomes a
  sheet rather than a page. For now it is a second Vite entry point and builds correctly.
- [x] Delete `libs/`, `font-awesome-4.1-1.0/`

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

**Outcome:** met. 63 tests green (48 ported from the Jasmine suite, 15 new, covering the
emitter and the lodash shim), lint and typecheck clean, and CI runs all five gates on PRs.

Verified in a real browser against both the dev server and the built `dist/`:

| Check                                                      | Result                                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Challenge 1 renders and runs                               | 3 floors, 1 elevator, users spawn, transported counter advances                   |
| Icons                                                      | 10 inline SVGs extracted from the FA4 webfont, no icon font                       |
| Editor                                                     | CodeMirror 6, solarized light, loads saved code from `elevatorCrushCode_v5`       |
| Controls                                                   | start/pause, time scale, floor buttons, elevator buttons all wired                |
| `#devtest` solution (uses `_.max(list, fn)`, `_.contains`) | ran challenge 5 to 98 transported, no errors — the lodash 3 shim works end to end |
| Console errors                                             | none, on either page                                                              |

Bundle: 528 KB raw / 181 KB gzipped, almost all of it CodeMirror 6 plus the full lodash kept
for player compatibility. That replaces jQuery, lodash 3, riot, CodeMirror 5 and a 400 KB
icon font.

---

## Phase 2 — Publish to GitHub Pages — ✅ COMPLETE

Deliberately before the mobile work: a public URL is how the responsive work actually gets
tested — on a real phone, not a devtools emulator.

- [x] Enable Pages with **GitHub Actions** as the source (no `gh-pages` branch, no `autopublish.sh`)
- [x] `.github/workflows/deploy.yml` — build on push to `main`, `actions/upload-pages-artifact` + `deploy-pages`
- [x] Set Vite `base: '/elevatorsaga/'` for the project-pages subpath (env-switched so `dev` stays at `/`)
- [x] Verify no absolute `/`-rooted asset paths survive the port
- [x] Add PR preview builds (build-only check; optional: artifact upload)
- [x] Add the live URL to the README and the repo's About field

**Exit criteria:** pushing to `main` publishes to `https://richdr.github.io/elevatorsaga/` within a couple of minutes.

**Outcome:** met. The site is live at
**[richdr.github.io/elevatorsaga](https://richdr.github.io/elevatorsaga/)**, deployed by
`.github/workflows/deploy.yml` on every push to `main`. Both pages return 200 and the game was
verified running on the live URL — challenge 1 renders, users spawn, the counter advances, no
console errors.

Two notes:

- `base` had to key off `isPreview` as well as `command`. `vite preview` serves the built
  output, so it needs the same base the build baked into the asset URLs; only the dev server
  runs at the root. Without this, local previews of a production build 404 on every asset.
- The inherited `gh-pages` branch is now deleted — Pages builds from the workflow, not a
  branch. Upstream's three abandoned experiment branches (`angularized`, `floorpassing`,
  `gotoforce`) are still there; they are recoverable from `upstream` whenever you want them
  gone.

---

## Phase 3 — Mobile-friendly UI — ✅ COMPLETE (bar real-device checking)

The headline feature: **a view toggle between the code editor and the elevator shaft**,
because both cannot usefully share a phone screen.

### Layout model

- Breakpoint at ~900px. Wide = today's stacked layout (world above, code below), improved.
  Narrow = single-pane with a toggle.
- Narrow layout, top to bottom:
  1. Compact sticky header: challenge number + condition, start/stop, time-scale
  2. **Segmented control: `Elevators | Code`** (the toggle)
  3. The active pane, filling remaining viewport height
  4. Stats in a two-column grid under the world (three columns in landscape)

  The stats ended up as a plain grid rather than the planned collapsing sheet with a peek row:
  all six fit in 80px, so hiding four of them behind a tap bought nothing and cost the player
  information they want while watching a run.

### Steps

- [x] **Add `<meta name="viewport" content="width=device-width, initial-scale=1">`** — it's genuinely absent today, which is why the site is unusable on a phone
- [x] `100dvh` + `env(safe-area-inset-*)` so iOS Safari's toolbars don't clip controls
- [x] Build the segmented toggle; persist the choice; keyboard + `aria-selected` accessible
- [x] **Auto-switch to Elevators on Apply/Start**, and to Code on a code error — the toggle should mostly manage itself
- [x] Make the world responsive — **done differently to the plan.** Rather than driving floor
      height and elevator width from CSS custom properties, the world keeps the engine's fixed
      pixel geometry and is scaled with a CSS transform to fit the space available. Same result
      on screen, and not one line of gameplay maths moves. A 21-floor, 8-elevator challenge now
      fits a 390px phone whole.
- [~] Horizontal scroll for challenges with many elevators — the viewport scrolls in whichever
  axis overflows once the scale floor is hit. **Snap-to-column is not done:** the elevators
  are absolutely positioned inside a transformed container, where CSS scroll snapping does
  not behave. Turned out to be unnecessary anyway — every challenge fits whole at the
  widths tested.
- [x] Touch targets ≥44×44px for start/stop, time-scale, Apply/Save/Reset
- [x] Replace hover-only affordances (e.g. the "Moves" `title` tooltip) with tap-to-reveal
- [x] Editor on mobile: CM6 with `EditorView.lineWrapping`, no line numbers below 600px, an
      insert-symbol toolbar row, and keyboard-avoidance driven by `visualViewport` so the
      layout shrinks to the space the on-screen keyboard leaves
- [-] Floating action button for Apply — **dropped deliberately.** Built it, then removed it:
  the code pane's action row is pinned to the bottom of the viewport and always visible, so
  the FAB was a floating button overlapping an identical button 20px away. Apply is instead
  the primary button in that row.
- [x] Feedback/challenge-complete overlay sized for narrow screens
- [x] In-app help/docs as a sheet rather than a separate page (touch: no new tab)
- [x] Dark mode via `prefers-color-scheme` (phones, evenings)
- [x] `prefers-reduced-motion` for the user/elevator animations
- [ ] **Verify on real hardware: iOS Safari + Android Chrome, portrait and landscape.** Not
      something I can do — everything below is device emulation. The live URL is the point of
      phase 2; this is the one item left for you.
- [x] Lighthouse mobile pass (perf + a11y)

**Exit criteria:** a challenge can be read, coded, run, and watched to completion on a phone,
one-handed, without pinch-zooming.

**Outcome:** met under emulation. Checked with Playwright across iPhone 13 portrait and
landscape, Pixel 7, and a 1400px desktop, on both the dev server and the built output:

| Check                                                  | Result                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| Page-level horizontal overflow                         | none at any size tested                                         |
| Tap targets below 44px                                 | none                                                            |
| Toggle, symbol bar, gutter hiding, pane switching      | correct on each side of the 900px breakpoint                    |
| Apply from the code view                               | switches to Elevators and runs the challenge                    |
| Challenge 19 (21 floors, 8 elevators) on a 390px phone | fits whole, scale 0.36, no scrolling                            |
| Help sheet                                             | opens, renders the shared docs content, highlights code, closes |
| Dark mode                                              | page and editor both switch                                     |
| Console errors                                         | none, on either page                                            |

Lighthouse, mobile emulation, against the production build:

|                         | Before this phase | After     |
| ----------------------- | ----------------- | --------- |
| Performance             | 94                | **96**    |
| Accessibility           | 94                | **100**   |
| Best practices          | 96                | **100**   |
| Cumulative layout shift | 0.083             | **0.004** |

The accessibility and best-practices gaps were real bugs, not scoring trivia:

- **Contrast.** Upstream's `#555` body text on the khaki background is 3.9:1, its `#333`-on-`#777`
  buttons are 2.82:1, and the pale `--emphasis` colour — designed for the dark world panel — was
  being used for the challenge description on the light page at **1.67:1**. Fixed with a darker
  text colour, a light-on-grey button, and a separate emphasis colour for light surfaces.
- **Heading order** jumped h1 → h3 → h5.
- **A missing favicon** was logging a 404 to the console on every load.
- **The layout shift** was the script-rendered challenge bar appearing and shoving the panes
  down 76px. Reserving its height took CLS from 0.083 to 0.004.

LCP is 2.3s on emulated slow 4G, dominated by the 181 KB gzipped bundle — CodeMirror plus the
lodash kept for player compatibility. Worth revisiting in phase 4 if it matters.

---

## Phase 3b — ES6 player code and a fresher look — ✅ COMPLETE

Two follow-ups requested after phase 3 shipped.

### ES6-ify the code the player writes

The samples were ES5 with lodash, which is a decade out of date as a thing to teach.

- [x] `DEFAULT_CODE` and `DEVTEST_CODE` rewritten with `const`, arrow functions, method
      shorthand and native array methods — no lodash
- [x] Every code sample in the documentation moved to arrow functions and method shorthand
- [x] Docs now state that any JavaScript the browser understands works, and that `_` remains
      available for solutions written against the original
- [x] Tests: modern syntax (method shorthand, arrows, destructuring, spread, classes, template
      literals) parses; the original ES5-with-lodash style still parses; and **both shipped
      samples are executed against the real simulation**, so a typo in a sample string cannot
      ship silently again

`_` is still installed for player code and still shimmed to lodash 3 semantics. Nothing that
worked before stops working; we just no longer teach it.

### Fresher visual look — "engineering console"

- [x] Dark by default, light as the alternate scheme. The lift shaft is dark in both, so only
      the chrome changes
- [x] New palette: `#16181d` chrome, `#0f1115` shaft, teal `#2dd4bf` car and accents, lime
      `#a3e635` for activated indicators
- [x] Type roles separated: Oswald for the title and headings only, the system UI stack for
      prose and controls, monospace for data and code. Oswald is a condensed display face and
      was being used for paragraphs
- [x] Challenge bar restructured: `CHALLENGE 01` as a tracked-out mono label above the
      objective, rather than one run-on heading
- [x] Play/pause/restart icons on the start button, hand-drawn since the webfont subset we
      extracted has no transport controls
- [x] A Console Dark editor theme built from the same tokens as the app, replacing Solarized
      Dark — its cyan-tinted background clashed with the cooler slate
- [x] Panels, buttons and the timescale stepper reworked as bordered surfaces with a
      consistent radius scale

**Accessibility, found by adding axe-core across both colour schemes and all three views** —
Lighthouse had only ever audited the initial view, and missed all of this:

| Finding                                                                                                                             | Fix                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `.cm-content` is a `role="textbox"` with no accessible name                                                                         | `aria-label` via `contentAttributes`                                                                      |
| Solarized Light fails AA on its own background — comments at 2.3:1, most accents near 3:1, and even its default foreground at 3.9:1 | same hues, darkened to clear 4.5:1                                                                        |
| Console Dark's muted grey at 3.9:1                                                                                                  | lifted to 4.8:1                                                                                           |
| Scrollable code samples and API tables unreachable by keyboard                                                                      | `tabindex="0"`                                                                                            |
| `Tab` indents in the editor rather than moving focus — a keyboard trap unless the escape is discoverable                            | verified `Escape` then `Tab` escapes both ways, and named it in the editor's `aria-label` and in the docs |

One axe finding is left and is a false positive: `scrollable-region-focusable` on `.cm-scroller`.
Verified by keyboard that the editor is reachable by `Tab` and scrolls with the arrow keys;
adding `tabindex` to the scroller would only add a useless extra tab stop.

Lighthouse, mobile, production build: **performance 97, accessibility 100, best practices 100,
SEO 100, CLS 0**.

### Follow-up: the building takes the editor's palette

Asked for after the refresh: make the animation match the editor's colour scheme.

They were two unrelated hex tables — the editor's in `theme.ts`, the world's in `style.css`.
Now there is one source of truth, `src/ui/palette.ts`, with semantic tokens (`keyword`,
`string`, `number`, `muted`, …) per scheme. Both CodeMirror themes are generated from it by a
single factory, and the world's CSS derives from the same tokens:

| Building element            | Syntax token                   |
| --------------------------- | ------------------------------ |
| Shaft background            | editor background              |
| Floor numbers               | `number`                       |
| Elevator car and its border | `string`                       |
| Lit indicators and buttons  | `keyword`                      |
| People                      | `fg`                           |
| Waiting too long            | `number`, then `invalid`       |
| Floor separators, bands     | `selection`, `fg` at low alpha |
| Stats                       | `muted` and `fg`               |

- [x] `palette.ts` as the single source; `theme.ts` reduced to one theme factory, halving it
- [x] The world now **follows the colour scheme** — the previous build deliberately kept the
      shaft dark in both, which is what made the two palettes independent. In the light scheme
      the shaft is Solarized cream with a magenta floor number and an olive lit indicator
- [x] Tints and damped colours use `color-mix` against `--syn-fg`, so one expression works in
      both directions: light-on-dark and dark-on-light
- [x] The documentation's code-sample colours now derive from the palette too, deleting the
      third copy
- [x] The feedback overlay and the stats panel follow the scheme, having been hardcoded for a
      dark shaft

**CSS cannot import the palette, so the mirror in `style.css` is the one duplication left.**
`test/palette.test.ts` closes that: it parses the stylesheet, asserts every `--syn-*` token
matches `palette.ts` in both schemes, rejects tokens the palette does not define, and asserts
that all 19 world colours are `var(--syn-*)`-derived rather than hardcoded. Verified to fail on
both a changed hex and a hardcoded derivation before being relied on.

**Contrast was measured, not eyeballed.** A canvas-based probe resolves each token as painted
and computes its ratio against the surface it actually sits on. First pass found four elements
below 3:1, and the mix percentages were then solved by sweeping rather than guessed:

|                   | before      | after (dark / light) |
| ----------------- | ----------- | -------------------- |
| Floor number      | 2.54 / 1.89 | **5.01 / 3.18**      |
| Unlit call button | 2.11 / 1.98 | **3.32 / 3.05**      |
| Car floor readout | 3.11 / 2.34 | **4.36 / 3.18**      |
| Car floor buttons | 1.79 / 1.96 | **6.02 / 3.04**      |

Everything in the building now clears 3:1 in both schemes. Two notes:

- The unlit call buttons are _buttons_, so WCAG 1.4.11 applies to them and upstream's ~1.9:1
  was a real failure, not merely a faint style. Lit-versus-unlit stays obvious because it is a
  hue change as well as a brightness one.
- A heavier teal car fill was tried to give its digits more room; it makes the border, the
  digits and the lit buttons all worse simultaneously, so the fill stays at 30%.

Lighthouse unchanged at 97 / 100 / 100 / 100, CLS 0, and axe clean across both schemes and all
three views.

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
   or issue templates. Until decided, default to _keeping the engine's behaviour identical to
   upstream_ so the option stays open.
