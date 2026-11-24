import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

const MILESTONES = [
  {
    id: 'rysun-lead',
    year: '2025+',
    type: 'work',
    title: 'Lead Mobile Developer & Senior Software Engineer',
    institution: 'Rysun Labs Pvt. Ltd.',
    period: 'Nov 2025 – Present',
    location: 'Ahmedabad, India',
    badge: 'CURRENT LEAD',
    journeyPhase: 'LEAD COMMAND',
    highlights: [
      "Directed the full technical overhaul of 'BAPS Prakash' (50k+ active users), building an encrypted audio streaming pipeline via AWS CloudFront Signed Cookies.",
      'Integrated background audio_service with native Android Auto vehicle projections, lock-screen media sessions, and gapless playback caching.',
      'Constructed high-concurrency Node.js & TypeScript microservices powering internal enterprise mobile apps.',
      'Enforced automated CI quality gates with LeakCanary heap verification, sustaining 99.95% crash-free session SLAs.',
    ],
    stack: ['Kotlin 2.x', 'Flutter Impeller', 'AWS CloudFront', 'Android Auto', 'Node.js', 'audio_service'],
  },
  {
    id: 'rysun-senior',
    year: '2022',
    type: 'work',
    title: 'Senior Software Developer / Project Owner',
    institution: 'Rysun Labs Pvt. Ltd.',
    period: 'Apr 2022 – Oct 2025',
    location: 'Ahmedabad, India',
    badge: 'ENTERPRISE LEAD',
    journeyPhase: 'SCALE & ACCELERATION',
    highlights: [
      "Engineered 'Akshar Amrutam' (100,000+ downloads) using Flutter & BLoC with deterministic offline SQLite synchronisation.",
      "Spearheaded memory optimization for 'La Crosse View', slashing cold startup latency by 30% and eliminating 95% of NPE crashes.",
      'Mentored mobile engineering teams across native Android (Kotlin) and cross-platform Flutter paradigms.',
      'Constructed resilient local-first caching strategies and offline-first queue synchronization.',
    ],
    stack: ['Flutter', 'Kotlin', 'BLoC Pattern', 'SQLite', 'MQTT', 'Foreground Services'],
  },
  {
    id: 'phycom',
    year: '2021',
    type: 'work',
    title: 'Software Engineer — Android Core & IoT',
    institution: 'Phycom Corporations',
    period: 'Apr 2021 – Mar 2022',
    location: 'Ahmedabad, India',
    badge: 'IOT SPECIALIST',
    journeyPhase: 'IOT & EMBEDDED SYNC',
    highlights: [
      "Built native mobile telemetry applications for 'Autozon' & 'SmartIndia', ingesting high-frequency MQTT sensor feeds.",
      'Engineered low-power background location dispatchers and geofence triggers with <500ms ingress latency.',
      'Implemented BLE GATT server/client communication protocols for embedded vehicle hardware.',
    ],
    stack: ['Java/Kotlin', 'MQTT', 'BLE / GATT', 'Geofencing', 'Google Maps API'],
  },
  {
    id: 'micro-app',
    year: '2017',
    type: 'work',
    title: 'Remote Android Developer',
    institution: 'Micro App Solutions',
    period: 'Aug 2017 – Dec 2019',
    location: 'Surat / Ahmedabad, India',
    badge: 'UTILITY & RUNTIME',
    journeyPhase: 'RUNTIME & SYSTEM OVERLAYS',
    highlights: [
      'Developed native Android utility apps including "Fastrrr-Floating Apps" and "Water Reminder", implementing complex overlay window permissions.',
      'Maintained strict battery efficiency protocols and aggressive memory footprints for low-end device tiers.',
      'Engineered custom Canvas 2D render loops and fluid touch gesture detectors for responsive utility UX.',
      'Constructed background BroadcastReceiver pipelines and battery-efficient AlarmManager schedules.',
    ],
    stack: ['Android SDK', 'Java', 'Canvas 2D', 'Overlay Windows', 'BroadcastReceiver', 'SQLite'],
  },
  {
    id: 'stimulus',
    year: '2016',
    type: 'work',
    title: 'Android Developer',
    institution: 'Stimulus Consultancy',
    period: 'Apr 2016 – Aug 2017',
    location: 'Ahmedabad, India',
    badge: 'EARLY FOUNDATIONS',
    journeyPhase: 'STARTUP RIGOR',
    highlights: [
      'Engineered native Android client architectures for "City Tadka" and "Oowomaniya", implementing offline SQLite caching and low-latency REST synchronization.',
      'Built precision tax calculation logic for enterprise GST accounting systems, maintaining 100% mathematical accuracy during national policy rollouts.',
      'Established early repository workflows, code conventions, and continuous delivery pipelines for early-stage startup rollouts.',
      'Formed deep mastery over Android SDK lifecycle, background threads, and hardware sensor communication.',
    ],
    stack: ['Android SDK', 'Java', 'SQLite', 'REST APIs', 'GST Logic', 'Git'],
  },
  {
    id: 'education-mca',
    year: '2013',
    type: 'education',
    title: 'Master of Computer Applications (M.C.A.)',
    institution: 'AES Institute of Computer Studies, Ahmedabad University',
    period: '2013 – 2015',
    location: 'Ahmedabad, India',
    badge: 'POST-GRADUATION & CSI',
    journeyPhase: 'DISTRIBUTED SYSTEMS',
    highlights: [
      'Specialized in Advanced Distributed Systems, Mobile Computing Internals, Operating System Memory Models, and Advanced Algorithms.',
      'Active Professional Member of the Computer Society of India (CSI), contributing to technical symposia and mobile software workshops.',
    ],
    stack: ['Distributed Systems', 'Advanced Algorithms', 'Mobile Internals', 'Database Systems', 'CSI Member'],
  },
  {
    id: 'education-bca',
    year: '2010',
    type: 'education',
    title: 'Bachelor of Computer Applications (B.C.A.)',
    institution: 'Navgujarat College of Computer Applications, Gujarat University',
    period: '2010 – 2013',
    location: 'Ahmedabad, India',
    badge: 'GRADUATION',
    journeyPhase: 'ALGORITHMIC FOUNDATIONS',
    highlights: [
      'Graduated with High Honors; core emphasis on Object-Oriented Software Design (Java, C++), Data Structures, and Relational Database Architecture.',
      'Built algorithmic software tools and academic project solutions with rigorous software engineering discipline.',
    ],
    stack: ['Core Java', 'C++', 'Data Structures', 'RDBMS / SQL', 'Software Engineering'],
  },
];

