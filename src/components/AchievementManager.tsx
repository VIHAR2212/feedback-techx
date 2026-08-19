'use client';

import React, { useContext, useEffect } from 'react';
import Image from 'next/image';
import { AchievementsContext, AchievementDispatchContext, Achievement } from '@/context/AchievementContext';
import styles from './AchievementManager.module.css';

// This is the component for a single popup
const SingleAchievement = ({ achievement }: { achievement: Achievement }) => {
  const setAchievements = useContext(AchievementDispatchContext);
  const { id, title, subtitle, imageUrl, duration = 3 } = achievement;

  // This useEffect handles the auto-removal by updating the state array.
  // This is the correct "React way" to remove an element.
  useEffect(() => {
    const totalDuration = (duration + 0.5) * 1000; // duration + slideOut time
    const timer = setTimeout(() => {
      // We update the state, and React handles removing the element from the DOM.
      setAchievements?.(prev => prev.filter(a => a.id !== id));
    }, totalDuration);

    // Cleanup function to prevent errors if the component is removed early.
    return () => clearTimeout(timer);
  }, [id, duration, setAchievements]);

  // This dynamically sets the animation delay based on the duration prop.
  const animationStyle = {
    animationDelay: `0s, 0.45s, ${0.45 + duration}s`,
  };
  
  return (
    <div className={styles.achievement} style={animationStyle}>
      <div className={styles.icon}>
        <Image 
          src={imageUrl || '/images/default-icon.png'} 
          alt="" 
          width={48} 
          height={48}
        />
      </div>
      <div className={styles.text}>
        <div className={styles.title}>{title}</div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>
    </div>
  );
};

// This is the main manager component that renders the list of popups
export default function AchievementManager() {
  const achievements = useContext(AchievementsContext);

  return (
    <div className={styles.achievements}>
      {achievements.map(achievement => (
        <SingleAchievement key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}