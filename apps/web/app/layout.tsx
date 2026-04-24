import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reachfyp",
  description: "Performance-first creator marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
