import { supabase } from "../integrations/supabase/client";
import { useToast } from "../hooks/use-toast";

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

    console.log('Camera data response:', data);
    return data || [];
  } catch (error) {
    console.error("Error fetching camera data:", error);
    throw error;
  }
};