import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

gsap.registerPlugin(ScrollTrigger);

interface SocialProofSectionProps {
  isConnected: boolean;
  onlineUsers: { length: number };
}

const headerReveal = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export function SocialProofSection({ isConnected, onlineUsers }: SocialProofSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const onlineRef = useRef<HTMLSpanElement>(null);
  const onlineAnimRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const socialNumbers = sectionRef.current?.querySelectorAll<HTMLElement>(".social-number");
      if (socialNumbers) {
        socialNumbers.forEach((el) => {
          const final = parseFloat(el.dataset.value || "0");
          const suffix = el.dataset.suffix || "";
          const isInt = !el.dataset.value?.includes(".");
          const obj = { val: 0 };
          gsap.to(obj, {
            val: final, duration: 2, ease: "power2.out",
            scrollTrigger: { trigger: el.parentElement, start: "top 80%", toggleActions: "play none none none" },
            onUpdate: () => { el.textContent = (isInt ? Math.round(obj.val) : obj.val.toFixed(1)) + suffix; },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !onlineRef.current) return;

    if (onlineAnimRef.current) onlineAnimRef.current.kill();

    const obj = { val: parseInt(onlineRef.current.textContent || "0") };
    onlineAnimRef.current = gsap.to(obj, {
      val: onlineUsers.length, duration: 1, ease: "power2.out",
      onUpdate: () => { if (onlineRef.current) onlineRef.current.textContent = String(Math.round(obj.val)); },
    });
  }, [onlineUsers.length]);

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.2_280/0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-4xl mx-auto text-center space-y-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="section-header space-y-3"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="glass px-4 py-1.5 h-auto gap-2 rounded-full border-white/10 text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">
              <Users className="h-3 w-3 text-primary" />
              Network
            </Badge>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
            <span className="block overflow-hidden"><motion.span variants={headerReveal} className="inline-block">Join the</motion.span></span>
            <span className="block overflow-hidden"><motion.span variants={headerReveal} className="inline-block">Grid</motion.span></span>
          </h2>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="text-center group">
            <div className="relative inline-flex mb-3">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
              <div className={`relative w-16 h-16 rounded-full glass border flex items-center justify-center ${isConnected ? "border-primary/30" : "border-white/10"}`}>
                <div className={`h-4 w-4 rounded-full ${isConnected ? "bg-primary shadow-[0_0_15px_var(--primary)] animate-pulse" : "bg-destructive"}`} />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-white">
              <span ref={onlineRef} className="social-number" data-value={onlineUsers.length} data-suffix="">{onlineUsers.length}</span>
            </div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Online Now</div>
          </div>

          <div className="h-16 w-px bg-white/10 hidden md:block" />

          <div className="text-center group">
            <div className="relative inline-flex mb-3">
              <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="relative w-16 h-16 rounded-full glass border border-white/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-accent" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-white social-number" data-value="24" data-suffix="/7">0/7</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Matchmaking</div>
          </div>

          <div className="h-16 w-px bg-white/10 hidden md:block" />

          <div className="text-center group">
            <div className="relative inline-flex mb-3">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
              <div className="relative w-16 h-16 rounded-full glass border border-white/10 flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-white social-number" data-value="100" data-suffix="%">0%</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Uptime</div>
          </div>
        </div>

        <div className={`glass rounded-2xl p-5 mx-auto max-w-md border transition-all duration-500 ${isConnected ? "border-primary/20" : "border-destructive/20"}`}>
          <div className="flex items-center justify-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse" : "bg-destructive"}`} />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
              Server Status: {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
