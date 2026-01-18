"use client";

import { videos } from "@/data/topics";
import styles from "./VideoLibrary.module.css";

export default function VideoLibrary() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>🎬 수록된 영상 ({videos.length}개)</h3>
                <span className={styles.subtitle}>YC Startup School 핵심 강의</span>
            </div>

            <div className={styles.scrollWrapper}>
                <div className={styles.scrollContainer}>
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
                                <div className={styles.tags}>
                                    <span className={styles.tag}>#{video.category}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
