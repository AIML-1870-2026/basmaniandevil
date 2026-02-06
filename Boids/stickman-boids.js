import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Settings
const settings = {
    population: 80,
    maxSpeed: 0.4,
    size: 5,
    perception: 25,
    separation: 2.0,
    alignment: 0.8,
    cohesion: 0.5,
    carCount: 8
};

const STREET_SIZE = 200;
const ROAD_WIDTH = 40;
const SIDEWALK_WIDTH = 25;

let paused = false;
let flock = [];
let cars = [];
let scene, camera, renderer, controls;

// Initialize Three.js scene
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Add fog for depth
    scene.fog = new THREE.Fog(0x87CEEB, 150, 500);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(80, 120, 150);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 400;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 0, 0);

    // Lighting - bright daytime
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 150, 50);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Secondary fill light
    const fillLight = new THREE.DirectionalLight(0xffffee, 0.5);
    fillLight.position.set(-50, 100, -50);
    scene.add(fillLight);

    // Hemisphere light for natural outdoor lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.6);
    scene.add(hemiLight);

    // Build the street scene
    createStreetScene();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function createStreetScene() {
    // Ground base
    const groundGeometry = new THREE.PlaneGeometry(STREET_SIZE * 2, STREET_SIZE * 2);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5a4a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Roads (asphalt)
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    // Horizontal road
    const hRoadGeometry = new THREE.PlaneGeometry(STREET_SIZE * 2, ROAD_WIDTH);
    const hRoad = new THREE.Mesh(hRoadGeometry, roadMaterial);
    hRoad.rotation.x = -Math.PI / 2;
    hRoad.position.y = 0;
    scene.add(hRoad);

    // Vertical road
    const vRoadGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, STREET_SIZE * 2);
    const vRoad = new THREE.Mesh(vRoadGeometry, roadMaterial);
    vRoad.rotation.x = -Math.PI / 2;
    vRoad.position.y = 0.01;
    scene.add(vRoad);

    // Road markings - center lines (yellow)
    const yellowLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

    // Create dashed center lines
    for (let i = -STREET_SIZE; i < STREET_SIZE; i += 8) {
        if (Math.abs(i) > ROAD_WIDTH / 2 + 5) {
            // Horizontal road center line
            const hLineGeom = new THREE.PlaneGeometry(4, 0.5);
            const hLine = new THREE.Mesh(hLineGeom, yellowLineMaterial);
            hLine.rotation.x = -Math.PI / 2;
            hLine.position.set(i, 0.02, 0);
            scene.add(hLine);

            // Vertical road center line
            const vLineGeom = new THREE.PlaneGeometry(0.5, 4);
            const vLine = new THREE.Mesh(vLineGeom, yellowLineMaterial);
            vLine.rotation.x = -Math.PI / 2;
            vLine.position.set(0, 0.02, i);
            scene.add(vLine);
        }
    }

    // Crosswalks (white stripes)
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    createCrosswalk(0, ROAD_WIDTH / 2 + 8, false);
    createCrosswalk(0, -ROAD_WIDTH / 2 - 8, false);
    createCrosswalk(ROAD_WIDTH / 2 + 8, 0, true);
    createCrosswalk(-ROAD_WIDTH / 2 - 8, 0, true);

    // Sidewalks (lighter gray, slightly raised)
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });

    // Four corner sidewalks
    const corners = [
        { x: -STREET_SIZE/2 - ROAD_WIDTH/2, z: -STREET_SIZE/2 - ROAD_WIDTH/2 },
        { x: STREET_SIZE/2 + ROAD_WIDTH/2, z: -STREET_SIZE/2 - ROAD_WIDTH/2 },
        { x: -STREET_SIZE/2 - ROAD_WIDTH/2, z: STREET_SIZE/2 + ROAD_WIDTH/2 },
        { x: STREET_SIZE/2 + ROAD_WIDTH/2, z: STREET_SIZE/2 + ROAD_WIDTH/2 }
    ];

    corners.forEach(corner => {
        const sidewalkGeom = new THREE.BoxGeometry(STREET_SIZE - ROAD_WIDTH, 0.5, STREET_SIZE - ROAD_WIDTH);
        const sidewalk = new THREE.Mesh(sidewalkGeom, sidewalkMaterial);
        sidewalk.position.set(corner.x, 0.25, corner.z);
        scene.add(sidewalk);
    });

    // Buildings
    createBuildings();

    // Street lamps
    createStreetLamp(-55, -55);
    createStreetLamp(55, 55);
    createStreetLamp(-55, 55);
    createStreetLamp(55, -55);

    // Traffic lights
    createTrafficLight(ROAD_WIDTH/2 + 3, ROAD_WIDTH/2 + 3);
    createTrafficLight(-ROAD_WIDTH/2 - 3, -ROAD_WIDTH/2 - 3);
    createTrafficLight(ROAD_WIDTH/2 + 3, -ROAD_WIDTH/2 - 3);
    createTrafficLight(-ROAD_WIDTH/2 - 3, ROAD_WIDTH/2 + 3);
}

