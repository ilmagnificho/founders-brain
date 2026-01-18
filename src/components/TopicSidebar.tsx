"use client";

import { topics, Topic } from "@/data/topics";
import styles from "./TopicSidebar.module.css";

interface TopicSidebarProps {
    selectedTopic: string | null;
    onTopicSelect: (topicId: string | null) => void;
    onQuestionSelect: (question: string) => void;
}

export default function TopicSidebar({
    selectedTopic,
    onTopicSelect,
    onQuestionSelect
}: TopicSidebarProps) {
    const activeTopic = topics.find(t => t.id === selectedTopic);

    const handleTopicClick = (topic: Topic) => {
        onTopicSelect(selectedTopic === topic.id ? null : topic.id);
    };

    const handleQuestionClick = (question: string) => {
        onQuestionSelect(question);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>📚 토픽</h2>
                <p className={styles.subtitle}>무엇에 대해 알고 싶으세요?</p>
            </div>

            {/* Topic List */}
            <div className={styles.topicList}>
                {topics.map((topic) => (
                    <button
                        key={topic.id}
                        className={`${styles.topicItem} ${selectedTopic === topic.id ? styles.active : ""}`}
                        onClick={() => handleTopicClick(topic)}
                    >
                        <span className={styles.topicIcon}>{topic.icon}</span>
                        <span className={styles.topicName}>{topic.name}</span>
                        <span className={styles.topicArrow}>
                            {selectedTopic === topic.id ? "▼" : "▶"}
                        </span>
                    </button>
                ))}
            </div>

            {/* Suggested Questions for Selected Topic */}
            {activeTopic && (
                <div className={styles.questionsPanel}>
                    <p className={styles.questionsTitle}>
                        💡 추천 질문
                    </p>
                    <div className={styles.questions}>
                        {activeTopic.suggestedQuestions.map((question, index) => (
                            <button
                                key={index}
                                className={styles.questionButton}
                                onClick={() => handleQuestionClick(question)}
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className={styles.footer}>
                <p className={styles.footerText}>
                    25개 핵심 강의 기반
                </p>
            </div>
        </div>
    );
}
