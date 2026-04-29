import type { Metadata } from "next";
import localFont from "next/font/local";

import "@app/globals.css";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "ticktock",
    template: "%s | ticktock",
  },
  description: "ticktock timesheet management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-[var(--app-page)] text-[var(--app-foreground)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
