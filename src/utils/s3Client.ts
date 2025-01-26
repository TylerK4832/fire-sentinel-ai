import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-west-1", // Replace with your region
  credentials: {
    accessKeyId: localStorage.getItem("AWS_ACCESS_KEY_ID") || "",
    secretAccessKey: localStorage.getItem("AWS_SECRET_ACCESS_KEY") || ""
  }
});

export const fetchCamerasFromS3 = async () => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: "your-bucket-name", // Replace with your bucket name
      Prefix: "public-camera-data/" // Adjust based on your folder structure
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    return response.Contents.map(object => {
      const id = object.Key?.split('/').pop()?.replace('latest-frame.jpg', '') || '';
      return {
        id,
        name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        link: `https://your-bucket-name.s3.amazonaws.com/${object.Key}`
      };
    }).filter(camera => camera.id);
  } catch (error) {
    console.error('Error fetching cameras from S3:', error);
    return [];
  }
};