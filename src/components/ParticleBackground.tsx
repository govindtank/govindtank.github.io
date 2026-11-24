import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThemeMode } from '../types';

interface ParticleBackgroundProps {
  theme: ThemeMode;
  motionEnabled: boolean;
}

const THEME_COLORS: Record<ThemeMode, number> = {
  cyber: 0x22d3ee,   // Cyan
  impeller: 0xf43f5e,// Rose
  matrix: 0x10b981,  // Emerald
};

const THEME_RGB: Record<ThemeMode, string> = {
  cyber: '34, 211, 238',
  impeller: '244, 63, 94',
  matrix: '16, 185, 129',
};

export default function ParticleBackground({ theme, motionEnabled }: ParticleBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ theme, motionEnabled });
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [hasMoved, setHasMoved] = useState(false);
  const scrollRef = useRef({ y: 0, targetY: 0, velocity: 0, lastY: 0 });

  useEffect(() => {
    stateRef.current = { theme, motionEnabled };
  }, [theme, motionEnabled]);

  // Track global mouse position and scroll for ambient hover & scroll aliveness
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!hasMoved) setHasMoved(true);
    };

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - scrollRef.current.lastY;
      scrollRef.current.lastY = currentY;
      scrollRef.current.targetY = currentY;
      scrollRef.current.velocity = Math.max(-50, Math.min(50, delta));
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMoved]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Particle Cloud with Base & Offset Coordinates for Magnetic Hover
    const particleCount = 700;
    const geometry = new THREE.BufferGeometry();
    const basePositions = new Float32Array(particleCount * 3);
    const currentPositions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 1200;
      const y = (Math.random() - 0.5) * 1200;
      const z = (Math.random() - 0.5) * 800;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      currentPositions[i * 3] = x;
      currentPositions[i * 3 + 1] = y;
      currentPositions[i * 3 + 2] = z;

      scales[i] = Math.random() * 2.2 + 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.PointsMaterial({
      color: THEME_COLORS[stateRef.current.theme],
      size: 2.6,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Distant Celestial Wireframe Planet with Ultra-Low Opacity (Atmospheric Background)
    const planetGroup = new THREE.Group();
    planetGroup.position.set(420, 90, -320);
    scene.add(planetGroup);

    const planetGeo = new THREE.SphereGeometry(140, 22, 18);
    const planetMat = new THREE.MeshBasicMaterial({
      color: THEME_COLORS[stateRef.current.theme],
      wireframe: true,
      transparent: true,
      opacity: 0.065,
      blending: THREE.AdditiveBlending,
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    // Orbital Ring System
    const ringGeo = new THREE.RingGeometry(180, 235, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: THEME_COLORS[stateRef.current.theme],
      wireframe: true,
      transparent: true,
      opacity: 0.045,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.5;
    ringMesh.rotation.y = Math.PI / 10;
    planetGroup.add(ringMesh);

    // Orbiting Satellite Beacon
    const satGeo = new THREE.SphereGeometry(4.5, 8, 8);
    const satMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const satMesh = new THREE.Mesh(satGeo, satMat);
    planetGroup.add(satMesh);

    // Dynamic Hover & Scroll Inertia
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let normalizedMouseX = 0;
    let normalizedMouseY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetX = (e.clientX - halfW) * 0.05;
      targetY = (e.clientY - halfH) * 0.05;

      // Normalized coordinates (-600 to 600 in Three space)
      normalizedMouseX = ((e.clientX / window.innerWidth) - 0.5) * 1200;
      normalizedMouseY = -((e.clientY / window.innerHeight) - 0.5) * 800;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const { theme: curTheme, motionEnabled: curMotion } = stateRef.current;

      material.color.setHex(THEME_COLORS[curTheme]);
      planetMat.color.setHex(THEME_COLORS[curTheme]);
      ringMat.color.setHex(THEME_COLORS[curTheme]);

      // Smooth scroll interpolation for 3D parallax depth
      const scroll = scrollRef.current;
      scroll.y += (scroll.targetY - scroll.y) * 0.08;
      scroll.velocity *= 0.92;

      if (curMotion) {
        particles.rotation.y = elapsed * 0.035;
        particles.rotation.x = elapsed * 0.015 + scroll.velocity * 0.0005;

        // Rotate celestial planet & ring system
        planetMesh.rotation.y = elapsed * 0.045 + scroll.y * 0.0004;
        planetMesh.rotation.x = 0.2 + Math.sin(elapsed * 0.03) * 0.04;
        ringMesh.rotation.z = elapsed * 0.02;

        // Orbit satellite
        const satAngle = elapsed * 0.35;
        satMesh.position.set(
          Math.cos(satAngle) * 190,
          Math.sin(satAngle * 0.8) * 35,
          Math.sin(satAngle) * 190
        );
      }

      // Parallax camera displacement linked to scroll and pointer
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      camera.position.x = mouseX;
      camera.position.y = -mouseY - (scroll.y * 0.04);
      camera.position.z = 400 + (scroll.velocity * 0.4);
      camera.lookAt(scene.position);

      // Magnetic Fluid Reaction: Gently repel particles near mouse pointer
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i += 2) {
        const i3 = i * 3;
        const bx = basePositions[i3];
        const by = basePositions[i3 + 1];
        const bz = basePositions[i3 + 2];

        const dx = bx - normalizedMouseX;
        const dy = by - normalizedMouseY;
        const distSq = dx * dx + dy * dy;

        // Repel within 140px radius with smooth inverse falloff
        if (distSq < 19600 && distSq > 0) {
          const force = (1 - Math.sqrt(distSq) / 140) * 28;
          positions[i3] = bx + (dx / Math.sqrt(distSq)) * force;
          positions[i3 + 1] = by + (dy / Math.sqrt(distSq)) * force;
        } else {
          // Spring back to base position
          positions[i3] += (bx - positions[i3]) * 0.08;
          positions[i3 + 1] += (by - positions[i3 + 1]) * 0.08;
          positions[i3 + 2] = bz;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      planetGeo.dispose();
      planetMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      satGeo.dispose();
      satMat.dispose();
    };
  }, []);

  const rgb = THEME_RGB[theme] || THEME_RGB.cyber;

  return (
    <>
      {/* 3D WebGL Particle Starfield Canvas with Scroll & Magnetic Parallax */}
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-95"
        aria-hidden="true"
      />

      {/* Reactive Cursor Spotlight Hover Aura */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
        style={{
          opacity: hasMoved ? 1 : 0,
          background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${rgb}, 0.055) 0%, rgba(${rgb}, 0.015) 45%, transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* Subtle CAD Tech Grid Illuminated by Cursor Hover */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-500"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, black 15%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, black 15%, transparent 80%)`,
        }}
        aria-hidden="true"
      />
    </>
  );
}
