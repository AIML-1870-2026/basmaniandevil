# Turing Patterns Explorer - Project Specification

## Project Overview
An interactive web-based Turing Patterns explorer that simulates reaction-diffusion systems, allowing users to visualize how simple chemical rules create complex patterns like those found in nature (leopard spots, zebra stripes, etc.).

## Core Features

### 1. Simulation Canvas
- Large, central canvas (minimum 512x512 pixels, ideally scalable)
- Real-time rendering of reaction-diffusion patterns
- Smooth animation at reasonable frame rate (30-60 FPS)
- Interactive - users can click/drag to disturb the chemical concentrations

### 2. Parameter Controls
- **Feed Rate (F)** slider with precise control (range: 0.01 - 0.10)
- **Kill Rate (K)** slider with precise control (range: 0.04 - 0.07)
- Display current F and K values numerically
- Real-time updates as parameters change

### 3. Pattern Presets
Buttons for interesting parameter combinations:
- **Spots** (F=0.0545, K=0.062)
- **Stripes** (F=0.035, K=0.065)
- **Waves** (F=0.014, K=0.054)
- **Maze** (F=0.029, K=0.057)
- **Spirals** (F=0.018, K=0.051)

### 4. Parameter Space Diagram
- Visual map showing different pattern regions
- Clickable to jump to specific F/K combinations
- Indicate current position in parameter space
- Visual guide showing which regions produce spots, stripes, etc.

### 5. Interactive Controls
- **Pause/Play** button to freeze/resume simulation
- **Reset** button to randomize initial conditions
- **Clear** button to set canvas to uniform state
- **Speed** control (slow/normal/fast)

### 6. Drawing Tools
- Brush tool to add chemical A or B to the canvas
- Adjustable brush size slider
- Toggle between adding activator or inhibitor
- Visual indicator of which chemical is selected

### 7. Visual Design
- Clean, modern interface with good contrast
- Color scheme selector with at least 3 options:
  - Classic (grayscale)
  - Viridis (scientific colormap)
  - Heat (warm colors)
  - Custom (your choice)
- Smooth color gradients representing chemical concentrations
- Responsive layout that works on different screen sizes

### 8. Information Panel
- Brief explanation of what Turing patterns are
- Description of current parameters and their effect
- Instructions for interaction
- Toggle to show/hide detailed information

### 9. Export Function
- **Save Image** button to download current pattern as PNG
- Filename includes timestamp and parameters

## User Interface Layout

```
┌─────────────────────────────────────────────────────┐
│                   Header / Title                     │
├──────────────────┬──────────────────────────────────┤
│                  │                                   │
│   Controls       │                                   │
│   Panel          │      Simulation Canvas            │
│                  │                                   │
│   - Presets      │                                   │
│   - Sliders      │                                   │
│   - Speed        │                                   │
│   - Draw Tools   │                                   │
│   - Colors       │                                   │
│                  │                                   │
├──────────────────┴──────────────────────────────────┤
│         Parameter Space Diagram (clickable)          │
├─────────────────────────────────────────────────────┤
│              Info Panel (collapsible)                │
└─────────────────────────────────────────────────────┘
```

## Interaction Behaviors

### Mouse/Touch Interactions
- **Click/Tap on canvas**: Add a burst of chemical at that point
- **Drag on canvas**: Paint a trail of chemical
- **Click on parameter space**: Jump to that F/K combination
- **Hover on presets**: Show tooltip with pattern description

### Parameter Changes
- When F or K changes, simulation continues with new parameters
- Smooth transition between parameter values
- Visual feedback showing current state

### Drawing Mode
- Select chemical type (activator/inhibitor)
- Adjust brush size
- Click or drag to add chemicals
- Visual cursor showing brush size

## Technical Requirements

### Implementation
- Pure HTML5, CSS3, and vanilla JavaScript (no external frameworks required)
- Canvas API for rendering
- Efficient numerical implementation of Gray-Scott reaction-diffusion
- RequestAnimationFrame for smooth animation

### Performance
- Maintain 30+ FPS on modern browsers
- Optimize computation loop
- Use appropriate grid resolution (balance between detail and performance)

### Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for tablets and desktops
- Touch-friendly controls

## Gray-Scott Reaction-Diffusion Model

The simulation should implement the Gray-Scott model:
```
dA/dt = Da∇²A - AB² + F(1-A)
dB/dt = Db∇²B + AB² - (K+F)B
```

Where:
- A is the activator chemical
- B is the inhibitor chemical
- Da = 1.0 (diffusion rate of A)
- Db = 0.5 (diffusion rate of B)
- F = feed rate (user controlled)
- K = kill rate (user controlled)

## Stretch Goals (Optional)

1. **Animation Path**: Smoothly animate through parameter space
2. **Multiple Models**: Switch between Gray-Scott, Brusselator, etc.
3. **Gallery**: Save and recall favorite patterns
4. **High-Res Export**: Generate larger resolution for printing
5. **Side-by-Side**: Compare two parameter sets simultaneously
6. **Mobile Optimization**: Enhanced touch controls for phones

## Deployment

- Host on GitHub Pages
- Include README with project description and usage instructions
- Clean, well-commented code
- Proper file organization (separate HTML, CSS, JS files)

---

## Notes for Implementation

- Start with a working simulation first, then add UI features
- Test parameter ranges to ensure interesting patterns
- Consider performance optimization for grid size
- Make sure color schemes are accessible and visually appealing
- Add loading state if initialization takes time
