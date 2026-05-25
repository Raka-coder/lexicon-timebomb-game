import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { BackgroundEffects, HeroSection, HowItWorksSection, GameplayPreviewSection, FeaturesSection, SocialProofSection, CTASection } from "@/components/landing";

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const { socket, isConnected } = useSocket();
  const { gameStatus, reset } = useGameStore();
  const { isAuthenticated, username, clearAuth, onlineUsers } = useAuthStore();
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

  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });

    Promise.all([
      document.fonts.ready,
      new Promise<void>((resolve) => {
        if (document.readyState === "complete") resolve();
        else window.addEventListener("load", () => resolve(), { once: true });
      }),
    ]).then(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  return (
    <div className="bg-background relative overflow-x-hidden">
      <BackgroundEffects />

      <HeroSection
        socket={socket}
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        username={username || ""}
        clearAuth={clearAuth}
      />

      <HowItWorksSection />
      <GameplayPreviewSection />
      <FeaturesSection />
      <SocialProofSection isConnected={isConnected} onlineUsers={onlineUsers} />
      <CTASection />
    </div>
  );
}
