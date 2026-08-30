// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProcessTimer } from '../hooks/useProcessTimer'

describe('useProcessTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty string when startedAt is null', () => {
    const { result } = renderHook(() => useProcessTimer(null, null))
    expect(result.current).toBe('')
  })

  it('returns elapsed seconds for a running process', () => {
    const startedAt = Date.now()

    const { result } = renderHook(() => useProcessTimer(startedAt, null))

    // Immediately after start: 0s
    expect(result.current).toBe('0s')

    // After 5 seconds
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current).toBe('5s')
  })

  it('returns fixed duration for a completed process (endedAt is set)', () => {
    const startedAt = Date.now() - 30_000 // started 30s ago
    const endedAt = Date.now()

    const { result } = renderHook(() => useProcessTimer(startedAt, endedAt))

    expect(result.current).toBe('30s')

    // Advance time — the value should NOT change for a completed process
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current).toBe('30s')
  })

  it('formats duration with minutes correctly', () => {
    const startedAt = Date.now()

    const { result } = renderHook(() => useProcessTimer(startedAt, null))

    act(() => { vi.advanceTimersByTime(90_000) }) // 1m 30s
    expect(result.current).toBe('1m 30s')
  })

  it('formats duration with hours correctly', () => {
    const startedAt = Date.now()

    const { result } = renderHook(() => useProcessTimer(startedAt, null))

    act(() => { vi.advanceTimersByTime(3_661_000) }) // 1h 1m 1s
    expect(result.current).toBe('1h 1m 1s')
  })

  it('stops ticking when process ends (endedAt transitions from null to a value)', () => {
    const startedAt = Date.now()
    let endedAt: number | null = null

    const { result, rerender } = renderHook(() =>
      useProcessTimer(startedAt, endedAt)
    )

    act(() => { vi.advanceTimersByTime(10_000) })
    expect(result.current).toBe('10s')

    // Process ends
    endedAt = Date.now()
    rerender()

    const frozenDuration = result.current

    // More time passes — duration should be frozen
    act(() => { vi.advanceTimersByTime(10_000) })
    expect(result.current).toBe(frozenDuration)
  })

  it('ticks once per second (not more frequently)', () => {
    const startedAt = Date.now()
    const { result } = renderHook(() => useProcessTimer(startedAt, null))

    act(() => { vi.advanceTimersByTime(999) })
    expect(result.current).toBe('0s') // not yet ticked

    act(() => { vi.advanceTimersByTime(1) }) // exactly 1s
    expect(result.current).toBe('1s')
  })
})
