import { NextResponse } from 'next/server'
import { sendSermonToWhatsApp } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber, sermonTitle, sermonSummary, sermonUrl } = body

    if (!phoneNumber || !sermonTitle || !sermonUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, sermonTitle, sermonUrl' },
        { status: 400 }
      )
    }

    const result = await sendSermonToWhatsApp(
      phoneNumber,
      sermonTitle,
      sermonSummary || '',
      sermonUrl
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send WhatsApp message' },
      { status: 500 }
    )
  }
}
