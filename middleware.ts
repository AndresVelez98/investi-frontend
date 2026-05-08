import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = [
    "/dashboard",
    "/chat",
    "/markets",
    "/calculator",
    "/learn",
    "/settings",
];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isProtected = PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
    );

    if (!isProtected) return NextResponse.next();

    const token = req.cookies.get("investi_token")?.value;

    if (!token) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/";
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/chat/:path*",
        "/markets/:path*",
        "/calculator/:path*",
        "/learn/:path*",
        "/settings/:path*",
    ],
};
