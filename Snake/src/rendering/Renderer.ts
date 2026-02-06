import { SnakeSegment, FoodItem, PowerUpItem, PowerUpType, ObstacleData, Direction } from '../types';
import { COLORS, POWERUP_COLORS, CELL_SIZE } from '../constants';
import { drawNeonRect, drawNeonCircle } from './NeonEffects';
import { interpolateColor } from '../utils/color';
import { lerp } from '../utils/math';
import { GridRenderer } from './GridRenderer';
import { ParticleSystem } from './ParticleSystem';

export class Renderer {
  private gridRenderer: GridRenderer;
  readonly cellSize: number;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private gridSize: number,
    public particles: ParticleSystem,
  ) {
    this.gridRenderer = new GridRenderer();
    this.cellSize = CELL_SIZE;
  }

  get canvasSize(): number {
    return this.gridSize * this.cellSize;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
  }

  renderBackground(time: number): void {
    this.gridRenderer.render(this.ctx, this.cellSize, this.gridSize, this.gridSize, time);
  }

  renderSnake(
    segments: SnakeSegment[],
    alpha: number,
    activeEffects: Set<PowerUpType>,
    direction: Direction,
  ): void {
    const total = segments.length;
    const half = this.cellSize / 2;
    const isGhost = activeEffects.has(PowerUpType.Ghost);

    // Pre-compute interpolated center positions for all segments
    const centers: Array<{ cx: number; cy: number }> = [];
    for (let i = 0; i < total; i++) {
      const seg = segments[i];
      centers.push({
        cx: lerp(seg.prevX, seg.x, alpha) * this.cellSize + half,
        cy: lerp(seg.prevY, seg.y, alpha) * this.cellSize + half,
      });
    }

    // --- Draw body connections (thick lines between segment centers) ---
    // Draw from tail to head so head is on top
    for (let i = total - 1; i >= 1; i--) {
      const t = i / Math.max(1, total - 1);
      const prevT = (i - 1) / Math.max(1, total - 1);
      const color = interpolateColor(COLORS.cyan, COLORS.magenta, (t + prevT) / 2);
      const brightness = 1.0 - ((t + prevT) / 2) * 0.5;

      // Body tapers: head is full width, tail narrows
      const bodyWidth = this.cellSize * (0.35 + 0.35 * (1 - t));

      this.ctx.save();
      this.ctx.globalAlpha = brightness * (isGhost ? 0.4 : 1);
      this.ctx.strokeStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10 * brightness;
      this.ctx.lineWidth = bodyWidth;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(centers[i - 1].cx, centers[i - 1].cy);
      this.ctx.lineTo(centers[i].cx, centers[i].cy);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // --- Draw body segment circles (overlapping for smooth appearance) ---
    for (let i = total - 1; i >= 1; i--) {
      const t = i / Math.max(1, total - 1);
      const color = interpolateColor(COLORS.cyan, COLORS.magenta, t);
      const brightness = 1.0 - t * 0.5;
      const radius = this.cellSize * (0.32 + 0.18 * (1 - t));

      this.ctx.save();
      this.ctx.globalAlpha = brightness * (isGhost ? 0.4 : 1);

      // Subtle darker inner for 3D depth
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10 * brightness;
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(centers[i].cx, centers[i].cy, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Bright highlight spot for roundness
      const hlColor = interpolateColor(color, '#FFFFFF', 0.4);
      this.ctx.globalAlpha = 0.25 * brightness * (isGhost ? 0.4 : 1);
      this.ctx.fillStyle = hlColor;
      this.ctx.beginPath();
      this.ctx.arc(centers[i].cx - radius * 0.25, centers[i].cy - radius * 0.25,
        radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // --- Draw scale/belly pattern along the body ---
    for (let i = 1; i < total; i += 2) {
      const t = i / Math.max(1, total - 1);
      const brightness = 1.0 - t * 0.5;
      const radius = this.cellSize * (0.12 + 0.08 * (1 - t));

      this.ctx.save();
      this.ctx.globalAlpha = 0.15 * brightness * (isGhost ? 0.4 : 1);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(centers[i].cx, centers[i].cy, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // --- Draw the head ---
    if (total > 0) {
      const headColor = isGhost
        ? COLORS.purple
        : activeEffects.has(PowerUpType.Shield) ? COLORS.cyan : COLORS.cyan;
      const headRadius = this.cellSize * 0.5;
      const hx = centers[0].cx;
      const hy = centers[0].cy;

      // Shield aura
      if (activeEffects.has(PowerUpType.Shield)) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        drawNeonCircle(this.ctx, hx, hy, headRadius + 6, COLORS.cyan, 25);
        this.ctx.restore();
      }

      // Head body (slightly larger, brighter)
      this.ctx.save();
      this.ctx.globalAlpha = isGhost ? 0.5 : 1;
      this.ctx.shadowColor = headColor;
      this.ctx.shadowBlur = 22;
      this.ctx.fillStyle = headColor;
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fill(); // double for glow

      // Head highlight for 3D roundness
      const headHL = interpolateColor(headColor, '#FFFFFF', 0.5);
      this.ctx.globalAlpha = 0.35 * (isGhost ? 0.5 : 1);
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = headHL;
      this.ctx.beginPath();
      this.ctx.arc(hx - headRadius * 0.2, hy - headRadius * 0.2,
        headRadius * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // --- Eyes ---
      // Determine direction for eye placement
      let eyeAngle = 0;
      switch (direction) {
        case Direction.Right: eyeAngle = 0; break;
        case Direction.Left: eyeAngle = Math.PI; break;
        case Direction.Up: eyeAngle = -Math.PI / 2; break;
        case Direction.Down: eyeAngle = Math.PI / 2; break;
      }

      const eyeOffset = headRadius * 0.4;
      const eyeSpread = Math.PI * 0.35;
      const eyeRadius = headRadius * 0.2;
      const pupilRadius = eyeRadius * 0.55;

      for (const side of [-1, 1]) {
        const ea = eyeAngle + side * eyeSpread;
        const ex = hx + Math.cos(ea) * eyeOffset;
        const ey = hy + Math.sin(ea) * eyeOffset;

        // Eye white (slightly off-white neon)
        this.ctx.save();
        this.ctx.globalAlpha = isGhost ? 0.5 : 0.95;
        this.ctx.shadowColor = '#FFFFFF';
        this.ctx.shadowBlur = 4;
        this.ctx.fillStyle = '#EEFFEE';
        this.ctx.beginPath();
        this.ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupil (looking in movement direction)
        const pupilOffX = Math.cos(eyeAngle) * eyeRadius * 0.25;
        const pupilOffY = Math.sin(eyeAngle) * eyeRadius * 0.25;
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(ex + pupilOffX, ey + pupilOffY, pupilRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupil shine
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(ex + pupilOffX - pupilRadius * 0.3, ey + pupilOffY - pupilRadius * 0.3,
          pupilRadius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
      }

      // --- Tongue (flickers occasionally) ---
      const tongueFlicker = Math.sin(performance.now() * 0.008) > 0.6;
      if (tongueFlicker) {
        const tongueLen = headRadius * 0.7;
        const tongueBaseX = hx + Math.cos(eyeAngle) * headRadius * 0.85;
        const tongueBaseY = hy + Math.sin(eyeAngle) * headRadius * 0.85;
        const tongueTipX = tongueBaseX + Math.cos(eyeAngle) * tongueLen;
        const tongueTipY = tongueBaseY + Math.sin(eyeAngle) * tongueLen;
        const forkLen = tongueLen * 0.35;
        const forkAngle = 0.4;

        this.ctx.save();
        this.ctx.globalAlpha = isGhost ? 0.4 : 0.9;
        this.ctx.strokeStyle = COLORS.red;
        this.ctx.shadowColor = COLORS.red;
        this.ctx.shadowBlur = 5;
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';

        // Tongue stem
        this.ctx.beginPath();
        this.ctx.moveTo(tongueBaseX, tongueBaseY);
        this.ctx.lineTo(tongueTipX, tongueTipY);
        this.ctx.stroke();

        // Fork
        this.ctx.beginPath();
        this.ctx.moveTo(tongueTipX, tongueTipY);
        this.ctx.lineTo(
          tongueTipX + Math.cos(eyeAngle + forkAngle) * forkLen,
          tongueTipY + Math.sin(eyeAngle + forkAngle) * forkLen,
        );
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(tongueTipX, tongueTipY);
        this.ctx.lineTo(
          tongueTipX + Math.cos(eyeAngle - forkAngle) * forkLen,
          tongueTipY + Math.sin(eyeAngle - forkAngle) * forkLen,
        );
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    // --- Tail tip taper ---
    if (total >= 2) {
      const tailSeg = centers[total - 1];
      const preTail = centers[total - 2];
      const tailAngle = Math.atan2(tailSeg.cy - preTail.cy, tailSeg.cx - preTail.cx);
      const tipX = tailSeg.cx + Math.cos(tailAngle) * this.cellSize * 0.3;
      const tipY = tailSeg.cy + Math.sin(tailAngle) * this.cellSize * 0.3;
      const tailColor = interpolateColor(COLORS.cyan, COLORS.magenta, 1);

      this.ctx.save();
      this.ctx.globalAlpha = 0.4 * (isGhost ? 0.4 : 1);
      this.ctx.shadowColor = tailColor;
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = tailColor;
      this.ctx.beginPath();
      this.ctx.arc(tipX, tipY, this.cellSize * 0.12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  renderFood(food: FoodItem, time: number): void {
    const s = this.cellSize;
    const baseCx = food.x * s + s / 2;
    const cy = food.y * s + s / 2;
    // Smooth sub-cell offset for runners
    const cx = baseCx + (food.runnerOffset ?? 0);

    this.ctx.save();
    this.ctx.shadowColor = '#FFFFFF';
    this.ctx.shadowBlur = 14;
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const scale = s * 0.035;
    const headR = scale * 2.2;

    if (food.isRunner) {
      // --- Running stickman ---
      const dir = food.runnerDir ?? 1;
      const runCycle = time * 0.012; // running frequency
      const swing = Math.sin(runCycle);  // -1..1

      // Slight forward lean
      const lean = dir * s * 0.03;

      const bodyTop = cy - s * 0.2;
      const bodyBot = cy + s * 0.15;
      const headY = bodyTop - headR - scale * 0.5;

      // Head
      this.ctx.lineWidth = scale * 1.6;
      this.ctx.beginPath();
      this.ctx.arc(cx + lean * 0.5, headY, headR, 0, Math.PI * 2);
      this.ctx.stroke();

      // Body (torso — leaning forward)
      this.ctx.lineWidth = scale * 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(cx + lean * 0.3, bodyTop);
      this.ctx.lineTo(cx, bodyBot);
      this.ctx.stroke();

      // Arms — swing opposite to legs
      const armY = bodyTop + (bodyBot - bodyTop) * 0.2;
      const armLen = s * 0.16;
      const armSwing = swing * 0.8; // radians

      this.ctx.lineWidth = scale * 1.6;
      // Left arm
      this.ctx.beginPath();
      this.ctx.moveTo(cx + lean * 0.2, armY);
      this.ctx.lineTo(
        cx + lean * 0.2 + Math.sin(armSwing) * armLen,
        armY + Math.cos(armSwing) * armLen,
      );
      this.ctx.stroke();
      // Right arm
      this.ctx.beginPath();
      this.ctx.moveTo(cx + lean * 0.2, armY);
      this.ctx.lineTo(
        cx + lean * 0.2 + Math.sin(-armSwing) * armLen,
        armY + Math.cos(-armSwing) * armLen,
      );
      this.ctx.stroke();

      // Legs — swing opposite to arms
      const legLen = s * 0.2;
      const legSwing = -swing * 0.7; // opposite to arms

      this.ctx.lineWidth = scale * 1.6;
      // Left leg
      this.ctx.beginPath();
      this.ctx.moveTo(cx, bodyBot);
      this.ctx.lineTo(
        cx + Math.sin(legSwing) * legLen,
        bodyBot + Math.cos(legSwing) * legLen,
      );
      this.ctx.stroke();
      // Right leg
      this.ctx.beginPath();
      this.ctx.moveTo(cx, bodyBot);
      this.ctx.lineTo(
        cx + Math.sin(-legSwing) * legLen,
        bodyBot + Math.cos(-legSwing) * legLen,
      );
      this.ctx.stroke();
    } else {
      // --- Static stickman (original) ---
      const bounce = Math.sin(time * 0.005 + food.pulsePhase) * s * 0.02;
      const bodyTop = cy - s * 0.2 + bounce;
      const bodyBot = cy + s * 0.15 + bounce;
      const headY = bodyTop - headR - scale * 0.5;

      // Head
      this.ctx.lineWidth = scale * 1.6;
      this.ctx.beginPath();
      this.ctx.arc(cx, headY, headR, 0, Math.PI * 2);
      this.ctx.stroke();

      // Body
      this.ctx.lineWidth = scale * 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, bodyTop);
      this.ctx.lineTo(cx, bodyBot);
      this.ctx.stroke();

      // Arms
      const armY = bodyTop + (bodyBot - bodyTop) * 0.25;
      const armSpread = s * 0.18;
      const armDrop = s * 0.06;
      this.ctx.lineWidth = scale * 1.6;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - armSpread, armY + armDrop);
      this.ctx.lineTo(cx, armY);
      this.ctx.lineTo(cx + armSpread, armY + armDrop);
      this.ctx.stroke();

      // Legs
      const legSpread = s * 0.15;
      const legDrop = s * 0.18;
      this.ctx.lineWidth = scale * 1.6;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - legSpread, bodyBot + legDrop);
      this.ctx.lineTo(cx, bodyBot);
      this.ctx.lineTo(cx + legSpread, bodyBot + legDrop);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  renderPowerUp(powerUp: PowerUpItem, time: number): void {
    const color = POWERUP_COLORS[powerUp.type];
    const cx = powerUp.x * this.cellSize + this.cellSize / 2;
    const cy = powerUp.y * this.cellSize + this.cellSize / 2;

    // Fade out as it nears expiry
    const elapsed = performance.now() - powerUp.spawnTime;
    const remaining = powerUp.timeoutDuration - elapsed;
    const fadeAlpha = remaining < 3000 ? remaining / 3000 : 1;
    const blink = remaining < 2000 ? (Math.sin(time * 0.02) > 0 ? 1 : 0.3) : 1;

    this.ctx.save();
    this.ctx.globalAlpha = fadeAlpha * blink;

    // Diamond shape
    const size = this.cellSize * 0.4;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 18;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - size);
    this.ctx.lineTo(cx + size, cy);
    this.ctx.lineTo(cx, cy + size);
    this.ctx.lineTo(cx - size, cy);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fill();

    // Label
    const labels: Record<PowerUpType, string> = {
      [PowerUpType.Ghost]: 'G',
      [PowerUpType.SlowDown]: 'S',
      [PowerUpType.DoublePoints]: '2x',
      [PowerUpType.Magnet]: 'M',
      [PowerUpType.Shield]: 'SH',
    };
    this.ctx.fillStyle = '#000';
    this.ctx.font = `bold ${this.cellSize * 0.3}px "Courier New", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(labels[powerUp.type], cx, cy);

    this.ctx.restore();
  }

  renderObstacles(obstacles: ObstacleData[], time: number): void {
    const pulse = 0.7 + Math.sin(time * 0.003) * 0.3;
    for (const obs of obstacles) {
      for (const seg of obs.segments) {
        const x = seg.x * this.cellSize;
        const y = seg.y * this.cellSize;
        drawNeonRect(this.ctx, x + 1, y + 1,
          this.cellSize - 2, this.cellSize - 2,
          COLORS.red, 10 * pulse, 2);
      }
    }
  }

  renderParticles(): void {
    this.particles.render(this.ctx);
  }
}
