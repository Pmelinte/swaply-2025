# Cloudinary Environment Variables

This document describes the environment variables required for Cloudinary image uploads in Swaply 2025.

## Required Variables

Add the following variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How to Get These Values

1. Go to [Cloudinary Console](https://console.cloudinary.com/)
2. Sign up or log in to your account
3. Navigate to **Dashboard**
4. Copy the following values from the "Account Details" section:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

## Security Notes

- These environment variables are server-side only (no `NEXT_PUBLIC_` prefix)
- They are NOT exposed to the browser
- The API Secret must be kept confidential
- Never commit these values to version control

## Upload Configuration

Images are uploaded to the `swaply/items/` folder in your Cloudinary account.

Supported formats:
- JPEG
- PNG
- WebP
- GIF

Maximum file size: 10MB

## Example

```env
CLOUDINARY_CLOUD_NAME=my-swaply-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```
