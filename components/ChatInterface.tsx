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
const TRM_COP = 4200;

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

function MarketWidget({ data }: { data: MarketData }) {
    const [prices, setPrices] = useState<number[]>([]);
    const isPositive = !data.change?.startsWith("-");
    const priceNum = parseFloat((data.price || "0").replace(/,/g, ""));
    const priceCOP = isNaN(priceNum) ? null : Math.round(priceNum * TRM_COP).toLocaleString("es-CO");

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

// ─── Calculator Widget ────────────────────────────────────────────────────────

const ANNUAL_RETURNS: Record<Profile, number> = {
    Conservador: 0.06,
    Moderado: 0.10,
    Agresivo: 0.15,
};

function CalculatorWidget({ data, profile }: { data: CalculatorData; profile: Profile }) {
    const [months, setMonths] = useState(12);
    const annualReturn = ANNUAL_RETURNS[profile] || 0.10;
    const monthlyReturn = annualReturn / 12;
    const initial = data.amount_cop;
    const projected = initial * Math.pow(1 + monthlyReturn, months);
    const gain = projected - initial;
    const gainPct = ((gain / initial) * 100).toFixed(1);

    // SVG line chart
    const points = Array.from({ length: months + 1 }, (_, i) =>
        initial * Math.pow(1 + monthlyReturn, i)
    );
    const minV = initial;
    const maxV = projected;
    const rangeV = maxV - minV || 1;
    const W = 240, H = 60;
    const svgPts = points.map((v, i) => {
        const x = ((i / months) * W).toFixed(1);
        const y = (H - ((v - minV) / rangeV) * (H - 8) - 4).toFixed(1);
        return `${x},${y}`;
    }).join(" ");

    return (
        <div style={{ background: "linear-gradient(135deg, #1a1a3e, #16213e)", border: "1px solid #4a4a8a", borderRadius: 12, padding: "14px 16px", marginBottom: 10, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a29bfe", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                📊 Proyección de Inversión
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                <div>
                    <div style={{ fontSize: 10, color: "#a0a0c0" }}>Capital inicial</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                        ${initial.toLocaleString("es-CO")} COP
                    </div>
                    <div style={{ fontSize: 10, color: "#a0a0c0" }}>≈ ${data.amount_usd.toLocaleString("en-US")} USD</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#a0a0c0" }}>En {months} meses</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#00b894" }}>
                        ${Math.round(projected).toLocaleString("es-CO")} COP
                    </div>
                    <div style={{ fontSize: 10, color: "#00b894" }}>+{gainPct}% · +${Math.round(gain).toLocaleString("es-CO")}</div>
                </div>
            </div>

            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", marginBottom: 10 }}>
                <polyline points={svgPts} fill="none" stroke="#a29bfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={W} cy={(H - ((projected - minV) / rangeV) * (H - 8) - 4).toFixed(1)} r="3" fill="#00b894" />
            </svg>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#a0a0c0", whiteSpace: "nowrap" }}>1 mes</span>
                <input
                    type="range" min={1} max={60} value={months}
                    onChange={e => setMonths(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "#a29bfe", cursor: "pointer" }}
                />
                <span style={{ fontSize: 11, color: "#a0a0c0", whiteSpace: "nowrap" }}>60 meses</span>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#a0a0c0", marginTop: 4 }}>
                Rendimiento anual estimado ({profile}): {(annualReturn * 100).toFixed(0)}%
            </div>
        </div>
    );
}

// ─── Markdown Text ────────────────────────────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
    const cleanText = text.replace(/⚠️\s*\*?Este análisis es educativo[^*\n]*\*?/g, "").trimEnd();
    const hasDisclaimer = text.includes("Este análisis es educativo");
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
            {hasDisclaimer && (
                <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 5 }}>
                    ⚠️ Solo uso educativo · No constituye asesoría financiera oficial
                </div>
            )}
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

export default function ChatInterface() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const storedProfile = (typeof window !== "undefined" ? sessionStorage.getItem("profile") : null) || "Moderado";
    const userName = (typeof window !== "undefined" ? sessionStorage.getItem("userName") : null) || "";

    useTheme(); // applies stored theme on mount
    const [showScrollTop, setShowScrollTop] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [profile, setProfile] = useState<Profile>(storedProfile as Profile);
    const [messages, setMessages] = useState<Message[]>([{
        role: "assistant",
        content: `Hola${userName ? `, ${userName}` : ""}! Soy **Santi**, tu asesor financiero personal 👋\n\nTienes un perfil **${storedProfile}** — ${storedProfile === "Conservador" ? "prefieres seguridad antes que rendimiento, y eso tiene todo el sentido." : storedProfile === "Moderado" ? "buscas crecer sin exponerte demasiado. Buen equilibrio." : "te sientes cómodo con la volatilidad a cambio de mayor rentabilidad. ¡Vamos!"}\n\nPregúntame sobre cualquier activo, pídeme un plan para invertir en Colombia, o escribe **"Iniciar test de perfil"** para afinar tu perfil de riesgo.\n\n¿En qué te ayudo hoy?`,
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

    useEffect(() => {
        if (searchParams.get("mode") === "test") startRiskTest();
    }, []);

    const startRiskTest = () => {
        setRiskMode(true); setRiskStep(0); setRiskAnswers([]);
        setSuggestions(SUGGESTIONS.riskMode);
        setMessages(prev => [...prev,
            { role: "assistant", content: "Perfecto, 5 preguntas rápidas para descubrir tu perfil. No hay respuestas correctas — solo sé honesto 🎯" },
            { role: "assistant", content: `**Pregunta 1 de 5:**\n${RISK_QUESTIONS_PREVIEW[0]}\n\n*Responde con a), b) o c)*` },
        ]);
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
                sessionStorage.setItem("profile", newProfile);
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
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

            {/* Header */}
            <header style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <SantiAvatar size={36} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Santi</div>
                        <div style={{ fontSize: 11, color: "#00b894", fontWeight: 500 }}>● En línea · Asesor Financiero IA</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${profileColors[profile]}`}>Perfil: {profile}</span>
                    {!riskMode && <button className="btn-ghost" onClick={startRiskTest} style={{ fontSize: 12, padding: "6px 12px" }}>🎯 Test de Riesgo</button>}
                    <button
                        onClick={() => router.push("/dashboard")}
                        title="Volver al inicio"
                        style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "6px 12px",
                            display: "flex", alignItems: "center", gap: 6,
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: 13, fontWeight: 500,
                            transition: "all 0.2s ease",
                            zIndex: 50,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = "var(--red)";
                            e.currentTarget.style.borderColor = "var(--red)";
                            e.currentTarget.style.background = "var(--red-bg)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = "var(--text-muted)";
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Salir
                    </button>
                </div>
            </header>

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
            <div ref={messagesContainerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                        {msg.role === "assistant" && <SantiAvatar size={28} />}
                        <div style={{ maxWidth: "76%", padding: "11px 15px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg, var(--accent), #6b5ce7)" : "var(--bg-card)", border: msg.role === "user" ? "none" : "1px solid var(--border)", fontSize: 14 }}>
                            {msg.marketData?.price && <MarketWidget data={msg.marketData} />}
                            {msg.calculatorData && <CalculatorWidget data={msg.calculatorData} profile={profile} />}
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

                {/* Scroll to top floating button */}
                {showScrollTop && (
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

            {/* Quick replies */}
            {suggestions.length > 0 && !isLoading && (
                <div style={{ padding: "0 24px 10px", display: "flex", gap: 7, flexWrap: "wrap", flexShrink: 0 }}>
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => sendMessage(s)} style={{ padding: "5px 13px", borderRadius: 20, border: "1px solid var(--border-bright)", background: "rgba(108,92,231,0.08)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", transition: "all 0.15s ease", backdropFilter: "blur(4px)", whiteSpace: "nowrap" }}
                            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "var(--accent)"; el.style.color = "var(--accent)"; el.style.background = "rgba(108,92,231,0.18)"; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border-bright)"; el.style.color = "var(--text-secondary)"; el.style.background = "rgba(108,92,231,0.08)"; }}>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{ padding: "10px 24px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10, maxWidth: 800, margin: "0 auto" }}>
                    <input
                        className="input-field"
                        placeholder={riskMode ? "Responde con a), b) o c)..." : "Pregúntale algo a Santi..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button className="btn-primary" onClick={() => sendMessage()} disabled={isLoading} style={{ flexShrink: 0, padding: "0 18px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
