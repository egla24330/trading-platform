// services/notificationSocket.js
import WebSocket from 'ws';
import Notification from '../models/Notification.js';

class NotificationSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket

    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      // Extract user ID from query params or headers
      const userId = req.headers['user-id'] || req.url.split('userId=')[1];
      
      if (!userId) {
        ws.close(1008, 'User ID required');
        return;
      }

      // Store connection
      this.clients.set(userId, ws);

      // Send initial unread count
      this.sendUnreadCount(userId);

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async sendUnreadCount(userId) {
    try {
      const unreadCount = await Notification.countDocuments({
        user: userId,
        status: 'unread'
      });

      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'unread_count',
          count: unreadCount
        }));
      }
    } catch (error) {
      console.error('Error sending unread count:', error);
    }
  }

  async sendNotification(userId, notification) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_notification',
        notification
      }));
    }
  }

  broadcastToAll(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

export default NotificationSocket;