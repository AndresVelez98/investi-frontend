"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ─── Theme Hook ───────────────────────────────────────────────────────────────

function useTheme() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const saved = localStorage.getItem("investi_theme") as "dark" | "light" | null;
        const initial = saved || "dark";
        setTheme(initial);
        document.documentElement.setAttribute("data-theme", initial);
    }, []);

    const toggle = useCallback(() => {
        setTheme(prev => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("investi_theme", next);
            document.documentElement.setAttribute("data-theme", next);
            return next;
        });
    }, []);

    return { theme, toggle };
}

const API = "https://investi-backend-75t5.onrender.com";
const TRM_FALLBACK = 3588;

type Profile = "Conservador" | "Moderado" | "Agresivo";

interface MarketData {
    name: string;
    price: string;
    change: string;
    change_percent: string;
    ticker?: string;
}

interface CalculatorData {
    amount_cop: number;
    amount_usd: number;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    marketData?: MarketData;
    calculatorData?: CalculatorData;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
    if (prices.length < 2) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 72, h = 26;
    const pts = prices.map((p, i) => {
        const x = ((i / (prices.length - 1)) * w).toFixed(1);
        const y = (h - ((p - min) / range) * (h - 4) - 2).toFixed(1);
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg width={w} height={h}>
            <polyline points={pts} fill="none" stroke={positive ? "#00b894" : "#d63031"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Market Widget ────────────────────────────────────────────────────────────

function MarketWidget({ data, trm = TRM_FALLBACK }: { data: MarketData; trm?: number }) {
    const [prices, setPrices] = useState<number[]>([]);
    const isPositive = !data.change?.startsWith("-");
    const priceNum = parseFloat((data.price || "0").replace(/,/g, ""));
    const priceCOP = isNaN(priceNum) ? null : Math.round(priceNum * trm).toLocaleString("es-CO");

    useEffect(() => {
        if (!data.ticker) return;
        fetch(`${API}/api/market/${data.ticker}/sparkline`)
            .then(r => r.json())
            .then(d => d.prices?.length > 1 && setPrices(d.prices))
            .catch(() => {});
    }, [data.ticker]);

    return (
        <div style={{ padding: "10px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-bright)", borderRadius: 10, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>{data.ticker}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.name}</div>
                {priceCOP && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>≈ ${priceCOP} COP</div>}
            </div>
            {prices.length > 1 && <Sparkline prices={prices} positive={isPositive} />}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>${data.price}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: isPositive ? "var(--green)" : "var(--red)" }}>
                    {data.change} ({data.change_percent})
                </div>
            </div>
        </div>
    );
}

// ─── Investment Calculator Card ───────────────────────────────────────────────

const ASSET_OPTIONS = [
    { label: "S&P 500 (SPY)", ticker: "SPY" },
    { label: "Bitcoin (BTC)", ticker: "BTC-USD" },
    { label: "Apple (AAPL)", ticker: "AAPL" },
    { label: "NVIDIA (NVDA)", ticker: "NVDA" },
    { label: "Tesla (TSLA)", ticker: "TSLA" },
    { label: "Ethereum (ETH)", ticker: "ETH-USD" },
    { label: "Microsoft (MSFT)", ticker: "MSFT" },
    { label: "Nasdaq 100 (QQQ)", ticker: "QQQ" },
];

function CalculatorWidget({ data, profile, trm = TRM_FALLBACK }: { data: CalculatorData; profile: Profile; trm?: number }) {
    const [ticker, setTicker] = useState("SPY");
    const [amountCOP, setAmountCOP] = useState(data.amount_cop || 500000);
    const [amountInput, setAmountInput] = useState((data.amount_cop || 500000).toLocaleString("es-CO"));
    const [months, setMonths] = useState(12);
    const [apiResult, setApiResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Call /api/calculate when ticker or amount changes (debounced 600ms)
    useEffect(() => {
        if (fetchTimer.current) clearTimeout(fetchTimer.current);
        fetchTimer.current = setTimeout(async () => {
            if (amountCOP < 1000) return;
            setLoading(true);
            try {
                const amountUSD = amountCOP / trm;
                const res = await fetch(`${API}/api/calculate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticker, amount: amountUSD, months: 48 }),
                });
                const json = await res.json();
                if (!json.error) setApiResult(json);
            } catch { /* ignore */ } finally { setLoading(false); }
        }, 600);
    }, [ticker, amountCOP]);

    // Derive display values from API result or fallback profile rates
    const FALLBACK_MONTHLY: Record<Profile, number> = { Conservador: 0.005, Moderado: 0.0083, Agresivo: 0.0125 };
    const fallbackRate = FALLBACK_MONTHLY[profile] || 0.0083;

    let displayValue: number;
    let displayGainPct: number;
    let chartPoints: number[];
    let avgMonthly: number;
    let dataPeriod = "";
    let assetName = ASSET_OPTIONS.find(a => a.ticker === ticker)?.label || ticker;

    if (apiResult?.monthly_breakdown?.length) {
        avgMonthly = apiResult.avg_monthly_return_pct / 100;
        const breakdown = apiResult.monthly_breakdown as { month: number; value: number }[];
        const atMonth = breakdown.find(b => b.month === months) || breakdown[breakdown.length - 1];
        const projectedUSD = atMonth.value;
        displayValue = Math.round(projectedUSD * trm);
        displayGainPct = ((projectedUSD - apiResult.initial_amount) / apiResult.initial_amount) * 100;
        chartPoints = breakdown.map(b => b.value * trm);
        dataPeriod = apiResult.data_period || "";
        assetName = apiResult.asset_name || assetName;
    } else {
        chartPoints = Array.from({ length: 48 }, (_, i) => amountCOP * Math.pow(1 + fallbackRate, i + 1));
        const projectedCOP = amountCOP * Math.pow(1 + fallbackRate, months);
        displayValue = Math.round(projectedCOP);
        displayGainPct = ((projectedCOP - amountCOP) / amountCOP) * 100;
        avgMonthly = fallbackRate;
    }

    const gain = displayValue - amountCOP;
    const displayUSD = Math.round(displayValue / trm);
    const positive = displayGainPct >= 0;

    // SVG area chart
    const W = 280, H = 64;
    const visiblePoints = chartPoints.slice(0, months);
    const allPts = [amountCOP, ...visiblePoints];
    const minV = Math.min(...allPts);
    const maxV = Math.max(...allPts);
    const rangeV = maxV - minV || 1;
    const toSVG = (v: number, i: number, total: number) => {
        const x = ((i / (total - 1)) * W).toFixed(1);
        const y = (H - 4 - ((v - minV) / rangeV) * (H - 12)).toFixed(1);
        return `${x},${y}`;
    };
    const linePts = allPts.map((v, i) => toSVG(v, i, allPts.length)).join(" ");
    const areaPath = `M 0,${H} ` + allPts.map((v, i) => toSVG(v, i, allPts.length)).join(" L ") + ` L ${W},${H} Z`;
    const lastX = W, lastY = parseFloat(toSVG(allPts[allPts.length - 1], allPts.length - 1, allPts.length).split(",")[1]);

    return (
        <div style={{
            background: "linear-gradient(145deg, rgba(26,26,62,0.95), rgba(15,17,23,0.98))",
            border: "1px solid rgba(162,155,254,0.25)",
            borderRadius: 14,
            padding: "16px",
            marginBottom: 10,
            minWidth: 0,
            backdropFilter: "blur(12px)",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a29bfe", display: "flex", alignItems: "center", gap: 6 }}>
                    📊 Simulador de Inversión
                </div>
                {loading && <div style={{ fontSize: 10, color: "#a29bfe", animation: "pulse-dot 1s infinite" }}>Calculando...</div>}
                {dataPeriod && !loading && <div style={{ fontSize: 9, color: "rgba(160,160,192,0.6)" }}>{dataPeriod}</div>}
            </div>

            {/* Controls row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {/* Amount */}
                <div>
                    <label style={{ fontSize: 9, color: "rgba(160,160,192,0.7)", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Monto (COP)
                    </label>
                    <input
                        value={amountInput}
                        onChange={e => {
                            const raw = e.target.value.replace(/\D/g, "");
                            const num = parseInt(raw) || 0;
                            setAmountCOP(num);
                            setAmountInput(num > 0 ? num.toLocaleString("es-CO") : "");
                        }}
                        onBlur={() => setAmountInput(amountCOP > 0 ? amountCOP.toLocaleString("es-CO") : "")}
                        placeholder="500.000"
                        style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(162,155,254,0.2)",
                            borderRadius: 7, color: "#fff", padding: "6px 9px", fontSize: 12,
                            fontWeight: 600, width: "100%", outline: "none", boxSizing: "border-box",
                        }}
                    />
                </div>
                {/* Asset */}
                <div>
                    <label style={{ fontSize: 9, color: "rgba(160,160,192,0.7)", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Activo
                    </label>
                    <select
                        value={ticker}
                        onChange={e => setTicker(e.target.value)}
                        style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(162,155,254,0.2)",
                            borderRadius: 7, color: "#fff", padding: "6px 9px", fontSize: 11,
                            width: "100%", outline: "none", cursor: "pointer",
                        }}
                    >
                        {ASSET_OPTIONS.map(a => <option key={a.ticker} value={a.ticker} style={{ background: "#16213e" }}>{a.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Area Chart */}
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", marginBottom: 4, overflow: "visible" }}>
                <defs>
                    <linearGradient id="calcArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={positive ? "#a29bfe" : "#f0516a"} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={positive ? "#a29bfe" : "#f0516a"} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#calcArea)" />
                <polyline points={linePts} fill="none" stroke={positive ? "#a29bfe" : "#f0516a"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={lastX} cy={lastY} r="3.5" fill={positive ? "#00b894" : "#f0516a"} />
            </svg>

            {/* Months slider */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: "rgba(160,160,192,0.6)", whiteSpace: "nowrap" }}>1m</span>
                <input
                    type="range" min={1} max={48} value={months}
                    onChange={e => setMonths(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "#a29bfe", cursor: "pointer", height: 3 }}
                />
                <span style={{ fontSize: 10, color: "rgba(160,160,192,0.6)", whiteSpace: "nowrap" }}>48m</span>
            </div>

            {/* Results */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <div style={{ fontSize: 9, color: "rgba(160,160,192,0.6)", marginBottom: 1 }}>Invertido</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>${amountCOP.toLocaleString("es-CO")}</div>
                    <div style={{ fontSize: 9, color: "rgba(160,160,192,0.5)" }}>≈ ${Math.round(amountCOP / trm).toLocaleString("en-US")} USD</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "rgba(160,160,192,0.6)" }}>en {months} meses</div>
                    <div style={{ fontSize: 11, color: "#a29bfe" }}>{assetName.split("(")[0].trim()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: "rgba(160,160,192,0.6)", marginBottom: 1 }}>Proyectado</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: positive ? "#00b894" : "#f0516a" }}>
                        ${displayValue.toLocaleString("es-CO")}
                    </div>
                    <div style={{ fontSize: 9, color: positive ? "#00b894" : "#f0516a" }}>
                        {positive ? "+" : ""}{displayGainPct.toFixed(1)}% · {positive ? "+" : ""}{gain.toLocaleString("es-CO")} COP
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(160,160,192,0.5)" }}>≈ ${displayUSD.toLocaleString("en-US")} USD</div>
                </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 9, color: "rgba(160,160,192,0.4)", lineHeight: 1.4 }}>
                {apiResult
                    ? `Basado en retorno histórico promedio de ${assetName}: ${(avgMonthly * 100).toFixed(2)}%/mes. El pasado no garantiza el futuro.`
                    : `Estimación orientativa perfil ${profile}. Selecciona activo para datos reales.`
                }
            </div>
        </div>
    );
}

// ─── Markdown Text ────────────────────────────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
    // Strip disclaimer line — shown once globally below the input
    const cleanText = text
        .replace(/⚠️\s*\*?Este análisis es educativo[^*\n]*\*?/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trimEnd();
    return (
        <div style={{ lineHeight: 1.7 }}>
            {cleanText.split("\n").map((line, i) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**"))
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                    return (
                        <span key={j}>
                            {part.split(/(\*[^*]+\*)/g).map((p, k) =>
                                p.startsWith("*") && p.endsWith("*") && p.length > 2
                                    ? <em key={k}>{p.slice(1, -1)}</em>
                                    : p
                            )}
                        </span>
                    );
                });
                return <div key={i}>{parts}</div>;
            })}
        </div>
    );
}

// ─── Santi Avatar ─────────────────────────────────────────────────────────────

function SantiAvatar({ size = 32 }: { size?: number }) {
    return (
        <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #6c5ce7, #a29bfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.44, fontWeight: 700, color: "#fff" }}>
                S
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: "#00b894", border: "2px solid var(--bg-card)" }} />
        </div>
    );
}

// ─── Quick Reply Configs ──────────────────────────────────────────────────────

const SUGGESTIONS = {
    default: ["¿Cómo empiezo con $100.000 COP?", "¿Qué es un ETF?", "Analiza Bitcoin", "Iniciar test de perfil"],
    afterMarket: ["¿Es buena compra ahora?", "¿Cómo compro esto en Colombia?", "Comparar con S&P 500", "¿Cuánto sería en COP?"],
    afterCalculator: ["Ver proyección a 24 meses", "¿Dónde invierto esto en Colombia?", "¿Qué activo elijo?"],
    afterResult: ["¿Qué plataforma uso en Colombia?", "¿Cómo invierto mensualmente?", "Muéstrame opciones de ETFs"],
    riskMode: ["a)", "b)", "c)"],
};

// ─── Risk Test Questions ──────────────────────────────────────────────────────

const RISK_QUESTIONS_PREVIEW = [
    "¿Cuál es tu objetivo principal al invertir?\n   a) Conservar mi dinero\n   b) Crecer moderadamente\n   c) Maximizar crecimiento",
    "Si tu inversión cayera un 20%, ¿qué harías?\n   a) Vendería todo\n   b) Esperaría la recuperación\n   c) Compraría más",
    "¿Cuánto tiempo planeas mantener tu inversión?\n   a) Menos de 1 año\n   b) Entre 1 y 5 años\n   c) Más de 5 años",
    "¿Qué % de ahorros puedes arriesgar?\n   a) Menos del 20%\n   b) Entre 20% y 50%\n   c) Más del 50%",
    "¿Cuál describe mejor tu situación?\n   a) Ingresos fijos, no puedo perder\n   b) Tengo estabilidad pero quiero crecer\n   c) Ingresos variables, alta tolerancia",
];

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Persistent storage helpers ──────────────────────────────────────────────

function getStored(key: string): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`investi_${key}`) || sessionStorage.getItem(key) || null;
}

function setStored(key: string, value: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(`investi_${key}`, value);
    sessionStorage.setItem(key, value);
}

function buildGreeting(name: string, profile: string, returning: boolean): string {
    const profileDesc = profile === "Conservador"
        ? "prefieres seguridad antes que rendimiento."
        : profile === "Moderado"
        ? "buscas crecer sin exponerte demasiado."
        : "te sientes cómodo con la volatilidad a cambio de mayor rentabilidad.";

    if (returning && name) {
        return `¡De nuevo por aquí, **${name}**! Tu perfil **${profile}** sigue activo — ${profileDesc}\n\n¿En qué te ayudo hoy?`;
    }
    return `Hola${name ? `, **${name}**` : ""}! Soy **Santi**, tu asesor financiero personal 👋\n\nTienes un perfil **${profile}** — ${profileDesc}\n\nPregúntame sobre cualquier activo, pídeme un plan para invertir en Colombia, o escribe **"Iniciar test de perfil"** para afinar tu perfil de riesgo.\n\n¿En qué te ayudo hoy?`;
}

export default function ChatInterface({ mode = "page" }: { mode?: "page" | "floating" }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const storedProfile = getStored("profile") || "Moderado";
    const userName = getStored("userName") || "";
    const isReturning = typeof window !== "undefined" && !!localStorage.getItem("investi_userName");

    // Persist to both storages on mount
    useEffect(() => {
        if (storedProfile) setStored("profile", storedProfile);
        if (userName) setStored("userName", userName);
    }, []);

    useTheme();
    const [isMobile, setIsMobile] = useState(false);
    const [trm, setTrm] = useState(TRM_FALLBACK);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const inputBeforeVoiceRef = useRef("");
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Detect mobile viewport
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // Fetch real TRM on mount
    useEffect(() => {
        fetch(`${API}/api/trm`)
            .then(r => r.json())
            .then(d => { if (d.trm > 1000) setTrm(d.trm); })
            .catch(() => {});
    }, []);

    const [profile, setProfile] = useState<Profile>(storedProfile as Profile);
    const [messages, setMessages] = useState<Message[]>([{
        role: "assistant",
        content: buildGreeting(userName, storedProfile, isReturning),
    }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [riskMode, setRiskMode] = useState(false);
    const [riskStep, setRiskStep] = useState(0);
    const [riskAnswers, setRiskAnswers] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>(SUGGESTIONS.default);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (el) setShowScrollTop(el.scrollTop > 300);
    }, []);

    const scrollToTop = () => {
        messagesContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Voice input (Web Speech API) — live interim results ──────────────────
    const toggleVoice = useCallback(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) {
            alert("Tu navegador no soporta entrada de voz. Usa Chrome o Safari.");
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        // Snapshot current input so we can append to it live
        inputBeforeVoiceRef.current = input;

        const recognition = new SR();
        recognition.lang = "es-CO";
        recognition.continuous = false;
        recognition.interimResults = true;   // show text while speaking

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
            setIsListening(false);
            setInput(inputBeforeVoiceRef.current); // restore on error
        };
        recognition.onresult = (e: any) => {
            let finalText = "";
            let interimText = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
                else interimText += e.results[i][0].transcript;
            }
            const base = inputBeforeVoiceRef.current;
            if (finalText) {
                // Commit final transcript and update the base for the next segment
                const committed = (base ? base + " " : "") + finalText.trim();
                setInput(committed);
                inputBeforeVoiceRef.current = committed;
            } else if (interimText) {
                // Show live interim text in the field (not yet committed)
                setInput((base ? base + " " : "") + interimText);
            }
        };
        recognitionRef.current = recognition;
        recognition.start();
    }, [isListening, input]);

    useEffect(() => {
        if (searchParams.get("mode") === "test") startRiskTest();
    }, []);

    // Auto-fire analysis when coming from market detail ("Analizar con Santi AI" button)
    useEffect(() => {
        const q = searchParams.get("q");
        if (!q || searchParams.get("analyze") !== "1") return;
        const trimmed = q.trim();
        const timer = setTimeout(() => {
            setMessages(prev => [...prev, { role: "user", content: trimmed }]);
            setIsLoading(true);
            setSuggestions([]);
            fetch(`${API}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, profile: storedProfile, history: [] }),
            })
                .then(r => r.json())
                .then(data => {
                    const hasMarket = data.market_data && !data.market_data.error;
                    const hasCalc = !!(data.calculator_data?.amount_cop);
                    setMessages(prev => [...prev, {
                        role: "assistant",
                        content: data.reply,
                        marketData: hasMarket ? data.market_data : undefined,
                        calculatorData: hasCalc ? data.calculator_data : undefined,
                    }]);
                    setSuggestions(hasMarket ? SUGGESTIONS.afterMarket : SUGGESTIONS.default);
                })
                .catch(() => {
                    setMessages(prev => [...prev, { role: "assistant", content: "❌ Error al conectar con el servidor." }]);
                    setSuggestions(SUGGESTIONS.default);
                })
                .finally(() => setIsLoading(false));
        }, 900);
        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const startRiskTest = () => {
        setRiskMode(true); setRiskStep(0); setRiskAnswers([]);
        setSuggestions(SUGGESTIONS.riskMode);
        setMessages(prev => [...prev,
            { role: "assistant", content: "Perfecto, 5 preguntas rápidas para descubrir tu perfil. No hay respuestas correctas — solo sé honesto 🎯" },
            { role: "assistant", content: `**Pregunta 1 de 5:**\n${RISK_QUESTIONS_PREVIEW[0]}\n\n*Responde con a), b) o c)*` },
        ]);
    };

    const openSimulator = () => {
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "Ajusta el monto, el activo y el plazo — te muestro la proyección con datos históricos reales 👇",
            calculatorData: { amount_cop: 500000, amount_usd: Math.round(500000 / trm) },
        }]);
        setSuggestions(SUGGESTIONS.afterCalculator);
    };

    const handleRiskAnswer = async (answer: string) => {
        const newAnswers = [...riskAnswers, answer];
        setRiskAnswers(newAnswers);
        const nextStep = riskStep + 1;
        setMessages(prev => [...prev, { role: "user", content: answer }]);
        if (nextStep < 5) {
            setRiskStep(nextStep);
            setMessages(prev => [...prev, { role: "assistant", content: `**Pregunta ${nextStep + 1} de 5:**\n${RISK_QUESTIONS_PREVIEW[nextStep]}\n\n*Responde con a), b) o c)*` }]);
        } else {
            setIsLoading(true); setRiskMode(false); setSuggestions([]);
            try {
                const res = await fetch(`${API}/api/risk-test/evaluate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: newAnswers, user_name: userName }),
                });
                const data = await res.json();
                const newProfile = (["Conservador", "Moderado", "Agresivo"].includes(data.profile) ? data.profile : "Moderado") as Profile;
                setProfile(newProfile);
                setStored("profile", newProfile);
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `🎯 **Tu perfil: ${data.profile}**\n\n${data.explanation}\n\n📌 **Recomendaciones:**\n${data.recommendations}\n\n⚠️ *Este análisis es educativo y no constituye asesoría financiera oficial.*`,
                }]);
                setSuggestions(SUGGESTIONS.afterResult);
            } catch {
                setMessages(prev => [...prev, { role: "assistant", content: "Hubo un error evaluando tu perfil. Intenta de nuevo." }]);
                setSuggestions(SUGGESTIONS.default);
            } finally { setIsLoading(false); }
        }
    };

    const sendMessage = async (text?: string) => {
        const trimmed = (text || input).trim();
        if (!trimmed || isLoading) return;
        if (trimmed.toLowerCase().includes("test") || trimmed.toLowerCase().includes("perfil de riesgo")) {
            setInput(""); startRiskTest(); return;
        }
        if (riskMode) { setInput(""); handleRiskAnswer(trimmed); return; }
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: trimmed }]);
        setIsLoading(true); setSuggestions([]);

        // Build history from current messages (last 8)
        const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

        try {
            const res = await fetch(`${API}/api/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, profile, history }),
            });
            const data = await res.json();
            const hasMarket = data.market_data && !data.market_data.error;
            const hasCalc = data.calculator_data && data.calculator_data.amount_cop > 0;
            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.reply,
                marketData: hasMarket ? data.market_data : undefined,
                calculatorData: hasCalc ? data.calculator_data : undefined,
            }]);
            if (hasCalc) setSuggestions(SUGGESTIONS.afterCalculator);
            else if (hasMarket) setSuggestions(SUGGESTIONS.afterMarket);
            else setSuggestions(SUGGESTIONS.default);
        } catch {
            setMessages(prev => [...prev, { role: "assistant", content: "❌ Error al conectar con el servidor." }]);
            setSuggestions(SUGGESTIONS.default);
        } finally { setIsLoading(false); }
    };

    const profileColors: Record<Profile, string> = { Conservador: "badge-green", Moderado: "badge-blue", Agresivo: "badge-gold" };

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: mode === "floating" ? "100%" : "100dvh",
            // Full-screen overlay on mobile — covers bottom nav & parent padding
            ...(mode === "page" && isMobile ? {
                position: "fixed" as const,
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 600,
                background: "var(--bg-secondary)",
            } : {}),
        }}>

            {/* Header — only in page mode */}
            {mode === "page" && (
            <header style={{
                padding: isMobile ? "10px 14px" : "12px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "var(--bg-secondary)", flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Back arrow — mobile only */}
                    {isMobile && (
                        <button
                            onClick={() => router.push("/dashboard")}
                            style={{
                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                background: "transparent", border: "1px solid var(--border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: "var(--text-secondary)",
                            }}
                        >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    )}
                    <SantiAvatar size={isMobile ? 30 : 36} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15 }}>Santi</div>
                        <div style={{ fontSize: 11, color: "#00b894", fontWeight: 500 }}>● En línea · Asesor Financiero IA</div>
                    </div>
                </div>

                {/* Desktop controls */}
                {!isMobile && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className={`badge ${profileColors[profile]}`}>Perfil: {profile}</span>
                        {!riskMode && (
                            <button className="btn-ghost" onClick={startRiskTest} style={{ fontSize: 12, padding: "6px 12px" }}>
                                🎯 Test de Riesgo
                            </button>
                        )}
                        <button
                            onClick={() => router.push("/dashboard")}
                            title="Volver al inicio"
                            style={{
                                background: "transparent", border: "1px solid var(--border)",
                                borderRadius: 8, padding: "6px 12px",
                                display: "flex", alignItems: "center", gap: 6,
                                cursor: "pointer", color: "var(--text-muted)",
                                fontSize: 13, fontWeight: 500, transition: "all 0.2s ease",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.background = "var(--red-bg)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "transparent"; }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            Salir
                        </button>
                    </div>
                )}

                {/* Mobile: profile badge only */}
                {isMobile && (
                    <span className={`badge ${profileColors[profile]}`} style={{ fontSize: 11 }}>
                        {profile}
                    </span>
                )}
            </header>
            )}

            {/* Risk progress */}
            {riskMode && (
                <div style={{ padding: "7px 24px", background: "var(--accent-glow)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap" }}>Pregunta {riskStep + 1} / 5</span>
                    <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(riskStep / 5) * 100}%`, background: "var(--accent)", transition: "width 0.4s ease" }} />
                    </div>
                </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 12px" : "20px 24px", display: "flex", flexDirection: "column", gap: isMobile ? 10 : 14, position: "relative", minHeight: 0 }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                        {msg.role === "assistant" && <SantiAvatar size={28} />}
                        <div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg, var(--accent), #6b5ce7)" : "var(--bg-card)", border: msg.role === "user" ? "none" : "1px solid var(--border)", fontSize: 14 }}>
                            {msg.marketData?.price && <MarketWidget data={msg.marketData} trm={trm} />}
                            {msg.calculatorData && <CalculatorWidget data={msg.calculatorData} profile={profile} trm={trm} />}
                            <MarkdownText text={msg.content} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                        <SantiAvatar size={28} />
                        <div style={{ display: "flex", gap: 4, padding: "11px 15px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px 18px 18px 18px" }}>
                            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />)}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />

                {/* Scroll to top floating button — page mode only */}
                {mode === "page" && showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        title="Ir al inicio"
                        style={{
                            position: "sticky",
                            bottom: 12,
                            alignSelf: "flex-end",
                            width: 36, height: 36,
                            borderRadius: "50%",
                            background: "var(--accent)",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 16px rgba(79,126,248,0.4)",
                            transition: "all 0.2s ease",
                            fontSize: 16,
                            zIndex: 10,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                    >
                        ↑
                    </button>
                )}
            </div>

            {/* Quick replies — horizontal scroll row on mobile */}
            {suggestions.length > 0 && !isLoading && (
                <div style={{
                    padding: isMobile ? "4px 10px 8px" : "0 24px 10px",
                    display: "flex",
                    gap: isMobile ? 6 : 7,
                    flexWrap: isMobile ? "nowrap" : "wrap",
                    overflowX: isMobile ? "auto" : "visible",
                    flexShrink: 0,
                    scrollbarWidth: "none",
                    // Fade edges on mobile to hint scroll
                    WebkitMaskImage: isMobile
                        ? "linear-gradient(to right, transparent 0%, black 8px, black 92%, transparent 100%)"
                        : undefined,
                }}>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            style={{
                                flexShrink: 0,
                                padding: isMobile ? "5px 11px" : "5px 13px",
                                borderRadius: 20,
                                border: "1px solid var(--border-bright)",
                                background: "rgba(108,92,231,0.08)",
                                color: "var(--text-secondary)",
                                fontSize: isMobile ? 12 : 12,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; el.style.background = "rgba(108,92,231,0.18)"; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border-bright)"; el.style.color = "var(--text-secondary)"; el.style.background = "rgba(108,92,231,0.08)"; }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{
                padding: isMobile ? "8px 10px 10px" : "10px 24px 14px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-secondary)",
                flexShrink: 0,
                paddingBottom: isMobile ? "max(10px, env(safe-area-inset-bottom))" : "14px",
            }}>
                {/* Simulate button row */}
                {!riskMode && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6, maxWidth: 800, margin: "0 auto 6px" }}>
                        <button
                            onClick={openSimulator}
                            style={{
                                background: "linear-gradient(135deg, rgba(162,155,254,0.15), rgba(108,92,231,0.1))",
                                border: "1px solid rgba(162,155,254,0.3)",
                                borderRadius: 20,
                                padding: isMobile ? "4px 10px" : "5px 13px",
                                fontSize: isMobile ? 11 : 12,
                                fontWeight: 600,
                                color: "#a29bfe",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 5,
                                transition: "all 0.2s ease",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(162,155,254,0.25), rgba(108,92,231,0.2))"; e.currentTarget.style.borderColor = "rgba(162,155,254,0.6)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(162,155,254,0.15), rgba(108,92,231,0.1))"; e.currentTarget.style.borderColor = "rgba(162,155,254,0.3)"; }}
                        >
                            📊 Simular Inversión
                        </button>
                    </div>
                )}

                <div style={{ display: "flex", gap: 6, maxWidth: 800, margin: "0 auto", alignItems: "center" }}>
                    {/* Mic button — functional via Web Speech API */}
                    <button
                        onClick={toggleVoice}
                        title={isListening ? "Escuchando... clic para detener" : "Hablar con Santi"}
                        style={{
                            flexShrink: 0,
                            width: 36, height: 36,
                            background: isListening ? "rgba(240,81,106,0.12)" : "transparent",
                            border: `1px solid ${isListening ? "var(--red)" : "var(--border)"}`,
                            borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            color: isListening ? "var(--red)" : "var(--text-muted)",
                            transition: "all 0.2s ease",
                            animation: isListening ? "pulse-dot 1s ease infinite" : "none",
                        }}
                        onMouseEnter={e => { if (!isListening) { e.currentTarget.style.color = "#a29bfe"; e.currentTarget.style.borderColor = "rgba(162,155,254,0.5)"; e.currentTarget.style.background = "rgba(162,155,254,0.08)"; } }}
                        onMouseLeave={e => { if (!isListening) { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "transparent"; } }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </button>

                    <input
                        className="input-field"
                        placeholder={isListening ? "Escuchando..." : riskMode ? "Responde con a), b) o c)..." : "Pregúntale algo a Santi..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !isListening && sendMessage()}
                        style={{ fontSize: isMobile ? 14 : undefined }}
                    />
                    <button className="btn-primary" onClick={() => sendMessage()} disabled={isLoading || isListening} style={{ flexShrink: 0, padding: "0 14px", height: 36 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>

                {/* Disclaimer — compact, single line */}
                <p style={{ textAlign: "center", fontSize: 9, color: "var(--text-muted)", opacity: 0.45, margin: "5px auto 0", maxWidth: 800 }}>
                    ⚠️ Solo uso educativo · No asesoría financiera oficial · TRM ~${trm.toLocaleString("es-CO")}
                </p>
            </div>
        </div>
    );
}
