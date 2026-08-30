import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OutputBatcher } from '../process/OutputBatcher'

describe('OutputBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('buffers stdout and calls onFlush after 16ms', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.writeStdout('hello ')
    batcher.writeStdout('world')

    // Not flushed immediately
    expect(onFlush).not.toHaveBeenCalled()

    vi.advanceTimersByTime(16)

    expect(onFlush).toHaveBeenCalledOnce()
    expect(onFlush).toHaveBeenCalledWith('hello world', 'stdout')
  })

  it('buffers stderr and calls onFlush after 16ms', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.writeStderr('error line\n')

    expect(onFlush).not.toHaveBeenCalled()

    vi.advanceTimersByTime(16)

    expect(onFlush).toHaveBeenCalledOnce()
    expect(onFlush).toHaveBeenCalledWith('error line\n', 'stderr')
  })

  it('keeps stdout and stderr separate flush calls', () => {
    const calls: Array<[string, string]> = []
    const batcher = new OutputBatcher((data, type) => calls.push([data, type]))

    batcher.writeStdout('out')
    batcher.writeStderr('err')

    vi.advanceTimersByTime(16)

    expect(calls).toHaveLength(2)
    expect(calls.find(([, t]) => t === 'stdout')).toEqual(['out', 'stdout'])
    expect(calls.find(([, t]) => t === 'stderr')).toEqual(['err', 'stderr'])
  })

  it('resets timer on new chunks — only one flush per batch', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    // Rapid-fire chunks within the 16ms window
    batcher.writeStdout('a')
    vi.advanceTimersByTime(5)
    batcher.writeStdout('b')
    vi.advanceTimersByTime(5)
    batcher.writeStdout('c')
    // Timer was set on the first write; timer fires 16ms after the first write
    vi.advanceTimersByTime(10) // now 20ms since first write

    // Only one flush call with all chunks concatenated
    expect(onFlush).toHaveBeenCalledOnce()
    expect(onFlush).toHaveBeenCalledWith('abc', 'stdout')
  })

  it('flush() immediately flushes pending buffers', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.writeStdout('immediate')
    batcher.writeStderr('imm-err')

    // Call flush before the timer fires
    batcher.flush()

    expect(onFlush).toHaveBeenCalledTimes(2)
    expect(onFlush).toHaveBeenCalledWith('immediate', 'stdout')
    expect(onFlush).toHaveBeenCalledWith('imm-err', 'stderr')
  })

  it('flush() cancels the pending timer so no double-flush occurs', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.writeStdout('data')
    batcher.flush() // flushes now

    vi.advanceTimersByTime(16) // timer should be cancelled

    expect(onFlush).toHaveBeenCalledOnce()
  })

  it('flush() on empty buffers calls onFlush zero times', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.flush()

    expect(onFlush).not.toHaveBeenCalled()
  })

  it('dispose() clears buffers and cancels timers without flushing', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.writeStdout('lost data')
    batcher.dispose()

    vi.advanceTimersByTime(100) // timers should be gone

    expect(onFlush).not.toHaveBeenCalled()
  })

  it('produces separate flush batches for distinct time windows', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    batcher.writeStdout('first batch')
    vi.advanceTimersByTime(16)

    expect(onFlush).toHaveBeenCalledOnce()
    expect(onFlush).toHaveBeenLastCalledWith('first batch', 'stdout')

    batcher.writeStdout('second batch')
    vi.advanceTimersByTime(16)

    expect(onFlush).toHaveBeenCalledTimes(2)
    expect(onFlush).toHaveBeenLastCalledWith('second batch', 'stdout')
  })

  it('handles large payloads without losing data', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    const chunk = 'x'.repeat(100_000)
    batcher.writeStdout(chunk)

    vi.advanceTimersByTime(16)

    expect(onFlush).toHaveBeenCalledOnce()
    const [data] = onFlush.mock.calls[0]
    expect((data as string).length).toBe(100_000)
  })

  it('handles ANSI escape sequences correctly (passes through unchanged)', () => {
    const onFlush = vi.fn()
    const batcher = new OutputBatcher(onFlush)

    const ansi = '\x1b[32mGREEN\x1b[0m text'
    batcher.writeStdout(ansi)

    vi.advanceTimersByTime(16)

    expect(onFlush).toHaveBeenCalledWith(ansi, 'stdout')
  })
})
