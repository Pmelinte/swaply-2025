import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const drawerSource = readFileSync(
  resolve(process.cwd(), 'src/components/drawer/variants/DrawerContextualPage.tsx'),
  'utf8',
);

const routeSource = readFileSync(
  resolve(process.cwd(), 'src/lib/drawer/routeToDrawerVariant.ts'),
  'utf8',
);

const pages = [
  'profile',
  'objects',
  'my_items',
  'item_detail',
  'item_editor',
  'properties',
  'services',
  'events',
  'matching',
  'messages',
  'chat',
  'exchange',
  'blog',
  'stories',
] as const;

describe('page-specific contextual drawers', () => {
  it('defines a dedicated visual identity for every contextual page', () => {
    for (const page of pages) {
      expect(drawerSource).toContain(`${page}: theme(`);
    }
  });

  it('exposes page identity and page-scoped actions for visual and E2E audits', () => {
    expect(drawerSource).toContain('data-drawer-page={page}');
    expect(drawerSource).toContain('data-drawer-section={`${page}-${section.id}`}');
    expect(drawerSource).toContain('data-drawer-action={`${page}-${item.id}`}');
  });

  it('routes all major product surfaces to their own contextual page', () => {
    for (const page of ['profile', 'objects', 'properties', 'services', 'events', 'matching', 'messages', 'chat', 'exchange', 'blog', 'stories']) {
      expect(routeSource).toContain(`page: "${page}"`);
    }
  });
});
