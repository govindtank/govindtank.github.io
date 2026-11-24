import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ThemeMode } from '../types';

interface WebglMonolithProps {
  exploded: boolean;
  pulseActive: boolean;
  theme: ThemeMode;
  motionEnabled: boolean;
}

const THEME_PALETTES: Record<ThemeMode, { primary: number; secondary: number; signal: number }> = {
  cyber: {
    primary: 0x22d3ee,   // Cyan 400
    secondary: 0x818cf8, // Indigo 400
    signal: 0x34d399,    // Emerald 400
  },
  impeller: {
    primary: 0xf43f5e,   // Rose 500
    secondary: 0x818cf8, // Indigo 400
    signal: 0xfbbf24,    // Amber 400
  },
  matrix: {
    primary: 0x10b981,   // Emerald 500
    secondary: 0x22d3ee, // Cyan 400
    signal: 0xa3e635,    // Lime 400
  },
};

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export default function WebglMonolith({
  exploded,
  pulseActive,
  theme,
  motionEnabled,
}: WebglMonolithProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ exploded, pulseActive, theme, motionEnabled });

  useEffect(() => {
    stateRef.current = { exploded, pulseActive, theme, motionEnabled };
  }, [exploded, pulseActive, theme, motionEnabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const palette = THEME_PALETTES[stateRef.current.theme];

    // Scene & Camera
    const scene = new THREE.Scene();
    const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
    const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    camera.position.set(0, 0.15, 7.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(palette.primary, 22, 20);
    keyLight.position.set(3.5, 3.2, 4.5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(palette.secondary, 18, 20);
    rimLight.position.set(-4, -2.5, 3);
    scene.add(rimLight);

    const signalLight = new THREE.PointLight(palette.signal, 12, 16);
    signalLight.position.set(0, 3.8, -2.5);
    scene.add(signalLight);

    // Main Group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Outer Chassis Frame
    const outerShape = createRoundedRectShape(2.26, 4.46, 0.3);
    const innerHole = createRoundedRectShape(2.08, 4.28, 0.23);
    outerShape.holes.push(innerHole);

    const frameGeo = new THREE.ExtrudeGeometry(outerShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 4,
    });
    frameGeo.center();

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    rootGroup.add(frameMesh);

    // Chassis Outer Wireframe Accent
    const frameWireMat = new THREE.MeshBasicMaterial({
      color: palette.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const frameWireMesh = new THREE.Mesh(frameGeo, frameWireMat);
    frameWireMesh.scale.setScalar(1.005);
    rootGroup.add(frameWireMesh);

    // 4 Exploded Internal Layers
    const layersConfig = [
      { zClosed: -0.09, zExploded: -1.45, color: palette.secondary, opacity: 0.22, wire: true },
      { zClosed: -0.03, zExploded: -0.48, color: palette.signal, opacity: 0.18, wire: false },
      { zClosed: 0.03, zExploded: 0.48, color: palette.primary, opacity: 0.18, wire: false },
      { zClosed: 0.09, zExploded: 1.45, color: palette.primary, opacity: 0.26, wire: true },
    ];

    const layerGroups: THREE.Group[] = [];
    const layerGlassMats: THREE.MeshPhysicalMaterial[] = [];
    const layerLineMats: THREE.LineBasicMaterial[] = [];

    const glassShape = createRoundedRectShape(1.98, 4.14, 0.2);
    const glassGeo = new THREE.ShapeGeometry(glassShape, 24);
    const edgesGeo = new THREE.EdgesGeometry(glassGeo);

    // Central connector line between exploded layers
    const connectorGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.6),
      new THREE.Vector3(0, 0, 1.6),
    ]);
    const connectorMat = new THREE.LineBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: 0,
    });
    const connectorLine = new THREE.Line(connectorGeo, connectorMat);
    rootGroup.add(connectorLine);

    layersConfig.forEach((cfg, idx) => {
      const layerGroup = new THREE.Group();
      layerGroup.position.z = cfg.zClosed;

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
        roughness: 0.12,
        metalness: 0.2,
        side: THREE.DoubleSide,
      });
      layerGlassMats.push(glassMat);

      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      layerGroup.add(glassMesh);

      const lineMat = new THREE.LineBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.65,
      });
      layerLineMats.push(lineMat);

      const wireMesh = new THREE.LineSegments(edgesGeo, lineMat);
      layerGroup.add(wireMesh);

      // Layer 0: NPU Core Chip (Silicon Die)
      if (idx === 0) {
        const chipGeo = new THREE.BoxGeometry(0.7, 0.7, 0.06);
        const chipMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.8,
          roughness: 0.2,
        });
        const chipMesh = new THREE.Mesh(chipGeo, chipMat);
        chipMesh.name = 'npuCore';
        chipMesh.position.set(0, -0.2, 0.02);

        const chipWireGeo = new THREE.EdgesGeometry(chipGeo);
        const chipWireMat = new THREE.LineBasicMaterial({ color: palette.primary });
        const chipWire = new THREE.LineSegments(chipWireGeo, chipWireMat);
        chipMesh.add(chipWire);

        layerGroup.add(chipMesh);
      }

      // Layer 1: Hardware Bus Traces
      if (idx === 1) {
        const tracePoints: THREE.Vector3[] = [];
        for (let t = -1.4; t <= 1.4; t += 0.4) {
          tracePoints.push(new THREE.Vector3(-0.8, t, 0.01));
          tracePoints.push(new THREE.Vector3(0.8, t, 0.01));
        }
        const traceGeo = new THREE.BufferGeometry().setFromPoints(tracePoints);
        const traceMat = new THREE.LineSegments(
          traceGeo,
          new THREE.LineBasicMaterial({ color: palette.signal, transparent: true, opacity: 0.35 })
        );
        layerGroup.add(traceMat);
      }

      // Layer 3: Dynamic Island Cutout Punch Hole + Status Pill
      if (idx === 3) {
        const islandGeo = new THREE.CapsuleGeometry(0.09, 0.42, 8, 16);
        islandGeo.rotateZ(Math.PI / 2);
        const islandMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
        const islandMesh = new THREE.Mesh(islandGeo, islandMat);
        islandMesh.position.set(0, 1.6, 0.01);

        const dotGeo = new THREE.SphereGeometry(0.032, 12, 12);
        const dotMat = new THREE.MeshBasicMaterial({ color: palette.primary });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        dotMesh.name = 'islandPulseDot';
        dotMesh.position.set(0.18, 1.6, 0.02);

        layerGroup.add(islandMesh);
        layerGroup.add(dotMesh);
      }

      rootGroup.add(layerGroup);
      layerGroups.push(layerGroup);
    });

    // Pointer Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotVelocityX = 0;
    let rotVelocityY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      rotVelocityY += dx * 0.008;
      rotVelocityX += dy * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize Observer
    const onResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Animation Loop
    const clock = new THREE.Clock();
    let animId = 0;
    let currentExplodeProgress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const { exploded: isExp, pulseActive: isPulse, theme: curTheme, motionEnabled: curMotion } = stateRef.current;
      const curPalette = THEME_PALETTES[curTheme];

      // Update light & material colors reactively
      keyLight.color.setHex(curPalette.primary);
      rimLight.color.setHex(curPalette.secondary);
      signalLight.color.setHex(curPalette.signal);
      frameWireMat.color.setHex(curPalette.primary);

      // Smooth layer explosion lerp
      const targetExplode = isExp ? 1 : 0;
      currentExplodeProgress += (targetExplode - currentExplodeProgress) * 0.08;
      connectorMat.opacity = currentExplodeProgress * 0.45;

      layerGroups.forEach((layer, idx) => {
        const cfg = layersConfig[idx];
        const targetZ = THREE.MathUtils.lerp(cfg.zClosed, cfg.zExploded, currentExplodeProgress);
        layer.position.z += (targetZ - layer.position.z) * 0.12;

        if (idx === 0) {
          const npu = layer.getObjectByName('npuCore');
          if (npu && curMotion) {
            npu.rotation.x = elapsedTime * 0.6;
            npu.rotation.y = elapsedTime * 0.85;
            const s = isPulse ? 1 + Math.sin(elapsedTime * 4.5) * 0.1 : 1;
            npu.scale.setScalar(s);
          }
        }
        if (idx === 3) {
          const dot = layer.getObjectByName('islandPulseDot');
          if (dot && curMotion) {
            const s = isPulse ? 0.9 + Math.sin(elapsedTime * 6) * 0.35 : 1;
            dot.scale.setScalar(s);
          }
        }
      });

      // Damping on pointer velocity
      if (!isDragging) {
        rotVelocityX *= 0.95;
        rotVelocityY *= 0.95;
      }

      // Idle breathing / wobble when motion enabled
      const idleRotX = curMotion ? Math.sin(elapsedTime * 0.42) * 0.15 - 0.2 : -0.2;
      const idleRotY = curMotion ? Math.cos(elapsedTime * 0.35) * 0.18 + 0.25 : 0.25;

      rootGroup.rotation.x += rotVelocityX + (idleRotX - rootGroup.rotation.x) * 0.04;
      rootGroup.rotation.y += rotVelocityY + (idleRotY - rootGroup.rotation.y) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      frameGeo.dispose();
      glassGeo.dispose();
      edgesGeo.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] cursor-grab active:cursor-grabbing select-none"
      title="Drag to orbit 3D Mobile Monolith"
    />
  );
}
