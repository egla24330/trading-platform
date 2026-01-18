// services/orderProcessor.js
import cron from 'node-cron';
import Order from '../models/Order.js';

class OrderProcessor {
  constructor() {
    this.isProcessing = false;
    this.startAutoProcessor();
  }

  // Process expired orders
  async processExpiredOrders() {
    if (this.isProcessing) {
      console.log('Already processing orders, skipping...');
      return;
    }

    this.isProcessing = true;
    
    try {
      const results = await Order.processExpiredOrders();
      
      if (results.length > 0) {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`Order processor: Processed ${successful} orders successfully, ${failed} failed`);
        
        // Log details for failed orders
        if (failed > 0) {
          console.error('Failed orders:', results.filter(r => !r.success));
        }
      }
      
    } catch (error) {
      console.error('Error in order processor:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Start automatic processing
  startAutoProcessor() {
    // Process orders every 10 seconds
    cron.schedule('*/10 * * * * *', () => {
      this.processExpiredOrders();
    });
    
    console.log('Order processor started: checking every 10 seconds');
  }

  // Stop automatic processing
  stopAutoProcessor() {
    // You can implement this if needed
    console.log('Order processor stopped');
  }
}

export const orderProcessor = new OrderProcessor();