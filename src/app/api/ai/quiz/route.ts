import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, summary } = body

    if (!title || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields: title and summary' },
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

    const prompt = `Generate 5 multiple choice quiz questions based on this sermon. Return only valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Sermon Title: ${title}
Summary: ${summary}

Make questions test understanding of the main teaching points. Use 0-3 for correctAnswer indices.`

    const { text } = await generateText({
      model: 'claude-3-haiku-20240307',
      prompt,
    })

    let quizData
    try {
      const cleaned = text.trim().replace(/```json\n?|\n?```/g, '')
      quizData = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse quiz data from AI response')
    }

    return NextResponse.json({ success: true, quiz: quizData })
  } catch (error) {
    console.error('AI quiz generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
