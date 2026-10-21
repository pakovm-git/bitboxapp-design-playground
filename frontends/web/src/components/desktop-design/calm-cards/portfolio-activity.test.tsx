// SPDX-License-Identifier: Apache-2.0

import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { getTransactionList, TAccount, TTransaction } from '@/api/account';
import { transactionsChanged } from '@/api/accountsync';
import { PortfolioActivity } from './portfolio-activity';

vi.mock('@/api/account', () => ({ getTransactionList: vi.fn() }));
vi.mock('@/api/accountsync', () => ({ transactionsChanged: vi.fn(() => vi.fn()) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }) }));

const account: TAccount = {
  code: 'sample', name: 'Savings', coinCode: 'btc', coinUnit: 'BTC', coinName: 'Bitcoin', active: true, isToken: false,
  blockExplorerTxPrefix: 'https://example.com/',
  keystore: { watchonly: true, rootFingerprint: 'sample', name: 'Sample', lastConnected: '', connected: false },
};
const amount = { amount: '0.01', unit: 'BTC' as const, conversions: { USD: '100.00' }, estimated: false };
const tx: TTransaction = {
  internalID: 'first', txID: 'first', type: 'receive', status: 'pending', time: null, note: '', addresses: [],
  amount, amountAtTime: amount, deductedAmountAtTime: amount, fee: amount, feeRateInfo: '',
  numConfirmations: 0, numConfirmationsComplete: 6, gas: 0, nonce: null, size: 0, vsize: 0, weight: 0,
};
beforeEach(() => {
  vi.mocked(getTransactionList).mockReset();
  vi.mocked(transactionsChanged).mockClear();
});

// The live feed reloads after wallet notifications, displays transaction status, and unsubscribes when closed.
it('refreshes recent activity after transaction changes', async () => {
  vi.mocked(getTransactionList).mockResolvedValueOnce({ success: true, list: [tx] })
    .mockResolvedValueOnce({ success: true, list: [{ ...tx, status: 'failed' }] });
  const { unmount } = render(<MemoryRouter><PortfolioActivity accounts={[account]} /></MemoryRouter>);
  expect(await screen.findByRole('link')).toHaveAttribute('href', '/account/sample');
  expect(screen.getByRole('link')).toHaveTextContent('transaction.status.pending');
  act(() => vi.mocked(transactionsChanged).mock.calls[0]![1]({ success: true, list: [] }));
  await waitFor(() => expect(screen.getByRole('link')).toHaveTextContent('transaction.status.failed'));
  expect(getTransactionList).toHaveBeenCalledTimes(2);
  const unsubscribe = vi.mocked(transactionsChanged).mock.results[0]!.value;
  unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});

// A failed account request is reported rather than presenting an incomplete feed as an empty wallet.
it('reports request failures without claiming the wallet has no activity', async () => {
  vi.mocked(getTransactionList).mockRejectedValue(new Error('offline'));
  render(<MemoryRouter><PortfolioActivity accounts={[account]} /></MemoryRouter>);
  expect(await screen.findByText('transactions.errorLoadTransactions')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(screen.queryByText('transactions.placeholder')).not.toBeInTheDocument();
});
