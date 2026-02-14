import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import AdminTokenInput from "./components/AdminTokenInput";
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
  title: "AI Factory — GAI Insights",
  description: "AI-powered newsletter generation pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                AI Factory
              </span>
              <span className="text-xs text-gray-400 font-mono">
                by GAI Insights
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Runs
              </Link>
              <Link
                href="/profiles"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Profiles
              </Link>
              <AdminTokenInput />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
