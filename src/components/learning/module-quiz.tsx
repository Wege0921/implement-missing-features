'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Quiz } from '@/lib/types'
import confetti from 'canvas-confetti'

interface ModuleQuizProps {
  moduleId: string
  pathId: string
  quizzes: Quiz[]
  nextModuleId: string | null
}

export function ModuleQuiz({ moduleId, pathId, quizzes, nextModuleId }: ModuleQuizProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  if (quizzes.length === 0) return null

  const current = quizzes[index]
  const selected = answers[index]

  const score = submitted
    ? answers.reduce((acc, a, i) => (a === quizzes[i].correct_index ? acc + 1 : acc), 0)
    : 0
  const passed = submitted && score >= Math.ceil(quizzes.length * 0.6)

  // Trigger confetti animation when quiz is passed
  useEffect(() => {
    if (passed) {
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#8B6914', '#d4b85a', '#faf5eb'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#8B6914', '#d4b85a', '#faf5eb'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
    }
  }, [passed])

  const submitAll = async () => {
    if (answers.length < quizzes.length || answers.some((a) => a === undefined)) {
      toast({ title: 'Answer all questions', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: 'Sign in required', variant: 'destructive' })
      setSubmitting(false)
      return
    }

    try {
      const { error } = await supabase.from('user_module_progress').upsert(
        {
          user_id: user.id,
          module_id: moduleId,
          status: passed ? 'completed' : 'in_progress',
          quiz_score: score,
          quiz_attempts: 1,
          completed_at: passed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' },
      )
      if (error) throw error
      setSubmitted(true)
      toast({
        title: passed ? 'Quiz passed!' : 'Keep studying',
        description: `${score} / ${quizzes.length} correct`,
      })
      router.refresh()
    } catch (e: unknown) {
      toast({
        title: 'Could not save progress',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium">
            {score} / {quizzes.length} — {passed ? 'Passed' : 'Try again'}
          </p>
          <ul className="space-y-3 text-sm">
            {quizzes.map((q, i) => (
              <li key={q.id} className={answers[i] === q.correct_index ? 'text-green-700' : 'text-destructive'}>
                <span className="font-medium">Q{i + 1}:</span> {q.question_en}
                {q.explanation_en && (
                  <p className="text-muted-foreground mt-1">{q.explanation_en}</p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            {!passed && (
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false)
                  setIndex(0)
                  setAnswers([])
                }}
              >
                Retry
              </Button>
            )}
            {passed && nextModuleId && (
              <Button asChild>
                <a href={`/learn/${pathId}/modules/${nextModuleId}`}>Next module</a>
              </Button>
            )}
            {passed && !nextModuleId && (
              <Button asChild>
                <a href={`/learn/${pathId}`}>Back to path</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Quiz — Question {index + 1} of {quizzes.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium">{current.question_en}</p>
        <RadioGroup
          value={selected !== undefined ? String(selected) : ''}
          onValueChange={(v) => {
            const next = [...answers]
            next[index] = Number.parseInt(v, 10)
            setAnswers(next)
          }}
        >
          {current.options_en.map((opt, oi) => (
            <div key={oi} className="flex items-center space-x-2">
              <RadioGroupItem value={String(oi)} id={`q-${index}-o-${oi}`} />
              <Label htmlFor={`q-${index}-o-${oi}`} className="font-normal cursor-pointer">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex gap-2">
          {index > 0 && (
            <Button type="button" variant="outline" onClick={() => setIndex(index - 1)}>
              Previous
            </Button>
          )}
          {index < quizzes.length - 1 ? (
            <Button
              type="button"
              disabled={selected === undefined}
              onClick={() => setIndex(index + 1)}
            >
              Next
            </Button>
          ) : (
            <Button type="button" disabled={submitting || selected === undefined} onClick={submitAll}>
              {submitting ? 'Submitting…' : 'Submit quiz'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
