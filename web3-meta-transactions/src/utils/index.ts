import AdditionContract from "../abi/Addition.json"
import SetAContract from "../abi/SetA.json"
import VerifierContract from "../abi/Verifier.json"
import VerifierV2Contract from "../abi/VerifierV2.json"
import {BigNumber} from "ethers";
import {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {verifyMessage, Wallet} from "@ethersproject/wallet";
import {Signer, Verify} from "crypto";
import {Contract} from "@ethersproject/contracts";
import {arrayify, defaultAbiCoder, keccak256, solidityKeccak256, splitSignature, toUtf8Bytes} from "ethers/lib/utils";
import {Web3Provider} from "@ethersproject/providers";

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

export const verifierV2Contract = {
  address: "0x72fE3417C1be91b06CEFDF10cF7cFc54f494ABFf",
  abi: VerifierV2Contract.abi
}

export const execute = async (account: string, library: Web3Provider, wallet: Wallet, functionToExecute: any, paramsToPass: any=null) => {
  const signer = library.getSigner();
  if (signer) {
    // let signature;
    let someHash = keccak256(toUtf8Bytes(""))
    if (paramsToPass) {
      someHash = keccak256(paramsToPass);
    }
    let payload = defaultAbiCoder.encode([ "bytes32" ], [ someHash ]);
    console.log("Payload:", payload);

    let payloadHash = keccak256(payload);
    console.log("PayloadHash:", payloadHash);
    let signature = await signer.signMessage(arrayify(payloadHash));
    let sig = splitSignature(signature);
    const recoveredAccount = verifyMessage(arrayify(payloadHash), sig);
    console.log("test");
    console.log("recovered account", recoveredAccount);
    console.log("signer account", account);
    // const contract = new Contract(verifierV2Contract.address,verifierV2Contract.abi,wallet);
    // const recoverAddr = await contract.recoverAddr(someHash,sig.v,sig.r,sig.s);
    // console.log("test 2");
    // console.log(recoverAddr)
    if (recoveredAccount === account)
      return "correctly signed"
    // if (isSigned){
    //   const tx = await functionToExecute(paramsToPass);
    //   console.log(tx);
    //   if (BigNumber.isBigNumber(tx)) {
    //     return tx.toString();
    //   }
    //   else return tx;
    // }
    return "not correctly signed"
  }
  return "no account";
};

