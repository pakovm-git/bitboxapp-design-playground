// SPDX-License-Identifier: Apache-2.0

import { afterEach, expect, it, vi } from 'vitest';
import { parseDesktopDesign, orderedDesignItems } from './desktop-design';
import { designColumns, designElements, designLayouts, designPositions, designStyleFields } from './desktop-design';
import english from '@/locales/en/app.json';

afterEach(() => {
  vi.restoreAllMocks(); localStorage.clear();
});

// Imported layouts must reject unknown targets and CSS values before they reach the live app.
it('validates layout and element overrides as a complete document', () => {
  const design = { layouts: { portfolio: { order: ['portfolioAssets', 'portfolioChart'], columns: 'wideLeft', positions: { portfolioAssets: 'side' } } }, elements: { balance: { fontSize: 32 } }, colors: { light: { balance: { color: '#123456' } } } };
  expect(parseDesktopDesign(design)).toEqual(design);
  for (const invalid of [null, [], { ...design, elements: { unknown: {} } }, { ...design, elements: { balance: { color: 'url(bad)' } } }, { ...design, elements: { balance: { fontSize: 200 } } }, { ...design, layouts: { portfolio: { order: ['portfolioChart', 'portfolioChart'] } } }, { ...design, layouts: { account: { order: ['portfolioChart'] } } }]) {
    expect(() => parseDesktopDesign(invalid)).toThrow();
  }
  for (const colors of [{ light: [] }, { other: {} }, { light: { balance: { fontSize: 32 } } }, { dark: { unknown: { color: '#123456' } } }, { dark: { balance: { color: 'red' } } }]) {
    expect(() => parseDesktopDesign({ ...design, colors })).toThrow();
  }
});

// Every generated inspector choice has a readable English label rather than exposing an internal identifier.
it('provides labels for all editable parts and controls', () => {
  for (const id of [...designElements, ...Object.keys(designLayouts)]) {
    expect(english.desktopDesign.editor.elements).toHaveProperty(id);
  }
  for (const field of designStyleFields) {
    expect(english.desktopDesign.editor.fields).toHaveProperty(field.id);
  }
  for (const option of [...designColumns, ...designPositions, ...designStyleFields.flatMap(field => field.type === 'select' ? field.options : [])]) {
    expect(english.desktopDesign.editor.options).toHaveProperty(option);
  }
});

// Undo/redo restores complete design snapshots, and restarting retains only the saved design.
it('persists changes and restores them through undo and redo', async () => {
  vi.resetModules();
  const store = await import('./desktop-design');
  const next = { layouts: {}, elements: { balance: { fontSize: 32 } } };
  expect(store.saveDesktopDesign(next)).toBe(true);
  expect(store.desktopDesignSnapshot().canUndo).toBe(true);
  store.undoDesktopDesign();
  expect(store.desktopDesignSnapshot().design.elements).toEqual({});
  store.redoDesktopDesign();
  expect(store.desktopDesignSnapshot().design).toEqual(next);
  vi.resetModules();
  const restarted = await import('./desktop-design');
  expect(restarted.desktopDesignSnapshot().design).toEqual(next);
  expect(restarted.desktopDesignSnapshot().canUndo).toBe(false);
});

// Corrupted or denied storage must leave a usable live editor and report that changes were not saved.
it('recovers from bad storage and reports failed persistence', async () => {
  localStorage.setItem('bitbox.desktop-design', '{broken');
  vi.resetModules();
  const store = await import('./desktop-design');
  expect(store.desktopDesignSnapshot().design).toEqual({ layouts: {}, elements: {} });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full');
  });
  const next = { layouts: {}, elements: { balance: { fontSize: 32 } } };
  expect(store.saveDesktopDesign(next)).toBe(false);
  expect(store.desktopDesignSnapshot()).toMatchObject({ design: next, saveFailed: true });
});

// Reordering changes the rendered reading order, while newly available or conditional items remain present.
it('keeps all available blocks when applying a saved order', () => {
  const items = [{ id: 'portfolioChart' }, { id: 'portfolioAssets' }];
  expect(orderedDesignItems(items, ['portfolioAssets'])).toEqual([items[1], items[0]]);
  expect(orderedDesignItems(items, ['missing'])).toEqual(items);
});
