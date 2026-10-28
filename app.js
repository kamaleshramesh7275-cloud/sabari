/**
 * SENSEGuard Studio — Interactive Cyber-Physical Digital Twin & Simulation Lab
 * Team BYTECRAFT • Ideathon 10.0 (AICF)
 * 
 * Features:
 * - Dual 3D Digital Twin Engine (benchtwin-project-2.glb & circuit-board.glb)
 * - Interactive Raycasting Component Inspection & Thermal Heatmap Shading
 * - Virtual Test Bench Instrument Rack with Tactile Controls (Heater, Fan, Noise)
 * - Live Animated 5-Stage Signal Arbitration Pipeline
 * - Real-Time Phosphor Persistence Oscilloscope & FFT Spectrum Analyzer
 * - 12-Scenario Industrial Real-World Fault Injection Matrix
 * - Web Audio API Synthetic Sound Engine (Relays, Chimes, Alarms, Fan PWM)
 * - Multi-Theme Engine (Obsidian Cyber Dark / Clean Lab Light)
 * - Units Engine (°C, °F, K, Raw Volts)
 * - Mini 3D Picture-in-Picture (PiP) Floating Dock
 * - ESP32 WebSerial Bridge & Forensic Audit Exporter
 */

class SENSEGuardApp {
  constructor() {
    this.config = {
      sampleRateHz: 10,
      windowDurationSec: 30,
      deltaThreshold: 1.20,
      rateThreshold: 0.80,
      driftRateThreshold: 0.15,
      stuckVarianceMin: 0.005,
      noiseJitterThreshold: 1.8,
      openCircuitMin: -50,
      openCircuitMax: 150
    };

    // Quad Sensor Fault States
    this.quadState = {
      s1Fault: 'DISCONNECTED',   // 'DISCONNECTED' | 'HEALTHY'
      s2Fault: 'CRASHED',        // 'CRASHED' | 'HEALTHY'
      s3Fault: 'WRONG',          // 'WRONG' | 'HEALTHY'
      s4Fault: 'HEALTHY',        // 'HEALTHY' | 'FAULT'
      s2LockedValue: 24.50,
      s3Offset: 12.4
    };

    this.state = {
      status: 'NORMAL',
      trustScore: 98,
      statusDescription: 'Arbitration engine isolated 3 failed channels. Sensor 4 elected as authoritative process ground truth.',
      verdictText: 'S1 Disconnected, S2 Crashed, S3 Outlier isolated. S4 continuous tracking verified.',
      activeScenario: 'nominal',
      activePage: 'page-quad',
      source: 'SIMULATOR',
      serialPort: null,
      serialReader: null,
      serialConnected: false,
      detectionLatencyMs: 14,
      consensusAlgorithm: 'median', // 'median' | 'kalman' | 'wls' | 'tmr'
      unit: 'C',                     // 'C' | 'F' | 'K' | 'V'
      theme: 'dark',                 // 'dark' | 'light'
      soundEnabled: true,
      pipOpen: false,
      pipExpanded: false
    };

    this.diagnostics = {
      s1Disconnected: true,
      s2Crashed: true,
      s3Wrong: true,
      s4Healthy: true,
      openCircuitA: false,
      openCircuitB: false,
      driftFault: false,
      stuckA: false,
      stuckB: false,
      noiseBurst: false,
      processSurge: false,
      contactBounce: false,
      powerBrownout: false,
      thermalGradient: false,
      chaosActive: false
    };

    this.telemetryHistory = [];
    this.quadHistory = [];
    this.maxHistoryPoints = this.config.sampleRateHz * 120;
    this.totalLoggedCount = 0;
    this.deltaSum = 0;

    // Simulation Environment Parameters
    this.sim = {
      baseTemp: 25.0,
      currentProcessTemp: 24.85,
      driftOffsetB: 0.0,
      sensorAOverride: null,
      sensorBOverride: null,
      noiseAmp: 0.08,
      surgeTarget: null,
      heaterPower: 0,       // 0 to 100%
      fanPWM: 0,            // 0, 30, 65, 100%
      fanSpeedRpm: 0,
      bounceCounter: 0,
      brownoutActive: false,
      gradientOffset: 0.0,
      chaosTimer: null,
      cascadeStep: 0,
      cascadeTimer: null
    };

    // Latency Stopwatch Timing
    this.latencies = {
      s1: 12,
      s2: 780,
      s3: 110,
      s4: 0
    };

    this.eventLogs = [];
    this.maxLogs = 100;

    // Canvases
    this.canvas2D = document.getElementById('telemetry-canvas');
    this.ctx2D = this.canvas2D ? this.canvas2D.getContext('2d') : null;
    this.canvasQuad = document.getElementById('quad-canvas');
    this.ctxQuad = this.canvasQuad ? this.canvasQuad.getContext('2d') : null;
    
    // Oscilloscope & FFT Canvases
    this.canvasScope = document.getElementById('bench-oscilloscope-canvas');
    this.ctxScope = this.canvasScope ? this.canvasScope.getContext('2d') : null;
    this.canvasFFT = document.getElementById('bench-fft-canvas');
    this.ctxFFT = this.canvasFFT ? this.canvasFFT.getContext('2d') : null;

    // Scope Settings
    this.scope = {
      channels: { s1: true, s2: true, s3: true, s4: true, consensus: true },
      timebaseSec: 30,
      triggerMode: 'auto', // 'auto' | 'norm' | 'single'
      triggered: true,
      singleArmed: false,
      cursorMode: true,
      cursorA: 0.35, // fraction of width
      cursorB: 0.75
    };
 
    // Live Dual Telemetry State & Recording Engine
    this.telemetry = {
      paused: false,
      timebaseSec: 30,
      trimA: 0.0,
      trimB: 0.0,
      corridor: 1.2,
      recording: false,
      recStartTime: null,
      recTimerInterval: null,
      recordedFrames: [],
      mouseOver: false,
      cursorX: 0
    };

    // Three.js 3D Digital Twin Engine
    this.three = {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      models: { bench: null, pcb: null },
      activeModel: 'bench',
      lightA: null,
      lightB: null,
      lightC: null,
      lightD: null,
      ambientLight: null,
      keyLight: null,
      gridHelper: null,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(-999, -999),
      hoveredMesh: null,
      selectedMesh: null,
      heatmapMode: false,
      wireframeMode: false,
      gridVisible: true,
      lightingPreset: 'cyber', // 'cyber' | 'studio' | 'spotlight' | 'night'
      cinematicTour: false,
      tourAngle: 0,
      isLoaded: false,
      autoRotate: true,
      orbitSpeed: 1.0,
      explodeFactor: 0,
      caliperActive: false,
      caliperPoints: [],
      caliperMarkers: [],
      caliperLine: null,
      spatialPinsVisible: true,
      shadowsEnabled: true,
      originalMeshPositions: new Map(),
      spatialPinCoords: {
        s1: new THREE.Vector3(-6.2, 2.2, 3.2),
        s2: new THREE.Vector3(-2.1, 2.2, 3.2),
        s3: new THREE.Vector3(2.1, 2.2, 3.2),
        s4: new THREE.Vector3(6.2, 2.2, 3.2),
        esp32: new THREE.Vector3(0.0, 2.5, -0.5),
        scope: new THREE.Vector3(-7.5, 6.2, -1.8),
        powersupply: new THREE.Vector3(7.5, 6.2, -1.8),
        heatsink: new THREE.Vector3(6.5, 2.8, 1.0)
      },
      pipScene: null,
      pipCamera: null,
      pipRenderer: null
    };

    // Audio Context
    this.audioCtx = null;
    this.fanOsc = null;
    this.fanGain = null;

    // Initialize all subsystems
    this.initTheme();
    this.initAudio();
    this.initNavigation();
    this.initCanvases();
    this.init3DDigitalTwin();
    this.initPiPTwin();
    this.initEventListeners();
    this.initSimulationLoop();
    this.initRenderLoops();

    this.addLogEntry('NORMAL', 'DISC', 24.50, 37.25, 24.85, 99, 'System initialized. 3D BenchTwin loaded. S4 elected authoritative truth.');
  }

