import type { Category, CategoryType } from "@/types/category";

export async function getCategories(
  type?: CategoryType,
): Promise<Category[]> {
  try {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL!;

    const url = new URL("/api/categories", baseUrl);

    if (type) {
      url.searchParams.set("type", type);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[GET_CATEGORIES_ERROR]", res.status);
      return [];
    }

    const data = await res.json();

    if (!data.ok) {
      console.error("[GET_CATEGORIES_RESPONSE_ERROR]", data.error);
      return [];
    }

    return data.categories as Category[];
  } catch (error) {
    console.error("[GET_CATEGORIES_UNEXPECTED_ERROR]", error);
    return [];
  }
}
