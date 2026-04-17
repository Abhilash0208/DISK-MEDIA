import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,       // sends httpOnly refresh cookie automatically
  headers: { 'Content-Type': 'application/json' }
})

// ── Attach access token to every request ─────────────────────────────────────
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Silent refresh on 401 ─────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        sessionStorage.setItem('accessToken', data.accessToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        sessionStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth endpoints ─────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  refresh:        ()      => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)  => api.post('/auth/reset-password', data),
  getMe:          ()      => api.get('/auth/me'),
  updateProfile:  (data)  => api.put('/auth/profile', data),
  changePassword: (data)  => api.put('/auth/change-password', data),
  googleAuth:     (token) => api.post('/auth/google', { token })
}

// ── Content endpoints ──────────────────────────────────────────────────────────
export const contentAPI = {
  getAll:     (params) => api.get('/content', { params }),
  getBySlug:  (slug)   => api.get(`/content/${slug}`),
  create:     (data)   => api.post('/content', data),
  update:     (id, d)  => api.put(`/content/${id}`, d),
  delete:     (id)     => api.delete(`/content/${id}`),
  like:       (id)     => api.post(`/content/${id}/like`),
  save:       (id)     => api.post(`/content/${id}/save`),
  getTrending:()       => api.get('/content/trending'),
  getBreaking:()       => api.get('/content/breaking')
}

// ── Feed / recommendations ─────────────────────────────────────────────────────
export const feedAPI = {
  getPersonalized: (page = 1) => api.get('/feed', { params: { page } }),
  logBehavior:     (data)     => api.post('/behavior', data)
}

// ── Search ─────────────────────────────────────────────────────────────────────
export const searchAPI = {
  search: (q, params) => api.get('/search', { params: { q, ...params } })
}

// ── Subscription / payments ────────────────────────────────────────────────────
export const subscriptionAPI = {
  createCheckout: (plan)   => api.post('/subscribe/checkout', { plan }),
  getStatus:      ()       => api.get('/subscribe/status'),
  cancel:         ()       => api.post('/subscribe/cancel'),
  getPlans:       ()       => api.get('/subscribe/plans')
}

// ── Admin ──────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  updateUser:   (id, d)  => api.put(`/admin/users/${id}`, d),
  deleteUser:   (id)     => api.delete(`/admin/users/${id}`)
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  registerToken: (token) => api.post('/notifications/register', { token }),
  getAll:        ()      => api.get('/notifications'),
  markRead:      (id)    => api.put(`/notifications/${id}/read`),
  markAllRead:   ()      => api.put('/notifications/read-all')
}

export default api
