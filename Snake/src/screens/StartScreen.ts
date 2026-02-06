import { ScreenHandler, HighScoreEntry } from '../types';
import { COLORS } from '../constants';
import { drawNeonText } from '../rendering/NeonEffects';
import { hexToRgba } from '../utils/color';

export class StartScreen implements ScreenHandler {
  private time = 0;
  private highScores: HighScoreEntry[] = [];
  private onStart: () => void;
  private onSettings: () => void;
  private canvasSize: number;

  constructor(
    canvasSize: number,
    highScores: HighScoreEntry[],
    onStart: () => void,
    onSettings: () => void,
  ) {
    this.canvasSize = canvasSize;
    this.highScores = highScores;
    this.onStart = onStart;
    this.onSettings = onSettings;
  }

  updateHighScores(scores: HighScoreEntry[]): void {
    this.highScores = scores;
  }

  enter(): void {
    this.time = 0;
  }

  exit(): void {}

  update(dt: number): void {
    this.time += dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cx = this.canvasSize / 2;

    // Title
    const titleSize = Math.max(24, this.canvasSize * 0.07);
    const titleGlow = 25 + Math.sin(this.time * 0.003) * 10;
    drawNeonText(ctx, 'NEON', cx, this.canvasSize * 0.18, COLORS.cyan, titleSize, titleGlow);
    drawNeonText(ctx, 'SERPENT', cx, this.canvasSize * 0.18 + titleSize * 1.2, COLORS.magenta, titleSize, titleGlow);

    // Subtitle
    const subSize = Math.max(10, this.canvasSize * 0.025);
    drawNeonText(ctx, 'A CYBERPUNK SNAKE GAME', cx, this.canvasSize * 0.35, COLORS.blue, subSize, 8);

    // Start prompt (blinking)
    const blink = Math.sin(this.time * 0.005) > 0;
    if (blink) {
      const promptSize = Math.max(12, this.canvasSize * 0.03);
      drawNeonText(ctx, 'PRESS ENTER TO START', cx, this.canvasSize * 0.5, COLORS.green, promptSize, 15);
    }

    // Settings hint
    const hintSize = Math.max(9, this.canvasSize * 0.02);
    drawNeonText(ctx, 'PRESS [S] FOR SETTINGS', cx, this.canvasSize * 0.57, hexToRgba(COLORS.white, 0.5), hintSize, 5);

    // High scores
    if (this.highScores.length > 0) {
      const scoreY = this.canvasSize * 0.65;
      const lineH = Math.max(14, this.canvasSize * 0.035);
      const labelSize = Math.max(11, this.canvasSize * 0.025);

      drawNeonText(ctx, '- HIGH SCORES -', cx, scoreY, COLORS.yellow, labelSize, 10);

      const top5 = this.highScores.slice(0, 5);
      for (let i = 0; i < top5.length; i++) {
        const entry = top5[i];
        const y = scoreY + lineH * (i + 1.5);
        const entryAlpha = Math.min(1, (this.time - i * 100) / 500);
        if (entryAlpha <= 0) continue;

        ctx.save();
        ctx.globalAlpha = entryAlpha;
        const entrySize = Math.max(9, this.canvasSize * 0.02);
        const text = `${i + 1}. ${entry.name.padEnd(6)} ${String(entry.score).padStart(6)} LVL${entry.level}`;
        drawNeonText(ctx, text, cx, y, COLORS.white, entrySize, 5);
        ctx.restore();
      }
    }

    // Controls info at bottom
    const ctrlSize = Math.max(8, this.canvasSize * 0.016);
    drawNeonText(ctx, 'ARROW KEYS / WASD TO MOVE | SPACE TO PAUSE', cx, this.canvasSize * 0.95,
      hexToRgba(COLORS.cyan, 0.4), ctrlSize, 3);
  }

  handleInput(key: string): void {
    if (key === 'Enter' || key === ' ') {
      this.onStart();
    } else if (key === 's' || key === 'S') {
      this.onSettings();
    }
  }
}
