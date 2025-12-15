import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function getCloudinaryClient() {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary environment variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return cloudinary;
}

export async function uploadImage(base64Data: string): Promise<string> {
  const cloudinaryClient = getCloudinaryClient();
  
  const result = await cloudinaryClient.uploader.upload(base64Data, {
    folder: 'swaply/items',
    resource_type: 'image',
  });

  return result.secure_url;
}
