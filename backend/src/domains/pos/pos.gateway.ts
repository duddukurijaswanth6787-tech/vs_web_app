import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/pos-events',
})
export class PosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PosGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`POS Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`POS Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_session_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string },
  ) {
    if (payload?.sessionId) {
      const roomName = `session:${payload.sessionId}`;
      void client.join(roomName);
      this.logger.log(`Client ${client.id} joined room ${roomName}`);
      return { event: 'joined_room', room: roomName };
    }
    return { event: 'joined_room_failed', room: null };
  }

  @SubscribeMessage('join_terminal_room')
  handleJoinTerminalRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { terminalId: string },
  ) {
    if (payload?.terminalId) {
      const roomName = `terminal:${payload.terminalId}`;
      void client.join(roomName);
      this.logger.log(`Client ${client.id} joined terminal room ${roomName}`);
      return { event: 'joined_terminal_room', room: roomName };
    }
    return { event: 'joined_terminal_room_failed', room: null };
  }

  emitSessionAdopted(sessionId: string, sessionData: Record<string, unknown>) {
    const roomName = `session:${sessionId}`;
    this.logger.log(`Emitting pos:session_adopted to ${roomName}`);
    this.server.to(roomName).emit('pos:session_adopted', sessionData);
    this.server.emit('pos:global_session_adopted', sessionData);
  }

  emitSaleCompleted(
    sessionId: string | null,
    saleData: Record<string, unknown>,
  ) {
    if (sessionId) {
      const roomName = `session:${sessionId}`;
      this.server.to(roomName).emit('pos:sale_completed', saleData);
    }
    this.server.emit('pos:global_sale_completed', saleData);
  }

  emitTriggerPrint(
    terminalId: string | null,
    printPayload: Record<string, unknown>,
  ) {
    if (terminalId) {
      const roomName = `terminal:${terminalId}`;
      this.server.to(roomName).emit('pos:trigger_print', printPayload);
    }
    this.server.emit('pos:global_trigger_print', printPayload);
  }
}
