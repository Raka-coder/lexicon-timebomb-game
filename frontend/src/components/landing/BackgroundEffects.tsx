export function BackgroundEffects() {
  return (
    <>
      <div className="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full animate-float pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[150px] rounded-full animate-float pointer-events-none" style={{ animationDelay: "-4s" }} />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
    </>
  );
}
