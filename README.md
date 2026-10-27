# SENSEGuard — Embedded Sensor Integrity & Fault Diagnosis System
> **Ideathon 10.0 • AICF Incubation Foundation (Government College of Engineering Aurangabad)**  
> **Team BYTECRAFT**: Sabarish R & Sahana M S • Contact: [sabarishr267@gmail.com](mailto:sabarishr267@gmail.com)

---

## Overview

When an industrial or laboratory sensor reports an abnormal reading, does the process have a real problem, or has the transducer failed?

**SENSEGuard** is an embedded integrity verification and fault diagnosis system that distinguishes real process surges from transducer malfunctions. It eliminates false emergency shutdowns while catching hidden failures (such as stuck-at readings or gradual calibration creep).

---

## Core Capabilities

1. **Quad-Sensor Multi-Fault Isolation Benchmark**:
   - **Sensor 1 (Disconnected)**: Wire cut / open-circuit rail saturation ($0\text{V} / \text{NaN}$) detected in $<15\text{ ms}$.
   - **Sensor 2 (Crashed / Frozen)**: Firmware I2C/bus hang with zero variance ($\sigma^2 < 0.005$) caught under thermal excitation.
   - **Sensor 3 (Wrong Reading / Outlier)**: $+12.4^\circ\text{C}$ calibration divergence rejected by median cross-consensus bounds.
   - **Sensor 4 (Successful / Ground Truth)**: Healthy calibrated reference elected as authoritative process signal, maintaining **100% uninterrupted uptime**.

2. **3D Hardware Digital Twin (`circuit-board.glb`)**:
   - Interactive Three.js WebGL viewport rendering the physical microcontroller circuit board.
   - Dynamic LED node lighting showing real-time physical probe statuses (Red for S1, Orange for S2, Purple for S3, Green for S4).
   - Camera vantage presets (Isometric, Top View, Sensor Probes, Reset).

3. **Deterministic Finite State Machine (FSM)**:
   - 4-state real-time classifier: `OPTIMAL (NORMAL)`, `PROCESS SURGE (REAL)`, `TRANSDUCER FAULT`, and `DEGRADED / UNCERTAIN`.
   - Real-time numerical rate of change ($\mathrm{d}T/\mathrm{d}t$), exponential low-pass filter ($\alpha = 0.25$), and continuous SNR tracking.

4. **Hardware Plug-and-Play (WebSerial API)**:
   - Direct USB Serial connectivity from the browser to an ESP32 microcontroller at 115200 baud without installing third-party drivers or servers.
   - Includes production-ready Arduino/ESP32 C++ firmware sketch.

5. **Forensics & Audit Export**:
   - Real-time event log tracking timestamped anomaly sequences.
   - One-click CSV and JSON data export for academic documentation and research papers.

---

## Quick Start (Running Locally)

To run the dashboard locally in any modern browser:

```bash
# Navigate to the repository
cd c:\projects\sabari

# Start a local HTTP server
python -m http.server 8080
```

Open your browser at **`http://localhost:8080`**.

---

## Project Structure

```
├── index.html                           # Single-Page Multi-View Dashboard Application
├── style.css                            # Clean Professional Laboratory Light Theme
├── app.js                               # Quad-Sensor Simulation Engine, Three.js 3D Viewport, Canvas Renderer
├── circuit-board.glb                    # 3D Circuit Board Digital Twin Model
├── SENSEGuard_Ideathon_10_Pitch_Deck.pptx # Original Ideathon 10.0 Concept Pitch Deck
└── README.md                            # Comprehensive System Documentation
```

---

## ESP32 Hardware Pinout

| ESP32 Pin | Signal Assignment | Electrical Characteristics |
| :--- | :--- | :--- |
| **GPIO 34 (ADC1_CH6)** | Sensor Channel 1 | 0.0V - 3.3V (11dB Attenuation, 12-bit SAR ADC) |
| **GPIO 35 (ADC1_CH7)** | Sensor Channel 2 | 0.0V - 3.3V (11dB Attenuation, 12-bit SAR ADC) |
| **GPIO 32 (ADC1_CH4)** | Sensor Channel 3 | 0.0V - 3.3V (11dB Attenuation, 12-bit SAR ADC) |
| **GPIO 33 (ADC1_CH5)** | Sensor Channel 4 | 0.0V - 3.3V (11dB Attenuation, 12-bit SAR ADC) |
| **3V3 & GND** | Regulated Rail | Star-ground topology with 100nF decoupling capacitors |
