import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "Memuat..." }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-doom-dark">
      <Loader2 className="h-12 w-12 animate-spin text-doom-purple glow-purple mb-4" />
      <p className="text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}