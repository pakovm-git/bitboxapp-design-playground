// SPDX-License-Identifier: Apache-2.0

import './kit/tokens.css';
import { CSSProperties, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TAmountWithConversions } from '@/api/account';
import { useDarkmode } from '@/hooks/darkmode';
import { appearanceFields, TAppearance } from '@/utils/desktop-appearance';
import { DesignLayout } from '../design-layout';
import { Amount } from './kit/amount';
import { AreaChart, TChartPoint } from './kit/area-chart';
import { Badge } from './kit/badge';
import { Button, IconButton } from './kit/button';
import { Chip } from './kit/chip';
import { CoinIcon } from './kit/coin-icon';
import { SearchField, SegmentedControl } from './kit/controls';
import { Delta } from './kit/delta';
import { DeviceStatus } from './kit/device';
import { Icon, TIconName } from './kit/icon';
import { List, ListRow } from './kit/list-row';
import { Logo } from './kit/logo';
import { PageHeader } from './kit/page-header';
import { Section } from './kit/section';
import { SkeletonRows } from './kit/skeleton';
import { PrototypeContext } from './kit/context';
import styles from './preview.module.css';

type TProps = {
  appearance?: TAppearance;
  screen: 'portfolio' | 'account' | 'sidebar' | 'transaction' | 'kit';
  state: 'normal' | 'loading' | 'empty' | 'error' | 'hidden' | 'pending' | 'failed';
};

// Fixed display values keep this reference independent of wallet APIs and amount calculations.
const balance: TAmountWithConversions = { amount: '0.34947407', unit: 'BTC', estimated: false, conversions: { USD: '36\'432.67' } };
const received: TAmountWithConversions = { amount: '0.01509297', unit: 'BTC', estimated: false, conversions: { USD: '1\'573.44' } };
const total: TAmountWithConversions = { amount: '0', unit: 'BTC', estimated: false, conversions: { USD: '44\'396.22' } };
const fee: TAmountWithConversions = { amount: '0.00001234', unit: 'BTC', estimated: false, conversions: { USD: '1.29' } };
const assets = [
  { code: 'btc' as const, name: 'Bitcoin', value: balance },
  { code: 'eth' as const, name: 'Ethereum', value: { amount: '1.98561', unit: 'ETH' as const, estimated: false, conversions: { USD: '7\'668.43' } } },
  { code: 'ltc' as const, name: 'Litecoin', value: { amount: '3.22888403', unit: 'LTC' as const, estimated: false, conversions: { USD: '295.12' } } },
];
const chart: TChartPoint[] = [
  { time: 1, value: 180, label: '18\'000.00' }, { time: 2, value: 205, label: '20\'500.00' },
  { time: 3, value: 195, label: '19\'500.00' }, { time: 4, value: 280, label: '28\'000.00' },
  { time: 5, value: 245, label: '24\'500.00' }, { time: 6, value: 320, label: '32\'000.00' },
  { time: 7, value: 300, label: '30\'000.00' }, { time: 8, value: 390, label: '39\'000.00' },
  { time: 9, value: 370, label: '37\'000.00' }, { time: 10, value: 444, label: '44\'396.22' },
];

