'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock, BarChart } from 'lucide-react'
import type { LearningPath } from '@/lib/types'
import { useTranslation } from '@/lib/i18n'

interface LearningPathsPreviewProps {
  paths: LearningPath[]
}

export function LearningPathsPreview({ paths }: LearningPathsPreviewProps) {
  const { t } = useTranslation()
  if (paths.length === 0) {
    return (
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t('learn.title')}</h2>
            <p className="mt-4 text-muted-foreground">
              {t('learn.comingSoon')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return ''
    }
  }

  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('learn.title')}</h2>
            <p className="mt-2 text-muted-foreground">
              {t('learn.structuredCourses')}
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex">
            <Link href="/learn">
              {t('learn.viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path) => (
            <Card key={path.id} className="group hover:shadow-lg transition-shadow">
              {path.cover_image && (
                <div className="aspect-[2/1] relative overflow-hidden rounded-t-lg">
                  <img
                    src={path.cover_image}
                    alt={path.title_en}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getDifficultyColor(path.difficulty_level)}>
                    {path.difficulty_level.charAt(0).toUpperCase() + path.difficulty_level.slice(1)}
                  </Badge>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  <Link href={`/learn/${path.id}`}>
                    {path.title_en}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {path.description_en}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {path.estimated_duration_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{Math.round(path.estimated_duration_minutes / 60)}h</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <BarChart className="h-3.5 w-3.5" />
                    <span>{path.difficulty_level}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild>
            <Link href="/learn">
              {t('learn.viewAllPaths')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
