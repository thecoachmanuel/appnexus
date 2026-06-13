import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('app_auth_token');
  const path = request.nextUrl.pathname;

  // Protected routes
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/builder') || 
    path.startsWith('/admin') ||
    path.startsWith('/subscription') ||
    path.startsWith('/settings');

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If trying to access auth page while logged in, redirect to dashboard
  if (path === '/auth' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
    '/auth'
  ],
};
