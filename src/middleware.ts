import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
    function middleware(req: NextRequest) {
        // Enforce HTTPS in production
        if (process.env.NODE_ENV === 'production') {
            const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol;
            if (proto === 'http:') {
                return NextResponse.redirect(
                    `https://${req.headers.get('host')}${req.nextUrl.pathname}${req.nextUrl.search}`,
                    { status: 301 }
                );
            }
        }

        const res = NextResponse.next();

        // Content Security Policy headers
        const isDevelopment = process.env.NODE_ENV === 'development';
        const cspHeader = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
            "worker-src 'self' blob:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' https://fonts.gstatic.com data:",
            "connect-src 'self' https://generativelanguage.googleapis.com https://cdnjs.cloudflare.com",
            "media-src 'self'",
            "object-src 'none'",
            "frame-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ].join('; ');

        res.headers.set('Content-Security-Policy', cspHeader);

        // Security headers for protection against common attacks
        res.headers.set('X-Frame-Options', 'DENY');
        res.headers.set('X-Content-Type-Options', 'nosniff');
        res.headers.set('X-XSS-Protection', '1; mode=block');
        res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
        res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
        
        // HSTS (HTTP Strict Transport Security) - enforces HTTPS
        if (process.env.NODE_ENV === 'production') {
            res.headers.set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        return res;
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public|auth).*)',
    ],
};
