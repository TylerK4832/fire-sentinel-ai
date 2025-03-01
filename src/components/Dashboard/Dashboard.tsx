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

  // Filter data for last 24 hours
  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
  
  const filteredData = allCameraData.filter(data => {
    const timestamp = data.timestamp * 1000;
    return timestamp >= twentyFourHoursAgo && timestamp <= now;
  });

  // Get fire alerts and calculate active fires from filtered data
  const fireAlerts = cameras
    .map(camera => {
      const cameraData = filteredData.filter(data => data.cam_name === camera.id);
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

  const activeFires = fireAlerts.length;

  // Calculate average probability across all cameras from filtered data
  const averageProbability = filteredData.length > 0
    ? Number((filteredData.reduce((acc, curr) => acc + (curr.fire_score * 100), 0) / filteredData.length).toFixed(2))
    : 0;

  // Prepare chart data from filtered data
  const chartData = filteredData
    .reduce((acc: any[], curr) => {
      const timestamp = new Date(curr.timestamp * 1000);
      const hour = timestamp.getHours().toString().padStart(2, '0');
      const minute = timestamp.getMinutes().toString().padStart(2, '0');
      const timeKey = `${hour}:${minute}`;
      
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
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <DashboardHeader 
        title="Wildfire Monitoring Dashboard"
        description="Real-time fire detection analytics across all cameras"
      />

      <StatCards
        totalCameras={cameras.length}
        activeFires={activeFires}
        averageProbability={averageProbability}
        totalReadings={filteredData.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="h-auto order-1 lg:order-none">
          <FireAlerts alerts={fireAlerts} />
        </div>
        <div className="h-auto order-2 lg:order-none">
          <TrendChart data={chartData} />
        </div>
      </div>
    </div>
  );
};