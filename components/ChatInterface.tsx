"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const API = "https://investi-backend-75t5.onrender.com";
const TRM_COP = 4200; // TRM aproximada COP/USD

type Profile = "Conservador" | "Moderado" | "Agresivo";

interface MarketData {
    name: string;
    price: string;
    change: string;
    change_percent: string;
    ticker?: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    marketData?: MarketData;
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
    if (!prices || prices.length < 2) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 80, h = 28;
    const pts = prices.map((p, i) => {
        const x = (i / (prices.length - 1)) * w;
        const y = h - ((p - min) / range) * (h - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const color = positive ? "#00b894" : "#d63031";
    return (
        <svg width={w} height={h} style={{ display: "block" }}>
            <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Market Widget ────────────────────────────────────────────────────────────

function MarketWidget({ data }: { data: MarketData }) {
    const [sparkPrices, setSparkPrices] = useState<number[]>([]);
    const isPositive = !data.change?.startsWith("-");
    const priceNum = parseFloat((data.price || "0").replace(/,/g, ""));
    const priceCOP = isNaN(priceNum) ? null : Math.round(priceNum * TRM_COP).toLocaleString("es-CO");

    useEffect(() => {
        if (!data.ticker) return;
        fetch(`${API}/api/market/${data.ticker}/sparkline`)
            .then(r => r.json())
            .then(d => { if (d.prices?.length > 1) setSparkPrices(d.prices); })
            .catch(() => {});
    }, [data.ticker]);

    return (
        <div style={{
            padding: "10px 14px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-bright)",
            borderRadius: 10,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2, fontWeight: 600, letterSpacing: "0.05em" }}>
                    {data.ticker || ""}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{data.name}</div>
                {priceCOP && (
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                        ≈ ${priceCOP} COP
                    </div>
                )}
            </div>
            {sparkPrices.length > 1 && (
                <Sparkline prices={sparkPrices} positive={isPositive} />
            )}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
                    ${data.price}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isPositive ? "var(--green)" : "var(--red)" }}>
                    {data.change} ({data.change_percent})
                </div>
            </div>
        </div>
    );
}

// ─── Markdown Text ────────────────────────────────────────────────────────────

function MarkdownText({ text }: { text: string }) {
    // Remove the legal disclaimer from main text (shown separately)
    const cleanText = text.replace(/⚠️\s*\*?Este análisis es educativo[^*]*\*?/g, "").trimEnd();
    const hasDisclaimer = text.includes("Este análisis es educativo");
    const lines = cleanText.split("\n");
    return (
        <div style={{ lineHeight: 1.65 }}>
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    const italicParts = part.split(/(\*[^*]+\*)/g).map((p, k) =>
                        p.startsWith("*") && p.endsWith("*") && p.length > 2
                            ? <em key={k}>{p.slice(1, -1)}</em>
                            : p
                    );
                    return <span key={j}>{italicParts}</span>;
                });
                return <div key={i}>{parts}</div>;
            })}
            {hasDisclaimer && (
                <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
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
            <div style={{
                width: size, height: size, borderRadius: "50%",
                background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: size * 0.45, fontWeight: 700, color: "#fff",
                flexShrink: 0,
            }}>S</div>
            <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: size * 0.28, height: size * 0.28,
                borderRadius: "50%", background: "#00b894",
                border: "2px solid var(--bg-card)",
            }} />
        </div>
    );
}

// ─── Quick Replies ────────────────────────────────────────────────────────────

const DEFAULT_SUGGESTIONS = [
    "¿Cómo empiezo a invertir con $100.000 COP?",
    "¿Qué es un ETF y cómo compro uno en Colombia?",
    "Analiza Bitcoin para mi perfil",
    "Iniciar test de perfil",
];

const AFTER_MARKET_SUGGESTIONS = [
    "¿Es buena compra ahora?",
    "¿Cómo compro esto desde Colombia?",
    "Comparar con S&P 500",
    "¿Cuánto sería en COP?",
];

