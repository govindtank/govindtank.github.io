import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  Radio,
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(4, "Subject must be at least 4 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "099a9a38-4e89-43c2-9e8c-8f19fae2e6b6",
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      });

      if (!response.ok) {
        window.location.href = `mailto:govindtank600@gmail.com?subject=${encodeURIComponent(
          data.subject
        )}&body=${encodeURIComponent(
          `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
        )}`;
      }

      setIsSuccess(true);
      reset();
      setTimeout(() => setIsSuccess(false), 5000);
    } catch {
      window.location.href = `mailto:govindtank600@gmail.com?subject=${encodeURIComponent(
        data.subject
      )}&body=${encodeURIComponent(
        `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
      )}`;
      setIsSuccess(true);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="relative py-16 sm:py-20 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Direct Telemetry & Info */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono-tech text-xs text-cyan-400">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>// 08. Direct_Comm_Channel</span>
              </div>
              <h2 className="font-section-title text-4xl sm:text-5xl font-bold tracking-tight text-white mb-2">
                Direct <span className="text-primary">Channel</span>
              </h2>

              <p className="mt-4 text-slate-400 text-sm sm:text-base font-light leading-relaxed">
                Whether you need technical leadership for a 100k+ user mobile application, custom
                GPU shaders, or an offline AI integration, my comm line is open.
              </p>
            </div>

            <div className="mt-10 space-y-4 font-mono-tech text-xs">
              <a
                href="mailto:govindtank600@gmail.com"
                className="spatial-glass rounded-2xl p-4 border-white/10 hover:border-cyan-400/40 flex items-center gap-3 text-slate-300 hover:text-cyan-300 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-400/30">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Direct Email</div>
                  <div className="text-sm text-white font-semibold">govindtank600@gmail.com</div>
                </div>
              </a>

              <a
                href="tel:+918460484061"
                className="spatial-glass rounded-2xl p-4 border-white/10 hover:border-cyan-400/40 flex items-center gap-3 text-slate-300 hover:text-cyan-300 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:border-cyan-400/30">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Voice / WhatsApp</div>
                  <div className="text-sm text-white font-semibold">+91 8460 48 4061</div>
                </div>
              </a>

              <div className="spatial-glass rounded-2xl p-4 border-white/10 flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Coordinates</div>
                  <div className="text-sm text-white font-semibold">
                    Gandhinagar / Ahmedabad · 23.2156° N, 72.6369° E
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Dispatch Terminal */}
          <div className="lg:col-span-7 spatial-glass rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10 font-mono-tech text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>DISPATCH_ENCRYPTED_MESSAGE</span>
              </span>
              <span className="text-slate-500 text-[11px]">SLA: &lt; 24h Response</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-tech text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                    Sender Name
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Ada Lovelace"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 font-mono-tech text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  {errors.name && (
                    <span className="font-mono-tech text-[10px] text-rose-400 mt-1 block">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-mono-tech text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                    Sender Email
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="ada@domain.tech"
                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 font-mono-tech text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  />
                  {errors.email && (
                    <span className="font-mono-tech text-[10px] text-rose-400 mt-1 block">
                      {errors.email.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-mono-tech text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                  Subject / Scope
                </label>
                <input
                  {...register("subject")}
                  placeholder="Mobile Architecture Consulting / 120Hz Tuning"
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 font-mono-tech text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                />
                {errors.subject && (
                  <span className="font-mono-tech text-[10px] text-rose-400 mt-1 block">
                    {errors.subject.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-mono-tech text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                  Transmission Payload
                </label>
                <textarea
                  {...register("message")}
                  rows={5}
                  placeholder="Tell me about your product requirements, stack, timeline, or architecture challenges..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 font-mono-tech text-xs text-white placeholder-slate-600 focus:outline-none transition-colors resize-none"
                />
                {errors.message && (
                  <span className="font-mono-tech text-[10px] text-rose-400 mt-1 block">
                    {errors.message.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 hover:opacity-95 text-slate-950 font-mono-tech font-bold text-xs uppercase tracking-wider transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Transmitting...</span>
                ) : (
                  <>
                    <span>Transmit Dispatch</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono-tech text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Payload received! Govind will respond shortly.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
