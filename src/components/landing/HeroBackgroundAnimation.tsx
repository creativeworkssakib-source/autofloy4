import { memo } from "react";
import { motion } from "framer-motion";

/**
 * Full-screen, edge-free AI background animation
 * Designed to feel infinite and seamless without any box constraints
 */
const HeroBackgroundAnimation = memo(() => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Base gradient layer - seamless blend into background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      
      {/* Primary floating orbs - soft, organic movement */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 40%, transparent 70%)',
          left: '10%',
          top: '20%',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.6, 0.8, 0.5, 0.6],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary) / 0.12) 0%, hsl(var(--secondary) / 0.04) 40%, transparent 70%)',
          right: '5%',
          top: '30%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -80, -20, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.8, 1.1, 1],
          opacity: [0.5, 0.7, 0.4, 0.5],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(180 80% 50% / 0.08) 0%, transparent 60%)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(50px)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary ambient orbs - more subtle */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 60%)',
          left: '70%',
          bottom: '10%',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, -30, 10, 0],
          opacity: [0.4, 0.6, 0.3, 0.4],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
      />
      
      <motion.div
        className="absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary) / 0.08) 0%, transparent 60%)',
          left: '20%',
          bottom: '20%',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 60, -20, 0],
          y: [0, 20, -40, 0],
          opacity: [0.3, 0.5, 0.2, 0.3],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      {/* Floating particles - very subtle */}
      <FloatingParticles />
      
      {/* Animated gradient mesh - organic flow */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--primary) / 0.1), transparent),
              radial-gradient(ellipse 60% 40% at 80% 60%, hsl(var(--secondary) / 0.08), transparent)
            `,
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Soft vignette for depth - fades to background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, hsl(var(--background)) 100%)',
        }}
      />
      
      {/* Bottom fade for seamless transition to content below */}
      <div 
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)',
        }}
      />
    </div>
  );
});

/**
 * Subtle floating particles for ambient motion
 */
const FloatingParticles = memo(() => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 10,
  }));

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: particle.id % 2 === 0 
              ? 'hsl(var(--primary) / 0.3)' 
              : 'hsl(var(--secondary) / 0.25)',
            filter: 'blur(1px)',
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, particle.id % 2 === 0 ? 30 : -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
});

FloatingParticles.displayName = "FloatingParticles";
HeroBackgroundAnimation.displayName = "HeroBackgroundAnimation";

export default HeroBackgroundAnimation;
