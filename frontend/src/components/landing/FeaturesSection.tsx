import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, ScrollText, Timer, Volume2, Smartphone, Users, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Zap, title: "Real-time Multiplayer", desc: "Socket.IO powered low-latency connections. Challenge friends or match with strangers instantly." },
  { icon: ScrollText, title: "KBBI Validated", desc: "Every word checked against the official Indonesian dictionary. No made-up words allowed." },
  { icon: Timer, title: "15-Second Bomb Timer", desc: "Race against the detonation. Each turn gives you 15 seconds to submit a valid word." },
  { icon: Volume2, title: "Procedural Audio", desc: "Dynamic sound effects that react to gameplay — pings, ticks, and explosions in real time." },
  { icon: Smartphone, title: "Responsive Design", desc: "Full experience across desktop, tablet, and mobile. Play from anywhere." },
  { icon: Users, title: "Global Matchmaking", desc: "Auto-generated aliases for quick play or track stats with a persistent account." },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const header = sectionRef.current?.querySelector(".section-header");
      if (header) {
        gsap.from(header.querySelectorAll(".reveal-line"), {
          y: "100%", opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
          scrollTrigger: { trigger: header, start: "top 85%", toggleActions: "play none none none" },
        });
        const badge = header.querySelector(".section-badge");
        if (badge) gsap.from(badge, { opacity: 0, scale: 0.8, duration: 0.5, scrollTrigger: { trigger: badge, start: "top 90%", toggleActions: "play none none none" } });
      }

      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll<HTMLElement>(".feature-card");
        cards.forEach((card) => {
          gsap.from(card, {
            opacity: 0, y: 80, scale: 0.9, duration: 1, ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none none" },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="section-header text-center mb-14 md:mb-18 space-y-3">
          <div className="section-badge inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
            <Sparkles className="h-3 w-3 text-accent fill-accent" />
            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Specs</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
            <span className="block overflow-hidden"><span className="reveal-line inline-block">Built for</span></span>
            <span className="block overflow-hidden"><span className="reveal-line inline-block">War</span></span>
          </h2>
          <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">Every feature engineered for the neural arena</p>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card group">
              <div className="glass-card p-1 rounded-3xl overflow-hidden h-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <div className="bg-background/40 backdrop-blur-2xl rounded-[1.8rem] p-6 h-full space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{feature.title}</h3>
                    <p className="text-[11px] text-white/40 font-mono leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
