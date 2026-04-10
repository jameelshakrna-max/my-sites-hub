import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DASHBOARD_CHAT_ID = '9f38d40e-7e12-4256-a85a-ee20e4eede56';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // If the hostname contains the dashboard chat ID, serve dashboard (default)
  if (hostname.includes(DASHBOARD_CHAT_ID)) {
    return NextResponse.next();
  }

  // If already on a /taharrur path, continue
  if (url.pathname.startsWith('/taharrur') || url.pathname.startsWith('/api/taharrur')) {
    return NextResponse.next();
  }

  // If the hostname is a space.z.ai preview URL but NOT the dashboard's,
  // rewrite to taharrur
  if (hostname.includes('space.z.ai')) {
    url.pathname = '/taharrur' + url.pathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon-|manifest|sw\\.js|robots\\.txt).*)'],
};
