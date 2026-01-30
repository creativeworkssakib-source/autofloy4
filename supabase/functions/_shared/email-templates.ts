// Ultra-Premium Email Templates for AutoFloy
// Enterprise-Grade Dark Theme with Rich SVG Icons & Mobile-First Design

const brandColors = {
  primary: "#00D4FF",
  primaryDark: "#0099CC",
  secondary: "#7C3AED",
  secondaryDark: "#6D28D9",
  accent: "#10B981",
  accentDark: "#059669",
  gold: "#F59E0B",
  goldDark: "#D97706",
  dark: "#0A0F1A",
  darkCard: "#111827",
  darkSurface: "#1F2937",
  light: "#F8FAFC",
  lightMuted: "#E2E8F0",
  muted: "#94A3B8",
  mutedDark: "#64748B",
  danger: "#EF4444",
  dangerDark: "#DC2626",
  warning: "#F59E0B",
  warningDark: "#D97706",
};

// Premium SVG Icons - High Quality Inline SVGs for Email Compatibility
const premiumIcons = {
  // Core brand logo
  logo: `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="50%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient>
      <filter id="logoGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="40" height="40" rx="12" fill="url(#logoGradMain)" filter="url(#logoGlow)"/>
    <path d="M20 8L26 16H14L20 8Z" fill="white" fill-opacity="0.95"/>
    <path d="M20 32L14 24H26L20 32Z" fill="white" fill-opacity="0.7"/>
    <circle cx="20" cy="20" r="4" fill="white"/>
    <circle cx="20" cy="20" r="2" fill="url(#logoGradMain)"/>
  </svg>`,

  // Success check with glow effect
  checkCircle: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <filter id="successGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#successGrad)" filter="url(#successGlow)" fill-opacity="0.15"/>
    <circle cx="24" cy="24" r="20" stroke="url(#successGrad)" stroke-width="3" fill="none"/>
    <path d="M14 24L21 31L34 17" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Premium shield with gradient
  shield: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
    <path d="M24 4L6 12V24C6 36 14 42 24 44C34 42 42 36 42 24V12L24 4Z" fill="url(#shieldGrad)" fill-opacity="0.15" stroke="url(#shieldGrad)" stroke-width="2.5"/>
    <path d="M18 24L22 28L30 20" stroke="#00D4FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Premium crown icon
  crown: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
      <filter id="crownGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path d="M4 16L12 20L24 8L36 20L44 16V34C44 36 42 38 40 38H8C6 38 4 36 4 34V16Z" fill="url(#crownGrad)" fill-opacity="0.2" stroke="url(#crownGrad)" stroke-width="2.5" filter="url(#crownGlow)"/>
    <circle cx="24" cy="28" r="3" fill="#F59E0B"/>
    <circle cx="14" cy="28" r="2" fill="#F59E0B" fill-opacity="0.6"/>
    <circle cx="34" cy="28" r="2" fill="#F59E0B" fill-opacity="0.6"/>
  </svg>`,

  // Rocket with motion trail
  rocket: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rocketGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient>
    </defs>
    <path d="M12 36L8 44L16 40" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" fill="#7C3AED" fill-opacity="0.2"/>
    <path d="M36 12L44 8L40 16" stroke="#00D4FF" stroke-width="2.5" stroke-linecap="round" fill="#00D4FF" fill-opacity="0.2"/>
    <path d="M20 40C20 40 16 32 16 24C16 12 28 4 40 4C40 16 32 28 24 28C16 28 8 32 8 40" stroke="url(#rocketGrad)" stroke-width="3" fill="url(#rocketGrad)" fill-opacity="0.15"/>
    <circle cx="28" cy="18" r="4" stroke="url(#rocketGrad)" stroke-width="2.5" fill="none"/>
  </svg>`,

  // Lightning bolt
  zap: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
      <filter id="zapGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path d="M26 4L8 28H24L22 44L40 20H24L26 4Z" fill="url(#zapGrad)" stroke="url(#zapGrad)" stroke-width="2" stroke-linejoin="round" filter="url(#zapGlow)"/>
  </svg>`,

  // Bell notification
  bell: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <path d="M36 16C36 9.4 30.6 4 24 4C17.4 4 12 9.4 12 16C12 30 6 34 6 34H42C42 34 36 30 36 16Z" stroke="url(#bellGrad)" stroke-width="3" fill="url(#bellGrad)" fill-opacity="0.15"/>
    <path d="M27.5 42C26.8 43.2 25.5 44 24 44C22.5 44 21.2 43.2 20.5 42" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
    <circle cx="36" cy="10" r="4" fill="#EF4444"/>
  </svg>`,

  // Clock timer
  clock: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" stroke="#94A3B8" stroke-width="3" fill="#94A3B8" fill-opacity="0.1"/>
    <path d="M24 12V24L32 28" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="3" fill="#94A3B8"/>
  </svg>`,

  // User profile
  user: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="16" r="8" stroke="url(#userGrad)" stroke-width="3" fill="url(#userGrad)" fill-opacity="0.15"/>
    <path d="M8 40C8 32 14 28 24 28C34 28 40 32 40 40" stroke="url(#userGrad)" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  // Settings gear
  settings: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="6" stroke="#94A3B8" stroke-width="3"/>
    <path d="M24 2V6M24 42V46M8.1 8.1L11 11M37 37L39.9 39.9M2 24H6M42 24H46M8.1 39.9L11 37M37 11L39.9 8.1" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  // Sparkles magic
  sparkles: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="50%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient>
    </defs>
    <path d="M24 4L28 16L40 20L28 24L24 36L20 24L8 20L20 16L24 4Z" fill="url(#sparkleGrad)" stroke="#F59E0B" stroke-width="1.5"/>
    <path d="M38 30L40 34L44 36L40 38L38 42L36 38L32 36L36 34L38 30Z" fill="#7C3AED"/>
    <path d="M10 6L12 10L16 12L12 14L10 18L8 14L4 12L8 10L10 6Z" fill="#00D4FF"/>
  </svg>`,

  // Gift box
  gift: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="giftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
    </defs>
    <rect x="6" y="16" width="36" height="8" rx="2" stroke="url(#giftGrad)" stroke-width="3" fill="url(#giftGrad)" fill-opacity="0.15"/>
    <rect x="8" y="24" width="32" height="16" rx="2" stroke="url(#giftGrad)" stroke-width="3" fill="url(#giftGrad)" fill-opacity="0.1"/>
    <path d="M24 16V40" stroke="#10B981" stroke-width="3"/>
    <path d="M24 16C24 16 24 10 18 10C12 10 12 16 18 16C24 16 24 16 24 16Z" stroke="#10B981" stroke-width="3" fill="none"/>
    <path d="M24 16C24 16 24 10 30 10C36 10 36 16 30 16C24 16 24 16 24 16Z" stroke="#10B981" stroke-width="3" fill="none"/>
  </svg>`,

  // Lock security
  lock: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <rect x="10" y="22" width="28" height="20" rx="4" stroke="url(#lockGrad)" stroke-width="3" fill="url(#lockGrad)" fill-opacity="0.15"/>
    <path d="M14 22V14C14 8 18 4 24 4C30 4 34 8 34 14V22" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="32" r="3" fill="#F59E0B"/>
    <path d="M24 35V38" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  // X Circle error
  xCircle: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="errorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#DC2626"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" stroke="url(#errorGrad)" stroke-width="3" fill="url(#errorGrad)" fill-opacity="0.15"/>
    <path d="M30 18L18 30M18 18L30 30" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  // Arrow right
  arrowRight: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Phone mobile
  phone: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
    <rect x="12" y="4" width="24" height="40" rx="4" stroke="url(#phoneGrad)" stroke-width="3" fill="url(#phoneGrad)" fill-opacity="0.1"/>
    <line x1="18" y1="36" x2="30" y2="36" stroke="#00D4FF" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="10" r="1.5" fill="#00D4FF"/>
  </svg>`,

  // Robot AI
  robot: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7C3AED"/>
        <stop offset="100%" stop-color="#00D4FF"/>
      </linearGradient>
    </defs>
    <rect x="8" y="12" width="32" height="28" rx="6" stroke="url(#robotGrad)" stroke-width="3" fill="url(#robotGrad)" fill-opacity="0.15"/>
    <circle cx="18" cy="24" r="4" fill="#7C3AED"/>
    <circle cx="30" cy="24" r="4" fill="#00D4FF"/>
    <path d="M18 32H30" stroke="url(#robotGrad)" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 4V12" stroke="url(#robotGrad)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="24" cy="4" r="2" fill="#7C3AED"/>
  </svg>`,

  // Box package
  box: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
    </defs>
    <path d="M24 4L44 14V34L24 44L4 34V14L24 4Z" stroke="url(#boxGrad)" stroke-width="3" fill="url(#boxGrad)" fill-opacity="0.1"/>
    <path d="M24 44V24" stroke="#10B981" stroke-width="3"/>
    <path d="M44 14L24 24L4 14" stroke="#10B981" stroke-width="3"/>
    <path d="M14 9L34 19" stroke="#10B981" stroke-width="2" stroke-opacity="0.5"/>
  </svg>`,

  // Store shop
  store: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <path d="M6 42V20L24 6L42 20V42H30V30H18V42H6Z" stroke="url(#storeGrad)" stroke-width="3" fill="url(#storeGrad)" fill-opacity="0.15"/>
    <path d="M6 20H42" stroke="#F59E0B" stroke-width="2"/>
    <rect x="20" y="30" width="8" height="12" fill="#F59E0B" fill-opacity="0.3"/>
  </svg>`,

  // Globe world
  globe: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" stroke="url(#globeGrad)" stroke-width="3" fill="url(#globeGrad)" fill-opacity="0.1"/>
    <ellipse cx="24" cy="24" rx="8" ry="20" stroke="#00D4FF" stroke-width="2"/>
    <path d="M4 24H44" stroke="#00D4FF" stroke-width="2"/>
    <path d="M8 14H40" stroke="#00D4FF" stroke-width="1.5" stroke-opacity="0.5"/>
    <path d="M8 34H40" stroke="#00D4FF" stroke-width="1.5" stroke-opacity="0.5"/>
  </svg>`,

  // Calendar date
  calendar: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="8" width="36" height="36" rx="4" stroke="#94A3B8" stroke-width="3" fill="#94A3B8" fill-opacity="0.1"/>
    <path d="M6 20H42" stroke="#94A3B8" stroke-width="3"/>
    <path d="M16 4V12" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 4V12" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <rect x="14" y="28" width="6" height="6" rx="1" fill="#00D4FF"/>
  </svg>`,

  // Credit card payment
  creditCard: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10B981"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
    </defs>
    <rect x="4" y="10" width="40" height="28" rx="4" stroke="url(#cardGrad)" stroke-width="3" fill="url(#cardGrad)" fill-opacity="0.1"/>
    <path d="M4 20H44" stroke="#10B981" stroke-width="4"/>
    <path d="M12 30H20" stroke="#10B981" stroke-width="3" stroke-linecap="round"/>
    <circle cx="36" cy="30" r="4" fill="#10B981" fill-opacity="0.5"/>
  </svg>`,

  // Refresh sync
  refresh: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="refreshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00D4FF"/>
        <stop offset="100%" stop-color="#7C3AED"/>
      </linearGradient>
    </defs>
    <path d="M8 8V18H18" stroke="url(#refreshGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 40V30H30" stroke="url(#refreshGrad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M41 18C39 11 32 6 24 6C14 6 6 14 6 24" stroke="#00D4FF" stroke-width="3" stroke-linecap="round"/>
    <path d="M7 30C9 37 16 42 24 42C34 42 42 34 42 24" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  // Alert warning triangle
  alert: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="alertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#DC2626"/>
      </linearGradient>
    </defs>
    <path d="M24 4L4 44H44L24 4Z" stroke="url(#alertGrad)" stroke-width="3" fill="url(#alertGrad)" fill-opacity="0.15" stroke-linejoin="round"/>
    <path d="M24 18V28" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="24" cy="36" r="2.5" fill="#EF4444"/>
  </svg>`,

  // Suspended ban
  suspended: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="suspendGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#DC2626"/>
      </linearGradient>
      <filter id="suspendGlow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="40" cy="40" r="36" stroke="url(#suspendGrad)" stroke-width="4" fill="url(#suspendGrad)" fill-opacity="0.2" filter="url(#suspendGlow)"/>
    <line x1="16" y1="16" x2="64" y2="64" stroke="#EF4444" stroke-width="5" stroke-linecap="round"/>
  </svg>`,

  // Goodbye wave
  wave: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="36" stroke="#64748B" stroke-width="3" fill="#64748B" fill-opacity="0.1"/>
    <text x="40" y="52" text-anchor="middle" font-size="36">👋</text>
  </svg>`,
};

// Hero icon SVGs for different states
const heroIconSvgs = {
  success: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 28L24 36L40 20" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  
  warning: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 16V32" stroke="white" stroke-width="5" stroke-linecap="round"/>
    <circle cx="28" cy="42" r="3" fill="white"/>
  </svg>`,
  
  danger: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="18" stroke="white" stroke-width="4" fill="none"/>
    <line x1="18" y1="18" x2="38" y2="38" stroke="white" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  
  info: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="18" r="3" fill="white"/>
    <path d="M28 26V42" stroke="white" stroke-width="5" stroke-linecap="round"/>
  </svg>`,
  
  neutral: `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 24C18 20 22 16 28 16C34 16 38 20 36 24" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <path d="M16 32C18 44 38 44 40 32" stroke="white" stroke-width="4" stroke-linecap="round" fill="none"/>
  </svg>`,
};

export function getBaseTemplate(content: string, previewText: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>AutoFloy</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table {border-collapse: collapse;}
    .button-td, .button-a {transition: none !important;}
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: ${brandColors.dark};
      color: ${brandColors.light};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
      height: auto;
    }
    
    table {
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    td {
      mso-line-height-rule: exactly;
    }
    
    a {
      color: ${brandColors.primary};
      text-decoration: none;
    }
    
    .wrapper {
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(180deg, ${brandColors.dark} 0%, #050810 100%);
      padding: 40px 16px;
    }
    
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: linear-gradient(180deg, ${brandColors.darkCard} 0%, ${brandColors.dark} 100%);
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 
        0 0 0 1px rgba(255,255,255,0.05),
        0 25px 50px -12px rgba(0, 0, 0, 0.6),
        0 0 80px -20px rgba(0, 212, 255, 0.2);
    }
    
    .header {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      padding: 32px;
      text-align: center;
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }
    
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: white !important;
      text-decoration: none !important;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
      letter-spacing: -0.5px;
    }
    
    .logo-icon {
      width: 44px;
      height: 44px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.3);
    }
    
    .content {
      padding: 48px 36px;
    }
    
    .hero-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      margin: 0 auto 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .hero-icon::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      background: inherit;
      opacity: 0.3;
      filter: blur(12px);
    }
    
    .hero-icon::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent);
      padding: 2px;
    }
    
    .hero-icon-success {
      background: linear-gradient(135deg, ${brandColors.accent} 0%, ${brandColors.accentDark} 100%);
      box-shadow: 0 12px 40px rgba(16, 185, 129, 0.5);
    }
    
    .hero-icon-warning {
      background: linear-gradient(135deg, ${brandColors.gold} 0%, ${brandColors.goldDark} 100%);
      box-shadow: 0 12px 40px rgba(245, 158, 11, 0.5);
    }
    
    .hero-icon-danger {
      background: linear-gradient(135deg, ${brandColors.danger} 0%, ${brandColors.dangerDark} 100%);
      box-shadow: 0 12px 40px rgba(239, 68, 68, 0.5);
    }
    
    .hero-icon-info {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      box-shadow: 0 12px 40px rgba(0, 212, 255, 0.5);
    }
    
    .hero-icon-neutral {
      background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
      box-shadow: 0 12px 40px rgba(107, 114, 128, 0.4);
    }
    
    .title {
      font-size: 28px;
      font-weight: 800;
      color: ${brandColors.light};
      margin: 0 0 16px 0;
      text-align: center;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    
    .title-success { color: ${brandColors.accent}; }
    .title-warning { color: ${brandColors.gold}; }
    .title-danger { color: ${brandColors.danger}; }
    .title-info { color: ${brandColors.primary}; }
    
    .subtitle {
      font-size: 16px;
      color: ${brandColors.muted};
      margin: 0 0 32px 0;
      text-align: center;
      line-height: 1.7;
    }
    
    .card-section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 28px;
      margin: 28px 0;
    }
    
    .card-section-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      padding-bottom: 18px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    
    .card-section-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .card-section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: ${brandColors.muted};
      margin: 0;
      font-weight: 700;
    }
    
    .otp-box {
      background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(124,58,237,0.1) 100%);
      border: 2px solid rgba(0,212,255,0.3);
      border-radius: 20px;
      padding: 36px;
      text-align: center;
      margin: 32px 0;
      position: relative;
    }
    
    .otp-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent);
    }
    
    .otp-label {
      font-size: 11px;
      color: ${brandColors.muted};
      margin-bottom: 18px;
      text-transform: uppercase;
      letter-spacing: 3px;
      font-weight: 700;
    }
    
    .otp-code {
      font-size: 48px;
      font-weight: 900;
      letter-spacing: 16px;
      color: ${brandColors.primary};
      font-family: 'SF Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
      text-shadow: 0 0 40px rgba(0, 212, 255, 0.6);
    }
    
    .otp-expires {
      font-size: 13px;
      color: ${brandColors.muted};
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      color: white !important;
      text-decoration: none !important;
      padding: 18px 40px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 16px;
      text-align: center;
      box-shadow: 
        0 6px 24px rgba(0, 212, 255, 0.4),
        inset 0 1px 0 rgba(255,255,255,0.2);
      letter-spacing: 0.3px;
      transition: all 0.3s ease;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 36px rgba(0, 212, 255, 0.5);
    }
    
    .button-secondary {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: none;
    }
    
    .button-danger {
      background: linear-gradient(135deg, ${brandColors.danger} 0%, ${brandColors.dangerDark} 100%);
      box-shadow: 0 6px 24px rgba(239, 68, 68, 0.4);
    }
    
    .feature-row {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      padding: 18px;
      background: rgba(255,255,255,0.03);
      border-radius: 14px;
      margin-bottom: 14px;
      border: 1px solid rgba(255,255,255,0.05);
    }
    
    .feature-icon-box {
      width: 50px;
      height: 50px;
      min-width: 50px;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0, 212, 255, 0.35);
    }
    
    .feature-text {
      flex: 1;
      padding-top: 4px;
    }
    
    .feature-title {
      font-size: 16px;
      font-weight: 700;
      color: ${brandColors.light};
      margin: 0 0 6px 0;
    }
    
    .feature-desc {
      font-size: 14px;
      color: ${brandColors.muted};
      margin: 0;
      line-height: 1.5;
    }
    
    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: ${brandColors.muted};
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .info-label svg {
      width: 20px;
      height: 20px;
    }
    
    .info-value {
      color: ${brandColors.light};
      font-weight: 700;
      font-size: 14px;
      text-align: right;
    }
    
    .info-value-highlight {
      color: ${brandColors.accent};
    }
    
    .plan-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      color: white;
      padding: 12px 32px;
      border-radius: 30px;
      font-weight: 800;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
      box-shadow: 
        0 6px 24px rgba(0, 212, 255, 0.45),
        inset 0 1px 0 rgba(255,255,255,0.2);
    }
    
    .highlight-box {
      background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 16px;
      padding: 24px 28px;
      margin: 28px 0;
    }
    
    .highlight-box-warning {
      background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%);
      border-color: rgba(245,158,11,0.3);
    }
    
    .highlight-box-danger {
      background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%);
      border-color: rgba(239,68,68,0.3);
    }
    
    .highlight-box-info {
      background: linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0.05) 100%);
      border-color: rgba(0,212,255,0.3);
    }
    
    .highlight-title {
      font-size: 16px;
      font-weight: 700;
      color: ${brandColors.accent};
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .highlight-title svg {
      width: 22px;
      height: 22px;
    }
    
    .highlight-title-warning {
      color: ${brandColors.gold};
    }
    
    .highlight-title-danger {
      color: ${brandColors.danger};
    }
    
    .highlight-title-info {
      color: ${brandColors.primary};
    }
    
    .highlight-text {
      font-size: 14px;
      color: ${brandColors.muted};
      margin: 0;
      line-height: 1.7;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      margin: 36px 0;
    }
    
    .security-notice {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
      border-radius: 14px;
      padding: 18px 24px;
      margin: 28px 0;
      text-align: center;
    }
    
    .security-notice p {
      font-size: 14px;
      color: ${brandColors.danger};
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-weight: 500;
    }
    
    .security-notice svg {
      width: 20px;
      height: 20px;
    }
    
    .footer {
      padding: 32px;
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 100%);
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 28px;
      margin-bottom: 24px;
    }
    
    .footer-link {
      font-size: 13px;
      color: ${brandColors.muted};
      text-decoration: none;
      transition: color 0.2s;
    }
    
    .footer-link:hover {
      color: ${brandColors.primary};
    }
    
    .footer-text {
      font-size: 14px;
      color: ${brandColors.muted};
      margin: 0 0 20px 0;
      line-height: 1.7;
    }
    
    .footer-text a {
      color: ${brandColors.primary};
      text-decoration: none;
      font-weight: 600;
    }
    
    .copyright {
      font-size: 12px;
      color: rgba(148,163,184,0.6);
      margin: 0;
      line-height: 1.7;
    }
    
    .list-styled {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    
    .list-styled li {
      font-size: 15px;
      color: ${brandColors.lightMuted};
      line-height: 1.9;
      padding-left: 32px;
      position: relative;
      margin-bottom: 10px;
    }
    
    .list-styled li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 9px;
      width: 18px;
      height: 18px;
      background: linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary});
      border-radius: 50%;
      opacity: 0.7;
    }
    
    .comparison-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin: 32px 0;
    }
    
    .comparison-item {
      flex: 1;
      text-align: center;
      padding: 20px;
      border-radius: 16px;
    }
    
    .comparison-old {
      background: rgba(239,68,68,0.1);
      border: 1px solid rgba(239,68,68,0.25);
    }
    
    .comparison-new {
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.25);
    }
    
    .comparison-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0 0 10px 0;
      font-weight: 700;
    }
    
    .comparison-label-old {
      color: ${brandColors.danger};
    }
    
    .comparison-label-new {
      color: ${brandColors.accent};
    }
    
    .comparison-value {
      font-size: 15px;
      margin: 0;
    }
    
    .comparison-value-old {
      color: ${brandColors.muted};
      text-decoration: line-through;
    }
    
    .comparison-value-new {
      color: ${brandColors.light};
      font-weight: 700;
    }
    
    .comparison-arrow {
      font-size: 28px;
      color: ${brandColors.muted};
    }
    
    /* MOBILE RESPONSIVE - OPTIMIZED FOR PHONE SCREENS */
    @media only screen and (max-width: 600px) {
      .wrapper {
        padding: 12px 8px !important;
      }
      
      .container {
        border-radius: 18px !important;
      }
      
      .header {
        padding: 24px 16px !important;
      }
      
      .logo {
        font-size: 22px !important;
      }
      
      .logo-icon {
        width: 38px !important;
        height: 38px !important;
      }
      
      .content {
        padding: 28px 18px !important;
      }
      
      .hero-icon {
        width: 80px !important;
        height: 80px !important;
        margin-bottom: 24px !important;
      }
      
      .hero-icon svg {
        width: 44px !important;
        height: 44px !important;
      }
      
      .title {
        font-size: 22px !important;
        margin-bottom: 12px !important;
      }
      
      .subtitle {
        font-size: 14px !important;
        margin-bottom: 24px !important;
        line-height: 1.6 !important;
      }
      
      .otp-code {
        font-size: 32px !important;
        letter-spacing: 10px !important;
      }
      
      .otp-box {
        padding: 24px 16px !important;
        border-radius: 16px !important;
      }
      
      .button {
        display: block !important;
        width: 100% !important;
        padding: 16px 20px !important;
        font-size: 15px !important;
      }
      
      .footer {
        padding: 24px 16px !important;
      }
      
      .comparison-box {
        flex-direction: column !important;
        gap: 12px !important;
      }
      
      .comparison-item {
        width: 100% !important;
        padding: 16px !important;
      }
      
      .comparison-arrow {
        transform: rotate(90deg) !important;
      }
      
      .card-section {
        padding: 20px 16px !important;
        border-radius: 14px !important;
      }
      
      .card-section-header {
        margin-bottom: 18px !important;
        padding-bottom: 14px !important;
      }
      
      .feature-row {
        padding: 14px !important;
        gap: 14px !important;
      }
      
      .feature-icon-box {
        width: 42px !important;
        height: 42px !important;
        min-width: 42px !important;
      }
      
      .feature-icon-box svg {
        width: 22px !important;
        height: 22px !important;
      }
      
      .feature-title {
        font-size: 14px !important;
      }
      
      .feature-desc {
        font-size: 12px !important;
      }
      
      .info-row {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
        padding: 14px 0 !important;
      }
      
      .info-value {
        text-align: left !important;
      }
      
      .plan-badge {
        padding: 10px 24px !important;
        font-size: 13px !important;
      }
      
      .highlight-box {
        padding: 18px 16px !important;
        border-radius: 14px !important;
      }
      
      .highlight-title {
        font-size: 14px !important;
      }
      
      .highlight-text {
        font-size: 13px !important;
      }
      
      .list-styled li {
        font-size: 13px !important;
        padding-left: 28px !important;
      }
      
      .list-styled li::before {
        width: 14px !important;
        height: 14px !important;
        top: 7px !important;
      }
      
      .security-notice {
        padding: 14px 16px !important;
      }
      
      .security-notice p {
        font-size: 12px !important;
        flex-wrap: wrap !important;
      }
      
      .footer-text {
        font-size: 12px !important;
      }
      
      .copyright {
        font-size: 11px !important;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#0A0F1A;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="wrapper">
    ${content}
  </div>
</body>
</html>
`;
}

// Premium Hero Icon Creator - Uses SVG instead of emoji for better rendering
function createHeroIcon(iconType: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'success', _emoji?: string): string {
  const iconSvg = heroIconSvgs[iconType] || heroIconSvgs.success;
  
  return `
    <div class="hero-icon hero-icon-${iconType}" style="width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 32px; display: flex; align-items: center; justify-content: center;">
      ${iconSvg}
    </div>
  `;
}

export function getOTPEmailTemplate(otp: number, userName?: string): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('info')}
        </div>
        
        <h1 class="title">Verify Your Email</h1>
        <p class="subtitle">
          ${userName ? `Hi ${userName}, ` : ""}Enter the verification code below to confirm your email address and secure your account.
        </p>
        
        <div class="otp-box">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expires">
            ${premiumIcons.clock}
            <span>Expires in 10 minutes</span>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="highlight-box highlight-box-warning">
          <p class="highlight-title highlight-title-warning">
            ${premiumIcons.shield}
            Security Notice
          </p>
          <p class="highlight-text">
            Never share this code with anyone. AutoFloy will never ask for your verification code via email, phone, or message.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          If you didn't request this code, you can safely ignore this email.
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your AutoFloy verification code is: ${otp}`);
}

export function getWelcomeEmailTemplate(userName: string, email: string): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('success')}
        </div>
        
        <h1 class="title">Welcome to AutoFloy!</h1>
        <p class="subtitle">
          Congratulations ${userName}! Your email has been verified and your account is now fully activated.
        </p>
        
        <div class="highlight-box">
          <p class="highlight-title">
            ${premiumIcons.gift}
            24-Hour Free Trial Activated!
          </p>
          <p class="highlight-text">
            Explore all premium features with full access. No credit card required.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Go to Dashboard →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.sparkles}</span>
            <p class="card-section-title">What You Can Do Now</p>
          </div>
          
          <div class="feature-row">
            <div class="feature-icon-box">
              ${premiumIcons.phone}
            </div>
            <div class="feature-text">
              <p class="feature-title">Connect Facebook & WhatsApp</p>
              <p class="feature-desc">Link your business accounts to start automating</p>
            </div>
          </div>
          
          <div class="feature-row">
            <div class="feature-icon-box">
              ${premiumIcons.robot}
            </div>
            <div class="feature-text">
              <p class="feature-title">Create AI Automations</p>
              <p class="feature-desc">Set up smart auto-replies for messages & comments</p>
            </div>
          </div>
          
          <div class="feature-row" style="margin-bottom: 0;">
            <div class="feature-icon-box">
              ${premiumIcons.box}
            </div>
            <div class="feature-text">
              <p class="feature-title">Add Your Products</p>
              <p class="feature-desc">Import or create your product catalog</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help? <a href="https://autofloy.online/documentation">Documentation</a> · <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Welcome to AutoFloy, ${userName}! Your account is ready.`);
}

