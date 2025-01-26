import { CameraFeed } from "./CameraFeed";
import { Search } from "lucide-react";
import { Camera } from "../types/camera";

interface CameraGridViewProps {
  cameras: Camera[];
}

export const CameraGridView = ({ cameras }: CameraGridViewProps) => {
  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No cameras found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {cameras.map((camera) => (
        <div key={camera.id} className="glass-morphism rounded-lg overflow-hidden">
          <CameraFeed camera={camera} />
        </div>
      ))}
    </div>
  );
};