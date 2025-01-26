import camerasData from '../../filtered_cameras_full_with_demo.json';
import { Camera } from '../types/camera';

// Define the type for our raw JSON data
interface RawCamera {
  name: string;
  id: string;
  link: string;
}

// Type assertion to tell TypeScript about the structure of our JSON data
const typedCamerasData = camerasData as RawCamera[];

export const getCameras = (): Camera[] => {
  return typedCamerasData.map(camera => ({
    id: camera.id,
    name: camera.name,
    link: camera.link
  }));
};