// =============================================================================
// SECTION 1: CONSTANTS & CONFIG
// =============================================================================

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.5;
const JUMP_VELOCITY = -13;
const MAX_FALL_SPEED = 15;
const INITIAL_SCROLL_SPEED = 3;
const MAX_SCROLL_SPEED = 12;
const SCROLL_ACCELERATION = 0.0005;
const GROUND_Y_MIN = CANVAS_HEIGHT * 0.6;
const GROUND_Y_MAX = CANVAS_HEIGHT * 0.8;

// =============================================================================
// SECTION 2: STATE
// =============================================================================

let gameState: 'start' | 'playing' | 'gameover' = 'start';
let score: number = 0;
let highScore: number = parseInt(localStorage.getItem('rooftopNinjaHighScore') || '0', 10);
let scrollSpeed: number = INITIAL_SCROLL_SPEED;
let frameCount: number = 0;
let deathCause: string = '';
let consecutiveEnemyKills: number = 0;
let multiplier: number = 1;

// =============================================================================
// SECTION 3: CANVAS SETUP
// =============================================================================

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// Canvas stays at 800x400, CSS handles scaling
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// =============================================================================
// SECTION 4: INPUT HANDLING
// =============================================================================

const keys: { [key: string]: boolean } = {};

document.addEventListener('keydown', (e: KeyboardEvent) => {
  keys[e.code] = true;

  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    if (gameState === 'start') {
      startGame();
      return;
    }
    if (gameState === 'gameover') {
      restartGame();
      return;
    }
    if (gameState === 'playing' && player) {
      player.jump();
    }
  }

  if ((e.code === 'ArrowDown' || e.code === 'KeyS') && gameState === 'playing' && player) {
    player.slide();
  }
});

document.addEventListener('keyup', (e: KeyboardEvent) => {
  keys[e.code] = false;

  if ((e.code === 'ArrowDown' || e.code === 'KeyS') && player) {
    player.stopSlide();
  }
});

canvas.addEventListener('click', () => {
  if (gameState === 'start') {
    startGame();
    return;
  }
  if (gameState === 'gameover') {
    restartGame();
    return;
  }
  if (gameState === 'playing' && player) {
    player.jump();
  }
});

canvas.addEventListener('touchstart', (e: TouchEvent) => {
  e.preventDefault();
  if (gameState === 'start') {
    startGame();
    return;
  }
  if (gameState === 'gameover') {
    restartGame();
    return;
  }
  if (gameState === 'playing' && player) {
    player.jump();
  }
});

