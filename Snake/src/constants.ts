import { Difficulty, FoodType, LevelConfig, PowerUpType } from './types';

export const COLORS = {
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  green: '#00FF41',
  pink: '#FF0080',
  orange: '#FF6600',
  yellow: '#FFE600',
  purple: '#9D00FF',
  red: '#FF0040',
  blue: '#0080FF',
  white: '#FFFFFF',
  background: '#0a0a0f',
  grid: '#1a1a2e',
};

export const FOOD_COLORS: Record<FoodType, string> = {
  [FoodType.Normal]: COLORS.pink,
  [FoodType.Bonus]: COLORS.orange,
  [FoodType.Golden]: COLORS.yellow,
};

export const FOOD_POINTS: Record<FoodType, number> = {
  [FoodType.Normal]: 10,
  [FoodType.Bonus]: 25,
  [FoodType.Golden]: 50,
};

export const POWERUP_COLORS: Record<PowerUpType, string> = {
  [PowerUpType.Ghost]: COLORS.purple,
  [PowerUpType.SlowDown]: COLORS.green,
  [PowerUpType.DoublePoints]: COLORS.yellow,
  [PowerUpType.Magnet]: COLORS.magenta,
  [PowerUpType.Shield]: COLORS.cyan,
};

export const POWERUP_DURATIONS: Record<PowerUpType, number> = {
  [PowerUpType.Ghost]: 5000,
  [PowerUpType.SlowDown]: 7000,
  [PowerUpType.DoublePoints]: 10000,
  [PowerUpType.Magnet]: 6000,
  [PowerUpType.Shield]: Infinity,
};

export const POWERUP_SPAWN_RATES: Record<PowerUpType, number> = {
  [PowerUpType.Ghost]: 0.08,
  [PowerUpType.SlowDown]: 0.12,
  [PowerUpType.DoublePoints]: 0.10,
  [PowerUpType.Magnet]: 0.07,
  [PowerUpType.Shield]: 0.05,
};

export const DIFFICULTY_BASE_TICK: Record<Difficulty, number> = {
  [Difficulty.Easy]: 200,
  [Difficulty.Normal]: 150,
  [Difficulty.Hard]: 100,
};