function createCrosswalk(x, z, vertical) {
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stripeCount = 8;
    const stripeWidth = 2;
    const stripeLength = ROAD_WIDTH - 4;
    const gap = 2;

    for (let i = 0; i < stripeCount; i++) {
        const offset = (i - stripeCount/2) * (stripeWidth + gap);
        let geom, stripe;

        if (vertical) {
            geom = new THREE.PlaneGeometry(stripeLength, stripeWidth);
            stripe = new THREE.Mesh(geom, whiteMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(x, 0.03, z + offset);
        } else {
            geom = new THREE.PlaneGeometry(stripeWidth, stripeLength);
            stripe = new THREE.Mesh(geom, whiteMaterial);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(x + offset, 0.03, z);
        }
        scene.add(stripe);
    }
}

function createBuildings() {
    const buildingColors = [0x8B7355, 0xA0522D, 0xBC8F8F, 0xD2B48C, 0xC4A484, 0x9C9C9C, 0xB8B8B8];

    // Create buildings around the perimeter
    const positions = [];

    // Back row (negative Z)
    for (let x = -90; x <= 90; x += 35) {
        if (Math.abs(x) > ROAD_WIDTH/2 + 10) {
            positions.push({ x, z: -85, width: 25 + Math.random() * 15, depth: 20 + Math.random() * 10 });
        }
    }

    // Front row (positive Z)
    for (let x = -90; x <= 90; x += 35) {
        if (Math.abs(x) > ROAD_WIDTH/2 + 10) {
            positions.push({ x, z: 85, width: 25 + Math.random() * 15, depth: 20 + Math.random() * 10 });
        }
    }

    // Left side (negative X)
    for (let z = -50; z <= 50; z += 35) {
        if (Math.abs(z) > ROAD_WIDTH/2 + 10) {
            positions.push({ x: -85, z, width: 20 + Math.random() * 10, depth: 25 + Math.random() * 15 });
        }
    }

    // Right side (positive X)
    for (let z = -50; z <= 50; z += 35) {
        if (Math.abs(z) > ROAD_WIDTH/2 + 10) {
            positions.push({ x: 85, z, width: 20 + Math.random() * 10, depth: 25 + Math.random() * 15 });
        }
    }

    positions.forEach(pos => {
        const height = 30 + Math.random() * 50;
        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

        const buildingGeom = new THREE.BoxGeometry(pos.width, height, pos.depth);
        const buildingMat = new THREE.MeshStandardMaterial({ color });
        const building = new THREE.Mesh(buildingGeom, buildingMat);
        building.position.set(pos.x, height/2, pos.z);
        scene.add(building);

        // Add windows
        const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.8 });
        const windowOffMaterial = new THREE.MeshBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.5 });

        for (let y = 5; y < height - 5; y += 8) {
            for (let wx = -pos.width/2 + 4; wx < pos.width/2 - 2; wx += 6) {
                if (Math.random() > 0.3) {
                    const winGeom = new THREE.PlaneGeometry(3, 4);
                    const mat = Math.random() > 0.4 ? windowMaterial : windowOffMaterial;

                    // Front face
                    const winFront = new THREE.Mesh(winGeom, mat);
                    winFront.position.set(pos.x + wx, y, pos.z + pos.depth/2 + 0.1);
                    scene.add(winFront);

                    // Back face
                    const winBack = new THREE.Mesh(winGeom, mat);
                    winBack.position.set(pos.x + wx, y, pos.z - pos.depth/2 - 0.1);
                    winBack.rotation.y = Math.PI;
                    scene.add(winBack);
                }
            }
        }
    });
}

function createStreetLamp(x, z) {
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    // Pole
    const poleGeom = new THREE.CylinderGeometry(0.3, 0.4, 20, 8);
    const pole = new THREE.Mesh(poleGeom, poleMaterial);
    pole.position.set(x, 10, z);
    scene.add(pole);

    // Lamp head
    const headGeom = new THREE.CylinderGeometry(2, 1.5, 1, 8);
    const head = new THREE.Mesh(headGeom, poleMaterial);
    head.position.set(x, 20, z);
    scene.add(head);

    // Light glow sphere
    const glowGeom = new THREE.SphereGeometry(1, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.8 });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(x, 19, z);
    scene.add(glow);
}

