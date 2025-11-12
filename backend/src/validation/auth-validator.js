// =========
// Email Validation
// =========

export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// =========
// Password Validation
// =========

export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }
    
    // Basic requirements: at least 8 characters, one uppercase, one lowercase, one number
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return minLength && hasUppercase && hasLowercase && hasNumber;
}

export function validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, strength: 'weak', message: 'Password is required' };
    }
    
    const length = password.length;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    let score = 0;
    let strength = 'weak';
    let message = '';
    
    // Length scoring
    if (length >= 12) score += 2;
    else if (length >= 8) score += 1;
    
    // Character type scoring
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    
    // Determine strength
    if (score >= 6) {
        strength = 'very_strong';
        message = 'Very strong password';
    } else if (score >= 5) {
        strength = 'strong';
        message = 'Strong password';
    } else if (score >= 4) {
        strength = 'good';
        message = 'Good password';
    } else if (score >= 3) {
        strength = 'fair';
        message = 'Fair password';
    } else {
        strength = 'weak';
        message = 'Weak password';
    }
    
    // Check minimum requirements
    const valid = length >= 8 && hasUppercase && hasLowercase && hasNumber;
    
    if (!valid) {
        message = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    return { valid, strength, message };
}

// =========
// Name Validation
// =========

export function validateName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }
    
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
}

export function validateFullName(firstName, lastName) {
    return validateName(firstName) && validateName(lastName);
}

// =========
// Phone Validation
// =========

export function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check if it's a valid phone number (7-15 digits)
    return digits.length >= 7 && digits.length <= 15;
}

// =========
// Country Code Validation
// =========

export function validateCountryCode(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') {
        return false;
    }
    
    // ISO 3166-1 alpha-2 country codes (2 letters)
    const countryCodeRegex = /^[A-Z]{2}$/;
    return countryCodeRegex.test(countryCode.toUpperCase());
}

// =========
// Role Key Validation
// =========

export function validateRoleKey(roleKey) {
    if (!roleKey || typeof roleKey !== 'string') {
        return false;
    }
    
    const validRoles = [
        // Platform
        'waterreportcard_super_admin',
        'liquoslabs_general_manager',
        'customer_service_manager',
        'accounting_manager',
        'channel_sales_manager',
        'it_manager',
        'tech_support',
        'accounting_staff',
        'platform_account_manager',
        'platform_field_sales',
        'platform_contractor',
        'platform_developer',
        // Customer chain (regional/general customers)
        'customer_admin',
        'customer_branch_manager',
        'customer_sales_manager',
        'customer_accounting_dept_manager',
        'customer_location_service_manager',
        'customer_location_account_manager',
        'customer_location_field_sales',
        'customer_branch_key_employee',
        'customer_field_technician',
        'customer_third_party_vendor',
        'customer_account_admin',
        // National accounts chain
        'national_account_admin',
        'national_branch_manager',
        'national_sales_manager',
        'national_accounting_dept_manager',
        'national_location_service_manager',
        'national_location_account_manager',
        'national_location_field_sales',
        'national_branch_key_employee',
        'national_field_technician',
        'national_third_party_vendor',
        'national_account_customer_admin',
        // B2C
        'wrc_user'
    ];
    
    return validRoles.includes(roleKey);
}

// =========
// Organization Type Validation
// =========

export function validateOrgType(orgType) {
    if (!orgType || typeof orgType !== 'string') {
        return false;
    }
    
    const validTypes = ['platform', 'customer', 'service_provider', 'property_manager'];
    return validTypes.includes(orgType);
}

// =========
// UUID Validation
// =========

export function validateUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// =========
// Token Validation
// =========

export function validateToken(token) {
    if (!token || typeof token !== 'string') {
        return false;
    }
    
    // Basic token validation (should be base64url encoded)
    const tokenRegex = /^[A-Za-z0-9_-]+$/;
    return token.length >= 32 && tokenRegex.test(token);
}

// =========
// Input Sanitization
// =========

export function sanitizeString(input, maxLength = 255) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    
    return input.trim().substring(0, maxLength);
}

export function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
        return '';
    }
    
    return email.trim().toLowerCase();
}

export function sanitizeName(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }
    
    // Remove extra whitespace and limit length
    return name.trim().replace(/\s+/g, ' ').substring(0, 50);
}

// =========
// Comprehensive Validation Functions
// =========

export function validateRegistrationData(data) {
    const errors = [];
    
    // Email validation
    if (!data.email) {
        errors.push('Email is required');
    } else if (!validateEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    // Name validation
    if (!data.first_name) {
        errors.push('First name is required');
    } else if (!validateName(data.first_name)) {
        errors.push('First name must be at least 2 characters long');
    }
    
    if (!data.last_name) {
        errors.push('Last name is required');
    } else if (!validateName(data.last_name)) {
        errors.push('Last name must be at least 2 characters long');
    }
    
    // Password validation
    if (!data.password) {
        errors.push('Password is required');
    } else {
        const passwordValidation = validatePasswordStrength(data.password);
        if (!passwordValidation.valid) {
            errors.push(passwordValidation.message);
        }
    }
    
    // Optional fields validation
    if (data.phone && !validatePhone(data.phone)) {
        errors.push('Invalid phone number format');
    }
    
    if (data.default_country && !validateCountryCode(data.default_country)) {
        errors.push('Invalid country code');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export function validateLoginData(data) {
    const errors = [];
    
    if (!data.email) {
        errors.push('Email is required');
    } else if (!validateEmail(data.email)) {
        errors.push('Invalid email format');
    }
    
    if (!data.password) {
        errors.push('Password is required');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export function validateInvitationData(data) {
    const errors = [];
    
    if (!data.invitee_email) {
        errors.push('Invitee email is required');
    } else if (!validateEmail(data.invitee_email)) {
        errors.push('Invalid email format');
    }
    
    if (!data.target_role_key) {
        errors.push('Target role is required');
    } else if (!validateRoleKey(data.target_role_key)) {
        errors.push('Invalid role key');
    }
    
    if (data.target_org_id && !validateUUID(data.target_org_id)) {
        errors.push('Invalid organization ID');
    }
    
    if (data.property_id && !validateUUID(data.property_id)) {
        errors.push('Invalid property ID');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export function validatePasswordResetData(data) {
    const errors = [];
    
    if (!data.token) {
        errors.push('Reset token is required');
    } else if (!validateToken(data.token)) {
        errors.push('Invalid reset token format');
    }
    
    if (!data.password) {
        errors.push('New password is required');
    } else {
        const passwordValidation = validatePasswordStrength(data.password);
        if (!passwordValidation.valid) {
            errors.push(passwordValidation.message);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export function validateProfileUpdateData(data) {
    const errors = [];
    
    if (data.first_name && !validateName(data.first_name)) {
        errors.push('First name must be at least 2 characters long');
    }
    
    if (data.last_name && !validateName(data.last_name)) {
        errors.push('Last name must be at least 2 characters long');
    }
    
    if (data.phone && !validatePhone(data.phone)) {
        errors.push('Invalid phone number format');
    }
    
    if (data.default_country && !validateCountryCode(data.default_country)) {
        errors.push('Invalid country code');
    }
    
    if (data.marketing_opt_in !== undefined && typeof data.marketing_opt_in !== 'boolean') {
        errors.push('Marketing opt-in must be a boolean value');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}