export function getPlanPurchaseEmailTemplate(
  userName: string,
  planName: string,
  amount: string,
  currency: string,
  startDate: string,
  endDate: string,
  invoiceNumber?: string
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('success')}
        </div>
        
        <h1 class="title">Payment Successful!</h1>
        <p class="subtitle">
          Thank you ${userName}! Your subscription has been activated successfully.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="plan-badge">${planName} Plan</span>
        </div>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.creditCard}</span>
            <p class="card-section-title">Payment Details</p>
          </div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">${premiumIcons.crown} Plan</span>
              <span class="info-value">${planName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.creditCard} Amount</span>
              <span class="info-value info-value-highlight">${currency} ${amount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.calendar} Start Date</span>
              <span class="info-value">${startDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.calendar} Valid Until</span>
              <span class="info-value">${endDate}</span>
            </div>
            ${invoiceNumber ? `
            <div class="info-row">
              <span class="info-label">Invoice #</span>
              <span class="info-value">${invoiceNumber}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="highlight-box">
          <p class="highlight-title">
            ${premiumIcons.sparkles}
            Premium Features Unlocked!
          </p>
          <p class="highlight-text">
            You now have access to all ${planName} features including unlimited automations, priority support, and more.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Start Using Premium Features →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Payment confirmed! Your ${planName} plan is now active.`);
}

