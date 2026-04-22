import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Managers Dashboard",
  description: "Progressive Property — internal reporting portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="bg-pp-navy text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: "#F26522" }}
              />
              <span className="font-semibold tracking-tight">Managers Dashboard</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
