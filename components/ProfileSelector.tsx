"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "info" | "profile";
type Profile = "Conservador" | "Moderado" | "Agresivo";

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
  const [step, setStep] = useState<Step>("info");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleInfoSubmit = () => {
    if (!name.trim()) { setError("Por favor ingresa tu nombre."); return; }
    setError("");
    setStep("profile");
  };

  const handleProfileSelect = async (profile: Profile) => {
    setSelected(profile);
    setSaving(true);
    setError("");
    try {
      // Create user in backend
      const res = await fetch("https://investi-backend-production.up.railway.app/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          age: age ? parseInt(age) : null,
          monthly_income: income ? parseFloat(income) : null,
        }),
      });

      if (res.ok) {
        const user = await res.json();
        // Save profile
        await fetch("https://investi-backend-production.up.railway.app/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, risk_profile: profile }),
        });
        // Store in session
        sessionStorage.setItem("user", JSON.stringify({ ...user, risk_profile: profile }));
      }
    } catch {
      // Non-blocking — continue even if server is offline during dev
    } finally {
      sessionStorage.setItem("profile", profile);
      sessionStorage.setItem("userName", name.trim());
      setSaving(false);
      router.push("/dashboard");
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
        <div style={{ textAlign: "center", marginBottom: 40 }}>
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

        {step === "info" && (
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
                  onKeyDown={e => e.key === "Enter" && handleInfoSubmit()}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Edad (opcional)
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="28"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    min={18}
                    max={100}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                    Ingreso mensual USD
                  </label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="2500"
                    value={income}
                    onChange={e => setIncome(e.target.value)}
                    min={0}
                  />
                </div>
              </div>
              {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" onClick={handleInfoSubmit} style={{ width: "100%", justifyContent: "center" }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

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

            {saving && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 16 }}>
                Configurando tu perfil...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
