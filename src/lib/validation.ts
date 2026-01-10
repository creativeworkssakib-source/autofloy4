// Allowed email domains (strict allowlist)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
];

export const isAllowedEmailDomain = (email: string): boolean => {
  const domain = email.toLowerCase().split('@')[1];
  if (!domain) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
};

export const getEmailDomainError = (email: string): string | undefined => {
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  if (!isAllowedEmailDomain(email)) {
    return 'Only Gmail, Outlook, Yahoo, or iCloud email addresses are allowed.';
  }
  return undefined;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Country codes with phone validation rules
export interface CountryCode {
  code: string;
  country: string;
  flag: string;
  minLength: number;
  maxLength: number;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', minLength: 10, maxLength: 10 },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸', minLength: 10, maxLength: 10 },
  { code: '+44', country: 'UK', flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { code: '+91', country: 'India', flag: '🇮🇳', minLength: 10, maxLength: 10 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', minLength: 9, maxLength: 9 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', minLength: 10, maxLength: 11 },
  { code: '+33', country: 'France', flag: '🇫🇷', minLength: 9, maxLength: 9 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', minLength: 10, maxLength: 10 },
  { code: '+86', country: 'China', flag: '🇨🇳', minLength: 11, maxLength: 11 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', minLength: 9, maxLength: 9 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', minLength: 9, maxLength: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', minLength: 8, maxLength: 8 },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', minLength: 9, maxLength: 10 },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', minLength: 10, maxLength: 10 },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', minLength: 10, maxLength: 12 },
  { code: '+55', country: 'Brazil', flag: '🇧🇷', minLength: 10, maxLength: 11 },
  { code: '+52', country: 'Mexico', flag: '🇲🇽', minLength: 10, maxLength: 10 },
  { code: '+7', country: 'Russia', flag: '🇷🇺', minLength: 10, maxLength: 10 },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', minLength: 9, maxLength: 10 },
  { code: '+39', country: 'Italy', flag: '🇮🇹', minLength: 9, maxLength: 10 },
];

export const validatePhoneNumber = (phone: string, countryCode: CountryCode): { valid: boolean; error?: string } => {
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Check if only numeric
  if (!/^\d+$/.test(cleanPhone)) {
    return { valid: false, error: 'Phone number must contain only digits' };
  }
  
  if (cleanPhone.length < countryCode.minLength) {
    return { valid: false, error: `Phone number must be at least ${countryCode.minLength} digits for ${countryCode.country}` };
  }
  
  if (cleanPhone.length > countryCode.maxLength) {
    return { valid: false, error: `Phone number must be at most ${countryCode.maxLength} digits for ${countryCode.country}` };
  }
  
  // Check for obvious fake patterns
  const allSame = /^(\d)\1+$/.test(cleanPhone);
  const sequential = ['0123456789', '9876543210', '1234567890'].some(seq => cleanPhone.includes(seq.slice(0, countryCode.minLength)));
  
  if (allSame || sequential) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }
  
  return { valid: true };
};

// Password strength checker
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Medium' | 'Strong';
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  
  let label: PasswordStrength['label'];
  let color: string;
  
  if (score <= 2) {
    label = 'Weak';
    color = 'hsl(var(--destructive))';
  } else if (score === 3) {
    label = 'Fair';
    color = 'hsl(var(--warning, 38 92% 50%))';
  } else if (score === 4) {
    label = 'Medium';
    color = 'hsl(var(--warning, 38 92% 50%))';
  } else {
    label = 'Strong';
    color = 'hsl(var(--success, 142 76% 36%))';
  }
  
  return { score, label, color, requirements };
};

export const isPasswordStrong = (password: string): boolean => {
  const strength = checkPasswordStrength(password);
  return strength.score >= 4; // At least 4 requirements met
};
