import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Github,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Cpu,
  Layers,
  Sparkles,
  X,
  Code,
  ArrowRight,
  Wifi,
  Battery,
} from 'lucide-react';
import { Project } from '../types';

const PRODUCTION_PROJECTS: (Project & {
  category: string;
  badge: string;
  metrics: { label: string; value: string }[];
  highlights: string[];
})[] = [
  {
    id: 'baps-prakash',
    title: 'BAPS Prakash',
    subtitle: 'Encrypted Streaming & Android Auto Audio Engine',
    category: 'Production Apps',
    badge: '50K+ ACTIVE LISTENERS',
    description:
      'Mission-critical digital audio and publication ecosystem serving 50,000+ active listeners with AWS CloudFront Signed Cookie edge security, offline gapless playback, and native car-head-unit projections.',
    tags: ['Kotlin', 'AWS CloudFront', 'ExoPlayer', 'Android Auto', 'audio_service'],
    image: '/images/projects/baps-prakash.jpg',
    playStoreLink:
      'https://play.google.com/store/apps/details?id=org.baps.swaminarayanprakash&hl=en_IN',
    githubLink: 'https://github.com/govindtank',
    metrics: [
      { label: 'Active Reach', value: '50,000+' },
      { label: 'Session SLA', value: '99.95% Clean' },
      { label: 'Security', value: 'Signed Cookies' },
    ],
    highlights: [
      'AWS CloudFront Signed Cookie stream protection',
      'Android Auto in-vehicle media browser service',
      'Foreground service with gapless caching',
    ],
    codeSnippet: `// Android Auto MediaSession & CloudFront Signed Cookie Connector
val mediaSource = ProgressiveMediaSource.Factory(
    DefaultHttpDataSource.Factory().setDefaultRequestProperties(
        mapOf("Cookie" to "CloudFront-Signature=\${sessionToken.signature}")
    )
).createMediaSource(MediaItem.fromUri(audioUri))`,
  },
  {
    id: 'akshar-amrutam',
    title: 'Akshar Amrutam',
    subtitle: 'Ultra-Reliable 100K+ Download Publication Engine',
    category: 'Production Apps',
    badge: '100K+ DOWNLOADS',
    description:
      'Offline-first digital reader and publication engine with over 100,000 downloads. Engineered with Flutter Impeller, BLoC unidirectional state machines, and deterministic local SQLite synchronization.',
    tags: ['Flutter', 'Impeller', 'BLoC Pattern', 'SQLite', 'Offline-First'],
    image: '/images/projects/akshar-amrutam.jpg',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.baps.aksharamrutam',
    githubLink: 'https://github.com/govindtank',
    metrics: [
      { label: 'Downloads', value: '100,000+' },
      { label: 'Crash Rate', value: '<0.05%' },
      { label: 'Offline State', value: '100% Deterministic' },
    ],
    highlights: [
      '120 FPS Flutter Impeller rasterization',
      'BLoC event-driven unidirectional data flow',
      'Deterministic local-first SQLite offline sync',
    ],
    codeSnippet: `// BLoC Deterministic Event Slicing & Offline SQLite Queue
on<SyncOfflineContentEvent>((event, emit) async {
  emit(ContentSyncingState(progress: 0.1));
  final localCache = await database.retrievePendingChunks();
  final processed = await isolateCompute(decodePayload, localCache);
  emit(ContentSyncedState(records: processed));
});`,
  },
  {
    id: 'lacrosse-view',
    title: 'La Crosse View',
    subtitle: 'IoT Telemetry & High-Frequency Sensor Ingestion',
    category: 'IoT Systems',
    badge: 'COMMERCIAL IOT HUB',
    description:
      'Commercial environmental monitoring application. Refactored the core thread dispatcher to reduce cold startup latency by 30%, eliminate 95% of NPE crashes, and maintain persistent MQTT telemetry sockets.',
    tags: ['Kotlin', 'MQTT', 'Foreground Service', 'BLE', 'Room DB'],
    image: '/images/projects/lacrosse-view.jpg',
    playStoreLink:
      'https://play.google.com/store/apps/details?id=com.lacrosseview.app&hl=en_US',
    githubLink: 'https://github.com/govindtank',
    metrics: [
      { label: 'Cold Startup', value: '-30% Latency' },
      { label: 'RAM Footprint', value: '-20% Usage' },
      { label: 'Crash Relief', value: '95% NPE Elimination' },
    ],
    highlights: [
      'Persistent MQTT background socket keep-alive',
      'BLE GATT weather station hardware pairing',
      'Low-power battery-efficient sensor queues',
    ],
    codeSnippet: `// Resilient Foreground Sensor Telemetry Dispatcher
class SensorTelemetryService : Service() {
  private val mqttClient = MqttAsyncClient(BROKER_URL, CLIENT_ID, MemoryPersistence())
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startForeground(NOTIFICATION_ID, buildTelemetryNotification())
    mqttClient.connect(connectOptions, null, telemetryCallback)
    return START_STICKY
  }
}`,
  },
  {
    id: 'autozon-iot',
    title: 'Autozon & SmartIndia',
    subtitle: 'CAN-Bus Telemetry & Fleet Tracking Mobile Platform',
    category: 'IoT Systems',
    badge: 'CONNECTED VEHICLE FLEET',
    description:
      'Automotive telemetry mobile system receiving low-latency vehicle stats, CAN-Bus diagnostic fault codes, and real-time GPS tracking via high-frequency MQTT pub/sub queues.',
    tags: ['Java/Kotlin', 'CAN-Bus', 'MQTT', 'Geofencing', 'Google Maps'],
    image: '/images/projects/autozon-iot.jpg',
    githubLink: 'https://github.com/govindtank',
    metrics: [
      { label: 'Socket Ingress', value: '<120ms' },
      { label: 'Geofence SLA', value: '<500ms Dispatch' },
      { label: 'Vehicle Telemetry', value: 'CAN-Bus Ingestion' },
    ],
    highlights: [
      'CAN-Bus vehicle telemetry packet decoding',
      'Low-latency background geofence boundary alerts',
      'Real-time vehicle coordinates on custom map layers',
    ],
    codeSnippet: `// High-frequency CAN-Bus Telemetry Ingress Worker
fun onTelemetryPacketReceived(packet: ByteArray) {
  val faultCode = packet.extractCANBusFault()
  if (faultCode.isCritical()) {
    triggerHighPriorityAlert(faultCode)
  }
}`,
  },
  {
    id: 'fastrrr-floating',
    title: 'Fastrrr — Floating Apps',
    subtitle: 'Multi-Window Overlay Permissions & Utility Runtime',
    category: 'Production Apps',
    badge: 'SYSTEM OVERLAY ENGINE',
    description:
      'Native Android multi-window utility app engineered with SYSTEM_ALERT_WINDOW permissions, battery-efficient alarm schedules, and custom Canvas 2D touch interaction loops.',
    tags: ['Android SDK', 'Java', 'Overlay Windows', 'Canvas 2D', 'SQLite'],
    image: '/images/projects/fastrrr-floating.jpg',
    githubLink: 'https://github.com/govindtank',
    metrics: [
      { label: 'Overlay Budget', value: '<15MB RAM' },
      { label: 'Battery Impact', value: 'Zero WakeLocks' },
      { label: 'Frame Pacing', value: '60 FPS Canvas' },
    ],
    highlights: [
      'Floating overlay window touch dispatching',
      'Battery-efficient AlarmManager task queuing',
      'Custom 2D Canvas vector rendering',
    ],
    codeSnippet: `// Overlay Window Touch Dispatch Loop
val windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
val params = WindowManager.LayoutParams(
    WRAP_CONTENT, WRAP_CONTENT,
    TYPE_APPLICATION_OVERLAY,
    FLAG_NOT_FOCUSABLE,
    TRANSLUCENT
)`,
  },
];

