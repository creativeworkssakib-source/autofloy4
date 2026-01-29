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
  Zap,
  Clock,
  Shield,
  Sparkles,
  Cpu
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-6xl mx-auto h-[420px] md:h-[520px] flex items-center justify-center overflow-hidden">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-secondary/20 to-primary/20 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-2xl"
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 3D Grid Floor Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-20 pointer-events-none overflow-hidden">
        <div 
          className="w-full h-full"
          style={{
            background: `
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(0deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom',
          }}
        />
      </div>

      {/* Hexagon Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse">
              <polygon 
                points="24.8,22 37.3,29.2 37.3,43.4 24.8,36.2 12.3,43.4 12.3,29.2" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Main Flow Container - CENTERED */}
      <div className="relative flex items-center justify-center w-full">
        <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12">
          
          {/* Left Side - Input Sources */}
          <div className="flex flex-col gap-4 md:gap-6">
            <InputNode 
              icon={<MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
              label="Messages"
              sublabel="Inbox"
              color="from-blue-500 via-blue-400 to-cyan-400"
              glowColor="blue"
              delay={0}
            />
            <InputNode 
              icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
              label="Customers"
              sublabel="Queries"
              color="from-purple-500 via-purple-400 to-pink-400"
              glowColor="purple"
              delay={0.15}
            />
            <InputNode 
              icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />}
              label="Orders"
              sublabel="Requests"
              color="from-amber-500 via-orange-400 to-yellow-400"
              glowColor="amber"
              delay={0.3}
            />
          </div>

          {/* Flow Lines - Left to Center */}
          <div className="relative w-12 md:w-20 lg:w-28 h-full flex flex-col justify-center gap-4 md:gap-6">
            <FlowLine delay={0.5} direction="left" />
            <FlowLine delay={0.65} direction="left" />
            <FlowLine delay={0.8} direction="left" />
          </div>

          {/* Center - AI Core - MEGA 3D DESIGN */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8, type: "spring", delay: 0.3 }}
          >
            {/* Outer Rotating Rings */}
            <motion.div
              className="absolute inset-0 -m-16 md:-m-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full rounded-full border border-dashed border-primary/20" />
              {[0, 90, 180, 270].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute top-1/2 left-1/2 w-3 h-3 md:w-4 md:h-4 -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    transform: `rotate(${deg}deg) translateX(80px) rotate(-${deg}deg)`,
                  }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/50" />
                </motion.div>
              ))}
            </motion.div>

            {/* Middle Rotating Ring */}
            <motion.div
              className="absolute inset-0 -m-10 md:-m-14"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full rounded-full border-2 border-secondary/30" />
              {[45, 135, 225, 315].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute top-1/2 left-1/2 w-2 h-2 md:w-3 md:h-3"
                  style={{ 
                    transform: `rotate(${deg}deg) translateX(56px) rotate(-${deg}deg) translate(-50%, -50%)`,
                  }}
                >
                  <motion.div 
                    className="w-full h-full rounded-full bg-secondary shadow-lg shadow-secondary/50"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: deg / 180 }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pulsing Glow Layers */}
            <motion.div
              className="absolute inset-0 -m-12 rounded-full bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 blur-3xl"
              animate={{ 
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 -m-8 rounded-3xl bg-gradient-radial from-primary/40 to-transparent blur-2xl"
              animate={{ 
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.15, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            
            {/* Inner Rotating Ring with Data Particles */}
            <motion.div
              className="absolute inset-0 -m-4 md:-m-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full rounded-2xl md:rounded-3xl border border-primary/30" />
              {[0, 120, 240].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute top-1/2 left-1/2"
                  style={{ 
                    transform: `rotate(${deg}deg) translateX(44px)`,
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-primary"
                    animate={{ 
                      boxShadow: [
                        "0 0 5px hsl(var(--primary))",
                        "0 0 20px hsl(var(--primary))",
                        "0 0 5px hsl(var(--primary))",
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: deg / 360 }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Main Core Card - 3D Effect */}
            <div className="relative w-28 h-28 md:w-36 md:h-36" style={{ perspective: '1000px' }}>
              {/* Deep Shadow Layer */}
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/40 to-secondary/40 transform translate-x-3 translate-y-3 blur-lg" />
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/60 to-secondary/60 transform translate-x-2 translate-y-2 blur-md" />
              <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/80 to-secondary/80 transform translate-x-1 translate-y-1 blur-sm" />
              
              {/* Main Card with 3D Transform */}
              <motion.div 
                className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary shadow-2xl overflow-hidden"
                animate={{ 
                  rotateY: [0, 5, 0, -5, 0],
                  rotateX: [0, 3, 0, -3, 0],
                  boxShadow: [
                    "0 25px 50px -12px hsl(var(--primary) / 0.5)",
                    "0 30px 60px -10px hsl(var(--secondary) / 0.5)",
                    "0 25px 50px -12px hsl(var(--primary) / 0.5)",
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Animated Shine Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                  animate={{ x: ["-150%", "250%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
                {/* Glass Effect Top */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                {/* Glass Effect Side */}
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/15 to-transparent" />
                {/* Inner Glow */}
                <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent" />
              </motion.div>
              
              {/* Icon with 3D Effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotateY: [0, 15, 0, -15, 0],
                    z: [0, 20, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Bot className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }} />
                </motion.div>
              </div>

              {/* Floating Decorative Icons - Only 2 kept */}
              <motion.div
                className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4"
                animate={{ 
                  y: [0, 6, 0],
                  scale: [1, 1.15, 1],
                  rotate: [0, -10, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 blur-md opacity-50" />
                  <div className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500 flex items-center justify-center shadow-xl shadow-cyan-500/40">
                    <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -top-2 -left-5 md:-top-3 md:-left-6"
                animate={{ 
                  y: [0, -5, 0],
                  x: [0, 3, 0],
                  rotate: [0, 20, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 blur-md opacity-50" />
                  <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-pink-400 via-purple-400 to-violet-500 flex items-center justify-center shadow-xl shadow-purple-500/40">
                    <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* AI Label with Glow */}
            <motion.div
              className="absolute -bottom-12 md:-bottom-14 inset-x-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.span 
                className="text-lg md:text-xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ["0%", "100%", "0%"]
                }}
                style={{ backgroundSize: "200%" }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                AI Agent
              </motion.span>
              <motion.div
                className="flex items-center gap-1.5 mt-1"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Cpu className="w-3 h-3 text-primary" />
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
                  Neural Processing
                </span>
              </motion.div>
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
              sublabel="Instant"
              color="from-emerald-500 via-teal-400 to-cyan-400"
              glowColor="emerald"
              delay={1.2}
            />
            <OutputNode 
              icon={<CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
              label="Order Created"
              sublabel="Automated"
              color="from-green-500 via-emerald-400 to-teal-400"
              glowColor="green"
              delay={1.35}
            />
            <OutputNode 
              icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
              label="Analytics"
              sublabel="Real-time"
              color="from-indigo-500 via-purple-400 to-pink-400"
              glowColor="indigo"
              delay={1.5}
            />
          </div>
        </div>
      </div>

      {/* Floating Feature Badges - 3D Style */}
      <FeatureBadge 
        icon={<Clock className="w-3.5 h-3.5" />}
        label="24/7 Active"
        position="top-4 left-4 md:top-8 md:left-12"
        delay={1.6}
      />
      <FeatureBadge 
        icon={<Shield className="w-3.5 h-3.5" />}
        label="100% Secure"
        position="top-4 right-4 md:top-8 md:right-12"
        delay={1.8}
      />
      <FeatureBadge 
        icon={<Zap className="w-3.5 h-3.5" />}
        label="10x Faster"
        position="bottom-12 inset-x-0 flex justify-center"
        delay={2}
        highlight
      />

      {/* Enhanced Floating Particles */}
      <FloatingParticles />
      
      {/* Energy Lines */}
      <EnergyLines />
    </div>
  );
});

// Feature Badge Component - Enhanced 3D
const FeatureBadge = memo(({ 
  icon, 
  label, 
  position,
  delay = 0,
  highlight = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  position: string;
  delay?: number;
  highlight?: boolean;
}) => (
  <motion.div
    className={`absolute ${position} hidden md:flex`}
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <motion.div 
      className={`relative flex items-center gap-2 ${highlight ? 'bg-gradient-to-r from-primary/20 to-secondary/20' : 'bg-card/90'} backdrop-blur-xl rounded-full px-4 py-2 shadow-xl border ${highlight ? 'border-primary/30' : 'border-border/50'}`}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, delay: delay * 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Glow Effect */}
      {highlight && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className={`relative w-7 h-7 rounded-full ${highlight ? 'bg-gradient-to-br from-primary via-secondary to-primary' : 'bg-gradient-to-br from-primary to-secondary'} flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <span className={`text-xs font-semibold ${highlight ? 'text-foreground' : 'text-foreground/80'}`}>{label}</span>
    </motion.div>
  </motion.div>
));

