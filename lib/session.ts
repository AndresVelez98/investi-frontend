"use client";

export type UserProfile = "Conservador" | "Moderado" | "Agresivo";

export function getToken(): string | null {
    return sessionStorage.getItem("token");
}

export function getUserName(): string {
    return (
        sessionStorage.getItem("userName") ||
        localStorage.getItem("investi_name") ||
        "Inversor"
    );
}

export function getUserProfile(): UserProfile {
    const p =
        sessionStorage.getItem("profile") ||
        localStorage.getItem("investi_profile");
    if (p === "Conservador" || p === "Agresivo") return p;
    return "Moderado";
}

export function clearSession(): void {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("profile");
    localStorage.removeItem("investi_name");
    localStorage.removeItem("investi_profile");
    document.cookie = "investi_token=; path=/; max-age=0";
}
