import React, {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {execute} from "../utils";
import {useWeb3React} from "@web3-react/core";
import {Wallet} from "@ethersproject/wallet";
import {InfuraProvider} from "@ethersproject/providers";

export const ExecuteMetaTx = (props: any) => {
    const {library, account} = useWeb3React();
    const provider = new  InfuraProvider("rinkeby", process.env.REACT_APP_rinkeby_key as string)
    const wallet = new Wallet(process.env.REACT_APP_rinkeby_key as string,provider)
    // const {signingAccount} = useContext(MetaTxContext);
    // console.log("signingAccount")
    // console.log(signingAccount);
    const getA = async () => {
        if (account){
            const tx = await execute(account, library, wallet, props.method, props.params);
            console.log(tx);
            props.result(tx);
            console.log(tx);
        }
    };
    React.useEffect(() => {
        getA();
    },[]);
    return props.children
}
