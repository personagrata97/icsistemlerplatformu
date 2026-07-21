import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that do not require authentication
    const publicPrefixes = [
        '/audit/ethics/submit',
        '/audit/ethics/query',
        '/_next',
        '/api',
        '/favicon.ico',
    ];

    const isPublic = publicPrefixes.some(prefix => pathname.startsWith(prefix));
    if (isPublic) {
        return NextResponse.next();
    }

    // Add security headers to all frontend responses
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
}

export const config = {
    matcher: ['/audit/:path*', '/admin/:path*'],
};
