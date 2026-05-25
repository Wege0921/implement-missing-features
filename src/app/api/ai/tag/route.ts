import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, summary } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const { generateText } = await import('ai')

    const prompt = `Analyze this sermon and suggest relevant topics/tags. Return only a JSON array of topic names (strings), no markdown formatting.

Title: ${title}
${summary ? `Summary: ${summary}` : ''}

Example output format: ["faith", "grace", "salvation"]`

    const { text } = await generateText({
      model: 'claude-3-haiku-20240307',
      prompt,
    })

    // Parse the AI response to extract topic names
    let topics: string[] = []
    try {
      const cleaned = text.trim().replace(/```json\n?|\n?```/g, '')
      topics = JSON.parse(cleaned)
    } catch {
      // Fallback: extract topics from comma-separated text
      topics = text
        .split(',')
        .map((t) => t.trim().replace(/["\[\]]/g, ''))
        .filter((t) => t.length > 0)
    }

    return NextResponse.json({ success: true, topics })
  } catch (error) {
    console.error('AI tagging error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate tags' },
      { status: 500 }
    )
  }
}
