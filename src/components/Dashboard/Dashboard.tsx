import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../../data/cameras";
import { getCameraData } from "../../utils/dynamodb";
import { StatCards } from "./StatCards";
import { FireAlerts } from "./FireAlerts";
import { LoadingSpinner } from "./LoadingSpinner";
import { DashboardHeader } from "./DashboardHeader";
import { TrendChart } from "./TrendChart";
import { useToast } from "../../hooks/use-toast";

export const Dashboard = () => {
  const { toast } = useToast();

  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras
  });

  const { data: allCameraData = [], isLoading } = useQuery({
    queryKey: ['all-camera-data'],
    queryFn: async () => {
      const allData = await Promise.all(
        cameras.map(camera => getCameraData(camera.id))
      );
      return allData.flat();
    },
    enabled: cameras.length > 0,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load camera data.",
          variant: "destructive"
        });
      }
    }
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Calculate statistics
  const activeFires = cameras.filter(camera => 
    allCameraData.some(data => 
      data.cam_name === camera.id && data.label === "fire"
    )
  ).length;

  const averageProbability = allCameraData.length > 0
    ? (allCameraData.reduce((acc, curr) => acc + (curr.fire_score * 100), 0) / allCameraData.length).toFixed(2)
    : 0;

  // Get fire alerts
  const fireAlerts = cameras
    .map(camera => {
      const cameraData = allCameraData.filter(data => data.cam_name === camera.id);
      if (cameraData.length === 0) return null;
      
      const latestReading = cameraData[cameraData.length - 1];
      const probability = Number((latestReading.fire_score * 100).toFixed(2));
      
      return probability > 50 ? {
        cameraId: camera.id,
        cameraName: camera.name,
        probability
      } : null;
    })
    .filter(Boolean);

  // Prepare chart data
  const chartData = allCameraData
    .reduce((acc: any[], curr) => {
      const timestamp = new Date(curr.timestamp * 1000);
      const hour = timestamp.getHours().toString().padStart(2, '0');
      const timeKey = `${hour}:00`;
      
      const existing = acc.find(item => item.time === timeKey);
      if (existing) {
        existing.avgProbability = (existing.avgProbability + (curr.fire_score * 100)) / 2;
      } else {
        acc.push({
          time: timeKey,
          avgProbability: curr.fire_score * 100
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader 
        title="Wildfire Monitoring Dashboard"
        description="Real-time fire detection analytics across all cameras"
      />

      <StatCards
        totalCameras={cameras.length}
        activeFires={activeFires}
        averageProbability={Number(averageProbability)}
        totalReadings={allCameraData.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FireAlerts alerts={fireAlerts} />
        <TrendChart data={chartData} />
      </div>
    </div>
  );
};