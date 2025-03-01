import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CameraGrid } from "./components/CameraGrid";
import { SingleCamera } from "./components/SingleCamera";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { Header } from "./components/Header";
import { AlertsPage } from "./components/Alerts/AlertsPage";
import { AuthPage } from "./components/Auth/AuthPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-[#222222]">
          <Header />
          <main className="pt-20">
            <Routes>
              <Route path="/" element={<CameraGrid />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/camera/:id" element={<SingleCamera />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/auth" element={<AuthPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;