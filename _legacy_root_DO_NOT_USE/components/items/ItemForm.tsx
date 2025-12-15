'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ItemFormData } from '@/lib/types/item';

interface ItemFormProps {
  initialData?: ItemFormData;
  itemId?: string;
  mode: 'create' | 'edit';
}

export default function ItemForm({ initialData, itemId, mode }: ItemFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to upload image');
      }

      setImageUrl(data.image_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!title || title.length < 2) {
      setError('Title must be at least 2 characters.');
      setLoading(false);
      return;
    }

    if (!imageUrl) {
      setError('Please upload an image.');
      setLoading(false);
      return;
    }

    try {
      const url = mode === 'create' ? '/api/items' : `/api/items/${itemId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, image_url: imageUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save item');
      }

      router.push('/items');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-200 mb-2">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={2}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter item title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter item description (optional)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Image *
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-slate-500 transition-colors"
        >
          {imagePreview ? (
            <div className="relative h-48 w-full">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="text-slate-400">
              <p className="text-lg mb-1">Click to upload image</p>
              <p className="text-sm">JPEG, PNG, WebP, GIF (max 10MB)</p>
            </div>
          )}
          {uploading && (
            <p className="text-blue-400 mt-2">Uploading...</p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Update Item'}
        </button>
      </div>
    </form>
  );
}
