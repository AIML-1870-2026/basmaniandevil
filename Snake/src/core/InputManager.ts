import { Direction } from '../types';

export class InputManager {
  private directionQueue: Direction[] = [];
  private currentDirection: Direction = Direction.Right;
  private keysDown: Set<string> = new Set();
  private keyCallbacks: Map<string, () => void> = new Map();

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.keysDown.has(e.key)) return;
    this.keysDown.add(e.key);

    const dir = this.keyToDirection(e.key);
    if (dir !== null) {
      e.preventDefault();
      const lastDir = this.getLastQueuedDir();
      if (!this.isOpposite(dir, lastDir) && this.directionQueue.length < 2) {
        this.directionQueue.push(dir);
      }
    }

    const cb = this.keyCallbacks.get(e.key);
    if (cb) cb();
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.key);
  }

  consumeDirection(): Direction {
    if (this.directionQueue.length > 0) {
      this.currentDirection = this.directionQueue.shift()!;
    }
    return this.currentDirection;
  }

  getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  resetDirection(dir: Direction): void {
    this.currentDirection = dir;
    this.directionQueue.length = 0;
  }

  onKey(key: string, callback: () => void): void {
    this.keyCallbacks.set(key, callback);
  }

  clearCallbacks(): void {
    this.keyCallbacks.clear();
  }

  isKeyDown(key: string): boolean {
    return this.keysDown.has(key);
  }

  private keyToDirection(key: string): Direction | null {
    switch (key) {
      case 'ArrowUp': case 'w': case 'W': return Direction.Up;
      case 'ArrowDown': case 's': case 'S': return Direction.Down;
      case 'ArrowLeft': case 'a': case 'A': return Direction.Left;
      case 'ArrowRight': case 'd': case 'D': return Direction.Right;
      default: return null;
    }
  }

  private isOpposite(a: Direction, b: Direction): boolean {
    return (a === Direction.Up && b === Direction.Down) ||
           (a === Direction.Down && b === Direction.Up) ||
           (a === Direction.Left && b === Direction.Right) ||
           (a === Direction.Right && b === Direction.Left);
  }

  private getLastQueuedDir(): Direction {
    return this.directionQueue.length > 0
      ? this.directionQueue[this.directionQueue.length - 1]
      : this.currentDirection;
  }
}
