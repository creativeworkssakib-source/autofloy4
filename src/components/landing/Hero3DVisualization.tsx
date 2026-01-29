import { memo } from "react";
import { motion } from "framer-motion";
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Users, 
  Settings, 
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] md:h-[500px]">
      {/* Central AI Core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        {/* Outer Glow Ring */}
        <motion.div
          className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-2xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Middle Ring */}
        <motion.div
          className="absolute inset-0 -m-4 rounded-full border-2 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {/* Orbiting Dots */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary" />
        </motion.div>

        {/* Main Core */}
        <div className="relative w-28 h-28 md:w-36 md:h-36">
          {/* 3D Glass Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-2xl transform rotate-3">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent to-white/20" />
          </div>
          <div className="absolute inset-1 rounded-3xl bg-gradient-to-br from-primary to-secondary shadow-inner">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent to-white/30" />
          </div>
          
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
            </motion.div>
          </div>

          {/* Sparkle Effects */}
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-warning" />
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Feature Nodes - Positioned around the core */}
      {/* Messages Node - Top Left */}
      <motion.div
        className="absolute left-[10%] md:left-[15%] top-[15%] md:top-[20%]"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <FeatureNode 
          icon={<MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
          label="Auto Reply"
          color="from-blue-500 to-cyan-500"
          delay={0}
        />
        <ConnectionLine direction="to-center-right" delay={0.8} />
      </motion.div>

      {/* Users Node - Top Right */}
      <motion.div
        className="absolute right-[10%] md:right-[15%] top-[15%] md:top-[20%]"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <FeatureNode 
          icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
          label="Customers"
          color="from-purple-500 to-pink-500"
          delay={0.2}
        />
        <ConnectionLine direction="to-center-left" delay={1} />
      </motion.div>

      {/* Automation Node - Left Middle */}
      <motion.div
        className="absolute left-[5%] md:left-[8%] top-[45%] md:top-[50%] -translate-y-1/2"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <FeatureNode 
          icon={<Settings className="w-5 h-5 md:w-6 md:h-6" />}
          label="Automation"
          color="from-orange-500 to-amber-500"
          delay={0.4}
        />
        <ConnectionLine direction="to-center-right" delay={1.2} />
      </motion.div>

      {/* Analytics Node - Right Middle */}
      <motion.div
        className="absolute right-[5%] md:right-[8%] top-[45%] md:top-[50%] -translate-y-1/2"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <FeatureNode 
          icon={<TrendingUp className="w-5 h-5 md:w-6 md:h-6" />}
          label="Analytics"
          color="from-emerald-500 to-green-500"
          delay={0.6}
        />
        <ConnectionLine direction="to-center-left" delay={1.4} />
      </motion.div>

      {/* Security Node - Bottom Left */}
      <motion.div
        className="absolute left-[10%] md:left-[15%] bottom-[15%] md:bottom-[20%]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <FeatureNode 
          icon={<Shield className="w-5 h-5 md:w-6 md:h-6" />}
          label="Security"
          color="from-indigo-500 to-blue-500"
          delay={0.8}
        />
        <ConnectionLine direction="to-center-right" delay={1.6} />
      </motion.div>

      {/* Speed Node - Bottom Right */}
      <motion.div
        className="absolute right-[10%] md:right-[15%] bottom-[15%] md:bottom-[20%]"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <FeatureNode 
          icon={<Zap className="w-5 h-5 md:w-6 md:h-6" />}
          label="Fast"
          color="from-yellow-500 to-orange-500"
          delay={1}
        />
        <ConnectionLine direction="to-center-left" delay={1.8} />
      </motion.div>

      {/* Animated Data Particles */}
      <DataParticles />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
    </div>
  );
});

// Feature Node Component
const FeatureNode = memo(({ 
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
    className="relative group cursor-pointer"
    whileHover={{ scale: 1.1 }}
    transition={{ type: "spring", stiffness: 400 }}
  >
    {/* Glow effect */}
    <motion.div
      className={`absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`}
    />
    
    {/* Node Container */}
    <div className="relative">
      {/* 3D Card Effect */}
      <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${color} shadow-lg transform transition-transform group-hover:rotate-3`}>
        {/* Top Shine */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-transparent to-white/30" />
        {/* Inner Shadow */}
        <div className="absolute inset-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      
      {/* Label */}
      <motion.div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5 }}
      >
        <span className="text-xs md:text-sm font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-md">
          {label}
        </span>
      </motion.div>
    </div>

    {/* Pulse Ring */}
    <motion.div
      className={`absolute inset-0 -m-1 rounded-2xl border-2 border-current opacity-0`}
      style={{ borderColor: 'inherit' }}
      animate={{
        scale: [1, 1.3],
        opacity: [0.5, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: delay,
      }}
    />
  </motion.div>
));

// Connection Line Component
const ConnectionLine = memo(({ direction, delay }: { direction: string; delay: number }) => (
  <motion.div
    className={`absolute ${
      direction.includes('right') 
        ? 'left-full top-1/2 w-12 md:w-20' 
        : 'right-full top-1/2 w-12 md:w-20'
    } h-0.5`}
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 0.3 }}
    transition={{ delay, duration: 0.5 }}
    style={{ 
      originX: direction.includes('right') ? 0 : 1,
      background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))'
    }}
  >
    {/* Animated Dot */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
      animate={{
        x: direction.includes('right') ? [0, 48, 0] : [48, 0, 48],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: delay + 0.5,
        ease: "linear"
      }}
    />
  </motion.div>
));

// Data Particles Component
const DataParticles = memo(() => {
  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    duration: 3 + Math.random() * 2,
    startX: Math.random() * 100,
    startY: Math.random() * 100,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
          style={{
            left: `${particle.startX}%`,
            top: `${particle.startY}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0.5],
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

FeatureNode.displayName = "FeatureNode";
ConnectionLine.displayName = "ConnectionLine";
DataParticles.displayName = "DataParticles";
Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
