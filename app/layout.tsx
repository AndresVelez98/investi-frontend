import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investi AI — Asesor Financiero Inteligente",
  description: "Tu asesor financiero con IA en tiempo real. Consulta precios, obtén análisis personalizados y calcula proyecciones de inversión.",
  keywords: ["inversiones", "finanzas", "IA", "asesor financiero", "acciones", "bitcoin"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Apply theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('investi_theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
