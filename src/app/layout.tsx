import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext";
import { CompletionProvider } from "@/context/CompletionContext";
import { ExpeditionProvider } from "@/context/ExpeditionContext";
import { AdminProvider } from "@/context/AdminContext";
import ExpeditionManager from "@/components/uncharted/ExpeditionManager";
import ExpeditionProgress from "@/components/uncharted/ExpeditionProgress";
import CompletionChecker from "@/components/uncharted/CompletionChecker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Uncharted Expedition — Feedback Portal",
  description:
    "Skeleton feedback portal for the Uncharted expedition concept. Three checkpoints (A/B/C), gemstone ratings, optional clues and treasure hunts, certificate shards per checkpoint, and a final expedition certificate.",
  keywords: ["Uncharted", "expedition", "feedback", "Next.js", "TypeScript"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AdminProvider>
          <ExpeditionProvider>
            <UserProvider>
              <CompletionProvider>
                {children}
                <ExpeditionProgress />
                <CompletionChecker />
                <ExpeditionManager />
              </CompletionProvider>
            </UserProvider>
          </ExpeditionProvider>
        </AdminProvider>
        <Toaster />
      </body>
    </html>
  );
}
