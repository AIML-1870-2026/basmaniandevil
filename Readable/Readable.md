# Readable Explorer — Specification

## Overview

**Readable** is a single-page web accessibility tool that allows users to explore how background color, text color, and text size combinations affect readability on digital screens. It calculates contrast ratios per WCAG guidelines and provides vision simulation to help users understand accessibility from multiple perspectives.

---

## Layout

The page is divided into two full-height columns with no scrolling on the outer page:

- **Left column (~60% width):** Preview panel — fixed, non-scrolling
- **Right column (~40% width):** Controls panel — independently scrollable

### App Chrome / Theme

The entire UI (outside the preview area) uses a dark gray DevTools-style theme:

| Element | Color |
|---|---|
| Page background | `#1e1e1e` |
| Panel backgrounds | `#2a2a2a` |
| Section/card backgrounds | `#333333` |
| Borders / dividers | `#3a3a3a` |
| Primary text | `#d4d4d4` |
| Secondary/label text | `#888888` |
| Accent (active states) | `#4fc3f7` (light blue) |
| PASS indicator | `#4caf50` (green) |
| FAIL indicator | `#f44336` (red) |

Font: `monospace` stack — `"JetBrains Mono", "Fira Code", "Consolas", monospace` for labels and values; `system-ui` for headings.

---

## Left Panel: Preview Area

The preview panel fills the full left column height with the selected background color. It displays **five sample text blocks** at different sizes, stacked vertically with spacing between them. Each block shows:

- A label in a small monospace font at the top (e.g., `48px / 36pt — Large Text`) rendered in a neutral overlay color (not affected by the text color selection) so it remains readable
- The sample sentence rendered in the selected text color and font size

### Text Size Samples (fixed set, always displayed)

| Label | Font Size | WCAG Category |
|---|---|---|
| `12px / 9pt` | 12px | Normal text |
| `16px / 12pt` | 16px | Normal text |
| `24px / 18pt` | Large text threshold |
| `32px / 24pt` | Large text |
| `48px / 36pt` | Large text |

### Sample Sentence

> "The quick brown fox jumps over the lazy dog."

This sentence is used for all five size samples.

### Vision Simulation

When a non-Normal vision type is selected, a CSS `filter: url(#vision-filter)` is applied to the entire preview panel using an inline SVG `<feColorMatrix>` element. Color controls are disabled in this mode (see Controls Panel). The preview updates in real time.

---

## Right Panel: Controls

The controls panel is a single scrollable column. Sections are visually separated by subtle dividers. Each section has a small uppercase monospace label header (e.g., `WCAG COMPLIANCE`, `CONTRAST`, `BACKGROUND COLOR`).

### Section 1 — WCAG Compliance Indicator (top of panel)

Two badge rows displayed side by side:

```
[ NORMAL TEXT  4.5:1 ]  [ ✓ PASS ]
[ LARGE TEXT   3:1   ]  [ ✗ FAIL ]
```

- The threshold ratio is shown statically
- The current ratio is shown dynamically next to the threshold
- A colored badge shows PASS (green background) or FAIL (red background)
- Both badges update in real time whenever colors change

### Section 2 — Contrast Ratio & Luminance

Displays three read-only values:

```
Contrast Ratio     7.23 : 1
Background Lum.    0.2126
Text Lum.          0.0150
```

Monospace font, right-aligned values. All update in real time.

#### Contrast Ratio Calculation (WCAG)

1. For each RGB channel, normalize: `c = channel / 255`
2. Apply gamma correction:
   - If `c <= 0.04045`: `c / 12.92`
   - Else: `((c + 0.055) / 1.055) ^ 2.4`
3. Relative luminance: `L = 0.2126*R + 0.7152*G + 0.0722*B`
4. Contrast ratio: `(L_lighter + 0.05) / (L_darker + 0.05)`
5. Display as `X.XX:1` (rounded to 2 decimal places)

### Section 3 — Background Color

Header: `BACKGROUND COLOR`

A color swatch (20×20px rounded square) showing the current background color sits next to the section header.

Three rows, one per channel:

```
R  [========|----]  [255]
G  [===|---------]  [ 80]
B  [=======|-----]  [200]
```

Each row contains:
- A single-letter label (`R`, `G`, `B`)
- A range slider (0–255, step 1)
- A number input (0–255, integer only)

**Synchronization:** Moving the slider updates the number input instantly. Changing the number input updates the slider instantly. Both trigger a live preview and recalculation update.

### Section 4 — Text Color

