import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

// Require authenticated user
export function ProtectedRoute({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// Require premium/enterprise plan
export function PremiumRoute({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!['premium', 'enterprise'].includes(user.plan)) {
    return <Navigate to="/pricing" replace />
  }
  return children
}

// Require editor or admin role
export function EditorRoute({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!['editor', 'admin'].includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

// Require admin role
export function AdminRoute({ children }) {
  const { user } = useAuthStore()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

// Redirect authenticated users away (e.g. /login → /)
export function GuestRoute({ children }) {
  const { user } = useAuthStore()
  if (user) return <Navigate to="/" replace />
  return children
}
