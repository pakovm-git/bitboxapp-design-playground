// SPDX-License-Identifier: Apache-2.0

import { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TAmountWithConversions, TTransaction } from '@/api/account';
import { AppContext } from '@/contexts/AppContext';
import { RatesContext } from '@/contexts/RatesContext';
import { LocalizationContext } from '@/contexts/localization-context';
import { Balance } from '@/components/balance/balance';
import { Badge } from '@/components/badge/badge';
import { Button, Select } from '@/components/forms';
import { AmountWithUnit } from '@/components/amount/amount-with-unit';
import { Message } from '@/components/message/message';
import { AppLogo } from '@/components/icon/logo';
import { Transaction } from '@/components/transactions/transaction';
import { TxDetailHeader } from '@/components/transactions/components/tx-detail-dialog/tx-detail-header';
import { TxDetailRow } from '@/components/transactions/components/tx-detail-dialog/tx-detail-row';
import { DesktopAppearancePreview } from '@/routes/settings/components/appearance/desktop-appearance-preview';
import { DesignLayout } from './design-layout';
import { openDesktopDesignEditor } from '@/utils/desktop-design';
import styles from './desktop-design-preview.module.css';
import { CalmCardsPreview } from './calm-cards/preview';
import { calmCardsDesign } from './calm-cards/preset';
import { saveDesktopDesign } from '@/utils/desktop-design';
import { TAppearance } from '@/utils/desktop-appearance';

const amount: TAmountWithConversions = { amount: '0.34947407', unit: 'BTC', conversions: { USD: '36432.67' }, estimated: false };
const received: TAmountWithConversions = { amount: '0.01509297', unit: 'BTC', conversions: { USD: '1573.44' }, estimated: false };
const fee: TAmountWithConversions = { amount: '0.00001234', unit: 'BTC', estimated: false };
const sampleTransaction: TTransaction = {
  addresses: ['bc1qexample'], amount: received, amountAtTime: received, deductedAmountAtTime: received,
  fee, feeRateInfo: '', gas: 0, nonce: null, internalID: 'preview', note: '', numConfirmations: 6,
  numConfirmationsComplete: 6, size: 140, status: 'complete', time: '2026-09-25T12:07:00Z', type: 'receive',
  txID: 'preview', vsize: 140, weight: 560,
};
const screens = ['portfolio', 'account', 'sidebar', 'transaction', 'kit'] as const;
const states = ['normal', 'loading', 'empty', 'error', 'hidden', 'pending', 'failed'] as const;

type TProps = { appearance?: TAppearance };

