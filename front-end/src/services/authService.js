import api from '@/lib/api'

export const authService = {
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    return data
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  logout: () => {
    // Clear token from axios headers
    delete api.defaults.headers.common['Authorization']
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (email, resetToken, newPassword) => {
    const { data } = await api.post('/auth/reset-password', {
      email,
      resetToken,
      newPassword
    })
    return data
  }
}
