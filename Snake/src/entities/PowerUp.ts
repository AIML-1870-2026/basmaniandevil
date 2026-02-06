import { PowerUpItem, PowerUpType, Vec2 } from '../types';
import { POWERUP_SPAWN_RATES, POWERUP_FIELD_TIMEOUT } from '../constants';
import { randomInt } from '../utils/math';

export class PowerUpEntity {
  item: PowerUpItem | null = null;

  spawn(gridSize: number, occupiedCells: Vec2[]): void {
    const type = this.pickType();
    const pos = this.findFreeCell(gridSize, occupiedCells);
    if (!pos) return;

    this.item = {
      x: pos.x,
      y: pos.y,
      type,
      spawnTime: performance.now(),
      timeoutDuration: POWERUP_FIELD_TIMEOUT,
    };
  }

  clear(): void {
    this.item = null;
  }

  isExpired(): boolean {
    if (!this.item) return false;
    return performance.now() - this.item.spawnTime > this.item.timeoutDuration;
  }

  private pickType(): PowerUpType {
    const types = Object.values(PowerUpType);
    const rates = types.map(t => POWERUP_SPAWN_RATES[t]);
    const total = rates.reduce((a, b) => a + b, 0);

    let roll = Math.random() * total;
    for (let i = 0; i < types.length; i++) {
      roll -= rates[i];
      if (roll <= 0) return types[i];
    }
    return types[types.length - 1];
  }

  private findFreeCell(gridSize: number, occupied: Vec2[]): Vec2 | null {
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = randomInt(0, gridSize - 1);
      const y = randomInt(0, gridSize - 1);
      if (!occupied.some(c => c.x === x && c.y === y)) {
        return { x, y };
      }
    }
    return null;
  }
}
