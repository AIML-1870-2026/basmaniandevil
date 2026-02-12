// Application initialization
(function () {
  'use strict';

  window.addEventListener('DOMContentLoaded', () => {
    // Wait one frame so the layout is fully computed
    requestAnimationFrame(() => {
      const canvas = document.getElementById('fractalCanvas');

      // Initialize renderer
      const renderer = new Renderer(canvas);

      // Initialize controls
      const controls = new Controls(renderer);

      // Initialize animator
      const animator = new Animator(renderer, controls);
    });
  });
})();
