import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSermonToTelegram } from '@/lib/telegram'
import { sendSermonToWhatsApp } from '@/lib/whatsapp'

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  try {
    // Fetch scheduled posts that are due
    const now = new Date().toISOString()
    const { data: scheduledPosts, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })

    if (error) throw error

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const results = []

    for (const post of scheduledPosts || []) {
      const sermonUrl = `${appUrl}/sermons/${post.sermon_id}`
      const sermonTitle = post.caption_en || ''

      try {
        if (post.platform === 'telegram') {
          await sendSermonToTelegram(
            post.sermon_id,
            sermonTitle,
            post.caption_en || '',
            sermonUrl
          )
        } else if (post.platform === 'whatsapp') {
          await sendSermonToWhatsApp(
            process.env.WHATSAPP_PHONE_NUMBER_ID || '',
            sermonTitle,
            post.caption_en || '',
            sermonUrl
          )
        }

        // Update post status to published
        await supabase
          .from('social_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', post.id)

        results.push({ id: post.id, platform: post.platform, status: 'published' })
      } catch (error) {
        console.error(`Failed to post ${post.platform} post ${post.id}:`, error)

        // Update post status to failed
        await supabase
          .from('social_posts')
          .update({ status: 'failed' })
          .eq('id', post.id)

        results.push({ id: post.id, platform: post.platform, status: 'failed', error: String(error) })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
