import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../data/cameras";
import { getCameraData } from "../utils/dynamodb";
import { CameraFeed } from "./CameraFeed";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const SingleCamera = () => {
  const { id } = useParams();
  const { toast } = useToast();
  
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
        <Link to="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Format data for the chart
  const chartData = cameraDetails?.map((item: any) => ({
    time: new Date(item.timestamp * 1000).toLocaleTimeString(),
    fireScore: Number((item.fire_score * 100).toFixed(2))
  })) || [];

  // Check if any entries are labeled as fire
  const hasFireDetection = cameraDetails?.some((item: any) => item.label === "fire");

  return (
    <div className="container mx-auto p-4 max-w-[2000px] 2xl:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gradient">{camera.name}</h1>
        <Link to="/">
          <Button variant="outline" className="glass-morphism">Back to Dashboard</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-[60%_38%] gap-6">
        <div className="glass-morphism rounded-lg p-4">
          <CameraFeed camera={camera} large />
        </div>
        
        <div className="space-y-6">
          {/* Fire Status Alert */}
          <Alert 
            variant={hasFireDetection ? "destructive" : "default"} 
            className={`glass-morphism ${!hasFireDetection ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}
          >
            {hasFireDetection ? (
              <>
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <AlertTitle className="font-bold text-xl">Fire Detected!</AlertTitle>
                <AlertDescription className="text-lg">
                  This camera has detected potential fire activity. Please check the feed and contact emergency services if necessary.
                </AlertDescription>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <AlertTitle className="font-bold text-xl text-green-500">All Clear - No Fire Detected</AlertTitle>
                <AlertDescription className="text-lg text-green-500/90">
                  Current readings indicate normal conditions with no fire detection.
                </AlertDescription>
              </>
            )}
          </Alert>

          {/* Chart Card */}
          <Card className="glass-morphism">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 text-gradient">Fire Detection Score Timeline</h2>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                </div>
              ) : cameraDetails && cameraDetails.length > 0 ? (
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
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                        label={{ 
                          value: 'Fire Score (%)', 
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
                        dataKey="fireScore" 
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
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};