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
  Cpu
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-6xl mx-auto h-[420px] md:h-[520px] flex items-center justify-center overflow-hidden">
      {/* Top Edge Blur - Seamless fade to background */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background via-background/80 to-transparent z-20 pointer-events-none" />
      
      {/* Bottom Edge Blur - Seamless fade to background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent z-20 pointer-events-none" />
      
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

          {/* Center - AI Core - PREMIUM 3D DESIGN */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ duration: 0.8, type: "spring", delay: 0.3 }}
          >
            {/* Outer Glow Aura */}
            <div className="absolute inset-0 -m-24 md:-m-32">
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)',
                }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Outer Tech Ring - Large */}
            <motion.div
              className="absolute inset-0 -m-20 md:-m-24"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle 
                  cx="100" cy="100" r="95" 
                  fill="none" 
                  stroke="url(#outerGradient)" 
                  strokeWidth="0.5"
                  strokeDasharray="8 4"
                  className="opacity-40"
                />
                <defs>
                  <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="50%" stopColor="hsl(var(--secondary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Orbiting Nodes */}
              {[0, 90, 180, 270].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute top-1/2 left-1/2"
                  style={{ 
                    transform: `rotate(${deg}deg) translateX(96px) translateY(-50%)`,
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-primary/60"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: deg / 360 }}
                    style={{
                      boxShadow: '0 0 10px hsl(var(--primary) / 0.5)'
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Middle Tech Ring */}
            <motion.div
              className="absolute inset-0 -m-14 md:-m-18"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle 
                  cx="100" cy="100" r="95" 
                  fill="none" 
                  stroke="hsl(var(--secondary) / 0.3)"
                  strokeWidth="1"
                  className="opacity-60"
                />
                {/* Tech line segments */}
                <path 
                  d="M 100 5 L 100 15 M 195 100 L 185 100 M 100 195 L 100 185 M 5 100 L 15 100" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="opacity-50"
                />
              </svg>
              {/* Corner Indicators */}
              {[45, 135, 225, 315].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute top-1/2 left-1/2"
                  style={{ 
                    transform: `rotate(${deg}deg) translateX(72px) translateY(-50%)`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary/80" 
                    style={{
                      boxShadow: '0 0 8px hsl(var(--secondary) / 0.6)'
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Inner Pulsing Glow */}
            <motion.div
              className="absolute inset-0 -m-10 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse, hsl(var(--primary) / 0.4) 0%, hsl(var(--secondary) / 0.2) 50%, transparent 70%)',
              }}
              animate={{ 
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Close Inner Ring */}
            <motion.div
              className="absolute inset-0 -m-6 md:-m-8"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-full h-full rounded-2xl border border-primary/20" />
              {/* Data flow dots */}
              {[0, 120, 240].map((deg) => (
                <motion.div
                  key={deg}
                  className="absolute top-1/2 left-1/2"
                  style={{ 
                    transform: `rotate(${deg}deg) translateX(52px) translateY(-50%)`,
                  }}
                >
                  <motion.div 
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ 
                      scale: [1, 1.8, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: deg / 360 }}
                    style={{
                      boxShadow: '0 0 12px hsl(var(--primary))'
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Main Core Card - Premium Glass 3D */}
            <div className="relative w-32 h-32 md:w-40 md:h-40" style={{ perspective: '1200px' }}>
              {/* Multi-layer Deep Shadow */}
              <div className="absolute inset-0 rounded-[24px] md:rounded-[28px] bg-gradient-to-br from-primary/20 to-secondary/20 transform translate-x-4 translate-y-4 blur-2xl" />
              <div className="absolute inset-0 rounded-[24px] md:rounded-[28px] bg-gradient-to-br from-primary/40 to-secondary/40 transform translate-x-3 translate-y-3 blur-xl" />
              <div className="absolute inset-0 rounded-[24px] md:rounded-[28px] bg-gradient-to-br from-primary/60 to-secondary/50 transform translate-x-2 translate-y-2 blur-lg" />
              <div className="absolute inset-0 rounded-[24px] md:rounded-[28px] bg-gradient-to-br from-primary/80 to-secondary/70 transform translate-x-1 translate-y-1 blur-md" />
              
              {/* Outer Border Glow */}
              <motion.div 
                className="absolute inset-0 rounded-[24px] md:rounded-[28px] p-[2px]"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)))',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-full h-full rounded-[22px] md:rounded-[26px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]" />
              </motion.div>
              
              {/* Main Card Body */}
              <motion.div 
                className="absolute inset-0 rounded-[24px] md:rounded-[28px] overflow-hidden"
                animate={{ 
                  rotateY: [0, 3, 0, -3, 0],
                  rotateX: [0, 2, 0, -2, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Premium Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#3b82f6]" />
                
                {/* Inner Border */}
                <div className="absolute inset-[3px] rounded-[21px] md:rounded-[25px] border border-white/10" />
                
                {/* Top Glass Reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent" 
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 60%)' }}
                />
                
                {/* Left Glass Edge */}
                <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-white/15 via-white/5 to-transparent" />
                
                {/* Corner Highlight */}
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-white/10 blur-md" />
                
                {/* Bottom Reflection */}
                <div className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
                
                {/* Animated Premium Shine */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 w-[60%]"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                />
                
                {/* Holographic Effect */}
                <motion.div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                    backgroundSize: '200% 200%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%']
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              
              {/* Icon Container with Enhanced 3D */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="relative"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotateY: [0, 8, 0, -8, 0],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Icon Glow */}
                  <motion.div 
                    className="absolute inset-0 -m-2 rounded-2xl bg-white/20 blur-xl"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Bot 
                    className="w-14 h-14 md:w-18 md:h-18 text-white relative z-10" 
                    strokeWidth={1.5}
                    style={{ 
                      filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.3)) drop-shadow(0 8px 16px rgba(0,0,0,0.4))'
                    }} 
                  />
                </motion.div>
              </div>

              {/* Corner Tech Indicators */}
              <div className="absolute top-3 right-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div 
                    key={i}
                    className="w-1 h-1 rounded-full bg-white/60"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              
              {/* Bottom Tech Line */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <motion.div 
                  className="w-12 h-0.5 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>

            {/* AI Label with Glow */}
            <motion.div
              className="absolute -bottom-12 md:-bottom-14 inset-x-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.span 
                className="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-lg"
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
      <div className="absolute bottom-6 inset-x-0 flex justify-center">
        <FeatureBadge 
          icon={<Zap className="w-3.5 h-3.5" />}
          label="10x Faster"
          position=""
          delay={2}
          highlight
        />
      </div>

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
    className={`${position ? `absolute ${position}` : ''} hidden md:flex`}
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
