import React, {Children, useState} from 'react'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import ERC20ABI from '../abi/ERC20.abi.json'
import { shorter, TOKENS_BY_NETWORK } from '../utils'
import {EthSWRConfig} from 'ether-swr'
import {EthBalance} from "./EthBalance";
import {injectedConnector, networkConnector} from "../connectors";



export const ABIs = (chainId: number) => {
  const matrix = TOKENS_BY_NETWORK[chainId]
  return Object.entries(
      matrix.reduce((memo, item) => {
        return { ...memo, [item.address]: ERC20ABI }
      }, {})
  )
}

export const Wallet = (props: any) => {
  const { connector, chainId, account, library, activate, active} = useWeb3React<
      Web3Provider
      >();
    const [balance, setBalance] = useState(0);
  const onClick = () => {
    activate(injectedConnector, (error => activate(networkConnector)));
  };

  React.useEffect(() => {
     if (active) {
         console.log(connector);
     }
  }, [active, connector]);

  React.useEffect(() => {
      if (balance && balance<=0){
          activate(networkConnector);
      }
  }, [balance])
  return (
      <div>
        <div>ChainId: {chainId}</div>
        <div>Account: {shorter(account)}</div>
        {active ? (
            <span role="img" aria-label="active">
          ✅{' '}
        </span>
        ) : (
            <button type="button" onClick={onClick}>
              Connect
            </button>
        )}
        {active && chainId && (
            <EthSWRConfig
                value={{ web3Provider: library, ABIs: new Map(ABIs(chainId)) }}
            >{ connector === injectedConnector && (
                <EthBalance balance={setBalance}/>
            )
            }
                {/* This where the business related components will be added. The call of the contract will be eventually done
                    depending on the connector (if network, the process of meta transactions will be called)
                */}
            <div>{props.children}</div>

            </EthSWRConfig>
        )}

      </div>
  )
}
