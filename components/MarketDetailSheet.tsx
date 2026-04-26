"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://investi-backend-75t5.onrender.com";

interface ChartPoint { date: string; price: number; }

interface AssetDetail {
    ticker: string;
    name: string;
    price: number;
    change: number;
    change_pct: number;
    prev_close: number;
    day_high: number;
    day_low: number;
    volume: number;
    market_cap: number;
    chart: ChartPoint[];
}

const ASSET_ICONS: Record<string, string> = {
    AAPL: "🍎", MSFT: "🪟", NVDA: "💚", GOOGL: "🔍", AMZN: "📦",
    TSLA: "⚡", META: "🔵", "BC.TO": "🏦",
    SPY: "📊", QQQ: "🚀", GLD: "🥇", VTI: "🌎",
    "BTC-USD": "₿", "ETH-USD": "🔷", "SOL-USD": "◎",
    "GC=F": "🥇", "CL=F": "🛢️", "SI=F": "🥈",
};

function AreaChart({ data, isUp }: { data: ChartPoint[]; isUp: boolean }) {
    if (!data || data.length < 2) return null;
    const W = 320, H = 100;
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const pT = 8, pB = 22, pL = 4, pR = 4;
    const cW = W - pL - pR;
    const cH = H - pT - pB;

    const toX = (i: number) => pL + (i / (data.length - 1)) * cW;
    const toY = (p: number) => pT + cH - ((p - min) / range) * cH;

    const linePoints = data.map((d, i) => `${toX(i).toFixed(1)},${toY(d.price).toFixed(1)}`).join(" ");
    const areaPath = `M ${toX(0)},${toY(data[0].price)} L ${linePoints.replace(/ /g, " L ")} L ${toX(data.length - 1)},${H - pB} L ${toX(0)},${H - pB} Z`;

    const color = isUp ? "#22d3a0" : "#f0516a";
    const gradId = `detail-grad-${isUp ? "up" : "dn"}`;

    const labelIdxs = [0, Math.floor((data.length - 1) / 2), data.length - 1];

    return (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2"
                strokeLinejoin="round" strokeLinecap="round" />
            {labelIdxs.map((idx, pos) => (
                <text key={idx} x={toX(idx)} y={H - 5}
                    fill="#8b93b0" fontSize="9"
                    textAnchor={pos === 0 ? "start" : pos === 2 ? "end" : "middle"}>
                    {data[idx].date}
                </text>
            ))}
        </svg>
    );
}

