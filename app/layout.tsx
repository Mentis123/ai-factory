import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Link from "next/link";
import AdminTokenInput from "./components/AdminTokenInput";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body
        className={`${geistMono.variable} antialiased min-h-screen`}
        style={{ background: "var(--navy-950)", color: "var(--slate-200)" }}
      >
        <nav
          className="noise-bg sticky top-0 z-50 backdrop-blur-sm"
          style={{
            background: "rgba(15, 22, 41, 0.85)",
            borderBottom: "1px solid var(--navy-700)",
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--teal-500), var(--teal-400))",
                  color: "var(--navy-950)",
                }}
              >
                AF
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: "var(--slate-200)" }}
                >
                  AI FACTORY
                </span>
                <span
                  className="text-[10px] font-mono tracking-widest uppercase"
                  style={{ color: "var(--slate-400)" }}
                >
                  GAI Insights
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink href="/" label="Runs" />
              <NavLink href="/profiles" label="Profiles" />
              <div
                className="ml-3 pl-3"
                style={{ borderLeft: "1px solid var(--navy-700)" }}
              >
                <AdminTokenInput />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="nav-link px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
    >
      {label}
    </Link>
  );
}
