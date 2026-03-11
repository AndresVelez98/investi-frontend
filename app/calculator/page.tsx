"use client";
import Sidebar from "../../components/Sidebar";
import Calculator from "../../components/Calculator";

export default function CalculatorPage() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Calculator />
            </main>
        </div>
    );
}
