"use client";
import Sidebar from "../../components/Sidebar";
import BottomNav from "../../components/BottomNav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://investi-backend-75t5.onrender.com";

interface Module {
    id: number;
    slug: string;
    title: string;
    description: string;
    icon: string;
    order: number;
    total_lessons: number;
    completed_lessons: number;
    progress_pct: number;
}

interface Stats {
    total_xp: number;
    lessons_completed: number;
    modules_completed: number;
    quiz_avg_score: number;
    current_streak: number;
    achievements: { slug: string; title: string; icon: string; description: string }[];
}

// ─── Micro progress bar ──────────────────────────────────────────────────────
function MiniBar({ pct, height = 4 }: { pct: number; height?: number }) {
    return (
        <div style={{
            width: "100%", height, borderRadius: height / 2,
            background: "var(--bg-primary)", overflow: "hidden",
        }}>
            <div style={{
                width: `${Math.min(pct, 100)}%`, height: "100%",
                borderRadius: height / 2,
                background: pct >= 100
                    ? "linear-gradient(90deg, var(--green), #17b890)"
                    : "linear-gradient(90deg, var(--accent), #7c5ce4)",
                transition: "width 0.7s ease",
            }} />
        </div>
    );
}

// ─── Santi Tip ───────────────────────────────────────────────────────────────
function santiTip(pct: number): string {
    if (pct === 0) return "Empieza por el módulo 1 — las bases lo son todo.";
    if (pct < 25) return "¡Buen comienzo! La constancia es el mejor activo.";
    if (pct < 50) return "¡Vas bien! El interés compuesto necesita tiempo — igual que el aprendizaje.";
    if (pct < 75) return "Superaste la mitad. Estás construyendo una base financiera sólida.";
    if (pct < 100) return "¡Casi terminas! El conocimiento es el activo que nadie te puede quitar.";
    return "¡Academia completada! Ahora aplica todo con Santi 🚀";
}

// ─── Progress Hero Card ──────────────────────────────────────────────────────
function ProgressCard({ stats, modules, trm }: { stats: Stats; modules: Module[]; trm: number }) {
    const totalLessons = modules.reduce((s, m) => s + m.total_lessons, 0);
    const doneLessons = modules.reduce((s, m) => s + m.completed_lessons, 0);
    const overallPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

    return (
        <div className="glass-card animate-fade-in" style={{
            padding: "22px 22px 20px",
            marginBottom: 20,
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Accent glow blob */}
            <div style={{
                position: "absolute", top: -60, right: -60,
                width: 180, height: 180, borderRadius: "50%",
                background: "var(--accent-glow)", pointerEvents: "none",
            }} />

            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                        Tu Progreso
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                        {overallPct}%
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>completado</span>
                    </div>
                </div>
                <div style={{
                    background: "var(--accent-glow)", border: "1px solid rgba(79,126,248,0.2)",
                    borderRadius: "var(--radius-sm)", padding: "10px 14px", textAlign: "center", flexShrink: 0,
                }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "var(--accent)" }}>
                        {stats.total_xp.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontWeight: 600 }}>XP</div>
                </div>
            </div>

            <MiniBar pct={overallPct} height={6} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {doneLessons}/{totalLessons} lecciones
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    🔥 {stats.current_streak}d racha · 🎯 {stats.quiz_avg_score.toFixed(0)}% avg quiz
                </span>
            </div>

            {/* Santi Tip */}
            <div style={{
                marginTop: 14, padding: "10px 14px",
                background: "var(--bg-secondary)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                display: "flex", alignItems: "flex-start", gap: 10,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff",
                }}>
                    S
                </div>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 2, letterSpacing: "0.05em" }}>
                        SANTI TIP
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {santiTip(overallPct)}
                    </div>
                </div>
            </div>

            {/* TRM reference */}
            <div style={{ marginTop: 10, textAlign: "right" }}>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    TRM referencia: ${trm.toLocaleString("es-CO")} COP/USD
                </span>
            </div>
        </div>
    );
}

