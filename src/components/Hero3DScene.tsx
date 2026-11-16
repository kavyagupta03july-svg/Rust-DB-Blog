import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Compass, EyeOff, Eye, Sliders } from 'lucide-react';

export type CameraPreset = 'overview' | 'orbital' | 'core' | 'zen';

interface Hero3DSceneProps {
  onExploreArticles: () => void;
  onDiscoverTech: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  articleCount: number;
  dynamicPhrase: string;
  onCyclePhrase: () => void;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({
  onExploreArticles,
  onDiscoverTech,
  theme,
  onToggleTheme,
  articleCount,
  dynamicPhrase,
  onCyclePhrase,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [rotationSpeed, setRotationSpeed] = useState<number>(1);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [webglReady, setWebglReady] = useState<boolean>(true);

  const sceneStateRef = useRef<{
    preset: CameraPreset;
    speed: number;
    pointerX: number;
    pointerY: number;
    scrollRatio: number;
    theme: 'dark' | 'light';
  }>({
    preset: 'overview',
    speed: 1,
    pointerX: 0,
    pointerY: 0,
    scrollRatio: 0,
    theme,
  });

  useEffect(() => {
    sceneStateRef.current.preset = cameraPreset;
  }, [cameraPreset]);

  useEffect(() => {
    sceneStateRef.current.speed = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    sceneStateRef.current.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = null;
    }

    if (!renderer) {
      // Real-time 3D Matrix Perspective Projection Engine for environments without WebGL
      const canvas2d = document.createElement('canvas');
      mountEl.innerHTML = '';
      mountEl.appendChild(canvas2d);
      const ctx = canvas2d.getContext('2d');
      if (!ctx) return;

      const syncSize = () => {
        const w = mountEl.clientWidth || window.innerWidth;
        const h = mountEl.clientHeight || 720;
        canvas2d.width = w;
        canvas2d.height = h;
      };
      syncSize();
      const ro = new ResizeObserver(syncSize);
      ro.observe(mountEl);

      // Build 3D Fibonacci sphere vertices + 3 orbital rings + starfield
      const N = 84;
      const sphereNodes = Array.from({ length: N }, (_, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        return {
          x: Math.sin(phi) * Math.cos(theta),
          y: Math.cos(phi),
          z: Math.sin(phi) * Math.sin(theta),
          isAccent: i % 3 === 0,
        };
      });

      const stars = Array.from({ length: 140 }, (_, i) => ({
        x: ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 1400,
        y: ((Math.cos(i * 78.233) * 23421.631) % 1) * 800,
        r: (i % 3) * 0.6 + 0.8,
      }));

      const onPointerMove2d = (e: PointerEvent) => {
        const rect = mountEl.getBoundingClientRect();
        sceneStateRef.current.pointerX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
        sceneStateRef.current.pointerY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      };
      window.addEventListener('pointermove', onPointerMove2d, { passive: true });

      let angleY = 0.4;
      let angleX = 0.28;
      let rafId = 0;

      const project3D = (
        px: number,
        py: number,
        pz: number,
        cx: number,
        cy: number,
        rotX: number,
        rotY: number,
        focal: number
      ) => {
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = px * cosY - pz * sinY;
        const z1 = pz * cosY + px * sinY;
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = py * cosX - z1 * sinX;
        const z2 = z1 * cosX + py * sinX;
        const scale = focal / Math.max(120, focal + z2 + 260);
        return { sx: cx + x1 * scale, sy: cy + y2 * scale, z: z2, scale };
      };

      const render2dLoop = () => {
        const w = canvas2d.width;
        const h = canvas2d.height;
        ctx.clearRect(0, 0, w, h);

        const { preset, speed, pointerX, pointerY } = sceneStateRef.current;
        const step = prefersReducedMotion ? 0 : 0.008 * speed;
        angleY += step + pointerX * 0.006;
        angleX += (0.28 + pointerY * 0.35 - angleX) * 0.06;

        const cx = w > 900 ? w * 0.72 : w * 0.5;
        const cy = h * 0.46;
        const radius =
          preset === 'core' ? 235 : preset === 'orbital' ? 165 : preset === 'zen' ? 205 : 185;
        const focal = 560;

        // Ambient starfield
        for (const st of stars) {
          const sx = (st.x + w) % w;
          const sy = (st.y + h) % h;
          ctx.fillStyle = 'rgba(125, 211, 252, 0.35)';
          ctx.beginPath();
          ctx.arc(sx, sy, st.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Core atmospheric glow
        const coreGrad = ctx.createRadialGradient(cx, cy, 12, cx, cy, radius * 1.45);
        coreGrad.addColorStop(0, 'rgba(37, 99, 235, 0.42)');
        coreGrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.16)');
        coreGrad.addColorStop(1, 'rgba(6, 9, 19, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.45, 0, Math.PI * 2);
        ctx.fill();

        // Draw 3D Orbital Rings (Equatorial, Polar, Outer Gimbal)
        const rings = [
          { r: radius * 1.38, tiltX: 1.15, tiltZ: 0.18, color: 'rgba(56, 189, 248, 0.65)', width: 1.8 },
          { r: radius * 1.56, tiltX: -0.75, tiltZ: 0.62, color: 'rgba(192, 132, 252, 0.55)', width: 1.4 },
          { r: radius * 1.72, tiltX: 0.42, tiltZ: -0.5, color: 'rgba(148, 163, 184, 0.35)', width: 1.1 },
        ];

        for (const ring of rings) {
          ctx.beginPath();
          const segs = 72;
          for (let s = 0; s <= segs; s++) {
            const u = (s / segs) * Math.PI * 2 + angleY * 0.6;
            const rx = Math.cos(u) * ring.r;
            const ry = Math.sin(u) * ring.r * Math.sin(ring.tiltX);
            const rz = Math.sin(u) * ring.r * Math.cos(ring.tiltX);
            const rxTilted = rx * Math.cos(ring.tiltZ) - ry * Math.sin(ring.tiltZ);
            const ryTilted = rx * Math.sin(ring.tiltZ) + ry * Math.cos(ring.tiltZ);
            const p = project3D(rxTilted, ryTilted, rz, cx, cy, angleX * 0.5, 0, focal);
            if (s === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          }
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = ring.width;
          ctx.stroke();
        }

        // Project 3D Geodesic Sphere Nodes & Lattice Edges
        const projected = sphereNodes.map((n) =>
          project3D(n.x * radius, n.y * radius, n.z * radius, cx, cy, angleX, angleY, focal)
        );

        for (let i = 0; i < projected.length; i++) {
          for (let j = i + 1; j < projected.length; j++) {
            const dx = projected[i].sx - projected[j].sx;
            const dy = projected[i].sy - projected[j].sy;
            const dist = Math.hypot(dx, dy);
            if (dist < radius * 0.46) {
              const depthAlpha = Math.max(0.08, (1 - dist / (radius * 0.46)) * 0.55);
              ctx.strokeStyle = `rgba(56, 189, 248, ${depthAlpha.toFixed(2)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(projected[i].sx, projected[i].sy);
              ctx.lineTo(projected[j].sx, projected[j].sy);
              ctx.stroke();
            }
          }
        }

        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          const isFront = p.z < 40;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, Math.max(1.8, (sphereNodes[i].isAccent ? 4.2 : 2.8) * p.scale), 0, Math.PI * 2);
          ctx.fillStyle = sphereNodes[i].isAccent
            ? isFront
              ? '#c084fc'
              : 'rgba(192, 132, 252, 0.4)'
            : isFront
            ? '#38bdf8'
            : 'rgba(56, 189, 248, 0.4)';
          ctx.fill();
        }

        rafId = requestAnimationFrame(render2dLoop);
      };

      render2dLoop();

      return () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        window.removeEventListener('pointermove', onPointerMove2d);
      };
    }

    const glRenderer = renderer;
    const width = mountEl.clientWidth || window.innerWidth;
    const height = mountEl.clientHeight || 720;

    glRenderer.setSize(width, height);
    glRenderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    glRenderer.outputColorSpace = THREE.SRGBColorSpace;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.25;
    glRenderer.shadowMap.enabled = !isSoftwareGl;
    glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.innerHTML = '';
    mountEl.appendChild(glRenderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.032);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    camera.position.set(0, 0.5, 9.0);

    // Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(glRenderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 1.4);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    keyLight.position.set(6, 8, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
    rimLight.position.set(-6, 4, 5);
    scene.add(rimLight);

    // Composite 8-Part Procedural 3D Technology Globe & Spatial Assembly (THREE.Group)
    const globeAssembly = new THREE.Group();
    globeAssembly.position.set(2.35, 0.15, 0);
    scene.add(globeAssembly);

    // Part 1: Inner Core Sphere (metalness <= 0.25 per games_3d.md so surfaces never reflect black vacuum)
    const coreGeo = new THREE.IcosahedronGeometry(1.32, 3);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x1e40af,
      emissiveIntensity: 0.75,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeAssembly.add(coreMesh);

    // Part 2: Geodesic Wireframe Lattice Shell
    const shellGeo = new THREE.IcosahedronGeometry(1.76, 2);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    globeAssembly.add(shellMesh);

    // Part 3: Equatorial Precision Beveled Telemetry Ring
    const eqRingGeo = new THREE.TorusGeometry(2.38, 0.045, 16, 96);
    const eqRingMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      roughness: 0.25,
      metalness: 0.22,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
    });
    const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    eqRing.rotation.x = Math.PI / 2.25;
    globeAssembly.add(eqRing);

    // Part 4: Polar Inclined Orbital Ring
    const polarRingGeo = new THREE.TorusGeometry(2.74, 0.036, 14, 96);
    const polarRingMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      roughness: 0.45,
      metalness: 0.2,
      emissive: 0xa855f7,
      emissiveIntensity: 0.85,
    });
    const polarRing = new THREE.Mesh(polarRingGeo, polarRingMat);
    polarRing.rotation.set(0.95, 0.4, 0.2);
    globeAssembly.add(polarRing);

    // Part 5: Outer Gyroscope Gimbal Ring
    const outerRingGeo = new THREE.TorusGeometry(3.12, 0.028, 12, 96);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.65,
      metalness: 0.2,
      emissive: 0x64748b,
      emissiveIntensity: 0.65,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.set(-0.6, -0.5, 0.35);
    globeAssembly.add(outerRing);

    // Part 6: InstancedMesh of 48 Orbital Data Relay Nodes on Fibonacci Sphere
    const relayCount = 48;
    const relayNodeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.26);
    const relayNodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0x7dd3fc,
      emissiveIntensity: 0.95,
    });
    const relayInstanced = new THREE.InstancedMesh(relayNodeGeo, relayNodeMat, relayCount);
    const dummyObj = new THREE.Object3D();
    const tempColor = new THREE.Color();

    for (let i = 0; i < relayCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / relayCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 1.82 + (i % 3) * 0.16;

      dummyObj.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      dummyObj.lookAt(0, 0, 0);
      const scaleVar = 0.85 + (i % 5) * 0.09;
      dummyObj.scale.set(scaleVar, scaleVar, scaleVar);
      dummyObj.updateMatrix();
      relayInstanced.setMatrixAt(i, dummyObj.matrix);

      tempColor.setHex(i % 2 === 0 ? 0x7dd3fc : 0xd8b4fe);
      relayInstanced.setColorAt(i, tempColor);
    }
    relayInstanced.instanceMatrix.needsUpdate = true;
    if (relayInstanced.instanceColor) relayInstanced.instanceColor.needsUpdate = true;
    relayInstanced.computeBoundingSphere();
    globeAssembly.add(relayInstanced);

    // Part 7: Composite Floating Satellite Clusters (Octahedron Hull + Solar Fins)
    const satellitesGroup = new THREE.Group();
    const satHullGeo = new THREE.OctahedronGeometry(0.26, 0);
    const satFinGeo = new THREE.BoxGeometry(0.76, 0.03, 0.18);
    const satHullMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.2,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.7,
    });
    const satFinMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
    });

    for (let s = 0; s < 4; s++) {
      const satNode = new THREE.Group();
      const hull = new THREE.Mesh(satHullGeo, satHullMat);
      const fin = new THREE.Mesh(satFinGeo, satFinMat);
      satNode.add(hull, fin);
      const angle = (s / 4) * Math.PI * 2;
      satNode.position.set(
        Math.cos(angle) * 3.35,
        (s % 2 === 0 ? 1 : -1) * 0.8,
        Math.sin(angle) * 3.35
      );
      satellitesGroup.add(satNode);
    }
    globeAssembly.add(satellitesGroup);

    // Part 8: Grounding Radial Contact Shadow Disc & Spatial Particle Field
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const contactPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 7.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.75,
      })
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(2.55, -3.25, 0);
    scene.add(contactPlane);

    // Ambient Particle Field
    const particleCount = 260;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.065,
      transparent: true,
      opacity: 0.75,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    if (!isSoftwareGl) {
      glRenderer.compile(scene, camera);
    }

    const targetCamPos = new THREE.Vector3(0, 0.5, 9.0);
    const targetLookAt = new THREE.Vector3(0.65, 0.1, 0);
    const currentLookAt = new THREE.Vector3(0.65, 0.1, 0);

    const onPointerMove = (e: PointerEvent) => {
      const rect = mountEl.getBoundingClientRect();
      sceneStateRef.current.pointerX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      sceneStateRef.current.pointerY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };

    const onScroll = () => {
      const ratio = Math.min(1, Math.max(0, window.scrollY / 700));
      sceneStateRef.current.scrollRatio = ratio;
    };

    let lastW = width;
    let lastH = height;

    const updateSize = () => {
      if (!mountEl) return;
      const w = mountEl.clientWidth || window.innerWidth;
      const h = mountEl.clientHeight || 720;
      globeAssembly.position.x = w < 768 ? 0.85 : 2.15;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      glRenderer.setSize(w, h);
      glRenderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(mountEl);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateSize);

    let lastTimeMs = performance.now();
    let elapsedSec = 0;
    let frameId = 0;
    let isDisposed = false;

    function afterDraw(cb: () => void) {
      const gl = glRenderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (isDisposed) return;
      const nowMs = performance.now();
      const dt = Math.min(Math.max((nowMs - lastTimeMs) / 1000, 0.016), 0.1);
      lastTimeMs = nowMs;
      elapsedSec += dt;

      const { preset, speed, pointerX, pointerY, scrollRatio } = sceneStateRef.current;
      const motionFactor = prefersReducedMotion ? 0 : speed;

      // Rotate composite parts with distinct harmonic velocities
      coreMesh.rotation.y += dt * 0.35 * motionFactor;
      shellMesh.rotation.y -= dt * 0.22 * motionFactor;
      shellMesh.rotation.x += dt * 0.1 * motionFactor;
      eqRing.rotation.z += dt * 0.45 * motionFactor;
      polarRing.rotation.y -= dt * 0.3 * motionFactor;
      outerRing.rotation.x += dt * 0.22 * motionFactor;
      satellitesGroup.rotation.y += dt * 0.38 * motionFactor;
      particleSystem.rotation.y += dt * 0.04 * motionFactor;

      globeAssembly.position.y = 0.15 + Math.sin(elapsedSec * 1.4) * 0.12 - scrollRatio * 0.5;

      if (preset === 'orbital') {
        targetCamPos.set(3.2 + pointerX * 0.8, 2.3 - pointerY * 0.6, 6.2);
        targetLookAt.set(2.4, 0.1, 0);
      } else if (preset === 'core') {
        targetCamPos.set(2.55 + pointerX * 0.4, 0.2 - pointerY * 0.4, 4.5);
        targetLookAt.set(2.55, 0.15, 0);
      } else if (preset === 'zen') {
        targetCamPos.set(1.8 + pointerX * 1.1, 0.4 - pointerY * 0.7, 7.2);
        targetLookAt.set(2.2, 0.1, 0);
      } else {
        targetCamPos.set(
          pointerX * 0.55,
          0.45 - pointerY * 0.4 + scrollRatio * 0.6,
          8.8 + scrollRatio * 1.4
        );
        targetLookAt.set(0.65, 0.1, 0);
      }

      const dampAlpha = 1 - Math.exp(-5.0 * dt);
      camera.position.lerp(targetCamPos, dampAlpha);
      currentLookAt.lerp(targetLookAt, dampAlpha);
      camera.lookAt(currentLookAt);

      glRenderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateSize);
      coreGeo.dispose();
      coreMat.dispose();
      shellGeo.dispose();
      shellMat.dispose();
      eqRingGeo.dispose();
      eqRingMat.dispose();
      polarRingGeo.dispose();
      polarRingMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      relayNodeGeo.dispose();
      relayNodeMat.dispose();
      satHullGeo.dispose();
      satFinGeo.dispose();
      satHullMat.dispose();
      satFinMat.dispose();
      shadowTex.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      glRenderer.dispose();
    };
  }, []);

  return (
    <section
      aria-label="Hero 3D Technology Environment"
      className="relative w-full min-h-[720px] lg:min-h-[760px] bg-[#060913] text-slate-100 overflow-hidden border-b border-slate-800"
    >
      {/* Subtle Ambient Radial Glow Behind the 3D Globe Zone */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[6%] top-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full bg-blue-600/15 blur-3xl z-0"
      />

      {/* Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        data-testid="hero-3d-canvas"
        className="absolute inset-0 w-full h-full z-0"
      />

      {!webglReady && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#060913] via-[#0f172a] to-[#1e1b4b] z-0" />
      )}

      {/* Responsive Contrast Scrim: Full readability on mobile, left-half scrim on laptop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:w-[58%] z-[2] bg-gradient-to-b from-[#060913]/92 via-[#060913]/85 to-[#060913]/96 lg:bg-gradient-to-r lg:from-[#060913] lg:via-[#060913]/88 lg:to-transparent"
      />

      {/* Main Hero Foreground Content */}
      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 pb-44 sm:pt-14 sm:pb-40 lg:pt-20 lg:pb-36 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div
          className={`lg:col-span-7 transition-opacity duration-200 ${
            cameraPreset === 'zen' ? 'opacity-20 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Quiet Editorial Kicker */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-mono text-sky-400 mb-3 sm:mb-4 tracking-wide">
            <span>RUSTDB ENGINEERING &amp; SPATIAL SYSTEMS BLOG</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{articleCount} RustDB &amp; Systems Dispatches</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <button
              type="button"
              onClick={onCyclePhrase}
              className="text-emerald-400 hover:underline cursor-pointer"
              title="Click to cycle dynamic title topic"
            >
              ● Dynamic Title: {dynamicPhrase}
            </button>
          </div>

          <h1
            className="font-display font-bold tracking-tight text-white mb-5 sm:mb-6"
            style={{
              fontSize: 'clamp(1.95rem, 4.2vw, 3.75rem)',
              lineHeight: 1.1,
              textWrap: 'balance',
            }}
          >
            <span className="block">Mastering RustDB &amp;</span>
            <span
              key={dynamicPhrase}
              data-testid="hero-dynamic-title"
              onClick={onCyclePhrase}
              className="inline-block animate-dynamic-title bg-gradient-to-r from-sky-400 via-blue-400 to-purple-400 bg-clip-text text-transparent cursor-pointer"
            >
              {dynamicPhrase}
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed mb-6 sm:mb-8">
            Explore how RustDB relational storage engines are written from scratch—featuring
            step-by-step animated Rust code execution, real-time program output, B+Tree page splits,
            and interactive 3D WebGL visualizations optimized for mobile and laptop viewports.
          </p>

          {/* Primary & Secondary CTAs (Full width on small mobile, inline on tablet/laptop) */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <button
              type="button"
              onClick={onExploreArticles}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm text-center transition-transform duration-150 active:scale-98 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              Explore Articles
            </button>
            <button
              type="button"
              onClick={onDiscoverTech}
              className="px-6 py-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 font-semibold text-sm text-center transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Watch RustDB Code Animation
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="px-4 py-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium text-center transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Surface Theme: {theme === 'dark' ? 'Deep Obsidian' : 'Daylight Slate'}
            </button>
          </div>

          {/* Architectural Proof Strip (Comfortable 3-column on tablet/laptop, clean compact grid on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-800/90 max-w-xl">
            <div className="flex sm:block items-center justify-between">
              <div className="text-xs text-slate-400 sm:mb-1">Storage Kernel</div>
              <div className="text-xs sm:text-sm font-mono font-semibold text-slate-100 tabular-nums">
                RustDB &amp; B+Tree MVCC
              </div>
            </div>
            <div className="flex sm:block items-center justify-between">
              <div className="text-xs text-slate-400 sm:mb-1">Live Code Execution</div>
              <div className="text-xs sm:text-sm font-mono font-semibold text-slate-100 tabular-nums">
                Sandboxed JS / CSS / HTML
              </div>
            </div>
            <div className="flex sm:block items-center justify-between">
              <div className="text-xs text-slate-400 sm:mb-1">3D Viewport Pipeline</div>
              <div className="text-xs sm:text-sm font-mono font-semibold text-slate-100 tabular-nums">
                ACES Filmic PBR
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Collapsible Bottom Control Dock (Centered via Flexbox, Mobile Scroll-Safe) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 sm:bottom-4 z-20 flex justify-center px-3 sm:px-4">
        <div
          className="pointer-events-auto w-full max-w-[860px] transition-transform duration-200"
          style={{
            transform: dockCollapsed ? 'translateY(calc(100% - 32px))' : 'translateY(0)',
          }}
        >
          <div className="flex justify-center mb-1">
            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              aria-expanded={!dockCollapsed}
              className="px-3 py-1 rounded-t-md bg-[#0b1120] border border-b-0 border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              {dockCollapsed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{dockCollapsed ? 'Show 3D Globe Controls' : 'Hide 3D Globe Controls'}</span>
            </button>
          </div>

          <div className="bg-[#0b1120]/95 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shadow-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Compass className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-mono text-slate-400 mr-1 whitespace-nowrap">
                3D Camera:
              </span>
              {(
                [
                  { id: 'overview', label: 'Global Core' },
                  { id: 'orbital', label: 'Orbital Rings' },
                  { id: 'core', label: 'Close Inspection' },
                  { id: 'zen', label: 'Cinema View' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCameraPreset(item.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    cameraPreset === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <label
                  htmlFor="globe-speed-slider"
                  className="text-xs font-mono text-slate-400 whitespace-nowrap"
                >
                  Orbit Velocity:
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="globe-speed-slider"
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.25"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-24 accent-blue-500 cursor-pointer"
                />
                <span className="text-xs font-mono text-sky-400 tabular-nums w-9 text-right">
                  {rotationSpeed.toFixed(1)}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
