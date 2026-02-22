import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('🔮 Connected to Shinigami-bin realm');
      });

      this.socket.on('disconnect', () => {
        console.log('👻 Disconnected from the ethereal plane');
      });

      this.socket.on('connect_error', (error) => {
        console.error('💀 Connection to the spirit realm failed:', error);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;