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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cameraDetails.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index}</TableCell>
                        <TableCell>
                          <pre className="whitespace-pre-wrap text-sm">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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