import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('comments')
      .update({ approved: true })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to approve comment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve comment' },
      { status: 500 }
    )
  }
}
