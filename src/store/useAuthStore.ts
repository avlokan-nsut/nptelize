import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  user_id: string;
}

interface Credentials {
  email: string;
  password: string;
  role : string
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const apiUrl = import.meta.env.VITE_API_URL;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      login: async (credentials: Credentials) => {
        set({ loading: true, error: null });
        try {
        const url = `${apiUrl}/user/login?role=${credentials.role}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email : credentials.email,
                password : credentials.password
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
          }

          const data = await response.json();
          set({ user: { user_id: data.user_id }, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },
      logout: () => set({ user: null }),
    }),
    { name: 'auth-store' }
  )
);
