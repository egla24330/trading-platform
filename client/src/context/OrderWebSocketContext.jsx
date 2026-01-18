// src/context/OrderWebSocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useOrders } from './OrdersContext';

const OrderWebSocketContext = createContext();

export const OrderWebSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { refreshOrders, activeOrders } = useOrders();
  const processedOrders = useRef(new Set());

  // Custom toast for order completion
  const showOrderCompleteToast = useCallback((orderData) => {
    const orderId = orderData.orderId || orderData._id;
    const toastId = `order-complete-${orderId}`;
    
    // Check if toast already exists
    if (toast.isActive(toastId)) {
      return;
    }
    
    toast.success(
      `🎯 Order Completed!\nProfit: $${orderData.profit?.toFixed(2) || '0.00'}`,
      {
        toastId,
        autoClose: 3000,
        position: 'top-right'
      }
    );
    
    // Mark as processed
    processedOrders.current.add(orderId);
    
    // Clean up after 10 seconds
    setTimeout(() => {
      processedOrders.current.delete(orderId);
    }, 10000);
  }, []);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io("http://localhost:3000", { 
      transports: ["websocket"],
      path: '/socket.io', // or your custom path
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('Order WebSocket connected');
      // Subscribe to user-specific channel if needed
      socketRef.current.emit('subscribe', { type: 'orders' });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Order WebSocket disconnected');
    });

    // Order completed event
    socketRef.current.on('order-completed', (orderData) => {
      console.log('Order completed via WebSocket:', orderData);
      
      const orderId = orderData.orderId || orderData._id;
      
      // Skip if already processed
      if (processedOrders.current.has(orderId)) {
        return;
      }
      
      // Show toast notification
      showOrderCompleteToast(orderData);
      
      // Refresh order data
      refreshOrders();
    });

    // Order status update event
    socketRef.current.on('order-updated', (orderData) => {
      console.log('Order updated:', orderData);
      // Refresh orders if active order was updated
      if (activeOrders.some(order => order._id === orderData._id)) {
        refreshOrders();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [refreshOrders, activeOrders, showOrderCompleteToast]);

  const value = {
    socket: socketRef.current,
    emitEvent: (event, data) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(event, data);
      }
    }
  };

  return (
    <OrderWebSocketContext.Provider value={value}>
      {children}
    </OrderWebSocketContext.Provider>
  );
};

export const useOrderWebSocket = () => {
  const context = useContext(OrderWebSocketContext);
  if (!context) {
    throw new Error('useOrderWebSocket must be used within OrderWebSocketProvider');
  }
  return context;
};