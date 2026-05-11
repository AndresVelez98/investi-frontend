"use client";
import { useState, useEffect, useCallback } from "react";

export function useTheme() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem("investi_theme") as "dark" | "light" | null;
        const initial = saved || "dark";
        setTheme(initial);
        document.documentElement.setAttribute("data-theme", initial);
    }, []);

    const toggle = useCallback(() => {
        if (typeof window === "undefined") return;
        setTheme(prev => {
            const next = prev === "dark" ? "light" : "dark";
            localStorage.setItem("investi_theme", next);
            document.documentElement.setAttribute("data-theme", next);
            return next;
        });
    }, []);

    return { theme, toggle };
}
