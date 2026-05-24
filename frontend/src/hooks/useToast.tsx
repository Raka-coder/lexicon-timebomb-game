import { toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";

const variantStyles: Record<ToastVariant, { border: string; icon: string; glow: string }> = {
  success: {
    border: "border-l-[#00FF88]/40",
    icon: "#00FF88",
    glow: "0 0 20px rgba(0,255,136,0.15)",
  },
  error: {
    border: "border-l-[#FF4444]/40",
    icon: "#FF4444",
    glow: "0 0 20px rgba(255,68,68,0.15)",
  },
  info: {
    border: "border-l-[oklch(0.65_0.2_280)]/40",
    icon: "oklch(0.65 0.2 280)",
    glow: "0 0 20px oklch(0.65 0.2 280 / 0.15)",
  },
  warning: {
    border: "border-l-[#FFB800]/40",
    icon: "#FFB800",
    glow: "0 0 20px rgba(255,184,0,0.15)",
  },
};

function showToast(message: string, variant: ToastVariant = "info", options?: { duration?: number; id?: string }) {
  const styles = variantStyles[variant];
  sonnerToast.custom(
    (toastId) => (
      <div
        className={`
          flex items-start gap-3 px-5 py-4 rounded-2xl border border-white/10
          backdrop-blur-xl bg-black/80 shadow-2xl
          border-l-[3px] ${styles.border}
          min-w-70 max-w-100
        `}
        style={{ boxShadow: `${styles.glow}, 0 8px 32px rgba(0,0,0,0.4)` }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className="h-2 w-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: styles.icon, boxShadow: `0 0 8px ${styles.icon}` }}
          />
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-white/90 leading-snug">
            {message}
          </p>
        </div>
        <button
          onClick={() => sonnerToast.dismiss(toastId)}
          className="text-white/20 hover:text-white/60 transition-colors shrink-0 p-0.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>
    ),
    { duration: options?.duration ?? 3000, id: options?.id },
  );
}

export const toast = {
  success: (message: string, options?: { duration?: number; id?: string }) => showToast(message, "success", options),
  error: (message: string, options?: { duration?: number; id?: string }) => showToast(message, "error", options),
  info: (message: string, options?: { duration?: number; id?: string }) => showToast(message, "info", options),
  warning: (message: string, options?: { duration?: number; id?: string }) => showToast(message, "warning", options),
};
