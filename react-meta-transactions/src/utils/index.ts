import AdditionContract from "../abi/Addition.json"
import SetAContract from "../abi/SetA.json"
import VerifierContract from "../abi/Verifier.json"
import VerifierV2Contract from "../abi/VerifierV2.json"
import {BigNumber, Signer, utils} from "ethers";
import {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {verifyMessage, Wallet} from "@ethersproject/wallet";
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
  address: "0xd416Daf08d9F50B5274864F572b551Ef8076868C",
  abi: VerifierContract.abi
}

export const verifierV2Contract = {
  address: "0x1b4DCdA8839767D9fa69DdE8b809B002695ec047",
  abi: VerifierV2Contract.abi
}

export const execute = async (signer: Signer, wallet: Wallet,contract: any, method: string, params: any[]) => {
  const contractInterface = new utils.Interface(contract.abi);
  const data = contractInterface.encodeFunctionData(method,params);
  console.log("data", data);
  const account = await signer.getAddress();
    const verifier = new Contract(verifierContract.address,verifierContract.abi,wallet);
    const nonce = await verifier.nonce(account);
    const parts = [
      verifierContract.address,
      account,
      contract.address,
      0,
      data,
      nonce
    ];
    let payloadHash = solidityKeccak256([ "address", "address", "address", "uint", "bytes", "uint"], parts);
    console.log("PayloadHash:", payloadHash);
    const hashFromContract = await verifier.getHash(account, contract.address, 0, data);
    console.log("hashFromContract", hashFromContract)
    const signature = await signer.signMessage(arrayify(payloadHash));
    console.log("signature", signature);
    // const sig = splitSignature(signature);
    // console.log("signature", sig);
    // const recoveredAccount = verifyMessage(arrayify(payloadHash), sig);
    // console.log("test");
    // console.log("recovered account", recoveredAccount);
    // console.log("signer account", account);
    const tx = await verifier.forward(signature, account, contract.address, 0, data, {gasLimit: 120000, gasPrice: Math.round(4 * 1000000000)});
    if (tx){
      return tx
    }
    return "problem";
    // const recoveredAccount = verifyMessage(arrayify(payloadHash), sig);
    // console.log("test");
    // console.log("recovered account", recoveredAccount);
    // console.log("signer account", account);
    // const recoverAddr = await contract.recoverAddr(someHash,sig.v,sig.r,sig.s);
    // console.log("test 2");
    // console.log("recovered address with contract", recoverAddr)
    // const isSigned = await contract.isSigned(account,someHash,sig.v,sig.r,sig.s);
    // if (isSigned){
    //   const tx = await functionToExecute(paramsToPass);
    //   console.log(tx);
    //   if (BigNumber.isBigNumber(tx)) {
    //     return tx.toString();
    //   }
    //   else return tx;
    // }
};

