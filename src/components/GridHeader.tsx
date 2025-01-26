import { Globe } from "lucide-react";

interface GridHeaderProps {
  totalCameras: number;
}

export const GridHeader = ({ totalCameras }: GridHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center mb-4">
        <Globe className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold mb-4 text-gradient">Wildfire Detection Network</h1>
      <p className="text-xl text-muted-foreground">
        Monitoring {totalCameras} locations across California in real-time with AI-powered precision
      </p>
    </div>
  );
};