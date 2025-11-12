import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientViewport from "./ClientViewport";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hinata - AI Girlfriend",
  description: "A cute, responsive AI chatbot girlfriend powered by DeepSeek",
  icons: {
    icon: "/hinataa.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="transition-colors duration-300">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800`}
      >
        {/* ✅ Apply viewport fix as client component */}
        <ClientViewport />

        {children}
      </body>
    </html>
  );
}
