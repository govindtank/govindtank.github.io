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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Form Data:", data);
    setIsSubmitting(false);
    setIsSuccess(true);
    reset();
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Let's build something <br />
              <span className="text-primary tracking-tighter">exceptional.</span>
            </h2>
            <p className="text-slate-400 mb-12 text-lg">
              Currently open for architecture audits, custom application development, and senior technical leadership roles.
            </p>

            <div className="space-y-6">
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: "govindtank600@gmail.com", href: "mailto:govindtank600@gmail.com" },
                { icon: <Phone className="w-5 h-5" />, label: "Phone", value: "+91 8460 48 4061", href: "tel:+918460484061" },
                { icon: <MapPin className="w-5 h-5" />, label: "Location", value: "Gandhinagar, Gujarat, India", href: "#" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{item.label}</p>
                    <a href={item.href} className="text-white hover:text-primary transition-colors">{item.value}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-8 md:p-12 relative overflow-hidden">
             <AnimatePresence mode="wait">
               {isSuccess ? (
                 <motion.div 
                   key="success"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="h-full flex flex-col items-center justify-center text-center py-12"
                 >
                   <CheckCircle2 className="w-20 h-20 text-green-500 mb-6 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                   <h3 className="text-3xl font-bold mb-2">Message Received!</h3>
                   <p className="text-slate-400">Thank you for reaching out. I'll get back to you within 24 hours.</p>
                   <button 
                     onClick={() => setIsSuccess(false)}
                     className="mt-8 text-primary font-bold uppercase tracking-widest text-sm hover:underline"
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
                       <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Full Name</label>
                       <input 
                         {...register("name")}
                         className={`w-full bg-slate-900 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all`}
                         placeholder="John Doe"
                       />
                       {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name.message}</p>}
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Email Address</label>
                       <input 
                         {...register("email")}
                         className={`w-full bg-slate-900 border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all`}
                         placeholder="john@example.com"
                       />
                       {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email.message}</p>}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Subject</label>
                     <input 
                       {...register("subject")}
                       className={`w-full bg-slate-900 border ${errors.subject ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all`}
                       placeholder="Mobile App Project Inquiry"
                     />
                     {errors.subject && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.subject.message}</p>}
                   </div>

                   <div className="space-y-2">
                     <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Message</label>
                     <textarea 
                       {...register("message")}
                       rows={5}
                       className={`w-full bg-slate-900 border ${errors.message ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none`}
                       placeholder="Tell me about your project or inquiry..."
                     />
                     {errors.message && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.message.message}</p>}
                   </div>

                   <button 
                     disabled={isSubmitting}
                     className="w-full py-4 bg-primary hover:bg-sky-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
                   >
                     {isSubmitting ? "Transmitting..." : "Send Secure Message"}
                     <Send className="w-5 h-5" />
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
