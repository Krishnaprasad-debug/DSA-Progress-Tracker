import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Enables sending and receiving HttpOnly cookies across origins
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
