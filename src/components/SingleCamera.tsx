import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CameraFeed } from "./CameraFeed";
import { Button } from "./ui/button";
import { fetchCamerasFromS3 } from "../utils/s3Client";
import { useToast } from "@/components/ui/use-toast";

export const SingleCamera = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: cameras, isLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: fetchCamerasFromS3,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: "Failed to load camera data. Please check your AWS credentials.",
          variant: "destructive",
        });
      },
    },
  });

  const camera = cameras?.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      </div>
    );
  }

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
      <CameraFeed camera={camera} large />
    </div>
  );
};