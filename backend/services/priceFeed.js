import WebSocket from "ws";

class PriceFeedService {
  constructor(io) {
    this.io = io;
    this.binanceWS = null;
    this.formatted = {};
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;

    // Tracked symbols
    this.tracked = [
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "BNBUSDT",
      "DOGEUSDT",
      "ADAUSDT",
      "XRPUSDT",
      "DOTUSDT"
    ];

    this.mapName = {
      BTCUSDT: "bitcoin",
      ETHUSDT: "ethereum",
      SOLUSDT: "solana",
      BNBUSDT: "binancecoin",
      DOGEUSDT: "dogecoin",
      ADAUSDT: "cardano",
      XRPUSDT: "ripple",
      DOTUSDT: "polkadot"
    };

    // Initialize WebSocket connection
    this.connectToBinance();
  }

  connectToBinance() {
    const BINANCE_STREAM = "wss://stream.binance.com:9443/ws/!ticker@arr";
    
    console.log("Connecting to Binance WebSocket...");
    
    this.binanceWS = new WebSocket(BINANCE_STREAM);

    this.binanceWS.on("open", () => {
      console.log("✅ Connected to Binance WebSocket");
      this.isConnected = true;
      this.retryCount = 0;
    });

    this.binanceWS.on("message", (data) => {
      this.handlePriceUpdate(data);
    });

    this.binanceWS.on("error", (err) => {
      console.error("❌ Binance WebSocket error:", err.message);
      this.isConnected = false;
    });

    this.binanceWS.on("close", (code, reason) => {
      console.log(`🔌 Binance WebSocket closed: ${code} - ${reason}`);
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  handlePriceUpdate(data) {
    try {
      const updates = JSON.parse(data);
      const timestamp = Date.now();

      updates.forEach((coin) => {
        if (!this.tracked.includes(coin.s)) return;

        const current = Number(coin.c);
        const open = Number(coin.o);
        const high = Number(coin.h);
        const low = Number(coin.l);
        const volume = Number(coin.v);
        const changePercent = ((current - open) / open) * 100;

        const symbol = this.mapName[coin.s];
        
        this.formatted[symbol] = {
          symbol: coin.s,
          name: symbol,
          usd: current,
          usd_24h_high: high,
          usd_24h_low: low,
          usd_24h_volume: volume,
          usd_24h_change: Number(changePercent.toFixed(2)),
          last_updated: timestamp
        };
      });

      // Emit to all connected Socket.IO clients
      if (this.io) {
        this.io.emit("priceUpdate", this.formatted);
      }

    } catch (error) {
      console.error("Error processing price update:", error);
    }
  }

  scheduleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error(`Max retries (${this.maxRetries}) reached. Stopping reconnection attempts.`);
      return;
    }

    this.retryCount++;
    const delay = this.retryDelay * this.retryCount;
    
    console.log(`Retrying connection in ${delay / 1000} seconds... (Attempt ${this.retryCount}/${this.maxRetries})`);
    
    setTimeout(() => {
      this.connectToBinance();
    }, delay);
  }

  getPrices() {
    return this.formatted;
  }

  getPrice(symbol) {
    const key = symbol.toLowerCase();
    return this.formatted[key];
  }

  getStatus() {
    return {
      connected: this.isConnected,
      trackedSymbols: this.tracked,
      retryCount: this.retryCount,
      lastUpdate: Object.keys(this.formatted).length > 0 
        ? Math.max(...Object.values(this.formatted).map(p => p.last_updated))
        : null
    };
  }

  addSymbol(symbol) {
    if (!this.tracked.includes(symbol)) {
      this.tracked.push(symbol);
      console.log(`Added ${symbol} to tracked symbols`);
    }
  }

  removeSymbol(symbol) {
    const index = this.tracked.indexOf(symbol);
    if (index > -1) {
      this.tracked.splice(index, 1);
      
      // Remove from formatted data
      const nameKey = Object.keys(this.mapName).find(key => key === symbol);
      if (nameKey && this.mapName[nameKey]) {
        delete this.formatted[this.mapName[nameKey]];
      }
      
      console.log(`Removed ${symbol} from tracked symbols`);
    }
  }

  disconnect() {
    if (this.binanceWS) {
      this.binanceWS.close();
      this.binanceWS = null;
      this.isConnected = false;
      console.log("Disconnected from Binance WebSocket");
    }
  }

  reconnect() {
    this.disconnect();
    this.retryCount = 0;
    this.connectToBinance();
  }
}

export default PriceFeedService;