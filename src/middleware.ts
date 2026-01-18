import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
    console.log("Middleware hitting:", request.nextUrl.pathname);
    const handle = createMiddleware(routing);
    return handle(request);
}

export const config = {
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - Image optimization files
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
