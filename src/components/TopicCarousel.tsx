"use client";

import { useState } from "react";
import { topics, Topic } from "@/data/topics";
import styles from "./TopicCarousel.module.css";

interface TopicCarouselProps {
    onQuestionSelect: (question: string) => void;
}

export default function TopicCarousel({ onQuestionSelect }: TopicCarouselProps) {
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

    const handleTopicClick = (topic: Topic) => {
        setSelectedTopic(selectedTopic?.id === topic.id ? null : topic);
    };

    const handleQuestionClick = (question: string) => {
        onQuestionSelect(question);
        setSelectedTopic(null);
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                📚 무엇에 대해 알고 싶으세요?
            </h2>
            <p className={styles.subtitle}>
                토픽을 선택하면 관련 질문을 추천해드려요
            </p>

            {/* Topic Pills */}
            <div className={styles.topics}>
                {topics.map((topic) => (
                    <button
                        key={topic.id}
                        className={`${styles.topicPill} ${selectedTopic?.id === topic.id ? styles.active : ""
                            }`}
                        onClick={() => handleTopicClick(topic)}
                    >
                        <span className={styles.topicIcon}>{topic.icon}</span>
                        <span className={styles.topicName}>{topic.name}</span>
                    </button>
                ))}
            </div>

            {/* Suggested Questions */}
            {selectedTopic && (
                <div className={styles.questionsPanel}>
                    <p className={styles.questionsTitle}>
                        💡 {selectedTopic.name} 관련 질문
                    </p>
                    <div className={styles.questions}>
                        {selectedTopic.suggestedQuestions.map((question, index) => (
                            <button
                                key={index}
                                className={styles.questionButton}
                                onClick={() => handleQuestionClick(question)}
                            >
                                <span className={styles.questionArrow}>→</span>
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
