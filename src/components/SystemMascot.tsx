import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, MessageSquare, Terminal as TerminalIcon, Cpu, Smartphone } from 'lucide-react';

const MESSAGES = [
  "System Initializing... User: Govind Tank",
  "Architecting Scalable Solutions. v9.0.4",
  "Analyzing Project: Akshar Amrutam...",
  "Status: 99.9% Crash Free",
  "Clean Architecture Mode: Active",
  "I specialize in Kotlin & Flutter!",
  "Check out 'The Vault' below.",
  "Need a consultant? Let's connect!"
];

export default function SystemMascot() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const timer = setTimeout(() => setIsVisible(true), 3000);
    const interval = setInterval(() => {
      setIsThinking(true);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        setIsThinking(false);
      }, 500);
    }, 8000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Calculate rotation to "look" at mouse
  const rotation = {
    x: (mousePos.y - window.innerHeight / 2) / 50,
    y: (mousePos.x - window.innerWidth / 2) / 50,
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] pointer-events-none md:pointer-events-auto">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex flex-col items-end gap-3"
          >
            {/* Bubble */}
            <motion.div 
               animate={isThinking ? { scale: 0.95, opacity: 0.8 } : { scale: 1, opacity: 1 }}
               className="bg-slate-900/95 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl rounded-br-none shadow-[0_10px_40px_-10px_rgba(14,165,233,0.3)] max-w-[240px] relative"
            >
              <div className="flex gap-2 mb-2 items-center border-b border-white/5 pb-2">
                 <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">DRONE_GT_0X1</span>
              </div>
              <p className="text-[13px] text-white font-mono leading-relaxed">
                {MESSAGES[msgIndex]}
              </p>
              
              {/* Message tail */}
              <div className="absolute bottom-0 right-0 translate-x-[90%] -translate-y-[20%] w-0 h-0 border-l-[10px] border-l-slate-900/95 border-b-[10px] border-b-transparent transform scale-x-[-1]" />
            </motion.div>

            {/* Avatar - Floating Drone */}
            <motion.div 
              style={{
                perspective: "1000px",
                rotateX: rotation.x,
                rotateY: rotation.y,
              }}
              whileHover={{ scale: 1.1 }}
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 relative flex items-center justify-center cursor-pointer group"
            >
              {/* Halos */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-colors" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-primary/30 rounded-full border-dashed"
              />

              {/* Drone Body */}
              <div className="w-16 h-16 bg-slate-950 rounded-2xl border-2 border-primary/50 shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <Bot className="text-primary w-10 h-10 drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                
                {/* Scanning Laser Effect */}
                <motion.div 
                  animate={{ top: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-[2px] bg-sky-400/30 blur-[1px]"
                />
              </div>
              
              {/* Status Light */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex gap-2"
            >
              <ControlButton icon={<Cpu className="w-3 h-3" />} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <ControlButton icon={<MessageSquare className="w-3 h-3" />} onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlButton({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ y: -2, scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="p-2.5 glass-card bg-slate-900/80 border-white/10 hover:border-primary/50 text-slate-400 hover:text-white transition-all shadow-xl"
    >
      {icon}
    </motion.button>
  );
}

