import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon, type ISearchOptions } from '@xterm/addon-search'

interface TerminalEntry {
  terminal: Terminal
  fitAddon: FitAddon
  searchAddon: SearchAddon
  element: HTMLElement | null
  resizeTimer: ReturnType<typeof setTimeout> | null
  /** Longest line seen so far, measured from raw incoming data (see trackMaxLineLength). */
  maxLineLength: number
  /** Length of the not-yet-newline-terminated line carried over between writes. */
  pendingLineLength: number
}

const entries = new Map<string, TerminalEntry>()

// Debounce the resulting resize so heavy output doesn't call it on every write —
// only once things settle down briefly.
const WIDTH_RESIZE_DEBOUNCE_MS = 300
// Safety cap so one pathological ultra-long line can't blow up render width.
const MAX_COLS = 2000
// Strips common ANSI CSI sequences (SGR color codes etc.) before measuring
// visible line length — not exhaustive, but covers what CLI tools typically emit.
// eslint-disable-next-line no-control-regex -- ESC (\x1b) is the actual CSI lead byte we need to match
const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*[a-zA-Z]/g

const TERMINAL_OPTIONS = {
  fontSize: 13,
  fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
  theme: {
    background: '#0d1117',
    foreground: '#e6edf3',
    cursor: '#e6edf3',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
    brightBlack: '#6e7681',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#f0f6fc'
  },
  scrollback: 10000,
  disableStdin: true, // Read-only — we don't send input to processes
  convertEol: true,
  allowProposedApi: false
} as const

export function getOrCreateTerminal(processId: string): TerminalEntry {
  const existing = entries.get(processId)
  if (existing) return existing

  const terminal = new Terminal(TERMINAL_OPTIONS)
  const fitAddon = new FitAddon()
  const searchAddon = new SearchAddon()

  terminal.loadAddon(fitAddon)
  terminal.loadAddon(searchAddon)

  const entry: TerminalEntry = {
    terminal,
    fitAddon,
    searchAddon,
    element: null,
    resizeTimer: null,
    maxLineLength: 0,
    pendingLineLength: 0
  }
  entries.set(processId, entry)
  return entry
}

export function mountTerminal(processId: string, container: HTMLElement): void {
  const entry = getOrCreateTerminal(processId)
  if (entry.element === container) return // Already mounted here

  entry.terminal.open(container)
  entry.element = container

  // Fit after open
  requestAnimationFrame(() => {
    fitTerminal(processId)
  })
}

/**
 * Resizes to fit the container, but never narrower than the longest line
 * written so far. This is what makes long output scroll horizontally
 * instead of auto-wrapping, while staying compact when nothing needs the
 * extra width.
 *
 * The target width MUST come from maxLineLength (tracked from raw incoming
 * data, see trackMaxLineLength) rather than scanning the current buffer —
 * a line longer than the terminal's cols at write time gets hard-wrapped
 * into several buffer rows immediately, so by the time we could scan the
 * buffer the original line length is already lost. xterm does correctly
 * reflow those rows back into one once resized wide enough, though.
 */
export function fitTerminal(processId: string): void {
  const entry = entries.get(processId)
  if (!entry) return
  try {
    const proposed = entry.fitAddon.proposeDimensions()
    if (!proposed || proposed.cols <= 0 || proposed.rows <= 0) return
    const cols = Math.min(Math.max(proposed.cols, entry.maxLineLength), MAX_COLS)
    entry.terminal.resize(cols, proposed.rows)
  } catch {
    // Container may not be visible
  }
}

/**
 * Updates maxLineLength from a raw output chunk. A single logical line can
 * arrive split across multiple writeOutput calls (piped stdout has no notion
 * of line boundaries), so this carries the not-yet-terminated tail of a line
 * forward via pendingLineLength instead of measuring each chunk in isolation.
 */
function trackMaxLineLength(entry: TerminalEntry, data: string): void {
  const stripped = data.replace(ANSI_ESCAPE_PATTERN, '')
  const segments = stripped.split(/\r\n|\r|\n/)

  // The first segment continues whatever line was left pending.
  const firstLineLength = entry.pendingLineLength + segments[0].length
  if (firstLineLength > entry.maxLineLength) entry.maxLineLength = firstLineLength

  if (segments.length === 1) {
    entry.pendingLineLength = firstLineLength
    return
  }

  // Every segment between the first and last is a complete line on its own.
  for (let i = 1; i < segments.length - 1; i++) {
    if (segments[i].length > entry.maxLineLength) entry.maxLineLength = segments[i].length
  }

  // The last segment starts the next pending line (empty if the chunk ended
  // right on a line break).
  const last = segments[segments.length - 1]
  entry.pendingLineLength = last.length
  if (last.length > entry.maxLineLength) entry.maxLineLength = last.length
}

function scheduleWidthResize(processId: string): void {
  const entry = entries.get(processId)
  if (!entry) return
  if (entry.resizeTimer) clearTimeout(entry.resizeTimer)
  entry.resizeTimer = setTimeout(() => {
    entry.resizeTimer = null
    fitTerminal(processId)
  }, WIDTH_RESIZE_DEBOUNCE_MS)
}

export function writeOutput(processId: string, data: string): void {
  // Get-or-create so xterm buffers output even before the panel is mounted
  const entry = getOrCreateTerminal(processId)
  trackMaxLineLength(entry, data)
  entry.terminal.write(data, () => scheduleWidthResize(processId))
}

export function clearTerminal(processId: string): void {
  const entry = entries.get(processId)
  if (!entry) return
  entry.terminal.clear()
  entry.maxLineLength = 0
  entry.pendingLineLength = 0
}

export function getTerminalText(processId: string): string {
  const entry = entries.get(processId)
  if (!entry) return ''

  const lines: string[] = []
  const buffer = entry.terminal.buffer.active
  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i)
    if (line) lines.push(line.translateToString(true))
  }
  // xterm's scrollback buffer pads unused rows as blank lines — trim them
  // from both ends so copied output doesn't carry leading/trailing blanks.
  return lines.join('\n').trim()
}

export function disposeTerminal(processId: string): void {
  const entry = entries.get(processId)
  if (!entry) return
  if (entry.resizeTimer) clearTimeout(entry.resizeTimer)
  entry.terminal.dispose()
  entries.delete(processId)
}

export function updateScrollback(processId: string, lines: number): void {
  // xterm.js doesn't support dynamic scrollback changes after creation
  // but we can recreate the terminal with the new setting
  const entry = entries.get(processId)
  if (!entry) return
  // For now, accept the initial scrollback setting
  // This would require dispose + recreate to change dynamically
  void lines
}

// ─── Search ───────────────────────────────────────────────────────────────

export function findInTerminal(
  processId: string,
  term: string,
  direction: 'next' | 'previous',
  incremental = false
): boolean {
  const entry = entries.get(processId)
  if (!entry || !term) return false
  // No `decorations` option here — it requires allowProposedApi: true on the
  // Terminal, which we deliberately keep off. Matches still get selected and
  // scrolled into view via xterm's built-in selection highlighting.
  const options: ISearchOptions = { incremental }
  return direction === 'next'
    ? entry.searchAddon.findNext(term, options)
    : entry.searchAddon.findPrevious(term, options)
}

export function clearTerminalSearch(processId: string): void {
  const entry = entries.get(processId)
  entry?.searchAddon.clearDecorations()
}
