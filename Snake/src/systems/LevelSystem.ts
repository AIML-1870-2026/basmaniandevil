import { LevelConfig, Difficulty } from '../types';
import { LEVELS, DIFFICULTY_BASE_TICK, FOOD_PER_LEVEL } from '../constants';
import { EventBus } from '../core/EventBus';

export class LevelSystem {
  currentLevel = 1;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  reset(): void {
    this.currentLevel = 1;
  }

  getLevelConfig(): LevelConfig {
    const idx = Math.min(this.currentLevel - 1, LEVELS.length - 1);
    return LEVELS[idx];
  }

  getTickRate(difficulty: Difficulty): number {
    const baseRate = DIFFICULTY_BASE_TICK[difficulty];
    const config = this.getLevelConfig();
    return Math.max(50, Math.floor(baseRate * config.tickMultiplier));
  }

  checkLevelUp(foodEaten: number): boolean {
    return foodEaten >= FOOD_PER_LEVEL && this.currentLevel < LEVELS.length;
  }

  levelUp(): LevelConfig {
    this.currentLevel++;
    const config = this.getLevelConfig();
    this.eventBus.emit('level:complete', { level: this.currentLevel, config });
    return config;
  }

  get maxLevel(): number {
    return LEVELS.length;
  }
}
