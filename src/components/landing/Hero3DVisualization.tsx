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
  Brain
} from "lucide-react";

const Hero3DVisualization = memo(() => {
  return (
    <div className="relative w-full max-w-5xl mx-auto h-[400px] md:h-[480px] flex items-center justify-center">
      {/* Animated Background Gradient */}
      <motion.div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        animate={{ 
          background: [
            "radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 70% 50%, hsl(var(--secondary) / 0.15) 0%, transparent 50%)",
            "radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }} />
      </div>

      {/* Main Flow Container */}
      <div className="relative flex items-center justify-center gap-6 md:gap-10 lg:gap-16">
        
        {/* Left Side - Input Sources */}
        <div className="flex flex-col gap-5 md:gap-7">
          <InputNode 
            icon={<MessageSquare className="w-5 h-5 md:w-6 md:h-6" />}
            label="Messages"
            sublabel="Inbox"
            color="from-blue-500 to-cyan-400"
            delay={0}
          />
          <InputNode 
            icon={<Users className="w-5 h-5 md:w-6 md:h-6" />}
            label="Customers"
            sublabel="Queries"
            color="from-purple-500 to-pink-400"
            delay={0.15}
          />
          <InputNode 
            icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />}
            label="Orders"
            sublabel="Requests"
            color="from-amber-500 to-orange-400"
            delay={0.3}
          />
        </div>

        {/* Flow Lines - Left to Center */}
        <div className="relative w-16 md:w-24 lg:w-32 h-full flex flex-col justify-center gap-5 md:gap-7">
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
          {/* Multiple Glow Layers */}
          <motion.div
            className="absolute inset-0 -m-10 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-3xl"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.15, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 -m-6 rounded-3xl bg-gradient-to-r from-primary/30 to-secondary/30 blur-2xl"
            animate={{ 
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          
          {/* Rotating Outer Ring */}
          <motion.div
            className="absolute inset-0 -m-5 rounded-3xl border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/50" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary shadow-lg shadow-secondary/50" />
          </motion.div>

          {/* Counter-Rotating Inner Ring */}
          <motion.div
            className="absolute inset-0 -m-3 rounded-2xl border border-secondary/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg" />
          </motion.div>

          {/* Main Core Card */}
          <div className="relative w-28 h-28 md:w-36 md:h-36">
            {/* 3D Shadow Layers */}
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/60 to-secondary/60 transform translate-x-2 translate-y-2 blur-md" />
            <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/80 to-secondary/80 transform translate-x-1 translate-y-1 blur-sm" />
            
            {/* Main Card */}
            <motion.div 
              className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary shadow-2xl overflow-hidden"
              animate={{ 
                boxShadow: [
                  "0 25px 50px -12px hsl(var(--primary) / 0.4)",
                  "0 25px 50px -12px hsl(var(--secondary) / 0.4)",
                  "0 25px 50px -12px hsl(var(--primary) / 0.4)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Animated Shine Effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              />
              {/* Top Shine */}
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent" />
              {/* Side Shine */}
              <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white/10 to-transparent" />
            </motion.div>
            
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.08, 1],
                  rotateY: [0, 10, 0, -10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Bot className="w-12 h-12 md:w-16 md:h-16 text-white drop-shadow-lg" />
              </motion.div>
            </div>

            {/* Floating Brain Icon */}
            <motion.div
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4"
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Brain className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </motion.div>

            {/* Floating Zap Icon */}
            <motion.div
              className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3"
              animate={{ 
                y: [0, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              </div>
            </motion.div>
          </div>

          {/* AI Label */}
          <motion.div
            className="absolute -bottom-12 inset-x-0 flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-base md:text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
              AI Agent
            </span>
            <span className="text-xs text-muted-foreground">Powered by GPT</span>
          </motion.div>
        </motion.div>

        {/* Flow Lines - Center to Right */}
        <div className="relative w-16 md:w-24 lg:w-32 h-full flex flex-col justify-center gap-5 md:gap-7">
          <FlowLine delay={1} direction="right" />
          <FlowLine delay={1.15} direction="right" />
          <FlowLine delay={1.3} direction="right" />
        </div>

        {/* Right Side - Outputs */}
        <div className="flex flex-col gap-5 md:gap-7">
          <OutputNode 
            icon={<Send className="w-5 h-5 md:w-6 md:h-6" />}
            label="Auto Reply"
            sublabel="Instant"
            color="from-emerald-500 to-teal-400"
            delay={1.2}
          />
          <OutputNode 
            icon={<CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
            label="Order Created"
            sublabel="Automated"
            color="from-green-500 to-emerald-400"
            delay={1.35}
          />
          <OutputNode 
            icon={<BarChart3 className="w-5 h-5 md:w-6 md:h-6" />}
            label="Analytics"
            sublabel="Real-time"
            color="from-indigo-500 to-purple-400"
            delay={1.5}
          />
        </div>
      </div>

      {/* Floating Feature Badges */}
      <FeatureBadge 
        icon={<Clock className="w-3.5 h-3.5" />}
        label="24/7 Active"
        position="top-8 left-8 md:top-12 md:left-16"
        delay={1.6}
      />
      <FeatureBadge 
        icon={<Shield className="w-3.5 h-3.5" />}
        label="100% Secure"
        position="top-8 right-8 md:top-12 md:right-16"
        delay={1.8}
      />
      <FeatureBadge 
        icon={<Zap className="w-3.5 h-3.5" />}
        label="10x Faster"
        position="bottom-16 left-1/2 -translate-x-1/2"
        delay={2}
      />

      {/* Floating Particles */}
      <FloatingParticles />
    </div>
  );
});

// Feature Badge Component
const FeatureBadge = memo(({ 
  icon, 
  label, 
  position,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string; 
  position: string;
  delay?: number;
}) => (
  <motion.div
    className={`absolute ${position} hidden md:flex`}
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <motion.div 
      className="flex items-center gap-2 bg-card/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-border/50"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, delay: delay * 0.5 }}
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </motion.div>
  </motion.div>
));

// Input Node Component (Left Side)
const InputNode = memo(({ 
  icon, 
  label,
  sublabel,
  color,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string;
  sublabel: string;
  color: string;
  delay?: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, x: -40 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, x: 8 }}
  >
    <div className="flex items-center gap-3 md:gap-4">
      {/* Icon Card */}
      <div className="relative">
        {/* Glow */}
        <motion.div 
          className={`absolute inset-0 -m-1.5 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`}
        />
        
        {/* Pulse Ring */}
        <motion.div
          className={`absolute inset-0 rounded-xl border-2 ${color.includes('blue') ? 'border-blue-400' : color.includes('purple') ? 'border-purple-400' : 'border-amber-400'}`}
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay }}
        />
        
        {/* Card */}
        <motion.div 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${color} shadow-lg overflow-hidden`}
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Shine */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
            animate={{ x: ["-150%", "150%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />
          {/* Top Shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {icon}
          </div>
        </motion.div>
      </div>
      
      {/* Labels */}
      <div className="hidden lg:block">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  </motion.div>
));

// Output Node Component (Right Side)
const OutputNode = memo(({ 
  icon, 
  label,
  sublabel,
  color,
  delay = 0
}: { 
  icon: React.ReactNode; 
  label: string;
  sublabel: string;
  color: string;
  delay?: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, x: -8 }}
  >
    <div className="flex items-center gap-3 md:gap-4 flex-row-reverse lg:flex-row">
      {/* Labels */}
      <div className="hidden lg:block text-right">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      
      {/* Icon Card */}
      <div className="relative">
        {/* Glow */}
        <motion.div 
          className={`absolute inset-0 -m-1.5 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`}
        />
        
        {/* Success Pulse */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-success"
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.3 }}
        />
        
        {/* Card */}
        <motion.div 
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${color} shadow-lg overflow-hidden`}
          whileHover={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Shine */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
            animate={{ x: ["-150%", "150%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />
          {/* Top Shine */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white">
            {icon}
          </div>
        </motion.div>
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
    }}
  >
    {/* Line Background */}
    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/40 to-primary/20 rounded-full" />
    
    {/* Animated Glow Line */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, delay }}
    />
    
    {/* Traveling Dot */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/50"
      animate={{
        x: direction === "left" ? ["0%", "500%"] : ["500%", "0%"],
        opacity: [0, 1, 1, 0],
        scale: [0.8, 1.2, 1.2, 0.8],
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        delay: delay + 0.2,
        ease: "easeInOut"
      }}
    />
    
    {/* Secondary Dot */}
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-secondary"
      animate={{
        x: direction === "left" ? ["0%", "500%"] : ["500%", "0%"],
        opacity: [0, 0.7, 0.7, 0],
      }}
      transition={{
        duration: 1.8,
        repeat: Infinity,
        delay: delay + 0.6,
        ease: "easeInOut"
      }}
    />
  </motion.div>
));

// Floating Particles Component
const FloatingParticles = memo(() => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: 3 + Math.random() * 5,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    duration: 5 + Math.random() * 4,
    delay: i * 0.3,
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
            background: particle.id % 2 === 0 
              ? 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.1))' 
              : 'linear-gradient(135deg, hsl(var(--secondary) / 0.4), hsl(var(--secondary) / 0.1))',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1],
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

FeatureBadge.displayName = "FeatureBadge";
InputNode.displayName = "InputNode";
OutputNode.displayName = "OutputNode";
FlowLine.displayName = "FlowLine";
FloatingParticles.displayName = "FloatingParticles";
Hero3DVisualization.displayName = "Hero3DVisualization";

export default Hero3DVisualization;
