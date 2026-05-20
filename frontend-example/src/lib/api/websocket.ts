import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('[WS] connected', socket?.id));
  socket.on('disconnect', (reason) => console.log('[WS] disconnected', reason));
  socket.on('connect_error', (err) => console.error('[WS] error', err.message));

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function onNotification(
  cb: (notification: { id: string; titulo: string; mensaje: string; tipo: string }) => void,
): () => void {
  if (!socket) return () => {};
  socket.on('notification:new', cb);
  return () => socket?.off('notification:new', cb);
}
