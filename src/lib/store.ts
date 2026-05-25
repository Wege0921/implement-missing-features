import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Language } from './types'

interface AppState {
  // User state
  user: Profile | null
  setUser: (user: Profile | null) => void
  
  // Language preference
  language: Language
  setLanguage: (lang: Language) => void
  
  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // Admin state
  adminTab: string
  setAdminTab: (tab: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      
      // Language preference (defaults to English)
      language: 'en',
      setLanguage: (language) => set({ language }),
      
      // UI state
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Admin state
      adminTab: 'sermons',
      setAdminTab: (adminTab) => set({ adminTab }),
    }),
    {
      name: 'kingdom-learning-storage',
      partialize: (state) => ({
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)

// Helper hook to get localized content
export function useLocalizedContent<T extends Record<string, unknown>>(
  item: T | null | undefined,
  field: string
): string {
  const { language } = useAppStore()
  if (!item) return ''
  
  const localizedField = `${field}_${language}` as keyof T
  const fallbackField = `${field}_en` as keyof T
  
  return (item[localizedField] as string) || (item[fallbackField] as string) || ''
}
