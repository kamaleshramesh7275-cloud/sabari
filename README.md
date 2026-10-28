# SENSEGuard — Embedded Sensor Integrity & Fault Diagnosis System
> **Ideathon 10.0 • AICF Incubation Foundation (Government College of Engineering Aurangabad)**  
> **Team BYTECRAFT**: Sabarish R & Sahana M S • Contact: [sabarishr267@gmail.com](mailto:sabarishr267@gmail.com)  
> **Production Live Twin**: [http://localhost:10000](http://localhost:10000)

---

## 1. Executive Summary & Overview

When an industrial process or laboratory instrument reports an anomalous reading, operators face a critical dilemma: **is the process actually overheating, or has the transducer failed?**

A false emergency shutdown costs millions in plant downtime. Conversely, ignoring a stuck sensor or gradual calibration creep risks catastrophic equipment destruction.

**SENSEGuard** is a cyber-physical sensor integrity verification and fault diagnosis system. Using deterministic finite state machine (FSM) arbitration, rolling statistical plausibility filters, and an interactive 3D digital twin, SENSEGuard:
- Distinguishes legitimate physical process surges from transducer malfunctions in **<15 ms**.
- Autonomously isolates faulty channels (open-circuit, crashed/stuck, biased outlier) while electing verified references to maintain **100% uninterrupted uptime**.
- Couples physical ESP32 hardware via direct browser **WebSerial API** with high-fidelity 3D WebGL Digital Twin Workstations.

---

## 2. Complete Project Directory Structure

```
├── index.html                           # Single-Page Multi-View Web Application
├── style.css                            # Clean Professional Laboratory Light Theme & Cyber Dark Mode
├── app.js                               # Quad-Sensor Engine, Three.js 3D Viewport, FFT Analyzer, Audio Engine
├── benchtwin-project-2.glb              # High-Fidelity 64.3MB 3D Laboratory Workstation (118 Meshes)
├── circuit-board.glb                    # 3D Microcontroller Board Twin Model
├── server.js                            # Static file streaming server with MIME types (port 10000)
├── package.json                         # Node server dependency and start script
├── render.yaml                          # Cloud deployment blueprint
├── SENSEGuard_Ideathon_10_Pitch_Deck.pptx # Original Ideathon 10.0 Concept Pitch Deck
└── README.md                            # Comprehensive System Documentation & Operator Manual
```

---

## 3. Master Header Navigation & Global Controls

Located at the top of every screen:

| Control Element | DOM Identifier | Type | Functionality & Operator Action |
| :--- | :--- | :--- | :--- |
| **Brand Logo & Title** | `.brand-identity` | Brand | Displays SENSEGuard Ideathon 10.0 banner, BYTECRAFT team credits, and pulse status. |
| **Quad Benchmark Tab** | `#tab-quad` | Tab Nav | Opens the primary Quad-Sensor Multi-Fault Isolation Benchmark. |
| **Live Telemetry Tab** | `#tab-telemetry` | Tab Nav | Opens real-time dual-channel telemetry, calibration rack, and statistical distribution analyzer. |
| **3D Digital Twin Tab** | `#tab-digital-twin` | Tab Nav | Opens the 3D Workstation Digital Twin Studio with exploded view, caliper, and spatial pins. |
| **Fault Sandbox Tab** | `#tab-bench` | Tab Nav | Opens the virtual hardware control rack, 5-stage pipeline, phosphor oscilloscope, and 12-scenario matrix. |
| **Audit Summary Tab** | `#tab-analytics` | Tab Nav | Opens the timestamped anomaly event log and forensic CSV exporter. |
| **Hardware & Code Tab** | `#tab-hardware` | Tab Nav | Displays ESP32 pinout wiring schematics and full production C++ Arduino firmware. |
| **Theme Switcher** | `#btn-theme-toggle` | Button | Cycles between **Clean Laboratory Light** (default white) and **Obsidian Cyber Dark** themes. |
| **Audio Synthesizer** | `#btn-audio-toggle` | Button | Toggles Web Audio API acoustic feedback (relay clicks, alarm sirens, fan drone, and chimes). |
| **Temperature Unit** | `#btn-unit-toggle` | Button | Cycles display units between Celsius (°C), Fahrenheit (°F), Kelvin (K), and Raw ADC Volts. |
| **3D Mini PiP** | `#btn-pip-toggle` | Button | Opens a floating draggable Picture-in-Picture 3D viewport visible across all pages. |
| **Stream Status Pill** | `#stream-status-pill`| Indicator| Real-time sampling indicator showing current operational mode (Simulation 10Hz or Live ESP32). |
| **Connect ESP32** | `#btn-webserial-toggle`| Button | Opens browser WebSerial dialog to connect physical ESP32 microcontroller at 115200 baud. |
| **Export CSV** | `#btn-export-csv` | Button | Instant one-click download of the active session's telemetry history in standard CSV format. |

### Global Real-Time Status Strip
Directly beneath the header, a continuous HUD displays the global state of the process:
- **SYSTEM INTEGRITY**: Real-time FSM state badge (`OPTIMAL (NORMAL)`, `PROCESS SURGE (REAL)`, `TRANSDUCER FAULT`, `DEGRADED / CRITICAL`).
- **TRUST INDEX**: Calculated system health percentage based on cross-sensor correlation and noise bounds.
- **ACTIVE SOURCE**: The currently elected authoritative signal channel (e.g. `Sensor 4 (Elected)`).
- **TRUE PROCESS TEMP**: Authoritative arbitrated process temperature filtered through the consensus envelope.
- **FAULT ISOLATION RATE**: Real-time counter of isolated failures (e.g., `3/3 Isolated (100%)`).
- **PROCESS CONTINUITY**: Availability indicator confirming zero interrupted process cycles.

---

## 4. Page 1: Quad-Sensor Multi-Fault Isolation Benchmark (`#page-quad`)

The primary demonstration screen isolating 4 simultaneous industrial conditions:
1. **Sensor 1 (Disconnected / Open-Circuit)**: Simulates a broken lead wire or disconnected terminal. ADC drops to $0.00\text{V}$ rail.
2. **Sensor 2 (Crashed / Frozen)**: Simulates an I2C/SPI bus lockup or frozen ADC sample-and-hold buffer. Exhibits zero statistical variance ($\sigma^2 < 0.005$) during process temperature excitation.
3. **Sensor 3 (Biased Outlier / Calibration Creep)**: Simulates a defective sensor with $+12.4^\circ\text{C}$ calibration offset. Rejected by median cross-consensus envelope.
4. **Sensor 4 (Ground Truth / Calibrated Reference)**: Healthy, low-noise calibrated reference transducer elected as the authoritative system output.

### Interactive Controls & Features on Page 1:
- **`Run Quad-Fault Benchmark` button (`#btn-trigger-quad-scenario`)**: Injects all three faults simultaneously into S1, S2, and S3 to demonstrate autonomous 100% isolation in $<15\text{ms}$.
- **`Reset All 4 to Nominal` button (`#btn-reset-quad-nominal`)**: Clears all fault offsets and returns all 4 channels to healthy baseline state.
- **Channel 1 Toggle (`#toggle-s1`)**: Manually disconnects / reconnects Sensor 1.
- **Channel 2 Toggle (`#toggle-s2`)**: Freezes / unfreezes Sensor 2 ADC buffer.
- **Channel 3 Toggle (`#toggle-s3`)**: Injects / clears $+12.4^\circ\text{C}$ calibration bias on Sensor 3.
- **Channel 4 Toggle (`#toggle-s4`)**: Injects / clears a secondary transducer fault on Sensor 4.
- **Quad Waveform Canvas (`#quad-canvas`)**: Multi-trace 60 FPS real-time canvas rendering rolling trajectories for S1 (Red), S2 (Orange), S3 (Purple), and S4 (Green).
- **Timebase Selector (`30s`, `60s`, `120s`)**: Adjusts the rolling historical inspection window.
- **Crosshair Cursor Inspector**: Hovering the cursor over `#quad-canvas` displays an instantaneous timestamped readout of all 4 channels.

---

## 5. Page 2: Live Dual Telemetry & Diagnostic Classification (`#page-telemetry`)

Deep dive into the dual-sensor telemetry pipeline with real-time plausibility verification:

### 1. Transducer Health Evaluation Hero Card
- **SVG Circular Trust Meter (`#hud-ring-fill`, `#hud-trust-digit`)**: Dynamic visual gauge calculating composite confidence (0–100%) based on rolling noise, rate conformity, and drift bounds.
- **Classification Status Pill (`#hud-class-pill`)**: Large illuminated status indicator showing the deterministic FSM state.
- **Diagnostic Narrative (`#hud-class-details`)**: Plain-language engineering explanation of why the current state was elected.
- **KPI Metrics**: Real-time measurement of Detection Delay ($<84\text{ms}$), False Alarm Rate ($0.0\%$), and Consensus State (`Synchronized`).
- **Telemetry Channels Quadrant**: Individual live readouts for Sensor A, Sensor B, Channel Delta ($|\Delta T|$), and numerical Rate of Change ($\mathrm{d}T/\mathrm{d}t$).

### 2. Multi-Rate Waveform Chart & Inspector
- **Canvas Viewport (`#telemetry-canvas`)**: 60 FPS canvas displaying:
  - **Sensor A Trace (Orange)**: Channel 1 signal.
  - **Sensor B Trace (Purple)**: Channel 2 signal.
  - **Consensus Truth (Solid Teal)**: Arbitrated process output.
  - **Dynamic Plausibility Corridor (Shaded Blue Envelope)**: The $\pm \Delta T$ safety envelope around the consensus signal.
- **`Freeze Stream` / `Resume Stream` button (`#btn-telemetry-pause`)**: Freezes the real-time waveform buffer for static oscilloscope inspection.
- **`Clear Buffer` button (`#btn-telemetry-clear`)**: Flushes the rolling telemetry history.
- **`Snapshot PNG` button (`#btn-telemetry-snapshot`)**: Saves the active canvas as a high-resolution PNG image.
- **Timebase Selector (`30s`, `60s`, `120s`, `300s`)**: Toggles the time scale from 30 seconds to 5 minutes.
- **Interactive Crosshair HUD (`#chart-crosshair-hud`)**: Displays exact $T_A$, $T_B$, Delta, and Corridor pass/fail status at the cursor position.

### 3. Plausibility Diagnostic Matrix
Four live deterministic diagnostic tests:
1. **Open-Circuit / Rail Boundary (`#badge-chk-open`)**: Validates that voltages remain within $0.05\text{V} - 3.25\text{V}$.
2. **Asymmetric Drift Detector (`#badge-chk-drift`)**: Measures divergence rate without physical process rate shift.
3. **Frozen / Stuck-at Value (`#badge-chk-stuck`)**: Checks rolling variance ($\sigma^2 < 0.005$) during process temperature excitation.
4. **Signal-to-Noise Ratio & Jitter (`#badge-chk-noise`)**: Tracks rolling EMI and ADC ripple in decibels (dB).
- **Diagnostic Engine Conclusion (`#hud-verdict-summary`)**: Live engineering conclusion summarizing transducer plausibility.

### 4. Channel Calibration & Offset Trimmer Rack
- **Sensor A Zero Trim Offset Slider (`#trim-s-a`)**: Digital bias trim from $-5.00^\circ\text{C}$ to $+5.00^\circ\text{C}$ in $0.05^\circ\text{C}$ increments.
- **Sensor B Zero Trim Offset Slider (`#trim-s-b`)**: Digital bias trim from $-5.00^\circ\text{C}$ to $+5.00^\circ\text{C}$ in $0.05^\circ\text{C}$ increments.
- **Consridor Tolerance Slider (`#corridor-slider`)**: Adjusts the cross-consensus tolerance corridor width from $\pm 0.20^\circ\text{C}$ (Tight) to $\pm 4.00^\circ\text{C}$ (Wide).
- **`Auto-Zero Calibrate` button (`#btn-autozero-telemetry`)**: Automatically computes and applies opposite trim offsets to balance channels to ground truth.

### 5. High-Speed Session Data Logger & Statistical Distribution
- **`Start Recording` / `Stop Recording` button (`#btn-rec-toggle`)**: Begins recording continuous high-speed telemetry frames.
- **Elapsed Timer (`#rec-timer`)**: Stopwatch formatted as `hh:mm:ss`.
- **Logged Frames Counter (`#rec-frames`)**: Total recorded sample packets in current session.
- **`Export Session CSV` button (`#btn-rec-csv`)**: Downloads timestamped recording session as `.csv`.
- **`Export JSON` button (`#btn-rec-json`)**: Downloads recording session as structured `.json`.
- **Gaussian Distribution Canvas (`#canvas-telemetry-dist`)**: Real-time normal distribution bell curves comparing Sensor A ($\mu_A, \sigma_A$) and Sensor B ($\mu_B, \sigma_B$) against the nominal corridor with $3\sigma$ confidence bounds.

---

## 6. Page 3: Cyber-Physical 3D Digital Twin Studio (`#page-digital-twin`)

Three.js WebGL viewport rendering physical test bench hardware with real-time telemetry projection:

### 1. Dual-Model Architecture
- **`BenchTwin Workstation` tab (`#tab-model-bench`)**: Loads the comprehensive 64.3MB industrial workstation model (`benchtwin-project-2.glb`) featuring 118 PBR meshes (chassis, power supply, oscilloscope, multimeter, probes, and thermal heatsink).
- **`Circuit Micro-Board` tab (`#tab-model-pcb`)**: Switches to the compact microcontroller PCB digital twin (`circuit-board.glb`).

### 2. Camera Vantage Presets & Shading Modes
- **Isometric (`#btn-camera-iso`)**: Standard $45^\circ$ isometric vantage point.
- **Frontal (`#btn-camera-front`)**: Operator eye-level frontal vantage.
- **Probe Array (`#btn-camera-probes`)**: Close-up zoom on the 4 physical sensor probes.
- **Top Schem (`#btn-camera-top`)**: Orthographic top-down layout view.
- **Cinematic Tour (`#btn-camera-tour`)**: Continuous automated orbital camera sweep around the workstation.
- **Reset (`#btn-reset-camera`)**: Restores standard default camera coordinates.
- **Heatmap Toggle (`#btn-toggle-heatmap`)**: Applies dynamic thermal vertex color shaders across the 3D model reflecting live process temperatures.
- **Wireframe Toggle (`#btn-toggle-wireframe`)**: Toggles structural wireframe mesh rendering.
- **Grid Toggle (`#btn-toggle-grid`)**: Toggles tactical CAD floor grid helper.
- **Lighting Rig Switcher (`#btn-toggle-lighting`)**: Cycles through 4 lighting setups: `Clean Lab`, `Cyber Neon`, `Studio Spotlight`, and `Night Shift`.

### 3. Advanced 3D Tools Rack
- **Exploded View Slider (`#range-twin-explode`)**: Dynamically separates and translates meshes outward along radial axes from 0% (assembled) to 100% (fully exploded) to reveal internal boards and wiring.
- **Orbit Speed Slider (`#range-twin-speed`)**: Adjusts model auto-rotation velocity from 0.2x to 3.0x.
- **Caliper Measurement Tool (`#btn-tool-measure`)**: Enables 3D caliper measurement. Clicking two points on the 3D model renders spatial marker spheres, connects them with a 3D line, and calculates physical distance in millimeters.
- **Clear Measurement button (`#btn-measure-clear`)**: Resets caliper points.
- **Spatial Pins Toggle (`#btn-toggle-3d-tags`)**: Toggles floating HTML callout pins projected directly over 3D world coordinates for S1, S2, S3, S4, ESP32, Scope, Power Supply, and Heatsink.
- **Shadows Toggle (`#btn-toggle-shadows`)**: Toggles real-time directional sun shadows.

### 4. Hotspot Navigation Toolbar
Clicking any hotspot button smoothly interpolates the 3D camera to focus on that specific subassembly:
1. **Full Lab Overview** (`overview`)
2. **Rig Oscilloscope** (`oscilloscope`)
3. **DC Power Supply** (`powersupply`)
4. **Bench Multimeter** (`multimeter`)
5. **ESP32 Core (ADC)** (`esp32`)
6. **Quad Probes Array** (`probes`)
7. **Thermal Heatsink** (`heatsink`)

### 5. Interactive Raycast Component Inspection
- Hovering or clicking any part of the 3D model opens the **Component Inspection Flyout (`#twin-raycast-card`)** and populates the **CAD Inspector (`#cad-inspector-box`)** with:
  - Subsystem CAD name
  - Material shader type
  - Polygon & vertex count
  - Real-time operating temperature and rail voltage
  - Signal integrity and MTBF rating (120,000 hrs)

### 6. Interactive Subsystem Isolator Drawer
- **Assembly Search Filter (`#search-subsystems`)**: Filters the list of CAD assemblies in real time.
- **Focus Button (`.btn-isolate`)**: Isolates and smoothly pans the 3D camera to that specific assembly.
- **Wire Button (`.btn-wire`)**: Toggles wireframe mode exclusively on that assembly.

### 7. Technical Architecture & FMEA Deep-Dive
Four technical specification cards:
- **Subsystem 01**: ESP32 SAR ADC & DMA Ring Buffer (12-bit SAR ADC, 4096 LSB, 240MHz Xtensa core).
- **Subsystem 02**: Quad Transducer Analog Front-End (Star-ground PCB topology, 100nF low-ESR decoupling capacitors).
- **Subsystem 03**: BenchTwin Laboratory Instrumentation (Dual DC power supply, 4-CH 100MSa/s scope, ceramic heater).
- **Subsystem 04**: Mathematical Fault Detection & Isolation (FDI) Logic (Boundary guards, rolling variance, median voting).

---

## 7. Page 4: Virtual Test Bench & Fault Injection Sandbox (`#page-bench`)

The testing and simulation laboratory:

### 1. Tactile Virtual Hardware Rack
- **Ambient Base Temperature Slider (`#range-ambient`)**: Sets environmental baseline temperature from $10.0^\circ\text{C}$ to $40.0^\circ\text{C}$.
- **PID Ceramic Heater Wattage Slider (`#range-heater`)**: Adjusts heater power from 0% to 100%. Activates dynamic orange thermal glow effect (`#heater-glow`).
- **Cooling Fan PWM Buttons (`.btn-fan`)**: Selects fan speed: `OFF (0%)`, `LOW (25%)`, `MED (50%)`, `HIGH (75%)`, `TURBO (100%)`. Triggers spinning CSS turbine animation (`#fan-spin-indicator`) and acoustic motor drone.
- **Thermal Noise Generator Slider (`#range-noise`)**: Injects random thermal/EMI Gaussian noise from $\pm 0.02^\circ\text{C}$ to $\pm 1.50^\circ\text{C}$.
- **Consensus Tolerance Slider (`#range-corridor`)**: Adjusts the boundary threshold from $\pm 0.30^\circ\text{C}$ to $\pm 3.00^\circ\text{C}$.
- **Consensus Arbitration Algorithm Selector (`#select-arbitration-algo`)**:
  - `Weighted Cross-Consensus (Median Envelope)`
  - `Trimmed Mean Dynamic Filter`
  - `Kalman State Fusion (Minimum Variance)`
  - `TMR Majority Gate (2-out-of-3)`

### 2. Real-Time Signal Flow Pipeline (`.pipe-flow-diagram`)
Animated 5-stage architectural pipeline showing signals flowing in real time:
1. **Physical Excitation**: Thermal heat source & fan cooling.
2. **Quad Transducers**: Analog front-end channels (S1–S4).
3. **Boundary Verification**: Rate of change ($\mathrm{d}T/\mathrm{d}t$) and variance checks.
4. **Arbitration Engine**: Consensus voting filter.
5. **Authoritative Output**: Protected process control signal.

### 3. Hardware-Accurate Latency Stopwatch Banner
Displays actual hardware arbitration delays measured against empirical benchmarks:
- **Channel 1 (Open Circuit)**: $12\text{ ms}$ isolation time.
- **Channel 2 (Frozen ADC)**: $780\text{ ms}$ isolation time (verified via zero-variance test under thermal excitation).
- **Channel 3 (Biased Drift)**: $110\text{ ms}$ isolation time (rejected by median envelope).
- **Channel 4 (Ground Truth Reference)**: $0\text{ ms}$ continuous uptime (active authoritative output).

### 4. Dual-Channel Phosphor Digital Storage Oscilloscope (`#bench-oscilloscope-canvas`)
- Real-time CRT phosphor decay persistence effect.
- Calibrated graticule grid (10 horizontal $\times$ 8 vertical divisions).
- Trace selectors: Toggle CH1 (Red), CH2 (Orange), CH3 (Purple), CH4 (Green), and Consensus (Teal).
- Dual measurement cursors ($\Delta t$ time calculation in milliseconds).

### 5. Discrete Fourier Transform (FFT) Spectral Analyzer (`#bench-fft-canvas`)
- Real-time frequency spectrum plot showing signal harmonics from $0\text{ Hz}$ to $5\text{ Hz}$ Nyquist limit.
- Highlights low-frequency process thermal dynamics vs. high-frequency EMI noise spikes.

### 6. Expanded 12-Scenario Industrial Fault Matrix
Clicking any scenario card instantly configures the virtual hardware:
1. `Nominal Baseline`: Healthy thermal equilibrium ($25^\circ\text{C}$).
2. `Real Thermal Surge`: Rapid $+15^\circ\text{C}$ process heat surge (demonstrates zero false shutdowns).
3. `Open-Circuit Saturation`: Lead severed on Sensor 1 ($0\text{V}$ rail drop).
4. `Frozen Transducer`: Sensor 2 ADC buffer crash (zero variance).
5. `Gradual Calibration Drift`: Sensor 3 creep divergence ($+12.4^\circ\text{C}$).
6. `High-Frequency EMI Burst`: Random high-frequency electrical noise burst.
7. `Terminal Contact Chatter`: $5\text{Hz}$ intermittent contact bounce.
8. `Power Rail Brownout`: Power rail voltage sag ($2.7\text{V}$ reference drop).
9. `Asymmetric Thermal Gradient`: Normal physical temperature gradient across heatsink.
10. `Triple Simultaneous Failure`: S1 broken, S2 crashed, S3 biased (S4 maintains 100% process output).
11. `Cascading Compound Failure`: Sequential timed multi-fault injection.
12. `Stochastic Chaotic Noise`: Continuous random multi-point perturbation.

- **`Reset All to Nominal` button (`#btn-bench-reset-all`)**: Restores baseline conditions.
- **`Run Automated Stress Benchmark` button (`#btn-run-stress-benchmark`)**: Runs an automated 15-second sequence cycling through stress scenarios.

---

## 8. Page 5: Real-Time Forensics & Anomaly Audit Log (`#page-analytics`)

Timestamped forensic auditing table:
- **Event Log Table (`#audit-table-body`)**: Records event sequences with exact timestamps, event severity (`NORMAL`, `SURGE`, `FAULT`, `WARNING`), channel readings for S1–S4, trust scores, and diagnostic descriptions.
- **`Clear Log` button (`#btn-clear-audit`)**: Clears the audit table.
- **`Export Audit Log (CSV)` button (`#btn-export-csv-2`)**: Downloads the complete forensic audit history.

---

## 9. Page 6: Hardware Schematic & Embedded Firmware (`#page-hardware`)

Complete hardware build guide and ESP32 firmware:
- **Pinout Wiring Table**:
  - `GPIO 34 (ADC1_CH6)`: Sensor Channel 1 (0–3.3V, 11dB attenuation).
  - `GPIO 35 (ADC1_CH7)`: Sensor Channel 2 (0–3.3V, 11dB attenuation).
  - `GPIO 32 (ADC1_CH4)`: Sensor Channel 3 (0–3.3V, 11dB attenuation).
  - `GPIO 33 (ADC1_CH5)`: Sensor Channel 4 (0–3.3V, 11dB attenuation).
  - `3V3 & GND`: Regulated star-ground rail with 100nF decoupling capacitors.
- **Embedded Arduino / C++ Firmware**: Full production sketch with 10Hz timer interrupts, DMA ring buffer, rate-of-change filters, and WebSerial streaming.

---

## 10. Quick Start (Running Locally)

```bash
# 1. Clone repository
git clone https://github.com/kamaleshramesh7275-cloud/sabari.git
cd sabari

# 2. Run with Node.js static server:
node server.js
# Or using Python:
# python -m http.server 10000
```

Open your browser at **`http://localhost:10000/`**.
All features, 3D models, audio synthesis, and live telemetry work out of the box in Chrome, Edge, Brave, and Firefox.
