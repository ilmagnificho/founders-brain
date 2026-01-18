import Link from "next/link";
import styles from "./page.module.css";

export default function AboutPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    ← Back to FoundersBrain
                </Link>
            </header>

            <main className={styles.main}>
                <h1 className={styles.title}>About FoundersBrain</h1>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>🚀 What is FoundersBrain?</h2>
                    <p className={styles.text}>
                        FoundersBrain is an AI-powered assistant that helps founders get instant answers
                        from Y Combinator Startup School content. Ask any startup-related question and
                        get insights backed by YC partners' advice.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>⚠️ Disclaimer</h2>
                    <div className={styles.disclaimer}>
                        <p>
                            <strong>This is an independent project.</strong> FoundersBrain is not
                            affiliated with, endorsed by, or officially connected to Y Combinator
                            in any way.
                        </p>
                        <p>
                            The content is derived from publicly available Y Combinator Startup School
                            videos on YouTube. All original content belongs to Y Combinator.
                        </p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>💡 Current Status</h2>
                    <div className={styles.statusBadge}>
                        <span className={styles.betaTag}>BETA</span>
                        <span>Free during beta period</span>
                    </div>
                    <p className={styles.text}>
                        FoundersBrain is currently in beta and free to use. We're actively
                        improving the experience based on user feedback.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📅 Roadmap</h2>
                    <ul className={styles.roadmap}>
                        <li>✅ 25 YC Startup School videos indexed</li>
                        <li>✅ Korean language support</li>
                        <li>🔜 More video content</li>
                        <li>🔜 Conversation history</li>
                        <li>🔜 Pro features for power users</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>📬 Contact</h2>
                    <p className={styles.text}>
                        Questions or feedback? Reach out at{" "}
                        <a href="mailto:hello@foundersbrain.ai" className={styles.emailLink}>
                            hello@foundersbrain.ai
                        </a>
                    </p>
                </section>
            </main>

            <footer className={styles.footer}>
                <p>© 2024 FoundersBrain. Built with 💜 for founders.</p>
            </footer>
        </div>
    );
}
