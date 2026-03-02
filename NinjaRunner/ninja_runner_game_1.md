# 🥷 Rooftop Ninja — Endless Runner Game Spec

## Overview

Build a **single-file HTML5 Canvas endless runner game** called **Rooftop Ninja**. A stickman ninja sprints across procedurally generated city rooftops, slashing enemies with his sword and dodging obstacles. The game is fast, fluid, and visually sharp with a dark cyberpunk-inspired night-city aesthetic.

---

## Tech Stack

- **Single HTML file** — all JS, CSS, and canvas rendering inline
- **HTML5 Canvas API** — all game graphics drawn programmatically (no image assets)
- **Vanilla JavaScript** — no frameworks or libraries
- **Google Fonts** — use `Orbitron` for UI text (imported via `@import`)

---

## Visual Style

- **Background**: Deep navy/black night sky with a distant glowing city skyline silhouette (layered parallax: far buildings, mid buildings, near buildings)
- **Rooftops**: Dark gray/charcoal flat-topped buildings with subtle edge lighting
- **Ninja**: White stickman figure with a dark headband and visible katana
- **Enemies**: Red stickman figures
- **Obstacles**: Yellow/orange hazards (e.g., AC units, water towers, vents)
- **Color palette**: `#0a0a1a` (bg), `#1a1a3e` (buildings), `#e0e0ff` (ninja), `#ff3355` (enemies), `#ffcc00` (obstacles), `#00ffcc` (score/UI accent)
- **Particle effects**: Small spark/blood particles when enemy is slain; dust particles on landing

---

## Game Layout

```
┌──────────────────────────────────────────────────┐
│  SCORE: 0         ROOFTOP NINJA        ❤️❤️❤️    │  ← HUD
├──────────────────────────────────────────────────┤
│                                                  │
│   [parallax city skyline layers]                 │
│                                                  │
│       🥷──►                                      │
│  ════════════     ═══════════    ════════════    │  ← Rooftops
└──────────────────────────────────────────────────┘
```

---

## Player (Ninja)

### Stickman Design (drawn with Canvas lines/arcs)
- Circle head (~10px radius) with a small headband line
- Torso line, two arm lines, two leg lines
- Katana: a diagonal line extending from the arm, slightly longer than the arm

### Running Animation
- Smooth **leg cycling**: alternate legs swing forward/backward using sine-wave offsets
- Arms swing in opposition to legs
- The **sword arm** bobs slightly while running
- Use a `runCycle` variable incremented each frame; drive limb angles with `Math.sin(runCycle)`
- Full animation cycle should feel fast and energetic (~8–10 frames per full stride)

### Jump Animation — Front Flip
- When the player jumps, the **entire stickman body rotates 360°** around its center
- Rotation completes over the arc of the jump (map jump progress `0→1` to rotation `0→2π`)
- Use `ctx.translate` + `ctx.rotate` to spin the whole figure
- Legs tuck slightly during the flip (shorten leg lines by ~30% mid-flip)
- **Double-jump**: a second press mid-air triggers a second flip — reset `jumpProgress` to 0 and apply `jumpVelocity` again. Emit a small cyan burst of 4–6 particles around the ninja's feet to signal the second jump.

### Sword Swing Animation (on enemy hit)
- Triggered when colliding with an enemy
- The sword arm sweeps in a **wide arc (~180°)** over ~15 frames
- Sword line rotates from behind the ninja to in front, with a motion-blur trail (draw 3 fading ghost lines of the sword at previous angles)
- Flash a brief white circle at the point of contact
- Enemy is destroyed after the swing completes (not instantly)

### Controls
| Input | Action |
|---|---|
| `Space` / `ArrowUp` / `W` | Jump (double-jump allowed: press again mid-air for a second jump) |
| `ArrowDown` / `S` | Slide/duck (hitbox shrinks, ninja crouches) |
| Click / Tap | Jump |

---

## World Generation

### Rooftops
- Rooftops are **rectangular platforms** that scroll left at increasing speed
- Generated off-screen to the right, queued into an array
- Each rooftop has:
  - Random width: `150–350px`
  - Random gap between rooftops: `80–200px`
  - Random height variation: keep within a jumpable range (`±80px` from current)
  - Height range: `60%–80%` of canvas height
- When a rooftop scrolls off the left edge, remove it and generate a new one
- **First rooftop** is wide and starts at the left edge so the player begins safely

### Scroll Speed
- Starts at `3px/frame`, increases by `0.0005` per frame (gradual ramp-up)
- Cap at `12px/frame`

### Parallax Background Layers
- Layer 1 (far): Very small building silhouettes, scroll at `0.2x` game speed
- Layer 2 (mid): Medium buildings, scroll at `0.5x` game speed
- Layer 3 (near): Large dark building outlines, scroll at `0.8x` game speed
- All buildings are simple rectangles with occasional lit window dots

---

## Enemies

- **Appearance**: Red stickman identical in structure to ninja but red-colored, with a small weapon (a short stick/club)
- **Behavior**: Stand still on rooftops, facing left toward the player
- **Spawn**: 1–2 enemies per rooftop (random chance ~60% of rooftops have enemies)
- **Collision**:
  - If player runs into enemy → **trigger sword swing animation** → enemy dies → +1 score
  - Enemy death: red particle burst (8–12 particles flying outward), enemy fades out
