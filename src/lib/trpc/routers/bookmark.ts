import { z } from 'zod'
import { router, protectedProcedure } from '../init'

export const bookmarkRouter = router({
  // Get user's bookmarks
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.bookmark.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
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

  // Check if sermon is bookmarked
  isBookmarked: protectedProcedure
    .input(z.object({ sermonId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const bookmark = await ctx.prisma.bookmark.findUnique({
        where: {
          userId_sermonId: {
            userId: ctx.userId,
            sermonId: input.sermonId,
          },
        },
      })
      return !!bookmark
    }),

  // Toggle bookmark
  toggle: protectedProcedure
    .input(z.object({ sermonId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.bookmark.findUnique({
        where: {
          userId_sermonId: {
            userId: ctx.userId,
            sermonId: input.sermonId,
          },
        },
      })

      if (existing) {
        await ctx.prisma.bookmark.delete({
          where: { id: existing.id },
        })
        return { bookmarked: false }
      }

      await ctx.prisma.bookmark.create({
        data: {
          userId: ctx.userId,
          sermonId: input.sermonId,
        },
      })
      return { bookmarked: true }
    }),

  // Remove bookmark
  remove: protectedProcedure
    .input(z.object({ sermonId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.bookmark.deleteMany({
        where: {
          userId: ctx.userId,
          sermonId: input.sermonId,
        },
      })
      return { success: true }
    }),
})
