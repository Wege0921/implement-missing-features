import type { ScriptureReference } from '@/lib/types'

/**
 * Parse a single reference like "Genesis 1:1", "Gen 1:1-3", "1 John 3:16".
 */
export function parseScriptureLine(line: string): ScriptureReference | null {
  const s = line.trim()
  if (!s) return null

  const m = s.match(/^((?:\d+\s+)?[^\d]+?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?\s*$/i)
  if (!m) return null

  const book = m[1].trim().replace(/\s+/g, ' ')
  const chapter = Number.parseInt(m[2], 10)
  const vStart = Number.parseInt(m[3], 10)
  const vEnd = m[4] ? Number.parseInt(m[4], 10) : undefined

  if (!book || Number.isNaN(chapter) || Number.isNaN(vStart)) return null

  const verses =
    vEnd !== undefined && !Number.isNaN(vEnd)
      ? vStart === vEnd
        ? String(vStart)
        : `${vStart}-${vEnd}`
      : String(vStart)

  return { book, chapter, verses }
}
