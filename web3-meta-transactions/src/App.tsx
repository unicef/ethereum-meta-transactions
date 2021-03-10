import './App.css';
import React, {useContext, useState} from 'react'
import {MetaTx} from "./components/MetaTx";
import {Wallet} from "@ethersproject/wallet"
import useEthSWR from "ether-swr";
import {useWeb3React} from "@web3-react/core";
import {Contract} from "@ethersproject/contracts";
import {additionContract, setAContract} from "./utils";
import {ExecuteMetaTx} from "./components/ExecuteMetaTx";

require("dotenv").config();



export const GetA = () => {
    const [res, setRes] = useState("");
    const {library} = useWeb3React();
    const wallet = new Wallet(process.env.REACT_APP_rinkeby_key as string,library)

    // interacting with smart contract using ethers
    const contract = new Contract(setAContract.address,setAContract.abi,wallet);
    console.log(contract);
    // const getA = async (contract: any) => {
    //     const tx = await execute(contract.getA);
    //     console.log(tx);
    //     setRes(tx);
    //     console.log(tx);
    // };
    // React.useEffect(() => {
    //     getA(contract);
    // }, [contract]);


    // works only when metamask is activated (injected connector)
    //  const { data: res, error} = useEthSWR(
    //      [additionContract.address, 'doAddition',1,2]
    //  )
    //  if(error){
    //      console.log(error);
    //      return <div>problem</div>
    //  }
    // if (res){
    return (
        <ExecuteMetaTx method={contract.getA} result={setRes}>
            <div>A: {res.toString()} </div>
        </ExecuteMetaTx>
    )
    // }
    // return <></>
}
export const App = () => {
    return (
        <MetaTx contracts={[additionContract, setAContract]}>
            <GetA/>
        </MetaTx>
    )
}