export const DesktopDesignPreview = ({ appearance = {} }: TProps) => {
  const { t } = useTranslation();
  const app = useContext(AppContext);
  const rates = useContext(RatesContext);
  const localization = useContext(LocalizationContext);
  const [screen, setScreen] = useState<typeof screens[number]>('kit');
  const [state, setState] = useState<typeof states[number]>('normal');
  const [reference, setReference] = useState('current');
  const tx: TTransaction = { ...sampleTransaction, note: t('desktopDesign.editor.previewNote'),
    status: state === 'pending' ? 'pending' : state === 'failed' ? 'failed' : 'complete',
    numConfirmations: state === 'pending' ? 1 : 6 };
  const noActivity = state === 'empty' || state === 'error';
  const balance = <Balance balance={state === 'loading' ? undefined : { hasAvailable: true, available: amount, hasIncoming: state === 'pending', incoming: received }} />;
  const actions = (<DesignLayout id="accountActions" items={[
    { id: 'sendAction', content: <Button secondary disabled>{t('generic.send')}</Button> },
    { id: 'receiveAction', content: <Button secondary disabled>{t('generic.receiveWithoutCoinCode')}</Button> },
    { id: 'buyAction', content: <Button secondary disabled>{t('generic.buySell')}</Button> },
  ]} />);
  const activity = (
    noActivity ? (
      <Message type={state === 'error' ? 'warning' : 'info'}>
        {t(state === 'error' ? 'transactions.errorLoadTransactions' : 'transactions.placeholder')}
      </Message>
    ) : state === 'loading' ? <Balance /> : <Transaction {...tx} onShowDetail={() => setScreen('transaction')} />
  );
  const transactionRows = (<DesignLayout id="transaction" items={[
    { id: 'transactionSummary', content: <TxDetailHeader {...tx} transactionInfo={tx} amountSign="+" amountAtTimeSign="+" /> },
    { id: 'transactionNote', content: <TxDetailRow><span>{t('desktopDesign.editor.elements.transactionNote')}</span><span>{tx.note}</span></TxDetailRow> },
    { id: 'transactionAddress', content: <TxDetailRow><span>{t('send.confirm.to')}</span><span>bc1qexample</span></TxDetailRow> },
    { id: 'transactionFee', content: <TxDetailRow><span>{t('transaction.fee')}</span><AmountWithUnit amount={fee} /></TxDetailRow> },
    { id: 'transactionHistorical', content: <TxDetailRow><span>{t('transaction.details.historicalValue')}</span><AmountWithUnit amount={received} convertToFiat /></TxDetailRow> },
    { id: 'transactionCurrent', content: <TxDetailRow><span>{t('transaction.details.currentValue')}</span><AmountWithUnit amount={received} convertToFiat /></TxDetailRow> },
    { id: 'transactionId', content: <TxDetailRow><span>{t('transaction.explorer')}</span><span>preview</span></TxDetailRow> },
    { id: 'transactionExplorer', content: <Button secondary disabled>{t('desktopDesign.editor.elements.transactionExplorer')}</Button> },
  ]} />);
  const placeholder = state === 'loading' ? <Balance /> : noActivity ? activity : undefined;
  const showContent = placeholder === undefined || screen === 'kit' || screen === 'account';

  return (<section className={styles.preview} aria-label={t('desktopDesign.editor.previewTitle')}>
    <p>{t('desktopDesign.editor.previewDescription')}</p>
    <div className={styles.toolbar}>
      <Select id="design-preview-reference" label={t('desktopDesign.calmCards.reference')} value={reference}
        options={['current', 'calmCards'].map(value => ({ value, text: t(`desktopDesign.calmCards.${value}`) }))}
        onChange={event => setReference(event.target.value)} />
      <Select id="design-preview-screen" label={t('desktopDesign.editor.previewScreen')} value={screen}
        options={screens.map(value => ({ value, text: t(`desktopDesign.editor.screens.${value}`) }))}
        onChange={event => setScreen(event.target.value as typeof screen)} />
      <Select id="design-preview-state" label={t('desktopDesign.editor.previewState')} value={state}
        options={states.map(value => ({ value, text: t(`desktopDesign.editor.states.${value}`) }))}
        onChange={event => setState(event.target.value as typeof state)} />
      <Button primary onClick={openDesktopDesignEditor}>{t('desktopDesign.editor.open')}</Button>
      <Button secondary onClick={() => {
        saveDesktopDesign(calmCardsDesign);
        setReference('calmCards');
      }}>{t('desktopDesign.calmCards.apply')}</Button>
    </div>
    <AppContext.Provider value={{ ...app, hideAmounts: state === 'hidden', nativeLocale: app.nativeLocale || 'en-US' }}>
      <LocalizationContext.Provider value={{ decimal: localization.decimal ?? '.', group: localization.group ?? ',' }}>
        <RatesContext.Provider value={{ ...rates, defaultCurrency: 'USD', rotateBtcUnit: async () => {}, rotateDefaultCurrency: async () => {} }}>
          {reference === 'calmCards' ? <CalmCardsPreview screen={screen} state={state} appearance={appearance} /> : (
            <div className={styles.canvas} data-design-scope>
              {!showContent && placeholder}
              {showContent && screen === 'portfolio' && (
                <DesignLayout id="portfolio" items={[
                  { id: 'portfolioChart', content: <div className={styles.card}>
                    <h3>{t('accountSummary.title')}</h3>
                    {balance}
                    <svg className={styles.chart} viewBox="0 0 500 130" role="img" aria-label={t('desktopDesign.editor.previewChart')}>
                      <path d="M0 115 L30 108 L55 114 L85 88 L110 95 L145 68 L180 75 L210 52 L250 58 L285 35 L320 40 L365 16 L400 24 L445 6 L500 0" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div> },
                  { id: 'portfolioAssets', content: <div className={styles.card}>
                    <h3>{t('desktopDesign.editor.elements.portfolioAssets')}</h3>
                    <p>{t('desktopDesign.editor.previewAccount')}</p><AmountWithUnit amount={amount} />
                  </div> },
                ]} />
              )}
              {screen === 'account' && (
                <DesignLayout id="account" items={[
                  { id: 'accountOverview', content: <div className={styles.card}><DesignLayout id="accountOverview" items={[
                    { id: 'balance', content: balance }, { id: 'accountActions', content: <div className={styles.actions}>{actions}</div> },
                  ]} /></div> },
                  { id: 'accountActivity', content: <div className={styles.card}><h3>{t('accountSummary.transactionHistory')}</h3>{activity}</div> },
                ]} />
              )}
              {showContent && screen === 'sidebar' && (
                <div className={styles.sidebar} data-design-element="sidebarFrame">
                  <div data-design-element="sidebarLogo"><AppLogo /></div>
                  <DesignLayout id="sidebar" items={[
                    { id: 'sidebarNavigation', content: <p>{t('accountSummary.title')}</p> },
                    { id: 'sidebarAccounts', content: <div data-design-element="sidebarAccountRow"><span data-design-element="sidebarAccountLabel">{t('desktopDesign.editor.previewAccount')}</span><AmountWithUnit amount={amount} /></div> },
                    { id: 'sidebarServices', content: <p>{t('sidebar.settings')}</p> },
                  ]} />
                </div>
              )}
              {showContent && screen === 'transaction' && <div className={styles.card}>{transactionRows}</div>}
              {screen === 'kit' && (
                <div className={styles.card}>
                  <DesktopAppearancePreview />
                  <div className={styles.toolbar}>
                    <Badge type="success">{t('transaction.status.complete', { context: 'receive' })}</Badge>
                    <Badge type="warning">{t('transaction.status.pending', { context: 'receive' })}</Badge>
                    <Badge type="danger">{t('transaction.status.failed', { context: 'receive' })}</Badge>
                  </div>
                  {balance}{activity}
                </div>
              )}
            </div>
          )}
        </RatesContext.Provider>
      </LocalizationContext.Provider>
    </AppContext.Provider>
  </section>);
};
