import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'

const PLATFORM_LIMITS = {
  facebook: 63206,
  instagram: 2200,
  twitter: 280,
  telegram: 4096,
  tiktok: 2200,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sermonId, platform = 'telegram' } = body

    if (!sermonId) {
      return NextResponse.json({ error: 'Missing sermon ID' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get sermon details
    const { data: sermon, error: sermonError } = await supabase
      .from('sermons')
      .select(`
        title_en,
        title_am,
        summary_en,
        summary_am,
        memory_verse_en,
        scripture_references,
        speaker:speakers(name),
        series:series(title_en)
      `)
      .eq('id', sermonId)
      .single()

    if (sermonError || !sermon) {
      return NextResponse.json({ error: 'Sermon not found' }, { status: 404 })
    }

    const speakerName = (sermon.speaker as { name: string } | null)?.name || ''
    const seriesTitle = (sermon.series as { title_en: string } | null)?.title_en || ''
    const charLimit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS] || 2200
    const plainSummary = (sermon.summary_en || '').replace(/<[^>]+>/g, '').slice(0, 500)

    const prompt = `Generate a compelling social media caption for a church sermon post on ${platform}.

Sermon Details:
- Title (English): ${sermon.title_en}
- Title (Amharic): ${sermon.title_am || 'Not available'}
- Speaker: ${speakerName}
- Series: ${seriesTitle}
- Summary: ${plainSummary}
- Memory Verse: ${sermon.memory_verse_en || 'Not provided'}

Requirements:
1. Keep it under ${charLimit} characters
2. Include a hook/attention-grabbing opening
3. Highlight the key message or takeaway
4. Include a call to action (watch, listen, share)
5. Add 3-5 relevant hashtags at the end
6. Be warm, inviting, and spiritually encouraging
7. For ${platform}, match the platform's tone and style

Generate two versions:
1. ENGLISH: A caption in English
2. AMHARIC: A caption in Amharic (Ethiopian language)

Format your response as JSON:
{
  "caption_en": "English caption here...",
  "caption_am": "Amharic caption here..."
}`

    const { text } = await generateText({
      model: 'anthropic/claude-sonnet-4-20250514',
      prompt,
    })

    // Parse the JSON response
    let captions = { caption_en: '', caption_am: '' }
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        captions = JSON.parse(jsonMatch[0])
      }
    } catch {
      // If JSON parsing fails, use the text as-is for English
      captions = {
        caption_en: text.slice(0, charLimit),
        caption_am: '',
      }
    }

    return NextResponse.json({
      success: true,
      platform,
      charLimit,
      captions,
    })
  } catch (error) {
    console.error('AI caption generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate caption' },
      { status: 500 }
    )
  }
}