export const CalmCardsPreview = ({ screen, state, appearance = {} }: TProps) => {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useDarkmode();
  const tokenFields = {
    '--k-bg': 'background', '--k-surface': 'surface', '--k-text': 'text', '--k-text-2': 'mutedText',
    '--k-accent': 'accent', '--k-chart-line': 'accent', '--k-accent-hover': 'accentHover', '--k-on-accent': 'buttonText',
    '--k-radius-l': 'cardRadius', '--k-radius-xl': 'cardRadius', '--k-radius-pill': 'buttonRadius',
    '--k-control-h': 'buttonHeight', '--k-row-min-h': 'rowHeight', '--k-row-pad-x': 'rowPadding',
    '--k-fs-body': 'bodyFontSize', '--k-fs-display': 'titleFontSize', '--calm-layout-gap': 'contentSpacing',
  };
  const tokens = Object.fromEntries(Object.entries(tokenFields).flatMap(([token, id]) => {
    const field = appearanceFields.find(field => field.id === id);
    const value = appearance[id];
    return value === undefined ? [] : [[token, `${value}${field?.type === 'number' ? field.unit : ''}`]];
  })) as CSSProperties;
  const [hidden, setHidden] = useState(false);
  const [range, setRange] = useState('year');
  const [query, setQuery] = useState('');
  const [coin, setCoin] = useState('btc');
  const [detail, setDetail] = useState(false);
  const [scrub, setScrub] = useState<TChartPoint | null>(null);
  const loading = state === 'loading';
  const empty = state === 'empty';
  const error = state === 'error';
  const name = t('desktopDesign.editor.previewAccount');
  const text = (key: string) => t(`desktopDesign.calmCards.${key}`);
  const status = state === 'pending' || state === 'failed' ? state : 'complete';
  const statusLabel = t(`transaction.status.${status}`, { context: 'receive' });
  const actions: { id: string; icon: TIconName; label: string }[] = [
    { id: 'sendAction', icon: 'send', label: t('generic.send') },
    { id: 'receiveAction', icon: 'receive', label: t('generic.receiveWithoutCoinCode') },
    ...(screen === 'account' ? [] : [{ id: 'buyAction', icon: 'buy' as const, label: t('generic.buySell') }]),
    { id: 'swapAction', icon: 'swap', label: text('swap') },
    ...(screen === 'account' ? [{ id: 'infoAction', icon: 'info' as const, label: t('accountInfo.label') }] : []),
  ];
  const actionRow = (<div className={(styles.actions ?? '')}><DesignLayout id="accountActions" items={actions.map(action => ({
    id: action.id, content: <IconButton icon={action.icon} label={action.label} variant="filled" size="lg" caption disabled />,
  }))} /></div>);
  const balanceCard = (<Section className={(styles.accountCard ?? '')}>
    <ListRow leading={<CoinIcon coinCode="btc" size={48} />} title={name} subtitle="Bitcoin" />
    <div className={(styles.balance ?? '')} data-design-element="balanceAmount"><DesignLayout id="balanceAmount" items={[
      { id: 'balanceCrypto', content: <Amount value={loading ? undefined : balance} as="coin" size="hero" animated /> },
      { id: 'balanceFiat', content: <Amount value={loading ? undefined : balance} size="lg" tone="muted" animated /> },
    ]} /></div>
    {state === 'pending' && <span data-design-element="balanceIncoming"><Badge tone="warning" icon="clock">{statusLabel}</Badge></span>}
  </Section>);
  const activity = (<Section title={text('activity')} className={(styles.listCard ?? '')}
    action={<SearchField value={query} onChange={setQuery} placeholder={t('accountSummary.searchPlaceholder')} />}>
    {loading ? <SkeletonRows count={6} /> : error ? <p role="status">{t('transactions.errorLoadTransactions')}</p> : empty ? <p>{t('transactions.placeholder')}</p> : (
      <List>
        {[0, 1, 2, 3].filter(index => !query || `${name} ${t('generic.received')} ${index}`.toLowerCase().includes(query.toLowerCase())).map(index => (
          <div className={(styles.txRow ?? '')} key={index} data-design-element="transactionRow">
            <DesignLayout id="transactionRow" items={[
              { id: 'transactionIcon', content: <CoinIcon coinCode="btc" size={36} badge={state === 'pending' ? 'pending' : state === 'failed' ? 'failed' : 'receive'} /> },
              { id: 'transactionInfo', content: <span className={(styles.txInfo ?? '')}>{t('generic.received')}<small>{status === 'complete' ? name : statusLabel}</small></span> },
              { id: 'transactionAmounts', content: <span className={(styles.txAmounts ?? '')}>
                {screen !== 'portfolio' && <Amount value={received} as="coin" sign="+" />}
                <Amount value={received} tone={screen === 'portfolio' ? 'default' : 'muted'} size={screen === 'portfolio' ? 'md' : 'sm'} />
              </span> },
              { id: 'transactionDetailsButton', content: <IconButton icon="chevron" label={t('transaction.details.title')} onClick={() => setDetail(!detail)} /> },
            ]} />
          </div>
        ))}
      </List>
    )}
  </Section>);
  const details = (<div className={(styles.details ?? '')}><DesignLayout id="transaction" items={[
    { id: 'transactionSummary', content: <div className={(styles.detailHero ?? '')}>
      <CoinIcon coinCode="btc" size={48} badge="receive" /><h2>{t('generic.received')}</h2>
      <span data-design-element="transactionAmount"><Amount value={received} as="coin" size="xl" sign="+" /></span>
      <Amount value={received} tone="muted" />
      <span data-design-element="transactionStatus"><Badge tone={status === 'failed' ? 'danger' : status === 'pending' ? 'warning' : 'success'}>{statusLabel}</Badge></span>
    </div> },
    { id: 'transactionAddress', content: <ListRow title={t('send.confirm.to')} subtitle="bc1qexample" /> },
    { id: 'transactionFee', content: <ListRow title={t('transaction.fee')} trailing={<Amount value={fee} as="coin" size="sm" />} /> },
    { id: 'transactionHistorical', content: <ListRow title={t('transaction.details.historicalValue')} trailing={<Amount value={received} />} /> },
    { id: 'transactionCurrent', content: <ListRow title={t('transaction.details.currentValue')} trailing={<Amount value={received} />} /> },
    { id: 'transactionId', content: <ListRow title={text('transactionId')} subtitle="9c4e…83b1" /> },
    { id: 'transactionNote', content: <ListRow title={text('note')} subtitle={t('desktopDesign.editor.previewNote')} /> },
    { id: 'transactionExplorer', content: <Button icon="external" full disabled>{text('explorer')}</Button> },
  ]} /></div>);
  const sidebar = (<aside className={(styles.sidebar ?? '')} data-design-element="sidebarFrame">
    <div data-design-element="sidebarLogo"><Logo height={19} /><DeviceStatus name={text('sampleDevice')} state="connected" onDark /></div>
    <DesignLayout id="sidebar" items={[
      { id: 'sidebarNavigation', content: <div className={(styles.sidebarNav ?? '')}><span><Icon name="portfolio" />{t('accountSummary.title')}</span><span><Icon name="marketplace" />{t('generic.buySell')}</span></div> },
      { id: 'sidebarAccounts', content: <div>
        <SearchField variant="field" value={query} onChange={setQuery} placeholder={text('searchAccounts')} />
        {assets.filter(asset => !query || asset.name.toLowerCase().includes(query.toLowerCase()) || name.toLowerCase().includes(query.toLowerCase())).map(asset => (
          <div key={asset.code} data-design-element="sidebarAccountRow"><ListRow leading={<CoinIcon coinCode={asset.code} size={28} />} title={<span data-design-element="sidebarAccountLabel">{asset.code === 'btc' ? name : asset.name}</span>} subtitle={<Amount value={asset.value} size="sm" tone="muted" />} /></div>
        ))}
      </div> },
      { id: 'sidebarServices', content: <span className={(styles.sidebarService ?? '')}><Icon name="settings" />{t('sidebar.settings')}</span> },
    ]} />
  </aside>);

  return (<PrototypeContext.Provider value={{ direction: 'E', theme: isDarkMode ? 'dark' : 'light', locale: i18n.language || 'en-US', fiat: 'USD', hideAmounts: state === 'hidden' || hidden, toggleHideAmounts: () => setHidden(!hidden) }}>
    <div className={`proto-root ${(styles.reference ?? '')}`} style={tokens} data-direction="E" data-theme={isDarkMode ? 'dark' : 'light'} data-design-scope>
      <div data-design-element="pageHeader"><PageHeader title={screen === 'account' ? name : text(screen === 'kit' ? 'kit' : screen === 'transaction' ? 'transaction' : 'portfolio')}
        actions={<span data-design-element="headerActions"><IconButton icon={hidden ? 'eyeOff' : 'eye'} label={text('hideAmounts')} onClick={() => setHidden(!hidden)} /></span>} /></div>
      {screen === 'portfolio' && (
        <DesignLayout id="portfolio" items={[
          { id: 'portfolioChart', content: <Section title={text('portfolioValue')} action={<SegmentedControl label={text('range')} value={range} onChange={value => {
            setRange(value); setScrub(null);
          }} options={['week', 'month', 'year', 'all'].map(value => ({ value, label: text(value) }))} />}>
            <Amount value={loading ? undefined : scrub?.label ? { ...total, conversions: { USD: scrub.label } } : total} size="hero" animated instant={!!scrub} />
            <div className={(styles.meta ?? '')}><Delta value={0.1254} /><span>{text('pastYear')}</span></div>
            <AreaChart points={loading || empty || error ? [] : range === 'all' ? chart : range === 'year' ? chart.slice(2) : range === 'month' ? chart.slice(5) : chart.slice(7)} height={160} onScrub={setScrub} />
          </Section> },
          { id: 'portfolioActions', content: actionRow },
          { id: 'portfolioAssets', content: <Section title={text('assets')} variant="plain"><div className={(styles.assetCards ?? '')}>
            {assets.map(asset => <Section key={asset.code}><ListRow leading={<CoinIcon coinCode={asset.code} size={40} />} title={asset.name} subtitle={<Amount value={asset.value} as="coin" size="sm" tone="muted" />} trailing={<Amount value={asset.value} />} /></Section>)}
          </div></Section> },
          { id: 'portfolioActivity', content: activity },
        ]} />
      )}
      {screen === 'account' && (
        <DesignLayout id="account" items={[
          { id: 'accountOverview', content: <DesignLayout id="accountOverview" items={[{ id: 'balance', content: balanceCard }, { id: 'accountActions', content: actionRow }]} /> },
          { id: 'accountActivity', content: activity },
        ]} />
      )}
      {screen === 'sidebar' && sidebar}
      {screen === 'transaction' && <Section>{loading ? <SkeletonRows count={6} /> : details}</Section>}
      {screen === 'kit' && (
        <div className={(styles.kit ?? '')}>
          <Section title={text('amounts')}>{balanceCard}<Delta value={0.1254} /></Section>
          <Section title={text('controls')}><div className={(styles.kitControls ?? '')}>
            <Button variant="primary" disabled>{t('generic.send')}</Button><Button disabled>{t('generic.receiveWithoutCoinCode')}</Button><Button variant="ghost" disabled>{t('generic.buySell')}</Button>
            {(['success', 'warning', 'danger'] as const).map((tone, index) => <Badge tone={tone} key={tone}>{t(`transaction.status.${['complete', 'pending', 'failed'][index] ?? 'complete'}`, { context: 'receive' })}</Badge>)}
            {['btc', 'eth', 'ltc'].map(code => <Chip selected={coin === code} onClick={() => setCoin(code)} key={code} leading={<CoinIcon coinCode={code as 'btc'} size={20} />}>{code.toUpperCase()}</Chip>)}
            <SearchField value={query} onChange={setQuery} placeholder={text('searchAccounts')} variant="field" />
          </div></Section>
          {activity}{sidebar}
          <Section title={text('loading')}><SkeletonRows count={3} /></Section>
        </div>
      )}
      {detail && screen !== 'transaction' && <Section title={t('transaction.details.title')} action={<IconButton icon="close" label={t('generic.close')} onClick={() => setDetail(false)} />}>{details}</Section>}
    </div>
  </PrototypeContext.Provider>);
};
