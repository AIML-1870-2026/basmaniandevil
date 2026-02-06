import { ScreenHandler, PowerUpType, BoundaryMode } from '../types';
import { FOOD_PER_LEVEL, COLORS, FOOD_COLORS, POWERUP_COLORS } from '../constants';
import { Snake } from '../entities/Snake';
import { Food } from '../entities/Food';
import { ObstacleManager } from '../entities/Obstacle';
import { Renderer } from '../rendering/Renderer';
import { UIRenderer } from '../rendering/UIRenderer';
import { ScoreSystem } from '../systems/ScoreSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { PowerUpSystem } from '../systems/PowerUpSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputManager } from '../core/InputManager';
import { EventBus } from '../core/EventBus';
import { COMBO_TIMEOUT_MS } from '../constants';

export class PlayingScreen implements ScreenHandler {
  private time = 0;
  private renderer: Renderer;
  private uiRenderer: UIRenderer;
  private snake: Snake;
  private food: Food;
  private obstacles: ObstacleManager;
  private score: ScoreSystem;
  private levels: LevelSystem;
  private powerUps: PowerUpSystem;
  private collision: CollisionSystem;
  private input: InputManager;
  private eventBus: EventBus;
  private gridSize: number;
  private onPause: () => void;
  private onGameOver: () => void;
  private onLevelUp: () => void;
  private pointsPopups: Array<{ x: number; y: number; text: string; life: number; color: string }> = [];

  constructor(
    renderer: Renderer,
    snake: Snake,
    food: Food,
    obstacles: ObstacleManager,
    score: ScoreSystem,
    levels: LevelSystem,
    powerUps: PowerUpSystem,
    collision: CollisionSystem,
    input: InputManager,
    eventBus: EventBus,
    gridSize: number,
    _boundaryMode: BoundaryMode,
    onPause: () => void,
    onGameOver: () => void,
    onLevelUp: () => void,
  ) {
    this.renderer = renderer;
    this.uiRenderer = new UIRenderer();
    this.snake = snake;
    this.food = food;
    this.obstacles = obstacles;
    this.score = score;
    this.levels = levels;
    this.powerUps = powerUps;
    this.collision = collision;
    this.input = input;
    this.eventBus = eventBus;
    this.gridSize = gridSize;
    this.onPause = onPause;
    this.onGameOver = onGameOver;
    this.onLevelUp = onLevelUp;
  }

  enter(): void {}
  exit(): void {}

