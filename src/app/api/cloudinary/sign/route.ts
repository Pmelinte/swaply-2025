import { NextResponse } from 'next/server';
import { configureCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export async function POST() {
  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        message: 'Upload dezactivat: TODO (NEDEFINIT ÎN DOCS) sau lipsesc variabile Cloudinary.'
      },
      { status: 503 }
    );
  }

  const cloudinary = configureCloudinary();
  const timestamp = Math.round(new Date().getTime() / 1000);
  const apiSecret = process.env.CLOUDINARY_API_SECRET as string;
  const signature = cloudinary.utils.api_sign_request({ timestamp }, apiSecret);

  return NextResponse.json(
    {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature
    },
    { status: 200 }
  );
}
