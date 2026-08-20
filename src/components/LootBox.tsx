'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './LootBox.module.css';

// Define the possible rewards
const rewards = [
  { name: 'a Diamond!', image: '/images/diamond.png' },
  { name: 'an Emerald!', image: '/images/emerald.png' },
  { name: 'a Golden Apple!', image: '/images/golden_apple.png' },
];

export default function LootBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [reward, setReward] = useState<{ name: string; image: string } | null>(null);

  const openBox = () => {
    if (!isOpen) {
      // Pick a random reward
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setReward(randomReward);
      setIsOpen(true);
    }
  };

  return (
    <div className={styles.container}>
      {!isOpen && (
        <>
          <p style={{ color: '#a0a0a0' }}>Click the chest to open your reward!</p>
          <button onClick={openBox} className={styles.chestButton}>
            <Image src="/images/chest.png" alt="Loot Box" width={128} height={128} />
          </button>
        </>
      )}

      {isOpen && reward && (
        <div className={`${styles.rewardContainer} ${styles.revealed}`}>
          <Image src={reward.image} alt={reward.name} width={96} height={96} />
          <p className={styles.rewardText}>You got {reward.name}</p>
        </div>
      )}
    </div>
  );
}