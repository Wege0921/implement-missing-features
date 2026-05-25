import { z } from 'zod'
import { router, protectedProcedure } from '../init'

export const progressRouter = router({
  // Get user's reading progress
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.readingProgress.findMany({
      where: { userId: ctx.userId },
      orderBy: { lastReadAt: 'desc' },
      include: {
        sermon: {
          include: {
            speaker: true,
            series: true,
          },
        },
      },
    })
  }),

  // Get progress for a specific sermon
  getForSermon: protectedProcedure
    .input(z.object({ sermonId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.readingProgress.findUnique({
        where: {
          userId_sermonId: {
            userId: ctx.userId,
            sermonId: input.sermonId,
          },
        },
      })
    }),

  // Update reading progress
  update: protectedProcedure
    .input(
      z.object({
        sermonId: z.string().uuid(),
        progressPercent: z.number().min(0).max(100),
        status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sermonId, progressPercent, status } = input

      // Auto-determine status based on progress
      const finalStatus =
        status ??
        (progressPercent === 0
          ? 'not_started'
          : progressPercent >= 100
            ? 'completed'
            : 'in_progress')

      return ctx.prisma.readingProgress.upsert({
        where: {
          userId_sermonId: {
            userId: ctx.userId,
            sermonId,
          },
        },
        update: {
          progressPercent,
          status: finalStatus,
          lastReadAt: new Date(),
        },
        create: {
          userId: ctx.userId,
          sermonId,
          progressPercent,
          status: finalStatus,
        },
      })
    }),

  // Mark sermon as completed
  markCompleted: protectedProcedure
    .input(z.object({ sermonId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.readingProgress.upsert({
        where: {
          userId_sermonId: {
            userId: ctx.userId,
            sermonId: input.sermonId,
          },
        },
        update: {
          progressPercent: 100,
          status: 'completed',
          lastReadAt: new Date(),
        },
        create: {
          userId: ctx.userId,
          sermonId: input.sermonId,
          progressPercent: 100,
          status: 'completed',
        },
      })
    }),

  // Get user stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, completed, inProgress] = await Promise.all([
      ctx.prisma.readingProgress.count({ where: { userId: ctx.userId } }),
      ctx.prisma.readingProgress.count({
        where: { userId: ctx.userId, status: 'completed' },
      }),
      ctx.prisma.readingProgress.count({
        where: { userId: ctx.userId, status: 'in_progress' },
      }),
    ])

    return {
      total,
      completed,
      inProgress,
      notStarted: total - completed - inProgress,
    }
  }),
})
