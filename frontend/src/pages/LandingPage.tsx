import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Shield, Sparkles, LogOut, Play, Users, Timer,
  ScrollText, Zap, Volume2, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const features = [
  { icon: Zap, title: "Real-time Multiplayer", desc: "Socket.IO powered low-latency connections. Challenge friends or match with strangers instantly." },
  { icon: ScrollText, title: "KBBI Validated", desc: "Every word checked against the official Indonesian dictionary. No made-up words allowed." },
  { icon: Timer, title: "15-Second Bomb Timer", desc: "Race against the detonation. Each turn gives you 15 seconds to submit a valid word." },
  { icon: Volume2, title: "Procedural Audio", desc: "Dynamic sound effects that react to gameplay — pings, ticks, and explosions in real time." },
  { icon: Smartphone, title: "Responsive Design", desc: "Full experience across desktop, tablet, and mobile. Play from anywhere." },
  { icon: Users, title: "Global Matchmaking", desc: "Auto-generated aliases for quick play or track stats with a persistent account." },
];

const steps = [
  {
    icon: Play,
    title: "Create or Join",
    desc: "Host a private room with a password or jump into a public game. Quick play generates an alias instantly.",
  },
  {
    icon: ScrollText,
    title: "Chain Words",
    desc: "Your word must start with the required letter — the last letter of the previous word. Every chain tightens the noose.",
  },
  {
    icon: Timer,
    title: "Survive the Bomb",
    desc: "15 seconds per turn. Fail to submit in time and you explode. Last player standing wins.",
  },
];

