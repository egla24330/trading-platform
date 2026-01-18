// src/hooks/usePriceFeed.js
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function usePriceFeed() {
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    socket.on("priceUpdate", (data) => {
      setPrices(data);
    });

    return () => {
      socket.off("priceUpdate");
    };
  }, []);

  return prices;
}