  update(dt: number): void {
    this.time += dt;

    // Process input
    const dir = this.input.consumeDirection();

    // Move snake — always use Wall mode so border = death
    const { hitWall } = this.snake.move(dir, this.gridSize, BoundaryMode.Wall);

    // Magnet: move food toward snake head
    if (this.powerUps.isMagnet() && this.food.item) {
      const head = this.snake.getHead();
      const f = this.food.item;
      if (f.x < head.x) f.x++;
      else if (f.x > head.x) f.x--;
      if (f.y < head.y) f.y++;
      else if (f.y > head.y) f.y--;
    }

    // Runner: move last food of the level horizontally
    if (this.food.item?.isRunner) {
      const f = this.food.item;
      const cellSize = this.renderer.cellSize;
      const speed = cellSize * 0.0008; // ~1 cell per 1.25s
      f.runnerOffset = (f.runnerOffset ?? 0) + f.runnerDir! * dt * speed;

      if (Math.abs(f.runnerOffset) >= cellSize) {
        f.x += f.runnerDir!;
        f.runnerOffset! -= f.runnerDir! * cellSize;

        // Reverse at grid boundaries
        if (f.x <= 0 || f.x >= this.gridSize - 1) {
          f.x = Math.max(0, Math.min(this.gridSize - 1, f.x));
          f.runnerDir = (f.runnerDir === 1 ? -1 : 1) as 1 | -1;
          f.runnerOffset = 0;
        }
      }
    }

    // Check collisions
    const activeEffects = this.powerUps.getActiveTypes();
    const result = this.collision.check(
      this.snake, this.food, this.obstacles, this.powerUps.entity,
      hitWall, activeEffects,
    );

    // Shield consumption
    if ((result.hitSelf || result.hitWall || result.hitObstacle) &&
        activeEffects.has(PowerUpType.Shield)) {
      this.powerUps.consumeShield();
    }

    // Food eaten
    if (result.ateFood && this.food.item) {
      const points = this.score.onFoodEaten(this.food.item.points, activeEffects);
      this.snake.grow();

      // Particle burst
      const fx = this.food.item.x * this.renderer.cellSize + this.renderer.cellSize / 2;
      const fy = this.food.item.y * this.renderer.cellSize + this.renderer.cellSize / 2;
      this.renderer.particles.burst(fx, fy, FOOD_COLORS[this.food.item.type], 15);

      // Points popup
      this.pointsPopups.push({
        x: fx, y: fy, text: `+${points}`, life: 1.0,
        color: this.score.combo > 1 ? COLORS.yellow : COLORS.green,
      });

      // Respawn food — last food of the level is a runner
      const occupied = this.collision.getOccupiedCells(
        this.snake, this.obstacles, this.food, this.powerUps.entity);
      const levelConfig = this.levels.getLevelConfig();
      const isLastFood = this.score.foodEaten === FOOD_PER_LEVEL - 1;
      this.food.spawn(this.gridSize, occupied, levelConfig.foodTypes, isLastFood);

      // Check level up
      if (this.levels.checkLevelUp(this.score.foodEaten)) {
        this.onLevelUp();
        return;
      }

      this.eventBus.emit('food:eaten');
    }

    // Power-up collected
    if (result.atePowerUp && result.powerUpType) {
      this.powerUps.activate(result.powerUpType);
      const px = this.powerUps.entity.item
        ? this.powerUps.entity.item.x * this.renderer.cellSize + this.renderer.cellSize / 2
        : 0;
      const py = this.powerUps.entity.item
        ? this.powerUps.entity.item.y * this.renderer.cellSize + this.renderer.cellSize / 2
        : 0;
      this.renderer.particles.burst(px, py, POWERUP_COLORS[result.powerUpType], 20, 200);
    }

    // Death
    if (result.hitSelf || result.hitWall || result.hitObstacle) {
      this.snake.alive = false;
      const head = this.snake.getHead();
      const hx = head.x * this.renderer.cellSize + this.renderer.cellSize / 2;
      const hy = head.y * this.renderer.cellSize + this.renderer.cellSize / 2;
      this.renderer.particles.burst(hx, hy, COLORS.red, 30, 250);
      this.onGameOver();
      return;
    }

    // Update systems
    this.score.update(dt);
    const occupied = this.collision.getOccupiedCells(
      this.snake, this.obstacles, this.food, this.powerUps.entity);
    const levelConfig = this.levels.getLevelConfig();
    this.powerUps.update(dt, this.gridSize, occupied, levelConfig.powerUpChance);
    this.renderer.particles.update(dt);

    // Update point popups
    for (let i = this.pointsPopups.length - 1; i >= 0; i--) {
      this.pointsPopups[i].life -= dt / 1000;
      this.pointsPopups[i].y -= dt * 0.03;
      if (this.pointsPopups[i].life <= 0) {
        this.pointsPopups.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    const canvasSize = this.renderer.canvasSize;
    const activeEffects = this.powerUps.getActiveTypes();

    // Background
    this.renderer.renderBackground(this.time);

    // Obstacles
    this.renderer.renderObstacles(this.obstacles.data, this.time);

    // Food
    if (this.food.item) {
      this.renderer.renderFood(this.food.item, this.time);
    }

    // Power-up on field
    if (this.powerUps.entity.item) {
      this.renderer.renderPowerUp(this.powerUps.entity.item, this.time);
    }

    // Snake
    this.renderer.renderSnake(this.snake.segments, alpha, activeEffects, this.snake.direction);

    // Particles
    this.renderer.renderParticles();

    // Point popups
    for (const popup of this.pointsPopups) {
      ctx.save();
      ctx.globalAlpha = popup.life;
      ctx.shadowColor = popup.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = popup.color;
      ctx.font = `bold ${canvasSize * 0.03}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.restore();
    }

    // HUD
    this.uiRenderer.drawHUD(ctx, canvasSize,
      this.score.score,
      this.levels.currentLevel,
      this.score.combo,
      this.score.comboTimer,
      COMBO_TIMEOUT_MS,
      this.powerUps.getActiveLabel(),
      this.score.foodEaten,
      FOOD_PER_LEVEL,
    );
  }

  handleInput(key: string): void {
    if (key === ' ' || key === 'Escape') {
      this.onPause();
    }
  }
}
