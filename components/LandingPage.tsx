"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

// ─── Ticker data (es-CO locale) ─────────────────────────────────────────────
const TICKER = [
  { s: "BTC/USD",  p: "71,284.42",  c: "+2.34%", up: true  },
  { s: "ETH/USD",  p: "3,984.18",   c: "+1.18%", up: true  },
  { s: "USD/COP",  p: "3,942.80",   c: "+0.15%", up: true  },
  { s: "USD/BRL",  p: "5.18",       c: "-0.08%", up: false },
  { s: "USD/ARS",  p: "1,184.50",   c: "+0.42%", up: true  },
  { s: "NVDA",     p: "932.74",     c: "+3.42%", up: true  },
  { s: "AAPL",     p: "189.30",     c: "+0.62%", up: true  },
  { s: "MELI",     p: "1,842.55",   c: "+1.94%", up: true  },
  { s: "SOL/USD",  p: "178.94",     c: "-0.84%", up: false },
  { s: "VTI",      p: "272.18",     c: "+0.48%", up: true  },
  { s: "COLCAP",   p: "1,824.32",   c: "+0.91%", up: true  },
];

// ─── Sparkline path generator ────────────────────────────────────────────────
function generatePath(seed: number, w = 100, h = 28): string {
  let v = 50;
  const pts: number[] = [];
  let x = seed * 9301 + 49297;
  const rand = () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
  for (let i = 0; i < 24; i++) {
    v += (rand() - 0.5) * 10 + 0.2;
    v = Math.max(8, Math.min(92, v));
    pts.push(v);
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = (max - min) || 1;
  const step = (w - 4) / 23;
  return pts
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(2 + i * step).toFixed(1)},${(
          h - 2 - ((p - min) / range) * (h - 4)
        ).toFixed(1)}`
    )
    .join(" ");
}

function Sparkline({ seed, up }: { seed: number; up: boolean }) {
  return (
    <svg
      width="100"
      height="28"
      viewBox="0 0 100 28"
      fill="none"
      className="sparkline"
    >
      <path
        d={generatePath(seed)}
        stroke={up ? "#22d3a0" : "#ff5577"}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Feature cards data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🤖",
    iconBg: "linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1))",
    title: "Santi, tu asesor IA",
    desc:
      "Pregunta sobre cualquier activo, recibe análisis personalizado y simulaciones al instante con tu IA de inversiones.",
    badge: "IA",
    badgeClass: "badge-purple",
  },
  {
    icon: "📊",
    iconBg: "linear-gradient(135deg, rgba(34,211,160,0.2), rgba(0,212,255,0.1))",
    title: "Portafolios automatizados",
    desc:
      "Estrategias adaptadas a tu perfil de riesgo: conservador, moderado o agresivo. Rebalanceo inteligente continuo.",
    badge: "ACTIVO",
    badgeClass: "badge-green",
  },
  {
    icon: "🎓",
    iconBg: "linear-gradient(135deg, rgba(245,185,66,0.2), rgba(255,85,119,0.1))",
    title: "Academia financiera",
    desc:
      "Aprende a invertir desde cero con lecciones interactivas diseñadas para el mercado latinoamericano.",
    badge: "NUEVO",
    badgeClass: "badge-gold",
  },
];

// ─── Preview markets list ────────────────────────────────────────────────────
const PREVIEW_MARKETS = [
  { icon: "₿", sym: "BTC/USD",  name: "Bitcoin",      price: "$71,284",   pct: "+2.34%", up: true,  seed: 1  },
  { icon: "🔷", sym: "ETH/USD",  name: "Ethereum",     price: "$3,984",    pct: "+1.18%", up: true,  seed: 2  },
  { icon: "💵", sym: "USD/COP",  name: "Dólar/Peso",   price: "$3,942.80", pct: "+0.15%", up: true,  seed: 3  },
  { icon: "📈", sym: "COLCAP",   name: "Índice Col.",  price: "1,824",     pct: "+0.91%", up: true,  seed: 4  },
  { icon: "🍎", sym: "AAPL",     name: "Apple Inc.",   price: "$189.30",   pct: "+0.62%", up: true,  seed: 5  },
];

// ─── Area chart (static decorative SVG) ─────────────────────────────────────
function AreaChart() {
  const pts = [
    [0, 80], [60, 72], [120, 78], [180, 60], [240, 65],
    [300, 50], [360, 42], [420, 48], [480, 35], [540, 28],
    [600, 34], [660, 22], [720, 18],
  ];
  const pathD = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaD = `${pathD} L720,100 L0,100 Z`;

  return (
    <svg viewBox="0 0 720 100" preserveAspectRatio="none" style={{ width: "100%", height: 140, display: "block" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6c63ff" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={pathD} fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const glowRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -400, y: -400 });
  const currentRef = useRef({ x: -400, y: -400 });
  const rafRef = useRef<number | null>(null);

  // Cursor glow with lerp easing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const target = mouseRef.current;
      const cur = currentRef.current;
      cur.x += (target.x - cur.x) * 0.1;
      cur.y += (target.y - cur.y) * 0.1;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${cur.x - 200}px, ${cur.y - 200}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Cursor glow */}
      <div id="cursor-glow" ref={glowRef} />

      {/* Animated mesh background */}
      <div className="mesh-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="grid-overlay" />
      </div>

      {/* ── Top navbar ── */}
      <nav className="topnav">
        <a href="/" className="logo" style={{ marginRight: 8 }}>
          <div className="logo-mark">📈</div>
          <span className="logo-text">Investi</span>
        </a>

        <button className="topnav-link">Producto</button>
        <button className="topnav-link">Educacion</button>
        <button className="topnav-link">Mercados</button>
        <button className="topnav-link">Precios</button>
        <button className="topnav-link">Empresa</button>

        <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 13, padding: "8px 16px" }}>
            Iniciar sesion
          </Link>
          <Link href="/login" className="btn-primary btn-pulse" style={{ fontSize: 13, padding: "8px 18px" }}>
            Abrir cuenta gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="eyebrow reveal" style={{ marginBottom: 28 }}>
          <span className="dot" />
          EN VIVO &middot; 500+ activos &middot; LATAM
        </div>

        <h1 className="reveal">
          Invierte con la fuerza de la{" "}
          <span className="grad">Inteligencia Artificial</span>
        </h1>

        <p className="lead reveal">
          Analiza mercados, simula portafolios y recibe asesoría personalizada
          en tiempo real. Diseñado para el inversionista colombiano.
        </p>

        <div className="hero-cta reveal">
          <Link href="/login" className="btn-primary btn-pulse" style={{ fontSize: 16, padding: "14px 32px" }}>
            Comenzar gratis
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 15, padding: "13px 28px" }}>
            Ver demo
          </Link>
        </div>

        {/* Proof stats */}
        <div className="hero-proof reveal">
          <div className="hero-proof-item">
            <span className="hero-proof-num">12,000+</span>
            <span className="hero-proof-label">Usuarios activos</span>
          </div>
          <div className="hero-proof-divider" />
          <div className="hero-proof-item">
            <span className="hero-proof-num">$48B COP</span>
            <span className="hero-proof-label">En portafolios</span>
          </div>
          <div className="hero-proof-divider" />
          <div className="hero-proof-item">
            <span className="hero-proof-num">500+</span>
            <span className="hero-proof-label">Activos en vivo</span>
          </div>
          <div className="hero-proof-divider" />
          <div className="hero-proof-item">
            <span className="hero-proof-num">4.9★</span>
            <span className="hero-proof-label">Calificacion</span>
          </div>
        </div>

        <div className="hero-orn" />
      </section>

      {/* ── Feature cards ── */}
      <div className="hero-cards reveal">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-card-icon" style={{ background: f.iconBg }}>
              {f.icon}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <p className="feature-card-title" style={{ margin: 0 }}>{f.title}</p>
              <span className={`badge ${f.badgeClass}`}>{f.badge}</span>
            </div>
            <p className="feature-card-desc">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Ticker ── */}
      <div className="ticker-wrap reveal">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <div key={i} className="tick">
              <span className="tick-sym">{t.s}</span>
              <span className="tick-price">{t.p}</span>
              <span className={`tick-change ${t.up ? "tick-up" : "tick-down"}`}>
                {t.c}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Preview section ── */}
      <section className="landing-preview reveal">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="eyebrow" style={{ marginBottom: 20, display: "inline-flex" }}>
            <span className="dot" />
            PLATAFORMA EN VIVO
          </span>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 800,
            color: "var(--ink-0)",
            marginTop: 16,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            Mira a Investi en accion
          </h2>
          <p style={{ color: "var(--ink-2)", fontSize: 16, marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
            Una plataforma unificada para analizar, simular e invertir con inteligencia artificial.
          </p>
        </div>

        <div className="preview-grid">
          {/* Area chart card */}
          <div className="preview-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 4 }}>Portafolio estimado</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-0)", letterSpacing: "-0.02em" }}>
                  $48.6M COP
                </div>
              </div>
              <span className="badge badge-green">+14.5% E.A.</span>
            </div>

            <AreaChart />

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--glass-border)",
            }}>
              {["1S", "1M", "3M", "6M", "1A", "TODO"].map((lbl) => (
                <button
                  key={lbl}
                  style={{
                    background: lbl === "1M" ? "rgba(108,99,255,0.15)" : "transparent",
                    border: "none",
                    color: lbl === "1M" ? "var(--purple)" : "var(--ink-3)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Markets list card */}
          <div className="preview-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-0)" }}>Mercados en Vivo</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="dot" style={{ width: 7, height: 7 }} />
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>TRM $3,942</span>
              </div>
            </div>

            {PREVIEW_MARKETS.map((m) => (
              <div key={m.sym} className="markets-row">
                <div className="coin-icon">{m.icon}</div>
                <div className="market-name">
                  <div className="market-name-main">{m.sym}</div>
                  <div className="market-name-sub">{m.name}</div>
                </div>
                <Sparkline seed={m.seed} up={m.up} />
                <div className="market-price">
                  <div className="market-price-main">{m.price}</div>
                  <div
                    className="market-price-change"
                    style={{ color: m.up ? "var(--emerald)" : "var(--rose)" }}
                  >
                    {m.up ? "▲" : "▼"} {m.pct}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA footer ── */}
      <section
        className="reveal"
        style={{
          textAlign: "center",
          padding: "80px 24px 120px",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        <h2 style={{
          fontSize: "clamp(26px, 4vw, 44px)",
          fontWeight: 800,
          color: "var(--ink-0)",
          letterSpacing: "-0.02em",
          marginBottom: 16,
        }}>
          Empieza a invertir hoy,{" "}
          <span style={{
            background: "linear-gradient(135deg, #6c63ff, #00d4ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            sin comisiones
          </span>
        </h2>
        <p style={{ color: "var(--ink-2)", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          Crea tu cuenta en menos de 2 minutos. Sin tarjeta de credito, sin cargos ocultos.
        </p>
        <Link
          href="/login"
          className="btn-primary btn-pulse"
          style={{ fontSize: 16, padding: "16px 40px" }}
        >
          Crear cuenta gratis
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <p style={{ color: "var(--ink-4)", fontSize: 12, marginTop: 20, lineHeight: 1.6 }}>
          Solo uso educativo. No constituye asesoria financiera oficial.
        </p>
      </section>
    </>
  );
}
