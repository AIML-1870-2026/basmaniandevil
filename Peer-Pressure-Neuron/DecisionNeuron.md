# Peer Pressure Decision Neuron - Technical Specification

## Project Overview
An interactive web application that models a single artificial neuron to help users think through peer pressure decisions. Users input a scenario and rate various factors on sliders, then watch the neuron calculate whether to "DO IT" or "PASS" based on weighted inputs.

## Core Concept
The neuron takes 5 input factors, applies learned weights, adds a bias (risk tolerance), and outputs a decision probability using the sigmoid activation function.

**Decision Formula:**
```
z = (fun_factor × 0.3) + (danger_level × -0.5) + (trouble_risk × -0.4) + (long_term_benefit × 0.2) + (peer_pressure × 0.1) + bias
output = sigmoid(z) = 1 / (1 + e^(-z))
```

If output ≥ 0.5 → "DO IT"  
If output < 0.5 → "PASS"

---

## Input Specifications

### 1. Scenario Text Box
- Large text input field where users describe their situation
- Placeholder: "Describe the situation... (e.g., 'My friends want to skip class and go to the beach')"
- This text is **display-only** and does not affect the calculation
- Positioned prominently at the top of the interface

### 2. Decision Factors (Sliders)

All sliders range from 0-10 with step size of 0.1

**Fun Factor**
- Label: "How fun will this be? 🎉"
- Range: 0-10
- Initial weight: **+0.3**
- Description: "How enjoyable or exciting is this?"

**Danger Level**
- Label: "How dangerous is this? ⚠️"
- Range: 0-10
- Initial weight: **-0.5**
- Description: "Physical risk or safety concerns"

**Trouble Risk**
- Label: "How likely are you to get in trouble? 🚨"
- Range: 0-10
- Initial weight: **-0.4**
- Description: "Risk of consequences from parents, school, etc."

**Long-term Benefit**
- Label: "Any long-term benefits? 🌟"
- Range: 0-10
- Initial weight: **+0.2**
- Description: "Will this help you in the future?"

**Peer Pressure Intensity**
- Label: "How strong is the peer pressure? 👥"
- Range: 0-10
- Initial weight: **+0.1** (smallest influence)
- Description: "How much are friends pushing you to do this?"

### 3. Bias Control

**Risk Tolerance**
- Label: "Your Risk Tolerance 🎲"
- Range: -5 to +5
- Step size: 0.1
- Initial value: 0
- Description: 
  - Negative values = cautious/risk-averse
  - Positive values = adventurous/risk-taker
- Shows current value numerically

---

## Output Display

### Decision Output
- Large, prominent display showing either "DO IT" or "PASS"
- Background color changes:
  - Green gradient when "DO IT" (probability ≥ 50%)
  - Red gradient when "PASS" (probability < 50%)
- Display the probability percentage (e.g., "73% confidence")

### Math Breakdown (Optional but recommended)
Show the calculation step-by-step:
```
Weighted Sum (z) = (7.5 × 0.3) + (3.0 × -0.5) + (2.0 × -0.4) + (5.0 × 0.2) + (8.0 × 0.1) + 0.5
                 = 2.25 - 1.5 - 0.8 + 1.0 + 0.8 + 0.5
                 = 2.25

Sigmoid(2.25) = 1 / (1 + e^(-2.25)) = 0.904 = 90.4%

Decision: DO IT ✓
```

---

## Decision Boundary Visualization

### 2D Scatter Plot Panel
- **X-axis**: Fun Factor (0-10)
- **Y-axis**: Danger Level (0-10)
- Grid background with axis labels
- Plot area: minimum 400px × 400px

### Visual Elements

**Decision Boundary Line**
- Diagonal line separating "DO IT" region from "PASS" region
- The line equation is derived from setting the weighted sum to 0 (decision threshold)
- Line color: Bold black or white (depending on background)
- Line updates in real-time as weights or bias change

**Region Coloring**
- "DO IT" region: Green/teal with transparency
- "PASS" region: Red/orange with transparency
- Clear visual distinction between regions

**Current Position Marker**
- Crosshair or dot showing current (Fun Factor, Danger Level) values
- Updates in real-time as sliders move
- Color changes based on current decision (green dot for "DO IT", red for "PASS")
- Size: prominent enough to see clearly

**Region Labels**
- Text "DO IT" in the green region
- Text "PASS" in the red region

### Important Note
The boundary line represents the case where **only Fun Factor and Danger Level** vary while other inputs are held at their current slider values. The line's position and angle change as:
- Weights are adjusted
- Bias is changed
- Other factor sliders (Trouble Risk, Long-term Benefit, Peer Pressure) are moved

---

## Training Mode

### Purpose
Allow users to add example scenarios as points on the 2D plot, label them as "DO IT" or "PASS", and watch the neuron learn by adjusting its weights through gradient descent.

