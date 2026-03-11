"use client";
import Sidebar from "../../components/Sidebar";
import Dashboard from "../../components/Dashboard";

export default function DashboardPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Dashboard />
            </main>
        </div>
    );
}
