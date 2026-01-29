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
  Globe,
  Wifi,
  Database,
  Cloud,
  Shield,
  Rocket
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-7xl mx-auto h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center overflow-hidden">
      {/* Massive Animated Background */}
      <HolographicBackground />
      
      {/* Cyber Grid Floor */}
      <CyberGrid />
      
      {/* Main Holographic Core */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="flex items-center gap-6 md:gap-10 lg:gap-16">
          {/* Left Input Nodes */}
          <div className="flex flex-col gap-5 md:gap-7">
            <HoloNode 
              icon={<MessageSquare className="w-6 h-6 md:w-7 md:h-7" />}
              label="Messages"
              color="blue"
              delay={0}
              side="left"
            />
            <HoloNode 
              icon={<Users className="w-6 h-6 md:w-7 md:h-7" />}
              label="Customers"
              color="purple"
              delay={0.2}
              side="left"
            />
            <HoloNode 
              icon={<ShoppingCart className="w-6 h-6 md:w-7 md:h-7" />}
              label="Orders"
              color="amber"
              delay={0.4}
              side="left"
            />
          </div>

          {/* Data Stream Lines - Left */}
          <DataStreamLeft />

          {/* MEGA AI CORE - Central Hologram */}
          <MegaAICore />

          {/* Data Stream Lines - Right */}
          <DataStreamRight />

          {/* Right Output Nodes */}
          <div className="flex flex-col gap-5 md:gap-7">
            <HoloNode 
              icon={<Send className="w-6 h-6 md:w-7 md:h-7" />}
              label="Auto Reply"
              color="emerald"
              delay={0.6}
              side="right"
            />
            <HoloNode 
              icon={<CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />}
              label="Orders"
              color="green"
              delay={0.8}
              side="right"
            />
            <HoloNode 
              icon={<BarChart3 className="w-6 h-6 md:w-7 md:h-7" />}
              label="Analytics"
              color="indigo"
              delay={1}
              side="right"
            />
          </div>
        </div>
      </div>

      {/* Orbital Satellites */}
      <OrbitalSatellites />
      
      {/* Floating Tech Icons */}
      <FloatingTechIcons />
      
      {/* Particle Storm */}
      <ParticleStorm />
      
      {/* Scan Lines Effect */}
      <ScanLines />
    </div>
  );
});

// Holographic Background with Multiple Layers
const HolographicBackground = memo(() => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Primary Gradient Orbs */}
    <motion.div 
      className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
      }}
      animate={{ 
        scale: [1, 1.3, 1],
        x: [0, 100, 0],
        y: [0, 50, 0],
        rotate: [0, 180, 360]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <motion.div 
      className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--secondary) / 0.25) 0%, transparent 70%)',
      }}
      animate={{ 
        scale: [1.2, 1, 1.2],
        x: [0, -80, 0],
        y: [0, -60, 0],
        rotate: [360, 180, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    />
    <motion.div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(180 100% 50% / 0.1) 0%, hsl(var(--primary) / 0.05) 50%, transparent 70%)',
      }}
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, 360]
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Hexagon Pattern Overlay */}
    <div className="absolute inset-0 opacity-[0.04]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="hexGrid" width="56" height="100" patternUnits="userSpaceOnUse">
            <path d="M28 0 L56 17 L56 50 L28 67 L0 50 L0 17 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            <path d="M28 33 L56 50 L56 83 L28 100 L0 83 L0 50 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" />
      </svg>
    </div>
  </div>
));

