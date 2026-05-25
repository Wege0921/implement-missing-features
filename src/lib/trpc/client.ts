'use client'

import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from './router'

/**
 * tRPC React client
 * Use this to call tRPC procedures from React components
 */
export const trpc = createTRPCReact<AppRouter>()
