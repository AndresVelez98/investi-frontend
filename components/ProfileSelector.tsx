"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "auth" | "register-info" | "profile";
type AuthMode = "login" | "register";
type Profile = "Conservador" | "Moderado" | "Agresivo";

const API = "https://investi-backend-75t5.onrender.com";

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

export default function ProfileSelector() {
  const router = useRouter();
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

  // --- LOGIN ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError("Por favor completa todos los campos."); return; }
    setError(""); setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Credenciales incorrectas."); return; }

      sessionStorage.setItem("token", data.access_token);
      sessionStorage.setItem("userName", data.name || email.split("@")[0]);
      sessionStorage.setItem("profile", "Moderado");
      router.push("/dashboard");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
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
      const res = await fetch(`${API}/api/auth/register`, {
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
      const loginRes = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        sessionStorage.setItem("token", loginData.access_token);
      }

      sessionStorage.setItem("profile", profile);
      sessionStorage.setItem("userName", name.trim());
      router.push("/dashboard");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "radial-gradient(ellipse at 60% 10%, rgba(79,126,248,0.08) 0%, transparent 60%), var(--bg-primary)",
    }}>
      <div style={{ maxWidth: 520, width: "100%" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, var(--accent), #7c5ce4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, margin: "0 auto 20px",
          }}>📈</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: "var(--text-primary)" }}>
            Investi AI
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Tu asesor financiero con inteligencia artificial
          </p>
        </div>

        {/* STEP: AUTH (login / register) */}
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
                {loading ? "Verificando..." : authMode === "login" ? "Entrar →" : "Continuar →"}
              </button>
            </div>

            {/* Guest mode */}
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={() => {
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
                <button className="btn-primary" onClick={handleInfoNext} style={{ flex: 2, justifyContent: "center" }}>Continuar →</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP: PROFILE */}
        {step === "profile" && (
          <div className="animate-fade-in">
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Elige tu perfil, {name} 👋
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
            {saving && <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 16 }}>Creando tu cuenta...</p>}
          </div>
        )}

      </div>
    </div>
  );
}
