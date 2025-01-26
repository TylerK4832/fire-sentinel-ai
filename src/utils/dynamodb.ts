import { supabase } from "../integrations/supabase/client";

export const getCameraData = async (cameraId: string) => {
  console.log('Fetching data for camera:', cameraId);
  
  try {
    const { data, error } = await supabase.functions.invoke('get-camera-data', {
      body: { cameraId }
    });

    if (error) {
      console.error("Error fetching camera data:", error);
      throw error;
    }

    if (!data || !Array.isArray(data)) {
      console.log('No valid data returned from function');
      return [];
    }

    console.log('Camera data response:', data);
    return data;
  } catch (error) {
    console.error("Error fetching camera data:", error);
    throw error;
  }
};