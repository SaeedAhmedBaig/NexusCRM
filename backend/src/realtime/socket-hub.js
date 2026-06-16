const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function objectRoom(tenantId, entityType, entityId) {
  return `tenant:${tenantId}:object:${entityType}:${entityId}`;
}

function userRoom(tenantId, userId) {
  return `tenant:${tenantId}:user:${userId}`;
}

function initSocketIO(httpServer, jwtSecret) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /^http:\/\/[\w-]+\.localhost:3000$/,
      ],
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = jwt.verify(token, jwtSecret);
      socket.user = {
        id: payload.sub,
        tenantId: payload.tenantId,
        name: payload.name || 'User',
      };
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { tenantId, id: userId } = socket.user;
    socket.join(userRoom(tenantId, userId));

    socket.on('join', ({ entityType, entityId }) => {
      if (!entityType || !entityId) return;
      const room = objectRoom(tenantId, entityType, entityId);
      socket.join(room);
      socket.currentObjectRoom = room;
    });

    socket.on('leave', ({ entityType, entityId }) => {
      const room = objectRoom(tenantId, entityType, entityId);
      socket.leave(room);
    });

    socket.on('typing', ({ entityType, entityId, isTyping }) => {
      const room = objectRoom(tenantId, entityType, entityId);
      socket.to(room).emit('typing', {
        userId,
        userName: socket.user.name,
        isTyping: Boolean(isTyping),
      });
    });
  });

  return io;
}

function emitChatMessage(tenantId, entityType, entityId, message) {
  if (!io) return;
  io.to(objectRoom(tenantId, entityType, entityId)).emit('message', message);
}

function emitChatReadReceipt(tenantId, entityType, entityId, receipt) {
  if (!io) return;
  io.to(objectRoom(tenantId, entityType, entityId)).emit('message:read', receipt);
}

function emitNotification(tenantId, userId, notification) {
  if (!io) return;
  io.to(userRoom(tenantId, userId)).emit('notification', notification);
}

module.exports = {
  initSocketIO,
  emitChatMessage,
  emitChatReadReceipt,
  emitNotification,
  objectRoom,
  userRoom,
};
