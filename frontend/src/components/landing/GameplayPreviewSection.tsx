import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

gsap.registerPlugin(ScrollTrigger);

const gameStates = [
  { label: "Lobby", sublabel: "PROTOCOL_ACTIVE", badge: "2 Pemain", gradient: "linear-gradient(180deg, oklch(0.65 0.2 280 / 0.2), transparent)", type: "lobby" as const },
  { label: "Gameplay", sublabel: "NEURAL_LINK_ACTIVE", badge: "Turn Active", gradient: "linear-gradient(180deg, oklch(0.6 0.25 200 / 0.2), transparent)", type: "gameplay" as const },
  { label: "Game Over", sublabel: "PROTOCOL_TERMINATED", badge: "Finished", gradient: "linear-gradient(180deg, oklch(0.55 0.22 25 / 0.2), transparent)", type: "gameover" as const },
];

function LobbyCard() {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-4xl font-black font-mono text-primary glow-cyan tracking-widest mb-8 text-center">ABC12</div>
      <div className="space-y-3">
        {["Host", "Player 2"].map((name, j) => (
          <div key={name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-sm text-white/50">{name[0]}</div>
              <span className="font-bold text-white uppercase text-sm">{name}</span>
            </div>
            {j === 0 && <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/20 border border-primary/40">HOST</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function GameplayCard() {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">Pattern</div>
        <div className="text-4xl font-black text-white glow-cyan tracking-tighter uppercase mb-4">RUANG</div>
        <div className="inline-flex items-center gap-3 glass border-primary/30 px-6 py-3 rounded-2xl">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mandatory</span>
          <div className="h-5 w-px bg-white/10" />
          <span className="text-3xl font-black text-white glow-purple animate-pulse">G</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["Host", "Player 2"].map((name, j) => (
          <div key={name} className={`p-4 rounded-xl ${j === 1 ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${j === 1 ? "bg-primary/20 text-primary" : "bg-white/10 text-white/40"}`}>{name[0]}</div>
              <span className="text-[11px] font-black text-white uppercase">{name}</span>
              {j === 1 && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-auto" />}
            </div>
            <span className="text-xl font-black font-mono text-white/80">{j === 0 ? "2" : "1"} <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">pts</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameOverCard() {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">💀</div>
        <div className="text-xl font-black text-destructive uppercase tracking-wider">Game Over</div>
        <div className="text-xs font-mono text-white/40 tracking-widest">Protocol Terminated</div>
      </div>
      <div className="space-y-3">
        {[
          { name: "Player 2", pts: "1", win: true },
          { name: "Host", pts: "2", win: false },
        ].map((p) => (
          <div key={p.name} className={`flex items-center justify-between p-4 rounded-xl ${p.win ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/5 opacity-60"}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${p.win ? "bg-primary/20 text-primary" : "bg-white/10 text-white/30"}`}>{p.name[0]}</div>
              <span className="font-bold text-white uppercase text-sm">{p.name}</span>
              {p.win && <span className="text-[8px] font-black text-accent uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">WINNER</span>}
            </div>
            <span className="text-lg font-black font-mono text-white/60">{p.pts} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameplayPreviewSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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

      if (sectionRef.current && trackRef.current) {
        const track = trackRef.current;
        const totalWidth = track.scrollWidth;
        const viewWidth = window.innerWidth;
        const dist = -(totalWidth - viewWidth) - 80;

        if (dist < 0) {
          gsap.to(track, {
            x: dist, ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current, pin: true, anticipatePin: 1,
              start: "top top", end: () => `+=${Math.abs(dist) + 400}`,
              scrub: 1.2, invalidateOnRefresh: true,
            },
          });
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 min-h-dvh flex flex-col items-center justify-center overflow-hidden pt-24 md:pt-28 pb-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.6_0.25_200/0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="section-header text-center space-y-3 mb-12 md:mb-16">
        <Badge variant="outline" className="section-badge glass px-4 py-1.5 h-auto gap-2 rounded-full border-white/10 text-xs font-black text-white/60 uppercase tracking-[0.2em]">
          <Play className="h-3 w-3 text-accent fill-accent" />
          Preview
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
          <span className="block overflow-hidden"><span className="reveal-line inline-block">See the</span></span>
          <span className="block overflow-hidden"><span className="reveal-line inline-block">Action</span></span>
        </h2>
      </div>

      <div ref={trackRef} className="flex gap-8 px-[10vw] pb-8 will-change-transform">
        {gameStates.map((state) => (
          <div key={state.label} className="min-w-90 md:min-w-110 lg:min-w-130 shrink-0">
            <div className="glass-card p-1 rounded-3xl overflow-hidden h-full">
              <div className="bg-background/60 backdrop-blur-2xl rounded-[1.8rem] p-8 md:p-10 h-full min-h-105 flex flex-col" style={{ backgroundImage: state.gradient }}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{state.sublabel}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">{state.badge}</span>
                </div>

                {state.type === "lobby" && <LobbyCard />}
                {state.type === "gameplay" && <GameplayCard />}
                {state.type === "gameover" && <GameOverCard />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
