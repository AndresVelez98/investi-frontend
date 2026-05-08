"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../hooks/useTheme";

type Step = "auth" | "register-info" | "profile";
type AuthMode = "login" | "register";
type Profile = "Conservador" | "Moderado" | "Agresivo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://investi-backend-75t5.onrender.com";

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 65000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    throw new Error("TIMEOUT");
  }
}

const PROFILES: { key: Profile; emoji: string; title: string; desc: string; color: string }[] = [
  {
    key: "Conservador",
    emoji: "🛡️",
    title: "Conservador",
    desc: "Priorizas la seguridad. Prefieres rendimientos estables aunque sean menores. Bonos, ETFs y depósitos son tu terreno.",
    color: "#22d3a0",
  },
  {
    key: "Moderado",
    emoji: "⚖️",
    title: "Moderado",
    desc: "Buscas equilibrio entre seguridad y crecimiento. Acciones blue-chip y ETFs diversificados encajan contigo.",
    color: "#4f7ef8",
  },
  {
    key: "Agresivo",
    emoji: "🚀",
    title: "Agresivo",
    desc: "Buscas maximizar retornos y toleras alta volatilidad. Acciones individuales, cripto y sectores de growth son tu área.",
    color: "#f5a623",
  },
];

const FEATURES = [
  {
    emoji: "📊",
    title: "Mercados en Tiempo Real",
    desc: "Precios de acciones, cripto y ETFs actualizados al instante.",
    bg: "rgba(108, 99, 255, 0.12)",
  },
  {
    emoji: "🤖",
    title: "IA Financiera Personalizada",
    desc: "Santi adapta cada análisis a tu perfil de riesgo e inversión.",
    bg: "rgba(0, 212, 255, 0.12)",
  },
  {
    emoji: "📈",
    title: "Simulaciones y Proyecciones",
    desc: "Calcula rendimientos y planifica tus metas con precisión.",
    bg: "rgba(34, 211, 160, 0.12)",
  },
];

