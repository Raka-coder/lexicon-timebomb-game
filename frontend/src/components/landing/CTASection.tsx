import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10 py-20 md:py-28 px-6 md:px-12"
    >
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="glass-card p-1 rounded-[3rem] overflow-hidden">
          <div className="bg-background/40 backdrop-blur-2xl rounded-[2.8rem] p-10 md:p-14 space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
                Ready to<span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent"> Connect</span>?
              </h2>
              <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto">
                The neural network is waiting. Every second of hesitation is a tactical error.
              </p>
            </div>

            <Button onClick={() => navigate("/play")} className="w-full h-16 btn-stitch text-white font-black uppercase tracking-wider flex items-center justify-center gap-3 rounded-2xl text-lg">
              <Play className="h-6 w-6 fill-current" />
              <span>Enter the Arena</span>
            </Button>
          </div>
        </div>
      </div>

      <footer className="text-center mt-16 text-[9px] font-black text-muted-foreground/20 uppercase tracking-[0.6em]">
        &copy; 2026 Lexicon Timebomb — Neural Interface
      </footer>
    </motion.section>
  );
}
