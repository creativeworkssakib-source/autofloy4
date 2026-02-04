import { memo } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles } from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[280px] sm:h-[320px] md:h-[380px] flex items-center justify-center px-4">
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--primary) / 0.05) 0%, transparent 70%)',
        }}
      />

      {/* Main Premium AI Core */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Outer rotating ring */}
        <motion.div
          className="absolute inset-0 -m-16 md:-m-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <circle 
              cx="100" cy="100" r="95" 
              fill="none" 
              stroke="url(#ringGrad)" 
              strokeWidth="1"
              strokeDasharray="6 8"
            />
          </svg>
          {/* Orbiting dots */}
          {[0, 120, 240].map((deg) => (
            <motion.div
              key={deg}
              className="absolute top-1/2 left-1/2 w-2 h-2"
              style={{ 
                transform: `rotate(${deg}deg) translateX(76px) translateY(-50%)`,
              }}
            >
              <motion.div 
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: deg / 360 }}
                style={{ boxShadow: '0 0 12px hsl(var(--primary))' }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Inner counter-rotating ring */}
        <motion.div
          className="absolute inset-0 -m-10 md:-m-12"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-60">
            <circle 
              cx="100" cy="100" r="95" 
              fill="none" 
              stroke="hsl(var(--secondary) / 0.3)"
              strokeWidth="1"
            />
          </svg>
        </motion.div>

        {/* Pulsing glow behind core */}
        <motion.div
          className="absolute inset-0 -m-4 rounded-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
          }}
          animate={{ 
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main AI Core Card */}
        <div className="relative w-24 h-24 md:w-32 md:h-32" style={{ perspective: '800px' }}>
          {/* Shadow layers */}
          <div className="absolute inset-0 rounded-2xl bg-primary/30 transform translate-x-2 translate-y-2 blur-xl" />
          <div className="absolute inset-0 rounded-2xl bg-primary/50 transform translate-x-1 translate-y-1 blur-lg" />
          
          {/* Gradient border */}
          <motion.div 
            className="absolute inset-0 rounded-2xl p-[2px]"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)))',
              backgroundSize: '200% 200%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-primary via-primary to-secondary" />
          </motion.div>
          
          {/* Card body */}
          <motion.div 
            className="absolute inset-0 rounded-2xl overflow-hidden"
            animate={{ rotateY: [0, 4, 0, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 w-1/2"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
            />
          </motion.div>
          
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Bot 
                className="w-10 h-10 md:w-14 md:h-14 text-white" 
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} 
              />
            </motion.div>
          </div>
        </div>

        {/* AI Label */}
        <motion.div
          className="absolute -bottom-10 md:-bottom-12 inset-x-0 flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-base md:text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%] animate-gradient">
            AI Agent
          </span>
          <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] md:text-xs">Smart Automation</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Speed badge */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          10x Faster
        </span>
      </motion.div>
    </div>
  );
});

Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
