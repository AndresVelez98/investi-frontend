"use client";
import { useEffect, useState } from "react";

interface Asset {
    ticker: string;
    name: string;
    category: string;
    price: number;
    change: number;
    change_pct: number;
    currency: string;
}

function AssetCard({ asset }: { asset: Asset }) {
    const isUp = asset.change_pct >= 0;
    return (
        <div className="glass-card" style={{ padding: "18px 20px", cursor: "default" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{asset.ticker}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{asset.name}</div>
                </div>
                <span className={`badge badge-${asset.category === "Cripto" ? "gold" : "blue"}`}>
                    {asset.category}
                </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isUp ? "var(--green)" : "var(--red)" }}>
                        {isUp ? "▲" : "▼"} {Math.abs(asset.change_pct).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 12, color: isUp ? "var(--green)" : "var(--red)" }}>
                        {isUp ? "+" : ""}{asset.change.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="glass-card loading-shimmer" style={{ padding: "18px 20px", height: 104 }} />
    );
}

export default function Dashboard() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [userName, setUserName] = useState("Inversor");
    const [profile, setProfile] = useState("Moderado");

    const fetchAssets = async () => {
        try {
            const res = await fetch("https://investi-backend-production.up.railway.app/api/market/top");
            const data = await res.json();
            setAssets(data.assets || []);
            setLastUpdated(new Date());
        } catch {
            // Keep stale data if refresh fails
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setUserName(sessionStorage.getItem("userName") || "Inversor");
        setProfile(sessionStorage.getItem("profile") || "Moderado");
        fetchAssets();
        const interval = setInterval(fetchAssets, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const stocks = assets.filter(a => a.category === "Acciones");
    const crypto = assets.filter(a => a.category === "Cripto");
    const etfs = assets.filter(a => a.category === "ETFs");

    const profileColors: Record<string, string> = {
        Conservador: "badge-green",
        Moderado: "badge-blue",
        Agresivo: "badge-gold",
    };

    return (
        <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
                        Buenos días, {userName} 👋
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Mercados en tiempo real · Actualización automática cada 30s
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={`badge ${profileColors[profile] || "badge-blue"}`}>
                        Perfil: {profile}
                    </span>
                    <button
                        onClick={fetchAssets}
                        className="btn-ghost"
                        style={{ padding: "8px 14px", fontSize: 13 }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Actualizar
                    </button>
                </div>
            </div>

            {lastUpdated && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
                    Última actualización: {lastUpdated.toLocaleTimeString("es-ES")}
                </p>
            )}

            {/* Stocks Section */}
            <section style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span className="tag">Acciones</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                        : stocks.map(a => <AssetCard key={a.ticker} asset={a} />)}
                </div>
            </section>

            {/* Crypto Section */}
            <section style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span className="tag">Criptodivisas</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {loading
                        ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
                        : crypto.map(a => <AssetCard key={a.ticker} asset={a} />)}
                </div>
            </section>

            {/* ETFs Section */}
            {(loading || etfs.length > 0) && (
                <section style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <span className="tag">ETFs</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                        {loading
                            ? <SkeletonCard />
                            : etfs.map(a => <AssetCard key={a.ticker} asset={a} />)}
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
                    ¿Qué quieres hacer hoy?
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {[
                        { href: "/chat", emoji: "💬", title: "Consultar IA", desc: "Pregunta sobre cualquier activo" },
                        { href: "/chat?mode=test", emoji: "🎯", title: "Test de Riesgo", desc: "Descubre tu perfil con IA" },
                        { href: "/calculator", emoji: "📊", title: "Calculadora", desc: "Proyecta tu inversión" },
                    ].map(action => (
                        <a
                            key={action.href}
                            href={action.href}
                            style={{
                                display: "block",
                                padding: "16px",
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                textDecoration: "none",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                                (e.currentTarget as HTMLElement).style.background = "var(--accent-glow)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                                (e.currentTarget as HTMLElement).style.background = "var(--bg-secondary)";
                            }}
                        >
                            <div style={{ fontSize: 24, marginBottom: 8 }}>{action.emoji}</div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>{action.title}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{action.desc}</div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
