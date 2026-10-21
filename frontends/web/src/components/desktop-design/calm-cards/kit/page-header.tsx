// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from './button';
import styles from './page-header.module.css';

type TProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  // Hash href of the parent screen; shows a back button.
  back?: string;
  actions?: ReactNode;
  // 'large' for top-level screens, 'compact' for pushed screens (centered small title on phones).
  size?: 'large' | 'compact';
};

export const PageHeader = ({ title, subtitle, back, actions, size = 'large' }: TProps) => {
  const { t } = useTranslation();
  return (
    <header className={`${(styles.header ?? '')} ${(styles[size] ?? '')}`}>
      <div className={(styles.start ?? '')}>
        {back && <IconButton icon="back" label={t('button.back')} href={back} className={(styles.back ?? '')} />}
      </div>
      <div className={(styles.titles ?? '')}>
        <h1 data-design-element="pageTitle" className={(styles.title ?? '')}>{title}</h1>
        {subtitle && <p className={(styles.subtitle ?? '')}>{subtitle}</p>}
      </div>
      <div className={(styles.actions ?? '')}>{actions}</div>
    </header>
  );
};
