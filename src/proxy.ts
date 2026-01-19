import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16+ uses proxy instead of middleware
export const proxy = createMiddleware(routing);

export const config = {
    // Match all pathnames except for
    // - API routes
    // - Static files
    // - Image optimization files
    matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"
    ],
};
