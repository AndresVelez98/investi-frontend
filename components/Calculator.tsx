"use client";
import { useState } from "react";

const POPULAR_TICKERS = [
    { ticker: "AAPL", label: "Apple" },
    { ticker: "TSLA", label: "Tesla" },
    { ticker: "GOOGL", label: "Google" },
    { ticker: "BTC-USD", label: "Bitcoin" },
    { ticker: "ETH-USD", label: "Ethereum" },
    { ticker: "SPY", label: "S&P 500" },
    { ticker: "NVDA", label: "NVIDIA" },
    { ticker: "MSFT", label: "Microsoft" },
];

interface Projection {
    ticker: string;
    asset_name: string;
    initial_amount: number;
    final_value: number;
    total_gain: number;
    total_gain_pct: number;
    annualized_return_pct: number;
    avg_monthly_return_pct: number;
    monthly_breakdown: { month: number; value: number; gain: number; gain_pct: number }[];
    data_period: string;
    disclaimer: string;
}

function MiniChart({ data }: { data: number[] }) {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const W = 280, H = 60;
    const isUp = data[data.length - 1] >= data[0];

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * H * 0.85 - H * 0.05;
        return `${x},${y}`;
    }).join(" ");

    const fillPoints = `0,${H} ${points} ${W},${H}`;
    const color = isUp ? "#22d3a0" : "#f0516a";
    const fillColor = isUp ? "rgba(34,211,160,0.1)" : "rgba(240,81,106,0.1)";

    return (
        <svg width={W} height={H} style={{ overflow: "visible" }}>
            <polygon points={fillPoints} fill={fillColor} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

export default function Calculator() {
    const [ticker, setTicker] = useState("AAPL");
    const [amount, setAmount] = useState("1000");
    const [months, setMonths] = useState(24);
    const [result, setResult] = useState<Projection | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const calculate = async () => {
        setError("");
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt < 10) { setError("El monto mínimo es $10."); return; }
        if (!ticker.trim()) { setError("Por favor ingresa un ticker."); return; }

        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("https://investi-backend-production.up.railway.app/api/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), amount: amt, months }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.detail || "Error al calcular."); return; }
            setResult(data);
        } catch {
            setError("No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.");
        } finally {
            setLoading(false);
        }
    };

    const isPositive = result ? result.total_gain >= 0 : true;
    const chartValues = result?.monthly_breakdown.map(m => m.value) || [];

    return (
        <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Calculadora de Inversión</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    Proyección basada en rendimientos históricos reales de los últimos 2 años.
                </p>
            </div>

            {/* Form Card */}
            <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
                {/* Ticker Input */}
                <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>
                        Activo (ticker)
                    </label>
                    <input
                        className="input-field"
                        value={ticker}
                        onChange={e => setTicker(e.target.value.toUpperCase())}
                        placeholder="Ej: AAPL, BTC-USD, TSLA..."
                        style={{ marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {POPULAR_TICKERS.map(t => (
                            <button
                                key={t.ticker}
                                onClick={() => setTicker(t.ticker)}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 99,
                                    border: `1px solid ${ticker === t.ticker ? "var(--accent)" : "var(--border)"}`,
                                    background: ticker === t.ticker ? "var(--accent-glow)" : "transparent",
                                    color: ticker === t.ticker ? "var(--accent)" : "var(--text-muted)",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: ticker === t.ticker ? 600 : 400,
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount & Months */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                            Monto inicial (USD)
                        </label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>$</span>
                            <input
                                className="input-field"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                min="10"
                                style={{ paddingLeft: 28 }}
                            />
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Mínimo $10</p>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                            Plazo: <strong style={{ color: "var(--text-primary)" }}>{months} meses</strong>
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={48}
                            value={months}
                            onChange={e => setMonths(parseInt(e.target.value))}
                            style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                            <span>1 mes</span><span>24 meses</span><span>48 meses</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ padding: "10px 14px", background: "var(--red-bg)", border: "1px solid var(--red)", borderRadius: 8, color: "var(--red)", fontSize: 13, marginBottom: 16 }}>
                        {error}
                    </div>
                )}

                <button
                    className="btn-primary"
                    onClick={calculate}
                    disabled={loading}
                    style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 15 }}
                >
                    {loading ? "Calculando..." : "📊 Calcular Proyección"}
                </button>
            </div>

            {/* Results */}
            {result && (
                <div className="animate-fade-in">
                    {/* Summary Card */}
                    <div className="glass-card" style={{ padding: 28, marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>{result.asset_name}</h2>
                                    <span className="badge badge-blue">{result.ticker}</span>
                                </div>
                                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    Datos de: {result.data_period}
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: isPositive ? "var(--green)" : "var(--red)" }}>
                                    ${result.final_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>valor final estimado</div>
                            </div>
                        </div>

                        {/* Mini chart */}
                        <div style={{ margin: "20px 0", overflowX: "auto" }}>
                            <MiniChart data={chartValues} />
                        </div>

                        {/* Stats grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
                            {[
                                { label: "Inversión inicial", value: `$${result.initial_amount.toLocaleString("en-US")}` },
                                {
                                    label: "Ganancia total",
                                    value: `${isPositive ? "+" : ""}$${result.total_gain.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                    color: isPositive ? "var(--green)" : "var(--red)",
                                },
                                {
                                    label: "Rentabilidad total",
                                    value: `${isPositive ? "+" : ""}${result.total_gain_pct.toFixed(2)}%`,
                                    color: isPositive ? "var(--green)" : "var(--red)",
                                },
                                { label: "Retorno anualizado", value: `${result.annualized_return_pct.toFixed(2)}%` },
                                { label: "Retorno mensual prom.", value: `${result.avg_monthly_return_pct.toFixed(3)}%` },
                                { label: "Plazo", value: `${months} meses` },
                            ].map(stat => (
                                <div key={stat.label} style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 10 }}>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{stat.label}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: stat.color || "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div style={{ padding: "12px 16px", background: "var(--gold-bg)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "var(--radius-sm)" }}>
                        <p style={{ fontSize: 12, color: "var(--gold)", lineHeight: 1.5 }}>⚠️ {result.disclaimer}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
