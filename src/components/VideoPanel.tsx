"use client";

import { videos } from "@/data/topics";
import styles from "./VideoPanel.module.css";

export default function VideoPanel() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>🎬 영상 라이브러리</h3>
            </div>

            <p className={styles.subtitle}>YC Startup School - {videos.length}개 강의 수록</p>

            {/* Video List */}
            <div className={styles.videoList}>
                {videos.map((video) => (
                    <a
                        key={video.id}
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.card}
                    >
                        <div className={styles.thumbnail}>
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className={styles.thumbnailImg}
                            />
                            <div className={styles.playOverlay}>
                                <span className={styles.playIcon}>▶</span>
                            </div>
                        </div>

                        <div className={styles.info}>
                            <h4 className={styles.videoTitle}>{video.title}</h4>
                            <p className={styles.speaker}>{video.speaker}</p>
                            <span className={styles.tag}>#{video.category}</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
