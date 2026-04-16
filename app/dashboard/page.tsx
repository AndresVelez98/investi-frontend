"use client";
import Sidebar from "../../components/Sidebar";
import Dashboard from "../../components/Dashboard";
import FloatingChatWidget from "../../components/FloatingChatWidget";
import BottomNav from "../../components/BottomNav";

export default function DashboardPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Dashboard />
            </main>
            <FloatingChatWidget />
            <BottomNav />
        </div>
    );
}
