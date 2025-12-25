import { Section } from '@/components/section';
import { ItemForm } from '@/features/items/item-form';

export default function NewObjectPage() {
  return (
    <Section subtitle="Adaugă un obiect nou. Owner = auth.uid() și is_demo=false conform RLS." title="Adaugă obiect">
      <ItemForm />
    </Section>
  );
}
