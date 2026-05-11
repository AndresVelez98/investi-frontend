export type UserProfile = "Conservador" | "Moderado" | "Agresivo";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("token");
}

export function getUserName(): string {
    if (typeof window === "undefined") return "Inversor";
    return (
        sessionStorage.getItem("userName") ||
        localStorage.getItem("investi_name") ||
        "Inversor"
    );
}

export function getUserProfile(): UserProfile {
    if (typeof window === "undefined") return "Moderado";
    const p =
        sessionStorage.getItem("profile") ||
        localStorage.getItem("investi_profile");
    if (p === "Conservador" || p === "Agresivo") return p;
    return "Moderado";
}

export function clearSession(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("profile");
    localStorage.removeItem("investi_name");
    localStorage.removeItem("investi_profile");
    document.cookie = "investi_token=; path=/; max-age=0";
}
