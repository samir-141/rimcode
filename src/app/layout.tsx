import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import HeadLanding from "@/components/header/header";
import RimBotAssistant from "@/components/landing/welcome/RimBotAssistant";
import RimyController from "@/components/rimy/RimyController";
import CookiePreferences from "@/components/privacy/CookiePreferences";
import StructuredData from "@/components/seo/StructuredData";
import { getSettings } from "@/lib/db";
import { getSiteMetadata } from "@/lib/seo/seo-config";
import {
  buildOrganizationJsonLd,
  buildProfessionalServiceJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const settings = getSettings();

export const metadata: Metadata = getSiteMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Evitar parpadeo del tema al cargar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem("${settings.theme.storageKey}");

                  var isDark = theme
                    ? theme === "dark"
                    : window.matchMedia("(prefers-color-scheme: dark)").matches;

                  document.documentElement.classList.toggle("dark", isDark);
                  document.documentElement.classList.toggle("light", !isDark);
                } catch (error) {
                  document.documentElement.classList.add("dark");
                  document.documentElement.classList.remove("light");
                }
              })();
            `,
          }}
        />
      </head>

      <body className="min-h-full flex flex-col">
        {/* Datos estructurados globales de Organization, ProfessionalService y WebSite */}
        <StructuredData data={buildOrganizationJsonLd()} />
        <StructuredData data={buildProfessionalServiceJsonLd()} />
        <StructuredData data={buildWebSiteJsonLd()} />

        <HeadLanding />

        {children}

        {/* Mascota global: persiste entre rutas. */}
        <RimyController />

        {/* Asistente exclusivo de RimCode. */}
        <RimBotAssistant />

        {/* Sistema de consentimiento de cookies (CMP) */}
        <CookiePreferences />
      </body>
    </html>
  );
}
