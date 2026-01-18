"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function AboutPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    ← FoundersBrain으로 돌아가기
                </Link>
            </header>

            <main className={styles.main}>
                <h1 className={styles.title}>FoundersBrain 소개</h1>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🚀 만든 이유</h2>
                    <p className={styles.text}>
                        한 명의 창업자로서 YC Startup School 영상을 보고, 정리 노트를 만들고,
                        핵심 내용을 찾아보는 것만으로는 부족하다고 느꼈습니다.
                    </p>
                    <p className={styles.text}>
                        <strong>영상과 대화하며 학습할 수 있다면?</strong> 궁금한 점을 바로 질문하고,
                        YC 파트너들의 조언에서 답을 찾을 수 있다면 더 효과적으로 배울 수 있지 않을까요?
                    </p>
                    <p className={styles.text}>
                        그래서 FoundersBrain을 만들었습니다. 현재는 YC Startup School 강의 25개를
                        기반으로 하며, 앞으로 스타트업에 도움이 되는 다양한 양질의 콘텐츠를
                        지속적으로 추가할 예정입니다.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>💡 FoundersBrain이란?</h2>
                    <p className={styles.text}>
                        FoundersBrain은 스타트업 교육 콘텐츠를 기반으로 한
                        AI 창업 도우미입니다. 창업 관련 질문을 하면, 영상 콘텐츠에서
                        근거를 찾아 즉시 답변해 드립니다.
                    </p>
                    <p className={styles.text}>
                        🖥️ <strong>웹에 최적화</strong>되어, 별도 앱 설치 없이
                        브라우저에서 바로 사용할 수 있습니다.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>⚠️ 고지 사항</h2>
                    <div className={styles.disclaimer}>
                        <p>
                            <strong>본 서비스는 독립적인 개인 프로젝트입니다.</strong> FoundersBrain은
                            Y Combinator와 제휴, 후원, 공식 연계가 없습니다.
                        </p>
                        <p>
                            콘텐츠는 YouTube에 공개된 영상들을 기반으로 하며,
                            모든 원본 콘텐츠의 저작권은 해당 제작자에게 있습니다.
                        </p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📅 현재 상태</h2>
                    <div className={styles.statusBadge}>
                        <span className={styles.betaTag}>BETA</span>
                        <span>베타 기간 동안 무료 이용</span>
                    </div>
                    <p className={styles.text}>
                        현재 베타 버전으로 무료로 사용하실 수 있습니다.
                        사용자 피드백을 바탕으로 계속 개선하고 있습니다.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🎯 수록 콘텐츠</h2>
                    <ul className={styles.roadmap}>
                        <li>✅ YC Startup School 영상 25개</li>
                        <li>✅ 한국어 지원</li>
                        <li>🔜 더 다양한 스타트업 교육 콘텐츠 추가</li>
                        <li>🔜 대화 기록 저장</li>
                        <li>🔜 프로 기능</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📬 문의</h2>
                    <p className={styles.text}>
                        질문이나 피드백은{" "}
                        <a href="mailto:info@tetracorp.co.kr" className={styles.emailLink}>
                            info@tetracorp.co.kr
                        </a>
                        로 보내주세요.
                    </p>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>© 2024 FoundersBrain. 창업자를 위해 💜로 만들었습니다.</p>
            </footer>
        </div>
    );
}
