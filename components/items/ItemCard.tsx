'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Item } from '@/lib/types/item';

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function ItemCard({ item, onDelete, isDeleting }: ItemCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
      <div className="relative h-48 w-full">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-100 truncate">{item.title}</h3>
        {item.description && (
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/items/${item.id}/edit`}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
