import { useState, useEffect } from 'react'

/**
 * Returns a live-updating formatted duration string.
 * Updates every second while the process is running.
 */
export function useProcessTimer(startedAt: number | null, endedAt: number | null): string {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (endedAt !== null) return // Process finished, no need to tick
    if (startedAt === null) return

    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [startedAt, endedAt])

  if (!startedAt) return ''

  const elapsed = (endedAt ?? now) - startedAt
  return formatDuration(elapsed)
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}