export function getTrialExpiringEmailTemplate(userName: string, hoursRemaining: number): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('warning')}
        </div>
        
        <h1 class="title">Your Trial Ends Soon!</h1>
        <p class="subtitle">
          Hi ${userName}, your free trial expires in <strong style="color: ${brandColors.primary};">${hoursRemaining} hours</strong>. Upgrade now to keep your automations running!
        </p>
        
        <div class="highlight-box highlight-box-warning">
          <p class="highlight-title highlight-title-warning">
            ${premiumIcons.alert}
            Don't Lose Your Progress!
          </p>
          <p class="highlight-text">
            Your automations and settings will be saved, but premium features will be limited after the trial ends.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/pricing" class="button">
            View Plans & Upgrade →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="font-size: 14px; color: ${brandColors.muted}; text-align: center; margin: 0;">
          Need more time? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none; font-weight: 500;">Contact us</a> for a trial extension.
        </p>
      </div>
      
      <div class="footer">
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your AutoFloy trial expires in ${hoursRemaining} hours - Upgrade now!`);
}

export function getAccountSuspendedEmailTemplate(userName: string, companyName: string): string {
  const content = `
    <div class="container">
      <div class="header" style="background: linear-gradient(135deg, ${brandColors.danger} 0%, #DC2626 100%);">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('danger')}
        </div>
        
        <h1 class="title" style="color: ${brandColors.danger};">Account Suspended</h1>
        <p class="subtitle">
          Hello ${userName}, your ${companyName} account has been suspended. During this time, you won't be able to access your account or use any services.
        </p>
        
        <div class="card-section" style="border-color: rgba(239,68,68,0.2);">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.alert}</span>
            <p class="card-section-title" style="color: ${brandColors.danger};">What This Means</p>
          </div>
          
          <ul class="list-styled">
            <li style="--bullet-color: ${brandColors.danger};">You cannot log in to your account</li>
            <li style="--bullet-color: ${brandColors.danger};">All automations have been paused</li>
            <li style="--bullet-color: ${brandColors.danger};">Connected accounts are temporarily disabled</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: ${brandColors.muted}; text-align: center; margin: 24px 0;">
          If you believe this was done in error, please contact our support team immediately.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/contact" class="button button-danger">
            Contact Support
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} account has been suspended`);
}

export function getAccountActivatedEmailTemplate(userName: string, companyName: string): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('success')}
        </div>
        
        <h1 class="title" style="color: ${brandColors.accent};">Account Reactivated!</h1>
        <p class="subtitle">
          Great news ${userName}! Your ${companyName} account has been reactivated. You can now log in and continue using all services.
        </p>
        
        <div class="highlight-box">
          <p class="highlight-title">
            ${premiumIcons.sparkles}
            Welcome Back!
          </p>
          <p class="highlight-text">
            All your automations, products, and settings have been restored. Pick up right where you left off.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Go to Dashboard →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Welcome back ${userName}! Your ${companyName} account is active again.`);
}