### Training Interface

**Point Addition**
- Click anywhere on the 2D plot to add a point
- Two-button system to label points:
  - "Label as DO IT" button (green)
  - "Label as PASS" button (red)
- Points display as colored circles:
  - Green circles = "DO IT" examples
  - Red circles = "PASS" examples
- Show point coordinates on hover

**Training Controls**

**"Step" Button**
- Advances **one** training iteration
- Animation shows:
  - Current loss/error calculation
  - Weight adjustments happening
  - Decision boundary line moving smoothly
- Display shows which weights increased/decreased with small arrows (↑↓)
- Duration: ~500-800ms animation

**"Train" Button**
- Runs multiple training iterations automatically
- Adjustable speed or fixed (e.g., 10 iterations)
- Can be paused mid-training
- Shows progress (e.g., "Training... iteration 15/100")

**"Reset" Button**
- Clears all training points
- Resets weights to initial values:
  - Fun Factor: +0.3
  - Danger Level: -0.5
  - Trouble Risk: -0.4
  - Long-term Benefit: +0.2
  - Peer Pressure: +0.1
- Resets bias to 0
- Confirmation dialog: "Are you sure? This will erase all points and reset weights."

### Training Display Metrics

**Current Weights Panel**
- Shows all 5 weights with their current values
- Format: "Fun Factor: +0.34 (↑)" or "Danger: -0.52 (↓)"
- Color code: positive weights in blue, negative in orange
- Updates live during training

**Bias Value**
- Shows current bias value
- Updates during training if bias adjustment is implemented

**Training Statistics**
- **Step Counter**: "Step: 47"
- **Accuracy**: "Accuracy: 85% (17/20 correct)"
  - Calculate by checking how many training points are correctly classified
  - Update after each step
- **Loss/Error**: Optional - show mean squared error or cross-entropy loss

### Training Algorithm (Gradient Descent)

**Learning Rate**: 0.1 (adjustable if needed)

**For each training step:**
1. For each training point:
   - Calculate current prediction using current weights
   - Calculate error: (true_label - prediction)
   - Update weights: weight += learning_rate × error × input_value × prediction × (1 - prediction)
2. Update the decision boundary visualization
3. Recalculate accuracy

**Note**: Only the two features shown in the visualization (Fun Factor and Danger Level) are used for training. Other sliders remain fixed at their current values during training.

### Preset Training Examples (Optional Enhancement)

**"Load Example Scenarios" Button**
Users can load pre-labeled examples to see training in action:

1. **"Skip class for beach day"**
   - Fun: 9, Danger: 2 → Label: DO IT

2. **"Try dangerous skateboard trick"**
   - Fun: 7, Danger: 9 → Label: PASS

3. **"Sneak out to late-night diner"**
   - Fun: 8, Danger: 4 → Label: DO IT

4. **"Join spontaneous road trip"**
   - Fun: 10, Danger: 3 → Label: DO IT

5. **"Eat sketchy food truck meal"**
   - Fun: 6, Danger: 5 → Label: PASS

6. **"All-nighter Netflix marathon"**
   - Fun: 8, Danger: 1 → Label: DO IT

7. **"Climb on school roof"**
   - Fun: 7, Danger: 10 → Label: PASS

8. **"Ditch homework for gaming"**
   - Fun: 7, Danger: 2 → Label: PASS (trouble risk high)

---

## UI/UX Requirements

### Layout
- **Mobile-responsive**: Works on phones, tablets, and desktop
- **Two-column layout** on desktop:
  - Left: Input controls (scenario box, sliders, output)
  - Right: Decision boundary visualization + training controls
- **Single-column stacked** on mobile

### Visual Design
- **Clean, modern interface** with good contrast
- **Smooth animations**: 
  - Slider movements update instantly
  - Training steps animate over 500-800ms
  - Decision boundary line transitions smoothly
- **Color palette**:
  - Primary: Blues/teals for positive weights
  - Warning: Oranges/reds for negative weights
  - Success: Green for "DO IT"
  - Danger: Red for "PASS"
- **Typography**: Clear, readable fonts; emoji support

### Accessibility
- All sliders have labels and current value displays
- Color is not the only indicator (use text + color)
- Buttons have clear labels and hover states
- Keyboard navigation support

### Interactivity
- **Instant feedback**: Output updates immediately when any slider moves
- **Hover effects**: Buttons, points, and interactive elements respond to hover
- **Loading states**: Show when calculations are happening (though they should be fast)
- **Error handling**: Graceful handling of edge cases

---

## Technical Implementation Notes

### Technology Stack (Suggested)
- **HTML5/CSS3/JavaScript** (vanilla or React)
- **Chart library**: D3.js, Chart.js, or Plotly for the 2D visualization
- **No backend required**: All computation happens client-side

