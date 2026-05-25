import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturedSermons } from '@/components/home/featured-sermons'
import { LearningPathsPreview } from '@/components/home/learning-paths-preview'
import { WeeklySermon } from '@/components/home/weekly-sermon'
import { Footer } from '@/components/layout/footer'
import type { Sermon } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch weekly sermon (latest published within last 7 days, or just the latest)
  const { data: weeklySermon } = await supabase
    .from('sermons')
    .select(`
      *,
      speaker:speakers(*),
      series:series(*)
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()
  
  // Fetch featured sermons (latest published)
  const { data: sermons } = await supabase
    .from('sermons')
    .select(`
      *,
      speaker:speakers(*),
      series:series(*)
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(6)
  
  // Fetch learning paths
  const { data: learningPaths } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .limit(3)
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} profile={profile} />
      <main className="flex-1">
        <HeroSection isLoggedIn={!!user} />
        <div className="container px-4 py-8">
          <WeeklySermon sermon={weeklySermon as Sermon | null} />
        </div>
        <FeaturedSermons sermons={sermons || []} />
        <LearningPathsPreview paths={learningPaths || []} />
      </main>
      <Footer />
    </div>
  )
}
