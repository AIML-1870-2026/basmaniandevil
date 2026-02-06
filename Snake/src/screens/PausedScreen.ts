import { ScreenHandler } from '../types';
import { COLORS } from '../constants';
import { drawNeonText } from '../rendering/NeonEffects';
import { UIRenderer } from '../rendering/UIRenderer';
import { hexToRgba } from '../utils/color';

export class PausedScreen implements ScreenHandler {
  private time = 0;
  private uiRenderer: UIRenderer;
  private canvasSize: number;
  private score: number;
  private level: number;
  private onResume: () => void;
  private onRestart: () => void;
  private onMenu: () => void;
  private selectedOption = 0;

  constructor(
    canvasSize: number,
    onResume: () => void,
    onRestart: () => void,
    onMenu: () => void,
  ) {
    this.canvasSize = canvasSize;
    this.uiRenderer = new UIRenderer();
    this.onResume = onResume;
    this.onRestart = onRestart;
    this.onMenu = onMenu;
    this.score = 0;
    this.level = 1;
  }

  setStats(score: number, level: number): void {
    this.score = score;
    this.level = level;
  }

  enter(): void {
    this.time = 0;
    this.selectedOption = 0;
  }

  exit(): void {}

  update(dt: number): void {
    this.time += dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Dark overlay
    this.uiRenderer.drawOverlay(ctx, this.canvasSize, 0.8);

    const cx = this.canvasSize / 2;
    const titleSize = Math.max(20, this.canvasSize * 0.06);
    const glow = 20 + Math.sin(this.time * 0.004) * 8;

    drawNeonText(ctx, 'PAUSED', cx, this.canvasSize * 0.3, COLORS.cyan, titleSize, glow);

    // Stats
    const statSize = Math.max(10, this.canvasSize * 0.025);
    drawNeonText(ctx, `SCORE: ${this.score}`, cx, this.canvasSize * 0.42, COLORS.white, statSize, 8);
    drawNeonText(ctx, `LEVEL: ${this.level}`, cx, this.canvasSize * 0.48, COLORS.white, statSize, 8);

    // Options
    const options = ['RESUME', 'RESTART', 'MAIN MENU'];
    const optSize = Math.max(11, this.canvasSize * 0.028);
    const btnW = this.canvasSize * 0.35;
    const btnH = this.canvasSize * 0.06;
    const startY = this.canvasSize * 0.58;
    const gap = btnH * 1.6;

    for (let i = 0; i < options.length; i++) {
      const color = i === this.selectedOption ? COLORS.cyan : hexToRgba(COLORS.white, 0.6);
      this.uiRenderer.drawButton(ctx, options[i], cx, startY + i * gap, btnW, btnH,
        color, optSize, i === this.selectedOption);
    }

    // Hint
    const hintSize = Math.max(8, this.canvasSize * 0.016);
    drawNeonText(ctx, 'PRESS SPACE TO RESUME', cx, this.canvasSize * 0.92,
      hexToRgba(COLORS.white, 0.4), hintSize, 3);
  }

  handleInput(key: string): void {
    if (key === ' ' || key === 'Escape') {
      this.onResume();
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.selectedOption = (this.selectedOption - 1 + 3) % 3;
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.selectedOption = (this.selectedOption + 1) % 3;
    } else if (key === 'Enter') {
      if (this.selectedOption === 0) this.onResume();
      else if (this.selectedOption === 1) this.onRestart();
      else if (this.selectedOption === 2) this.onMenu();
    }
  }
}
