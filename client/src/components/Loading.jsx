// Loading.jsx
export default function Loading({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black/40 backdrop-blur-xl">

      <div className="relative w-28 h-28 flex items-center justify-center mb-6">

        {/* Floating glow sphere */}
        <div className="absolute w-20 h-20 bg-white blur-2xl rounded-full animate-[pulse_2s_ease-in-out_infinite]" />

        {/* Outer rotating gradient ring */}
        <div
          className="absolute w-28 h-28 rounded-full border-4 border-transparent 
                     animate-spin bg-[conic-gradient(from_0deg,transparent_0deg,#white_120deg,transparent_360deg)]"
          style={{ WebkitMask: "radial-gradient(farthest-side, transparent 70%, black 71%)" }}
        />

        {/* Inner orb */}
        <div className="relative w-10 h-10 bg-white rounded-full animate-bounce shadow-[0_0_20px_5px_white]" />

      </div>

      {/* General text */}
      <p className="text-white text-xs font-medium tracking-wide animate-pulse">
        {text}
      </p>

    </div>
  );
}
