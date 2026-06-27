import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/config";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const heading = Fraunces({ variable: "--font-heading", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${APP_NAME} — cook, share, unlock`,
  description:
    "A community cookbook on Circles. Share recipes, comment, and unlock premium recipes with gCRC.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${heading.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 text-center text-xs text-muted-foreground">
            Built on Circles · pay-to-unlock recipes in gCRC
          </footer>
          <Toaster position="top-center" richColors />
        </WalletProvider>
      </body>
    </html>
  );
}
