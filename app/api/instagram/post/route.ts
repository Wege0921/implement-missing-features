import { NextResponse } from 'next/server'
import { postToInstagram } from '@/lib/instagram'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { imageUrl, caption } = body

    if (!imageUrl || !caption) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, caption' },
        { status: 400 }
      )
    }

    const result = await postToInstagram({
      image_url: imageUrl,
      caption,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Instagram post error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to post to Instagram' },
      { status: 500 }
    )
  }
}
