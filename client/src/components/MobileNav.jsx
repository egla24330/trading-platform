import { Home, Megaphone, User, PiggyBank } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function MobileNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-4 right-4 bg-gray-900 backdrop-blur-xl rounded-2xl border border-gray-700 shadow-2xl flex justify-around items-center py-3 md:hidden z-50">
      <Tab
        icon={<Home size={23} />}
        label="Home"
        active={pathname === "/"}
        onClick={() => navigate("/")}
      />

      <Tab
        icon={<Megaphone size={23} />}
        label="News"
        active={pathname === "/news"}
        onClick={() => navigate("/news")}
      />

      <Tab
        icon={<PiggyBank size={23} />}
        label="Loans"
        active={pathname === "/loan"}
        onClick={() => navigate("/loan")}
      />

      <Tab
        icon={<User size={23} />}
        label="Profile"
        active={pathname === "/profile"}
        onClick={() => navigate("/profile")}
      />
    </nav>
  );
}

function Tab({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
        active 
          ? "text-blue-400 bg-blue-500/10 border" 
          : "text-gray-400 hover:text-white hover:bg-gray-700/50"
      }`}
    >
      <div className={`transition-transform duration-300 ${active ? "scale-110" : "scale-100"}`}>
        {icon}
      </div>
      <span className="text-[11px] font-medium">{label}</span>
      
      {/* Active indicator dot */}
      {active && (
        <div className="absolute -top-1 w-1 h-1 bg-blue-400 rounded-full"></div>
      )}
    </button>
  );
}