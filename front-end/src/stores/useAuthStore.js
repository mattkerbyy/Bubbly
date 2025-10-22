import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/services/AuthFeature/authService";
import api from "@/lib/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);
          const { user, token } = response.data;

          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Registration failed",
          });
          throw error;
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          const { user, token } = response.data;

          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Login failed",
          });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      getMe: async () => {
        const token = get().token;
        if (!token) return;

        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const response = await authService.getMe();
          set({ user: response.data, isAuthenticated: true });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      clearError: () => set({ error: null }),
    }),
    {
      name: "bubbly-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
