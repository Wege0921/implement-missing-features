'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { getYoutubeVideoId } from '@/lib/youtube'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  videoUrl: string | null | undefined
  title: string
  className?: string
}

export function VideoPlayer({ videoUrl, title, className }: VideoPlayerProps) {
  const [play, setPlay] = useState(false)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const id = getYoutubeVideoId(videoUrl ?? null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true)
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const start = useCallback(() => setPlay(true), [])

  if (!id) {
    return (
      <div className={cn('aspect-video rounded-lg border bg-muted flex items-center justify-center', className)}>
        <p className="text-sm text-muted-foreground">No video URL for this sermon.</p>
      </div>
    )
  }

  const embed = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`

  return (
    <div ref={containerRef} className={cn('relative aspect-video w-full overflow-hidden rounded-lg border bg-black', className)}>
      {!play && (
        <button
          type="button"
          onClick={start}
          className="group absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/50"
          aria-label={`Play video: ${title}`}
        >
          {visible && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
          )}
          <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg group-hover:scale-105 transition">
            <Play className="ml-1 h-7 w-7 text-primary" />
          </span>
        </button>
      )}
      {play && (
        <iframe
          title={title}
          src={embed}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  )
}
