import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans bg-canvas text-ink min-h-screen">
        {children}
      </body>
    </html>
  );
}
