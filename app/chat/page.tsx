"use client";
import { Suspense } from "react";
import ChatInterface from "../../components/ChatInterface";

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--text-muted)", padding: 40 }}>Cargando chat...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
