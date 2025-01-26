import { useState, useEffect } from "react";
import { Camera } from "../types/camera";
import { Link } from "react-router-dom";

interface CameraFeedProps {
  camera: Camera;
  large?: boolean;
}

export const CameraFeed = ({ camera, large = false }: CameraFeedProps) => {
  const [imageUrl, setImageUrl] = useState(`${camera.link}?t=${Date.now()}`);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageUrl(`${camera.link}?t=${Date.now()}`);
    }, 5000);

    return () => clearInterval(interval);
  }, [camera.link]);

  const content = (
    <>
      <div className="absolute inset-0 bg-black/20 z-10" />
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white z-20">
        <h3 className="text-sm font-medium">{camera.name}</h3>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={camera.name}
        className={`w-full h-full object-cover ${!large && 'transition-transform hover:scale-105'}`}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );

  return (
    <div className={`relative overflow-hidden rounded-lg ${large ? 'w-full h-[80vh]' : 'aspect-video'}`}>
      {!large ? (
        <Link to={`/camera/${camera.id}`} className="block w-full h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};