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
  title: "Chess Reasoning",
  description: "Play chess against reasoning models. Powered by Groq",
  openGraph: {
    title: "Chess Reasoning",
    description: "Play chess against reasoning models. Powered by Groq",
    url: "https://chess-reasoning.vercel.app",
    siteName: "Chess Reasoning",
    images: [
      {
        url: "/chess-reasoning-clip.png",
        width: 1200,
        height: 630,
        alt: "Chess Reasoning - Play chess against reasoning models powered by Groq",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
