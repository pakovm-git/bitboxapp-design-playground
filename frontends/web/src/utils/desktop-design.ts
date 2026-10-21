// SPDX-License-Identifier: Apache-2.0

export const designLayouts = {
  sidebar: { kind: 'column', items: ['sidebarNavigation', 'sidebarAccounts', 'sidebarServices'] },
  portfolio: { kind: 'columns', items: ['portfolioChart', 'portfolioAssets', 'portfolioActions', 'portfolioActivity'] },
  account: { kind: 'columns', items: ['accountOverview', 'accountActivity'] },
  accountOverview: { kind: 'row', items: ['balance', 'accountActions'] },
  accountActions: { kind: 'row', items: ['sendAction', 'receiveAction', 'buyAction', 'swapAction', 'infoAction', 'walletConnectAction'] },
  transaction: { kind: 'column', items: ['transactionSummary', 'transactionNote', 'transactionAddress', 'transactionFee', 'transactionHistorical', 'transactionCurrent', 'transactionId', 'transactionAdvanced', 'transactionExplorer'] },
  transactionRow: { kind: 'row', items: ['transactionIcon', 'transactionInfo', 'transactionAmounts', 'transactionDetailsButton'] },
  balanceAmount: { kind: 'row', items: ['balanceCrypto', 'balanceFiat'] },
} as const;

export type TDesignLayoutId = keyof typeof designLayouts;
export const designElements: string[] = [...new Set([
  ...Object.keys(designLayouts).map(id => `${id}Layout`), ...Object.values(designLayouts).flatMap(layout => [...layout.items]),
  'sidebarFrame', 'sidebarLogo', 'sidebarAccountRow', 'sidebarAccountLabel', 'pageHeader', 'pageTitle', 'headerActions', 'transactionRow', 'transactionIcon',
  'transactionInfo', 'transactionAmounts', 'transactionAmount', 'transactionStatus', 'balanceAmount', 'balanceIncoming', 'button', 'badge', 'input', 'select',
])];

type TStyleField = { id: string; property: string } & (
  { type: 'number'; min: number; max: number; step?: number; unit: string } |
  { type: 'color' } | { type: 'select'; options: string[] }
);
export const designStyleFields: TStyleField[] = [
  { id: 'fontSize', property: 'font-size', type: 'number', min: 10, max: 72, unit: 'px' },
  { id: 'fontWeight', property: 'font-weight', type: 'select', options: ['400', '500', '600', '700'] },
  { id: 'fontFamily', property: 'font-family', type: 'select', options: ['system-ui', 'sans-serif', 'monospace'] },
  { id: 'lineHeight', property: 'line-height', type: 'number', min: 1, max: 2, step: 0.1, unit: '' },
  { id: 'letterSpacing', property: 'letter-spacing', type: 'number', min: -1, max: 4, step: 0.1, unit: 'px' },
  { id: 'color', property: 'color', type: 'color' },
  { id: 'background', property: 'background-color', type: 'color' },
  { id: 'padding', property: 'padding', type: 'number', min: 0, max: 64, unit: 'px' },
  { id: 'gap', property: 'gap', type: 'number', min: 0, max: 64, unit: 'px' },
  { id: 'minHeight', property: 'min-height', type: 'number', min: 0, max: 160, unit: 'px' },
  { id: 'borderRadius', property: 'border-radius', type: 'number', min: 0, max: 48, unit: 'px' },
  { id: 'borderWidth', property: 'border-width', type: 'number', min: 0, max: 4, unit: 'px' },
  { id: 'borderColor', property: 'border-color', type: 'color' },
  { id: 'iconSize', property: 'width', type: 'number', min: 12, max: 64, unit: 'px' },
  { id: 'textAlign', property: 'text-align', type: 'select', options: ['start', 'center', 'end'] },
  { id: 'direction', property: 'flex-direction', type: 'select', options: ['row', 'column'] },
  { id: 'alignItems', property: 'align-items', type: 'select', options: ['start', 'center', 'end', 'stretch'] },
  { id: 'justifyContent', property: 'justify-content', type: 'select', options: ['start', 'center', 'end', 'space-between'] },
];

export const designColumns = ['original', 'single', 'wideLeft', 'wideRight', 'equal'] as const;
export const designPositions = ['main', 'side', 'full'] as const;
export type TDesignStyle = Record<string, string | number>;
export type TDesignLayout = {
  order?: string[];
  columns?: typeof designColumns[number];
  positions?: Record<string, typeof designPositions[number]>;
};
export type TDesktopDesign = {
  template?: 'calmCards';
  layouts: Partial<Record<TDesignLayoutId, TDesignLayout>>;
  elements: Record<string, TDesignStyle>;
  colors?: Partial<Record<'light' | 'dark', Record<string, TDesignStyle>>>;
};
const emptyDesign: TDesktopDesign = { layouts: {}, elements: {} };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const onlyKeys = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).every(key => keys.includes(key));

