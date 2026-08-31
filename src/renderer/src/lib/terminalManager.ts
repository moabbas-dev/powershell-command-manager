import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'

interface TerminalEntry {
  terminal: Terminal
  fitAddon: FitAddon
  searchAddon: SearchAddon
  element: HTMLElement | null
}

const entries = new Map<string, TerminalEntry>()

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

  const entry: TerminalEntry = { terminal, fitAddon, searchAddon, element: null }
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
    try {
      entry.fitAddon.fit()
    } catch {
      // Ignore if container not yet visible
    }
  })
}

export function fitTerminal(processId: string): void {
  const entry = entries.get(processId)
  if (!entry) return
  try {
    entry.fitAddon.fit()
  } catch {
    // Container may not be visible
  }
}

export function writeOutput(processId: string, data: string): void {
  // Get-or-create so xterm buffers output even before the panel is mounted
  const entry = getOrCreateTerminal(processId)
  entry.terminal.write(data)
}

export function clearTerminal(processId: string): void {
  const entry = entries.get(processId)
  if (!entry) return
  entry.terminal.clear()
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
