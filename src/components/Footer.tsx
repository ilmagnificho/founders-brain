"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.disclaimer}>
                    <span className={styles.text}>
                        This is an independent project. Not affiliated with Y Combinator.
                    </span>
                    <span className={styles.separator}>•</span>
                    <Link href="/about" className={styles.link}>
                        About
                    </Link>
                </div>
                <div className={styles.copyright}>
                    © 2024 FoundersBrain. Built with 💜 for founders.
                </div>
            </div>
        </footer>
    );
}
