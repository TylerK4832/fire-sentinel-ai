import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../../hooks/use-mobile";

interface FireAlert {
  cameraId: string;
  cameraName: string;
  probability: number;
}

interface FireAlertsProps {
  alerts: FireAlert[];
}

export const FireAlerts = ({ alerts }: FireAlertsProps) => {
  const isMobile = useIsMobile();

  if (alerts.length === 0) {
    return (
      <Card className="glass-morphism h-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="rounded-full bg-green-500/10 p-3 mb-4">
              <Flame className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Active Fires</h3>
            <p className="text-muted-foreground">
              All monitored areas are currently clear
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const AlertsList = () => (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Link
          key={alert.cameraId}
          to={`/camera/${alert.cameraId}`}
          className="block transition-transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">{alert.cameraName}</p>
                <p className="text-sm text-muted-foreground">Camera ID: {alert.cameraId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-red-500">{alert.probability}%</p>
              <p className="text-sm text-muted-foreground">Fire Probability</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <Card className="glass-morphism h-full">
      <CardContent className="flex flex-col h-full p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4 text-gradient">Potential Active Fire Alerts</h2>
        {isMobile ? (
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            <AlertsList />
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <AlertsList />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};