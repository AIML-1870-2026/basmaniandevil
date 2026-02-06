# Snake Game: Neon Serpent - Project Specification

## Project Overview

**Project Name:** Neon Serpent  
**Version:** 1.0.0  
**Tech Stack:** HTML5 Canvas, CSS3, Vanilla TypeScript  
**Aesthetic Theme:** Cyberpunk/Neon  
**Target Platform:** Modern Web Browsers (Chrome, Firefox, Safari, Edge)

---

## 1. Core Mechanics

### 1.1 Movement System
- **Input Method:** Arrow keys (↑ ↓ ← →) or WASD
- **Movement Logic:**
  - Grid-based movement system (cell-by-cell)
  - Default grid size: 20×20 cells (configurable)
  - Movement updates at fixed intervals (frame rate tied to difficulty level)
  - Direction queue system to handle rapid input changes
  - Cannot reverse direction (e.g., cannot go left while moving right)

### 1.2 Boundary Behavior
- **Mode Toggle:** Players can select boundary behavior in settings
  - **Wrap-around Mode:** Snake teleports to opposite edge when crossing boundary
  - **Hard-wall Mode:** Collision with walls results in game over

### 1.3 Collision Detection
- **Self-collision:** Game over when snake head intersects with body
- **Food collision:** Snake grows by 1 segment, score increases
- **Obstacle collision:** Game over (in higher levels)
- **Power-up collision:** Activates special effect

### 1.4 Growth System
- Snake starts with 3 segments
- Each food consumed adds 1 segment to the tail
- Segment positions calculated using position history queue

---

## 2. Enhanced Features

### 2.1 Leveling System

#### Level Progression
- **Level 1-3:** Speed gradually increases (150ms → 100ms → 75ms per move)
- **Level 4-6:** Stationary obstacles appear (3, 5, 7 obstacles respectively)
- **Level 7-9:** Moving obstacles introduced (1-3 moving obstacles)
- **Level 10+:** Dynamic maze generation, ultra-high speed

#### Level-up Triggers
- Every 10 food items consumed
- Score thresholds: 100, 250, 500, 1000, 1500, etc.

#### Visual Indicators
- Level number displayed in top-left corner
- Progress bar showing advancement to next level
- Screen flash effect on level-up

### 2.2 Power-up System

#### Power-up Types

**1. Ghost Mode (Blue Aura)**
- Duration: 5 seconds
- Effect: Pass through walls and self without collision
- Visual: Snake becomes semi-transparent with blue glow
- Spawn rate: 8% chance

**2. Speed Slowdown (Green Aura)**
- Duration: 7 seconds
- Effect: Reduces movement speed by 50%
- Visual: Green trailing particles
- Spawn rate: 12% chance

**3. Double Points (Gold Aura)**
- Duration: 10 seconds
- Effect: All points earned are doubled
- Visual: Golden shimmer effect on snake
- Spawn rate: 10% chance

**4. Magnet (Purple Aura)**
- Duration: 6 seconds
- Effect: Food automatically attracted toward snake
- Visual: Purple electromagnetic field effect
- Spawn rate: 7% chance

**5. Shield (Cyan Aura)**
- Duration: One-time use
- Effect: Survive one collision without game over
- Visual: Cyan hexagonal barrier around head
- Spawn rate: 5% chance

#### Power-up Mechanics
- Only one power-up active at a time
- Power-ups spawn randomly every 15-20 seconds
- Timeout after 10 seconds if not collected
- Fade-out animation before disappearing

### 2.3 High Score System

#### Local Storage Implementation
- Store top 10 high scores with player initials
- Data structure:
  ```typescript
  interface HighScore {
    name: string;
    score: number;
    level: number;
    date: string;
    playTime: number; // in seconds
  }
  ```
- Persistent across browser sessions
- Export/import functionality for score backup

#### Score Display
- Real-time score counter in top-right corner
- High score leaderboard on start screen
- Personal best indicator during gameplay
- Score breakdown on game-over screen

---

## 3. Visual Identity: Cyberpunk/Neon Aesthetic

### 3.1 Color Palette

