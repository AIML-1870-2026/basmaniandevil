import { ScreenHandler } from '../types';
import { COLORS } from '../constants';
import { drawNeonText } from '../rendering/NeonEffects';
import { UIRenderer } from '../rendering/UIRenderer';
import { hexToRgba } from '../utils/color';

export class GameOverScreen implements ScreenHandler {
  private time = 0;
  private uiRenderer: UIRenderer;
  private canvasSize: number;
  private score = 0;
  private level = 1;
  private foodEaten = 0;
  private maxCombo = 0;
  private isHighScore = false;
  private onRestart: () => void;
  private onMenu: () => void;
  private onSubmitScore: (name: string) => void;
  private selectedOption = 0;
  private scoreSubmitted = false;
  private displayScore = 0;

  constructor(
    canvasSize: number,
    onRestart: () => void,
    onMenu: () => void,
    onSubmitScore: (name: string) => void,
  ) {
    this.canvasSize = canvasSize;
    this.uiRenderer = new UIRenderer();
    this.onRestart = onRestart;
    this.onMenu = onMenu;
    this.onSubmitScore = onSubmitScore;
  }

  setStats(score: number, level: number, foodEaten: number, maxCombo: number, isHighScore: boolean): void {
    this.score = score;
    this.level = level;
    this.foodEaten = foodEaten;
    this.maxCombo = maxCombo;
    this.isHighScore = isHighScore;
  }

  enter(): void {
    this.time = 0;
    this.selectedOption = 0;
    this.scoreSubmitted = false;
    this.displayScore = 0;
  }

  exit(): void {}

  update(dt: number): void {
    this.time += dt;

    // Score count-up animation
    if (this.displayScore < this.score) {
      this.displayScore += Math.max(1, Math.floor(this.score * dt / 1500));
      if (this.displayScore > this.score) this.displayScore = this.score;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.uiRenderer.drawOverlay(ctx, this.canvasSize, 0.85);

    const cx = this.canvasSize / 2;
    const titleSize = Math.max(22, this.canvasSize * 0.065);

    // Glitch effect on title
    const glitchX = Math.sin(this.time * 0.01) > 0.95 ? (Math.random() - 0.5) * 6 : 0;
    drawNeonText(ctx, 'GAME OVER', cx + glitchX, this.canvasSize * 0.2, COLORS.red, titleSize, 25);

    // Score
    const scoreSize = Math.max(16, this.canvasSize * 0.045);
    drawNeonText(ctx, `${this.displayScore}`, cx, this.canvasSize * 0.35, COLORS.yellow, scoreSize, 18);

    // High score indicator
    if (this.isHighScore && !this.scoreSubmitted) {
      const hsSize = Math.max(10, this.canvasSize * 0.025);
      const blink = Math.sin(this.time * 0.006) > 0;
      if (blink) {
        drawNeonText(ctx, 'NEW HIGH SCORE!', cx, this.canvasSize * 0.42, COLORS.yellow, hsSize, 15);
      }
      drawNeonText(ctx, 'PRESS [H] TO SAVE SCORE', cx, this.canvasSize * 0.47,
        hexToRgba(COLORS.green, 0.7), hsSize * 0.8, 5);
    }

    // Stats breakdown
    const statSize = Math.max(9, this.canvasSize * 0.022);
    const statsY = this.canvasSize * 0.54;
    const lineH = statSize * 2;

    drawNeonText(ctx, `LEVEL REACHED: ${this.level}`, cx, statsY, COLORS.white, statSize, 6);
    drawNeonText(ctx, `FOOD CONSUMED: ${this.foodEaten}`, cx, statsY + lineH, COLORS.white, statSize, 6);
    drawNeonText(ctx, `MAX COMBO: x${this.maxCombo}`, cx, statsY + lineH * 2, COLORS.white, statSize, 6);

    // Options
    const options = ['RETRY', 'MAIN MENU'];
    const optSize = Math.max(11, this.canvasSize * 0.028);
    const btnW = this.canvasSize * 0.3;
    const btnH = this.canvasSize * 0.055;
    const optY = this.canvasSize * 0.76;
    const gap = btnH * 1.8;

    for (let i = 0; i < options.length; i++) {
      const color = i === this.selectedOption ? COLORS.cyan : hexToRgba(COLORS.white, 0.6);
      this.uiRenderer.drawButton(ctx, options[i], cx, optY + i * gap, btnW, btnH,
        color, optSize, i === this.selectedOption);
    }

    // Navigation hint at bottom
    const hintSize = Math.max(8, this.canvasSize * 0.017);
    const hintBlink = Math.sin(this.time * 0.004) > 0;
    if (hintBlink) {
      drawNeonText(ctx, 'PRESS ENTER TO PLAY AGAIN', cx, this.canvasSize * 0.93,
        hexToRgba(COLORS.green, 0.7), hintSize, 8);
    }
  }

  handleInput(key: string): void {
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.selectedOption = (this.selectedOption - 1 + 2) % 2;
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.selectedOption = (this.selectedOption + 1) % 2;
    } else if (key === 'Enter') {
      if (this.selectedOption === 0) this.onRestart();
      else this.onMenu();
    } else if (key === 'r' || key === 'R') {
      this.onRestart();
    } else if ((key === 'h' || key === 'H') && this.isHighScore && !this.scoreSubmitted) {
      const name = prompt('Enter your name (3 chars):') || 'AAA';
      this.onSubmitScore(name.substring(0, 6).toUpperCase() || 'AAA');
      this.scoreSubmitted = true;
    }
  }
}