// ─── Module Grid Card ────────────────────────────────────────────────────────
function ModuleGridCard({ mod, onClick }: { mod: Module; onClick: () => void }) {
    const isComplete = mod.progress_pct === 100;
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="glass-card animate-fade-in"
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: "20px 18px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                position: "relative",
                overflow: "hidden",
                borderColor: hovered ? "var(--border-bright)" : undefined,
                boxShadow: hovered ? "var(--shadow-card), var(--shadow-glow)" : undefined,
                transition: "all 0.2s ease",
            }}
        >
            {/* Completed ribbon */}
            {isComplete && (
                <div style={{
                    position: "absolute", top: 0, right: 0,
                    background: "var(--green)", color: "#000",
                    fontSize: 9, fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "0 0 0 10px",
                }}>
                    ✓
                </div>
            )}

            {/* Icon */}
            <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: isComplete ? "var(--green-bg)" : "var(--accent-glow)",
                border: `1px solid ${isComplete ? "rgba(34,211,160,0.25)" : "rgba(79,126,248,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
            }}>
                {mod.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 4 }}>
                    MÓDULO {mod.order}
                </div>
                <h3 style={{
                    fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
                    lineHeight: 1.3, marginBottom: 4,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>
                    {mod.title}
                </h3>
                <p style={{
                    fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>
                    {mod.description}
                </p>
            </div>

            {/* Progress */}
            <div>
                <MiniBar pct={mod.progress_pct} height={4} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
                    <span style={{ color: "var(--text-muted)" }}>
                        {mod.completed_lessons}/{mod.total_lessons} lecciones
                    </span>
                    <span style={{
                        fontWeight: 700,
                        color: isComplete ? "var(--green)" : "var(--accent)",
                    }}>
                        {mod.progress_pct.toFixed(0)}%
                    </span>
                </div>
            </div>
        </div>
    );
}

function SkeletonGridCard() {
    return (
        <div className="glass-card loading-shimmer" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LearnPage() {
    const router = useRouter();
    const [modules, setModules] = useState<Module[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [trm, setTrm] = useState(3588);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) { router.push("/"); return; }

        const headers = { Authorization: `Bearer ${token}` };

        Promise.all([
            fetch(`${API}/api/education/modules`, { headers }).then(r => r.json()),
            fetch(`${API}/api/education/stats`, { headers }).then(r => r.json()),
            fetch(`${API}/api/trm`).then(r => r.json()).catch(() => ({ trm: 3588 })),
        ])
            .then(([modulesData, statsData, trmData]) => {
                setModules(modulesData);
                setStats(statsData);
                if (trmData?.trm > 1000) setTrm(trmData.trm);
            })
            .catch(() => setError("Error cargando datos de educación"))
            .finally(() => setLoading(false));
    }, [router]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ overflowX: "hidden" }}>
                <div style={{ padding: "20px 16px 88px", maxWidth: 860, margin: "0 auto" }}>

                    {/* Header */}
                    <div style={{ marginBottom: 20 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                            Academia Investi 🎓
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                            Domina tus finanzas paso a paso · completa lecciones y gana XP
                        </p>
                    </div>

                    {/* Progress Hero */}
                    {stats && !loading && (
                        <ProgressCard stats={stats} modules={modules} trm={trm} />
                    )}
                    {loading && (
                        <div className="glass-card loading-shimmer" style={{ height: 160, marginBottom: 20 }} />
                    )}

                    {/* Error */}
                    {error && (
                        <div className="glass-card" style={{
                            padding: 20, textAlign: "center",
                            color: "var(--red)", marginBottom: 20,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Achievements strip */}
                    {stats && stats.achievements.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <span className="tag">🏅 Logros</span>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                            </div>
                            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
                                {stats.achievements.map((ach) => (
                                    <div
                                        key={ach.slug}
                                        className="glass-card"
                                        style={{
                                            padding: "8px 14px", flexShrink: 0,
                                            display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                                        }}
                                        title={ach.description}
                                    >
                                        <span style={{ fontSize: 18 }}>{ach.icon}</span>
                                        <span style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                                            {ach.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Modules section header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span className="tag">📚 Ruta de Aprendizaje</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>

                    {/* 2-column grid */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 12,
                    }}>
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => <SkeletonGridCard key={i} />)
                            : modules.map((mod) => (
                                <ModuleGridCard
                                    key={mod.id}
                                    mod={mod}
                                    onClick={() => router.push(`/learn/${mod.slug}`)}
                                />
                            ))
                        }
                    </div>
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
