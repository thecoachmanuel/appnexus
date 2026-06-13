import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-for-development'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('app_auth_token')?.value;
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/builder') ||
    path.startsWith('/admin') ||
    path.startsWith('/subscription') ||
    path.startsWith('/settings');

  const isAuthPage = path === '/auth';

  // If no token on protected route → redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If token exists, decode it to check role
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = (payload as any).role;

      // Admin route protection: non-admin users get redirected to dashboard
      if (path.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // If already logged in, redirect away from /auth
      if (isAuthPage) {
        const destination = role === 'admin' ? '/admin' : '/dashboard';
        return NextResponse.redirect(new URL(destination, request.url));
      }
    } catch {
      // Bad token — clear it and redirect to auth
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/auth', request.url));
        response.cookies.delete('app_auth_token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/builder/:path*',
    '/admin/:path*',
    '/subscription/:path*',
    '/settings/:path*',
    '/auth',
  ],
};
