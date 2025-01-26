import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Bell, Grid, LayoutDashboard } from "lucide-react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            Wildfire Monitor
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <Grid className="h-5 w-5" />
                <span>All Cameras</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/alerts" className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Alerts</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};