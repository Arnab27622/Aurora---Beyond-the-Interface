/**
 * Root Layout Component
 * 
 * Main application layout wrapper that sets up:
 * - Global fonts and CSS (Geist Sans and Mono from Google Fonts)
 * - Authentication context (NextAuth session provider)
 * - Theme context (dark/light mode support)
 * - Error boundary for error handling
 * - Dynamic CSS classes for special styling
 * - Environment validation on server startup
 * 
 * This layout wraps all pages and is rendered on the server.
 * Providers are nested to allow child components to access their contexts.
 * 
 * Metadata:
 * - Title: "Aurora - Beyond the Interface"
 * - Description: Aurora chat interface with seamless functionality and aesthetics
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DynamicClasses from './DynamicClasses';
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { AuthProvider } from "@/components/AuthProvider";

import { ThemeProvider } from "@/components/ThemeProvider";
// Server-side environment validation on startup
import '@/lib/serverStartup';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurora - Beyond the Interface",
  description: "Aurora is a chat interface that goes beyond the traditional boundaries of interaction, offering a seamless blend of functionality and aesthetics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            <DynamicClasses />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
