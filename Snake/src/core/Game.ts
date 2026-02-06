import { GameScreen, GameSettings, Direction } from '../types';
import { CELL_SIZE } from '../constants';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';
import { GameLoop } from './GameLoop';
import { StateMachine } from './StateMachine';
import { Snake } from '../entities/Snake';
import { Food } from '../entities/Food';
import { ObstacleManager } from '../entities/Obstacle';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { PowerUpSystem } from '../systems/PowerUpSystem';
import { Renderer } from '../rendering/Renderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { HighScoreManager } from '../storage/HighScoreManager';
import { SettingsManager } from '../storage/SettingsManager';
import { StartScreen } from '../screens/StartScreen';
import { PlayingScreen } from '../screens/PlayingScreen';
import { PausedScreen } from '../screens/PausedScreen';
import { GameOverScreen } from '../screens/GameOverScreen';
import { LevelTransitionScreen } from '../screens/LevelTransition';
import { SettingsScreen } from '../screens/SettingsScreen';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private eventBus: EventBus;
  private input: InputManager;
  private loop: GameLoop;
  private stateMachine: StateMachine;

  private snake: Snake;
  private food: Food;
  private obstacles: ObstacleManager;
  private collision: CollisionSystem;
  private scoring: ScoreSystem;
  private levels: LevelSystem;
  private powerUps: PowerUpSystem;

  private renderer: Renderer;
  private particles: ParticleSystem;

  private highScores: HighScoreManager;
  private settingsManager: SettingsManager;
  private settings: GameSettings;

  private startScreen!: StartScreen;
  private playingScreen!: PlayingScreen;
  private pausedScreen!: PausedScreen;
  private gameOverScreen!: GameOverScreen;
  private levelTransScreen!: LevelTransitionScreen;
  private settingsScreen!: SettingsScreen;

  private maxCombo = 0;
  private gameTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.settingsManager = new SettingsManager();
    this.settings = this.settingsManager.get();
    this.highScores = new HighScoreManager();

    this.eventBus = new EventBus();
    this.input = new InputManager();

    // Entities
    this.snake = new Snake();
    this.food = new Food();
    this.obstacles = new ObstacleManager();

    // Systems
    this.collision = new CollisionSystem();
    this.scoring = new ScoreSystem(this.eventBus);
    this.levels = new LevelSystem(this.eventBus);
    this.powerUps = new PowerUpSystem(this.eventBus);

    // Rendering
    this.particles = new ParticleSystem();
    this.renderer = new Renderer(this.ctx, this.settings.gridSize, this.particles);

    // State
    this.stateMachine = new StateMachine();

    // Configure canvas
    this.resizeCanvas();

    // Game loop
    this.loop = new GameLoop(
      this.levels.getTickRate(this.settings.difficulty),
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
    );

    this.setupScreens();
    this.setupInput();
    this.setupEvents();

    // Start on menu
    this.stateMachine.transitionTo(GameScreen.Start);
  }

  start(): void {
    this.loop.start();
  }

  private resizeCanvas(): void {
    const size = this.settings.gridSize * CELL_SIZE;
    this.canvas.width = size;
    this.canvas.height = size;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / size, vh / size) * 0.95;
    this.canvas.style.width = `${size * scale}px`;
    this.canvas.style.height = `${size * scale}px`;
  }

  private setupScreens(): void {
    const canvasSize = this.renderer.canvasSize;

    this.startScreen = new StartScreen(
      canvasSize,
      this.highScores.getScores(),
      () => this.startGame(),
      () => this.stateMachine.transitionTo(GameScreen.Settings),
    );

    this.playingScreen = new PlayingScreen(
      this.renderer, this.snake, this.food, this.obstacles,
      this.scoring, this.levels, this.powerUps, this.collision,
      this.input, this.eventBus, this.settings.gridSize, this.settings.boundaryMode,
      () => this.stateMachine.transitionTo(GameScreen.Paused),
      () => this.gameOver(),
      () => this.levelUp(),
    );

    this.pausedScreen = new PausedScreen(
      canvasSize,
      () => this.stateMachine.transitionTo(GameScreen.Playing),
      () => this.restartGame(),
      () => this.backToMenu(),
    );

    this.gameOverScreen = new GameOverScreen(
      canvasSize,
      () => this.restartGame(),
      () => this.backToMenu(),
      (name) => {
        this.highScores.addScore(name, this.scoring.score, this.levels.currentLevel);
        this.startScreen.updateHighScores(this.highScores.getScores());
      },
    );

    this.levelTransScreen = new LevelTransitionScreen(
      canvasSize,
      this.renderer,
      () => this.completeLevelTransition(),
    );

    this.settingsScreen = new SettingsScreen(
      canvasSize,
      this.settings,
      () => this.stateMachine.transitionTo(GameScreen.Start),
      (newSettings) => this.applySettings(newSettings),
    );

    this.stateMachine.register(GameScreen.Start, this.startScreen);
    this.stateMachine.register(GameScreen.Playing, this.playingScreen);
    this.stateMachine.register(GameScreen.Paused, this.pausedScreen);
    this.stateMachine.register(GameScreen.GameOver, this.gameOverScreen);
    this.stateMachine.register(GameScreen.LevelTransition, this.levelTransScreen);
    this.stateMachine.register(GameScreen.Settings, this.settingsScreen);
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.stateMachine.handleInput(e.key, true);
    });

    // Pause on blur
    window.addEventListener('blur', () => {
      if (this.stateMachine.current === GameScreen.Playing) {
        this.stateMachine.transitionTo(GameScreen.Paused);
      }
    });
  }

  private setupEvents(): void {
    this.eventBus.on('combo:increment', (data) => {
      const { combo } = data as { combo: number };
      if (combo > this.maxCombo) this.maxCombo = combo;
    });
  }

  private startGame(): void {
    this.resetGameState();
    this.stateMachine.transitionTo(GameScreen.Playing);
  }

  private restartGame(): void {
    this.resetGameState();
    this.stateMachine.transitionTo(GameScreen.Playing);
  }

  private backToMenu(): void {
    this.startScreen.updateHighScores(this.highScores.getScores());
    this.stateMachine.transitionTo(GameScreen.Start);
  }

  private resetGameState(): void {
    this.snake.init(this.settings.gridSize);
    this.input.resetDirection(Direction.Right);
    this.scoring.reset();
    this.levels.reset();
    this.powerUps.reset();
    this.particles.clear();
    this.maxCombo = 0;
    this.gameTime = 0;

    const levelConfig = this.levels.getLevelConfig();
    this.obstacles.setObstacles(levelConfig.obstacles, this.settings.gridSize);

    const occupied = this.collision.getOccupiedCells(
      this.snake, this.obstacles, this.food, this.powerUps.entity);
    this.food.spawn(this.settings.gridSize, occupied, levelConfig.foodTypes);

    this.loop.tickRate = this.levels.getTickRate(this.settings.difficulty);
  }

  private gameOver(): void {
    const isHS = this.highScores.isHighScore(this.scoring.score);
    this.gameOverScreen.setStats(
      this.scoring.score,
      this.levels.currentLevel,
      this.scoring.totalFoodEaten,
      this.maxCombo,
      isHS,
    );
    this.stateMachine.transitionTo(GameScreen.GameOver);
  }

  private levelUp(): void {
    this.levels.levelUp();
    this.levelTransScreen.setLevel(this.levels.currentLevel);
    this.stateMachine.transitionTo(GameScreen.LevelTransition);
  }

  private completeLevelTransition(): void {
    const levelConfig = this.levels.getLevelConfig();
    this.obstacles.setObstacles(levelConfig.obstacles, this.settings.gridSize);
    this.scoring.resetLevelFood();
    this.loop.tickRate = this.levels.getTickRate(this.settings.difficulty);

    const occupied = this.collision.getOccupiedCells(
      this.snake, this.obstacles, this.food, this.powerUps.entity);
    this.food.spawn(this.settings.gridSize, occupied, levelConfig.foodTypes);

    this.stateMachine.transitionTo(GameScreen.Playing);
  }

  private applySettings(newSettings: GameSettings): void {
    const gridChanged = newSettings.gridSize !== this.settings.gridSize;
    this.settings = { ...newSettings };
    this.settingsManager.save(this.settings);

    if (gridChanged) {
      this.renderer = new Renderer(this.ctx, this.settings.gridSize, this.particles);
      this.resizeCanvas();
      this.rebuildScreens();
    }

  }

  private rebuildScreens(): void {
    this.setupScreens();
    this.stateMachine.transitionTo(GameScreen.Start);
  }

  private update(dt: number): void {
    if (this.stateMachine.current === GameScreen.Playing) {
      this.gameTime += dt;
    }

    // Update tick rate for slow-down power-up
    if (this.stateMachine.current === GameScreen.Playing) {
      let rate = this.levels.getTickRate(this.settings.difficulty);
      if (this.powerUps.isSlowed()) {
        rate = Math.floor(rate * 1.5);
      }
      this.loop.tickRate = rate;
    }

    this.stateMachine.update(dt);
  }

  private render(alpha: number): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.stateMachine.render(this.ctx, alpha);
  }
}
