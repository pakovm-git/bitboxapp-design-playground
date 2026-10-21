// SPDX-License-Identifier: Apache-2.0

import { designElements, designStyleFields, TDesktopDesign } from '@/utils/desktop-design';

export const designSelector = (id: string) =>
  `body[data-desktop-modernized] :is([data-design-scope], [data-design-scope] *)[data-design-element="${id}"]:not([data-design-editor], [data-design-editor] *)`;

type TProps = { design: TDesktopDesign; mode: 'light' | 'dark' };

export const DesktopDesignStyles = ({ design, mode }: TProps) => {
  const parts = ['transactionIcon', 'transactionInfo', 'transactionAmounts', 'transactionDetailsButton', 'balanceCrypto', 'balanceFiat'];
  const css = ['button', 'badge', ...designElements.filter(id => !['button', 'badge', ...parts].includes(id)), ...parts].flatMap(id => {
    const values = { ...design.elements[id], ...design.colors?.[mode]?.[id] };
    if (Object.keys(values).length === 0) {
      return [];
    }
    const selector = designSelector(id);
    return designStyleFields.flatMap(field => {
      const value = values[field.id];
      if (value === undefined) {
        return [];
      }
      if (field.id === 'iconSize') {
        return `${selector} :is(svg, img) { width: ${value}px !important; height: ${value}px !important; object-fit: contain; }`;
      }
      const text = ['fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing', 'color'].includes(field.id);
      const targets = text ? `${selector}, ${selector} :where(h1,h2,h3,p,span,button,a)` : selector;
      const display = (
        ['padding', 'background', 'minHeight', 'borderRadius', 'borderWidth', 'borderColor'].includes(field.id)
          ? `${selector}[data-design-block] { display: block; }` : ''
      );
      return `${targets} { ${field.property}: ${value}${field.type === 'number' ? field.unit : ''} !important; ${field.id === 'direction' ? 'display: flex !important;' : ''} ${field.id.startsWith('border') ? 'border-style: solid;' : ''} } ${display}`;
    });
  }).join('\n');
  return <style>{css}</style>;
};
