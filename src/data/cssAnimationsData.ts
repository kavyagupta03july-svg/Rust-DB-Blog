import type { CssAnimationDemo } from '../types/blog';

export const CSS_ANIMATION_DEMOS: CssAnimationDemo[] = [
  {
    id: 'css-3d-cube',
    title: '01. 3D Rotating Architectural Cube',
    category: '3D Transforms',
    summary: 'Six-faced spatial cube using CSS `transform-style: preserve-3d` and hardware-composited matrix rotations.',
    howItWorks:
      'A parent `.cube-scene` establishes a `perspective: 600px` camera frustum, while `.cube-assembly` sets `transform-style: preserve-3d`. Each of the 6 faces is rotated along X or Y and translated outward by half the cube width (`translateZ(44px)`).',
    htmlCode: `<div class="cube-scene">
  <div class="cube-assembly">
    <div class="cube-face front">CORE</div>
    <div class="cube-face back">RUST</div>
    <div class="cube-face right">GPU</div>
    <div class="cube-face left">WASM</div>
    <div class="cube-face top">AI</div>
    <div class="cube-face bottom">SQL</div>
  </div>
</div>`,
    cssCode: `.cube-scene {
  perspective: 600px;
  width: 88px;
  height: 88px;
}
.cube-assembly {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: cubeRotate3D 9s infinite linear;
}
.cube-face {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(56, 189, 248, 0.65);
  background: rgba(15, 23, 42, 0.78);
  color: #38bdf8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  display: grid;
  place-items: center;
}
.front  { transform: rotateY(0deg) translateZ(44px); }
.back   { transform: rotateY(180deg) translateZ(44px); }
.right  { transform: rotateY(90deg) translateZ(44px); }
.left   { transform: rotateY(-90deg) translateZ(44px); }
.top    { transform: rotateX(90deg) translateZ(44px); }
.bottom { transform: rotateX(-90deg) translateZ(44px); }`,
  },
  {
    id: 'css-neon-button',
    title: '02. Precision Specular Rim Button',
    category: 'Lighting & Glow',
    summary: 'Layered inset/outset box-shadow luminance with smooth compositor scale and border transition.',
    howItWorks:
      'Combines an internal specular top highlight (`inset 0 1px 0 rgba(255,255,255,0.25)`) with a focused cobalt outer luminance field that intensifies on `:hover` and `:focus-visible` within 160ms.',
    htmlCode: `<button class="neon-action-btn" type="button">
  Deploy Compute Cluster
</button>`,
    cssCode: `.neon-action-btn {
  padding: 12px 22px;
  border-radius: 8px;
  background: linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%);
  color: #f8fafc;
  border: 1px solid #60a5fa;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.3),
              0 0 20px rgba(59, 130, 246, 0.45);
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 160ms ease;
}
.neon-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45),
              0 0 32px rgba(56, 189, 248, 0.75);
}`,
  },
  {
    id: 'css-animated-gradient',
    title: '03. Dynamic Spectral Mesh Gradient',
    category: 'Shaders & Gradients',
    summary: 'Oversized 300% multi-stop linear and radial background field interpolated smoothly across keyframes.',
    howItWorks:
      'By setting `background-size: 300% 300%` on a multi-angle gradient and animating `background-position` from `0% 50%` to `100% 50%`, the color stops flow organically across the surface.',
    htmlCode: `<div class="spectral-gradient-surface">
  <span>SPECTRAL FIELD // 60FPS</span>
</div>`,
    cssCode: `.spectral-gradient-surface {
  background: linear-gradient(-45deg, #0f172a, #1d4ed8, #6d28d9, #0284c7);
  background-size: 300% 300%;
  animation: meshGradientShift 6s ease infinite;
  border-radius: 10px;
  padding: 24px;
}`,
  },
  {
    id: 'css-glassmorphism',
    title: '04. Optical Frosted Glass Surface',
    category: 'Surfaces',
    summary: 'Refractive translucent card over high-contrast geometric background primitives with 1px specular border.',
    howItWorks:
      'Pairs a semi-transparent surface fill (`rgba(15, 23, 42, 0.62)`) with `backdrop-filter: blur(12px) saturate(160%)` and an asymmetric top/left border highlight to simulate real optical refraction.',
    htmlCode: `<div class="glass-stage">
  <div class="glass-orb"></div>
  <div class="glass-panel">
    <strong>Optical Layer</strong>
    <span>Refraction Index 1.52</span>
  </div>
</div>`,
    cssCode: `.glass-panel {
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  padding: 16px 20px;
}`,
  },
  {
    id: 'css-liquid-morph',
    title: '05. Organic Liquid Topology Morph',
    category: 'Fluid Physics',
    summary: '8-value asymmetric `border-radius` interpolation creating a continuous fluid surface tension effect.',
    howItWorks:
      'CSS `border-radius` accepts separate horizontal and vertical radii (`60% 40% 30% 70% / 60% 30% 70% 40%`). Interpolating all 8 percentages while rotating creates a zero-SVG liquid droplet.',
    htmlCode: `<div class="liquid-droplet"></div>`,
    cssCode: `.liquid-droplet {
  width: 84px;
  height: 84px;
  background: linear-gradient(135deg, #38bdf8, #6366f1);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  animation: liquidMorph 7s ease-in-out infinite;
}`,
  },
  {
    id: 'css-particle-field',
    title: '06. Floating Quantum Particle Lattice',
    category: 'Particle Systems',
    summary: 'Staggered phase-offset CSS keyframe particles drifting through a depth-sorted container.',
    howItWorks:
      'Each particle node uses custom `animation-delay` and `animation-duration` multipliers on `transform: translate3d(...)` and `opacity`, producing non-repetitive emergent drift with zero JavaScript overhead.',
    htmlCode: `<div class="particle-chamber">
  <span class="p-node p1"></span>
  <span class="p-node p2"></span>
  <span class="p-node p3"></span>
  <span class="p-node p4"></span>
</div>`,
    cssCode: `.p-node {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #38bdf8;
  animation: floatParticle 3.2s ease-in-out infinite;
}`,
  },
  {
    id: 'css-hover-transition',
    title: '07. Magnetic Reveal & Precision Elevation',
    category: 'Micro-Interactions',
    summary: 'Sub-180ms cubic-bezier hover elevation with directional arrow translation and hairline reveal.',
    howItWorks:
      'Uses `cubic-bezier(0.16, 1, 0.3, 1)` on `transform` so hover feedback starts instantaneously and settles smoothly without overshoot.',
    htmlCode: `<div class="interactive-tile">
  <span>Inspect Kernel Trace</span>
  <span class="arrow">→</span>
</div>`,
    cssCode: `.interactive-tile {
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 180ms ease;
}
.interactive-tile:hover {
  transform: translateY(-3px);
  border-color: #38bdf8;
}
.interactive-tile:hover .arrow {
  transform: translateX(5px);
}`,
  },
  {
    id: 'css-3d-flip-card',
    title: '08. 180° Spatial Dual-Side Flip Card',
    category: 'Card Mechanics',
    summary: 'Two-sided 3D card using `backface-visibility: hidden` to switch between specification and architecture view.',
    howItWorks:
      'Both `.card-front` and `.card-back` share the same bounding box with `backface-visibility: hidden`. The back face is pre-rotated `rotateY(180deg)`, and hovering the container rotates the inner wrapper `180deg`.',
    htmlCode: `<div class="flip-container">
  <div class="flip-inner">
    <div class="flip-front">Hover or Focus to Flip</div>
    <div class="flip-back">MVCC Snapshot Verified</div>
  </div>
</div>`,
    cssCode: `.flip-container { perspective: 800px; }
.flip-inner {
  transform-style: preserve-3d;
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
.flip-container:hover .flip-inner {
  transform: rotateY(180deg);
}
.flip-front, .flip-back {
  backface-visibility: hidden;
}
.flip-back {
  transform: rotateY(180deg);
}`,
  },
  {
    id: 'css-orbital-loader',
    title: '09. Dual-Ring Gyroscopic Loader',
    category: 'State Indicators',
    summary: 'Counter-rotating concentric conic/border arcs for deterministic async telemetry states.',
    howItWorks:
      'Two concentric circular borders use orthogonal transparent edges (`border-top-color: #38bdf8`) and counter-rotating `orbitalSpin` keyframes at harmonic durations (`1.2s` and `1.8s`).',
    htmlCode: `<div class="gyro-loader" role="status" aria-label="Loading">
  <div class="ring-outer"></div>
  <div class="ring-inner"></div>
</div>`,
    cssCode: `.ring-outer {
  border: 2px solid rgba(56, 189, 248, 0.15);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: orbitalSpin 1.2s linear infinite;
}
.ring-inner {
  border: 2px solid rgba(139, 92, 246, 0.15);
  border-bottom-color: #a855f7;
  border-radius: 50%;
  animation: orbitalSpin 1.8s linear infinite reverse;
}`,
  },
  {
    id: 'css-scroll-choreography',
    title: '10. Viewport Scroll-Progress Horizon Scan',
    category: 'Scroll Choreography',
    summary: 'Deterministic progress transform synchronized with scroll offset and interactive scrub control.',
    howItWorks:
      'Maps normalized scroll progress `[0, 1]` to `transform: scaleX(p)` and staggered layer translations (`translate3d(0, y, 0)`), avoiding layout thrashing during continuous scrolling.',
    htmlCode: `<div class="scroll-demo-stage">
  <div class="scan-bar"></div>
  <div class="stagger-row">Layer 01 // Normalized</div>
</div>`,
    cssCode: `.scan-bar {
  transform-origin: left center;
  transform: scaleX(var(--scroll-progress, 0.68));
  transition: transform 120ms linear;
}`,
    jsCode: `window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3));
}, { passive: true });`,
  },
];
