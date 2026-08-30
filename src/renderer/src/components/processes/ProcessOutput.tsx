import React, { useEffect, useRef } from 'react'
import { mountTerminal, fitTerminal } from '../../lib/terminalManager'

interface ProcessOutputProps {
  processId: string
}

export function ProcessOutput({ processId }: ProcessOutputProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    mountTerminal(processId, containerRef.current)

    const observer = new ResizeObserver(() => {
      fitTerminal(processId)
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [processId])

  return (
    <div
      ref={containerRef}
      className="xterm-container flex-1 overflow-hidden selectable"
      style={{ minHeight: 0 }}
    />
  )
}
