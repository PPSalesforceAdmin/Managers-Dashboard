import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Managers Dashboard · Progressive Property",
  description: "Internal reporting portal for Progressive Property managers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-pp-offwhite font-sans text-[15px] leading-relaxed antialiased">
        <header className="border-b-2 border-pp-orange bg-pp-navy text-white">
          <div className="mx-auto flex h-[72px] max-w-pp-container items-center justify-between px-4 md:h-[100px] md:px-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-pp-button bg-pp-orange text-sm font-bold">
                PP
              </span>
              <span className="text-[15px] font-bold tracking-pp-nav md:text-base">
                Managers Dashboard
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-pp-container px-4 py-6 md:px-6 md:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