export const COMBO_TIMEOUT_MS = 3000;
export const COMBO_MULTIPLIER_CAP = 8;
export const POWERUP_FIELD_TIMEOUT = 10000;
export const POWERUP_SPAWN_INTERVAL_MIN = 15000;
export const POWERUP_SPAWN_INTERVAL_MAX = 20000;
export const MAX_HIGH_SCORES = 10;
export const INITIAL_SNAKE_LENGTH = 3;
export const CELL_SIZE = 25;
export const DEFAULT_GRID_SIZE = 20;
export const FOOD_PER_LEVEL = 10;

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    targetScore: 100,
    tickMultiplier: 1.0,
    obstacles: [],
    powerUpChance: 0.05,
    foodTypes: [FoodType.Normal],
  },
  {
    level: 2,
    targetScore: 250,
    tickMultiplier: 0.9,
    obstacles: [],
    powerUpChance: 0.08,
    foodTypes: [FoodType.Normal, FoodType.Bonus],
  },
  {
    level: 3,
    targetScore: 500,
    tickMultiplier: 0.8,
    obstacles: [],
    powerUpChance: 0.10,
    foodTypes: [FoodType.Normal, FoodType.Bonus],
  },
  {
    level: 4,
    targetScore: 800,
    tickMultiplier: 0.75,
    obstacles: [
      { segments: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }] },
      { segments: [{ x: 14, y: 12 }, { x: 14, y: 13 }, { x: 14, y: 14 }] },
      { segments: [{ x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }] },
    ],
    powerUpChance: 0.12,
    foodTypes: [FoodType.Normal, FoodType.Bonus],
  },
  {
    level: 5,
    targetScore: 1200,
    tickMultiplier: 0.7,
    obstacles: [
      { segments: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }] },
      { segments: [{ x: 14, y: 3 }, { x: 15, y: 3 }, { x: 16, y: 3 }] },
      { segments: [{ x: 3, y: 16 }, { x: 4, y: 16 }, { x: 5, y: 16 }] },
      { segments: [{ x: 14, y: 16 }, { x: 15, y: 16 }, { x: 16, y: 16 }] },
      { segments: [{ x: 9, y: 9 }, { x: 10, y: 9 }, { x: 9, y: 10 }, { x: 10, y: 10 }] },
    ],
    powerUpChance: 0.14,
    foodTypes: [FoodType.Normal, FoodType.Bonus, FoodType.Golden],
  },
  {
    level: 6,
    targetScore: 1700,
    tickMultiplier: 0.65,
    obstacles: [
      { segments: [{ x: 2, y: 5 }, { x: 2, y: 6 }, { x: 2, y: 7 }, { x: 2, y: 8 }] },
      { segments: [{ x: 17, y: 11 }, { x: 17, y: 12 }, { x: 17, y: 13 }, { x: 17, y: 14 }] },
      { segments: [{ x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }] },
      { segments: [{ x: 11, y: 17 }, { x: 12, y: 17 }, { x: 13, y: 17 }, { x: 14, y: 17 }] },
      { segments: [{ x: 9, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 12 }, { x: 10, y: 12 }] },
      { segments: [{ x: 7, y: 9 }, { x: 7, y: 10 }, { x: 12, y: 9 }, { x: 12, y: 10 }] },
      { segments: [{ x: 0, y: 10 }, { x: 1, y: 10 }] },
    ],
    powerUpChance: 0.16,
    foodTypes: [FoodType.Normal, FoodType.Bonus, FoodType.Golden],
  },
  {
    level: 7,
    targetScore: 2300,
    tickMultiplier: 0.6,
    obstacles: [
      { segments: [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 }] },
      { segments: [{ x: 11, y: 15 }, { x: 12, y: 15 }, { x: 13, y: 15 }, { x: 14, y: 15 }, { x: 15, y: 15 }] },
      { segments: [{ x: 4, y: 8 }, { x: 4, y: 9 }, { x: 4, y: 10 }, { x: 4, y: 11 }] },
      { segments: [{ x: 15, y: 8 }, { x: 15, y: 9 }, { x: 15, y: 10 }, { x: 15, y: 11 }] },
    ],
    powerUpChance: 0.18,
    foodTypes: [FoodType.Normal, FoodType.Bonus, FoodType.Golden],
  },
  {
    level: 8,
    targetScore: 3000,
    tickMultiplier: 0.55,
    obstacles: [
      { segments: [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 4 }, { x: 5, y: 5 }] },
      { segments: [{ x: 14, y: 3 }, { x: 15, y: 3 }, { x: 16, y: 3 }, { x: 14, y: 4 }, { x: 14, y: 5 }] },
      { segments: [{ x: 3, y: 16 }, { x: 4, y: 16 }, { x: 5, y: 16 }, { x: 5, y: 15 }, { x: 5, y: 14 }] },
      { segments: [{ x: 14, y: 16 }, { x: 15, y: 16 }, { x: 16, y: 16 }, { x: 14, y: 15 }, { x: 14, y: 14 }] },
      { segments: [{ x: 9, y: 9 }, { x: 10, y: 9 }, { x: 9, y: 10 }, { x: 10, y: 10 }] },
    ],
    powerUpChance: 0.20,
    foodTypes: [FoodType.Normal, FoodType.Bonus, FoodType.Golden],
  },
  {
    level: 9,
    targetScore: 4000,
    tickMultiplier: 0.5,
    obstacles: [
      { segments: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }] },
      { segments: [{ x: 13, y: 2 }, { x: 14, y: 2 }, { x: 15, y: 2 }, { x: 16, y: 2 }, { x: 17, y: 2 }] },
      { segments: [{ x: 2, y: 17 }, { x: 3, y: 17 }, { x: 4, y: 17 }, { x: 5, y: 17 }, { x: 6, y: 17 }] },
      { segments: [{ x: 13, y: 17 }, { x: 14, y: 17 }, { x: 15, y: 17 }, { x: 16, y: 17 }, { x: 17, y: 17 }] },
      { segments: [{ x: 7, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }] },
      { segments: [{ x: 7, y: 12 }, { x: 8, y: 12 }, { x: 9, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 }, { x: 12, y: 12 }] },
    ],
    powerUpChance: 0.22,
    foodTypes: [FoodType.Normal, FoodType.Bonus, FoodType.Golden],
  },
  {
    level: 10,
    targetScore: 5000,
    tickMultiplier: 0.45,
    obstacles: [
      { segments: [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }] },
      { segments: [{ x: 15, y: 5 }, { x: 16, y: 5 }, { x: 17, y: 5 }, { x: 18, y: 5 }] },
      { segments: [{ x: 1, y: 14 }, { x: 2, y: 14 }, { x: 3, y: 14 }, { x: 4, y: 14 }] },
      { segments: [{ x: 15, y: 14 }, { x: 16, y: 14 }, { x: 17, y: 14 }, { x: 18, y: 14 }] },
      { segments: [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }, { x: 5, y: 4 }] },
      { segments: [{ x: 14, y: 1 }, { x: 14, y: 2 }, { x: 14, y: 3 }, { x: 14, y: 4 }] },
      { segments: [{ x: 5, y: 15 }, { x: 5, y: 16 }, { x: 5, y: 17 }, { x: 5, y: 18 }] },
      { segments: [{ x: 14, y: 15 }, { x: 14, y: 16 }, { x: 14, y: 17 }, { x: 14, y: 18 }] },
      { segments: [{ x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 8, y: 11 }, { x: 9, y: 11 }, { x: 10, y: 11 }, { x: 11, y: 11 }, { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 11, y: 9 }, { x: 11, y: 10 }] },
    ],
    powerUpChance: 0.25,
    foodTypes: [FoodType.Normal, FoodType.Bonus, FoodType.Golden],
  },
];
