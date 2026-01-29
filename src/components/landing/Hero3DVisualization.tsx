import { memo } from "react";
import { motion } from "framer-motion";
import { 
  Bot, 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Send,
  CheckCircle2,
  Sparkles
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-5xl mx-auto h-[350px] md:h-[420px] flex items-center justify-center">
      {/* Subtle Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Main Flow Container */}
      <div className="relative flex items-center justify-center gap-4 md:gap-8 lg:gap-12">
        
        {/* Left Side - Input Sources */}
        <div className="flex flex-col gap-4 md:gap-6">
          <InputNode 
            icon={<MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
            label="Messages"
            color="from-blue-500 to-cyan-400"
            delay={0}
          />
          <InputNode 
            icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
            label="Customers"
            color="from-purple-500 to-pink-400"
            delay={0.15}
          />
          <InputNode 
            icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />}
            label="Orders"
            color="from-amber-500 to-orange-400"
            delay={0.3}
          />
        </div>

        {/* Flow Lines - Left to Center */}
        <div className="relative w-12 md:w-20 lg:w-28 h-full flex flex-col justify-center gap-4 md:gap-6">
          <FlowLine delay={0.5} />
          <FlowLine delay={0.65} />
          <FlowLine delay={0.8} />
        </div>

        {/* Center - AI Core */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", delay: 0.3 }}
        >
          {/* Outer Glow */}
          <motion.div
            className="absolute inset-0 -m-6 rounded-3xl bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 blur-2xl"
            animate={{ 
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Rotating Ring */}
          <motion.div
            className="absolute inset-0 -m-3 rounded-3xl border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg" />
          </motion.div>

          {/* Main Core Card */}
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {/* 3D Shadow Layer */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/80 to-secondary/80 transform translate-x-1 translate-y-1 blur-sm" />
            
            {/* Main Card */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary shadow-2xl overflow-hidden">
              {/* Top Shine */}
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent" />
              {/* Side Shine */}
              <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/10 to-transparent" />
            </div>
            
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bot className="w-10 h-10 md:w-14 md:h-14 text-white drop-shadow-lg" />
              </motion.div>
            </div>

            {/* Sparkle */}
            <motion.div
              className="absolute -top-1 -right-1 md:-top-2 md:-right-2"
              animate={{ 
                scale: [0.8, 1.2, 0.8],
                rotate: [0, 15, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 drop-shadow-lg" />
            </motion.div>
          </div>

          {/* AI Label */}
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Agent
            </span>
          </motion.div>
        </motion.div>

        {/* Flow Lines - Center to Right */}
        <div className="relative w-12 md:w-20 lg:w-28 h-full flex flex-col justify-center gap-4 md:gap-6">
          <FlowLine delay={1} direction="right" />
          <FlowLine delay={1.15} direction="right" />
          <FlowLine delay={1.3} direction="right" />
        </div>

        {/* Right Side - Outputs */}
        <div className="flex flex-col gap-4 md:gap-6">
          <OutputNode 
            icon={<Send className="w-5 h-5 md:w-6 md:h-6" />}
            label="Auto Reply"
            color="from-emerald-500 to-teal-400"
            delay={1.2}
          />
          <OutputNode 
            icon={<CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
            label="Order Created"
            color="from-green-500 to-emerald-400"
            delay={1.35}
          />
          <OutputNode 
            icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
            label="Analytics"
            color="from-indigo-500 to-purple-400"
            delay={1.5}
          />
        </div>
      </div>

      {/* Floating Particles */}
      <FloatingParticles />
    </div>
  );
});

// Input Node Component (Left Side)
const InputNode = memo(({ 
  icon, 
  label, 
  color,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
  delay?: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, x: -30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, x: 5 }}
  >
    <div className="flex items-center gap-2 md:gap-3">
      {/* Icon Card */}
      <div className="relative">
        {/* Glow */}
        <div className={`absolute inset-0 -m-1 rounded-xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300`} />
        
        {/* Card */}
        <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${color} shadow-lg overflow-hidden`}>
          {/* Shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {icon}
          </div>
        </div>
      </div>
      
      {/* Label */}
      <span className="text-xs md:text-sm font-medium text-muted-foreground hidden lg:block">
        {label}
      </span>
    </div>
  </motion.div>
));

// Output Node Component (Right Side)
const OutputNode = memo(({ 
  icon, 
  label, 
  color,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
  delay?: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, x: -5 }}
  >
    <div className="flex items-center gap-2 md:gap-3 flex-row-reverse lg:flex-row">
      {/* Label */}
      <span className="text-xs md:text-sm font-medium text-muted-foreground hidden lg:block">
        {label}
      </span>
      
      {/* Icon Card */}
      <div className="relative">
        {/* Glow */}
        <div className={`absolute inset-0 -m-1 rounded-xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-300`} />
        
        {/* Card */}
        <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${color} shadow-lg overflow-hidden`}>
          {/* Shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {icon}
          </div>
        </div>

        {/* Success Pulse */}
        <motion.div
          className={`absolute inset-0 rounded-xl border-2 border-current opacity-0`}
          style={{ borderColor: 'rgb(34 197 94)' }}
          animate={{
            scale: [1, 1.4],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: delay + 0.5,
          }}
        />
      </div>
    </div>
  </motion.div>
));

// Flow Line Component
const FlowLine = memo(({ delay = 0, direction = "left" }: { delay?: number; direction?: "left" | "right" }) => (
  <motion.div
    className="relative h-0.5 w-full"
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    transition={{ delay, duration: 0.4 }}
    style={{ 
      originX: direction === "left" ? 0 : 1,
      background: 'linear-gradient(90deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.5), hsl(var(--primary) / 0.3))'
    }}
  >
    {/* Traveling Dot */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
      animate={{
        x: direction === "left" ? ["0%", "400%"] : ["400%", "0%"],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        delay: delay + 0.3,
        ease: "easeInOut"
      }}
    />
  </motion.div>
));

// Floating Particles Component
const FloatingParticles = memo(() => {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: 4 + Math.random() * 4,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    duration: 4 + Math.random() * 3,
    delay: i * 0.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-primary/40 to-secondary/40"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
});

InputNode.displayName = "InputNode";
OutputNode.displayName = "OutputNode";
FlowLine.displayName = "FlowLine";
FloatingParticles.displayName = "FloatingParticles";
Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
