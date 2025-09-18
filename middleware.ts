import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [/^\/dashboard/, /^\/admin(\/.*)?$/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needs = PROTECTED.some((r) => r.test(pathname));
  if (!needs) return NextResponse.next();

  const cookie = req.cookies.get('admin')?.value;
  if (cookie === process.env.ADMIN_PASSWORD) return NextResponse.next();

  const login = new URL('/admin/login', req.url);
  return NextResponse.redirect(login);
}
