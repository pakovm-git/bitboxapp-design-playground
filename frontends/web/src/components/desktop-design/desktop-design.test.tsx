// SPDX-License-Identifier: Apache-2.0

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDesktopModernized } from '@/components/desktop-chrome/desktop-chrome';
import { desktopDesignSnapshot, openDesktopDesignEditor, saveDesktopDesign } from '@/utils/desktop-design';
import { DarkModeContext } from '@/contexts/DarkmodeContext';
import { DesignLayout } from './design-layout';
import { DesktopDesignEditor } from './desktop-design-editor';
import { DesktopDesignPreview } from './desktop-design-preview';

vi.mock('react-i18next', () => ({ useTranslation: () => ({
  t: (key: string, values?: { name?: string }) => values?.name ? `${key}: ${values.name}` : key,
  i18n: { language: 'en' },
}) }));
vi.mock('@/components/desktop-chrome/desktop-chrome', () => ({ useDesktopModernized: vi.fn(() => true) }));
vi.mock('@/hooks/mediaquery', () => ({ useMediaQuery: () => false }));
vi.mock('@/utils/desktop-chrome', () => ({ notifyChromeLayout: vi.fn() }));
vi.mock('@/i18n/i18n', () => ({ i18n: { language: 'en' } }));

beforeEach(() => {
  saveDesktopDesign({ layouts: {}, elements: {} });
  vi.mocked(useDesktopModernized).mockReturnValue(true);
});
afterEach(() => {
  cleanup(); localStorage.clear(); vi.clearAllMocks();
});

const showEditor = () => act(() => {
  openDesktopDesignEditor();
});

// Visual rearrangement also changes reading order, preserving the existing form nodes and their entered values.
it('moves sections in the DOM, preserves local state and supports undo', () => {
  render(<><DesktopDesignEditor /><div data-testid="canvas"><DesignLayout id="portfolio" items={[
    { id: 'portfolioChart', content: <input aria-label="Chart input" defaultValue="draft" /> },
    { id: 'portfolioAssets', content: <button>Assets</button> },
  ]} /></div></>);
  const input = screen.getByLabelText('Chart input');
  fireEvent.change(input, { target: { value: 'unsaved' } });
  showEditor();
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.moveUp: desktopDesign.editor.elements.portfolioAssets' }));
  const canvas = screen.getByTestId('canvas');
  expect(canvas.querySelector('[data-design-element] > [data-design-element]')).toHaveAttribute('data-design-element', 'portfolioAssets');
  expect(screen.getByLabelText('Chart input')).toBe(input);
  expect(input).toHaveValue('unsaved');
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.undo' }));
  expect(canvas.querySelector('[data-design-element] > [data-design-element]')).toHaveAttribute('data-design-element', 'portfolioChart');
  expect(input).toHaveValue('unsaved');
});

// Picking a live control selects its appearance without triggering the wallet action, including keyboard selection.
it('intercepts actions while picking and applies a validated style override', () => {
  const action = vi.fn();
  render(<><DesktopDesignEditor /><div data-design-scope data-design-element="balanceAmount"><button onClick={action}>Wallet action</button></div></>);
  showEditor();
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.pick' }));
  fireEvent.click(screen.getByRole('button', { name: 'Wallet action' }));
  expect(action).not.toHaveBeenCalled();
  expect(screen.getByLabelText('desktopDesign.editor.element')).toHaveValue('balanceAmount');
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.style' }));
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.fields.fontSize'), { target: { value: '32' } });
  expect(desktopDesignSnapshot().design.elements.balanceAmount).toEqual({ fontSize: 32 });
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.pick' }));
  const button = screen.getByRole('button', { name: 'Wallet action' });
  expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(false);
  expect(action).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(action).toHaveBeenCalledOnce();
});

// Escape cancels selection without also reaching an underlying transaction dialog's keyboard handler.
it('consumes selection cancellation before underlying app shortcuts', () => {
  const shortcut = vi.fn();
  render(<><DesktopDesignEditor /><div onKeyDown={shortcut}><button>App control</button></div></>);
  showEditor();
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.pick' }));
  fireEvent.keyDown(screen.getByRole('button', { name: 'App control' }), { key: 'Escape' });
  expect(shortcut).not.toHaveBeenCalled();
  expect(document.body).not.toHaveAttribute('data-design-picking');
});