export function getSubscriptionExpiredEmailTemplate(userName: string): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('warning')}
        </div>
        
        <h1 class="title">Subscription Expired</h1>
        <p class="subtitle">
          Hi ${userName}, your subscription has ended. Renew now to continue enjoying all premium features!
        </p>
        
        <div class="highlight-box highlight-box-warning">
          <p class="highlight-title highlight-title-warning">
            ${premiumIcons.alert}
            Features Are Limited
          </p>
          <ul class="list-styled" style="margin-top: 12px;">
            <li>Automations have been paused</li>
            <li>AI responses are disabled</li>
            <li>Advanced analytics unavailable</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/pricing" class="button">
            Renew Subscription →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="font-size: 14px; color: ${brandColors.muted}; text-align: center; margin: 0;">
          Your data is safe! Renew anytime to restore full access.
        </p>
      </div>
      
      <div class="footer">
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your AutoFloy subscription has expired - Renew now!`);
}

export function getAccountUpdateEmailTemplate(
  userName: string,
  changes: { field: string; oldValue?: string; newValue: string }[],
  companyName: string = "AutoFloy"
): string {
  const changesHtml = changes.map(change => `
    <div class="info-row">
      <div style="flex: 1;">
        <p style="font-size: 14px; font-weight: 600; color: ${brandColors.primary}; margin: 0 0 4px 0;">${change.field}</p>
        ${change.oldValue ? `<p style="font-size: 12px; color: ${brandColors.muted}; margin: 0; text-decoration: line-through;">Previous: ${change.oldValue}</p>` : ''}
        <p style="font-size: 13px; color: ${brandColors.light}; margin: 4px 0 0 0;">New: <strong>${change.newValue}</strong></p>
      </div>
    </div>
  `).join('');

  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('info')}
        </div>
        
        <h1 class="title">Account Updated</h1>
        <p class="subtitle">
          Hi ${userName}, your ${companyName} account information has been updated.
        </p>
        
        <div class="card-section" style="border-color: rgba(0,212,255,0.2);">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.settings}</span>
            <p class="card-section-title">Changes Made</p>
          </div>
          
          <div class="info-grid">
            ${changesHtml}
          </div>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/settings" class="button">
            View Account Settings →
          </a>
        </div>
        
        <div class="security-notice">
          <p>
            ${premiumIcons.shield}
            If you didn't request these changes, please contact support immediately.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} AutoFloy. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} account information has been updated.`);
}

