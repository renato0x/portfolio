import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "@renato0x",
  description:
    "Renato Monteiro — desenvolvedor de software e estudante de ADS no IFNMG.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
