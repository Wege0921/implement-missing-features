import { router } from './init'
import { sermonRouter } from './routers/sermon'
import { speakerRouter } from './routers/speaker'
import { seriesRouter } from './routers/series'
import { topicRouter } from './routers/topic'
import { bookmarkRouter } from './routers/bookmark'
import { progressRouter } from './routers/progress'
import { commentRouter } from './routers/comment'
import { learningRouter } from './routers/learning'
import { userProgressRouter } from './routers/user-progress'
import { userRouter } from './routers/user'

/**
 * Main application router
 * Combines all domain-specific routers
 */
export const appRouter = router({
  sermon: sermonRouter,
  speaker: speakerRouter,
  series: seriesRouter,
  topic: topicRouter,
  bookmark: bookmarkRouter,
  progress: progressRouter,
  comment: commentRouter,
  learning: learningRouter,
  userProgress: userProgressRouter,
  user: userRouter,
})

// Export type for client usage
export type AppRouter = typeof appRouter
