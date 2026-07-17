import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FootyQuest — Level Up Your Game",
  description:
    "Gamified soccer skill training for young players: structured plans, progression levels, streaks and badges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
