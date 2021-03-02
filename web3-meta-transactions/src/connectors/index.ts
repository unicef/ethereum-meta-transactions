import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import {Networks} from "../utils";

const RPC_URLS: { [chainId: number]: string } = {
  //4: process.env.RPC_URL_4 as string
  4: "https://rinkeby.infura.io/v3/21473c0e8fc64bf689416d8dd8af4626"
}

export const networkConnector = new NetworkConnector({
  urls: { 4: RPC_URLS[4] },
  defaultChainId: 4
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
