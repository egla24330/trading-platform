import { useEffect } from "react";

const Tawk = () => {
  useEffect(() => {
    if (window.Tawk_API) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://embed.tawk.to/696e5ddcf657ac197b782230/1jfbhta3i";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    document.body.appendChild(script);
  }, []);

  return null;
};

export default Tawk;
