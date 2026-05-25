import { NextResponse } from 'next/server'
import { sendSermonToTelegram } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sermonId, sermonTitle, sermonSummary, sermonUrl, channelId } = body

    if (!sermonId || !sermonTitle || !sermonUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: sermonId, sermonTitle, sermonUrl' },
        { status: 400 }
      )
    }

    const result = await sendSermonToTelegram(
      sermonId,
      sermonTitle,
      sermonSummary || '',
      sermonUrl,
      channelId
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Telegram send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send Telegram message' },
      { status: 500 }
    )
  }
}
