import type { Metadata } from "next";
import localFont from 'next/font/local';
import { Inter, Antonio, IM_Fell_English, Courier_Prime, Cinzel, Cinzel_Decorative, Caveat, EB_Garamond, Marcellus, Geist, Geist_Mono } from 'next/font/google';
import { UserProvider } from '@/context/UserContext';
import { AchievementProvider } from '@/context/AchievementContext';
import { CompletionProvider } from '@/context/CompletionContext';
import { AdminProvider } from '@/context/AdminContext';
import { LabsProvider } from '@/context/LabsContext';
import AchievementManager from '@/components/AchievementManager';
import CompletionChecker from '@/components/CompletionChecker';
import "./globals.css";

// 1. Local Uncharted Game Font (Base 02)
const base02 = localFont({
  src: './fonts/Base02.ttf',
  variable: '--font-base02',
  display: 'swap',
});

const unchartedFont = localFont({
  src: './fonts/Base02.ttf',
  variable: '--font-uncharted',
  display: 'swap',
});

// 2. Nathan Drake Handwriting Font for Journal Notes
const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting',
  weight: ['400', '600', '700'],
  display: 'swap',
});

// 3. Renaissance Cartographer Serif
const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  weight: ['400', '600', '700'],
  display: 'swap',
});

// 4. UI & Display Fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const antonio = Antonio({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-uncharted-title',
  display: 'swap',
});

const imFell = IM_Fell_English({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic', 'normal'],
  variable: '--font-uncharted-serif',
  display: 'swap',
});

const courierPrime = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-courier',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "TechX Expedition // Field Recon",
  description: "Feedback collection platform for TechX research labs.",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'TechX Expedition',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`
        ${unchartedFont.variable}
        ${base02.variable}
        ${caveat.variable}
        ${garamond.variable}
        ${inter.variable}
        ${geistSans.variable}
        ${geistMono.variable}
        ${antonio.variable}
        ${imFell.variable}
        ${courierPrime.variable}
        ${cinzel.variable}
        ${cinzelDecorative.variable}
        ${marcellus.variable}
      `}
    >
      <body className="bg-[#050302] text-[#2c1a0e] antialiased selection:bg-[#d4af37]/30 selection:text-[#1a0e05]">
        <AdminProvider>
          <LabsProvider>
            <AchievementProvider>
              <UserProvider>
                <CompletionProvider>
                  {children}
                  <CompletionChecker />
                </CompletionProvider>
              </UserProvider>
              <AchievementManager />
            </AchievementProvider>
          </LabsProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
