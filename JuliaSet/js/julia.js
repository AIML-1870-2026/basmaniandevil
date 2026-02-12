// Julia Set Web Worker
// Receives render requests and returns computed pixel data

self.onmessage = function (e) {
  const { width, height, cReal, cImag, maxIter, viewport, colorScheme, taskId } = e.data;

  const imageData = new Uint8ClampedArray(width * height * 4);
  const { xMin, xMax, yMin, yMax } = viewport;
  const xScale = (xMax - xMin) / width;
  const yScale = (yMax - yMin) / height;

  for (let py = 0; py < height; py++) {
    const imag = yMin + py * yScale;
    for (let px = 0; px < width; px++) {
      const real = xMin + px * xScale;

      let zr = real;
      let zi = imag;
      let iter = 0;

      // Main iteration loop with escape radius squared = 4
      while (iter < maxIter) {
        const zr2 = zr * zr;
        const zi2 = zi * zi;
        if (zr2 + zi2 > 4) break;
        zi = 2 * zr * zi + cImag;
        zr = zr2 - zi2 + cReal;
        iter++;
      }

      const idx = (py * width + px) * 4;

      if (iter === maxIter) {
        // Inside the set - black
        imageData[idx] = 0;
        imageData[idx + 1] = 0;
        imageData[idx + 2] = 0;
        imageData[idx + 3] = 255;
      } else {
        // Smooth coloring: use continuous iteration count
        const zr2 = zr * zr;
        const zi2 = zi * zi;
        const log_zn = Math.log(zr2 + zi2) / 2;
        const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
        const smoothIter = iter + 1 - nu;
        const t = smoothIter / maxIter;

        const color = getColor(t, smoothIter, colorScheme);
        imageData[idx] = color[0];
        imageData[idx + 1] = color[1];
        imageData[idx + 2] = color[2];
        imageData[idx + 3] = 255;
      }
    }
  }

  self.postMessage({ imageData, width, height, taskId }, [imageData.buffer]);
};

function getColor(t, iter, scheme) {
  // Normalize iteration for color mapping
  const n = iter % 256;
  const f = n / 256;

  switch (scheme) {
    case 'classic':
      return classicColor(f);
    case 'fire':
      return fireColor(f);
    case 'ocean':
      return oceanColor(f);
    case 'psychedelic':
      return psychedelicColor(f);
    case 'monochrome':
      return monochromeColor(f);
    case 'sunset':
      return sunsetColor(f);
    default:
      return classicColor(f);
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
  ];
}

function multiGradient(stops, t) {
  if (t <= 0) return stops[0];
  if (t >= 1) return stops[stops.length - 1];
  const segment = t * (stops.length - 1);
  const i = Math.floor(segment);
  const f = segment - i;
  return lerpColor(stops[i], stops[Math.min(i + 1, stops.length - 1)], f);
}

function classicColor(f) {
  return multiGradient([
    [0, 7, 100],
    [32, 107, 203],
    [237, 255, 255],
    [255, 170, 0],
    [0, 2, 0]
  ], f);
}

function fireColor(f) {
  return multiGradient([
    [0, 0, 0],
    [128, 0, 0],
    [255, 69, 0],
    [255, 165, 0],
    [255, 255, 0],
    [255, 255, 255]
  ], f);
}

function oceanColor(f) {
  return multiGradient([
    [0, 0, 40],
    [0, 30, 100],
    [0, 100, 180],
    [0, 200, 230],
    [180, 240, 255],
    [255, 255, 255]
  ], f);
}

function psychedelicColor(f) {
  const h = f * 360;
  return hslToRgb(h, 100, 50);
}

function monochromeColor(f) {
  const v = Math.round(f * 255);
  return [v, v, v];
}

function sunsetColor(f) {
  return multiGradient([
    [25, 0, 50],
    [80, 0, 120],
    [180, 30, 100],
    [220, 60, 80],
    [255, 130, 50],
    [255, 210, 80],
    [255, 255, 200]
  ], f);
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}
