import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    // Supported locales
    locales: ["en", "ko"],

    // Default locale when no match is found
    defaultLocale: "ko",

    // Locale detection strategy
    localeDetection: true,

    // Path prefix strategy
    localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
