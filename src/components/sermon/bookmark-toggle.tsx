'use client'

import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

interface BookmarkToggleProps {
  sermonId: string
  initialBookmarked: boolean
  isLoggedIn: boolean
}

export function BookmarkToggle({ sermonId, initialBookmarked, isLoggedIn }: BookmarkToggleProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const utils = trpc.useUtils()

  const toggleMutation = trpc.bookmark.toggle.useMutation({
    onSuccess: (result) => {
      toast({ 
        title: result.bookmarked 
          ? t('sermons.savedToBookmarks') 
          : t('sermons.removedFromBookmarks') 
      })
      // Invalidate bookmark queries to refresh data
      utils.bookmark.list.invalidate()
      utils.bookmark.isBookmarked.invalidate({ sermonId })
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      })
    },
  })

  // Use query to track current bookmark state
  const { data: isBookmarked, isLoading: isChecking } = trpc.bookmark.isBookmarked.useQuery(
    { sermonId },
    {
      enabled: isLoggedIn,
      initialData: initialBookmarked,
    }
  )

  if (!isLoggedIn) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={`/auth/login?next=/sermons/${sermonId}`}>{t('sermons.signInToBookmark')}</a>
      </Button>
    )
  }

  const bookmarked = isBookmarked ?? initialBookmarked
  const loading = toggleMutation.isPending || isChecking

  const toggle = () => {
    toggleMutation.mutate({ sermonId })
  }

  return (
    <Button 
      type="button" 
      variant={bookmarked ? 'default' : 'outline'} 
      size="sm" 
      onClick={toggle} 
      disabled={loading}
    >
      <Heart className={`mr-2 h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
      {bookmarked ? t('sermons.bookmarked') : t('sermons.bookmark')}
    </Button>
  )
}
