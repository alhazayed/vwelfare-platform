import { NextResponse, type NextRequest } from 'next/server';
const PROTECTED_PREFIXES = ['/home', '/mood', '/assessments', '/medications', '/messages', '/journal', '/profile', '/clinician', '/admin', '/wellness', '/chat'];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PROTECTED_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();
  return NextResponse.next();
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
