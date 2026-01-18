export function Button({ children, onClick, variant = "default", className = "", ...props }) {
  const base =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none";
  const styles = {
    default: "bg-indigo-600 hover:bg-indigo-700 text-white",
    outline: "border border-gray-500 text-gray-200 hover:bg-gray-700",
    ghost: "text-gray-400 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
