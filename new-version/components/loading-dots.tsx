import type { CSSProperties } from "react";

import styles from "./loading-dots.module.css";

type LoadingDotsProps = {
    size?: number;
    gap?: number;
    color?: string;
    className?: string;
};

export function LoadingDots({
    size = 12,
    gap = 10,
    color = "#0062db",
    className,
}: LoadingDotsProps) {
    const style: CSSProperties = {
        "--dot-size": `${size}px`,
        "--dot-gap": `${gap}px`,
        "--dot-color": color,
    } as CSSProperties;

    return (
        <div
            className={className ? `${styles.container} ${className}` : styles.container}
            style={style}
            role="status"
            aria-live="polite"
            aria-label="Loading"
        >
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
        </div>
    );
}
