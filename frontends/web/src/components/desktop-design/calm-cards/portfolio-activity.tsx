// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTransactionList, TAccount } from '@/api/account';
import { transactionsChanged } from '@/api/accountsync';
import { useLoad } from '@/hooks/api';
import { unsubscribe } from '@/utils/subscriptions';
import { Message } from '@/components/message/message';
import { TransactionHistorySkeleton } from '@/routes/account/transaction-history-skeleton';
import { AmountWithUnit } from '@/components/amount/amount-with-unit';
import { CoinIcon } from './kit/coin-icon';
import styles from './preview.module.css';

type TProps = { accounts: TAccount[] };

export const PortfolioActivity = ({ accounts }: TProps) => {
  const { t, i18n } = useTranslation();
  const [revision, setRevision] = useState(0);
  const codes = accounts.map(account => account.code).join(',');
  const responses = useLoad(() => Promise.all(accounts.map(async account => ({
    account, response: await getTransactionList(account.code).catch(() => ({ success: false as const })),
  }))), [codes, revision]);
  useEffect(() => {
    const subscriptions = accounts.map(account => transactionsChanged(account.code, () => setRevision(value => value + 1)));
    return () => unsubscribe(subscriptions);
  }, [accounts]);
  const activity = responses?.flatMap(({ account, response }) => response.success ? response.list.map(tx => ({ account, tx })) : [])
    .sort((a, b) => (b.tx.time || '').localeCompare(a.tx.time || ''));
  const hasError = responses?.some(({ response }) => !response.success);
  return (<section>
    <h2 className={(styles.activityTitle ?? '')}>{t('desktopDesign.calmCards.recentActivity')}</h2>
    {hasError && <Message type="warning">{t('transactions.errorLoadTransactions')}</Message>}
    {activity === undefined ? <TransactionHistorySkeleton /> : (
      <div className={(styles.recent ?? '')}>
        {activity.length === 0 && !hasError && <p>{t('transactions.placeholder')}</p>}
        {activity.slice(0, 20).map(({ account, tx }) => (
          <Link className={(styles.liveRow ?? '')} to={`/account/${account.code}`} key={`${account.code}:${tx.internalID}`}>
            <CoinIcon coinCode={account.coinCode} size={36} />
            <span>{t(tx.type === 'receive' ? 'generic.received' : 'generic.sent')}<small>{account.name}</small></span>
            <span><AmountWithUnit amount={tx.type === 'send' ? tx.deductedAmountAtTime : tx.amountAtTime} convertToFiat />
              <small>{tx.status !== 'complete' || !tx.time ? t(`transaction.status.${tx.status}`, { context: tx.type }) : new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(new Date(tx.time))}</small></span>
          </Link>
        ))}
      </div>
    )}
  </section>);
};