function createTrafficLight(x, z) {
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    // Pole
    const poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
    const pole = new THREE.Mesh(poleGeom, poleMaterial);
    pole.position.set(x, 4, z);
    scene.add(pole);

    // Light box
    const boxGeom = new THREE.BoxGeometry(1.5, 4, 1.5);
    const box = new THREE.Mesh(boxGeom, poleMaterial);
    box.position.set(x, 10, z);
    scene.add(box);

    // Lights
    const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const lightGeom = new THREE.SphereGeometry(0.4, 8, 8);

    const red = new THREE.Mesh(lightGeom, redMat);
    red.position.set(x, 11, z + 0.8);
    scene.add(red);

    const yellow = new THREE.Mesh(lightGeom, yellowMat);
    yellow.position.set(x, 10, z + 0.8);
    scene.add(yellow);

    const green = new THREE.Mesh(lightGeom, greenMat);
    green.position.set(x, 9, z + 0.8);
    scene.add(green);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Clothing color palettes
const shirtColors = [0x5DADE2, 0xFF6B6B, 0x58D68D, 0xBB8FCE, 0xF7DC6F, 0x48C9B0, 0xFF69B4, 0x00E5FF, 0xFF7043, 0x9575CD, 0xFFFFFF, 0xFFEB3B];
const pantsColors = [0x2c3e50, 0x34495e, 0x1a252f, 0x4a4a4a, 0x2d2d2d, 0x1e3a5f, 0x3d3d3d, 0x2b2b2b];
const skinColors = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xd4a574, 0xf5d0c5, 0xdeb887];
const shoeColors = [0x1a1a1a, 0x2d2d2d, 0x4a2c2a, 0x3d3d3d, 0x8b4513, 0xffffff];
const hairColors = [0x1a1a1a, 0x3d2314, 0x654321, 0x8b4513, 0xd4a574, 0x2c1810, 0x4a3728, 0x090806];

