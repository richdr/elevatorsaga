Elevator Saga (richdr fork)
===========================
The elevator programming game — a mobile-friendly, modernized fork.

This is a fork of [magwo/elevatorsaga](https://github.com/magwo/elevatorsaga) by
**Magnus Wolffelt and contributors**, whose original is no longer actively maintained.
The upstream README invites forks, and the original keeps the `elevatorsaga.com`
domain — this fork is published on GitHub Pages instead.

**Play the original:** [play.elevatorsaga.com](http://play.elevatorsaga.com/)
**Play this fork:** _coming soon — GitHub Pages, see [PLAN.md](PLAN.md) phase 2_

![Image of Elevator Saga in browser](images/screenshot.png)

## What this fork is for

Three things, in order:

1. **A modern frontend stack** — Vite, TypeScript and ES modules in place of a dozen
   `<script>` tags, jQuery, lodash and an unmaintained CodeMirror 5.
2. **A mobile-friendly UI** — the original has no viewport meta tag and no media queries,
   so it is effectively unusable on a phone. The centrepiece is a toggle between the
   **code editor** and the **elevator shaft** view, since the two cannot usefully share
   a phone screen.
3. **Continuous deployment** to GitHub Pages via GitHub Actions.

The simulation itself — the elevator, floor, user and world model, the 19 challenges and
their fitness conditions — is upstream's design and stays behaviourally identical.

See **[PLAN.md](PLAN.md)** for the phased plan and current progress.

## Compatibility with existing solutions

Deliberate design constraints, so that solutions written for the original still work here:

- The player-facing API (`elevator.goToFloor`, the `"idle"` / `"floor_button_pressed"`
  events, `floor.level`, and so on) is unchanged.
- **lodash `_` stays available inside player code**, even though the app itself no longer
  depends on it — many published solutions use `_.each` and `_.max`.
- The `localStorage` key (`elevatorCrushCode_v5`) is unchanged, so an in-progress solution
  from the original site is picked up as-is.

## Development

Currently a static site with no build step — open `index.html` in a browser, and
`test/index.html` to run the Jasmine tests. This changes in phase 1 of the plan.

## Licence

MIT, as upstream. Copyright (c) 2015 Magnus Wolffelt and contributors.
See [LICENSE.txt](LICENSE.txt).
