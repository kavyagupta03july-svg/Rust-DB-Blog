import type { PlaygroundTemplate } from '../types/blog';

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'tpl-neural-canvas',
    name: 'Interactive 3D Neural Lattice (Canvas 2D Projection)',
    category: '3D & Spatial Math',
    description:
      'Real-time 3D perspective projection of a rotating geodesic neural network with interactive mouse gravity and live telemetry.',
    html: `<div class="lab-shell">
  <div class="hud-header">
    <div>
      <span class="kicker">LIVE SANDBOX // 3D PROJECTION KERNEL</span>
      <h2>Geodesic Neural Topology</h2>
    </div>
    <div class="controls">
      <button id="btn-pulse" type="button">Inject Signal Pulse</button>
      <button id="btn-topology" type="button">Switch Topology</button>
    </div>
  </div>
  <canvas id="neural-canvas"></canvas>
  <div class="hud-footer">
    <span>Active Nodes: <strong id="node-count">72</strong></span>
    <span>Synaptic Edges: <strong id="edge-count">0</strong></span>
    <span>Projection Focal: <strong>520px</strong></span>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #050811;
  color: #e2e8f0;
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  height: 100vh;
  overflow: hidden;
}
.lab-shell {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}
#neural-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.hud-header, .hud-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 12px 16px;
  border-radius: 10px;
}
.kicker {
  font-size: 10px;
  letter-spacing: 0.12em;
  color: #38bdf8;
  display: block;
  margin-bottom: 2px;
}
h2 {
  font-size: 16px;
  font-weight: 600;
  color: #f8fafc;
}
.controls {
  display: flex;
  gap: 8px;
}
button {
  background: #1d4ed8;
  color: #ffffff;
  border: 1px solid rgba(96, 165, 250, 0.4);
  padding: 7px 13px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}
button:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
.hud-footer {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}
.hud-footer strong {
  color: #38bdf8;
}`,
    js: `const canvas = document.getElementById('neural-canvas');
const ctx = canvas.getContext('2d');
const edgeEl = document.getElementById('edge-count');
const nodeEl = document.getElementById('node-count');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);
let pulseEnergy = 0;
let torusMode = false;
let pointer = { x: 0, y: 0 };

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

window.addEventListener('mousemove', (e) => {
  pointer.x = (e.clientX / width - 0.5) * 2;
  pointer.y = (e.clientY / height - 0.5) * 2;
});

const N = 72;
nodeEl.textContent = String(N);
const nodes = Array.from({ length: N }, (_, i) => {
  const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return { phi, theta, baseR: 155 };
});

document.getElementById('btn-pulse').addEventListener('click', () => {
  pulseEnergy = 1.0;
});

document.getElementById('btn-topology').addEventListener('click', () => {
  torusMode = !torusMode;
  pulseEnergy = 0.65;
});

let angleY = 0;
let angleX = 0.25;

function render() {
  ctx.fillStyle = '#050811';
  ctx.fillRect(0, 0, width, height);

  angleY += 0.007 + pointer.x * 0.01;
  angleX += (pointer.y * 0.6 - angleX) * 0.05;
  pulseEnergy *= 0.94;

  const projected = nodes.map((n, i) => {
    const r = n.baseR * (1 + pulseEnergy * 0.22 * Math.sin(i));
    let x, y, z;
    if (!torusMode) {
      x = r * Math.sin(n.phi) * Math.cos(n.theta);
      y = r * Math.cos(n.phi);
      z = r * Math.sin(n.phi) * Math.sin(n.theta);
    } else {
      const major = 130, minor = 55;
      const u = (i / N) * Math.PI * 2;
      const v = ((i * 7) / N) * Math.PI * 2;
      x = (major + minor * Math.cos(v)) * Math.cos(u);
      y = minor * Math.sin(v);
      z = (major + minor * Math.cos(v)) * Math.sin(u);
    }

    // Rotate Y then X
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const x1 = x * cosY - z * sinY;
    const z1 = z * cosY + x * sinY;
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = z1 * cosX + y * sinX;

    const scale = 520 / (520 + z2 + 220);
    return {
      sx: width / 2 + x1 * scale,
      sy: height / 2 + y2 * scale,
      scale,
      z: z2
    };
  });

  let edges = 0;
  for (let i = 0; i < projected.length; i++) {
    for (let j = i + 1; j < projected.length; j++) {
      const dx = projected[i].sx - projected[j].sx;
      const dy = projected[i].sy - projected[j].sy;
      const dist = Math.hypot(dx, dy);
      if (dist < 92) {
        edges++;
        const alpha = (1 - dist / 92) * (0.35 + pulseEnergy * 0.5);
        ctx.strokeStyle = pulseEnergy > 0.15
          ? \`rgba(139, 92, 246, \${alpha})\`
          : \`rgba(56, 189, 248, \${alpha})\`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(projected[i].sx, projected[i].sy);
        ctx.lineTo(projected[j].sx, projected[j].sy);
        ctx.stroke();
      }
    }
  }
  edgeEl.textContent = String(edges);

  for (const p of projected) {
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, Math.max(1.8, 3.8 * p.scale), 0, Math.PI * 2);
    ctx.fillStyle = pulseEnergy > 0.15 ? '#c084fc' : '#38bdf8';
    ctx.fill();
  }

  requestAnimationFrame(render);
}
render();`,
  },
  {
    id: 'tpl-rustdb-btree-visualizer',
    name: 'RustDB B+Tree Slotted Page Inspector',
    category: 'Database Internals',
    description:
      'Interactive slotted-page memory allocator demonstrating how RustDB and modern relational engines insert tuples from both ends of an 8KB page.',
    html: `<div class="page-inspector">
  <div class="header">
    <div>
      <span class="tag">SLOTTED PAGE 0x004A // 256-BYTE DEMO FRAME</span>
      <h3>Tuple Slot Array vs. Payload Heap</h3>
    </div>
    <div class="actions">
      <input id="tuple-input" type="text" value="user:4091|role:architect" maxlength="32" aria-label="Tuple payload" />
      <button id="btn-insert" type="button">Insert Tuple</button>
      <button id="btn-compact" type="button" class="secondary">Clear Page</button>
    </div>
  </div>

  <div class="meter-wrap">
    <div id="slot-bar" class="bar-slots" style="width: 8%">Slots</div>
    <div id="free-bar" class="bar-free">Contiguous Free Space</div>
    <div id="heap-bar" class="bar-heap" style="width: 18%">Tuple Payloads</div>
  </div>

  <div id="slot-log" class="slot-grid"></div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #070b14;
  color: #f1f5f9;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  padding: 20px;
}
.page-inspector {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 20px;
}
.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.tag {
  font-family: monospace;
  font-size: 11px;
  color: #38bdf8;
}
h3 {
  font-size: 17px;
  margin-top: 2px;
}
.actions {
  display: flex;
  gap: 8px;
}
input {
  background: #020617;
  border: 1px solid #334155;
  color: #f8fafc;
  padding: 7px 10px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
}
button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
button.secondary {
  background: #1e293b;
  color: #cbd5e1;
}
.meter-wrap {
  display: flex;
  height: 38px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #334155;
  margin-bottom: 16px;
  font-family: monospace;
  font-size: 11px;
}
.bar-slots {
  background: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.25s ease;
}
.bar-free {
  flex: 1;
  background: #020617;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bar-heap {
  background: #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.25s ease;
}
.slot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
}
.slot-card {
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px;
  font-family: monospace;
  font-size: 11px;
}
.slot-card .meta {
  color: #38bdf8;
  margin-bottom: 4px;
}`,
    js: `const PAGE_BYTES = 256;
let tuples = [
  { slot: 0, offset: 232, len: 24, data: 'id:1001|status:COMMITTED' },
  { slot: 1, offset: 206, len: 26, data: 'id:1002|status:CHECKPOINT' }
];

const slotBar = document.getElementById('slot-bar');
const heapBar = document.getElementById('heap-bar');
const freeBar = document.getElementById('free-bar');
const logEl = document.getElementById('slot-log');
const inputEl = document.getElementById('tuple-input');

function renderPage() {
  const slotBytes = tuples.length * 4;
  const heapBytes = tuples.reduce((acc, t) => acc + t.len, 0);
  const freeBytes = Math.max(0, PAGE_BYTES - slotBytes - heapBytes);

  slotBar.style.width = Math.max(8, (slotBytes / PAGE_BYTES) * 100) + '%';
  heapBar.style.width = Math.max(12, (heapBytes / PAGE_BYTES) * 100) + '%';
  freeBar.textContent = \`Free: \${freeBytes}B\`;

  logEl.innerHTML = tuples.map(t => \`
    <div class="slot-card">
      <div class="meta">Slot[\${t.slot}] -> Offset \${t.offset} (\${t.len}B)</div>
      <div>\${t.data}</div>
    </div>
  \`).join('');
}

document.getElementById('btn-insert').addEventListener('click', () => {
  const raw = inputEl.value.trim() || 'row:empty';
  const slotBytes = (tuples.length + 1) * 4;
  const heapBytes = tuples.reduce((acc, t) => acc + t.len, 0) + raw.length;
  if (slotBytes + heapBytes > PAGE_BYTES) {
    freeBar.textContent = 'PAGE FULL -> SPLIT REQUIRED';
    return;
  }
  const prevOffset = tuples.length ? tuples[tuples.length - 1].offset : PAGE_BYTES;
  tuples.push({
    slot: tuples.length,
    offset: prevOffset - raw.length,
    len: raw.length,
    data: raw
  });
  renderPage();
});

document.getElementById('btn-compact').addEventListener('click', () => {
  tuples = [];
  renderPage();
});

renderPage();`,
  },
  {
    id: 'tpl-css-3d-holo-card',
    name: '3D Spatial Perspective Telemetry Card',
    category: 'CSS 3D & Motion',
    description:
      'Hardware-accelerated 3D matrix card that tracks cursor coordinates and updates specular glare and depth layers.',
    html: `<div class="stage">
  <div id="holo-card" class="holo-card">
    <div class="glare" id="glare"></div>
    <div class="layer-top">
      <span class="series">OPTICAL INTERCONNECT // REV 4.2</span>
      <h2>Photonic Tensor Core</h2>
    </div>
    <div class="metrics">
      <div>
        <span class="label">BANDWIDTH</span>
        <span class="val">1.6 TB/s</span>
      </div>
      <div>
        <span class="label">EFFICIENCY</span>
        <span class="val">1.8 pJ/bit</span>
      </div>
    </div>
  </div>
</div>`,
    css: `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  height: 100vh;
  display: grid;
  place-items: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: white;
}
.stage {
  perspective: 900px;
}
.holo-card {
  position: relative;
  width: 340px;
  height: 210px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(56, 189, 248, 0.35);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transform-style: preserve-3d;
  transition: transform 0.12s ease-out;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}
.glare {
  position: absolute;
  inset: -50%;
  background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.22), transparent 55%);
  pointer-events: none;
}
.series {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #38bdf8;
  font-family: monospace;
}
h2 {
  font-size: 22px;
  margin-top: 6px;
  transform: translateZ(28px);
}
.metrics {
  display: flex;
  gap: 24px;
  transform: translateZ(20px);
}
.label {
  display: block;
  font-size: 10px;
  color: #94a3b8;
}
.val {
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}`,
    js: `const card = document.getElementById('holo-card');
const glare = document.getElementById('glare');

document.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / (rect.width / 2);
  const dy = (e.clientY - cy) / (rect.height / 2);
  const rx = Math.max(-18, Math.min(18, -dy * 12));
  const ry = Math.max(-18, Math.min(18, dx * 12));
  card.style.transform = \`rotateX(\${rx}deg) rotateY(\${ry}deg)\`;
  glare.style.transform = \`translate(\${dx * 25}px, \${dy * 25}px)\`;
});`,
  },
];
