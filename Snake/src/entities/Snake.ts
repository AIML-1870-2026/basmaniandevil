import { Direction, SnakeSegment, BoundaryMode, Vec2 } from '../types';
import { INITIAL_SNAKE_LENGTH } from '../constants';
import { wrapValue } from '../utils/math';

export class Snake {
  segments: SnakeSegment[] = [];
  direction: Direction = Direction.Right;
  growthPending = 0;
  alive = true;

  init(gridSize: number): void {
    this.segments = [];
    this.direction = Direction.Right;
    this.growthPending = 0;
    this.alive = true;

    const startX = Math.floor(gridSize / 2);
    const startY = Math.floor(gridSize / 2);

    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      this.segments.push({
        x: startX - i,
        y: startY,
        prevX: startX - i,
        prevY: startY,
      });
    }
  }

  move(newDirection: Direction, gridSize: number, boundaryMode: BoundaryMode): {
    hitWall: boolean;
    newHead: Vec2;
  } {
    this.direction = newDirection;

    for (const seg of this.segments) {
      seg.prevX = seg.x;
      seg.prevY = seg.y;
    }

    const head = this.segments[0];
    let nx = head.x;
    let ny = head.y;

    switch (this.direction) {
      case Direction.Up: ny--; break;
      case Direction.Down: ny++; break;
      case Direction.Left: nx--; break;
      case Direction.Right: nx++; break;
    }

    let hitWall = false;
    if (boundaryMode === BoundaryMode.Wrap) {
      nx = wrapValue(nx, gridSize);
      ny = wrapValue(ny, gridSize);
    } else {
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
        hitWall = true;
      }
    }

    const newHead: SnakeSegment = { x: nx, y: ny, prevX: head.x, prevY: head.y };
    this.segments.unshift(newHead);

    if (this.growthPending > 0) {
      this.growthPending--;
    } else {
      this.segments.pop();
    }

    return { hitWall, newHead: { x: nx, y: ny } };
  }

  grow(amount = 1): void {
    this.growthPending += amount;
  }

  checkSelfCollision(): boolean {
    const head = this.segments[0];
    for (let i = 1; i < this.segments.length; i++) {
      if (this.segments[i].x === head.x && this.segments[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  getHead(): Vec2 {
    return this.segments[0];
  }

  occupies(x: number, y: number): boolean {
    return this.segments.some(s => s.x === x && s.y === y);
  }

  get length(): number {
    return this.segments.length;
  }
}
