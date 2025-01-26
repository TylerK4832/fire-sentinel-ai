import { Link, useLocation } from "react-router-dom";
import { Flame, LayoutDashboard, Grid } from "lucide-react";

export const Header = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Flame className="h-8 w-8 text-orange-500" />
          <span className="text-2xl font-bold text-gradient">
            firesentinel<span className="text-orange-500">.ai</span>
          </span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link 
            to="/" 
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors hover:bg-white/5 ${
              location.pathname === '/' ? 'text-orange-500' : 'text-white'
            }`}
          >
            <Grid className="h-5 w-5" />
            <span>All Cameras</span>
          </Link>
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors hover:bg-white/5 ${
              location.pathname === '/dashboard' ? 'text-orange-500' : 'text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};