import { Card } from "@/components/ui/card";
import { Flame, Camera, AlertTriangle, Timer } from "lucide-react";

interface StatCardsProps {
  totalCameras: number;
  activeFires: number;
  averageProbability: number;
  totalReadings: number;
}

export const StatCards = ({ totalCameras, activeFires, averageProbability, totalReadings }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glass-morphism p-4">
        <div className="flex items-center gap-4">
          <Camera className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-sm text-muted-foreground">Total Cameras</p>
            <p className="text-2xl font-bold">{totalCameras}</p>
          </div>
        </div>
      </Card>
      
      <Card className="glass-morphism p-4">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-sm text-muted-foreground">Active Fires</p>
            <p className="text-2xl font-bold">{activeFires}</p>
          </div>
        </div>
      </Card>
      
      <Card className="glass-morphism p-4">
        <div className="flex items-center gap-4">
          <Flame className="h-8 w-8 text-orange-500" />
          <div>
            <p className="text-sm text-muted-foreground">Average Fire Probability</p>
            <p className="text-2xl font-bold">{averageProbability}%</p>
          </div>
        </div>
      </Card>
      
      <Card className="glass-morphism p-4">
        <div className="flex items-center gap-4">
          <Timer className="h-8 w-8 text-purple-500" />
          <div>
            <p className="text-sm text-muted-foreground">Total Readings</p>
            <p className="text-2xl font-bold">{totalReadings}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};