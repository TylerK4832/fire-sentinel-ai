import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../../data/cameras";
import { getCameraData } from "../../utils/dynamodb";
import { StatCards } from "./StatCards";
import { FireAlerts } from "./FireAlerts";
import { LoadingSpinner } from "./LoadingSpinner";
import { DashboardHeader } from "./DashboardHeader";
import { TrendChart } from "./TrendChart";
import { useToast } from "../../hooks/use-toast";
import { useMemo } from "react";

export const Dashboard = () => {
  const { toast } = useToast();

  // Cache cameras data for 5 minutes
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Cache camera data for 1 minute and enable parallel queries
  const { data: allCameraData = [], isLoading } = useQuery({
    queryKey: ['all-camera-data'],
    queryFn: async () => {
      // Use Promise.all for parallel fetching
      const promises = cameras.map(camera => getCameraData(camera.id));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: cameras.length > 0,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 2 * 60 * 1000, // 2 minutes
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

  // Memoize filtered data to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    if (!allCameraData) return [];
    
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    return allCameraData.filter(data => {
      const timestamp = data.timestamp * 1000;
      return timestamp >= twentyFourHoursAgo && timestamp <= now;
    });
  }, [allCameraData]);

  // Memoize fire alerts calculation
  const fireAlerts = useMemo(() => {
    if (!cameras || !filteredData) return [];

    return cameras
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
  }, [cameras, filteredData]);

  // Memoize statistics calculations
  const stats = useMemo(() => {
    const activeFires = fireAlerts.length;
    const averageProbability = filteredData.length > 0
      ? Number((filteredData.reduce((acc, curr) => acc + (curr.fire_score * 100), 0) / filteredData.length).toFixed(2))
      : 0;

    return {
      totalCameras: cameras.length,
      activeFires,
      averageProbability,
      totalReadings: filteredData.length
    };
  }, [cameras.length, fireAlerts.length, filteredData]);

  // Memoize chart data preparation
  const chartData = useMemo(() => {
    return filteredData
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
  }, [filteredData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <DashboardHeader 
        title="Wildfire Monitoring Dashboard"
        description="Real-time fire detection analytics across all cameras"
      />

      <StatCards
        totalCameras={stats.totalCameras}
        activeFires={stats.activeFires}
        averageProbability={stats.averageProbability}
        totalReadings={stats.totalReadings}
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