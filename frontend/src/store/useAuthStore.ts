import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface User {
  user_id: string;
  name : string;
  role : string
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
  checkSession: () => Promise<void>; 
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
            credentials: 'include'
          });

          if (!response.ok) {
            const errorData = await response.json();
            // console.log(errorData.detail);
            throw new Error(errorData.detail || 'Login failed');
          }

          const data = await response.json();
          // console.log(data.message);
          set({ user: { user_id: data.user_id , name:data.name, role:credentials.role }, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },
      logout: async () => {
        try {
          const response = await fetch(`${apiUrl}/user/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Logout failed");
          }
          window.location.href = '/';
          
        } catch (err) {
          console.error("Logout failed", err);
        } finally {
          set({ user: null });
        }
      },

      checkSession: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${apiUrl}/user/me`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            throw new Error("Session invalid");
          }
          const data = await response.json();
          set({ user: { user_id: data.user_id, name: data.name, role: data.role }, loading: false });
        } catch (error: any) {
          set({ user: null, error: error.message, loading: false });
        }
      },
    }),
    { name: 'auth-store' }
  )
);