// =============================================================================
// SECTION 5: PARTICLE CLASS
// =============================================================================

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(x: number, y: number, color: string, count?: number) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6 - 2;
    this.maxLife = count !== undefined ? count : 30 + Math.floor(Math.random() * 20);
    this.life = this.maxLife;
    this.size = 2 + Math.random() * 4;
  }

  update(): boolean {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += GRAVITY * 0.3;
    this.vx *= 0.95;
    this.life--;
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// =============================================================================
// SECTION 6: ROOFTOP CLASS
// =============================================================================

class Rooftop {
  x: number;
  y: number;
  width: number;
  height: number;

  private windowSlots: { wx: number; wy: number; visible: boolean }[] = [];

  constructor(x: number, y: number, width: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = CANVAS_HEIGHT - y;

    // Pre-generate window slots
    const cols = Math.floor(width / 20);
    const rows = Math.floor(this.height / 20);
    for (let c = 0; c < cols; c++) {
      for (let r = 1; r < rows; r++) {
        if (Math.random() < 0.3) {
          this.windowSlots.push({
            wx: x + c * 20 + 8,
            wy: y + r * 20,
            visible: true,
          });
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Main body
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Top edge highlight
    ctx.strokeStyle = '#3a3a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.stroke();

    // Windows
    ctx.fillStyle = '#ffff99';
    for (const slot of this.windowSlots) {
      if (slot.wx >= this.x && slot.wx <= this.x + this.width) {
        ctx.fillRect(slot.wx, slot.wy, 4, 4);
      }
    }
  }

  update(speed: number): void {
    const dx = speed;
    this.x -= dx;
    for (const slot of this.windowSlots) {
      slot.wx -= dx;
    }
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get isOffScreen(): boolean {
    return this.right < -10;
  }
}

// =============================================================================
// SECTION 7: ENEMY CLASS
// =============================================================================

class Enemy {
  x: number;
  y: number;
  dead: boolean = false;
  swingFrame: number = 0;
  fadeOut: number = 1.0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.fadeOut;

    const cx = this.x;
    const feet = this.y;

    ctx.strokeStyle = '#ff4444';
    ctx.fillStyle = '#ff4444';
    ctx.lineWidth = 2;

    // Head
    ctx.beginPath();
    ctx.arc(cx, feet - 40, 9, 0, Math.PI * 2);
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(cx, feet - 31);
    ctx.lineTo(cx, feet - 14);
    ctx.stroke();

    // Arms - animate slightly
    const armSwing = Math.sin(Date.now() * 0.005) * 0.3;

    // Left arm with club
    ctx.save();
    ctx.translate(cx, feet - 28);
    ctx.rotate(-0.5 + armSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-14, 8);
    ctx.stroke();
    // Club
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cc2222';
    ctx.beginPath();
    ctx.moveTo(-14, 8);
    ctx.lineTo(-20, 13);
    ctx.stroke();
    ctx.restore();

    // Right arm
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(cx, feet - 28);
    ctx.rotate(0.4 - armSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, 8);
    ctx.stroke();
    ctx.restore();

    // Legs
    const legSwing = Math.sin(Date.now() * 0.005) * 0.4;

    ctx.save();
    ctx.translate(cx, feet - 14);
    ctx.rotate(legSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(6, 14);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, feet - 14);
    ctx.rotate(-legSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, 14);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  update(): void {
    if (this.dead) {
      this.fadeOut -= 0.04;
      if (this.fadeOut < 0) this.fadeOut = 0;
    }
    if (this.swingFrame > 0) {
      this.swingFrame++;
      if (this.swingFrame > 15) this.swingFrame = 0;
    }
  }

  get hitbox(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.x - 10,
      y: this.y - 44,
      w: 20,
      h: 44,
    };
  }
}

// =============================================================================
// SECTION 8: OBSTACLE CLASS
// =============================================================================

type ObstacleType = 'ac' | 'vent' | 'tank';

class Obstacle {
  x: number;
  y: number;
  type: ObstacleType;
  width: number;
  height: number;

  constructor(x: number, rooftopY: number, type: ObstacleType) {
    this.x = x;
    this.type = type;

    if (type === 'ac') {
      this.width = 40;
      this.height = 30;
    } else if (type === 'vent') {
      this.width = 15;
      this.height = 45;
    } else {
      // tank
      this.width = 35;
      this.height = 50;
    }

    this.y = rooftopY - this.height;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffcc00';
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2;

    if (this.type === 'ac') {
      // AC Unit
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      // Detail lines
      ctx.beginPath();
      ctx.moveTo(this.x + 5, this.y + 8);
      ctx.lineTo(this.x + this.width - 5, this.y + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x + 5, this.y + 14);
      ctx.lineTo(this.x + this.width - 5, this.y + 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x + 5, this.y + 20);
      ctx.lineTo(this.x + this.width - 5, this.y + 20);
      ctx.stroke();
    } else if (this.type === 'vent') {
      // Ventilation pipe
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeRect(this.x, this.y, this.width, this.height);
      // Horizontal bands
      for (let i = 10; i < this.height; i += 10) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + i);
        ctx.lineTo(this.x + this.width, this.y + i);
        ctx.stroke();
      }
      // Cap on top
      ctx.fillStyle = '#ff9900';
      ctx.fillRect(this.x - 4, this.y, this.width + 8, 6);
      ctx.strokeRect(this.x - 4, this.y, this.width + 8, 6);
    } else {
      // Water tank
      ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
      ctx.strokeRect(this.x, this.y + 10, this.width, this.height - 10);
      // Curved top
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + 10, this.width / 2, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      // Vertical bands
      ctx.beginPath();
      ctx.moveTo(this.x + 10, this.y + 10);
      ctx.lineTo(this.x + 10, this.y + this.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x + 25, this.y + 10);
      ctx.lineTo(this.x + 25, this.y + this.height);
      ctx.stroke();
    }
  }

  get hitbox(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.x + 3,
      y: this.y + 3,
      w: this.width - 6,
      h: this.height - 3,
    };
  }
}

// =============================================================================
// SECTION 9: PLAYER CLASS
// =============================================================================

class Player {
  x: number;
  y: number;
  vy: number = 0;
  isGrounded: boolean = false;
  isSliding: boolean = false;
  runCycle: number = 0;
  isSwinging: boolean = false;
  swingFrame: number = 0;
  flipRotation: number = 0;
  jumpProgress: number = 0;
  wasGrounded: boolean = false;
  airKillStreak: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  jump(): void {
    if (this.isGrounded && !this.isSliding) {
      this.vy = JUMP_VELOCITY;
      this.isGrounded = false;
      this.jumpProgress = 0;
      this.flipRotation = 0;
      playJumpSound();
    }
  }

  slide(): void {
    if (this.isGrounded) {
      this.isSliding = true;
    }
  }

  stopSlide(): void {
    this.isSliding = false;
  }

  update(): void {
    this.wasGrounded = this.isGrounded;

    if (!this.isGrounded) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
      this.y += this.vy;

      // Front flip rotation during jump
      this.flipRotation += 0.14;
      if (this.vy > 0) {
        // Falling
        this.jumpProgress = Math.min(1, this.jumpProgress + 0.06);
      } else {
        // Rising
        this.jumpProgress = Math.max(0, this.jumpProgress + 0.04);
      }
    } else {
      this.vy = 0;
      this.flipRotation = 0;
      this.jumpProgress = 0;
    }

    // Run cycle
    if (this.isGrounded && !this.isSliding) {
      this.runCycle += 0.18;
    } else if (this.isSliding) {
      this.runCycle += 0.08;
    } else {
      this.runCycle += 0.1;
    }

    // Detect landing
    if (!this.wasGrounded && this.isGrounded) {
      // Spawn dust particles
      for (let i = 0; i < 6; i++) {
        particles.push(new Particle(this.x, this.y, '#aaaacc', 20));
      }
      this.airKillStreak = 0;
    }

    // Swing frame advance
    if (this.isSwinging) {
      this.swingFrame++;
      if (this.swingFrame >= 15) {
        this.isSwinging = false;
        this.swingFrame = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    const color = '#e0e0ff';

    if (this.isSliding) {
      // ── SLIDE: low crouch ──────────────────────────────────────────
      ctx.translate(0, 20);
      ctx.scale(1, 0.45);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -40, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222255';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -40);
      ctx.lineTo(10, -40);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, -12);
      ctx.stroke();

      ctx.save();
      ctx.translate(0, -26);
      ctx.rotate(0.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ccccff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, -26);
      ctx.rotate(0.7);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-12, 0);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(0.35);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(5, 18);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(-0.15);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-5, 18);
      ctx.stroke();
      ctx.restore();

    } else if (!this.isGrounded) {
      // ── AIRBORNE: CURL INTO BALL + FULL FRONT FLIP ────────────────
      ctx.rotate(this.flipRotation);

      // Head (center of curled ball)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222255';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.lineTo(10, -20);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      // Short tucked torso
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, -4);
      ctx.stroke();

      // Left arm curled inward
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(9, -7);
      ctx.lineTo(6, 1);
      ctx.stroke();

      // Right arm curled inward
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(-9, -7);
      ctx.lineTo(-6, 1);
      ctx.stroke();

      // Left leg tucked to chest
      ctx.beginPath();
      ctx.moveTo(3, -4);
      ctx.lineTo(10, 3);
      ctx.lineTo(7, 12);
      ctx.stroke();

      // Right leg tucked to chest
      ctx.beginPath();
      ctx.moveTo(-3, -4);
      ctx.lineTo(-10, 3);
      ctx.lineTo(-7, 12);
      ctx.stroke();

      // Sword (tucked, just tip visible)
      ctx.strokeStyle = '#ccccff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9, -7);
      ctx.lineTo(20, -3);
      ctx.stroke();

    } else {
      // ── GROUNDED: NINJA SPRINT (lean forward, arms swept back) ────
      ctx.rotate(0.28); // lean forward ~16°

      // Head
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -40, 10, 0, Math.PI * 2);
      ctx.fill();

      // Headband
      ctx.strokeStyle = '#222255';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -40);
      ctx.lineTo(10, -40);
      ctx.stroke();
      // Headband tail streams behind
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -38);
      ctx.lineTo(-18, -32);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      // Torso
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(0, -12);
      ctx.stroke();

      const armBobL = Math.sin(this.runCycle) * 0.1;
      const armBobR = Math.sin(this.runCycle + 0.4) * 0.08;
      const BASE_BACK = -(Math.PI * 0.72);

      if (this.isSwinging) {
        // Sword swing arc
        const swingAngle = (this.swingFrame / 15) * Math.PI;
        const ghosts = [
          { offset: -0.3, alpha: 0.3 },
          { offset: -0.2, alpha: 0.2 },
          { offset: -0.1, alpha: 0.1 },
        ];
        for (const g of ghosts) {
          const ga = swingAngle + g.offset;
          ctx.save();
          ctx.translate(0, -26);
          ctx.rotate(ga - 0.6);
          ctx.globalAlpha = g.alpha;
          ctx.strokeStyle = '#e0e0ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(15, 0);
          ctx.stroke();
          ctx.strokeStyle = '#aaaaff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(15, 0);
          ctx.lineTo(33, 0);
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(0, -26);
        ctx.rotate(swingAngle - 0.6);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ccccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(33, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(13, -2);
        ctx.lineTo(17, 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Sword arm swept back behind body
        ctx.save();
        ctx.translate(0, -26);
        ctx.rotate(BASE_BACK + armBobL);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ccccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(33, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(13, -2);
        ctx.lineTo(17, 2);
        ctx.stroke();
        ctx.restore();
      }

      // Off-hand swept back
      ctx.save();
      ctx.translate(0, -26);
      ctx.rotate(BASE_BACK - 0.2 + armBobR);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(13, 0);
      ctx.stroke();
      ctx.restore();

      // Legs: aggressive pumping cycle
      const legSwing = Math.sin(this.runCycle) * 0.65;
      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(legSwing);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(5, 18);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(-legSwing);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-5, 18);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  get hitbox(): { x: number; y: number; w: number; h: number } {
    if (this.isSliding) {
      return {
        x: this.x - 12,
        y: this.y - 24,
        w: 24,
        h: 24,
      };
    }
    return {
      x: this.x - 12,
      y: this.y - 46,
      w: 24,
      h: 46,
    };
  }
}

// =============================================================================
// SECTION 10: WORLD GENERATION
// =============================================================================

let rooftops: Rooftop[] = [];
let enemies: Enemy[] = [];
let obstacles: Obstacle[] = [];
let particles: Particle[] = [];
let player!: Player;

function generateRooftop(afterX: number, afterY: number): Rooftop {
  const gap = 40 + Math.random() * 80;
  const newX = afterX + gap;
  const heightVariation = (Math.random() - 0.5) * 80;
  let newY = afterY + heightVariation;
  if (newY < GROUND_Y_MIN) newY = GROUND_Y_MIN;
  if (newY > GROUND_Y_MAX) newY = GROUND_Y_MAX;
  const newWidth = 150 + Math.random() * 200;
  return new Rooftop(newX, newY, newWidth);
}

function spawnEnemiesOnRooftop(roof: Rooftop): void {
  if (Math.random() < 0.6) {
    const count = Math.random() < 0.4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const ex = roof.x + 40 + i * 60 + Math.random() * (roof.width - 80 - i * 60);
      if (ex < roof.right - 20) {
        enemies.push(new Enemy(ex, roof.top));
      }
    }
  }
}

function spawnObstaclesOnRooftop(roof: Rooftop): void {
  if (Math.random() < 0.4) {
    const types: ObstacleType[] = ['ac', 'vent', 'tank'];
    const t = types[Math.floor(Math.random() * types.length)];
    const ox = roof.x + 20 + Math.random() * (roof.width - 60);

    // Check for enemy overlap
    let overlaps = false;
    for (const en of enemies) {
      if (Math.abs(en.x - ox) < 50) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps && ox < roof.right - 20) {
      obstacles.push(new Obstacle(ox, roof.top, t));
    }
  }
}

function initWorld(): void {
  rooftops = [];
  enemies = [];
  obstacles = [];
  particles = [];

  // First safe wide rooftop
  const firstRoof = new Rooftop(0, GROUND_Y_MIN + 40, 500);
  rooftops.push(firstRoof);

  // Generate a few more
  let lastRoof = firstRoof;
  for (let i = 0; i < 4; i++) {
    const newRoof = generateRooftop(lastRoof.right, lastRoof.top);
    rooftops.push(newRoof);
    spawnEnemiesOnRooftop(newRoof);
    spawnObstaclesOnRooftop(newRoof);
    lastRoof = newRoof;
  }

  // Create player on first rooftop
  player = new Player(150, firstRoof.top);
  player.isGrounded = true;
}

// =============================================================================
// SECTION 11: COLLISION DETECTION
// =============================================================================

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkPlayerOnRooftops(): void {
  player.isGrounded = false;

  for (const roof of rooftops) {
    const pb = player.hitbox;
    const playerBottom = pb.y + pb.h;
    const playerLeft = pb.x;
    const playerRight = pb.x + pb.w;

    // Check if player's feet are near rooftop top surface
    if (
      playerBottom >= roof.top - 5 &&
      playerBottom <= roof.top + 12 &&
      playerRight > roof.x + 5 &&
      playerLeft < roof.right - 5 &&
      player.vy >= 0
    ) {
      player.y = roof.top;
      player.vy = 0;
      player.isGrounded = true;
      break;
    }
  }
}

function checkEnemyCollisions(): void {
  if (!player.isSwinging) {
    const pb = player.hitbox;
    for (const en of enemies) {
      if (en.dead) continue;
      const eb = en.hitbox;
      if (rectsOverlap(pb.x, pb.y, pb.w, pb.h, eb.x, eb.y, eb.w, eb.h)) {
        // Trigger sword swing
        player.isSwinging = true;
        player.swingFrame = 1;
        en.swingFrame = 1;

        // Kill enemy
        en.dead = true;

        // Particle burst
        for (let i = 0; i < 10; i++) {
          particles.push(new Particle(en.x, en.y - 20, '#ff4444', 25));
        }

        // Score
        score += 10 * multiplier;

        // Combo tracking
        consecutiveEnemyKills++;
        player.airKillStreak++;

        if (consecutiveEnemyKills >= 3) {
          multiplier = 2;
        }

        // Show combo
        if (consecutiveEnemyKills >= 2) {
          const comboEl = document.getElementById('combo');
          if (comboEl) {
            comboEl.textContent = `${consecutiveEnemyKills}x COMBO!`;
            comboEl.classList.add('visible');
            setTimeout(() => {
              comboEl.classList.remove('visible');
            }, 1500);
          }
        }

        playEnemyDefeatSound();
        playSwordSwingSound();
        break;
      }
    }
  }
}

function checkObstacleCollisions(): void {
  const pb = player.hitbox;
  for (const obs of obstacles) {
    const ob = obs.hitbox;
    if (rectsOverlap(pb.x, pb.y, pb.w, pb.h, ob.x, ob.y, ob.w, ob.h)) {
      gameOver('YOU HIT AN OBSTACLE');
      return;
    }
  }
}

// =============================================================================
// SECTION 12: PARALLAX BACKGROUND
// =============================================================================

interface WindowDot {
  x: number;
  y: number;
}

interface BuildingData {
  x: number;
  w: number;
  h: number;
  windows: WindowDot[];
}

interface BuildingLayer {
  buildings: BuildingData[];
  speed: number;
  color: string;
}

let bgLayers: BuildingLayer[] = [];

function makeBuildingWindows(bx: number, by: number, bw: number, bh: number): WindowDot[] {
  const wins: WindowDot[] = [];
  const cols = Math.floor(bw / 12);
  const rows = Math.floor(bh / 16);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (Math.random() < 0.25) {
        wins.push({ x: bx + c * 12 + 4, y: by + r * 16 + 4 });
      }
    }
  }
  return wins;
}

