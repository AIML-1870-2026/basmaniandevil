// Animation system for Julia set parameter morphing
class Animator {
  constructor(renderer, controls) {
    this.renderer = renderer;
    this.controls = controls;
    this.playing = false;
    this.speed = 1.0;
    this.cycleDuration = 10; // seconds
    this.path = 'circular';
    this.startTime = 0;
    this.pauseTime = 0;
    this.elapsed = 0;
    this.animFrame = null;

    // Center of animation path (start from current params)
    this.centerReal = renderer.cReal;
    this.centerImag = renderer.cImag;
    this.radius = 0.3;

    this._bindControls();
  }

  _bindControls() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const playPauseLabel = document.getElementById('playPauseLabel');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    const durationSlider = document.getElementById('durationSlider');
    const durationValue = document.getElementById('durationValue');

    playPauseBtn.addEventListener('click', () => {
      if (this.playing) {
        this.pause();
        playIcon.style.display = '';
        pauseIcon.style.display = 'none';
        playPauseLabel.textContent = 'Play';
      } else {
        this.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = '';
        playPauseLabel.textContent = 'Pause';
      }
    });

    speedSlider.addEventListener('input', () => {
      this.speed = parseFloat(speedSlider.value);
      speedValue.textContent = this.speed.toFixed(1) + 'x';
    });

    durationSlider.addEventListener('input', () => {
      this.cycleDuration = parseInt(durationSlider.value);
      durationValue.textContent = this.cycleDuration + 's';
    });

    // Path buttons
    document.querySelectorAll('.path-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.path-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.path = btn.dataset.path;
      });
    });
  }

  play() {
    // Snapshot current params as animation center
    this.centerReal = this.renderer.cReal;
    this.centerImag = this.renderer.cImag;

    this.playing = true;
    this.startTime = performance.now() - this.elapsed;
    this._animate();
  }

  pause() {
    this.playing = false;
    this.elapsed = performance.now() - this.startTime;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  stop() {
    this.playing = false;
    this.elapsed = 0;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    document.getElementById('animProgress').style.width = '0%';

    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const playPauseLabel = document.getElementById('playPauseLabel');
    playIcon.style.display = '';
    pauseIcon.style.display = 'none';
    playPauseLabel.textContent = 'Play';
  }

  _animate() {
    if (!this.playing) return;

    const now = performance.now();
    const totalMs = this.cycleDuration * 1000;
    this.elapsed = (now - this.startTime) * this.speed;
    const progress = (this.elapsed % totalMs) / totalMs;

    // Update progress bar
    document.getElementById('animProgress').style.width = (progress * 100) + '%';

    // Calculate parameter position along path
    const angle = progress * Math.PI * 2;
    let cReal, cImag;

    if (this.path === 'circular') {
      cReal = this.centerReal + this.radius * Math.cos(angle);
      cImag = this.centerImag + this.radius * Math.sin(angle);
    } else if (this.path === 'figure8') {
      cReal = this.centerReal + this.radius * Math.sin(angle);
      cImag = this.centerImag + this.radius * Math.sin(angle * 2) * 0.5;
    }

    // Clamp
    cReal = Math.max(-2, Math.min(2, cReal));
    cImag = Math.max(-2, Math.min(2, cImag));

    // Update renderer and controls
    this.renderer.setParams(cReal, cImag);
    this.controls.setParamsSilent(cReal, cImag);

    this.animFrame = requestAnimationFrame(() => this._animate());
  }
}