// Stickman 3D model - with clothes
function createStickman() {
    const group = new THREE.Group();
    const size = settings.size;

    // Pick random colors for this person
    const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
    const pantsColor = pantsColors[Math.floor(Math.random() * pantsColors.length)];
    const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)];
    const shoeColor = shoeColors[Math.floor(Math.random() * shoeColors.length)];
    const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];

    const skinMaterial = new THREE.MeshStandardMaterial({ color: skinColor, emissive: skinColor, emissiveIntensity: 0.15 });
    const shirtMaterial = new THREE.MeshStandardMaterial({ color: shirtColor, emissive: shirtColor, emissiveIntensity: 0.3 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: pantsColor, emissive: pantsColor, emissiveIntensity: 0.1 });
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: shoeColor, emissive: shoeColor, emissiveIntensity: 0.1 });
    const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, emissive: hairColor, emissiveIntensity: 0.05 });

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35 * size, 12, 12);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 2.15 * size;
    head.name = 'head';
    group.add(head);

    // Hair (cap on top of head)
    const hairGeometry = new THREE.SphereGeometry(0.37 * size, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 2.2 * size;
    hair.name = 'hair';
    group.add(hair);

    // Neck
    const neckGeometry = new THREE.CylinderGeometry(0.1 * size, 0.1 * size, 0.15 * size, 8);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.y = 1.85 * size;
    group.add(neck);

    // Torso (shirt)
    const torsoGeometry = new THREE.CylinderGeometry(0.25 * size, 0.2 * size, 0.8 * size, 8);
    const torso = new THREE.Mesh(torsoGeometry, shirtMaterial);
    torso.position.y = 1.4 * size;
    torso.name = 'torso';
    group.add(torso);

    // Left upper arm (shirt sleeve)
    const leftUpperArmGeometry = new THREE.CylinderGeometry(0.08 * size, 0.07 * size, 0.4 * size, 6);
    const leftUpperArm = new THREE.Mesh(leftUpperArmGeometry, shirtMaterial);
    leftUpperArm.position.set(-0.3 * size, 1.6 * size, 0);
    leftUpperArm.rotation.z = Math.PI / 4;
    leftUpperArm.name = 'leftUpperArm';
    group.add(leftUpperArm);

    // Left forearm (skin)
    const leftForearmGeometry = new THREE.CylinderGeometry(0.06 * size, 0.05 * size, 0.35 * size, 6);
    const leftForearm = new THREE.Mesh(leftForearmGeometry, skinMaterial);
    leftForearm.position.set(-0.5 * size, 1.3 * size, 0);
    leftForearm.rotation.z = Math.PI / 4;
    leftForearm.name = 'leftForearm';
    group.add(leftForearm);

    // Right upper arm (shirt sleeve)
    const rightUpperArmGeometry = new THREE.CylinderGeometry(0.08 * size, 0.07 * size, 0.4 * size, 6);
    const rightUpperArm = new THREE.Mesh(rightUpperArmGeometry, shirtMaterial);
    rightUpperArm.position.set(0.3 * size, 1.6 * size, 0);
    rightUpperArm.rotation.z = -Math.PI / 4;
    rightUpperArm.name = 'rightUpperArm';
    group.add(rightUpperArm);

    // Right forearm (skin)
    const rightForearmGeometry = new THREE.CylinderGeometry(0.06 * size, 0.05 * size, 0.35 * size, 6);
    const rightForearm = new THREE.Mesh(rightForearmGeometry, skinMaterial);
    rightForearm.position.set(0.5 * size, 1.3 * size, 0);
    rightForearm.rotation.z = -Math.PI / 4;
    rightForearm.name = 'rightForearm';
    group.add(rightForearm);

    // Hips/waist (pants)
    const hipsGeometry = new THREE.CylinderGeometry(0.2 * size, 0.18 * size, 0.3 * size, 8);
    const hips = new THREE.Mesh(hipsGeometry, pantsMaterial);
    hips.position.y = 0.9 * size;
    group.add(hips);

    // Left leg (pants)
    const leftLegGeometry = new THREE.CylinderGeometry(0.1 * size, 0.08 * size, 0.7 * size, 6);
    const leftLeg = new THREE.Mesh(leftLegGeometry, pantsMaterial);
    leftLeg.position.set(-0.12 * size, 0.45 * size, 0);
    leftLeg.name = 'leftLeg';
    group.add(leftLeg);

    // Right leg (pants)
    const rightLegGeometry = new THREE.CylinderGeometry(0.1 * size, 0.08 * size, 0.7 * size, 6);
    const rightLeg = new THREE.Mesh(rightLegGeometry, pantsMaterial);
    rightLeg.position.set(0.12 * size, 0.45 * size, 0);
    rightLeg.name = 'rightLeg';
    group.add(rightLeg);

    // Left shoe
    const leftShoeGeometry = new THREE.BoxGeometry(0.15 * size, 0.1 * size, 0.25 * size);
    const leftShoe = new THREE.Mesh(leftShoeGeometry, shoeMaterial);
    leftShoe.position.set(-0.12 * size, 0.05 * size, 0.05 * size);
    leftShoe.name = 'leftShoe';
    group.add(leftShoe);

    // Right shoe
    const rightShoeGeometry = new THREE.BoxGeometry(0.15 * size, 0.1 * size, 0.25 * size);
    const rightShoe = new THREE.Mesh(rightShoeGeometry, shoeMaterial);
    rightShoe.position.set(0.12 * size, 0.05 * size, 0.05 * size);
    rightShoe.name = 'rightShoe';
    group.add(rightShoe);

    // Store colors for animation reference
    group.userData = { shirtColor, pantsColor, skinColor };

    return group;
}

// Boid class for 2.5D (walking on ground)
class Boid {
    constructor(x, z) {
        this.position = new THREE.Vector3(x, 0, z);
        const angle = Math.random() * Math.PI * 2;
        this.velocity = new THREE.Vector3(
            Math.cos(angle),
            0,
            Math.sin(angle)
        ).multiplyScalar(Math.random() * settings.maxSpeed + 0.1);
        this.acceleration = new THREE.Vector3();
        this.walkPhase = Math.random() * Math.PI * 2;
        this.mesh = createStickman();
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0.5;
        scene.add(this.mesh);

        // Random wandering properties
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderTimer = Math.random() * 100;
        this.wanderChangeRate = 0.5 + Math.random() * 1.5; // How often to change direction
        this.personalSpeed = 0.6 + Math.random() * 0.8; // Individual speed variation

        // Destination-based movement for crossing roads
        this.destination = null;
        this.destinationTimer = 0;
        this.currentQuadrant = this.getQuadrant(x, z);
        this.pickNewDestination();
    }

    isOnSidewalk(x, z) {
        // Check if position is on sidewalk (not on road)
        const onHRoad = Math.abs(z) < ROAD_WIDTH / 2;
        const onVRoad = Math.abs(x) < ROAD_WIDTH / 2;
        return !(onHRoad || onVRoad);
    }

