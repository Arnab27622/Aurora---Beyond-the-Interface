/**
 * NextAuth Configuration and Setup
 * 
 * Handles authentication with multiple providers:
 * - Credentials (email + password with account lockout)
 * - Google OAuth
 * 
 * Features:
 * - Progressive account lockout after failed attempts (5min → 15min → 1hr)
 * - JWT-based session management
 * - Google account linking with existing accounts
 * - Secure password validation with bcrypt
 */

import NextAuth, { NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error('Email and password are required');
                    }

                    await dbConnect();

                    const user = await User.findOne({ email: credentials.email });

                    if (!user) {
                        throw new Error('Invalid email or password');
                    }

                    // Check if account is locked
                    if (user.isLocked && user.lockoutUntil && user.lockoutUntil > new Date()) {
                        const remainingTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (1000 * 60));
                        throw new Error(`Account is temporarily locked. Please try again in ${remainingTime} minutes.`);
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        // Increment failed attempts
                        user.failedAttempts += 1;

                        // Progressive lockout: 5min → 15min → 1hr
                        if (user.failedAttempts >= 5) {
                            user.isLocked = true;
                            let lockoutDuration;
                            if (user.failedAttempts >= 15) {
                                lockoutDuration = 60 * 60 * 1000; // 1 hour
                            } else if (user.failedAttempts >= 10) {
                                lockoutDuration = 15 * 60 * 1000; // 15 minutes
                            } else {
                                lockoutDuration = 5 * 60 * 1000; // 5 minutes
                            }
                            user.lockoutUntil = new Date(Date.now() + lockoutDuration);
                        }

                        await user.save();
                        throw new Error('Invalid email or password');
                    }

                    // Reset failed attempts on successful login
                    if (user.failedAttempts > 0) {
                        user.failedAttempts = 0;
                        user.isLocked = false;
                        user.lockoutUntil = null;
                        await user.save();
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    throw error;
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: false,
            authorization: {
                params: {
                    prompt: 'consent',
                }
            }
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    jwt: {
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    await dbConnect();

                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        // Create new Google user
                        await User.create({
                            name: user.name,
                            email: user.email,
                            provider: 'google',
                        });
                    } else if (existingUser.provider === 'credentials') {
                        // Link Google account to existing credentials account
                        console.log(`Linking Google account to existing credentials account for ${user.email}`);
                        existingUser.provider = 'google';
                        await existingUser.save();
                    }
                    // If user exists with 'google' provider, just continue (already linked)
                } catch (error) {
                    console.error('Error handling Google sign in:', error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.id as string) || '';
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export const GET = handler;
export const POST = handler;
