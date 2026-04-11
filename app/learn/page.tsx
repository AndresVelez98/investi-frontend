"use client";
import Sidebar from "../../components/Sidebar";
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

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div style={{
            width: "100%", height: 6, borderRadius: 3,
            background: "var(--bg-primary)", overflow: "hidden",
        }}>
            <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 3,
                background: pct === 100
                    ? "linear-gradient(90deg, var(--green), #17b890)"
                    : "linear-gradient(90deg, var(--accent), #7c5ce4)",
                transition: "width 0.6s ease",
            }} />
        </div>
    );
}

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
    return (
        <div className="glass-card" style={{ padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
        </div>
    );
}

function ModuleCard({ mod, onClick }: { mod: Module; onClick: () => void }) {
    const isComplete = mod.progress_pct === 100;
    return (
        <div
            className="glass-card animate-fade-in"
            onClick={onClick}
            style={{ padding: "22px 24px", cursor: "pointer", position: "relative", overflow: "hidden" }}
        >
            {/* Completed glow */}
            {isComplete && (
                <div style={{
                    position: "absolute", top: 0, right: 0,
                    background: "var(--green)", color: "#000",
                    fontSize: 10, fontWeight: 700, padding: "4px 12px",
                    borderRadius: "0 0 0 12px",
                }}>
                    COMPLETADO ✓
                </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                {/* Icon */}
                <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    background: isComplete ? "var(--green-bg)" : "var(--accent-glow)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, border: `1px solid ${isComplete ? "rgba(34,211,160,0.2)" : "rgba(79,126,248,0.2)"}`,
                }}>
                    {mod.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                            textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                            Módulo {mod.order}
                        </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        {mod.title}
                    </h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>
                        {mod.description}
                    </p>

                    {/* Progress */}
                    <div style={{ marginBottom: 6 }}>
                        <ProgressBar pct={mod.progress_pct} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>
                            {mod.completed_lessons}/{mod.total_lessons} lecciones
                        </span>
                        <span style={{
                            fontWeight: 600,
                            color: isComplete ? "var(--green)" : "var(--accent)",
                        }}>
                            {mod.progress_pct.toFixed(0)}%
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div style={{ color: "var(--text-muted)", flexShrink: 0, alignSelf: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

function SkeletonModule() {
    return <div className="glass-card loading-shimmer" style={{ height: 140, borderRadius: "var(--radius-lg)" }} />;
}

export default function LearnPage() {
    const router = useRouter();
    const [modules, setModules] = useState<Module[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/");
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        Promise.all([
            fetch(`${API}/api/education/modules`, { headers }).then(r => r.json()),
            fetch(`${API}/api/education/stats`, { headers }).then(r => r.json()),
        ])
            .then(([modulesData, statsData]) => {
                setModules(modulesData);
                setStats(statsData);
            })
            .catch(() => setError("Error cargando datos de educación"))
            .finally(() => setLoading(false));
    }, [router]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ padding: 32, maxWidth: 860, margin: "0 auto" }}>

                    {/* Header */}
                    <div style={{ marginBottom: 8 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
                            Aprende Finanzas 🎓
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                            Domina tus finanzas paso a paso. Completa lecciones, gana XP y desbloquea logros.
                        </p>
                    </div>

                    {/* Stats Bar */}
                    {stats && (
                        <div style={{
                            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 12, margin: "24px 0 32px",
                        }}>
                            <StatCard emoji="⚡" value={stats.total_xp.toLocaleString()} label="XP Total" />
                            <StatCard emoji="📖" value={`${stats.lessons_completed}`} label="Lecciones" />
                            <StatCard emoji="🔥" value={`${stats.current_streak}d`} label="Racha" />
                            <StatCard emoji="🎯" value={`${stats.quiz_avg_score.toFixed(0)}%`} label="Promedio Quiz" />
                        </div>
                    )}

                    {/* Achievements preview */}
                    {stats && stats.achievements.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <span className="tag">🏅 Tus Logros</span>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {stats.achievements.map((ach) => (
                                    <div
                                        key={ach.slug}
                                        className="glass-card"
                                        style={{
                                            padding: "10px 16px",
                                            display: "flex", alignItems: "center", gap: 8,
                                            fontSize: 13,
                                        }}
                                        title={ach.description}
                                    >
                                        <span style={{ fontSize: 20 }}>{ach.icon}</span>
                                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{ach.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="glass-card" style={{
                            padding: 20, textAlign: "center",
                            color: "var(--red)", marginBottom: 24,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Modules */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <span className="tag">📚 Ruta de Aprendizaje</span>
                        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonModule key={i} />)
                            : modules.map((mod) => (
                                <ModuleCard
                                    key={mod.id}
                                    mod={mod}
                                    onClick={() => router.push(`/learn/${mod.slug}`)}
                                />
                            ))
                        }
                    </div>
                </div>
            </main>
        </div>
    );
}
