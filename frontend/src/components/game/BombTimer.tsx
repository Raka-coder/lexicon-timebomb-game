import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { Timer } from "lucide-react";

export function BombTimer() {
  const { timeLeft, isMyTurn, gameStatus, setTimeLeft } = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGameStatusRef = useRef(gameStatus);

  useEffect(() => {
    if (lastGameStatusRef.current !== gameStatus) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastGameStatusRef.current = gameStatus;
    }

    if (gameStatus === "playing" && isMyTurn) {
      setTimeLeft(15);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        const current = useGameStore.getState().timeLeft;
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeLeft(0);
        } else {
          setTimeLeft(current - 1);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameStatus, isMyTurn, setTimeLeft]);

  const percentage = (timeLeft / 15) * 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  const isCritical = timeLeft <= 4;
  const isWarning = timeLeft <= 8 && !isCritical;

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      {/* Decorative Stitch-style Background Rings */}
      <div className="absolute inset-0 border border-white/5 rounded-full" />
      <div className="absolute inset-4 border border-white/5 rounded-full" />
      <div className="absolute inset-8 border border-white/5 rounded-full" />
      
      <svg className="w-full h-full transform -rotate-90 filter drop-shadow(0 0 12px rgba(0,0,0,0.5))" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-white/5"
        />

        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-linear ${isCritical ? 'text-destructive' : isWarning ? 'text-stitch-amber' : 'text-primary'}`}
          style={{
            filter: `drop-shadow(0 0 10px currentColor)`,
          }}
        />

        {isCritical && isMyTurn && (
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
            className="text-destructive animate-ping"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-1.5 opacity-40">
            <Timer className="h-2.5 w-2.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em]">Chronology</span>
          </div>
          <span
            className={`text-7xl md:text-8xl font-black tracking-tighter leading-none transition-colors duration-300 ${isCritical ? 'text-destructive glow-text-destructive animate-pulse' : isWarning ? 'text-stitch-amber' : 'text-white'}`}
          >
            {timeLeft}
          </span>
          <div className="flex items-center gap-1.5 mt-3">
             {[...Array(3)].map((_, i) => (
               <div key={i} className={`h-1 w-4 rounded-full transition-all duration-500 ${
                 (i === 0 && timeLeft > 0) || (i === 1 && timeLeft > 5) || (i === 2 && timeLeft > 10)
                 ? (isCritical ? 'bg-destructive shadow-[0_0_8px_var(--color-destructive)]' : 'bg-primary shadow-[0_0_8px_var(--primary)]')
                 : 'bg-white/5'
               }`} />
             ))}
          </div>
        </div>
      </div>

      {isMyTurn && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-6 py-2 rounded-full glass border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)] animate-bounce-in">
          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
            NEURAL TURN ACTIVE
          </span>
        </div>
      )}
    </div>
  );
}
