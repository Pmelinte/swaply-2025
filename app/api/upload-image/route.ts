import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { uploadImage } from "@/lib/cloudinary/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to upload images."
          }
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Missing file. Expected form-data field named 'file'."
          }
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Only image files are allowed."
          }
        },
        { status: 400 }
      );
    }

    // 10MB safety limit (adjust later if needed)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: {
            code: "BAD_REQUEST",
            message: "Image is too large (max 10MB)."
          }
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const imageUrl = await uploadImage(base64);

    return NextResponse.json({ image_url: imageUrl }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to upload image." } },
      { status: 500 }
    );
  }
}
