import { NextRequest, NextResponse } from "next/server";

// Accept a real JWT (3 base64 segments) or the intentional guest marker
function isValidSession(token: string | undefined): boolean {
    if (!token) return false;
    return token === "guest" || token.split(".").length === 3;
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("investi_token")?.value;
    const authed = isValidSession(token);

    // /login → redirect to /dashboard if already logged in
    if (pathname === "/login" && authed) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protected routes → redirect to /login if not authenticated
    const protectedPrefixes = [
        "/dashboard",
        "/chat",
        "/markets",
        "/calculator",
        "/learn",
        "/settings",
    ];

    const isProtected = protectedPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );

    if (isProtected && !authed) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/login",
        "/dashboard/:path*",
        "/chat/:path*",
        "/markets/:path*",
        "/calculator/:path*",
        "/learn/:path*",
        "/settings/:path*",
    ],
};
