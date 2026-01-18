import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const PriceFeedContext = createContext();
const socket = io("http://localhost:3000", { transports: ["websocket"] });

export const PriceFeedProvider = ({ children }) => {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    socket.on("priceUpdate", (data) => {
      setPrices({ ...data }); // always new reference
     // console.log("Received price update:", data);
    });

    return () => socket.off("priceUpdate");
  }, []);

  return (
    <PriceFeedContext.Provider value={{ prices }}>
      {children}
    </PriceFeedContext.Provider>
  );
};

export const usePriceFeed = () => useContext(PriceFeedContext);



