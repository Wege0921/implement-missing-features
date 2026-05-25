import { ImageResponse } from '@vercel/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sermonId = searchParams.get('id')

  if (!sermonId) {
    return new Response('Missing sermon ID', { status: 400 })
  }

  const supabase = await createClient()
  const { data: sermon } = await supabase
    .from('sermons')
    .select('title_en, title_am, speaker:speakers(name), series:series(title_en), published_at')
    .eq('id', sermonId)
    .single()

  if (!sermon) {
    return new Response('Sermon not found', { status: 404 })
  }

  const speakerName = (sermon.speaker as { name: string } | null)?.name || ''
  const seriesTitle = (sermon.series as { title_en: string } | null)?.title_en || ''
  const publishedDate = sermon.published_at 
    ? new Date(sermon.published_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#faf5eb',
          padding: '60px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#8B6914',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4L3 9L12 14L21 9L12 4Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 14L12 19L21 14"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ color: '#8B6914', fontSize: '24px', fontWeight: 600 }}>
            Kingdom Family
          </span>
        </div>

        {/* Series badge */}
        {seriesTitle && (
          <div
            style={{
              backgroundColor: '#f0e6d0',
              color: '#8B6914',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '18px',
              marginBottom: '24px',
              alignSelf: 'flex-start',
            }}
          >
            {seriesTitle}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 'bold',
            color: '#1a1612',
            lineHeight: 1.2,
            marginBottom: '24px',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {sermon.title_en}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {speakerName && (
              <span style={{ fontSize: '22px', color: '#4a4540', fontWeight: 500 }}>
                {speakerName}
              </span>
            )}
            {publishedDate && (
              <span style={{ fontSize: '18px', color: '#6b6560' }}>
                {publishedDate}
              </span>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
