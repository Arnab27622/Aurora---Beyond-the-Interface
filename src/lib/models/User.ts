/**
 * MongoDB User Model
 * 
 * Stores user account information with support for multiple auth providers
 * 
 * Schema:
 * - name: User display name
 * - email: Unique identifier (can be linked across providers)
 * - password: Optional (only required for credentials provider)
 * - provider: 'credentials' or 'google'
 * - failedAttempts: Counter for failed login attempts (progressive lockout)
 * - lockoutUntil: Date when account will be unlocked
 * - isLocked: Current lock status
 * - refreshToken: For OAuth token refresh (future use)
 * - refreshTokenExpires: OAuth token expiration
 * 
 * Features:
 * - Multi-provider authentication (Google OAuth + Credentials)
 * - Account lockout protection (5min → 15min → 1hr)
 * - Conditional password requirement based on provider
 * - Email uniqueness constraint
 * - Automatic timestamps (createdAt)
 */

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function () {
            return this.provider === 'credentials';
        },
    },
    provider: {
        type: String,
        enum: ['credentials', 'google'],
        default: 'credentials',
    },
    // Account lockout fields
    failedAttempts: {
        type: Number,
        default: 0,
    },
    lockoutUntil: {
        type: Date,
        default: null,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    // Refresh token fields
    refreshToken: {
        type: String,
        default: null,
    },
    refreshTokenExpires: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
