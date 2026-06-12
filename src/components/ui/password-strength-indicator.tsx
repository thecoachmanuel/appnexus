"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const getPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  let strength: "weak" | "fair" | "good" | "strong" = "weak";
  if (passedChecks >= 5) strength = "strong";
  else if (passedChecks >= 4) strength = "good";
  else if (passedChecks >= 3) strength = "fair";

  return { checks, passedChecks, strength };
};

const strengthConfig = {
  weak: { color: "bg-destructive", textColor: "text-destructive", label: "Weak" },
  fair: { color: "bg-yellow-500", textColor: "text-yellow-500", label: "Fair" },
  good: { color: "bg-blue-500", textColor: "text-blue-500", label: "Good" },
  strong: { color: "bg-green-500", textColor: "text-green-500", label: "Strong" },
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { checks, passedChecks, strength } = useMemo(() => getPasswordStrength(password), [password]);
  const config = strengthConfig[strength];

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                passedChecks >= level + 1 ? config.color : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className={`text-xs font-medium ${config.textColor}`}>
          {config.label} password
        </p>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1.5">
        <RequirementItem met={checks.length} label="8+ characters" />
        <RequirementItem met={checks.lowercase} label="Lowercase" />
        <RequirementItem met={checks.uppercase} label="Uppercase" />
        <RequirementItem met={checks.number} label="Number" />
        <RequirementItem met={checks.special} label="Special char" />
      </div>
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? "text-green-500" : "text-muted-foreground"}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );
}
