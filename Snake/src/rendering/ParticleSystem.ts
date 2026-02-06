import { Particle } from '../types';
import { ObjectPool } from '../utils/pool';

function createParticle(): Particle {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '', size: 0 };
}

function resetParticle(p: Particle): void {
  p.x = 0; p.y = 0; p.vx = 0; p.vy = 0;
  p.life = 0; p.maxLife = 0; p.color = ''; p.size = 0;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: ObjectPool<Particle>;

  constructor() {
    this.pool = new ObjectPool(createParticle, resetParticle, 200);
  }

  burst(x: number, y: number, color: string, count: number, speed = 150): void {
    for (let i = 0; i < count; i++) {
      const p = this.pool.acquire();
      const angle = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * speed;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.life = 0.4 + Math.random() * 0.6;
      p.maxLife = p.life;
      p.color = color;
      p.size = 1.5 + Math.random() * 3;
      this.particles.push(p);
    }
  }

  update(dt: number): void {
    const dtSec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dtSec;
      if (p.life <= 0) {
        this.pool.release(p);
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const size = p.size * alpha;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.pool.release(p);
    }
    this.particles.length = 0;
  }

  get count(): number {
    return this.particles.length;
  }
}
