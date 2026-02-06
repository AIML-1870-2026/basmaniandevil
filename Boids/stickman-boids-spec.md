# Project Specification: 3D Stickman Boids Simulation

## Objective
Create a single-file web application (HTML/CSS/JavaScript) that simulates flocking behavior (Boids) in **3D space** where the individual agents are rendered as white stickmen flying through a dark environment.

## Technical Requirements
- **Language:** HTML5, CSS3, and Vanilla JavaScript (using Three.js via CDN).
- **Architecture:** Use a `Boid` class to handle 3D physics and a `Flock` class to manage the collection.
- **Rendering:** Three.js for WebGL-based 3D graphics.
- **Performance:** Optimized for at least 200 agents at 60fps.

## The "Boids" Logic (Reynolds' Rules) - 3D
Implement the three core behaviors using **3D vector math** (x, y, z):

1. **Separation:** Avoid crowding local flockmates in 3D space.
2. **Alignment:** Steer towards the average heading of local flockmates.
3. **Cohesion:** Steer toward the average position of local flockmates.
4. **Boundary Handling:** Boids should wrap around a cubic boundary or gently steer back into the defined 3D volume.

## Visual Style
- **Background:** Dark space/void (black or deep blue gradient).
- **Boids:** Rendered as white 3D stickmen using Three.js geometry (lines/cylinders/spheres).
    - The stickman should orient/rotate to face the direction of its velocity.
    - Give them a simple 3D head (sphere), torso (cylinder/line), arms, and legs.
    - Arms and legs should have subtle animation to simulate running/flying motion.
- **Lighting:** Ambient light with optional directional light for depth perception.
- **Trail Effect (Optional):** Fading line trails showing recent movement paths.

## Camera Controls
- **Orbit Controls:** Allow user to rotate, pan, and zoom the camera around the scene.
- **Follow Mode (Optional):** Camera can follow a selected boid.
- **Preset Views:** Buttons for top-down, side, and isometric views.

## Interactive Control Panel
Create a floating or sidebar UI with sliders for the following parameters:

- **Population:** Total number of stickmen (Range: 1 to 500).
- **Max Speed:** How fast they can move.
- **Stickman Size:** Scale the stickman rendering.
- **Perception Radius:** How far a boid can "see" others in 3D space.
- **Rule Weights:** Individual sliders for Separation, Alignment, and Cohesion strength.
- **Boundary Size:** Adjust the size of the 3D bounding box/sphere.
- **Show Boundary:** Toggle visibility of the boundary wireframe.

## UX Features
- Responsive design (Canvas fills the window).
- A "Reset" button to randomize positions in 3D space.
- A "Pause/Play" toggle.
- Mouse/touch orbit controls for camera manipulation.
- Visual boundary box/sphere wireframe to show the simulation volume.

## Implementation Notes
- Use Three.js OrbitControls for camera interaction.
- Use `requestAnimationFrame` for smooth animation loop.
- Consider spatial partitioning (e.g., octree) for performance with high boid counts in 3D.
- Use `THREE.Vector3` for all position and velocity calculations.
- Apply quaternion or lookAt rotations to orient stickmen toward their velocity.
- Normalize vectors appropriately to prevent erratic behavior.
- Apply force limits to maintain realistic movement.

## Deliverable
A single `.html` file containing all HTML structure, CSS styling, and JavaScript logic (with Three.js loaded via CDN) that can be opened directly in a modern web browser.
