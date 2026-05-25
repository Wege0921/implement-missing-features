import { z } from 'zod'
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../init'

export const sermonRouter = router({
  // Get all published sermons with pagination and filters
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(12),
        speakerId: z.string().uuid().optional(),
        seriesId: z.string().uuid().optional(),
        topicId: z.string().uuid().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, speakerId, seriesId, topicId, search } = input
      const skip = (page - 1) * pageSize

      const where = {
        isPublished: true,
        ...(speakerId && { speakerId }),
        ...(seriesId && { seriesId }),
        ...(topicId && {
          topics: {
            some: { topicId },
          },
        }),
        ...(search && {
          OR: [
            { titleEn: { contains: search, mode: 'insensitive' as const } },
            { titleAm: { contains: search, mode: 'insensitive' as const } },
            { summaryEn: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      }

      const [sermons, count] = await Promise.all([
        ctx.prisma.sermon.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { publishedAt: 'desc' },
          include: {
            speaker: true,
            series: true,
            topics: {
              include: { topic: true },
            },
          },
        }),
        ctx.prisma.sermon.count({ where }),
      ])

      return {
        data: sermons,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      }
    }),

  // Get a single sermon by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const sermon = await ctx.prisma.sermon.findUnique({
        where: { id: input.id },
        include: {
          speaker: true,
          series: true,
          topics: {
            include: { topic: true },
          },
        },
      })

      if (!sermon) {
        return null
      }

      // Increment view count
      await ctx.prisma.sermon.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      })

      return sermon
    }),

  // Get featured/recent sermons
  featured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.sermon.findMany({
        where: { isPublished: true },
        orderBy: [{ viewCount: 'desc' }, { publishedAt: 'desc' }],
        take: input.limit,
        include: {
          speaker: true,
          series: true,
        },
      })
    }),

  // Admin: Create sermon
  create: adminProcedure
    .input(
      z.object({
        titleEn: z.string().min(1),
        titleAm: z.string().optional(),
        summaryEn: z.string().optional(),
        summaryAm: z.string().optional(),
        scriptureReferences: z.array(z.any()).default([]),
        speakerId: z.string().uuid().optional(),
        seriesId: z.string().uuid().optional(),
        videoUrl: z.string().url().optional().or(z.literal('')),
        audioUrl: z.string().url().optional().or(z.literal('')),
        memoryVerseEn: z.string().optional(),
        memoryVerseAm: z.string().optional(),
        prayerPoints: z.array(z.string()).default([]),
        discussionQuestions: z.array(z.string()).default([]),
        topicIds: z.array(z.string().uuid()).default([]),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { topicIds, ...data } = input

      const sermon = await ctx.prisma.sermon.create({
        data: {
          ...data,
          videoUrl: data.videoUrl || null,
          audioUrl: data.audioUrl || null,
          speakerId: data.speakerId || null,
          seriesId: data.seriesId || null,
          createdById: ctx.userId,
          publishedAt: data.isPublished ? new Date() : null,
          topics: {
            create: topicIds.map((topicId) => ({ topicId })),
          },
        },
        include: {
          speaker: true,
          series: true,
          topics: { include: { topic: true } },
        },
      })

      return sermon
    }),

  // Admin: Update sermon
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        titleEn: z.string().min(1).optional(),
        titleAm: z.string().optional(),
        summaryEn: z.string().optional(),
        summaryAm: z.string().optional(),
        scriptureReferences: z.array(z.any()).optional(),
        speakerId: z.string().uuid().nullable().optional(),
        seriesId: z.string().uuid().nullable().optional(),
        videoUrl: z.string().url().optional().or(z.literal('')).nullable(),
        audioUrl: z.string().url().optional().or(z.literal('')).nullable(),
        memoryVerseEn: z.string().optional(),
        memoryVerseAm: z.string().optional(),
        prayerPoints: z.array(z.string()).optional(),
        discussionQuestions: z.array(z.string()).optional(),
        topicIds: z.array(z.string().uuid()).optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, topicIds, ...data } = input

      // Update topics if provided
      if (topicIds !== undefined) {
        await ctx.prisma.sermonTopic.deleteMany({ where: { sermonId: id } })
        await ctx.prisma.sermonTopic.createMany({
          data: topicIds.map((topicId) => ({ sermonId: id, topicId })),
        })
      }

      const updateData: Record<string, unknown> = { ...data }
      
      // Handle publish state
      if (data.isPublished !== undefined) {
        const current = await ctx.prisma.sermon.findUnique({ where: { id } })
        if (data.isPublished && !current?.publishedAt) {
          updateData.publishedAt = new Date()
        }
      }

      const sermon = await ctx.prisma.sermon.update({
        where: { id },
        data: updateData,
        include: {
          speaker: true,
          series: true,
          topics: { include: { topic: true } },
        },
      })

      return sermon
    }),

  // Admin: Delete sermon
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.sermon.delete({ where: { id: input.id } })
      return { success: true }
    }),

  // Admin: Get all sermons including drafts
  adminList: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
        status: z.enum(['all', 'published', 'draft']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status } = input
      const skip = (page - 1) * pageSize

      const where =
        status === 'all'
          ? {}
          : status === 'published'
            ? { isPublished: true }
            : { isPublished: false }

      const [sermons, count] = await Promise.all([
        ctx.prisma.sermon.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            speaker: true,
            series: true,
          },
        }),
        ctx.prisma.sermon.count({ where }),
      ])

      return {
        data: sermons,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      }
    }),
})
