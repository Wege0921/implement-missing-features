import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../init'

export const seriesRouter = router({
  // Get all active series
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.series.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }),

  // Get all series for admin
  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.series.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }),

  // Get series by ID with sermons
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.series.findUnique({
        where: { id: input.id },
        include: {
          sermons: {
            where: { isPublished: true },
            orderBy: { publishedAt: 'desc' },
          },
        },
      })
    }),

  // Create series
  create: adminProcedure
    .input(
      z.object({
        titleEn: z.string().min(1),
        titleAm: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAm: z.string().optional(),
        coverImage: z.string().url().optional().or(z.literal('')),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.series.create({
        data: {
          ...input,
          coverImage: input.coverImage || null,
        },
      })
    }),

  // Update series
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        titleEn: z.string().min(1).optional(),
        titleAm: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAm: z.string().optional(),
        coverImage: z.string().url().optional().or(z.literal('')).nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.series.update({
        where: { id },
        data,
      })
    }),

  // Delete series
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.series.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
