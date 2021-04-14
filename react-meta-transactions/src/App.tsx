import './App.css';
import React, {useContext, useEffect, useState} from 'react'
import {MetaTx} from "./components/MetaTx";
import {Wallet} from "@ethersproject/wallet"
import useEthSWR from "ether-swr";
import {useWeb3React} from "@web3-react/core";
import {Contract} from "@ethersproject/contracts";
import {additionContract, setAContract, verifierContract} from "./utils";
import {ExecuteMetaTx} from "./components/ExecuteMetaTx";
import {TransactionResponse} from "@ethersproject/providers";

require("dotenv").config();



export const GetA = () => {
    const [res, setRes] = useState("");
    const {library} = useWeb3React();
    // const [clicked, setClicked] = useState(false);
    const activate = async () =>{
        const getAContract = new Contract(setAContract.address,setAContract.abi, library);
        console.log(getAContract.getA());
        const value = await getAContract.getA();
        setRes(value.toString());
        //setClicked(true);
    }
    return (
        <div>
            <button onClick={activate}> Get A </button>
            {/*{(clicked &&*/}
            {/*    <ExecuteMetaTx contract={setAContract} method={"getA"} result={setRes}>*/}
                    <div>A: {res} </div>
                {/*</ExecuteMetaTx>)}*/}
        </div>
    )
    // }
    // return <></>
}

export const SetA = () => {
    const [res, setRes] = useState(null);
    const [input, setInput] = useState(-1);
    const [txDone, setTxDone] = useState(false);
    const [clicked, setClicked] = useState(false);
    const activate = () =>{
        setClicked(true);
    }

    const handleChange = (event: any) => {
        console.log(event.target.value)
        setInput(+event.target.value)
    }

    const waitTx = async () => {
        // @ts-ignore
        await res.wait();
        setTxDone(true);
    }

    React.useEffect(() => {
        console.log("txDone", txDone);
        if(res && clicked){
            console.log("res Tx", res);
            waitTx();
        }
    },[res, clicked]);
    return (
        <div>
            <input type="number" onChange={handleChange}/>
            <button onClick={activate}> Set A </button>
            {(clicked &&
                <ExecuteMetaTx contract={setAContract} params={[input]} method={"setA"} result={setRes}/>)}
            {(txDone &&
                <div>Transaction successfully executed</div>)}
        </div>
    )
    // }
    // return <></>
}

export const App = () => {
    return (
        <MetaTx privateKey={process.env.REACT_APP_rinkeby_key as string} provider={process.env.REACT_APP_RPC_URL_4 as string} contracts={[additionContract, setAContract]}>
            <GetA/>
            <SetA/>
        </MetaTx>
    )
}
