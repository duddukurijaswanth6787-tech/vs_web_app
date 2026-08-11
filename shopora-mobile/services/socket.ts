import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.23:4000/pos-events';

let socket: Socket | null = null;

export function getPosSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to NestJS POS WebSocket Gateway:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from NestJS POS WebSocket Gateway');
    });
  }

  return socket;
}

export function joinSessionRoom(sessionId: string) {
  const s = getPosSocket();
  s.emit('join_session_room', { sessionId });
}

export function onSessionAdopted(callback: (sessionData: Record<string, unknown>) => void) {
  const s = getPosSocket();
  s.on('pos:session_adopted', callback);
  return () => {
    s.off('pos:session_adopted', callback);
  };
}

export function onSaleCompleted(callback: (saleData: Record<string, unknown>) => void) {
  const s = getPosSocket();
  s.on('pos:sale_completed', callback);
  return () => {
    s.off('pos:sale_completed', callback);
  };
}
