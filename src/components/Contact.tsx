import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      // Try Web3Forms endpoint
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "099a9a38-4e89-43c2-9e8c-8f19fae2e6b6", // Public web3forms key
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      });

      if (!response.ok) {
        // Fallback to mailto link
        window.location.href = `mailto:govindtank600@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;
      }
      setIsSuccess(true);
      reset();
    } catch {
      // Direct mailto fallback on any network issue
      window.location.href = `mailto:govindtank600@gmail.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`)}`;
      setIsSuccess(true);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight text-white">
              Let's build something <br />
              <span className="text-sky-400 tracking-tight">exceptional.</span>
            </h2>
            <p className="text-slate-300 mb-12 text-lg leading-relaxed">
              Currently open for system architecture audits, custom application development, and senior technical leadership consultations.
            </p>

            <div className="space-y-6">
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: "govindtank600@gmail.com", href: "mailto:govindtank600@gmail.com" },
                { icon: <Phone className="w-5 h-5" />, label: "Phone", value: "+91 8460 48 4061", href: "tel:+918460484061" },
                { icon: <MapPin className="w-5 h-5" />, label: "Location", value: "Gandhinagar, Gujarat, India", href: "#" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1 font-mono">{item.label}</p>
                    <a href={item.href} className="text-white hover:text-sky-400 font-semibold transition-colors">{item.value}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 md:p-12 relative overflow-hidden bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl">
             <AnimatePresence mode="wait">
               {isSuccess ? (
                 <motion.div 
                   key="success"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="h-full flex flex-col items-center justify-center text-center py-12"
                 >
                   <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-6 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]" />
                   <h3 className="text-3xl font-bold mb-2 text-white">Message Transmitted!</h3>
                   <p className="text-slate-300">Thank you for reaching out. I'll get back to you within 24 hours.</p>
                   <button 
                     onClick={() => setIsSuccess(false)}
                     className="mt-8 text-sky-400 font-bold uppercase tracking-widest text-sm hover:underline font-mono"
                   >
                     Send another message
                   </button>
                 </motion.div>
               ) : (
                 <motion.form 
                   key="form"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   onSubmit={handleSubmit(onSubmit)} className="space-y-6"
                 >
                   <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">Full Name</label>
                       <input 
                         {...register("name")}
                         className={`w-full bg-slate-950 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-sky-400 outline-none transition-all`}
                         placeholder="John Doe"
                       />
                       {errors.name && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name.message}</p>}
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">Email Address</label>
                       <input 
                         {...register("email")}
                         className={`w-full bg-slate-950 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-sky-400 outline-none transition-all`}
                         placeholder="john@example.com"
                       />
                       {errors.email && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email.message}</p>}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">Subject</label>
                     <input 
                       {...register("subject")}
                       className={`w-full bg-slate-950 border ${errors.subject ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-sky-400 outline-none transition-all`}
                       placeholder="System Architecture / App Development Inquiry"
                     />
                     {errors.subject && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.subject.message}</p>}
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">Message</label>
                     <textarea 
                       {...register("message")}
                       rows={5}
                       className={`w-full bg-slate-950 border ${errors.message ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-sky-400 outline-none transition-all resize-none`}
                       placeholder="Tell me about your project, timeline, or engineering inquiry..."
                     />
                     {errors.message && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.message.message}</p>}
                   </div>

                   <button 
                     disabled={isSubmitting}
                     className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-sky-500/20 uppercase tracking-wider text-sm font-mono"
                   >
                     {isSubmitting ? "Transmitting..." : "Send Secure Message"}
                     <Send className="w-4 h-4" />
                   </button>
                 </motion.form>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
