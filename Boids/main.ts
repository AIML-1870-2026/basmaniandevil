// Types
interface Params {
    population: number;
    maxSpeed: number;
    maxForce: number;
    size: number;
    perception: number;
    separation: number;
    alignment: number;
    cohesion: number;
    trailFade: number;
}

interface ControlConfig {
    id: string;
    param: keyof Params;
    display: string;
}

// Canvas setup
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Resize canvas to fill window
function resizeCanvas(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Parameters
const params: Params = {
    population: 150,
    maxSpeed: 4,
    maxForce: 0.2,
    size: 15,
    perception: 50,
    separation: 1.5,
    alignment: 1.0,
    cohesion: 1.0,
    trailFade: 0.15
};

let isPaused = false;
let flock: Flock;

// Vector class for physics calculations
class Vector {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    add(v: Vector): Vector {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v: Vector): Vector {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n: number): Vector {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n: number): Vector {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector {
        const m = this.mag();
        if (m > 0) this.div(m);
        return this;
    }

    limit(max: number): Vector {
        if (this.mag() > max) {
            this.normalize().mult(max);
        }
        return this;
    }

    setMag(n: number): Vector {
        this.normalize().mult(n);
        return this;
    }

    copy(): Vector {
        return new Vector(this.x, this.y);
    }

    static sub(v1: Vector, v2: Vector): Vector {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static dist(v1: Vector, v2: Vector): number {
        return Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
    }

    static random(): Vector {
        const angle = Math.random() * Math.PI * 2;
        return new Vector(Math.cos(angle), Math.sin(angle));
    }
}

// Boid class
class Boid {
    position: Vector;
    velocity: Vector;
    acceleration: Vector;

    constructor(x: number, y: number) {
        this.position = new Vector(x, y);
        this.velocity = Vector.random().mult(Math.random() * 2 + 2);
        this.acceleration = new Vector();
    }

    edges(): void {
        // Wrap around edges
        if (this.position.x > canvas.width) this.position.x = 0;
        if (this.position.x < 0) this.position.x = canvas.width;
        if (this.position.y > canvas.height) this.position.y = 0;
        if (this.position.y < 0) this.position.y = canvas.height;
    }

    align(boids: Boid[]): Vector {
        const steering = new Vector();
        let total = 0;

        for (const other of boids) {
            const d = Vector.dist(this.position, other.position);
            if (other !== this && d < params.perception) {
                steering.add(other.velocity);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.setMag(params.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(params.maxForce);
        }

        return steering;
    }

    cohesion(boids: Boid[]): Vector {
        const steering = new Vector();
        let total = 0;

        for (const other of boids) {
            const d = Vector.dist(this.position, other.position);
            if (other !== this && d < params.perception) {
                steering.add(other.position);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.setMag(params.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(params.maxForce);
        }

        return steering;
    }

    separation(boids: Boid[]): Vector {
        const steering = new Vector();
        let total = 0;

        for (const other of boids) {
            const d = Vector.dist(this.position, other.position);
            if (other !== this && d < params.perception * 0.5) {
                const diff = Vector.sub(this.position, other.position);
                diff.div(d * d);
                steering.add(diff);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.setMag(params.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(params.maxForce);
        }

        return steering;
    }

    flock(boids: Boid[]): void {
        const alignment = this.align(boids).mult(params.alignment);
        const cohesion = this.cohesion(boids).mult(params.cohesion);
        const separation = this.separation(boids).mult(params.separation);

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
    }

    update(): void {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(params.maxSpeed);
        this.acceleration.mult(0);
    }

    draw(): void {
        const angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
        const size = params.size;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Head
        ctx.beginPath();
        ctx.arc(0, -size * 0.8, size * 0.25, 0, Math.PI * 2);
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.55);
        ctx.lineTo(0, size * 0.2);
        ctx.stroke();

        // Arms
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size * 0.1);
        ctx.lineTo(0, -size * 0.35);
        ctx.lineTo(size * 0.4, -size * 0.1);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(-size * 0.35, size * 0.7);
        ctx.lineTo(0, size * 0.2);
        ctx.lineTo(size * 0.35, size * 0.7);
        ctx.stroke();

        ctx.restore();
    }
}

// Flock class
class Flock {
    boids: Boid[];

    constructor() {
        this.boids = [];
    }

    addBoid(boid: Boid): void {
        this.boids.push(boid);
    }

    removeBoid(): void {
        this.boids.pop();
    }

    run(): void {
        for (const boid of this.boids) {
            boid.flock(this.boids);
            boid.update();
            boid.edges();
            boid.draw();
        }
    }
}

// Initialize flock
function initFlock(): void {
    flock = new Flock();
    for (let i = 0; i < params.population; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        flock.addBoid(new Boid(x, y));
    }
}

// Adjust population
function adjustPopulation(): void {
    const diff = params.population - flock.boids.length;
    if (diff > 0) {
        for (let i = 0; i < diff; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            flock.addBoid(new Boid(x, y));
        }
    } else if (diff < 0) {
        for (let i = 0; i < -diff; i++) {
            flock.removeBoid();
        }
    }
}

// FPS tracking
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// Animation loop
function animate(): void {
    // FPS calculation
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        document.getElementById('fps')!.textContent = String(fps);
        document.getElementById('boidCount')!.textContent = String(flock.boids.length);
    }

    // Trail effect
    ctx.fillStyle = `rgba(0, 0, 0, ${params.trailFade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isPaused) {
        flock.run();
    } else {
        // Still draw when paused
        for (const boid of flock.boids) {
            boid.draw();
        }
    }

    requestAnimationFrame(animate);
}

// Control panel event listeners
function setupControls(): void {
    const controls: ControlConfig[] = [
        { id: 'population', param: 'population', display: 'populationValue' },
        { id: 'maxSpeed', param: 'maxSpeed', display: 'maxSpeedValue' },
        { id: 'size', param: 'size', display: 'sizeValue' },
        { id: 'perception', param: 'perception', display: 'perceptionValue' },
        { id: 'separation', param: 'separation', display: 'separationValue' },
        { id: 'alignment', param: 'alignment', display: 'alignmentValue' },
        { id: 'cohesion', param: 'cohesion', display: 'cohesionValue' }
    ];

    controls.forEach(ctrl => {
        const input = document.getElementById(ctrl.id) as HTMLInputElement;
        const display = document.getElementById(ctrl.display)!;

        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            (params as any)[ctrl.param] = value;
            display.textContent = String(value);

            if (ctrl.param === 'population') {
                adjustPopulation();
            }
        });
    });

    // Pause button
    const pauseBtn = document.getElementById('pauseBtn')!;
    pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Play' : 'Pause';
    });

    // Reset button
    document.getElementById('resetBtn')!.addEventListener('click', () => {
        initFlock();
    });
}

// Initialize
initFlock();
setupControls();
animate();
