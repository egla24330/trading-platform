export default function TradingViewWidget({ symbol }) {
  const coinSymbol = symbol.toUpperCase() + "USD";

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-xl overflow-hidden shadow-lg">
      <iframe
        title="TradingView Chart"
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${symbol}&symbol=${coinSymbol}&interval=1&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=dark`}
        width="100%"
        height="100%"
        frameBorder="0"
        allowTransparency="true"
        scrolling="no"
      ></iframe>
    </div>
  );
}
