/**
 * User Registration API
 * 
 * Handles user account creation with comprehensive validation and security.
 * 
 * Features:
 * - Email uniqueness validation
 * - Strong password requirements (8+ chars, entropy check, blacklist)
 * - Rate limiting (3 requests per minute per IP)
 * - Zod schema validation for input
 * - bcryptjs password hashing with salt rounds 12
 * - Password strength evaluation with zxcvbn
 * - Audit logging of registration events
 * 
 * Authentication: Not required (public endpoint)
 * Method: POST
 * 
 * Request body:
 * {
 *   name: string (2-100 chars),
 *   email: string (valid email format),
 *   password: string (8-128 chars, strength score >= 2)
 * }
 * 
 * Password requirements:
 * - Minimum 8 characters, maximum 128
 * - Not in common password blacklist
 * - Entropy score >= 2 (using zxcvbn)
 * - Should contain mix of upper, lower, numbers, special chars
 * 
 * Response:
 * Success (201): { message: string, userId: string }
 * Error: { error: string, code?: string, retryAfter?: number }
 * 
 * Error codes:
 * - RATE_LIMITED (429): Too many registration attempts from this IP
 * - WEAK_PASSWORD (400): Password doesn't meet strength requirements
 * - Validation error (400): Input validation failed
 * - 500: Server error during registration
 * 
 * @see zxcvbn for password strength algorithm details
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import zxcvbn from 'zxcvbn';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logError, logWarn, logInfo } from '@/lib/logger';
import { registerSchema } from '@/lib/validations/auth';
import { z } from 'zod';

/**
 * Common weak passwords to blacklist
 * Checked case-insensitively during validation
 */
const WEAK_PASSWORD_PATTERNS = [
    'password', 'password123', 'admin', 'admin123', '123456', '12345678',
    'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon',
    '111111', '1234567', '12345', '123123', '1234567890', 'email@email.com'
];

/**
 * Validate password strength using zxcvbn and common pattern blacklist
 * Requirements: At least 8 characters, score >= 2 (fair), and not in blacklist
 * 
 * Strength scores (zxcvbn):
 * - 0: Too weak
 * - 1: Weak
 * - 2: Fair (minimum acceptable)
 * - 3: Good
 * - 4: Strong
 * 
 * @param password - Password to validate
 * @returns {object} { valid: boolean, error?: string }
 */
function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }

    if (password.length > 128) {
        return { valid: false, error: 'Password must not exceed 128 characters' };
    }

    // Check against common weak passwords (case-insensitive)
    const lowerPassword = password.toLowerCase();
    if (WEAK_PASSWORD_PATTERNS.some(pattern => lowerPassword === pattern)) {
        return { valid: false, error: 'This password is too common. Please choose a stronger password' };
    }

    // Use zxcvbn for entropy-based strength checking
    const result = zxcvbn(password);
    
    // Require at least "fair" strength (score 2+)
    if (result.score < 2) {
        return { 
            valid: false, 
            error: 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and special characters' 
        };
    }

    return { valid: true };
}

export async function POST(request: NextRequest) {
    try {
        // Apply rate limiting: 3 requests per minute per IP (stricter than signin)
        const clientIp = getClientIp(request);
        const rateLimit = checkRateLimit(clientIp, 3, 60000);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { 
                    error: 'Too many registration attempts. Please try again later.',
                    code: 'RATE_LIMITED',
                    retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
                    }
                }
            );
        }

        const body = await request.json();

        // Validate request body with Zod
        let validatedData;
        try {
            validatedData = registerSchema.parse(body);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues[0]?.message || 'Invalid input';
                logWarn('Registration validation failed', { issues: error.issues }, 'REGISTER');
                return NextResponse.json(
                    { error: errorMessage },
                    { status: 400 }
                );
            }
            throw error;
        }

        const { name, email, password } = validatedData;

        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { 
                    error: passwordValidation.error,
                    code: 'WEAK_PASSWORD'
                },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logWarn('Registration attempt with existing email', { email: email.substring(0, 50) }, 'REGISTER');
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        logInfo(`New user registered: ${user.email}`, 'REGISTER');

        return NextResponse.json(
            { message: 'User created successfully', userId: user._id },
            { status: 201 }
        );
    } catch (error) {
        logError('Registration error', error, 'REGISTER');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
