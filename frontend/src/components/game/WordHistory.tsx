import { useGameStore } from "@/stores/gameStore";
import { History, Hash, ArrowRight, CornerDownRight, Activity } from "lucide-react";
import { useEffect, useRef } from "react";

export function WordHistory() {
  const { wordHistory } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [wordHistory.length]);

  if (wordHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 glass rounded-[2.5rem] border-white/5">
        <div className="relative">
          <Activity className="h-16 w-16 text-white/5" />
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] mt-6">
          Awaiting Neural Stream...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 glass rounded-xl border-white/10">
            <History className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-[11px] font-black text-white/80 uppercase tracking-[0.4em]">
            Protocol Log
          </h3>
        </div>
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-xl border-white/10 shadow-lg">
          <Hash className="h-3 w-3 text-accent" />
          <span className="text-[11px] font-black text-white font-mono tracking-tighter">
            {wordHistory.length.toString().padStart(3, '0')}
          </span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar flex flex-col-reverse"
      >
        {wordHistory.map((word, index) => {
          const isLatest = index === wordHistory.length - 1;
          const firstLetter = word[0].toUpperCase();
          const lastLetter = word[word.length - 1].toUpperCase();

          return (
            <div
              key={`${word}-${index}`}
              className={`
                group relative flex items-center justify-between p-5 rounded-[1.8rem]
                border transition-all duration-500
                ${isLatest
                  ? "glass border-primary/40 animate-in slide-in-from-right-8 shadow-[0_0_40px_rgba(var(--primary),0.1)]"
                  : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] grayscale hover:grayscale-0 opacity-40 hover:opacity-100"
                }
              `}
            >
              <div className="flex items-center gap-5">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black font-mono ${isLatest ? 'btn-stitch text-white' : 'glass text-white/20'}`}>
                  {(index + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black tracking-tighter uppercase ${isLatest ? "text-white glow-text-purple" : "text-white/40"}`}>
                      {word}
                    </span>
                    {isLatest && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex flex-col items-center border-r border-white/10 pr-4">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">IN</span>
                  <span className={`text-sm font-black font-mono ${isLatest ? "text-accent" : "text-white/20"}`}>{firstLetter}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">OUT</span>
                  <span className={`text-sm font-black font-mono ${isLatest ? "text-primary glow-text-purple" : "text-white/20"}`}>{lastLetter}</span>
                </div>
              </div>

              {isLatest && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-10 w-1.5 bg-primary rounded-full shadow-[0_0_15px_var(--primary)]" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 p-6 glass rounded-[2.2rem] border-primary/20 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="p-3 btn-stitch rounded-2xl shadow-lg">
            <CornerDownRight className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Next Sequence Requirement</span>
            <span className="text-xs font-bold text-white/60">Initialize word with character</span>
          </div>
        </div>
        <div className="flex items-center gap-3 glass px-6 py-2 rounded-2xl border-primary/30 group cursor-default">
          <span className="text-4xl font-black text-primary glow-text-purple animate-pulse group-hover:scale-110 transition-transform">
            {wordHistory[wordHistory.length-1]?.[wordHistory[wordHistory.length-1].length-1].toUpperCase()}
          </span>
          <ArrowRight className="h-5 w-5 text-primary opacity-50" />
        </div>
      </div>
    </div>
  );
}