#### Primary Colors
- **Background:** Deep space black (#0a0a0f) with subtle grid lines (#1a1a2e)
- **Snake Head:** Electric cyan (#00ffff) → Neon magenta (#ff00ff) gradient
- **Snake Body:** Gradient from cyan (#00d4ff) to purple (#a000ff)
- **Food:** Pulsating neon pink (#ff0080)

#### Accent Colors
- **UI Elements:** Neon blue (#0080ff), neon green (#00ff80)
- **Text:** White (#ffffff) with cyan glow
- **Obstacles:** Red (#ff0040) with warning pulses

### 3.2 Snake Visual Effects

#### Glowing Gradient
- CSS filter: `drop-shadow(0 0 10px currentColor)`
- Canvas glow: Layered rendering with blur
- Head has 20% brighter glow than body
- Gradient interpolation across all segments

#### Animation Effects
- Smooth movement interpolation between cells
- Tail fade-out effect (last 3 segments)
- Head direction indicator (arrow particle)
- Segment connection glows

### 3.3 Food Visual Effects

#### Idle State
- Pulsating scale animation (0.9x to 1.1x)
- Rotating particle ring around food
- Inner glow with outer rim
- Ambient light emission

#### Consumption Animation
- Particle burst (15-20 particles)
- Particles spread radially with gravity
- Fade-out over 0.5 seconds
- Screen flash (subtle)
- Sound effect trigger point

### 3.4 Background & Grid

#### Grid System
- Subtle neon grid lines (opacity: 0.15)
- Grid cell size matches game grid
- Animated scanline effect moving vertically
- CRT screen curvature simulation (optional)

#### Dynamic Background
- Animated starfield with parallax (3 layers)
- Occasional lightning flashes
- Grid pulse on score milestones

### 3.5 UI Elements

#### Typography
- Font: 'Orbitron' or 'Rajdhani' (Google Fonts)
- Text-shadow: Multiple layers for neon effect
- Letter-spacing: 2px for futuristic look

#### Buttons
- Transparent background with neon borders
- Hover effect: Intensified glow + scale
- Click effect: Electric ripple animation

#### HUD Components
- Semi-transparent panels with glowing edges
- Real-time stat displays with animated numbers
- Mini-map (optional, shows level layout)

---

## 4. Technical Requirements

### 4.1 File Structure

```
neon-serpent/
│
├── index.html                 # Main HTML entry point
├── styles/
│   ├── main.css              # Global styles
│   ├── game.css              # Game canvas styles
│   └── ui.css                # UI overlays and menus
│
├── src/
│   ├── main.ts               # Application entry point
│   ├── config.ts             # Game configuration constants
│   │
│   ├── core/
│   │   ├── Game.ts           # Main game loop coordinator
│   │   ├── GameState.ts      # State management (playing, paused, etc.)
│   │   └── EventBus.ts       # Event system for module communication
│   │
│   ├── entities/
│   │   ├── Snake.ts          # Snake logic (movement, growth)
│   │   ├── Food.ts           # Food spawning and collection
│   │   ├── PowerUp.ts        # Power-up base class
│   │   ├── Obstacle.ts       # Static and moving obstacles
│   │   └── Particle.ts       # Particle effects system
│   │
│   ├── systems/
│   │   ├── InputHandler.ts  # Keyboard input management
│   │   ├── CollisionSystem.ts  # Collision detection
│   │   ├── ScoreSystem.ts   # Score calculation and tracking
│   │   └── LevelSystem.ts   # Level progression logic
│   │
│   ├── rendering/
│   │   ├── Renderer.ts      # Main canvas renderer
│   │   ├── EffectsRenderer.ts  # Visual effects (glow, particles)
│   │   ├── UIRenderer.ts    # HUD and overlay rendering
│   │   └── BackgroundRenderer.ts  # Grid and background effects
│   │
│   ├── storage/
│   │   └── HighScoreManager.ts  # Local storage operations
│   │
│   └── utils/
│       ├── Vector2D.ts      # 2D vector math utilities
│       ├── ColorUtils.ts    # Color gradient and interpolation
│       └── AnimationUtils.ts  # Easing and animation helpers
│
├── assets/
│   ├── sounds/              # Sound effects (optional)
│   └── fonts/               # Custom font files
│
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

### 4.2 Module Specifications

#### 4.2.1 Main Game Loop (`Game.ts`)

**Responsibilities:**
- Initialize all game systems
- Coordinate update cycle (60 FPS target)
- Manage game state transitions
- Handle pause/resume functionality

**Key Methods:**
```typescript
class Game {
  constructor(canvas: HTMLCanvasElement)
  init(): void
  start(): void
  pause(): void
  resume(): void
  reset(): void
  private update(deltaTime: number): void
  private render(): void
  private gameLoop(timestamp: number): void
}
```

**Update Order:**
1. Process input queue
2. Update snake position
3. Check collisions
4. Update power-ups and obstacles
5. Update particles and effects
6. Render all entities
7. Render UI

#### 4.2.2 Input Handler (`InputHandler.ts`)

**Responsibilities:**
- Capture keyboard events
- Maintain direction queue (max 2 inputs)
- Prevent invalid direction changes
- Handle pause/restart shortcuts

**Key Features:**
- Debounce rapid key presses
- Support for both arrow keys and WASD
- Space bar for pause toggle
- 'R' key for restart (on game over)

**Interface:**
```typescript
interface InputHandler {
  getNextDirection(): Direction | null
  clearQueue(): void
  on(event: string, callback: Function): void
}

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT
}
```

#### 4.2.3 Snake Logic (`Snake.ts`)

**Responsibilities:**
- Maintain segment positions
- Handle movement and direction changes
- Manage growth mechanics
- Apply power-up effects

**Data Structure:**
```typescript
class Snake {
  private segments: Vector2D[]
  private direction: Direction
  private nextDirection: Direction
  private growthPending: number
  private activePowerUp: PowerUp | null
  
  move(): void
  grow(amount: number): void
  checkSelfCollision(): boolean
  applyPowerUp(powerUp: PowerUp): void
  getHead(): Vector2D
  getBody(): Vector2D[]
}
```

**Movement Algorithm:**
1. Calculate new head position based on direction
2. Add new head to front of segments array
3. If growth pending, decrement and skip tail removal
4. Otherwise, remove last segment (tail)
5. Update previous positions for rendering interpolation

#### 4.2.4 Rendering System (`Renderer.ts`)

**Responsibilities:**
- Clear canvas each frame
- Render all game entities
- Apply visual effects
- Handle canvas scaling

**Rendering Pipeline:**
1. Clear canvas with background color
2. Render grid (BackgroundRenderer)
3. Render obstacles
4. Render food with particles
5. Render snake with gradient and glow
6. Render power-ups
7. Render particle effects
8. Render UI overlay (UIRenderer)

**Performance Optimizations:**
- Use requestAnimationFrame for smooth rendering
- Layer caching for static elements
- Particle pooling to reduce GC pressure
- Offscreen canvas for complex effects

**Gradient Implementation:**
```typescript
function renderSnakeSegment(ctx: CanvasRenderingContext2D, 
                           segment: Vector2D, 
                           index: number, 
                           totalSegments: number) {
  const gradient = ctx.createLinearGradient(/*...*/);
  const colorPosition = index / totalSegments;
  gradient.addColorStop(0, interpolateColor(CYAN, MAGENTA, colorPosition));
  // Apply glow effect using multiple shadows
  ctx.shadowBlur = 20;
  ctx.shadowColor = gradient;
  // Render segment
}
```

#### 4.2.5 Game State (`GameState.ts`)

**State Machine:**
```typescript
enum GameStatus {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  LEVEL_TRANSITION
}

class GameState {
  status: GameStatus
  score: number
  level: number
  comboMultiplier: number
  currentPowerUp: PowerUp | null
  elapsedTime: number
  
  transitionTo(newState: GameStatus): void
  updateScore(points: number): void
  incrementCombo(): void
  resetCombo(): void
}
```

**State Transitions:**
- MENU → PLAYING: On game start
- PLAYING → PAUSED: On pause key
- PLAYING → GAME_OVER: On collision
- PLAYING → LEVEL_TRANSITION: On level-up
- LEVEL_TRANSITION → PLAYING: After animation (2s)
- GAME_OVER → MENU: On restart

### 4.3 Responsive Design

#### Canvas Scaling Strategy
- Calculate optimal cell size based on window dimensions
- Maintain aspect ratio (16:9 preferred)
- Minimum canvas size: 600×400px
- Maximum canvas size: 1920×1080px
- Scale UI elements proportionally

**Implementation:**
```typescript
function resizeCanvas() {
  const container = document.getElementById('game-container');
  const maxWidth = container.clientWidth;
  const maxHeight = container.clientHeight;
  
  // Calculate cell size to fit grid
  const cellSize = Math.min(
    Math.floor(maxWidth / GRID_WIDTH),
    Math.floor(maxHeight / GRID_HEIGHT)
  );
  
  canvas.width = cellSize * GRID_WIDTH;
  canvas.height = cellSize * GRID_HEIGHT;
  
  // Update rendering scale
  RENDER_SCALE = cellSize;
}

window.addEventListener('resize', debounce(resizeCanvas, 250));
```

#### Responsive UI Elements
- Font sizes scale with canvas size
- Button hit areas scale proportionally
- Touch-friendly sizing for mobile (min 44×44px)
- HUD positioning using percentage-based coordinates

### 4.4 Code Quality Standards

#### TypeScript Configuration
- Strict mode enabled
- No implicit any
- ES2020 target
- Module resolution: node

#### Code Style
- ESLint with Airbnb style guide
- Prettier for formatting
- 2-space indentation
- Max line length: 100 characters

#### Documentation
- JSDoc comments for all public methods
- Interface documentation
- Complex algorithm explanations
- Performance notes for critical paths

---

## 5. Interactive Elements

### 5.1 Start Screen

#### Layout
- Game title with animated neon effect
- "Press SPACE to Start" (blinking text)
- High score leaderboard (top 5)
- Settings button (bottom right)
- Credits/instructions button (bottom left)

#### Settings Menu
- Boundary mode toggle (Wrap/Wall)
- Sound effects on/off
- Music on/off
- Difficulty preset (Easy/Normal/Hard)
- Grid size adjustment (15×15 to 30×30)

#### Animations
- Title text: Continuous glow pulse
- Background: Animated grid scan
- Leaderboard entries: Fade in sequentially
- Hover effects on buttons

### 5.2 Pause Overlay

#### Visual Design
- Semi-transparent dark overlay (opacity: 0.8)
- Centered "PAUSED" text with neon glow
- Game state frozen behind overlay
- Resume instruction: "Press SPACE"

#### Features
- Blur effect on background game state
- Continue button
- Restart button
- Main menu button
- Current statistics display (score, level, time)

### 5.3 Game Over Screen

#### Layout
- Large "GAME OVER" text with glitch effect
- Final score with animation (count-up effect)
- Performance breakdown:
  - Food consumed
  - Max combo reached
  - Time survived
  - Final level
- High score achievement indicator (if applicable)
- Name input field (if high score achieved)
- Retry button
- Main menu button

#### Animations
- Screen shake on game over
- Score numbers count up with sound
- Particle effects around score
- Fade-in transition for UI elements

### 5.4 Combo Multiplier Display

#### Positioning
- Bottom center of screen
- Above any mobile controls
- Slides up on activation

#### Visual Design
```
┌─────────────────────┐
│   COMBO x4!         │
│   ████████░░ (80%)  │  ← Decay timer
└─────────────────────┘
```

#### Mechanics
- Combo increases with consecutive food collection
- 3-second window between collections to maintain combo
- Multiplier caps at 5x
- Visual intensity increases with multiplier
- Progress bar shows decay timer
- Screen border glow matches combo level

#### Animation States
- **Activation:** Scale up from 0 with elastic easing
- **Increase:** Pulse effect + particle burst
- **Active:** Gentle floating animation
- **Decay Warning:** Red pulsing when <1s remaining
- **Break:** Shatter effect + fade out

### 5.5 Level Transition

#### Animation Sequence (2 seconds total)
1. Screen flash (white, 0.1s)
2. "LEVEL X" text zooms in (0.5s)
3. New obstacles fade in (0.5s)
4. Speed adjustment indicator (0.4s)
5. Resume countdown: 3...2...1...GO! (0.5s)

#### Visual Effects
- Grid intensifies brightness
- Snake pulses with energy
- New obstacles spawn with electric effect
- Background color shifts slightly

---

## 6. Configuration Constants (`config.ts`)

```typescript
export const CONFIG = {
  // Grid settings
  GRID_WIDTH: 20,
  GRID_HEIGHT: 20,
  
  // Timing (milliseconds)
  BASE_MOVE_SPEED: 150,
  MIN_MOVE_SPEED: 50,
  POWER_UP_DURATION: {
    GHOST: 5000,
    SLOW: 7000,
    DOUBLE_POINTS: 10000,
    MAGNET: 6000,
  },
  
  // Scoring
  FOOD_BASE_POINTS: 10,
  LEVEL_UP_THRESHOLD: 10, // food items per level
  COMBO_DECAY_TIME: 3000, // ms between food to maintain combo
  
  // Visual effects
  PARTICLE_COUNT: 20,
  GLOW_INTENSITY: 0.8,
  ANIMATION_DURATION: 500,
  
  // Colors (hex)
  COLORS: {
    SNAKE_HEAD_START: '#00ffff',
    SNAKE_HEAD_END: '#ff00ff',
    SNAKE_BODY_START: '#00d4ff',
    SNAKE_BODY_END: '#a000ff',
    FOOD: '#ff0080',
    BACKGROUND: '#0a0a0f',
    GRID: '#1a1a2e',
    OBSTACLE: '#ff0040',
  },
  
  // Power-up spawn rates (percentage)
  POWER_UP_RATES: {
    GHOST: 0.08,
    SLOW: 0.12,
    DOUBLE_POINTS: 0.10,
    MAGNET: 0.07,
    SHIELD: 0.05,
  },
};
```

---

## 7. Implementation Phases

### Phase 1: Core Functionality (Week 1)
- [ ] Project setup and build configuration
- [ ] Basic game loop implementation
- [ ] Snake movement and controls
- [ ] Food spawning and collision
- [ ] Basic rendering (no effects)
- [ ] Self-collision detection

### Phase 2: Enhanced Features (Week 2)
- [ ] Level system implementation
- [ ] Obstacle spawning and collision
- [ ] Power-up system (all 5 types)
- [ ] Score tracking and calculation
- [ ] High score local storage

### Phase 3: Visual Polish (Week 3)
- [ ] Neon gradient effects on snake
- [ ] Particle system for food consumption
- [ ] Background grid and animations
- [ ] UI styling and neon aesthetic
- [ ] Smooth movement interpolation

### Phase 4: Interactive Elements (Week 4)
- [ ] Start screen with leaderboard
- [ ] Pause overlay
- [ ] Game over screen with stats
- [ ] Combo multiplier display
- [ ] Level transition animations

### Phase 5: Testing & Optimization (Week 5)
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Bug fixes and polish
- [ ] Documentation completion

---

## 8. Testing Requirements

### Functional Testing
- [ ] Snake moves correctly in all directions
- [ ] Food spawns in valid positions (not on snake/obstacles)
- [ ] Collisions detected accurately
- [ ] Power-ups activate and expire correctly
- [ ] Level progression triggers appropriately
- [ ] High scores save and load correctly

### Performance Testing
- [ ] Maintains 60 FPS with max snake length
- [ ] Particle effects don't cause lag
- [ ] Memory usage remains stable over time
- [ ] Canvas rendering optimized

### User Experience Testing
- [ ] Controls feel responsive
- [ ] Visual feedback is clear
- [ ] Text is readable at all sizes
- [ ] Game difficulty curve feels balanced

---

## 9. Future Enhancements (Post-MVP)

- Multiplayer mode (local or online)
- Additional themes (Matrix, Retro, Space)
- Mobile touch controls
- Sound effects and background music
- Achievement system
- Daily challenges
- Custom level editor
- Speed run mode with timer
- AI opponent mode

---

## 10. Accessibility Considerations

- Color-blind friendly mode (alternative color schemes)
- Screen reader support for menus
- Keyboard-only navigation
- Adjustable game speed
- High contrast mode
- Pause on window blur
- Clear visual indicators for all game states

---

## 11. Browser Compatibility

**Minimum Requirements:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs:**
- Canvas 2D Context
- Local Storage
- RequestAnimationFrame
- ES2020 JavaScript features

---

## 12. Performance Targets

- **Frame Rate:** Consistent 60 FPS
- **Load Time:** < 2 seconds on broadband
- **Memory Usage:** < 100 MB
- **Bundle Size:** < 500 KB (minified)
- **Time to Interactive:** < 1 second

---

## 13. Success Metrics

- Smooth gameplay with no visual stuttering
- Intuitive controls requiring no tutorial
- Engaging progression system
- Visually striking neon aesthetic
- High score system encourages replayability
- Responsive design works on various screen sizes

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | 2026-01-29 | Initial specification document |

---

**End of Specification Document**

This specification should be sufficient to begin implementation with Claude Code. All module interfaces, visual requirements, and technical constraints are clearly defined for consistent development.
