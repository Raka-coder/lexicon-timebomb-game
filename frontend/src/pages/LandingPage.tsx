import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Shield, Sparkles, LogOut, Play, Users, Timer,
  ScrollText, Zap, Volume2, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Zap, title: "Real-time Multiplayer", desc: "Socket.IO powered low-latency connections. Challenge friends or match with strangers instantly." },
  { icon: ScrollText, title: "KBBI Validated", desc: "Every word checked against the official Indonesian dictionary. No made-up words allowed." },
  { icon: Timer, title: "15-Second Bomb Timer", desc: "Race against the detonation. Each turn gives you 15 seconds to submit a valid word." },
  { icon: Volume2, title: "Procedural Audio", desc: "Dynamic sound effects that react to gameplay — pings, ticks, and explosions in real time." },
  { icon: Smartphone, title: "Responsive Design", desc: "Full experience across desktop, tablet, and mobile. Play from anywhere." },
  { icon: Users, title: "Global Matchmaking", desc: "Auto-generated aliases for quick play or track stats with a persistent account." },
];

const steps = [
  { icon: Play, number: "01", title: "Create or Join", desc: "Host a private room with a password or jump into a public game. Quick play generates an alias instantly." },
  { icon: ScrollText, number: "02", title: "Chain Words", desc: "Your word must start with the required letter — the last letter of the previous word. Every chain tightens the noose." },
  { icon: Timer, number: "03", title: "Survive the Bomb", desc: "15 seconds per turn. Fail to submit in time and you explode. Last player standing wins." },
];

