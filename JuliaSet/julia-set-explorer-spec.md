# Julia Set Explorer - Technical Specification

## Project Overview
A web-based interactive Julia Set fractal explorer designed for enthusiasts who want to explore the beauty of Julia sets through intuitive controls and smooth interactions.

## Target Audience
Mathematics and fractal enthusiasts who appreciate visual beauty and want hands-on exploration without overwhelming technical complexity.

## Core Features

### 1. Interactive Navigation
- **Click to Zoom**: Click anywhere on the canvas to zoom into that point
  - Default zoom factor: 2x per click
  - Smooth zoom animation (300ms duration)
- **Pan/Drag**: Click and drag to move around the complex plane
  - Intuitive mouse-based panning
  - Update view in real-time during drag
- **Zoom Controls**: 
  - Zoom in/out buttons with visual feedback
  - Reset view button to return to default viewport

### 2. Julia Set Parameters
- **Complex Parameter (c)**: 
  - Real component: adjustable via slider (-2.0 to 2.0, step 0.01)
  - Imaginary component: adjustable via slider (-2.0 to 2.0, step 0.01)
  - Display current values numerically
  - Real-time rendering as sliders move (with debouncing for performance)

### 3. Preset Gallery
Include at least 8-10 visually interesting preset Julia sets:
- **Classic Julia Set** (c = -0.7 + 0.27i)
- **Dendrite** (c = -0.4 + 0.6i)
- **Spiral** (c = -0.75 + 0.11i)
- **Dragon** (c = -0.8 + 0.156i)
- **Douady's Rabbit** (c = -0.123 + 0.745i)
- **Airplane** (c = -0.194 + 0.6557i)
- **Siegel Disk** (c = -0.391 - 0.587i)
- **San Marco** (c = -0.75 + 0i)

Each preset should:
- Have a thumbnail preview
- Show name and complex parameter value
- Apply with smooth transition animation

### 4. Color Schemes
Provide 5-6 distinct color palettes:
- **Classic** (blue to white gradient)
- **Fire** (black → red → orange → yellow → white)
- **Ocean** (deep blue → cyan → white)
- **Psychedelic** (vibrant rainbow spectrum)
- **Monochrome** (black to white grayscale)
- **Sunset** (purple → pink → orange → yellow)

Color scheme selector should show visual preview of each palette.

### 5. Animation System
- **Parameter Animation**: 
  - Animate the complex parameter c along a path (circular or linear)
  - Controls: Play/Pause, Speed adjustment (0.5x to 2x)
  - Animation duration: configurable (5-30 seconds per cycle)
  - Smooth interpolation between frames
- **Animation Paths**:
  - Circular path around a center point
  - Figure-8 pattern
  - Custom path (optional advanced feature)

### 6. Rendering Settings
- **Max Iterations**: Slider control (50-500 range)
  - Higher values = more detail but slower rendering
  - Display current value
- **Resolution**: Canvas adapts to window size
  - Minimum: 600x600px
  - Maximum: 1200x1200px (or fill viewport)
- **Anti-aliasing**: Optional toggle for smoother rendering

## User Interface Layout

### Primary Canvas Area (Center)
- Full-width canvas taking 70-80% of viewport
- Responsive sizing
- Cursor changes to crosshair for zoom, grab hand for pan
- Subtle border or shadow for depth

### Control Panel (Side or Bottom)
Organized into collapsible sections:

#### Section 1: Navigation
- Zoom In / Zoom Out buttons
- Reset View button
- Current zoom level indicator

#### Section 2: Parameters
- Real(c) slider with numeric input
- Imaginary(c) slider with numeric input
- Display: c = a + bi (formatted)

#### Section 3: Presets
- Grid of preset thumbnails (2-3 columns)
- Hover shows name
- Click to apply

#### Section 4: Appearance
- Color scheme dropdown or visual picker
- Max iterations slider

#### Section 5: Animation
- Play/Pause button
- Speed control slider
- Animation path selector
- Progress indicator

