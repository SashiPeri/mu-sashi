import type { Metadata } from "next";
import "./globals.css";

import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
} from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Musashi",
  description: "The path of mastery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${serif.variable} ${mono.variable} min-h-full`}
      >
        {children}
      </body>
    </html>
  );
}