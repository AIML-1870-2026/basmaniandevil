import { GameScreen, ScreenHandler } from '../types';

export class StateMachine {
  private screens: Map<GameScreen, ScreenHandler> = new Map();
  private _current: GameScreen = GameScreen.Start;

  register(screen: GameScreen, handler: ScreenHandler): void {
    this.screens.set(screen, handler);
  }

  get current(): GameScreen {
    return this._current;
  }

  get currentHandler(): ScreenHandler | undefined {
    return this.screens.get(this._current);
  }

  transitionTo(next: GameScreen): void {
    const prev = this._current;
    const prevHandler = this.screens.get(prev);
    const nextHandler = this.screens.get(next);

    if (prevHandler) prevHandler.exit(next);
    this._current = next;
    if (nextHandler) nextHandler.enter(prev);
  }

  update(dt: number): void {
    this.currentHandler?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    this.currentHandler?.render(ctx, alpha);
  }

  handleInput(key: string, pressed: boolean): void {
    this.currentHandler?.handleInput(key, pressed);
  }
}
