import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, Check, Trash2, AlertTriangle } from 'lucide-react'
import { T } from '@/components/ui/localized-text'

export default async function CommentModerationPage() {
  const supabase = await createClient()

  // Fetch comments that need moderation
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profile:profiles(id, full_name, avatar_url),
      sermon:sermons(id, title_en)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(50)

  // Filter for comments that might need moderation (flagged or recent)
  const flaggedComments = comments?.filter((c: any) => {
    const content = c.content.toLowerCase()
    // Simple moderation rules - can be expanded
    const flaggedWords = ['spam', 'scam', 'fake', 'buy now', 'click here']
    return flaggedWords.some((word) => content.includes(word))
  }) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          <T k="admin.commentModeration" />
        </h1>
        <p className="text-muted-foreground"><T k="admin.reviewModerate" /></p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium"><T k="admin.totalComments" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600"><T k="admin.flagged" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{flaggedComments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium"><T k="admin.pendingReview" /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedComments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <T k="admin.flaggedComments" />
          </CardTitle>
          <CardDescription><T k="admin.flaggedDescription" /></CardDescription>
        </CardHeader>
        <CardContent>
          {flaggedComments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              <T k="admin.noFlaggedComments" />
            </p>
          ) : (
            <div className="space-y-4">
              {(flaggedComments as any[]).map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{comment.profile?.full_name || <T k="admin.anonymous" />}</span>
                        <Badge variant="destructive" className="text-xs"><T k="admin.flagged" /></Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <T k="admin.onSermon" />: {comment.sermon?.title_en}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Check className="h-4 w-4 mr-1" />
                        <T k="admin.approve" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        <T k="common.delete" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
