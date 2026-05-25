import { ImageResponse } from '@vercel/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pathId = searchParams.get('pathId')
  const userId = searchParams.get('userId')

  if (!pathId || !userId) {
    return new Response('Missing pathId or userId', { status: 400 })
  }

  const supabase = await createClient()
  
  // Get learning path
  const { data: path } = await supabase
    .from('learning_paths')
    .select('title_en, description_en')
    .eq('id', pathId)
    .single()

  if (!path) {
    return new Response('Learning path not found', { status: 404 })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const userName = profile?.full_name || 'Learner'
  const completionDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf5eb',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            right: '30px',
            bottom: '30px',
            border: '3px solid #8B6914',
            borderRadius: '8px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            right: '40px',
            bottom: '40px',
            border: '1px solid #d4b85a',
            borderRadius: '4px',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#8B6914',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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
          <span style={{ color: '#8B6914', fontSize: '18px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Kingdom Family
          </span>
        </div>

        {/* Certificate title */}
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1a1612',
            margin: '0 0 8px 0',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          Certificate of Completion
        </h1>

        <p style={{ color: '#6b6560', fontSize: '18px', margin: '0 0 40px 0' }}>
          This certifies that
        </p>

        {/* User name */}
        <h2
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#8B6914',
            margin: '0 0 40px 0',
            fontStyle: 'italic',
          }}
        >
          {userName}
        </h2>

        <p style={{ color: '#6b6560', fontSize: '18px', margin: '0 0 16px 0' }}>
          has successfully completed the learning path
        </p>

        {/* Path title */}
        <h3
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#1a1612',
            margin: '0 0 50px 0',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {path.title_en}
        </h3>

        {/* Date */}
        <p style={{ color: '#6b6560', fontSize: '16px', margin: 0 }}>
          Completed on {completionDate}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
