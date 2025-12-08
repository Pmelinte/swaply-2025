"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CategorySelect from "@/components/CategorySelect";

export default function AddItemPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAiLoading(false);

    try {
      // Upload în Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudinaryJson = await cloudinaryRes.json();
      const secureUrl = cloudinaryJson.secure_url as string | undefined;

      if (!secureUrl) {
        console.error("Cloudinary upload failed:", cloudinaryJson);
        setUploading(false);
        return;
      }

      setImageUrl(secureUrl);
      setUploading(false);

      // 🔥 AI CLASSIFICATION — după upload imagine
      setAiLoading(true);
      const aiRes = await fetch("/api/ai/classify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: secureUrl }),
      });

      const aiJson = await aiRes.json();
      setAiLoading(false);

      if (aiJson.ok) {
        const data = aiJson.data;

        if (data.title) setTitle(data.title);
        if (data.categoryId) setCategoryId(data.categoryId);
        if (data.subcategoryId) setSubcategoryId(data.subcategoryId);
        if (data.condition) setCondition(data.condition);
        if (data.description) setDescription(data.description);

        console.log("AI classification:", data);
      } else {
        console.warn("AI classification failed:", aiJson.error);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploading(false);
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!imageUrl) {
      alert("Te rog să încarci o imagine.");
      return;
    }

    const payload = {
      title,
      description,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      condition,
      image_url: imageUrl,
    };

    const res = await fetch("/api/items/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (json.ok) {
      router.push("/items");
    } else {
      alert("Eroare la salvare: " + json.error);
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Adaugă un obiect</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* IMAGE UPLOAD */}
        <div>
          <label className="block font-medium mb-1">Imagine</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          {uploading && (
            <p className="text-blue-600 mt-2">Se încarcă imaginea...</p>
          )}
          {aiLoading && (
            <p className="text-purple-600 mt-1">
              AI analizează imaginea și propune titlul...
            </p>
          )}

          {imageUrl && (
            <div className="mt-4">
              <Image
                src={imageUrl}
                alt="Preview"
                width={400}
                height={300}
                className="rounded-lg"
              />
            </div>
          )}
        </div>

        {/* TITLE */}
        <div>
          <label className="block font-medium mb-1">Titlu</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titlul obiectului (AI poate propune automat)"
          />
        </div>

        {/* CATEGORY + SUBCATEGORY (dropdown din taxonomie) */}
        <CategorySelect
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          onCategoryChange={setCategoryId}
          onSubcategoryChange={setSubcategoryId}
        />

        {/* CONDITION */}
        <div>
          <label className="block font-medium mb-1">Stare</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="new, like_new, used_good..."
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block font-medium mb-1">Descriere</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
        >
          Salvează
        </button>
      </form>
    </div>
  );
}
