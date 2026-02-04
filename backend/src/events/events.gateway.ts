import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token = this.extractTokenFromHeader(client);
    if (!token) {
      this.logger.warn(`Client attempt to connect without token: ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload; // { userId: ..., email: ... }
      client.join(`user_${payload.userId}`); // Join personal room
      this.logger.log(`Client connected: ${client.id} User: ${payload.userId} joined user_${payload.userId}`);
    } catch (e) {
      this.logger.error(`Client connection rejected: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Check auth handshake first (Socket.io v4 standard)
    if (client.handshake.auth && client.handshake.auth.token) {
       return client.handshake.auth.token;
    }
    // Fallback to query param
    if (client.handshake.query && client.handshake.query.token) {
       return client.handshake.query.token as string;
    }
    // Headers (Bearer)
    const [type, token] = client.handshake.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    // Ideally we should verify if user is member of project (using Prisma), 
    // but for now we trust the client has valid token and knows the ID. 
    // Secure approach: Check ProjectMember table here.
    const projectId = data.projectId;
    const roomName = `project_${projectId}`;
    client.join(roomName);
    this.logger.log(`User ${client.data.user?.userId} joined room ${roomName}`);
    return { event: 'joinedProject', data: { projectId, status: 'success' } };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const projectId = data.projectId;
    const roomName = `project_${projectId}`;
    client.leave(roomName);
    this.logger.log(`User ${client.data.user?.userId} left room ${roomName}`);
    return { event: 'leftProject', data: { projectId, status: 'success' } };
  }

  // === Public API for Services ===

  emitTaskCreated(projectId: string, task: any) {
    this.server.to(`project_${projectId}`).emit('task_created', task);
  }

  emitTaskUpdated(projectId: string, task: any) {
    this.server.to(`project_${projectId}`).emit('task_updated', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project_${projectId}`).emit('task_deleted', { id: taskId, projectId });
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification_created', notification);
  }
}
