"use strict";
// ─── Types ────────────────────────────────────────────────────────────────────
// ─── Color Math ───────────────────────────────────────────────────────────────
function rgbToHsl(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min)
        return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    if (max === r)
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g)
        h = ((b - r) / d + 2) / 6;
    else
        h = ((r - g) / d + 4) / 6;
    return { h: h * 360, s, l };
}
function hslToRgb(hsl) {
    const { s, l } = hsl;
    const h = hsl.h / 360;
    if (s === 0) {
        const v = Math.round(l * 255);
        return { r: v, g: v, b: v };
    }
    const hue2rgb = (p, q, t) => {
        const tt = ((t % 1) + 1) % 1;
        if (tt < 1 / 6)
            return p + (q - p) * 6 * tt;
        if (tt < 1 / 2)
            return q;
        if (tt < 2 / 3)
            return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
}
function rgbToHex(rgb) {
    return ("#" +
        [rgb.r, rgb.g, rgb.b]
            .map((v) => Math.round(v).toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase());
}
function clampRgb(rgb) {
    return {
        r: Math.round(Math.min(255, Math.max(0, rgb.r))),
        g: Math.round(Math.min(255, Math.max(0, rgb.g))),
        b: Math.round(Math.min(255, Math.max(0, rgb.b))),
    };
}
function relativeLuminance(rgb) {
    const lin = (c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}
/** Returns a dark or light text color for readability on top of bg. */
function contrastText(bg) {
    return relativeLuminance(bg) > 0.35 ? "#1a1a2e" : "#ffffff";
}
const HUE_BANDS = [
    { maxHue: 12, name: "Red" },
    { maxHue: 40, name: "Orange" },
    { maxHue: 68, name: "Yellow" },
    { maxHue: 155, name: "Green" },
    { maxHue: 195, name: "Cyan" },
    { maxHue: 258, name: "Blue" },
    { maxHue: 290, name: "Indigo" },
    { maxHue: 330, name: "Violet" },
    { maxHue: 348, name: "Pink" },
    { maxHue: 360, name: "Red" },
];
function getColorName(rgb) {
    const { h, s, l } = rgbToHsl(rgb);
    if (l < 0.08)
        return "Black";
    if (l > 0.92)
        return "White";
    if (s < 0.08)
        return l < 0.45 ? "Dark Gray" : "Light Gray";
    for (const band of HUE_BANDS) {
        if (h <= band.maxHue)
            return band.name;
    }
    return "Red";
}
// ─── Harmony Generation ───────────────────────────────────────────────────────
function wrapHue(h) {
    return ((h % 360) + 360) % 360;
}
function shiftHsl(base, dh, ds = 0, dl = 0) {
    return hslToRgb({
        h: wrapHue(base.h + dh),
        s: Math.min(1, Math.max(0.15, base.s + ds)),
        l: Math.min(0.88, Math.max(0.12, base.l + dl)),
    });
}
function generateHarmony(base, mode) {
    const hsl = rgbToHsl(base);
    switch (mode) {
        case "complementary":
            return [
                base,
                shiftHsl(hsl, 180),
                shiftHsl(hsl, 0, -0.15, +0.22),
                shiftHsl(hsl, 180, -0.15, +0.22),
                shiftHsl(hsl, 0, -0.25, -0.18),
            ];
        case "analogous":
            return [
                shiftHsl(hsl, -30),
                base,
                shiftHsl(hsl, +30),
                shiftHsl(hsl, 0, -0.1, +0.2),
                shiftHsl(hsl, 0, 0, -0.2),
            ];
        case "triadic":
            return [
                base,
                shiftHsl(hsl, 120),
                shiftHsl(hsl, 240),
                shiftHsl(hsl, 0, -0.15, +0.22),
                shiftHsl(hsl, 120, -0.15, +0.22),
            ];
        case "split-complementary":
            return [
                base,
                shiftHsl(hsl, 150),
                shiftHsl(hsl, 210),
                shiftHsl(hsl, 0, -0.15, +0.22),
                shiftHsl(hsl, 150, -0.15, +0.22),
            ];
    }
}
const CB_MATRICES = {
    protanopia: [
        [0.567, 0.433, 0.0],
        [0.558, 0.442, 0.0],
        [0.0, 0.242, 0.758],
    ],
    deuteranopia: [
        [0.625, 0.375, 0.0],
        [0.7, 0.3, 0.0],
        [0.0, 0.3, 0.7],
    ],
    tritanopia: [
        [0.95, 0.05, 0.0],
        [0.0, 0.433, 0.567],
        [0.0, 0.475, 0.525],
    ],
};
function simulateVision(rgb, mode) {
    if (mode === "normal")
        return rgb;
    const m = CB_MATRICES[mode];
    const { r, g, b } = rgb;
    return clampRgb({
        r: m[0][0] * r + m[0][1] * g + m[0][2] * b,
        g: m[1][0] * r + m[1][1] * g + m[1][2] * b,
        b: m[2][0] * r + m[2][1] * g + m[2][2] * b,
    });
}
// ─── ColorStudio App ──────────────────────────────────────────────────────────
class ColorStudio {
    constructor() {
        // State
        this.r = 255;
        this.g = 100;
        this.b = 50;
        this.harmony = "complementary";
        this.vision = "normal";
        this.sloshTimerId = 0;
        this.toastTimerId = 0;
        this.bindDomRefs();
        this.bindEvents();
        this.render();
    }
    // ─── DOM binding ───────────────────────────────────────────────────────────
    bindDomRefs() {
        this.sliderR = this.qs("#slider-r");
        this.sliderG = this.qs("#slider-g");
        this.sliderB = this.qs("#slider-b");
        this.valR = this.qs("#val-r");
        this.valG = this.qs("#val-g");
        this.valB = this.qs("#val-b");
        this.streamR = this.qs("#stream-r");
        this.streamG = this.qs("#stream-g");
        this.streamB = this.qs("#stream-b");
        this.bowlFill = this.qs("#bowl-fill");
        this.readoutSwatch = this.qs("#readout-swatch");
        this.readoutHex = this.qs("#readout-hex");
        this.readoutRgb = this.qs("#readout-rgb");
        this.readoutName = this.qs("#readout-name");
        this.baseSwatch = this.qs("#base-swatch");
        this.paletteContainer = this.qs("#palette-swatches");
        this.cbPaletteContainer = this.qs("#cb-palette");
        this.randomizeBtn = this.qs("#randomize-btn");
        this.toast = this.qs("#toast");
    }
    // ─── Event wiring ──────────────────────────────────────────────────────────
    bindEvents() {
        // Slider inputs
        const wireSlider = (slider, assign) => {
            slider.addEventListener("input", () => {
                assign(parseInt(slider.value, 10));
                this.triggerSlosh();
                this.render();
            });
        };
        wireSlider(this.sliderR, (v) => (this.r = v));
        wireSlider(this.sliderG, (v) => (this.g = v));
        wireSlider(this.sliderB, (v) => (this.b = v));
        // Harmony toggle buttons
        document
            .querySelectorAll(".harmony-btn")
            .forEach((btn) => {
            btn.addEventListener("click", () => {
                this.harmony = btn.dataset.mode;
                document
                    .querySelectorAll(".harmony-btn")
                    .forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                this.renderPalette();
                this.renderCbPalette();
            });
        });
        // Color blindness toggle buttons
        document
            .querySelectorAll(".cb-btn")
            .forEach((btn) => {
            btn.addEventListener("click", () => {
                this.vision = btn.dataset.vision;
                document
                    .querySelectorAll(".cb-btn")
                    .forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                this.renderCbPalette();
            });
        });
        // Randomize button
        this.randomizeBtn.addEventListener("click", () => {
            this.r = Math.floor(Math.random() * 256);
            this.g = Math.floor(Math.random() * 256);
            this.b = Math.floor(Math.random() * 256);
            this.sliderR.value = String(this.r);
            this.sliderG.value = String(this.g);
            this.sliderB.value = String(this.b);
            this.randomizeBtn.classList.remove("spinning");
            // Force reflow so the animation retriggers if clicked rapidly
            void this.randomizeBtn.offsetWidth;
            this.randomizeBtn.classList.add("spinning");
            this.triggerSlosh();
            this.render();
        });
    }
    // ─── Main render ───────────────────────────────────────────────────────────
    render() {
        const rgb = { r: this.r, g: this.g, b: this.b };
        const cssColor = `rgb(${this.r}, ${this.g}, ${this.b})`;
        const hex = rgbToHex(rgb);
        // Numeric value labels
        this.valR.textContent = String(this.r);
        this.valG.textContent = String(this.g);
        this.valB.textContent = String(this.b);
        // Liquid streams (width + opacity driven by channel value)
        this.updateStream(this.streamR, this.r);
        this.updateStream(this.streamG, this.g);
        this.updateStream(this.streamB, this.b);
        // Bowl fill: color + height proportional to total
        const total = this.r + this.g + this.b;
        const fillPct = 10 + (total / 765) * 72;
        this.bowlFill.style.backgroundColor = cssColor;
        this.bowlFill.style.height = `${fillPct}%`;
        this.bowlFill.style.boxShadow = `0 0 28px rgba(${this.r}, ${this.g}, ${this.b}, 0.4)`;
        // Color readout
        this.readoutSwatch.style.backgroundColor = cssColor;
        this.readoutHex.textContent = hex;
        this.readoutRgb.textContent = `rgb(${this.r}, ${this.g}, ${this.b})`;
        this.readoutName.textContent = getColorName(rgb);
        // Palette panel base swatch
        this.baseSwatch.style.backgroundColor = cssColor;
        // Dynamic CSS accent colour (used by harmony-btn.active, randomize-btn, etc.)
        document.documentElement.style.setProperty("--accent", cssColor);
        document.documentElement.style.setProperty("--accent-text", contrastText(rgb));
        this.renderPalette();
        this.renderCbPalette();
    }
    // ─── Stream helper ─────────────────────────────────────────────────────────
    updateStream(el, value) {
        const width = Math.round(3 + (value / 255) * 14);
        const opacity = value === 0 ? 0 : 0.35 + (value / 255) * 0.65;
        el.style.width = `${width}px`;
        el.style.opacity = String(opacity);
    }
    // ─── Slosh effect ──────────────────────────────────────────────────────────
    triggerSlosh() {
        this.bowlFill.classList.remove("sloshing");
        clearTimeout(this.sloshTimerId);
        // Force style recalculation so re-adding the class restarts the animation
        void this.bowlFill.offsetWidth;
        this.bowlFill.classList.add("sloshing");
        this.sloshTimerId = window.setTimeout(() => this.bowlFill.classList.remove("sloshing"), 600);
    }
    // ─── Palette rendering ─────────────────────────────────────────────────────
    renderPalette() {
        const colors = generateHarmony({ r: this.r, g: this.g, b: this.b }, this.harmony);
        this.buildSwatches(this.paletteContainer, colors, true);
    }
    renderCbPalette() {
        const colors = generateHarmony({ r: this.r, g: this.g, b: this.b }, this.harmony).map((c) => simulateVision(c, this.vision));
        this.buildSwatches(this.cbPaletteContainer, colors, false);
    }
    buildSwatches(container, colors, copyable) {
        container.innerHTML = "";
        colors.forEach((color) => {
            const hex = rgbToHex(color);
            const cssColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
            const swatch = document.createElement("div");
            swatch.className = "swatch";
            const colorDiv = document.createElement("div");
            colorDiv.className = "swatch-color";
            colorDiv.style.backgroundColor = cssColor;
            const label = document.createElement("span");
            label.className = "swatch-hex";
            label.textContent = hex;
            swatch.appendChild(colorDiv);
            swatch.appendChild(label);
            if (copyable) {
                swatch.title = "Click to copy hex code";
                swatch.style.cursor = "pointer";
                swatch.addEventListener("click", () => {
                    void this.copyToClipboard(hex);
                });
            }
            container.appendChild(swatch);
        });
    }
    // ─── Clipboard + Toast ─────────────────────────────────────────────────────
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast("Copied!");
        }
        catch (_a) {
            this.showToast("Copy failed");
        }
    }
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.remove("show");
        void this.toast.offsetWidth; // reflow to restart transition
        this.toast.classList.add("show");
        clearTimeout(this.toastTimerId);
        this.toastTimerId = window.setTimeout(() => {
            this.toast.classList.remove("show");
        }, 1800);
    }
    // ─── Utility ───────────────────────────────────────────────────────────────
    qs(selector) {
        const el = document.querySelector(selector);
        if (!el)
            throw new Error(`Element not found: ${selector}`);
        return el;
    }
}
// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    new ColorStudio();
});
//# sourceMappingURL=main.js.map