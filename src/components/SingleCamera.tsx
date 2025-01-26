import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCameras } from "../data/cameras";
import { getCameraData } from "../utils/dynamodb";
import { CameraFeed } from "./CameraFeed";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

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

  // Convert timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

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
        
        <div>
          <Card>
            <CardContent className="pt-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                </div>
              ) : cameraDetails && cameraDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Fire Score</TableHead>
                        <TableHead>No Fire Score</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Camera</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cameraDetails.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatTimestamp(item.timestamp)}</TableCell>
                          <TableCell>{(item.fire_score * 100).toFixed(2)}%</TableCell>
                          <TableCell>{(item.no_fire_score * 100).toFixed(2)}%</TableCell>
                          <TableCell className="capitalize">{item.label}</TableCell>
                          <TableCell>{item.cam_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No additional details available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};