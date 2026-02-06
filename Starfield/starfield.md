# Starfield Particle System

## Assignment: Creating a Starfield

This project creates a webpage that uses a particle system to create a starfield animation with trail effects. The webpage includes interactive sliders that allow users to control various attributes of the animation.

## Features

### Main Task
- ✨ Dynamic starfield particle system with trail effects
- 🎛️ Interactive controls for customization
- 🌟 3D-to-2D projection for depth perception
- 💫 Brightness and glow effects based on star proximity

### Stretch Challenge
- Controls positioned outside the main animation area (right side)
- Semi-transparent background to maintain visibility
- Minimal obstruction of the starfield animation

## Controls

The starfield can be customized with the following parameters:

- **Star Count**: Adjust the number of stars (50-1000)
- **Speed**: Control how fast stars move toward the viewer (0.5-10)
- **Trail Length**: Modify the length of star trails (1-15)
- **Star Size**: Change the size of individual stars (0.5-5)
- **Brightness**: Adjust overall brightness (20-100%)
- **Reset Button**: Return all settings to default values

## Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Starfield Particle System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            overflow: hidden;
            background: #000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        canvas {
            display: block;
            background: radial-gradient(ellipse at center, #0a0a2e 0%, #000000 100%);
        }
        
        .controls {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 25px;
            border-radius: 12px;
            color: white;
            min-width: 280px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }
        
        .controls h2 {
            margin-bottom: 20px;
            font-size: 20px;
            text-align: center;
            color: #4a9eff;
            text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
        }
        
        .control-group {
            margin-bottom: 18px;
        }
        
        .control-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            color: #ccc;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .control-group .value {
            color: #4a9eff;
            font-weight: bold;
            font-size: 14px;
        }
        
        input[type="range"] {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.1);
            outline: none;
            -webkit-appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #4a9eff;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(74, 158, 255, 0.8);
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #4a9eff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 10px rgba(74, 158, 255, 0.8);
        }
        
        button {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            background: rgba(74, 158, 255, 0.2);
            color: #4a9eff;
            border: 1px solid #4a9eff;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        button:hover {
            background: rgba(74, 158, 255, 0.3);
            box-shadow: 0 0 15px rgba(74, 158, 255, 0.5);
        }
    </style>
