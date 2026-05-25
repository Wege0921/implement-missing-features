'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizData {
  questions: QuizQuestion[]
}

interface AIQuizProps {
  title: string
  summary: string
  onQuizGenerated: (quiz: QuizData) => void
}

export function AIQuiz({ title, summary, onQuizGenerated }: AIQuizProps) {
  const [generating, setGenerating] = useState(false)
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)
  const { toast } = useToast()
  const { t } = useTranslation()

  const handleGenerateQuiz = async () => {
    setGenerating(true)

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('admin.generateQuizFailed'))
      }

      const data = await response.json()
      setQuiz(data.quiz)
      toast({ title: t('admin.quizGenerated') })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('admin.generateQuizFailed'),
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answerIndex }))
  }

  const handleSubmitQuiz = () => {
    setShowResults(true)
  }

  const handleSaveQuiz = () => {
    if (quiz) {
      onQuizGenerated(quiz)
      setQuiz(null)
      setSelectedAnswers({})
      setShowResults(false)
    }
  }

  const calculateScore = () => {
    if (!quiz) return 0
    let correct = 0
    quiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctAnswer) correct++
    })
    return correct
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t('admin.aiQuizGenerator')}
        </CardTitle>
        <CardDescription>
          {t('admin.generateQuizDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!quiz ? (
          <Button
            onClick={handleGenerateQuiz}
            disabled={generating || !title || !summary}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.generating')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('admin.generateQuiz')}
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((q, i) => (
              <div key={i} className="space-y-3">
                <p className="font-medium">
                  {i + 1}. {q.question}
                </p>
                <RadioGroup
                  value={selectedAnswers[i]?.toString()}
                  onValueChange={(v) => handleAnswerSelect(i, parseInt(v))}
                  disabled={showResults}
                >
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={optIndex.toString()} id={`q${i}-opt${optIndex}`} />
                      <Label htmlFor={`q${i}-opt${optIndex}`} className="cursor-pointer">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {showResults && (
                  <div className={`p-3 rounded-md ${selectedAnswers[i] === q.correctAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-start gap-2">
                      {selectedAnswers[i] === q.correctAnswer ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <span className="text-red-600 font-medium">✗</span>
                      )}
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!showResults ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
                className="w-full"
              >
                {t('admin.submitQuiz')}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {calculateScore()} / {quiz.questions.length}
                  </p>
                  <p className="text-sm text-muted-foreground">{t('admin.correctAnswers')}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveQuiz} className="flex-1">
                    {t('admin.saveQuiz')}
                  </Button>
                  <Button
                    onClick={() => {
                      setQuiz(null)
                      setSelectedAnswers({})
                      setShowResults(false)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    {t('admin.regenerate')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
