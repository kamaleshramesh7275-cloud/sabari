/**
 * SENSEGuard — Interactive Sensor Fault & Integrity Dashboard
 * Team BYTECRAFT • Ideathon 10.0 (AICF)
 * 
 * Quad-Sensor Multi-Fault Engine:
 * 1 Disconnected, 1 Crashed, 1 Wrong Reading, 1 Successfully (Ground Truth)
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
      activeScenario: 'quad_benchmark',
      activePage: 'page-quad',
      source: 'SIMULATOR',
      serialPort: null,
      serialReader: null,
      serialConnected: false,
      detectionLatencyMs: 78
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
      processSurge: false
    };

    this.telemetryHistory = [];
    this.quadHistory = [];
    this.maxHistoryPoints = this.config.sampleRateHz * 120;
    this.totalLoggedCount = 0;
    this.deltaSum = 0;

    this.sim = {
      baseTemp: 24.85,
      currentProcessTemp: 24.85,
      driftOffsetB: 0.0,
      sensorAOverride: null,
      sensorBOverride: null,
      noiseAmp: 0.08,
      surgeTarget: null
    };

    this.eventLogs = [];
    this.maxLogs = 100;
    this.lastLoggedState = null;

    // Canvases
    this.canvas2D = document.getElementById('telemetry-canvas');
    this.ctx2D = this.canvas2D ? this.canvas2D.getContext('2d') : null;
    this.canvasQuad = document.getElementById('quad-canvas');
    this.ctxQuad = this.canvasQuad ? this.canvasQuad.getContext('2d') : null;
    this.hoverPoint = null;
    this.hoverQuadPoint = null;

    // Three.js 3D Digital Twin
    this.three = {
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      model: null,
      lightA: null,
      lightB: null,
      lightC: null,
      lightD: null,
      isLoaded: false
    };

    this.initNavigation();
    this.initCanvases();
    this.init3DDigitalTwin();
    this.initEventListeners();
    this.initSimulationLoop();
    this.initRenderLoops();

    this.addLogEntry('NORMAL', 'DISC', 24.50, 37.25, 24.85, 99, 'Quad arbitration benchmark active: S1 Disconnected, S2 Crashed, S3 Outlier, S4 Governs.');
  }

  // =====================================================================
  // Navigation
  // =====================================================================
  initNavigation() {
    const tabs = document.querySelectorAll('.nav-button');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchPage(tab.dataset.page);
      });
    });
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
    }
  }

  // =====================================================================
  // Signal Processing & Multi-Sensor Arbitration
  // =====================================================================
  processSample(rawA, rawB, timestamp = Date.now()) {
    // Quad Sensor Calculations
    const trueProcess = this.sim.currentProcessTemp + (Math.random() - 0.5) * 0.05;

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

    // S4: Successful Ground Truth
    let valS4 = trueProcess + (Math.random() - 0.5) * 0.06;
    if (this.quadState.s4Fault === 'FAULT') {
      valS4 = null;
    }

    // SENSEGuard Arbitration & Isolation Logic:
    this.diagnostics.s1Disconnected = (valS1 === null);
    this.diagnostics.s2Crashed = (this.quadState.s2Fault === 'CRASHED');
    this.diagnostics.s3Wrong = (Math.abs(valS3 - trueProcess) > 3.0);
    this.diagnostics.s4Healthy = (valS4 !== null && Math.abs(valS4 - trueProcess) < 1.0);

    // Elected consensus signal is Sensor 4!
    const electedConsensus = valS4 !== null ? valS4 : (valS2 !== null ? valS2 : 24.8);

    const quadPoint = {
      t: timestamp,
      s1: valS1,
      s2: valS2,
      s3: valS3,
      s4: valS4,
      consensus: electedConsensus
    };

    this.quadHistory.push(quadPoint);
    if (this.quadHistory.length > this.maxHistoryPoints) {
      this.quadHistory.shift();
    }

    // Dual-channel backward compatibility
    let valA = valS1 !== null ? valS1 : (valS4 !== null ? valS4 : 24.5);
    let valB = valS2 !== null ? valS2 : (valS4 !== null ? valS4 : 24.5);
    let delta = Math.abs(valA - valB);
    this.deltaSum += delta;

    this.totalLoggedCount++;

    // Update Quad UI
    this.updateQuadCards(quadPoint);
    this.updateGlobalStatusStrip(quadPoint);
    this.update3DOverlay(quadPoint);
    this.updateSummaryKPIs();
  }

  // =====================================================================
  // Quad-Sensor Cards UI
  // =====================================================================
  updateQuadCards(point) {
    // S1 Disconnected Card
    const elS1 = document.getElementById('val-s1');
    const badgeS1 = document.getElementById('badge-s1');
    const btnS1 = document.getElementById('toggle-s1');
    if (elS1) elS1.textContent = point.s1 !== null ? `${point.s1.toFixed(2)} °C` : 'DISC';
    if (badgeS1) {
      badgeS1.className = 'qcc-state-badge ' + (point.s1 !== null ? 'state-badge-s4' : 'state-badge-s1');
      badgeS1.textContent = point.s1 !== null ? 'CONNECTED' : 'DISCONNECTED';
    }
    if (btnS1) btnS1.textContent = point.s1 !== null ? 'Disconnect S1' : 'Reconnect S1';

    // S2 Crashed Card
    const elS2 = document.getElementById('val-s2');
    const badgeS2 = document.getElementById('badge-s2');
    const btnS2 = document.getElementById('toggle-s2');
    if (elS2) elS2.innerHTML = `${point.s2.toFixed(2)}<span class="unit">°C</span>`;
    if (badgeS2) {
      badgeS2.className = 'qcc-state-badge ' + (this.quadState.s2Fault === 'CRASHED' ? 'state-badge-s2' : 'state-badge-s4');
      badgeS2.textContent = this.quadState.s2Fault === 'CRASHED' ? 'CRASHED (FROZEN)' : 'HEALTHY (ACTIVE)';
    }
    if (btnS2) btnS2.textContent = this.quadState.s2Fault === 'CRASHED' ? 'Unfreeze S2' : 'Crash S2';

    // S3 Wrong Reading Card
    const elS3 = document.getElementById('val-s3');
    const badgeS3 = document.getElementById('badge-s3');
    const btnS3 = document.getElementById('toggle-s3');
    if (elS3) elS3.innerHTML = `${point.s3.toFixed(2)}<span class="unit">°C</span>`;
    if (badgeS3) {
      badgeS3.className = 'qcc-state-badge ' + (this.quadState.s3Fault === 'WRONG' ? 'state-badge-s3' : 'state-badge-s4');
      badgeS3.textContent = this.quadState.s3Fault === 'WRONG' ? 'WRONG READING' : 'CALIBRATED';
    }
    if (btnS3) btnS3.textContent = this.quadState.s3Fault === 'WRONG' ? 'Recalibrate S3' : 'Corrupt S3';

    // S4 Ground Truth Card
    const elS4 = document.getElementById('val-s4');
    const badgeS4 = document.getElementById('badge-s4');
    const btnS4 = document.getElementById('toggle-s4');
    if (elS4) elS4.innerHTML = point.s4 !== null ? `${point.s4.toFixed(2)}<span class="unit">°C</span>` : 'FAULT';
    if (badgeS4) {
      badgeS4.className = 'qcc-state-badge ' + (point.s4 !== null ? 'state-badge-s4' : 'state-badge-s1');
      badgeS4.textContent = point.s4 !== null ? 'HEALTHY • ELECTED' : 'OFFLINE';
    }
    if (btnS4) btnS4.textContent = point.s4 !== null ? 'Inject Fault S4' : 'Heal S4';

    // Footer metrics on quad canvas panel
    const consVal = document.getElementById('quad-consensus-val');
    if (consVal) consVal.textContent = `${point.consensus.toFixed(2)} °C`;
  }

  updateGlobalStatusStrip(point) {
    const processTemp = document.getElementById('global-process-temp');
    if (processTemp) processTemp.textContent = `${point.consensus.toFixed(2)} °C`;

    const isoRate = document.getElementById('global-isolation-rate');
    if (isoRate) {
      let isolatedCount = 0;
      if (this.diagnostics.s1Disconnected) isolatedCount++;
      if (this.diagnostics.s2Crashed) isolatedCount++;
      if (this.diagnostics.s3Wrong) isolatedCount++;
      isoRate.textContent = `${isolatedCount}/3 Isolated (${Math.round((isolatedCount / 3) * 100)}%)`;
    }
  }

  // =====================================================================
  // 3D Digital Twin Overlay (4 Probes)
  // =====================================================================
  update3DOverlay(point) {
    const valA = document.getElementById('twin-val-a');
    const valB = document.getElementById('twin-val-b');
    const valC = document.getElementById('twin-val-c');
    const valD = document.getElementById('twin-val-d');

    if (valA) valA.textContent = point.s1 !== null ? `${point.s1.toFixed(2)} °C` : 'DISCONNECTED';
    if (valB) valB.textContent = `${point.s2.toFixed(2)} °C`;
    if (valC) valC.textContent = `${point.s3.toFixed(2)} °C`;
    if (valD) valD.textContent = point.s4 !== null ? `${point.s4.toFixed(2)} °C` : 'OFFLINE';
  }

  updateSummaryKPIs() {
    const totalEl = document.getElementById('kpi-total-samples');
    if (totalEl) totalEl.textContent = this.totalLoggedCount;
  }

  // =====================================================================
  // Quad Waveform Canvas
  // =====================================================================
  initCanvases() {
    this.resizeQuadCanvas();
    this.resize2DCanvas();
    window.addEventListener('resize', () => {
      this.resizeQuadCanvas();
      this.resize2DCanvas();
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

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (this.quadHistory.length < 2) return;

    const windowPoints = this.config.windowDurationSec * this.config.sampleRateHz;
    const visibleData = this.quadHistory.slice(-windowPoints);
    if (visibleData.length < 2) return;

    // Y Axis scaling covering S1..S4 (S3 is ~38°C, truth is ~25°C)
    let minT = 18, maxT = 42;

    const padLeft = 48;
    const padRight = 18;
    const padTop = 18;
    const padBottom = 26;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const getX = (idx) => padLeft + (idx / (visibleData.length - 1)) * chartW;
    const getY = (val) => padTop + chartH - ((val - minT) / (maxT - minT)) * chartH;

    // Grid lines
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748B';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';

    const yStepCount = 5;
    for (let i = 0; i <= yStepCount; i++) {
      const yVal = minT + (i / yStepCount) * (maxT - minT);
      const yPos = getY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, yPos);
      ctx.lineTo(width - padRight, yPos);
      ctx.stroke();
      ctx.fillText(`${yVal.toFixed(0)}°`, padLeft - 6, yPos + 4);
    }

    // Time ticks
    ctx.textAlign = 'center';
    const xStepCount = 4;
    for (let i = 0; i <= xStepCount; i++) {
      const xPos = padLeft + (i / xStepCount) * chartW;
      const secAgo = Math.round(this.config.windowDurationSec * (1 - i / xStepCount));
      ctx.beginPath();
      ctx.moveTo(xPos, padTop);
      ctx.lineTo(xPos, height - padBottom);
      ctx.stroke();
      ctx.fillText(secAgo === 0 ? 'NOW' : `-${secAgo}s`, xPos, height - padBottom + 16);
    }

    // Trace S3: Wrong Reading (Purple #7C3AED)
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i);
      const y = getY(visibleData[i].s3);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Trace S2: Crashed / Frozen (Orange #EA580C)
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i);
      const y = getY(visibleData[i].s2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Trace S4: Successful Truth (Green #16A34A)
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      if (visibleData[i].s4 !== null) {
        const x = getX(i);
        const y = getY(visibleData[i].s4);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Trace S1: Disconnected (Red #DC2626) - flatline indicator at 19°C dashed if disconnected
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const val = visibleData[i].s1 !== null ? visibleData[i].s1 : 19.0;
      const x = getX(i);
      const y = getY(val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Elected Consensus (Blue dashed)
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i);
      const y = getY(visibleData[i].consensus);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair
    if (this.hoverQuadPoint && this.hoverQuadPoint.x >= padLeft && this.hoverQuadPoint.x <= width - padRight) {
      const fraction = (this.hoverQuadPoint.x - padLeft) / chartW;
      const dataIdx = Math.min(visibleData.length - 1, Math.max(0, Math.round(fraction * (visibleData.length - 1))));
      const sample = visibleData[dataIdx];

      ctx.strokeStyle = '#94A3B8';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(this.hoverQuadPoint.x, padTop);
      ctx.lineTo(this.hoverQuadPoint.x, height - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      const secAgo = ((Date.now() - sample.t) / 1000).toFixed(1);
      const s1Str = sample.s1 !== null ? `${sample.s1.toFixed(1)}°` : 'DISC';
      const hudEl = document.getElementById('quad-hud-text');
      if (hudEl) {
        hudEl.textContent = `-${secAgo}s ago | S1: ${s1Str} | S2 (Crashed): ${sample.s2.toFixed(1)}° | S3 (Wrong): ${sample.s3.toFixed(1)}° | S4 (Truth): ${sample.s4 !== null ? sample.s4.toFixed(1) + '°' : 'OFF'} | Elected: ${sample.consensus.toFixed(1)}°`;
      }
    }
  }

  drawWaveform() {
    if (!this.canvas2D || !this.ctx2D) return;
    const width = this.canvas2D.width / window.devicePixelRatio;
    const height = this.canvas2D.height / window.devicePixelRatio;
    const ctx = this.ctx2D;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    if (this.quadHistory.length < 2) return;
    const visibleData = this.quadHistory.slice(-300);

    let minT = 20, maxT = 32;
    const padLeft = 48, padRight = 18, padTop = 18, padBottom = 26;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const getX = (idx) => padLeft + (idx / (visibleData.length - 1)) * chartW;
    const getY = (val) => padTop + chartH - ((val - minT) / (maxT - minT)) * chartH;

    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const yVal = minT + (i / 5) * (maxT - minT);
      const yPos = getY(yVal);
      ctx.beginPath(); ctx.moveTo(padLeft, yPos); ctx.lineTo(width - padRight, yPos); ctx.stroke();
    }

    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < visibleData.length; i++) {
      const x = getX(i);
      const y = getY(visibleData[i].consensus);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // =====================================================================
  // Three.js 3D Viewport with 4 Probes
  // =====================================================================
  init3DDigitalTwin() {
    const canvas = document.getElementById('canvas-3d');
    const container = document.getElementById('viewport-3d-box');
    if (!canvas || !container) return;

    this.three.scene = new THREE.Scene();
    this.three.scene.background = new THREE.Color(0xF1F5F9);

    const rect = container.getBoundingClientRect();
    const aspect = (rect.width || 800) / (rect.height || 500);
    this.three.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.three.camera.position.set(0, 15, 24);

    this.three.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.three.renderer.setPixelRatio(window.devicePixelRatio);
    this.three.renderer.setSize(rect.width || 800, rect.height || 500);

    this.three.controls = new THREE.OrbitControls(this.three.camera, this.three.renderer.domElement);
    this.three.controls.enableDamping = true;
    this.three.controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.three.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(12, 22, 16);
    this.three.scene.add(keyLight);

    // 4 Point Lights for the 4 sensor probe pins
    this.three.lightA = new THREE.PointLight(0xDC2626, 3.0, 10); // Red
    this.three.lightA.position.set(-4, 2, 2);
    this.three.scene.add(this.three.lightA);

    this.three.lightB = new THREE.PointLight(0xEA580C, 3.0, 10); // Orange
    this.three.lightB.position.set(-4, 2, -2);
    this.three.scene.add(this.three.lightB);

    this.three.lightC = new THREE.PointLight(0x7C3AED, 3.0, 10); // Purple
    this.three.lightC.position.set(4, 2, -2);
    this.three.scene.add(this.three.lightC);

    this.three.lightD = new THREE.PointLight(0x16A34A, 3.0, 10); // Green
    this.three.lightD.position.set(4, 2, 2);
    this.three.scene.add(this.three.lightD);

    const gridHelper = new THREE.GridHelper(36, 36, 0x0284C7, 0xCBD5E1);
    gridHelper.position.y = -0.05;
    this.three.scene.add(gridHelper);

    const loader = new THREE.GLTFLoader();
    const loaderOverlay = document.getElementById('twin-loader');

    loader.load('circuit-board.glb', (gltf) => {
      this.three.model = gltf.scene;
      const box = new THREE.Box3().setFromObject(this.three.model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 14 / maxDim;
      this.three.model.scale.set(scale, scale, scale);

      const center = box.getCenter(new THREE.Vector3());
      this.three.model.position.x = -center.x * scale;
      this.three.model.position.y = -box.min.y * scale;
      this.three.model.position.z = -center.z * scale;

      this.three.scene.add(this.three.model);
      this.three.isLoaded = true;
      if (loaderOverlay) loaderOverlay.classList.add('loaded');
    }, undefined, () => {
      if (loaderOverlay) loaderOverlay.classList.add('loaded');
    });

    const animate3D = () => {
      requestAnimationFrame(animate3D);
      if (this.state.activePage === 'page-digital-twin') {
        this.three.controls.update();
        if (this.three.model && !this.three.controls.state) {
          this.three.model.rotation.y += 0.0015;
        }
        this.three.renderer.render(this.three.scene, this.three.camera);
      }
    };
    requestAnimationFrame(animate3D);

    window.addEventListener('resize', () => this.resize3DCanvas());
  }

  resize3DCanvas() {
    const container = document.getElementById('viewport-3d-box');
    if (!container || !this.three.renderer || !this.three.camera) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    this.three.camera.aspect = rect.width / rect.height;
    this.three.camera.updateProjectionMatrix();
    this.three.renderer.setSize(rect.width, rect.height);
  }

  // =====================================================================
  // Simulation Loop
  // =====================================================================
  initSimulationLoop() {
    const tickIntervalMs = 1000 / this.config.sampleRateHz;

    setInterval(() => {
      const now = Date.now();
      if (this.sim.surgeTarget !== null) {
        const diff = this.sim.surgeTarget - this.sim.currentProcessTemp;
        this.sim.currentProcessTemp += diff * 0.15;
      } else {
        const diff = this.sim.baseTemp - this.sim.currentProcessTemp;
        this.sim.currentProcessTemp += diff * 0.05;
      }

      this.sim.currentProcessTemp += (Math.random() - 0.5) * 0.04;
      this.processSample(24.8, 24.8, now);
    }, tickIntervalMs);
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
        <td class="status-orange">${entry.s2} °C</td>
        <td class="status-purple">${entry.s3} °C</td>
        <td class="status-green">${entry.s4} °C</td>
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
    a.download = `SENSEGuard_Quad_Telemetry_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // =====================================================================
  // Event Listeners & Quad Sandbox Toggles
  // =====================================================================
  initEventListeners() {
    // Quad Benchmark Scenario trigger
    document.getElementById('btn-trigger-quad-scenario')?.addEventListener('click', () => {
      this.quadState.s1Fault = 'DISCONNECTED';
      this.quadState.s2Fault = 'CRASHED';
      this.quadState.s3Fault = 'WRONG';
      this.quadState.s4Fault = 'HEALTHY';
      this.addLogEntry('NORMAL', 'DISC', 24.50, 37.20, 24.85, 99, 'Quad benchmark triggered: S1 Disconnected, S2 Crashed, S3 Outlier, S4 Governs.');
    });

    // Reset All 4 to Nominal
    document.getElementById('btn-reset-quad-nominal')?.addEventListener('click', () => {
      this.quadState.s1Fault = 'HEALTHY';
      this.quadState.s2Fault = 'HEALTHY';
      this.quadState.s3Fault = 'HEALTHY';
      this.quadState.s4Fault = 'HEALTHY';
      this.addLogEntry('NORMAL', '24.85', 24.85, 24.85, 24.85, 100, 'All 4 channels restored to nominal tracking baseline.');
    });

    // Individual Channel Toggles
    document.getElementById('toggle-s1')?.addEventListener('click', () => {
      this.quadState.s1Fault = (this.quadState.s1Fault === 'DISCONNECTED') ? 'HEALTHY' : 'DISCONNECTED';
    });

    document.getElementById('toggle-s2')?.addEventListener('click', () => {
      this.quadState.s2Fault = (this.quadState.s2Fault === 'CRASHED') ? 'HEALTHY' : 'CRASHED';
    });

    document.getElementById('toggle-s3')?.addEventListener('click', () => {
      this.quadState.s3Fault = (this.quadState.s3Fault === 'WRONG') ? 'HEALTHY' : 'WRONG';
    });

    document.getElementById('toggle-s4')?.addEventListener('click', () => {
      this.quadState.s4Fault = (this.quadState.s4Fault === 'HEALTHY') ? 'FAULT' : 'HEALTHY';
    });

    // Camera preset buttons
    document.getElementById('btn-camera-iso')?.addEventListener('click', () => {
      if (this.three.camera) { this.three.camera.position.set(0, 15, 20); this.three.controls.target.set(0, 0, 0); }
    });
    document.getElementById('btn-camera-top')?.addEventListener('click', () => {
      if (this.three.camera) { this.three.camera.position.set(0, 24, 0.1); this.three.controls.target.set(0, 0, 0); }
    });
    document.getElementById('btn-reset-camera')?.addEventListener('click', () => {
      if (this.three.camera) { this.three.camera.position.set(0, 15, 24); this.three.controls.target.set(0, 0, 0); }
    });

    // Export CSV
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-export-csv-2')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-clear-audit')?.addEventListener('click', () => {
      this.eventLogs = [];
      const tbody = document.getElementById('audit-table-body');
      if (tbody) tbody.innerHTML = '';
    });

    // Copy firmware code
    document.getElementById('btn-copy-hardware-code')?.addEventListener('click', () => {
      const code = document.getElementById('hardware-code-content').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy-hardware-code');
        btn.textContent = 'Code Copied to Clipboard';
        setTimeout(() => { btn.textContent = 'Copy Firmware Code'; }, 2000);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.senseGuardApp = new SENSEGuardApp();
});