function generateLayerBuildings(color: string, speed: number, minH: number, maxH: number): BuildingLayer {
  const buildings: BuildingData[] = [];
  let bx = 0;
  while (bx < CANVAS_WIDTH + 200) {
    const bw = 40 + Math.floor(Math.random() * 60);
    const bh = minH + Math.floor(Math.random() * (maxH - minH));
    const by = CANVAS_HEIGHT - bh;
    buildings.push({
      x: bx,
      w: bw,
      h: bh,
      windows: makeBuildingWindows(bx, by, bw, bh),
    });
    bx += bw + 5 + Math.floor(Math.random() * 15);
  }
  return { buildings, speed, color };
}

function initBackground(): void {
  bgLayers = [
    generateLayerBuildings('#0d0d2e', 0.2, 60, 120),
    generateLayerBuildings('#12122e', 0.5, 80, 160),
    generateLayerBuildings('#1a1a3e', 0.8, 100, 200),
  ];
}

function updateBackground(): void {
  for (const layer of bgLayers) {
    const layerSpeed = layer.speed * scrollSpeed;
    for (const b of layer.buildings) {
      b.x -= layerSpeed;
      for (const w of b.windows) {
        w.x -= layerSpeed;
      }
    }

    // Remove off-screen buildings and add new ones at right
    const minX = layer.buildings.reduce((m, b) => Math.min(m, b.x), Infinity);
    if (minX < -300) {
      // Remove first building
      layer.buildings.shift();
    }

    // Ensure rightmost building extends to screen right
    const maxRight = layer.buildings.reduce((m, b) => Math.max(m, b.x + b.w), -Infinity);
    if (maxRight < CANVAS_WIDTH + 200) {
      const bw = 40 + Math.floor(Math.random() * 60);
      const layerIdx = bgLayers.indexOf(layer);
      const minH = [60, 80, 100][layerIdx];
      const maxH = [120, 160, 200][layerIdx];
      const bh = minH + Math.floor(Math.random() * (maxH - minH));
      const bx = maxRight + 5 + Math.floor(Math.random() * 15);
      const by = CANVAS_HEIGHT - bh;
      layer.buildings.push({
        x: bx,
        w: bw,
        h: bh,
        windows: makeBuildingWindows(bx, by, bw, bh),
      });
    }
  }
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(1, '#0f0f2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  // Static small stars (use seeded pattern based on position)
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 137.5) % CANVAS_WIDTH);
    const sy = ((i * 93.7) % (CANVAS_HEIGHT * 0.5));
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Draw parallax layers
  for (const layer of bgLayers) {
    ctx.fillStyle = layer.color;
    for (const b of layer.buildings) {
      ctx.fillRect(b.x, CANVAS_HEIGHT - b.h, b.w, b.h);
      // Windows
      ctx.fillStyle = '#ffff99';
      for (const w of b.windows) {
        ctx.fillRect(w.x, w.y, 3, 3);
      }
      ctx.fillStyle = layer.color;
    }
  }
}

