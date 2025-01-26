import camerasData from '../../filtered_cameras_full.json';
import { Camera } from '../types/camera';

export const getCameras = (): Camera[] => {
  return camerasData.map(camera => ({
    id: camera.id,
    name: camera.title,
    link: camera.url
  }));
};