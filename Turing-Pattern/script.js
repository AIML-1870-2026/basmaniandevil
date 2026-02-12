// ── Configuration ────────────────────────────────────────────────────────────
const N = 128; // grid resolution (lower = thicker, bolder patterns)
const Da = 1.0;
const Db = 0.5;
let F = 0.0545;
let K = 0.062;
let stepsPerFrame = 3;
let paused = false;
let colorScheme = 'classic';
let drawChemical = 'B'; // 'A' or 'B'
let brushSize = 10;

// ── Grids ────────────────────────────────────────────────────────────────────
let gridA = new Float32Array(N * N);
let gridB = new Float32Array(N * N);
let nextA = new Float32Array(N * N);
let nextB = new Float32Array(N * N);

function initGrid() {
  gridA.fill(1);
  gridB.fill(0);
  // Seed random rectangles to break symmetry
  const numSeeds = 12 + Math.floor(Math.random() * 8);
  for (let s = 0; s < numSeeds; s++) {
    const cx = Math.floor(Math.random() * N);
    const cy = Math.floor(Math.random() * N);
    const r = 3 + Math.floor(Math.random() * 8);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = (cx + dx + N) % N;
        const y = (cy + dy + N) % N;
        const i = y * N + x;
        gridA[i] = 0.5 + Math.random() * 0.1;
        gridB[i] = 0.25 + Math.random() * 0.1;
      }
    }
  }
}

function clearGrid() {
  gridA.fill(1);
  gridB.fill(0);
}

// ── Simulation step ──────────────────────────────────────────────────────────
function simulate() {
  const dt = 1.0;
  for (let y = 0; y < N; y++) {
    const yN = y * N;
    const yUp = ((y - 1 + N) % N) * N;
    const yDn = ((y + 1) % N) * N;
    for (let x = 0; x < N; x++) {
      const i = yN + x;
      const xL = (x - 1 + N) % N;
      const xR = (x + 1) % N;

      const a = gridA[i];
      const b = gridB[i];

      // Laplacian using 5-point stencil
      const lapA = gridA[yUp + x] + gridA[yDn + x] + gridA[yN + xL] + gridA[yN + xR] - 4 * a;
      const lapB = gridB[yUp + x] + gridB[yDn + x] + gridB[yN + xL] + gridB[yN + xR] - 4 * b;

      const ab2 = a * b * b;
      nextA[i] = a + (Da * lapA - ab2 + F * (1 - a)) * dt;
      nextB[i] = b + (Db * lapB + ab2 - (K + F) * b) * dt;

      // Clamp
      if (nextA[i] < 0) nextA[i] = 0;
      if (nextA[i] > 1) nextA[i] = 1;
      if (nextB[i] < 0) nextB[i] = 0;
      if (nextB[i] > 1) nextB[i] = 1;
    }
  }
  // Swap
  const tmpA = gridA; gridA = nextA; nextA = tmpA;
  const tmpB = gridB; gridB = nextB; nextB = tmpB;
}

// ── Color schemes ────────────────────────────────────────────────────────────
const colorMaps = {
  classic(t) {
    const v = Math.floor((1 - t) * 255);
    return [v, v, v];
  },
  viridis(t) {
    // Simplified viridis approximation
    const r = Math.floor(255 * Math.max(0, Math.min(1, -0.35 + 2.5 * t * t)));
    const g = Math.floor(255 * Math.max(0, Math.min(1, 0.08 + t * (1.6 - t * 0.9))));
    const b = Math.floor(255 * Math.max(0, Math.min(1, 0.5 + 0.6 * Math.sin(Math.PI * (0.35 + t * 0.65)))));
    return [r, g, b];
  },
  heat(t) {
    const r = Math.floor(255 * Math.min(1, t * 2.5));
    const g = Math.floor(255 * Math.max(0, Math.min(1, (t - 0.3) * 2.5)));
    const b = Math.floor(255 * Math.max(0, Math.min(1, (t - 0.7) * 3.3)));
    return [r, g, b];
  },
  ocean(t) {
    const r = Math.floor(255 * Math.max(0, Math.min(1, t * 0.4)));
    const g = Math.floor(255 * Math.max(0, Math.min(1, 0.1 + t * 0.7)));
    const b = Math.floor(255 * Math.max(0, Math.min(1, 0.25 + t * 0.75)));
    return [r, g, b];
  }
};

// Pre-build 256-entry LUT for the current scheme
let colorLUT = new Uint8Array(256 * 3);

function buildColorLUT() {
  const fn = colorMaps[colorScheme] || colorMaps.classic;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const [r, g, b] = fn(t);
    colorLUT[i * 3] = r;
    colorLUT[i * 3 + 1] = g;
    colorLUT[i * 3 + 2] = b;
  }
}
buildColorLUT();

