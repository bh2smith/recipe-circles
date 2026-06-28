import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/config";

// DM Sans carries both body and headings (hierarchy via weight + tracking),
// matching the Circles brand; DM Mono is reserved for addresses and gCRC amounts.
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const heading = DM_Sans({ variable: "--font-heading", subsets: ["latin"] });
const mono = DM_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

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
