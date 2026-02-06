export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private running = false;
  private rafId = 0;
  private _tickRate: number;

  private updateFn: (dt: number) => void;
  private renderFn: (alpha: number) => void;

  constructor(
    tickRate: number,
    updateFn: (dt: number) => void,
    renderFn: (alpha: number) => void,
  ) {
    this._tickRate = tickRate;
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  stop(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  get tickRate(): number {
    return this._tickRate;
  }

  set tickRate(value: number) {
    this._tickRate = value;
  }

  private loop(now: number): void {
    if (!this.running) return;

    const dt = Math.min(now - this.lastTime, 200);
    this.lastTime = now;

    this.accumulator += dt;
    while (this.accumulator >= this._tickRate) {
      this.updateFn(this._tickRate);
      this.accumulator -= this._tickRate;
    }

    const alpha = this.accumulator / this._tickRate;
    this.renderFn(alpha);

    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }
}
