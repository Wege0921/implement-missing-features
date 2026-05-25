import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../init'

export const commentRouter = router({
  // Get comments for a sermon
  listForSermon: publicProcedure
    .input(
      z.object({
        sermonId: z.string().uuid(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { sermonId, page, pageSize } = input
      const skip = (page - 1) * pageSize

      const [comments, count] = await Promise.all([
        ctx.prisma.comment.findMany({
          where: {
            sermonId,
            parentId: null, // Only top-level comments
            isDeleted: false,
          },
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
            replies: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.comment.count({
          where: { sermonId, parentId: null, isDeleted: false },
        }),
      ])

      return {
        data: comments,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      }
    }),

  // Create comment
  create: protectedProcedure
    .input(
      z.object({
        sermonId: z.string().uuid(),
        content: z.string().min(1).max(2000),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify parent comment exists if replying
      if (input.parentId) {
        const parent = await ctx.prisma.comment.findUnique({
          where: { id: input.parentId },
        })
        if (!parent || parent.sermonId !== input.sermonId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid parent comment',
          })
        }
      }

      return ctx.prisma.comment.create({
        data: {
          userId: ctx.userId,
          sermonId: input.sermonId,
          content: input.content,
          parentId: input.parentId ?? null,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      })
    }),

  // Update comment (own comment only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
      })

      if (!comment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' })
      }

      if (comment.userId !== ctx.userId && ctx.userRole !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own comments',
        })
      }

      return ctx.prisma.comment.update({
        where: { id: input.id },
        data: { content: input.content },
      })
    }),

  // Delete comment (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.id },
      })

      if (!comment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comment not found' })
      }

      if (comment.userId !== ctx.userId && ctx.userRole !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        })
      }

      await ctx.prisma.comment.update({
        where: { id: input.id },
        data: { isDeleted: true },
      })

      return { success: true }
    }),

  // Admin: Hard delete comment
  adminDelete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.comment.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
