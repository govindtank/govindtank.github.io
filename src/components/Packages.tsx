import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, ExternalLink, Package, Sparkles, ShieldCheck } from 'lucide-react';

const PACKAGES = [
  {
    name: 'scratch_reveal',
    category: 'Interactive Canvas & Haptics',
    description:
      'Scratch card & scratch-to-reveal canvas widget for Flutter with celebratory confetti bursts, metallic foil, and real-time reveal threshold physics.',
    accent: 'cyan',
    downloads: 'v1.3.1 · pub.dev',
  },
  {
    name: 'smooth_signature_pad',
    category: 'Graphics & Cryptography',
    description:
      'Digital signature capture with fountain pen velocity pressure curves, turnkey SignatureCaptureCard, real-time SHA-256 audit hashing, and vector SVG export.',
    accent: 'cyan',
    downloads: 'v1.3.2 · pub.dev',
  },
  {
    name: 'flutter_privacy_vault',
    category: 'Security & Compliance',
    description:
      'Indian bank-grade PII masking (Aadhaar, PAN, phone, email), app-switcher privacy shield, inactivity auto-lock, and sensitive financial balance masking.',
    accent: 'emerald',
    downloads: 'v1.3.1 · pub.dev',
  },
  {
    name: 'android_island_bar',
    category: 'Hardware Adaptive UI',
    description:
      'Calculates physical Android DisplayCutout coordinates, adapting layout around center punch holes or corner notches with live activities and rubber-band physics.',
    accent: 'cyan',
    downloads: 'v0.4.1 · pub.dev',
  },
  {
    name: 'smart_step_indicator',
    category: 'Adaptive Stepper',
    description:
      'Responsive, overflow-proof step indicator with progress bar interpolation, haptic touch triggers, KYC action states, and dark-mode themes.',
    accent: 'indigo',
    downloads: 'v1.1.2 · pub.dev',
  },
  {
    name: 'currency_field_formatter',
    category: 'FinTech & Input Formatting',
    description:
      'Bank-grade Flutter currency input formatter with live Indian numbering words (Lakhs/Crores), quick denomination chips, and limit guards.',
    accent: 'amber',
    downloads: 'v1.3.1 · pub.dev',
  },
  {
    name: 'country_mobile_validator',
    category: 'Telephony & Forms',
    description:
      'Mobile number validator for 249 countries with real length ranges, telecom carrier detection (Jio, Airtel, Vi, BSNL), and direct WhatsApp links.',
    accent: 'rose',
    downloads: 'v0.4.1 · pub.dev',
  },
];

export default function Packages() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyInstall = async (name: string) => {
    await navigator.clipboard?.writeText(`flutter pub add ${name}`);
    setCopied(name);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <section id="packages" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono-tech text-xs text-cyan-400">
              <Package className="w-3.5 h-3.5" />
              <span>// 05. Open_Source_SDKs</span>
            </div>
            <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
              Pub.dev <span className="text-primary">Packages</span>
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 spatial-glass px-4 py-2 rounded-full border-white/10 font-mono-tech text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Publisher · pure Dart &amp; Flutter</span>
            </div>
            <div className="text-6xl font-black text-white/5 select-none hidden md:block">
              OPEN SOURCE
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PACKAGES.map((item, index) => (
            <motion.div
              key={item.name}
              
              
              
              transition={{ delay: index * 0.05, duration: 0.4 }}
              className="spatial-glass rounded-3xl p-6 border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5 font-mono-tech text-xs">
                  <span className="text-slate-500">0{index + 1}</span>
                  <span className="text-[11px] text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/20">
                    {item.downloads}
                  </span>
                </div>

                <div className="font-mono-tech text-xs text-indigo-300/90 font-medium mb-1">
                  {item.category}
                </div>
                <h3 className="font-display font-bold text-xl text-white group-hover:text-cyan-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 font-light leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => copyInstall(item.name)}
                  className="flex items-center justify-start text-left gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 hover:border-cyan-400/40 font-mono-tech text-[11px] text-slate-300 hover:text-cyan-300 transition-all cursor-pointer group/btn truncate"
                  title={`Click to copy: flutter pub add ${item.name}`}
                >
                  <span className="text-cyan-400 font-bold select-none">$</span>
                  <span className="font-mono text-left truncate">flutter pub add {item.name}</span>
                  {copied === item.name ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-slate-300 ml-auto flex-shrink-0" />
                  )}
                </button>

                <a
                  href={`https://pub.dev/packages/${item.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 font-mono-tech text-xs text-cyan-300 transition-colors flex-shrink-0"
                >
                  <span>pub.dev</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
