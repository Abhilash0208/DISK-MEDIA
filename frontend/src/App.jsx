import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import useUIStore from '@/store/uiStore'
import useSocket from '@/hooks/useSocket'
import Navbar from '@/components/layout/Navbar'
import MiniPlayer from '@/components/player/MiniPlayer'
import PageLoader from '@/components/common/PageLoader'
import {
  ProtectedRoute, GuestRoute, EditorRoute, AdminRoute
} from '@/components/auth/ProtectedRoute'

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
const HomePage          = lazy(() => import('@/pages/HomePage'))
const LoginPage         = lazy(() => import('@/pages/LoginPage'))
const RegisterPage      = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage= lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const ArticlePage       = lazy(() => import('@/pages/ArticlePage'))
const VideoPage         = lazy(() => import('@/pages/VideoPage'))
const PodcastPage       = lazy(() => import('@/pages/PodcastPage'))
const LivePage          = lazy(() => import('@/pages/LivePage'))
const SearchPage        = lazy(() => import('@/pages/SearchPage'))
const CategoryPage      = lazy(() => import('@/pages/CategoryPage'))
const PricingPage       = lazy(() => import('@/pages/PricingPage'))
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'))
const AdminPanel        = lazy(() => import('@/pages/AdminPanel'))
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'))

// Pages that don't show Navbar
const BARE_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export default function App() {
  const { hydrate } = useAuthStore()
  const location    = useLocation()
  const showNav     = !BARE_ROUTES.some(r => location.pathname.startsWith(r))

  // Init socket once
  useSocket()

  // Hydrate user session on mount
  useEffect(() => { hydrate() }, [])

  // Scroll to top on route change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])

  return (
    <>
      {showNav && <Navbar />}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"                   element={<HomePage />} />
          <Route path="/news"               element={<CategoryPage type="article" />} />
          <Route path="/videos"             element={<CategoryPage type="video" />} />
          <Route path="/podcasts"           element={<CategoryPage type="podcast" />} />
          <Route path="/live"               element={<LivePage />} />
          <Route path="/search"             element={<SearchPage />} />
          <Route path="/category/:slug"     element={<CategoryPage />} />
          <Route path="/content/:slug"      element={<ArticlePage />} />
          <Route path="/video/:slug"        element={<VideoPage />} />
          <Route path="/podcast/:slug"      element={<PodcastPage />} />
          <Route path="/pricing"            element={<PricingPage />} />

          {/* Guest only */}
          <Route path="/login"             element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"          element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password"   element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password"    element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          {/* Authenticated */}
          <Route path="/dashboard/*"       element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/logout"            element={<LogoutPage />} />

          {/* Admin */}
          <Route path="/admin/*"           element={<AdminRoute><AdminPanel /></AdminRoute>} />

          {/* 404 */}
          <Route path="*"                  element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      {/* Persistent bottom player (podcast/video) */}
      <MiniPlayer />
    </>
  )
}

// Inline logout component — clears session then redirects
function LogoutPage() {
  const { logout } = useAuthStore()
  useEffect(() => { logout() }, [])
  return null
}
