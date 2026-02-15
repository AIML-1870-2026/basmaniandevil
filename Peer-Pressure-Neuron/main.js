"use strict";
// ========== STATE ==========
const INITIAL_WEIGHTS = [0.3, -0.5, -0.4, 0.2, 0.1];
const WEIGHT_NAMES = ['Fun Factor', 'Danger Level', 'Trouble Risk', 'Long-term Benefit', 'Peer Pressure'];
const LEARNING_RATE = 0.1;
let weights = [...INITIAL_WEIGHTS];
let bias = 0;
let trainingPoints = [];
let stepCount = 0;
let labelMode = null;
let isTraining = false;
let prevWeights = [...INITIAL_WEIGHTS];
let prevBias = 0;
// DOM refs
const funSlider = document.getElementById('funSlider');
const dangerSlider = document.getElementById('dangerSlider');
const troubleSlider = document.getElementById('troubleSlider');
const benefitSlider = document.getElementById('benefitSlider');
const pressureSlider = document.getElementById('pressureSlider');
const biasSlider = document.getElementById('biasSlider');
const funVal = document.getElementById('funVal');
const dangerVal = document.getElementById('dangerVal');
const troubleVal = document.getElementById('troubleVal');
const benefitVal = document.getElementById('benefitVal');
const pressureVal = document.getElementById('pressureVal');
const biasVal = document.getElementById('biasVal');
const decisionOutput = document.getElementById('decisionOutput');
const decisionText = document.getElementById('decisionText');
const decisionConfidence = document.getElementById('decisionConfidence');
const confidenceLabel = document.getElementById('confidenceLabel');
const mathBreakdown = document.getElementById('mathBreakdown');
const canvas = document.getElementById('vizCanvas');
const ctx = canvas.getContext('2d');
const canvasTooltip = document.getElementById('canvasTooltip');
const labelModeInfo = document.getElementById('labelModeInfo');
const trainProgress = document.getElementById('trainProgress');
const trainProgressText = document.getElementById('trainProgressText');
const trainProgressBar = document.getElementById('trainProgressBar');
// ========== NEURON MATH ==========
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}
function calculateZ(inputs, w, b) {
    let z = b;
    for (let i = 0; i < inputs.length; i++)
        z += inputs[i] * w[i];
    return z;
}
function predict(inputs, w, b) {
    return sigmoid(calculateZ(inputs, w, b));
}
function getInputs() {
    return [
        parseFloat(funSlider.value),
        parseFloat(dangerSlider.value),
        parseFloat(troubleSlider.value),
        parseFloat(benefitSlider.value),
        parseFloat(pressureSlider.value)
    ];
}
// ========== UPDATE DISPLAY ==========
function update() {
    const inputs = getInputs();
    const userBias = parseFloat(biasSlider.value);
    // Display slider values
    funVal.textContent = inputs[0].toFixed(1);
    dangerVal.textContent = inputs[1].toFixed(1);
    troubleVal.textContent = inputs[2].toFixed(1);
    benefitVal.textContent = inputs[3].toFixed(1);
    pressureVal.textContent = inputs[4].toFixed(1);
    biasVal.textContent = userBias.toFixed(1);
    // Compute using training weights + user bias combined with slider bias
    const totalBias = bias + userBias;
    const z = calculateZ(inputs, weights, totalBias);
    const output = sigmoid(z);
    const isDoIt = output >= 0.5;
    const pct = (output * 100).toFixed(1);
    // Decision display
    decisionOutput.className = 'decision-output ' + (isDoIt ? 'do-it' : 'pass');
    decisionText.textContent = isDoIt ? 'DO IT' : 'PASS';
    decisionConfidence.textContent = pct + '% confidence';
    if (output > 0.9)
        confidenceLabel.textContent = 'Highly confident';
    else if (output > 0.7)
        confidenceLabel.textContent = 'Fairly confident';
    else if (output > 0.55)
        confidenceLabel.textContent = 'Leaning towards it';
    else if (output > 0.45)
        confidenceLabel.textContent = 'Uncertain';
    else if (output > 0.3)
        confidenceLabel.textContent = 'Leaning away';
    else if (output > 0.1)
        confidenceLabel.textContent = 'Fairly confident';
    else
        confidenceLabel.textContent = 'Highly confident';
    // Math breakdown
    const terms = [];
    const termValues = [];
    for (let i = 0; i < 5; i++) {
        const val = inputs[i] * weights[i];
        terms.push(`(${inputs[i].toFixed(1)} x ${weights[i] >= 0 ? '+' : ''}${weights[i].toFixed(2)})`);
        termValues.push(val);
    }
    const biasStr = totalBias >= 0 ? `+${totalBias.toFixed(2)}` : totalBias.toFixed(2);
    const lines = [];
    lines.push(`Weighted Sum (z):`);
    lines.push(`  = ${terms.join(' + ')} ${biasStr}`);
    const parts = termValues.map(v => (v >= 0 ? '+' : '') + v.toFixed(2));
    lines.push(`  = ${parts.join(' ')} ${biasStr}`);
    lines.push(`  = ${z.toFixed(4)}`);
    lines.push('');
    lines.push(`Sigmoid(${z.toFixed(4)}) = 1 / (1 + e^(${(-z).toFixed(4)}))`);
    lines.push(`                   = ${output.toFixed(4)} = ${pct}%`);
    lines.push('');
    lines.push(`Decision: ${isDoIt ? 'DO IT' : 'PASS'} ${isDoIt ? String.fromCodePoint(0x2713) : String.fromCodePoint(0x2717)}`);
    mathBreakdown.textContent = lines.join('\n');
    // Update weights display
    updateWeightsDisplay();
    // Redraw canvas
    drawVisualization();
}
function updateWeightsDisplay() {
    const container = document.getElementById('weightsDisplay');
    let html = '';
    for (let i = 0; i < 5; i++) {
        const w = weights[i];
        const cls = w >= 0 ? 'positive' : 'negative';
        const sign = w >= 0 ? '+' : '';
        let arrow = '';
        const diff = weights[i] - prevWeights[i];
        if (Math.abs(diff) > 0.0001) {
            arrow = diff > 0
                ? '<span class="weight-arrow" style="color:var(--green)">&#8593;</span>'
                : '<span class="weight-arrow" style="color:var(--red)">&#8595;</span>';
        }
        html += `<div class="weight-row">
      <span class="weight-name">${WEIGHT_NAMES[i]}</span>
      <span class="weight-val ${cls}">${sign}${w.toFixed(4)}${arrow}</span>
    </div>`;
    }
    // Bias row
    const bCls = bias >= 0 ? 'positive' : 'negative';
    const bSign = bias >= 0 ? '+' : '';
    let bArrow = '';
    const bDiff = bias - prevBias;
    if (Math.abs(bDiff) > 0.0001) {
        bArrow = bDiff > 0
            ? '<span class="weight-arrow" style="color:var(--green)">&#8593;</span>'
            : '<span class="weight-arrow" style="color:var(--red)">&#8595;</span>';
    }
    html += `<div class="weight-row">
    <span class="weight-name">Bias (trained)</span>
    <span class="weight-val ${bCls}">${bSign}${bias.toFixed(4)}${bArrow}</span>
  </div>`;
    container.innerHTML = html;
}
// ========== VISUALIZATION ==========
const PLOT_PADDING = 50;
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const size = Math.floor(Math.min(rect.width, rect.height));
    canvas.width = size * window.devicePixelRatio;
    canvas.height = size * window.devicePixelRatio;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}