export default function Experience() {
  const [activeStation, setActiveStation] = useState<string>(MILESTONES[0].id);

  return (
    <section id="experience" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono-tech text-xs text-cyan-400">
              <Briefcase className="w-3.5 h-3.5" />
              <span>// 06. Career_Chronicle</span>
            </div>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
              Career &amp; <span className="text-primary">Credentials</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed font-light">
              Chronological deployment journey spanning 9+ years across enterprise platforms, mobile engines,
              and distributed systems. Scroll down to advance through each career milestone.
            </p>
          </div>
          <div className="text-6xl font-black text-white/5 select-none hidden md:block">
            CHRONICLE
          </div>
        </div>

        {/* Vertical Timeline Stack with Scroll-Driven Active Reached Effect */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical Continuous Rail */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-cyan-400 via-indigo-500 to-amber-400 opacity-40"
          />

          <div className="space-y-10">
            {MILESTONES.map((item, idx) => {
              const isReached = activeStation === item.id;
              return (
                <motion.div
                  id={`milestone-${item.id}`}
                  key={item.id}
                  initial={{ opacity: 0, x: -24, scale: 0.98 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.35 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onViewportEnter={() => setActiveStation(item.id)}
                  className="relative md:pl-20"
                >
                  {/* Glowing Node on Rail with Expanding Shockwave on Reach */}
                  <div className={`hidden md:flex absolute left-[22px] top-8 w-5 h-5 rounded-full items-center justify-center transition-all duration-300 z-10 ${
                    isReached
                      ? 'bg-cyan-400 border-2 border-white shadow-[0_0_20px_#22d3ee] scale-125'
                      : item.type === 'education'
                      ? 'bg-amber-400/80 border-2 border-amber-300'
                      : 'bg-[#050811] border-2 border-cyan-400/60'
                  }`}>
                    {isReached && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-black" />
                        <span className="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping pointer-events-none" />
                      </>
                    )}
                  </div>

                  {/* Horizontal Connector Bridge */}
                  <div className={`hidden md:block absolute left-8 top-10 h-[2px] transition-all duration-300 ${
                    isReached ? 'w-12 bg-gradient-to-r from-cyan-400 to-cyan-500/50 shadow-[0_0_8px_#22d3ee]' : 'w-10 bg-white/10'
                  }`} />

                  {/* Milestone Card with Scroll-Reached Active Highlight */}
                  <div className={`spatial-glass rounded-3xl p-6 sm:p-8 transition-all duration-300 group shadow-xl ${
                    isReached
                      ? 'border-cyan-400/60 shadow-[0_15px_45px_rgba(34,211,238,0.18)] bg-slate-900/90 ring-1 ring-cyan-400/30'
                      : 'border-white/10 hover:border-white/20 bg-slate-900/70'
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-2">
                            {item.type === 'education' ? (
                              <GraduationCap className="w-5 h-5 text-amber-400" />
                            ) : (
                              <Briefcase className="w-5 h-5 text-cyan-400" />
                            )}
                            <h3 className="font-display font-bold text-xl sm:text-2xl text-white group-hover:text-cyan-300 transition-colors">
                              {item.institution}
                            </h3>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full font-mono-tech text-[10px] font-bold uppercase tracking-wider ${
                            item.type === 'education'
                              ? 'text-amber-300 bg-amber-500/15 border border-amber-400/30'
                              : 'text-cyan-300 bg-cyan-500/15 border border-cyan-400/30'
                          }`}>
                            {item.badge}
                          </span>

                          <span className={`font-mono-tech text-[10px] px-2 py-0.5 rounded transition-colors ${
                            isReached
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                              : 'bg-white/5 text-slate-400'
                          }`}>
                            {isReached ? '● REACHED' : `PHASE: ${item.journeyPhase}`}
                          </span>
                        </div>

                        <div className="font-mono-tech text-xs sm:text-sm text-indigo-300 font-semibold mt-1">
                          {item.title}
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end font-mono-tech text-xs text-slate-400">
                        <div className="text-slate-200 font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{item.period}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights List */}
                    <div className="grid md:grid-cols-2 gap-3 mb-6">
                      {item.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                          <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 transition-transform ${
                            isReached
                              ? 'bg-cyan-300 scale-125 shadow-[0_0_8px_#22d3ee]'
                              : item.type === 'education'
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`} />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stack / Credential Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
                      {item.stack.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono-tech text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
