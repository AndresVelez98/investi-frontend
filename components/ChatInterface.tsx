"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Profile = "Conservador" | "Moderado" | "Agresivo";

interface Message {
    role: "user" | "assistant";
    content: string;
    marketData?: {
        name: string;
        price: string;
        change: string;
        change_percent: string;
        ticker?: string;
    };
}

const FREE_LIMIT = 5;
const STORAGE_KEY = "investi_usage";

function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

function getUsage(): number {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return 0;
        const { date, count } = JSON.parse(raw);
        if (date !== getTodayKey()) return 0;
        return count;
    } catch { return 0; }
}

function incrementUsage(): number {
    const count = getUsage() + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), count }));
    return count;
}

function MarkdownText({ text }: { text: string }) {
    const lines = text.split("\n");
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
        </div>
    );
}

const RISK_MESSAGES = ["Perfecto, vamos a descubrir tu perfil de inversor. Te haré 5 preguntas rápidas. 🎯"];

const RISK_QUESTIONS_PREVIEW = [
    "¿Cuál es tu objetivo principal al invertir?\n   a) Conservar mi dinero\n   b) Crecer moderadamente\n   c) Maximizar crecimiento",
    "Si tu inversión cayera un 20%, ¿qué harías?\n   a) Vendería todo\n   b) Esperaría la recuperación\n   c) Compraría más",
    "¿Cuánto tiempo planeas mantener tu inversión?\n   a) Menos de 1 año\n   b) Entre 1 y 5 años\n   c) Más de 5 años",
    "¿Qué % de ahorros puedes arriesgar?\n   a) Menos del 20%\n   b) Entre 20% y 50%\n   c) Más del 50%",
    "¿Cuál describe mejor tu situación?\n   a) Ingresos fijos, no puedo perder\n   b) Tengo estabilidad pero quiero crecer\n   c) Ingresos variables, alta tolerancia",
];

function LimitBanner() {
    return (
        <div style={{
            margin: "0 24px 16px",
            padding: "20px 24px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            border: "1px solid #4a4a8a",
            textAlign: "center",
        }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>
                Has usado tus 5 consultas gratuitas de hoy
            </div>
            <div style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 16, lineHeight: 1.6 }}>
                Tu cuota diaria se renueva automáticamente a la medianoche.<br />
                ¿Quieres consultas ilimitadas?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ padding: "10px 20px", borderRadius: 8, background: "#2a2a4a", border: "1px solid #4a4a8a", fontSize: 13, color: "#a0a0c0" }}>
                    🌙 Vuelve mañana — gratis
                </div>
                <div style={{ padding: "10px 20px", borderRadius: 8, background: "linear-gradient(135deg, #6c5ce7, #a29bfe)", fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                    🚀 Desbloquear ilimitado
                </div>
            </div>
        </div>
    );
}

