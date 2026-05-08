import { NextRequest, NextResponse } from "next/server";

// matcher in config already limits execution to protected routes,
// so the function only needs to check for a valid session cookie.
// Note: we verify cookie existence + basic JWT shape only.
// Full signature validation requires a backend /verify call.
export function middleware(req: NextRequest) {
    const token = req.cookies.get("investi_token")?.value;

    // Accept a real JWT (3 base64 segments) or the intentional guest marker
    const isValidSession =
        token === "guest" || (!!token && token.split(".").length === 3);

    if (!isValidSession) {
        return NextResponse.redirect(new URL("/", req.url));
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