// Input Node Component - Enhanced 3D
const InputNode = memo(({ 
  icon, 
  label,
  sublabel,
  color,
  glowColor,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string;
  sublabel: string;
  color: string;
  glowColor: string;
  delay?: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, x: -50, rotateY: -30 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }}
    transition={{ delay, duration: 0.6, type: "spring" }}
    whileHover={{ scale: 1.08, x: 10 }}
  >
    <div className="flex items-center gap-3 md:gap-4">
      {/* Icon Card with 3D Effect */}
      <div className="relative" style={{ perspective: '500px' }}>
        {/* Animated Glow */}
        <motion.div 
          className={`absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-60 blur-xl transition-all duration-300`}
        />
        
        {/* Multiple Pulse Rings */}
        <motion.div
          className={`absolute inset-0 rounded-xl border-2 border-${glowColor}-400/50`}
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay }}
        />
        <motion.div
          className={`absolute inset-0 rounded-xl border border-${glowColor}-400/30`}
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: delay + 0.3 }}
        />
        
        {/* 3D Shadow Layers */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} transform translate-x-1.5 translate-y-1.5 blur-sm opacity-60`} />
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} transform translate-x-1 translate-y-1 opacity-80`} />
        
        {/* Card */}
        <motion.div 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${color} shadow-2xl overflow-hidden`}
          whileHover={{ rotateY: 15, rotateX: -10 }}
          transition={{ duration: 0.3 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Animated Shine */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
          {/* Glass Top */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
          {/* Glass Side */}
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/20 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-lg">
            {icon}
          </div>
        </motion.div>
      </div>
      
      {/* Labels with Animation */}
      <motion.div 
        className="hidden lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </motion.div>
    </div>
  </motion.div>
));

// Output Node Component - Enhanced 3D
const OutputNode = memo(({ 
  icon, 
  label,
  sublabel,
  color,
  glowColor,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string;
  sublabel: string;
  color: string;
  glowColor: string;
  delay?: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, x: 50, rotateY: 30 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }}
    transition={{ delay, duration: 0.6, type: "spring" }}
    whileHover={{ scale: 1.08, x: -10 }}
  >
    <div className="flex items-center gap-3 md:gap-4 flex-row-reverse lg:flex-row">
      {/* Labels with Animation */}
      <motion.div 
        className="hidden lg:block text-right"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        <p className="text-sm font-bold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </motion.div>
      
      {/* Icon Card with 3D Effect */}
      <div className="relative" style={{ perspective: '500px' }}>
        {/* Animated Glow */}
        <motion.div 
          className={`absolute inset-0 -m-2 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-60 blur-xl transition-all duration-300`}
        />
        
        {/* Success Pulse Rings */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-success/50"
          animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.3 }}
        />
        <motion.div
          className="absolute inset-0 rounded-xl border border-success/30"
          animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.5 }}
        />
        
        {/* 3D Shadow Layers */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} transform translate-x-1.5 translate-y-1.5 blur-sm opacity-60`} />
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} transform translate-x-1 translate-y-1 opacity-80`} />
        
        {/* Card */}
        <motion.div 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${color} shadow-2xl overflow-hidden`}
          whileHover={{ rotateY: -15, rotateX: -10 }}
          transition={{ duration: 0.3 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Animated Shine */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
          {/* Glass Top */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
          {/* Glass Side */}
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/20 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-lg">
            {icon}
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
));

// Flow Line Component - Enhanced with Multiple Particles
const FlowLine = memo(({ delay = 0, direction = "left" }: { delay?: number; direction?: "left" | "right" }) => (
  <motion.div
    className="relative h-1 w-full"
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: 1 }}
    transition={{ delay, duration: 0.5 }}
    style={{ 
      originX: direction === "left" ? 0 : 1,
    }}
  >
    {/* Line Background with Gradient */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/30 to-primary/10 rounded-full" />
    
    {/* Animated Glow Line */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 2, repeat: Infinity, delay }}
    />
    
    {/* Primary Traveling Dot */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary"
      style={{ 
        boxShadow: '0 0 12px hsl(var(--primary)), 0 0 24px hsl(var(--primary) / 0.5)'
      }}
      animate={{
        x: direction === "left" ? ["0%", "600%"] : ["600%", "0%"],
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1.2, 1.2, 0.6],
      }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        delay: delay + 0.1,
        ease: "easeInOut"
      }}
    />
    
    {/* Secondary Dot */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-secondary"
      style={{ 
        boxShadow: '0 0 8px hsl(var(--secondary))'
      }}
      animate={{
        x: direction === "left" ? ["0%", "600%"] : ["600%", "0%"],
        opacity: [0, 0.8, 0.8, 0],
      }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        delay: delay + 0.5,
        ease: "easeInOut"
      }}
    />
    
    {/* Trail Effect */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      animate={{
        x: direction === "left" ? ["0%", "800%"] : ["800%", "0%"],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        delay: delay + 0.2,
        ease: "easeInOut"
      }}
    />
  </motion.div>
));

