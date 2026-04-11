"use client";
import Sidebar from "../../../../components/Sidebar";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

const API = "https://investi-backend-75t5.onrender.com";

interface QuizQuestion {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string | null;
    order: number;
}

interface LessonDetail {
    id: number;
    slug: string;
    title: string;
    summary: string;
    content: string;
    fun_fact: string | null;
    difficulty: number;
    xp_reward: number;
    module_title: string;
    quiz_questions: QuizQuestion[];
    is_completed: boolean;
    quiz_score: number | null;
}

interface QuizResult {
    lesson_id: number;
    score: number;
    correct_count: number;
    total_questions: number;
    xp_earned: number;
    passed: boolean;
    results: {
        question_id: number;
        question: string;
        selected: string;
        correct: string;
        is_correct: boolean;
        explanation: string;
    }[];
    new_achievements: { slug: string; title: string; icon: string; description: string; xp_bonus: number }[];
}

/* ── Simple Markdown renderer ──────────────────────────────────────────────── */
function renderMarkdown(md: string): string {
    let html = md
        // headers
        .replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:20px 0 8px">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:24px 0 10px">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0 0 16px">$1</h1>')
        // blockquote
        .replace(/^> (.+)$/gm, '<div style="border-left:3px solid var(--accent);padding:12px 16px;margin:16px 0;background:var(--accent-glow);border-radius:0 8px 8px 0;font-style:italic;color:var(--text-secondary)">$1</div>')
        // bold
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:600">$1</strong>')
        // list items
        .replace(/^- (.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;padding-left:8px"><span style="color:var(--accent)">•</span><span>$1</span></div>')
        // table (simple)
        .replace(/\|(.+)\|/g, (match) => {
            const cells = match.split("|").filter(c => c.trim());
            if (cells.every(c => c.trim().match(/^[-]+$/))) return "";
            const isHeader = cells.some(c => c.includes("---"));
            if (isHeader) return "";
            return `<div style="display:flex;gap:0;margin:2px 0">${cells.map(c =>
                `<div style="flex:1;padding:8px 12px;background:var(--bg-primary);border:1px solid var(--border);font-size:13px">${c.trim()}</div>`
            ).join("")}</div>`;
        })
        // paragraphs
        .replace(/\n\n/g, '</p><p style="margin:12px 0;line-height:1.7;color:var(--text-secondary)">')
        // line breaks
        .replace(/\n/g, "<br/>");

    return `<p style="margin:12px 0;line-height:1.7;color:var(--text-secondary)">${html}</p>`;
}

/* ── Quiz Component ────────────────────────────────────────────────────────── */
function Quiz({
    questions,
    lessonSlug,
    onResult,
}: {
    questions: QuizQuestion[];
    lessonSlug: string;
    onResult: (result: QuizResult) => void;
}) {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const allAnswered = questions.every(q => answers[q.id]);

    const handleSubmit = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) return;
        setSubmitting(true);

        try {
            const res = await fetch(`${API}/api/education/lessons/${lessonSlug}/quiz`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    answers: questions.map(q => ({
                        question_id: q.id,
                        selected_option: answers[q.id],
                    })),
                }),
            });
            const result = await res.json();
            onResult(result);
        } catch {
            alert("Error enviando quiz. Intenta de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>
                📝 Quiz — Demuestra lo que aprendiste
            </h2>

            {questions.map((q, qi) => (
                <div key={q.id} className="glass-card animate-fade-in" style={{
                    padding: "20px 24px", marginBottom: 14,
                    animationDelay: `${qi * 0.08}s`,
                }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
                        {qi + 1}. {q.question}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(["a", "b", "c", "d"] as const).map(opt => {
                            const text = q[`option_${opt}` as keyof QuizQuestion] as string | null;
                            if (!text) return null;
                            const selected = answers[q.id] === opt;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "12px 16px", borderRadius: "var(--radius-sm)",
                                        background: selected ? "var(--accent-glow)" : "var(--bg-secondary)",
                                        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                                        color: selected ? "var(--accent)" : "var(--text-secondary)",
                                        fontWeight: selected ? 600 : 400,
                                        fontSize: 13, cursor: "pointer", textAlign: "left",
                                        transition: "all 0.15s ease", fontFamily: "inherit",
                                        width: "100%",
                                    }}
                                >
                                    <span style={{
                                        width: 24, height: 24, borderRadius: 6,
                                        background: selected ? "var(--accent)" : "var(--bg-primary)",
                                        border: `1px solid ${selected ? "var(--accent)" : "var(--border-bright)"}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                                        color: selected ? "#fff" : "var(--text-muted)",
                                    }}>
                                        {opt.toUpperCase()}
                                    </span>
                                    {text}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="btn-primary"
                style={{
                    width: "100%", padding: "14px", fontSize: 15, marginTop: 8,
                    opacity: (!allAnswered || submitting) ? 0.5 : 1,
                    cursor: (!allAnswered || submitting) ? "not-allowed" : "pointer",
                }}
            >
                {submitting ? "Evaluando..." : `Enviar respuestas (${Object.keys(answers).length}/${questions.length})`}
            </button>
        </div>
    );
}

/* ── Quiz Results Component ────────────────────────────────────────────────── */
function QuizResults({ result, onRetry }: { result: QuizResult; onRetry: () => void }) {
    const passed = result.passed;

    return (
        <div className="animate-fade-in">
            {/* Score card */}
            <div className="glass-card" style={{
                padding: "32px", textAlign: "center", marginBottom: 20,
                border: `1px solid ${passed ? "rgba(34,211,160,0.3)" : "rgba(240,81,106,0.3)"}`,
            }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                    {passed ? (result.score === 100 ? "🌟" : "✅") : "😤"}
                </div>
                <div style={{
                    fontSize: 36, fontWeight: 800,
                    color: passed ? "var(--green)" : "var(--red)",
                    marginBottom: 4,
                }}>
                    {result.score.toFixed(0)}%
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
                    {result.correct_count} de {result.total_questions} correctas
                </p>
                <p style={{
                    fontSize: 16, fontWeight: 600,
                    color: passed ? "var(--green)" : "var(--text-secondary)",
                }}>
                    {passed
                        ? result.score === 100
                            ? `¡Perfecto! +${result.xp_earned} XP 🔥`
                            : `¡Aprobado! +${result.xp_earned} XP`
                        : "Necesitas 70% para aprobar. ¡Inténtalo de nuevo!"}
                </p>
            </div>

            {/* New achievements */}
            {result.new_achievements.length > 0 && (
                <div className="glass-card" style={{
                    padding: "20px 24px", marginBottom: 20,
                    border: "1px solid rgba(245,166,35,0.3)",
                    background: "var(--gold-bg)",
                }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)", marginBottom: 12 }}>
                        🏆 ¡Nuevo logro desbloqueado!
                    </p>
                    {result.new_achievements.map(ach => (
                        <div key={ach.slug} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <span style={{ fontSize: 28 }}>{ach.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{ach.title}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ach.description}</div>
                                <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>+{ach.xp_bonus} XP bonus</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Answer details */}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--text-primary)" }}>
                Revisión de respuestas
            </h3>
            {result.results.map((r, i) => (
                <div key={i} className="glass-card" style={{
                    padding: "16px 20px", marginBottom: 10,
                    borderLeft: `3px solid ${r.is_correct ? "var(--green)" : "var(--red)"}`,
                }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                        {r.is_correct ? "✅" : "❌"} {r.question}
                    </p>
                    {!r.is_correct && (
                        <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 4 }}>
                            Tu respuesta: {r.selected.toUpperCase()} · Correcta: {r.correct.toUpperCase()}
                        </p>
                    )}
                    <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                        {r.explanation}
                    </p>
                </div>
            ))}

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                {!passed && (
                    <button onClick={onRetry} className="btn-primary" style={{ flex: 1, padding: "12px" }}>
                        Intentar de nuevo
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const moduleSlug = params.moduleSlug as string;
    const lessonSlug = params.lessonSlug as string;

    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"content" | "quiz" | "results">("content");
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) { router.push("/"); return; }

        fetch(`${API}/api/education/lessons/${lessonSlug}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(setLesson)
            .catch(() => router.push("/learn"))
            .finally(() => setLoading(false));
    }, [lessonSlug, router]);

    if (loading) {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <div style={{ padding: 32, maxWidth: 780, margin: "0 auto" }}>
                        <div className="glass-card loading-shimmer" style={{ height: 400 }} />
                    </div>
                </main>
            </div>
        );
    }

    if (!lesson) return null;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div style={{ padding: 32, maxWidth: 780, margin: "0 auto" }}>

                    {/* Navigation */}
                    <button
                        onClick={() => router.push(`/learn/${moduleSlug}`)}
                        className="btn-ghost"
                        style={{ marginBottom: 20, padding: "8px 16px", fontSize: 13 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Volver a lecciones
                    </button>

                    {/* Lesson header */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <span className="badge badge-blue">{lesson.module_title}</span>
                            <span className="badge badge-green">+{lesson.xp_reward} XP</span>
                            {lesson.is_completed && <span className="badge badge-green">Completada ✓</span>}
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{lesson.title}</h1>
                    </div>

                    {/* Tab switcher */}
                    {view !== "results" && (
                        <div style={{
                            display: "flex", gap: 4, marginBottom: 24, padding: 4,
                            background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                        }}>
                            {[
                                { key: "content" as const, label: "📖 Lección" },
                                { key: "quiz" as const, label: `📝 Quiz (${lesson.quiz_questions.length})` },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setView(tab.key)}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: 6,
                                        border: "none", cursor: "pointer",
                                        fontSize: 13, fontWeight: 600,
                                        fontFamily: "inherit",
                                        background: view === tab.key ? "var(--accent-glow)" : "transparent",
                                        color: view === tab.key ? "var(--accent)" : "var(--text-muted)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Content view */}
                    {view === "content" && (
                        <div>
                            <div
                                className="glass-card"
                                style={{ padding: "28px 32px" }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content) }}
                            />

                            {/* Fun fact */}
                            {lesson.fun_fact && (
                                <div className="glass-card" style={{
                                    padding: "18px 24px", marginTop: 16,
                                    border: "1px solid rgba(245,166,35,0.2)",
                                    background: "var(--gold-bg)",
                                }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)", marginBottom: 6 }}>
                                        💡 Dato curioso
                                    </p>
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                        {lesson.fun_fact}
                                    </p>
                                </div>
                            )}

                            {/* CTA to quiz */}
                            <button
                                onClick={() => setView("quiz")}
                                className="btn-primary"
                                style={{ width: "100%", padding: "14px", fontSize: 15, marginTop: 20 }}
                            >
                                Ir al Quiz →
                            </button>
                        </div>
                    )}

                    {/* Quiz view */}
                    {view === "quiz" && (
                        <Quiz
                            questions={lesson.quiz_questions}
                            lessonSlug={lessonSlug}
                            onResult={(result) => {
                                setQuizResult(result);
                                setView("results");
                            }}
                        />
                    )}

                    {/* Results view */}
                    {view === "results" && quizResult && (
                        <QuizResults
                            result={quizResult}
                            onRetry={() => {
                                setQuizResult(null);
                                setView("quiz");
                            }}
                        />
                    )}

                    {/* Next lesson / back to module */}
                    {view === "results" && quizResult?.passed && (
                        <button
                            onClick={() => router.push(`/learn/${moduleSlug}`)}
                            className="btn-primary"
                            style={{ width: "100%", padding: "14px", fontSize: 15, marginTop: 16 }}
                        >
                            Continuar al siguiente →
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
