// SPDX-License-Identifier: Apache-2.0

import { CSSProperties, Fragment, ReactNode } from 'react';
import { useDesktopModernized } from '@/components/desktop-chrome/desktop-chrome';
import { orderedDesignItems, TDesignLayoutId } from '@/utils/desktop-design';
import { useDesktopDesign } from '@/hooks/desktop-design';
import styles from './desktop-design.module.css';

type TProps = { id: TDesignLayoutId; items: { id: string; content: ReactNode }[] };

export const DesignLayout = ({ id, items }: TProps) => {
  const enabled = useDesktopModernized();
  const { design } = useDesktopDesign();
  const layout = enabled ? design.layouts[id] : undefined;
  const ordered = orderedDesignItems(items, layout?.order);
  if (!enabled) {
    return <>{items.map(item => <Fragment key={item.id}>{item.content}</Fragment>)}</>;
  }
  return (
    <div className={styles.layout} data-design-scope data-design-element={`${id}Layout`} data-design-columns={layout?.columns ?? 'original'}>
      {ordered.map(item => {
        const position = layout?.positions?.[item.id];
        const style = { '--design-block-column': position === 'side' ? '2' : position === 'full' ? '1 / -1' : '1' } as CSSProperties;
        return <div key={item.id} className={styles.block} data-design-block data-design-element={item.id} style={style}>{item.content}</div>;
      })}
    </div>
  );
};
