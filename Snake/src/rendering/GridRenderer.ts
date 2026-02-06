import { COLORS } from '../constants';
import { hexToRgba } from '../utils/color';

export class GridRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    cellSize: number,
    cols: number,
    rows: number,
    time: number,
  ): void {
    const canvasW = cols * cellSize;
    const canvasH = rows * cellSize;

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Grid lines with pulse — more visible
    const pulse = 0.25 + Math.sin(time * 0.001) * 0.08;
    ctx.save();
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 2;
    ctx.strokeStyle = hexToRgba(COLORS.cyan, pulse);
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    for (let x = 0; x <= cols; x++) {
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvasH);
    }
    for (let y = 0; y <= rows; y++) {
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvasW, y * cellSize);
    }
    ctx.stroke();
    ctx.restore();

    // Border glow
    ctx.save();
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = hexToRgba(COLORS.cyan, 0.5);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, canvasW, canvasH);
    ctx.restore();

    // Scanline effect
    const scanY = ((time * 0.05) % canvasH);
    const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    scanGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
    scanGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.045)');
    scanGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 30, canvasW, 60);
  }
}
