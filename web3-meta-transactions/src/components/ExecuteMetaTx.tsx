import React, {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {execute} from "../utils";
import {useWeb3React} from "@web3-react/core";
import {Wallet} from "@ethersproject/wallet";

export const ExecuteMetaTx = (props: any) => {
    const {library} = useWeb3React();
    const wallet = new Wallet(process.env.REACT_APP_rinkeby_key as string,library)
    const {signingAccount} = useContext(MetaTxContext);
    console.log("signingAccount")
    console.log(signingAccount);
    const getA = async () => {
        const tx = await execute(signingAccount, wallet, props.method, props.params);
        console.log(tx);
        props.result(tx);
        console.log(tx);
    };
    React.useEffect(() => {
        getA();
    },[]);
    return props.children
}
