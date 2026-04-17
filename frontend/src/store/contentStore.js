import { create } from 'zustand'
import { contentAPI, feedAPI } from '@/services/api'

const useContentStore = create((set, get) => ({
  feed:         [],
  trending:     [],
  breaking:     [],
  currentItem:  null,
  feedPage:     1,
  hasMore:      true,
  isLoading:    false,
  error:        null,
  savedItems:   [],

  // ── Personalized feed ───────────────────────────────────────────────────
  fetchFeed: async (reset = false) => {
    const page = reset ? 1 : get().feedPage
    set({ isLoading: true, error: null })
    try {
      const { data } = await feedAPI.getPersonalized(page)
      set(s => ({
        feed:      reset ? data.items : [...s.feed, ...data.items],
        feedPage:  page + 1,
        hasMore:   data.hasMore,
        isLoading: false
      }))
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  // ── Trending + breaking ─────────────────────────────────────────────────
  fetchTrending: async () => {
    try {
      const { data } = await contentAPI.getTrending()
      set({ trending: data.items })
    } catch (_) {}
  },
  fetchBreaking: async () => {
    try {
      const { data } = await contentAPI.getBreaking()
      set({ breaking: data.items })
    } catch (_) {}
  },

  // ── Single content item ─────────────────────────────────────────────────
  fetchBySlug: async (slug) => {
    set({ isLoading: true, currentItem: null })
    try {
      const { data } = await contentAPI.getBySlug(slug)
      set({ currentItem: data.item, isLoading: false })
      // Log view behavior
      feedAPI.logBehavior({ contentId: data.item._id, event: 'view' }).catch(() => {})
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  // ── Like / Save ─────────────────────────────────────────────────────────
  toggleLike: async (id) => {
    try {
      const { data } = await contentAPI.like(id)
      set(s => ({
        feed: s.feed.map(i => i._id === id ? { ...i, likes: data.likes, liked: data.liked } : i),
        currentItem: s.currentItem?._id === id
          ? { ...s.currentItem, likes: data.likes, liked: data.liked }
          : s.currentItem
      }))
    } catch (_) {}
  },

  toggleSave: async (id) => {
    try {
      const { data } = await contentAPI.save(id)
      set(s => ({
        savedItems: data.saved
          ? [...s.savedItems, id]
          : s.savedItems.filter(i => i !== id)
      }))
    } catch (_) {}
  },

  // ── Real-time: push breaking news from socket ───────────────────────────
  addBreakingItem: (item) => {
    set(s => ({ breaking: [item, ...s.breaking].slice(0, 10) }))
  },

  reset: () => set({ feed: [], feedPage: 1, hasMore: true })
}))

export default useContentStore
