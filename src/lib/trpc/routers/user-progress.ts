import { z } from 'zod'
import { router, protectedProcedure } from '../init'

export const userProgressRouter = router({
  // Get user's progress for a learning path
  getPathProgress: protectedProcedure
    .input(z.object({ pathId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const modules = await ctx.prisma.learningModule.findMany({
        where: { learningPathId: input.pathId },
        include: {
          userProgress: {
            where: { userId: ctx.userId },
          },
        },
      })

      const totalModules = modules.length
      const completedModules = modules.filter(
        (m) => m.userProgress[0]?.status === 'completed'
      ).length

      return {
        totalModules,
        completedModules,
        progressPercent: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        modules: modules.map((m) => ({
          moduleId: m.id,
          status: m.userProgress[0]?.status ?? 'not_started',
          quizScore: m.userProgress[0]?.quizScore ?? null,
          quizAttempts: m.userProgress[0]?.quizAttempts ?? 0,
        })),
      }
    }),

  // Get progress for a specific module
  getModuleProgress: protectedProcedure
    .input(z.object({ moduleId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.userModuleProgress.findUnique({
        where: {
          userId_moduleId: {
            userId: ctx.userId,
            moduleId: input.moduleId,
          },
        },
      })
    }),

  // Update module progress
  updateModuleProgress: protectedProcedure
    .input(
      z.object({
        moduleId: z.string().uuid(),
        status: z.enum(['not_started', 'in_progress', 'completed']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userModuleProgress.upsert({
        where: {
          userId_moduleId: {
            userId: ctx.userId,
            moduleId: input.moduleId,
          },
        },
        update: {
          status: input.status,
          completedAt: input.status === 'completed' ? new Date() : null,
        },
        create: {
          userId: ctx.userId,
          moduleId: input.moduleId,
          status: input.status,
          completedAt: input.status === 'completed' ? new Date() : null,
        },
      })
    }),

  // Submit quiz answer
  submitQuiz: protectedProcedure
    .input(
      z.object({
        moduleId: z.string().uuid(),
        score: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.userModuleProgress.findUnique({
        where: {
          userId_moduleId: {
            userId: ctx.userId,
            moduleId: input.moduleId,
          },
        },
      })

      return ctx.prisma.userModuleProgress.upsert({
        where: {
          userId_moduleId: {
            userId: ctx.userId,
            moduleId: input.moduleId,
          },
        },
        update: {
          quizScore: input.score,
          quizAttempts: (existing?.quizAttempts ?? 0) + 1,
          status: input.score >= 70 ? 'completed' : 'in_progress',
          completedAt: input.score >= 70 ? new Date() : null,
        },
        create: {
          userId: ctx.userId,
          moduleId: input.moduleId,
          quizScore: input.score,
          quizAttempts: 1,
          status: input.score >= 70 ? 'completed' : 'in_progress',
          completedAt: input.score >= 70 ? new Date() : null,
        },
      })
    }),

  // Get overall learning stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const [totalProgress, completedModules, totalPaths] = await Promise.all([
      ctx.prisma.userModuleProgress.findMany({
        where: { userId: ctx.userId },
      }),
      ctx.prisma.userModuleProgress.count({
        where: { userId: ctx.userId, status: 'completed' },
      }),
      ctx.prisma.learningPath.count({ where: { isPublished: true } }),
    ])

    const avgQuizScore =
      totalProgress.filter((p) => p.quizScore !== null).length > 0
        ? Math.round(
            totalProgress
              .filter((p) => p.quizScore !== null)
              .reduce((sum, p) => sum + (p.quizScore ?? 0), 0) /
              totalProgress.filter((p) => p.quizScore !== null).length
          )
        : null

    return {
      modulesCompleted: completedModules,
      totalPaths,
      averageQuizScore: avgQuizScore,
      totalQuizAttempts: totalProgress.reduce((sum, p) => sum + p.quizAttempts, 0),
    }
  }),
})
