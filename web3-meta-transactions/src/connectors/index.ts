import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import {Networks} from "../utils";
require("dotenv").config();

const RPC_URLS: { [chainId: number]: string } = {
  4: process.env.REACT_APP_RPC_URL_4 as string,
  7545: process.env.REACT_APP_RPC_GANACHE as string
}

export const networkConnector = new NetworkConnector({
  urls: { 4: RPC_URLS[4], 7545:RPC_URLS[7545] },
  defaultChainId: 7545
})

export const injectedConnector = new InjectedConnector({
  supportedChainIds: [
    Networks.MainNet, // Mainet
    Networks.Ropsten, // Ropsten
    Networks.Rinkeby, // Rinkeby
    Networks.Goerli, // Goerli
    Networks.Kovan, // Kovan
  ],
})
