import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play, ScrollText, Timer, Zap } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  { icon: Play, number: "01", title: "Create or Join", desc: "Host a private room with a password or jump into a public game. Quick play generates an alias instantly." },
  { icon: ScrollText, number: "02", title: "Chain Words", desc: "Your word must start with the required letter — the last letter of the previous word. Every chain tightens the noose." },
  { icon: Timer, number: "03", title: "Survive the Bomb", desc: "15 seconds per turn. Fail to submit in time and you explode. Last player standing wins." },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

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

      if (stepsRef.current) {
        const cards = stepsRef.current.querySelectorAll<HTMLElement>(".how-card");
        gsap.from(cards, {
          opacity: 0, y: 60, duration: 0.9, stagger: 0.3, ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 20%", end: "bottom 40%", scrub: 1.5 },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.2_280/0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto">
        <div className="section-header text-center mb-14 md:mb-18 space-y-3">
          <div className="section-badge inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
            <Zap className="h-3 w-3 text-primary fill-primary" />
            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Tutorial</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
            <span className="block overflow-hidden"><span className="reveal-line inline-block">How It</span></span>
            <span className="block overflow-hidden"><span className="reveal-line inline-block">Works</span></span>
          </h2>
          <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">Three steps to neural domination</p>
        </div>

        <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step) => (
            <div key={step.title} className="how-card group relative">
              <div className="absolute -inset-1 bg-linear-to-b from-primary/20 to-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative glass-card p-1 rounded-3xl overflow-hidden h-full">
                <div className="bg-background/60 backdrop-blur-2xl rounded-[1.8rem] p-8 h-full flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full glass border-white/10 text-xs font-black text-primary mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">{step.title}</h3>
                  <p className="text-[11px] text-white/40 font-mono leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
