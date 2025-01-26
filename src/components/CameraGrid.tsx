import { useQuery } from "@tanstack/react-query";
import { fetchCamerasFromS3 } from "../utils/s3Client";
import { CameraFeed } from "./CameraFeed";
import { useToast } from "../hooks/use-toast";

export const CameraGrid = () => {
  const { toast } = useToast();
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: fetchCamerasFromS3,
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to load cameras. Please check your AWS credentials.",
          variant: "destructive"
        });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Camera Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Camera Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {cameras.map((camera) => (
          <CameraFeed key={camera.id} camera={camera} />
        ))}
      </div>
    </div>
  );
};