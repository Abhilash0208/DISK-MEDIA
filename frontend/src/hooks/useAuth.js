import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '@/store/authStore'

export const useAuth = () => {
  const store = useAuthStore()
  const navigate = useNavigate()

  const register = useCallback(async (formData) => {
    const result = await store.register(formData)
    if (result.success) {
      toast.success('Welcome to Disk Media!')
      navigate('/')
    } else {
      toast.error(result.message)
    }
    return result
  }, [store, navigate])

  const login = useCallback(async (credentials) => {
    const result = await store.login(credentials)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error(result.message)
    }
    return result
  }, [store, navigate])

  const logout = useCallback(async () => {
    await store.logout()
    toast.info('Logged out')
    navigate('/login')
  }, [store, navigate])

  return {
    user:            store.user,
    isLoading:       store.isLoading,
    error:           store.error,
    isAuthenticated: store.isAuthenticated(),
    isPremium:       store.isPremium(),
    isAdmin:         store.isAdmin(),
    isEditor:        store.isEditor(),
    register,
    login,
    logout,
    googleLogin:     store.googleLogin,
    updateProfile:   store.updateProfile,
    clearError:      store.clearError
  }
}

export default useAuth
