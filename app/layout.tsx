import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { TimezoneProvider } from "@/providers/timezone-provider";
import { ConfigProvider } from "@/providers/config-provider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Kimlik.az";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // Enable safe area insets for iOS
};

export const metadata: Metadata = {
  title: `${appName} - Universal Login`,
  description: "Your universal login for secure authentication. One account, everywhere.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'manifest', url: '/favicon/site.webmanifest' }
    ]
  },
  manifest: '/favicon/site.webmanifest'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="az" suppressHydrationWarning>
      <body className={dmSans.variable} suppressHydrationWarning>
        <ThemeProvider>
          <ConfigProvider>
            <TimezoneProvider>
              <ServiceWorkerRegistration />
              {children}
            </TimezoneProvider>
          </ConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}