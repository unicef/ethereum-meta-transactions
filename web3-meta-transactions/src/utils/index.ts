import AdditionContract from "../abi/Addition.json"
import SetAContract from "../abi/SetA.json"
import VerifierContract from "../abi/Verifier.json"
import {BigNumber} from "ethers";
import {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {verifyMessage, Wallet} from "@ethersproject/wallet";
import {Signer, Verify} from "crypto";
import {Contract} from "@ethersproject/contracts";
import {arrayify, keccak256, solidityKeccak256, toUtf8Bytes} from "ethers/lib/utils";

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
export const additionContract = {
  address: "0x9e72c3472Ad3C227F72F68be491541EFe75664Be",
  abi: AdditionContract.abi
}

export const verifierContract = {
  address: "0xd157E3560c1f6421d328c967e2A93514EEC9c958",
  abi: VerifierContract.abi
}


export const execute = async (account: any, wallet: Wallet, functionToExecute: any, paramsToPass: any=null) => {
  if (account) {
    let signature;
    const signer = new Wallet(account);
    console.log(functionToExecute)
    let msgHash = solidityKeccak256 (
        ['string'],
        [""]);
    if (paramsToPass){
      msgHash = solidityKeccak256 (
          ['string'],
          paramsToPass.toString());
    }
    const msgHash_binary = arrayify(msgHash);
    signature = await signer.signMessage(msgHash_binary);
    const recoveredAccount = verifyMessage(msgHash_binary, signature);
    console.log("test");
    console.log(recoveredAccount);
    console.log(signature);
    const contract = new Contract(verifierContract.address,verifierContract.abi,wallet);
    const isSigned = await contract.isSigned(account,msgHash,signature);
    console.log(isSigned)
    if (isSigned){
      const tx = await functionToExecute(paramsToPass);
      console.log(tx);
      if (BigNumber.isBigNumber(tx)) {
        return tx.toString();
      }
      else return tx;
    }
    return "not correctly signed"
  }
  return "no account";
};

