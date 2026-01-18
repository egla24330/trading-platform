import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import history from "connect-history-api-fallback";

import connectToMongoDB from "./config/mongodb.js";

// Routes
import userRouter from "./routes/userRoutes.js";
import newsRouter from "./routes/newsRoutes.js";
import loanRouter from "./routes/loanRoutes.js";
import kycRouter from "./routes/kycRoutes.js";
import depositRouter from "./routes/depositRoutes.js";
import withdrawalRoute from "./routes/withdrawalRoutes.js";
import authRouter from "./routes/authRoute.js";
import tradeRouter from "./routes/tradeRoutes.js";
import conversionRouter from "./routes/conversionRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";

import PriceFeedService from "./services/priceFeed.js";

dotenv.config();

/* ---------- Path Fix (ESM pain tax) ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- App ---------- */
const app = express();

/* ---------- Middleware ---------- */
const allow = ["http://localhost:5173"];
app.use(cors({ origin: allow, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------- DB ---------- */
connectToMongoDB();

/* ---------- Server & Socket ---------- */
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

/* ---------- Price Feed ---------- */
let priceFeedService;
try {
  priceFeedService = new PriceFeedService(io);
  global.priceFeedService = priceFeedService;
  app.set("priceFeedService", priceFeedService);
} catch (err) {
  console.error("PriceFeedService failed:", err);
}

/* ---------- API Routes (FIRST) ---------- */
app.use("/api/auth", authRouter);
app.use("/api/news", newsRouter);
app.use("/api/loans", loanRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/deposits", depositRouter);
app.use("/api/withdrawals", withdrawalRoute);
app.use("/api/users", userRouter);
app.use("/api/trades", tradeRouter);
app.use("/api/conversions", conversionRouter);
app.use("/api/notifications", notificationRouter);

/* ---------- Price APIs ---------- */
app.get("/api/prices", (req, res) => {
  if (!priceFeedService) return res.status(503).json({ message: "Service unavailable" });
  res.json(priceFeedService.getPrices());
});

app.get("/api/prices/:symbol", (req, res) => {
  const price = priceFeedService?.getPrice(req.params.symbol);
  if (!price) return res.status(404).json({ message: "Symbol not found" });
  res.json(price);
});

/* ---------- SPA History Fallback ---------- */
app.use(
  history({
    rewrites: [
      { from: /^\/api\/.*$/, to: ctx => ctx.parsedUrl.pathname }
    ]
  })
);

/* ---------- Static Frontend ---------- */
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

/* ---------- Socket.IO ---------- */
io.on("connection", socket => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

/* ---------- Shutdown ---------- */
const shutdown = () => {
  priceFeedService?.disconnect();
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

/* ---------- Listen ---------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
