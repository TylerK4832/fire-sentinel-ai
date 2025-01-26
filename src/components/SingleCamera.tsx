import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCameraById } from "../data/cameras";
import { getCameraData } from "../utils/dynamodb";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2, Flame, Timer } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export const SingleCamera = () => {
  const { id } = useParams();

  const { data: camera, isLoading: isLoadingCamera } = useQuery({
    queryKey: ['camera', id],
    queryFn: () => getCameraById(id!)
  });

  const { data: cameraDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['cameraDetails', id],
    queryFn: () => getCameraData(id!),
    enabled: !!camera
  });

  const hasFireDetection = cameraDetails?.some(detail => detail.fire_score > 0.5);
  const averageFireProbability = cameraDetails ? (cameraDetails.reduce((acc, curr) => acc + curr.fire_score, 0) / cameraDetails.length * 100).toFixed(2) : 0;

  if (isLoadingCamera || !camera) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gradient">{camera.name}</h1>
            <p className="text-muted-foreground">Camera ID: {camera.id}</p>
          </div>
        </div>

        {!isLoadingDetails && (
          <Alert variant={hasFireDetection ? "destructive" : "default"}>
            <div className="flex items-center gap-2">
              {hasFireDetection ? (
                <AlertTriangle className="h-5 w-5 text-[#F97316]" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              <AlertTitle className="text-xl font-semibold">
                {hasFireDetection ? "Fire Alert" : "All Clear"}
              </AlertTitle>
            </div>
            <AlertDescription className="text-lg">
              {hasFireDetection ? (
                <span className="text-[#F97316]">
                  This camera has detected potential fire activity. Please check the feed and contact emergency services if necessary.
                </span>
              ) : (
                <span className="text-green-500/90">
                  Current readings indicate normal conditions with no fire detection.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Analytics Cards */}
        {!isLoadingDetails && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card className="glass-morphism p-4">
              <div className="flex items-center gap-4">
                <Flame className="h-8 w-8 text-[#F97316]" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Fire Probability</p>
                  <p className="text-2xl font-bold">{averageFireProbability}%</p>
                </div>
              </div>
            </Card>
            <Card className="glass-morphism p-4">
              <div className="flex items-center gap-4">
                <Timer className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Readings</p>
                  <p className="text-2xl font-bold">{cameraDetails.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Chart Card */}
        <Card className="glass-morphism">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4 text-gradient">Fire Detection Probability Timeline</h2>
            {isLoadingDetails ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
              </div>
            ) : cameraDetails && cameraDetails.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={cameraDetails}
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
                      dataKey="probability" 
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#F97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this time period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
