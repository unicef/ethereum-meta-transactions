import SetAContract from "../abi/SetA.json"
import VerifierContract from "../abi/Verifier.json"
import {Signer} from "ethers";
import {Wallet} from "@ethersproject/wallet";
import {Contract} from "ethers";
import {arrayify, solidityKeccak256} from "ethers/lib/utils";

export const Networks = {
  MainNet: 1,
  Ropsten: 3,
  Rinkeby: 4,
  Goerli: 5,
  Kovan: 42,
}

export interface IERC20 {
  symbol: string
  address: string
  decimals: number
  name: string
}

export const TOKENS_BY_NETWORK: {
  [key: number]: IERC20[]
} = {
  [Networks.MainNet]: [
    {
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      name: 'Maker',
      symbol: 'MKR',
      decimals: 18
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18
    }
  ],
  [Networks.Rinkeby]: [
    {
      address: '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa',
      symbol: 'DAI',
      name: 'Dai',
      decimals: 18
    }
  ]
}
export const shorter = (str: string | null | undefined) =>
    str && str.length > 8 ? str.slice(0, 6) + '...' + str.slice(-4) : str

export const setAContract = {
  address: "0x8a0dA59972F9E80d84B9add4EBF08Ec9c759F3b2",
  abi: SetAContract.abi
}

export const verifierContract = {
  address: "0xd416Daf08d9F50B5274864F572b551Ef8076868C",
  abi: VerifierContract.abi
}


export const execute = async (verifier: Contract, signer: Signer, wallet: Wallet, contract: Contract, method: string, params: any[]) => {
  const data = contract.interface.encodeFunctionData(method,params);
  const account = await signer.getAddress();
  const nonce = await verifier.nonce(account);
  const parts = [
    verifier.address,
    account,
    contract.address,
    0,
    data,
    nonce
  ];
  let payloadHash = solidityKeccak256([ "address", "address", "address", "uint", "bytes", "uint"], parts);
  const signature = await signer.signMessage(arrayify(payloadHash));
  const tx = await verifier.forward(signature, account, contract.address, 0, data, {gasLimit: 1200000, gasPrice: Math.round(4 * 1000000000)});
  if (tx){
    return tx
  }
  return "problem";
};

