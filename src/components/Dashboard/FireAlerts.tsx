import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";

interface FireAlert {
  cameraId: string;
  cameraName: string;
  probability: number;
}

interface FireAlertsProps {
  alerts: FireAlert[];
}

export const FireAlerts = ({ alerts }: FireAlertsProps) => {
  if (alerts.length === 0) {
    return (
      <Card className="glass-morphism">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="rounded-full bg-green-500/10 p-3 mb-4">
              <Flame className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Active Fires</h3>
            <p className="text-muted-foreground">All monitored areas are currently clear</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-morphism">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-gradient">Active Fire Alerts</h2>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.cameraId}
              className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20"
            >
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};