### Header
- Title: "Julia Set Explorer"
- Brief tagline: "Explore the infinite beauty of fractal mathematics"
- Info/Help button (opens modal with explanation)

### Footer
- Performance indicator (FPS or render time)
- Credits/About link

## Technical Requirements

### Technology Stack
- **HTML5 Canvas** for rendering
- **Pure JavaScript** (ES6+) or lightweight framework (React/Vue optional)
- **CSS3** for styling and animations
- **No external rendering libraries** (WebGL optional for performance)

### Performance Considerations
- Debounce parameter changes during slider drag (150ms)
- Use Web Workers for Julia set calculation (offload from main thread)
- Implement progressive rendering for high iteration counts
- Cache calculations when possible
- Target: 30+ FPS for smooth animations

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- Canvas 2D rendering context

### File Structure
```
julia-set-explorer/
├── index.html          # Main HTML structure
├── css/
│   ├── style.css       # Main styles
│   └── controls.css    # Control panel styles
├── js/
│   ├── main.js         # Application initialization
│   ├── julia.js        # Julia set calculation
│   ├── renderer.js     # Canvas rendering
│   ├── controls.js     # UI controls and events
│   ├── presets.js      # Preset configurations
│   ├── colors.js       # Color scheme definitions
│   └── animator.js     # Animation logic
└── README.md          # Documentation
```

## Mathematical Foundation

### Julia Set Definition
For a complex parameter c, the Julia set is defined by iterating:
```
z(n+1) = z(n)² + c
```

Starting with initial value z(0) = pixel coordinate in complex plane.

A point belongs to the Julia set if the iteration remains bounded (doesn't escape to infinity).

### Escape Criteria
- If |z(n)| > 2 (or 4 for |z|²), consider the point escaped
- Color based on iteration count when escaped
- Points that don't escape within max iterations are in the set (typically colored black)

### Viewport Mapping
- Default view: -2 to 2 on both real and imaginary axes
- Map pixel coordinates (x, y) to complex coordinates (real, imag)
- Handle zoom by adjusting the coordinate range

## Color Mapping
- Map iteration count to color palette
- Smooth coloring using continuous iteration count (optional enhancement)
- Interior of set (non-escaping points) typically black or distinct color

## User Experience Details

### Visual Feedback
- Hover effects on all interactive elements
- Loading indicator during heavy computation
- Smooth transitions for parameter changes
- Clear visual distinction between controls

### Tooltips
- Parameter sliders show current value on hover
- Preset thumbnails show full name
- Buttons have descriptive tooltips

### Responsive Design
- Adapt layout for different screen sizes
- Touch-friendly controls for tablets
- Minimum width: 768px (suggest landscape mode for smaller devices)

### Accessibility
- Keyboard navigation support
- ARIA labels for controls
- Sufficient color contrast
- Focus indicators

## Future Enhancement Ideas (Out of Scope for V1)
- Save/load custom configurations
- Export high-resolution images
- Share Julia set via URL parameters
- Multiple Julia sets side-by-side comparison
- 3D visualization mode
- Custom color gradient editor
- Fractal flame variations
- Mandelbrot set integration (click to select c value)

## Success Criteria
- Smooth interaction with no lag on modern hardware
- Intuitive controls that require minimal learning
- Visually appealing default state
- Renders mathematically accurate Julia sets
- Responsive and works across browsers
- Animations run smoothly at 30+ FPS

## Development Phases

### Phase 1: Core Rendering
- Basic Julia set calculation
- Canvas rendering
- Simple parameter controls

### Phase 2: Interactivity
- Click-to-zoom
- Pan/drag navigation
- Preset gallery

### Phase 3: Visual Enhancement
- Color schemes
- Smooth animations
- UI polish

### Phase 4: Optimization & Polish
- Web Workers for performance
- Animation system
- Final UX improvements

## Notes for Implementation
- Start with a simple, working version and iterate
- Prioritize performance - fractals can be computationally expensive
- Test with various parameter values to ensure stability
- Consider using requestAnimationFrame for smooth animations
- Implement proper event cleanup to prevent memory leaks