export default function ChatInterface() {
    const searchParams = useSearchParams();
    const storedProfile = (typeof window !== "undefined" ? sessionStorage.getItem("profile") : null) || "Moderado";
    const userName = (typeof window !== "undefined" ? sessionStorage.getItem("userName") : null) || "";

    const [profile, setProfile] = useState<Profile>(storedProfile as Profile);
    const [messages, setMessages] = useState<Message[]>([{
        role: "assistant",
        content: `¡Hola${userName ? `, ${userName}` : ""}! 👋 Tengo tu perfil **${storedProfile}** activo.\n\nPuedes preguntarme sobre cualquier acción o activo: *"¿Cómo está Tesla?"*, *"Dame un análisis de Bitcoin"*, etc.\n\nO bien, escribe **"Iniciar test de perfil"** para descubrir tu perfil de riesgo con 5 preguntas.`,
    }]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [questionsUsed, setQuestionsUsed] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const [riskMode, setRiskMode] = useState(false);
    const [riskStep, setRiskStep] = useState(0);
    const [riskAnswers, setRiskAnswers] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const used = getUsage();
        setQuestionsUsed(used);
        setLimitReached(used >= FREE_LIMIT);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (searchParams.get("mode") === "test") startRiskTest();
    }, []);

    const startRiskTest = () => {
        setRiskMode(true); setRiskStep(0); setRiskAnswers([]);
        setMessages(prev => [...prev,
            { role: "assistant", content: RISK_MESSAGES[0] },
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
            setIsLoading(true); setRiskMode(false);
            try {
                const res = await fetch("https://investi-backend-production.up.railway.app/api/risk-test/evaluate", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ answers: newAnswers, user_name: userName }),
                });
                const data = await res.json();
                const profileMap: Record<string, Profile> = { Conservador: "Conservador", Moderado: "Moderado", Agresivo: "Agresivo" };
                const newProfile = profileMap[data.profile] || "Moderado";
                setProfile(newProfile); sessionStorage.setItem("profile", newProfile);
                setMessages(prev => [...prev, { role: "assistant", content: `🎯 **Resultado del Test de Perfil**\n\n**Tu perfil: ${data.profile}**\n\n${data.explanation}\n\n📌 **Recomendaciones:**\n${data.recommendations}\n\n*Tu perfil ha sido actualizado.*` }]);
            } catch {
                setMessages(prev => [...prev, { role: "assistant", content: "Hubo un error al evaluar tu perfil. Por favor intenta de nuevo." }]);
            } finally { setIsLoading(false); }
        }
    };

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        if (trimmed.toLowerCase().includes("test") || trimmed.toLowerCase().includes("perfil de riesgo")) {
            setInput(""); startRiskTest(); return;
        }
        if (riskMode) { setInput(""); handleRiskAnswer(trimmed); return; }
        if (limitReached) return;
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: trimmed }]);
        setIsLoading(true);
        try {
            const res = await fetch("https://investi-backend-production.up.railway.app/api/chat", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed, profile }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.reply, marketData: data.market_data && !data.market_data.error ? data.market_data : undefined }]);
            const newCount = incrementUsage();
            setQuestionsUsed(newCount);
            if (newCount >= FREE_LIMIT) setLimitReached(true);
        } catch {
            setMessages(prev => [...prev, { role: "assistant", content: "❌ Error al conectar con el servidor." }]);
        } finally { setIsLoading(false); }
    };

    const profileColors: Record<Profile, string> = { Conservador: "badge-green", Moderado: "badge-blue", Agresivo: "badge-gold" };
    const remaining = Math.max(0, FREE_LIMIT - questionsUsed);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <header style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontWeight: 700, fontSize: 16 }}>Chat con IA Financiera</h1>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Powered by Gemini</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {!limitReached && (
                        <span style={{ fontSize: 12, color: remaining <= 2 ? "#f39c12" : "var(--text-muted)", fontWeight: remaining <= 2 ? 600 : 400 }}>
                            {remaining} consulta{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
                        </span>
                    )}
                    <span className={`badge ${profileColors[profile]}`}>Perfil: {profile}</span>
                    {!riskMode && <button className="btn-ghost" onClick={startRiskTest} style={{ fontSize: 12, padding: "6px 12px" }}>🎯 Test de Riesgo</button>}
                </div>
            </header>

            {riskMode && (
                <div style={{ padding: "8px 24px", background: "var(--accent-glow)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Test de Perfil — Pregunta {riskStep + 1} de 5</span>
                    <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${((riskStep) / 5) * 100}%`, background: "var(--accent)", borderRadius: 2, transition: "width 0.4s ease" }} />
                    </div>
                </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className="animate-fade-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        {msg.role === "assistant" && (
                            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginRight: 10, marginTop: 2, background: "linear-gradient(135deg, var(--accent), #7c5ce4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📈</div>
                        )}
                        <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: msg.role === "user" ? "linear-gradient(135deg, var(--accent), #6b5ce7)" : "var(--bg-card)", border: msg.role === "user" ? "none" : "1px solid var(--border)", fontSize: 14 }}>
                            {msg.marketData && msg.marketData.price && (
                                <div style={{ padding: "10px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border-bright)", borderRadius: 8, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{msg.marketData.ticker || ""}</div>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{msg.marketData.name}</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>${msg.marketData.price}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: msg.marketData.change?.includes("-") ? "var(--red)" : "var(--green)" }}>{msg.marketData.change} ({msg.marketData.change_percent})</div>
                                    </div>
                                </div>
                            )}
                            <MarkdownText text={msg.content} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #7c5ce4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📈</div>
                        <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px 18px 18px 18px" }}>
                            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />)}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {limitReached && <LimitBanner />}

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10, maxWidth: 800, margin: "0 auto" }}>
                    <input
                        className="input-field"
                        placeholder={limitReached ? "Límite diario alcanzado — vuelve mañana 🌙" : riskMode ? "Responde con a), b) o c)..." : "Pregúntame sobre cualquier activo..."}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        disabled={limitReached}
                        style={{ opacity: limitReached ? 0.5 : 1 }}
                    />
                    <button className="btn-primary" onClick={sendMessage} disabled={isLoading || limitReached} style={{ flexShrink: 0, padding: "0 18px", opacity: limitReached ? 0.5 : 1 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
                <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>Solo uso educativo · No es asesoría financiera oficial</p>
            </div>
        </div>
    );
}
ENDOFFILE
