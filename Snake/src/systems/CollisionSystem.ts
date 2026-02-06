import { Vec2, PowerUpType } from '../types';
import { Snake } from '../entities/Snake';
import { Food } from '../entities/Food';
import { ObstacleManager } from '../entities/Obstacle';
import { PowerUpEntity } from '../entities/PowerUp';

export interface CollisionResult {
  ateFood: boolean;
  hitSelf: boolean;
  hitWall: boolean;
  hitObstacle: boolean;
  atePowerUp: boolean;
  powerUpType?: PowerUpType;
}

export class CollisionSystem {
  check(
    snake: Snake,
    food: Food,
    obstacles: ObstacleManager,
    powerUp: PowerUpEntity,
    wallHit: boolean,
    activeEffects: Set<PowerUpType>,
  ): CollisionResult {
    const head = snake.getHead();
    const result: CollisionResult = {
      ateFood: false,
      hitSelf: false,
      hitWall: false,
      hitObstacle: false,
      atePowerUp: false,
    };

    // Food collision
    if (food.item && food.item.x === head.x && food.item.y === head.y) {
      result.ateFood = true;
    }

    // Power-up collision
    if (powerUp.item && powerUp.item.x === head.x && powerUp.item.y === head.y) {
      result.atePowerUp = true;
      result.powerUpType = powerUp.item.type;
    }

    // Ghost mode skips fatal collisions
    if (activeEffects.has(PowerUpType.Ghost)) {
      return result;
    }

    // Wall collision
    if (wallHit) {
      result.hitWall = true;
    }

    // Self collision
    if (snake.checkSelfCollision()) {
      result.hitSelf = true;
    }

    // Obstacle collision
    if (obstacles.isObstacle(head.x, head.y)) {
      result.hitObstacle = true;
    }

    // Shield absorbs one fatal hit
    if (activeEffects.has(PowerUpType.Shield) &&
        (result.hitSelf || result.hitWall || result.hitObstacle)) {
      result.hitSelf = false;
      result.hitWall = false;
      result.hitObstacle = false;
    }

    return result;
  }

  getOccupiedCells(
    snake: Snake,
    obstacles: ObstacleManager,
    food: Food,
    powerUp: PowerUpEntity,
  ): Vec2[] {
    const cells: Vec2[] = [];
    for (const seg of snake.segments) {
      cells.push({ x: seg.x, y: seg.y });
    }
    for (const cell of obstacles.getAllCells()) {
      cells.push(cell);
    }
    if (food.item) {
      cells.push({ x: food.item.x, y: food.item.y });
    }
    if (powerUp.item) {
      cells.push({ x: powerUp.item.x, y: powerUp.item.y });
    }
    return cells;
  }
}
