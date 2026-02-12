// UI controls and event handling
class Controls {
  constructor(renderer) {
    this.renderer = renderer;
    this.debounceTimer = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };

    this._bindNavigation();
    this._bindParameters();
    this._bindPresets();
    this._bindColorSchemes();
    this._bindIterations();
    this._bindCanvasInteraction();
    this._bindSections();
    this._bindHelp();
    this._bindResize();
  }

  _bindNavigation() {
    document.getElementById('zoomInBtn').addEventListener('click', () => {
      this.renderer.zoomCenter(2);
      this._updateZoomDisplay();
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
      this.renderer.zoomCenter(0.5);
      this._updateZoomDisplay();
    });

    document.getElementById('resetViewBtn').addEventListener('click', () => {
      this.renderer.resetView();
      this._updateZoomDisplay();
    });
  }

  _bindParameters() {
    const realSlider = document.getElementById('realSlider');
    const imagSlider = document.getElementById('imagSlider');
    const realInput = document.getElementById('realInput');
    const imagInput = document.getElementById('imagInput');

    const updateParams = () => {
      const cReal = parseFloat(realSlider.value);
      const cImag = parseFloat(imagSlider.value);
      realInput.value = cReal;
      imagInput.value = cImag;
      this._updateParamDisplay(cReal, cImag);

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.renderer.setParams(cReal, cImag);
      }, 150);
    };

    realSlider.addEventListener('input', updateParams);
    imagSlider.addEventListener('input', updateParams);

    realInput.addEventListener('change', () => {
      let val = parseFloat(realInput.value);
      val = Math.max(-2, Math.min(2, val || 0));
      realInput.value = val;
      realSlider.value = val;
      updateParams();
    });

    imagInput.addEventListener('change', () => {
      let val = parseFloat(imagInput.value);
      val = Math.max(-2, Math.min(2, val || 0));
      imagInput.value = val;
      imagSlider.value = val;
      updateParams();
    });
  }

  _bindPresets() {
    const grid = document.getElementById('presetGrid');
    grid.innerHTML = '';

    Presets.forEach((preset, i) => {
      const card = document.createElement('div');
      card.className = 'preset-card' + (i === 0 ? ' active' : '');
      card.title = `${preset.name} (c = ${preset.real} + ${preset.imag}i)`;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', preset.name);

      const thumb = document.createElement('img');
      thumb.className = 'preset-thumb';
      thumb.alt = preset.name;
      // Generate thumbnail
      thumb.src = this.renderer.generateThumbnail(preset.real, preset.imag, 64, this.renderer.colorScheme);

      const name = document.createElement('div');
      name.className = 'preset-name';
      name.textContent = preset.name;

      card.appendChild(thumb);
      card.appendChild(name);

      const applyPreset = () => {
        grid.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this._applyPreset(preset);
      };

      card.addEventListener('click', applyPreset);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          applyPreset();
        }
      });

      grid.appendChild(card);
    });
  }

  _applyPreset(preset) {
    const realSlider = document.getElementById('realSlider');
    const imagSlider = document.getElementById('imagSlider');
    const realInput = document.getElementById('realInput');
    const imagInput = document.getElementById('imagInput');

    realSlider.value = preset.real;
    imagSlider.value = preset.imag;
    realInput.value = preset.real;
    imagInput.value = preset.imag;

    this._updateParamDisplay(preset.real, preset.imag);
    this.renderer.resetView();
    this.renderer.setFullReveal();
    this.renderer.setParams(preset.real, preset.imag);
  }

  _bindColorSchemes() {
    const picker = document.getElementById('colorPicker');
    picker.innerHTML = '';

    ColorSchemes.forEach((scheme) => {
      const option = document.createElement('div');
      option.className = 'color-option' + (scheme.id === 'classic' ? ' active' : '');
      option.setAttribute('role', 'button');
      option.setAttribute('tabindex', '0');
      option.setAttribute('aria-label', scheme.name + ' color scheme');

      const preview = document.createElement('div');
      preview.className = 'color-preview';
      preview.style.background = scheme.gradient;

      const label = document.createElement('span');
      label.className = 'color-label';
      label.textContent = scheme.name;

      option.appendChild(preview);
      option.appendChild(label);

      const applyScheme = () => {
        picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        this.renderer.setColorScheme(scheme.id);
        // Regenerate preset thumbnails with new color scheme
        this._regenerateThumbnails(scheme.id);
      };

      option.addEventListener('click', applyScheme);
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          applyScheme();
        }
      });

      picker.appendChild(option);
    });
  }

  _regenerateThumbnails(colorScheme) {
    const thumbs = document.querySelectorAll('.preset-thumb');
    Presets.forEach((preset, i) => {
      if (thumbs[i]) {
        thumbs[i].src = this.renderer.generateThumbnail(preset.real, preset.imag, 64, colorScheme);
      }
    });
  }

  _bindIterations() {
    const slider = document.getElementById('iterSlider');
    const display = document.getElementById('iterValue');

    slider.addEventListener('input', () => {
      display.textContent = slider.value;
      clearTimeout(this._iterTimer);
      this._iterTimer = setTimeout(() => {
        this.renderer.setMaxIter(parseInt(slider.value));
      }, 150);
    });
  }

  _bindCanvasInteraction() {
    const canvas = this.renderer.canvas;
    let panThreshold = 5;
    let startX, startY;
    let hasMoved = false;

    canvas.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
      hasMoved = false;
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;

      const dx = e.clientX - this.panStart.x;
      const dy = e.clientY - this.panStart.y;

      if (Math.abs(e.clientX - startX) > panThreshold || Math.abs(e.clientY - startY) > panThreshold) {
        hasMoved = true;
        canvas.classList.add('panning');
      }

      if (hasMoved) {
        this.renderer.pan(dx, dy);
        this.panStart = { x: e.clientX, y: e.clientY };
        this._updateZoomDisplay();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.isPanning) return;
      this.isPanning = false;
      canvas.classList.remove('panning');

      // If didn't pan, treat as zoom click
      if (!hasMoved) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
        this.renderer.zoomAt(canvasX, canvasY, 2);
        this._updateZoomDisplay();
      }
    });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
      const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
      this.renderer.zoomAt(canvasX, canvasY, factor);
      this._updateZoomDisplay();
    }, { passive: false });

    // Touch support
    let lastTouchDist = 0;
    let lastTouchCenter = null;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        hasMoved = false;
        this.isPanning = true;
        this.panStart = { x: startX, y: startY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this.isPanning) {
        const dx = e.touches[0].clientX - this.panStart.x;
        const dy = e.touches[0].clientY - this.panStart.y;
        if (Math.abs(dx) > panThreshold || Math.abs(dy) > panThreshold) {
          hasMoved = true;
        }
        if (hasMoved) {
          this.renderer.pan(dx, dy);
          this.panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastTouchDist > 0) {
          const factor = dist / lastTouchDist;
          const rect = canvas.getBoundingClientRect();
          const cx = (lastTouchCenter.x - rect.left) * (canvas.width / rect.width);
          const cy = (lastTouchCenter.y - rect.top) * (canvas.height / rect.height);
          this.renderer.zoomAt(cx, cy, factor);
          this._updateZoomDisplay();
        }
        lastTouchDist = dist;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      this.isPanning = false;
      lastTouchDist = 0;
      lastTouchCenter = null;
    });
  }

  _bindSections() {
    document.querySelectorAll('.section-header').forEach(header => {
      header.addEventListener('click', () => {
        const expanded = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', !expanded);
        const content = header.nextElementSibling;
        if (expanded) {
          content.classList.add('collapsed');
        } else {
          content.classList.remove('collapsed');
        }
      });
    });
  }

  _bindHelp() {
    const modal = document.getElementById('helpModal');
    document.getElementById('helpBtn').addEventListener('click', () => {
      modal.classList.add('visible');
    });
    document.getElementById('modalClose').addEventListener('click', () => {
      modal.classList.remove('visible');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('visible');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('visible')) {
        modal.classList.remove('visible');
      }
    });
  }

  _bindResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.renderer.resize();
        this._updateZoomDisplay();
      }, 200);
    });
  }

  _updateParamDisplay(real, imag) {
    const display = document.getElementById('paramDisplay');
    const sign = imag >= 0 ? '+' : '-';
    display.textContent = `c = ${real.toFixed(2)} ${sign} ${Math.abs(imag).toFixed(2)}i`;
  }

  _updateZoomDisplay() {
    const zoomEl = document.getElementById('zoomLevel');
    zoomEl.textContent = this.renderer.getZoomLevel() + 'x';
  }

  // Called by animator to update sliders without triggering debounce
  setParamsSilent(real, imag) {
    document.getElementById('realSlider').value = real;
    document.getElementById('imagSlider').value = imag;
    document.getElementById('realInput').value = real.toFixed(3);
    document.getElementById('imagInput').value = imag.toFixed(3);
    this._updateParamDisplay(real, imag);
  }
}
