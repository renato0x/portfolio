import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "@renato0x",
  description:
    "Renato Monteiro — software developer and Systems Analysis student at IFNMG.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
