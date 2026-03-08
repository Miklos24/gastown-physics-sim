# Powder Sim

A browser-based particle physics sandbox. Vanilla HTML5 Canvas + CSS + JavaScript. No framework, no build step.

## Gas Town Workspace

This is a Gas Town rig. Your identity and role are set by `gt prime`.

Run `gt prime` for full context after compaction, clear, or new session.

## Project Structure

```
index.html          — app shell
css/style.css       — dark theme, responsive layout
js/
  main.js           — entry point, game loop
  simulation.js     — grid, tick logic, element interactions
  elements.js       — element definitions and reaction matrix
  renderer.js       — canvas rendering
  input.js          — mouse/touch handling
  ui.js             — UI state, controls
tests/
  elements.test.js  — element definition tests
  grid.test.js      — grid tests
  simulation.test.js — simulation tests
  visual/           — Playwright visual tests
```

## Development

- **Run tests:** `node --test tests/`
- **Serve locally:** `npx serve .`
- **Run Playwright tests:** `npx playwright test`
- No build step. ES modules loaded directly in browser.

## Implementation Plan

The full implementation plan with exact code is in `docs/plans/2026-03-08-powder-sim-plan.md`. Follow it task by task.