Header: `TEXT COLOR`

Identical structure to the Background Color section, with its own R/G/B slider+input rows and a color swatch.

### Section 5 — Text Size

Header: `TEXT SIZE`

```
Size  [========|-----]  [24] px
```

- Slider range: 8–72px, step 1
- Synced integer input
- Updates only the **user-selected text size** shown at the bottom of the preview's size stack. The four fixed-size rows remain unchanged.

> **Note:** The text size control sets the font size of the bottom preview row only, replacing the `48px` sample. The other four rows are always fixed. Alternatively, if simpler: the text size control sets a sixth independent "custom size" row at the bottom of the preview panel labeled `Custom`.

**Implementation choice (preferred):** Add a sixth row at the bottom labeled `[custom size]px / custom` that uses the slider value. The other five rows remain fixed.

### Section 6 — Preset Color Schemes

Header: `PRESETS`

A 2×N grid of buttons. Each button shows:
- A small color preview split diagonally (top-left triangle = background color, bottom-right = text color)
- A short label beneath

| Label | Background | Text |
|---|---|---|
| Black on White | `#ffffff` | `#000000` |
| White on Black | `#000000` | `#ffffff` |
| Navy on Cream | `#fdf6e3` | `#1a1a4e` |
| Yellow on Black | `#000000` | `#ffff00` |
| Gray on White | `#ffffff` | `#767676` |
| Dark on Teal | `#008080` | `#1a1a1a` |

Clicking a preset immediately updates all six RGB sliders/inputs, the preview, and recalculates contrast.

### Section 7 — Vision Simulation

Header: `VISION SIMULATION`

A horizontal row of radio buttons styled as toggle pills:

```
( Normal ) ( Protanopia ) ( Deuteranopia ) ( Tritanopia ) ( Monochromacy )
```

- Default selection: `Normal`
- When any non-Normal option is selected:
  - Apply the corresponding SVG color matrix filter to the preview panel
  - Disable (visually gray out) the Background Color and Text Color sliders and inputs
  - Show a small note: `"Color controls disabled during simulation"`
- When `Normal` is re-selected:
  - Remove the filter
  - Re-enable color controls

#### SVG Color Matrix Values

Use an inline `<svg>` with `<filter id="vision-filter">` containing `<feColorMatrix type="matrix" values="..."/>`. Update the `values` attribute via JavaScript when the selection changes.

| Vision Type | Matrix |
|---|---|
| Normal | Identity (no filter) |
| Protanopia | `0.567 0.433 0 0 0 / 0.558 0.442 0 0 0 / 0 0.242 0.758 0 0 / 0 0 0 1 0` |
| Deuteranopia | `0.625 0.375 0 0 0 / 0.7 0.3 0 0 0 / 0 0.3 0.7 0 0 / 0 0 0 1 0` |
| Tritanopia | `0.95 0.05 0 0 0 / 0 0.433 0.567 0 0 / 0 0.475 0.525 0 0 / 0 0 0 1 0` |
| Monochromacy | `0.299 0.587 0.114 0 0 / 0.299 0.587 0.114 0 0 / 0.299 0.587 0.114 0 0 / 0 0 0 1 0` |

---

## File Structure

```
readable/
├── index.html       # All HTML structure
├── style.css        # All styles
└── script.js        # All JavaScript logic
```

No external libraries or frameworks. Vanilla HTML, CSS, and JavaScript only.

---

## Interactions Summary

| Action | Effect |
|---|---|
| Move any RGB slider | Updates paired number input, preview background/text color, contrast ratio, luminance values, WCAG badges |
| Type in any RGB number input | Clamps value to 0–255, updates paired slider and all derived displays |
| Move text size slider | Updates paired number input, updates custom preview row font size |
| Click a preset button | Sets all 6 RGB inputs+sliders, updates all derived displays |
| Select a vision type | Applies SVG filter to preview, disables color controls if non-Normal |
| Select Normal vision | Removes filter, re-enables color controls |

---

## Initial State

| Setting | Default Value |
|---|---|
| Background Color | `rgb(255, 255, 255)` — white |
| Text Color | `rgb(0, 0, 0)` — black |
| Text Size | `24px` |
| Vision Type | Normal |

---

## Accessibility Notes

- All sliders have `aria-label` attributes
- PASS/FAIL badges include both color and text (never color alone)
- The app itself should meet WCAG AA contrast standards in its UI chrome
- Vision simulation radio buttons use proper `<input type="radio">` with `<label>` elements
