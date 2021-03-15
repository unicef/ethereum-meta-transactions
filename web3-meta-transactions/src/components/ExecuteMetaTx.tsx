import React, {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {execute} from "../utils";
import {useWeb3React} from "@web3-react/core";
import {Wallet} from "@ethersproject/wallet";
import {InfuraProvider} from "@ethersproject/providers";
import {Contract} from "@ethersproject/contracts";

export const ExecuteMetaTx = (props: any) => {
    const {library, account} = useWeb3React();
    // interacting with smart contract using ethers
    const provider = new  InfuraProvider("rinkeby", process.env.REACT_APP_RPC_API_KEY_4 as string)
    console.log("provider", provider);
    const wallet = new Wallet(process.env.REACT_APP_rinkeby_key as string, provider)
    console.log("wallet", wallet);
    const contract = new Contract(props.contract.address, props.contract.abi, wallet);
    // const {signingAccount} = useContext(MetaTxContext);
    // console.log("signingAccount")
    // console.log(signingAccount);
    const executeTx = async () => {
        if (account){
            const tx = await execute(account, library, wallet, contract[props.method], props.params);
            console.log(tx);
            props.result(tx);
            console.log(tx);
        }
    };
    React.useEffect(() => {
        executeTx();
    },[]);
    return (props.children
        ? props.children
        : <></>
    )
}