// ── Canvas setup ─────────────────────────────────────────────────────────────
const simCanvas = document.getElementById('sim-canvas');
const DISPLAY_SIZE = 512;
simCanvas.width = DISPLAY_SIZE;
simCanvas.height = DISPLAY_SIZE;
const simCtx = simCanvas.getContext('2d', { alpha: false });
simCtx.imageSmoothingEnabled = false;

// Offscreen canvas at simulation resolution
const offCanvas = document.createElement('canvas');
offCanvas.width = N;
offCanvas.height = N;
const offCtx = offCanvas.getContext('2d', { alpha: false });
const imageData = offCtx.createImageData(N, N);
const pixels = imageData.data;

// Fill canvas black immediately to prevent any initial flash
simCtx.fillStyle = '#000';
simCtx.fillRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

function render() {
  for (let i = 0; i < N * N; i++) {
    const b = gridB[i];
    // Apply contrast curve to make patterns sharper and more visible
    const t = Math.min(1, Math.max(0, b));
    const sharp = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
    const ci = Math.floor(sharp * 255);
    const li = ci * 3;

    // Compute gradient magnitude for edge detection (outline)
    const y = Math.floor(i / N);
    const x = i % N;
    const xL = (x - 1 + N) % N;
    const xR = (x + 1) % N;
    const yU = ((y - 1 + N) % N) * N;
    const yD = ((y + 1) % N) * N;
    const gx = gridB[y * N + xR] - gridB[y * N + xL];
    const gy = gridB[yD + x] - gridB[yU + x];
    const edge = Math.sqrt(gx * gx + gy * gy);

    // Darken pixels at edges to create outlines
    const edgeStrength = Math.min(1, edge * 12);
    const pi = i * 4;
    pixels[pi]     = Math.floor(colorLUT[li]     * (1 - edgeStrength));
    pixels[pi + 1] = Math.floor(colorLUT[li + 1] * (1 - edgeStrength));
    pixels[pi + 2] = Math.floor(colorLUT[li + 2] * (1 - edgeStrength));
    pixels[pi + 3] = 255;
  }
  offCtx.putImageData(imageData, 0, 0);
  simCtx.drawImage(offCanvas, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
}

// ── Animation loop ───────────────────────────────────────────────────────────
let simInterval = 33; // ~30 FPS rendering interval
let lastSimTime = 0;

function frame(timestamp) {
  if (!paused && timestamp - lastSimTime >= simInterval) {
    for (let s = 0; s < stepsPerFrame; s++) {
      simulate();
    }
    lastSimTime = timestamp;
    render();
  }
  requestAnimationFrame(frame);
}

// ── Canvas interaction (drawing) ─────────────────────────────────────────────
let mouseDown = false;

function addChemical(canvasX, canvasY) {
  const rect = simCanvas.getBoundingClientRect();
  const scaleX = N / rect.width;
  const scaleY = N / rect.height;
  const gx = Math.floor(canvasX * scaleX);
  const gy = Math.floor(canvasY * scaleY);
  const r = Math.floor(brushSize / 2);

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r * r) continue;
      const x = (gx + dx + N) % N;
      const y = (gy + dy + N) % N;
      const i = y * N + x;
      // Stronger falloff from center for a punchier effect
      const falloff = 1 - Math.sqrt(dist2) / r;
      const noise = 0.8 + Math.random() * 0.4;
      const strength = falloff * noise;
      if (drawChemical === 'B') {
        gridB[i] = Math.min(1, gridB[i] + strength);
        gridA[i] = Math.max(0, gridA[i] - strength * 0.8);
      } else {
        gridA[i] = Math.min(1, gridA[i] + strength);
        gridB[i] = Math.max(0, gridB[i] - strength * 0.8);
      }
    }
  }
  render();
}

function canvasPos(e) {
  const rect = simCanvas.getBoundingClientRect();
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  return [x, y];
}

simCanvas.addEventListener('mousedown', e => { mouseDown = true; const [x, y] = canvasPos(e); addChemical(x, y); });
simCanvas.addEventListener('mousemove', e => { if (mouseDown) { const [x, y] = canvasPos(e); addChemical(x, y); } });
window.addEventListener('mouseup', () => { mouseDown = false; });

simCanvas.addEventListener('touchstart', e => { e.preventDefault(); const [x, y] = canvasPos(e); addChemical(x, y); }, { passive: false });
simCanvas.addEventListener('touchmove', e => { e.preventDefault(); const [x, y] = canvasPos(e); addChemical(x, y); }, { passive: false });

