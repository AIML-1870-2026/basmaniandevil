import { ObstacleData, Vec2 } from '../types';

export class ObstacleManager {
  private obstacles: ObstacleData[] = [];

  setObstacles(data: ObstacleData[], gridSize: number): void {
    this.obstacles = data.map(o => ({
      segments: o.segments.filter(s => s.x >= 0 && s.x < gridSize && s.y >= 0 && s.y < gridSize),
    }));
  }

  clear(): void {
    this.obstacles = [];
  }

  getAllCells(): Vec2[] {
    const cells: Vec2[] = [];
    for (const obs of this.obstacles) {
      for (const seg of obs.segments) {
        cells.push({ x: seg.x, y: seg.y });
      }
    }
    return cells;
  }

  isObstacle(x: number, y: number): boolean {
    for (const obs of this.obstacles) {
      for (const seg of obs.segments) {
        if (seg.x === x && seg.y === y) return true;
      }
    }
    return false;
  }

  get data(): ObstacleData[] {
    return this.obstacles;
  }
}
