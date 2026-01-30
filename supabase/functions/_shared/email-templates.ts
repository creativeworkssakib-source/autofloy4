// Premium Email Templates for AutoFloy

const brandColors = {
  primary: "#00D4FF",
  secondary: "#7C3AED",
  accent: "#10B981",
  dark: "#0F172A",
  light: "#F8FAFC",
  muted: "#94A3B8",
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${brandColors.dark};
      color: ${brandColors.light};
    }
    
    .wrapper {
      width: 100%;
      background: linear-gradient(135deg, ${brandColors.dark} 0%, #1E293B 100%);
      padding: 40px 0;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(180deg, #1E293B 0%, ${brandColors.dark} 100%);
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      padding: 40px 40px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: white;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    
    .logo-icon {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .content {
      padding: 50px 40px;
    }
    
    .title {
      font-size: 28px;
      font-weight: 700;
      color: ${brandColors.light};
      margin: 0 0 16px 0;
      text-align: center;
    }
    
    .subtitle {
      font-size: 16px;
      color: ${brandColors.muted};
      margin: 0 0 32px 0;
      text-align: center;
      line-height: 1.6;
    }
    
    .otp-box {
      background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(124,58,237,0.1) 100%);
      border: 2px solid rgba(0,212,255,0.3);
      border-radius: 16px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    
    .otp-label {
      font-size: 14px;
      color: ${brandColors.muted};
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .otp-code {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 12px;
      color: ${brandColors.primary};
      font-family: 'Monaco', 'Consolas', monospace;
    }
    
    .otp-expires {
      font-size: 13px;
      color: ${brandColors.muted};
      margin-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: transform 0.2s;
    }
    
    .button:hover {
      transform: translateY(-2px);
    }
    
    .features-grid {
      display: flex;
      gap: 16px;
      margin: 30px 0;
    }
    
    .feature-card {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .feature-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      border-radius: 12px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .feature-title {
      font-size: 14px;
      font-weight: 600;
      color: ${brandColors.light};
      margin: 0;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      margin: 32px 0;
    }
    
    .footer {
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .footer-text {
      font-size: 13px;
      color: ${brandColors.muted};
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    
    .social-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .social-link {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${brandColors.muted};
      text-decoration: none;
    }
    
    .copyright {
      font-size: 12px;
      color: rgba(148,163,184,0.6);
      margin: 0;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .highlight-title {
      font-size: 16px;
      font-weight: 600;
      color: ${brandColors.accent};
      margin: 0 0 8px 0;
    }
    
    .plan-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, ${brandColors.accent} 0%, #059669 100%);
      border-radius: 50%;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .info-label {
      color: ${brandColors.muted};
      font-size: 14px;
    }
    
    .info-value {
      color: ${brandColors.light};
      font-weight: 600;
      font-size: 14px;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0 16px;
        border-radius: 16px;
      }
      
      .header, .content, .footer {
        padding-left: 24px;
        padding-right: 24px;
      }
      
      .title {
        font-size: 24px;
      }
      
      .otp-code {
        font-size: 32px;
        letter-spacing: 8px;
      }
      
      .features-grid {
        flex-direction: column;
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

export function getOTPEmailTemplate(otp: number, userName?: string): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <h1 class="title">Verify Your Email Address</h1>
        <p class="subtitle">
          ${userName ? `Hi ${userName}, ` : ""}Enter the verification code below to confirm your email address and secure your account.
        </p>
        
        <div class="otp-box">
          <div class="otp-label">Your Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expires">
            ⏱️ This code expires in 10 minutes
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div style="text-align: center;">
          <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0 0 8px 0;">
            🔒 Security Tip
          </p>
          <p style="font-size: 13px; color: rgba(148,163,184,0.8); margin: 0;">
            Never share this code with anyone. AutoFloy will never ask for your verification code.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          If you didn't request this code, you can safely ignore this email.<br>
          Someone might have entered your email by mistake.
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
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div class="success-icon">
          <span style="font-size: 40px;">🎉</span>
        </div>
        
        <h1 class="title">Welcome to AutoFloy!</h1>
        <p class="subtitle">
          Congratulations ${userName}! Your email has been verified and your account is now fully activated.
        </p>
        
        <div class="highlight-box">
          <p class="highlight-title">🚀 Your 24-Hour Free Trial Has Started!</p>
          <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0;">
            Explore all premium features with full access. No credit card required.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Go to Dashboard →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <h2 style="font-size: 18px; color: ${brandColors.light}; margin: 0 0 20px 0; text-align: center;">
          What You Can Do Now
        </h2>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
          <tr>
            <td style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">📱</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <p style="font-size: 15px; font-weight: 600; color: ${brandColors.light}; margin: 0 0 4px 0;">Connect Facebook & WhatsApp</p>
                    <p style="font-size: 13px; color: ${brandColors.muted}; margin: 0;">Link your business accounts to start automating</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🤖</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <p style="font-size: 15px; font-weight: 600; color: ${brandColors.light}; margin: 0 0 4px 0;">Create AI Automations</p>
                    <p style="font-size: 13px; color: ${brandColors.muted}; margin: 0;">Set up smart auto-replies for messages & comments</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height: 12px;"></td></tr>
          <tr>
            <td style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">📦</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <p style="font-size: 15px; font-weight: 600; color: ${brandColors.light}; margin: 0 0 4px 0;">Add Your Products</p>
                    <p style="font-size: 13px; color: ${brandColors.muted}; margin: 0;">Import or create your product catalog</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help getting started? Check out our <a href="https://autofloy.online/documentation" style="color: ${brandColors.primary}; text-decoration: none;">documentation</a> or <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">contact support</a>.
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
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div class="success-icon">
          <span style="font-size: 40px;">✅</span>
        </div>
        
        <h1 class="title">Payment Successful!</h1>
        <p class="subtitle">
          Thank you ${userName}! Your subscription has been activated successfully.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="plan-badge">${planName} Plan</span>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${brandColors.muted}; margin: 0 0 20px 0;">Payment Details</h3>
          
          <div class="info-row">
            <span class="info-label">Plan</span>
            <span class="info-value">${planName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Amount Paid</span>
            <span class="info-value" style="color: ${brandColors.accent};">${currency} ${amount}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Start Date</span>
            <span class="info-value">${startDate}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Valid Until</span>
            <span class="info-value">${endDate}</span>
          </div>
          
          ${invoiceNumber ? `
          <div class="info-row" style="border-bottom: none;">
            <span class="info-label">Invoice #</span>
            <span class="info-value">${invoiceNumber}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="highlight-box">
          <p class="highlight-title">🎁 Premium Features Unlocked!</p>
          <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0;">
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
          Questions about your subscription? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact our support team</a>.
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
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 60px;">⏰</span>
        </div>
        
        <h1 class="title">Your Trial is Ending Soon!</h1>
        <p class="subtitle">
          Hi ${userName}, your free trial will expire in <strong style="color: ${brandColors.primary};">${hoursRemaining} hours</strong>. 
          Upgrade now to keep all your automations running!
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #F59E0B; margin: 0 0 8px 0; font-weight: 600;">
            ⚠️ Don't Lose Your Progress!
          </p>
          <p style="font-size: 13px; color: ${brandColors.muted}; margin: 0;">
            Your automations and settings will be saved, but features will be limited after trial ends.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/pricing" class="button">
            View Plans & Upgrade →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <p style="font-size: 14px; color: ${brandColors.muted}; text-align: center; margin: 0;">
          Need more time? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact us</a> for a trial extension.
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
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🚫</span>
          </div>
        </div>
        
        <h1 class="title" style="color: #EF4444;">Account Suspended</h1>
        <p class="subtitle">
          Hello ${userName}, your ${companyName} account has been suspended. During this suspension, you will not be able to access your account or use any services.
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 14px; color: #EF4444; margin: 0 0 8px 0; font-weight: 600;">
            ⚠️ What This Means
          </p>
          <ul style="font-size: 13px; color: ${brandColors.muted}; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">You cannot log in to your account</li>
            <li style="margin-bottom: 8px;">All automations have been paused</li>
            <li>Connected accounts are temporarily disabled</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: ${brandColors.muted}; text-align: center; margin: 24px 0;">
          If you believe this was done in error, please contact our support team immediately.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/contact" class="button" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
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
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div class="success-icon">
          <span style="font-size: 40px;">✅</span>
        </div>
        
        <h1 class="title" style="color: ${brandColors.accent};">Account Reactivated!</h1>
        <p class="subtitle">
          Great news ${userName}! Your ${companyName} account has been reactivated. You can now log in and continue using all services.
        </p>
        
        <div class="highlight-box">
          <p class="highlight-title">🎉 Welcome Back!</p>
          <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0;">
            All your automations, products, and settings have been restored. You can pick up right where you left off.
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
          Questions? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact our support team</a>.
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
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 60px;">📅</span>
        </div>
        
        <h1 class="title">Your Subscription Has Expired</h1>
        <p class="subtitle">
          Hi ${userName}, your subscription plan has ended. Renew now to continue enjoying all premium features!
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 14px; color: #F59E0B; margin: 0 0 8px 0; font-weight: 600;">
            ⚠️ Your Features Are Limited
          </p>
          <ul style="font-size: 13px; color: ${brandColors.muted}; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Automations have been paused</li>
            <li style="margin-bottom: 8px;">AI responses are disabled</li>
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
    <tr>
      <td style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top;">
              <p style="font-size: 14px; font-weight: 600; color: ${brandColors.primary}; margin: 0 0 4px 0;">${change.field}</p>
              ${change.oldValue ? `<p style="font-size: 12px; color: ${brandColors.muted}; margin: 0; text-decoration: line-through;">Previous: ${change.oldValue}</p>` : ''}
              <p style="font-size: 13px; color: ${brandColors.light}; margin: 4px 0 0 0;">New: ${change.newValue}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height: 8px;"></td></tr>
  `).join('');

  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          AutoFloy
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 60px;">📝</span>
        </div>
        
        <h1 class="title">Account Information Updated</h1>
        <p class="subtitle">
          Hi ${userName}, your ${companyName} account information has been updated. Here's a summary of the changes:
        </p>
        
        <div style="background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.2); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <p style="font-size: 14px; color: ${brandColors.primary}; margin: 0 0 16px 0; font-weight: 600;">
            📋 Changes Made
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${changesHtml}
          </table>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/settings" class="button">
            View Account Settings →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 16px; margin-top: 24px;">
          <p style="font-size: 13px; color: #EF4444; margin: 0; text-align: center;">
            🔒 If you didn't request these changes, please contact our support team immediately.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact our support team</a>.
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
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 64px;">⏰</span>
        </div>
        
        <h1 class="title">Your Plan Has Expired</h1>
        <p class="subtitle">
          Hi ${userName}, your ${previousPlan} plan has ended. Don't worry, your account is still active but with limited features.
        </p>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">📊</span>
            <span style="font-size: 16px; font-weight: 600; color: #F8FAFC;">What This Means</span>
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
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
        
        <div class="divider"></div>
        
        <div style="text-align: center;">
          <p style="font-size: 14px; color: #94A3B8; margin: 0;">
            Need help? <a href="https://autofloy.online/contact" style="color: #00D4FF; text-decoration: none;">Contact our support team</a>
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          We'd love to have you back! Check out our latest features and special offers.
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
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 64px;">🎁</span>
        </div>
        
        <h1 class="title">Free Trial Activated!</h1>
        <p class="subtitle">
          Great news ${userName}! Your free trial has been activated. Enjoy full access to all features.
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #94A3B8; margin: 0 0 8px 0;">Trial Period</p>
          <p style="font-size: 24px; font-weight: 700; color: #10B981; margin: 0;">${trialDays} Days Free</p>
          <p style="font-size: 13px; color: #94A3B8; margin-top: 8px;">Ends: ${endDate}</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">✨</span>
            <span style="font-size: 16px; font-weight: 600; color: #F8FAFC;">What's Included</span>
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>Full access to all automation features</li>
            <li>Unlimited Facebook & WhatsApp connections</li>
            <li>AI-powered auto-replies</li>
            <li>Complete product management</li>
            <li>Analytics & reporting</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/dashboard" class="button">
            Start Exploring →
          </a>
        </div>
        
        <div class="divider"></div>
        
        <div style="text-align: center;">
          <p style="font-size: 14px; color: #94A3B8; margin: 0;">
            No credit card required. No commitment.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions? <a href="https://autofloy.online/contact" style="color: #00D4FF; text-decoration: none;">Contact our support team</a>
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
// NEW PROFESSIONAL EMAIL TEMPLATES
// =============================================

export function getPasswordResetEmailTemplate(
  userName: string,
  companyName: string = "AutoFloy"
): string {
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🔐</span>
          </div>
        </div>
        
        <h1 class="title">Password Has Been Reset</h1>
        <p class="subtitle">
          Hi ${userName}, your account password has been reset by an administrator.
        </p>
        
        <div style="background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%); border: 1px solid rgba(245,158,11,0.3); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">⚠️</span>
            <span style="font-size: 16px; font-weight: 600; color: #F59E0B;">Security Notice</span>
          </div>
          <p style="font-size: 14px; color: #94A3B8; margin: 0;">
            Your password has been changed. If you did not request this change, please contact our support team immediately.
          </p>
        </div>
        
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td style="padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50" style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🔒</div>
                  </td>
                  <td style="vertical-align: top; padding-left: 12px;">
                    <p style="font-size: 14px; font-weight: 600; color: ${brandColors.light}; margin: 0 0 4px 0;">What to do next</p>
                    <p style="font-size: 13px; color: ${brandColors.muted}; margin: 0;">Log in with your new password and consider enabling two-factor authentication for extra security.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/login" class="button">
            Log In Now →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact our support team</a>
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
  const roleEmoji = isAdmin ? "👑" : "👤";
  const roleColor = isAdmin ? "#7C3AED" : "#00D4FF";
  
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${roleColor} 0%, ${isAdmin ? '#5B21B6' : '#0284C7'} 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">${roleEmoji}</span>
          </div>
        </div>
        
        <h1 class="title">Account Role Updated</h1>
        <p class="subtitle">
          Hi ${userName}, your account role has been updated.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: linear-gradient(135deg, ${roleColor} 0%, ${isAdmin ? '#5B21B6' : '#0284C7'} 100%); color: white; padding: 12px 32px; border-radius: 25px; font-weight: 600; font-size: 18px; text-transform: uppercase; letter-spacing: 2px;">
            ${newRole}
          </span>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">✨</span>
            <span style="font-size: 16px; font-weight: 600; color: #F8FAFC;">Your Permissions</span>
          </div>
          ${isAdmin ? `
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>Full access to admin dashboard</li>
            <li>Manage all users and accounts</li>
            <li>Configure site settings</li>
            <li>View analytics and reports</li>
            <li>Manage subscriptions and plans</li>
          </ul>
          ` : `
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>Access to your dashboard</li>
            <li>Manage your automations</li>
            <li>Connect social accounts</li>
            <li>View your analytics</li>
          </ul>
          `}
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${isAdmin ? 'https://autofloy.online/admin' : 'https://autofloy.online/dashboard'}" class="button">
            ${isAdmin ? 'Go to Admin Panel →' : 'Go to Dashboard →'}
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Questions about your new role? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact support</a>
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
      <div class="header" style="background: linear-gradient(135deg, #4B5563 0%, #374151 100%);">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">👋</span>
          </div>
        </div>
        
        <h1 class="title">Account Deleted</h1>
        <p class="subtitle">
          Hi ${userName}, your ${companyName} account has been permanently deleted as requested.
        </p>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">📋</span>
            <span style="font-size: 16px; font-weight: 600; color: #F8FAFC;">What's Been Deleted</span>
          </div>
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>Your account profile and settings</li>
            <li>All connected social accounts</li>
            <li>Automation configurations</li>
            <li>Product catalogs and orders</li>
            <li>Analytics and execution logs</li>
          </ul>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(124,58,237,0.1) 100%); border: 1px solid rgba(0,212,255,0.2); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
          <p style="font-size: 16px; color: ${brandColors.primary}; margin: 0 0 8px 0; font-weight: 600;">
            We're sad to see you go! 💙
          </p>
          <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0;">
            If you ever want to come back, you're always welcome. Create a new account anytime at autofloy.online
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online" class="button" style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);">
            Visit AutoFloy
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          This email was sent to ${email}. This is a confirmation that your account deletion was successful.
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
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${brandColors.accent} 0%, #059669 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🔔</span>
          </div>
        </div>
        
        <h1 class="title">New Login Detected</h1>
        <p class="subtitle">
          Hi ${userName}, we noticed a new login to your ${companyName} account.
        </p>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${brandColors.muted}; margin: 0 0 16px 0;">Login Details</p>
          
          <div class="info-row">
            <span class="info-label">📅 Time</span>
            <span class="info-value">${loginDetails.time}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">💻 Device</span>
            <span class="info-value">${loginDetails.device}</span>
          </div>
          
          ${loginDetails.location ? `
          <div class="info-row">
            <span class="info-label">📍 Location</span>
            <span class="info-value">${loginDetails.location}</span>
          </div>
          ` : ''}
          
          ${loginDetails.ip ? `
          <div class="info-row" style="border-bottom: none;">
            <span class="info-label">🌐 IP Address</span>
            <span class="info-value">${loginDetails.ip}</span>
          </div>
          ` : ''}
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: ${brandColors.accent}; margin: 0; font-weight: 600;">
            ✅ If this was you, no action is needed.
          </p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 16px; margin: 24px 0;">
          <p style="font-size: 13px; color: #EF4444; margin: 0; text-align: center;">
            🚨 If this wasn't you, please secure your account immediately by changing your password.
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
          This is an automated security notification. No reply needed.
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
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div class="success-icon">
          <span style="font-size: 40px;">🔄</span>
        </div>
        
        <h1 class="title">Subscription Renewed!</h1>
        <p class="subtitle">
          Thank you ${userName}! Your subscription has been successfully renewed.
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span class="plan-badge">${planName} Plan</span>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${brandColors.muted}; margin: 0 0 16px 0;">Renewal Details</p>
          
          <div class="info-row">
            <span class="info-label">Plan</span>
            <span class="info-value">${planName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Amount Charged</span>
            <span class="info-value" style="color: ${brandColors.accent};">${currency} ${amount}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Renewal Date</span>
            <span class="info-value">${renewalDate}</span>
          </div>
          
          <div class="info-row" style="border-bottom: none;">
            <span class="info-label">Next Renewal</span>
            <span class="info-value">${nextRenewalDate}</span>
          </div>
        </div>
        
        <div class="highlight-box">
          <p class="highlight-title">🎉 Thank You for Your Continued Trust!</p>
          <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0;">
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
          Questions about billing? <a href="https://autofloy.online/contact" style="color: ${brandColors.primary}; text-decoration: none;">Contact support</a>
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
    online: "Online Business (Facebook/WhatsApp Automation)",
    offline: "Offline Shop (POS System)",
    both: "Both Online + Offline (Full Access)"
  };
  
  const typeEmoji: Record<string, string> = {
    online: "📱",
    offline: "🏪",
    both: "🚀"
  };
  
  const content = `
    <div class="container">
      <div class="header">
        <a href="https://autofloy.online" class="logo">
          <span class="logo-icon">⚡</span>
          ${companyName}
        </a>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 64px;">${typeEmoji[newType] || '⚡'}</span>
        </div>
        
        <h1 class="title">Subscription Type Updated</h1>
        <p class="subtitle">
          Hi ${userName}, your subscription access type has been changed.
        </p>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin: 24px 0;">
          <div style="text-align: center; padding: 16px 24px; background: rgba(239,68,68,0.1); border-radius: 12px; flex: 1;">
            <p style="font-size: 12px; color: #EF4444; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Previous</p>
            <p style="font-size: 14px; color: ${brandColors.muted}; margin: 0; text-decoration: line-through;">${typeDisplayNames[oldType] || oldType}</p>
          </div>
          <span style="font-size: 24px;">→</span>
          <div style="text-align: center; padding: 16px 24px; background: rgba(16,185,129,0.1); border-radius: 12px; flex: 1;">
            <p style="font-size: 12px; color: ${brandColors.accent}; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">New</p>
            <p style="font-size: 14px; color: ${brandColors.light}; margin: 0; font-weight: 600;">${typeDisplayNames[newType] || newType}</p>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">✨</span>
            <span style="font-size: 16px; font-weight: 600; color: #F8FAFC;">Your New Access Includes</span>
          </div>
          ${newType === 'online' ? `
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>Facebook Page automation</li>
            <li>WhatsApp Business automation</li>
            <li>AI-powered auto-replies</li>
            <li>Comment & message management</li>
            <li>Online order tracking</li>
          </ul>
          ` : newType === 'offline' ? `
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>Point of Sale (POS) system</li>
            <li>Inventory management</li>
            <li>Customer tracking</li>
            <li>Expense & profit reports</li>
            <li>Barcode scanning</li>
          </ul>
          ` : `
          <ul style="margin: 0; padding-left: 20px; color: #94A3B8; font-size: 14px; line-height: 1.8;">
            <li>🌐 Full Online Business features</li>
            <li>🏪 Full Offline Shop features</li>
            <li>📊 Combined analytics & reports</li>
            <li>🔗 Seamless integration between both</li>
          </ul>
          `}
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://autofloy.online/business-overview" class="button">
            Explore Your Features →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p class="footer-text">
          Need help with your new features? <a href="https://autofloy.online/documentation" style="color: ${brandColors.primary}; text-decoration: none;">Check our documentation</a>
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
