/**
 * Password Validation and Security Utilities
 * Comprehensive password policy enforcement and strength calculation
 */

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-10 strength score
  errors: string[];
  warnings: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notCommonPassword: boolean;
    notUserInfo: boolean;
  };
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
  commonPasswords: string[];
}

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: [
    'password', 'contraseña', '123456', 'qwerty', 'admin', 'user',
    'made', 'event', 'manager', 'sistema'
  ],
  commonPasswords: [
    'password123', 'admin123', 'user123', 'contraseña123',
    '12345678', 'qwerty123', 'password1', 'admin1234'
  ]
};

/**
 * Validate password against security policy
 */
export function validatePassword(
  password: string,
  userEmail?: string,
  username?: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Check requirements
  const requirements = {
    minLength: password.length >= policy.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommonPassword: !policy.commonPasswords.includes(password.toLowerCase()),
    notUserInfo: true
  };

  // Length validation
  if (!requirements.minLength) {
    errors.push(`La contraseña debe tener al menos ${policy.minLength} caracteres`);
  } else {
    score += 2;
  }

  if (password.length > policy.maxLength) {
    errors.push(`La contraseña no puede exceder ${policy.maxLength} caracteres`);
  }

  // Character type requirements
  if (policy.requireUppercase && !requirements.hasUppercase) {
    errors.push('Debe incluir al menos una letra mayúscula');
  } else if (requirements.hasUppercase) {
    score += 1;
  }

  if (policy.requireLowercase && !requirements.hasLowercase) {
    errors.push('Debe incluir al menos una letra minúscula');
  } else if (requirements.hasLowercase) {
    score += 1;
  }

  if (policy.requireNumbers && !requirements.hasNumbers) {
    errors.push('Debe incluir al menos un número');
  } else if (requirements.hasNumbers) {
    score += 1;
  }

  if (policy.requireSpecialChars && !requirements.hasSpecialChars) {
    errors.push('Debe incluir al menos un símbolo especial (!@#$%^&*(),.?":{}|<>)');
  } else if (requirements.hasSpecialChars) {
    score += 2;
  }

  // Check against common passwords
  if (!requirements.notCommonPassword) {
    errors.push('Esta contraseña es muy común y no es segura');
  } else {
    score += 1;
  }

  // Check against user information
  if (userEmail || username) {
    const userInfo = [
      userEmail?.split('@')[0].toLowerCase(),
      username?.toLowerCase(),
      userEmail?.toLowerCase()
    ].filter(Boolean);

    const containsUserInfo = userInfo.some(info => 
      info && password.toLowerCase().includes(info)
    );

    if (containsUserInfo) {
      errors.push('La contraseña no debe contener información del usuario');
      requirements.notUserInfo = false;
    } else {
      score += 1;
    }
  }

  // Check forbidden patterns
  const containsForbiddenPattern = policy.forbiddenPatterns.some(pattern =>
    password.toLowerCase().includes(pattern.toLowerCase())
  );

  if (containsForbiddenPattern) {
    errors.push('La contraseña contiene patrones no permitidos');
    score = Math.max(0, score - 2);
  }

  // Additional scoring for complexity
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // Multiple special chars

  // Cap score at 10
  score = Math.min(10, score);

  // Generate warnings
  if (score < 6) {
    warnings.push('Contraseña débil - considere usar más caracteres y símbolos');
  }

  if (password.length < 12) {
    warnings.push('Para mayor seguridad, use al menos 12 caracteres');
  }

  return {
    isValid: errors.length === 0,
    score,
    errors,
    warnings,
    requirements
  };
}

/**
 * Generate secure password
 */
export function generateSecurePassword(
  length: number = 12,
  includeSymbols: boolean = true
): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*(),.?":{}|<>';

  let charset = lowercase + uppercase + numbers;
  if (includeSymbols) {
    charset += symbols;
  }

  // Ensure at least one character from each required set
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password meets minimum requirements for quick validation
 */
export function meetsMinimumRequirements(password: string): boolean {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /\d/.test(password) &&
         /[!@#$%^&*(),.?":{}|<>]/.test(password);
}

/**
 * Get password strength description
 */
export function getPasswordStrengthDescription(score: number): {
  text: string;
  color: string;
  bgColor: string;
} {
  if (score <= 3) {
    return {
      text: 'Muy débil',
      color: 'text-red-700',
      bgColor: 'bg-red-500'
    };
  } else if (score <= 5) {
    return {
      text: 'Débil',
      color: 'text-orange-700',
      bgColor: 'bg-orange-500'
    };
  } else if (score <= 7) {
    return {
      text: 'Regular',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-500'
    };
  } else if (score <= 8) {
    return {
      text: 'Buena',
      color: 'text-blue-700',
      bgColor: 'bg-blue-500'
    };
  } else {
    return {
      text: 'Excelente',
      color: 'text-green-700',
      bgColor: 'bg-green-500'
    };
  }
}