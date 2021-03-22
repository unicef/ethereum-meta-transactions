import {Web3Provider} from "@ethersproject/providers";
import {Web3ReactProvider} from "@web3-react/core";
import {MyWallet} from "./MyWallet";
import React from "react";

function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider)
    library.pollingInterval = 12000
    return library
}

export const MetaTx = (props: any) => {
    return (
        <Web3ReactProvider getLibrary={getLibrary}>
            <MyWallet privateKey={props.privateKey} provider={props.provider} contracts={props.contracts}>
                {props.children}
            </MyWallet>
        </Web3ReactProvider>
    )
}
