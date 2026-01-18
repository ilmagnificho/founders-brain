"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import ChatMessage from "./ChatMessage";
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

interface ChatProps {
    inputValue: string;
    setInputValue: (value: string) => void;
}

// =============================================================================
// Chat Component
// =============================================================================

export default function Chat({ inputValue, setInputValue }: ChatProps) {
    const t = useTranslations("chat");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastUserMsgRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to show the user's question at top when new messages arrive
    useEffect(() => {
        if (lastUserMsgRef.current) {
            lastUserMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
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
            {/* Chat Header */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h2 className={styles.title}>{t("title")}</h2>
                    <p className={styles.subtitle}>{t("subtitle")}</p>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={() => {
                            setMessages([]);
                            setInputValue("");
                        }}
                        className={styles.resetButton}
                        title="새 대화 시작"
                    >
                        🔄 새 대화
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3 className={styles.emptyTitle}>궁금한 것을 물어보세요</h3>
                        <p className={styles.emptyText}>
                            왼쪽 토픽에서 주제를 선택하거나,<br />
                            아래 입력창에 직접 질문을 입력하세요.
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isLastUserMsg = message.role === "user" &&
                            messages.slice(index + 1).every(m => m.role !== "user");
                        return (
                            <div
                                key={message.id}
                                ref={isLastUserMsg ? lastUserMsgRef : undefined}
                            >
                                <ChatMessage message={message} />
                            </div>
                        );
                    })
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
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t("placeholder")}
                    disabled={isLoading}
                    className={styles.input}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className={styles.sendButton}
                >
                    {isLoading ? "..." : t("send")}
                </button>
            </form>
        </div>
    );
}