    edges() {
        const bound = STREET_SIZE * 0.8;
        const margin = 10;
        const turnForce = 0.02;

        // Keep on the ground (y = 0)
        this.velocity.y = 0;
        this.position.y = 0;

        // Soft boundaries
        if (this.position.x > bound - margin) {
            this.acceleration.x -= turnForce;
        }
        if (this.position.x < -bound + margin) {
            this.acceleration.x += turnForce;
        }
        if (this.position.z > bound - margin) {
            this.acceleration.z -= turnForce;
        }
        if (this.position.z < -bound + margin) {
            this.acceleration.z += turnForce;
        }

        // No road avoidance - people cross freely using destinations
    }

    align(boids) {
        const steering = new THREE.Vector3();
        let total = 0;
        for (const other of boids) {
            const d = this.position.distanceTo(other.position);
            if (other !== this && d < settings.perception) {
                steering.add(other.velocity);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.y = 0;
            steering.normalize().multiplyScalar(settings.maxSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, 0.05);
        }
        return steering;
    }

    cohesion(boids) {
        const steering = new THREE.Vector3();
        let total = 0;
        for (const other of boids) {
            const d = this.position.distanceTo(other.position);
            if (other !== this && d < settings.perception) {
                steering.add(other.position);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.sub(this.position);
            steering.y = 0;
            steering.normalize().multiplyScalar(settings.maxSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, 0.05);
        }
        return steering;
    }

    separation(boids) {
        const steering = new THREE.Vector3();
        let total = 0;
        for (const other of boids) {
            const d = this.position.distanceTo(other.position);
            if (other !== this && d < settings.perception * 0.6) {
                const diff = new THREE.Vector3().subVectors(this.position, other.position);
                diff.y = 0;
                diff.divideScalar(d * d);
                steering.add(diff);
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.y = 0;
            steering.normalize().multiplyScalar(settings.maxSpeed);
            steering.sub(this.velocity);
            steering.clampLength(0, 0.1);
        }
        return steering;
    }

    wander() {
        // Update wander timer
        this.wanderTimer += 0.016; // Approximate frame time

        // Randomly change wander angle periodically
        if (Math.random() < 0.02 * this.wanderChangeRate) {
            this.wanderAngle += (Math.random() - 0.5) * Math.PI * 0.5;
        }

        // Occasionally make bigger direction changes
        if (Math.random() < 0.005) {
            this.wanderAngle += (Math.random() - 0.5) * Math.PI;
        }

        // Sometimes pause briefly (simulate stopping to look around)
        if (Math.random() < 0.001) {
            this.velocity.multiplyScalar(0.1);
        }

        // Create wander steering force
        const wanderForce = new THREE.Vector3(
            Math.cos(this.wanderAngle),
            0,
            Math.sin(this.wanderAngle)
        ).multiplyScalar(0.015 * this.personalSpeed);

        return wanderForce;
    }

    getQuadrant(x, z) {
        if (x < 0 && z < 0) return 0;
        if (x >= 0 && z < 0) return 1;
        if (x < 0 && z >= 0) return 2;
        return 3;
    }

    pickNewDestination() {
        const quadrants = [
            { x: -55, z: -55 },
            { x: 55, z: -55 },
            { x: -55, z: 55 },
            { x: 55, z: 55 }
        ];

        // 70% chance to pick a different quadrant (forces road crossing)
        let targetQuadrant;
        if (Math.random() < 0.7) {
            const others = [0, 1, 2, 3].filter(q => q !== this.currentQuadrant);
            targetQuadrant = others[Math.floor(Math.random() * others.length)];
        } else {
            targetQuadrant = this.currentQuadrant;
        }

        const base = quadrants[targetQuadrant];
        this.destination = new THREE.Vector3(
            base.x + (Math.random() - 0.5) * 40,
            0,
            base.z + (Math.random() - 0.5) * 40
        );
        this.destinationTimer = 300 + Math.random() * 400;
    }

    seekDestination() {
        if (!this.destination) return new THREE.Vector3();

        this.destinationTimer -= 1;

        const toTarget = new THREE.Vector3().subVectors(this.destination, this.position);
        toTarget.y = 0;
        const dist = toTarget.length();

        // Arrived or timer expired - pick new destination
        if (dist < 10 || this.destinationTimer <= 0) {
            this.currentQuadrant = this.getQuadrant(this.position.x, this.position.z);
            this.pickNewDestination();
            return new THREE.Vector3();
        }

        // Steer toward destination
        toTarget.normalize().multiplyScalar(settings.maxSpeed);
        const steering = toTarget.sub(this.velocity);
        steering.y = 0;
        steering.clampLength(0, 0.03);
        return steering;
    }

    avoidCars(carList) {
        const steering = new THREE.Vector3();
        let total = 0;
        const carPerception = 50;
        const hardMinDist = 14;

        for (const car of carList) {
            const d = this.position.distanceTo(car.position);
            if (d < carPerception && d > 0) {
                const diff = new THREE.Vector3().subVectors(this.position, car.position);
                diff.y = 0;

                if (d < hardMinDist) {
                    // Emergency avoidance when very close
                    diff.normalize().multiplyScalar(settings.maxSpeed * 8);
                    steering.add(diff);
                } else {
                    diff.divideScalar(d * d);
                    steering.add(diff);
                }
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total);
            steering.y = 0;
            steering.normalize().multiplyScalar(settings.maxSpeed * 4);
            steering.sub(this.velocity);
            steering.clampLength(0, 0.6);
        }
        return steering;
    }

    flock(boids) {
        const alignment = this.align(boids);
        const cohesion = this.cohesion(boids);
        const separation = this.separation(boids);
        const wander = this.wander();
        const carAvoidance = this.avoidCars(cars);
        const destination = this.seekDestination();

        alignment.multiplyScalar(settings.alignment);
        cohesion.multiplyScalar(settings.cohesion);
        separation.multiplyScalar(settings.separation);
        wander.multiplyScalar(1.0);
        carAvoidance.multiplyScalar(8.0);
        destination.multiplyScalar(2.5);

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
        this.acceleration.add(wander);
        this.acceleration.add(carAvoidance);
        this.acceleration.add(destination);
    }

    update() {
        this.edges();
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.y = 0; // Keep on ground
        this.velocity.clampLength(0, settings.maxSpeed);
        this.acceleration.multiplyScalar(0);

        // Hard constraint: never overlap with cars
        for (const car of cars) {
            const d = this.position.distanceTo(car.position);
            const minDist = 14;
            if (d < minDist && d > 0) {
                const pushDir = new THREE.Vector3().subVectors(this.position, car.position);
                pushDir.y = 0;
                pushDir.normalize();
                // Move person to minimum distance from car
                const safePos = car.position.clone().add(pushDir.clone().multiplyScalar(minDist));
                this.position.x = safePos.x;
                this.position.z = safePos.z;
                this.position.y = 0;
                // Redirect velocity away from car
                const velTowardsCar = this.velocity.dot(pushDir.clone().negate());
                if (velTowardsCar > 0) {
                    this.velocity.add(pushDir.clone().multiplyScalar(velTowardsCar * 2));
                    this.velocity.clampLength(0, settings.maxSpeed);
                }
            }
        }

        // Update walk animation
        const speed = this.velocity.length();
        this.walkPhase += speed * 0.8;

        // Update mesh position
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.position.y = 0.5;

        // Orient mesh toward velocity direction (rotate around Y axis)
        if (speed > 0.01) {
            const angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.mesh.rotation.y = angle;
        }

        // Animate limbs
        this.animateLimbs();
    }

    animateLimbs() {
        const swing = Math.sin(this.walkPhase) * 0.4;
        const size = settings.size;

        // Animate arms (swing forward/backward)
        const leftUpperArm = this.mesh.getObjectByName('leftUpperArm');
        const rightUpperArm = this.mesh.getObjectByName('rightUpperArm');
        const leftForearm = this.mesh.getObjectByName('leftForearm');
        const rightForearm = this.mesh.getObjectByName('rightForearm');

        if (leftUpperArm) {
            leftUpperArm.rotation.x = swing * 0.5;
            leftUpperArm.position.z = swing * 0.1 * size;
        }
        if (rightUpperArm) {
            rightUpperArm.rotation.x = -swing * 0.5;
            rightUpperArm.position.z = -swing * 0.1 * size;
        }
        if (leftForearm) {
            leftForearm.rotation.x = swing * 0.5;
            leftForearm.position.z = swing * 0.15 * size;
        }
        if (rightForearm) {
            rightForearm.rotation.x = -swing * 0.5;
            rightForearm.position.z = -swing * 0.15 * size;
        }

        // Animate legs (swing forward/backward)
        const leftLeg = this.mesh.getObjectByName('leftLeg');
        const rightLeg = this.mesh.getObjectByName('rightLeg');
        const leftShoe = this.mesh.getObjectByName('leftShoe');
        const rightShoe = this.mesh.getObjectByName('rightShoe');

        if (leftLeg) {
            leftLeg.rotation.x = -swing * 0.6;
            leftLeg.position.z = -swing * 0.15 * size;
        }
        if (rightLeg) {
            rightLeg.rotation.x = swing * 0.6;
            rightLeg.position.z = swing * 0.15 * size;
        }
        if (leftShoe) {
            leftShoe.position.z = 0.05 * size - swing * 0.2 * size;
        }
        if (rightShoe) {
            rightShoe.position.z = 0.05 * size + swing * 0.2 * size;
        }
    }

    dispose() {
        scene.remove(this.mesh);
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}

// Car color palettes
const carColors = [0xCC0000, 0x2255CC, 0xFFFFFF, 0xBBBBBB, 0x228B22, 0xFFCC00, 0xFF6600, 0x6A0DAD, 0xFF1493];

function createCarMesh() {
    const group = new THREE.Group();
    const color = carColors[Math.floor(Math.random() * carColors.length)];
    const bodyMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88CCFF, transparent: true, opacity: 0.6 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

    // Body
    const bodyGeom = new THREE.BoxGeometry(4, 2, 8);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1.5;
    group.add(body);

    // Cabin
    const cabinGeom = new THREE.BoxGeometry(3.5, 1.8, 4);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 3, -0.5);
    group.add(cabin);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 12);
    const wheelPositions = [
        { x: -2.2, y: 0.7, z: 2.5 },
        { x: 2.2, y: 0.7, z: 2.5 },
        { x: -2.2, y: 0.7, z: -2.5 },
        { x: 2.2, y: 0.7, z: -2.5 }
    ];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeom, tireMat);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        group.add(wheel);
    });

    // Headlights
    const lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFAA });
    const hl1 = new THREE.Mesh(lightGeom, headlightMat);
    hl1.position.set(-1.2, 1.5, 4.1);
    group.add(hl1);
    const hl2 = new THREE.Mesh(lightGeom, headlightMat);
    hl2.position.set(1.2, 1.5, 4.1);
    group.add(hl2);

    // Taillights
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const tl1 = new THREE.Mesh(lightGeom, taillightMat);
    tl1.position.set(-1.2, 1.5, -4.1);
    group.add(tl1);
    const tl2 = new THREE.Mesh(lightGeom, taillightMat);
    tl2.position.set(1.2, 1.5, -4.1);
    group.add(tl2);

    // Scale up to be proportional with people
    group.scale.set(2, 2, 2);

    return group;
}

