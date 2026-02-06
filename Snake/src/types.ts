export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export enum GameScreen {
  Start = 'start',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'gameover',
  LevelTransition = 'levelTransition',
  Settings = 'settings',
}

export enum FoodType {
  Normal = 'normal',
  Bonus = 'bonus',
  Golden = 'golden',
}

export enum PowerUpType {
  Ghost = 'ghost',
  SlowDown = 'slowdown',
  DoublePoints = 'double',
  Magnet = 'magnet',
  Shield = 'shield',
}

export enum BoundaryMode {
  Wrap = 'wrap',
  Wall = 'wall',
}

export enum Difficulty {
  Easy = 'easy',
  Normal = 'normal',
  Hard = 'hard',
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface SnakeSegment {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
}

export interface FoodItem {
  x: number;
  y: number;
  type: FoodType;
  points: number;
  pulsePhase: number;
  isRunner?: boolean;
  runnerDir?: 1 | -1;
  runnerOffset?: number;
}

export interface PowerUpItem {
  x: number;
  y: number;
  type: PowerUpType;
  spawnTime: number;
  timeoutDuration: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  expiresAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ObstacleData {
  segments: Vec2[];
}

export interface LevelConfig {
  level: number;
  targetScore: number;
  tickMultiplier: number;
  obstacles: ObstacleData[];
  powerUpChance: number;
  foodTypes: FoodType[];
}

export interface GameSettings {
  difficulty: Difficulty;
  gridSize: number;
  boundaryMode: BoundaryMode;
}

export interface HighScoreEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

export interface ScreenHandler {
  enter(prev: GameScreen): void;
  exit(next: GameScreen): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D, alpha: number): void;
  handleInput(key: string, pressed: boolean): void;
}
