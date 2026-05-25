import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../init'

export const userRouter = router({
  // Get current user's profile
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.profile.findUnique({
      where: { id: ctx.userId },
    })
  }),

  // Update current user's profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(1).optional(),
        avatarUrl: z.string().url().optional().or(z.literal('')).nullable(),
        languagePreference: z.enum(['en', 'am']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.profile.update({
        where: { id: ctx.userId },
        data: input,
      })
    }),

  // Admin: Get all users
  adminList: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        role: z.enum(['ADMIN', 'LEADER', 'MEMBER']).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, role, search } = input
      const skip = (page - 1) * pageSize

      const where = {
        ...(role && { role }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { id: { contains: search } },
          ],
        }),
      }

      const [users, count] = await Promise.all([
        ctx.prisma.profile.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.profile.count({ where }),
      ])

      return {
        data: users,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      }
    }),

  // Admin: Update user role
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(['ADMIN', 'LEADER', 'MEMBER']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.profile.update({
        where: { id: input.userId },
        data: { role: input.role },
      })
    }),

  // Get user's dashboard stats
  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const [bookmarkCount, completedSermons, inProgressSermons, learningProgress] =
      await Promise.all([
        ctx.prisma.bookmark.count({ where: { userId: ctx.userId } }),
        ctx.prisma.readingProgress.count({
          where: { userId: ctx.userId, status: 'completed' },
        }),
        ctx.prisma.readingProgress.count({
          where: { userId: ctx.userId, status: 'in_progress' },
        }),
        ctx.prisma.userModuleProgress.count({
          where: { userId: ctx.userId, status: 'completed' },
        }),
      ])

    return {
      bookmarkCount,
      completedSermons,
      inProgressSermons,
      learningModulesCompleted: learningProgress,
    }
  }),
})