- **Enemy does NOT end the game** — the ninja defeats them automatically when contact is made

---

## Obstacles

- **Appearance**: Yellow/orange geometric shapes — draw as chunky rectangles representing AC units, vents, or pipes. Add simple detail lines to make them look mechanical.
- **Behavior**: Static on rooftops, do not move
- **Types**:
  - **AC Unit**: Wide short box (`40x30px`)
  - **Vent Pipe**: Narrow tall box (`15x45px`)
  - **Water Tank**: Tall wide box (`35x50px`)
- **Collision**: Running into an obstacle → **Game Over**
- Player can **jump over** or **duck under** (vent pipes can be ducked)
- Spawn ~1 obstacle per rooftop (40% chance), never overlap with enemies

---

## Physics

```
gravity = 0.5 px/frame²
jumpVelocity = -13 px/frame
maxFallSpeed = 15 px/frame
maxJumps = 2
```

- Player has a `velocityY`; gravity is added each frame
- Track `jumpsUsed` (0, 1, or 2). Increment on each jump; reset to 0 on landing.
- Jump input is accepted when `jumpsUsed < maxJumps`
- On landing on a rooftop, `velocityY = 0`, `isGrounded = true`, and `jumpsUsed = 0`
- If player falls below the canvas bottom → **Game Over**
- If the rooftop under the player scrolls away and they're not jumping → they fall

---

## Scoring & HUD

- **+10 points** per enemy defeated
- Score displayed top-left in `Orbitron` font, cyan color
- **High score** persisted in `localStorage`, shown top-right
- Multiplier system: defeating 3 enemies in a row without touching the ground → `2x` multiplier (display combo streak)

---

## Game States

### 1. Start Screen
- Animated ninja running in place on a rooftop
- Title: **"ROOFTOP NINJA"** in large Orbitron font with a glow effect
- Subtitle: `"PRESS SPACE TO START"`
- Slowly scrolling city background

### 2. Playing
- Full game loop active
- HUD visible (score, high score, speed indicator)

### 3. Game Over Screen
- Canvas dims with a dark overlay
- **"GAME OVER"** in red Orbitron with a flicker animation
- Final score + high score displayed
- `"PRESS SPACE TO RESTART"`
- Show cause of death: `"YOU FELL"` or `"YOU HIT AN OBSTACLE"`

---

## Audio (Optional / Stretch)
- Use `AudioContext` Web API to generate simple synthesized sounds:
  - Jump: short sine wave blip
  - Sword swing: quick noise burst
  - Enemy defeat: satisfying descending tone
  - Game over: low descending tone
- All sounds procedurally generated, no external files

---

## Code Architecture

Structure the JS into clean sections:

```
// --- CONSTANTS & CONFIG ---
// --- STATE ---
// --- CANVAS SETUP ---
// --- INPUT HANDLING ---
// --- PLAYER CLASS ---
// --- ENEMY CLASS ---
// --- OBSTACLE CLASS ---
// --- ROOFTOP CLASS ---
// --- PARTICLE SYSTEM ---
// --- WORLD GENERATION ---
// --- COLLISION DETECTION ---
// --- RENDERING ---
//   renderBackground()
//   renderRooftops()
//   renderPlayer()
//   renderEnemies()
//   renderObstacles()
//   renderParticles()
//   renderHUD()
// --- GAME LOOP ---
//   update()
//   draw()
//   requestAnimationFrame loop
// --- GAME STATE MANAGEMENT ---
//   startGame(), gameOver(), restartGame()
```

---

## Animation Detail Reference

### Ninja Running Limb Angles
```javascript
// runCycle increments by 0.18 each frame while grounded
legAngle = Math.sin(runCycle) * 0.6          // radians
armAngle = Math.sin(runCycle + Math.PI) * 0.4 // opposite phase
swordAngle = Math.sin(runCycle * 0.5) * 0.15  // subtle sword bob
```

### Front Flip Rotation
```javascript
// jumpProgress goes 0 → 1 over the jump arc
flipRotation = jumpProgress * Math.PI * 2    // 0 → 360 degrees
// Apply during render:
ctx.translate(ninja.x, ninja.y)
ctx.rotate(flipRotation)
// draw ninja centered at (0,0)
ctx.restore()
```

### Sword Swing Frames
```javascript
// swingFrame goes 0 → 15
swingAngle = (swingFrame / 15) * Math.PI     // 0 → 180 degrees
// Draw 3 ghost trails at swingAngle - 0.1, swingAngle - 0.2, swingAngle - 0.3
// each with decreasing opacity (0.3, 0.2, 0.1)
```

---

## Responsive Canvas
- Canvas should be `800x400px` on desktop
- Scale the canvas using CSS `max-width: 100%` so it fits on mobile
- Listen for `touchstart` events for mobile jump support

---

## Deliverable

A **single `index.html` file** that runs the complete game in any modern browser with no dependencies except the Google Fonts import. The game should be immediately playable on open.
