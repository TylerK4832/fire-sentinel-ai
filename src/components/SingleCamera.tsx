import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../data/cameras";
import { getCameraData } from "../utils/dynamodb";
import { CameraFeed } from "./CameraFeed";
import { Card, CardContent } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2, Flame, Timer, Loader } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

export const SingleCamera = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras
  });

  const { data: cameraDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['camera-details', id],
    queryFn: () => getCameraData(id!),
    enabled: !!id,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load camera details.",
          variant: "destructive"
        });
      }
    }
  });

  const camera = cameras.find(c => c.id === id);

  if (!camera) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Camera not found</h1>
      </div>
    );
  }

  const now = Date.now();
  const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
  
  const filteredData = cameraDetails?.filter((item: any) => {
    const timestamp = item.timestamp * 1000;
    return timestamp >= twentyFourHoursAgo && timestamp <= now;
  }) || [];

  const chartData = filteredData.map((item: any) => ({
    time: new Date(item.timestamp * 1000).toLocaleTimeString(),
    fireProbability: Number((item.fire_score * 100).toFixed(2))
  }));

  const hasFireDetection = filteredData.some((item: any) => item.label === "fire");
  const averageFireProbability = chartData.length > 0 
    ? (chartData.reduce((acc, curr) => acc + curr.fireProbability, 0) / chartData.length).toFixed(2)
    : 0;

  return (
    <div className="container mx-auto p-4 max-w-[2000px] 2xl:px-0">
      <h1 className="text-2xl font-bold text-gradient mb-6">{camera.name}</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-[65%_33%] gap-6">
        <div className="max-h-[50vh] md:max-h-[60vh] xl:h-[calc(100vh-12rem)]">
          <CameraFeed camera={camera} large />
        </div>
        
        {isLoadingDetails ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
              <Loader className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg text-muted-foreground">Loading camera data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert 
              variant={hasFireDetection ? "destructive" : "default"} 
              className={`glass-morphism ${!hasFireDetection ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
            >
              <div className="flex items-start gap-6">
                {hasFireDetection ? (
                  <AlertTriangle className="h-10 w-10 text-red-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-10 w-10 text-green-500 shrink-0" />
                )}
                <div>
                  <AlertTitle className="font-bold text-xl mb-3">
                    {hasFireDetection ? (
                      <span className="text-red-500">Fire Detected!</span>
                    ) : (
                      <span className="text-green-500">All Clear - No Fire Detected</span>
                    )}
                  </AlertTitle>
                  <AlertDescription className="text-lg">
                    {hasFireDetection ? (
                      <span className="text-white">
                        This camera has detected potential fire activity in the last 24 hours. Please check the feed and contact emergency services if necessary.
                      </span>
                    ) : (
                      <span className="text-green-500/90">
                        No fire detection in the last 24 hours. Current readings indicate normal conditions.
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card className="glass-morphism p-4">
                <div className="flex items-center gap-4">
                  <Flame className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">24h Avg Fire Probability</p>
                    <p className="text-2xl font-bold">{averageFireProbability}%</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-morphism p-4">
                <div className="flex items-center gap-4">
                  <Timer className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">24h Readings</p>
                    <p className="text-2xl font-bold">{chartData.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="glass-morphism">
              <CardContent className={`pt-6 ${isMobile ? 'px-2' : 'px-6'}`}>
                <h2 className="text-lg font-semibold mb-4 text-gradient">Last 24 Hours Fire Detection Probability</h2>
                {chartData.length > 0 ? (
                  <div className={`${isMobile ? 'h-[250px]' : 'h-[300px]'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={chartData}
                        margin={isMobile ? 
                          { top: 5, right: 10, left: 0, bottom: 20 } : 
                          { top: 5, right: 30, left: 20, bottom: 25 }
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                        <XAxis 
                          dataKey="time" 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={isMobile ? 'preserveStartEnd' : 0}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                          label={{ 
                            value: 'Fire Probability (%)', 
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
                          dataKey="fireProbability" 
                          stroke={hasFireDetection ? "#ef4444" : "#22c55e"}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6, fill: hasFireDetection ? '#ef4444' : '#22c55e' }}
                          isAnimationActive={true}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No data available for the last 24 hours</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};