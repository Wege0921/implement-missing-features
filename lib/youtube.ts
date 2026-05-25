/**
 * Extract YouTube video ID from common URL shapes.
 */
export function getYoutubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v) return v
      const embed = u.pathname.match(/^\/embed\/([^/?]+)/)
      if (embed?.[1]) return embed[1]
      const short = u.pathname.match(/^\/shorts\/([^/?]+)/)
      if (short?.[1]) return short[1]
    }
  } catch {
    return null
  }

  return null
}

export function getYoutubeThumbnailMaxRes(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

/** Small equal-size thumbnail (320x180, ~15KB) for cards and lists. */
export function getYoutubeThumbnailSmall(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

/**
 * Normalize any YouTube thumbnail URL to the small mqdefault size.
 * Non-YouTube URLs are returned as-is.
 */
export function compressThumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/img\.youtube\.com\/vi\/([^/]+)\//)
  if (match?.[1]) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
  }
  return url
}
