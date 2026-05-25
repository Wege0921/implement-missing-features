import 'server-only'
import { createCallerFactory, createContext } from './init'
import { appRouter } from './router'

/**
 * Server-side tRPC caller
 * Use this to call tRPC procedures from Server Components and Server Actions
 */
const createCaller = createCallerFactory(appRouter)

export async function createServerCaller() {
  const ctx = await createContext()
  return createCaller(ctx)
}
