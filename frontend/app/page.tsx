import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.suitsBg} aria-hidden>
        <span>♠</span><span>♥</span><span>♣</span><span>♦</span>
      </div>
      <div className={styles.hero}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>♠</div>
          <h1 className={styles.logoText}>PokerIQ</h1>
        </div>
        <p className={styles.tagline}>Live heads-up Texas Hold&apos;em with friends.</p>
        <p className={styles.sub}>Real-time play. Real-time coaching. No downloads.</p>
        <div className={styles.ctaRow}>
          <Link href="/register" className={styles.ctaPrimary}>Create Account</Link>
          <Link href="/login" className={styles.ctaSecondary}>Sign In</Link>
        </div>
        <div className={styles.features}>
          <div className={styles.feature}><span className={styles.featureIcon}>♦</span><span>1v1 Real-Time Play</span></div>
          <div className={styles.feature}><span className={styles.featureIcon}>♣</span><span>GTO Coaching</span></div>
          <div className={styles.feature}><span className={styles.featureIcon}>♥</span><span>Hand History &amp; Stats</span></div>
        </div>
      </div>
    </div>
  );
}
