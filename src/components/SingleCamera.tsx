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
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{camera.name}</h1>
        <Link to="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CameraFeed camera={camera} large />
        </div>
        
        <div className="space-y-6">
          {/* Fire Status Alert */}
          <Alert variant={hasFireDetection ? "destructive" : "default"}>
            {hasFireDetection ? (
              <>
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Fire Detected!</AlertTitle>
                <AlertDescription>
                  This camera has detected potential fire activity. Please check the feed and contact emergency services if necessary.
                </AlertDescription>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <AlertTitle>No Fire Detected</AlertTitle>
                <AlertDescription>
                  Current readings indicate normal conditions with no fire detection.
                </AlertDescription>
              </>
            )}
          </Alert>

          {/* Chart Card */}
          <Card>
            <CardContent className="pt-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                </div>
              ) : cameraDetails && cameraDetails.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="time" 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                        label={{ 
                          value: 'Fire Score (%)', 
                          angle: -90, 
                          position: 'insideLeft',
                          fill: 'currentColor'
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="fireScore" 
                        stroke="var(--destructive)" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};