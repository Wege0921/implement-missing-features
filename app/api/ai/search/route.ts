import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required field: query' },
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

    const supabase = await createClient()

    // Fetch all sermons for AI to rank
    const { data: sermons, error } = await supabase
      .from('sermons')
      .select('id, title_en, title_am, summary_en, summary_am')
      .eq('is_published', true)

    if (error) throw error

    const { generateText } = await import('ai')

    // Create a prompt for AI to rank sermons by relevance
    const sermonList = (sermons ?? []).map((s) => ({
      id: s.id,
      title: s.title_en,
      summary: s.summary_en?.replace(/<[^>]+>/g, '') || '',
    }))

    const prompt = `Given this search query: "${query}"

Rank the following sermons by relevance to the query. Return only a JSON array of sermon IDs in order of relevance (most relevant first).

${JSON.stringify(sermonList, null, 2)}

Example output format: ["id1", "id2", "id3"]`

    const { text } = await generateText({
      model: 'claude-3-haiku-20240307',
      prompt,
    })

    let rankedIds: string[] = []
    try {
      const cleaned = text.trim().replace(/```json\n?|\n?```/g, '')
      rankedIds = JSON.parse(cleaned)
    } catch {
      // Fallback: return all sermons unsorted
      rankedIds = sermons?.map((s) => s.id) ?? []
    }

    // Return sermons in ranked order
    const rankedSermons = (sermons ?? []).sort((a, b) => {
      const aIndex = rankedIds.indexOf(a.id)
      const bIndex = rankedIds.indexOf(b.id)
      return aIndex - bIndex
    })

    return NextResponse.json({ success: true, results: rankedSermons })
  } catch (error) {
    console.error('AI search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
