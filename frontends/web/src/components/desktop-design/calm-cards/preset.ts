// SPDX-License-Identifier: Apache-2.0

import { TDesktopDesign } from '@/utils/desktop-design';

export const calmCardsDesign: TDesktopDesign = {
  template: 'calmCards',
  layouts: {
    portfolio: { order: ['portfolioChart', 'portfolioActions', 'portfolioAssets', 'portfolioActivity'], columns: 'wideLeft', positions: { portfolioChart: 'main', portfolioActions: 'main', portfolioAssets: 'main', portfolioActivity: 'side' } },
    account: { columns: 'wideRight', positions: { accountOverview: 'main', accountActivity: 'side' } },
  },
  elements: {
    accountOverviewLayout: { direction: 'column', gap: 24, alignItems: 'stretch' },
    balanceAmountLayout: { direction: 'column', gap: 10, alignItems: 'start' },
    accountActionsLayout: { direction: 'row', gap: 16, justifyContent: 'space-between' },
  },
};
