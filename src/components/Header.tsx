import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Bell, Home, LineChart } from "lucide-react";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            Wildfire Monitor
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <LineChart className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/alerts">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};