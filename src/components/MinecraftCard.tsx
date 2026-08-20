    'use client'; // Convert to a Client Component for hooks and events

    import { useRouter } from 'next/navigation';
    import styles from './MinecraftCard.module.css';

    interface MinecraftCardProps {
      id: string;
      name: string;
      icon: string;
      isSubmitted?: boolean;
    }

    export default function MinecraftCard({ id, name, icon, isSubmitted }: MinecraftCardProps) {
      const router = useRouter();

      const handleClick = () => {
        // Do nothing if the feedback has already been submitted
        if (isSubmitted) {
          return;
        }

        // Create a new audio object and play the sound
        const productSound = new Audio('/sounds/click.mp3');
        productSound.play();

        // Navigate to the feedback page after a short delay for the sound
        setTimeout(() => {
          router.push(`/feedback/${id}`);
        }, 300); // 300ms delay
      };

      const cardContent = (
        <>
          <span className={styles.icon}>{icon}</span>
          <h2 className={styles.name}>{name}</h2>
          {isSubmitted && (
            <div className={styles.submittedOverlay}>
              <span className={styles.submittedText}>SUBMITTED</span>
            </div>
          )}
        </>
      );

      // We now use a <button> element to handle the onClick event
      return (
        <button
          onClick={handleClick}
          className={`${styles.card} ${isSubmitted ? styles.submitted : ''}`}
          style={{ position: 'relative' }}
          disabled={isSubmitted} // This prevents clicking on a submitted card
        >
          {cardContent}
        </button>
      );
    }
    
