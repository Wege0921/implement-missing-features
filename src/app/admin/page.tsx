import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, GraduationCap, Share2, Eye, TrendingUp, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { AdminStatTrends } from '@/components/admin/stat-trends'
import { T } from '@/components/ui/localized-text'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()

  // Fetch everything in parallel — counts + trends + lists
  const [
    { count: sermonsCount },
    { count: publishedSermonsCount },
    { count: speakersCount },
    { count: learningPathsCount },
    { count: socialPostsCount },
    { count: usersCount },
    { count: commentsCount },
    { data: sermonViews },
    { data: newUsers },
    { data: publishedSermons },
    { data: recentSermons },
    { data: pendingPosts },
  ] = await Promise.all([
    supabase.from('sermons').select('*', { count: 'exact', head: true }),
    supabase.from('sermons').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('speakers').select('*', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('*', { count: 'exact', head: true }),
    supabase.from('social_posts').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
    supabase
      .from('sermons')
      .select('created_at, view_count')
      .gte('created_at', sevenDaysAgoIso)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgoIso)
      .order('created_at', { ascending: true }),
    supabase
      .from('sermons')
      .select('published_at')
      .gte('published_at', sevenDaysAgoIso)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: true }),
    supabase
      .from('sermons')
      .select('id, title_en, is_published, created_at, view_count')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('social_posts')
      .select('id, platform, status, scheduled_for')
      .in('status', ['draft', 'scheduled'])
      .order('scheduled_for', { ascending: true })
      .limit(5),
  ])

  // Process trend data for charts
  const processTrendData = (data: any[], dateField: string, valueField?: string) => {
    const trendMap = new Map<string, number>()
    const days = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      days.push(dateStr)
      trendMap.set(dateStr, 0)
    }

    data.forEach((item) => {
      const date = new Date(item[dateField])
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (trendMap.has(dateStr)) {
        const currentValue = trendMap.get(dateStr) || 0
        trendMap.set(dateStr, currentValue + (valueField ? item[valueField] : 1))
      }
    })

    return days.map((day) => ({
      date: day,
      views: trendMap.get(day) || 0,
      users: trendMap.get(day) || 0,
      count: trendMap.get(day) || 0,
    }))
  }

  const viewsTrend = processTrendData(sermonViews || [], 'created_at', 'view_count')
  const usersTrend = processTrendData(newUsers || [], 'created_at')
  const publishesTrend = processTrendData(publishedSermons || [], 'published_at')

  const stats = [
    {
      title: 'admin.totalSermons',
      value: sermonsCount || 0,
      description: `${publishedSermonsCount || 0} ${'admin.publishedCount'}`,
      icon: FileText,
      href: '/admin/sermons',
    },
    {
      title: 'admin.newUsersShort',
      value: usersCount || 0,
      description: 'admin.registeredUsers',
      icon: Users,
      href: '/admin/settings',
    },
    {
      title: 'admin.totalCommentsShort',
      value: commentsCount || 0,
      description: 'admin.totalCommentsShort',
      icon: MessageSquare,
      href: '/admin/notifications',
    },
    {
      title: 'admin.socialPosts',
      value: socialPostsCount || 0,
      description: 'admin.postsCreated',
      icon: Share2,
      href: '/admin/social',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold"><T k="admin.dashboard" /></h1>
        <p className="text-muted-foreground"><T k="admin.welcome" /></p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium"><T k={stat.title as any} /></CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.title === 'admin.totalSermons' ? (
                    <>
                      {publishedSermonsCount || 0} <T k="admin.publishedCount" />
                    </>
                  ) : (
                    <T k={stat.description as any} />
                  )}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stat Trends */}
      <AdminStatTrends
        sermonViews={viewsTrend}
        newUsers={usersTrend}
        sermonPublishes={publishesTrend}
      />

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <T k="admin.recentSermons" />
            </CardTitle>
            <CardDescription><T k="admin.latestEntries" /></CardDescription>
          </CardHeader>
          <CardContent>
            {recentSermons && recentSermons.length > 0 ? (
              <div className="space-y-4">
                {recentSermons.map((sermon) => (
                  <Link
                    key={sermon.id}
                    href={`/admin/sermons/${sermon.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sermon.title_en}</p>
                      <p className="text-xs text-muted-foreground">
                        {sermon.is_published ? <T k="admin.published" /> : <T k="admin.draft" />}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {sermon.view_count}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                <T k="admin.noSermonsYet" />
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <T k="admin.pendingSocialPosts" />
            </CardTitle>
            <CardDescription><T k="admin.postsAwaiting" /></CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPosts && pendingPosts.length > 0 ? (
              <div className="space-y-4">
                {pendingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/admin/social/${post.id}`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">{post.platform}</p>
                      <p className="text-xs text-muted-foreground capitalize">{post.status}</p>
                    </div>
                    {post.scheduled_for && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.scheduled_for).toLocaleDateString()}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                <T k="admin.noPendingPosts" />
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
