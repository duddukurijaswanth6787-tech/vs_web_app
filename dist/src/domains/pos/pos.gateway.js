"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PosGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let PosGateway = PosGateway_1 = class PosGateway {
    logger = new common_1.Logger(PosGateway_1.name);
    server;
    handleConnection(client) {
        this.logger.log(`POS Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`POS Client disconnected: ${client.id}`);
    }
    handleJoinRoom(client, payload) {
        if (payload?.sessionId) {
            const roomName = `session:${payload.sessionId}`;
            void client.join(roomName);
            this.logger.log(`Client ${client.id} joined room ${roomName}`);
            return { event: 'joined_room', room: roomName };
        }
        return { event: 'joined_room_failed', room: null };
    }
    handleJoinTerminalRoom(client, payload) {
        if (payload?.terminalId) {
            const roomName = `terminal:${payload.terminalId}`;
            void client.join(roomName);
            this.logger.log(`Client ${client.id} joined terminal room ${roomName}`);
            return { event: 'joined_terminal_room', room: roomName };
        }
        return { event: 'joined_terminal_room_failed', room: null };
    }
    emitSessionAdopted(sessionId, sessionData) {
        const roomName = `session:${sessionId}`;
        this.logger.log(`Emitting pos:session_adopted to ${roomName}`);
        this.server.to(roomName).emit('pos:session_adopted', sessionData);
        this.server.emit('pos:global_session_adopted', sessionData);
    }
    emitSaleCompleted(sessionId, saleData) {
        if (sessionId) {
            const roomName = `session:${sessionId}`;
            this.server.to(roomName).emit('pos:sale_completed', saleData);
        }
        this.server.emit('pos:global_sale_completed', saleData);
    }
    emitTriggerPrint(terminalId, printPayload) {
        if (terminalId) {
            const roomName = `terminal:${terminalId}`;
            this.server.to(roomName).emit('pos:trigger_print', printPayload);
        }
        this.server.emit('pos:global_trigger_print', printPayload);
    }
};
exports.PosGateway = PosGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], PosGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_session_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], PosGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_terminal_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], PosGateway.prototype, "handleJoinTerminalRoom", null);
exports.PosGateway = PosGateway = PosGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/pos-events',
    })
], PosGateway);
//# sourceMappingURL=pos.gateway.js.map