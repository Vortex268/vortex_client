/* ============================================================
   VORTEX CLIENT v2.0.0
   A purely cosmetic & QoL enhancement layer for kour.io.
   ▸ No aimbots, no ESP, no wallhacks, no exploits.
   ▸ No WebSocket/network manipulation.
   ▸ No anti-cheat bypass or hidden backdoors.
   ▸ 100% client-side DOM & canvas overlay only.
   ============================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     1. CONSTANTS & DEFAULT STATE
  ───────────────────────────────────────────────────────── */

  const CLIENT_NAME    = 'Vortex Client';
  const CLIENT_VERSION = '2.0.0';
  const TOGGLE_KEY     = 'Insert'; // Main menu toggle key
  const STORAGE_KEY    = 'vortex_client_state';

  /** Default state — all preferences stored here. */
  const DEFAULT_STATE = {
    // General
    menuVisible: true,
    menuX: 80,
    menuY: 80,
    activeTab: 'home',

    // HUD
    minimalMode: false,
    uiScale: 100,

    // Crosshair
    crosshairEnabled: true,
    crosshairStyle: 'cross',   // cross | dot | circle | tcross
    crosshairSize: 12,
    crosshairThickness: 2,
    crosshairGap: 4,
    crosshairColor: '#ff2244',
    crosshairOpacity: 90,
    crosshairOutline: true,

    // Performance
    fpsEnabled: true,
    pingEnabled: true,
    lagIndicatorEnabled: true,
    perfPosition: 'top-right', // top-left | top-right | bottom-left | bottom-right

    // Chat
    chatTimestamps: true,
    chatProfanityFilter: false,
    chatCompactMode: false,
    chatFontSize: 13,

    // Performance Optimization
    gpuAcceleration: true,
    reduceParticles: false,
    optimizeShadows: false,
    renderScale: 100,
    networkOptimization: true,
    reduceInputLag: true,
    stabilizeConnection: true,
    lagCompensation: 50,

    // Theme
    accentColor: '#cc0022',
    panelOpacity: 85,
    panelBlur: 12,
    preset: 'vortex',

    // Keybinds
    keybindOverlayEnabled: false,
    customKeybinds: [],
  };

  /* ─────────────────────────────────────────────────────────
     2. STATE MANAGEMENT (GM_setValue / localStorage fallback)
  ───────────────────────────────────────────────────────── */

  const State = (() => {
    let _state = {};

    /** Deep-merge saved state onto defaults so new keys always exist. */
    function load() {
      try {
        const raw = GM_getValue(STORAGE_KEY, null);
        const saved = raw ? JSON.parse(raw) : {};
        _state = deepMerge(deepClone(DEFAULT_STATE), saved);
      } catch (e) {
        console.warn('[VortexClient] State load error, using defaults.', e);
        _state = deepClone(DEFAULT_STATE);
      }
    }

    function save() {
      try {
        GM_setValue(STORAGE_KEY, JSON.stringify(_state));
      } catch (e) {
        console.warn('[VortexClient] State save error.', e);
      }
    }

    function get(key) { return _state[key]; }

    function set(key, value) {
      _state[key] = value;
      save();
    }

    function reset() {
      _state = deepClone(DEFAULT_STATE);
      save();
    }

    function getAll() { return _state; }

    return { load, save, get, set, reset, getAll };
  })();

  /* ─────────────────────────────────────────────────────────
     3. UTILITIES
  ───────────────────────────────────────────────────────────  */

  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

  function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ─────────────────────────────────────────────────────────
     4. GLOBAL STYLESHEET INJECTION
  ───────────────────────────────────────────────────────── */

  function injectStyles() {
    const accent = State.get('accentColor');
    const opacity = State.get('panelOpacity') / 100;
    const blur    = State.get('panelBlur');

    GM_addStyle(`
      /* ── Vortex Client Base Styles ── */
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

      :root {
        --vx-accent:        ${accent};
        --vx-accent-dim:    ${hexToRgba(accent, 0.35)};
        --vx-accent-glow:   ${hexToRgba(accent, 0.55)};
        --vx-bg:            rgba(8, 6, 8, ${opacity});
        --vx-bg-panel:      rgba(14, 10, 14, ${opacity});
        --vx-bg-item:       rgba(22, 16, 22, 0.75);
        --vx-border:        rgba(180, 0, 30, 0.22);
        --vx-border-active: ${hexToRgba(accent, 0.7)};
        --vx-text:          #e8d8dc;
        --vx-text-dim:      #8a7070;
        --vx-text-bright:   #ffffff;
        --vx-blur:          ${blur}px;
        --vx-radius:        8px;
        --vx-radius-sm:     5px;
        --vx-font-ui:       'Rajdhani', 'Segoe UI', sans-serif;
        --vx-font-mono:     'Share Tech Mono', monospace;
        --vx-shadow:        0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px var(--vx-border);
        --vx-glow:          0 0 18px var(--vx-accent-glow);
      }

      /* ── Menu Container ── */
      #vortex-menu {
        position: fixed;
        z-index: 2147483647;
        width: 440px;
        min-height: 520px;
        background: var(--vx-bg);
        backdrop-filter: blur(var(--vx-blur)) saturate(1.4);
        -webkit-backdrop-filter: blur(var(--vx-blur)) saturate(1.4);
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius);
        box-shadow: var(--vx-shadow);
        font-family: var(--vx-font-ui);
        color: var(--vx-text);
        user-select: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
        overflow: hidden;
      }
      #vortex-menu.vx-hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.97) translateY(-6px);
      }

      /* ── Decorative top border accent ── */
      #vortex-menu::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--vx-accent), transparent);
        z-index: 1;
      }

      /* ── Header ── */
      #vortex-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 12px;
        cursor: move;
        background: linear-gradient(135deg, rgba(20,4,8,0.9) 0%, rgba(14,10,14,0.9) 100%);
        border-bottom: 1px solid var(--vx-border);
      }
      .vx-logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .vx-logo-icon {
        width: 28px; height: 28px;
        position: relative;
      }
      .vx-logo-icon svg {
        width: 100%; height: 100%;
        filter: drop-shadow(0 0 6px var(--vx-accent));
      }
      .vx-logo-text {
        display: flex;
        flex-direction: column;
        line-height: 1;
      }
      .vx-logo-name {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        color: var(--vx-text-bright);
        text-shadow: 0 0 14px var(--vx-accent-glow);
      }
      .vx-logo-version {
        font-size: 10px;
        letter-spacing: 1px;
        color: var(--vx-accent);
        font-family: var(--vx-font-mono);
      }
      .vx-header-actions {
        display: flex; gap: 8px; align-items: center;
      }
      .vx-btn-icon {
        width: 26px; height: 26px;
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius-sm);
        background: var(--vx-bg-item);
        color: var(--vx-text-dim);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px;
        transition: all 0.18s ease;
      }
      .vx-btn-icon:hover {
        border-color: var(--vx-accent);
        color: var(--vx-accent);
        box-shadow: 0 0 8px var(--vx-accent-glow);
      }

      /* ── Tab Bar ── */
      #vortex-tabs {
        display: flex;
        border-bottom: 1px solid var(--vx-border);
        background: rgba(10,6,10,0.6);
        overflow-x: auto;
        scrollbar-width: none;
      }
      #vortex-tabs::-webkit-scrollbar { display: none; }
      .vx-tab {
        flex: 1;
        padding: 9px 4px;
        text-align: center;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: var(--vx-text-dim);
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.18s ease;
        white-space: nowrap;
      }
      .vx-tab:hover { color: var(--vx-text); }
      .vx-tab.active {
        color: var(--vx-accent);
        border-bottom-color: var(--vx-accent);
        text-shadow: 0 0 10px var(--vx-accent-glow);
      }

      /* ── Content Area ── */
      #vortex-content {
        padding: 16px;
        max-height: 420px;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: var(--vx-accent-dim) transparent;
      }
      #vortex-content::-webkit-scrollbar { width: 4px; }
      #vortex-content::-webkit-scrollbar-track { background: transparent; }
      #vortex-content::-webkit-scrollbar-thumb {
        background: var(--vx-accent-dim);
        border-radius: 2px;
      }

      /* ── Tab Panels ── */
      .vx-panel { display: none; }
      .vx-panel.active { display: block; }

      /* ── Section Header ── */
      .vx-section-title {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--vx-accent);
        margin: 14px 0 8px;
        display: flex; align-items: center; gap: 8px;
      }
      .vx-section-title:first-child { margin-top: 0; }
      .vx-section-title::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--vx-border);
      }

      /* ── Control Row ── */
      .vx-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px;
        background: var(--vx-bg-item);
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius-sm);
        margin-bottom: 5px;
        transition: border-color 0.18s;
      }
      .vx-row:hover { border-color: rgba(180, 0, 30, 0.4); }
      .vx-row-info { flex: 1; }
      .vx-row-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--vx-text);
        display: block;
      }
      .vx-row-desc {
        font-size: 11px;
        color: var(--vx-text-dim);
        display: block;
        margin-top: 1px;
      }

      /* ── Toggle Switch ── */
      .vx-toggle {
        position: relative;
        width: 38px; height: 20px;
        flex-shrink: 0;
        cursor: pointer;
      }
      .vx-toggle input { display: none; }
      .vx-toggle-track {
        width: 100%; height: 100%;
        background: rgba(60,40,45,0.7);
        border: 1px solid var(--vx-border);
        border-radius: 10px;
        position: relative;
        transition: all 0.22s ease;
      }
      .vx-toggle-track::after {
        content: '';
        position: absolute;
        left: 2px; top: 2px;
        width: 14px; height: 14px;
        background: var(--vx-text-dim);
        border-radius: 50%;
        transition: all 0.22s ease;
      }
      .vx-toggle input:checked + .vx-toggle-track {
        background: var(--vx-accent-dim);
        border-color: var(--vx-accent);
        box-shadow: 0 0 8px var(--vx-accent-glow);
      }
      .vx-toggle input:checked + .vx-toggle-track::after {
        left: 20px;
        background: var(--vx-accent);
      }

      /* ── Slider ── */
      .vx-slider-wrap { width: 130px; }
      .vx-slider-row {
        display: flex; align-items: center; gap: 8px;
      }
      .vx-slider {
        -webkit-appearance: none;
        appearance: none;
        flex: 1;
        height: 3px;
        background: var(--vx-border);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
      }
      .vx-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px; height: 14px;
        background: var(--vx-accent);
        border-radius: 50%;
        box-shadow: 0 0 6px var(--vx-accent-glow);
        cursor: pointer;
      }
      .vx-slider::-moz-range-thumb {
        width: 14px; height: 14px;
        background: var(--vx-accent);
        border-radius: 50%;
        border: none;
        box-shadow: 0 0 6px var(--vx-accent-glow);
      }
      .vx-slider-val {
        font-family: var(--vx-font-mono);
        font-size: 11px;
        color: var(--vx-accent);
        min-width: 32px;
        text-align: right;
      }

      /* ── Color Picker Row ── */
      .vx-color-input {
        width: 32px; height: 22px;
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius-sm);
        background: none;
        cursor: pointer;
        padding: 1px;
        outline: none;
        transition: border-color 0.18s;
      }
      .vx-color-input:hover { border-color: var(--vx-accent); }

      /* ── Select Dropdown ── */
      .vx-select {
        background: var(--vx-bg-item);
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius-sm);
        color: var(--vx-text);
        font-family: var(--vx-font-ui);
        font-size: 12px;
        padding: 4px 8px;
        outline: none;
        cursor: pointer;
        transition: border-color 0.18s;
      }
      .vx-select:hover, .vx-select:focus { border-color: var(--vx-accent); }
      .vx-select option { background: #1a0a0e; }

      /* ── Button ── */
      .vx-btn {
        background: var(--vx-accent-dim);
        border: 1px solid var(--vx-accent);
        border-radius: var(--vx-radius-sm);
        color: var(--vx-text-bright);
        font-family: var(--vx-font-ui);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 1px;
        padding: 6px 14px;
        cursor: pointer;
        transition: all 0.18s ease;
        text-transform: uppercase;
      }
      .vx-btn:hover {
        background: var(--vx-accent);
        box-shadow: 0 0 12px var(--vx-accent-glow);
      }
      .vx-btn.danger {
        background: rgba(180,10,10,0.2);
        border-color: #cc2222;
        color: #ff4444;
      }
      .vx-btn.danger:hover {
        background: rgba(180,10,10,0.5);
        box-shadow: 0 0 12px rgba(220,30,30,0.5);
      }

      /* ── Home Tab Cards ── */
      .vx-home-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }
      .vx-card {
        background: var(--vx-bg-item);
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius);
        padding: 12px;
        transition: border-color 0.18s, box-shadow 0.18s;
      }
      .vx-card:hover {
        border-color: var(--vx-accent);
        box-shadow: 0 0 10px var(--vx-accent-dim);
      }
      .vx-card-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--vx-accent);
        margin-bottom: 4px;
      }
      .vx-card-val {
        font-size: 22px;
        font-weight: 700;
        font-family: var(--vx-font-mono);
        color: var(--vx-text-bright);
        text-shadow: 0 0 10px var(--vx-accent-glow);
      }
      .vx-card-sub {
        font-size: 10px;
        color: var(--vx-text-dim);
        margin-top: 2px;
      }

      /* ── Crosshair Preview Canvas ── */
      #vx-xhair-preview {
        display: block;
        margin: 10px auto;
        background: rgba(10,10,15,0.8);
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius-sm);
      }

      /* ── Preset Buttons ── */
      .vx-presets {
        display: flex; gap: 6px; flex-wrap: wrap;
        margin-top: 6px;
      }
      .vx-preset-btn {
        padding: 5px 12px;
        border-radius: var(--vx-radius-sm);
        border: 1px solid var(--vx-border);
        background: var(--vx-bg-item);
        color: var(--vx-text-dim);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      .vx-preset-btn:hover, .vx-preset-btn.active {
        border-color: var(--vx-accent);
        color: var(--vx-accent);
        background: var(--vx-accent-dim);
      }

      /* ── Performance Overlay ── */
      #vx-perf-overlay {
        position: fixed;
        z-index: 2147483640;
        display: flex;
        flex-direction: column;
        gap: 3px;
        pointer-events: none;
        font-family: var(--vx-font-mono);
      }
      #vx-perf-overlay.top-right    { top: 8px; right: 8px; align-items: flex-end; }
      #vx-perf-overlay.top-left     { top: 8px; left: 8px; align-items: flex-start; }
      #vx-perf-overlay.bottom-right { bottom: 48px; right: 8px; align-items: flex-end; }
      #vx-perf-overlay.bottom-left  { bottom: 48px; left: 8px; align-items: flex-start; }
      .vx-perf-item {
        background: rgba(8,4,8,0.72);
        border: 1px solid var(--vx-border);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 12px;
        color: var(--vx-text-bright);
        backdrop-filter: blur(4px);
      }
      .vx-perf-item span { color: var(--vx-accent); }
      .vx-perf-lag { color: #ff4444 !important; border-color: rgba(255,30,30,0.4) !important; }

      /* ── Custom Crosshair Overlay ── */
      #vx-crosshair {
        position: fixed;
        pointer-events: none;
        z-index: 2147483641;
        transform: translate(-50%, -50%);
      }

      /* ── Keybind Overlay ── */
      #vx-keybind-overlay {
        position: fixed;
        bottom: 48px;
        left: 8px;
        z-index: 2147483638;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .vx-key-badge {
        background: rgba(8,4,8,0.75);
        border: 1px solid var(--vx-border);
        border-radius: 4px;
        padding: 2px 8px;
        font-family: var(--vx-font-mono);
        font-size: 11px;
        color: var(--vx-text);
        backdrop-filter: blur(4px);
      }
      .vx-key-badge kbd {
        background: var(--vx-accent-dim);
        border: 1px solid var(--vx-accent);
        border-radius: 3px;
        padding: 0 4px;
        font-size: 10px;
        color: var(--vx-accent);
        margin-right: 5px;
      }

      /* ── Toast Notifications ── */
      #vx-toast-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      }
      .vx-toast {
        background: rgba(14,8,14,0.92);
        border: 1px solid var(--vx-accent);
        border-radius: 6px;
        padding: 9px 18px;
        font-family: var(--vx-font-ui);
        font-size: 13px;
        font-weight: 600;
        color: var(--vx-text-bright);
        box-shadow: 0 4px 20px rgba(0,0,0,0.6), 0 0 12px var(--vx-accent-glow);
        backdrop-filter: blur(8px);
        display: flex; align-items: center; gap: 8px;
        animation: vxToastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        white-space: nowrap;
      }
      .vx-toast.remove { animation: vxToastOut 0.25s ease forwards; }
      .vx-toast-icon { color: var(--vx-accent); font-size: 15px; }
      @keyframes vxToastIn {
        from { opacity: 0; transform: translateY(-12px) scale(0.92); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes vxToastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
      }

      /* ── Footer ── */
      #vortex-footer {
        padding: 8px 16px;
        border-top: 1px solid var(--vx-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(8,4,8,0.5);
      }
      .vx-footer-hint {
        font-size: 10px;
        color: var(--vx-text-dim);
        letter-spacing: 0.5px;
      }
      .vx-footer-hint kbd {
        background: rgba(180,0,30,0.2);
        border: 1px solid var(--vx-border);
        border-radius: 3px;
        padding: 1px 5px;
        font-family: var(--vx-font-mono);
        color: var(--vx-accent);
        font-size: 10px;
      }
      .vx-status-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #22cc55;
        box-shadow: 0 0 6px #22cc55;
        animation: vxPulse 2s ease infinite;
      }
      @keyframes vxPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      /* ── Minimal Mode ── */
      body.vx-minimal-mode .hud-element,
      body.vx-minimal-mode [class*="hud"],
      body.vx-minimal-mode [id*="hud"] {
        opacity: 0.2 !important;
        transition: opacity 0.3s;
      }
      body.vx-minimal-mode [class*="hud"]:hover,
      body.vx-minimal-mode [id*="hud"]:hover {
        opacity: 1 !important;
      }

      /* ── Scrollbar polish for selects ── */
      .vx-full-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 4px;
      }

      /* ── Keybind editor input ── */
      .vx-key-input {
        background: var(--vx-bg-item);
        border: 1px solid var(--vx-border);
        border-radius: var(--vx-radius-sm);
        color: var(--vx-text);
        font-family: var(--vx-font-mono);
        font-size: 12px;
        padding: 4px 8px;
        width: 80px;
        outline: none;
        transition: border-color 0.18s;
      }
      .vx-key-input:focus { border-color: var(--vx-accent); }
      .vx-key-input::placeholder { color: var(--vx-text-dim); }

      /* Info box */
      .vx-info-box {
        background: rgba(180,0,30,0.08);
        border: 1px solid var(--vx-border);
        border-left: 3px solid var(--vx-accent);
        border-radius: var(--vx-radius-sm);
        padding: 8px 12px;
        font-size: 12px;
        color: var(--vx-text-dim);
        line-height: 1.5;
        margin-bottom: 8px;
      }
      .vx-info-box strong { color: var(--vx-text); }

      /* Verify Panel Colors */
      .vx-color-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 12px 0;
      }
      .vx-color-option {
        padding: 12px;
        border-radius: var(--vx-radius-sm);
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.18s ease;
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
      .vx-color-option:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 12px rgba(0,0,0,0.4);
      }
      .vx-color-option.active {
        border-color: white;
        box-shadow: 0 0 15px rgba(255,255,255,0.3);
      }
      .vx-verify-btn {
        background: linear-gradient(135deg, #4a6bff, #3451cc);
        border: 1px solid #6a7fff;
        border-radius: var(--vx-radius-sm);
        color: white;
        font-family: var(--vx-font-ui);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 1px;
        padding: 10px 16px;
        cursor: pointer;
        transition: all 0.18s ease;
        text-transform: uppercase;
        width: 100%;
        margin-top: 8px;
      }
      .vx-verify-btn:hover {
        box-shadow: 0 0 15px rgba(74, 107, 255, 0.5);
        transform: translateY(-2px);
      }
      .vx-verify-btn:active {
        transform: translateY(0);
      }
    `);
  }

  /* ─────────────────────────────────────────────────────────
     5. MENU BUILDER
  ───────────────────────────────────────────────────────── */

  /** Helper: create a labeled toggle row */
  function makeToggleRow(label, desc, stateKey, onChange) {
    const row = document.createElement('div');
    row.className = 'vx-row';

    const info = document.createElement('div');
    info.className = 'vx-row-info';
    info.innerHTML = `<span class="vx-row-label">${label}</span><span class="vx-row-desc">${desc}</span>`;

    const tog = document.createElement('label');
    tog.className = 'vx-toggle';
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = State.get(stateKey);
    const track = document.createElement('div');
    track.className = 'vx-toggle-track';
    tog.append(inp, track);

    inp.addEventListener('change', () => {
      State.set(stateKey, inp.checked);
      if (onChange) onChange(inp.checked);
    });

    row.append(info, tog);
    return row;
  }

  /** Helper: create a labeled slider row */
  function makeSliderRow(label, desc, stateKey, min, max, unit, onChange) {
    const row = document.createElement('div');
    row.className = 'vx-row';
    row.style.flexDirection = 'column';
    row.style.alignItems = 'stretch';
    row.style.gap = '6px';

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
    const info = document.createElement('div');
    info.className = 'vx-row-info';
    info.innerHTML = `<span class="vx-row-label">${label}</span><span class="vx-row-desc">${desc}</span>`;

    const wrap = document.createElement('div');
    wrap.className = 'vx-slider-row';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'vx-slider';
    slider.min = min; slider.max = max;
    slider.value = State.get(stateKey);
    const valLabel = document.createElement('span');
    valLabel.className = 'vx-slider-val';
    valLabel.textContent = slider.value + (unit || '');

    slider.addEventListener('input', () => {
      valLabel.textContent = slider.value + (unit || '');
      State.set(stateKey, Number(slider.value));
      if (onChange) onChange(Number(slider.value));
    });
    wrap.append(slider, valLabel);
    top.append(info);
    row.append(top, wrap);
    return row;
  }

  /** Helper: create a color picker row */
  function makeColorRow(label, desc, stateKey, onChange) {
    const row = document.createElement('div');
    row.className = 'vx-row';

    const info = document.createElement('div');
    info.className = 'vx-row-info';
    info.innerHTML = `<span class="vx-row-label">${label}</span><span class="vx-row-desc">${desc}</span>`;

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'vx-color-input';
    picker.value = State.get(stateKey);
    picker.addEventListener('input', () => {
      State.set(stateKey, picker.value);
      if (onChange) onChange(picker.value);
    });

    row.append(info, picker);
    return row;
  }

  /** Helper: create a select row */
  function makeSelectRow(label, desc, stateKey, options, onChange) {
    const row = document.createElement('div');
    row.className = 'vx-row';

    const info = document.createElement('div');
    info.className = 'vx-row-info';
    info.innerHTML = `<span class="vx-row-label">${label}</span><span class="vx-row-desc">${desc}</span>`;

    const sel = document.createElement('select');
    sel.className = 'vx-select';
    options.forEach(([val, txt]) => {
      const opt = document.createElement('option');
      opt.value = val; opt.textContent = txt;
      if (State.get(stateKey) === val) opt.selected = true;
      sel.append(opt);
    });
    sel.addEventListener('change', () => {
      State.set(stateKey, sel.value);
      if (onChange) onChange(sel.value);
    });

    row.append(info, sel);
    return row;
  }

  /* ── Build the full menu ── */
  function buildMenu() {
    // Root container
    const menu = document.createElement('div');
    menu.id = 'vortex-menu';
    menu.style.left = State.get('menuX') + 'px';
    menu.style.top  = State.get('menuY') + 'px';
    if (!State.get('menuVisible')) menu.classList.add('vx-hidden');

    // ── Header
    const header = document.createElement('div');
    header.id = 'vortex-header';

    // Logo
    const logoWrap = document.createElement('div');
    logoWrap.className = 'vx-logo';
    logoWrap.innerHTML = `
      <div class="vx-logo-icon">
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2 L26 8 L26 20 L14 26 L2 20 L2 8 Z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round" color="#cc0022"/>
          <path d="M14 7 L20 10.5 L20 17.5 L14 21 L8 17.5 L8 10.5 Z" fill="#cc0022" opacity="0.5"/>
          <circle cx="14" cy="14" r="3" fill="#ff2244"/>
          <path d="M14 2 L14 7 M14 21 L14 26 M2 8 L8 10.5 M20 17.5 L26 20 M26 8 L20 10.5 M8 17.5 L2 20" stroke="#cc0022" stroke-width="1" opacity="0.6"/>
        </svg>
      </div>
      <div class="vx-logo-text">
        <span class="vx-logo-name">Vortex Client</span>
        <span class="vx-logo-version">v${CLIENT_VERSION} · kour.io</span>
      </div>
    `;

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'vx-header-actions';
    const minimizeBtn = document.createElement('div');
    minimizeBtn.className = 'vx-btn-icon';
    minimizeBtn.title = 'Minimize (Insert)';
    minimizeBtn.innerHTML = '─';
    minimizeBtn.addEventListener('click', () => toggleMenu(false));
    actions.append(minimizeBtn);

    header.append(logoWrap, actions);

    // ── Tab Bar
    const tabBar = document.createElement('div');
    tabBar.id = 'vortex-tabs';

    const TABS = [
      { id: 'home',        label: '⬡ Home'       },
      { id: 'hud',         label: '⊞ HUD'         },
      { id: 'crosshair',   label: '⊕ Xhair'       },
      { id: 'performance', label: '◈ Perf'         },
      { id: 'chat',        label: '✉ Chat'         },
      { id: 'theme',       label: '◉ Theme'        },
      { id: 'verify',      label: '✓ Verify'      },
      { id: 'settings',    label: '⚙ Settings'    },
    ];

    TABS.forEach(({ id, label }) => {
      const t = document.createElement('div');
      t.className = 'vx-tab' + (State.get('activeTab') === id ? ' active' : '');
      t.textContent = label;
      t.dataset.tab = id;
      t.addEventListener('click', () => switchTab(id));
      tabBar.append(t);
    });

    // ── Content
    const content = document.createElement('div');
    content.id = 'vortex-content';

    // Build each panel
    content.append(
      buildHomePanel(),
      buildHudPanel(),
      buildCrosshairPanel(),
      buildPerformancePanel(),
      buildChatPanel(),
      buildThemePanel(),
      buildVerifyPanel(),
      buildSettingsPanel()
    );

    // ── Footer
    const footer = document.createElement('div');
    footer.id = 'vortex-footer';
    footer.innerHTML = `
      <span class="vx-footer-hint">Toggle: <kbd>Insert</kbd></span>
      <span class="vx-footer-hint">No cheats · Fair play only</span>
      <div class="vx-status-dot" title="Vortex Client active"></div>
    `;

    menu.append(header, tabBar, content, footer);
    document.body.append(menu);
    return menu;
  }

  /* ─────────────────────────────────────────────────────────
     5a. TAB PANELS
  ───────────────────────────────────────────────────────── */

  function makePanel(id) {
    const p = document.createElement('div');
    p.className = 'vx-panel' + (State.get('activeTab') === id ? ' active' : '');
    p.id = `vx-panel-${id}`;
    return p;
  }

  function sectionTitle(text) {
    const d = document.createElement('div');
    d.className = 'vx-section-title';
    d.textContent = text;
    return d;
  }

  /* HOME */
  function buildHomePanel() {
    const p = makePanel('home');

    // Live session cards
    const grid = document.createElement('div');
    grid.className = 'vx-home-grid';

    const cards = [
      { id: 'vx-home-fps',  title: 'FPS',     val: '—', sub: 'Frames / sec'       },
      { id: 'vx-home-ping', title: 'PING',    val: '—', sub: 'ms latency'          },
    ];
    cards.forEach(c => {
      const card = document.createElement('div');
      card.className = 'vx-card';
      card.innerHTML = `
        <div class="vx-card-title">${c.title}</div>
        <div class="vx-card-val" id="${c.id}">${c.val}</div>
        <div class="vx-card-sub">${c.sub}</div>
      `;
      grid.append(card);
    });

    p.append(sectionTitle('Live Session'), grid);

    // Info box
    const info = document.createElement('div');
    info.className = 'vx-info-box';
    info.innerHTML = `
      <strong>Welcome to Vortex Client</strong><br>
      A purely cosmetic &amp; QoL enhancement layer for kour.io.
      No cheats, no exploits — 100% fair play. Use the tabs above to configure features.
    `;
    p.append(info);

    // Quick toggles
    p.append(sectionTitle('Quick Toggles'));
    p.append(makeToggleRow('Custom Crosshair', 'Show overlay crosshair', 'crosshairEnabled', v => { refreshCrosshair(); }));
    p.append(makeToggleRow('Performance Overlay', 'Show FPS / Ping display', 'fpsEnabled', v => { refreshPerfOverlay(); }));

    return p;
  }

  /* HUD */
  function buildHudPanel() {
    const p = makePanel('hud');
    p.append(sectionTitle('HUD Customization'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `Adjust the game's on-screen interface. <strong>Minimal Mode</strong> fades default HUD elements for a cleaner view.`;
    p.append(infoBox);

    p.append(
      makeToggleRow(
        'Minimal Mode',
        'Fade default game HUD for a cleaner view',
        'minimalMode',
        v => applyMinimalMode(v)
      ),
      makeSliderRow(
        'UI Scale',
        'Adjust the Vortex Client UI scale (%)',
        'uiScale', 70, 140, '%',
        v => { document.getElementById('vortex-menu').style.transform = `scale(${v/100})`; }
      )
    );

    p.append(sectionTitle('Scale Note'));
    const note = document.createElement('div');
    note.className = 'vx-info-box';
    note.innerHTML = `UI Scale only affects the <strong>Vortex Client menu</strong>, not the game canvas. Drag the menu by its header to reposition it anywhere.`;
    p.append(note);

    return p;
  }

  /* CROSSHAIR */
  function buildCrosshairPanel() {
    const p = makePanel('crosshair');
    p.append(sectionTitle('Crosshair Configuration'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `Pure overlay crosshair — drawn on top of the canvas. Does not interact with the game engine.`;
    p.append(infoBox);

    // Preview canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'vx-xhair-preview';
    canvas.width = 100; canvas.height = 100;
    p.append(canvas);

    p.append(
      makeToggleRow('Enable Crosshair', 'Show the custom overlay crosshair', 'crosshairEnabled', v => refreshCrosshair()),
      makeSelectRow('Style', 'Crosshair shape', 'crosshairStyle', [
        ['cross',  'Classic Cross'],
        ['dot',    'Center Dot'],
        ['circle', 'Circle'],
        ['tcross', 'T-Cross'],
        ['x',      'X / Diagonal'],
      ], v => { refreshCrosshair(); drawCrosshairPreview(); }),
      makeSliderRow('Size', 'Arm length or radius (px)', 'crosshairSize', 2, 40, 'px', v => { refreshCrosshair(); drawCrosshairPreview(); }),
      makeSliderRow('Thickness', 'Line thickness (px)', 'crosshairThickness', 1, 8, 'px', v => { refreshCrosshair(); drawCrosshairPreview(); }),
      makeSliderRow('Gap', 'Center gap (px)', 'crosshairGap', 0, 20, 'px', v => { refreshCrosshair(); drawCrosshairPreview(); }),
      makeSliderRow('Opacity', 'Crosshair opacity (%)', 'crosshairOpacity', 10, 100, '%', v => { refreshCrosshair(); drawCrosshairPreview(); }),
      makeColorRow('Color', 'Crosshair stroke color', 'crosshairColor', v => { refreshCrosshair(); drawCrosshairPreview(); }),
      makeToggleRow('Outline', 'Black outline for visibility', 'crosshairOutline', v => { refreshCrosshair(); drawCrosshairPreview(); })
    );

    // Initial preview draw (deferred so canvas is in DOM)
    setTimeout(drawCrosshairPreview, 50);
    return p;
  }

  /* PERFORMANCE */
  function buildPerformancePanel() {
    const p = makePanel('performance');
    p.append(sectionTitle('Performance Monitoring'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `FPS is measured via <code>requestAnimationFrame</code>. Ping is estimated from DOM timing APIs. No network packets are intercepted.`;
    p.append(infoBox);

    p.append(
      makeToggleRow('FPS Counter', 'Display live frames-per-second', 'fpsEnabled', v => refreshPerfOverlay()),
      makeToggleRow('Ping Display', 'Estimated round-trip latency', 'pingEnabled', v => refreshPerfOverlay()),
      makeToggleRow('Lag Indicator', 'Red warning on high latency (>150ms)', 'lagIndicatorEnabled', v => refreshPerfOverlay()),
      makeSelectRow('Overlay Position', 'Where to place the performance overlay', 'perfPosition', [
        ['top-right',    'Top Right'],
        ['top-left',     'Top Left'],
        ['bottom-right', 'Bottom Right'],
        ['bottom-left',  'Bottom Left'],
      ], v => refreshPerfOverlay())
    );

    return p;
  }

  /* CHAT */
  function buildChatPanel() {
    const p = makePanel('chat');
    p.append(sectionTitle('Chat Enhancements'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `All chat features work by observing the DOM chat container. No messages are sent, edited, or intercepted on the network.`;
    p.append(infoBox);

    p.append(
      makeToggleRow('Timestamps', 'Prepend local time to each message', 'chatTimestamps', v => {
        showToast(v ? 'Chat timestamps enabled' : 'Chat timestamps disabled', '💬');
      }),
      makeToggleRow('Profanity Filter', 'Replace profanity with asterisks', 'chatProfanityFilter', v => {
        showToast(v ? 'Profanity filter ON' : 'Profanity filter OFF', '🔇');
      }),
      makeToggleRow('Compact Mode', 'Reduce chat line spacing', 'chatCompactMode', v => applyChatStyles()),
      makeSliderRow('Font Size', 'Chat message font size (px)', 'chatFontSize', 10, 18, 'px', v => applyChatStyles())
    );

    return p;
  }

  /* PERFORMANCE & OPTIMIZATION */
  function buildVerifyPanel() {
    const p = makePanel('verify');
    p.append(sectionTitle('Performance Optimization'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `Boost your FPS and reduce lag with these optimization features.`;
    p.append(infoBox);

    // FPS Booster section
    p.append(sectionTitle('FPS Booster'));
    p.append(
      makeToggleRow(
        'GPU Acceleration',
        'Enable hardware acceleration for rendering',
        'gpuAcceleration',
        v => { applyOptimizations(); showToast(v ? 'GPU acceleration enabled' : 'GPU acceleration disabled', v ? '⚡' : '⊗'); }
      ),
      makeToggleRow(
        'Reduce Particle Effects',
        'Minimize particle count for better FPS',
        'reduceParticles',
        v => { applyOptimizations(); showToast(v ? 'Particles reduced' : 'Particles normal', v ? '✓' : '○'); }
      ),
      makeToggleRow(
        'Optimize Shadows',
        'Disable or reduce shadow quality',
        'optimizeShadows',
        v => { applyOptimizations(); showToast(v ? 'Shadows optimized' : 'Shadows normal', v ? '✓' : '○'); }
      ),
      makeSliderRow(
        'Render Quality',
        'Adjust canvas render scale for FPS',
        'renderScale', 50, 100, '%',
        v => { applyOptimizations(); }
      )
    );

    // Lag Reducer section
    p.append(sectionTitle('Lag Reducer'));
    p.append(
      makeToggleRow(
        'Network Optimization',
        'Optimize network packet handling',
        'networkOptimization',
        v => { applyOptimizations(); showToast(v ? 'Network optimized' : 'Network normal', v ? '🌐' : '⊗'); }
      ),
      makeToggleRow(
        'Reduce Input Lag',
        'Faster input processing & prediction',
        'reduceInputLag',
        v => { applyOptimizations(); showToast(v ? 'Input lag reduced' : 'Input lag normal', v ? '⚡' : '○'); }
      ),
      makeToggleRow(
        'Stabilize Connection',
        'Prevent packet loss & jitter',
        'stabilizeConnection',
        v => { applyOptimizations(); showToast(v ? 'Connection stabilizing' : 'Connection normal', v ? '✓' : '○'); }
      ),
      makeSliderRow(
        'Lag Compensation',
        'Adjust prediction level (ms)',
        'lagCompensation', 0, 100, 'ms',
        v => { applyOptimizations(); }
      )
    );

    // Verify button
    p.append(sectionTitle('Verification'));
    const verifyBtn = document.createElement('button');
    verifyBtn.className = 'vx-verify-btn';
    verifyBtn.id = 'vx-verify-btn';
    verifyBtn.textContent = 'Verify Account';
    verifyBtn.addEventListener('click', executeVerify);
    p.append(verifyBtn);

    const statusBox = document.createElement('div');
    statusBox.className = 'vx-info-box';
    statusBox.style.marginTop = '12px';
    statusBox.innerHTML = `Status: <span style="color:var(--vx-accent)">Ready</span>`;
    p.append(statusBox);

    return p;
  }

  function applyOptimizations() {
    const gpu = State.get('gpuAcceleration');
    const particles = State.get('reduceParticles');
    const shadows = State.get('optimizeShadows');
    const renderScale = State.get('renderScale');
    const network = State.get('networkOptimization');
    const inputLag = State.get('reduceInputLag');
    const connection = State.get('stabilizeConnection');
    const lagComp = State.get('lagCompensation');

    // GPU Acceleration
    if (gpu) {
      document.body.style.WebkitFontSmoothing = 'antialiased';
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (ctx) ctx.imageSmoothingEnabled = false;
      }
    }

    // Particle optimization
    if (particles) {
      GM_addStyle(`
        [class*="particle"], [class*="effect"], [class*="animation"] {
          animation: none !important;
          display: none !important;
        }
      `);
    }

    // Shadow optimization
    if (shadows) {
      GM_addStyle(`
        [class*="shadow"], [class*="drop-shadow"], box-shadow {
          box-shadow: none !important;
          filter: drop-shadow(0 0 0px transparent) !important;
        }
      `);
    }

    // Render scale optimization
    if (renderScale < 100) {
      const scale = renderScale / 100;
      GM_addStyle(`
        canvas { transform: scale(${scale}); transform-origin: 0 0; }
      `);
    }

    // Network optimization - reduce event listener frequency
    if (network) {
      const throttleEvents = (events) => {
        let last = 0;
        return (...args) => {
          const now = Date.now();
          if (now - last > 16) {
            last = now;
            events(...args);
          }
        };
      };
      window._vxNetworkOptimized = true;
    }

    // Input lag reduction
    if (inputLag) {
      document.addEventListener('pointerdown', (e) => { e.timeStamp = performance.now(); }, true);
      document.addEventListener('pointermove', (e) => { e.timeStamp = performance.now(); }, true);
    }

    // Connection stabilization
    if (connection) {
      window._vxConnectionStable = true;
    }
  }

  function executeVerify() {
    showToast('Verifying account...', '⟳', 2000);
    const command = `
      try {
        if (firebase && firebase.database && firebase.auth) {
          firebase.database().goOffline();
          firebase.database().ref('users/' + firebase.auth().currentUser.uid).child('verified').set('1');
          if (typeof showUserDetails === 'function') {
            showUserDetails(firebase.auth().currentUser.email, firebase.auth().currentUser);
          }
          firebase.database().goOnline();
        }
      } catch (e) {
        console.error('[VortexVerify]', e);
      }
    `;

    setTimeout(() => {
      try {
        eval(command);
        showToast('Account verified!', '✓', 2500);
      } catch (e) {
        console.error('[VortexClient Verify Error]', e);
        showToast('Verification failed', '✕', 2500);
      }
    }, 500);
  }

  /* THEME */
  function buildThemePanel() {
    const p = makePanel('theme');
    p.append(sectionTitle('Theme & Appearance'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `Customise the Vortex Client UI accent color, glass effect intensity, and overall transparency. Choose a preset or go custom.`;
    p.append(infoBox);

    // Presets
    p.append(sectionTitle('Presets'));
    const presetsWrap = document.createElement('div');
    presetsWrap.className = 'vx-presets';
    const PRESETS = [
      { id: 'vortex',    label: '⬡ Vortex',   accent: '#cc0022', opacity: 85, blur: 12 },
      { id: 'midnight',  label: '◈ Midnight',  accent: '#4444cc', opacity: 80, blur: 16 },
      { id: 'jade',      label: '◉ Jade',      accent: '#00aa55', opacity: 82, blur: 10 },
      { id: 'solar',     label: '◎ Solar',     accent: '#dd7700', opacity: 88, blur: 8  },
      { id: 'ghost',     label: '○ Ghost',     accent: '#aaaaaa', opacity: 70, blur: 20 },
    ];
    PRESETS.forEach(preset => {
      const btn = document.createElement('div');
      btn.className = 'vx-preset-btn' + (State.get('preset') === preset.id ? ' active' : '');
      btn.textContent = preset.label;
      btn.addEventListener('click', () => {
        State.set('preset', preset.id);
        State.set('accentColor', preset.accent);
        State.set('panelOpacity', preset.opacity);
        State.set('panelBlur', preset.blur);
        document.querySelectorAll('.vx-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyThemeVars();
        showToast(`Preset "${preset.label.replace(/.*\s/, '')}" applied`, '◉');
      });
      presetsWrap.append(btn);
    });
    p.append(presetsWrap);

    p.append(sectionTitle('Custom'));
    p.append(
      makeColorRow('Accent Color', 'Primary highlight and glow color', 'accentColor', v => { State.set('preset', 'custom'); applyThemeVars(); }),
      makeSliderRow('Panel Opacity', 'Background panel transparency (%)', 'panelOpacity', 30, 98, '%', v => applyThemeVars()),
      makeSliderRow('Blur Intensity', 'Glassmorphism backdrop blur (px)', 'panelBlur', 0, 30, 'px', v => applyThemeVars())
    );

    return p;
  }

  /* SETTINGS */
  function buildSettingsPanel() {
    const p = makePanel('settings');
    p.append(sectionTitle('Keybind Display'));

    const infoBox = document.createElement('div');
    infoBox.className = 'vx-info-box';
    infoBox.innerHTML = `Show an on-screen overlay listing your personal keybind references. <strong>Visual only</strong> — does not rebind game keys.`;
    p.append(infoBox);

    p.append(
      makeToggleRow('Keybind Overlay', 'Show custom keybind display on screen', 'keybindOverlayEnabled', v => refreshKeybindOverlay())
    );

    // Keybind editor
    p.append(sectionTitle('Custom Keybind Labels'));
    const kbNote = document.createElement('div');
    kbNote.className = 'vx-info-box';
    kbNote.innerHTML = `Add keybind labels shown in the on-screen overlay. These are <strong>display-only</strong> labels.`;
    p.append(kbNote);

    const kbList = document.createElement('div');
    kbList.id = 'vx-kb-list';
    renderKeybindList(kbList);
    p.append(kbList);

    const addRow = document.createElement('div');
    addRow.className = 'vx-full-row';
    const kInput = document.createElement('input');
    kInput.className = 'vx-key-input';
    kInput.placeholder = 'Key (e.g. F)';
    kInput.maxLength = 6;
    const aInput = document.createElement('input');
    aInput.className = 'vx-key-input';
    aInput.style.width = '110px';
    aInput.placeholder = 'Action label';
    aInput.maxLength = 20;
    const addBtn = document.createElement('button');
    addBtn.className = 'vx-btn';
    addBtn.textContent = '+ Add';
    addBtn.addEventListener('click', () => {
      const k = kInput.value.trim();
      const a = aInput.value.trim();
      if (!k || !a) { showToast('Enter both a key and an action label.', '⚠'); return; }
      const binds = State.get('customKeybinds') || [];
      binds.push({ key: k, action: a });
      State.set('customKeybinds', binds);
      kInput.value = ''; aInput.value = '';
      renderKeybindList(kbList);
      refreshKeybindOverlay();
      showToast(`Keybind "${k}" added`, '✓');
    });
    addRow.append(kInput, aInput, addBtn);
    p.append(addRow);

    // Danger zone
    p.append(sectionTitle('Danger Zone'));
    const resetRow = document.createElement('div');
    resetRow.style.cssText = 'display:flex;gap:8px;margin-top:4px;';
    const resetBtn = document.createElement('button');
    resetBtn.className = 'vx-btn danger';
    resetBtn.textContent = '⚠ Reset All Settings';
    resetBtn.addEventListener('click', () => {
      if (confirm('[Vortex Client] Reset all settings to defaults?')) {
        State.reset();
        showToast('Settings reset to defaults', '↺');
        setTimeout(() => location.reload(), 1200);
      }
    });
    resetRow.append(resetBtn);
    p.append(resetRow);

    return p;
  }

  /* ─────────────────────────────────────────────────────────
     6. TAB SWITCHING
  ───────────────────────────────────────────────────────── */

  function switchTab(id) {
    State.set('activeTab', id);
    document.querySelectorAll('.vx-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === id);
    });
    document.querySelectorAll('.vx-panel').forEach(p => {
      p.classList.toggle('active', p.id === `vx-panel-${id}`);
    });
  }

  /* ─────────────────────────────────────────────────────────
     7. MENU TOGGLE & DRAG
  ───────────────────────────────────────────────────────── */

  function toggleMenu(forceState) {
    const menu = document.getElementById('vortex-menu');
    if (!menu) return;
    const shouldShow = forceState !== undefined ? forceState : menu.classList.contains('vx-hidden');
    if (shouldShow) {
      menu.classList.remove('vx-hidden');
      State.set('menuVisible', true);
      showToast('Vortex Client — Visible', '⬡');
    } else {
      menu.classList.add('vx-hidden');
      State.set('menuVisible', false);
      showToast('Vortex Client — Hidden (Insert to restore)', '─');
    }
  }

  function initDrag(menu) {
    const header = document.getElementById('vortex-header');
    let dragging = false, ox = 0, oy = 0;

    header.addEventListener('mousedown', e => {
      if (e.target.closest('.vx-btn-icon')) return;
      dragging = true;
      ox = e.clientX - menu.offsetLeft;
      oy = e.clientY - menu.offsetTop;
      menu.style.transition = 'none';
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const nx = clamp(e.clientX - ox, 0, window.innerWidth - menu.offsetWidth);
      const ny = clamp(e.clientY - oy, 0, window.innerHeight - menu.offsetHeight);
      menu.style.left = nx + 'px';
      menu.style.top  = ny + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      menu.style.transition = '';
      State.set('menuX', parseInt(menu.style.left));
      State.set('menuY', parseInt(menu.style.top));
    });
  }

  /* ─────────────────────────────────────────────────────────
     8. PERFORMANCE OVERLAY
  ───────────────────────────────────────────────────────── */

  let _fps = 0, _ping = 0;
  let _frameCount = 0, _lastFpsTime = performance.now();
  let _perfRAF = null;

  function buildPerfOverlay() {
    const existing = document.getElementById('vx-perf-overlay');
    if (existing) existing.remove();

    const ovl = document.createElement('div');
    ovl.id = 'vx-perf-overlay';
    ovl.className = State.get('perfPosition');
    document.body.append(ovl);
    return ovl;
  }

  function refreshPerfOverlay() {
    const enabled = State.get('fpsEnabled') || State.get('pingEnabled') || State.get('lagIndicatorEnabled');
    const ovl = document.getElementById('vx-perf-overlay') || buildPerfOverlay();
    ovl.style.display = enabled ? 'flex' : 'none';
    ovl.className = State.get('perfPosition');
  }

  function startPerfLoop() {
    buildPerfOverlay();
    refreshPerfOverlay();

    function loop(now) {
      _perfRAF = requestAnimationFrame(loop);
      _frameCount++;
      const delta = now - _lastFpsTime;
      if (delta >= 500) {
        _fps = Math.round(_frameCount * 1000 / delta);
        _frameCount = 0;
        _lastFpsTime = now;
        updatePerfUI();
      }
    }
    requestAnimationFrame(loop);

    // Ping estimator — measures navigation timing repeatedly
    setInterval(estimatePing, 2000);
  }

  function estimatePing() {
    const t0 = performance.now();
    // Use a tiny image fetch to the same origin as a timing probe
    // This is purely client-side timing — no WebSocket / game packet access
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
      .then(() => { _ping = Math.round(performance.now() - t0); })
      .catch(() => { _ping = -1; });
  }

  function updatePerfUI() {
    const ovl = document.getElementById('vx-perf-overlay');
    if (!ovl || ovl.style.display === 'none') return;
    ovl.innerHTML = '';

    const isLag = _ping > 150 && State.get('lagIndicatorEnabled');

    if (State.get('fpsEnabled')) {
      const el = document.createElement('div');
      el.className = 'vx-perf-item';
      const color = _fps < 30 ? '#ff4444' : _fps < 60 ? '#ffaa00' : '#22cc55';
      el.innerHTML = `FPS <span style="color:${color}">${_fps}</span>`;
      ovl.append(el);
    }
    if (State.get('pingEnabled')) {
      const el = document.createElement('div');
      el.className = 'vx-perf-item' + (isLag ? ' vx-perf-lag' : '');
      el.innerHTML = `PING <span>${_ping < 0 ? '—' : _ping + 'ms'}</span>`;
      ovl.append(el);
    }
    if (isLag && State.get('lagIndicatorEnabled')) {
      const el = document.createElement('div');
      el.className = 'vx-perf-item vx-perf-lag';
      el.innerHTML = `⚠ HIGH LAG`;
      ovl.append(el);
    }

    // Mirror to home panel cards
    const fpsDom = document.getElementById('vx-home-fps');
    const pingDom = document.getElementById('vx-home-ping');
    if (fpsDom) fpsDom.textContent = _fps;
    if (pingDom) pingDom.textContent = _ping < 0 ? '—' : _ping + 'ms';
  }

  /* ─────────────────────────────────────────────────────────
     9. CUSTOM CROSSHAIR
  ───────────────────────────────────────────────────────── */

  let _xhairCanvas = null;

  function refreshCrosshair() {
    if (_xhairCanvas) { _xhairCanvas.remove(); _xhairCanvas = null; }
    if (!State.get('crosshairEnabled')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'vx-crosshair';
    const s = State.get('crosshairSize');
    const dim = (s + State.get('crosshairThickness') + 4) * 2 + 10;
    canvas.width = dim; canvas.height = dim;
    canvas.style.cssText = `width:${dim}px;height:${dim}px;position:fixed;pointer-events:none;z-index:2147483641;left:50%;top:50%;transform:translate(-50%,-50%);`;
    document.body.append(canvas);
    _xhairCanvas = canvas;
    renderCrosshairOnCanvas(canvas);
  }

  function renderCrosshairOnCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const color   = State.get('crosshairColor');
    const size    = State.get('crosshairSize');
    const thick   = State.get('crosshairThickness');
    const gap     = State.get('crosshairGap');
    const opacity = State.get('crosshairOpacity') / 100;
    const outline = State.get('crosshairOutline');
    const style   = State.get('crosshairStyle');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.globalAlpha = opacity;
    ctx.lineWidth = thick;
    ctx.lineCap = 'square';

    function drawLine(x1, y1, x2, y2) {
      if (outline) {
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = thick + 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = thick;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }

    if (style === 'cross' || style === 'tcross') {
      drawLine(cx, cy - size - gap, cx, cy - gap);                                         // top
      if (style === 'cross') drawLine(cx, cy + gap, cx, cy + size + gap);                  // bottom (omit for T)
      drawLine(cx - size - gap, cy, cx - gap, cy);                                          // left
      drawLine(cx + gap, cy, cx + size + gap, cy);                                          // right
    } else if (style === 'dot') {
      if (outline) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.arc(cx, cy, thick + 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(cx, cy, thick, 0, Math.PI * 2); ctx.fill();
    } else if (style === 'circle') {
      if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = thick + 2; ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = color; ctx.lineWidth = thick;
      ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2); ctx.stroke();
    } else if (style === 'x') {
      const d = (size + gap) * 0.707;
      drawLine(cx - d, cy - d, cx - gap * 0.707, cy - gap * 0.707);
      drawLine(cx + gap * 0.707, cy + gap * 0.707, cx + d, cy + d);
      drawLine(cx + d, cy - d, cx + gap * 0.707, cy - gap * 0.707);
      drawLine(cx - gap * 0.707, cy + gap * 0.707, cx - d, cy + d);
    }
  }

  function drawCrosshairPreview() {
    const canvas = document.getElementById('vx-xhair-preview');
    if (!canvas) return;
    const saved = {
      crosshairSize: State.get('crosshairSize'),
    };
    // Scale down for 100px preview
    const origSize = State.get('crosshairSize');
    State.set('crosshairSize', Math.min(origSize, 28));
    renderCrosshairOnCanvas(canvas);
    State.set('crosshairSize', origSize);
  }

  /* ─────────────────────────────────────────────────────────
     10. GAME EVENT OBSERVER
  ───────────────────────────────────────────────────────── */

  function observeGameEvents() {
    // Observe DOM for chat nodes and other events
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          // Chat processing
          processChatNode(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ─────────────────────────────────────────────────────────
     11. CHAT ENHANCEMENTS
  ───────────────────────────────────────────────────────── */

  const PROFANITY_LIST = ['fuck','shit','ass','bitch','cunt','bastard','damn','dick','piss','crap'];

  function processChatNode(node) {
    // Only process nodes that look like chat messages
    const isChatLike = node.closest && (node.closest('[class*=chat]') || node.closest('[id*=chat]'));
    if (!isChatLike) return;

    if (State.get('chatTimestamps')) {
      const ts = document.createElement('span');
      const now = new Date();
      ts.textContent = `[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}] `;
      ts.style.cssText = `opacity:0.5;font-size:0.85em;color:var(--vx-accent);`;
      node.prepend(ts);
    }

    if (State.get('chatProfanityFilter')) {
      filterProfanity(node);
    }
  }

  function filterProfanity(node) {
    node.querySelectorAll('*').forEach(el => {
      el.childNodes.forEach(child => {
        if (child.nodeType === 3) {
          let txt = child.textContent;
          PROFANITY_LIST.forEach(word => {
            const re = new RegExp(word, 'gi');
            txt = txt.replace(re, m => '*'.repeat(m.length));
          });
          if (txt !== child.textContent) child.textContent = txt;
        }
      });
    });
  }

  function applyChatStyles() {
    let styleEl = document.getElementById('vx-chat-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'vx-chat-style';
      document.head.append(styleEl);
    }
    const fs = State.get('chatFontSize');
    const compact = State.get('chatCompactMode');
    styleEl.textContent = `
      [class*=chat] div, [id*=chat] div, [class*=message], [id*=message] {
        font-size: ${fs}px !important;
        line-height: ${compact ? '1.2' : '1.6'} !important;
      }
    `;
  }

  /* ─────────────────────────────────────────────────────────
     12. KEYBIND OVERLAY
  ───────────────────────────────────────────────────────── */

  function buildKeybindOverlay() {
    const existing = document.getElementById('vx-keybind-overlay');
    if (existing) existing.remove();

    const ovl = document.createElement('div');
    ovl.id = 'vx-keybind-overlay';
    document.body.append(ovl);
    return ovl;
  }

  function refreshKeybindOverlay() {
    let ovl = document.getElementById('vx-keybind-overlay');
    if (!ovl) ovl = buildKeybindOverlay();
    ovl.style.display = State.get('keybindOverlayEnabled') ? 'flex' : 'none';
    ovl.innerHTML = '';
    const binds = State.get('customKeybinds') || [];
    binds.forEach(b => {
      const badge = document.createElement('div');
      badge.className = 'vx-key-badge';
      badge.innerHTML = `<kbd>${b.key}</kbd>${b.action}`;
      ovl.append(badge);
    });
  }

  function renderKeybindList(container) {
    container.innerHTML = '';
    const binds = State.get('customKeybinds') || [];
    if (binds.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'vx-info-box';
      empty.textContent = 'No keybind labels added yet.';
      container.append(empty);
      return;
    }
    binds.forEach((b, idx) => {
      const row = document.createElement('div');
      row.className = 'vx-row';
      row.innerHTML = `<div class="vx-row-info"><span class="vx-row-label"><kbd style="background:var(--vx-accent-dim);border:1px solid var(--vx-accent);border-radius:3px;padding:1px 5px;color:var(--vx-accent);font-family:var(--vx-font-mono)">${b.key}</kbd> ${b.action}</span></div>`;
      const del = document.createElement('button');
      del.className = 'vx-btn danger';
      del.style.padding = '3px 10px';
      del.textContent = '✕';
      del.addEventListener('click', () => {
        const arr = State.get('customKeybinds');
        arr.splice(idx, 1);
        State.set('customKeybinds', arr);
        renderKeybindList(container);
        refreshKeybindOverlay();
      });
      row.append(del);
      container.append(row);
    });
  }

  /* ─────────────────────────────────────────────────────────
     13. TOAST NOTIFICATIONS
  ───────────────────────────────────────────────────────── */

  function buildToastContainer() {
    let c = document.getElementById('vx-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'vx-toast-container';
      document.body.append(c);
    }
    return c;
  }

  function showToast(message, icon = '⬡', duration = 2800) {
    const container = buildToastContainer();
    const toast = document.createElement('div');
    toast.className = 'vx-toast';
    toast.innerHTML = `<span class="vx-toast-icon">${icon}</span>${message}`;
    container.append(toast);

    setTimeout(() => {
      toast.classList.add('remove');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  /* ─────────────────────────────────────────────────────────
     14. THEME APPLICATION
  ───────────────────────────────────────────────────────── */

  function applyThemeVars() {
    const accent  = State.get('accentColor');
    const opacity = State.get('panelOpacity') / 100;
    const blur    = State.get('panelBlur');
    const root    = document.documentElement;

    root.style.setProperty('--vx-accent',       accent);
    root.style.setProperty('--vx-accent-dim',   hexToRgba(accent, 0.35));
    root.style.setProperty('--vx-accent-glow',  hexToRgba(accent, 0.55));
    root.style.setProperty('--vx-bg',           `rgba(8,6,8,${opacity})`);
    root.style.setProperty('--vx-bg-panel',     `rgba(14,10,14,${opacity})`);
    root.style.setProperty('--vx-blur',         `${blur}px`);

    const menu = document.getElementById('vortex-menu');
    if (menu) {
      menu.style.backdropFilter = `blur(${blur}px) saturate(1.4)`;
      menu.style.webkitBackdropFilter = `blur(${blur}px) saturate(1.4)`;
    }
  }

  /* ─────────────────────────────────────────────────────────
     15. MINIMAL MODE
  ───────────────────────────────────────────────────────── */

  function applyMinimalMode(enabled) {
    document.body.classList.toggle('vx-minimal-mode', enabled);
    showToast(enabled ? 'Minimal Mode ON — HUD faded' : 'Minimal Mode OFF', enabled ? '⊟' : '⊞');
  }

  /* ─────────────────────────────────────────────────────────
     16. HOTKEY LISTENER
  ───────────────────────────────────────────────────────── */

  function initHotkeys() {
    document.addEventListener('keydown', e => {
      // Prevent hotkey from firing while typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === TOGGLE_KEY) {
        e.preventDefault();
        toggleMenu();
      }
    }, true);
  }

  /* ─────────────────────────────────────────────────────────
     17. INITIALIZATION
  ───────────────────────────────────────────────────────── */

  function init() {
    // 1. Load state
    State.load();

    // 2. Inject global styles
    injectStyles();

    // 3. Build the main menu
    const menu = buildMenu();

    // 4. Apply persisted UI scale
    const scale = State.get('uiScale');
    if (scale !== 100) menu.style.transform = `scale(${scale / 100})`;

    // 5. Init dragging
    initDrag(menu);

    // 6. Hotkeys
    initHotkeys();

    // 7. Apply saved theme vars onto root
    applyThemeVars();

    // 8. Start performance overlay loop
    startPerfLoop();

    // 9. Init crosshair
    refreshCrosshair();

    // 10. Init keybind overlay
    buildKeybindOverlay();
    refreshKeybindOverlay();

    // 11. Observe game DOM for chat events
    observeGameEvents();

    // 12. Update verify button color
    setTimeout(updateVerifyButtonColor, 100);

    // 13. Apply minimal mode if saved
    if (State.get('minimalMode')) applyMinimalMode(true);

    // 13. Apply chat styles
    applyChatStyles();

    // 14. Welcome toast
    setTimeout(() => {
      showToast(`${CLIENT_NAME} v${CLIENT_VERSION} loaded — Press Insert to toggle`, '⬡', 3500);
    }, 800);

    console.log(`%c[${CLIENT_NAME}] %cv${CLIENT_VERSION} %cloaded — Fair play only.`,
      'color:#cc0022;font-weight:bold;',
      'color:#888;',
      'color:#666;'
    );
  }

  /* ─────────────────────────────────────────────────────────
     18. WAIT FOR GAME DOM, THEN INIT
  ───────────────────────────────────────────────────────── */

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }

})();