function toCanvasX(funVal) {
    const w = canvas.width / window.devicePixelRatio;
    return PLOT_PADDING + (funVal / 10) * (w - 2 * PLOT_PADDING);
}
function toCanvasY(dangerVal) {
    const h = canvas.height / window.devicePixelRatio;
    return (h - PLOT_PADDING) - (dangerVal / 10) * (h - 2 * PLOT_PADDING);
}
function fromCanvasX(cx) {
    const w = canvas.width / window.devicePixelRatio;
    return ((cx - PLOT_PADDING) / (w - 2 * PLOT_PADDING)) * 10;
}
function fromCanvasY(cy) {
    const h = canvas.height / window.devicePixelRatio;
    return ((h - PLOT_PADDING - cy) / (h - 2 * PLOT_PADDING)) * 10;
}
function drawVisualization() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const plotLeft = PLOT_PADDING;
    const plotTop = PLOT_PADDING;
    const plotWidth = w - 2 * PLOT_PADDING;
    const plotHeight = h - 2 * PLOT_PADDING;
    ctx.clearRect(0, 0, w, h);
    // Background
    ctx.fillStyle = '#141720';
    ctx.fillRect(0, 0, w, h);
    // Get current other inputs for boundary calculation
    const inputs = getInputs();
    const userBias = parseFloat(biasSlider.value);
    const totalBias = bias + userBias;
    // Constant from other factors
    const constant = totalBias + inputs[2] * weights[2] + inputs[3] * weights[3] + inputs[4] * weights[4];
    // Draw colored regions using pixel sampling for accuracy
    const regionRes = 4;
    for (let px = plotLeft; px < plotLeft + plotWidth; px += regionRes) {
        for (let py = plotTop; py < plotTop + plotHeight; py += regionRes) {
            const funV = fromCanvasX(px);
            const dangerV = fromCanvasY(py);
            const zVal = funV * weights[0] + dangerV * weights[1] + constant;
            const prob = sigmoid(zVal);
            if (prob >= 0.5) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.12)';
            }
            else {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.12)';
            }
            ctx.fillRect(px, py, regionRes, regionRes);
        }
    }
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const x = toCanvasX(i);
        const y = toCanvasY(i);
        ctx.beginPath();
        ctx.moveTo(x, plotTop);
        ctx.lineTo(x, plotTop + plotHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(plotLeft, y);
        ctx.lineTo(plotLeft + plotWidth, y);
        ctx.stroke();
    }
    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i += 2) {
        ctx.fillText(String(i), toCanvasX(i), h - PLOT_PADDING + 18);
        ctx.textAlign = 'right';
        ctx.fillText(String(i), PLOT_PADDING - 8, toCanvasY(i) + 4);
        ctx.textAlign = 'center';
    }
    // Axis titles
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fun Factor', w / 2, h - 8);
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Danger Level', 0, 0);
    ctx.restore();
    // Decision boundary line
    if (Math.abs(weights[1]) > 0.0001) {
        const dangerAtFun0 = -(0 * weights[0] + constant) / weights[1];
        const dangerAtFun10 = -(10 * weights[0] + constant) / weights[1];
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(0), toCanvasY(dangerAtFun0));
        ctx.lineTo(toCanvasX(10), toCanvasY(dangerAtFun10));
        ctx.stroke();
        ctx.setLineDash([]);
    }
    // Region labels
    ctx.font = 'bold 16px -apple-system, sans-serif';
    const testPoints = [
        { fx: 8, fy: 2 },
        { fx: 2, fy: 8 }
    ];
    for (const tp of testPoints) {
        const zTest = tp.fx * weights[0] + tp.fy * weights[1] + constant;
        const probTest = sigmoid(zTest);
        const label = probTest >= 0.5 ? 'DO IT' : 'PASS';
        const color = probTest >= 0.5 ? 'rgba(46, 204, 113, 0.5)' : 'rgba(231, 76, 60, 0.5)';
        ctx.fillStyle = color;
        ctx.fillText(label, toCanvasX(tp.fx), toCanvasY(tp.fy));
    }
    // Training points
    for (const pt of trainingPoints) {
        const cx = toCanvasX(pt.x);
        const cy = toCanvasY(pt.y);
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = pt.label === 1 ? 'rgba(46, 204, 113, 0.85)' : 'rgba(231, 76, 60, 0.85)';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    // Current position marker (crosshair)
    const curX = toCanvasX(inputs[0]);
    const curY = toCanvasY(inputs[1]);
    const zCur = calculateZ(inputs, weights, totalBias);
    const outputCur = sigmoid(zCur);
    const markerColor = outputCur >= 0.5 ? '#2ecc71' : '#e74c3c';
    // Crosshair lines
    ctx.strokeStyle = markerColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(curX, plotTop);
    ctx.lineTo(curX, plotTop + plotHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(plotLeft, curY);
    ctx.lineTo(plotLeft + plotWidth, curY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Center dot
    ctx.beginPath();
    ctx.arc(curX, curY, 9, 0, Math.PI * 2);
    ctx.fillStyle = markerColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Inner dot
    ctx.beginPath();
    ctx.arc(curX, curY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Plot border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(plotLeft, plotTop, plotWidth, plotHeight);
}
// ========== TRAINING ==========
function trainStep() {
    if (trainingPoints.length === 0)
        return;
    prevWeights = [...weights];
    prevBias = bias;
    const inputs = getInputs();
    const userBias = parseFloat(biasSlider.value);
    for (const pt of trainingPoints) {
        const trainInputs = [pt.x, pt.y, inputs[2], inputs[3], inputs[4]];
        const totalBias = bias + userBias;
        const prediction = predict(trainInputs, weights, totalBias);
        const error = pt.label - prediction;
        const gradient = error * prediction * (1 - prediction);
        weights[0] += LEARNING_RATE * gradient * pt.x;
        weights[1] += LEARNING_RATE * gradient * pt.y;
        bias += LEARNING_RATE * gradient;
    }
    stepCount++;
    updateStats();
}
function updateStats() {
    document.getElementById('statStep').textContent = String(stepCount);
    document.getElementById('statPoints').textContent = String(trainingPoints.length);
    if (trainingPoints.length === 0) {
        document.getElementById('statAccuracy').textContent = '--';
        document.getElementById('statLoss').textContent = '--';
        return;
    }
    const inputs = getInputs();
    const userBias = parseFloat(biasSlider.value);
    let correct = 0;
    let totalLoss = 0;
    for (const pt of trainingPoints) {
        const trainInputs = [pt.x, pt.y, inputs[2], inputs[3], inputs[4]];
        const totalBias = bias + userBias;
        const pred = predict(trainInputs, weights, totalBias);
        const predictedLabel = pred >= 0.5 ? 1 : 0;
        if (predictedLabel === pt.label)
            correct++;
        const clippedPred = Math.max(0.0001, Math.min(0.9999, pred));
        totalLoss += -(pt.label * Math.log(clippedPred) + (1 - pt.label) * Math.log(1 - clippedPred));
    }
    const accuracy = (correct / trainingPoints.length * 100).toFixed(0);
    document.getElementById('statAccuracy').textContent = `${accuracy}% (${correct}/${trainingPoints.length})`;
    document.getElementById('statLoss').textContent = (totalLoss / trainingPoints.length).toFixed(4);
}
async function runTraining(iterations = 100) {
    if (trainingPoints.length === 0 || isTraining)
        return;
    isTraining = true;
    const btnTrain = document.getElementById('btnTrain');
    const btnStep = document.getElementById('btnStep');
    btnTrain.disabled = true;
    btnStep.disabled = true;
    trainProgress.style.display = 'block';
    for (let i = 0; i < iterations; i++) {
        if (!isTraining)
            break;
        trainStep();
        trainProgressText.textContent = `Training... iteration ${i + 1}/${iterations}`;
        trainProgressBar.style.width = ((i + 1) / iterations * 100) + '%';
        update();
        await new Promise(r => setTimeout(r, 30));
    }
    isTraining = false;
    btnTrain.disabled = false;
    btnStep.disabled = false;
    trainProgress.style.display = 'none';
    trainProgressBar.style.width = '0%';
}
function resetAll() {
    weights = [...INITIAL_WEIGHTS];
    prevWeights = [...INITIAL_WEIGHTS];
    bias = 0;
    prevBias = 0;
    trainingPoints = [];
    stepCount = 0;
    isTraining = false;
    labelMode = null;
    labelModeInfo.textContent = 'Click the plot to add training points. Select a label mode first.';
    labelModeInfo.className = 'label-mode-info';
    updateStats();
    update();
}
// ========== EVENT LISTENERS ==========
// Sliders
[funSlider, dangerSlider, troubleSlider, benefitSlider, pressureSlider, biasSlider].forEach(slider => {
    slider.addEventListener('input', update);
});
// Canvas click - add training point
canvas.addEventListener('click', (e) => {
    if (!labelMode)
        return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const funV = Math.max(0, Math.min(10, fromCanvasX(cx)));
    const dangerV = Math.max(0, Math.min(10, fromCanvasY(cy)));
    trainingPoints.push({
        x: Math.round(funV * 10) / 10,
        y: Math.round(dangerV * 10) / 10,
        label: labelMode === 'do-it' ? 1 : 0
    });
    updateStats();
    update();
});
// Canvas hover - tooltip
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const funV = fromCanvasX(cx);
    const dangerV = fromCanvasY(cy);
    if (funV >= 0 && funV <= 10 && dangerV >= 0 && dangerV <= 10) {
        canvasTooltip.style.opacity = '1';
        canvasTooltip.textContent = `Fun: ${funV.toFixed(1)}, Danger: ${dangerV.toFixed(1)}`;
        canvasTooltip.style.left = (cx + 14) + 'px';
        canvasTooltip.style.top = (cy - 30) + 'px';
    }
    else {
        canvasTooltip.style.opacity = '0';
    }
});
canvas.addEventListener('mouseleave', () => {
    canvasTooltip.style.opacity = '0';
});
// Label mode buttons
document.getElementById('btnLabelDoIt').addEventListener('click', () => {
    labelMode = 'do-it';
    labelModeInfo.textContent = 'Click on the plot to place a "DO IT" point (green)';
    labelModeInfo.className = 'label-mode-info active-green';
});
document.getElementById('btnLabelPass').addEventListener('click', () => {
    labelMode = 'pass';
    labelModeInfo.textContent = 'Click on the plot to place a "PASS" point (red)';
    labelModeInfo.className = 'label-mode-info active-red';
});
// Step button
document.getElementById('btnStep').addEventListener('click', () => {
    if (trainingPoints.length === 0)
        return;
    trainStep();
    update();
});
// Train button
document.getElementById('btnTrain').addEventListener('click', () => {
    runTraining(100);
});
// Reset button
document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.add('visible');
});
document.getElementById('confirmYes').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('visible');
    resetAll();
});
document.getElementById('confirmNo').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('visible');
});
// Load preset examples
document.getElementById('btnLoadExamples').addEventListener('click', () => {
    const presets = [
        { x: 9, y: 2, label: 1 },
        { x: 7, y: 9, label: 0 },
        { x: 8, y: 4, label: 1 },
        { x: 10, y: 3, label: 1 },
        { x: 6, y: 5, label: 0 },
        { x: 8, y: 1, label: 1 },
        { x: 7, y: 10, label: 0 },
        { x: 7, y: 2, label: 0 },
    ];
    trainingPoints = [...presets];
    updateStats();
    update();
});
// ========== INIT ==========
function init() {
    resizeCanvas();
    update();
    updateStats();
}
window.addEventListener('resize', () => {
    resizeCanvas();
    update();
});
init();
