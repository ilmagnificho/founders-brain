"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import ChatMessage from "./ChatMessage";
import TopicCarousel from "./TopicCarousel";
import VideoLibrary from "./VideoLibrary";
import Footer from "./Footer";
import styles from "./Chat.module.css";

// =============================================================================
// Types
// =============================================================================

interface Source {
    title: string;
    url: string;
    timestamp: number;
    speaker?: string;
    videoId?: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: Source[];
}

// =============================================================================
// Chat Component
// =============================================================================

export default function Chat() {
    const t = useTranslations("chat");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    locale: "ko"
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response");
            }

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.answer,
                sources: data.sources,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: t("error"),
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTitleGroup}>
                    <div className={styles.titleRow}>
                        <h2 className={styles.title}>{t("title")}</h2>
                        <span className={styles.betaBadge}>Beta</span>
                    </div>
                    <p className={styles.subtitle}>{t("subtitle")}</p>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={() => {
                            setMessages([]);
                            setInput("");
                        }}
                        className={styles.resetButton}
                        title="첫 화면으로 돌아가기"
                    >
                        🔄 처음으로
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        <TopicCarousel onQuestionSelect={(q) => {
                            setInput(q);
                            // Optional: auto-submit or focus input?
                            // For now, just set input so user can confirm/edit
                        }} />
                        <VideoLibrary />
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))
                )}

                {isLoading && (
                    <div className={styles.loading}>
                        <div className={styles.loadingDots}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <p>{t("thinking")}</p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("placeholder")}
                    disabled={isLoading}
                    className={styles.input}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={styles.sendButton}
                >
                    {isLoading ? "..." : t("send")}
                </button>
            </form>

            {/* Footer */}
            <Footer />
        </div>
    );
}

