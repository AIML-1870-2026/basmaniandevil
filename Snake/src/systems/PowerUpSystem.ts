import { ActivePowerUp, PowerUpType, Vec2 } from '../types';
import { POWERUP_DURATIONS, POWERUP_SPAWN_INTERVAL_MIN, POWERUP_SPAWN_INTERVAL_MAX } from '../constants';
import { PowerUpEntity } from '../entities/PowerUp';
import { EventBus } from '../core/EventBus';
import { randomFloat } from '../utils/math';

export class PowerUpSystem {
  activeEffects: Map<PowerUpType, ActivePowerUp> = new Map();
  entity: PowerUpEntity;
  private spawnTimer = 0;
  private nextSpawnTime: number;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.entity = new PowerUpEntity();
    this.eventBus = eventBus;
    this.nextSpawnTime = this.randomSpawnInterval();
  }

  reset(): void {
    this.activeEffects.clear();
    this.entity.clear();
    this.spawnTimer = 0;
    this.nextSpawnTime = this.randomSpawnInterval();
  }

  update(dt: number, gridSize: number, occupied: Vec2[], powerUpChance: number): void {
    // Spawn timer
    if (!this.entity.item) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.nextSpawnTime && Math.random() < powerUpChance) {
        this.entity.spawn(gridSize, occupied);
        this.spawnTimer = 0;
        this.nextSpawnTime = this.randomSpawnInterval();
      }
    }

    // Check field item expiry
    if (this.entity.isExpired()) {
      this.entity.clear();
    }

    // Check active effect expiry
    const now = performance.now();
    for (const [type, effect] of this.activeEffects.entries()) {
      if (now >= effect.expiresAt) {
        this.activeEffects.delete(type);
        this.eventBus.emit('powerup:expired', { type });
      }
    }
  }

  activate(type: PowerUpType): void {
    const duration = POWERUP_DURATIONS[type];
    if (duration === Infinity) {
      // Shield: stays until used
      this.activeEffects.set(type, { type, expiresAt: Infinity });
    } else {
      this.activeEffects.set(type, { type, expiresAt: performance.now() + duration });
    }
    this.entity.clear();
    this.eventBus.emit('powerup:collected', { type });
  }

  consumeShield(): void {
    this.activeEffects.delete(PowerUpType.Shield);
    this.eventBus.emit('powerup:expired', { type: PowerUpType.Shield });
  }

  getActiveTypes(): Set<PowerUpType> {
    return new Set(this.activeEffects.keys());
  }

  getActiveLabel(): string | null {
    const types = Array.from(this.activeEffects.keys());
    if (types.length === 0) return null;
    return types.map(t => t.toUpperCase()).join(' + ');
  }

  isSlowed(): boolean {
    return this.activeEffects.has(PowerUpType.SlowDown);
  }

  isMagnet(): boolean {
    return this.activeEffects.has(PowerUpType.Magnet);
  }

  private randomSpawnInterval(): number {
    return randomFloat(POWERUP_SPAWN_INTERVAL_MIN, POWERUP_SPAWN_INTERVAL_MAX);
  }
}
