import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { LocaleProvider } from "@/lib/i18n/client";
import { BRAND } from "@/lib/brand";
import { getLocale, getTranslations } from "@/lib/i18n/server";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BRAND.themeColor,
};

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
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
      <body className="min-h-full antialiased">
        <LocaleProvider locale={locale}>
          <SplashScreen />
          <AmbientBackground />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
