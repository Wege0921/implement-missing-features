'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Users,
  Tag,
  Library,
  Share2,
  GraduationCap,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import type { Profile } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface AdminSidebarProps {
  profile: Profile
}

const navItemKeys = [
  { key: 'admin.dashboard', href: '/admin', icon: LayoutDashboard },
  { key: 'admin.sermons', href: '/admin/sermons', icon: FileText },
  { key: 'admin.speakers', href: '/admin/speakers', icon: Users },
  { key: 'admin.series', href: '/admin/series', icon: Library },
  { key: 'admin.topics', href: '/admin/topics', icon: Tag },
  { key: 'admin.socialPosts', href: '/admin/social', icon: Share2 },
  { key: 'admin.learningPaths', href: '/admin/learning', icon: GraduationCap },
  { key: 'admin.notifications', href: '/admin/notifications', icon: Bell },
  { key: 'admin.settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300 hidden lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!collapsed && (
              <Link href="/admin" className="flex items-center gap-2 text-sidebar-primary">
                <BookOpen className="h-6 w-6" />
                <span className="font-bold">{t('admin.title')}</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/admin" className="mx-auto">
                <BookOpen className="h-6 w-6 text-sidebar-primary" />
              </Link>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="flex flex-col gap-1 px-2">
              {navItemKeys.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? t(item.key as any) : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{t(item.key as any)}</span>}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Collapse Toggle */}
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full justify-center"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItemKeys.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only sm:not-sr-only">{t(item.key as any)}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
