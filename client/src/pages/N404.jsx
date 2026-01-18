import { Link } from "react-router-dom";

export default function N404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <h1 className="text-7xl font-bold text-red-500 tracking-tight">404</h1>

      <p className="mt-4 text-xl text-gray-300">
        This page packed its bags and left.
      </p>

      <p className="mt-1 text-gray-500">
        Or maybe you just typed something weird. Hard to tell.
      </p>

      <Link
        to="/"
        className="mt-8 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors font-semibold shadow-md"
      >
        Go Home
      </Link>
    </div>
  );
}
