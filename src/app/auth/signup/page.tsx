'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { darkMode, setDarkMode } = useTheme();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (response.ok) {
                // Auto-signin after successful registration
                const signInResult = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (signInResult?.error) {
                    setError('Account created but sign in failed. Please sign in manually.');
                    router.push('/auth/signin?message=Account created successfully');
                } else {
                    router.push('/');
                }
            } else {
                const data = await response.json();
                setError(data.error || 'An error occurred');
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
                            <h2 className="text-2xl font-semibold mb-2">Sign Up</h2>
                            <p className={cn(
                                "text-sm",
                                darkMode ? "text-gray-300" : "text-gray-600"
                            )}>
                                Create a new account to get started
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium mb-1">
                                    Name
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className={cn(
                                        darkMode ? "bg-[#454343] border-[#2A2A2A]" : "bg-white border-gray-300"
                                    )}
                                />
                            </div>
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
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                                    Confirm Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                        </form>
                        <div className="mt-4 text-center">
                            <Link href="/auth/signin" className={cn(
                                "text-sm hover:underline",
                                darkMode ? "text-blue-400" : "text-blue-600"
                            )}>
                                Already have an account? Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