const AFTER_RESULT_SUGGESTIONS = [
    "¿Qué plataforma uso en Colombia?",
    "¿Cómo invierto $200.000 COP mensuales?",
    "Cuéntame más sobre ETFs",
];

const RISK_SUGGESTIONS = ["a)", "b)", "c)"];

// ─── Main Component ───────────────────────────────────────────────────────────

const RISK_QUESTIONS_PREVIEW = [
    "¿Cuál es tu objetivo principal al invertir?\n   a) Conservar mi dinero\n   b) Crecer moderadamente\n   c) Maximizar crecimiento",
    "Si tu inversión cayera un 20%, ¿qué harías?\n   a) Vendería todo\n   b) Esperaría la recuperación\n   c) Compraría más",
    "¿Cuánto tiempo planeas mantener tu inversión?\n   a) Menos de 1 año\n   b) Entre 1 y 5 años\n   c) Más de 5 años",
    "¿Qué % de ahorros puedes arriesgar?\n   a) Menos del 20%\n   b) Entre 20% y 50%\n   c) Más del 50%",
    "¿Cuál describe mejor tu situación?\n   a) Ingresos fijos, no puedo perder\n   b) Tengo estabilidad pero quiero crecer\n   c) Ingresos variables, alta tolerancia",
];

export default function ChatInterface() {
    const searchParams = useSearchParams();
    const storedProfile = (typeof window !== "undefined" ? sessionStorage.getItem("profile") : null) || "Moderado";
    const userName = (typeof window !== "undefined" ? sessionStorage.getItem("userName") : null) || "";

    const [profile, setProfile] = useState<Profile>(storedProfile as Profile);
    const [messages, setMessages] = useState<Message[]>([{
        role: "assistant",
        content: `Hola${userName ? `, ${userName}` : ""}! Soy **Santi**, tu asesor financiero personal 👋\n\nTienes un perfil **${storedProfile}**, lo que significa que ${storedProfile === "Conservador" ? "prefieres seguridad antes que rendimiento — y eso está bien." : storedProfile === "Moderado" ? "buscas crecer sin exponerte demasiado al riesgo. Buen equilibrio." : "te sientes cómodo con la volatilidad a cambio de mayor rentabilidad. ¡Vamos!"}\n\nPuedes preguntarme sobre cualquier activo, pedirme un plan de inversión para tu situación en Colombia, o escribir **"Iniciar test de perfil"** para descubrir tu perfil de riesgo.\n\n¿En qué te puedo ayudar hoy?`,
    }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [riskMode, setRiskMode] = useState(false);
    const [riskStep, setRiskStep] = useState(0);
    const [riskAnswers, setRiskAnswers] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (searchParams.get("mode") === "test") startRiskTest();
    }, []);

    const startRiskTest = () => {
        setRiskMode(true); setRiskStep(0); setRiskAnswers([]);
        setSuggestions(RISK_SUGGESTIONS);
        setMessages(prev => [...prev,
            { role: "assistant", content: "Perfecto, vamos a descubrir tu perfil de inversor con 5 preguntas rápidas. No hay respuestas correctas ni incorrectas, solo sé honesto 🎯" },
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
            setSuggestions(RISK_SUGGESTIONS);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `**Pregunta ${nextStep + 1} de 5:**\n${RISK_QUESTIONS_PREVIEW[nextStep]}\n\n*Responde con a), b) o c)*`
            }]);
        } else {
            setIsLoading(true); setRiskMode(false); setSuggestions([]);
            try {
                const res = await fetch(`${API}/api/risk-test/evaluate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: newAnswers, user_name: userName }),
                });
                const data = await res.json();
                const profileMap: Record<string, Profile> = { Conservador: "Conservador", Moderado: "Moderado", Agresivo: "Agresivo" };
                const newProfile = profileMap[data.profile] || "Moderado";
                setProfile(newProfile);
                sessionStorage.setItem("profile", newProfile);
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `🎯 **Tu perfil es: ${data.profile}**\n\n${data.explanation}\n\n📌 **Recomendaciones para ti:**\n${data.recommendations}\n\n*Tu perfil ha sido actualizado.*\n\n⚠️ *Este análisis es educativo y no constituye asesoría financiera oficial.*`,
                }]);
                setSuggestions(AFTER_RESULT_SUGGESTIONS);
            } catch {
                setMessages(prev => [...prev, { role: "assistant", content: "Hubo un error al evaluar tu perfil. Por favor intenta de nuevo." }]);
                setSuggestions(DEFAULT_SUGGESTIONS);
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
        setIsLoading(true);
        setSuggestions([]);
        try {
            const res = await fetch(`${API}/api/chat`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, profile }),
            });
            const data = await res.json();
            const hasMarket = data.market_data && !data.market_data.error;
            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.reply,
                marketData: hasMarket ? data.market_data : undefined,
            }]);
            setSuggestions(hasMarket ? AFTER_MARKET_SUGGESTIONS : DEFAULT_SUGGESTIONS);
        } catch {
            setMessages(prev => [...prev, { role: "assistant", content: "❌ Error al conectar con el servidor. Intenta de nuevo." }]);
            setSuggestions(DEFAULT_SUGGESTIONS);
        } finally { setIsLoading(false); }
    };

    const profileColors: Record<Profile, string> = {
        Conservador: "badge-green",
        Moderado: "badge-blue",
        Agresivo: "badge-gold",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

            {/* Header */}
            <header style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <SantiAvatar size={36} />
                    <div>
                        <h1 style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Santi</h1>
                        <p style={{ fontSize: 11, color: "#00b894", marginTop: 1, fontWeight: 500 }}>● En línea · Asesor Financiero IA</p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge ${profileColors[profile]}`}>Perfil: {profile}</span>
                    {!riskMode && (
                        <button className="btn-ghost" onClick={startRiskTest} style={{ fontSize: 12, padding: "6px 12px" }}>
                            🎯 Test de Riesgo
                        </button>
                    )}
                </div>
            </header>

            {/* Risk progress bar */}
            {riskMode && (
                <div style={{ padding: "8px 24px", background: "var(--accent-glow)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        Pregunta {riskStep + 1} de 5
                    </span>
                    <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(riskStep / 5) * 100}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.4s ease" }} />
                    </div>
                </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                        {msg.role === "assistant" && <SantiAvatar size={28} />}
                        <div style={{
                            maxWidth: "75%",
                            padding: "12px 16px",
                            borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                            background: msg.role === "user" ? "linear-gradient(135deg, var(--accent), #6b5ce7)" : "var(--bg-card)",
                            border: msg.role === "user" ? "none" : "1px solid var(--border)",
                            fontSize: 14,
                        }}>
                            {msg.marketData?.price && <MarketWidget data={msg.marketData} />}
                            <MarkdownText text={msg.content} />
                        </div>
                    </div>
                ))}

                {/* Loading dots */}
                {isLoading && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                        <SantiAvatar size={28} />
                        <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px 18px 18px 18px" }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {suggestions.length > 0 && !isLoading && (
                <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            style={{
                                padding: "6px 14px",
                                borderRadius: 20,
                                border: "1px solid var(--border-bright)",
                                background: "var(--bg-card)",
                                color: "var(--text-secondary)",
                                fontSize: 12,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.target as HTMLButtonElement).style.color = "var(--accent)"; }}
                            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "var(--border-bright)"; (e.target as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div style={{ padding: "12px 24px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10, maxWidth: 800, margin: "0 auto" }}>
                    <input
                        className="input-field"
                        placeholder={riskMode ? "Responde con a), b) o c)..." : "Pregúntale algo a Santi..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        className="btn-primary"
                        onClick={() => sendMessage()}
                        disabled={isLoading}
                        style={{ flexShrink: 0, padding: "0 18px" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
