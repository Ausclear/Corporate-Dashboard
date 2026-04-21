import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "AusClear — Corporate Portal",
  description: "AusClear Corporate Client Dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased`} style={{ fontFamily: "var(--font-dm-sans), DM Sans, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