// Car class - drives on roads
class Car {
    constructor(road, direction) {
        // road: 'horizontal' or 'vertical'
        // direction: 1 or -1
        this.road = road;
        this.direction = direction;
        this.speed = 0.8 + Math.random() * 0.6;
        this.laneOffset = 8 * direction; // Right-side driving

        const bound = STREET_SIZE * 0.8;

        if (road === 'horizontal') {
            const startX = direction > 0 ? -bound : bound;
            this.position = new THREE.Vector3(startX + Math.random() * bound, 0, this.laneOffset);
            this.velocity = new THREE.Vector3(direction * this.speed, 0, 0);
            this.driveDir = new THREE.Vector3(direction, 0, 0);
        } else {
            const startZ = direction > 0 ? -bound : bound;
            this.position = new THREE.Vector3(this.laneOffset, 0, startZ + Math.random() * bound);
            this.velocity = new THREE.Vector3(0, 0, direction * this.speed);
            this.driveDir = new THREE.Vector3(0, 0, direction);
        }

        this.mesh = createCarMesh();
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0.5;

        // Orient car in driving direction
        if (road === 'horizontal') {
            this.mesh.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
            this.mesh.rotation.y = direction > 0 ? Math.PI : 0;
        }

        scene.add(this.mesh);
    }

