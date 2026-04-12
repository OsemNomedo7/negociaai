import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caos Dívidas",
  description: "PLATAFORMA DE CRIAÇÃO DE TELAS DE QUITAÇÃO E COBRANÇA DE DIVIDAS",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
