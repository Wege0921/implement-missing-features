import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../init'

export const topicRouter = router({
  // Get all topics
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.topic.findMany({
      orderBy: { nameEn: 'asc' },
    })
  }),

  // Get topic by ID with sermons
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.topic.findUnique({
        where: { id: input.id },
        include: {
          sermons: {
            where: {
              sermon: { isPublished: true },
            },
            include: {
              sermon: {
                include: {
                  speaker: true,
                  series: true,
                },
              },
            },
          },
        },
      })
    }),

  // Create topic
  create: adminProcedure
    .input(
      z.object({
        nameEn: z.string().min(1),
        nameAm: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.topic.create({
        data: input,
      })
    }),

  // Update topic
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        nameEn: z.string().min(1).optional(),
        nameAm: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.topic.update({
        where: { id },
        data,
      })
    }),

  // Delete topic
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.topic.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
