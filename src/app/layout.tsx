import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://renatoox.vercel.app"),
  title: "@renato0x in instagram",
  description:
    "Projeto pessoal de Renato Monteiro para experimentar animações com Motion, estética ASCII e reunir projetos, contatos e música em reprodução.",
  keywords: [
    "renato0x",
    "Renato Monteiro",
    "animações web",
    "Motion",
    "ASCII",
    "projetos pessoais",
  ],
  authors: [{ name: "Renato Monteiro", url: "https://github.com/renato0x" }],
  creator: "Renato Monteiro",
  alternates: { canonical: "/" },
  openGraph: {
    title: "@renato0x in instagram",
    description:
      "Um site pessoal para experimentar animações com Motion, estética ASCII e reunir projetos, contatos e música em reprodução.",
    url: "/",
    siteName: "renato0x",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "@renato0x in instagram",
    description:
      "Um site pessoal para experimentar animações com Motion, estética ASCII e reunir projetos, contatos e música em reprodução.",
  },
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
