/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { TransactionPayload } from 'aptos/dist/generated';
import { useWallet } from '@manahippo/aptos-wallet-adapter';
import { aptosClient, faucetClient } from '../config/aptosClient';
import { AptosAccount } from 'aptos';

const MainPage = () => {
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txLinks, setTxLinks] = useState<string[]>([]);
  const { connect, disconnect, account, wallets, signAndSubmitTransaction } = useWallet();

  useEffect(() => {
    if ((account?.address?.toString() || account?.publicKey?.toString()) && loading) {
      setLoading(false);
    }
  }, [account, loading]);

  const renderWalletConnectorGroup = () => {
    return wallets.map((wallet) => {
      const option = wallet.adapter;
      return (
        <Button
          onClick={() => {
            setLoading(true);
            connect(option.name);
          }}
          id={option.name.split(' ').join('_')}
          key={option.name}
          className="connect-btn">
          {option.name}
        </Button>
      );
    });
  };

  const transferToken = async () => {
    setTxLoading(true);
    if (account?.address || account?.publicKey) {
      const addressKey = account?.address?.toString() || account?.publicKey?.toString() || '';
      const demoAccount = new AptosAccount();
      await faucetClient.fundAccount(demoAccount.address(), 0);
      const txFunction = {
        module: {
          address: '0x1',
          name: 'coin'
        },
        name: 'transfer'
      };
      const payload: TransactionPayload = {
        type: 'script_function_payload',
        function: txFunction,
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: [demoAccount.address().hex(), '717']
      };
      const txnRequest = await aptosClient.generateTransaction(addressKey, payload);
      const transactionRes = await signAndSubmitTransaction(txnRequest.payload);
      await aptosClient.waitForTransaction(transactionRes?.hash || '');
      const links = [...txLinks, `https://explorer.devnet.aptos.dev/txn/${transactionRes?.hash}`];
      setTxLinks(links);
    }
    setTxLoading(false);
  };

  const renderTxLinks = () => {
    return txLinks.map((link: string, index: number) => (
      <div className="flex gap-2 transaction" key={link}>
        <p>{index + 1}.</p>
        <a href={link} target="_blank" rel="noreferrer" className="underline">
          {link}
        </a>
      </div>
    ));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Spin
          // className="mt-6"
          indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
        />
      );
    }
    if (account) {
      return (
        <div className="flex flex-col gap-2">
          <strong>
            Address: <div id="address">{account?.address?.toString()}</div>
          </strong>
          <strong>
            Public Key: <div id="publicKey">{account?.publicKey?.toString()}</div>
          </strong>
          <strong>
            AuthKey: <div id="authKey">{account?.authKey?.toString()}</div>
          </strong>
          <Button id="transferBtn" onClick={() => transferToken()} loading={txLoading}>
            Transfer Token
          </Button>
          <Button
            id="disconnectBtn"
            onClick={() => {
              setTxLinks([]);
              disconnect();
            }}>
            Disconnect
          </Button>
          <div className="mt-4">
            <h4>Transaction History:</h4>
            <div className="flex flex-col gap-2">{renderTxLinks()}</div>
          </div>
        </div>
      );
    } else {
      return <div className="flex flex-col gap-4">{renderWalletConnectorGroup()}</div>;
    }
  };
  return (
    <div className="w-full h-[100vh] flex justify-center items-center">
      <div className="flex justify-center">{renderContent()}</div>
    </div>
  );
};

export default MainPage;