const CATEGORIES = ['All', 'Production Apps', 'IoT Systems'];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [inspectedProject, setInspectedProject] = useState<typeof PRODUCTION_PROJECTS[0] | null>(null);

  const filtered =
    activeCategory === 'All'
      ? PRODUCTION_PROJECTS
      : PRODUCTION_PROJECTS.filter((p) => p.category === activeCategory);

  return (
    <section id="projects" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-500/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono-tech text-xs uppercase tracking-[0.28em] text-cyan-400">
                [04] // Production_Deployments
              </span>
            </div>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
              Selected <span className="text-primary">Works</span>
            </h2>
            <p className="max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed font-light">
              Production mobile systems serving 150k+ active users. Displayed in actual mobile device framing
              with verified metrics, edge security architectures, and Google Play Store artifacts.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full font-mono-tech text-xs transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] font-semibold'
                      : 'spatial-glass text-slate-400 hover:text-slate-200 border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-6xl font-black text-white/5 select-none hidden xl:block">
              DEPLOYMENTS
            </div>
          </div>
        </div>

        {/* Space-Optimized 2-Column Grid of Production Apps with Realistic Mobile Bezel Frames */}
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          {filtered.map((proj, idx) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              className="spatial-glass rounded-3xl p-5 sm:p-6 border-white/10 hover:border-cyan-400/40 transition-all flex flex-col sm:flex-row gap-5 items-center group shadow-xl hover:shadow-[0_15px_45px_rgba(34,211,238,0.12)]"
            >
              {/* Left Column: Realistic Smartphone Mockup Bezel */}
              <div className="flex-shrink-0 relative w-[140px] sm:w-[155px] aspect-[9/18.5] rounded-[26px] p-2 bg-[#090d16] border-[4px] border-slate-700/80 shadow-[0_12px_30px_rgba(0,0,0,0.85),inset_0_0_8px_rgba(255,255,255,0.08)] flex flex-col justify-between overflow-hidden group-hover:scale-102 transition-transform duration-300">
                {/* Front Camera Pill / Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-11 h-2.5 bg-black rounded-full z-20 flex items-center justify-end pr-1 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />
                </div>

                {/* Status Bar Micro-Telemetry */}
                <div className="absolute top-1 left-3 right-3 z-20 flex items-center justify-between text-[7px] font-mono-tech text-slate-400 pointer-events-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <Wifi className="w-2 h-2 text-slate-400" />
                    <Battery className="w-2.5 h-2.5 text-slate-400" />
                  </div>
                </div>

                {/* Glass Glare Sheen Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none z-10" />

                {/* Actual Production Mobile Screenshot */}
                <div className="w-full h-full rounded-[18px] overflow-hidden bg-black relative flex items-center justify-center">
                  <img
                    src={proj.image}
                    alt={proj.title}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/projects/baps-prakash.jpg';
                    }}
                  />
                  {/* Home Navigation Gesture Bar */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/40 rounded-full pointer-events-none" />
                </div>
              </div>

              {/* Right Column: Space-Optimized Telemetry & Architecture */}
              <div className="flex-1 flex flex-col justify-between min-w-0 w-full space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono-tech text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 uppercase tracking-wider">
                      {proj.badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectedProject(proj)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Inspect Architecture"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover:text-cyan-300 transition-colors truncate">
                    {proj.title}
                  </h3>
                  <div className="font-mono-tech text-xs text-slate-400 truncate mt-0.5">
                    {proj.subtitle}
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed mt-2 line-clamp-2">
                    {proj.description}
                  </p>
                </div>

                {/* Metrics Strip */}
                <div className="grid grid-cols-3 gap-1.5 font-mono-tech text-[10px]">
                  {proj.metrics.map((m) => (
                    <div key={m.label} className="bg-white/5 rounded-lg p-1.5 border border-white/5 text-center">
                      <div className="text-slate-500 text-[9px] truncate">{m.label}</div>
                      <div className="text-cyan-300 font-bold truncate mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Tech Chips */}
                <div className="flex flex-wrap gap-1">
                  {proj.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono-tech text-[10px] text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Links */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 font-mono-tech text-xs">
                  {proj.playStoreLink ? (
                    <a
                      href={proj.playStoreLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Google Play</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono-tech">
                      Internal Enterprise
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setInspectedProject(proj)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-[11px] cursor-pointer"
                  >
                    <span>Architecture</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Architecture Deep Dive Modal Drawer */}
      <AnimatePresence>
        {inspectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setInspectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="spatial-glass w-full max-w-2xl rounded-3xl p-6 sm:p-8 border-white/20 shadow-2xl space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-white">
                      {inspectedProject.title}
                    </h3>
                    <div className="font-mono-tech text-xs text-cyan-300">
                      {inspectedProject.badge}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedProject(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="font-mono-tech text-xs text-slate-400 uppercase tracking-wider">
                  Core Engineering Highlights:
                </div>
                <ul className="space-y-1.5 font-mono-tech text-xs text-slate-300">
                  {inspectedProject.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {inspectedProject.codeSnippet && (
                <div>
                  <div className="font-mono-tech text-xs text-slate-400 mb-2 uppercase tracking-wider">
                    Production Architecture Snippet:
                  </div>
                  <pre className="p-4 rounded-xl bg-black/70 border border-white/10 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed">
                    <code>{inspectedProject.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
