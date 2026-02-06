import { ScreenHandler } from '../types';
import { COLORS } from '../constants';
import { drawNeonText } from '../rendering/NeonEffects';
import { Renderer } from '../rendering/Renderer';

export class LevelTransitionScreen implements ScreenHandler {
  private time = 0;
  private level = 1;
  private canvasSize: number;
  private renderer: Renderer;
  private onComplete: () => void;
  private duration = 3000;

  constructor(canvasSize: number, renderer: Renderer, onComplete: () => void) {
    this.canvasSize = canvasSize;
    this.renderer = renderer;
    this.onComplete = onComplete;
  }

  setLevel(level: number): void {
    this.level = level;
  }

  enter(): void {
    this.time = 0;
  }

  exit(): void {}

  update(dt: number): void {
    this.time += dt;
    this.renderer.particles.update(dt);

    if (this.time >= this.duration) {
      this.onComplete();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cx = this.canvasSize / 2;
    const cy = this.canvasSize / 2;
    const progress = this.time / this.duration;

    // Background
    this.renderer.renderBackground(this.time);

    // Flash effect at start
    if (progress < 0.1) {
      const flashAlpha = 1 - progress / 0.1;
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.4})`;
      ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
    }

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    // "LEVEL X" zoom in
    const titleSize = Math.max(28, this.canvasSize * 0.08);
    if (progress < 0.5) {
      const scale = Math.min(1, progress / 0.3);
      const glow = 20 + scale * 20;
      ctx.save();
      ctx.translate(cx, cy * 0.7);
      ctx.scale(scale, scale);
      drawNeonText(ctx, `LEVEL ${this.level}`, 0, 0, COLORS.cyan, titleSize, glow);
      ctx.restore();
    } else {
      drawNeonText(ctx, `LEVEL ${this.level}`, cx, cy * 0.7, COLORS.cyan, titleSize, 35);
    }

    // Speed indicator
    if (progress > 0.3 && progress < 0.8) {
      const subSize = Math.max(10, this.canvasSize * 0.025);
      drawNeonText(ctx, 'SPEED INCREASED', cx, cy, COLORS.magenta, subSize, 12);
    }

    // Countdown
    if (progress > 0.5) {
      const countProgress = (progress - 0.5) / 0.5;
      let countText = '';
      if (countProgress < 0.33) countText = '3';
      else if (countProgress < 0.66) countText = '2';
      else if (countProgress < 0.9) countText = '1';
      else countText = 'GO!';

      const countSize = Math.max(20, this.canvasSize * 0.06);
      const countColor = countText === 'GO!' ? COLORS.green : COLORS.yellow;
      drawNeonText(ctx, countText, cx, cy * 1.3, countColor, countSize, 25);
    }

    // Particles
    this.renderer.renderParticles();
  }

  handleInput(): void {}
}
