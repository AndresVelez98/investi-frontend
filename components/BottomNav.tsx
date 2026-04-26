"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    {
        href: "/dashboard",
        label: "Inicio",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
        ),
    },
    {
        href: "/chat",
        label: "Santi",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
        accent: true,
    },
    {
        href: "/learn",
        label: "Aprender",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
    {
        href: "/markets",
        label: "Mercados",
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="md:hidden"
            style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 500,
                background: "var(--bg-secondary)",
                borderTop: "1px solid var(--border)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.2)",
            }}
        >
            <div style={{ display: "flex", alignItems: "stretch" }}>
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const isChat = item.accent;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 3,
                                padding: isChat ? "6px 8px 8px" : "10px 8px 8px",
                                textDecoration: "none",
                                color: active ? "var(--accent)" : "var(--text-muted)",
                                transition: "color 0.15s ease",
                                position: "relative",
                            }}
                        >
                            {/* Chat button: elevated pill */}
                            {isChat ? (
                                <div style={{
                                    width: 46, height: 46,
                                    borderRadius: "50%",
                                    background: active
                                        ? "linear-gradient(135deg, var(--accent), #7c5ce4)"
                                        : "linear-gradient(135deg, rgba(79,126,248,0.2), rgba(124,92,228,0.2))",
                                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border-bright)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: active ? "#fff" : "var(--accent)",
                                    marginTop: -14,
                                    boxShadow: active ? "0 4px 16px rgba(79,126,248,0.4)" : "none",
                                    transition: "all 0.2s ease",
                                }}>
                                    {item.icon}
                                </div>
                            ) : (
                                <div style={{
                                    color: active ? "var(--accent)" : "var(--text-muted)",
                                    transition: "color 0.15s ease",
                                }}>
                                    {item.icon}
                                </div>
                            )}

                            <span style={{
                                fontSize: 10,
                                fontWeight: active ? 600 : 400,
                                color: active ? "var(--accent)" : "var(--text-muted)",
                                letterSpacing: "0.01em",
                            }}>
                                {item.label}
                            </span>

                            {/* Active dot */}
                            {active && !isChat && (
                                <div style={{
                                    position: "absolute",
                                    top: 6,
                                    width: 4, height: 4,
                                    borderRadius: "50%",
                                    background: "var(--accent)",
                                }} />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