// Enhanced Floating Particles Component
const FloatingParticles = memo(() => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 6,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    duration: 4 + Math.random() * 5,
    delay: i * 0.2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: particle.id % 3 === 0 
              ? 'linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.2))' 
              : particle.id % 3 === 1
              ? 'linear-gradient(135deg, hsl(var(--secondary) / 0.6), hsl(var(--secondary) / 0.2))'
              : 'linear-gradient(135deg, hsl(180 100% 50% / 0.4), hsl(180 100% 50% / 0.1))',
            boxShadow: particle.id % 2 === 0 
              ? '0 0 10px hsl(var(--primary) / 0.3)' 
              : '0 0 10px hsl(var(--secondary) / 0.3)',
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, particle.id % 2 === 0 ? 20 : -20, 0],
            opacity: [0.1, 0.7, 0.1],
            scale: [1, 1.5, 1],
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

// New Energy Lines Component
const EnergyLines = memo(() => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Horizontal Energy Line */}
      <motion.div
        className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Curved Energy Paths */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M 0,50 Q 25,30 50,50 T 100,50"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 0,50 Q 25,70 50,50 T 100,50"
          fill="none"
          stroke="url(#gradient2)"
          strokeWidth="0.3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(var(--secondary))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" />
            <stop offset="50%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

FeatureBadge.displayName = "FeatureBadge";
InputNode.displayName = "InputNode";
OutputNode.displayName = "OutputNode";
FlowLine.displayName = "FlowLine";
FloatingParticles.displayName = "FloatingParticles";
EnergyLines.displayName = "EnergyLines";
Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
