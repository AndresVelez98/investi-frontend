"use client";
import { Suspense } from "react";
import Sidebar from "../../components/Sidebar";
import ChatInterface from "../../components/ChatInterface";

export default function ChatPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content" style={{ overflow: "hidden" }}>
                <Suspense fallback={null}>
                    <ChatInterface />
                </Suspense>
            </main>
        </div>
    );
}
