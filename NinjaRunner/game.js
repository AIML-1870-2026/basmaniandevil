"use strict";
// =============================================================================
// SECTION 1: CONSTANTS & CONFIG
// =============================================================================
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.5;
const JUMP_VELOCITY = -13;
const MAX_FALL_SPEED = 15;
const INITIAL_SCROLL_SPEED = 3;
const MAX_SCROLL_SPEED = 12;
const SCROLL_ACCELERATION = 0.0005;
const GROUND_Y_MIN = CANVAS_HEIGHT * 0.6;
const GROUND_Y_MAX = CANVAS_HEIGHT * 0.8;
// =============================================================================
// SECTION 2: STATE
// =============================================================================
let gameState = 'start';
let score = 0;
let highScore = 0;
let scrollSpeed = INITIAL_SCROLL_SPEED;
let frameCount = 0;
let deathCause = '';
let consecutiveEnemyKills = 0;
let multiplier = 1;
let totalEnemiesKilled = 0;
let boss = null;
let shurikens = [];
let bossWarningTimer = 0;
// =============================================================================
// SECTION 3: CANVAS SETUP
// =============================================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Canvas stays at 800x400, CSS handles scaling
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
// =============================================================================
// SECTION 4: INPUT HANDLING
// =============================================================================
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (gameState === 'start') {
            startGame();
            return;
        }
        if (gameState === 'gameover') {
            restartGame();
            return;
        }
        if (gameState === 'playing' && player) {
            player.jump();
        }
    }
    if ((e.code === 'ArrowDown' || e.code === 'KeyS') && gameState === 'playing' && player) {
        player.slide();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if ((e.code === 'ArrowDown' || e.code === 'KeyS') && player) {
        player.stopSlide();
    }
});
canvas.addEventListener('click', () => {
    if (gameState === 'start') {
        startGame();
        return;
    }
    if (gameState === 'gameover') {
        restartGame();
        return;
    }
    if (gameState === 'playing' && player) {
        player.jump();
    }
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'start') {
        startGame();
        return;
    }
    if (gameState === 'gameover') {
        restartGame();
        return;
    }
    if (gameState === 'playing' && player) {
        player.jump();
    }
});
// =============================================================================
// SECTION 5: PARTICLE CLASS
// =============================================================================
class Particle {
    constructor(x, y, color, count) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.maxLife = count !== undefined ? count : 30 + Math.floor(Math.random() * 20);
        this.life = this.maxLife;
        this.size = 2 + Math.random() * 4;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY * 0.3;
        this.vx *= 0.95;
        this.life--;
        return this.life > 0;
    }
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha + 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
// =============================================================================
// SECTION 6: ROOFTOP CLASS
// =============================================================================
class Rooftop {
    constructor(x, y, width) {
        this.windowSlots = [];
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = CANVAS_HEIGHT - y;
        // Pre-generate bigger, fewer window slots
        const cols = Math.max(1, Math.floor(width / 42));
        const rows = Math.max(1, Math.floor((this.height - 16) / 36));
        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                if (Math.random() < 0.26) {
                    this.windowSlots.push({
                        wx: x + c * 42 + 14,
                        wy: y + 18 + r * 36,
                        ww: 28,
                        wh: 32,
                        visible: true,
                    });
                }
            }
        }
    }
    draw(ctx) {
        const x = this.x, y = this.y, w = this.width, h = this.height;
        // Building body — dark gray/charcoal matte
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
        bodyGrad.addColorStop(0, '#2c2c2c');
        bodyGrad.addColorStop(0.15, '#212121');
        bodyGrad.addColorStop(1, '#0e0e0e');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(x, y, w, h);
        // Horizontal masonry courses
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.20)';
        ctx.lineWidth = 1;
        for (let gy = y + 16; gy < y + h; gy += 14) {
            ctx.beginPath();
            ctx.moveTo(x, gy);
            ctx.lineTo(x + w, gy);
            ctx.stroke();
        }
        // Left-side shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x, y, 3, h);
        // Right-side highlight
        ctx.fillStyle = 'rgba(80, 80, 80, 0.10)';
        ctx.fillRect(x + w - 3, y, 3, h);
        // Dojo eave roof — reddish clay overhang at top
        const eave = 9;
        const eaveH = 11;
        // Main eave body
        ctx.fillStyle = '#8B3520';
        ctx.fillRect(x - eave, y + 2, w + eave * 2, eaveH);
        // Upper highlight (lighter clay)
        ctx.fillStyle = '#A84230';
        ctx.fillRect(x - eave, y + 2, w + eave * 2, 3);
        // Underside shadow
        ctx.fillStyle = '#5A1A08';
        ctx.fillRect(x - eave, y + 2 + eaveH - 2, w + eave * 2, 2);
        // Left upturned tip
        ctx.fillStyle = '#8B3520';
        ctx.beginPath();
        ctx.moveTo(x - eave, y + 2);
        ctx.lineTo(x - eave - 5, y - 3);
        ctx.lineTo(x - eave, y + 2 + eaveH);
        ctx.closePath();
        ctx.fill();
        // Right upturned tip
        ctx.beginPath();
        ctx.moveTo(x + w + eave, y + 2);
        ctx.lineTo(x + w + eave + 5, y - 3);
        ctx.lineTo(x + w + eave, y + 2 + eaveH);
        ctx.closePath();
        ctx.fill();
        // Ridge line at very top (where player stands)
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, w, 2);
        // Shoji-style windows
        for (const slot of this.windowSlots) {
            if (slot.wx >= x && slot.wx + slot.ww <= x + w) {
                const ww = slot.ww, wh = slot.wh;
                // Outer amber glow
                ctx.fillStyle = 'rgba(200, 130, 30, 0.09)';
                ctx.fillRect(slot.wx - 3, slot.wy - 3, ww + 6, wh + 6);
                // Dark frame
                ctx.fillStyle = '#181818';
                ctx.fillRect(slot.wx - 1, slot.wy - 1, ww + 2, wh + 2);
                // Warm amber pane
                ctx.fillStyle = 'rgba(215, 135, 25, 0.55)';
                ctx.fillRect(slot.wx, slot.wy, ww, wh);
                // Shoji cross divider
                ctx.fillStyle = 'rgba(15, 8, 0, 0.38)';
                ctx.fillRect(slot.wx + Math.floor(ww / 2), slot.wy, 1, wh);
                ctx.fillRect(slot.wx, slot.wy + Math.floor(wh / 2), ww, 1);
            }
        }
    }
    update(speed) {
        const dx = speed;
        this.x -= dx;
        for (const slot of this.windowSlots) {
            slot.wx -= dx;
        }
    }
    get right() {
        return this.x + this.width;
    }
    get top() {
        return this.y;
    }
    get isOffScreen() {
        return this.right < -10;
    }
}
// =============================================================================
// SECTION 7: ENEMY CLASS
// =============================================================================
class Enemy {
    constructor(x, y) {
        this.dead = false;
        this.swingFrame = 0;
        this.fadeOut = 1.0;
        this.x = x;
        this.y = y;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.fadeOut;
        const cx = this.x;
        const feet = this.y;
        // Ground shadow ellipse
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, feet - 1, 13, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Menacing red aura
        ctx.fillStyle = 'rgba(160, 20, 20, 0.04)';
        ctx.beginPath();
        ctx.arc(cx, feet - 22, 26, 0, Math.PI * 2);
        ctx.fill();
        // Head — filled radial gradient for depth
        const headGrad = ctx.createRadialGradient(cx - 3, feet - 43, 2, cx, feet - 40, 9);
        headGrad.addColorStop(0, '#ff7070');
        headGrad.addColorStop(1, '#aa1111');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(cx, feet - 40, 9, 0, Math.PI * 2);
        ctx.fill();
        // Glowing eyes
        ctx.fillStyle = '#e88888';
        ctx.shadowColor = '#aa2222';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.arc(cx - 3, feet - 41, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3, feet - 41, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Torso
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, feet - 31);
        ctx.lineTo(cx, feet - 14);
        ctx.stroke();
        // Arms - animate slightly
        ctx.lineWidth = 2.5;
        const armSwing = Math.sin(Date.now() * 0.005) * 0.3;
        // Left arm with club
        ctx.save();
        ctx.translate(cx, feet - 28);
        ctx.rotate(-0.5 + armSwing);
        ctx.strokeStyle = '#dd3333';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-14, 8);
        ctx.stroke();
        // Club — rounded, chunky
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#882222';
        ctx.beginPath();
        ctx.moveTo(-14, 8);
        ctx.lineTo(-22, 14);
        ctx.stroke();
        ctx.lineCap = 'butt';
        ctx.restore();
        // Right arm
        ctx.strokeStyle = '#dd3333';
        ctx.lineWidth = 2.5;
        ctx.save();
        ctx.translate(cx, feet - 28);
        ctx.rotate(0.4 - armSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, 8);
        ctx.stroke();
        ctx.restore();
        // Legs
        const legSwing = Math.sin(Date.now() * 0.005) * 0.4;
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 2.5;
        ctx.save();
        ctx.translate(cx, feet - 14);
        ctx.rotate(legSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(6, 14);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.translate(cx, feet - 14);
        ctx.rotate(-legSwing);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, 14);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
    }
    update() {
        if (this.dead) {
            this.fadeOut -= 0.04;
            if (this.fadeOut < 0)
                this.fadeOut = 0;
        }
        if (this.swingFrame > 0) {
            this.swingFrame++;
            if (this.swingFrame > 15)
                this.swingFrame = 0;
        }
    }
    get hitbox() {
        return {
            x: this.x - 10,
            y: this.y - 44,
            w: 20,
            h: 44,
        };
    }
}
// =============================================================================
// SECTION 8A: SHURIKEN CLASS
// =============================================================================
class Shuriken {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = -7;
        this.rotation = 0;
        this.size = 18;
        this.active = true;
    }
    update() {
        this.x += this.vx;
        this.rotation += 0.22;
        if (this.x < -60) this.active = false;
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const r = this.size;
        const inner = r * 0.28;
        // 4-pointed throwing star
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const outerA = (i * Math.PI) / 2;
            const leftA = outerA - Math.PI / 4;
            const rightA = outerA + Math.PI / 4;
            const px = Math.cos(outerA) * r;
            const py = Math.sin(outerA) * r;
            const lx = Math.cos(leftA) * inner;
            const ly = Math.sin(leftA) * inner;
            const rx = Math.cos(rightA) * inner;
            const ry = Math.sin(rightA) * inner;
            if (i === 0) ctx.moveTo(lx, ly);
            ctx.lineTo(px, py);
            ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
        grad.addColorStop(0, '#d8e8f8');
        grad.addColorStop(0.4, '#8098c0');
        grad.addColorStop(1, '#303850');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#e0f0ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Center rivet
        ctx.fillStyle = '#1a2030';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        // Glint
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(-r * 0.15, -r * 0.15, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    get hitbox() {
        const s = this.size * 0.65;
        return { x: this.x - s, y: this.y - s, w: s * 2, h: s * 2 };
    }
}
// =============================================================================
// SECTION 8B: BOSS CLASS
// =============================================================================
class Boss {
    constructor(startY) {
        this.x = CANVAS_WIDTH + 60;
        this.y = startY;
        this.vy = 0;
        this.isGrounded = false;
        this.jumpsUsed = 0;
        this.runCycle = 0;
        this.flipRotation = 0;
        this.isDoubleJump = false;
        this.landingCrouch = 0;
        // State: 'entering' -> 'active' -> 'fleeing' -> 'gone'
        this.state = 'entering';
        this.alpha = 0;
        this.shurikensThrown = 0;
        this.throwCooldown = 0;
        this.throwDelay = 150; // ~2.5s before first throw
        this.throwingAnim = 0;
        this.targetX = 680;
    }
    _getGroundedRooftop() {
        for (const roof of rooftops) {
            if (this.x > roof.x + 5 && this.x < roof.right - 5) {
                const bottom = this.y;
                if (bottom >= roof.top - 6 && bottom <= roof.top + 14 && this.vy >= 0) {
                    return roof;
                }
            }
        }
        return null;
    }
    _shouldJump() {
        if (!this.isGrounded) {
            // Fell off a ledge without jumping — recover on the very next frame
            if (this.jumpsUsed === 0 && this.vy > 0) return true;
            return false;
        }
        // Tight look-ahead: just enough to catch the gap before falling in,
        // but not so far that the boss lands before the gap finishes passing
        const checkX = this.x + Math.max(15, scrollSpeed * 2);
        let hasGround = false;
        for (const roof of rooftops) {
            if (checkX >= roof.x + 5 && checkX <= roof.right - 5) {
                hasGround = true;
                break;
            }
        }
        if (!hasGround) return true;
        // Obstacle ahead
        for (const obs of obstacles) {
            const ob = obs.hitbox;
            if (ob.x + ob.w > this.x + 8 && ob.x < checkX) {
                return true;
            }
        }
        return false;
    }
    _jump(emergency = false) {
        if (this.jumpsUsed < 2 || emergency) {
            this.isDoubleJump = !this.isGrounded && this.jumpsUsed >= 1;
            this.vy = JUMP_VELOCITY;
            this.isGrounded = false;
            this.flipRotation = 0;
            this.jumpsUsed++;
        }
    }
    _throwShuriken() {
        // Throw from boss chest position (adjusted for rotation)
        const sx = this.x - 14;
        const sy = this.y - 28;
        shurikens.push(new Shuriken(sx, sy));
        this.throwingAnim = 22;
        playBossThrowSound();
    }
    update() {
        if (this.state === 'gone') return;
        // Fade in during entering
        if (this.state === 'entering') {
            this.alpha = Math.min(1, this.alpha + 0.04);
            // Slide in from right toward targetX
            if (this.x > this.targetX) {
                this.x -= scrollSpeed + 1;
            } else {
                this.x = this.targetX;
                if (this.alpha >= 1) {
                    // Snap onto whatever rooftop is at targetX right now
                    for (const roof of rooftops) {
                        if (this.x >= roof.x && this.x <= roof.right) {
                            this.y = roof.top;
                            this.isGrounded = true;
                            this.jumpsUsed = 0;
                            break;
                        }
                    }
                    this.state = 'active';
                }
            }
        }
        // Physics — skip during entering so gravity doesn't drag boss down while sliding in
        if (this.state !== 'entering') {
            if (!this.isGrounded) {
                this.vy += GRAVITY;
                if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;
                this.y += this.vy;
                if (this.isDoubleJump) this.flipRotation += 0.14;
            } else {
                this.vy = 0;
                this.flipRotation = 0;
            }
            // Ground collision
            const landed = this._getGroundedRooftop();
            if (landed) {
                if (!this.isGrounded) this.landingCrouch = 40;
                this.y = landed.top;
                this.vy = 0;
                this.isGrounded = true;
                this.jumpsUsed = 0;
                this.isDoubleJump = false;
            } else {
                this.isGrounded = false;
            }
        }
        if (this.landingCrouch > 0 && this.isGrounded) this.landingCrouch--;
        // Run cycle
        const speedScale = scrollSpeed / INITIAL_SCROLL_SPEED;
        this.runCycle += 0.18 * speedScale;
        // Throwing anim countdown
        if (this.throwingAnim > 0) this.throwingAnim--;
        // AI jump
        if (this.state === 'active' && this._shouldJump()) {
            const emergency = !this.isGrounded && this.jumpsUsed >= 2;
            this._jump(emergency);
        }
        // Throwing logic
        if (this.state === 'active') {
            if (this.throwDelay > 0) {
                this.throwDelay--;
            } else if (this.throwCooldown <= 0 && this.shurikensThrown < 5) {
                this._throwShuriken();
                this.shurikensThrown++;
                if (this.shurikensThrown >= 5) {
                    this.throwCooldown = 80; // brief pause, then flee
                } else {
                    this.throwCooldown = 90;
                }
            } else if (this.throwCooldown > 0) {
                this.throwCooldown--;
                // After all 5 thrown and cooldown expires, flee
                if (this.shurikensThrown >= 5 && this.throwCooldown <= 0) {
                    this.state = 'fleeing';
                }
            }
        }
        // Fleeing — run off right edge
        if (this.state === 'fleeing') {
            this.x += scrollSpeed + 4;
            if (this.x > CANVAS_WIDTH + 120) {
                this.state = 'gone';
                boss = null;
            }
        }
        // Fall off screen
        if (this.y > CANVAS_HEIGHT + 80) {
            this.state = 'gone';
            boss = null;
        }
    }
    draw(ctx) {
        if (this.state === 'gone') return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        // Ground shadow
        if (this.isGrounded) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, 18, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.translate(this.x, this.y);
        ctx.rotate(0.28);
        const color = '#cc1a1a';
        const headColor = '#dd2020';
        const scarfColor = '#ffffff';
        const BASE_BACK = -(Math.PI * 0.72);
        const armBobL = Math.sin(this.runCycle) * 0.1;
        const armBobR = Math.sin(this.runCycle + 0.4) * 0.08;
        // Menacing red aura
        ctx.fillStyle = 'rgba(200, 20, 20, 0.08)';
        ctx.beginPath();
        ctx.arc(0, -22, 30, 0, Math.PI * 2);
        ctx.fill();
        // Head (red)
        const headGrad = ctx.createRadialGradient(-3, -43, 2, 0, -40, 10);
        headGrad.addColorStop(0, '#ff5555');
        headGrad.addColorStop(1, headColor);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, -40, 10, 0, Math.PI * 2);
        ctx.fill();
        // White headband
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -40);
        ctx.lineTo(10, -40);
        ctx.stroke();
        // Headband tail
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-7, -38);
        ctx.lineTo(-18, -32);
        ctx.stroke();
        // White scarf streaming in wind
        const scarfWave = Math.sin(this.runCycle * 2) * 3;
        ctx.strokeStyle = scarfColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-9, -37);
        ctx.quadraticCurveTo(-22 + scarfWave, -27, -30, -15 + scarfWave * 0.5);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(240,240,240,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-9, -35);
        ctx.quadraticCurveTo(-20 + scarfWave * 0.8, -25, -28, -13 + scarfWave * 0.4);
        ctx.stroke();
        ctx.lineCap = 'butt';
        // Torso (red)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -12);
        ctx.stroke();
        if (this.throwingAnim > 0) {
            // Throwing pose: right arm flung forward
            const t = this.throwingAnim / 22;
            ctx.save();
            ctx.translate(0, -26);
            ctx.rotate(-0.6 - t * 1.2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(9, 0);
            ctx.stroke();
            ctx.translate(9, 0);
            ctx.rotate(-0.3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.restore();
            // Off-hand for balance
            ctx.save();
            ctx.translate(0, -26);
            ctx.rotate(BASE_BACK - 0.2 + armBobR);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(9, 0);
            ctx.stroke();
            ctx.translate(9, 0);
            ctx.rotate(0.38);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.restore();
        } else {
            // Running arms swept back (no sword)
            ctx.save();
            ctx.translate(0, -26);
            ctx.rotate(BASE_BACK + armBobL);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(9, 0);
            ctx.stroke();
            ctx.translate(9, 0);
            ctx.rotate(0.38);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.restore();
            ctx.save();
            ctx.translate(0, -26);
            ctx.rotate(BASE_BACK - 0.2 + armBobR);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(9, 0);
            ctx.stroke();
            ctx.translate(9, 0);
            ctx.rotate(0.38);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();
            ctx.restore();
        }
        // Legs pumping
        const legSwing = Math.sin(this.runCycle) * 0.65;
        ctx.save();
        ctx.translate(0, -12);
        ctx.rotate(-legSwing);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-3, 11);
        ctx.stroke();
        ctx.translate(-3, 11);
        ctx.rotate(legSwing * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 9);
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.translate(0, -12);
        ctx.rotate(legSwing);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3, 11);
        ctx.stroke();
        ctx.translate(3, 11);
        ctx.rotate(-legSwing * 0.55);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 9);
        ctx.stroke();
        ctx.restore();
        ctx.restore();
    }
    get hitbox() {
        return { x: this.x - 12, y: this.y - 46, w: 24, h: 46 };
    }
}
function spawnBoss() {
    // Find a rooftop at x=targetX to land the boss on
    let spawnY = GROUND_Y_MIN + 20;
    for (const roof of rooftops) {
        if (680 >= roof.x && 680 <= roof.right) {
            spawnY = roof.top;
            break;
        }
    }
    boss = new Boss(spawnY);
    bossWarningTimer = 180;
    playBossWarnSound();
}
class Obstacle {
    constructor(x, rooftopY, type) {
        this.x = x;
        this.type = type;
        if (type === 'ac') {
            this.width = 40;
            this.height = 30;
        }
        else if (type === 'vent') {
            this.width = 15;
            this.height = 45;
        }
        else {
            // tank
            this.width = 35;
            this.height = 50;
        }
        this.y = rooftopY - this.height;
    }
    draw(ctx) {
        if (this.type === 'ac') {
            // Stone lantern (ishidoro)
            // Base slab
            ctx.fillStyle = '#4a4038';
            ctx.fillRect(this.x - 2, this.y + this.height - 6, this.width + 4, 6);
            // Post/shaft
            ctx.fillStyle = '#3a3028';
            ctx.fillRect(this.x + 8, this.y + 10, this.width - 16, this.height - 18);
            // Lantern box
            const lanGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 18);
            lanGrad.addColorStop(0, '#5a4a38');
            lanGrad.addColorStop(1, '#3a2e20');
            ctx.fillStyle = lanGrad;
            ctx.fillRect(this.x, this.y, this.width, 18);
            // Warm glow inside lantern
            ctx.fillStyle = 'rgba(240, 160, 30, 0.55)';
            ctx.fillRect(this.x + 4, this.y + 3, this.width - 8, 12);
            // Inner bright core
            ctx.fillStyle = 'rgba(255, 200, 80, 0.8)';
            ctx.fillRect(this.x + 8, this.y + 5, this.width - 16, 8);
            // Roof cap overhang
            ctx.fillStyle = '#4e3e2e';
            ctx.fillRect(this.x - 4, this.y - 4, this.width + 8, 5);
            // Outline
            ctx.strokeStyle = '#241c10';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.x, this.y, this.width, 18);
        }
        else if (this.type === 'vent') {
            // Bamboo post (training post)
            const bambGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
            bambGrad.addColorStop(0, '#2a4e18');
            bambGrad.addColorStop(0.5, '#3e7228');
            bambGrad.addColorStop(1, '#224012');
            ctx.fillStyle = bambGrad;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Node rings
            ctx.strokeStyle = '#1a3010';
            ctx.lineWidth = 2;
            for (let i = 10; i < this.height; i += 12) {
                ctx.beginPath();
                ctx.moveTo(this.x - 2, this.y + i);
                ctx.lineTo(this.x + this.width + 2, this.y + i);
                ctx.stroke();
            }
            // Side highlight
            ctx.fillStyle = 'rgba(80, 160, 40, 0.25)';
            ctx.fillRect(this.x + 2, this.y + 2, 3, this.height - 4);
            // Cap
            ctx.fillStyle = '#3a6020';
            ctx.fillRect(this.x - 3, this.y, this.width + 6, 6);
            // Outline
            ctx.strokeStyle = '#1a2e0a';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        else {
            // Wooden barrel
            const barrelGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
            barrelGrad.addColorStop(0, '#4a3018');
            barrelGrad.addColorStop(0.5, '#6a4828');
            barrelGrad.addColorStop(1, '#3a2410');
            ctx.fillStyle = barrelGrad;
            // Barrel body (slightly rounded shape via overfill)
            ctx.beginPath();
            ctx.moveTo(this.x + 4, this.y);
            ctx.lineTo(this.x + this.width - 4, this.y);
            ctx.lineTo(this.x + this.width + 2, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width - 4, this.y + this.height);
            ctx.lineTo(this.x + 4, this.y + this.height);
            ctx.lineTo(this.x - 2, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
            // Iron bands
            ctx.strokeStyle = '#1e1208';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(this.x + 2, this.y + 6);
            ctx.lineTo(this.x + this.width - 2, this.y + 6);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x - 1, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width + 1, this.y + this.height / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 2, this.y + this.height - 7);
            ctx.lineTo(this.x + this.width - 2, this.y + this.height - 7);
            ctx.stroke();
            // Wood grain
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + 9, this.y + 1);
            ctx.lineTo(this.x + 9, this.y + this.height - 1);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y + 1);
            ctx.lineTo(this.x + 20, this.y + this.height - 1);
            ctx.stroke();
        }
    }
    get hitbox() {
        return {
            x: this.x + 3,
            y: this.y + 3,
            w: this.width - 6,
            h: this.height - 3,
        };
    }
}
// =============================================================================
// SECTION 9: PLAYER CLASS
// =============================================================================
class Player {
    constructor(x, y) {
        this.vy = 0;
        this.isGrounded = false;
        this.isSliding = false;
        this.runCycle = 0;
        this.isSwinging = false;
        this.swingFrame = 0;
        this.flipRotation = 0;
        this.slideRotation = 0;
        this.jumpProgress = 0;
        this.wasGrounded = false;
        this.airKillStreak = 0;
        this.jumpsUsed = 0;
        this.isDoubleJump = false;
        this.landingCrouch = 0;
        this.x = x;
        this.y = y;
    }
    jump() {
        if (this.isSliding) return;
        if (this.jumpsUsed < 2) {
            const isDoubleJump = !this.isGrounded && this.jumpsUsed === 1;
            this.vy = JUMP_VELOCITY;
            this.isGrounded = false;
            this.jumpProgress = 0;
            this.flipRotation = 0;
            this.isDoubleJump = isDoubleJump;
            this.jumpsUsed++;
            playJumpSound();
            if (isDoubleJump) {
                // Cyan particle burst for double-jump
                for (let i = 0; i < 6; i++) {
                    particles.push(new Particle(this.x, this.y, '#ffd060', 18));
                }
            }
        }
    }
    slide() {
        if (this.isGrounded) {
            this.isSliding = true;
        }
    }
    stopSlide() {
        this.isSliding = false;
    }
    update() {
        this.wasGrounded = this.isGrounded;
        if (!this.isGrounded) {
            this.vy += GRAVITY;
            if (this.vy > MAX_FALL_SPEED)
                this.vy = MAX_FALL_SPEED;
            this.y += this.vy;
            // Front flip rotation only on double jump
            if (this.isDoubleJump) {
                this.flipRotation += 0.14;
            }
            if (this.vy > 0) {
                // Falling
                this.jumpProgress = Math.min(1, this.jumpProgress + 0.06);
            }
            else {
                // Rising
                this.jumpProgress = Math.max(0, this.jumpProgress + 0.04);
            }
        }
        else {
            this.vy = 0;
            this.flipRotation = 0;
            this.jumpProgress = 0;
        }
        // Run cycle - scales with scrollSpeed so legs move faster as game speeds up
        const speedScale = scrollSpeed / INITIAL_SCROLL_SPEED;
        if (this.isGrounded && !this.isSliding) {
            this.runCycle += 0.18 * speedScale;
        }
        else if (this.isSliding) {
            this.runCycle += 0.08 * speedScale;
            this.slideRotation += 0.14;
        }
        else {
            this.runCycle += 0.1 * speedScale;
        }
        // Detect landing
        if (!this.wasGrounded && this.isGrounded) {
            // Spawn dust particles
            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(this.x, this.y, '#c0a878', 20));
            }
            this.airKillStreak = 0;
            this.jumpsUsed = 0;
            this.isDoubleJump = false;
            this.landingCrouch = 72;
        }
        if (this.landingCrouch > 0 && this.isGrounded) {
            this.landingCrouch--;
        }
        // Swing frame advance
        if (this.isSwinging) {
            this.swingFrame++;
            if (this.swingFrame >= 15) {
                this.isSwinging = false;
                this.swingFrame = 0;
            }
        }
    }
    draw(ctx) {
        // Ground shadow
        if (this.isGrounded) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, 18, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        ctx.translate(this.x, this.y);
        // Soft amber glow aura
        ctx.fillStyle = 'rgba(180, 120, 20, 0.07)';
        ctx.beginPath();
        ctx.arc(0, -22, 32, 0, Math.PI * 2);
        ctx.fill();
        const color = '#d8cca0';
        if (this.isSliding) {
            // ── SLIDE ROLL: curl into ball and spin like a front flip ───────
            // Speed streak lines behind the player
            for (let i = 1; i <= 5; i++) {
                const alpha = 0.55 - i * 0.09;
                const len = 20 + i * 14;
                ctx.strokeStyle = `rgba(220, 180, 80, ${alpha})`;
                ctx.lineWidth = 3 - i * 0.4;
                ctx.beginPath();
                ctx.moveTo(-18 - (i * 8), -12);
                ctx.lineTo(-18 - (i * 8) - len, -12);
                ctx.stroke();
            }
            // Amber roll glow
            ctx.fillStyle = 'rgba(200, 150, 30, 0.18)';
            ctx.beginPath();
            ctx.ellipse(0, -12, 18, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            // Translate to ball center and apply roll rotation
            ctx.translate(0, -12);
            ctx.rotate(this.slideRotation);
            // Head (center of curled ball)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, -20, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#5a1010';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, -20);
            ctx.lineTo(10, -20);
            ctx.stroke();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            // Short tucked torso
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(0, -4);
            ctx.stroke();
            // Left arm — upper arm + elbow + forearm curled in
            ctx.beginPath();
            ctx.moveTo(0, -13);
            ctx.lineTo(9, -7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(9, -7);
            ctx.lineTo(6, 1);
            ctx.stroke();
            // Right arm — upper arm + elbow + forearm curled in
            ctx.beginPath();
            ctx.moveTo(0, -13);
            ctx.lineTo(-9, -7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-9, -7);
            ctx.lineTo(-6, 1);
            ctx.stroke();
            // Left leg — thigh + knee + shin tucked
            ctx.beginPath();
            ctx.moveTo(3, -4);
            ctx.lineTo(10, 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(10, 3);
            ctx.lineTo(7, 12);
            ctx.stroke();
            // Right leg — thigh + knee + shin tucked
            ctx.beginPath();
            ctx.moveTo(-3, -4);
            ctx.lineTo(-10, 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-10, 3);
            ctx.lineTo(-7, 12);
            ctx.stroke();
            // Katana tucked in
            ctx.fillStyle = '#d8d0a8';
            ctx.beginPath();
            ctx.moveTo(9, -8);
            ctx.quadraticCurveTo(16, -9.5, 23, -4);
            ctx.lineTo(9, -6);
            ctx.closePath();
            ctx.fill();
        }
        else if (!this.isGrounded) {
            if (this.isDoubleJump) {
                // ── DOUBLE JUMP: CURL INTO BALL + FRONT FLIP ──────────────
                ctx.rotate(this.flipRotation);
                // Head (center of curled ball)
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, -20, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#5a1010';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-10, -20);
                ctx.lineTo(10, -20);
                ctx.stroke();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                // Short tucked torso
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(0, -4);
                ctx.stroke();
                // Left arm — upper arm + elbow + forearm curled in
                ctx.beginPath();
                ctx.moveTo(0, -13);
                ctx.lineTo(9, -7);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(9, -7);
                ctx.lineTo(6, 1);
                ctx.stroke();
                // Right arm — upper arm + elbow + forearm curled in
                ctx.beginPath();
                ctx.moveTo(0, -13);
                ctx.lineTo(-9, -7);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-9, -7);
                ctx.lineTo(-6, 1);
                ctx.stroke();
                // Left leg — thigh + knee + shin tucked
                ctx.beginPath();
                ctx.moveTo(3, -4);
                ctx.lineTo(10, 3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(10, 3);
                ctx.lineTo(7, 12);
                ctx.stroke();
                // Right leg — thigh + knee + shin tucked
                ctx.beginPath();
                ctx.moveTo(-3, -4);
                ctx.lineTo(-10, 3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-10, 3);
                ctx.lineTo(-7, 12);
                ctx.stroke();
                // Katana — tapered blade visible tucked in
                ctx.fillStyle = '#d8d0a8';
                ctx.beginPath();
                ctx.moveTo(9, -8);
                ctx.quadraticCurveTo(16, -9.5, 23, -4);
                ctx.lineTo(9, -6);
                ctx.closePath();
                ctx.fill();
            } else {
                // ── SINGLE JUMP: ATHLETIC OPEN POSE (no flip) ─────────────
                ctx.rotate(0.1);
                // Head
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, -40, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#5a1010';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-10, -40);
                ctx.lineTo(10, -40);
                ctx.stroke();
                // Headband tail
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-7, -38);
                ctx.lineTo(-20, -30);
                ctx.stroke();
                // Scarf
                ctx.strokeStyle = '#8b0000';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-9, -37);
                ctx.quadraticCurveTo(-25, -26, -33, -12);
                ctx.stroke();
                ctx.lineCap = 'butt';
                // Torso
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, -30);
                ctx.lineTo(0, -12);
                ctx.stroke();
                // Sword arm — swept straight behind, blade trailing with slight downward angle
                ctx.save();
                ctx.translate(0, -26);
                ctx.rotate(2.9);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(9, 0);
                ctx.stroke();
                ctx.translate(9, 0);
                ctx.rotate(0.3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
                // Katana — tsuba + tapered curved blade
                ctx.strokeStyle = '#c8a020';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -3.5);
                ctx.lineTo(0, 3.5);
                ctx.stroke();
                ctx.lineCap = 'butt';
                const kjbg = ctx.createLinearGradient(0, 0, 42, 0);
                kjbg.addColorStop(0, '#c8b890');
                kjbg.addColorStop(0.5, '#e8e0c8');
                kjbg.addColorStop(1, '#ffffff');
                ctx.fillStyle = kjbg;
                ctx.beginPath();
                ctx.moveTo(0, -1.5);
                ctx.quadraticCurveTo(21, -2.5, 42, 0);
                ctx.lineTo(0, 1.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                // Off-hand — also swept behind for streamlined jump pose
                ctx.save();
                ctx.translate(0, -26);
                ctx.rotate(2.65);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(9, 0);
                ctx.stroke();
                ctx.translate(9, 0);
                ctx.rotate(0.3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
                ctx.restore();
                // Left leg — thigh raised forward, shin bent back at knee
                ctx.save();
                ctx.translate(3, -12);
                ctx.rotate(-0.35);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 11);
                ctx.stroke();
                ctx.translate(0, 11);
                ctx.rotate(0.85);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 9);
                ctx.stroke();
                ctx.restore();
                // Right leg — thigh back, shin bent forward at knee
                ctx.save();
                ctx.translate(-3, -12);
                ctx.rotate(0.15);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 11);
                ctx.stroke();
                ctx.translate(0, 11);
                ctx.rotate(0.65);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 9);
                ctx.stroke();
                ctx.restore();
            }
        }
        else {
            if (this.landingCrouch > 0) {
                // ── LANDING IMPACT ABSORPTION ─────────────────────────────
                const crouchT = this.landingCrouch / 72;
                // Impact shockwave ring at peak crouch
                if (crouchT > 0.85) {
                    const ringAlpha = (crouchT - 0.85) / 0.15;
                    ctx.strokeStyle = `rgba(200, 160, 60, ${ringAlpha * 0.6})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 32 + (1 - crouchT) * 40, 8, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.translate(0, crouchT * 32);
                ctx.rotate(0.18 + crouchT * 0.42);
                const headY = -40 + crouchT * 30;
                // Head (lowered proportional to crouch)
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, headY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#5a1010';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-10, headY);
                ctx.lineTo(10, headY);
                ctx.stroke();
                // Torso
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                const torsoTop = headY + 10;
                const torsoBot = -12 + crouchT * 20;
                ctx.beginPath();
                ctx.moveTo(0, torsoTop);
                ctx.lineTo(0, torsoBot);
                ctx.stroke();
                // Sword arm — raised for balance, with elbow
                ctx.save();
                ctx.translate(0, torsoTop + 4);
                ctx.rotate(-0.5 - crouchT * 0.7);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(9, 0);
                ctx.stroke();
                ctx.translate(9, 0);
                ctx.rotate(-0.2 - crouchT * 0.5);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
                // Katana
                ctx.strokeStyle = '#c8a020';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, -3.5);
                ctx.lineTo(0, 3.5);
                ctx.stroke();
                ctx.lineCap = 'butt';
                const lcbg = ctx.createLinearGradient(0, 0, 40, 0);
                lcbg.addColorStop(0, '#c8b890');
                lcbg.addColorStop(0.5, '#e8e0c8');
                lcbg.addColorStop(1, '#ffffff');
                ctx.fillStyle = lcbg;
                ctx.beginPath();
                ctx.moveTo(0, -1.5);
                ctx.quadraticCurveTo(20, -2.5, 40, 0);
                ctx.lineTo(0, 1.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                // Off-hand arm raised, with elbow
                ctx.save();
                ctx.translate(0, torsoTop + 4);
                ctx.rotate(-0.7 - crouchT * 0.6);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(9, 0);
                ctx.stroke();
                ctx.translate(9, 0);
                ctx.rotate(-0.3 - crouchT * 0.3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
                ctx.restore();
                // Legs — bent wide absorbing impact, with knee joints
                const kneeBend = 0.6 + crouchT * 2.1;
                // Left leg
                ctx.save();
                ctx.translate(3, torsoBot);
                ctx.rotate(-0.45 - crouchT * 0.65);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 11);
                ctx.stroke();
                ctx.translate(0, 11);
                ctx.rotate(kneeBend);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 9);
                ctx.stroke();
                ctx.restore();
                // Right leg
                ctx.save();
                ctx.translate(-3, torsoBot);
                ctx.rotate(0.45 + crouchT * 0.65);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 11);
                ctx.stroke();
                ctx.translate(0, 11);
                ctx.rotate(-kneeBend);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 9);
                ctx.stroke();
                ctx.restore();
            } else {
                // ── GROUNDED: NINJA SPRINT (lean forward, arms swept back) ─
                ctx.rotate(0.28); // lean forward ~16°
                // Head
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, -40, 10, 0, Math.PI * 2);
                ctx.fill();
                // Headband
                ctx.strokeStyle = '#5a1010';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-10, -40);
                ctx.lineTo(10, -40);
                ctx.stroke();
                // Headband tail streams behind
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-7, -38);
                ctx.lineTo(-18, -32);
                ctx.stroke();
                // Scarf streaming in wind
                const scarfWave = Math.sin(this.runCycle * 2) * 3;
                ctx.strokeStyle = '#8b0000';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-9, -37);
                ctx.quadraticCurveTo(-22 + scarfWave, -27, -30, -15 + scarfWave * 0.5);
                ctx.stroke();
                ctx.strokeStyle = '#6b0000';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-9, -35);
                ctx.quadraticCurveTo(-20 + scarfWave * 0.8, -25, -28, -13 + scarfWave * 0.4);
                ctx.stroke();
                ctx.lineCap = 'butt';
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                // Torso
                ctx.beginPath();
                ctx.moveTo(0, -30);
                ctx.lineTo(0, -12);
                ctx.stroke();
                const armBobL = Math.sin(this.runCycle) * 0.1;
                const armBobR = Math.sin(this.runCycle + 0.4) * 0.08;
                const BASE_BACK = -(Math.PI * 0.72);
                if (this.isSwinging) {
                    // Sword swing arc with elbow joint + improved katana
                    const swingAngle = (this.swingFrame / 15) * Math.PI;
                    const ghosts = [
                        { offset: -0.3, alpha: 0.3 },
                        { offset: -0.2, alpha: 0.2 },
                        { offset: -0.1, alpha: 0.1 },
                    ];
                    for (const g of ghosts) {
                        const ga = swingAngle + g.offset;
                        ctx.save();
                        ctx.translate(0, -26);
                        ctx.rotate(ga - 0.6);
                        ctx.globalAlpha = g.alpha;
                        ctx.strokeStyle = '#e8e0c8';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(9, 0);
                        ctx.stroke();
                        ctx.translate(9, 0);
                        ctx.rotate(-0.25);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(8, 0);
                        ctx.stroke();
                        ctx.strokeStyle = '#d4b880';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(0, -1);
                        ctx.quadraticCurveTo(21, -2, 42, 0);
                        ctx.stroke();
                        ctx.restore();
                    }
                    ctx.globalAlpha = 1;
                    ctx.save();
                    ctx.translate(0, -26);
                    ctx.rotate(swingAngle - 0.6);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2.5;
                    // Upper arm
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(9, 0);
                    ctx.stroke();
                    // Elbow
                    ctx.translate(9, 0);
                    ctx.rotate(-0.25);
                    // Forearm
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(8, 0);
                    ctx.stroke();
                    // Katana — tsuba + tapered curved blade
                    ctx.strokeStyle = '#c8a020';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(0, -3.5);
                    ctx.lineTo(0, 3.5);
                    ctx.stroke();
                    ctx.lineCap = 'butt';
                    const swbg = ctx.createLinearGradient(0, 0, 44, 0);
                    swbg.addColorStop(0, '#d0c8a0');
                    swbg.addColorStop(0.4, '#e8e8ff');
                    swbg.addColorStop(1, '#ffffff');
                    ctx.fillStyle = swbg;
                    ctx.beginPath();
                    ctx.moveTo(0, -1.5);
                    ctx.quadraticCurveTo(22, -2.8, 44, 0);
                    ctx.lineTo(0, 1.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(220, 205, 160, 0.85)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(1, -1.2);
                    ctx.quadraticCurveTo(22, -2.4, 44, 0);
                    ctx.stroke();
                    ctx.restore();
                }
                else {
                    // Sword arm swept back — with elbow joint + improved katana
                    ctx.save();
                    ctx.translate(0, -26);
                    ctx.rotate(BASE_BACK + armBobL);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2.5;
                    // Upper arm
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(9, 0);
                    ctx.stroke();
                    // Elbow bend
                    ctx.translate(9, 0);
                    ctx.rotate(0.38);
                    // Forearm
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(8, 0);
                    ctx.stroke();
                    // Katana — tsuba + tapered curved blade
                    ctx.strokeStyle = '#c8a020';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(0, -3.5);
                    ctx.lineTo(0, 3.5);
                    ctx.stroke();
                    ctx.lineCap = 'butt';
                    const rbg = ctx.createLinearGradient(0, 0, 44, 0);
                    rbg.addColorStop(0, '#c8b890');
                    rbg.addColorStop(0.5, '#e8e0c8');
                    rbg.addColorStop(1, '#ffffff');
                    ctx.fillStyle = rbg;
                    ctx.beginPath();
                    ctx.moveTo(0, -1.5);
                    ctx.quadraticCurveTo(22, -2.8, 44, 0);
                    ctx.lineTo(0, 1.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(220, 205, 160, 0.85)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(1, -1.2);
                    ctx.quadraticCurveTo(22, -2.4, 44, 0);
                    ctx.stroke();
                    ctx.restore();
                }
                // Off-hand swept back — with elbow joint
                ctx.save();
                ctx.translate(0, -26);
                ctx.rotate(BASE_BACK - 0.2 + armBobR);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                // Upper arm
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(9, 0);
                ctx.stroke();
                // Elbow
                ctx.translate(9, 0);
                ctx.rotate(0.38);
                // Forearm
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
                ctx.restore();
                // Legs: pumping cycle with knee joints
                const legSwing = Math.sin(this.runCycle) * 0.65;
                // Right leg drawn first (behind)
                ctx.save();
                ctx.translate(0, -12);
                ctx.rotate(-legSwing);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                // Thigh
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-3, 11);
                ctx.stroke();
                // Knee + shin
                ctx.translate(-3, 11);
                ctx.rotate(legSwing * 0.55);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 9);
                ctx.stroke();
                ctx.restore();
                // Left leg drawn on top (front)
                ctx.save();
                ctx.translate(0, -12);
                ctx.rotate(legSwing);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                // Thigh
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(3, 11);
                ctx.stroke();
                // Knee + shin
                ctx.translate(3, 11);
                ctx.rotate(-legSwing * 0.55);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 9);
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }
    get hitbox() {
        if (this.isSliding) {
            return {
                x: this.x - 12,
                y: this.y - 24,
                w: 24,
                h: 24,
            };
        }
        return {
            x: this.x - 12,
            y: this.y - 46,
            w: 24,
            h: 46,
        };
    }
}
// =============================================================================
// SECTION 10: WORLD GENERATION
// =============================================================================
let rooftops = [];
let enemies = [];
let obstacles = [];
let particles = [];
let player;
function generateRooftop(afterX, afterY) {
    const gap = 40 + Math.random() * 80;
    const newX = afterX + gap;
    const heightVariation = (Math.random() - 0.5) * 80;
    let newY = afterY + heightVariation;
    if (newY < GROUND_Y_MIN)
        newY = GROUND_Y_MIN;
    if (newY > GROUND_Y_MAX)
        newY = GROUND_Y_MAX;
    const newWidth = 150 + Math.random() * 200;
    return new Rooftop(newX, newY, newWidth);
}
function spawnEnemiesOnRooftop(roof) {
    if (Math.random() < 0.6) {
        const count = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const ex = roof.x + 40 + i * 60 + Math.random() * (roof.width - 80 - i * 60);
            if (ex < roof.right - 20) {
                enemies.push(new Enemy(ex, roof.top));
            }
        }
    }
}
function spawnObstaclesOnRooftop(roof) {
    if (Math.random() < 0.4) {
        const types = ['ac', 'vent', 'tank'];
        const t = types[Math.floor(Math.random() * types.length)];
        const ox = roof.x + 20 + Math.random() * (roof.width - 60);
        // Check for enemy overlap
        let overlaps = false;
        for (const en of enemies) {
            if (Math.abs(en.x - ox) < 50) {
                overlaps = true;
                break;
            }
        }
        if (!overlaps && ox < roof.right - 20) {
            obstacles.push(new Obstacle(ox, roof.top, t));
        }
    }
}
function initWorld() {
    rooftops = [];
    enemies = [];
    obstacles = [];
    particles = [];
    boss = null;
    shurikens = [];
    bossWarningTimer = 0;
    // First safe wide rooftop
    const firstRoof = new Rooftop(0, GROUND_Y_MIN + 40, 500);
    rooftops.push(firstRoof);
    // Generate a few more
    let lastRoof = firstRoof;
    for (let i = 0; i < 4; i++) {
        const newRoof = generateRooftop(lastRoof.right, lastRoof.top);
        rooftops.push(newRoof);
        spawnEnemiesOnRooftop(newRoof);
        spawnObstaclesOnRooftop(newRoof);
        lastRoof = newRoof;
    }
    // Create player on first rooftop
    player = new Player(150, firstRoof.top);
    player.isGrounded = true;
    player.jumpsUsed = 0;
}
// =============================================================================
// SECTION 11: COLLISION DETECTION
// =============================================================================
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function checkPlayerOnRooftops() {
    player.isGrounded = false;
    for (const roof of rooftops) {
        const pb = player.hitbox;
        const playerBottom = pb.y + pb.h;
        const playerLeft = pb.x;
        const playerRight = pb.x + pb.w;
        // Check if player's feet are near rooftop top surface
        if (playerBottom >= roof.top - 5 &&
            playerBottom <= roof.top + 12 &&
            playerRight > roof.x + 5 &&
            playerLeft < roof.right - 5 &&
            player.vy >= 0) {
            player.y = roof.top;
            player.vy = 0;
            player.isGrounded = true;
            player.jumpsUsed = 0;
            break;
        }
    }
}
function checkEnemyCollisions() {
    const pb = player.hitbox;
    for (const en of enemies) {
        if (en.dead)
            continue;
        const eb = en.hitbox;
        if (rectsOverlap(pb.x, pb.y, pb.w, pb.h, eb.x, eb.y, eb.w, eb.h)) {
            // Trigger sword swing animation only if not already swinging
            if (!player.isSwinging) {
                player.isSwinging = true;
                player.swingFrame = 1;
                playSwordSwingSound();
            }
            en.swingFrame = 1;
            // Kill enemy
            en.dead = true;
            // Particle burst
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(en.x, en.y - 20, '#ff4444', 25));
            }
            // Score
            score += 1;
            // Combo tracking
            consecutiveEnemyKills++;
            player.airKillStreak++;
            if (consecutiveEnemyKills >= 3) {
                multiplier = 2;
            }
            // Boss trigger: every 10 kills
            totalEnemiesKilled++;
            if (totalEnemiesKilled % 10 === 0 && !boss) {
                spawnBoss();
            }
            playEnemyDefeatSound();
        }
    }
}
function checkObstacleCollisions() {
    const pb = player.hitbox;
    for (const obs of obstacles) {
        const ob = obs.hitbox;
        if (rectsOverlap(pb.x, pb.y, pb.w, pb.h, ob.x, ob.y, ob.w, ob.h)) {
            gameOver('STOPPED BY AN OBSTACLE');
            return;
        }
    }
}
function checkShurikenCollisions() {
    if (!player) return;
    const pb = player.hitbox;
    for (const s of shurikens) {
        if (!s.active) continue;
        const sb = s.hitbox;
        if (rectsOverlap(pb.x, pb.y, pb.w, pb.h, sb.x, sb.y, sb.w, sb.h)) {
            s.active = false;
            gameOver('STRUCK BY THE RED SHADOW');
            return;
        }
    }
}
let bgLayers = [];
let bambooBg = [];
function makeLanternSlots(bx, by, bw, bh) {
    const slots = [];
    const cols = Math.floor(bw / 18);
    const rows = Math.floor(bh / 22);
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            if (Math.random() < 0.18) {
                slots.push({ x: bx + c * 18 + 6, y: by + r * 22 + 6 });
            }
        }
    }
    return slots;
}
function generateLayerBuildings(color, speed, minH, maxH) {
    const buildings = [];
    let bx = 0;
    while (bx < CANVAS_WIDTH + 200) {
        const bw = 40 + Math.floor(Math.random() * 60);
        const bh = minH + Math.floor(Math.random() * (maxH - minH));
        const by = CANVAS_HEIGHT - bh;
        buildings.push({
            x: bx,
            w: bw,
            h: bh,
            windows: makeLanternSlots(bx, by, bw, bh),
        });
        bx += bw + 5 + Math.floor(Math.random() * 15);
    }
    return { buildings, speed, color };
}
function initBambooBg() {
    bambooBg = [];
    let bx = 0;
    while (bx < CANVAS_WIDTH + 100) {
        bambooBg.push({
            x: bx,
            h: 90 + Math.random() * 110,
            w: 3 + Math.random() * 3,
        });
        bx += 14 + Math.random() * 22;
    }
}
function initBackground() {
    bgLayers = [
        generateLayerBuildings('#0c0a08', 0.2, 60, 120),
        generateLayerBuildings('#100e0a', 0.5, 80, 160),
        generateLayerBuildings('#16120e', 0.8, 100, 200),
    ];
    bambooBg = [];
}
function updateBackground() {
    for (const layer of bgLayers) {
        const layerSpeed = layer.speed * scrollSpeed;
        for (const b of layer.buildings) {
            b.x -= layerSpeed;
            for (const w of b.windows) {
                w.x -= layerSpeed;
            }
        }
        // Remove off-screen buildings and add new ones at right
        const minX = layer.buildings.reduce((m, b) => Math.min(m, b.x), Infinity);
        if (minX < -300) {
            layer.buildings.shift();
        }
        // Ensure rightmost building extends to screen right
        const maxRight = layer.buildings.reduce((m, b) => Math.max(m, b.x + b.w), -Infinity);
        if (maxRight < CANVAS_WIDTH + 200) {
            const bw = 40 + Math.floor(Math.random() * 60);
            const layerIdx = bgLayers.indexOf(layer);
            const minH = [60, 80, 100][layerIdx];
            const maxH = [120, 160, 200][layerIdx];
            const bh = minH + Math.floor(Math.random() * (maxH - minH));
            const bx = maxRight + 5 + Math.floor(Math.random() * 15);
            const by = CANVAS_HEIGHT - bh;
            layer.buildings.push({
                x: bx,
                w: bw,
                h: bh,
                windows: makeLanternSlots(bx, by, bw, bh),
            });
        }
    }
}
function lerpRGB(r1, g1, b1, r2, g2, b2, t) {
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
function drawBackground(ctx) {
    // Day/night cycle: t=0 is night, t=1 is day, oscillates via sine (~2 min cycle)
    const dayNightT = (Math.sin(Date.now() * 0.00005) + 1) / 2;
    // Sky gradient — blended between night and day palettes
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0,    lerpRGB(13,  11,  20,  35, 110, 195, dayNightT));
    skyGrad.addColorStop(0.4,  lerpRGB(15,  13,  16,  90, 160, 215, dayNightT));
    skyGrad.addColorStop(0.75, lerpRGB(14,  12,  10, 250, 185,  95, dayNightT));
    skyGrad.addColorStop(1,    lerpRGB(19,  15,  10, 250, 155,  55, dayNightT));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Moon — fades out as day breaks (fully gone at t=0.5)
    const moonAlpha = Math.max(0, 1 - dayNightT * 2);
    if (moonAlpha > 0.01) {
        const moonX = CANVAS_WIDTH * 0.82, moonY = 48, moonR = 20;
        ctx.save();
        ctx.globalAlpha = moonAlpha;
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR, moonX, moonY, moonR * 4.5);
        moonGlow.addColorStop(0, 'rgba(240, 220, 160, 0.16)');
        moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8ddc0';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0d0b14';
        ctx.beginPath();
        ctx.arc(moonX + 11, moonY - 5, moonR * 0.86, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Sun — rises as day breaks (visible from t=0.5 onward)
    const sunAlpha = Math.max(0, dayNightT * 2 - 1);
    if (sunAlpha > 0.01) {
        const sunX = CANVAS_WIDTH * 0.18, sunY = 52, sunR = 22;
        ctx.save();
        ctx.globalAlpha = sunAlpha;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR, sunX, sunY, sunR * 5);
        sunGlow.addColorStop(0, 'rgba(255, 220, 80, 0.40)');
        sunGlow.addColorStop(1, 'rgba(255, 140, 20, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe060';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3a0';
        ctx.beginPath();
        ctx.arc(sunX - 5, sunY - 5, sunR * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Stars — fade out as day breaks
    const starAlpha = Math.max(0, 1 - dayNightT * 2);
    if (starAlpha > 0.01) {
        for (let i = 0; i < 80; i++) {
            const sx = (i * 137.508) % CANVAS_WIDTH;
            const sy = (i * 93.73) % (CANVAS_HEIGHT * 0.52);
            const bright = (0.2 + (i % 6) * 0.1) * starAlpha;
            const sz = i % 9 === 0 ? 1.5 : 0.8;
            ctx.fillStyle = `rgba(230, 220, 180, ${bright})`;
            ctx.fillRect(sx, sy, sz, sz);
        }
    }
    // Horizon misty haze
    const hazeGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.55, 0, CANVAS_HEIGHT);
    hazeGrad.addColorStop(0, 'rgba(20, 30, 10, 0)');
    hazeGrad.addColorStop(1, 'rgba(20, 30, 10, 0.28)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, CANVAS_HEIGHT * 0.55, CANVAS_WIDTH, CANVAS_HEIGHT * 0.45);
    // Parallax temple/pagoda silhouettes
    const layerTopColors = ['#100e0c', '#14120e', '#1a1612'];
    const layerMidColors = ['#0c0a08', '#100e0c', '#14120e'];
    const layerEdgeColors = ['#26211a', '#2e2820', '#38302a'];
    for (let li = 0; li < bgLayers.length; li++) {
        const layer = bgLayers[li];
        for (const b of layer.buildings) {
            const bx = b.x, by = CANVAS_HEIGHT - b.h;
            // Building body gradient
            const bGrad = ctx.createLinearGradient(bx, by, bx, CANVAS_HEIGHT);
            bGrad.addColorStop(0, layerTopColors[li]);
            bGrad.addColorStop(0.4, layerMidColors[li]);
            bGrad.addColorStop(1, '#020304');
            ctx.fillStyle = bGrad;
            ctx.fillRect(bx, by, b.w, b.h);
            // Pagoda-style peaked roof on mid layer
            if (li === 1) {
                ctx.fillStyle = '#14120e';
                ctx.beginPath();
                ctx.moveTo(bx - 3, by);
                ctx.lineTo(bx + b.w + 3, by);
                ctx.lineTo(bx + b.w / 2 + 6, by - 12);
                ctx.lineTo(bx + b.w / 2 - 6, by - 12);
                ctx.closePath();
                ctx.fill();
                // Roof cap glow
                ctx.fillStyle = 'rgba(200, 140, 20, 0.12)';
                ctx.fillRect(bx + b.w / 2 - 6, by - 12, 12, 2);
            }
            // Rooftop edge
            ctx.fillStyle = layerEdgeColors[li];
            ctx.fillRect(bx, by, b.w, 1);
            // Paper lantern windows — warm orange glow
            for (const w of b.windows) {
                ctx.fillStyle = 'rgba(220, 120, 20, 0.12)';
                ctx.fillRect(w.x - 2, w.y - 2, 7, 7);
                ctx.fillStyle = 'rgba(230, 150, 30, 0.75)';
                ctx.fillRect(w.x, w.y, 3, 4);
            }
        }
    }
    // Ambient warm mist glow at base
    const mistGlow = ctx.createLinearGradient(0, CANVAS_HEIGHT - 50, 0, CANVAS_HEIGHT);
    mistGlow.addColorStop(0, 'rgba(40, 30, 10, 0)');
    mistGlow.addColorStop(1, 'rgba(40, 30, 10, 0.22)');
    ctx.fillStyle = mistGlow;
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
}
// =============================================================================
// SECTION 13: RENDERING
// =============================================================================
function renderRooftops(ctx) {
    for (const roof of rooftops) {
        roof.draw(ctx);
    }
}
function renderEnemies(ctx) {
    for (const en of enemies) {
        en.draw(ctx);
    }
}
function renderObstacles(ctx) {
    for (const obs of obstacles) {
        obs.draw(ctx);
    }
}
function renderParticles(ctx) {
    for (const p of particles) {
        p.draw(ctx);
    }
}
function renderHUD() {
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('highScore');
    const speedEl = document.getElementById('speedIndicator');
    if (scoreEl)
        scoreEl.textContent = `SCORE: ${score}`;
    if (highScoreEl)
        highScoreEl.textContent = `BEST: ${highScore}`;
    if (speedEl) {
        const speedMult = (scrollSpeed / INITIAL_SCROLL_SPEED).toFixed(1);
        speedEl.textContent = `SPEED: ${speedMult}x`;
    }
}
function renderStartScreen(ctx) {
    const cx = CANVAS_WIDTH / 2;
    const roofY = CANVAS_HEIGHT * 0.65;
    // Dojo platform
    ctx.fillStyle = '#2a1a0c';
    ctx.fillRect(cx - 80, roofY, 160, CANVAS_HEIGHT - roofY);
    // Amber edge glow
    ctx.fillStyle = 'rgba(200, 150, 20, 0.6)';
    ctx.fillRect(cx - 80, roofY, 160, 2);
    ctx.strokeStyle = '#4a2e10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 80, roofY);
    ctx.lineTo(cx + 80, roofY);
    ctx.stroke();
    // Animated ninja in sprint pose
    const runCyc = Date.now() * 0.009;
    const color = '#d8cca0';
    const armBobL = Math.sin(runCyc) * 0.1;
    const armBobR = Math.sin(runCyc + 0.4) * 0.08;
    const BASE_BACK = -(Math.PI * 0.72);
    ctx.save();
    ctx.translate(cx, roofY);
    ctx.rotate(0.28); // lean forward
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -40, 10, 0, Math.PI * 2);
    ctx.fill();
    // Headband
    ctx.strokeStyle = '#5a1010';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -40);
    ctx.lineTo(10, -40);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -38);
    ctx.lineTo(-18, -32);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, -12);
    ctx.stroke();
    // Sword arm swept back — with elbow joint + improved katana
    ctx.save();
    ctx.translate(0, -26);
    ctx.rotate(BASE_BACK + armBobL);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    // Upper arm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    // Elbow bend
    ctx.translate(9, 0);
    ctx.rotate(0.38);
    // Forearm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    // Katana — tsuba + tapered curved blade
    ctx.strokeStyle = '#c8a020';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -3.5);
    ctx.lineTo(0, 3.5);
    ctx.stroke();
    ctx.lineCap = 'butt';
    const ssbg = ctx.createLinearGradient(0, 0, 44, 0);
    ssbg.addColorStop(0, '#c8b890');
    ssbg.addColorStop(0.5, '#e8e0c8');
    ssbg.addColorStop(1, '#ffffff');
    ctx.fillStyle = ssbg;
    ctx.beginPath();
    ctx.moveTo(0, -1.5);
    ctx.quadraticCurveTo(22, -2.8, 44, 0);
    ctx.lineTo(0, 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(220, 205, 160, 0.85)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(1, -1.2);
    ctx.quadraticCurveTo(22, -2.4, 44, 0);
    ctx.stroke();
    ctx.restore();
    // Off-hand swept back — with elbow joint
    ctx.save();
    ctx.translate(0, -26);
    ctx.rotate(BASE_BACK - 0.2 + armBobR);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    // Upper arm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
    // Elbow
    ctx.translate(9, 0);
    ctx.rotate(0.38);
    // Forearm
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    ctx.restore();
    // Legs pumping — with knee joints
    const legSwing = Math.sin(runCyc) * 0.65;
    // Right leg (behind)
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(-legSwing);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-3, 11);
    ctx.stroke();
    ctx.translate(-3, 11);
    ctx.rotate(legSwing * 0.55);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.restore();
    // Left leg (front)
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(legSwing);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(3, 11);
    ctx.stroke();
    ctx.translate(3, 11);
    ctx.rotate(-legSwing * 0.55);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
}
function renderGameOverScreen() {
    const titleEl = document.getElementById('gameOverTitle');
    const causeEl = document.getElementById('deathCause');
    const finalScoreEl = document.getElementById('finalScore');
    const finalHSEl = document.getElementById('finalHighScore');
    if (titleEl)
        titleEl.textContent = 'DISHONORED';
    if (causeEl)
        causeEl.textContent = deathCause;
    if (finalScoreEl)
        finalScoreEl.textContent = `SCORE: ${score}`;
    if (finalHSEl)
        finalHSEl.textContent = `BEST: ${highScore}`;
}
// =============================================================================
// SECTION 14: GAME LOOP
// =============================================================================
function update() {
    if (gameState !== 'playing')
        return;
    frameCount++;
    scrollSpeed = Math.min(MAX_SCROLL_SPEED, INITIAL_SCROLL_SPEED + frameCount * SCROLL_ACCELERATION);
    updateBackground();
    // Update rooftops
    for (const roof of rooftops) {
        roof.update(scrollSpeed);
    }
    // Also scroll enemies and obstacles with world
    for (const en of enemies) {
        en.x -= scrollSpeed;
        en.update();
    }
    for (const obs of obstacles) {
        obs.x -= scrollSpeed;
    }
    // Remove off-screen rooftops
    rooftops = rooftops.filter(r => !r.isOffScreen);
    // Remove fully faded dead enemies
    enemies = enemies.filter(en => !(en.dead && en.fadeOut <= 0));
    // Update particles, remove dead ones
    particles = particles.filter(p => p.update());
    // Generate new rooftops as needed
    const rightmost = rooftops.reduce((m, r) => Math.max(m, r.right), 0);
    if (rightmost < CANVAS_WIDTH + 300) {
        const lastRoof = rooftops[rooftops.length - 1];
        const newRoof = generateRooftop(lastRoof.right, lastRoof.top);
        rooftops.push(newRoof);
        if (!boss) {
            spawnEnemiesOnRooftop(newRoof);
            spawnObstaclesOnRooftop(newRoof);
        }
    }
    // Update player
    player.update();
    // Collision checks
    checkPlayerOnRooftops();
    checkEnemyCollisions();
    checkObstacleCollisions();
    // Update boss
    if (boss) boss.update();
    // Update shurikens
    shurikens = shurikens.filter(s => s.active);
    for (const s of shurikens) s.update();
    // Check shuriken collisions with player
    checkShurikenCollisions();
    // Boss warning timer
    if (bossWarningTimer > 0) bossWarningTimer--;
    // Reset combo if player lands without killing
    if (!player.wasGrounded && player.isGrounded && player.airKillStreak === 0) {
        consecutiveEnemyKills = 0;
        multiplier = 1;
    }
    // Check fall-off
    if (player.y > CANVAS_HEIGHT + 50) {
        gameOver('FELL FROM THE PATH');
        return;
    }
    // Update HUD
    renderHUD();
}
function draw() {
    if (!ctx)
        return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    if (gameState === 'start') {
        renderStartScreen(ctx);
    }
    else {
        renderRooftops(ctx);
        renderObstacles(ctx);
        renderEnemies(ctx);
        renderParticles(ctx);
        // Draw shurikens behind player
        for (const s of shurikens) s.draw(ctx);
        if (boss) boss.draw(ctx);
        if (player)
            player.draw(ctx);
        // Boss warning banner
        if (bossWarningTimer > 0) {
            const t = bossWarningTimer / 180;
            const alpha = t < 0.2 ? t / 0.2 : t > 0.8 ? (t - 0.8) / 0.2 : 1;
            ctx.save();
            ctx.globalAlpha = alpha * 0.92;
            ctx.fillStyle = 'rgba(80,0,0,0.82)';
            ctx.fillRect(0, CANVAS_HEIGHT / 2 - 26, CANVAS_WIDTH, 52);
            ctx.fillStyle = '#ff3333';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 18;
            ctx.font = 'bold 26px "Cinzel", serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ THE RED SHADOW APPROACHES ⚠', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 9);
            ctx.restore();
        }
    }
    if (gameState === 'gameover') {
        renderGameOverScreen();
    }
    renderHUD();
}
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
// =============================================================================
// SECTION 15: GAME STATE MANAGEMENT
// =============================================================================
function startGame() {
    const startScreenEl = document.getElementById('startScreen');
    const hudEl = document.getElementById('hud');
    if (startScreenEl)
        startScreenEl.style.display = 'none';
    if (hudEl)
        hudEl.style.display = 'flex';
    score = 0;
    scrollSpeed = INITIAL_SCROLL_SPEED;
    frameCount = 0;
    consecutiveEnemyKills = 0;
    multiplier = 1;
    totalEnemiesKilled = 0;
    initWorld();
    gameState = 'playing';
}
function gameOver(cause) {
    gameState = 'gameover';
    deathCause = cause;
    // Update high score
    if (score > highScore) {
        highScore = score;
    }
    const gameOverEl = document.getElementById('gameOverScreen');
    if (gameOverEl)
        gameOverEl.classList.remove('hidden');
    renderGameOverScreen();
    playGameOverSound();
}
function restartGame() {
    const gameOverEl = document.getElementById('gameOverScreen');
    if (gameOverEl)
        gameOverEl.classList.add('hidden');
    score = 0;
    scrollSpeed = INITIAL_SCROLL_SPEED;
    frameCount = 0;
    consecutiveEnemyKills = 0;
    multiplier = 1;
    totalEnemiesKilled = 0;
    initWorld();
    gameState = 'playing';
}
// =============================================================================
// SECTION 16: AUDIO
// =============================================================================
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        try {
            audioCtx = new AudioContext();
        }
        catch (e) {
            return null;
        }
    }
    return audioCtx;
}
function playTone(freq, endFreq, duration, type = 'sine', volume = 0.3) {
    try {
        const ac = getAudioContext();
        if (!ac)
            return;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, ac.currentTime + duration);
        gain.gain.setValueAtTime(volume, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + duration);
    }
    catch (e) {
        // Audio not supported or failed
    }
}
function playNoiseBurst(duration, volume = 0.2) {
    try {
        const ac = getAudioContext();
        if (!ac)
            return;
        const bufferSize = Math.floor(ac.sampleRate * duration);
        const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = ac.createBufferSource();
        source.buffer = buffer;
        const gain = ac.createGain();
        gain.gain.setValueAtTime(volume, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.5;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        source.start(ac.currentTime);
    }
    catch (e) {
        // Audio not supported
    }
}
function playGong(baseFreq, duration, volume = 0.25) {
    try {
        const ac = getAudioContext();
        if (!ac) return;
        const now = ac.currentTime;
        // Fundamental tone — long sine decay like a struck bell
        const osc1 = ac.createOscillator();
        const gain1 = ac.createGain();
        osc1.connect(gain1);
        gain1.connect(ac.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);
        gain1.gain.setValueAtTime(volume, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc1.start(now);
        osc1.stop(now + duration);
        // Upper partial (bell shimmer)
        const osc2 = ac.createOscillator();
        const gain2 = ac.createGain();
        osc2.connect(gain2);
        gain2.connect(ac.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq * 2.756, now);
        gain2.gain.setValueAtTime(volume * 0.25, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.4);
        osc2.start(now);
        osc2.stop(now + duration * 0.4);
    } catch (e) {}
}
function playJumpSound() {
    // Soft whoosh
    playTone(280, 520, 0.08, 'sine', 0.15);
}
function playSwordSwingSound() {
    playNoiseBurst(0.12, 0.15);
    playTone(800, 400, 0.1, 'sine', 0.06);
}
function playEnemyDefeatSound() {
    // Small gong hit
    playGong(360, 0.7, 0.18);
}
function playGameOverSound() {
    // Deep resonant gong strike
    playGong(140, 2.2, 0.3);
}
function playBossWarnSound() {
    // Low ominous rumble — two low gong tones
    playGong(80, 2.8, 0.28);
    setTimeout(() => playGong(60, 2.4, 0.22), 400);
}
function playBossThrowSound() {
    // Sharp whoosh — rising noise burst
    playNoiseBurst(0.09, 0.18);
    playTone(600, 900, 0.07, 'sawtooth', 0.07);
}
// =============================================================================
// INITIALIZATION & START
// =============================================================================
// Initialize background immediately
initBackground();
// Hide HUD initially, show start screen
const hudEl = document.getElementById('hud');
if (hudEl)
    hudEl.style.display = 'none';
// Update high score display on start screen
const highScoreEl = document.getElementById('highScore');
if (highScoreEl)
    highScoreEl.textContent = `BEST: ${highScore}`;
// Start the game loop
requestAnimationFrame(gameLoop);
