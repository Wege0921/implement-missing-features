import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../init'

export const speakerRouter = router({
  // Get all active speakers
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.speaker.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
  }),

  // Get all speakers (including inactive) for admin
  adminList: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.speaker.findMany({
      orderBy: { name: 'asc' },
    })
  }),

  // Get speaker by ID with their sermons
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.speaker.findUnique({
        where: { id: input.id },
        include: {
          sermons: {
            where: { isPublished: true },
            orderBy: { publishedAt: 'desc' },
            take: 10,
          },
        },
      })
    }),

  // Create speaker
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bioEn: z.string().optional(),
        bioAm: z.string().optional(),
        avatarUrl: z.string().url().optional().or(z.literal('')),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.speaker.create({
        data: {
          ...input,
          avatarUrl: input.avatarUrl || null,
        },
      })
    }),

  // Update speaker
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        bioEn: z.string().optional(),
        bioAm: z.string().optional(),
        avatarUrl: z.string().url().optional().or(z.literal('')).nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.speaker.update({
        where: { id },
        data,
      })
    }),

  // Delete speaker
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.speaker.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