const gameStates = [
  { label: "Lobby", sublabel: "PROTOCOL_ACTIVE", badge: "2 Pemain", gradient: "linear-gradient(180deg, oklch(0.65 0.2 280 / 0.2), transparent)", type: "lobby" as const },
  { label: "Gameplay", sublabel: "NEURAL_LINK_ACTIVE", badge: "Turn Active", gradient: "linear-gradient(180deg, oklch(0.6 0.25 200 / 0.2), transparent)", type: "gameplay" as const },
  { label: "Game Over", sublabel: "PROTOCOL_TERMINATED", badge: "Finished", gradient: "linear-gradient(180deg, oklch(0.55 0.22 25 / 0.2), transparent)", type: "gameover" as const },
];

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { gameStatus, reset } = useGameStore();
  const { isAuthenticated, username, clearAuth, onlineUsers } = useAuthStore();
  const navigate = useNavigate();
  const hasResetRef = useRef(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroCTA = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const howStepsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const featuresGridRef = useRef<HTMLDivElement>(null);
  const gameplayRef = useRef<HTMLElement>(null);
  const gameplayTrackRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const onlineRef = useRef<HTMLSpanElement>(null);
  const onlineAnimRef = useRef<gsap.core.Tween | null>(null);

  const handleLogout = useCallback(() => {
    socket?.emit("LOGOUT");
    clearAuth();
  }, [socket, clearAuth]);

  useEffect(() => {
    if (!hasResetRef.current && (gameStatus === "finished" || gameStatus === "waiting")) {
      reset();
      hasResetRef.current = true;
    }
    if (gameStatus === "idle") {
      hasResetRef.current = false;
    }
  }, [gameStatus, reset]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mm = gsap.matchMedia();

    mm.add("all", () => {
      if (prefersReduced) return () => {};

      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });

      const badge = heroRef.current?.querySelector(".hero-badge");
      const titleWords = heroTitleRef.current?.querySelectorAll(".word");
      const desc = heroRef.current?.querySelector(".hero-desc");
      const stats = heroRef.current?.querySelectorAll(".hero-stat");
      const ctaCard = heroCTA.current;

      if (badge) tl.from(badge, { opacity: 0, y: -20, duration: 0.6 }, 0);
      if (titleWords?.length) {
        tl.from(titleWords, { opacity: 0, y: 60, stagger: 0.15, duration: 0.9 }, 0.2);
      }
      if (desc) tl.from(desc, { opacity: 0, y: 30 }, 0.6);
      if (stats?.length) tl.from(stats, { opacity: 0, x: -20, stagger: 0.1, duration: 0.5 }, 0.8);
      if (ctaCard) tl.from(ctaCard, { opacity: 0, x: 80, scale: 0.95, duration: 1 }, 0.3);

      return () => {};
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.killTweensOf("*");
      mm.revert();
    };
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const sectionHeaderTriggers = (section: HTMLElement | null) => {
        if (!section) return;
        const header = section.querySelector(".section-header");
        if (!header) return;
        gsap.from(header.querySelectorAll(".reveal-line"), {
          y: "100%",
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: header,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        const badge = header.querySelector(".section-badge");
        if (badge) {
          gsap.from(badge, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            scrollTrigger: { trigger: badge, start: "top 90%", toggleActions: "play none none none" },
          });
        }
      };

      sectionHeaderTriggers(howRef.current);
      sectionHeaderTriggers(featuresRef.current);
      sectionHeaderTriggers(gameplayRef.current);
      sectionHeaderTriggers(socialRef.current);

      if (howStepsRef.current) {
        const cards = howStepsRef.current.querySelectorAll<HTMLElement>(".how-card");
        gsap.from(cards, {
          opacity: 0,
          y: 60,
          duration: 0.9,
          stagger: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: howRef.current,
            start: "top 20%",
            end: "bottom 40%",
            scrub: 1.5,
          },
        });
      }

      if (featuresGridRef.current) {
        const cards = featuresGridRef.current.querySelectorAll<HTMLElement>(".feature-card");
        gsap.from(cards, {
          opacity: 0,
          y: 80,
          scale: 0.95,
          duration: 1.2,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 30%",
            end: "bottom 20%",
            scrub: 1.5,
          },
        });
      }

      if (gameplayRef.current && gameplayTrackRef.current) {
        const track = gameplayTrackRef.current;
        const totalWidth = track.scrollWidth;
        const viewWidth = window.innerWidth;
        const dist = -(totalWidth - viewWidth) - 80;

        if (dist < 0) {
          gsap.to(track, {
            x: dist,
            ease: "none",
            scrollTrigger: {
              trigger: gameplayRef.current,
              pin: true,
              anticipatePin: 1,
              start: "top top",
              end: () => `+=${Math.abs(dist) + 400}`,
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });
        }
      }

      const socialNumbers = socialRef.current?.querySelectorAll<HTMLElement>(".social-number");
      if (socialNumbers) {
        socialNumbers.forEach((el) => {
          const final = parseFloat(el.dataset.value || "0");
          const suffix = el.dataset.suffix || "";
          const isInt = !el.dataset.value?.includes(".");
          const obj = { val: 0 };
          gsap.to(obj, {
            val: final,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el.parentElement,
              start: "top 80%",
              toggleActions: "play none none none",
            },
            onUpdate: () => {
              el.textContent = (isInt ? Math.round(obj.val) : obj.val.toFixed(1)) + suffix;
            },
          });
        });
      }

      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          opacity: 0,
          y: 60,
          duration: 1,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !onlineRef.current) return;

    if (onlineAnimRef.current) onlineAnimRef.current.kill();

    const obj = { val: parseInt(onlineRef.current.textContent || "0") };
    onlineAnimRef.current = gsap.to(obj, {
      val: onlineUsers.length,
      duration: 1,
      ease: "power2.out",
      onUpdate: () => {
        if (onlineRef.current) onlineRef.current.textContent = String(Math.round(obj.val));
      },
    });
  }, [onlineUsers.length]);

  return (
    <div ref={pageRef} className="bg-background relative overflow-x-hidden">
      <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-float pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full animate-float pointer-events-none" style={{ animationDelay: "-4s" }} />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* HERO */}
      <section ref={heroRef} className="relative z-10 flex flex-col items-center justify-center px-6 md:px-12 py-16 md:py-24 min-h-dvh">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-8 w-full">
            <div className="space-y-6">
              <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-accent fill-accent animate-pulse" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">Next-Gen Word Engine</span>
              </div>

              <h1 ref={heroTitleRef} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-white">
                <span className="word inline-block">LEXICON</span>
                <br />
                <span className="word inline-block text-transparent bg-clip-text bg-linear-to-r from-primary to-accent glow-text-purple">TIMEBOMB</span>
              </h1>

              <p className="hero-desc text-base md:text-lg text-muted-foreground font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Experience the <span className="text-serif text-white">highest-stakes</span>{" "}
                multiplayer word chain ever built. Connect, survive, and dominate the neural network.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="hero-stat flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Verified DB</span>
              </div>
              <div className="hero-stat flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Low Latency</span>
              </div>
              <div className="hero-stat flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Global Mesh</span>
              </div>
            </div>
          </div>

          <div ref={heroCTA} className="w-full max-w-md lg:shrink-0 space-y-4">
            {isAuthenticated && (
              <div className="flex items-center justify-between glass rounded-2xl p-3 border-primary/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-xs font-black uppercase tracking-wider">{username}</span>
                </div>
                <button onClick={handleLogout} className="text-white/30 hover:text-destructive transition-colors p-1" title="Logout" aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="glass-card p-1 rounded-[2.5rem] overflow-hidden">
              <div className="bg-background/40 backdrop-blur-2xl rounded-[2.4rem] p-6 md:p-8 space-y-6">
                <div className="text-center space-y-1">
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.4em]">Initialize Protocol</h3>
                  <p className="text-[12px] text-white/30 font-mono tracking-wider">Mulai bermain sekarang</p>
                </div>

                <Button onClick={() => navigate("/play")} className="w-full h-14 btn-stitch text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl">
                  <Play className="h-5 w-5" />
                  <span>Mulai</span>
                </Button>

                <div className="text-center text-[12px] font-mono text-white/20 uppercase tracking-widest py-1">
                  {isAuthenticated ? "Logged in — stats will be tracked" : "Pilih mode di layar berikutnya"}
                </div>
              </div>
            </div>

            <div className={`glass rounded-2xl p-3 flex items-center justify-between border transition-all duration-500 ${isConnected ? "border-primary/20" : "border-destructive/20"}`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse" : "bg-destructive"}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                  {isAuthenticated ? "Account Mode" : isConnected ? "Secure Link" : "Disconnected"}
                </span>
              </div>
              <span className="text-[9px] font-mono text-white/15 tracking-tighter hidden sm:block">
                {socket?.id?.slice(0, 8).toUpperCase() || "---"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
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

          <div ref={howStepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full glass border-white/10 text-[10px] font-black text-primary mb-4">
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

      {/* GAMEPLAY PREVIEW — HORIZONTAL SCROLL */}
      <section ref={gameplayRef} className="relative z-10 h-dvh flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.6_0.25_200/0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-10 left-0 right-0 z-10 text-center pointer-events-none">
          <div className="section-header space-y-2">
            <div className="section-badge inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
              <Play className="h-3 w-3 text-accent fill-accent" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Preview</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
              <span className="block overflow-hidden"><span className="reveal-line inline-block">See the</span></span>
              <span className="block overflow-hidden"><span className="reveal-line inline-block">Action</span></span>
            </h2>
          </div>
        </div>

        <div ref={gameplayTrackRef} className="flex gap-8 px-[10vw] will-change-transform">
          {gameStates.map((state) => (
            <div key={state.label} className="min-w-[360px] md:min-w-[440px] lg:min-w-[520px] shrink-0">
              <div className="glass-card p-1 rounded-3xl overflow-hidden h-full">
                <div className="bg-background/60 backdrop-blur-2xl rounded-[1.8rem] p-8 md:p-10 h-full min-h-[420px] flex flex-col" style={{ backgroundImage: state.gradient }}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{state.sublabel}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">{state.badge}</span>
                  </div>

                  {state.type === "lobby" && (
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
                  )}

                  {state.type === "gameplay" && (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-center mb-6">
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pattern</div>
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
                  )}

                  {state.type === "gameover" && (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="text-center mb-6">
                        <div className="text-5xl mb-3">💀</div>
                        <div className="text-xl font-black text-destructive uppercase tracking-wider">Game Over</div>
                        <div className="text-[10px] font-mono text-white/40 tracking-widest">Protocol Terminated</div>
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
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
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

          <div ref={featuresGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

      {/* SOCIAL PROOF */}
      <section ref={socialRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.2_280/0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="section-header space-y-3">
            <div className="section-badge inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Network</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
              <span className="block overflow-hidden"><span className="reveal-line inline-block">Join the</span></span>
              <span className="block overflow-hidden"><span className="reveal-line inline-block">Grid</span></span>
            </h2>
          </div>

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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                Server Status: {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="glass-card p-1 rounded-[3rem] overflow-hidden">
            <div className="bg-background/40 backdrop-blur-2xl rounded-[2.8rem] p-10 md:p-14 space-y-8">
              <div className="space-y-3">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
                  Ready to<span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent"> Connect</span>?
                </h2>
                <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto">
                  The neural network is waiting. Every second of hesitation is a tactical error.
                </p>
              </div>

              <Button onClick={() => navigate("/play")} className="w-full h-16 btn-stitch text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 rounded-2xl text-lg">
                <Play className="h-6 w-6 fill-current" />
                <span>Enter the Arena</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 text-center pb-6 pt-4 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.6em]">
        &copy; 2026 Lexicon Timebomb — Neural Interface
      </footer>
    </div>
  );
}
