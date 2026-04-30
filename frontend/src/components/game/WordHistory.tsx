import { useGameStore } from "@/stores/gameStore";

export function WordHistory() {
  const { wordHistory, requiredLetter } = useGameStore();

  if (wordHistory.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <span className="text-2xl opacity-30">Belum ada kata...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Riwayat Kata
        </h3>
        <span className="text-xs text-muted-foreground">
          {wordHistory.length} kata
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {wordHistory.map((word, index) => {
          const isLatest = index === 0;
          const lastLetter = word[word.length - 1];

          return (
            <div
              key={index}
              className={`
                flex items-center justify-between p-3 rounded-lg
                border transition-all duration-300
                ${isLatest
                  ? "bg-doom-purple/10 border-doom-purple/50 animate-in slide-in-from-top fade-in"
                  : "bg-muted/30 border-border hover:bg-muted/50"
                }
              `}
            >
              <span className={`font-mono ${isLatest ? "text-doom-purple font-bold" : "text-foreground"}`}>
                {word}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isLatest ? "text-doom-purple" : "text-muted-foreground"}`}>
                  ←{word[0].toUpperCase()}
                </span>
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-doom-cyan/20 text-doom-cyan text-xs font-bold">
                  {lastLetter.toUpperCase()}→
                </span>
              </div>
            </div>
          );
        }).reverse()}
      </div>

      {requiredLetter && (
        <div className="mt-4 p-3 bg-doom-card/50 rounded-lg border border-doom">
          <span className="text-sm text-muted-foreground">
            Giliran berikutnya:{' '}
            <span className="text-doom-cyan font-bold">{requiredLetter.toUpperCase()}→</span>
          </span>
        </div>
      )}
    </div>
  );
}