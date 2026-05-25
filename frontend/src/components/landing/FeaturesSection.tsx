import { motion } from "framer-motion";
import { Zap, ScrollText, Timer, Volume2, Smartphone, Users, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: Zap, title: "Real-time Multiplayer", desc: "Socket.IO powered low-latency connections. Challenge friends or match with strangers instantly." },
  { icon: ScrollText, title: "KBBI Validated", desc: "Every word checked against the official Indonesian dictionary. No made-up words allowed." },
  { icon: Timer, title: "15-Second Bomb Timer", desc: "Race against the detonation. Each turn gives you 15 seconds to submit a valid word." },
  { icon: Volume2, title: "Procedural Audio", desc: "Dynamic sound effects that react to gameplay — pings, ticks, and explosions in real time." },
  { icon: Smartphone, title: "Responsive Design", desc: "Full experience across desktop, tablet, and mobile. Play from anywhere." },
  { icon: Users, title: "Global Matchmaking", desc: "Auto-generated aliases for quick play or track stats with a persistent account." },
];

const headerReveal = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 80, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.6, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

export function FeaturesSection() {
  return (
    <section className="relative z-10 py-20 md:py-28 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="section-header text-center mb-14 md:mb-18 space-y-3"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="glass px-4 py-1.5 h-auto gap-2 rounded-full border-white/10 text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">
              <Sparkles className="h-3 w-3 text-accent fill-accent" />
              Specs
            </Badge>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
            <span className="block overflow-hidden"><motion.span variants={headerReveal} className="inline-block">Built for</motion.span></span>
            <span className="block overflow-hidden"><motion.span variants={headerReveal} className="inline-block">War</motion.span></span>
          </h2>
          <p className="text-sm text-muted-foreground font-mono max-w-lg mx-auto">Every feature engineered for the neural arena</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
              className="group"
            >
              <div className="glass-card p-1 rounded-3xl overflow-hidden h-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                <div className="bg-background/40 backdrop-blur-2xl rounded-[1.8rem] p-6 h-full space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{feature.title}</h3>
                    <p className="text-[12px] text-white/40 font-mono leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
