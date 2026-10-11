import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daksh - Game Backend Platform",
  description: "The developer control plane for your game backend.",
};

import { OperatingModeProvider } from "@/context/OperatingModeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <OperatingModeProvider>
          {children}
        </OperatingModeProvider>
      </body>
    </html>
  );
}