export default function MarketDetailSheet({ ticker, trm, onClose }: {
    ticker: string;
    trm: number;
    onClose: () => void;
}) {
    const router = useRouter();
    const [detail, setDetail] = useState<AssetDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(false);
        setDetail(null);
        fetch(`${API}/api/market/${encodeURIComponent(ticker)}/detail`)
            .then(r => r.json())
            .then(data => {
                if (data.error || data.detail) setError(true);
                else setDetail(data);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [ticker]);

    const isUp = detail ? detail.change >= 0 : true;
    const color = isUp ? "var(--green)" : "var(--red)";
    const colorBg = isUp ? "var(--green-bg)" : "var(--red-bg)";

    const fmtPrice = (n: number) =>
        n >= 100
            ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toFixed(4);
    const fmtVol = (n: number) =>
        n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)}B`
            : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
                : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K`
                    : n.toString();
    const fmtCap = (n: number) => {
        if (!n) return "N/D";
        if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
        if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
        if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
        return `$${n.toLocaleString()}`;
    };

    const copPrice = detail ? Math.round(detail.price * trm) : 0;
    const copStr = copPrice >= 1_000_000_000
        ? `$${(copPrice / 1_000_000_000).toFixed(2)}B`
        : copPrice >= 1_000_000
            ? `$${(copPrice / 1_000_000).toFixed(2)}M`
            : `$${copPrice.toLocaleString("es-CO")}`;

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 900,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(8px)",
                display: "flex", alignItems: "flex-end",
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "100%", maxWidth: 640, margin: "0 auto",
                    background: "var(--bg-secondary)",
                    borderRadius: "24px 24px 0 0",
                    maxHeight: "92vh", overflowY: "auto",
                    animation: "slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
                    paddingBottom: "max(28px, env(safe-area-inset-bottom, 16px))",
                }}
            >
                {/* Drag handle */}
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-bright)" }} />
                </div>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: "var(--bg-card)", border: "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                        }}>
                            {ASSET_ICONS[ticker] || "📈"}
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                                {detail?.name || ticker}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
                                {ticker}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "transparent", cursor: "pointer",
                            color: "var(--text-muted)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{ padding: "48px 20px", textAlign: "center" }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"
                            style={{ animation: "spin 0.8s linear infinite", margin: "0 auto" }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>Cargando datos...</div>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div style={{ padding: "48px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
                        <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
                            No se pudieron cargar los datos de {ticker}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            El mercado puede estar cerrado o el ticker no existe
                        </div>
                    </div>
                )}

                {/* Detail content */}
                {detail && !loading && (
                    <div style={{ padding: "20px 20px 0", animation: "fadeIn 0.3s ease" }}>

                        {/* Price + change */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.1 }}>
                                ${fmtPrice(detail.price)}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
                                <div style={{
                                    padding: "4px 12px", borderRadius: 99,
                                    background: colorBg, color, fontSize: 13, fontWeight: 700,
                                }}>
                                    {isUp ? "▲" : "▼"} {Math.abs(detail.change_pct).toFixed(2)}%
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                    {isUp ? "+" : ""}{detail.change.toFixed(4)} hoy
                                </div>
                            </div>
                        </div>

                        {/* 7-day area chart */}
                        <div style={{
                            background: "var(--bg-card)", borderRadius: "var(--radius-md)",
                            padding: "14px 14px 6px", marginBottom: 14,
                            border: "1px solid var(--border)",
                        }}>
                            <div style={{
                                fontSize: 10, color: "var(--text-muted)", marginBottom: 10,
                                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em",
                            }}>
                                Últimos 7 días
                            </div>
                            <AreaChart data={detail.chart} isUp={isUp} />
                        </div>

                        {/* Stats 2×2 grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                            {[
                                { label: "Rango del Día", value: `$${detail.day_low.toFixed(2)} – $${detail.day_high.toFixed(2)}` },
                                { label: "Cierre Anterior", value: `$${fmtPrice(detail.prev_close)}` },
                                { label: "Volumen", value: fmtVol(detail.volume) },
                                { label: "Cap. Mercado", value: fmtCap(detail.market_cap) },
                            ].map(stat => (
                                <div key={stat.label} style={{
                                    background: "var(--bg-card)", borderRadius: "var(--radius-sm)",
                                    border: "1px solid var(--border)", padding: "12px 14px",
                                }}>
                                    <div style={{
                                        fontSize: 10, color: "var(--text-muted)", fontWeight: 700,
                                        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5,
                                    }}>
                                        {stat.label}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* COP conversion banner */}
                        <div style={{
                            background: "linear-gradient(135deg, rgba(79,126,248,0.08), rgba(124,92,228,0.08))",
                            border: "1px solid rgba(79,126,248,0.2)",
                            borderRadius: "var(--radius-md)", padding: "14px 18px", marginBottom: 16,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <div>
                                <div style={{
                                    fontSize: 10, color: "var(--text-muted)", fontWeight: 700,
                                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3,
                                }}>
                                    Equivalente en Pesos
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)" }}>
                                    {copStr} COP
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>TRM</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                                    ${trm.toLocaleString("es-CO")}
                                </div>
                            </div>
                        </div>

                        {/* CTA button */}
                        <button
                            className="btn-primary"
                            style={{
                                width: "100%", padding: "14px 20px", fontSize: 15,
                                borderRadius: "var(--radius-md)", marginBottom: 8,
                                justifyContent: "center",
                            }}
                            onClick={() => {
                                onClose();
                                router.push(`/chat?q=${encodeURIComponent(`Analiza ${detail.name} (${ticker})`)}`);
                            }}
                        >
                            💬 Analizar con Santi AI
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
