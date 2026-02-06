import { FoodItem, FoodType, Vec2 } from '../types';
import { FOOD_POINTS } from '../constants';
import { randomInt } from '../utils/math';

export class Food {
  item: FoodItem | null = null;

  spawn(
    gridSize: number,
    occupiedCells: Vec2[],
    allowedTypes: FoodType[],
    runner = false,
  ): void {
    const type = this.pickType(allowedTypes);
    const pos = this.findFreeCell(gridSize, occupiedCells);
    if (!pos) return;

    this.item = {
      x: pos.x,
      y: pos.y,
      type,
      points: FOOD_POINTS[type],
      pulsePhase: Math.random() * Math.PI * 2,
    };

    if (runner) {
      this.item.isRunner = true;
      this.item.runnerDir = Math.random() < 0.5 ? -1 : 1;
      this.item.runnerOffset = 0;
    }
  }

  clear(): void {
    this.item = null;
  }

  private pickType(types: FoodType[]): FoodType {
    if (types.length === 1) return types[0];

    const roll = Math.random();
    if (types.includes(FoodType.Golden) && roll < 0.05) return FoodType.Golden;
    if (types.includes(FoodType.Bonus) && roll < 0.2) return FoodType.Bonus;
    return FoodType.Normal;
  }

  private findFreeCell(gridSize: number, occupied: Vec2[]): Vec2 | null {
    const totalCells = gridSize * gridSize;
    if (occupied.length >= totalCells) return null;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = randomInt(0, gridSize - 1);
      const y = randomInt(0, gridSize - 1);
      if (!occupied.some(c => c.x === x && c.y === y)) {
        return { x, y };
      }
    }

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (!occupied.some(c => c.x === x && c.y === y)) {
          return { x, y };
        }
      }
    }

    return null;
  }
}
