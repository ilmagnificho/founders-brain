"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Chat from "@/components/Chat";
import TopicSidebar from "@/components/TopicSidebar";
import VideoPanel from "@/components/VideoPanel";
import styles from "./page.module.css";

export default function HomePage() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [autoSubmit, setAutoSubmit] = useState(false);

    // Mobile drawer states
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileVideoOpen, setIsMobileVideoOpen] = useState(false);

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

    // Handle question selection from sidebar - now auto-submits!
    const handleQuestionSelect = useCallback((question: string) => {
        setInputValue(question);
        setAutoSubmit(true); // Trigger auto-submit
        setIsMobileMenuOpen(false); // Close mobile drawer after selection
    }, []);

    const handleAutoSubmitComplete = useCallback(() => {
        setAutoSubmit(false);
    }, []);

    // Close drawers when clicking overlay
    const closeMobileDrawers = () => {
        setIsMobileMenuOpen(false);
        setIsMobileVideoOpen(false);
    };

    return (
        <main className={styles.main}>
            {/* Header */}
            <header className={styles.header}>
                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileHeaderButton}
                    onClick={() => setIsMobileMenuOpen(true)}
                    aria-label="토픽 메뉴 열기"
                >
                    ☰
                </button>

                <div className={styles.logo}>
                    <div className={styles.logoIcon}>YC</div>
                    <span className={styles.logoText}>FoundersBrain</span>
                    <span className={styles.betaBadge}>Beta</span>
                </div>
                <div className={styles.headerRight}>
                    {/* Mobile Video Button */}
                    <button
                        className={styles.mobileHeaderButton}
                        onClick={() => setIsMobileVideoOpen(true)}
                        aria-label="비디오 라이브러리 열기"
                    >
                        🎬
                    </button>

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

            {/* Mobile Overlay */}
            {(isMobileMenuOpen || isMobileVideoOpen) && (
                <div
                    className={styles.mobileOverlay}
                    onClick={closeMobileDrawers}
                />
            )}

            {/* Mobile Left Drawer - Topics */}
            <div className={`${styles.mobileDrawer} ${styles.mobileDrawerLeft} ${isMobileMenuOpen ? styles.mobileDrawerOpen : ""}`}>
                <div className={styles.mobileDrawerHeader}>
                    <h3>📚 토픽 선택</h3>
                    <button
                        className={styles.mobileDrawerClose}
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <TopicSidebar
                    selectedTopic={selectedTopic}
                    onTopicSelect={setSelectedTopic}
                    onQuestionSelect={handleQuestionSelect}
                />
            </div>

            {/* Mobile Right Drawer - Videos */}
            <div className={`${styles.mobileDrawer} ${styles.mobileDrawerRight} ${isMobileVideoOpen ? styles.mobileDrawerOpen : ""}`}>
                <div className={styles.mobileDrawerHeader}>
                    <h3>🎬 비디오 라이브러리</h3>
                    <button
                        className={styles.mobileDrawerClose}
                        onClick={() => setIsMobileVideoOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <VideoPanel />
            </div>

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
                        autoSubmit={autoSubmit}
                        onAutoSubmitComplete={handleAutoSubmitComplete}
                        onQuestionSelect={handleQuestionSelect}
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