// Cyber Grid Floor
const CyberGrid = memo(() => (
  <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden pointer-events-none">
    <div 
      className="absolute inset-0"
      style={{
        background: `
          linear-gradient(90deg, hsl(var(--primary) / 0.15) 1px, transparent 1px),
          linear-gradient(0deg, hsl(var(--primary) / 0.15) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        transform: 'perspective(400px) rotateX(65deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      }}
    />
    {/* Grid glow line */}
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
));

// Holographic Node Component
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
  const colorClasses: Record<string, { gradient: string; glow: string; ring: string }> = {
    blue: { gradient: 'from-blue-500 via-cyan-400 to-blue-400', glow: 'shadow-blue-500/50', ring: 'border-blue-400/50' },
    purple: { gradient: 'from-purple-500 via-violet-400 to-purple-400', glow: 'shadow-purple-500/50', ring: 'border-purple-400/50' },
    amber: { gradient: 'from-amber-500 via-orange-400 to-yellow-400', glow: 'shadow-amber-500/50', ring: 'border-amber-400/50' },
    emerald: { gradient: 'from-emerald-500 via-teal-400 to-cyan-400', glow: 'shadow-emerald-500/50', ring: 'border-emerald-400/50' },
    green: { gradient: 'from-green-500 via-emerald-400 to-teal-400', glow: 'shadow-green-500/50', ring: 'border-green-400/50' },
    indigo: { gradient: 'from-indigo-500 via-purple-400 to-pink-400', glow: 'shadow-indigo-500/50', ring: 'border-indigo-400/50' },
  };

  const { gradient, glow, ring } = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, x: side === 'left' ? -80 : 80, scale: 0.5 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.15, x: side === 'left' ? 15 : -15 }}
    >
      {/* Multiple Pulse Rings */}
      <motion.div
        className={`absolute inset-0 -m-3 rounded-2xl border-2 ${ring}`}
        animate={{ scale: [1, 1.6, 1.6], opacity: [0.8, 0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay }}
      />
      <motion.div
        className={`absolute inset-0 -m-2 rounded-2xl border ${ring}`}
        animate={{ scale: [1, 1.4, 1.4], opacity: [0.6, 0, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: delay + 0.2 }}
      />
      
      {/* Glow Backdrop */}
      <motion.div
        className={`absolute inset-0 -m-4 rounded-3xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-500`}
      />
      
      {/* 3D Layered Card */}
      <div className="relative" style={{ perspective: '600px' }}>
        {/* Deep Shadow */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-60 blur-lg transform translate-y-2`} />
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-80 blur-md transform translate-y-1`} />
        
        {/* Main Card */}
        <motion.div 
          className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl ${glow} overflow-hidden`}
          whileHover={{ rotateY: side === 'left' ? 20 : -20, rotateX: -10 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Animated Shine */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12"
            animate={{ x: ['-200%', '300%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          />
          {/* Glass Layers */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/25 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-xl">
            {icon}
          </div>
        </motion.div>
      </div>
      
      {/* Label */}
      <motion.div 
        className={`absolute ${side === 'left' ? '-right-2 translate-x-full' : '-left-2 -translate-x-full'} top-1/2 -translate-y-1/2 hidden lg:block`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.4 }}
      >
        <span className="text-xs font-bold text-foreground whitespace-nowrap px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
});

// MEGA AI Core - The Central Hologram
const MegaAICore = memo(() => (
  <motion.div
    className="relative z-20"
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 1, type: "spring", delay: 0.3 }}
  >
    {/* Outermost Rotating Ring */}
    <motion.div
      className="absolute inset-0 -m-24 md:-m-32"
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full rounded-full border border-dashed border-primary/20" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <motion.div
          key={deg}
          className="absolute top-1/2 left-1/2"
          style={{ transform: `rotate(${deg}deg) translateX(120px) rotate(-${deg}deg)` }}
        >
          <motion.div 
            className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: deg / 180 }}
            style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
          />
        </motion.div>
      ))}
    </motion.div>

    {/* Second Rotating Ring */}
    <motion.div
      className="absolute inset-0 -m-16 md:-m-24"
      animate={{ rotate: -360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full rounded-full border-2 border-secondary/30" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <motion.div
          key={deg}
          className="absolute top-1/2 left-1/2"
          style={{ transform: `rotate(${deg}deg) translateX(88px) rotate(-${deg}deg)` }}
        >
          <motion.div 
            className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gradient-to-br from-secondary to-primary"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: deg / 360 }}
            style={{ boxShadow: '0 0 15px hsl(var(--secondary))' }}
          />
        </motion.div>
      ))}
    </motion.div>

    {/* Third Inner Ring with Data Particles */}
    <motion.div
      className="absolute inset-0 -m-8 md:-m-12"
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full rounded-full border border-cyan-400/40" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <motion.div
          key={deg}
          className="absolute top-1/2 left-1/2"
          style={{ transform: `rotate(${deg}deg) translateX(56px)` }}
        >
          <motion.div 
            className="w-2 h-2 rounded-full bg-cyan-400"
            animate={{ 
              boxShadow: ['0 0 5px hsl(180 100% 50%)', '0 0 20px hsl(180 100% 50%)', '0 0 5px hsl(180 100% 50%)']
            }}
            transition={{ duration: 1, repeat: Infinity, delay: deg / 300 }}
          />
        </motion.div>
      ))}
    </motion.div>

    {/* Massive Pulsing Glow */}
    <motion.div
      className="absolute inset-0 -m-20 rounded-full"
      style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)' }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.div
      className="absolute inset-0 -m-12 rounded-full"
      style={{ background: 'radial-gradient(circle, hsl(var(--secondary) / 0.5), transparent 60%)' }}
      animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
    />

    {/* Core Card - 3D Holographic */}
    <div className="relative w-32 h-32 md:w-44 md:h-44" style={{ perspective: '1000px' }}>
      {/* Multi-layer 3D Shadow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/50 to-secondary/50 blur-2xl transform translate-y-4" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/70 to-secondary/70 blur-xl transform translate-y-2" />
      
      {/* Main Holographic Card */}
      <motion.div 
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary shadow-2xl overflow-hidden"
        animate={{ 
          rotateY: [0, 8, 0, -8, 0],
          rotateX: [0, 5, 0, -5, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: '0 30px 60px -15px hsl(var(--primary) / 0.5), 0 0 80px -20px hsl(var(--secondary) / 0.4)'
        }}
      >
        {/* Holographic Shimmer */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
          animate={{ x: ['-150%', '250%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
        {/* Glass Effects */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/20 to-transparent" />
        {/* Inner Glow */}
        <div className="absolute inset-0 bg-gradient-radial from-white/15 to-transparent" />
        {/* Digital Circuit Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <pattern id="circuit" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10h5M15 10h5M10 0v5M10 15v5" stroke="white" strokeWidth="0.5" fill="none"/>
              <circle cx="10" cy="10" r="2" fill="white"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>
        </div>
      </motion.div>
      
      {/* Central Bot Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotateY: [0, 10, 0, -10, 0],
          }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Bot className="w-14 h-14 md:w-20 md:h-20 text-white drop-shadow-2xl" style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))' }} />
        </motion.div>
      </div>

      {/* Floating Satellite Icons */}
      <FloatingSatellite icon={<Brain />} position="-top-6 -right-6 md:-top-8 md:-right-8" color="amber" delay={0} />
      <FloatingSatellite icon={<Zap />} position="-bottom-4 -left-4 md:-bottom-6 md:-left-6" color="cyan" delay={0.3} />
      <FloatingSatellite icon={<Sparkles />} position="-top-4 -left-6 md:-top-6 md:-left-8" color="pink" delay={0.6} />
      <FloatingSatellite icon={<Activity />} position="-bottom-6 -right-4 md:-bottom-8 md:-right-6" color="emerald" delay={0.9} />
    </div>

    {/* AI Label */}
    <motion.div
      className="absolute -bottom-16 md:-bottom-20 inset-x-0 flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <motion.div
        className="px-6 py-2 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 backdrop-blur-xl border border-primary/30"
        animate={{ boxShadow: ['0 0 20px hsl(var(--primary) / 0.3)', '0 0 40px hsl(var(--primary) / 0.5)', '0 0 20px hsl(var(--primary) / 0.3)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xl md:text-2xl font-bold gradient-text">AI Agent</span>
      </motion.div>
      <motion.div
        className="flex items-center gap-2 mt-2"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Cpu className="w-4 h-4 text-primary" />
        <span className="text-xs md:text-sm text-muted-foreground font-medium">Neural Processing Active</span>
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
      className={`absolute ${position}`}
      animate={{ 
        y: [0, -10, 0],
        rotate: [0, 15, 0, -15, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{ duration: 3, repeat: Infinity, delay }}
    >
      <div className="relative">
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colorMap[color]} blur-lg opacity-60`} />
        <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-xl`}>
          <div className="w-5 h-5 md:w-6 md:h-6 text-white">
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Data Stream Left
const DataStreamLeft = memo(() => (
  <div className="relative w-16 md:w-24 lg:w-32 h-48 flex flex-col justify-center gap-7">
    {[0, 1, 2].map((i) => (
      <DataStreamLine key={i} delay={i * 0.2} direction="left" />
    ))}
  </div>
));

// Data Stream Right
const DataStreamRight = memo(() => (
  <div className="relative w-16 md:w-24 lg:w-32 h-48 flex flex-col justify-center gap-7">
    {[0, 1, 2].map((i) => (
      <DataStreamLine key={i} delay={i * 0.2 + 0.5} direction="right" />
    ))}
  </div>
));

// Enhanced Data Stream Line
const DataStreamLine = memo(({ delay, direction }: { delay: number; direction: 'left' | 'right' }) => (
  <motion.div
    className="relative h-1.5 w-full rounded-full overflow-hidden"
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    transition={{ delay, duration: 0.6 }}
    style={{ originX: direction === 'left' ? 0 : 1 }}
  >
    {/* Base Line */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/30 to-primary/20 rounded-full" />
    
    {/* Pulsing Glow */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-primary/50 via-secondary/60 to-primary/50 rounded-full"
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
    />
    
    {/* Primary Data Packet */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-4 h-3 rounded-full bg-gradient-to-r from-primary to-secondary"
      style={{ boxShadow: '0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)' }}
      animate={{
        x: direction === 'left' ? ['0%', '700%'] : ['700%', '0%'],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1.2, 0.5],
      }}
      transition={{ duration: 1.8, repeat: Infinity, delay: delay + 0.1 }}
    />
    
    {/* Secondary Packet */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-3 h-2 rounded-full bg-secondary"
      style={{ boxShadow: '0 0 15px hsl(var(--secondary))' }}
      animate={{
        x: direction === 'left' ? ['0%', '700%'] : ['700%', '0%'],
        opacity: [0, 0.8, 0.8, 0],
      }}
      transition={{ duration: 1.8, repeat: Infinity, delay: delay + 0.6 }}
    />
    
    {/* Trailing Effect */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
      animate={{
        x: direction === 'left' ? ['0%', '800%'] : ['800%', '0%'],
        opacity: [0, 0.6, 0],
      }}
      transition={{ duration: 1.8, repeat: Infinity, delay: delay + 0.3 }}
    />
  </motion.div>
));

// Orbital Satellites around the whole scene
const OrbitalSatellites = memo(() => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    animate={{ rotate: 360 }}
    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
  >
    {[0, 120, 240].map((deg) => (
      <motion.div
        key={deg}
        className="absolute top-1/2 left-1/2"
        style={{ transform: `rotate(${deg}deg) translateX(280px) rotate(-${deg}deg)` }}
      >
        <motion.div 
          className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 shadow-lg flex items-center justify-center"
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.5)' }}
        >
          <div className="w-3 h-3 md:w-4 md:h-4 text-white">
            {deg === 0 ? <Globe className="w-full h-full" /> : deg === 120 ? <Wifi className="w-full h-full" /> : <Database className="w-full h-full" />}
          </div>
        </motion.div>
      </motion.div>
    ))}
  </motion.div>
));

// Floating Tech Icons
const FloatingTechIcons = memo(() => {
  const icons = [
    { Icon: Cloud, x: '5%', y: '15%', delay: 0 },
    { Icon: Shield, x: '90%', y: '20%', delay: 0.5 },
    { Icon: Rocket, x: '8%', y: '75%', delay: 1 },
    { Icon: Database, x: '88%', y: '70%', delay: 1.5 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block">
      {icons.map(({ Icon, x, y, delay }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, delay }}
        >
          <div className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// Particle Storm
const ParticleStorm = memo(() => {
  const particles = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 5 + Math.random() * 7,
      delay: i * 0.15,
    })), []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: p.id % 3 === 0 
              ? 'hsl(var(--primary) / 0.6)' 
              : p.id % 3 === 1 
              ? 'hsl(var(--secondary) / 0.5)'
              : 'hsl(180 100% 50% / 0.4)',
            boxShadow: `0 0 ${p.size * 2}px currentColor`,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, p.id % 2 === 0 ? 30 : -30, 0],
            opacity: [0.1, 0.8, 0.1],
            scale: [1, 1.8, 1],
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

// Scan Lines Effect
const ScanLines = memo(() => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
    <motion.div
      className="absolute inset-0"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 4px)',
      }}
      animate={{ y: [0, 4, 0] }}
      transition={{ duration: 0.1, repeat: Infinity }}
    />
  </div>
));

HolographicBackground.displayName = "HolographicBackground";
CyberGrid.displayName = "CyberGrid";
HoloNode.displayName = "HoloNode";
MegaAICore.displayName = "MegaAICore";
FloatingSatellite.displayName = "FloatingSatellite";
DataStreamLeft.displayName = "DataStreamLeft";
DataStreamRight.displayName = "DataStreamRight";
DataStreamLine.displayName = "DataStreamLine";
OrbitalSatellites.displayName = "OrbitalSatellites";
FloatingTechIcons.displayName = "FloatingTechIcons";
ParticleStorm.displayName = "ParticleStorm";
ScanLines.displayName = "ScanLines";
Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
