import { Check, X } from 'lucide-react';
import { PasswordStrength } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
  show: boolean;
}

export const PasswordStrengthIndicator = ({ strength, show }: PasswordStrengthIndicatorProps) => {
  if (!show) return null;

  const requirements = [
    { key: 'minLength', label: 'At least 8 characters', met: strength.requirements.minLength },
    { key: 'hasUppercase', label: 'One uppercase letter', met: strength.requirements.hasUppercase },
    { key: 'hasLowercase', label: 'One lowercase letter', met: strength.requirements.hasLowercase },
    { key: 'hasNumber', label: 'One number', met: strength.requirements.hasNumber },
    { key: 'hasSpecial', label: 'One special character', met: strength.requirements.hasSpecial },
  ];

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span 
            className="text-xs font-medium"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4, 5].map((segment) => (
            <div
              key={segment}
              className="flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: segment <= strength.score ? strength.color : 'hsl(var(--muted))',
              }}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <li
            key={req.key}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
