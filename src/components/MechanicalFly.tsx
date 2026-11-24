import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

export default function MechanicalFly() {
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Track target position with spring physics for natural drone/fly glide
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth - 120 : 500);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? 200 : 200);

  // Smooth springs for position and rotation
  const springConfig = { damping: 25, stiffness: 120, mass: 0.6 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  
  const lastPos = useRef({ x: 500, y: 200, time: Date.now() });
  const [flyAngle, setFlyAngle] = useState(0);
  const [wingSpeed, setWingSpeed] = useState(0.06);

  useEffect(() => {
    setIsMounted(true);
    let targetX = window.innerWidth - 140;
    let targetY = 220;
    let wanderAngle = 0;
    let lastScrollY = window.scrollY;

    const handleMouseMove = (e: MouseEvent) => {
      // Offset slightly from cursor so it hovers companion-style
      const offsetX = (Math.sin(Date.now() / 600) * 45) + 35;
      const offsetY = (Math.cos(Date.now() / 600) * 35) - 45;
      targetX = e.clientX + offsetX;
      targetY = e.clientY + offsetY;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      // Fly reacts dynamically to fast scrolls
      targetY += deltaY * 0.4;
      setWingSpeed(0.03); // Faster flapping during scroll
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Organic autonomous hovering / micro-movements
    const loopInterval = setInterval(() => {
      wanderAngle += 0.08;
      const microJitterX = Math.sin(wanderAngle * 1.5) * 18;
      const microJitterY = Math.cos(wanderAngle * 1.8) * 14;
      
      const clampedX = Math.max(30, Math.min(window.innerWidth - 60, targetX + microJitterX));
      const clampedY = Math.max(30, Math.min(window.innerHeight - 60, targetY + microJitterY));
      
      // Calculate heading angle
      const dx = clampedX - lastPos.current.x;
      const dy = clampedY - lastPos.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const rad = Math.atan2(dy, dx);
        const deg = (rad * 180) / Math.PI;
        setFlyAngle(deg + 90);
        setWingSpeed(0.04);
      } else {
        setWingSpeed(0.08);
      }

      lastPos.current = { x: clampedX, y: clampedY, time: Date.now() };
      mouseX.set(clampedX);
      mouseY.set(clampedY);
    }, 40);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(loopInterval);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <motion.div
      style={{
        x: smoothX,
        y: smoothY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      id="mechanical-fly-drone"
      className="fixed top-0 left-0 z-[9999] pointer-events-auto cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        // Playful boost upward on click
        mouseY.set(mouseY.get() - 120);
      }}
    >
      <div 
        style={{ transform: `rotate(${flyAngle}deg)` }} 
        className="relative w-12 h-12 flex items-center justify-center transition-transform duration-150 ease-out"
      >
        {/* Sci-fi scanner aura */}
        <div className="absolute inset-0 bg-sky-500/15 rounded-full blur-md animate-pulse" />
        
        {/* Left Wing */}
        <motion.div
          animate={{
            rotateY: [0, 75, 0],
            rotateZ: [-25, -55, -25],
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{
            repeat: Infinity,
            duration: wingSpeed,
            ease: "easeInOut",
          }}
          className="absolute -left-3 top-1 w-6 h-3 bg-gradient-to-r from-sky-400/80 to-transparent border border-sky-300/60 rounded-full origin-right backdrop-blur-xs shadow-[0_0_8px_rgba(56,189,248,0.6)]"
        />

        {/* Right Wing */}
        <motion.div
          animate={{
            rotateY: [0, -75, 0],
            rotateZ: [25, 55, 25],
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{
            repeat: Infinity,
            duration: wingSpeed,
            ease: "easeInOut",
          }}
          className="absolute -right-3 top-1 w-6 h-3 bg-gradient-to-l from-sky-400/80 to-transparent border border-sky-300/60 rounded-full origin-left backdrop-blur-xs shadow-[0_0_8px_rgba(56,189,248,0.6)]"
        />

        {/* Cyberpunk Mechanical Body */}
        <div className="relative w-4 h-7 bg-slate-900 border border-sky-400/80 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.5)] flex flex-col items-center justify-between p-0.5">
          {/* Head & Scanner Optics */}
          <div className="w-2.5 h-2 bg-slate-800 rounded-t-full border-b border-sky-400/50 flex items-center justify-center">
            <div className="w-1.5 h-1 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
          </div>

          {/* Core Micro-Reactor */}
          <div className="w-2 h-2 rounded-full bg-sky-400/90 shadow-[0_0_8px_rgba(56,189,248,1)] flex items-center justify-center">
            <div className="w-0.5 h-0.5 bg-white rounded-full" />
          </div>

          {/* Tail Plasma Thruster */}
          <div className="w-1.5 h-1.5 bg-amber-400/80 rounded-b-full shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        </div>

        {/* Hover telemetry tooltip */}
        {isHovered && (
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-sky-500/40 px-2 py-0.5 rounded text-[9px] font-mono text-sky-400 font-bold shadow-xl tracking-wider uppercase pointer-events-none">
            DRONE_COMPANION // ONLINE
          </div>
        )}
      </div>
    </motion.div>
  );
}
