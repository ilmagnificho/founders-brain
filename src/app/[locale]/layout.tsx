import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import "./globals.css";

// =============================================================================
// SEO & OpenGraph Metadata
// =============================================================================

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://founders-brain.vercel.app";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "FoundersBrain | AI 스타트업 어드바이저",
        template: "%s | FoundersBrain"
    },
    description:
        "YC Startup School 콘텐츠 기반 AI 스타트업 멘토. 25개 핵심 강의에서 바로 답을 찾으세요. 펀드레이징, 세일즈, MVP, 채용 등 창업 질문에 즉시 답변.",
    keywords: [
        "YC", "Y Combinator", "startup", "스타트업", "창업",
        "AI", "chatbot", "founders", "entrepreneurship",
        "펀드레이징", "MVP", "세일즈", "채용", "Startup School",
        "스타트업 스쿨", "창업 멘토", "AI 어드바이저"
    ],
    authors: [{ name: "FoundersBrain Team" }],
    creator: "FoundersBrain",
    publisher: "FoundersBrain",

    // OpenGraph
    openGraph: {
        type: "website",
        locale: "ko_KR",
        alternateLocale: "en_US",
        url: siteUrl,
        siteName: "FoundersBrain",
        title: "FoundersBrain | AI 스타트업 어드바이저",
        description: "YC Startup School 콘텐츠 기반 AI 스타트업 멘토. 창업 질문에 즉시 답변!",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "FoundersBrain - AI Startup Advisor",
            }
        ],
    },

    // Twitter Card
    twitter: {
        card: "summary_large_image",
        title: "FoundersBrain | AI 스타트업 어드바이저",
        description: "YC Startup School 기반 AI 멘토. 창업 질문에 즉시 답변!",
        images: ["/og-image.png"],
        creator: "@foundersbrain",
    },

    // Robots
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },

    // Icons
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },

    // Verification (add your IDs when ready)
    // verification: {
    //     google: "your-google-verification-code",
    //     yandex: "your-yandex-verification-code",
    // },

    // Alternate languages
    alternates: {
        canonical: siteUrl,
        languages: {
            "ko": `${siteUrl}/ko`,
            "en": `${siteUrl}/en`,
        },
    },
};

// Viewport settings
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#1a1a2e" },
        { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
    ],
};

// =============================================================================
// Layout Component
// =============================================================================

interface RootLayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function RootLayout({
    children,
    params,
}: RootLayoutProps) {
    const { locale } = await params;

    // Validate locale
    if (!routing.locales.includes(locale as "en" | "ko")) {
        notFound();
    }

    // Get messages for the current locale
    const messages = await getMessages();

    // GA4 Measurement ID (set in .env.local)
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    return (
        <html lang={locale}>
            <head>
                {/* Google Analytics 4 */}
                {gaId && (
                    <>
                        <Script
                            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                            strategy="afterInteractive"
                        />
                        <Script id="google-analytics" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${gaId}', {
                                    page_path: window.location.pathname,
                                });
                            `}
                        </Script>
                    </>
                )}

                {/* Structured Data / JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebApplication",
                            "name": "FoundersBrain",
                            "description": "AI-powered startup advisor based on YC Startup School content",
                            "url": siteUrl,
                            "applicationCategory": "BusinessApplication",
                            "operatingSystem": "Web",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            },
                            "creator": {
                                "@type": "Organization",
                                "name": "FoundersBrain"
                            }
                        })
                    }}
                />
            </head>
            <body>
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
