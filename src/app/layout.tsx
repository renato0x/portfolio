import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://renatoox.vercel.app"),
  title: "Renato Monteiro — Portfólio",
  description: "Portfólio de Renato Monteiro. Projetos, tecnologia e o som que acompanha o processo.",
  openGraph: {
    title: "Renato Monteiro — Portfólio",
    description: "Projetos, tecnologia e o som que acompanha o processo.",
    images: ["/profile.png"],
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
