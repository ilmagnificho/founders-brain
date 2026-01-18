import Chat from "@/components/Chat";
import styles from "./page.module.css";

export default function HomePage() {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <Chat />
            </div>
        </main>
    );
}
