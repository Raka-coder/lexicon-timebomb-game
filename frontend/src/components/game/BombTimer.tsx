import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";

export function BombTimer() {
  const { timeLeft, isMyTurn, gameStatus, setTimeLeft } = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (gameStatus === "playing" && isMyTurn) {
      setTimeLeft(15);
      
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

  let timerColor = "#22c55e";
  if (timeLeft <= 4) {
    timerColor = "#ef4444";
  } else if (timeLeft <= 8) {
    timerColor = "#eab308";
  }

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="oklch(1 0 0 / 0.1)"
          strokeWidth="8"
          fill="none"
        />

        <circle
          cx="60"
          cy="60"
          r="54"
          stroke={timerColor}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-linear"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        />

        {timeLeft <= 4 && isMyTurn && (
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke={timerColor}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
            className="animate-ping"
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold font-mono tracking-wider"
          style={{ color: timerColor }}
        >
          {timeLeft}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
          detik
        </span>
      </div>

      {isMyTurn && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-sm font-medium text-doom-pink animate-pulse">
            ⚡ Giliranmu!
          </span>
        </div>
      )}
    </div>
  );
}