const carouselSlides = [
  {
    label: "Lobby",
    sublabel: "PROTOCOL_ACTIVE",
    color: "from-primary/20 to-transparent",
    accent: "text-primary",
    badge: "2 Pemain",
    content: (
      <>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">LOBBY_ACTIVE</span>
        </div>
        <div className="text-3xl font-black font-mono text-primary glow-cyan tracking-widest mb-6">ABC12</div>
        <div className="space-y-2">
          {["Host", "Player 2"].map((name, i) => (
            <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center font-black text-xs text-white/50">
                  {name[0]}
                </div>
                <span className="font-bold text-white uppercase text-sm">{name}</span>
              </div>
              {i === 0 && <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/20 border border-primary/40">HOST</span>}
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "Gameplay",
    sublabel: "NEURAL_LINK_ACTIVE",
    color: "from-accent/20 to-transparent",
    accent: "text-accent",
    badge: "Turn Active",
    content: (
      <>
        <div className="text-center mb-4">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Pattern</div>
          <div className="text-3xl font-black text-white glow-cyan tracking-tighter uppercase mb-3">RUANG</div>
          <div className="inline-flex items-center gap-3 glass border-primary/30 px-5 py-2 rounded-2xl">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Mandatory</span>
            <div className="h-5 w-px bg-white/10" />
            <span className="text-2xl font-black text-white glow-purple animate-pulse">G</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Host", "Player 2"].map((name, i) => (
            <div key={name} className={`p-3 rounded-xl ${i === 1 ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/5"}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`h-6 w-6 rounded-md flex items-center justify-center font-black text-[10px] ${i === 1 ? "bg-primary/20 text-primary" : "bg-white/10 text-white/40"}`}>{name[0]}</div>
                <span className="text-[11px] font-black text-white uppercase">{name}</span>
                {i === 1 && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse ml-auto" />}
              </div>
              <span className="text-lg font-black font-mono text-white/80">{i === 0 ? "2" : "1"}</span>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">pts</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    label: "Game Over",
    sublabel: "PROTOCOL_TERMINATED",
    color: "from-destructive/20 to-transparent",
    accent: "text-destructive",
    badge: "Finished",
    content: (
      <>
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">💀</div>
          <div className="text-lg font-black text-destructive uppercase tracking-wider">Game Over</div>
          <div className="text-[10px] font-mono text-white/40 tracking-widest">Protocol Terminated</div>
        </div>
        <div className="space-y-2">
          {[
            { name: "Player 2", pts: "1", win: true },
            { name: "Host", pts: "2", win: false },
          ].map((p) => (
            <div key={p.name} className={`flex items-center justify-between p-3 rounded-xl ${p.win ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/5 opacity-60"}`}>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs ${p.win ? "bg-primary/20 text-primary" : "bg-white/10 text-white/30"}`}>{p.name[0]}</div>
                <span className="font-bold text-white uppercase text-sm">{p.name}</span>
                {p.win && <span className="text-[8px] font-black text-accent uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">WINNER</span>}
              </div>
              <span className="text-lg font-black font-mono text-white/60">{p.pts} pts</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { gameStatus, reset } = useGameStore();
  const { isAuthenticated, username, clearAuth, onlineUsers } = useAuthStore();
  const navigate = useNavigate();
  const hasResetRef = useRef(false);

  useEffect(() => {
    if (!hasResetRef.current && (gameStatus === "finished" || gameStatus === "waiting")) {
      reset();
      hasResetRef.current = true;
    }
    if (gameStatus === "idle") {
      hasResetRef.current = false;
    }
  }, [gameStatus, reset]);

  const handleLogout = () => {
    socket?.emit("LOGOUT");
    clearAuth();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-float pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full animate-float pointer-events-none" style={{ animationDelay: "-4s" }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* HERO */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-12 md:py-20 min-h-screen">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left space-y-8 w-full">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10 animate-in fade-in slide-in-from-left-4 duration-700">
                <Sparkles className="h-3.5 w-3.5 text-accent fill-accent animate-pulse" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.2em]">Next-Gen Word Engine</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.9] tracking-tighter text-white">
                LEXICON
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent glow-text-purple">TIMEBOMB</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Experience the <span className="text-serif text-white">highest-stakes</span>{" "}
                multiplayer word chain ever built. Connect, survive, and dominate the neural network.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Verified DB</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Low Latency</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase">Global Mesh</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md lg:shrink-0 space-y-4 animate-in fade-in slide-in-from-right-8 duration-1000">
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
      <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.2_280/0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-18 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
              <Zap className="h-3 w-3 text-primary fill-primary" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Tutorial</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">How It Works</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">Three steps to neural domination</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="group relative animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${i * 150}ms` }}>
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
                      {String(i + 1).padStart(2, "0")}
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

      {/* GAMEPLAY PREVIEW */}
      <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.6_0.25_200/0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 md:mb-18 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
              <Play className="h-3 w-3 text-accent fill-accent" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Preview</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">See the Action</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">Scroll through the game flow</p>
          </div>

          <Carousel className="w-full max-w-lg mx-auto">
            <CarouselContent>
              {carouselSlides.map((slide, i) => (
                <CarouselItem key={slide.label}>
                  <div className="glass-card p-1 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`bg-background/60 backdrop-blur-2xl rounded-[1.8rem] p-8 bg-linear-to-b ${slide.color}`}>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: i === 0 ? "oklch(0.65 0.2 280)" : i === 1 ? "oklch(0.6 0.25 200)" : "oklch(0.55 0.22 25)" }} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${slide.accent}/80`}>{slide.sublabel}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-bold text-white/30 uppercase tracking-wider">{slide.badge}</span>
                      </div>
                      {slide.content}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex items-center justify-center gap-4 mt-6">
              <CarouselPrevious className="static translate-y-0 h-10 w-10 glass border-white/10 text-white/60 hover:text-white hover:border-primary/30 rounded-xl transition-all" />
              <CarouselNext className="static translate-y-0 h-10 w-10 glass border-white/10 text-white/60 hover:text-white hover:border-primary/30 rounded-xl transition-all" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 md:mb-18 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
              <Sparkles className="h-3 w-3 text-accent fill-accent" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Specs</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Built for War</h2>
            <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">Every feature engineered for the neural arena</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, i) => (
              <div key={feature.title} className="group animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${i * 80}ms` }}>
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
      <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.2_280/0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border-white/10">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Network</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">Join the Grid</h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center group">
              <div className="relative inline-flex mb-3">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                <div className={`relative w-16 h-16 rounded-full glass border flex items-center justify-center ${isConnected ? "border-primary/30" : "border-white/10"}`}>
                  <div className={`h-4 w-4 rounded-full ${isConnected ? "bg-primary shadow-[0_0_15px_var(--primary)] animate-pulse" : "bg-destructive"}`} />
                </div>
              </div>
              <div className="text-3xl font-black font-mono text-white">{onlineUsers.length}</div>
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
              <div className="text-3xl font-black font-mono text-white">Real-time</div>
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
              <div className="text-3xl font-black font-mono text-white">Free</div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">No Paywall</div>
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
      <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
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

      <footer className="relative z-10 text-center pb-8 pt-4 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.6em]">
        &copy; 2026 Lexicon Timebomb — Neural Interface
      </footer>
    </div>
  );
}
