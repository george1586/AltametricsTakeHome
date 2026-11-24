import axios from 'axios';
import { store } from '../store/store.ts';
import { loggedOut } from '../store/authSlice.ts';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add the token to every request
http.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or invalid token: log out (ProtectedRoute then sends the user to /login)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      store.dispatch(loggedOut());
    }
    return Promise.reject(error);
  },
);