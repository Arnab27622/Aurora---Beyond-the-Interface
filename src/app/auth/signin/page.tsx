'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { darkMode, setDarkMode } = useTheme();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid credentials');
            } else {
                router.push('/');
            }
        } catch (error) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-screen",
            darkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-black"
        )}>
            <ChatHeader
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthPage={true}
            />
            <div className="flex-grow flex items-center justify-center py-6">
                <div className="w-full max-w-md px-4">
                    <div className={cn(
                        "w-full rounded-xl border p-6 shadow-sm",
                        darkMode ? "bg-[#2A2A2A] border-[#2A2A2A]" : "bg-gray-50 border-gray-200"
                    )}>
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold mb-2">Sign In</h2>
                            <p className={cn(
                                "text-sm",
                                darkMode ? "text-gray-300" : "text-gray-600"
                            )}>
                                Enter your credentials to access your account
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={cn(
                                        darkMode ? "bg-[#454343] border-[#2A2A2A]" : "bg-white border-gray-300"
                                    )}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={cn(
                                        darkMode ? "bg-[#454343] border-[#2A2A2A]" : "bg-white border-gray-300"
                                    )}
                                />
                            </div>
                            {error && (
                                <div className="text-red-500 text-sm">{error}</div>
                            )}
                            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                        <div className="mt-4 text-center">
                            <Link href="/auth/signup" className={cn(
                                "text-sm hover:underline",
                                darkMode ? "text-blue-400" : "text-blue-600"
                            )}>
                                Don&apos;t have an account? Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
