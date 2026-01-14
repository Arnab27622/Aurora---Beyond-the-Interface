import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    try {
        // Apply rate limiting: 10 requests per minute per IP (more lenient for token refresh)
        const clientIp = getClientIp(request);
        const rateLimit = checkRateLimit(clientIp, 10, 60000);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { 
                    error: 'Too many token refresh requests. Please try again later.',
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

        const { refreshToken } = await request.json();

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, process.env.NEXTAUTH_SECRET!) as { id: string };

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken || user.refreshTokenExpires < new Date()) {
            return NextResponse.json(
                { error: 'Invalid or expired refresh token' },
                { status: 401 }
            );
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { id: user._id.toString(), email: user.email, name: user.name },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '15m' } // Short-lived access token
        );

        // Generate new refresh token (rotation)
        const newRefreshToken = jwt.sign(
            { id: user._id.toString() },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '7d' }
        );

        // Update user with new refresh token
        user.refreshToken = newRefreshToken;
        user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await user.save();

        return NextResponse.json({
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { error: 'Invalid refresh token' },
            { status: 401 }
        );
    }
}
