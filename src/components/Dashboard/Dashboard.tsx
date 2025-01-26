import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../../data/cameras";
import { getCameraData } from "../../utils/dynamodb";
import { StatCards } from "./StatCards";
import { FireAlerts } from "./FireAlerts";
import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "../../hooks/use-toast";

export const Dashboard = () => {
  const { toast } = useToast();

  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras
  });

  // Fetch data for all cameras
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gradient">Wildfire Monitoring Dashboard</h1>
        <p className="text-muted-foreground">Real-time fire detection analytics across all cameras</p>
      </div>

      <StatCards
        totalCameras={cameras.length}
        activeFires={activeFires}
        averageProbability={Number(averageProbability)}
        totalReadings={allCameraData.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FireAlerts alerts={fireAlerts} />
        
        <Card className="glass-morphism">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gradient">Average Fire Probability Trend</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                  <XAxis 
                    dataKey="time" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    label={{ 
                      value: 'Avg Fire Probability (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'currentColor',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      color: 'white'
                    }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgProbability" 
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};