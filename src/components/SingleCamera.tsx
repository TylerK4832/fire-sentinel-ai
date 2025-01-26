import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCamerasFromS3 } from "../utils/s3Client";
import { CameraFeed } from "./CameraFeed";
import { Button } from "./ui/button";

export const SingleCamera = () => {
  const { id } = useParams();
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: fetchCamerasFromS3
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
      <CameraFeed camera={camera} large />
    </div>
  );
};