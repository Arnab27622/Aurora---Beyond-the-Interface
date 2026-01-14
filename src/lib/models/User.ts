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
