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
      <body>{children}</body>
    </html>
  );
}