export function getPlanExpiredEmailTemplate(
  userName: string,
  previousPlan: string,
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('warning')}
        </div>
        
        <h1 class="title">Plan Has Expired</h1>
        <p class="subtitle">
          Hi ${userName}, your ${previousPlan} plan has ended. Your account is still active with limited features.
        </p>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.settings}</span>
            <p class="card-section-title">What This Means</p>
          </div>
          
          <ul class="list-styled">
            <li>Your automations have been paused</li>
            <li>You can still access your dashboard</li>
            <li>Your data is safely stored</li>
            <li>Upgrade anytime to reactivate</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/pricing" class="button">
            Renew Your Plan →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} ${previousPlan} plan has expired.`);
}

export function getTrialAssignedEmailTemplate(
  userName: string,
  trialDays: number,
  endDate: string,
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('success')}
        </div>
        
        <h1 class="title">Free Trial Activated!</h1>
        <p class="subtitle">
          Great news ${userName}! You've been granted <strong style="color: ${brandColors.primary};">${trialDays} days</strong> of full premium access.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="plan-badge">Trial • ${trialDays} Days</span>
        </div>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.calendar}</span>
            <p class="card-section-title">Trial Details</p>
          </div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">${premiumIcons.gift} Duration</span>
              <span class="info-value">${trialDays} Days</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.calendar} Ends On</span>
              <span class="info-value">${endDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.crown} Access Level</span>
              <span class="info-value info-value-highlight">Full Premium</span>
            </div>
          </div>
        </div>
        
        <div class="highlight-box">
          <p class="highlight-title">
            ${premiumIcons.sparkles}
            Premium Features Unlocked
          </p>
          <ul class="list-styled" style="margin-top: 12px;">
            <li>Unlimited AI automations</li>
            <li>Full analytics dashboard</li>
            <li>Priority customer support</li>
            <li>All integration features</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Start Exploring →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your free trial has been activated - ${trialDays} days of full access!`);
}

