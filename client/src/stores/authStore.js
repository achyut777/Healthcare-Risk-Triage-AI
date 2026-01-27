import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { data } = response.data;
          
          set({
            user: data,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', userData);
          const { data } = response.data;
          
          set({
            user: data,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateProfile: async (profileData) => {
        try {
          const response = await api.put('/auth/profile', profileData);
          set({ user: { ...get().user, ...response.data.data } });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error };
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'health-triage-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Re-set auth header on app load
const { token } = useAuthStore.getState();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
