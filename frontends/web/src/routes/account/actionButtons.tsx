// SPDX-License-Identifier: Apache-2.0

import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowFloorDownWhite, ArrowFloorUpWhite, Coins, WalletConnectLight } from '@/components/icon';
import { useMediaQuery } from '@/hooks/mediaquery';
import { AccountCode, TAccount, CoinCode } from '@/api/account';
import { isEthereumBased } from '@/utils/coin';
import { AccountActionButtonLink } from './components/account-action-button-link';
import { AccountActionButtons } from './components/account-action-buttons';
import { DesignLayout } from '@/components/desktop-design/design-layout';
import { FirmwareUpgradeRequiredDialog } from '@/components/dialog/firmware-upgrade-required-dialog';
import { useFeatureConnect } from '@/hooks/keystore';
import { useDesktopDesign } from '@/hooks/desktop-design';
import { useDesktopModernized } from '@/components/desktop-chrome/desktop-chrome';
import { Icon } from '@/components/desktop-design/calm-cards/kit/icon';
import style from './account.module.css';

type TProps = {
  canSend?: boolean;
  code: AccountCode;
  coinCode: CoinCode;
  exchangeSupported?: boolean;
  account: TAccount;
  accountDataLoaded: boolean;
};

export const ActionButtons = ({ canSend, code, coinCode, exchangeSupported, account, accountDataLoaded }: TProps) => {
  const { t } = useTranslation();
  const { design } = useDesktopDesign();
  const calmCards = useDesktopModernized() && design.template === 'calmCards';
  const navigate = useNavigate();
  const {
    connect,
    dismissFirmwareUpgrade,
    firmwareUpgradeRequired,
  } = useFeatureConnect();
  const walletConnectEnabled = isEthereumBased(account.coinCode) && !account.isToken;
  const isLargeTablet = useMediaQuery('(max-width: 830px)');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // When clicking 'Send', first prompt to connect the keystore and check that it supports signing.
  // For Ethereum based accounts, we also need to know which keystore (which BitBox02 version) is
  // connected to decide which ETH transaction proposals to construct (legacy vs EIP1559).
  const sendLink = `/account/${code}/send`;
  const routeSend = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const requiredFeature = (
      isEthereumBased(coinCode)
        ? 'ethTransactionSigning'
        : 'btcTransactionSigning'
    );
    if (await connect(account.keystore.rootFingerprint, requiredFeature, code)) {
      // Proceed to the send screen if the keystore was connected.
      navigate(sendLink);
    }
  };

  const canClickSend = canSend && accountDataLoaded;

  return (
    <AccountActionButtons withWalletConnect={walletConnectEnabled}>
      <DesignLayout id="accountActions" items={[
        { id: 'sendAction', content: <AccountActionButtonLink
          disabled={!canClickSend}
          to={sendLink}
          onClick={routeSend}
        >
          {calmCards ? <Icon name="send" /> : <ArrowFloorUpWhite width={16} height={16} />}
          <span>{t('generic.send')}</span>
        </AccountActionButtonLink> },

        { id: 'receiveAction', content: <AccountActionButtonLink
          disabled={!accountDataLoaded}
          to={`/account/${code}/receive`}
        >
          {calmCards ? <Icon name="receive" /> : <ArrowFloorDownWhite width={16} height={16} />}
          <span data-testid="receive-button">{t('generic.receiveWithoutCoinCode')}</span>
        </AccountActionButtonLink> },

        { id: 'buyAction', content: (exchangeSupported && !isMobile) && (
          <AccountActionButtonLink
            disabled={!accountDataLoaded}
            to={`/market/select/${code}`}
          >
            {calmCards ? <Icon name="buy" /> : <Coins width={17} height={17} />}
            <span>{t('generic.buySell')}</span>
          </AccountActionButtonLink>
        ) },

        { id: 'walletConnectAction', content: walletConnectEnabled && (
          <AccountActionButtonLink
            disabled={!accountDataLoaded}
            to={`/account/${code}/wallet-connect/dashboard`}
          >
            {calmCards ? <Icon name="wallet" /> : <WalletConnectLight className={style.iconWalletConnect}/>}
            {' '}
            {!isLargeTablet && (
              <span>Wallet Connect</span>
            )}
          </AccountActionButtonLink>
        ) },
      ]} />
      {firmwareUpgradeRequired && (
        <FirmwareUpgradeRequiredDialog
          open
          onClose={dismissFirmwareUpgrade}
        />
      )}
    </AccountActionButtons>
  );
};
