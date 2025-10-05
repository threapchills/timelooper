# Timelooper Prototype

A browser-based prototype for the Timelooper project. This build focuses on the Phase 1 milestone – getting a controllable character moving around a procedurally generated arena while demonstrating the fixed timestep loop, deterministic physics scaffolding, and rendering stack.

## Getting Started

1. Serve the repository root with any static file server (required because of module imports). For example:
   ```bash
   npx http-server .
   ```
   or
   ```bash
   python -m http.server 4173
   ```
2. Visit the reported localhost URL in a modern browser (Chrome, Firefox, Edge).
3. Use **WASD** to move/jetpack and **left click** to fire a placeholder projectile.

## Current Features

- Three.js orthographic scene with a 1600×900 play area rendered inside a responsive wrapper.
- Procedural level generator that lays out a ground plane, layered platforms, and vertical cover obstacles.
- Deterministic fixed-timestep physics system handling horizontal thrust, gravity, jetpack fuel management, and AABB collisions against level geometry.
- Basic ranger-class placeholder with cooldown-limited projectile firing that follows mouse aiming in world space.
- Heads-up display showing health, jetpack fuel, and attack cooldown values updated each frame.

## Roadmap

This prototype intentionally limits scope to keep the foundations testable. Next steps include:

- Implementing the input recording and playback pipeline for ghost replays.
- Adding the warrior and wizard combat kits plus their associated projectile behaviours.
- Enforcing hot-seat round flow and character selection rules.
- Authoring deterministic projectile physics with validation checkpoints.
- Building scoring, elimination tracking, and round transition UI.

## Repository Structure

```
assets/              # Character and environment textures
src/
  core/             # Game loop orchestration, managers
  entities/         # Player and projectile models
  rendering/        # Scene graph helpers and HUD rendering
  systems/          # Physics and procedural level generation
index.html          # Entry point wiring the Three.js runtime
```

## Browser Support

Tested in Chromium-based browsers with ES modules enabled. Safari support will require additional polyfill testing.

## License

MIT (see repository for full text once added).
