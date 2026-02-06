import { HighScoreEntry } from '../types';
import { MAX_HIGH_SCORES } from '../constants';

const STORAGE_KEY = 'neon-serpent-highscores';

export class HighScoreManager {
  private scores: HighScoreEntry[] = [];

  constructor() {
    this.load();
  }

  getScores(): HighScoreEntry[] {
    return [...this.scores];
  }

  isHighScore(score: number): boolean {
    if (this.scores.length < MAX_HIGH_SCORES) return score > 0;
    return score > this.scores[this.scores.length - 1].score;
  }

  addScore(name: string, score: number, level: number): void {
    const entry: HighScoreEntry = {
      name,
      score,
      level,
      date: new Date().toISOString().split('T')[0],
    };

    this.scores.push(entry);
    this.scores.sort((a, b) => b.score - a.score);
    if (this.scores.length > MAX_HIGH_SCORES) {
      this.scores = this.scores.slice(0, MAX_HIGH_SCORES);
    }

    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.scores = JSON.parse(raw);
      }
    } catch {
      this.scores = [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
    } catch {
      // localStorage not available
    }
  }
}