// =============================================
// PREMIUM PROFESSIONAL EMAIL TEMPLATES
// =============================================

export function getPasswordResetEmailTemplate(
  userName: string,
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('warning')}
        </div>
        
        <h1 class="title">Password Has Been Reset</h1>
        <p class="subtitle">
          Hi ${userName}, your account password has been reset by an administrator.
        </p>
        
        <div class="highlight-box highlight-box-warning">
          <p class="highlight-title highlight-title-warning">
            ${premiumIcons.shield}
            Security Notice
          </p>
          <p class="highlight-text">
            Your password has been changed. If you did not request this change, please contact our support team immediately.
          </p>
        </div>
        
        <div class="feature-row">
          <div class="feature-icon-box">
            ${premiumIcons.lock}
          </div>
          <div class="feature-text">
            <p class="feature-title">What to do next</p>
            <p class="feature-desc">Log in with your new password and consider enabling two-factor authentication for extra security.</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/login" class="button">
            Log In Now →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} password has been reset.`);
}

export function getRoleChangedEmailTemplate(
  userName: string,
  newRole: string,
  companyName: string = "AutoFloy"
): string {
  const isAdmin = newRole.toLowerCase() === "admin";
  const iconType = isAdmin ? 'warning' : 'info';
  const emoji = isAdmin ? '👑' : '👤';
  
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon(iconType)}
        </div>
        
        <h1 class="title">Role Updated</h1>
        <p class="subtitle">
          Hi ${userName}, your account role has been updated.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="plan-badge" style="${isAdmin ? 'background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);' : ''}">${newRole.toUpperCase()}</span>
        </div>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.sparkles}</span>
            <p class="card-section-title">Your Permissions</p>
          </div>
          
          <ul class="list-styled">
            ${isAdmin ? `
              <li>Full access to admin dashboard</li>
              <li>Manage all users and accounts</li>
              <li>Configure site settings</li>
              <li>View analytics and reports</li>
              <li>Manage subscriptions and plans</li>
            ` : `
              <li>Access to your dashboard</li>
              <li>Manage your automations</li>
              <li>Connect social accounts</li>
              <li>View your analytics</li>
            `}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${isAdmin ? 'https://autofloy.online/admin' : 'https://autofloy.online/dashboard'}" class="button">
            ${isAdmin ? 'Go to Admin Panel →' : 'Go to Dashboard →'}
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} account role has been updated to ${newRole}.`);
}

