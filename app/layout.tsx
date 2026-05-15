import type { Metadata } from "next";
import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Investi AI — Asesor Financiero Inteligente",
  description:
    "Tu asesor financiero con IA en tiempo real. Consulta precios, obtén análisis personalizados y calcula proyecciones de inversión.",
  keywords: [
    "inversiones",
    "finanzas",
    "IA",
    "asesor financiero",
    "acciones",
    "bitcoin",
    "Colombia",
    "COP",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
