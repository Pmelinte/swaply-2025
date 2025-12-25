import Link from 'next/link';
import { ItemList } from '@/features/items/item-list';
import { Section } from '@/components/section';

export default function ObjectsPage() {
  return (
    <div className="space-y-4">
      <Section subtitle="Listă de obiecte cu filtre + empty states" title="Obiecte">
        <div className="mb-3 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-primary px-4 py-2 text-white" href="/objects/new">
            Adaugă un obiect
          </Link>
          <Link className="rounded-lg border px-4 py-2 text-sm font-semibold" href="/match">
            Vezi match-urile tale
          </Link>
        </div>
        {/* TODO: filtre din spec, în prezent placeholder */}
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        <p className="text-xs text-amber-700">Filtrele avansate (hartă, AI) sunt TODO (NEDEFINIT ÎN DOCS) și dezactivate.</p>
        <ItemList />
      </Section>
    </div>
  );
}
