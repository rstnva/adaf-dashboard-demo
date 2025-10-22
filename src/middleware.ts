import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const prettyFeedIdMatch = req.nextUrl.pathname.match(/^\/api\/oracle\/v1\/feeds\/id\/(.+)$/);
  if (prettyFeedIdMatch) {
    const rawId = prettyFeedIdMatch[1];
    const decodedId = decodeURIComponent(rawId);
    const newUrl = req.nextUrl.clone();
    newUrl.pathname = '/api/oracle/v1/feeds/by-id';
    newUrl.searchParams.set('id', decodedId);
    return NextResponse.rewrite(newUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/oracle/v1/feeds/id/:path*'],
};
