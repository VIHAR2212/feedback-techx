'use client';

import Image from 'next/image';
import styles from './HeartRating.module.css';

interface HeartRatingProps {
  rating: number;
  setRating: (rating: number) => void;
}

export default function HeartRating({ rating, setRating }: HeartRatingProps) {
  return (
    <div className={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isSelected = starIndex <= rating;
        return (
          <button
            type="button"
            key={starIndex}
            className={styles.heartButton}
            onClick={() => setRating(starIndex)}
            style={{ position: 'relative' }} 
          >
            <Image
              // Conditionally add the new class ONLY for the golden heart
              className={isSelected ? styles.goldenHeartImage : ''}
              src={isSelected ? '/images/golden-heart.png' : '/images/blank-heart.png'}
              alt={isSelected ? 'Golden Heart' : 'Blank Heart'}
              fill={true}
              style={{ objectFit: 'contain' }}
            />
          </button>
        );
      })}
    </div>
  );
}