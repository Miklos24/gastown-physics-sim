# Powder Sim — Design Document

## Overview

A browser-based particle physics sandbox inspired by classic powder games (Powder Game, The Powder Toy). Players place elements into a 2D grid and watch them interact through simulated physics and chemical reactions. Minimalist dark UI, responsive design with platform-adaptive controls for desktop and mobile.

## Tech Stack

- Vanilla HTML5 Canvas + CSS + JavaScript
- No framework, no build step — static files served directly
- Single-page app, open `index.html` and go

## Architecture

Three layers:

1. **Simulation engine** — grid of cells, each holding an element type. Tick-based update loop. Double-buffered grid to avoid order-dependent artifacts.
2. **Renderer** — writes cell colors to an `ImageData` buffer, blits to canvas via `requestAnimationFrame`. One pixel per cell at native resolution, CSS-scaled.
3. **UI layer** — pure HTML/CSS overlay on top of the canvas. Platform-adaptive layout via CSS media queries.

## Simulation Grid

- **Cell size**: 4px per particle
- **Grid dimensions**: `Math.floor(availableWidth / 4)` x `Math.floor(availableHeight / 4)`, computed from viewport
- **Update order**: bottom-to-top, left-right randomized per row (prevents directional bias in fluid flow)
- **Tick rate**: decoupled from render — 60 ticks/sec default
- **Speed control**: 0.5x = 30 ticks/sec, 1x = 60, 2x = 120 (multiple ticks per frame)

## Elements (15)

### By behavior type

| Type | Elements | Behavior |
|------|----------|----------|
| Powder | Sand, Salt, Gunpowder | Falls, piles, slides off slopes |
| Liquid | Water, Oil, Acid, Lava | Flows sideways, settles to level, density layering (oil floats on water) |
| Gas | Steam, Smoke | Rises, disperses laterally, dissipates over time |
| Solid | Stone, Metal, Wood, Ice, Glass | Static unless acted on |
| Organic | Plant/Vine | Grows on contact with water, burns |

### Interaction matrix (key reactions)

| Interaction | Result |
|-------------|--------|
| Fire + Wood | Fire spreads + Ash |
| Fire + Oil | Bigger Fire + Smoke |
| Fire + Gunpowder | Explosion (destroys nearby cells) |
| Fire + Ice | Water + Steam |
| Fire + Plant | Fire + Smoke |
| Lava + Water | Stone + Steam |
| Lava + Ice | Water + Steam (then Stone) |
| Water + Salt | Saltwater (visual variant) |
| Water + Plant | Plant grows |
| Acid + Metal | Acid consumed, Metal dissolved |
| Acid + Stone | Acid consumed, Stone dissolved |
| Acid + Wood | Acid consumed, Wood dissolved |
| Ice + nearby Water | Water freezes to Ice (slow) |
| Steam rises to top | Cools to Water |

## Drawing Tools

- Brush with adjustable size (small / medium / large)
- Click/drag to place selected element
- Eraser = place Empty (same brush mechanics)

## Simulation Controls

- Play / Pause toggle
- Speed: 0.5x / 1x / 2x
- Clear all

## UI Layout

### Desktop (>768px viewport)

- Canvas fills viewport minus a **200px left sidebar**
- Sidebar (top to bottom): element palette (colored swatch grid with labels), brush size slider, speed control buttons, play/pause, clear
- Selected element highlighted with accent border

### Mobile (<=768px viewport)

- Canvas fills full viewport
- **Bottom bar** (~56px): current element swatch, brush size (S/M/L tap targets), play/pause, clear
- Tap element swatch → expandable panel slides up with full element grid

### Visual style

- UI chrome: `#1a1a1a`, canvas background: `#000`
- Element swatches: colored squares matching in-sim particle color
- Typography: system font stack, small labels
- Controls: minimal icon buttons, subtle `#333` borders, no shadows/gradients
- Selected state: element color as accent border/glow

## File Structure

```
index.html          — shell, canvas, UI markup
css/
  style.css         — all styles, media queries for responsive layout
js/
  main.js           — entry point, init, game loop
  simulation.js     — grid, tick logic, element interactions
  elements.js       — element definitions and reaction matrix
  renderer.js       — canvas rendering
  input.js          — mouse/touch handling, drawing
  ui.js             — UI state, panel toggles, controls
```

## Future additions (not in scope for v1)

- Save/load state
- Step-by-step mode
- Additional elements (Tier 3): Electricity, Gas, Dust, Clone, Void, Wax, Mud, Ash, Spark, TNT
- Line/rectangle/flood fill drawing tools
- Light/dark theme toggle
