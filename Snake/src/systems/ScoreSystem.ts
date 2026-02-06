import { PowerUpType } from '../types';
import { COMBO_TIMEOUT_MS, COMBO_MULTIPLIER_CAP } from '../constants';
import { EventBus } from '../core/EventBus';

export class ScoreSystem {
  score = 0;
  combo = 0;
  comboTimer = 0;
  foodEaten = 0;
  totalFoodEaten = 0;

  constructor(private eventBus: EventBus) {}

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.foodEaten = 0;
    this.totalFoodEaten = 0;
  }

  resetLevelFood(): void {
    this.foodEaten = 0;
  }

  onFoodEaten(basePoints: number, activeEffects: Set<PowerUpType>): number {
    this.combo++;
    if (this.combo > COMBO_MULTIPLIER_CAP) this.combo = COMBO_MULTIPLIER_CAP;
    this.comboTimer = COMBO_TIMEOUT_MS;
    this.foodEaten++;
    this.totalFoodEaten++;

    let multiplier = 1 + (this.combo - 1) * 0.5;
    if (activeEffects.has(PowerUpType.DoublePoints)) {
      multiplier *= 2;
    }

    const points = Math.floor(basePoints * multiplier);
    this.score += points;

    this.eventBus.emit('score:updated', {
      score: this.score,
      combo: this.combo,
      pointsGained: points,
    });

    if (this.combo > 1) {
      this.eventBus.emit('combo:increment', { combo: this.combo });
    }

    return points;
  }

  update(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        if (this.combo > 0) {
          this.combo = 0;
          this.eventBus.emit('combo:reset');
        }
      }
    }
  }

  get comboProgress(): number {
    return this.comboTimer / COMBO_TIMEOUT_MS;
  }
}
