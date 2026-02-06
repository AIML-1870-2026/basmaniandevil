import { GameSettings, Difficulty, BoundaryMode } from '../types';
import { DEFAULT_GRID_SIZE } from '../constants';

const STORAGE_KEY = 'neon-serpent-settings';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: Difficulty.Normal,
  gridSize: DEFAULT_GRID_SIZE,
  boundaryMode: BoundaryMode.Wrap,
};

export class SettingsManager {
  private settings: GameSettings;

  constructor() {
    this.settings = this.load();
  }

  get(): GameSettings {
    return { ...this.settings };
  }

  save(settings: GameSettings): void {
    this.settings = { ...settings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // localStorage not available
    }
  }

  private load(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          difficulty: parsed.difficulty ?? DEFAULT_SETTINGS.difficulty,
          gridSize: parsed.gridSize ?? DEFAULT_SETTINGS.gridSize,
          boundaryMode: parsed.boundaryMode ?? DEFAULT_SETTINGS.boundaryMode,
        };
      }
    } catch {
      // fall through
    }
    return { ...DEFAULT_SETTINGS };
  }
}
