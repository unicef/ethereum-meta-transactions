import React, {useState} from 'react'
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

export const Wallet = () => {
  const { chainId, account, library, activate, active } = useWeb3React<
      Web3Provider
      >();
    const [balance, setBalance] = useState(0);
    const [buttonClicked, setButtonClicked] = useState(false);
  const onClick = () => {
    activate(injectedConnector);
    setButtonClicked(true);
  };
  console.log(balance);
  if(balance<0){
      return (
          <div>

          </div>
      )
  }
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
            >
              <EthBalance balance={setBalance}/>
                {balance<=0 && (
                    <div>No balance</div> // where to call the meta transaction component
                )
                }
            </EthSWRConfig>
        )}
        {!active && buttonClicked && (
            <div>No injected connector</div> // where to call the meta transaction component
        )
        }
      </div>
  )
}