export function getAccountDeletedEmailTemplate(
  userName: string,
  email: string,
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header" style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('neutral')}
        </div>
        
        <h1 class="title">Account Deleted</h1>
        <p class="subtitle">
          Hi ${userName}, your ${companyName} account has been permanently deleted as requested.
        </p>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.settings}</span>
            <p class="card-section-title">What's Been Deleted</p>
          </div>
          
          <ul class="list-styled">
            <li>Your account profile and settings</li>
            <li>All connected social accounts</li>
            <li>Automation configurations</li>
            <li>Product catalogs and orders</li>
            <li>Analytics and execution logs</li>
          </ul>
        </div>
        
        <div class="highlight-box highlight-box-info">
          <p class="highlight-title highlight-title-info">
            💙 We're sad to see you go!
          </p>
          <p class="highlight-text">
            If you ever want to come back, you're always welcome. Create a new account anytime at autofloy.online
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online" class="button button-secondary">
            Visit AutoFloy
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This email was sent to ${email} to confirm your account deletion.
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} account has been permanently deleted.`);
}

export function getLoginAlertEmailTemplate(
  userName: string,
  loginDetails: {
    time: string;
    device: string;
    location?: string;
    ip?: string;
  },
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('info')}
        </div>
        
        <h1 class="title">New Login Detected</h1>
        <p class="subtitle">
          Hi ${userName}, we noticed a new login to your ${companyName} account.
        </p>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.shield}</span>
            <p class="card-section-title">Login Details</p>
          </div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">${premiumIcons.calendar} Time</span>
              <span class="info-value">${loginDetails.time}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.phone} Device</span>
              <span class="info-value">${loginDetails.device}</span>
            </div>
            ${loginDetails.location ? `
            <div class="info-row">
              <span class="info-label">${premiumIcons.globe} Location</span>
              <span class="info-value">${loginDetails.location}</span>
            </div>
            ` : ''}
            ${loginDetails.ip ? `
            <div class="info-row">
              <span class="info-label">${premiumIcons.globe} IP Address</span>
              <span class="info-value">${loginDetails.ip}</span>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="highlight-box">
          <p class="highlight-title">
            ${premiumIcons.checkCircle}
            If this was you, no action is needed.
          </p>
        </div>
        
        <div class="security-notice">
          <p>
            ${premiumIcons.alert}
            If this wasn't you, secure your account by changing your password immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/settings" class="button">
            Review Account Security →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This is an automated security notification.
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `New login detected on your ${companyName} account.`);
}

