import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

const PROTECTED = ['/dashboard', '/listings/new', '/messages', '/admin', '/profile'];
const SELLER_ONLY = ['/listings/new'];
const ADMIN_ONLY = ['/admin'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const token =
    request.cookies.get('tab_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(pathname)}`, request.url));
  }

  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (SELLER_ONLY.some((p) => pathname.startsWith(p)) && user.role === 'BUYER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/listings/new', '/messages/:path*', '/admin/:path*'],
};
