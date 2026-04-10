import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SafeTrack — Gestione Sicurezza sul Lavoro",
    template: "%s | SafeTrack",
  },
  description:
    "SafeTrack: la piattaforma professionale per consulenti RSPP. Gestisci scadenze, attestati e adempimenti D.Lgs. 81/08 per tutte le tue aziende clienti.",
  keywords: ["RSPP", "sicurezza sul lavoro", "D.Lgs 81/08", "scadenze", "attestati", "consulente sicurezza"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