// Element colors follow the selected theme, while geometry remains shared between light and dark appearances.
it('keeps element colors separate when switching themes', () => {
  const view = (dark: boolean) => <DarkModeContext.Provider value={{ isDarkMode: dark, toggleDarkmode: vi.fn() }}><DesktopDesignEditor /></DarkModeContext.Provider>;
  const { rerender } = render(view(false));
  showEditor();
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.style' }));
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.fields.color'), { target: { value: '#123456' } });
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.fields.fontSize'), { target: { value: '32' } });
  rerender(view(true));
  expect(screen.getByLabelText('desktopDesign.editor.fields.color')).toHaveValue('#000000');
  expect(screen.getByLabelText('desktopDesign.editor.fields.fontSize')).toHaveValue(32);
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.fields.color'), { target: { value: '#abcdef' } });
  expect(desktopDesignSnapshot().design.colors).toEqual({
    light: { portfolioChart: { color: '#123456' } }, dark: { portfolioChart: { color: '#abcdef' } },
  });
});

// Rapid edits before React renders again must merge against the latest saved design rather than discard earlier fields.
it('retains multiple style edits made in the same render frame', () => {
  render(<DesktopDesignEditor />);
  showEditor();
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.style' }));
  act(() => {
    fireEvent.change(screen.getByLabelText('desktopDesign.editor.fields.fontSize'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('desktopDesign.editor.fields.lineHeight'), { target: { value: '1.3' } });
  });
  expect(desktopDesignSnapshot().design.elements.portfolioChart).toEqual({ fontSize: 40, lineHeight: 1.3 });
});

// Number fields retain incomplete input until it becomes valid, allowing users to type values above a multi-digit minimum.
it('keeps partial numeric edits without applying invalid values', () => {
  render(<DesktopDesignEditor />);
  showEditor();
  fireEvent.click(screen.getByRole('button', { name: 'desktopDesign.editor.style' }));
  const input = screen.getByLabelText('desktopDesign.editor.fields.fontSize');
  fireEvent.change(input, { target: { value: '4' } });
  expect(input).toHaveValue(4);
  expect(desktopDesignSnapshot().design.elements.portfolioChart?.fontSize).toBeUndefined();
  fireEvent.change(input, { target: { value: '40' } });
  expect(desktopDesignSnapshot().design.elements.portfolioChart?.fontSize).toBe(40);
  fireEvent.change(input, { target: { value: '100' } });
  fireEvent.blur(input);
  expect(input).toHaveValue(40);
});

// Mobile and ordinary browser sessions retain the original markup and order even when desktop preferences are stored.
it('leaves non-desktop layout unchanged', () => {
  vi.mocked(useDesktopModernized).mockReturnValue(false);
  saveDesktopDesign({ layouts: { portfolio: { order: ['portfolioAssets', 'portfolioChart'] } }, elements: {} });
  render(<DesignLayout id="portfolio" items={[
    { id: 'portfolioChart', content: <button>Chart</button> }, { id: 'portfolioAssets', content: <button>Assets</button> },
  ]} />);
  expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual(['Chart', 'Assets']);
  expect(document.querySelector('[data-design-scope]')).not.toBeInTheDocument();
});

// Preview state switches use sample data, keep wallet actions disabled and never write appearance preferences.
it('previews reference screens and component states without wallet side effects', () => {
  localStorage.clear();
  render(<DesktopDesignPreview />);
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.previewScreen'), { target: { value: 'account' } });
  expect(screen.getByRole('button', { name: 'generic.send' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.previewState'), { target: { value: 'error' } });
  expect(screen.getByText('transactions.errorLoadTransactions')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.previewState'), { target: { value: 'pending' } });
  expect(screen.getByTestId('incomingBalance')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('desktopDesign.editor.previewScreen'), { target: { value: 'kit' } });
  const kit = within(screen.getByRole('region', { name: 'desktopDesign.preview.title' }));
  expect(kit.getByLabelText('desktopDesign.preview.input')).toBeInTheDocument();
  expect(localStorage.length).toBe(0);
});

// The live balance and transaction components apply saved field order while retaining their real detail action.
it('reorders balance values and transaction row parts in the reference components', () => {
  saveDesktopDesign({ layouts: {
    balanceAmount: { order: ['balanceFiat', 'balanceCrypto'] },
    transactionRow: { order: ['transactionAmounts', 'transactionInfo', 'transactionIcon', 'transactionDetailsButton'] },
  }, elements: {} });
  render(<DesktopDesignPreview />);
  const parts = (id: string) => [...document.querySelector(`[data-design-element="${id}Layout"]`)!.children]
    .map(element => element.getAttribute('data-design-element'));
  expect(parts('balanceAmount')).toEqual(['balanceFiat', 'balanceCrypto']);
  expect(parts('transactionRow')).toEqual(['transactionAmounts', 'transactionInfo', 'transactionIcon', 'transactionDetailsButton']);
  expect(screen.getByRole('button', { name: 'transaction.details.title' })).toBeInTheDocument();
});
