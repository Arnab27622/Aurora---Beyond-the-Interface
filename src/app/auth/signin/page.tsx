'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                            />
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link href="/auth/signup" className="text-sm text-blue-600 hover:underline">
                            Don&apos;t have an account? Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
