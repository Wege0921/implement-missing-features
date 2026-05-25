'use client'

import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="border-t bg-muted/30">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold text-lg">Kingdom Family</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">{t('footer.resources')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sermons" className="hover:text-primary transition-colors">
                  {t('nav.sermons')}
                </Link>
              </li>
              <li>
                <Link href="/learn" className="hover:text-primary transition-colors">
                  {t('nav.learn')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">{t('footer.account')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/my/bookmarks" className="hover:text-primary transition-colors">
                  {t('nav.bookmarks')}
                </Link>
              </li>
              <li>
                <Link href="/my/progress" className="hover:text-primary transition-colors">
                  {t('nav.progress')}
                </Link>
              </li>
              <li>
                <Link href="/my/settings" className="hover:text-primary transition-colors">
                  {t('nav.settings')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">{t('footer.connect')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kingdom Family. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  )
}
