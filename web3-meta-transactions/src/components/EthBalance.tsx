import {useWeb3React} from "@web3-react/core";
import {Web3Provider} from "@ethersproject/providers";
import React from "react";
import {formatEther} from "@ethersproject/units";
import useEthSWR from "ether-swr/esm/useEthSWR";

export const EthBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance, mutate } = useEthSWR(
      ['getBalance', account, 'latest'],
      {
        subscribe: [
          {
            name: 'block',
            on: (event: any) => {
              console.log('block', { event })
              // on every block we check if Ether balance has changed by re-fetching
              mutate(undefined, true)
            }
          }
        ]
      }
  )

  if (!balance) {
    return <div>...</div>
  }
  return <div>{parseFloat(formatEther(balance)).toPrecision(4)} Ξ</div>
}