export default function ProfileSelector() {
  const router = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const [step, setStep] = useState<Step>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register extra fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");

  // Profile
  const [selected, setSelected] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-warm the Render server silently on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/`, { signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, []);

  // Track seconds elapsed while loading so we can show progressive feedback
  useEffect(() => {
    if (loading || saving) {
      setLoadingSeconds(0);
      loadingTimerRef.current = setInterval(() => setLoadingSeconds(s => s + 1), 1000);
    } else {
      setLoadingSeconds(0);
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    }
    return () => { if (loadingTimerRef.current) clearInterval(loadingTimerRef.current); };
  }, [loading, saving]);

  // --- LOGIN ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("Por favor completa todos los campos."); return; }
    setError(""); setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const res = await fetchWithTimeout(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Credenciales incorrectas."); return; }

      document.cookie = `investi_token=${data.access_token}; path=/; SameSite=Strict`;
      sessionStorage.setItem("token", data.access_token);
      sessionStorage.setItem("userName", data.name || email.split("@")[0]);
      sessionStorage.setItem("profile", data.risk_profile || "Moderado");
      router.push("/dashboard");
    } catch {
      setError("El servidor está despertando. Espera ~30 segundos e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTER STEP 1: email/password ---
  const handleRegisterNext = () => {
    if (!email.trim()) { setError("Por favor ingresa tu email."); return; }
    if (!email.includes("@")) { setError("Email inválido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setError("");
    setStep("register-info");
  };

  // --- REGISTER STEP 2: name/age/income ---
  const handleInfoNext = () => {
    if (!name.trim()) { setError("Por favor ingresa tu nombre."); return; }
    setError("");
    setStep("profile");
  };

  // --- REGISTER STEP 3: profile + create account ---
  const handleProfileSelect = async (profile: Profile) => {
    setSelected(profile);
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithTimeout(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim(),
          age: age ? parseInt(age) : null,
          monthly_income: income ? parseFloat(income) : null,
          risk_profile: profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Error al crear la cuenta."); setSaving(false); return; }


      // Auto login after register
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);
      const loginRes = await fetchWithTimeout(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        document.cookie = `investi_token=${loginData.access_token}; path=/; SameSite=Strict`;
        sessionStorage.setItem("token", loginData.access_token);
      }

      sessionStorage.setItem("profile", profile);
      sessionStorage.setItem("userName", name.trim());
      router.push("/dashboard");
    } catch {
      setError("El servidor está despertando. Espera ~30 segundos e intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div className="split-auth">

      {/* ─── Left panel (desktop only) ─── */}
      <div className="split-auth-panel">
        {/* Decorative glows */}
        <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "15%", right: "5%",
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 460 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, boxShadow: "0 0 20px rgba(108,99,255,0.5)",
              animation: "neonPulse 3s ease-in-out infinite",
            }}>📈</div>
            <span className="gradient-text" style={{ fontSize: 24, fontWeight: 800 }}>Investi AI</span>
          </div>

          <h2 style={{
            fontSize: 38, fontWeight: 800, lineHeight: 1.15,
            color: "var(--text-primary)", marginBottom: 16, letterSpacing: "-0.02em",
          }}>
            Invierte con la fuerza<br />de la inteligencia artificial
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 40 }}>
            Análisis en tiempo real, portafolio adaptado a tu perfil y asesoría 24/7 con IA.
          </p>

          {/* Feature list */}
          <div>
            {FEATURES.map(f => (
              <div className="feature-item" key={f.title}>
                <div className="feature-icon" style={{ background: f.bg }}>
                  {f.emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 3 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap" }}>
            <span className="badge badge-blue">✓ 500+ activos</span>
            <span className="badge badge-green">✓ IA en tiempo real</span>
            <span className="badge badge-gold">✓ Datos Colombia</span>
          </div>
        </div>
      </div>

      {/* ─── Right panel (auth form) ─── */}
      <div className="split-auth-form">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          style={{
            position: "fixed", top: 20, right: 20,
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 10, width: 40, height: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 18, zIndex: 100,
            boxShadow: "var(--shadow-card)", transition: "all 0.2s ease",
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <div style={{ maxWidth: 440, width: "100%" }}>

          {/* Mobile-only brand header */}
          <div className="mobile-only animate-in" style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, margin: "0 auto 20px",
              boxShadow: "0 0 30px rgba(108, 99, 255, 0.5)",
              animation: "neonPulse 3s ease-in-out infinite",
            }}>📈</div>
            <h1 className="gradient-text" style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
              Investi AI
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Tu asesor financiero con inteligencia artificial
            </p>
          </div>

          {/* Desktop form header (auth step only) */}
          {step === "auth" && (
            <div className="desktop-only animate-in" style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 28, fontWeight: 800, color: "var(--text-primary)",
                marginBottom: 8, letterSpacing: "-0.01em",
              }}>
                {authMode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
              </h2>
              <p style={{ fontSize: 15, color: "var(--text-secondary)" }}>
                {authMode === "login"
                  ? "Ingresa a tu cuenta para continuar"
                  : "Empieza a invertir de forma inteligente"}
              </p>
            </div>
          )}

          {/* STEP: AUTH */}
          {step === "auth" && (
            <div className="glass-card animate-fade-in" style={{ padding: 32 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, marginBottom: 28, background: "var(--bg-secondary)", borderRadius: 10, padding: 4 }}>
                {(["login", "register"] as AuthMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setAuthMode(mode); setError(""); }}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                      fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                      background: authMode === mode ? "var(--accent)" : "transparent",
                      color: authMode === mode ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegisterNext())}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Contraseña
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder={authMode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleRegisterNext())}
                  />
                </div>

                {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

                <button
                  className="btn-primary"
                  onClick={authMode === "login" ? handleLogin : handleRegisterNext}
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>
                    {loading
                      ? (loadingSeconds > 8 ? `Conectando... (${loadingSeconds}s)` : loadingSeconds > 3 ? "Conectando con servidor..." : "Verificando...")
                      : authMode === "login" ? "Entrar →" : "Continuar →"}
                  </span>
                </button>

                {loading && loadingSeconds > 5 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 4, lineHeight: 1.4 }}>
                    El servidor puede tardar ~30s en despertar la primera vez ⚡
                  </p>
                )}
              </div>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => {
                    document.cookie = "investi_token=guest; path=/; SameSite=Strict";
                    sessionStorage.setItem("profile", "Moderado");
                    sessionStorage.setItem("userName", "Inversor");
                    router.push("/dashboard");
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted)", textDecoration: "underline" }}
                >
                  Continuar sin cuenta
                </button>
              </div>
            </div>
          )}

          {/* STEP: REGISTER INFO */}
          {step === "register-info" && (
            <div className="glass-card animate-fade-in" style={{ padding: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Cuéntanos sobre ti</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 28 }}>
                Esta información personaliza tus recomendaciones.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Tu nombre *
                  </label>
                  <input
                    className="input-field"
                    placeholder="Ej: Carlos"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleInfoNext()}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                      Edad (opcional)
                    </label>
                    <input className="input-field" type="number" placeholder="28" value={age} onChange={e => setAge(e.target.value)} min={18} max={100} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                      Ingreso mensual USD
                    </label>
                    <input className="input-field" type="number" placeholder="2500" value={income} onChange={e => setIncome(e.target.value)} min={0} />
                  </div>
                </div>
                {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-ghost" onClick={() => setStep("auth")} style={{ flex: 1, justifyContent: "center" }}>← Atrás</button>
                  <button className="btn-primary" onClick={handleInfoNext} style={{ flex: 2, justifyContent: "center" }}>
                    <span>Continuar →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: PROFILE */}
          {step === "profile" && (
            <div className="animate-fade-in">
              <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>
                  Elige tu perfil, <span className="gradient-text">{name}</span> 👋
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  O ve al Chat para hacer el <strong>Test de Perfil de Riesgo</strong> guiado por IA.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PROFILES.map(p => (
                  <button
                    key={p.key}
                    onClick={() => handleProfileSelect(p.key)}
                    disabled={saving}
                    style={{
                      background: selected === p.key ? `rgba(${p.color === "#22d3a0" ? "34,211,160" : p.color === "#4f7ef8" ? "79,126,248" : "245,166,35"},0.1)` : "var(--bg-card)",
                      border: `1px solid ${selected === p.key ? p.color : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "18px 20px",
                      cursor: saving ? "not-allowed" : "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>{p.title}</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              {error && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{error}</p>}
              {saving && (
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                    {loadingSeconds > 8 ? `Conectando... (${loadingSeconds}s)` : "Creando tu cuenta..."}
                  </p>
                  {loadingSeconds > 5 && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      El servidor puede tardar ~30s en despertar la primera vez ⚡
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
