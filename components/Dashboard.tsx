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

// Generate a fake but realistic sparkline based on change direction
function generateSparkline(change_pct: number, points = 20): number[] {
    const trend = change_pct / 100;
    const data: number[] = [50];
    for (let i = 1; i < points; i++) {
        const random = (Math.random() - 0.48) * 4;
        const trendBias = trend * 3;
        data.push(Math.max(10, Math.min(90, data[i - 1] + random + trendBias)));
    }
    return data;
}

function Sparkline({ data, isUp, id }: { data: number[]; isUp: boolean; id: string }) {
    const width = 200;
    const height = 36;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(" ");
    const color = isUp ? "#00d4a0" : "#ff6b6b";
    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

function AssetCard({ asset }: { asset: Asset }) {
    const isUp = asset.change_pct >= 0;
    const [sparkline] = useState(() => generateSparkline(asset.change_pct));

    return (
        <div className="glass-card" style={{ padding: "16px 18px", cursor: "default" }}>
            {/* Top row: ticker + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{asset.ticker}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{asset.name}</div>
                </div>
                <span className={`badge badge-${asset.category === "Cripto" ? "gold" : asset.category === "ETFs" ? "green" : "blue"}`} style={{ fontSize: 10 }}>
                    {asset.category}
                </span>
            </div>
            {/* Price + change */}
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isUp ? "var(--green)" : "var(--red)", marginTop: 2 }}>
                    {isUp ? "▲" : "▼"} {Math.abs(asset.change_pct).toFixed(2)}%
                    <span style={{ fontWeight: 400, marginLeft: 4, color: "var(--text-muted)" }}>
                        ({isUp ? "+" : ""}{asset.change.toFixed(2)})
                    </span>
                </div>
            </div>
            {/* Sparkline full width */}
            <div style={{ width: "100%" }}>
                <Sparkline data={sparkline} isUp={isUp} id={asset.ticker} />
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="glass-card loading-shimmer" style={{ padding: "18px 20px", height: 110 }} />
    );
}

// Market summary bar
function MarketSummary({ assets }: { assets: Asset[] }) {
    if (assets.length === 0) return null;
    const gainers = assets.filter(a => a.change_pct > 0).length;
    const losers = assets.filter(a => a.change_pct < 0).length;
    const avgChange = assets.reduce((sum, a) => sum + a.change_pct, 0) / assets.length;
    const isPositive = avgChange >= 0;

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 28,
        }}>
            {[
                { label: "Tendencia general", value: `${isPositive ? "+" : ""}${avgChange.toFixed(2)}%`, color: isPositive ? "var(--green)" : "var(--red)", emoji: isPositive ? "📈" : "📉" },
                { label: "Activos al alza", value: `${gainers} de ${assets.length}`, color: "var(--green)", emoji: "🟢" },
                { label: "Activos a la baja", value: `${losers} de ${assets.length}`, color: "var(--red)", emoji: "🔴" },
            ].map((stat, i) => (
                <div key={i} className="glass-card" style={{ padding: "14px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.emoji}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                </div>
            ))}
        </div>
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
        const interval = setInterval(fetchAssets, 30000);
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

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Buenos días";
        if (h < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    return (
        <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
                        {getGreeting()}, {userName} 👋
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                        Mercados en tiempo real · Actualización automática cada 30s
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className={`badge ${profileColors[profile] || "badge-blue"}`}>
                        Perfil: {profile}
                    </span>
                    <button onClick={fetchAssets} className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }}>
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

            {/* Market Summary */}
            {!loading && <MarketSummary assets={assets} />}

            {/* Stocks */}
            <section style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span className="tag">📊 Acciones</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                    {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : stocks.map(a => <AssetCard key={a.ticker} asset={a} />)}
                </div>
            </section>

            {/* Crypto */}
            <section style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span className="tag">₿ Criptodivisas</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                    {loading ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />) : crypto.map(a => <AssetCard key={a.ticker} asset={a} />)}
                </div>
            </section>

            {/* ETFs */}
            {(loading || etfs.length > 0) && (
                <section style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span className="tag">📦 ETFs</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                        {loading ? <SkeletonCard /> : etfs.map(a => <AssetCard key={a.ticker} asset={a} />)}
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
                                display: "block", padding: "16px",
                                background: "var(--bg-secondary)", border: "1px solid var(--border)",
                                borderRadius: "var(--radius-md)", textDecoration: "none", transition: "all 0.2s ease",
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

