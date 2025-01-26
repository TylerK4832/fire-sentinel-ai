import { Link, useLocation } from "react-router-dom";
import { Flame, LayoutDashboard, Grid, Menu, X } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "../hooks/use-mobile";

export const Header = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    {
      to: "/",
      icon: Grid,
      label: "All Cameras",
    },
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
  ];

  const NavContent = () => (
    <>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setIsMenuOpen(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors hover:bg-white/5 ${
              location.pathname === link.to ? "text-orange-500" : "text-white"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Flame className="h-8 w-8 text-orange-500" />
          <span className="text-2xl font-bold text-gradient">
            firesentinel<span className="text-orange-500">.ai</span>
          </span>
        </Link>
        
        {isMobile ? (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-white/5 rounded-md transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>

            {isMenuOpen && (
              <nav className="absolute top-full right-0 mt-2 w-48 py-2 bg-background border border-white/10 rounded-md shadow-lg">
                <NavContent />
              </nav>
            )}
          </div>
        ) : (
          <nav className="flex items-center gap-4">
            <NavContent />
          </nav>
        )}
      </div>
    </header>
  );
};