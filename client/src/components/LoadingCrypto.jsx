import { ClipLoader } from "react-spinners";

export default function LoadingCrypto() {
  return (
    <div className="flex flex-col items-center justify-center mt-16 space-y-4 bg-gray-900">
      <ClipLoader color="#00ff99" size={50} />
      <p className="text-center text-gray-400 text-lg font-medium animate-pulse">
        Fetching latest crypto prices...
      </p>
      <p className="text-sm text-gray-500">
        Please wait while the blockchain gods do their thing.
      </p>
    </div>
  );
}