// ── UI Controls ──────────────────────────────────────────────────────────────
const fSlider = document.getElementById('f-slider');
const kSlider = document.getElementById('k-slider');
const fValue = document.getElementById('f-value');
const kValue = document.getElementById('k-value');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const clearBtn = document.getElementById('clear-btn');
const speedSelect = document.getElementById('speed-select');
const brushSlider = document.getElementById('brush-slider');
const brushValue = document.getElementById('brush-value');
const drawABtn = document.getElementById('draw-a-btn');
const drawBBtn = document.getElementById('draw-b-btn');
const saveBtn = document.getElementById('save-btn');
const infoToggle = document.getElementById('info-toggle');
const infoContent = document.getElementById('info-content');

fSlider.addEventListener('input', () => {
  F = parseFloat(fSlider.value);
  fValue.textContent = F.toFixed(4);
  updateParamMarker();
  highlightActivePreset();
});

kSlider.addEventListener('input', () => {
  K = parseFloat(kSlider.value);
  kValue.textContent = K.toFixed(4);
  updateParamMarker();
  highlightActivePreset();
});

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Play' : 'Pause';
  pauseBtn.classList.toggle('active', paused);
});

resetBtn.addEventListener('click', () => { initGrid(); });
clearBtn.addEventListener('click', () => { clearGrid(); });

speedSelect.addEventListener('change', () => {
  stepsPerFrame = parseInt(speedSelect.value);
});

brushSlider.addEventListener('input', () => {
  brushSize = parseInt(brushSlider.value);
  brushValue.textContent = brushSize;
});

drawABtn.addEventListener('click', () => {
  drawChemical = 'A';
  drawABtn.classList.add('active');
  drawBBtn.classList.remove('active');
});

drawBBtn.addEventListener('click', () => {
  drawChemical = 'B';
  drawBBtn.classList.add('active');
  drawABtn.classList.remove('active');
});

// Color scheme buttons
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    colorScheme = btn.dataset.scheme;
    buildColorLUT();
  });
});

// Preset buttons
const presetButtons = document.querySelectorAll('.preset-btn');
presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    F = parseFloat(btn.dataset.f);
    K = parseFloat(btn.dataset.k);
    fSlider.value = F;
    kSlider.value = K;
    fValue.textContent = F.toFixed(4);
    kValue.textContent = K.toFixed(4);
    initGrid();
    updateParamMarker();
    highlightActivePreset();
  });
});

function highlightActivePreset() {
  presetButtons.forEach(btn => {
    const pf = parseFloat(btn.dataset.f);
    const pk = parseFloat(btn.dataset.k);
    btn.classList.toggle('active', Math.abs(pf - F) < 0.001 && Math.abs(pk - K) < 0.001);
  });
}

// Save image
saveBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.download = `turing-F${F.toFixed(4)}-K${K.toFixed(4)}-${ts}.png`;
  link.href = simCanvas.toDataURL('image/png');
  link.click();
});

// Info toggle
infoToggle.addEventListener('click', () => {
  infoToggle.classList.toggle('open');
  infoContent.classList.toggle('open');
});

// ── Parameter Space Diagram ──────────────────────────────────────────────────
const paramCanvas = document.getElementById('param-canvas');
const paramCtx = paramCanvas.getContext('2d');
const paramMarker = document.getElementById('param-marker');

// F range: 0.01 - 0.10, K range: 0.04 - 0.07
const F_MIN = 0.01, F_MAX = 0.10;
const K_MIN = 0.04, K_MAX = 0.07;