export const parseDesktopDesign = (value: unknown): TDesktopDesign => {
  if (!isRecord(value) || !onlyKeys(value, ['template', 'layouts', 'elements', 'colors']) ||
      (value.template !== undefined && value.template !== 'calmCards') || !isRecord(value.layouts) || !isRecord(value.elements)) {
    throw new Error('Invalid design');
  }
  for (const [id, layout] of Object.entries(value.layouts)) {
    const definition = designLayouts[id as TDesignLayoutId];
    if (!Object.hasOwn(designLayouts, id) || !isRecord(layout) || !onlyKeys(layout, ['order', 'columns', 'positions'])) {
      throw new Error('Invalid layout');
    }
    const items: readonly string[] = definition.items;
    if (layout.order !== undefined && (!Array.isArray(layout.order) || new Set(layout.order).size !== layout.order.length ||
      !layout.order.every(item => typeof item === 'string' && items.includes(item)))) {
      throw new Error('Invalid block order');
    }
    if (layout.columns !== undefined && (definition.kind !== 'columns' || !designColumns.includes(layout.columns as typeof designColumns[number]))) {
      throw new Error('Invalid columns');
    }
    if (layout.positions !== undefined && (definition.kind !== 'columns' || !isRecord(layout.positions) ||
      !Object.entries(layout.positions).every(([item, position]) => items.includes(item) && designPositions.includes(position as typeof designPositions[number])))) {
      throw new Error('Invalid block position');
    }
  }
  const sources: [Record<string, unknown>, boolean][] = [[value.elements, false]];
  if (value.colors !== undefined) {
    if (!isRecord(value.colors) || !onlyKeys(value.colors, ['light', 'dark'])) {
      throw new Error('Invalid color profiles');
    }
    for (const colors of Object.values(value.colors)) {
      if (!isRecord(colors)) {
        throw new Error('Invalid color profile');
      }
      sources.push([colors, true]);
    }
  }
  for (const [elements, colors] of sources) {
    for (const [id, style] of Object.entries(elements)) {
      if (!designElements.includes(id) || !isRecord(style)) {
        throw new Error('Invalid element');
      }
      for (const [key, item] of Object.entries(style)) {
        const field = designStyleFields.find(candidate => candidate.id === key);
        const valid = (
          field && (field.type === 'color') === colors && (field.type === 'color' ? typeof item === 'string' && /^#[0-9a-f]{6}$/i.test(item)
            : field.type === 'select' ? typeof item === 'string' && field.options.includes(item)
              : typeof item === 'number' && Number.isFinite(item) && item >= field.min && item <= field.max &&
            Math.abs(item / (field.step ?? 1) - Math.round(item / (field.step ?? 1))) < 0.00001)
        );
        if (!valid) {
          throw new Error('Invalid element style');
        }
      }
    }
  }
  return value as TDesktopDesign;
};

export const orderedDesignItems = <T extends { id: string }>(items: readonly T[], order: readonly string[] = []): T[] =>
  [...items].sort((a, b) => {
    const rank = (id: string) => order.includes(id) ? order.indexOf(id) : order.length + items.findIndex(item => item.id === id);
    return rank(a.id) - rank(b.id);
  });

const storageKey = 'bitbox.desktop-design';
let current: { design: TDesktopDesign; saveFailed: boolean; canUndo: boolean; canRedo: boolean } | undefined;
const past: TDesktopDesign[] = [];
const future: TDesktopDesign[] = [];
const listeners = new Set<() => void>();

export const desktopDesignSnapshot = () => {
  if (!current) {
    let design = emptyDesign;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        design = parseDesktopDesign(JSON.parse(stored));
      }
    } catch {
      // Invalid or unavailable storage falls back to the unmodified app layout.
    }
    current = { design, saveFailed: false, canUndo: false, canRedo: false };
  }
  return current;
};

export const subscribeDesktopDesign = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const openDesktopDesignEditor = () => window.dispatchEvent(new Event('bitbox-design-editor-open'));

const persist = (design: TDesktopDesign) => {
  let saveFailed = false;
  try {
    localStorage.setItem(storageKey, JSON.stringify(design));
  } catch {
    saveFailed = true;
  }
  current = { design, saveFailed, canUndo: past.length > 0, canRedo: future.length > 0 };
  listeners.forEach(listener => listener());
  return !saveFailed;
};

export const saveDesktopDesign = (input: TDesktopDesign) => {
  const design = parseDesktopDesign(input);
  past.push(desktopDesignSnapshot().design);
  if (past.length > 30) {
    past.shift();
  }
  future.length = 0;
  return persist(design);
};

export const undoDesktopDesign = () => {
  const previous = past.pop();
  if (previous) {
    future.push(desktopDesignSnapshot().design);
    persist(previous);
  }
};

export const redoDesktopDesign = () => {
  const next = future.pop();
  if (next) {
    past.push(desktopDesignSnapshot().design);
    persist(next);
  }
};