// =============================================================================
// SECTION 13: RENDERING
// =============================================================================

function renderRooftops(ctx: CanvasRenderingContext2D): void {
  for (const roof of rooftops) {
    roof.draw(ctx);
  }
}

function renderEnemies(ctx: CanvasRenderingContext2D): void {
  for (const en of enemies) {
    en.draw(ctx);
  }
}

function renderObstacles(ctx: CanvasRenderingContext2D): void {
  for (const obs of obstacles) {
    obs.draw(ctx);
  }
}

function renderParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    p.draw(ctx);
  }
}

function renderHUD(): void {
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const speedEl = document.getElementById('speedIndicator');
  const comboEl = document.getElementById('combo');

  if (scoreEl) scoreEl.textContent = `SCORE: ${score}`;
  if (highScoreEl) highScoreEl.textContent = `BEST: ${highScore}`;
  if (speedEl) {
    const speedMult = (scrollSpeed / INITIAL_SCROLL_SPEED).toFixed(1);
    speedEl.textContent = `SPEED: ${speedMult}x`;
  }

  if (comboEl && multiplier === 1 && consecutiveEnemyKills < 2) {
    comboEl.classList.remove('visible');
  }
}

function renderStartScreen(ctx: CanvasRenderingContext2D): void {
  const cx = CANVAS_WIDTH / 2;
  const roofY = CANVAS_HEIGHT * 0.65;

  // Rooftop
  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(cx - 80, roofY, 160, CANVAS_HEIGHT - roofY);
  ctx.strokeStyle = '#3a3a6a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 80, roofY);
  ctx.lineTo(cx + 80, roofY);
  ctx.stroke();

  // Animated ninja in sprint pose
  const runCyc = Date.now() * 0.009;
  const color = '#e0e0ff';
  const armBobL = Math.sin(runCyc) * 0.1;
  const armBobR = Math.sin(runCyc + 0.4) * 0.08;
  const BASE_BACK = -(Math.PI * 0.72);

  ctx.save();
  ctx.translate(cx, roofY);
  ctx.rotate(0.28); // lean forward

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -40, 10, 0, Math.PI * 2);
  ctx.fill();

  // Headband
  ctx.strokeStyle = '#222255';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -40);
  ctx.lineTo(10, -40);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-7, -38);
  ctx.lineTo(-18, -32);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;

  // Torso
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(0, -12);
  ctx.stroke();

  // Sword arm swept back
  ctx.save();
  ctx.translate(0, -26);
  ctx.rotate(BASE_BACK + armBobL);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(15, 0);
  ctx.stroke();
  ctx.strokeStyle = '#ccccff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(33, 0);
  ctx.stroke();
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(13, -2);
  ctx.lineTo(17, 2);
  ctx.stroke();
  ctx.restore();

  // Off-hand swept back
  ctx.save();
  ctx.translate(0, -26);
  ctx.rotate(BASE_BACK - 0.2 + armBobR);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(13, 0);
  ctx.stroke();
  ctx.restore();

  // Legs pumping
  const legSwing = Math.sin(runCyc) * 0.65;
  ctx.save();
  ctx.translate(0, -12);
  ctx.rotate(legSwing);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(5, 18);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(0, -12);
  ctx.rotate(-legSwing);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5, 18);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function renderGameOverScreen(): void {
  const titleEl = document.getElementById('gameOverTitle');
  const causeEl = document.getElementById('deathCause');
  const finalScoreEl = document.getElementById('finalScore');
  const finalHSEl = document.getElementById('finalHighScore');

  if (titleEl) titleEl.textContent = 'GAME OVER';
  if (causeEl) causeEl.textContent = deathCause;
  if (finalScoreEl) finalScoreEl.textContent = `SCORE: ${score}`;
  if (finalHSEl) finalHSEl.textContent = `BEST: ${highScore}`;
}

