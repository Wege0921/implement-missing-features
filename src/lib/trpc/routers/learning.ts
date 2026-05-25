import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../init'

export const learningRouter = router({
  // Get all published learning paths
  listPaths: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.learningPath.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { modules: true },
        },
      },
    })
  }),

  // Get learning path by ID with modules
  getPath: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.learningPath.findUnique({
        where: { id: input.id },
        include: {
          modules: {
            orderBy: { sortOrder: 'asc' },
            include: {
              quizzes: {
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      })
    }),

  // Get module by ID
  getModule: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.learningModule.findUnique({
        where: { id: input.id },
        include: {
          learningPath: true,
          quizzes: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
    }),

  // Admin: Get all learning paths including unpublished
  adminListPaths: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.learningPath.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { modules: true },
        },
      },
    })
  }),

  // Admin: Create learning path
  createPath: adminProcedure
    .input(
      z.object({
        titleEn: z.string().min(1),
        titleAm: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAm: z.string().optional(),
        coverImage: z.string().url().optional().or(z.literal('')),
        difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
        estimatedDurationMinutes: z.number().optional(),
        isPublished: z.boolean().default(false),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.learningPath.create({
        data: {
          ...input,
          coverImage: input.coverImage || null,
          createdById: ctx.userId,
        },
      })
    }),

  // Admin: Update learning path
  updatePath: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        titleEn: z.string().min(1).optional(),
        titleAm: z.string().optional(),
        descriptionEn: z.string().optional(),
        descriptionAm: z.string().optional(),
        coverImage: z.string().url().optional().or(z.literal('')).nullable(),
        difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        estimatedDurationMinutes: z.number().optional().nullable(),
        isPublished: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.learningPath.update({
        where: { id },
        data,
      })
    }),

  // Admin: Delete learning path
  deletePath: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.learningPath.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // Admin: Create module
  createModule: adminProcedure
    .input(
      z.object({
        learningPathId: z.string().uuid(),
        titleEn: z.string().min(1),
        titleAm: z.string().optional(),
        contentEn: z.string().optional(),
        contentAm: z.string().optional(),
        videoUrl: z.string().url().optional().or(z.literal('')),
        sortOrder: z.number().default(0),
        estimatedDurationMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.learningModule.create({
        data: {
          ...input,
          videoUrl: input.videoUrl || null,
        },
      })
    }),

  // Admin: Update module
  updateModule: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        titleEn: z.string().min(1).optional(),
        titleAm: z.string().optional(),
        contentEn: z.string().optional(),
        contentAm: z.string().optional(),
        videoUrl: z.string().url().optional().or(z.literal('')).nullable(),
        sortOrder: z.number().optional(),
        estimatedDurationMinutes: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.learningModule.update({
        where: { id },
        data,
      })
    }),

  // Admin: Delete module
  deleteModule: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.learningModule.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // Admin: Create quiz
  createQuiz: adminProcedure
    .input(
      z.object({
        moduleId: z.string().uuid(),
        questionEn: z.string().min(1),
        questionAm: z.string().optional(),
        optionsEn: z.array(z.string()).min(2),
        optionsAm: z.array(z.string()).optional(),
        correctIndex: z.number().min(0),
        explanationEn: z.string().optional(),
        explanationAm: z.string().optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.quiz.create({
        data: input,
      })
    }),

  // Admin: Update quiz
  updateQuiz: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        questionEn: z.string().min(1).optional(),
        questionAm: z.string().optional(),
        optionsEn: z.array(z.string()).min(2).optional(),
        optionsAm: z.array(z.string()).optional().nullable(),
        correctIndex: z.number().min(0).optional(),
        explanationEn: z.string().optional(),
        explanationAm: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.quiz.update({
        where: { id },
        data,
      })
    }),

  // Admin: Delete quiz
  deleteQuiz: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.quiz.delete({ where: { id: input.id } })
      return { success: true }
    }),
})
