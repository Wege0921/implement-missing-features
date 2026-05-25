'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, Copy, Link, MessageCircle, Printer, Send, Share2 } from 'lucide-react'

interface ShareButtonsProps {
  url: string
  title: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showPrint?: boolean
}

export function ShareButtons({ url, title, variant = 'outline', size = 'sm', showPrint = true }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const shareTitle = encodeURIComponent(title)
  const shareUrl = encodeURIComponent(url)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({ title: 'Link copied', description: 'The link has been copied to your clipboard.' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled or error
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* WhatsApp */}
      <Button variant={variant} size={size} asChild>
        <a 
          href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </Button>

      {/* Telegram */}
      <Button variant={variant} size={size} asChild>
        <a
          href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Telegram"
        >
          <Send className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Telegram</span>
        </a>
      </Button>

      {/* More Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size}>
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy link
          </DropdownMenuItem>
          {typeof navigator !== 'undefined' && navigator.share && (
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share...
            </DropdownMenuItem>
          )}
          {showPrint && (
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