export function getSubscriptionRenewalEmailTemplate(
  userName: string,
  planName: string,
  amount: string,
  currency: string,
  renewalDate: string,
  nextRenewalDate: string,
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('success')}
        </div>
        
        <h1 class="title">Subscription Renewed!</h1>
        <p class="subtitle">
          Thank you ${userName}! Your subscription has been successfully renewed.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="plan-badge">${planName} Plan</span>
        </div>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${premiumIcons.refresh}</span>
            <p class="card-section-title">Renewal Details</p>
          </div>
          
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">${premiumIcons.crown} Plan</span>
              <span class="info-value">${planName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.creditCard} Amount</span>
              <span class="info-value info-value-highlight">${currency} ${amount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.calendar} Renewal Date</span>
              <span class="info-value">${renewalDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${premiumIcons.calendar} Next Renewal</span>
              <span class="info-value">${nextRenewalDate}</span>
            </div>
          </div>
        </div>
        
        <div class="highlight-box">
          <p class="highlight-title">
            ${premiumIcons.sparkles}
            Thank You for Your Continued Trust!
          </p>
          <p class="highlight-text">
            Your automations continue running smoothly. All your premium features remain active.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Go to Dashboard →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions about billing? <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} ${planName} subscription has been renewed.`);
}

export function getSubscriptionTypeChangedEmailTemplate(
  userName: string,
  oldType: string,
  newType: string,
  companyName: string = "AutoFloy"
): string {
  const typeDisplayNames: Record<string, string> = {
    online: "Online Business",
    offline: "Offline Shop",
    both: "Both (Full Access)"
  };
  
  const typeIcons: Record<string, string> = {
    online: premiumIcons.globe,
    offline: premiumIcons.store,
    both: premiumIcons.rocket
  };
  
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">${premiumIcons.zap}</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center;">
          ${createHeroIcon('info')}
        </div>
        
        <h1 class="title">Access Type Updated</h1>
        <p class="subtitle">
          Hi ${userName}, your subscription access type has been changed.
        </p>
        
        <div class="comparison-box">
          <div class="comparison-item comparison-old">
            <p class="comparison-label comparison-label-old">PREVIOUS</p>
            <p class="comparison-value comparison-value-old">${typeDisplayNames[oldType] || oldType}</p>
          </div>
          <span class="comparison-arrow">→</span>
          <div class="comparison-item comparison-new">
            <p class="comparison-label comparison-label-new">NEW</p>
            <p class="comparison-value comparison-value-new">${typeDisplayNames[newType] || newType}</p>
          </div>
        </div>
        
        <div class="card-section">
          <div class="card-section-header">
            <span style="display: inline-block;">${typeIcons[newType] || premiumIcons.sparkles}</span>
            <p class="card-section-title">Your New Access Includes</p>
          </div>
          
          <ul class="list-styled">
            ${newType === 'online' ? `
              <li>Facebook Page automation</li>
              <li>WhatsApp Business automation</li>
              <li>AI-powered auto-replies</li>
              <li>Comment & message management</li>
              <li>Online order tracking</li>
            ` : newType === 'offline' ? `
              <li>Point of Sale (POS) system</li>
              <li>Inventory management</li>
              <li>Customer tracking</li>
              <li>Expense & profit reports</li>
              <li>Barcode scanning</li>
            ` : `
              <li>🌐 Full Online Business features</li>
              <li>🏪 Full Offline Shop features</li>
              <li>📊 Combined analytics & reports</li>
              <li>🔗 Seamless integration between both</li>
            `}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/business-overview" class="button">
            Explore Your Features →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help? <a href="https://autofloy.online/documentation">Documentation</a> · <a href="https://autofloy.online/contact">Contact Support</a>
        </p>
        <p class="copyright">
          © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
          AI-Powered Business Automation
        </p>
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `Your ${companyName} subscription type has been updated to ${typeDisplayNames[newType] || newType}.`);
}
