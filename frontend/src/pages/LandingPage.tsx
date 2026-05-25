import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";
import { BackgroundEffects, HeroSection, HowItWorksSection, GameplayPreviewSection, FeaturesSection, SocialProofSection, CTASection } from "@/components/landing";

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
