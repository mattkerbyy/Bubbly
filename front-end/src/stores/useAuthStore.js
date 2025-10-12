import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '@/services/authService'
import api from '@/lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Register new user
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.register(userData)
          const { user, token } = response.data
          
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return response
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Registration failed' 
          })
          throw error
        }
      },
      
      // Login user
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login(credentials)
          const { user, token } = response.data
          
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return response
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.message || 'Login failed' 
          })
          throw error
        }
      },
      
      // Logout user
      logout: () => {
        authService.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },
      
      // Get current user
      getMe: async () => {
        const token = get().token
        if (!token) return
        
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await authService.getMe()
          set({ user: response.data, isAuthenticated: true })
        } catch (error) {
          // Token invalid, clear auth
          set({
            user: null,
            token: null,
            isAuthenticated: false
          })
        }
      },
      
      // Update user data
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'bubbly-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
