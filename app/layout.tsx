import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { TimezoneProvider } from "@/providers/timezone-provider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wallet.az - Digital Wallet & Payments",
  description: "Your digital wallet for secure payments. Deposit, send, and receive money with ease.",
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
          <TimezoneProvider>
            <ServiceWorkerRegistration />
            {children}
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}