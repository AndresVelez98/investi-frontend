"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import ChatInterface from "./ChatInterface";

export default function FloatingChatWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const open = () => { setIsOpen(true); setIsMinimized(false); };
    const close = () => setIsOpen(false);
    const minimize = () => setIsMinimized(true);
    const restore = () => setIsMinimized(false);

    const windowHeight = isMinimized ? 44 : 590;

    const chatContent = (
        <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 13 }}>
                Cargando...
            </div>
        }>
            <ChatInterface mode="floating" />
        </Suspense>
    );

    return (
        <>
            {/* ── MOBILE: Full-screen overlay ── */}
            {isMobile && isOpen && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 2000,
                    background: "var(--bg-secondary)",
                    display: "flex",
                    flexDirection: "column",
                }}>
                    {/* Mobile title bar */}
                    <div style={{
                        background: "var(--bg-card)",
                        borderBottom: "1px solid var(--border)",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        userSelect: "none",
                    }}>
                        {/* Santi info */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0,
                            }}>S</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Santi</div>
                                <div style={{ fontSize: 11, color: "#00b894", fontWeight: 500 }}>● Asesor Financiero IA</div>
                            </div>
                        </div>

                        {/* Close X */}
                        <button
                            onClick={close}
                            style={{
                                width: 36, height: 36,
                                background: "transparent",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: "var(--text-secondary)",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--red-bg)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Chat content — fills remaining space */}
                    <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                        {chatContent}
                    </div>
                </div>
            )}

            {/* ── DESKTOP: Mac-style floating window + FAB ── */}
            <div style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                // Hide FAB on mobile when chat is open
                visibility: (isMobile && isOpen) ? "hidden" : "visible",
            }}>
                {/* Desktop mac window */}
                {!isMobile && (
                    <div style={{
                        width: 400,
                        height: isOpen ? windowHeight : 0,
                        marginBottom: isOpen ? 12 : 0,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        boxShadow: "0 28px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        transformOrigin: "bottom right",
                        transform: isOpen ? "scale(1) translateY(0)" : "scale(0.88) translateY(16px)",
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? "all" : "none",
                        transition: [
                            "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                            "opacity 0.22s ease",
                            "height 0.25s cubic-bezier(0.4,0,0.2,1)",
                            "margin-bottom 0.25s ease",
                        ].join(", "),
                    }}>
                        {/* Mac Title Bar */}
                        <div style={{
                            background: "var(--bg-card)",
                            borderBottom: "1px solid var(--border)",
                            padding: "11px 14px",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexShrink: 0,
                            userSelect: "none",
                            cursor: "default",
                        }}>
                            {/* Traffic lights */}
                            <div style={{ display: "flex", gap: 7 }}>
                                <button onClick={close} title="Cerrar"
                                    style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", border: "none", cursor: "pointer", transition: "filter 0.15s ease" }}
                                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.2)")}
                                    onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
                                />
                                <button onClick={isMinimized ? restore : minimize} title={isMinimized ? "Restaurar" : "Minimizar"}
                                    style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", border: "none", cursor: "pointer", transition: "filter 0.15s ease" }}
                                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.2)")}
                                    onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
                                />
                                <button onClick={() => router.push("/chat")} title="Pantalla completa"
                                    style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", border: "none", cursor: "pointer", transition: "filter 0.15s ease" }}
                                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.2)")}
                                    onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
                                />
                            </div>

                            {/* Title */}
                            <div style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: 0.2 }}>
                                Santi — Asesor Financiero IA
                            </div>
                            <div style={{ width: 46 }} />
                        </div>

                        {/* Chat content */}
                        {!isMinimized && (
                            <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                                {chatContent}
                            </div>
                        )}
                    </div>
                )}

                {/* FAB — always visible on desktop; on mobile only when chat is closed */}
                <button
                    onClick={isOpen ? (isMinimized ? restore : close) : open}
                    title={isOpen ? "Cerrar chat" : "Hablar con Santi"}
                    style={{
                        width: 54, height: 54,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent) 0%, #7c5ce4 100%)",
                        border: "2px solid rgba(255,255,255,0.12)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 8px 28px rgba(79,126,248,0.5)",
                        color: "#fff",
                        fontSize: 20, fontWeight: 800,
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: -0.5,
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(79,126,248,0.65)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(79,126,248,0.5)"; }}
                >
                    {isOpen && !isMinimized && !isMobile ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    ) : "S"}
                </button>
            </div>
        </>
    );
}
