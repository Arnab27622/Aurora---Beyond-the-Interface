/**
 * Sign Up Page
 * 
 * User registration page with account creation and OAuth options.
 * Handles new user registration with email/password.
 * 
 * Features:
 * - New user account creation form
 * - Password confirmation validation
 * - Google OAuth sign-up with consent prompt
 * - Theme support (dark/light mode)
 * - Auto sign-in after successful registration
 * - Error handling and user feedback
 * - Loading states for UX feedback
 * - Responsive design with Tailwind CSS
 * - Form validation (required fields, password match)
 * 
 * Registration flow:
 * 1. User enters name, email, and password
 * 2. Validates password match with confirmation
 * 3. Submits to /api/auth/register endpoint
 * 4. Server validates password strength and email uniqueness
 * 5. User account is created in database
 * 6. Auto-signs in user with credentials
 * 7. Redirects to home (/)
 * 8. On error: displays user-friendly error message
 * 
 * Validation:
 * - Frontend: Password match validation
 * - Backend: Password strength (8+ chars, entropy >= 2), email uniqueness
 * 
 * Error handling:
 * - Password mismatch: "Passwords do not match"
 * - Registration error: Server error message
 * - Sign-in after registration failure: Fallback with manual sign-in prompt
 * - Network errors: Caught and displayed
 * 
 * Navigation:
 * - Link to sign in page for existing users
 * - Redirects to home on successful sign-up
 * 
 * Accessibility:
 * - Labeled form inputs
 * - Disabled state during submission
 * - Loading indicators
 * - Error messages displayed inline
 * 
 * @route /auth/signup
 * @public (accessible without authentication)
 */
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


/**
 * SignUp Component
 * 
 * Renders the registration form with name, email, password, and OAuth options.
 * Manages form state, submission, validation, and error handling.
 * 
 * State:
 * - name: User full name input
 * - email: User email input
 * - password: User password input
 * - confirmPassword: Password confirmation for match validation
 * - error: Error message to display
 * - loading: Submit button loading state
 * - googleLoading: Google button loading state
 * - darkMode: Theme preference
 */
export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { darkMode, setDarkMode } = useTheme();
    const router = useRouter();

    /**
     * Handles form submission for account registration.
     * 
     * Process:
     * 1. Validates password match before submission
     * 2. Sends registration request to /api/auth/register
     * 3. Server validates password strength and email uniqueness
     * 4. On success: Auto-signs in user with credentials
     * 5. Redirects to home page
     * 6. On sign-in error: Shows error message with manual signin fallback
     * 7. On registration error: Displays server error message
     * 
     * Validation:
     * - Frontend: Password match check
     * - Backend: Password strength (8+ chars, entropy score >= 2)
     * - Backend: Email must be unique (not already registered)
     * 
     * @param e - Form submit event
     */
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

    /**
     * Initiates Google OAuth sign-up flow.
     * 
     * Process:
     * 1. Sets loading state while OAuth redirects
     * 2. Calls NextAuth Google provider
     * 3. Includes consent prompt for account selection
     * 4. Handles errors gracefully
     * 5. Google handles account creation if new user
     * 6. Redirects to home on successful callback
     * 
     * Note: Google OAuth provider handles both sign-up and sign-in,
     * creating new account if user doesn't exist in database
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
     * Render UI with registration form, OAuth button, and theme support.
     * 
     * Layout:
     * - Full-screen flex container with header
     * - Centered form card (max-width: 28rem)
     * - Form fields with theme-aware styling
     * - Name, email, password, and confirmation fields
     * - Error display area
     * - Submit and OAuth buttons
     * - Link to sign-in page for existing users
     * 
     * Styling:
     * - Supports dark mode via ThemeProvider
     * - Responsive padding (4rem horizontal)
     * - Tailwind CSS utility classes
     * - Hover states for interactive elements
     * - Form spacing with gap utilities
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
