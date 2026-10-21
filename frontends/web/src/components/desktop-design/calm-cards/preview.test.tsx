// SPDX-License-Identifier: Apache-2.0

import '../../../../__mocks__/i18n';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DesktopDesignPreview } from '../desktop-design-preview';
import { DesktopDesignEditor } from '../desktop-design-editor';
import { desktopDesignSnapshot, parseDesktopDesign, saveDesktopDesign, undoDesktopDesign } from '@/utils/desktop-design';
import { CalmCardsPreview } from './preview';
import { calmCardsDesign } from './preset';

vi.mock('@/components/desktop-chrome/desktop-chrome', () => ({ useDesktopModernized: () => true }));
vi.mock('@/utils/desktop-chrome', () => ({ notifyChromeLayout: vi.fn() }));
vi.mock('@/hooks/mediaquery', () => ({ useMediaQuery: () => false }));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {} disconnect() {}
  });
  saveDesktopDesign({ layouts: {}, elements: {} });
});
afterEach(() => {
  cleanup(); vi.unstubAllGlobals(); localStorage.clear();
});

// The source-based reference applies a persistent, exportable starting layout and undo restores the current design.
it('applies the Calm cards starting design and restores it through undo', () => {
  render(<><DesktopDesignEditor /><DesktopDesignPreview /></>);
  fireEvent.click(screen.getByRole('button', { name: 'Use Calm cards design' }));
  expect(desktopDesignSnapshot().design).toEqual(parseDesktopDesign(calmCardsDesign));
  expect(document.body).toHaveAttribute('data-design-template', 'calmCards');
  expect(screen.getByLabelText('Reference design')).toHaveValue('calmCards');
  act(undoDesktopDesign);
  expect(document.body).not.toHaveAttribute('data-design-template');
  expect(desktopDesignSnapshot().design).toEqual({ layouts: {}, elements: {} });
});

// Reference wallet actions stay inactive; visual examples never fetch or save wallet data.
it('renders the source kit without a backend and supports keyboard range selection', () => {
  const fetch = vi.spyOn(window, 'fetch');
  const { rerender } = render(<CalmCardsPreview screen="portfolio" state="normal" />);
  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('radio', { name: '1Y' }), { key: 'ArrowLeft' });
  expect(screen.getByRole('radio', { name: '1M' })).toBeChecked();
  expect(screen.getByRole('radio', { name: '1M' })).toHaveFocus();
  rerender(<CalmCardsPreview screen="account" state="hidden" />);
  expect(screen.getAllByLabelText('Hidden amount').length).toBeGreaterThan(0);
  rerender(<CalmCardsPreview screen="account" state="error" />);
  expect(screen.getByRole('status')).toHaveTextContent('There was an error loading the transactions');
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockRestore();
});

// Global controls update the source kit and clearing them returns to the source defaults.
it('shares appearance controls with the imported reference components', () => {
  const { container, rerender } = render(<CalmCardsPreview screen="kit" state="normal" appearance={{ surface: '#123456', cardRadius: 12, bodyFontSize: 18 }} />);
  const root = container.querySelector<HTMLElement>('.proto-root')!;
  expect(root.style.getPropertyValue('--k-surface')).toBe('#123456');
  expect(root.style.getPropertyValue('--k-radius-l')).toBe('12px');
  expect(root.style.getPropertyValue('--k-fs-body')).toBe('18px');
  rerender(<CalmCardsPreview screen="kit" state="normal" />);
  expect(root.style.getPropertyValue('--k-surface')).toBe('');
});

// Template selection is a closed set; imports cannot choose a stylesheet or an unknown template.
it('rejects unknown template identifiers in a saved design', () => {
  expect(() => parseDesktopDesign({ ...calmCardsDesign, template: 'https://example.com/style.css' })).toThrow();
});
