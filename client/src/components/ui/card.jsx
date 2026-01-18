export function Card({ children, className = "", onClick }) {
  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900 shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
