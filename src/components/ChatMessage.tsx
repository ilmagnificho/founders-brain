"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { videos } from "@/data/topics";
import styles from "./ChatMessage.module.css";

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

interface ChatMessageProps {
    message: Message;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getVideoIdFromUrl(url: string): string | null {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
}

function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Resolves a video title from the source data.
 * When API returns a raw video ID or "video_id: {id}" as title, this looks up the real title.
 */
function resolveVideoTitle(source: Source): string {
    // Pattern for YouTube video IDs (11 characters, alphanumeric with _ and -)
    const videoIdPattern = /^[a-zA-Z0-9_-]{10,12}$/;
    let searchId = source.videoId;

    // Handle "video_id: {id}" prefix pattern from API
    if (source.title?.toLowerCase().startsWith("video_id:")) {
        searchId = source.title.replace(/video_id:\s*/i, "").trim();
        const video = videos.find(v => v.id === searchId);
        if (video) return video.title;
    }

    // If title looks like a video ID, try to find the real title
    if (source.title && videoIdPattern.test(source.title)) {
        const video = videos.find(v => v.id === source.title || v.id === source.videoId);
        if (video) return video.title;
    }

    // Try to look up by videoId field
    if (source.videoId) {
        const video = videos.find(v => v.id === source.videoId);
        if (video) return video.title;
    }

    // Try to extract video ID from URL and look up
    const urlVideoId = getVideoIdFromUrl(source.url);
    if (urlVideoId) {
        const video = videos.find(v => v.id === urlVideoId);
        if (video) return video.title;
    }

    // Fallback to the provided title or a generic label
    return source.title || "YC Startup School Lecture";
}

// =============================================================================
// Sub-Components
// =============================================================================

function YCBadge() {
    return (
        <div className={styles.ycBadge}>
            <span className={styles.ycLogo}>Y</span>
            <span className={styles.ycText}>Based on YC Startup School</span>
        </div>
    );
}

function SourceCard({ source }: { source: Source }) {
    const videoId = getVideoIdFromUrl(source.url);
    const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId) : null;
    const displayTitle = resolveVideoTitle(source);

    return (
        <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceCard}
        >
            {/* Thumbnail */}
            {thumbnailUrl && (
                <div className={styles.thumbnail}>
                    <img
                        src={thumbnailUrl}
                        alt={displayTitle}
                        className={styles.thumbnailImg}
                    />
                    <div className={styles.playOverlay}>
                        <span className={styles.playIcon}>▶</span>
                        <span className={styles.timestampBadge}>
                            {formatTimestamp(source.timestamp)}
                        </span>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className={styles.sourceCardInfo}>
                <span className={styles.sourceCardTitle}>{displayTitle}</span>
                {source.speaker && (
                    <span className={styles.sourceCardSpeaker}>
                        👤 {source.speaker}
                    </span>
                )}
                <div className={styles.sourceCardMeta}>
                    <span className={styles.ycTag}>YC Startup School</span>
                    <span className={styles.watchCta}>
                        ▶ {formatTimestamp(source.timestamp)} 시점 재생
                    </span>
                </div>
            </div>
        </a>
    );
}

// =============================================================================
// ChatMessage Component
// =============================================================================

export default function ChatMessage({ message }: ChatMessageProps) {
    const { role, content, sources = [] } = message;
    const isUser = role === "user";

    if (isUser) {
        return (
            <div className={`${styles.message} ${styles.user}`}>
                {/* Avatar */}
                <div className={styles.avatar}>
                    {"👤"}
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.text}>
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    // Assistant message
    const speaker = sources.length > 0 ? (sources[0].speaker || "YC Partner") : "YC Partner";

    return (
        <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.avatar}>
                🧠
            </div>
            <div className={styles.contentWrapper}>
                {/* Speaker Header */}
                <div className={styles.speakerHeader}>
                    <span className={styles.speakerName}>Based on {speaker}'s advice</span>
                </div>

                <div className={styles.content}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ node, ...props }) => <p className={styles.p} {...props} />,
                            ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
                            ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
                            li: ({ node, ...props }) => <li className={styles.li} {...props} />,
                            h3: ({ node, ...props }) => <h3 className={styles.h3} {...props} />,
                            blockquote: ({ node, ...props }) => <blockquote className={styles.quote} {...props} />,
                            strong: ({ node, ...props }) => <strong className={styles.strong} {...props} />,
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>

                {/* Enhanced Sources */}
                {sources.length > 0 && (
                    <div className={styles.sources}>
                        <p className={styles.sourcesTitle}>
                            🎬 원본 영상에서 확인하기
                        </p>
                        <div className={styles.sourceCards}>
                            {message.sources?.map((source, index) => (
                                <SourceCard key={index} source={source} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

