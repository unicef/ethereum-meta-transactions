import {Web3Provider} from "@ethersproject/providers";
import {Web3ReactProvider} from "@web3-react/core";
import {Wallet} from "./Wallet";
import React from "react";

function getLibrary(provider: any): Web3Provider {
    const library = new Web3Provider(provider)
    library.pollingInterval = 12000
    return library
}

export const MetaTx = (props: any) => {
    return (
        <Web3ReactProvider getLibrary={getLibrary}>
            <Wallet contracts={props.contracts}>
                {props.children}
            </Wallet>
        </Web3ReactProvider>
    )
}
