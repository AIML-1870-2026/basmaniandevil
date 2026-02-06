import { drawNeonText, drawNeonRectOutline } from './NeonEffects';
import { COLORS } from '../constants';
import { hexToRgba } from '../utils/color';

export class UIRenderer {
  drawHUD(
    ctx: CanvasRenderingContext2D,
    canvasSize: number,
    score: number,
    level: number,
    combo: number,
    comboTimer: number,
    comboTimerMax: number,
    activePowerUp: string | null,
    foodEaten: number,
    foodPerLevel: number,
  ): void {
    const pad = 10;
    const fontSize = Math.max(12, canvasSize * 0.028);

    // Score - top right
    drawNeonText(ctx, `SCORE: ${score}`, canvasSize - pad, pad + fontSize / 2,
      COLORS.cyan, fontSize, 15, 'right', 'middle');

    // Level - top left
    drawNeonText(ctx, `LVL ${level}`, pad, pad + fontSize / 2,
      COLORS.magenta, fontSize, 15, 'left', 'middle');

    // Level progress bar
    const barY = pad + fontSize + 6;
    const barW = canvasSize * 0.15;
    const barH = 4;
    const progress = foodEaten / foodPerLevel;

    ctx.fillStyle = hexToRgba(COLORS.magenta, 0.3);
    ctx.fillRect(pad, barY, barW, barH);
    ctx.fillStyle = COLORS.magenta;
    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur = 6;
    ctx.fillRect(pad, barY, barW * Math.min(1, progress), barH);
    ctx.shadowBlur = 0;

    // Combo display - bottom center
    if (combo > 1) {
      const comboY = canvasSize - pad - fontSize;
      const comboColor = combo >= 5 ? COLORS.yellow : COLORS.orange;
      drawNeonText(ctx, `COMBO x${combo}`, canvasSize / 2, comboY,
        comboColor, fontSize * 1.2, 20);

      // Combo decay bar
      if (comboTimerMax > 0) {
        const decayW = canvasSize * 0.2;
        const decayH = 3;
        const decayX = canvasSize / 2 - decayW / 2;
        const decayY = comboY + fontSize * 0.8;
        const decayProgress = comboTimer / comboTimerMax;

        ctx.fillStyle = hexToRgba(comboColor, 0.3);
        ctx.fillRect(decayX, decayY, decayW, decayH);
        ctx.fillStyle = comboColor;
        ctx.shadowColor = comboColor;
        ctx.shadowBlur = 4;
        ctx.fillRect(decayX, decayY, decayW * decayProgress, decayH);
        ctx.shadowBlur = 0;
      }
    }

    // Active power-up indicator - top center
    if (activePowerUp) {
      drawNeonText(ctx, `[${activePowerUp.toUpperCase()}]`, canvasSize / 2, pad + fontSize / 2,
        COLORS.purple, fontSize * 0.9, 12);
    }
  }

  drawButton(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    w: number, h: number,
    color: string,
    fontSize: number,
    selected = false,
  ): void {
    const glow = selected ? 20 : 8;
    drawNeonRectOutline(ctx, x - w / 2, y - h / 2, w, h, color, selected ? 2 : 1, glow);
    drawNeonText(ctx, text, x, y, color, fontSize, glow);
  }

  drawOverlay(ctx: CanvasRenderingContext2D, canvasSize: number, opacity = 0.8): void {
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }
}
