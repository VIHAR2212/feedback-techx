'use client';

import styles from './PortalAnimation.module.css';

export default function PortalAnimation() {
  return (
    <div className={styles.overlay}>
      {/* This audio element will now play your local sound file */}
      <audio autoPlay>
        <source src="/sounds/portail-du-nether.mp3" type="audio/mpeg" />
      </audio>

      <span className={styles.loadingText}>Loading Terrain...</span>
    </div>
  );
}