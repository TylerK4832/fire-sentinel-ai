import camerasData from '../../filtered_cameras_full.json';
import { Camera } from '../types/camera';

// Define the type for our raw JSON data
interface RawCamera {
  id: string;
  title: string;
  url: string;
}

// Type assertion to tell TypeScript about the structure of our JSON data
const typedCamerasData = camerasData as RawCamera[];

export const getCameras = (): Camera[] => {
  return typedCamerasData.map(camera => ({
    id: camera.id,
    name: camera.title,
    link: camera.url
  }));
};