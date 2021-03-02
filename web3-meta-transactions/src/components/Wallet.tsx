import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import ERC20ABI from '../abi/ERC20.abi.json'
import { Networks, shorter, TOKENS_BY_NETWORK } from '../utils'
import {EthSWRConfig} from 'ether-swr'
import { InjectedConnector } from '@web3-react/injected-connector'
import {EthBalance} from "./EthBalance";

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    Networks.MainNet, // Mainet
    Networks.Ropsten, // Ropsten
    Networks.Rinkeby, // Rinkeby
    Networks.Goerli, // Goerli
    Networks.Kovan, // Kovan
  ],
})

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
      >()

  const onClick = () => {
    activate(injectedConnector)
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
              <EthBalance />
            </EthSWRConfig>
        )}
      </div>
  )
}
