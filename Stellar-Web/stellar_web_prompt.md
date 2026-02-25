# Stellar Web Visualization Prompt

Create an interactive webpage that displays a "Stellar Web" particle system with the following specifications:

## Core Visualization Requirements

### Particle System (Nodes)
- Create multiple nodes (particles) that move through 3D space
- Each node should drift continuously with smooth motion
- Nodes should have varying positions in x, y, and z coordinates
- Node appearance should reflect their depth in 3D space (size and opacity based on z-position)

### Network Connections (Edges)
- Draw edges (lines) between any two nodes that are within a defined **connectivity radius**
- Edge thickness should vary based on the distance between nodes (closer nodes = thicker edges)
- Edge opacity/transparency should also vary with distance (closer = more opaque)
- Only connect nodes that are close enough as determined by the connectivity radius parameter

### Visual Effects
- Use depth effects where nodes further away appear smaller and more transparent
- Create a sense of 3D space even on a 2D canvas
- Smooth, continuous animation with nodes drifting naturally
- The web structure should dynamically form and dissolve as nodes move in and out of connectivity range

## Interactive Controls (Sliders)

Provide sliders that allow users to adjust:
1. **Connectivity Radius** - the maximum distance at which two nodes will be connected by an edge
2. **Number of Nodes** - how many particles are in the system
3. **Node Speed** - how fast particles drift through space
4. **Edge Thickness** - the base thickness of connection lines
5. **Edge Opacity** - the base transparency level of edges

## Technical Implementation

- Use HTML5 Canvas for rendering
- Implement smooth animation using requestAnimationFrame
- Calculate distances between all node pairs to determine which should be connected
- Use 3D coordinate system but project to 2D for display
- Sliders should update the visualization in real-time

## Visual Style

- Dark background (space-like theme)
- Bright nodes (star-like particles)
- Subtle, glowing edges connecting nearby nodes
- Overall aesthetic should evoke a cosmic network or constellation

## Stretch Goals (Optional)

- Position sliders outside the main canvas area or in a collapsible side panel
- Add mouse interaction (nodes attracted to or repelled by cursor)
- Display network statistics: total edges, average connections per node, network density
- Add color gradients based on edge length or node velocity
- Implement pulsing effects on nodes or edges

Create a complete, self-contained HTML file with inline CSS and JavaScript that implements this Stellar Web visualization.
