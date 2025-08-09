import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

interface SocketData {
  userId: string;
  projectId: string;
}

export function setupWebSocket(server: HTTPServer) {
  // Create WebSocket server for real-time chat
  const wss = new WebSocketServer({ 
    server: server, 
    path: '/ws' 
  });

  const rooms = new Map<string, Set<WebSocket & { userId?: string }>>();
  const userSockets = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket & { userId?: string }, request) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    if (!projectId || !userId) {
      ws.close(1008, 'Missing projectId or userId');
      return;
    }

    ws.userId = userId;
    ws.projectId = projectId;

    // Add user to room
    if (!rooms.has(projectId)) {
      rooms.set(projectId, new Set());
    }
    rooms.get(projectId)!.add(ws);
    userSockets.set(userId, ws);

    // Notify others that user joined
    broadcastToRoom(projectId, {
      type: 'userJoined',
      userId: userId,
    }, rooms, ws);

    // Send current online users to the new connection
    const onlineUsers = Array.from(rooms.get(projectId) || [])
      .map(socket => socket.userId)
      .filter(id => id && id !== userId);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'onlineUsers',
        users: onlineUsers,
      }));
    }

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'message':
            // Broadcast message to all users in the room
            broadcastToRoom(projectId, {
              type: 'message',
              data: message.data,
            }, rooms);
            break;
            
          case 'typing':
            // Broadcast typing indicator to others in room
            broadcastToRoom(projectId, {
              type: 'typing',
              userId: userId,
              isTyping: message.isTyping,
            }, rooms, ws);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      // Remove user from room
      const room = rooms.get(projectId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(projectId);
        } else {
          // Notify others that user left
          broadcastToRoom(projectId, {
            type: 'userLeft',
            userId: userId,
          }, rooms);
        }
      }
      userSockets.delete(userId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

function broadcastToRoom(
  projectId: string, 
  message: any, 
  rooms: Map<string, Set<WebSocket & { userId?: string }>>,
  exclude?: WebSocket
) {
  const room = rooms.get(projectId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  
  room.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}