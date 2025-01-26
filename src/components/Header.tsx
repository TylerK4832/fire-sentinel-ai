import { Link, useLocation } from "react-router-dom";
import { Flame } from "lucide-react";

export const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Flame className="h-8 w-8 text-orange-500" />
          <span className="text-2xl font-bold text-gradient">
            firesentinel<span className="text-orange-500">.ai</span>
          </span>
        </Link>
      </div>
    </header>
  );
};