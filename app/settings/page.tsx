"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("investi_theme") as "dark" | "light" | null;
    const initial = saved || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const setAndSave = useCallback((t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem("investi_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  return { theme, setAndSave };
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setAndSave } = useTheme();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: "32px 40px", maxWidth: 720 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Configuración
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Personaliza tu experiencia en Investi AI.
          </p>
        </div>

        {/* Theme section */}
        <section className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Tema de la interfaz
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
            Elige entre el modo oscuro y el modo claro.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Dark card */}
            <button
              onClick={() => setAndSave("dark")}
              style={{
                border: `2px solid ${theme === "dark" ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                background: theme === "dark" ? "var(--accent-glow)" : "var(--bg-secondary)",
                cursor: "pointer",
                padding: 20,
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              {/* Mini dark UI preview */}
              <div style={{ background: "#08090d", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1f2437" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1f2437" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1f2437" }} />
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#1c2130", marginBottom: 6, width: "70%" }} />
                <div style={{ height: 8, borderRadius: 4, background: "#151821", marginBottom: 6, width: "90%" }} />
                <div style={{ height: 8, borderRadius: 4, background: "#4f7ef8", width: "40%" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🌙</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Modo oscuro</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Fondo negro · Ojos descansados</div>
                </div>
                {theme === "dark" && (
                  <div style={{ marginLeft: "auto", background: "var(--accent)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </div>
            </button>

            {/* Light card */}
            <button
              onClick={() => setAndSave("light")}
              style={{
                border: `2px solid ${theme === "light" ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "var(--radius-md)",
                background: theme === "light" ? "var(--accent-glow)" : "var(--bg-secondary)",
                cursor: "pointer",
                padding: 20,
                textAlign: "left",
                transition: "all 0.2s ease",
              }}
            >
              {/* Mini light UI preview */}
              <div style={{ background: "#f4f6fc", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dde2f0" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dde2f0" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#dde2f0" }} />
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#eef1f9", marginBottom: 6, width: "70%" }} />
                <div style={{ height: 8, borderRadius: 4, background: "#ffffff", marginBottom: 6, width: "90%", border: "1px solid #dde2f0" }} />
                <div style={{ height: 8, borderRadius: 4, background: "#4f7ef8", width: "40%" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>☀️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Modo claro</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Fondo blanco · Alta legibilidad</div>
                </div>
                {theme === "light" && (
                  <div style={{ marginLeft: "auto", background: "var(--accent)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
              </div>
            </button>
          </div>
        </section>

        {/* About section */}
        <section className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Acerca de Investi AI
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
            Versión 3.0 · Impulsado por Groq LLaMA 3.3
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
            ⚠️ Investi AI es una herramienta educativa. El contenido generado no constituye asesoría financiera oficial.
            Consulta con un asesor certificado antes de tomar decisiones de inversión.
          </p>
        </section>
      </main>
    </div>
  );
}
