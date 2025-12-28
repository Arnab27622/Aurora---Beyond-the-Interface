import NextAuth, { NextAuthOptions, type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
                        return null;
                    }

                    await dbConnect();

                    const user = await User.findOne({ email: credentials.email });

                    if (!user) {
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        return null;
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
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
