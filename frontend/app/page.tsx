import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Background elements */}
      <div className={styles.bgGradient} aria-hidden />
      <div className={styles.stars} aria-hidden />
      <div className={styles.seaHorizon} aria-hidden />
      <div className={styles.seaShimmer} aria-hidden />

      {/* Greek columns decoration */}
      <div className={styles.columns} aria-hidden>
        <div className={styles.column}><div className={styles.colCapital} /><div className={styles.colShaft} /><div className={styles.colBase} /></div>
        <div className={styles.column}><div className={styles.colCapital} /><div className={styles.colShaft} /><div className={styles.colBase} /></div>
      </div>

      <div className={styles.hero}>
        {/* Meander top border */}
        <div className={styles.meanderTop} aria-hidden />

        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>♠</div>
          <h1 className={styles.logoText}>PokerIQ</h1>
        </div>

        <div className={styles.subtitle}>
          <span className={styles.subtitleAccent}>——</span>
          <span className={styles.subtitleText}>ΠΟΚΕΡ ΑΠΟ ΤΗΝ ΕΛΛΑΔΑ</span>
          <span className={styles.subtitleAccent}>——</span>
        </div>

        <p className={styles.tagline}>Live heads-up Texas Hold&apos;em with friends.</p>
        <p className={styles.sub}>Real-time play. Real-time coaching. No downloads.</p>

        <div className={styles.ctaRow}>
          <Link href="/register" className={styles.ctaPrimary}>Create Account</Link>
          <Link href="/login" className={styles.ctaSecondary}>Sign In</Link>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}><span className={styles.featureIcon}>⚔</span><span>1v1 Live Play</span></div>
          <div className={styles.feature}><span className={styles.featureIcon}>🏛</span><span>GTO Coaching</span></div>
          <div className={styles.feature}><span className={styles.featureIcon}>⚱</span><span>Stats &amp; History</span></div>
        </div>

        {/* Meander bottom border */}
        <div className={styles.meanderBottom} aria-hidden />
      </div>
    </div>
  );
}