// =============================================================================
// SECTION 14: GAME LOOP
// =============================================================================

function update(): void {
  if (gameState !== 'playing') return;

  frameCount++;
  scrollSpeed = Math.min(MAX_SCROLL_SPEED, INITIAL_SCROLL_SPEED + frameCount * SCROLL_ACCELERATION);

  updateBackground();

  // Update rooftops
  for (const roof of rooftops) {
    roof.update(scrollSpeed);
  }

  // Also scroll enemies and obstacles with world
  for (const en of enemies) {
    en.x -= scrollSpeed;
    en.update();
  }
  for (const obs of obstacles) {
    obs.x -= scrollSpeed;
  }

  // Remove off-screen rooftops
  rooftops = rooftops.filter(r => !r.isOffScreen);

  // Remove fully faded dead enemies
  enemies = enemies.filter(en => !(en.dead && en.fadeOut <= 0));

  // Update particles, remove dead ones
  particles = particles.filter(p => p.update());

  // Generate new rooftops as needed
  const rightmost = rooftops.reduce((m, r) => Math.max(m, r.right), 0);
  if (rightmost < CANVAS_WIDTH + 300) {
    const lastRoof = rooftops[rooftops.length - 1];
    const newRoof = generateRooftop(lastRoof.right, lastRoof.top);
    rooftops.push(newRoof);
    spawnEnemiesOnRooftop(newRoof);
    spawnObstaclesOnRooftop(newRoof);
  }

  // Update player
  player.update();

  // Collision checks
  checkPlayerOnRooftops();
  checkEnemyCollisions();
  checkObstacleCollisions();

  // Reset combo if player lands without killing
  if (!player.wasGrounded && player.isGrounded && player.airKillStreak === 0) {
    consecutiveEnemyKills = 0;
    multiplier = 1;
  }

  // Passive score gain
  if (frameCount % 6 === 0) {
    score += multiplier;
  }

  // Check fall-off
  if (player.y > CANVAS_HEIGHT + 50) {
    gameOver('YOU FELL');
    return;
  }

  // Update HUD
  renderHUD();
}

