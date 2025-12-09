// src/features/items/components/item-form.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";

import { useItemForm } from "../../items/hooks/use-item-form";
import {
  itemConditionValues,
  itemConditionLabels,
} from "../../items/validation";

import type { ItemFormData } from "../../items/types";
import type { CategoryTreeNode } from "@/types/category";
import { getCategoryTree } from "@/lib/categories/get-category-tree";

interface ItemFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<any>;
}

export function ItemForm({ mode, initialData, onSubmit }: ItemFormProps) {
  const {
    values,
    errors,
    submitting,
    submitError,
    success,
    updateField,
    addImage,
    removeImage,
    setPrimaryImage,
    applyAiMetadata,
    handleSubmit,
  } = useItemForm({ mode, initialData, onSubmit });

  const [uploading, setUploading] = useState(false);

  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // -----------------------------------
  // Fetch category tree (object type)
  // -----------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const tree = await getCategoryTree("object");
        if (isMounted) {
          setCategoryTree(tree);
        }
      } catch (error) {
        console.error("[ITEM_FORM_LOAD_CATEGORIES_ERROR]", error);
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const topLevelCategories = useMemo(
    () => categoryTree,
    [categoryTree],
  );

  const selectedCategoryNode = useMemo(() => {
    if (!values.category) return undefined;

    return topLevelCategories.find(
      (cat) =>
        cat.slug === values.category ||
        cat.id === values.category ||
        cat.name === values.category,
    );
  }, [topLevelCategories, values.category]);

  const subcategories = useMemo(
    () => selectedCategoryNode?.children ?? [],
    [selectedCategoryNode],
  );

  // -----------------------------------
  // Upload Cloudinary (client side)
  // -----------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      const newImage = {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        isPrimary: values.images.length === 0, // prima imagine devine principală
      };

      addImage(newImage);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Eroare la încărcarea imaginii.");
    } finally {
      setUploading(false);
    }
  };

  // -----------------------------------
  // AI autocomplete (integrare cu noul endpoint)
  // -----------------------------------
  const callAiClassification = async () => {
    if (values.images.length === 0) {
      alert("Încarcă o imagine înainte să rulezi AI.");
      return;
    }

    try {
      const mainImage =
        values.images.find((i) => i.isPrimary) ?? values.images[0];

      const res = await fetch("/api/ai/items/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: mainImage.url,
          locale: "ro",
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // Presupunem că endpointul normalizează răspunsul
        // într-un format compatibil cu applyAiMetadata.
        applyAiMetadata({
          model: data.model ?? "huggingface-auto",
          primaryLabel: data.primaryLabel ?? data.mainLabel ?? "",
          confidence: data.confidence ?? data.score ?? null,
          suggestedTitle: data.suggestedTitle ?? "",
          suggestedCategory: data.suggestedCategory ?? "",
          suggestedSubcategory: data.suggestedSubcategory ?? "",
          suggestedTags: data.suggestedTags ?? [],
          source: data.source ?? "hybrid",
        });
      } else {
        console.error("[AI_CLASSIFY_ERROR]", data.error);
        alert("AI nu a putut clasifica imaginea.");
      }
    } catch (err) {
      console.error("[AI_CLASSIFY_UNEXPECTED_ERROR]", err);
      alert("Eroare la clasificarea AI.");
    }
  };

  // -----------------------------------
  // UI
  // -----------------------------------
  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">
        {mode === "create" ? "Adaugă un obiect" : "Editează obiectul"}
      </h2>

      {/* Titlu */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">Titlu</label>
        <input
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Titlul obiectului"
        />
        {errors.title && (
          <span className="text-red-600 text-sm">{errors.title}</span>
        )}
      </div>

      {/* Descriere */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">Descriere</label>
        <textarea
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="border rounded px-3 py-2 h-32 resize-none"
          placeholder="Descriere detaliată"
        />
        {errors.description && (
          <span className="text-red-600 text-sm">{errors.description}</span>
        )}
      </div>

      {/* Categorii */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">Categoria</label>
        <select
          value={values.category ?? ""}
          onChange={(e) => {
            const newCategory = e.target.value || "";
            updateField("category", newCategory);
            // resetăm subcategoria când se schimbă categoria
            updateField("subcategory", "");
          }}
          className="border rounded px-3 py-2"
          disabled={categoriesLoading}
        >
          <option value="">
            {categoriesLoading ? "Se încarcă..." : "Alege categoria"}
          </option>
          {topLevelCategories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <span className="text-red-600 text-sm">{errors.category}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-medium">Subcategoria</label>
        <select
          value={values.subcategory ?? ""}
          onChange={(e) => updateField("subcategory", e.target.value)}
          className="border rounded px-3 py-2"
          disabled={!selectedCategoryNode || subcategories.length === 0}
        >
          <option value="">
            {!selectedCategoryNode
              ? "Alege mai întâi o categorie"
              : subcategories.length === 0
              ? "Nu există subcategorii"
              : "Alege subcategoria"}
          </option>
          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.slug}>
              {sub.name}
            </option>
          ))}
        </select>
        {errors.subcategory && (
          <span className="text-red-600 text-sm">{errors.subcategory}</span>
        )}
      </div>

      {/* Condiție */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">Starea obiectului</label>
        <select
          value={values.condition}
          onChange={(e) => updateField("condition", e.target.value)}
          className="border rounded px-3 py-2"
        >
          {itemConditionValues.map((key) => (
            <option key={key} value={key}>
              {itemConditionLabels[key]}
            </option>
          ))}
        </select>
      </div>

      {/* Imagini */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">Imagini</label>

        <input type="file" accept="image/*" onChange={handleImageUpload} />

        {uploading && <p>Se încarcă imaginea...</p>}

        <div className="grid grid-cols-3 gap-3 mt-2">
          {values.images.map((img) => (
            <div
              key={img.publicId}
              className="relative border rounded overflow-hidden"
            >
              <Image
                src={img.url}
                alt="img"
                width={200}
                height={200}
                className="object-cover h-28 w-full"
              />

              <button
                type="button"
                className="absolute top-1 right-1 bg-red-600 text-white px-2 py-1 text-xs rounded"
                onClick={() => removeImage(img.publicId!)}
              >
                Șterge
              </button>

              {!img.isPrimary && (
                <button
                  type="button"
                  className="absolute bottom-1 left-1 bg-black text-white px-2 py-1 text-xs rounded"
                  onClick={() => setPrimaryImage(img.publicId!)}
                >
                  Setează principală
                </button>
              )}
              {img.isPrimary && (
                <span className="absolute bottom-1 left-1 bg-green-700 text-white px-2 py-1 text-xs rounded">
                  Principală
                </span>
              )}
            </div>
          ))}
        </div>

        {errors.images && (
          <span className="text-red-600 text-sm">{errors.images}</span>
        )}
      </div>

      {/* AI autocomplete */}
      <button
        type="button"
        className="bg-purple-600 text-white px-4 py-2 rounded"
        onClick={callAiClassification}
      >
        Completează automat cu AI
      </button>

      {/* Submit */}
      <button
        type="button"
        className="w-full bg-blue-600 text-white py-3 rounded text-lg font-bold"
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting
          ? "Se salvează..."
          : mode === "create"
          ? "Creează obiect"
          : "Salvează modificările"}
      </button>

      {submitError && (
        <p className="text-red-600 text-center">{submitError}</p>
      )}

      {success && (
        <p className="text-green-600 text-center font-bold">
          Salvat cu succes!
        </p>
      )}
    </div>
  );
}
