import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { DeferredAmbientBackground } from "@/components/ui/DeferredAmbientBackground";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { LocaleProvider } from "@/lib/i18n/client";
import { BRAND } from "@/lib/brand";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: BRAND.themeColor },
    { color: BRAND.themeColor },
  ],
  interactiveWidget: "resizes-content",
};

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    applicationName: BRAND.name,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: BRAND.icon, type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: BRAND.icon, type: "image/png", sizes: "512x512" }],
      shortcut: "/favicon.ico",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: BRAND.name,
      startupImage: [
        {
          url: BRAND.icon,
          media:
            "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
        },
      ],
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${dmSans.variable} ${fraunces.variable} h-full`}>
      <head>
        <link rel="preload" href={BRAND.icon} as="image" type="image/png" />
        <link rel="preload" href={BRAND.logo} as="image" type="image/png" />
      </head>
      <body className="min-h-full antialiased">
        <div id="instant-splash" aria-hidden="true">
          <img
            src={BRAND.icon}
            alt=""
            width={96}
            height={96}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <LocaleProvider locale={locale}>
          <PwaProvider>
            <SplashScreen />
            <DeferredAmbientBackground />
            {children}
          </PwaProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