function draw(): void {
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground(ctx);

  if (gameState === 'start') {
    renderStartScreen(ctx);
  } else {
    renderRooftops(ctx);
    renderObstacles(ctx);
    renderEnemies(ctx);
    renderParticles(ctx);
    if (player) player.draw(ctx);
  }

  if (gameState === 'gameover') {
    renderGameOverScreen();
  }

  renderHUD();
}

function gameLoop(): void {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// =============================================================================
// SECTION 15: GAME STATE MANAGEMENT
// =============================================================================

function startGame(): void {
  const startScreenEl = document.getElementById('startScreen');
  const hudEl = document.getElementById('hud');

  if (startScreenEl) startScreenEl.style.display = 'none';
  if (hudEl) hudEl.style.display = 'flex';

  score = 0;
  scrollSpeed = INITIAL_SCROLL_SPEED;
  frameCount = 0;
  consecutiveEnemyKills = 0;
  multiplier = 1;

  initWorld();
  gameState = 'playing';
}

function gameOver(cause: string): void {
  gameState = 'gameover';
  deathCause = cause;

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('rooftopNinjaHighScore', String(highScore));
  }

  const gameOverEl = document.getElementById('gameOverScreen');
  if (gameOverEl) gameOverEl.classList.remove('hidden');

  renderGameOverScreen();
  playGameOverSound();
}

