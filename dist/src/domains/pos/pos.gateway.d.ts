import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class PosGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger;
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, payload: {
        sessionId: string;
    }): {
        event: string;
        room: string;
    } | {
        event: string;
        room: null;
    };
    handleJoinTerminalRoom(client: Socket, payload: {
        terminalId: string;
    }): {
        event: string;
        room: string;
    } | {
        event: string;
        room: null;
    };
    emitSessionAdopted(sessionId: string, sessionData: Record<string, unknown>): void;
    emitSaleCompleted(sessionId: string | null, saleData: Record<string, unknown>): void;
    emitTriggerPrint(terminalId: string | null, printPayload: Record<string, unknown>): void;
}
