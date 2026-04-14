"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
    {
        href: "/dashboard",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
        label: "Dashboard",
    },
    {
        href: "/learn",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
        label: "Aprender",
    },
    {
        href: "/chat",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
        label: "Chat IA",
    },
    {
        href: "/calculator",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
            </svg>
        ),
        label: "Calculadora",
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const handleSalir = () => {
        router.push("/dashboard");
    };

    return (
        <aside
            style={{
                width: collapsed ? 64 : 220,
                background: "var(--bg-secondary)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                padding: "20px 0",
                transition: "width 0.25s ease",
                flexShrink: 0,
                position: "sticky",
                top: 0,
                height: "100vh",
                overflow: "hidden",
            }}
        >
            {/* Logo */}
            <div style={{ padding: "0 16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {!collapsed && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "linear-gradient(135deg, var(--accent), #7c5ce4)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, flexShrink: 0,
                        }}>📈</div>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Investi AI</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", padding: 4, borderRadius: 6,
                        display: "flex", alignItems: "center", marginLeft: collapsed ? "auto" : 0,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {collapsed
                            ? <path d="M9 18l6-6-6-6" />
                            : <path d="M15 18l-6-6 6-6" />}
                    </svg>
                </button>
            </div>

            {/* Nav Links */}
            <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: collapsed ? "10px 0" : "10px 12px",
                                borderRadius: "var(--radius-sm)",
                                textDecoration: "none",
                                color: active ? "var(--accent)" : "var(--text-secondary)",
                                background: active ? "var(--accent-glow)" : "transparent",
                                fontWeight: active ? 600 : 400,
                                fontSize: 14,
                                transition: "all 0.15s ease",
                                justifyContent: collapsed ? "center" : "flex-start",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{ padding: collapsed ? "12px 8px" : "12px 8px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Settings link */}
                <Link
                    href="/settings"
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: collapsed ? "10px 0" : "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        textDecoration: "none",
                        color: pathname === "/settings" ? "var(--accent)" : "var(--text-secondary)",
                        background: pathname === "/settings" ? "var(--accent-glow)" : "transparent",
                        fontSize: 14, fontWeight: pathname === "/settings" ? 600 : 400,
                        transition: "all 0.15s ease",
                        justifyContent: collapsed ? "center" : "flex-start",
                        whiteSpace: "nowrap",
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    {!collapsed && <span>Configuración</span>}
                </Link>

                {/* Salir button */}
                <button
                    onClick={handleSalir}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: collapsed ? "10px 0" : "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: 14, fontWeight: 400,
                        transition: "all 0.15s ease",
                        justifyContent: collapsed ? "center" : "flex-start",
                        whiteSpace: "nowrap", width: "100%",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-bg)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {!collapsed && <span>Salir</span>}
                </button>

                {!collapsed && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5, padding: "8px 12px 0" }}>
                        ⚠️ Solo uso educativo.<br />No es asesoría financiera oficial.
                    </p>
                )}
            </div>
        </aside>
    );
}
