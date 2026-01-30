// Ultra-Premium Email Templates for AutoFloy
// Professional Dark Theme with Premium Icons & Animations

const brandColors = {
  primary: "#00D4FF",
  secondary: "#7C3AED",
  accent: "#10B981",
  gold: "#F59E0B",
  dark: "#0F172A",
  darkCard: "#1E293B",
  light: "#F8FAFC",
  muted: "#94A3B8",
  danger: "#EF4444",
  warning: "#F59E0B",
};

// Premium SVG Icons (inline for email compatibility)
const premiumIcons = {
  logo: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#00D4FF"/>
        <stop offset="100%" style="stop-color:#7C3AED"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#logoGrad)"/>
    <path d="M16 8L20 14H12L16 8Z" fill="white"/>
    <path d="M16 24L12 18H20L16 24Z" fill="white" opacity="0.8"/>
    <circle cx="16" cy="16" r="3" fill="white"/>
  </svg>`,
  checkCircle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#10B981" stroke-width="2" fill="#10B981" fill-opacity="0.1"/>
    <path d="M8 12L11 15L16 9" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  shield: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L4 6V12C4 17.5 7.5 21 12 22C16.5 21 20 17.5 20 12V6L12 2Z" stroke="#00D4FF" stroke-width="2" fill="#00D4FF" fill-opacity="0.1"/>
    <path d="M9 12L11 14L15 10" stroke="#00D4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  crown: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 8L6 10L12 4L18 10L22 8V16C22 17 21 18 20 18H4C3 18 2 17 2 16V8Z" fill="#F59E0B" fill-opacity="0.2" stroke="#F59E0B" stroke-width="2"/>
  </svg>`,
  rocket: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 16.5L3 21L7.5 19.5M4.5 16.5L7.5 19.5M4.5 16.5C5.5 15.5 9 12 12 9C13.5 7.5 16 5.5 19 3C19 6 17.5 8.5 16 10C13 13 9.5 16.5 8.5 17.5M7.5 19.5C7.5 19.5 8.5 17.5 8.5 17.5" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/>
    <circle cx="15" cy="9" r="2" stroke="#7C3AED" stroke-width="2"/>
  </svg>`,
  zap: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#00D4FF" stroke="#00D4FF" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,
  bell: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="#F59E0B" stroke-width="2" fill="#F59E0B" fill-opacity="0.15"/>
    <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  clock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#94A3B8" stroke-width="2"/>
    <path d="M12 6V12L16 14" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  user: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="#00D4FF" stroke-width="2"/>
    <path d="M4 20C4 16 7.5 14 12 14C16.5 14 20 16 20 20" stroke="#00D4FF" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  settings: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="#94A3B8" stroke-width="2"/>
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  sparkles: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="#F59E0B" stroke="#F59E0B" stroke-width="1"/>
    <path d="M19 15L20 17L22 18L20 19L19 21L18 19L16 18L18 17L19 15Z" fill="#7C3AED"/>
    <path d="M5 3L6 5L8 6L6 7L5 9L4 7L2 6L4 5L5 3Z" fill="#00D4FF"/>
  </svg>`,
  gift: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="4" rx="1" stroke="#10B981" stroke-width="2" fill="#10B981" fill-opacity="0.15"/>
    <rect x="4" y="12" width="16" height="8" rx="1" stroke="#10B981" stroke-width="2"/>
    <path d="M12 8V20" stroke="#10B981" stroke-width="2"/>
    <path d="M12 8C12 8 12 5 9 5C6 5 6 8 9 8C12 8 12 8 12 8Z" stroke="#10B981" stroke-width="2"/>
    <path d="M12 8C12 8 12 5 15 5C18 5 18 8 15 8C12 8 12 8 12 8Z" stroke="#10B981" stroke-width="2"/>
  </svg>`,
  lock: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#F59E0B" stroke-width="2" fill="#F59E0B" fill-opacity="0.15"/>
    <path d="M7 11V7C7 4.5 9.5 2 12 2C14.5 2 17 4.5 17 7V11" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill="#F59E0B"/>
  </svg>`,
  xCircle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2" fill="#EF4444" fill-opacity="0.15"/>
    <path d="M15 9L9 15M9 9L15 15" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  arrowRight: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  phone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="14" height="20" rx="3" stroke="#00D4FF" stroke-width="2"/>
    <line x1="9" y1="18" x2="15" y2="18" stroke="#00D4FF" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  robot: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="14" rx="3" stroke="#7C3AED" stroke-width="2"/>
    <circle cx="9" cy="12" r="2" fill="#7C3AED"/>
    <circle cx="15" cy="12" r="2" fill="#7C3AED"/>
    <path d="M9 16H15" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 2V6" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="2" r="1" fill="#7C3AED"/>
  </svg>`,
  box: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z" stroke="#10B981" stroke-width="2" fill="#10B981" fill-opacity="0.1"/>
    <path d="M12 22V12" stroke="#10B981" stroke-width="2"/>
    <path d="M22 7L12 12L2 7" stroke="#10B981" stroke-width="2"/>
  </svg>`,
  store: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21V10L12 3L21 10V21H15V15H9V21H3Z" stroke="#F59E0B" stroke-width="2" fill="#F59E0B" fill-opacity="0.15"/>
  </svg>`,
  globe: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#00D4FF" stroke-width="2"/>
    <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#00D4FF" stroke-width="2"/>
    <path d="M2 12H22" stroke="#00D4FF" stroke-width="2"/>
  </svg>`,
  calendar: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#94A3B8" stroke-width="2"/>
    <path d="M3 10H21" stroke="#94A3B8" stroke-width="2"/>
    <path d="M8 2V6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 2V6" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  creditCard: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="#10B981" stroke-width="2"/>
    <path d="M2 10H22" stroke="#10B981" stroke-width="2"/>
    <path d="M6 15H10" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  refresh: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4V9H9" stroke="#00D4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 20V15H15" stroke="#00D4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 9M4 15L5.64 18.36A9 9 0 0 0 20.49 15" stroke="#00D4FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  wave: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15L5.5 13L8 16L12 10L16 15L18.5 12L20 14" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  alert: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 22H22L12 2Z" stroke="#EF4444" stroke-width="2" fill="#EF4444" fill-opacity="0.15" stroke-linejoin="round"/>
    <path d="M12 9V13" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="1" fill="#EF4444"/>
  </svg>`,
};

export function getBaseTemplate(content: string, previewText: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>AutoFloy</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${brandColors.dark};
      color: ${brandColors.light};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .wrapper {
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(180deg, ${brandColors.dark} 0%, #0B1120 100%);
      padding: 32px 16px;
    }
    
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: linear-gradient(180deg, ${brandColors.darkCard} 0%, ${brandColors.dark} 100%);
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 
        0 0 0 1px rgba(255,255,255,0.05),
        0 20px 40px -20px rgba(0, 0, 0, 0.5),
        0 40px 80px -40px rgba(0, 212, 255, 0.15);
    }
    
    .header {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      padding: 28px 32px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%);
      animation: pulse 4s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: white;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      position: relative;
      z-index: 1;
      letter-spacing: -0.5px;
    }
    
    .logo-icon {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(8px);
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255,255,255,0.3);
    }
    
    .content {
      padding: 40px 32px;
    }
    
    .hero-icon {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      margin: 0 auto 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .hero-icon::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      padding: 4px;
      background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
    }
    
    .hero-icon-success {
      background: linear-gradient(135deg, ${brandColors.accent} 0%, #059669 100%);
      box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
    }
    
    .hero-icon-warning {
      background: linear-gradient(135deg, ${brandColors.gold} 0%, #D97706 100%);
      box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4);
    }
    
    .hero-icon-danger {
      background: linear-gradient(135deg, ${brandColors.danger} 0%, #DC2626 100%);
      box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4);
    }
    
    .hero-icon-info {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      box-shadow: 0 8px 32px rgba(0, 212, 255, 0.4);
    }
    
    .hero-icon-neutral {
      background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
      box-shadow: 0 8px 32px rgba(107, 114, 128, 0.4);
    }
    
    .title {
      font-size: 26px;
      font-weight: 800;
      color: ${brandColors.light};
      margin: 0 0 12px 0;
      text-align: center;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    
    .subtitle {
      font-size: 15px;
      color: ${brandColors.muted};
      margin: 0 0 28px 0;
      text-align: center;
      line-height: 1.7;
    }
    
    .card-section {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .card-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    
    .card-section-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: ${brandColors.muted};
      margin: 0;
      font-weight: 600;
    }
    
    .otp-box {
      background: linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(124,58,237,0.08) 100%);
      border: 2px solid rgba(0,212,255,0.25);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin: 28px 0;
      position: relative;
      overflow: hidden;
    }
    
    .otp-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent);
    }
    
    .otp-label {
      font-size: 12px;
      color: ${brandColors.muted};
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 600;
    }
    
    .otp-code {
      font-size: 44px;
      font-weight: 800;
      letter-spacing: 14px;
      color: ${brandColors.primary};
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
    }
    
    .otp-expires {
      font-size: 13px;
      color: ${brandColors.muted};
      margin-top: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      text-align: center;
      box-shadow: 
        0 4px 20px rgba(0, 212, 255, 0.4),
        inset 0 1px 0 rgba(255,255,255,0.2);
      transition: all 0.3s ease;
      letter-spacing: 0.3px;
    }
    
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 212, 255, 0.5);
    }
    
    .button-secondary {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: none;
    }
    
    .button-danger {
      background: linear-gradient(135deg, ${brandColors.danger} 0%, #DC2626 100%);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
    }
    
    .feature-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      margin-bottom: 12px;
    }
    
    .feature-icon-box {
      width: 44px;
      height: 44px;
      min-width: 44px;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
    }
    
    .feature-text {
      flex: 1;
    }
    
    .feature-title {
      font-size: 15px;
      font-weight: 600;
      color: ${brandColors.light};
      margin: 0 0 4px 0;
    }
    
    .feature-desc {
      font-size: 13px;
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
      padding: 14px 0;
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
      gap: 8px;
    }
    
    .info-value {
      color: ${brandColors.light};
      font-weight: 600;
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
      padding: 10px 28px;
      border-radius: 25px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
    }
    
    .highlight-box {
      background: linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%);
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 14px;
      padding: 20px 24px;
      margin: 24px 0;
    }
    
    .highlight-box-warning {
      background: linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%);
      border-color: rgba(245,158,11,0.25);
    }
    
    .highlight-box-danger {
      background: linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%);
      border-color: rgba(239,68,68,0.25);
    }
    
    .highlight-box-info {
      background: linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,212,255,0.04) 100%);
      border-color: rgba(0,212,255,0.25);
    }
    
    .highlight-title {
      font-size: 15px;
      font-weight: 700;
      color: ${brandColors.accent};
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
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
      line-height: 1.6;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      margin: 32px 0;
    }
    
    .security-notice {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 24px 0;
      text-align: center;
    }
    
    .security-notice p {
      font-size: 13px;
      color: ${brandColors.danger};
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .footer {
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(0,0,0,0.2);
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 20px;
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
      font-size: 13px;
      color: ${brandColors.muted};
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    
    .footer-text a {
      color: ${brandColors.primary};
      text-decoration: none;
      font-weight: 500;
    }
    
    .social-links {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .social-link {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.muted};
      text-decoration: none;
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.2s;
    }
    
    .social-link:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,255,255,0.15);
    }
    
    .copyright {
      font-size: 12px;
      color: rgba(148,163,184,0.5);
      margin: 0;
      line-height: 1.6;
    }
    
    .list-styled {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    
    .list-styled li {
      font-size: 14px;
      color: ${brandColors.muted};
      line-height: 1.8;
      padding-left: 28px;
      position: relative;
      margin-bottom: 8px;
    }
    
    .list-styled li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 16px;
      height: 16px;
      background: linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary});
      border-radius: 50%;
      opacity: 0.6;
    }
    
    .comparison-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin: 28px 0;
    }
    
    .comparison-item {
      flex: 1;
      text-align: center;
      padding: 16px;
      border-radius: 12px;
    }
    
    .comparison-old {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
    }
    
    .comparison-new {
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
    }
    
    .comparison-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 8px 0;
    }
    
    .comparison-label-old {
      color: ${brandColors.danger};
    }
    
    .comparison-label-new {
      color: ${brandColors.accent};
    }
    
    .comparison-value {
      font-size: 14px;
      margin: 0;
    }
    
    .comparison-value-old {
      color: ${brandColors.muted};
      text-decoration: line-through;
    }
    
    .comparison-value-new {
      color: ${brandColors.light};
      font-weight: 600;
    }
    
    .comparison-arrow {
      font-size: 24px;
      color: ${brandColors.muted};
    }
    
    @media only screen and (max-width: 560px) {
      .wrapper {
        padding: 16px 12px;
      }
      
      .container {
        border-radius: 16px;
      }
      
      .header {
        padding: 24px 20px;
      }
      
      .logo {
        font-size: 22px;
      }
      
      .content {
        padding: 28px 20px;
      }
      
      .title {
        font-size: 22px;
      }
      
      .subtitle {
        font-size: 14px;
      }
      
      .otp-code {
        font-size: 32px;
        letter-spacing: 10px;
      }
      
      .otp-box {
        padding: 24px 16px;
      }
      
      .button {
        display: block;
        width: 100%;
        padding: 16px 24px;
      }
      
      .footer {
        padding: 24px 20px;
      }
      
      .comparison-box {
        flex-direction: column;
        gap: 12px;
      }
      
      .comparison-arrow {
        transform: rotate(90deg);
      }
      
      .card-section {
        padding: 20px 16px;
      }
      
      .feature-row {
        padding: 14px;
      }
      
      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .info-value {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#0F172A;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <div class="wrapper">
    ${content}
  </div>
</body>
</html>
`;
}

// Helper function to create hero icon
function createHeroIcon(emoji: string, type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'success'): string {
  return `
    <div class="hero-icon hero-icon-${type}">
      <span style="font-size: 44px; line-height: 1;">${emoji}</span>
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
          ${createHeroIcon('🔐', 'info')}
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
          ${createHeroIcon('🎉', 'success')}
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
          ${createHeroIcon('✅', 'success')}
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
          ${createHeroIcon('⏰', 'warning')}
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
          ${createHeroIcon('🚫', 'danger')}
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
          ${createHeroIcon('✅', 'success')}
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
          ${createHeroIcon('📅', 'warning')}
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
          ${createHeroIcon('📝', 'info')}
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
          ${createHeroIcon('⏰', 'warning')}
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
          ${createHeroIcon('🎁', 'success')}
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
          ${createHeroIcon('🔐', 'warning')}
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
          ${createHeroIcon(emoji, iconType)}
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
          ${createHeroIcon('👋', 'neutral')}
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
          ${createHeroIcon('🔔', 'info')}
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
          ${createHeroIcon('🔄', 'success')}
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
          ${createHeroIcon(newType === 'both' ? '🚀' : (newType === 'online' ? '📱' : '🏪'), 'info')}
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
