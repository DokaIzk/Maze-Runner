CORE FUNCTIONS & GAME FLOW — Maze Runner

Overview

This document describes the core game functions, scene responsibilities, UI overlays, and developer-facing debug hooks based on the current repository state. Placeholders and TODOs that need follow-up are listed at the end.

File locations (key files)

- Main entry and config
  - `src/index.js`
  - `src/main.js` — Phaser game configuration, scene registration, global game instance exposure (debug helpers)
  - `manifest.json`, `index.html` — web app shell and script ordering (verify `manifest.json` link)

- Scenes (primary game flow)
  - `src/scenes/BootScene.js` — preload assets and transition to `TitleScene`
  - `src/scenes/TitleScene.js` — title screen UI, first-run buttons (Connect Wallet and Continue as Guest), creates the main DOM overlay using `createTextOverlay()` and navigates to Instructions or MazeCreation
  - `src/scenes/InstructionsScene.js` — multi-step instructions modal (steps array, progress dots, Next/Start flow, Skip button). Tinted background image and responsive layout.
  - `src/scenes/MazeCreationScene.js` — maze/menu screen with maze image and 3 buttons: New Game, Game Instructions, Exit (back to Title). Starts `GameScene` with a simple config when New Game is clicked.
  - `src/scenes/GameScene.js` — core gameplay, header with title and timer, pause button, pause overlay, victory and game-over overlays, restart behavior, reward claim hook, and debug helpers.
  - `src/scenes/UIScene.js` — shared UI utilities and DOM overlay helpers (if present).

- Utilities
  - `src/utils/mazeGenerator.js` — maze generation algorithms, maze data structures used by `GameScene` and maze preview screens
  - `src/utils/collisions.js` — collision helpers used by `GameScene`

Core functions and responsibilities

1) Game initialization and scene registration

- `src/main.js`
  - Creates the Phaser.Game instance and registers scenes in order (BootScene -> TitleScene -> InstructionsScene -> MazeCreationScene -> GameScene, etc.).
  - Exposes a global variable (e.g. `window.mazeRunner` or similar) to allow invoking debug helpers from the console.

2) BootScene

- Preloads shared assets and any generated textures.
- On complete, transitions to `TitleScene`.

3) TitleScene

- createTextOverlay(): builds and appends a DOM overlay into `#game-container` that contains:
  - logo image (from `assets/images/m.png` or `maze-logo.png`), title and tagline
  - two stacked buttons: `Connect Wallet` and `Continue as Guest` (Continue navigates to `InstructionsScene`)
  - Accessibility/hover styling and responsive layout
- setupInput(): keyboard handlers and focused input wiring for quick navigation
- Ensures overlays are hidden/removed when switching scenes

4) InstructionsScene

- Implements a dynamic multi-step instructions UI:
  - `steps` array contains each instruction page (title, body, optional image)
  - Progress dots indicate current step
  - `Next` button advances the step; final step shows `Start` which begins the game (or goes to MazeCreation/GameScene based on flow)
  - `Skip` bypasses instructions and goes to MazeCreation or GameScene
  - Background image is tinted and scaled responsively; overlay is appended to `#game-container`

5) MazeCreationScene

- Presents a centered menu showing a static maze image preview and buttons:
  - `New Game` — starts `GameScene` passing a small config object
  - `Game Instructions` — navigates to `InstructionsScene`
  - `Exit` — returns to `TitleScene`
- Replaced prior CSS 3D container with an actual DOM `img` element for the maze preview

6) GameScene (core)

- Header UI
  - Title centered with stacked timer, pause button on the right (circular white background)
  - Timer logic increments game time and displays `Time Used`

- Pause behavior
  - Pause toggled by pause button; overlay shows Time Used and buttons:
    - Resume — unpauses
    - Restart — calls `this.scene.restart(...)` to restart `GameScene` and resets player/opponent counters
    - Home — goes to `TitleScene`
  - Pause/play icon toggles and state is reset correctly on restart

- Victory & Game Over overlays
  - Redesigned responsive containers show:
    - Player vs Opponent tokens/counters
    - Final score/time
    - Buttons for `Play Again` / `Try Again` / `Home`
  - `Play Again`/`Try Again` restart the `GameScene` with proper state reset
  - `Claim reward` button present on game-over screen and wired to `claimReward()` which integrates with the wallet/contract layer (if present). This function should be implemented in the wallet integration layer or `src/index.js` and called from the scene when available.

- Restart and counter handling
  - Opponent and player counters are initialized in `create()` and explicitly reset on `scene.restart()` to prevent accumulation across restarts

- Debug helpers
  - Global debug functions exposed for quick testing (e.g. `debugVictory()`, `debugGameOver()`) which set internal state values and show overlays. These rely on the global game instance to find the active `GameScene`.

7) Utility modules

- `src/utils/mazeGenerator.js` exports maze generation functions (e.g. `generateMaze(width, height, options)`) — used by the MazeCreation preview and by `GameScene` to produce the playable maze layout.
- `src/utils/collisions.js` contains collision detection and overlap handling used by `GameScene` physics.

DOM overlay patterns and IDs

- Overlays are appended to the DOM element `#game-container` (ensure this element exists in `public/index.html`).
- Overlays are created in `create()` lifecycle methods (not in `preload()`) to avoid ReferenceError and to ensure the DOM is ready.
- All overlays should be removed/hidden on scene shutdown or when navigating to another scene to avoid multiple overlays stacking.

Important functions to look for in the codebase

- `createTextOverlay()` — TitleScene DOM overlay builder
- `goToInstructions()` — navigation helper to open `InstructionsScene`
- `claimReward()` — invoked when the Claim Reward button is clicked on Game Over; connect to wallet layer
- `this.scene.restart(...)` — used by Restart/Play Again buttons in `GameScene`
- Debug helpers exposed in `main.js`/global object (names may vary): `debugVictory()`, `debugGameOver()`
- Maze generator API: `generateMaze(...)` in `src/utils/mazeGenerator.js`

Known issues & TODOs (follow-ups before shipping docs)

- Run the app end-to-end in a browser and sanity-check all overlays and scene transitions. Specifically verify:
  - No leftover DOM elements remain across scene transitions
  - Global debug helpers reference the correct global game instance (confirm `window.mazeRunner` vs `window.phaserGame`)
  - Pause/resume and restart fully reset state (opponent/player counters)

- `manifest.json` currently returns 404 in the console. Either add a valid `manifest.json` or remove the link from `index.html`.

- Remove any commented-out or duplicate code (e.g., leftover Phaser logo code) and tidy exports/imports if migrating to ES modules.

- Final polish for this document: add a table of contents, code snippets for key functions, and file-cross links if desired.

Where to place this file

- This file has been created at the repository root as `CORE_FUNCTIONS.md`. If you prefer `docs/FUNCTIONS.md` or `README_GAME_FUNCTIONS.md`, request a rename and I will move it.

If you want next steps I can:
- Run the app in a browser terminal and report runtime console errors (you must allow me to run commands).
- Rename or move this file.
- Expand this doc with code snippets and a table of contents.

