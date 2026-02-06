import { ScreenHandler, Difficulty, BoundaryMode, GameSettings } from '../types';
import { COLORS } from '../constants';
import { drawNeonText } from '../rendering/NeonEffects';
import { UIRenderer } from '../rendering/UIRenderer';
import { hexToRgba } from '../utils/color';

interface SettingOption {
  label: string;
  values: string[];
  current: number;
}

export class SettingsScreen implements ScreenHandler {
  private time = 0;
  private uiRenderer: UIRenderer;
  private canvasSize: number;
  private settings: GameSettings;
  private onBack: () => void;
  private onSave: (settings: GameSettings) => void;
  private selectedRow = 0;
  private options: SettingOption[];

  constructor(
    canvasSize: number,
    settings: GameSettings,
    onBack: () => void,
    onSave: (settings: GameSettings) => void,
  ) {
    this.canvasSize = canvasSize;
    this.settings = { ...settings };
    this.uiRenderer = new UIRenderer();
    this.onBack = onBack;
    this.onSave = onSave;

    this.options = [
      {
        label: 'DIFFICULTY',
        values: ['EASY', 'NORMAL', 'HARD'],
        current: [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard].indexOf(settings.difficulty),
      },
      {
        label: 'BOUNDARY',
        values: ['WRAP', 'WALL'],
        current: settings.boundaryMode === BoundaryMode.Wrap ? 0 : 1,
      },
      {
        label: 'GRID SIZE',
        values: ['15', '20', '25', '30'],
        current: [15, 20, 25, 30].indexOf(settings.gridSize),
      },
    ];

    if (this.options[2].current === -1) this.options[2].current = 1;
  }

  enter(): void {
    this.time = 0;
    this.selectedRow = 0;
  }

  exit(): void {}

  update(dt: number): void {
    this.time += dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cx = this.canvasSize / 2;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

    const titleSize = Math.max(18, this.canvasSize * 0.05);
    drawNeonText(ctx, 'SETTINGS', cx, this.canvasSize * 0.15, COLORS.magenta, titleSize, 20);

    const optSize = Math.max(11, this.canvasSize * 0.028);
    const rowH = this.canvasSize * 0.1;
    const startY = this.canvasSize * 0.32;
    const labelX = cx - this.canvasSize * 0.2;
    const valueX = cx + this.canvasSize * 0.15;

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const y = startY + i * rowH;
      const isSelected = i === this.selectedRow;
      const color = isSelected ? COLORS.cyan : hexToRgba(COLORS.white, 0.6);

      drawNeonText(ctx, opt.label, labelX, y, color, optSize, isSelected ? 12 : 5, 'left');

      const valueColor = isSelected ? COLORS.yellow : hexToRgba(COLORS.white, 0.7);
      const arrowColor = isSelected ? COLORS.cyan : hexToRgba(COLORS.white, 0.3);
      const arrowSize = optSize * 0.8;

      drawNeonText(ctx, '<', valueX - this.canvasSize * 0.1, y, arrowColor, arrowSize, 5);
      drawNeonText(ctx, opt.values[opt.current], valueX, y, valueColor, optSize, isSelected ? 12 : 5);
      drawNeonText(ctx, '>', valueX + this.canvasSize * 0.1, y, arrowColor, arrowSize, 5);
    }

    // Back button
    const backY = this.canvasSize * 0.75;
    const isBackSelected = this.selectedRow === this.options.length;
    const backColor = isBackSelected ? COLORS.green : hexToRgba(COLORS.white, 0.6);
    this.uiRenderer.drawButton(ctx, 'SAVE & BACK', cx, backY,
      this.canvasSize * 0.35, this.canvasSize * 0.06,
      backColor, optSize, isBackSelected);

    const hintSize = Math.max(8, this.canvasSize * 0.016);
    drawNeonText(ctx, 'ARROWS TO NAVIGATE | ENTER TO CONFIRM', cx, this.canvasSize * 0.92,
      hexToRgba(COLORS.white, 0.3), hintSize, 3);
  }

  handleInput(key: string): void {
    const totalRows = this.options.length + 1;

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.selectedRow = (this.selectedRow - 1 + totalRows) % totalRows;
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.selectedRow = (this.selectedRow + 1) % totalRows;
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      if (this.selectedRow < this.options.length) {
        const opt = this.options[this.selectedRow];
        opt.current = (opt.current - 1 + opt.values.length) % opt.values.length;
      }
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (this.selectedRow < this.options.length) {
        const opt = this.options[this.selectedRow];
        opt.current = (opt.current + 1) % opt.values.length;
      }
    } else if (key === 'Enter') {
      this.applyAndBack();
    } else if (key === 'Escape') {
      this.onBack();
    }
  }

  private applyAndBack(): void {
    const difficulties = [Difficulty.Easy, Difficulty.Normal, Difficulty.Hard];
    const boundaries = [BoundaryMode.Wrap, BoundaryMode.Wall];
    const gridSizes = [15, 20, 25, 30];

    this.settings.difficulty = difficulties[this.options[0].current];
    this.settings.boundaryMode = boundaries[this.options[1].current];
    this.settings.gridSize = gridSizes[this.options[2].current];

    this.onSave(this.settings);
    this.onBack();
  }
}
