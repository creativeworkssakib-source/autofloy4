import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Bot, 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Send,
  CheckCircle2,
  Zap,
  Brain,
  Sparkles,
  Activity,
  Cpu,
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-6xl mx-auto h-[450px] md:h-[500px] lg:h-[550px] flex items-center justify-center">
      {/* Soft Background Glow */}
      <BackgroundGlow />
      
      {/* Main Content - Properly Centered */}
      <div className="relative z-10 flex items-center justify-center w-full">
        <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
          {/* Left Input Nodes */}
          <div className="flex flex-col gap-4 md:gap-6">
            <HoloNode 
              icon={<MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
              label="Messages"
              color="blue"
              delay={0}
              side="left"
            />
            <HoloNode 
              icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
              label="Customers"
              color="purple"
              delay={0.15}
              side="left"
            />
            <HoloNode 
              icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />}
              label="Orders"
              color="amber"
              delay={0.3}
              side="left"
            />
          </div>

          {/* Data Stream Lines - Left */}
          <DataStreamLeft />

          {/* Central AI Core */}
          <CentralAICore />

          {/* Data Stream Lines - Right */}
          <DataStreamRight />

          {/* Right Output Nodes */}
          <div className="flex flex-col gap-4 md:gap-6">
            <HoloNode 
              icon={<Send className="w-5 h-5 md:w-6 md:h-6" />}
              label="Auto Reply"
              color="emerald"
              delay={0.45}
              side="right"
            />
            <HoloNode 
              icon={<CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
              label="Orders"
              color="green"
              delay={0.6}
              side="right"
            />
            <HoloNode 
              icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
              label="Analytics"
              color="indigo"
              delay={0.75}
              side="right"
            />
          </div>
        </div>
      </div>

      {/* Floating Particles - Behind everything */}
      <FloatingParticles />
    </div>
  );
});

// Background Glow - Simple and Clean
const BackgroundGlow = memo(() => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-40"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
      }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, hsl(var(--secondary) / 0.25) 0%, transparent 60%)',
      }}
      animate={{ scale: [1.1, 1, 1.1] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
));

// Holographic Node Component - Clean Design
const HoloNode = memo(({ 
  icon, 
  label, 
  color, 
  delay, 
  side 
}: { 
  icon: React.ReactNode; 
  label: string; 
  color: string; 
  delay: number; 
  side: 'left' | 'right';
}) => {
  const colorClasses: Record<string, { gradient: string; glow: string; border: string }> = {
    blue: { gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/40', border: 'border-blue-400/30' },
    purple: { gradient: 'from-purple-500 to-violet-400', glow: 'shadow-purple-500/40', border: 'border-purple-400/30' },
    amber: { gradient: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/40', border: 'border-amber-400/30' },
    emerald: { gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/40', border: 'border-emerald-400/30' },
    green: { gradient: 'from-green-500 to-emerald-400', glow: 'shadow-green-500/40', border: 'border-green-400/30' },
    indigo: { gradient: 'from-indigo-500 to-purple-400', glow: 'shadow-indigo-500/40', border: 'border-indigo-400/30' },
  };

  const { gradient, glow, border } = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, x: side === 'left' ? -40 : 40, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.08 }}
    >
      {/* Pulse Ring */}
      <motion.div
        className={`absolute inset-0 -m-2 rounded-2xl border ${border}`}
        animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay }}
      />
      
      {/* Main Card */}
      <div className="relative">
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-50 blur-md`} />
        <motion.div 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${gradient} shadow-xl ${glow} overflow-hidden`}
        >
          {/* Shine Effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
            animate={{ x: ['-150%', '250%'] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          />
          {/* Glass Layer */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {icon}
          </div>
        </motion.div>
      </div>
      
      {/* Label */}
      <motion.div 
        className={`absolute ${side === 'left' ? '-right-2 translate-x-full' : '-left-2 -translate-x-full'} top-1/2 -translate-y-1/2 hidden lg:block`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        <span className="text-xs font-semibold text-foreground whitespace-nowrap px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 shadow-md">
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
});

