import type { Metadata } from "next";
import { Besley, Schibsted_Grotesk, Fragment_Mono } from "next/font/google";
import "./globals.css";

const display = Besley({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
});
const sans = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = Fragment_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Donna — your AI admin assistant",
  description:
    "Donna turns the busywork from your meetings and inbox into finished tasks — booking follow-ups, writing recaps, assigning work — with a single tap of your approval.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Donna — your AI admin assistant",
    description: "From meeting to done, with one tap of your approval.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="desk-surface font-sans text-paper min-h-screen">
        {children}
      </body>
    </html>
  );
}
