import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that do not require authentication or token verification
    const publicPrefixes = [
        '/login',
        '/audit/ethics/submit',
        '/audit/ethics/query',
        '/_next',
        '/api',
        '/favicon.ico',
    ];

    const isPublic = publicPrefixes.some(prefix => pathname.startsWith(prefix));

    if (!isPublic) {
        // Enforce JWT authentication for protected frontend routes (/audit, /admin, /settings, etc.)
        const token = request.cookies.get('access_token')?.value || request.headers.get('authorization');

        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl, 307);
        }
    }

    // Add production security headers to all frontend responses
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    return response;
}

export const config = {
    matcher: ['/audit/:path*', '/admin/:path*', '/settings/:path*', '/dashboard/:path*'],
};
