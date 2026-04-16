"use client";
import Sidebar from "../../components/Sidebar";
import Calculator from "../../components/Calculator";
import BottomNav from "../../components/BottomNav";

export default function CalculatorPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Calculator />
            </main>
            <BottomNav />
        </div>
    );
}