function restartGame(): void {
  const gameOverEl = document.getElementById('gameOverScreen');
  if (gameOverEl) gameOverEl.classList.add('hidden');

  score = 0;
  scrollSpeed = INITIAL_SCROLL_SPEED;
  frameCount = 0;
  consecutiveEnemyKills = 0;
  multiplier = 1;

  initWorld();
  gameState = 'playing';
}

// =============================================================================
// SECTION 16: AUDIO
// =============================================================================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch (e) {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  freq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
): void {
  try {
    const ac = getAudioContext();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + duration);

    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (e) {
    // Audio not supported or failed
  }
}

function playNoiseBurst(duration: number, volume: number = 0.2): void {
  try {
    const ac = getAudioContext();
    if (!ac) return;

    const bufferSize = Math.floor(ac.sampleRate * duration);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ac.createBufferSource();
    source.buffer = buffer;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    source.start(ac.currentTime);
  } catch (e) {
    // Audio not supported
  }
}

function playJumpSound(): void {
  playTone(220, 440, 0.1, 'sine', 0.2);
}

function playSwordSwingSound(): void {
  playNoiseBurst(0.15, 0.15);
}

function playEnemyDefeatSound(): void {
  playTone(440, 220, 0.2, 'square', 0.2);
}

function playGameOverSound(): void {
  playTone(220, 110, 0.4, 'sawtooth', 0.25);
}

// =============================================================================
// INITIALIZATION & START
// =============================================================================

// Initialize background immediately
initBackground();

// Hide HUD initially, show start screen
const hudEl = document.getElementById('hud');
if (hudEl) hudEl.style.display = 'none';

// Update high score display on start screen
const highScoreEl = document.getElementById('highScore');
if (highScoreEl) highScoreEl.textContent = `BEST: ${highScore}`;

// Start the game loop
requestAnimationFrame(gameLoop);