</head>
<body>
    <canvas id="starfield"></canvas>
    
    <div class="controls">
        <h2>✨ Starfield Controls</h2>
        
        <div class="control-group">
            <label>
                <span>Star Count</span>
                <span class="value" id="countValue">300</span>
            </label>
            <input type="range" id="starCount" min="50" max="1000" value="300" step="50">
        </div>
        
        <div class="control-group">
            <label>
                <span>Speed</span>
                <span class="value" id="speedValue">2</span>
            </label>
            <input type="range" id="speed" min="0.5" max="10" value="2" step="0.5">
        </div>
        
        <div class="control-group">
            <label>
                <span>Trail Length</span>
                <span class="value" id="trailValue">5</span>
            </label>
            <input type="range" id="trailLength" min="1" max="15" value="5" step="1">
        </div>
        
        <div class="control-group">
            <label>
                <span>Star Size</span>
                <span class="value" id="sizeValue">2</span>
            </label>
            <input type="range" id="starSize" min="0.5" max="5" value="2" step="0.5">
        </div>
        
        <div class="control-group">
            <label>
                <span>Brightness</span>
                <span class="value" id="brightnessValue">80%</span>
            </label>
            <input type="range" id="brightness" min="20" max="100" value="80" step="5">
        </div>
        
        <button id="resetBtn">Reset to Defaults</button>
    </div>

    <script>
        const canvas = document.getElementById('starfield');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Particle system configuration
        let config = {
            starCount: 300,
            speed: 2,
            trailLength: 5,
            starSize: 2,
            brightness: 0.8
        };
        
        // Store default values
        const defaults = { ...config };
        
        // Particle class
        class Star {
            constructor() {
                this.reset();
                // Initialize at random position for initial spread
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.z = Math.random() * canvas.width;
            }
            
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.z = canvas.width;
                this.prevX = this.x;
                this.prevY = this.y;
            }
            
            update() {
                this.prevX = this.x;
                this.prevY = this.y;
                
                this.z -= config.speed;
                
                if (this.z <= 0) {
                    this.reset();
                }
                
                // 3D to 2D projection
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                const k = 128 / this.z;
                this.x = (this.x - centerX) * k + centerX;
                this.y = (this.y - centerY) * k + centerY;
            }
            
            draw() {
                // Calculate size based on depth
                const size = (1 - this.z / canvas.width) * config.starSize * 3;
                
                // Calculate opacity based on depth
                const opacity = Math.pow(1 - this.z / canvas.width, 2) * config.brightness;
                
                // Draw trail
                const gradient = ctx.createLinearGradient(this.prevX, this.prevY, this.x, this.y);
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity})`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(this.prevX, this.prevY);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                
                // Draw star point
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Add glow effect for closer stars
                if (this.z < canvas.width * 0.3) {
                    ctx.fillStyle = `rgba(150, 200, 255, ${opacity * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        
        // Create stars array
        let stars = [];
        
        function initStars() {
            stars = [];
            for (let i = 0; i < config.starCount; i++) {
                stars.push(new Star());
            }
        }
        
        // Animation loop
        function animate() {
            // Create trail effect by not completely clearing canvas
            ctx.fillStyle = `rgba(0, 0, 0, ${1 / config.trailLength})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw stars
            stars.forEach(star => {
                star.update();
                star.draw();
            });
            
            requestAnimationFrame(animate);
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars.forEach(star => star.reset());
        });
        
        // Control handlers
        document.getElementById('starCount').addEventListener('input', (e) => {
            config.starCount = parseInt(e.target.value);
            document.getElementById('countValue').textContent = config.starCount;
            initStars();
        });
        
        document.getElementById('speed').addEventListener('input', (e) => {
            config.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = config.speed;
        });
        
        document.getElementById('trailLength').addEventListener('input', (e) => {
            config.trailLength = parseInt(e.target.value);
            document.getElementById('trailValue').textContent = config.trailLength;
        });
        
        document.getElementById('starSize').addEventListener('input', (e) => {
            config.starSize = parseFloat(e.target.value);
            document.getElementById('sizeValue').textContent = config.starSize;
        });
        
        document.getElementById('brightness').addEventListener('input', (e) => {
            config.brightness = parseInt(e.target.value) / 100;
            document.getElementById('brightnessValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            config = { ...defaults };
            document.getElementById('starCount').value = defaults.starCount;
            document.getElementById('speed').value = defaults.speed;
            document.getElementById('trailLength').value = defaults.trailLength;
            document.getElementById('starSize').value = defaults.starSize;
            document.getElementById('brightness').value = defaults.brightness * 100;
            
            document.getElementById('countValue').textContent = defaults.starCount;
            document.getElementById('speedValue').textContent = defaults.speed;
            document.getElementById('trailValue').textContent = defaults.trailLength;
            document.getElementById('sizeValue').textContent = defaults.starSize;
            document.getElementById('brightnessValue').textContent = (defaults.brightness * 100) + '%';
            
            initStars();
        });
        
        // Initialize and start
        initStars();
        animate();
    </script>
</body>
</html>
```

## How It Works

### Particle System Architecture

1. **Star Class**: Each star is a particle with properties including:
   - Position (x, y, z coordinates)
   - Previous position (for trail effect)
   - Depth value for 3D projection

2. **3D Projection**: Stars move along the Z-axis toward the viewer, creating depth perception through mathematical projection from 3D to 2D coordinates.

3. **Trail Effect**: Achieved by:
   - Not completely clearing the canvas each frame
   - Drawing gradient lines from previous to current position
   - Using opacity to fade trails

4. **Visual Enhancements**:
   - Stars appear larger and brighter as they approach
   - Glow effect for nearby stars
   - Smooth gradient trails

## Usage

1. Save the code above as an `.html` file
2. Open it in any modern web browser
3. Use the control panel on the right to adjust parameters
4. Experiment with different combinations to create unique effects

## Technical Notes

- Uses HTML5 Canvas for rendering
- Implements requestAnimationFrame for smooth animation
- Responsive design that adapts to window resizing
- Pure vanilla JavaScript (no external dependencies)
