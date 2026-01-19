"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import ChatMessage from "./ChatMessage";
import TopicCarousel from "./TopicCarousel";
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
    autoSubmit?: boolean; // New: trigger auto-submit
    onAutoSubmitComplete?: () => void; // New: callback after auto-submit
    onQuestionSelect?: (question: string) => void; // New: for TopicCarousel in empty state
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = "foundersbrain_chat_history";

// =============================================================================
// Chat Component
// =============================================================================

export default function Chat({
    inputValue,
    setInputValue,
    autoSubmit = false,
    onAutoSubmitComplete,
    onQuestionSelect
}: ChatProps) {
    const t = useTranslations("chat");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastUserMsgRef = useRef<HTMLDivElement>(null);

    // Load chat history from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load chat history:", e);
        }
    }, []);

    // Save chat history to localStorage when messages change
    useEffect(() => {
        if (messages.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            } catch (e) {
                console.error("Failed to save chat history:", e);
            }
        }
    }, [messages]);

    // Auto-scroll to show the user's question at top when new messages arrive
    useEffect(() => {
        if (lastUserMsgRef.current) {
            lastUserMsgRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [messages]);

    const submitQuestion = useCallback(async (question: string) => {
        if (!question.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: question.trim(),
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
    }, [isLoading, setInputValue, t]);

    // Handle auto-submit when triggered from parent
    const prevAutoSubmitRef = useRef(false);
    useEffect(() => {
        // Only trigger when autoSubmit changes from false to true
        if (autoSubmit && !prevAutoSubmitRef.current && inputValue.trim() && !isLoading) {
            submitQuestion(inputValue);
            onAutoSubmitComplete?.();
        }
        prevAutoSubmitRef.current = autoSubmit;
    }, [autoSubmit, inputValue, isLoading, submitQuestion, onAutoSubmitComplete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitQuestion(inputValue);
    };

    const handleClearHistory = () => {
        setMessages([]);
        setInputValue("");
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleShareChat = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (e) {
            console.error("Failed to copy:", e);
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
                <div className={styles.headerActions}>
                    {messages.length > 0 && (
                        <>
                            <button
                                onClick={handleShareChat}
                                className={styles.shareButton}
                                title="링크 복사"
                            >
                                {isCopied ? "✓ 복사됨" : "🔗 공유"}
                            </button>
                            <button
                                onClick={handleClearHistory}
                                className={styles.resetButton}
                                title="새 대화 시작"
                            >
                                🔄 새 대화
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
                {messages.length === 0 ? (
                    <div className={styles.empty}>
                        {onQuestionSelect ? (
                            <TopicCarousel onQuestionSelect={onQuestionSelect} />
                        ) : (
                            <>
                                <div className={styles.emptyIcon}>🧠</div>
                                <h3 className={styles.emptyTitle}>궁금한 것을 물어보세요</h3>
                                <p className={styles.emptyText}>
                                    왼쪽 토픽에서 주제를 선택하거나<br />
                                    아래에 직접 질문을 입력해보세요
                                </p>
                                <div className={styles.emptyHint}>
                                    <span className={styles.hintIcon}>💡</span>
                                    <span>예시: "MVP는 어떻게 만들어야 하나요?"</span>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isLastUserMessage =
                                message.role === "user" &&
                                index === messages.map(m => m.role).lastIndexOf("user");

                            return (
                                <div
                                    key={message.id}
                                    ref={isLastUserMessage ? lastUserMsgRef : undefined}
                                >
                                    <ChatMessage message={message} />
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                    <div className={styles.loading}>
                        <div className={styles.loadingAvatar}>🧠</div>
                        <div className={styles.loadingContent}>
                            <p className={styles.loadingText}>AI가 답변을 생성하고 있어요</p>
                            <div className={styles.loadingDots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t("placeholder")}
                    className={styles.input}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className={styles.sendButton}
                >
                    {t("send")}
                </button>
            </form>
        </div>
    );
}
