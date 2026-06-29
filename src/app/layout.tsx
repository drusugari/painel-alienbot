import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alienbot Site Generator",
  description: "Gerador rapido de sites institucionais por CNPJ."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