function drawParamSpace() {
  const w = paramCanvas.width;
  const h = paramCanvas.height;
  const imgData = paramCtx.createImageData(w, h);
  const d = imgData.data;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const f = F_MIN + (px / w) * (F_MAX - F_MIN);
      const k = K_MAX - (py / h) * (K_MAX - K_MIN); // y inverted

      // Heuristic coloring based on known pattern regions
      // Classify based on F-K relationship
      const ratio = k / f;
      const sum = f + k;

      let r = 20, g = 25, b = 35;

      // Spots region: high F, moderate K
      if (f > 0.03 && f < 0.07 && k > 0.058 && k < 0.067) {
        const intensity = 1 - Math.abs(f - 0.05) * 20;
        r = Math.floor(30 + 80 * Math.max(0, intensity));
        g = Math.floor(50 + 120 * Math.max(0, intensity));
        b = Math.floor(80 + 100 * Math.max(0, intensity));
      }

      // Stripes region
      if (f > 0.02 && f < 0.05 && k > 0.06 && k < 0.068) {
        const intensity = 1 - Math.abs(f - 0.035) * 30;
        r = Math.floor(30 + 60 * Math.max(0, intensity));
        g = Math.floor(80 + 100 * Math.max(0, intensity));
        b = Math.floor(50 + 60 * Math.max(0, intensity));
      }

      // Waves region
      if (f > 0.008 && f < 0.025 && k > 0.05 && k < 0.058) {
        const intensity = 1 - Math.abs(f - 0.014) * 50;
        r = Math.floor(80 + 120 * Math.max(0, intensity));
        g = Math.floor(40 + 60 * Math.max(0, intensity));
        b = Math.floor(30 + 50 * Math.max(0, intensity));
      }

      // Maze region
      if (f > 0.02 && f < 0.04 && k > 0.054 && k < 0.062) {
        const intensity = 1 - Math.abs(f - 0.029) * 40;
        r = Math.floor(100 + 100 * Math.max(0, intensity));
        g = Math.floor(60 + 80 * Math.max(0, intensity));
        b = Math.floor(120 + 80 * Math.max(0, intensity));
      }

      // Spirals region
      if (f > 0.012 && f < 0.025 && k > 0.048 && k < 0.055) {
        const intensity = 1 - Math.abs(f - 0.018) * 50;
        r = Math.floor(60 + 100 * Math.max(0, intensity));
        g = Math.floor(100 + 100 * Math.max(0, intensity));
        b = Math.floor(100 + 100 * Math.max(0, intensity));
      }

      // General alive/dead boundary gradient
      const boundary = f * 2.5 + 0.035;
      if (k > boundary + 0.005) {
        // Dead zone - darken
        r = Math.floor(r * 0.4);
        g = Math.floor(g * 0.4);
        b = Math.floor(b * 0.4);
      }

      const pi = (py * w + px) * 4;
      d[pi] = r;
      d[pi + 1] = g;
      d[pi + 2] = b;
      d[pi + 3] = 255;
    }
  }

  paramCtx.putImageData(imgData, 0, 0);

  // Draw region labels
  paramCtx.fillStyle = 'rgba(255,255,255,0.8)';
  paramCtx.font = '11px -apple-system, sans-serif';
  paramCtx.textAlign = 'center';

  const labels = [
    { text: 'Spots', f: 0.0545, k: 0.062 },
    { text: 'Stripes', f: 0.035, k: 0.065 },
    { text: 'Waves', f: 0.014, k: 0.054 },
    { text: 'Maze', f: 0.029, k: 0.057 },
    { text: 'Spirals', f: 0.018, k: 0.051 },
  ];

  labels.forEach(l => {
    const px = ((l.f - F_MIN) / (F_MAX - F_MIN)) * w;
    const py = ((K_MAX - l.k) / (K_MAX - K_MIN)) * h;
    paramCtx.fillText(l.text, px, py - 4);
    // Small dot
    paramCtx.beginPath();
    paramCtx.arc(px, py, 3, 0, Math.PI * 2);
    paramCtx.fill();
  });
}

function updateParamMarker() {
  const wrapper = document.querySelector('.param-space-wrapper');
  const rect = paramCanvas.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();

  const px = ((F - F_MIN) / (F_MAX - F_MIN)) * rect.width;
  const py = ((K_MAX - K) / (K_MAX - K_MIN)) * rect.height;

  // Account for padding
  const offsetX = rect.left - wrapperRect.left;
  const offsetY = rect.top - wrapperRect.top;

  paramMarker.style.left = (offsetX + px) + 'px';
  paramMarker.style.top = (offsetY + py) + 'px';
}

paramCanvas.addEventListener('click', e => {
  const rect = paramCanvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  F = F_MIN + (px / rect.width) * (F_MAX - F_MIN);
  K = K_MAX - (py / rect.height) * (K_MAX - K_MIN);

  // Clamp
  F = Math.max(F_MIN, Math.min(F_MAX, F));
  K = Math.max(K_MIN, Math.min(K_MAX, K));

  // Round to slider precision
  F = Math.round(F * 10000) / 10000;
  K = Math.round(K * 10000) / 10000;

  fSlider.value = F;
  kSlider.value = K;
  fValue.textContent = F.toFixed(4);
  kValue.textContent = K.toFixed(4);

  updateParamMarker();
  highlightActivePreset();
});

// ── Init ─────────────────────────────────────────────────────────────────────
initGrid();
highlightActivePreset();
drawParamSpace();

// Delay marker positioning until layout settles
requestAnimationFrame(() => {
  updateParamMarker();
  render(); // initial draw
  requestAnimationFrame(frame);
});

// Re-position marker on resize
window.addEventListener('resize', () => {
  updateParamMarker();
});
