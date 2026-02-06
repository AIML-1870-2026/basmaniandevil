import { Game } from './core/Game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

const game = new Game(canvas);
game.start();

// Handle window resize
window.addEventListener('resize', () => {
  const size = canvas.width;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / size, vh / size) * 0.95;
  canvas.style.width = `${size * scale}px`;
  canvas.style.height = `${size * scale}px`;
});
