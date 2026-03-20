"use client";
import Sidebar from "../../../components/Sidebar";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API = "https://investi-backend-production.up.railway.app";

interface Lesson {
    id: number;
    slug: string;
    title: string;
    summary: string;
    difficulty: number;
    xp_reward: number;
    order: number;
    is_completed: boolean;
    quiz_score: number | null;
}

const difficultyLabels: Record<number, { text: string; color: string }> = {
    1: { text: "Básico", color: "var(--green)" },
    2: { text: "Intermedio", color: "var(--gold)" },
    3: { text: "Avanzado", color: "var(--red)" },
};

function LessonCard({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
    const diff = difficultyLabels[lesson.difficulty] || difficultyLabels[1];

    return (
        <div
            className="glass-card animate-fade-in"
            onClick={onClick}
            style={{
                padding: "20px 24px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 18,
                opacity: lesson.is_completed ? 0.85 : 1,
            }}
        >
            {/* Lesson number / check */}
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: lesson.is_completed
                    ? "var(--green-bg)"
                    : "var(--accent-glow)",
                border: `1px solid ${lesson.is_completed ? "rgba(34,211,160,0.25)" : "rgba(79,126,248,0.25)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: lesson.is_completed ? 18 : 16,
                fontWeight: 700,
                color: lesson.is_completed ? "var(--green)" : "var(--accent)",
            }}>
                {lesson.is_completed ? "✓" : lesson.order}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                    fontSize: 15, fontWeight: 600,
                    color: "var(--text-primary)", marginBottom: 4,
                }}>
                    {lesson.title}
                </h3>
                <p style={{
                    fontSize: 13, color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>
                    {lesson.summary}
                </p>
            </div>

            {/* Right info */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{
                    fontSize: 11, fontWeight: 600, color: diff.color,
                    background: diff.color === "var(--green)" ? "var(--green-bg)"
                        : diff.color === "var(--gold)" ? "var(--gold-bg)"
                        : "var(--red-bg)",
                    padding: "2px 8px", borderRadius: 99,
                }}>
                    {diff.text}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                    +{lesson.xp_reward} XP
                </span>
                {lesson.quiz_score !== null && (
                    <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: lesson.quiz_score >= 70 ? "var(--green)" : "var(--red)",
                    }}>
                        Quiz: {lesson.quiz_score.toFixed(0)}%
                    </span>
                )}
            </div>

            {/* Arrow */}
            <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </div>
    );
}

export default function ModuleLessonsPage() {
    const router = useRouter();
    const params = useParams();
    const moduleSlug = params.moduleSlug as string;

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) { router.push("/"); return; }

        fetch(`${API}/api/education/modules/${moduleSlug}/lessons`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => {
                if (!r.ok) throw new Error("Módulo no encontrado");
                return r.json();
            })
            .then(setLessons)
            .catch(() => setError("No se pudo cargar el módulo"))
            .finally(() => setLoading(false));
    }, [moduleSlug, router]);

    const completed = lessons.filter(l => l.is_completed).length;
    const total = lessons.length;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ padding: 32, maxWidth: 780, margin: "0 auto" }}>

                    {/* Back button */}
                    <button
                        onClick={() => router.push("/learn")}
                        className="btn-ghost"
                        style={{ marginBottom: 24, padding: "8px 16px", fontSize: 13 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Volver a módulos
                    </button>

                    {/* Header */}
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                            {moduleSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </h1>
                        {!loading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                                    {completed}/{total} completadas
                                </span>
                                <div style={{
                                    flex: 1, maxWidth: 200, height: 6, borderRadius: 3,
                                    background: "var(--bg-card)", overflow: "hidden",
                                }}>
                                    <div style={{
                                        width: total > 0 ? `${(completed / total) * 100}%` : "0%",
                                        height: "100%", borderRadius: 3,
                                        background: completed === total
                                            ? "linear-gradient(90deg, var(--green), #17b890)"
                                            : "linear-gradient(90deg, var(--accent), #7c5ce4)",
                                        transition: "width 0.6s ease",
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="glass-card" style={{ padding: 20, textAlign: "center", color: "var(--red)" }}>
                            {error}
                        </div>
                    )}

                    {/* Lessons list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {loading
                            ? Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="glass-card loading-shimmer" style={{ height: 90 }} />
                            ))
                            : lessons.map((lesson) => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onClick={() => router.push(`/learn/${moduleSlug}/${lesson.slug}`)}
                                />
                            ))
                        }
                    </div>
                </div>
            </main>
        </div>
    );
}
