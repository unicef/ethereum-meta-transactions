import React, {useContext} from "react";
import MetaTxContext from "../context/MetaTxContext";
import {execute, verifierContract} from "../utils";
import {useWeb3React} from "@web3-react/core";
import {Contract} from "ethers";

export const ExecuteMetaTx = (props: any) => {
    const {library} = useWeb3React();
    const {wallet} = useContext(MetaTxContext);
    const executeTx = async () => {
        const signer = library.getSigner();
        if (signer){
            const contractInterface = new Contract(props.contract.address,props.contract.abi);
            const verifier = new Contract(verifierContract.address,verifierContract.abi,wallet);
            const tx = await execute(verifier, signer, wallet, contractInterface, props.method, props.params);
            props.result(tx);
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
