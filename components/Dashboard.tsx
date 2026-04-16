"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API = "https://investi-backend-75t5.onrender.com";

interface Asset {
    ticker: string;
    name: string;
    category: string;
    price: number;
    change: number;
    change_pct: number;
    currency: string;
}

// ─── Sparkline ──────────────────────────────────────────────────────────────────
function generateSparkline(change_pct: number, points = 14): number[] {
    const data: number[] = [50];
    for (let i = 1; i < points; i++) {
        const r = (Math.random() - 0.47) * 5 + (change_pct / 100) * 5;
        data.push(Math.max(5, Math.min(95, data[i - 1] + r)));
    }
    return data;
}

function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
    const W = 68, H = 28;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * (H - 4) - 2;
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <polyline
                points={pts}
                fill="none"
                stroke={isUp ? "var(--green)" : "var(--red)"}
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

// ─── Market Row ─────────────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
    SPY: "📊", AAPL: "🍎", MSFT: "🪟", GOOGL: "🔍",
    AMZN: "📦", TSLA: "⚡", "BTC-USD": "₿", "ETH-USD": "🔷",
    "BC.TO": "🏦", GLD: "🥇", QQQ: "🚀",
};

function formatCOP(usdPrice: number, trm: number): string {
    const cop = Math.round(usdPrice * trm);
    if (cop >= 1_000_000_000) return `$${(cop / 1_000_000_000).toFixed(2)}B`;
    if (cop >= 1_000_000) return `$${(cop / 1_000_000).toFixed(1)}M`;
    return `$${cop.toLocaleString("es-CO")}`;
}

function MarketRow({
    asset,
    trm,
    isLast,
    onClick,
}: {
    asset: Asset;
    trm: number;
    isLast: boolean;
    onClick: () => void;
}) {
    const isUp = asset.change_pct >= 0;
    const [spark] = useState(() => generateSparkline(asset.change_pct));
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 20px",
                borderBottom: isLast ? "none" : "1px solid var(--border)",
                background: hovered ? "var(--bg-card-hover)" : "transparent",
                cursor: "pointer",
                transition: "background 0.15s ease",
            }}
        >
            {/* Icon bubble */}
            <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: "var(--bg-secondary)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 19,
            }}>
                {ICONS[asset.ticker] || "📈"}
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {asset.ticker}
                </div>
                <div style={{
                    fontSize: 11, color: "var(--text-muted)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {asset.name}
                </div>
            </div>

            {/* Sparkline */}
            <div style={{ flexShrink: 0 }}>
                <Sparkline data={spark} isUp={isUp} />
            </div>

            {/* Price + pct */}
            <div style={{ textAlign: "right", flexShrink: 0, minWidth: 82 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {formatCOP(asset.price, trm)}
                </div>
                <div style={{
                    fontSize: 11, fontWeight: 600, marginTop: 1,
                    color: isUp ? "var(--green)" : "var(--red)",
                }}>
                    {isUp ? "▲" : "▼"} {Math.abs(asset.change_pct).toFixed(2)}%
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton rows ───────────────────────────────────────────────────────────────
function SkeletonRow({ isLast }: { isLast?: boolean }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "13px 20px",
            borderBottom: isLast ? "none" : "1px solid var(--border)",
        }}>
            <div className="loading-shimmer" style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div className="loading-shimmer" style={{ height: 12, width: "40%", borderRadius: 4, marginBottom: 6 }} />
                <div className="loading-shimmer" style={{ height: 10, width: "60%", borderRadius: 4 }} />
            </div>
            <div className="loading-shimmer" style={{ width: 68, height: 28, borderRadius: 4 }} />
            <div style={{ textAlign: "right", minWidth: 82 }}>
                <div className="loading-shimmer" style={{ height: 12, width: 60, borderRadius: 4, marginBottom: 6, marginLeft: "auto" }} />
                <div className="loading-shimmer" style={{ height: 10, width: 40, borderRadius: 4, marginLeft: "auto" }} />
            </div>
        </div>
    );
}

// ─── Profile config ──────────────────────────────────────────────────────────────
const PROFILE_CONFIG: Record<string, {
    projection: string;
    portfolio: string;
    subtitle: string;
    featured: string[];
}> = {
    Conservador: {
        projection: "+5.2% E.A.",
        portfolio: "$1.580.000",
        subtitle: "Valor estimado · perfil conservador",
        featured: ["GLD", "SPY", "BTC-USD", "BC.TO"],
    },
    Moderado: {
        projection: "+9.0% E.A.",
        portfolio: "$2.180.000",
        subtitle: "Valor estimado · perfil moderado",
        featured: ["SPY", "AAPL", "BTC-USD", "BC.TO"],
    },
    Agresivo: {
        projection: "+14.5% E.A.",
        portfolio: "$3.240.000",
        subtitle: "Valor estimado · perfil agresivo",
        featured: ["TSLA", "AAPL", "BTC-USD", "ETH-USD"],
    },
};

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
}

