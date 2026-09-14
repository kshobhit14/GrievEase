import { io } from 'socket.io-client';

// Extract the base server URL by removing any trailing '/api'
const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});