// src/components/CoinList.jsx
import CoinCard from "./CoinCard";
//import usePriceFeed from "../hooks/usePriceFeed";
//import usePriceFeed from "../../hooks/usePriceFeed";
import { ClipLoader } from "react-spinners";
import { usePriceFeed } from "../../context/PriceFeedContext";

import { useNavigate } from 'react-router-dom';
export default function CoinList() {
  const { prices } = usePriceFeed();
  const navigate = useNavigate();

  let mok = [1, 2, 3, 4, 5, 6, 7];

 // console.log("CoinList prices test:", prices===null ? "null" : Object.keys(prices).length === 0 ? "empty" : "has data");



  if (false)
    return (
      <div id="pd" className="flex flex-col items-center justify-center mt-16 space-y-4 bg-gray-900 p-6">
        <ClipLoader color="#00ff99" size={50} />
        <p className="text-center text-gray-400 text-lg font-medium animate-pulse">
          Fetching latest crypto prices...
        </p>
        <p className="text-sm text-gray-500">
          Please wait while the blockchain gods do their thing.
        </p>
      </div>
    );

  if (!prices || Object.keys(prices).length === 0) {
    return (
      <>

        <div id="pd" className="text-2xl font-bold text-white text-center my-8">
          Live Crypto Prices
        </div>

         <div className="max-w-2xl m-auto " >
        {/* <div className="">
          <button
            className=" p-1 bg-blue-500 m-2 rounded-md text-white  w-[100px] cursor-pointer "
            onClick={() => alert("future clicked")}>Future</button>
          <button
            className=" p-1 bg-gray-900 m-2 rounded-md border text-white  w-[100px] cursor-pointer"
            onClick={() => alert("stock clicked")}>Stock</button>
        </div> */}
      </div>

        
        <div className="p-2 bg-gray-900 min-h-screen pb-10 m-auto">
          {mok.map((item) => (
            <CoinCard
              onClick={() => navigate(`/coin/bitcoin`)}
              key={item}
              name={"Loading..."}
              symbol={"---"}
              price={0}
              change={0}
            />
          ))}

        </div>
      </>
    );
  }




  return (
    <>


      <div id="pd" className="text-2xl font-bold text-white text-center my-8">
        Live Crypto Prices
      </div>
      <div className="max-w-2xl m-auto " >
        {/* <div className="">
          <button
            className=" p-1 bg-blue-500 m-2 rounded-md text-white  w-[100px] cursor-pointer "
            onClick={() => alert("future clicked")}>Future</button>
          <button
            className=" p-1 bg-gray-900 m-2 rounded-md border text-white w-[100px] cursor-pointer"
            onClick={() => alert("stock clicked")}>Stock</button>
        </div> */}
      </div>

      {
      //console.log("Rendering CoinList with data:", prices)
      }

      <div className="p-2 bg-gray-900 min-h-screen pb-10 m-auto">
        {Object.entries(prices).map(([coin, info]) => (
          <CoinCard
            onClick={() => navigate(`/coin/${coin}`)}
            key={coin}
            name={coin}
            symbol={coin.slice(0, 3)}
            price={info.usd}
            change={info.usd_24h_change}
          />
        ))}
      </div>
    </>
  );
}
