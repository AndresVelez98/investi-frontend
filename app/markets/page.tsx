"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import BottomNav from "../../components/BottomNav";

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

interface SearchResult {
    ticker: string;
    name: string;
    price: string;
    change: string;
    change_percent: string;
}

type Category = "Todos" | "Acciones" | "ETFs" | "Cripto" | "Materias Primas";

const CATEGORIES: Category[] = ["Todos", "Acciones", "ETFs", "Cripto", "Materias Primas"];

const CATEGORY_ICONS: Record<string, string> = {
    Todos: "🌐", Acciones: "📈", ETFs: "📦", Cripto: "₿", "Materias Primas": "🪨",
};

const ASSET_ICONS: Record<string, string> = {
    AAPL: "🍎", MSFT: "🪟", NVDA: "💚", GOOGL: "🔍", AMZN: "📦",
    TSLA: "⚡", META: "🔵", "BC.TO": "🏦",
    SPY: "📊", QQQ: "🚀", GLD: "🥇", VTI: "🌎",
    "BTC-USD": "₿", "ETH-USD": "🔷", "SOL-USD": "◎",
    "GC=F": "🥇", "CL=F": "🛢️", "SI=F": "🥈",
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
function generateSparkline(change_pct: number, points = 14): number[] {
    const data: number[] = [50];
    for (let i = 1; i < points; i++) {
        const r = (Math.random() - 0.47) * 5 + (change_pct / 100) * 5;
        data.push(Math.max(5, Math.min(95, data[i - 1] + r)));
    }
    return data;
}

function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
    const W = 60, H = 24;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * (H - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
            <polyline points={pts} fill="none"
                stroke={isUp ? "var(--green)" : "var(--red)"}
                strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ─── Asset Row ────────────────────────────────────────────────────────────────
function AssetRow({ asset, trm, isLast, onClick }: {
    asset: Asset; trm: number; isLast: boolean; onClick: () => void;
}) {
    const isUp = asset.change_pct >= 0;
    const [spark] = useState(() => generateSparkline(asset.change_pct));
    const [hov, setHov] = useState(false);
    const copPrice = Math.round(asset.price * trm);
    const copStr = copPrice >= 1_000_000
        ? `$${(copPrice / 1_000_000).toFixed(1)}M`
        : `$${copPrice.toLocaleString("es-CO")}`;

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 18px",
                borderBottom: isLast ? "none" : "1px solid var(--border)",
                background: hov ? "var(--bg-card-hover)" : "transparent",
                cursor: "pointer", transition: "background 0.15s ease",
            }}
        >
            {/* Icon */}
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "var(--bg-secondary)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
                {ASSET_ICONS[asset.ticker] || "📈"}
            </div>

            {/* Name + ticker */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {asset.ticker}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {asset.name}
                </div>
            </div>

            {/* Sparkline */}
            <div style={{ flexShrink: 0 }}>
                <Sparkline data={spark} isUp={isUp} />
            </div>

            {/* Prices + change */}
            <div style={{ textAlign: "right", flexShrink: 0, minWidth: 88 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                    {copStr} COP
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isUp ? "var(--green)" : "var(--red)", marginTop: 1 }}>
                    {isUp ? "▲" : "▼"} {Math.abs(asset.change_pct).toFixed(2)}%
                </div>
            </div>
        </div>
    );
}

function SkeletonRow({ isLast }: { isLast?: boolean }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
            <div className="loading-shimmer" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div className="loading-shimmer" style={{ height: 11, width: "35%", borderRadius: 3, marginBottom: 5 }} />
                <div className="loading-shimmer" style={{ height: 10, width: "55%", borderRadius: 3 }} />
            </div>
            <div className="loading-shimmer" style={{ width: 60, height: 24, borderRadius: 3 }} />
            <div style={{ minWidth: 88, textAlign: "right" }}>
                <div className="loading-shimmer" style={{ height: 11, width: 60, borderRadius: 3, marginBottom: 4, marginLeft: "auto" }} />
                <div className="loading-shimmer" style={{ height: 10, width: 50, borderRadius: 3, marginLeft: "auto" }} />
            </div>
        </div>
    );
}

