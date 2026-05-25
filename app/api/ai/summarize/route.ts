import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sermonId, transcript, videoUrl } = body

    if (!sermonId || (!transcript && !videoUrl)) {
      return NextResponse.json(
        { error: 'Missing required fields: sermonId and either transcript or videoUrl' },
        { status: 400 }
      )
    }

    // Check if ANTHROPIC_API_KEY is configured
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Generate summary using AI SDK
    const { generateText } = await import('ai')

    const prompt = `Generate a concise summary (200-300 words) of this sermon in English. Focus on the main teaching points, key takeaways, and practical applications.

${transcript ? `Transcript:\n${transcript}` : `Video URL: ${videoUrl}`}`

    const { text } = await generateText({
      model: 'claude-3-haiku-20240307',
      prompt,
    })

    return NextResponse.json({ success: true, summary: text })
  } catch (error) {
    console.error('AI summarization error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
