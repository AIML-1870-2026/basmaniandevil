// Canvas renderer - manages the fractal canvas and Web Worker communication
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.worker = new Worker('js/julia.js');
    this.taskId = 0;
    this.rendering = false;
    this.pendingRender = null;

    // Default viewport: -2 to 2 on both axes
    this.viewport = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
    this.defaultViewport = { ...this.viewport };

    // Current parameters
    this.cReal = -0.7;
    this.cImag = 0.27;
    this.maxIter = 200;
    this.colorScheme = 'classic';

    // Performance tracking
    this.renderStartTime = 0;
    this.onRenderComplete = null;
    this.firstRender = true;

    this.worker.onmessage = (e) => this._onWorkerMessage(e);

    this.resize();
  }

  resize() {
    const container = this.canvas.parentElement;
    const cw = container.clientWidth || 600;
    const ch = container.clientHeight || 600;
    const displaySize = Math.max(Math.min(cw, ch, 1200), 300);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.style.width = displaySize + 'px';
    this.canvas.style.height = displaySize + 'px';
    this.canvas.width = Math.round(displaySize * dpr);
    this.canvas.height = Math.round(displaySize * dpr);

    this.render();
  }

  render() {
    if (this.rendering) {
      this.pendingRender = true;
      return;
    }

    this.rendering = true;
    this.renderStartTime = performance.now();
    this.taskId++;

    const overlay = document.getElementById('canvasOverlay');
    if (overlay) overlay.classList.add('visible');

    this.worker.postMessage({
      width: this.canvas.width,
      height: this.canvas.height,
      cReal: this.cReal,
      cImag: this.cImag,
      maxIter: this.maxIter,
      viewport: { ...this.viewport },
      colorScheme: this.colorScheme,
      taskId: this.taskId
    });
  }

  _onWorkerMessage(e) {
    const { imageData, width, height, taskId } = e.data;

    // Only apply the latest render
    if (taskId === this.taskId) {
      const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
      this.ctx.putImageData(imgData, 0, 0);

      // Trigger reveal animation
      const useFullReveal = this.firstRender || this._useFullReveal;
      this._useFullReveal = false;
      this.canvas.classList.remove('revealed', 'quick-reveal');
      void this.canvas.offsetWidth; // force reflow
      if (useFullReveal) {
        this.canvas.classList.add('revealed');
        this.firstRender = false;
      } else {
        this.canvas.classList.add('quick-reveal');
      }

      const renderTime = Math.round(performance.now() - this.renderStartTime);
      const renderTimeEl = document.getElementById('renderTime');
      if (renderTimeEl) renderTimeEl.textContent = renderTime;

      const overlay = document.getElementById('canvasOverlay');
      if (overlay) overlay.classList.remove('visible');

      if (this.onRenderComplete) this.onRenderComplete(renderTime);
    }

    this.rendering = false;

    if (this.pendingRender) {
      this.pendingRender = false;
      this.render();
    }
  }

  setParams(cReal, cImag) {
    this.cReal = cReal;
    this.cImag = cImag;
    this.render();
  }

  setMaxIter(val) {
    this.maxIter = val;
    this.render();
  }

  setColorScheme(scheme) {
    this.colorScheme = scheme;
    this._useFullReveal = true;
    this.render();
  }

  // Trigger the full dramatic reveal on next render
  setFullReveal() {
    this._useFullReveal = true;
  }

  zoomAt(canvasX, canvasY, factor) {
    const { xMin, xMax, yMin, yMax } = this.viewport;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    // Map canvas coords to complex coords
    const cx = xMin + (canvasX / this.canvas.width) * xRange;
    const cy = yMin + (canvasY / this.canvas.height) * yRange;

    const newXRange = xRange / factor;
    const newYRange = yRange / factor;

    this.viewport = {
      xMin: cx - newXRange / 2,
      xMax: cx + newXRange / 2,
      yMin: cy - newYRange / 2,
      yMax: cy + newYRange / 2
    };

    this.render();
  }

  zoomCenter(factor) {
    const { xMin, xMax, yMin, yMax } = this.viewport;
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const newXRange = (xMax - xMin) / factor;
    const newYRange = (yMax - yMin) / factor;

    this.viewport = {
      xMin: cx - newXRange / 2,
      xMax: cx + newXRange / 2,
      yMin: cy - newYRange / 2,
      yMax: cy + newYRange / 2
    };

    this.render();
  }

  pan(dxPixels, dyPixels) {
    const { xMin, xMax, yMin, yMax } = this.viewport;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const dx = (dxPixels / this.canvas.width) * xRange;
    const dy = (dyPixels / this.canvas.height) * yRange;

    this.viewport.xMin -= dx;
    this.viewport.xMax -= dx;
    this.viewport.yMin -= dy;
    this.viewport.yMax -= dy;

    this.render();
  }

  resetView() {
    this.viewport = { ...this.defaultViewport };
    this.render();
  }

  getZoomLevel() {
    const defaultRange = this.defaultViewport.xMax - this.defaultViewport.xMin;
    const currentRange = this.viewport.xMax - this.viewport.xMin;
    return (defaultRange / currentRange).toFixed(1);
  }

  // Generate a small thumbnail for presets
  generateThumbnail(cReal, cImag, size, colorScheme) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    const vp = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
    const xScale = (vp.xMax - vp.xMin) / size;
    const yScale = (vp.yMax - vp.yMin) / size;
    const maxIter = 80; // Lower for thumbnails

    for (let py = 0; py < size; py++) {
      const im = vp.yMin + py * yScale;
      for (let px = 0; px < size; px++) {
        const re = vp.xMin + px * xScale;
        let zr = re, zi = im, iter = 0;
        while (iter < maxIter) {
          const zr2 = zr * zr;
          const zi2 = zi * zi;
          if (zr2 + zi2 > 4) break;
          zi = 2 * zr * zi + cImag;
          zr = zr2 - zi2 + cReal;
          iter++;
        }
        const idx = (py * size + px) * 4;
        if (iter === maxIter) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        } else {
          const f = (iter % 64) / 64;
          const color = this._thumbColor(f, colorScheme);
          data[idx] = color[0];
          data[idx + 1] = color[1];
          data[idx + 2] = color[2];
        }
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }

  _thumbColor(f, scheme) {
    // Simplified color for thumbnails
    const stops = {
      classic: [[0, 7, 100], [32, 107, 203], [237, 255, 255], [255, 170, 0], [0, 2, 0]],
      fire: [[0, 0, 0], [128, 0, 0], [255, 69, 0], [255, 165, 0], [255, 255, 0]],
      ocean: [[0, 0, 40], [0, 30, 100], [0, 100, 180], [0, 200, 230], [255, 255, 255]],
      psychedelic: [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255]],
      monochrome: [[0, 0, 0], [128, 128, 128], [255, 255, 255]],
      sunset: [[25, 0, 50], [180, 30, 100], [255, 130, 50], [255, 210, 80], [255, 255, 200]]
    };
    const s = stops[scheme] || stops.classic;
    const seg = f * (s.length - 1);
    const i = Math.floor(seg);
    const t = seg - i;
    const c1 = s[i];
    const c2 = s[Math.min(i + 1, s.length - 1)];
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t)
    ];
  }
}
