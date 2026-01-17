import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  progress: number
  className?: string
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const normalizedProgress = Math.min(Math.max(Math.round(progress), 0), 100)
  const roundedProgress = normalizedProgress % 5 === 0 ? normalizedProgress : Math.round(normalizedProgress / 5) * 5
  
  return (
    <div className={`${styles.progressContainer} ${className}`}>
      <div 
        className={styles.progressBar}
        data-progress={roundedProgress}
      />
    </div>
  )
}
