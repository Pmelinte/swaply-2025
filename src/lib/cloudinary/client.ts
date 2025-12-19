// src/lib/cloudinary/client.ts
// Implementare minimă, stabilă, pentru upload Cloudinary din server (Route Handler).
// Folosește upload unsigned (upload_preset) – nu cere secret în server.
// Necesită în Vercel env vars:
// - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
// - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

type CloudinaryUploadResponse = {
  secure_url?: string;
  url?: string;
  error?: { message?: string };
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Upload o imagine la Cloudinary.
 * @param fileData - Data URL base64 (ex: "data:image/png;base64,...") sau URL
 * @param folder - folderul Cloudinary (opțional)
 * @returns secure_url
 */
export async function uploadImage(
  fileData: string,
  folder: string = "swaply"
): Promise<string> {
  const cloudName = requiredEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const uploadPreset = requiredEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.append("file", fileData);
  form.append("upload_preset", uploadPreset);
  form.append("folder", folder);

  const res = await fetch(endpoint, {
    method: "POST",
    body: form
  });

  const json = (await res.json()) as CloudinaryUploadResponse;

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      `Cloudinary upload failed with status ${res.status}`;
    throw new Error(msg);
  }

  const url = json.secure_url || json.url;
  if (!url) throw new Error("Cloudinary upload succeeded but no URL returned.");

  return url;
}
