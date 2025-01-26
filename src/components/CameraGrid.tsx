import { cameras } from "../data/cameras";
import { CameraFeed } from "./CameraFeed";

export const CameraGrid = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Camera Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cameras.map((camera) => (
          <CameraFeed key={camera.id} camera={camera} />
        ))}
      </div>
    </div>
  );
};