### Key Functions Needed

```javascript
// Sigmoid activation function
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

// Calculate weighted sum
function calculateZ(inputs, weights, bias) {
  let z = bias;
  for (let i = 0; i < inputs.length; i++) {
    z += inputs[i] * weights[i];
  }
  return z;
}

// Make prediction
function predict(inputs, weights, bias) {
  const z = calculateZ(inputs, weights, bias);
  return sigmoid(z);
}

// Calculate decision boundary line
// For the 2D plot: when z = 0, we have the decision boundary
// 0 = fun*w_fun + danger*w_danger + constant
// Solve for danger as function of fun
function getBoundaryLine(weights, bias, otherInputs) {
  // constant = bias + trouble*w_trouble + benefit*w_benefit + pressure*w_pressure
  const constant = bias + otherInputs[0]*weights[2] + otherInputs[1]*weights[3] + otherInputs[2]*weights[4];
  
  // danger = -(fun*w_fun + constant) / w_danger
  // Return function that maps fun → danger
  return (fun) => -(fun * weights[0] + constant) / weights[1];
}

// Training step (gradient descent)
function trainStep(points, labels, weights, bias, learningRate = 0.1) {
  const newWeights = [...weights];
  let newBias = bias;
  
  for (let i = 0; i < points.length; i++) {
    const [fun, danger] = points[i];
    const inputs = [fun, danger, 0, 0, 0]; // Other inputs held at 0 for simplicity
    const prediction = predict(inputs, weights, bias);
    const error = labels[i] - prediction;
    
    // Update weights
    newWeights[0] += learningRate * error * fun * prediction * (1 - prediction);
    newWeights[1] += learningRate * error * danger * prediction * (1 - prediction);
    
    // Update bias
    newBias += learningRate * error * prediction * (1 - prediction);
  }
  
  return { weights: newWeights, bias: newBias };
}

// Calculate accuracy
function calculateAccuracy(points, labels, weights, bias) {
  let correct = 0;
  for (let i = 0; i < points.length; i++) {
    const [fun, danger] = points[i];
    const inputs = [fun, danger, 0, 0, 0];
    const prediction = predict(inputs, weights, bias);
    const predictedLabel = prediction >= 0.5 ? 1 : 0;
    if (predictedLabel === labels[i]) correct++;
  }
  return (correct / points.length) * 100;
}
```

### Performance Considerations
- Throttle slider updates if needed (debounce at ~16ms for 60fps)
- Keep training iterations fast (<50ms per step)
- Use requestAnimationFrame for smooth animations

---

## Stretch Goals (Optional Enhancements)

### 1. Confidence Visualization
- Show confidence level with visual indicators (e.g., "Highly confident: 95%" vs "Uncertain: 52%")
- Different animation or glow effect based on confidence

### 2. History/Log
- Show last 5 scenarios with their decisions
- "Undo" button to go back to previous scenario

### 3. Share Feature
- Generate a shareable link or image of the current scenario + decision
- "Save scenario" to local storage

### 4. Sound Effects
- Subtle sound when decision flips from DO IT to PASS
- Success sound when training accuracy improves

### 5. Advanced Training Features
- Show loss curve over training iterations
- Add learning rate slider
- Compare different activation functions (sigmoid vs ReLU vs step function)

### 6. Dark Mode
- Toggle between light and dark themes

---

## Deployment

**Target URL**: `https://aiml-1870-2026.github.io/[your-gamertag]/`

**Requirements**:
- Single HTML file or minimal build
- All assets self-contained or from CDN
- Works in modern browsers (Chrome, Firefox, Safari, Edge)
- Fast load time (<2 seconds)

---

## Success Criteria

The project is complete when:
1. ✅ User can type a scenario and adjust all 5 input sliders
2. ✅ Neuron outputs "DO IT" or "PASS" with probability
3. ✅ 2D visualization shows Fun vs Danger with decision boundary line
4. ✅ Current position marker moves as sliders change
5. ✅ User can click to add training points and label them
6. ✅ "Step" button advances one training iteration with smooth animation
7. ✅ "Train" button runs multiple iterations automatically
8. ✅ "Reset" button clears points and resets weights
9. ✅ Accuracy, step counter, and current weights are displayed
10. ✅ Mobile-responsive layout works on phones and tablets
11. ✅ Deployed to GitHub Pages and accessible via URL

---

## Final Notes

This neuron demonstrates the fundamental building block of neural networks: a single decision-making unit that learns from examples. The peer pressure context makes it relatable and fun while teaching core ML concepts like:
- Weighted inputs
- Bias terms
- Activation functions (sigmoid)
- Decision boundaries
- Gradient descent training
- Classification accuracy

Keep the tone lighthearted and educational. This is meant to be a learning tool that's both informative and engaging!