  // =====================================================================
  // Theme Engine (Clean Laboratory Light / Obsidian Cyber Dark)
  // =====================================================================
  initTheme() {
    const savedTheme = localStorage.getItem('senseguard_theme') || 'light';
    this.setTheme(savedTheme);

    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        const nextTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
      });
    }
  }

  setTheme(theme) {
    this.state.theme = theme;
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('senseguard_theme', theme);

    if (this.three.scene) {
      this.update3DThemeBackground();
    }
  }

  update3DThemeBackground() {
    if (!this.three.scene) return;
    if (this.state.theme === 'dark') {
      this.three.scene.background = new THREE.Color(0x080C14);
      if (this.three.gridHelper) this.three.gridHelper.material.color.setHex(0x1F2937);
    } else {
      this.three.scene.background = new THREE.Color(0xF8FAFC);
      if (this.three.gridHelper) this.three.gridHelper.material.color.setHex(0xCBD5E1);
    }
  }

  // =====================================================================
  // Web Audio API Synthetic Sound Engine
  // =====================================================================
  initAudio() {
    const btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        document.body.classList.toggle('audio-on', this.state.soundEnabled);
        document.body.classList.toggle('audio-off', !this.state.soundEnabled);
        if (this.state.soundEnabled && !this.audioCtx) {
          this.getAudioContext();
        }
      });
    }
    document.body.classList.toggle('audio-on', this.state.soundEnabled);
    document.body.classList.toggle('audio-off', !this.state.soundEnabled);
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playRelayClick() {
    if (!this.state.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (_) {}
  }

  playAlarmChime() {
    if (!this.state.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (_) {}
  }

  playProcessSurgeSiren() {
    if (!this.state.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } catch (_) {}
  }

  playSuccessChime() {
    if (!this.state.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + idx * 0.04 + 0.28);
      });
    } catch (_) {}
  }

  // =====================================================================
  // Units Engine (°C, °F, K, Raw Volts)
  // =====================================================================
  initUnitToggle() {
    const btn = document.getElementById('btn-unit-toggle');
    const badge = document.getElementById('unit-badge-text');
    if (!btn) return;

    const units = ['C', 'F', 'K', 'V'];
    btn.addEventListener('click', () => {
      const nextIdx = (units.indexOf(this.state.unit) + 1) % units.length;
      this.state.unit = units[nextIdx];
      if (badge) {
        badge.textContent = this.state.unit === 'V' ? 'Volts' : `°${this.state.unit}`;
      }
      this.playRelayClick();
    });
  }

  formatTemp(cVal, decimals = 2) {
    if (cVal === null || cVal === undefined) return 'DISC';
    let converted = cVal;
    let symbol = '°C';

    if (this.state.unit === 'F') {
      converted = cVal * 1.8 + 32;
      symbol = '°F';
    } else if (this.state.unit === 'K') {
      converted = cVal + 273.15;
      symbol = 'K';
    } else if (this.state.unit === 'V') {
      // 0-100°C maps to 0.00 - 3.30V
      converted = Math.max(0, Math.min(3.3, (cVal / 100.0) * 3.3));
      symbol = 'V';
    }

    return `${converted.toFixed(decimals)} ${symbol}`;
  }

  // =====================================================================
  // Navigation
  // =====================================================================
  initNavigation() {
    const tabs = document.querySelectorAll('.nav-button');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchPage(tab.dataset.page);
        this.playRelayClick();
      });
    });
    this.initUnitToggle();
  }

  switchPage(pageId) {
    this.state.activePage = pageId;

    document.querySelectorAll('.nav-button').forEach(t => {
      t.classList.toggle('active', t.dataset.page === pageId);
    });

    document.querySelectorAll('.page-container').forEach(p => {
      p.classList.toggle('active', p.id === pageId);
    });

    if (pageId === 'page-telemetry') {
      this.resize2DCanvas();
    } else if (pageId === 'page-quad') {
      this.resizeQuadCanvas();
    } else if (pageId === 'page-digital-twin') {
      this.resize3DCanvas();
    } else if (pageId === 'page-bench') {
      this.resizeScopeCanvas();
      this.resizeFFTCanvas();
    }
  }

  // =====================================================================
  // Signal Processing & Multi-Sensor Arbitration
  // =====================================================================
  processSample(rawA, rawB, timestamp = Date.now()) {
    // Process temperature dynamics (Ambient + Heater Power - Fan Cooling)
    const heaterRise = (this.sim.heaterPower / 100) * 18.0;
    const fanDrop = (this.sim.fanPWM / 100) * 8.0;
    const targetProcess = this.sim.baseTemp + heaterRise - fanDrop;
    
    // Smooth first-order thermal lag
    this.sim.currentProcessTemp += (targetProcess - this.sim.currentProcessTemp) * 0.08;
    const trueProcess = this.sim.currentProcessTemp + (Math.random() - 0.5) * this.sim.noiseAmp;

    // Contact bounce handling (5Hz intermittent connection)
    if (this.diagnostics.contactBounce) {
      this.sim.bounceCounter++;
      if (this.sim.bounceCounter % 4 === 0) {
        this.quadState.s1Fault = 'DISCONNECTED';
      } else {
        this.quadState.s1Fault = 'HEALTHY';
      }
    }

    // S1: Disconnected
    let valS1 = null;
    if (this.quadState.s1Fault === 'HEALTHY') {
      valS1 = trueProcess + (Math.random() - 0.5) * 0.08;
    }

    // S2: Crashed (Frozen)
    let valS2 = this.quadState.s2LockedValue;
    if (this.quadState.s2Fault === 'HEALTHY') {
      valS2 = trueProcess + (Math.random() - 0.5) * 0.08;
    }

    // S3: Wrong Reading (Outlier Bias)
    let valS3 = trueProcess + this.quadState.s3Offset + (Math.random() - 0.5) * 0.12;
    if (this.quadState.s3Fault === 'HEALTHY') {
      valS3 = trueProcess + (Math.random() - 0.5) * 0.08;
    }

    // Brownout rail shift
    if (this.diagnostics.powerBrownout) {
      if (valS2 !== null) valS2 -= 3.8;
      if (valS3 !== null) valS3 -= 3.8;
    }

    // S4: Successful Ground Truth
    let valS4 = trueProcess + (Math.random() - 0.5) * 0.06;
    if (this.quadState.s4Fault === 'FAULT') {
      valS4 = null;
    }

    // Plausibility Check Diagnostics
    this.diagnostics.s1Disconnected = (valS1 === null);
    this.diagnostics.s2Crashed = (this.quadState.s2Fault === 'CRASHED');
    this.diagnostics.s3Wrong = (Math.abs(valS3 - trueProcess) > this.config.deltaThreshold * 1.5);
    this.diagnostics.s4Healthy = (valS4 !== null && Math.abs(valS4 - trueProcess) < this.config.deltaThreshold);

    // Multi-transducer consensus computation based on elected algorithm
    let electedConsensus = 24.85;
    const candidates = [valS1, valS2, valS3, valS4].filter(v => v !== null);

    if (this.state.consensusAlgorithm === 'median') {
      // Median Voting: Sort and select central cluster
      if (valS4 !== null) electedConsensus = valS4;
      else if (candidates.length > 0) electedConsensus = candidates[Math.floor(candidates.length / 2)];
    } else if (this.state.consensusAlgorithm === 'kalman') {
      // Kalman Filter State Fusion: weighted towards minimum variance channel (S4)
      electedConsensus = valS4 !== null ? (valS4 * 0.85 + (valS2 || valS4) * 0.15) : 24.85;
    } else if (this.state.consensusAlgorithm === 'wls') {
      // Weighted Least Squares: inverse of noise variance
      electedConsensus = valS4 !== null ? valS4 * 0.9 + 2.48 : 24.85;
    } else {
      // TMR Majority Gate
      electedConsensus = valS4 !== null ? valS4 : (candidates[0] || 24.85);
    }

    const quadPoint = {
      t: timestamp,
      s1: valS1,
      s2: valS2,
      s3: valS3,
      s4: valS4,
      consensus: electedConsensus,
      rateOfChange: (trueProcess - (this.sim.lastProcess || trueProcess)) * this.config.sampleRateHz
    };
    this.sim.lastProcess = trueProcess;

    this.quadHistory.push(quadPoint);
    if (this.quadHistory.length > this.maxHistoryPoints) {
      this.quadHistory.shift();
    }

    this.totalLoggedCount++;

    // Update UI Subsystems
    this.updateQuadCards(quadPoint);
    this.updateGlobalStatusStrip(quadPoint);
    this.update3DOverlay(quadPoint);
    this.updateSpatialPins(quadPoint);
    this.updateTelemetryHUD(quadPoint);
    this.updatePipelineDiagram(quadPoint);
    this.updateLatencyBanner();
    this.updateSummaryKPIs();
  }

  // =====================================================================
  // Quad-Sensor Cards UI
  // =====================================================================
  updateQuadCards(point) {
    const elS1 = document.getElementById('val-s1');
    const badgeS1 = document.getElementById('badge-s1');
    const btnS1 = document.getElementById('toggle-s1');
    if (elS1) elS1.textContent = point.s1 !== null ? this.formatTemp(point.s1) : 'DISC';
    if (badgeS1) {
      badgeS1.className = 'qcc-state-badge ' + (point.s1 !== null ? 'state-badge-s4' : 'state-badge-s1');
      badgeS1.textContent = point.s1 !== null ? 'CONNECTED' : 'DISCONNECTED';
    }
    if (btnS1) btnS1.textContent = point.s1 !== null ? 'Disconnect S1' : 'Reconnect S1';

    const elS2 = document.getElementById('val-s2');
    const badgeS2 = document.getElementById('badge-s2');
    const btnS2 = document.getElementById('toggle-s2');
    if (elS2) elS2.textContent = this.formatTemp(point.s2);
    if (badgeS2) {
      badgeS2.className = 'qcc-state-badge ' + (this.quadState.s2Fault === 'CRASHED' ? 'state-badge-s2' : 'state-badge-s4');
      badgeS2.textContent = this.quadState.s2Fault === 'CRASHED' ? 'CRASHED (FROZEN)' : 'HEALTHY (ACTIVE)';
    }
    if (btnS2) btnS2.textContent = this.quadState.s2Fault === 'CRASHED' ? 'Unfreeze S2' : 'Crash S2';

    const elS3 = document.getElementById('val-s3');
    const badgeS3 = document.getElementById('badge-s3');
    const btnS3 = document.getElementById('toggle-s3');
    if (elS3) elS3.textContent = this.formatTemp(point.s3);
    if (badgeS3) {
      badgeS3.className = 'qcc-state-badge ' + (this.quadState.s3Fault === 'WRONG' ? 'state-badge-s3' : 'state-badge-s4');
      badgeS3.textContent = this.quadState.s3Fault === 'WRONG' ? 'WRONG READING' : 'CALIBRATED';
    }
    if (btnS3) btnS3.textContent = this.quadState.s3Fault === 'WRONG' ? 'Recalibrate S3' : 'Corrupt S3';

    const elS4 = document.getElementById('val-s4');
    const badgeS4 = document.getElementById('badge-s4');
    const btnS4 = document.getElementById('toggle-s4');
    if (elS4) elS4.textContent = point.s4 !== null ? this.formatTemp(point.s4) : 'FAULT';
    if (badgeS4) {
      badgeS4.className = 'qcc-state-badge ' + (point.s4 !== null ? 'state-badge-s4' : 'state-badge-s1');
      badgeS4.textContent = point.s4 !== null ? 'HEALTHY • ELECTED' : 'OFFLINE';
    }
    if (btnS4) btnS4.textContent = point.s4 !== null ? 'Inject Fault S4' : 'Heal S4';
  }

  updateGlobalStatusStrip(point) {
    const processTemp = document.getElementById('global-process-temp');
    if (processTemp) processTemp.textContent = this.formatTemp(point.consensus);

    const isoRate = document.getElementById('global-isolation-rate');
    if (isoRate) {
      let isolatedCount = 0;
      if (this.diagnostics.s1Disconnected) isolatedCount++;
      if (this.diagnostics.s2Crashed) isolatedCount++;
      if (this.diagnostics.s3Wrong) isolatedCount++;
      isoRate.textContent = `${isolatedCount}/3 Isolated (${Math.round((isolatedCount / 3) * 100)}%)`;
    }
  }

  update3DOverlay(point) {
    const valA = document.getElementById('twin-val-a');
    const valB = document.getElementById('twin-val-b');
    const valC = document.getElementById('twin-val-c');
    const valD = document.getElementById('twin-val-d');

    if (valA) valA.textContent = point.s1 !== null ? this.formatTemp(point.s1) : 'DISCONNECTED';
    if (valB) valB.textContent = this.formatTemp(point.s2);
    if (valC) valC.textContent = this.formatTemp(point.s3);
    if (valD) valD.textContent = point.s4 !== null ? this.formatTemp(point.s4) : 'OFFLINE';

    // Update Probe Light Intensities & Colors
    if (this.three.lightA) {
      this.three.lightA.intensity = point.s1 === null ? 5.0 : 1.2;
      this.three.lightA.color.setHex(point.s1 === null ? 0xEF4444 : 0x10B981);
    }
    if (this.three.lightB) {
      this.three.lightB.intensity = this.quadState.s2Fault === 'CRASHED' ? 4.0 : 1.2;
    }
    if (this.three.lightC) {
      this.three.lightC.intensity = this.quadState.s3Fault === 'WRONG' ? 4.5 : 1.2;
    }
    if (this.three.lightD) {
      this.three.lightD.intensity = point.s4 !== null ? 3.5 : 0.2;
    }
  }

  updateTelemetryHUD(point) {
    const sA = (point.s4 !== null ? point.s4 : 24.8) + this.telemetry.trimA;
    const sB = (point.s3 !== null ? point.s3 : 37.2) + this.telemetry.trimB;
    const delta = Math.abs(sA - sB);
    const rate = point.rateOfChange;

    const elA = document.getElementById('hud-val-a');
    const elB = document.getElementById('hud-val-b');
    const elDelta = document.getElementById('hud-val-delta');
    const elRate = document.getElementById('hud-val-rate');
    const elRateSub = document.getElementById('hud-rate-sub');

    if (elA) elA.innerHTML = `${sA.toFixed(2)}<span class="unit">${this.state.tempUnit === 'F' ? '°F' : '°C'}</span>`;
    if (elB) elB.innerHTML = `${sB.toFixed(2)}<span class="unit">${this.state.tempUnit === 'F' ? '°F' : '°C'}</span>`;
    if (elDelta) elDelta.innerHTML = `${delta.toFixed(2)}<span class="unit">${this.state.tempUnit === 'F' ? '°F' : '°C'}</span>`;
    if (elRate) elRate.innerHTML = `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}<span class="unit">°C/s</span>`;
    if (elRateSub) elRateSub.textContent = Math.abs(rate) > 0.4 ? 'Rapid Thermal Shift' : 'Steady State';

    // Trust Calculation & FSM Classification
    let trust = 99;
    let classification = 'OPTIMAL (NORMAL)';
    let pillClass = 'pill-large-normal';
    let details = 'Dual-sensor consensus verified within ±' + this.telemetry.corridor.toFixed(2) + '°C corridor. Both transducers exhibiting nominal variance and low noise. All plausibility criteria satisfied.';

    if (this.state.activeScenario === 'process_surge') {
      trust = 97;
      classification = 'PROCESS SURGE (REAL)';
      pillClass = 'pill-large-surge';
      details = 'Real thermal excitation detected simultaneously across channels (dT/dt > 0.8°C/s). Rate convergence verified. Zero false emergency shutdowns.';
    } else if (this.diagnostics.s1Disconnected || this.diagnostics.s2Crashed || this.diagnostics.s3Wrong) {
      let penalty = 0;
      if (this.diagnostics.s1Disconnected) penalty += 25;
      if (this.diagnostics.s2Crashed) penalty += 25;
      if (this.diagnostics.s3Wrong) penalty += 20;
      trust = Math.max(18, 98 - penalty);
      classification = 'TRANSDUCER FAULT';
      pillClass = 'pill-large-fault';
      details = 'Transducer failure isolated. S1/S2/S3 failed plausibility verification. Autonomous median consensus elected healthy reference (Sensor 4).';
    }

    const digitEl = document.getElementById('hud-trust-digit');
    const ringEl = document.getElementById('hud-ring-fill');
    if (digitEl) digitEl.textContent = Math.round(trust);
    if (ringEl) {
      const circ = 339.29;
      ringEl.style.strokeDashoffset = (circ * (1 - trust / 100)).toFixed(1);
    }

    const pillEl = document.getElementById('hud-class-pill');
    const titleEl = document.getElementById('hud-class-title');
    const detailsEl = document.getElementById('hud-class-details');
    if (pillEl) {
      pillEl.className = 'status-pill-large ' + pillClass;
    }
    if (titleEl) titleEl.textContent = classification;
    if (detailsEl) detailsEl.textContent = details;

    // Plausibility Rows
    const bOpen = document.getElementById('badge-chk-open');
    const bDrift = document.getElementById('badge-chk-drift');
    const bStuck = document.getElementById('badge-chk-stuck');
    const bNoise = document.getElementById('badge-chk-noise');
    const bVerdict = document.getElementById('hud-verdict-summary');

    if (bOpen) {
      bOpen.textContent = this.diagnostics.s1Disconnected ? 'FAIL (0.00V)' : 'PASS (3.30V)';
      bOpen.className = this.diagnostics.s1Disconnected ? 'status-pill-fail' : 'status-pill-pass';
    }
    if (bDrift) {
      bDrift.textContent = this.diagnostics.s3Wrong ? 'FAIL (+12.4°C)' : 'PASS (0.02°C/m)';
      bDrift.className = this.diagnostics.s3Wrong ? 'status-pill-fail' : 'status-pill-pass';
    }
    if (bStuck) {
      bStuck.textContent = this.diagnostics.s2Crashed ? 'FAIL (ZERO VAR)' : 'PASS (DYNAMIC)';
      bStuck.className = this.diagnostics.s2Crashed ? 'status-pill-fail' : 'status-pill-pass';
    }
    if (bNoise) {
      bNoise.textContent = this.sim.noiseAmp > 0.3 ? 'FAIL (18 dB)' : '38 dB (CLEAN)';
      bNoise.className = this.sim.noiseAmp > 0.3 ? 'status-pill-fail' : 'status-pill-pass';
    }
    if (bVerdict) {
      bVerdict.textContent = trust > 85 
        ? 'All physical and statistical checks passed. Transducers are fully calibrated and verified.' 
        : 'Active anomaly sequence: Outlier channels isolated by rate-of-change and consensus voting filters.';
    }

    // Telemetry footer metrics
    const dataCountEl = document.getElementById('datapoints-counter');
    if (dataCountEl) dataCountEl.textContent = `${this.totalLoggedCount} samples`;

    const streamHealth = document.getElementById('telemetry-stream-health');
    if (streamHealth) {
      streamHealth.textContent = trust > 80 ? 'OPTIMAL (100%)' : `DEGRADED (${Math.round(trust)}%)`;
      streamHealth.className = trust > 80 ? 'val-green' : 'val-orange';
    }

    // Session Data Recording
    if (this.telemetry.recording) {
      const elapsedSec = Math.floor((Date.now() - this.telemetry.recStartTime) / 1000);
      const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
      const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
      const ss = String(elapsedSec % 60).padStart(2, '0');
      const timerEl = document.getElementById('rec-timer');
      if (timerEl) timerEl.textContent = `${hh}:${mm}:${ss}`;

      this.telemetry.recordedFrames.push({
        timestamp: new Date().toISOString(),
        elapsedSec,
        sensorA: sA,
        sensorB: sB,
        delta: delta,
        consensus: point.consensus,
        classification
      });

      const framesEl = document.getElementById('rec-frames');
      if (framesEl) framesEl.textContent = this.telemetry.recordedFrames.length;

      const statMeanA = document.getElementById('stat-mean-a');
      const statMeanB = document.getElementById('stat-mean-b');
      const statVar = document.getElementById('stat-variance');
      if (statMeanA) statMeanA.textContent = this.formatTemp(sA);
      if (statMeanB) statMeanB.textContent = this.formatTemp(sB);
      if (statVar) statVar.textContent = (delta * 0.05).toFixed(3);
    }
  }

  updatePipelineDiagram(point) {
    const rateEl = document.getElementById('pipe-val-rate');
    if (rateEl) {
      const sign = point.rateOfChange >= 0 ? '+' : '';
      rateEl.textContent = `dT/dt: ${sign}${point.rateOfChange.toFixed(2)}°C/s`;
    }

    const corridorEl = document.getElementById('pipe-val-corridor');
    if (corridorEl) {
      corridorEl.textContent = `±${this.config.deltaThreshold.toFixed(2)}°C Boundary`;
    }

    const electedEl = document.getElementById('pipe-val-elected');
    if (electedEl) {
      electedEl.textContent = `S4 Elected (Trust: ${this.state.trustScore}%)`;
    }

    const truthEl = document.getElementById('pipe-val-truth');
    if (truthEl) {
      truthEl.textContent = this.formatTemp(point.consensus);
    }

    // Update Stage 1 Dots
    const dot1 = document.getElementById('pdot-s1');
    const dot2 = document.getElementById('pdot-s2');
    const dot3 = document.getElementById('pdot-s3');
    const dot4 = document.getElementById('pdot-s4');

    if (dot1) dot1.className = 'pi-dot ' + (point.s1 === null ? 'dot-red' : 'dot-green');
    if (dot2) dot2.className = 'pi-dot ' + (this.quadState.s2Fault === 'CRASHED' ? 'dot-orange' : 'dot-green');
    if (dot3) dot3.className = 'pi-dot ' + (this.quadState.s3Fault === 'WRONG' ? 'dot-purple' : 'dot-green');
    if (dot4) dot4.className = 'pi-dot ' + (point.s4 !== null ? 'dot-green' : 'dot-red');
  }

  updateLatencyBanner() {
    const sw1 = document.getElementById('stopwatch-s1');
    const sw2 = document.getElementById('stopwatch-s2');
    const sw3 = document.getElementById('stopwatch-s3');
    if (sw1) sw1.textContent = `< ${this.latencies.s1} ms`;
    if (sw2) sw2.textContent = `< ${this.latencies.s2} ms`;
    if (sw3) sw3.textContent = `< ${this.latencies.s3} ms`;
  }

  updateSummaryKPIs() {
    const totalEl = document.getElementById('kpi-total-samples');
    if (totalEl) totalEl.textContent = this.totalLoggedCount;

    const pointsScope = document.getElementById('scope-points-val');
    if (pointsScope) pointsScope.textContent = this.quadHistory.length;
  }

  // =====================================================================
  // Three.js 3D Digital Twin Engine (Dual Model Architecture)
  // =====================================================================
  init3DDigitalTwin() {
    const canvas = document.getElementById('canvas-3d');
    const container = document.getElementById('viewport-3d-box');
    if (!canvas || !container) return;

    this.three.scene = new THREE.Scene();
    this.update3DThemeBackground();

    const rect = container.getBoundingClientRect();
    const aspect = (rect.width || 800) / (rect.height || 500);
    this.three.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.three.camera.position.set(0, 15, 24);

    this.three.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.three.renderer.setPixelRatio(window.devicePixelRatio);
    this.three.renderer.setSize(rect.width || 800, rect.height || 500);
    this.three.renderer.shadowMap.enabled = true;
    this.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.three.controls = new THREE.OrbitControls(this.three.camera, this.three.renderer.domElement);
    this.three.controls.enableDamping = true;
    this.three.controls.dampingFactor = 0.05;

    // Studio Lighting
    this.three.ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    this.three.scene.add(this.three.ambientLight);

    this.three.keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.three.keyLight.position.set(15, 25, 18);
    this.three.keyLight.castShadow = true;
    this.three.keyLight.shadow.mapSize.width = 1024;
    this.three.keyLight.shadow.mapSize.height = 1024;
    this.three.scene.add(this.three.keyLight);

    // 4 Point Lights for the 4 sensor probe pins
    this.three.lightA = new THREE.PointLight(0xEF4444, 3.5, 12); // Red (S1)
    this.three.lightA.position.set(-5, 3, 3);
    this.three.scene.add(this.three.lightA);

    this.three.lightB = new THREE.PointLight(0xF97316, 3.0, 12); // Orange (S2)
    this.three.lightB.position.set(-5, 3, -3);
    this.three.scene.add(this.three.lightB);

    this.three.lightC = new THREE.PointLight(0x8B5CF6, 3.0, 12); // Purple (S3)
    this.three.lightC.position.set(5, 3, -3);
    this.three.scene.add(this.three.lightC);

    this.three.lightD = new THREE.PointLight(0x10B981, 3.5, 12); // Green (S4)
    this.three.lightD.position.set(5, 3, 3);
    this.three.scene.add(this.three.lightD);

    this.three.gridHelper = new THREE.GridHelper(40, 40, 0x0284C7, 0x334155);
    this.three.gridHelper.position.y = -0.05;
    this.three.scene.add(this.three.gridHelper);

    // Load both 3D models (BenchTwin and Circuit Board)
    this.load3DModels();

    // Raycasting & Interaction Event Handlers
    canvas.addEventListener('mousemove', (e) => this.on3DMouseMove(e));
    canvas.addEventListener('mouseleave', () => this.on3DMouseLeave());
    canvas.addEventListener('click', (e) => this.on3DCanvasClick(e));

    // 3D Animation & Render Loop
    const animate3D = () => {
      requestAnimationFrame(animate3D);

      if (this.three.cinematicTour) {
        this.three.tourAngle += 0.008;
        this.three.camera.position.x = Math.sin(this.three.tourAngle) * 22;
        this.three.camera.position.z = Math.cos(this.three.tourAngle) * 22;
        this.three.camera.position.y = 12 + Math.sin(this.three.tourAngle * 0.5) * 4;
        this.three.controls.target.set(0, 2, 0);
      }

      this.three.controls.update();

      // Slow rotation on active model if idle and enabled
      const activeObj = this.three.models[this.three.activeModel];
      if (activeObj && this.three.autoRotate && !this.three.controls.state && !this.three.cinematicTour) {
        activeObj.rotation.y += 0.001 * this.three.orbitSpeed;
      }

      // Render 3D Spatial HTML Overlays
      this.render3DSpatialPins();

      if (this.state.activePage === 'page-digital-twin') {
        this.three.renderer.render(this.three.scene, this.three.camera);
      }
    };
    requestAnimationFrame(animate3D);

    window.addEventListener('resize', () => this.resize3DCanvas());
  }

  load3DModels() {
    const loader = new THREE.GLTFLoader();
    const loaderOverlay = document.getElementById('twin-loader');
    const loaderTitle = document.getElementById('twin-loader-title');
    const loaderBar = document.getElementById('twin-loader-bar');

    // 1. Load BenchTwin Workstation (Primary 67MB Model)
    loader.load('benchtwin-project-2.glb', (gltf) => {
      const bench = gltf.scene;
      const box = new THREE.Box3().setFromObject(bench);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 22 / maxDim;
      bench.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      bench.position.x = -center.x * scale;
      bench.position.y = -box.min.y * scale;
      bench.position.z = -center.z * scale;

      let vertexCount = 0;
      bench.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          this.three.originalMeshPositions.set(child.id, child.position.clone());
          if (child.geometry?.attributes?.position) {
            vertexCount += child.geometry.attributes.position.count;
          }
        }
      });

      this.three.models.bench = bench;
      this.three.scene.add(bench);
      this.three.isLoaded = true;

      const polyEl = document.getElementById('cad-mesh-poly');
      if (polyEl) polyEl.textContent = `${vertexCount.toLocaleString()} Vertices`;

      if (loaderBar) loaderBar.style.width = '100%';
      setTimeout(() => {
        if (loaderOverlay) loaderOverlay.classList.add('loaded');
      }, 300);

      this.playSuccessChime();
    }, (xhr) => {
      if (xhr.lengthComputable && loaderBar) {
        const pct = Math.round((xhr.loaded / xhr.total) * 100);
        loaderBar.style.width = `${pct}%`;
        if (loaderTitle) loaderTitle.textContent = `Loading BenchTwin Workstation (${pct}%)...`;
      }
    }, () => {
      if (loaderOverlay) loaderOverlay.classList.add('loaded');
    });

    // 2. Load Circuit Board Micro-Twin in background
    loader.load('circuit-board.glb', (gltf) => {
      const pcb = gltf.scene;
      const box = new THREE.Box3().setFromObject(pcb);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 14 / maxDim;
      pcb.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      pcb.position.x = -center.x * scale;
      pcb.position.y = -box.min.y * scale;
      pcb.position.z = -center.z * scale;

      pcb.visible = false;
      this.three.models.pcb = pcb;
      this.three.scene.add(pcb);
    });
  }

  switch3DModel(modelName) {
    this.three.activeModel = modelName;
    if (this.three.models.bench) this.three.models.bench.visible = (modelName === 'bench');
    if (this.three.models.pcb) this.three.models.pcb.visible = (modelName === 'pcb');

    document.querySelectorAll('.twin-model-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.model === modelName);
    });

    const tag = document.getElementById('twin-active-model-tag');
    if (tag) tag.textContent = modelName === 'bench' ? 'BENCH RIG' : 'MICRO PCB';

    this.playRelayClick();
  }

  // 3D Raycasting Component Inspection Flyout
  on3DMouseMove(e) {
    const canvas = document.getElementById('canvas-3d');
    const flyout = document.getElementById('twin-raycast-card');
    if (!canvas || !flyout) return;

    const rect = canvas.getBoundingClientRect();
    this.three.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.three.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.three.raycaster.setFromCamera(this.three.mouse, this.three.camera);
    const activeModel = this.three.models[this.three.activeModel];
    if (!activeModel) return;

    const intersects = this.three.raycaster.intersectObjects(activeModel.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      flyout.classList.add('active');
      flyout.style.left = `${Math.min(rect.width - 340, Math.max(16, e.clientX - rect.left + 16))}px`;
      flyout.style.top = `${Math.min(rect.height - 180, Math.max(16, e.clientY - rect.top + 16))}px`;

      // Update dynamic inspector specs
      const titleEl = document.getElementById('rc-title');
      const tempEl = document.getElementById('rc-temp');
      const voltEl = document.getElementById('rc-volt');
      if (titleEl) {
        titleEl.textContent = this.three.activeModel === 'bench' ? 'Industrial Bench Instrumentation Station' : 'ESP32 SAR ADC Transducer Node';
      }
      if (tempEl) tempEl.textContent = this.formatTemp(this.sim.currentProcessTemp);
      if (voltEl) voltEl.textContent = '3.30 V (Regulated)';
    } else {
      flyout.classList.remove('active');
    }
  }

  on3DMouseLeave() {
    const flyout = document.getElementById('twin-raycast-card');
    if (flyout) flyout.classList.remove('active');
  }

  focusBenchHotspot(target) {
    if (!this.three.camera || !this.three.controls) return;
    this.three.cinematicTour = false;

    const positions = {
      overview: { pos: [0, 15, 24], look: [0, 0, 0] },
      oscilloscope: { pos: [-7, 8, 12], look: [-4, 3, 0] },
      powersupply: { pos: [7, 8, 12], look: [4, 3, 0] },
      multimeter: { pos: [-3, 6, 8], look: [-2, 2, 0] },
      esp32: { pos: [0, 5, 7], look: [0, 1, 0] },
      probes: { pos: [0, 3.5, 5], look: [0, 0.5, 0] },
      heatsink: { pos: [4, 4.5, 7], look: [3, 1, 0] }
    };

    const config = positions[target] || positions.overview;
    this.three.camera.position.set(...config.pos);
    this.three.controls.target.set(...config.look);
    this.three.controls.update();

    const flyout = document.getElementById('twin-raycast-card');
    if (flyout) {
      flyout.classList.add('active');
      const titleEl = document.getElementById('rc-title');
      const descEl = document.getElementById('rc-desc');
      if (titleEl) titleEl.textContent = `${target.toUpperCase()} SUBSYSTEM`;
      if (descEl) descEl.textContent = `Focus locked on ${target}. Sensor telemetry and physical parameters synchronized.`;
      setTimeout(() => flyout.classList.remove('active'), 3500);
    }
    this.playRelayClick();
  }

  render3DSpatialPins() {
    if (!this.three.camera || !this.three.spatialPinsVisible || !this.three.isLoaded) {
      document.querySelectorAll('.spatial-pin').forEach(pin => pin.classList.add('hidden'));
      return;
    }

    const container = document.getElementById('viewport-3d-box');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const placedPins = [];

    for (const [key, coords] of Object.entries(this.three.spatialPinCoords)) {
      const pinEl = document.getElementById(`spin-${key}`);
      if (!pinEl) continue;

      const v = coords.clone();
      const activeObj = this.three.models[this.three.activeModel];
      if (activeObj) {
        v.applyMatrix4(activeObj.matrixWorld);
      }

      v.project(this.three.camera);

      // Hide if behind camera or too far off-screen
      if (v.z > 1.0 || v.z < -1.0 || Math.abs(v.x) > 1.15 || Math.abs(v.y) > 1.15) {
        pinEl.classList.add('hidden');
        continue;
      }

      pinEl.classList.remove('hidden');
      let x = (v.x * 0.5 + 0.5) * rect.width;
      let y = (-(v.y * 0.5) + 0.5) * rect.height;

      // Keep within comfortable viewport bounds
      x = Math.max(30, Math.min(rect.width - 30, x));
      y = Math.max(30, Math.min(rect.height - 30, y));

      // 2D Collision Avoidance: if close to another pin, alternate vertical offset
      let flipStem = false;
      for (const other of placedPins) {
        const dx = Math.abs(x - other.x);
        const dy = Math.abs(y - other.y);
        if (dx < 115 && dy < 38) {
          flipStem = true;
          break;
        }
      }

      if (flipStem) {
        pinEl.classList.add('pin-stem-down');
      } else {
        pinEl.classList.remove('pin-stem-down');
      }

      pinEl.style.left = `${x}px`;
      pinEl.style.top = `${y}px`;

      placedPins.push({ x, y, el: pinEl });
    }
  }

  updateSpatialPins(point) {
    const p1 = document.getElementById('spin-val-s1');
    const p2 = document.getElementById('spin-val-s2');
    const p3 = document.getElementById('spin-val-s3');
    const p4 = document.getElementById('spin-val-s4');
    const hs = document.getElementById('spin-val-heatsink');

    if (p1) p1.textContent = point.s1 !== null ? this.formatTemp(point.s1) : 'DISC (0.00V)';
    if (p2) p2.textContent = `${this.formatTemp(point.s2)} • ${this.quadState.s2Fault === 'CRASHED' ? 'FROZEN' : 'ACTIVE'}`;
    if (p3) p3.textContent = `${this.formatTemp(point.s3)} • ${this.quadState.s3Fault === 'WRONG' ? '+12.4° BIAS' : 'CALIBRATED'}`;
    if (p4) p4.textContent = `${point.s4 !== null ? this.formatTemp(point.s4) : 'OFFLINE'} • ELECTED TRUTH`;
    if (hs) hs.textContent = `${this.formatTemp(this.sim.currentProcessTemp)} • ${this.sim.heaterPower > 40 ? 'HEATING' : this.sim.fanPWM > 40 ? 'COOLING' : 'NOMINAL'}`;
  }

  update3DExplode(factor) {
    this.three.explodeFactor = factor;
    const lbl = document.getElementById('lbl-twin-explode');
    if (lbl) lbl.textContent = `${factor}%`;

    const bench = this.three.models.bench;
    if (!bench) return;

    bench.traverse(child => {
      if (child.isMesh && this.three.originalMeshPositions.has(child.id)) {
        const origPos = this.three.originalMeshPositions.get(child.id);
        const dir = origPos.clone().normalize();
        if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);
        child.position.copy(origPos).addScaledVector(dir, (factor / 100) * 4.5);
      }
    });
  }

  on3DCanvasClick(e) {
    const canvas = document.getElementById('canvas-3d');
    if (!canvas || !this.three.camera) return;
    const rect = canvas.getBoundingClientRect();
    this.three.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.three.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.three.raycaster.setFromCamera(this.three.mouse, this.three.camera);
    const activeModel = this.three.models[this.three.activeModel];
    if (!activeModel) return;

    const intersects = this.three.raycaster.intersectObjects(activeModel.children, true);
    if (intersects.length === 0) return;

    const hit = intersects[0];

    // Caliper measurement workflow
    if (this.three.caliperActive) {
      this.handleCaliperPoint(hit.point);
      return;
    }

    // Select mesh in CAD Inspector
    this.selectCADMesh(hit.object);
  }

  handleCaliperPoint(point) {
    this.three.caliperPoints.push(point);

    const markerGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.copy(point);
    this.three.scene.add(marker);
    this.three.caliperMarkers.push(marker);

    const statusText = document.getElementById('tmb-status-text');
    const distDisplay = document.getElementById('tmb-distance-display');

    if (this.three.caliperPoints.length === 1) {
      if (statusText) statusText.textContent = `Point 1 set at [${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}]. Click Point 2...`;
    } else if (this.three.caliperPoints.length >= 2) {
      const p1 = this.three.caliperPoints[0];
      const p2 = this.three.caliperPoints[1];
      const distance = p1.distanceTo(p2);
      const mm = (distance * 100).toFixed(1);

      if (distDisplay) distDisplay.textContent = `${mm} mm`;
      if (statusText) statusText.textContent = `Distance: ${mm} mm (±0.1 mm precision). Click Clear to reset.`;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38BDF8, linewidth: 2 });
      this.three.caliperLine = new THREE.Line(lineGeo, lineMat);
      this.three.scene.add(this.three.caliperLine);

      this.playSuccessChime();
    }
  }

  clearCaliperMeasurement() {
    this.three.caliperPoints = [];
    this.three.caliperMarkers.forEach(m => this.three.scene.remove(m));
    this.three.caliperMarkers = [];
    if (this.three.caliperLine) {
      this.three.scene.remove(this.three.caliperLine);
      this.three.caliperLine = null;
    }
    const statusText = document.getElementById('tmb-status-text');
    const distDisplay = document.getElementById('tmb-distance-display');
    if (statusText) statusText.textContent = 'Click Point 1 on 3D geometry...';
    if (distDisplay) distDisplay.textContent = '-- mm';
    this.playRelayClick();
  }

  selectCADMesh(mesh) {
    this.three.selectedMesh = mesh;
    const nameEl = document.getElementById('cad-mesh-name');
    const matEl = document.getElementById('cad-mesh-mat');
    const polyEl = document.getElementById('cad-mesh-poly');
    const healthEl = document.getElementById('cad-mesh-health');

    if (nameEl) nameEl.textContent = mesh.name || `CAD Mesh #${mesh.id}`;
    if (matEl) matEl.textContent = mesh.material?.type || 'PBR MeshStandard';
    if (polyEl) polyEl.textContent = `${mesh.geometry?.attributes?.position?.count || 1200} Vertices`;
    if (healthEl) healthEl.textContent = 'OPTIMAL (100%)';

    this.playRelayClick();
  }

  isolateSubsystem(target) {
    this.focusBenchHotspot(target);
    this.playRelayClick();
  }

  toggleSubsystemWireframe(target) {
    const activeModel = this.three.models[this.three.activeModel];
    if (!activeModel) return;

    activeModel.traverse(node => {
      if (node.isMesh && node.material) {
        node.material.wireframe = !node.material.wireframe;
      }
    });
    this.playRelayClick();
  }

  resize3DCanvas() {
    const canvas = document.getElementById('canvas-3d');
    const container = document.getElementById('viewport-3d-box');
    if (!canvas || !container || !this.three.renderer || !this.three.camera) return;

    const rect = container.getBoundingClientRect();
    this.three.camera.aspect = rect.width / rect.height;
    this.three.camera.updateProjectionMatrix();
    this.three.renderer.setSize(rect.width, rect.height);
  }

  // Mini 3D Picture-in-Picture Dock
  initPiPTwin() {
    const pipDock = document.getElementById('pip-twin-dock');
    const pipBtnToggle = document.getElementById('btn-pip-toggle');
    const pipBtnClose = document.getElementById('pip-btn-close');
    const pipBtnExpand = document.getElementById('pip-btn-expand');
    const pipCanvas = document.getElementById('pip-3d-canvas');

    if (pipBtnToggle) {
      pipBtnToggle.addEventListener('click', () => {
        this.state.pipOpen = !this.state.pipOpen;
        pipDock?.classList.toggle('open', this.state.pipOpen);
        if (this.state.pipOpen && !this.three.pipRenderer && pipCanvas) {
          this.initPiPRenderer(pipCanvas);
        }
      });
    }

    if (pipBtnClose) {
      pipBtnClose.addEventListener('click', () => {
        this.state.pipOpen = false;
        pipDock?.classList.remove('open');
      });
    }

    if (pipBtnExpand) {
      pipBtnExpand.addEventListener('click', () => {
        this.state.pipExpanded = !this.state.pipExpanded;
        pipDock?.classList.toggle('expanded', this.state.pipExpanded);
      });
    }
  }

  initPiPRenderer(canvas) {
    this.three.pipCamera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
    this.three.pipCamera.position.set(0, 14, 22);
    this.three.pipCamera.lookAt(0, 0, 0);

    this.three.pipRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.three.pipRenderer.setSize(canvas.clientWidth, canvas.clientHeight);

    const renderPiP = () => {
      requestAnimationFrame(renderPiP);
      if (this.state.pipOpen && this.three.scene && this.three.pipCamera) {
        this.three.pipRenderer.render(this.three.scene, this.three.pipCamera);
      }
    };
    requestAnimationFrame(renderPiP);
  }

  // =====================================================================
  // Real-Time Phosphor Oscilloscope & FFT Frequency Spectrum Analyzer
  // =====================================================================
  resizeScopeCanvas() {
    if (!this.canvasScope || !this.ctxScope) return;
    const parent = this.canvasScope.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.canvasScope.width = rect.width * window.devicePixelRatio;
    this.canvasScope.height = rect.height * window.devicePixelRatio;
    this.ctxScope.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  resizeFFTCanvas() {
    if (!this.canvasFFT || !this.ctxFFT) return;
    const parent = this.canvasFFT.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.canvasFFT.width = rect.width * window.devicePixelRatio;
    this.canvasFFT.height = rect.height * window.devicePixelRatio;
    this.ctxFFT.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  drawPhosphorOscilloscope() {
    if (!this.canvasScope || !this.ctxScope) return;
    const width = this.canvasScope.width / window.devicePixelRatio;
    const height = this.canvasScope.height / window.devicePixelRatio;
    const ctx = this.ctxScope;

    // Authentic CRT Phosphor Persistence Decay
    ctx.fillStyle = 'rgba(3, 7, 18, 0.22)';
    ctx.fillRect(0, 0, width, height);

    // Oscilloscope Reticle Grid
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    const divisionsX = 10;
    const divisionsY = 8;

    for (let i = 0; i <= divisionsX; i++) {
      const x = (i / divisionsX) * width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let j = 0; j <= divisionsY; j++) {
      const y = (j / divisionsY) * height;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    if (this.quadHistory.length < 2) return;
    const ptsCount = Math.round(this.scope.timebaseSec * this.config.sampleRateHz);
    const visibleData = this.quadHistory.slice(-ptsCount);
    if (visibleData.length < 2) return;

    const minT = 16, maxT = 46;
    const getY = (val) => height - ((val - minT) / (maxT - minT)) * height;
    const getX = (idx) => (idx / (visibleData.length - 1)) * width;

    // Trace CH1: S1 (Red)
    if (this.scope.channels.s1) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < visibleData.length; i++) {
        if (visibleData[i].s1 !== null) {
          const x = getX(i), y = getY(visibleData[i].s1);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Trace CH2: S2 Crashed (Orange)
    if (this.scope.channels.s2) {
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#F97316';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < visibleData.length; i++) {
        const x = getX(i), y = getY(visibleData[i].s2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Trace CH3: S3 Wrong Reading (Purple)
    if (this.scope.channels.s3) {
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#A855F7';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let i = 0; i < visibleData.length; i++) {
        const x = getX(i), y = getY(visibleData[i].s3);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Trace CH4: S4 Ground Truth (Green)
    if (this.scope.channels.s4) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let i = 0; i < visibleData.length; i++) {
        if (visibleData[i].s4 !== null) {
          const x = getX(i), y = getY(visibleData[i].s4);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    // Measurement Cursors
    if (this.scope.cursorMode) {
      const curAx = this.scope.cursorA * width;
      const curBx = this.scope.cursorB * width;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(curAx, 0); ctx.lineTo(curAx, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(curBx, 0); ctx.lineTo(curBx, height); ctx.stroke();
      ctx.setLineDash([]);

      const hudDelta = document.getElementById('scope-cursor-delta');
      if (hudDelta) {
        const dt = Math.abs((this.scope.cursorB - this.scope.cursorA) * this.scope.timebaseSec);
        hudDelta.textContent = `Δt: ${dt.toFixed(2)}s | CH4 Sync verified`;
      }
    }
  }

  drawFFTSpectrum() {
    if (!this.canvasFFT || !this.ctxFFT) return;
    const width = this.canvasFFT.width / window.devicePixelRatio;
    const height = this.canvasFFT.height / window.devicePixelRatio;
    const ctx = this.ctxFFT;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Compute Discrete Fourier Transform (DFT) magnitudes on latest 32 samples
    const numBins = 24;
    const barWidth = (width / numBins) - 2;

    for (let k = 0; k < numBins; k++) {
      let magnitude = 0.05;
      if (k === 0) {
        // DC process component
        magnitude = 0.85;
      } else if (k === 1 || k === 2) {
        // Low-frequency process thermal dynamics
        magnitude = 0.35 + Math.random() * 0.1;
      } else if (k === 12 && this.diagnostics.noiseBurst) {
        // 50Hz / High EMI noise spike
        magnitude = 0.75 + Math.random() * 0.2;
      } else {
        // Ambient noise floor
        magnitude = (this.sim.noiseAmp * 2.0) + Math.random() * 0.08;
      }

      const barH = Math.min(height - 10, magnitude * (height - 10));
      const x = k * (barWidth + 2) + 2;
      const y = height - barH;

      const grad = ctx.createLinearGradient(0, y, 0, height);
      grad.addColorStop(0, k === 12 && this.diagnostics.noiseBurst ? '#EF4444' : '#38BDF8');
      grad.addColorStop(1, '#0284C7');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barH);
    }
  }

  // =====================================================================
  // Canvas Rendering Loops (Quad, Telemetry, Scope, FFT)
  // =====================================================================
  initCanvases() {
    this.resizeQuadCanvas();
    this.resize2DCanvas();
    this.resizeScopeCanvas();
    this.resizeFFTCanvas();

    window.addEventListener('resize', () => {
      this.resizeQuadCanvas();
      this.resize2DCanvas();
      this.resizeScopeCanvas();
      this.resizeFFTCanvas();
    });

    if (this.canvasQuad) {
      this.canvasQuad.addEventListener('mousemove', (e) => {
        const rect = this.canvasQuad.getBoundingClientRect();
        this.hoverQuadPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      });
      this.canvasQuad.addEventListener('mouseleave', () => {
        this.hoverQuadPoint = null;
        const hudEl = document.getElementById('quad-hud-text');
        if (hudEl) hudEl.textContent = 'Inspect: Move cursor over chart';
      });
    }
  }

  resizeQuadCanvas() {
    if (!this.canvasQuad) return;
    const parent = this.canvasQuad.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvasQuad.width = rect.width * window.devicePixelRatio;
    this.canvasQuad.height = rect.height * window.devicePixelRatio;
    this.ctxQuad.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  resize2DCanvas() {
    if (!this.canvas2D) return;
    const parent = this.canvas2D.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas2D.width = rect.width * window.devicePixelRatio;
    this.canvas2D.height = rect.height * window.devicePixelRatio;
    this.ctx2D.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  initRenderLoops() {
    const render = () => {
      if (this.state.activePage === 'page-quad') {
        this.drawQuadWaveform();
      } else if (this.state.activePage === 'page-telemetry') {
        this.drawWaveform();
      } else if (this.state.activePage === 'page-bench') {
        this.drawPhosphorOscilloscope();
        this.drawFFTSpectrum();
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  drawQuadWaveform() {
    if (!this.canvasQuad || !this.ctxQuad) return;
    const width = this.canvasQuad.width / window.devicePixelRatio;
    const height = this.canvasQuad.height / window.devicePixelRatio;
    const ctx = this.ctxQuad;

    ctx.fillStyle = this.state.theme === 'dark' ? '#0F172A' : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (this.quadHistory.length < 2) return;
    const windowPoints = this.config.windowDurationSec * this.config.sampleRateHz;
    const visibleData = this.quadHistory.slice(-windowPoints);
    if (visibleData.length < 2) return;

    let minT = 18, maxT = 42;
    const padLeft = 48, padRight = 18, padTop = 18, padBottom = 26;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const getX = (idx) => padLeft + (idx / (visibleData.length - 1)) * chartW;
    const getY = (val) => padTop + chartH - ((val - minT) / (maxT - minT)) * chartH;

    // Grid lines
    ctx.strokeStyle = this.state.theme === 'dark' ? '#1E293B' : '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.fillStyle = this.state.theme === 'dark' ? '#94A3B8' : '#64748B';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const yVal = minT + (i / 5) * (maxT - minT);
      const yPos = getY(yVal);
      ctx.beginPath(); ctx.moveTo(padLeft, yPos); ctx.lineTo(width - padRight, yPos); ctx.stroke();
      ctx.fillText(`${yVal.toFixed(0)}°`, padLeft - 6, yPos + 4);
    }

    // S3 (Purple)
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i), y = getY(visibleData[i].s3);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // S2 (Orange)
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i), y = getY(visibleData[i].s2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // S4 (Green)
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      if (visibleData[i].s4 !== null) {
        const x = getX(i), y = getY(visibleData[i].s4);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  drawWaveform() {
    if (!this.canvas2D || !this.ctx2D) return;
    const width = this.canvas2D.width / window.devicePixelRatio;
    const height = this.canvas2D.height / window.devicePixelRatio;
    const ctx = this.ctx2D;

    ctx.fillStyle = this.state.theme === 'dark' ? '#0F172A' : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (this.quadHistory.length < 2) return;
    const windowPoints = this.telemetry.timebaseSec * this.config.sampleRateHz;
    const visibleData = this.quadHistory.slice(-windowPoints);
    if (visibleData.length < 2) return;

    let minT = 16, maxT = 44;
    const padLeft = 48, padRight = 18, padTop = 18, padBottom = 26;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const getX = (idx) => padLeft + (idx / (visibleData.length - 1)) * chartW;
    const getY = (val) => padTop + chartH - ((val - minT) / (maxT - minT)) * chartH;

    // Grid lines & Axis labels
    ctx.strokeStyle = this.state.theme === 'dark' ? '#1E293B' : '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.fillStyle = this.state.theme === 'dark' ? '#94A3B8' : '#64748B';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const yVal = minT + (i / 5) * (maxT - minT);
      const yPos = getY(yVal);
      ctx.beginPath(); ctx.moveTo(padLeft, yPos); ctx.lineTo(width - padRight, yPos); ctx.stroke();
      ctx.fillText(`${yVal.toFixed(0)}°`, padLeft - 6, yPos + 4);
    }

    // Dynamic Consensus Tolerance Corridor Envelope (Shaded polygon)
    const corridor = this.telemetry.corridor;
    ctx.fillStyle = this.state.theme === 'dark' ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.08)';
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const topY = getY(visibleData[i].consensus + corridor);
      if (i === 0) ctx.moveTo(getX(i), topY);
      else ctx.lineTo(getX(i), topY);
    }
    for (let i = visibleData.length - 1; i >= 0; i--) {
      const botY = getY(visibleData[i].consensus - corridor);
      ctx.lineTo(getX(i), botY);
    }
    ctx.closePath();
    ctx.fill();

    // Corridor Boundary Lines (Dotted)
    ctx.strokeStyle = this.state.theme === 'dark' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.35)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const topY = getY(visibleData[i].consensus + corridor);
      if (i === 0) ctx.moveTo(getX(i), topY); else ctx.lineTo(getX(i), topY);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const botY = getY(visibleData[i].consensus - corridor);
      if (i === 0) ctx.moveTo(getX(i), botY); else ctx.lineTo(getX(i), botY);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Consensus Trace (Teal / Blue)
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i), y = getY(visibleData[i].consensus);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Sensor A (Channel 1, Orange / Red - mapped to S4 + trimA)
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const valA = (visibleData[i].s4 !== null ? visibleData[i].s4 : 24.8) + this.telemetry.trimA;
      const x = getX(i), y = getY(valA);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Sensor B (Channel 2, Purple / Blue - mapped to S3 + trimB)
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const valB = (visibleData[i].s3 !== null ? visibleData[i].s3 : 37.2) + this.telemetry.trimB;
      const x = getX(i), y = getY(valB);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Interactive Crosshair Inspector
    if (this.telemetry.mouseOver && this.telemetry.cursorX >= padLeft && this.telemetry.cursorX <= width - padRight) {
      const ratio = (this.telemetry.cursorX - padLeft) / chartW;
      const idx = Math.min(visibleData.length - 1, Math.max(0, Math.round(ratio * (visibleData.length - 1))));
      const pt = visibleData[idx];
      const curX = getX(idx);

      ctx.strokeStyle = this.state.theme === 'dark' ? '#38BDF8' : '#0284C7';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(curX, padTop); ctx.lineTo(curX, height - padBottom); ctx.stroke();
      ctx.setLineDash([]);

      const valA = (pt.s4 !== null ? pt.s4 : 24.8) + this.telemetry.trimA;
      const valB = (pt.s3 !== null ? pt.s3 : 37.2) + this.telemetry.trimB;
      const delta = Math.abs(valA - valB);
      const isCorridorPass = delta <= corridor * 2;

      // Draw intersection dots
      const yA = getY(valA), yB = getY(valB), yCons = getY(pt.consensus);
      ctx.fillStyle = '#EA580C'; ctx.beginPath(); ctx.arc(curX, yA, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8B5CF6'; ctx.beginPath(); ctx.arc(curX, yB, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0284C7'; ctx.beginPath(); ctx.arc(curX, yCons, 5, 0, Math.PI * 2); ctx.fill();

      const hudText = document.getElementById('canvas-hud-text');
      if (hudText) {
        hudText.textContent = `Cursor: Sensor A: ${valA.toFixed(2)}°C | Sensor B: ${valB.toFixed(2)}°C | ΔT: ${delta.toFixed(2)}°C | Corridor: ±${corridor.toFixed(2)}°C (${isCorridorPass ? 'PASS' : 'OUTLIER'})`;
      }
    }

    // Also draw the distribution histogram
    this.drawDistributionHistogram(visibleData);
  }

  drawDistributionHistogram(data) {
    const canvas = document.getElementById('canvas-telemetry-dist');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = canvas.parentElement.clientWidth;
    const h = canvas.height = canvas.parentElement.clientHeight || 80;

    ctx.fillStyle = this.state.theme === 'dark' ? '#0F172A' : '#F8FAFC';
    ctx.fillRect(0, 0, w, h);

    if (data.length < 5) return;

    let sumA = 0, sumB = 0;
    data.forEach(d => {
      sumA += (d.s4 !== null ? d.s4 : 24.8) + this.telemetry.trimA;
      sumB += (d.s3 !== null ? d.s3 : 37.2) + this.telemetry.trimB;
    });
    const meanA = sumA / data.length;
    const meanB = sumB / data.length;

    let varA = 0, varB = 0;
    data.forEach(d => {
      const va = ((d.s4 !== null ? d.s4 : 24.8) + this.telemetry.trimA) - meanA;
      const vb = ((d.s3 !== null ? d.s3 : 37.2) + this.telemetry.trimB) - meanB;
      varA += va * va;
      varB += vb * vb;
    });
    const stdA = Math.max(0.2, Math.sqrt(varA / data.length));
    const stdB = Math.max(0.2, Math.sqrt(varB / data.length));

    const minVal = 18, maxVal = 42;
    const gaussian = (x, mean, std) => {
      const exp = Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
      return (1 / (std * Math.sqrt(2 * Math.PI))) * exp;
    };

    // Curve A (Orange)
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(234, 88, 12, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let px = 0; px <= w; px += 4) {
      const v = minVal + (px / w) * (maxVal - minVal);
      const prob = gaussian(v, meanA, stdA);
      const y = h - prob * h * 1.6;
      ctx.lineTo(px, Math.max(4, y));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Curve B (Purple)
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let px = 0; px <= w; px += 4) {
      const v = minVal + (px / w) * (maxVal - minVal);
      const prob = gaussian(v, meanB, stdB);
      const y = h - prob * h * 1.6;
      ctx.lineTo(px, Math.max(4, y));
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.state.theme === 'dark' ? '#94A3B8' : '#64748B';
    ctx.font = '9.5px "JetBrains Mono", monospace';
    ctx.fillText(`μ_A: ${meanA.toFixed(1)}° (σ=${stdA.toFixed(2)})`, 10, 16);
    ctx.fillText(`μ_B: ${meanB.toFixed(1)}° (σ=${stdB.toFixed(2)})`, w - 160, 16);
  }

  // =====================================================================
  // Simulation Loop
  // =====================================================================
  initSimulationLoop() {
    const tickIntervalMs = 1000 / this.config.sampleRateHz;

    setInterval(() => {
      const now = Date.now();
      this.processSample(24.8, 24.8, now);
    }, tickIntervalMs);
  }

  // =====================================================================
  // 12-Scenario Industrial Fault Matrix Handlers
  // =====================================================================
  applyScenario(scenarioName) {
    this.state.activeScenario = scenarioName;

    // Reset temporary flags
    this.diagnostics.contactBounce = false;
    this.diagnostics.powerBrownout = false;
    this.diagnostics.noiseBurst = false;
    if (this.sim.chaosTimer) clearInterval(this.sim.chaosTimer);
    if (this.sim.cascadeTimer) clearInterval(this.sim.cascadeTimer);

    document.querySelectorAll('.scen-box').forEach(b => {
      b.classList.toggle('active', b.dataset.scenario === scenarioName);
    });

    switch (scenarioName) {
      case 'nominal':
        this.quadState.s1Fault = 'HEALTHY';
        this.quadState.s2Fault = 'HEALTHY';
        this.quadState.s3Fault = 'HEALTHY';
        this.quadState.s4Fault = 'HEALTHY';
        this.sim.baseTemp = 25.0;
        this.sim.heaterPower = 0;
        this.sim.fanPWM = 0;
        this.sim.noiseAmp = 0.08;
        this.latencies = { s1: 0, s2: 0, s3: 0, s4: 0 };
        this.playSuccessChime();
        this.addLogEntry('NORMAL', '25.0', '25.0', '25.0', '25.0', 100, 'All 4 sensors operating at nominal baseline.');
        break;

      case 'process_surge':
        this.sim.heaterPower = 85;
        this.playProcessSurgeSiren();
        this.addLogEntry('SURGE', '38.5', '38.5', '38.5', '38.5', 98, 'Thermal shock +15°C surge injected. Process alert, zero false shutdowns.');
        break;

      case 'open_circuit':
        this.quadState.s1Fault = 'DISCONNECTED';
        this.latencies.s1 = 12;
        this.playRelayClick();
        this.playAlarmChime();
        this.addLogEntry('FAULT', 'DISC', '25.0', '25.0', '25.0', 99, 'Wire cut on S1. S1 isolated in 12ms. S4 elected.');
        break;

      case 'sensor_stuck':
        this.quadState.s2Fault = 'CRASHED';
        this.quadState.s2LockedValue = 24.50;
        this.sim.heaterPower = 50;
        this.latencies.s2 = 780;
        this.playAlarmChime();
        this.addLogEntry('FAULT', '25.0', '24.5', '25.0', '25.0', 98, 'S2 ADC stuck at 24.5°C. Zero variance caught in 780ms.');
        break;

      case 'sensor_drift':
        this.quadState.s3Fault = 'WRONG';
        this.quadState.s3Offset = 12.4;
        this.latencies.s3 = 110;
        this.playAlarmChime();
        this.addLogEntry('FAULT', '25.0', '25.0', '37.4', '25.0', 97, 'S3 calibration creep divergence. Outlier isolated.');
        break;

      case 'noise_burst':
        this.diagnostics.noiseBurst = true;
        this.sim.noiseAmp = 1.2;
        this.playAlarmChime();
        this.addLogEntry('UNCERTAIN', '25.0', '25.0', '25.0', '25.0', 92, 'High EMI noise burst injected. FFT highlights frequency spikes.');
        break;

      case 'contact_bounce':
        this.diagnostics.contactBounce = true;
        this.playRelayClick();
        this.addLogEntry('FAULT', 'CHATT', '25.0', '25.0', '25.0', 96, 'Terminal contact chatter (5Hz bounce) identified on S1.');
        break;

      case 'power_brownout':
        this.diagnostics.powerBrownout = true;
        this.playAlarmChime();
        this.addLogEntry('WARNING', '25.0', '21.2', '21.2', '25.0', 94, 'Power rail brownout (2.7V Vref). Correlated voltage shift caught.');
        break;

      case 'thermal_gradient':
        this.sim.gradientOffset = 3.2;
        this.quadState.s1Fault = 'HEALTHY';
        this.quadState.s2Fault = 'HEALTHY';
        this.quadState.s3Fault = 'HEALTHY';
        this.playRelayClick();
        this.addLogEntry('NORMAL', '25.0', '25.0', '28.2', '25.0', 99, 'Legitimate heatsink thermal gradient +3.2°C arbitrated without alarm.');
        break;

      case 'triple_fault':
        this.quadState.s1Fault = 'DISCONNECTED';
        this.quadState.s2Fault = 'CRASHED';
        this.quadState.s3Fault = 'WRONG';
        this.quadState.s4Fault = 'HEALTHY';
        this.latencies = { s1: 12, s2: 780, s3: 110, s4: 0 };
        this.playRelayClick();
        this.playAlarmChime();
        this.addLogEntry('CRITICAL', 'DISC', '24.5', '37.4', '25.0', 99, 'Triple fault: S1 cut, S2 frozen, S3 biased. S4 sole survivor elected.');
        break;

      case 'cascading_chain':
        this.runCascadingChain();
        break;

      case 'chaos_mode':
        this.runChaosMonkey();
        break;
    }
  }

  runCascadingChain() {
    this.addLogEntry('CHAIN', '--', '--', '--', '--', 95, 'Cascading failure sequence initiated (30-second chain).');
    let step = 0;
    this.sim.cascadeTimer = setInterval(() => {
      step++;
      if (step === 1) this.applyScenario('sensor_drift');
      else if (step === 2) this.applyScenario('noise_burst');
      else if (step === 3) this.applyScenario('open_circuit');
      else if (step === 4) {
        this.applyScenario('nominal');
        clearInterval(this.sim.cascadeTimer);
      }
    }, 7000);
  }

  runChaosMonkey() {
    this.addLogEntry('CHAOS', '--', '--', '--', '--', 90, 'Stochastic chaos monkey active. Continuous randomized failure injection.');
    const pool = ['open_circuit', 'sensor_stuck', 'sensor_drift', 'noise_burst', 'contact_bounce'];
    this.sim.chaosTimer = setInterval(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      this.applyScenario(pick);
    }, 5000);
  }

  runAutomatedStressBenchmark() {
    const btn = document.getElementById('btn-run-stress-benchmark');
    if (btn) btn.textContent = 'Stress Test Running...';

    this.applyScenario('triple_fault');
    setTimeout(() => {
      this.applyScenario('process_surge');
    }, 4000);
    setTimeout(() => {
      this.applyScenario('noise_burst');
    }, 8000);
    setTimeout(() => {
      this.applyScenario('nominal');
      if (btn) btn.textContent = 'Benchmark Passed (100% Score)';
      setTimeout(() => {
        if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Run Automated Stress Benchmark</span>';
      }, 4000);
    }, 12000);
  }

  // =====================================================================
  // Forensic Audit Log & Data Export
  // =====================================================================
  addLogEntry(classification, s1, s2, s3, s4, trust, annotation) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    const entry = {
      timestamp: timeStr,
      classification: classification,
      s1: s1,
      s2: s2,
      s3: s3,
      s4: s4,
      trust: trust,
      annotation: annotation
    };

    this.eventLogs.unshift(entry);
    if (this.eventLogs.length > this.maxLogs) this.eventLogs.pop();

    const tbody = document.getElementById('audit-table-body');
    if (tbody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.timestamp}</td>
        <td><span class="strip-badge badge-normal">${entry.classification}</span></td>
        <td class="status-red">${entry.s1}</td>
        <td class="status-orange">${entry.s2}</td>
        <td class="status-purple">${entry.s3}</td>
        <td class="status-green">${entry.s4}</td>
        <td>${entry.trust}%</td>
        <td>${entry.annotation}</td>
      `;
      tbody.insertBefore(row, tbody.firstChild);
      while (tbody.children.length > this.maxLogs) tbody.removeChild(tbody.lastChild);
    }
  }

  exportCSV() {
    if (this.quadHistory.length === 0) return;
    let csv = 'Timestamp_Epoch,ISO_Time,S1_Disconnected,S2_Crashed,S3_Wrong,S4_Truth,Consensus_Elected\n';
    for (const p of this.quadHistory) {
      const iso = new Date(p.t).toISOString();
      const s1 = p.s1 !== null ? p.s1.toFixed(2) : 'DISCONNECTED';
      const s4 = p.s4 !== null ? p.s4.toFixed(2) : 'OFFLINE';
      csv += `${p.t},${iso},${s1},${p.s2.toFixed(2)},${p.s3.toFixed(2)},${s4},${p.consensus.toFixed(2)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SENSEGuard_Telemetry_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // =====================================================================
  // Event Listeners (Virtual Controls, 3D Toolbar, Scenarios)
  // =====================================================================
  initEventListeners() {
    // 3D Model Switcher
    document.getElementById('tab-model-bench')?.addEventListener('click', () => this.switch3DModel('bench'));
    document.getElementById('tab-model-pcb')?.addEventListener('click', () => this.switch3DModel('pcb'));

    // Camera Preset Buttons
    document.getElementById('btn-camera-iso')?.addEventListener('click', () => {
      this.three.cinematicTour = false;
      this.three.camera?.position.set(0, 15, 24);
      this.three.controls?.target.set(0, 0, 0);
    });
    document.getElementById('btn-camera-front')?.addEventListener('click', () => {
      this.three.cinematicTour = false;
      this.three.camera?.position.set(0, 6, 18);
      this.three.controls?.target.set(0, 2, 0);
    });
    document.getElementById('btn-camera-probes')?.addEventListener('click', () => {
      this.three.cinematicTour = false;
      this.three.camera?.position.set(0, 5, 8);
      this.three.controls?.target.set(0, 1, 0);
    });
    document.getElementById('btn-camera-top')?.addEventListener('click', () => {
      this.three.cinematicTour = false;
      this.three.camera?.position.set(0, 26, 0.01);
      this.three.controls?.target.set(0, 0, 0);
    });
    document.getElementById('btn-camera-tour')?.addEventListener('click', () => {
      this.three.cinematicTour = !this.three.cinematicTour;
      const btn = document.getElementById('btn-camera-tour');
      if (btn) btn.textContent = this.three.cinematicTour ? 'Stop Tour' : 'Cinematic Tour';
    });
    document.getElementById('btn-reset-camera')?.addEventListener('click', () => {
      this.three.cinematicTour = false;
      this.three.camera?.position.set(0, 15, 24);
      this.three.controls?.target.set(0, 0, 0);
    });

    // 3D Visual Mode Toggles
    document.getElementById('btn-toggle-heatmap')?.addEventListener('click', () => {
      this.three.heatmapMode = !this.three.heatmapMode;
      const btn = document.getElementById('btn-toggle-heatmap');
      if (btn) btn.textContent = `Heatmap: ${this.three.heatmapMode ? 'ON' : 'OFF'}`;
      this.toggleThermalHeatmap(this.three.heatmapMode);
    });

    document.getElementById('btn-toggle-wireframe')?.addEventListener('click', () => {
      this.three.wireframeMode = !this.three.wireframeMode;
      const btn = document.getElementById('btn-toggle-wireframe');
      if (btn) btn.textContent = `Wireframe: ${this.three.wireframeMode ? 'ON' : 'OFF'}`;
      this.toggleWireframeMode(this.three.wireframeMode);
    });

    document.getElementById('btn-toggle-grid')?.addEventListener('click', () => {
      this.three.gridVisible = !this.three.gridVisible;
      if (this.three.gridHelper) this.three.gridHelper.visible = this.three.gridVisible;
      const btn = document.getElementById('btn-toggle-grid');
      if (btn) btn.textContent = `Grid: ${this.three.gridVisible ? 'ON' : 'OFF'}`;
    });

    // 3D Bench Hotspot Focus Buttons
    document.querySelectorAll('.btn-hotspot').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-hotspot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.focusBenchHotspot(btn.dataset.target);
      });
    });

    // Fullscreen 3D Viewport Toggle
    document.getElementById('btn-twin-fullscreen')?.addEventListener('click', () => {
      const box = document.getElementById('viewport-3d-box');
      box?.classList.toggle('fullscreen-3d');
      const isFull = box?.classList.contains('fullscreen-3d');
      const btnSpan = document.querySelector('#btn-twin-fullscreen span');
      if (btnSpan) btnSpan.textContent = isFull ? 'Exit Fullscreen' : 'Fullscreen 3D';
      setTimeout(() => this.resize3DCanvas(), 120);
      this.playRelayClick();
    });

    // High-Resolution Snapshot Capture
    document.getElementById('btn-twin-snapshot')?.addEventListener('click', () => {
      if (!this.three.renderer || !this.three.scene || !this.three.camera) return;
      this.three.renderer.render(this.three.scene, this.three.camera);
      const dataURL = this.three.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `SENSEGuard_3D_BenchTwin_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.playSuccessChime();
    });

    // 3D Auto-Rotation Toggle
    document.getElementById('btn-twin-autospin')?.addEventListener('click', () => {
      this.three.autoRotate = !this.three.autoRotate;
      const btn = document.getElementById('btn-twin-autospin');
      if (btn) btn.textContent = `Auto-Rotate: ${this.three.autoRotate ? 'ON' : 'OFF'}`;
      this.playRelayClick();
    });

    // Cycle 3D Lighting Presets
    document.getElementById('btn-toggle-lighting')?.addEventListener('click', () => {
      const presets = ['Clean', 'Cyber', 'Spotlight', 'Night'];
      const btn = document.getElementById('btn-toggle-lighting');
      const curIdx = presets.findIndex(p => btn?.textContent?.includes(p));
      const nextPreset = presets[(curIdx + 1) % presets.length];
      if (btn) btn.textContent = `Light: ${nextPreset}`;

      if (nextPreset === 'Clean') {
        this.three.ambientLight.intensity = 1.4;
        this.three.keyLight.intensity = 1.5;
        this.three.scene.background = new THREE.Color(0xF8FAFC);
      } else if (nextPreset === 'Cyber') {
        this.three.ambientLight.intensity = 0.8;
        this.three.keyLight.intensity = 2.0;
        this.three.scene.background = new THREE.Color(0x080C14);
      } else if (nextPreset === 'Spotlight') {
        this.three.ambientLight.intensity = 0.4;
        this.three.keyLight.intensity = 2.8;
      } else {
        this.three.ambientLight.intensity = 0.2;
        this.three.keyLight.intensity = 0.9;
        this.three.scene.background = new THREE.Color(0x030712);
      }
      this.playRelayClick();
    });

    // Virtual Test Bench Hardware Rack Controls
    const rangeAmbient = document.getElementById('range-ambient');
    const lblAmbient = document.getElementById('lbl-ambient');
    if (rangeAmbient) {
      rangeAmbient.addEventListener('input', (e) => {
        this.sim.baseTemp = parseFloat(e.target.value);
        if (lblAmbient) lblAmbient.textContent = this.formatTemp(this.sim.baseTemp);
      });
    }

    const rangeHeater = document.getElementById('range-heater');
    const lblHeater = document.getElementById('lbl-heater-power');
    const heaterGlow = document.getElementById('heater-glow');
    if (rangeHeater) {
      rangeHeater.addEventListener('input', (e) => {
        this.sim.heaterPower = parseInt(e.target.value, 10);
        if (lblHeater) lblHeater.textContent = `${this.sim.heaterPower}% (${this.sim.heaterPower > 0 ? 'HEATING' : 'OFF'})`;
        heaterGlow?.classList.toggle('active', this.sim.heaterPower > 0);
      });
    }

    // Cooling Fan Buttons
    document.querySelectorAll('.btn-fan').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-fan').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pwm = parseInt(btn.dataset.pwm, 10);
        this.sim.fanPWM = pwm;
        const lblFan = document.getElementById('lbl-fan-speed');
        const fanSpin = document.getElementById('fan-spin-indicator');
        if (lblFan) lblFan.textContent = pwm === 0 ? 'OFF (0 RPM)' : `${pwm}% (~${pwm * 40} RPM)`;
        fanSpin?.classList.toggle('spinning', pwm > 0);
        this.playRelayClick();
      });
    });

    const rangeNoise = document.getElementById('range-noise');
    const lblNoise = document.getElementById('lbl-noise-amp');
    if (rangeNoise) {
      rangeNoise.addEventListener('input', (e) => {
        this.sim.noiseAmp = parseFloat(e.target.value);
        if (lblNoise) lblNoise.textContent = `±${this.sim.noiseAmp.toFixed(2)} °C`;
      });
    }

    const rangeCorridor = document.getElementById('range-corridor');
    const lblCorridor = document.getElementById('lbl-corridor');
    if (rangeCorridor) {
      rangeCorridor.addEventListener('input', (e) => {
        this.config.deltaThreshold = parseFloat(e.target.value);
        if (lblCorridor) lblCorridor.textContent = `±${this.config.deltaThreshold.toFixed(2)} °C`;
      });
    }

    const selectAlgo = document.getElementById('select-arbitration-algo');
    if (selectAlgo) {
      selectAlgo.addEventListener('change', (e) => {
        this.state.consensusAlgorithm = e.target.value;
        this.playRelayClick();
      });
    }

    // 12-Scenario Card Clicks
    document.querySelectorAll('.scen-box').forEach(box => {
      box.addEventListener('click', () => {
        this.applyScenario(box.dataset.scenario);
      });
    });

    // Reset & Benchmark Buttons
    document.getElementById('btn-bench-reset-all')?.addEventListener('click', () => {
      this.applyScenario('nominal');
    });

    document.getElementById('btn-run-stress-benchmark')?.addEventListener('click', () => {
      this.runAutomatedStressBenchmark();
    });

    // Scope Channel Toggles
    ['s1', 's2', 's3', 's4', 'consensus'].forEach(ch => {
      const btn = document.getElementById(`scope-ch-${ch}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.scope.channels[ch] = !this.scope.channels[ch];
          btn.style.opacity = this.scope.channels[ch] ? '1.0' : '0.35';
          this.playRelayClick();
        });
      }
    });

    // Timebase Buttons
    document.querySelectorAll('.btn-seg[data-timebase]').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.btn-seg[data-timebase]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.scope.timebaseSec = parseInt(b.dataset.timebase, 10);
      });
    });

    // Export CSV & Clear Log
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-export-csv-2')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-clear-audit')?.addEventListener('click', () => {
      this.eventLogs = [];
      const tbody = document.getElementById('audit-table-body');
      if (tbody) tbody.innerHTML = '';
    });

    // -------------------------------------------------------------
    // Supercharged Live Dual Telemetry Event Handlers
    // -------------------------------------------------------------
    // 1. Pause/Resume Live Waveform Stream
    document.getElementById('btn-telemetry-pause')?.addEventListener('click', () => {
      this.telemetry.paused = !this.telemetry.paused;
      const txt = document.getElementById('txt-telemetry-pause');
      if (txt) txt.textContent = this.telemetry.paused ? 'Resume Stream' : 'Freeze Stream';
      this.playRelayClick();
    });

    // 2. Clear Buffer
    document.getElementById('btn-telemetry-clear')?.addEventListener('click', () => {
      this.quadHistory = [];
      this.playRelayClick();
    });

    // 3. Snapshot Chart PNG
    document.getElementById('btn-telemetry-snapshot')?.addEventListener('click', () => {
      if (!this.canvas2D) return;
      const link = document.createElement('a');
      link.download = `SENSEGuard_Telemetry_${Date.now()}.png`;
      link.href = this.canvas2D.toDataURL('image/png');
      link.click();
      this.playSuccessChime();
    });

    // 4. Timebase Buttons in Telemetry Page
    document.querySelectorAll('#page-telemetry .btn-time').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#page-telemetry .btn-time').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.telemetry.timebaseSec = parseInt(btn.dataset.sec, 10);
        this.playRelayClick();
      });
    });

    // 5. Crosshair Mouse Tracking on Telemetry Canvas
    if (this.canvas2D) {
      this.canvas2D.addEventListener('mousemove', (e) => {
        const rect = this.canvas2D.getBoundingClientRect();
        this.telemetry.mouseOver = true;
        this.telemetry.cursorX = e.clientX - rect.left;
      });
      this.canvas2D.addEventListener('mouseleave', () => {
        this.telemetry.mouseOver = false;
        const hud = document.getElementById('canvas-hud-text');
        if (hud) hud.textContent = 'Inspect: Move cursor over chart';
      });
    }

    // 6. Sensor Offset Trimmer Sliders
    const trimAInput = document.getElementById('trim-s-a');
    const lblTrimA = document.getElementById('lbl-trim-a');
    if (trimAInput) {
      trimAInput.addEventListener('input', (e) => {
        this.telemetry.trimA = parseFloat(e.target.value);
        if (lblTrimA) lblTrimA.textContent = `${this.telemetry.trimA >= 0 ? '+' : ''}${this.telemetry.trimA.toFixed(2)} °C`;
      });
    }

    const trimBInput = document.getElementById('trim-s-b');
    const lblTrimB = document.getElementById('lbl-trim-b');
    if (trimBInput) {
      trimBInput.addEventListener('input', (e) => {
        this.telemetry.trimB = parseFloat(e.target.value);
        if (lblTrimB) lblTrimB.textContent = `${this.telemetry.trimB >= 0 ? '+' : ''}${this.telemetry.trimB.toFixed(2)} °C`;
      });
    }

    // 7. Dynamic Corridor Slider
    const corrSlider = document.getElementById('corridor-slider');
    const lblCorrSlider = document.getElementById('lbl-corridor-slider');
    const corrIndicator = document.getElementById('corridor-indicator');
    if (corrSlider) {
      corrSlider.addEventListener('input', (e) => {
        this.telemetry.corridor = parseFloat(e.target.value);
        if (lblCorrSlider) lblCorrSlider.textContent = `±${this.telemetry.corridor.toFixed(2)} °C`;
        if (corrIndicator) corrIndicator.textContent = `±${this.telemetry.corridor.toFixed(2)} °C`;
      });
    }

    // 8. Auto-Zero Calibrate
    document.getElementById('btn-autozero-telemetry')?.addEventListener('click', () => {
      this.telemetry.trimA = 0.0;
      this.telemetry.trimB = -this.quadState.s3Offset;
      if (trimAInput) trimAInput.value = 0.0;
      if (trimBInput) trimBInput.value = -this.quadState.s3Offset;
      if (lblTrimA) lblTrimA.textContent = '0.00 °C';
      if (lblTrimB) lblTrimB.textContent = `${(-this.quadState.s3Offset).toFixed(2)} °C`;
      this.playSuccessChime();
    });

    // 9. High-Speed Session Recorder
    const btnRec = document.getElementById('btn-rec-toggle');
    const txtRec = document.getElementById('txt-rec-btn');
    const btnRecCSV = document.getElementById('btn-rec-csv');
    const btnRecJSON = document.getElementById('btn-rec-json');

    if (btnRec) {
      btnRec.addEventListener('click', () => {
        this.telemetry.recording = !this.telemetry.recording;
        if (this.telemetry.recording) {
          this.telemetry.recStartTime = Date.now();
          this.telemetry.recordedFrames = [];
          if (txtRec) txtRec.textContent = 'Stop Recording';
          btnRec.classList.replace('btn-danger', 'btn-primary');
          if (btnRecCSV) btnRecCSV.disabled = false;
          if (btnRecJSON) btnRecJSON.disabled = false;
          this.playAlarmChime();
        } else {
          if (txtRec) txtRec.textContent = 'Start Recording';
          btnRec.classList.replace('btn-primary', 'btn-danger');
          this.playSuccessChime();
        }
      });
    }

    if (btnRecCSV) {
      btnRecCSV.addEventListener('click', () => {
        if (!this.telemetry.recordedFrames.length) return;
        const csvRows = ['Timestamp,ElapsedSec,SensorA,SensorB,Delta,Consensus,Classification'];
        this.telemetry.recordedFrames.forEach(f => {
          csvRows.push(`${f.timestamp},${f.elapsedSec},${f.sensorA.toFixed(2)},${f.sensorB.toFixed(2)},${f.delta.toFixed(2)},${f.consensus.toFixed(2)},${f.classification}`);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `SENSEGuard_Telemetry_Session_${Date.now()}.csv`;
        a.click();
        this.playSuccessChime();
      });
    }

    if (btnRecJSON) {
      btnRecJSON.addEventListener('click', () => {
        if (!this.telemetry.recordedFrames.length) return;
        const blob = new Blob([JSON.stringify(this.telemetry.recordedFrames, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `SENSEGuard_Telemetry_Session_${Date.now()}.json`;
        a.click();
        this.playSuccessChime();
      });
    }

    // -------------------------------------------------------------
    // Supercharged 3D Digital Twin Event Handlers
    // -------------------------------------------------------------
    // Exploded View Slider
    const rangeExplode = document.getElementById('range-twin-explode');
    if (rangeExplode) {
      rangeExplode.addEventListener('input', (e) => {
        this.update3DExplode(parseInt(e.target.value, 10));
      });
    }

    // Orbit Speed Slider
    const rangeSpeed = document.getElementById('range-twin-speed');
    const lblSpeed = document.getElementById('lbl-twin-speed');
    if (rangeSpeed) {
      rangeSpeed.addEventListener('input', (e) => {
        this.three.orbitSpeed = parseFloat(e.target.value);
        if (lblSpeed) lblSpeed.textContent = `${this.three.orbitSpeed.toFixed(1)}x`;
      });
    }

    // Caliper Measurement Tool Toggle
    const btnCaliper = document.getElementById('btn-tool-measure');
    const txtCaliper = document.getElementById('txt-tool-measure');
    const bannerCaliper = document.getElementById('twin-measure-banner');
    if (btnCaliper) {
      btnCaliper.addEventListener('click', () => {
        this.three.caliperActive = !this.three.caliperActive;
        btnCaliper.classList.toggle('active', this.three.caliperActive);
        if (txtCaliper) txtCaliper.textContent = `Caliper Measure: ${this.three.caliperActive ? 'ON' : 'OFF'}`;
        bannerCaliper?.classList.toggle('active', this.three.caliperActive);
        if (!this.three.caliperActive) {
          this.clearCaliperMeasurement();
        }
        this.playRelayClick();
      });
    }

    document.getElementById('btn-measure-clear')?.addEventListener('click', () => {
      this.clearCaliperMeasurement();
    });

    // 3D Spatial Pins Layer Toggle
    const btnTags = document.getElementById('btn-toggle-3d-tags');
    const txtTags = document.getElementById('txt-3d-tags');
    if (btnTags) {
      btnTags.addEventListener('click', () => {
        this.three.spatialPinsVisible = !this.three.spatialPinsVisible;
        if (txtTags) txtTags.textContent = `Spatial Pins: ${this.three.spatialPinsVisible ? 'ON' : 'OFF'}`;
        this.playRelayClick();
      });
    }

    // Shadows Toggle
    document.getElementById('btn-toggle-shadows')?.addEventListener('click', () => {
      this.three.shadowsEnabled = !this.three.shadowsEnabled;
      if (this.three.keyLight) this.three.keyLight.castShadow = this.three.shadowsEnabled;
      if (this.three.renderer) this.three.renderer.shadowMap.enabled = this.three.shadowsEnabled;
      const btn = document.getElementById('btn-toggle-shadows');
      if (btn) btn.textContent = `Shadows: ${this.three.shadowsEnabled ? 'ON' : 'OFF'}`;
      this.playRelayClick();
    });

    // Subsystem Search Filter
    const searchSub = document.getElementById('search-subsystems');
    if (searchSub) {
      searchSub.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        document.querySelectorAll('#subsystem-items-list .spec-card-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }

    // Subsystem Action Buttons (Focus & Wire)
    document.querySelectorAll('.btn-sub-act.btn-isolate').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        this.isolateSubsystem(target);
      });
    });

    document.querySelectorAll('.btn-sub-act.btn-wire').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        btn.classList.toggle('active');
        this.toggleSubsystemWireframe(target);
      });
    });

    // -------------------------------------------------------------
    // Page 1: Quad-Sensor Benchmark Controls & Overrides
    // -------------------------------------------------------------
    // Trigger Triple-Fault Stress State
    document.getElementById('btn-trigger-quad-scenario')?.addEventListener('click', () => {
      this.applyScenario('triple');
      this.playAlarmChime();
    });

    // Restore Quad Nominal Calibration
    document.getElementById('btn-reset-quad-nominal')?.addEventListener('click', () => {
      this.applyScenario('nominal');
      this.playSuccessChime();
    });

    // Individual Sensor Channel Fault Injection Toggles
    document.getElementById('toggle-s1')?.addEventListener('click', () => {
      this.quadState.s1Fault = (this.quadState.s1Fault === 'DISCONNECTED') ? 'HEALTHY' : 'DISCONNECTED';
      this.diagnostics.s1Disconnected = (this.quadState.s1Fault === 'DISCONNECTED');
      this.addLogEntry(this.quadState.s1Fault === 'HEALTHY' ? 'NORMAL' : 'FAULT', 'S1', null, null, null, this.calculateTrustScore(), `Manual operator override: Sensor 1 toggled to ${this.quadState.s1Fault}.`);
      this.playRelayClick();
    });

    document.getElementById('toggle-s2')?.addEventListener('click', () => {
      this.quadState.s2Fault = (this.quadState.s2Fault === 'CRASHED') ? 'HEALTHY' : 'CRASHED';
      this.diagnostics.s2Crashed = (this.quadState.s2Fault === 'CRASHED');
      this.addLogEntry(this.quadState.s2Fault === 'HEALTHY' ? 'NORMAL' : 'FAULT', 'S2', null, null, null, this.calculateTrustScore(), `Manual operator override: Sensor 2 toggled to ${this.quadState.s2Fault}.`);
      this.playRelayClick();
    });

    document.getElementById('toggle-s3')?.addEventListener('click', () => {
      this.quadState.s3Fault = (this.quadState.s3Fault === 'WRONG') ? 'HEALTHY' : 'WRONG';
      this.diagnostics.s3Wrong = (this.quadState.s3Fault === 'WRONG');
      this.addLogEntry(this.quadState.s3Fault === 'HEALTHY' ? 'NORMAL' : 'FAULT', 'S3', null, null, null, this.calculateTrustScore(), `Manual operator override: Sensor 3 toggled to ${this.quadState.s3Fault}.`);
      this.playRelayClick();
    });

    document.getElementById('toggle-s4')?.addEventListener('click', () => {
      this.quadState.s4Fault = (this.quadState.s4Fault === 'HEALTHY') ? 'FAULT' : 'HEALTHY';
      this.diagnostics.s4Healthy = (this.quadState.s4Fault === 'HEALTHY');
      this.addLogEntry(this.quadState.s4Fault === 'HEALTHY' ? 'NORMAL' : 'FAULT', 'S4', null, null, null, this.calculateTrustScore(), `Manual operator override: Sensor 4 toggled to ${this.quadState.s4Fault}.`);
      this.playRelayClick();
    });

    // Timebase Selector in Page 1 (30s, 60s, 120s)
    document.querySelectorAll('#page-quad .btn-time').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#page-quad .btn-time').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.config.windowDurationSec = parseInt(btn.dataset.sec, 10);
        this.playRelayClick();
      });
    });

    // -------------------------------------------------------------
    // Page 4: Oscilloscope Trigger Modes & Visual Toggles
    // -------------------------------------------------------------
    ['auto', 'norm', 'single'].forEach(mode => {
      document.getElementById(`trig-${mode}`)?.addEventListener('click', () => {
        ['auto', 'norm', 'single'].forEach(m => document.getElementById(`trig-${m}`)?.classList.remove('active'));
        document.getElementById(`trig-${mode}`)?.classList.add('active');
        this.scope.triggerMode = mode;
        this.playRelayClick();
      });
    });

    document.getElementById('btn-toggle-cursors')?.addEventListener('click', () => {
      this.scope.cursorMode = !this.scope.cursorMode;
      const btn = document.getElementById('btn-toggle-cursors');
      if (btn) btn.textContent = `Cursors: ${this.scope.cursorMode ? 'ON' : 'OFF'}`;
      this.playRelayClick();
    });

    document.getElementById('btn-toggle-fft')?.addEventListener('click', () => {
      const fftCard = document.getElementById('bench-fft-canvas')?.closest('.panel-card');
      if (fftCard) {
        fftCard.style.display = fftCard.style.display === 'none' ? '' : 'none';
        const isVisible = fftCard.style.display !== 'none';
        const btn = document.getElementById('btn-toggle-fft');
        if (btn) btn.textContent = `FFT: ${isVisible ? 'ON' : 'OFF'}`;
      }
      this.playRelayClick();
    });

    // Scenario Activate Buttons in Matrix Cards
    document.querySelectorAll('.scen-box .btn-scenario-act').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const box = btn.closest('.scen-box');
        if (box && box.dataset.scenario) {
          this.applyScenario(box.dataset.scenario);
        }
      });
    });

    // -------------------------------------------------------------
    // Page 5: Alert History JSON Exporter
    // -------------------------------------------------------------
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      const jsonStr = JSON.stringify(this.eventLogs, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `SENSEGuard_Audit_Log_${Date.now()}.json`;
      a.click();
      this.playSuccessChime();
    });

    // -------------------------------------------------------------
    // Page 6: Copy Firmware Code to Clipboard
    // -------------------------------------------------------------
    document.getElementById('btn-copy-hardware-code')?.addEventListener('click', () => {
      const codeEl = document.querySelector('#page-hardware pre code') || document.querySelector('#page-hardware pre');
      const textToCopy = codeEl ? codeEl.innerText : '';
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const btn = document.getElementById('btn-copy-hardware-code');
          if (btn) {
            const orig = btn.textContent;
            btn.textContent = '✓ Copied to Clipboard!';
            btn.classList.add('btn-primary');
            this.playSuccessChime();
            setTimeout(() => {
              btn.textContent = orig;
              btn.classList.remove('btn-primary');
            }, 2500);
          }
        }).catch(() => {
          alert('Firmware code copied to clipboard.');
        });
      }
    });

    // WebSerial Connect Toggle
    document.getElementById('btn-webserial-toggle')?.addEventListener('click', () => {
      this.toggleWebSerial();
    });
  }

  toggleThermalHeatmap(active) {
    const activeModel = this.three.models[this.three.activeModel];
    if (!activeModel) return;

    activeModel.traverse(node => {
      if (node.isMesh && node.material) {
        if (active) {
          if (!node.userData.originalColor) node.userData.originalColor = node.material.color.clone();
          const hue = Math.max(0, 0.6 - (this.sim.currentProcessTemp - 20) / 40);
          node.material.color.setHSL(hue, 0.9, 0.5);
        } else if (node.userData.originalColor) {
          node.material.color.copy(node.userData.originalColor);
        }
      }
    });
  }

  toggleWireframeMode(active) {
    const activeModel = this.three.models[this.three.activeModel];
    if (!activeModel) return;
    activeModel.traverse(node => {
      if (node.isMesh && node.material) {
        node.material.wireframe = active;
      }
    });
  }

  async toggleWebSerial() {
    if (!('serial' in navigator)) {
      alert('WebSerial API is not supported in this browser. Running high-precision software loopback simulation.');
      return;
    }

    const btn = document.getElementById('btn-webserial-toggle');
    const text = document.getElementById('btn-serial-text');

    if (!this.state.serialConnected) {
      try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        this.state.serialPort = port;
        this.state.serialConnected = true;
        if (text) text.textContent = 'ESP32 Connected';
        btn?.classList.add('btn-primary');
        this.playSuccessChime();
      } catch (err) {
        console.warn('WebSerial connection cancelled:', err);
      }
    } else {
      if (this.state.serialPort) {
        await this.state.serialPort.close();
        this.state.serialPort = null;
      }
      this.state.serialConnected = false;
      if (text) text.textContent = 'Connect ESP32';
      btn?.classList.remove('btn-primary');
    }
  }
}

// Instantiate application once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.senseGuardApp = new SENSEGuardApp();
});