function formatDate() {
    return new Date().toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long",
    });
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [trm, setTrm] = useState(3588);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Inversor");
    const [profile, setProfile] = useState("Moderado");
    const [ctaHover, setCtaHover] = useState(false);

    useEffect(() => {
        const name =
            localStorage.getItem("investi_name") ||
            sessionStorage.getItem("userName") ||
            "Inversor";
        const prof =
            localStorage.getItem("investi_profile") ||
            sessionStorage.getItem("profile") ||
            "Moderado";
        setUserName(name);
        setProfile(prof);

        Promise.all([
            fetch(`${API}/api/trm`).then(r => r.json()).catch(() => ({ trm: 3588 })),
            fetch(`${API}/api/market/top`).then(r => r.json()).catch(() => ({ assets: [] })),
        ]).then(([trmData, marketData]) => {
            if (trmData?.trm) setTrm(trmData.trm);
            setAssets(marketData?.assets || []);
        }).finally(() => setLoading(false));
    }, []);

    const cfg = PROFILE_CONFIG[profile] || PROFILE_CONFIG.Moderado;

    // Pick the 4 featured assets for this profile; fallback to first 4
    const displayAssets: Asset[] = loading
        ? []
        : (() => {
            const picked = cfg.featured
                .map(t => assets.find(a => a.ticker === t))
                .filter(Boolean) as Asset[];
            return picked.length >= 2 ? picked.slice(0, 4) : assets.slice(0, 4);
        })();

    return (
        <div style={{ padding: "20px 16px 88px", maxWidth: 860, margin: "0 auto" }}>

            {/* ── Greeting ── */}
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>
                    {getGreeting()}, {userName} 👋
                </h1>
                <p style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "capitalize" }}>
                    {formatDate()}
                </p>
            </div>

            {/* ── Tu Resumen Norte ── */}
            <div
                className="glass-card animate-fade-in"
                style={{ padding: "24px 22px", marginBottom: 14, position: "relative", overflow: "hidden" }}
            >
                {/* Background glow blob */}
                <div style={{
                    position: "absolute", top: -80, right: -80,
                    width: 220, height: 220, borderRadius: "50%",
                    background: "var(--accent-glow)", pointerEvents: "none",
                }} />

                {/* Top row: value + projection pill */}
                <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", marginBottom: 18, gap: 12,
                }}>
                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                            letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6,
                        }}>
                            Tu Resumen Norte
                        </div>
                        <div style={{
                            fontSize: 34, fontWeight: 800, color: "var(--text-primary)",
                            letterSpacing: "-0.02em", lineHeight: 1,
                        }}>
                            {cfg.portfolio}
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginLeft: 6 }}>
                                COP
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                            {cfg.subtitle}
                        </div>
                    </div>

                    {/* Projection badge */}
                    <div style={{
                        flexShrink: 0,
                        background: "var(--green-bg)",
                        border: "1px solid rgba(34,211,160,0.2)",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 14px",
                        textAlign: "center",
                    }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--green)", letterSpacing: "-0.01em" }}>
                            {cfg.projection}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, fontWeight: 600 }}>
                            PROYECCIÓN
                        </div>
                    </div>
                </div>

                {/* Mis Inversiones pill */}
                <div
                    onClick={() => router.push("/chat?q=¿Cómo va mi portafolio?")}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "var(--bg-secondary)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)", padding: "8px 14px",
                        cursor: "pointer", transition: "border-color 0.2s ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                    <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--accent)",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        Mis Inversiones · Perfil {profile}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="var(--text-muted)" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>

            {/* ── Mercados en Vivo ── */}
            <div className="glass-card animate-fade-in" style={{ marginBottom: 14, overflow: "hidden" }}>
                {/* Card header */}
                <div style={{
                    padding: "14px 20px 12px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        Mercados en Vivo
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "var(--green)", animation: "pulse-dot 2s infinite",
                        }} />
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            TRM ${trm.toLocaleString("es-CO")}
                        </span>
                    </div>
                </div>

                {/* Rows */}
                {loading
                    ? [0, 1, 2, 3].map(i => <SkeletonRow key={i} isLast={i === 3} />)
                    : displayAssets.map((asset, idx) => (
                        <MarketRow
                            key={asset.ticker}
                            asset={asset}
                            trm={trm}
                            isLast={idx === displayAssets.length - 1}
                            onClick={() => router.push(
                                `/chat?q=${encodeURIComponent(`Analiza ${asset.name || asset.ticker}`)}`
                            )}
                        />
                    ))
                }
            </div>

            {/* ── Nueva Simulación CTA ── */}
            <button
                onClick={() => router.push("/chat")}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
                style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "20px 22px",
                    background: ctaHover
                        ? "var(--bg-card-hover)"
                        : "var(--bg-card)",
                    border: `1px solid ${ctaHover ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)",
                    boxShadow: ctaHover
                        ? "var(--shadow-card), var(--shadow-glow)"
                        : "var(--shadow-card)",
                    cursor: "pointer",
                    textAlign: "left",
                    transform: ctaHover ? "translateY(-2px)" : "translateY(0)",
                    transition: "all 0.25s ease",
                }}
            >
                {/* Icon */}
                <div style={{
                    width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                    background: "var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                    boxShadow: "0 4px 16px rgba(79,126,248,0.35)",
                }}>
                    💬
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontSize: 16, fontWeight: 700,
                        color: "var(--text-primary)", marginBottom: 3,
                    }}>
                        Nueva Simulación con Santi
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Analiza activos, simula inversiones y recibe asesoría personalizada
                    </div>
                </div>

                {/* Arrow */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="var(--accent)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
            </button>

        </div>
    );
}
