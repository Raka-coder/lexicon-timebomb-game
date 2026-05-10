import { useGameStore } from "@/stores/gameStore";
import { useEffect, useRef, useState } from "react";
import { Shield, User, Activity, Zap, Cpu } from "lucide-react";

interface PlayerCardProps {
  playerId: string;
  name: string;
  isHost: boolean;
}

export function PlayerCard({ playerId, name, isHost }: PlayerCardProps) {
  const { currentPlayerId, scores, myPlayerId } = useGameStore();
  const isActive = currentPlayerId === playerId;
  const score = scores[playerId] || 0;
  const isMe = myPlayerId === playerId;

  const [scoreChanged, setScoreChanged] = useState(false);
  const prevScoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!mountedRef.current) return;

    if (score > prevScoreRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      queueMicrotask(() => {
        if (mountedRef.current) setScoreChanged(true);
      });
      timerRef.current = setTimeout(() => {
        prevScoreRef.current = score;
        queueMicrotask(() => {
          if (mountedRef.current) setScoreChanged(false);
        });
      }, 800);
    } else {
      prevScoreRef.current = score;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [score]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <div
      className={`
        relative p-6 rounded-[2.2rem] border transition-all duration-700 overflow-hidden
        ${isActive
          ? "glass border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.15)] scale-[1.03]"
          : "bg-white/[0.02] border-white/5 opacity-60"
        }
      `}
    >
      {/* Dynamic Background for Active State */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className={`
                w-16 h-16 rounded-[1.2rem] flex items-center justify-center
                border-2 transition-all duration-500
                ${isMe
                  ? "glass border-primary/40 text-primary shadow-[0_0_25px_rgba(var(--primary),0.2)]"
                  : "bg-white/5 border-white/10 text-white/20"
                }
                ${isActive ? "scale-110 shadow-[0_0_30px_var(--primary)]" : ""}
              `}
            >
              {isMe ? <User className="h-7 w-7" /> : <Activity className="h-7 w-7" />}
              
              {isActive && (
                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary rounded-full border-[3px] border-background animate-pulse shadow-[0_0_10px_var(--primary)]" />
              )}
            </div>
            
            {isHost && (
              <div className="absolute -bottom-1.5 -right-1.5 btn-stitch p-1.5 rounded-lg border-2 border-background shadow-lg">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className={`text-xl font-black uppercase tracking-tighter ${isActive ? "text-white glow-text-purple" : "text-white/40"}`}>
                {name}
              </span>
              {isMe && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md glass border-primary/30 shadow-sm">
                   <Cpu className="h-2 w-2 text-primary" />
                   <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Local_Link</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <div className={`h-2 w-2 rounded-full transition-all duration-500 ${isActive ? 'bg-primary shadow-[0_0_10px_var(--primary)] animate-pulse' : 'bg-white/10'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                {isActive ? 'Transmitting Data' : 'Standby Protocol'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-2">
            <span
              className={`
                text-5xl font-black font-mono tabular-nums transition-all duration-500
                ${isActive ? "text-white glow-text-purple" : "text-white/20"}
                ${scoreChanged ? "text-accent glow-text-cyan scale-125 translate-y-[-4px]" : ""}
              `}
            >
              {score.toString().padStart(3, '0')}
            </span>
            {scoreChanged && (
              <Zap className="h-4 w-4 text-accent fill-accent animate-bounce" />
            )}
          </div>
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Neural_Accumulation</span>
        </div>
      </div>

      {/* Modern Progress Accent for Active Player */}
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary via-accent to-primary animate-slide-in-left bg-[length:200%_100%] duration-[2000ms]" style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
}