// Central AI Core - Clean 3D Design
const CentralAICore = memo(() => (
  <motion.div
    className="relative"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
  >
    {/* Outer Rotating Ring */}
    <motion.div
      className="absolute inset-0 -m-12 md:-m-16"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full rounded-full border border-dashed border-primary/30" />
      {[0, 90, 180, 270].map((deg) => (
        <motion.div
          key={deg}
          className="absolute top-1/2 left-1/2"
          style={{ transform: `rotate(${deg}deg) translateX(56px) translateX(0) rotate(-${deg}deg)` }}
        >
          <motion.div 
            className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-br from-primary to-secondary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: deg / 180 }}
            style={{ boxShadow: '0 0 8px hsl(var(--primary))' }}
          />
        </motion.div>
      ))}
    </motion.div>

    {/* Inner Rotating Ring */}
    <motion.div
      className="absolute inset-0 -m-6 md:-m-8"
      animate={{ rotate: -360 }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full rounded-full border border-secondary/40" />
    </motion.div>

    {/* Pulsing Glow */}
    <motion.div
      className="absolute inset-0 -m-8 md:-m-12 rounded-full"
      style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)' }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 2.5, repeat: Infinity }}
    />

    {/* Core Card */}
    <div className="relative w-28 h-28 md:w-36 md:h-36" style={{ perspective: '800px' }}>
      {/* Shadow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 to-secondary/40 blur-xl transform translate-y-2" />
      
      {/* Main Card */}
      <motion.div 
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl overflow-hidden"
        animate={{ 
          rotateY: [0, 5, 0, -5, 0],
          rotateX: [0, 3, 0, -3, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: '0 20px 50px -10px hsl(var(--primary) / 0.4)'
        }}
      >
        {/* Shimmer */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
          animate={{ x: ['-150%', '250%'] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.5 }}
        />
        {/* Glass Effect */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M0 8h16M8 0v16" stroke="white" strokeWidth="0.5" fill="none"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </motion.div>
      
      {/* Bot Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Bot className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
        </motion.div>
      </div>

      {/* Floating Satellites */}
      <FloatingSatellite icon={<Brain />} position="-top-4 -right-4 md:-top-5 md:-right-5" color="amber" delay={0} />
      <FloatingSatellite icon={<Zap />} position="-bottom-3 -left-3 md:-bottom-4 md:-left-4" color="cyan" delay={0.3} />
      <FloatingSatellite icon={<Sparkles />} position="-top-3 -left-4 md:-top-4 md:-left-5" color="pink" delay={0.6} />
      <FloatingSatellite icon={<Activity />} position="-bottom-4 -right-3 md:-bottom-5 md:-right-4" color="emerald" delay={0.9} />
    </div>

    {/* AI Label */}
    <motion.div
      className="absolute -bottom-14 md:-bottom-16 inset-x-0 flex flex-col items-center"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <motion.div
        className="px-5 py-1.5 rounded-full bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/15 backdrop-blur-md border border-primary/25"
        animate={{ boxShadow: ['0 0 15px hsl(var(--primary) / 0.2)', '0 0 25px hsl(var(--primary) / 0.4)', '0 0 15px hsl(var(--primary) / 0.2)'] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <span className="text-lg md:text-xl font-bold gradient-text">AI Agent</span>
      </motion.div>
      <motion.div
        className="flex items-center gap-1.5 mt-1.5"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Cpu className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-muted-foreground font-medium">Neural Processing Active</span>
      </motion.div>
    </motion.div>
  </motion.div>
));

// Floating Satellite Icon
const FloatingSatellite = memo(({ icon, position, color, delay }: { icon: React.ReactNode; position: string; color: string; delay: number }) => {
  const colorMap: Record<string, string> = {
    amber: 'from-amber-400 to-orange-500',
    cyan: 'from-cyan-400 to-blue-500',
    pink: 'from-pink-400 to-purple-500',
    emerald: 'from-emerald-400 to-teal-500',
  };

  return (
    <motion.div
      className={`absolute ${position} z-20`}
      animate={{ 
        y: [0, -6, 0],
        scale: [1, 1.08, 1]
      }}
      transition={{ duration: 2.5, repeat: Infinity, delay }}
    >
      <div className="relative">
        <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colorMap[color]} blur-md opacity-50`} />
        <div className={`relative w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <div className="w-4 h-4 md:w-5 md:h-5 text-white">
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Data Stream Left
const DataStreamLeft = memo(() => (
  <div className="relative w-12 md:w-20 lg:w-28 h-40 flex flex-col justify-center gap-6">
    {[0, 1, 2].map((i) => (
      <DataStreamLine key={i} delay={i * 0.15} direction="left" />
    ))}
  </div>
));

// Data Stream Right
const DataStreamRight = memo(() => (
  <div className="relative w-12 md:w-20 lg:w-28 h-40 flex flex-col justify-center gap-6">
    {[0, 1, 2].map((i) => (
      <DataStreamLine key={i} delay={i * 0.15 + 0.4} direction="right" />
    ))}
  </div>
));

// Data Stream Line
const DataStreamLine = memo(({ delay, direction }: { delay: number; direction: 'left' | 'right' }) => (
  <motion.div
    className="relative h-1 w-full rounded-full overflow-hidden"
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    transition={{ delay, duration: 0.5 }}
    style={{ originX: direction === 'left' ? 0 : 1 }}
  >
    {/* Base Line */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/25 to-primary/20 rounded-full" />
    
    {/* Pulsing Glow */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-primary/40 via-secondary/50 to-primary/40 rounded-full"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
    />
    
    {/* Data Packet */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-3 h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
      style={{ boxShadow: '0 0 12px hsl(var(--primary))' }}
      animate={{
        x: direction === 'left' ? ['0%', '600%'] : ['600%', '0%'],
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1.1, 1.1, 0.6],
      }}
      transition={{ duration: 1.6, repeat: Infinity, delay: delay + 0.1 }}
    />
  </motion.div>
));

// Floating Particles - Clean and Subtle
const FloatingParticles = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 3,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 6 + Math.random() * 6,
      delay: i * 0.2,
    })), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.id % 2 === 0 
              ? 'hsl(var(--primary) / 0.4)' 
              : 'hsl(var(--secondary) / 0.3)',
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
});

BackgroundGlow.displayName = "BackgroundGlow";
HoloNode.displayName = "HoloNode";
CentralAICore.displayName = "CentralAICore";
FloatingSatellite.displayName = "FloatingSatellite";
DataStreamLeft.displayName = "DataStreamLeft";
DataStreamRight.displayName = "DataStreamRight";
DataStreamLine.displayName = "DataStreamLine";
FloatingParticles.displayName = "FloatingParticles";
Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
