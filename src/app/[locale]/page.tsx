"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Chat from "@/components/Chat";
import TopicSidebar from "@/components/TopicSidebar";
import VideoPanel from "@/components/VideoPanel";
import styles from "./page.module.css";

export default function HomePage() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            setTheme("dark");
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    // Handle question selection from sidebar
    const handleQuestionSelect = (question: string) => {
        setInputValue(question);
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>YC</div>
                    <span className={styles.logoText}>FoundersBrain</span>
                    <span className={styles.betaBadge}>Beta</span>
                </div>
                <div className={styles.headerRight}>
                    <Link href="/about" className={styles.aboutLink}>
                        소개
                    </Link>
                    <button
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
                    >
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                </div>
            </header>

            {/* 3-Column Layout */}
            <div className={styles.layoutContainer}>
                {/* Left Sidebar - Topics */}
                <aside className={styles.sidebar}>
                    <TopicSidebar
                        selectedTopic={selectedTopic}
                        onTopicSelect={setSelectedTopic}
                        onQuestionSelect={handleQuestionSelect}
                    />
                </aside>

                {/* Main Chat Area */}
                <section className={styles.chatArea}>
                    <Chat
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                    />
                </section>

                {/* Right Panel - Video Library */}
                <aside className={styles.rightPanel}>
                    <VideoPanel />
                </aside>
            </div>

            {/* Footer Disclaimer */}
            <footer className={styles.footer}>
                <p className={styles.disclaimer}>
                    ⚠️ 본 서비스는 Y Combinator와 무관한 독립 프로젝트입니다.
                    <Link href="/about" className={styles.footerLink}>
                        자세히 보기
                    </Link>
                </p>
            </footer>
        </main>
    );
}
