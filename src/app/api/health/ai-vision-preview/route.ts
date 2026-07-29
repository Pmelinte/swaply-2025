import { NextResponse } from "next/server";
import { POST as analyzeImage } from "@/app/api/ai/image/route";

const RED_MUG_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAADEUlEQVR42u2dzZWCMBRGkWMBbl3bgb3YwdDGLGzD6YBe7MC1WztwFpxhEELIfx7kfiuPBk/47nsvIUTcvd/vCuVTjQUAAAACAAAQAACAAAAABAAAIAAAAAEAAAgAAEAAAAACAAAQADapffYeNE3Tvbjdbj5tyAAEAEoQhWt9GdC70/tVzgAgrgRNGcxRAUCUJBg5Pny9yfCvqmonZ3e0LtjbVvHm5TL69PZ6ra5wZR6Em8NB7emi+6Oj2vbj25TfQwYoHNfEtYn7w8Z9S+WbfSkbZElBAJZ9/9P1fLb65u/Tya5wCSMRHYDGeluvrRhcH4//Bve7WAwRASitD2W6nsHQ/XFLFYyMGGIBGLkfyXcvZp8kcjGIAmDovkDr5zBkYRD3Qky4+xJ6yGroppciNNMPmSMBgzCD8Erm/jFCPguDuGtBX8fjz/M5d/7JYGhMn/ZwUwC6M6yqSnmSSl88qZjX9K5j2ZVoNbQ/28Vwiz0qCvE9NYC580+Q/tIczwzAxB1nKsK9lghAoI+aKVyMadJat6Uktn7YICwGliJcOJnfXwLAgpzHm1AYatyPWrUAENH9IAz2uL842zEZnJ1H5hr3R9ZPrVS+GSoPmIaazvG7BgHnP4VmgDL8zQuIpqUbG64DrC+suBDLP/MJmAQ14Z/sKABIVEEApvXHJ5DnjrWtQmQAGQAABAAAIAAAAAEgpqabLXyWNueOtb22IAPIgKxySwJ2RQSrQmHlsLZBCbIO57A3xYoDoEwCc0+Db1zknvCHs8HvOJIBdiOBcr+bySY455XtQjNA/8sk22D3ua9Q7iAcakbkeXuy6FmQPwP/m8OlT0OdGZhsl2MMkHK1BQALZ/mJ0qYCnDFAugAAAAAgAAAAbRJA3kfxrKKHUQBIez6z5D7Xmw8x4X2rEwSUTAbDXm3w0cWdRusqQp7nMwqIvAUz59PTSy796cYAyQOyhL6l+wcNUakgJywE/YkPF2IIAABAAAAAAgAAEAAAgAAAAAQAACAAAAABAAAIAABAAAAAAgAAEAAAgAAAAASAdesXjGZZEHmSCHcAAAAASUVORK5CYII=";

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const smokeRequest = new Request(new URL("/api/ai/image", request.url), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `vision-preview-smoke-${Date.now()}`,
    },
    body: JSON.stringify({
      imageBase64: `data:image/png;base64,${RED_MUG_PNG_BASE64}`,
      locale: "en",
    }),
  });

  const response = await analyzeImage(smokeRequest);
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  return NextResponse.json(
    {
      status: data.status,
      provider: data.provider,
      model: data.model,
      locale: data.locale,
      categoryL1: data.categoryL1,
      categoryL2: data.categoryL2,
      confidence: data.confidence,
      manualCompletionRequired: data.manualCompletionRequired,
      titlePresent: typeof data.title === "string" && data.title.length > 0,
      captionPresent: typeof data.caption === "string" && data.caption.length > 0,
    },
    { status: response.status },
  );
}
