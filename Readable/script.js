'use strict';
// ============================================================
// State
// ============================================================
const state = {
    bg: { r: 255, g: 255, b: 255 },
    text: { r: 0, g: 0, b: 0 },
    textSize: 24,
    vision: 'normal'
};
// ============================================================
// Vision simulation — SVG feColorMatrix values (row-major, 20 values)
// ============================================================
const VISION_MATRICES = {
    protanopia: '0.567 0.433 0     0 0  0.558 0.442 0     0 0  0     0.242 0.758 0 0  0 0 0 1 0',
    deuteranopia: '0.625 0.375 0     0 0  0.7   0.3   0     0 0  0     0.3   0.7   0 0  0 0 0 1 0',
    tritanopia: '0.95  0.05  0     0 0  0     0.433 0.567 0 0  0     0.475 0.525 0 0  0 0 0 1 0',
    monochromacy: '0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0'
};
// ============================================================
// WCAG luminance & contrast helpers
// ============================================================
function linearize(channel) {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function relativeLuminance(r, g, b) {
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}
function contrastRatio(lum1, lum2) {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}
// ============================================================
// Hex → RgbColor
// ============================================================
function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
        ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
        : null;
}
// ============================================================
// Update slider track fill to show current position
// ============================================================
function updateSliderFill(slider) {
    const min = Number(slider.min) || 0;
    const max = Number(slider.max) || 255;
    const pct = ((Number(slider.value) - min) / (max - min)) * 100;
    slider.style.background =
        `linear-gradient(to right, #4fc3f7 ${pct}%, #3a3a3a ${pct}%)`;
}
// ============================================================
// Get a required DOM element by ID, throwing if missing
// ============================================================
function getById(id) {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Element #${id} not found`);
    return el;
}
// ============================================================
// Main update — recalculates everything and updates the DOM
// ============================================================
function updateAll() {
    const { bg, text } = state;
    // Preview background
    const previewEl = getById('preview-panel');
    previewEl.style.backgroundColor = `rgb(${bg.r},${bg.g},${bg.b})`;
    // Sample text color (all rows)
    document.querySelectorAll('.sample-text').forEach(el => {
        el.style.color = `rgb(${text.r},${text.g},${text.b})`;
    });
    // Custom row size & label
    getById('custom-text').style.fontSize = `${state.textSize}px`;
    getById('custom-label').textContent = `${state.textSize}px / custom`;
    // Luminance & contrast
    const bgLum = relativeLuminance(bg.r, bg.g, bg.b);
    const textLum = relativeLuminance(text.r, text.g, text.b);
    const ratio = contrastRatio(bgLum, textLum);
    // Metrics display
    getById('contrast-ratio').textContent = `${ratio.toFixed(2)} : 1`;
    getById('bg-luminance').textContent = bgLum.toFixed(4);
    getById('text-luminance').textContent = textLum.toFixed(4);
    // WCAG compliance badges
    const normalPass = ratio >= 4.5;
    const largePass = ratio >= 3.0;
    const normalBadge = getById('normal-badge');
    normalBadge.textContent = normalPass ? '✓ PASS' : '✗ FAIL';
    normalBadge.className = `badge-result ${normalPass ? 'pass' : 'fail'}`;
    const largeBadge = getById('large-badge');
    largeBadge.textContent = largePass ? '✓ PASS' : '✗ FAIL';
    largeBadge.className = `badge-result ${largePass ? 'pass' : 'fail'}`;
    // Header color swatches
    getById('bg-swatch').style.backgroundColor = `rgb(${bg.r},${bg.g},${bg.b})`;
    getById('text-swatch').style.backgroundColor = `rgb(${text.r},${text.g},${text.b})`;
    // Sync slider + input values to state (important after preset clicks)
    syncInputsToState();
}
// ============================================================
// Sync all slider + number-input values to state
// (called after preset selection or external state mutation)
// ============================================================
function syncInputsToState() {
    const channels = ['r', 'g', 'b'];
    channels.forEach(ch => {
        const bgSlider = getById(`bg-${ch}`);
        const bgInput = getById(`bg-${ch}-num`);
        const textSlider = getById(`text-${ch}`);
        const textInput = getById(`text-${ch}-num`);
        bgSlider.value = String(state.bg[ch]);
        bgInput.value = String(state.bg[ch]);
        updateSliderFill(bgSlider);
        textSlider.value = String(state.text[ch]);
        textInput.value = String(state.text[ch]);
        updateSliderFill(textSlider);
    });
    const sizeSlider = getById('text-size');
    const sizeInput = getById('text-size-num');
    sizeSlider.value = String(state.textSize);
    sizeInput.value = String(state.textSize);
    updateSliderFill(sizeSlider);
}
// ============================================================
// Wire up RGB channel controls for bg or text
// ============================================================
function setupColorChannel(prefix, stateColor) {
    const channels = ['r', 'g', 'b'];
    channels.forEach(ch => {
        const slider = getById(`${prefix}-${ch}`);
        const input = getById(`${prefix}-${ch}-num`);
        updateSliderFill(slider);
        slider.addEventListener('input', () => {
            stateColor[ch] = parseInt(slider.value, 10);
            input.value = slider.value;
            updateSliderFill(slider);
            updateAll();
        });
        input.addEventListener('input', () => {
            let val = parseInt(input.value, 10);
            if (isNaN(val))
                val = 0;
            val = Math.max(0, Math.min(255, val));
            stateColor[ch] = val;
            slider.value = String(val);
            updateSliderFill(slider);
            updateAll();
        });
        input.addEventListener('blur', () => {
            input.value = String(stateColor[ch]);
        });
    });
}
// ============================================================
// Wire up Text Size control
// ============================================================
function setupTextSize() {
    const slider = getById('text-size');
    const input = getById('text-size-num');
    updateSliderFill(slider);
    slider.addEventListener('input', () => {
        state.textSize = parseInt(slider.value, 10);
        input.value = slider.value;
        updateSliderFill(slider);
        updateAll();
    });
    input.addEventListener('input', () => {
        let val = parseInt(input.value, 10);
        if (isNaN(val))
            val = 8;
        val = Math.max(8, Math.min(72, val));
        state.textSize = val;
        slider.value = String(val);
        updateSliderFill(slider);
        updateAll();
    });
    input.addEventListener('blur', () => {
        input.value = String(state.textSize);
    });
}
// ============================================================
// Wire up Preset buttons
// ============================================================
function setupPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            var _a, _b;
            const bg = hexToRgb((_a = btn.dataset.bg) !== null && _a !== void 0 ? _a : '');
            const text = hexToRgb((_b = btn.dataset.text) !== null && _b !== void 0 ? _b : '');
            if (bg)
                Object.assign(state.bg, bg);
            if (text)
                Object.assign(state.text, text);
            updateAll();
        });
    });
}
// ============================================================
// Vision Simulation
// ============================================================
function applyVisionFilter(type) {
    const previewEl = getById('preview-panel');
    const matrixEl = document.getElementById('vision-matrix');
    const visionNote = getById('vision-note');
    const bgSection = getById('bg-color-section');
    const txtSection = getById('text-color-section');
    const isSimulating = type !== 'normal';
    if (isSimulating && matrixEl) {
        matrixEl.setAttribute('values', VISION_MATRICES[type]);
        previewEl.style.filter = 'url(#vision-filter)';
    }
    else {
        previewEl.style.filter = '';
    }
    const colorInputs = [
        ...Array.from(bgSection.querySelectorAll('.channel-slider, .channel-input')),
        ...Array.from(txtSection.querySelectorAll('.channel-slider, .channel-input'))
    ];
    colorInputs.forEach(el => { el.disabled = isSimulating; });
    bgSection.classList.toggle('color-disabled', isSimulating);
    txtSection.classList.toggle('color-disabled', isSimulating);
    visionNote.hidden = !isSimulating;
}
function setupVisionSimulation() {
    document.querySelectorAll('input[name="vision"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                state.vision = radio.value;
                applyVisionFilter(state.vision);
            }
        });
    });
}
// ============================================================
// Sample text input
// ============================================================
function setupSampleTextInput() {
    const textarea = getById('sample-text-input');
    const applySampleText = () => {
        const value = textarea.value || '\u00a0'; // non-breaking space keeps line height when empty
        document.querySelectorAll('.sample-text').forEach(el => {
            el.textContent = value;
        });
    };
    textarea.addEventListener('input', applySampleText);
    applySampleText(); // apply default value on load
}
// ============================================================
// Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setupColorChannel('bg', state.bg);
    setupColorChannel('text', state.text);
    setupTextSize();
    setupSampleTextInput();
    setupPresets();
    setupVisionSimulation();
    updateAll();
});