    update() {
        const bound = STREET_SIZE * 0.8;

        // Drive at constant speed in lane
        this.velocity.copy(this.driveDir).multiplyScalar(this.speed);
        this.position.add(this.velocity);
        this.position.y = 0;

        // Lock to lane
        if (this.road === 'horizontal') {
            this.position.z = this.laneOffset;
        } else {
            this.position.x = this.laneOffset;
        }

        // Wrap around
        if (this.road === 'horizontal') {
            if (this.direction > 0 && this.position.x > bound) this.position.x = -bound;
            if (this.direction < 0 && this.position.x < -bound) this.position.x = bound;
        } else {
            if (this.direction > 0 && this.position.z > bound) this.position.z = -bound;
            if (this.direction < 0 && this.position.z < -bound) this.position.z = bound;
        }

        // Update mesh
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.position.y = 0.5;
    }

    dispose() {
        scene.remove(this.mesh);
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}

// Initialize flock
function initFlock() {
    for (const boid of flock) {
        boid.dispose();
    }
    flock = [];

    // Spawn on sidewalks
    for (let i = 0; i < settings.population; i++) {
        let x, z;
        // Random position, preferring sidewalks
        const corner = Math.floor(Math.random() * 4);
        const spread = 50;

        switch(corner) {
            case 0: // top-left
                x = -30 - Math.random() * spread;
                z = -30 - Math.random() * spread;
                break;
            case 1: // top-right
                x = 30 + Math.random() * spread;
                z = -30 - Math.random() * spread;
                break;
            case 2: // bottom-left
                x = -30 - Math.random() * spread;
                z = 30 + Math.random() * spread;
                break;
            case 3: // bottom-right
                x = 30 + Math.random() * spread;
                z = 30 + Math.random() * spread;
                break;
        }

        flock.push(new Boid(x, z));
    }
}

// Update flock size
function updateFlockSize() {
    while (flock.length < settings.population) {
        const x = (Math.random() - 0.5) * 120;
        const z = (Math.random() - 0.5) * 120;
        flock.push(new Boid(x, z));
    }
    while (flock.length > settings.population) {
        const boid = flock.pop();
        boid.dispose();
    }
}

// Initialize cars
function initCars() {
    for (const car of cars) {
        car.dispose();
    }
    cars = [];

    for (let i = 0; i < settings.carCount; i++) {
        const road = i % 2 === 0 ? 'horizontal' : 'vertical';
        const direction = i % 4 < 2 ? 1 : -1;
        cars.push(new Car(road, direction));
    }
}

// Update car count
function updateCarCount() {
    while (cars.length < settings.carCount) {
        const road = cars.length % 2 === 0 ? 'horizontal' : 'vertical';
        const direction = cars.length % 4 < 2 ? 1 : -1;
        cars.push(new Car(road, direction));
    }
    while (cars.length > settings.carCount) {
        const car = cars.pop();
        car.dispose();
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();

    if (!paused) {
        for (const car of cars) {
            car.update();
        }
        for (const boid of flock) {
            boid.flock(flock);
            boid.update();
        }
    }

    renderer.render(scene, camera);
}

// Camera view presets
function setCameraView(view) {
    switch (view) {
        case 'top':
            camera.position.set(0, 200, 0);
            controls.target.set(0, 0, 0);
            break;
        case 'street':
            camera.position.set(5, 8, 60);
            controls.target.set(0, 5, 0);
            break;
        case 'iso':
            camera.position.set(100, 80, 100);
            controls.target.set(0, 0, 0);
            break;
    }
}

// Control panel event listeners
document.getElementById('population').addEventListener('input', (e) => {
    settings.population = parseInt(e.target.value);
    document.getElementById('populationVal').textContent = settings.population;
    updateFlockSize();
});

document.getElementById('maxSpeed').addEventListener('input', (e) => {
    settings.maxSpeed = parseFloat(e.target.value);
    document.getElementById('maxSpeedVal').textContent = settings.maxSpeed;
});

document.getElementById('size').addEventListener('input', (e) => {
    settings.size = parseFloat(e.target.value);
    document.getElementById('sizeVal').textContent = settings.size;
    initFlock();
});

document.getElementById('perception').addEventListener('input', (e) => {
    settings.perception = parseInt(e.target.value);
    document.getElementById('perceptionVal').textContent = settings.perception;
});

document.getElementById('separation').addEventListener('input', (e) => {
    settings.separation = parseFloat(e.target.value);
    document.getElementById('separationVal').textContent = settings.separation;
});

document.getElementById('alignment').addEventListener('input', (e) => {
    settings.alignment = parseFloat(e.target.value);
    document.getElementById('alignmentVal').textContent = settings.alignment;
});

document.getElementById('cohesion').addEventListener('input', (e) => {
    settings.cohesion = parseFloat(e.target.value);
    document.getElementById('cohesionVal').textContent = settings.cohesion;
});

document.getElementById('carCount').addEventListener('input', (e) => {
    settings.carCount = parseInt(e.target.value);
    document.getElementById('carCountVal').textContent = settings.carCount;
    updateCarCount();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    paused = !paused;
    const btn = document.getElementById('pauseBtn');
    btn.textContent = paused ? 'Play' : 'Pause';
    btn.classList.toggle('paused', paused);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    initFlock();
    initCars();
});

document.getElementById('viewTop').addEventListener('click', () => setCameraView('top'));
document.getElementById('viewStreet').addEventListener('click', () => setCameraView('street'));
document.getElementById('viewIso').addEventListener('click', () => setCameraView('iso'));

// Start simulation
initScene();
initFlock();
initCars();
animate();
