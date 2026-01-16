/**
 * Sign In Page
 * 
 * User authentication page with email/password and OAuth (Google) options.
 * Supports credentials-based authentication via NextAuth.js.
 * 
 * Features:
 * - Email/password sign-in form
 * - Google OAuth sign-in with consent prompt
 * - Theme support (dark/light mode)
 * - Error handling and user feedback
 * - Loading states for UX feedback
 * - Responsive design with Tailwind CSS
 * - Form validation (required fields)
 * 
 * Authentication flow:
 * 1. User enters email and password
 * 2. Submits to NextAuth credentials provider
 * 3. On success, redirects to home (/)
 * 4. On error, displays user-friendly error message
 * 5. Alternative: Google OAuth for social login
 * 
 * Error handling:
 * - CredentialsSignin: "Invalid email or password"
 * - Other errors: Displayed as-is
 * - Network errors: Caught and displayed
 * 
 * Navigation:
 * - Link to sign up page for new users
 * - Redirects to home on successful login
 * 
 * Accessibility:
 * - Labeled form inputs
 * - Disabled state during submission
 * - Loading indicators
 * - Error messages displayed inline
 * 
 * @route /auth/signin
 * @public (accessible without authentication)
 */
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

/**
 * SignIn Component
 * 
 * Renders the authentication form with email, password, and OAuth options.
 * Manages form state, submission, and error handling.
 * 
 * State:
 * - email: User email input
 * - password: User password input
 * - error: Error message to display
 * - loading: Submit button loading state
 * - googleLoading: Google button loading state
 * - darkMode: Theme preference
 */
export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { darkMode, setDarkMode } = useTheme();
    const router = useRouter();

    /**
     * Handles form submission for credentials-based sign-in.
     * 
     * Process:
     * 1. Prevents default form submission
     * 2. Sets loading state
     * 3. Clears previous errors
     * 4. Calls NextAuth signIn with credentials
     * 5. Maps error codes to user-friendly messages
     * 6. Redirects to home on success
     * 7. Displays errors on failure
     * 
     * @param e - Form submit event
     */
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
                // Map NextAuth error codes to user-friendly messages
                if (result.error === 'CredentialsSignin') {
                    setError('Invalid email or password');
                } else {
                    setError(result.error);
                }
            } else if (result?.ok) {
                router.push('/');
            }
        } catch (error) {
            setError('An error occurred during sign in');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Initiates Google OAuth sign-in flow.
     * 
     * Process:
     * 1. Sets loading state while OAuth redirects
     * 2. Calls NextAuth Google provider
     * 3. Includes consent prompt for account selection
     * 4. Handles errors gracefully
     * 5. Redirects to home on successful callback
     * 
     * Note: OAuth provider handles redirect after successful authentication
     */
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');

        try {
            await signIn('google', {
                callbackUrl: '/',
                prompt: 'consent',
            });
        } catch (error) {
            setError('An error occurred with Google sign-in');
            setGoogleLoading(false);
        }
    };

    /**
     * Render UI with form, OAuth button, and theme support.
     * 
     * Layout:
     * - Full-screen flex container with header
     * - Centered form card (max-width: 28rem)
     * - Form fields with theme-aware styling
     * - Error display area
     * - Submit and OAuth buttons
     * - Link to sign-up page
     * 
     * Styling:
     * - Supports dark mode via ThemeProvider
     * - Responsive padding (4rem horizontal)
     * - Tailwind CSS utility classes
     * - Hover states for interactive elements
     */
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
                        <div className="relative my-4">
                            <div className={cn(
                                "absolute inset-0 flex items-center",
                                darkMode ? "" : ""
                            )}>
                                <span className={cn(
                                    "w-full border-t",
                                    darkMode ? "border-gray-600" : "border-gray-300"
                                )} />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className={cn(
                                    "bg-background px-2",
                                    darkMode ? "bg-[#2A2A2A] text-gray-400" : "bg-gray-50 text-gray-500"
                                )}>
                                    Or continue with
                                </span>
                            </div>
                        </div>
                        <div className="mb-4">
                            <Button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 cursor-pointer border",
                                    darkMode ? "bg-white text-black hover:bg-gray-100 border-gray-300" : "bg-white text-black hover:bg-gray-50 border-gray-300"
                                )}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {googleLoading ? 'Signing in...' : 'Continue with Google'}
                            </Button>
                        </div>
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