// ─── Search Bottom Sheet ──────────────────────────────────────────────────────
function SearchSheet({ trm, onClose }: { trm: number; onClose: () => void }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 80);
    }, []);

    const search = useCallback(async (q?: string) => {
        const term = (q || query).trim();
        if (!term) return;
        setLoading(true);
        setResult(null);
        setNotFound(false);
        try {
            const res = await fetch(`${API}/api/market/search?q=${encodeURIComponent(term)}`);
            const data = await res.json();
            if (data.results?.length > 0) setResult(data.results[0]);
            else setNotFound(true);
        } catch { setNotFound(true); }
        finally { setLoading(false); }
    }, [query]);

    const priceNum = result ? parseFloat(result.price.replace(/,/g, "")) : 0;
    const isUp = result ? !result.change.startsWith("-") : true;

    const SUGGESTED = ["NVDA", "META", "SOL-USD", "QQQ", "GC=F", "CL=F", "VTI"];

    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 800,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "flex-end",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%", maxWidth: 640, margin: "0 auto",
                    background: "var(--bg-secondary)",
                    borderRadius: "20px 20px 0 0",
                    padding: "20px 20px max(28px, env(safe-area-inset-bottom, 16px))",
                    maxHeight: "88vh", overflowY: "auto",
                    animation: "fadeIn 0.22s ease",
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border-bright)", margin: "0 auto 18px" }} />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                        Explorar Mercados
                    </h2>
                    <button onClick={onClose} style={{
                        width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)",
                        background: "transparent", cursor: "pointer", color: "var(--text-muted)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Search input */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    <input
                        ref={inputRef}
                        className="input-field"
                        placeholder="Ticker o nombre: NVDA, Bitcoin, Petróleo..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && search()}
                        style={{ fontSize: 14 }}
                    />
                    <button
                        className="btn-primary"
                        onClick={() => search()}
                        disabled={loading || !query.trim()}
                        style={{ flexShrink: 0, padding: "0 16px" }}
                    >
                        {loading ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Result card */}
                {result && (
                    <div className="glass-card animate-fade-in" style={{ padding: "16px 18px", marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                                    {result.ticker}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                                    {result.name}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                                    ${result.price}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: isUp ? "var(--green)" : "var(--red)", marginTop: 2 }}>
                                    {result.change} ({result.change_percent})
                                </div>
                                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                    ≈ ${Math.round(priceNum * trm).toLocaleString("es-CO")} COP
                                </div>
                            </div>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ width: "100%", padding: "10px", fontSize: 14 }}
                            onClick={() => {
                                onClose();
                                router.push(`/chat?q=${encodeURIComponent(`Analiza ${result.name || result.ticker}`)}`);
                            }}
                        >
                            💬 Analizar con Santi
                        </button>
                    </div>
                )}

                {notFound && (
                    <div className="glass-card" style={{ padding: "16px 18px", textAlign: "center", marginBottom: 16 }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                            No se encontró "<strong>{query}</strong>"
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                            Usa el ticker exacto: AAPL, TSLA, BTC-USD
                        </div>
                    </div>
                )}

                {/* Suggested tickers */}
                {!result && (
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
                            Búsquedas populares
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {SUGGESTED.map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setQuery(t); search(t); }}
                                    style={{
                                        padding: "6px 14px", borderRadius: 20,
                                        border: "1px solid var(--border-bright)",
                                        background: "var(--bg-card)",
                                        color: "var(--text-secondary)", fontSize: 12,
                                        cursor: "pointer", fontWeight: 500,
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketsPage() {
    const router = useRouter();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [trm, setTrm] = useState(3588);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedCat, setSelectedCat] = useState<Category>("Todos");
    const [showSearch, setShowSearch] = useState(false);
    const pillsRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        try {
            const [marketRes, trmRes] = await Promise.all([
                fetch(`${API}/api/market/top`).then(r => r.json()),
                fetch(`${API}/api/trm`).then(r => r.json()).catch(() => ({ trm: 3588 })),
            ]);
            setAssets(marketRes.assets || []);
            if (trmRes?.trm > 1000) setTrm(trmRes.trm);
            setLastUpdated(new Date());
        } catch { /* keep stale data */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const filtered = selectedCat === "Todos"
        ? assets
        : assets.filter(a => a.category === selectedCat);

    const categoryCounts: Record<string, number> = { Todos: assets.length };
    assets.forEach(a => { categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1; });

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ overflowX: "hidden" }}>
                <div style={{ padding: "20px 16px 88px", maxWidth: 860, margin: "0 auto" }}>

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 2 }}>
                                Mercados 🌐
                            </h1>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulse-dot 2s infinite" }} />
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    TRM ${trm.toLocaleString("es-CO")} · {lastUpdated ? `Act. ${lastUpdated.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}` : "Cargando..."}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={fetchData}
                            className="btn-ghost"
                            style={{ padding: "7px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            Actualizar
                        </button>
                    </div>

                    {/* Category pills */}
                    <div
                        ref={pillsRef}
                        style={{
                            display: "flex", gap: 8,
                            overflowX: "auto", scrollbarWidth: "none",
                            marginBottom: 16, paddingBottom: 4,
                            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 6px, black 94%, transparent 100%)",
                        }}
                    >
                        {CATEGORIES.map(cat => {
                            const active = selectedCat === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCat(cat)}
                                    style={{
                                        flexShrink: 0,
                                        padding: "7px 14px",
                                        borderRadius: 99,
                                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                                        background: active ? "var(--accent-glow)" : "var(--bg-card)",
                                        color: active ? "var(--accent)" : "var(--text-secondary)",
                                        fontSize: 13, fontWeight: active ? 700 : 500,
                                        cursor: "pointer", transition: "all 0.15s ease",
                                        display: "flex", alignItems: "center", gap: 5,
                                    }}
                                >
                                    <span>{CATEGORY_ICONS[cat]}</span>
                                    <span>{cat}</span>
                                    {!loading && categoryCounts[cat] !== undefined && (
                                        <span style={{
                                            fontSize: 10, fontWeight: 700,
                                            color: active ? "var(--accent)" : "var(--text-muted)",
                                            background: active ? "rgba(79,126,248,0.15)" : "var(--bg-secondary)",
                                            padding: "1px 6px", borderRadius: 99,
                                        }}>
                                            {categoryCounts[cat]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Asset list */}
                    <div className="glass-card" style={{ overflow: "hidden", marginBottom: 14 }}>
                        {loading
                            ? [0, 1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} isLast={i === 5} />)
                            : filtered.length === 0
                                ? (
                                    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                                        Sin activos para "{selectedCat}"
                                    </div>
                                )
                                : filtered.map((asset, idx) => (
                                    <AssetRow
                                        key={asset.ticker}
                                        asset={asset}
                                        trm={trm}
                                        isLast={idx === filtered.length - 1}
                                        onClick={() => router.push(`/chat?q=${encodeURIComponent(`Analiza ${asset.name}`)}`)}
                                    />
                                ))
                        }
                    </div>

                    {/* Explore more CTA */}
                    <button
                        onClick={() => setShowSearch(true)}
                        style={{
                            width: "100%", padding: "16px 20px",
                            background: "var(--bg-card)",
                            border: "1.5px dashed var(--border-bright)",
                            borderRadius: "var(--radius-lg)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            cursor: "pointer", color: "var(--text-secondary)",
                            fontSize: 14, fontWeight: 600,
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-card)"; }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        Explorar más mercados
                    </button>
                </div>
            </main>

            {/* Search bottom sheet */}
            {showSearch && <SearchSheet trm={trm} onClose={() => setShowSearch(false)} />}

            <BottomNav />
        </div>
    );
}
