import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/services/api'
import { requestNotificationPermission } from '@/services/firebase'
import { notificationAPI } from '@/services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      isLoading:   false,
      error:       null,

      // ── Register ──────────────────────────────────────────────────────────
      register: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.register(formData)
          sessionStorage.setItem('accessToken', data.accessToken)
          set({ user: data.user, accessToken: data.accessToken, isLoading: false })
          get()._postLoginSetup()
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed'
          set({ error: msg, isLoading: false })
          return { success: false, message: msg }
        }
      },

      // ── Login ─────────────────────────────────────────────────────────────
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.login(credentials)
          sessionStorage.setItem('accessToken', data.accessToken)
          set({ user: data.user, accessToken: data.accessToken, isLoading: false })
          get()._postLoginSetup()
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed'
          set({ error: msg, isLoading: false })
          return { success: false, message: msg }
        }
      },

      // ── Google OAuth ──────────────────────────────────────────────────────
      googleLogin: async (googleToken) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.googleAuth(googleToken)
          sessionStorage.setItem('accessToken', data.accessToken)
          set({ user: data.user, accessToken: data.accessToken, isLoading: false })
          get()._postLoginSetup()
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Google login failed'
          set({ error: msg, isLoading: false })
          return { success: false, message: msg }
        }
      },

      // ── Logout ────────────────────────────────────────────────────────────
      logout: async () => {
        try { await authAPI.logout() } catch (_) {}
        sessionStorage.removeItem('accessToken')
        set({ user: null, accessToken: null })
      },

      // ── Hydrate (called on app load) ──────────────────────────────────────
      hydrate: async () => {
        const token = sessionStorage.getItem('accessToken')
        if (!token) return
        try {
          const { data } = await authAPI.getMe()
          set({ user: data.user })
        } catch (_) {
          // Token expired — try silent refresh (interceptor handles it)
        }
      },

      // ── Update profile ────────────────────────────────────────────────────
      updateProfile: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await authAPI.updateProfile(formData)
          set({ user: data.user, isLoading: false })
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Update failed'
          set({ error: msg, isLoading: false })
          return { success: false, message: msg }
        }
      },

      // ── Helpers ───────────────────────────────────────────────────────────
      clearError: () => set({ error: null }),

      isAuthenticated: () => !!get().user,
      isPremium:       () => ['premium', 'enterprise'].includes(get().user?.plan),
      isAdmin:         () => get().user?.role === 'admin',
      isEditor:        () => ['editor', 'admin'].includes(get().user?.role),

      _postLoginSetup: async () => {
        const token = await requestNotificationPermission()
        if (token) {
          try { await notificationAPI.registerToken(token) } catch (_) {}
        }
      }
    }),
    {
      name:    'disk-auth',
      partialize: (state) => ({ user: state.user })  // only persist user, not token
    }
  )
)

export default useAuthStore
