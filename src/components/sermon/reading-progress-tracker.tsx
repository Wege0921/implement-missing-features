'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ReadingProgressTrackerProps {
  sermonId: string
  userId: string | null
}

export function ReadingProgressTracker({ sermonId, userId }: ReadingProgressTrackerProps) {
  const trackedRef = useRef(false)
  const progressRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!userId) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)

      // Track progress at 25%, 50%, 75%, 80%, 90%, 100%
      const milestones = [25, 50, 75, 80, 90, 100]
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !progressRef.current.has(milestone)) {
          progressRef.current.add(milestone)
          updateProgress(milestone)
        }
      })
    }

    const updateProgress = async (percent: number) => {
      const supabase = createClient()
      const status = percent >= 80 ? 'completed' : 'in_progress'

      try {
        const { data: existing } = await supabase
          .from('reading_progress')
          .select('id')
          .eq('user_id', userId)
          .eq('sermon_id', sermonId)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('reading_progress')
            .update({
              progress_percent: percent,
              status,
              last_read_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('reading_progress').insert({
            user_id: userId,
            sermon_id: sermonId,
            progress_percent: percent,
            status,
            last_read_at: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error('Failed to update reading progress:', error)
      }
    }

    // Throttle scroll events
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })

    // Initial check in case user is already scrolled
    handleScroll()

    return () => {
      window.removeEventListener('scroll', throttledScroll)
    }
  }, [sermonId, userId])

  return null
}
