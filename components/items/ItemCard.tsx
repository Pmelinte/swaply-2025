'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Item } from '@/lib/types/item';
import { useTranslation } from '@/components/LanguageProvider';

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export default function ItemCard({ item, onDelete, isDeleting }: ItemCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
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
        <h3 className="text-lg font-semibold text-slate-900 truncate">{item.title}</h3>
        {item.description && (
          <p className="text-slate-600 text-sm mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/items/${item.id}/edit`}
            className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg text-center transition-colors shadow-sm"
          >
            {t('edit')}
          </Link>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-red-500 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {isDeleting ? t('deleting') : t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
