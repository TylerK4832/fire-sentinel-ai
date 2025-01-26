import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Camera } from "../types/camera";

const s3Client = new S3Client({
  region: "us-west-1", // Update this to match your bucket's region
  credentials: {
    accessKeyId: localStorage.getItem("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: localStorage.getItem("AWS_SECRET_ACCESS_KEY") || "",
  },
});

const BUCKET_NAME = "your-bucket-name"; // Update this with your bucket name
const CAMERAS_JSON_KEY = "cameras.json"; // Update this with your JSON file name in the bucket

export const fetchCamerasFromS3 = async (): Promise<Camera[]> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: CAMERAS_JSON_KEY,
    });

    const response = await s3Client.send(command);
    const str = await response.Body?.transformToString();
    
    if (!str) {
      throw new Error("No data received from S3");
    }

    return JSON.parse(str) as Camera[];
  } catch (error) {
    console.error("Error fetching cameras from S3:", error);
    throw error;
  }
};